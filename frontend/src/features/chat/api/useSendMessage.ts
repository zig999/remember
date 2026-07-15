/**
 * useSendMessage — turn orchestrator hook.
 *
 * Spec references:
 *  - docs/specs/front/features/chat.feature.spec.md §"Data Layer Notes"
 *    ("Coordinates: (1) optimistic user bubble insert into local state,
 *    (2) SSE open via `chat-stream.ts`, (3) streaming state updates
 *    (text accumulation, ToolCallChip inserts), (4) done/error terminal
 *    handling, (5) post-turn query invalidation").
 *  - docs/specs/front/features/chat.feature.spec.md §3 transition table —
 *    "success → user submits Composer → streaming: optimistic user bubble;
 *    POST sendMessage SSE; generate Idempotency-Key via crypto.randomUUID()".
 *  - docs/specs/domains/chat/openapi.yaml `sendMessage` — header
 *    `Idempotency-Key` is REQUIRED (UUID); request body is `{ content,
 *    model? }`.
 *
 * Responsibilities:
 *  1. Generate a one-shot `Idempotency-Key` (crypto.randomUUID()).
 *  2. Optimistically push a user-role bubble into the TanStack Query cache
 *     for `conversationKeys.messages(id)` so the UI sees the question
 *     immediately (BR-29: the BFF also persists it before the SSE opens, so
 *     the optimistic insert matches reality).
 *  3. Create an `AbortController` and stash it in `useChatTurnStore` so the
 *     stop button (rendered in a different subtree) can call `abort()`.
 *  4. Open the SSE via `streamChat()` and route each frame to the store:
 *       - `llm_start`        → `setChatStatus("thinking")` (TC-FE-04).
 *       - `text_delta`       → `appendText(delta)` + `setChatStatus("streaming")`.
 *       - `tool_start`       → `addToolChip({ tool, argsSummary, ok: null })` +
 *                              `setChatStatus("tool_running")`; if the tool is
 *                              a GRAPH tool, also flip `useGraphStore` status
 *                              to `"loading"` (TC-FE-04, plan §7.3).
 *       - `tool_result`      → `updateLastToolChip(ok)` + `setChatStatus`
 *                              back to `"streaming"` (LLM resumed).
 *       - `graph_delta`      → map wire → `GraphDelta` and push it into
 *                              `useGraphStore.addNodes()` (TC-FE-04, REQ-3/4/5).
 *       - `done` / `error`   → terminal: settle the graph pane via
 *                              `useGraphStore.settleTurn(frame.type)` (I-7),
 *                              set `chatStatus` to `"idle"` / `"error"`,
 *                              invalidate messages + usage, then the caller
 *                              (MessageStream) flushes the store.
 *  5. Read the JWT from `useAuthStore.getState()` at SEND TIME (not via the
 *     hook — non-reactive), per the spec's "auth token via
 *     `useAuthStore.getState().accessToken`" rule.
 *
 * What this hook does NOT do:
 *  - It does not render the streaming bubble (that is MessageStream, TC-08).
 *  - It does not call `cancelTurn` — the stop handler does that via
 *    `useCancelTurn` after calling `abort()` on the controller it pulled
 *    from `useChatTurnStore`.
 *  - It does not reset `useChatTurnStore` on the terminal frame — the
 *    component owning the bubble flushes the accumulator into its own
 *    rendered list AFTER the invalidation refetches the persisted row
 *    (avoids a flicker between "stream done" and "persisted message
 *    arrives"). The hook DOES clear `isStreaming` and the controller on
 *    terminal so the stop button disappears immediately.
 */

import { useCallback, useRef } from "react";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { getEnv } from "@/lib/env";
import { useAuthStore } from "@/state/auth";
import {
  mapWireToGraphDelta,
  useGraphStore,
} from "@/features/graph";
import type {
  ChatContentBlock,
  ChatMessage,
  ChatMessageRole,
} from "../types";
import {
  streamChat,
  type ChatSSEFrame,
} from "./chat-stream";
import { conversationKeys } from "./keys";
import { useChatTurnStore, type ChatStatus } from "../state/chat-turn";

export interface SendMessageVariables {
  /** Target conversation id. */
  readonly conversationId: string;
  /** User content (plain text — wire wraps it into a single text block). */
  readonly content: string;
  /** Optional explicit model override. */
  readonly model?: string;
}

export interface SendMessageResult {
  /** Terminal stop_reason from the `done` frame, or null on `error`. */
  readonly stopReason: string | null;
  /** Code from the `error` frame, or null on `done`. */
  readonly errorCode: string | null;
  /** Message from the `error` frame, or null on `done`. */
  readonly errorMessage: string | null;
  /** The idempotency UUID used for this attempt (echoed for telemetry). */
  readonly idempotencyKey: string;
}

/**
 * Build the optimistic user message inserted into the messages cache before
 * the SSE opens. Shape must match `ChatMessage` so consumers don't need a
 * separate type for optimistic vs persisted rows. `id` is prefixed
 * `optimistic-` so a defensive merge can spot ghosts after the
 * invalidation refetch.
 */
function buildOptimisticUserMessage(args: {
  conversationId: string;
  content: string;
  idempotencyKey: string;
}): ChatMessage {
  const block: ChatContentBlock = { type: "text", text: args.content };
  const role: ChatMessageRole = "user";
  return {
    id: `optimistic-${args.idempotencyKey}`,
    conversation_id: args.conversationId,
    role,
    content: [block],
    stop_reason: null,
    idempotency_key: args.idempotencyKey,
    model: null,
    tokens_in: null,
    tokens_out: null,
    latency_ms: null,
    createdAt: new Date(),
  };
}

/**
 * The messages cache shape mirrors `useListMessages` — a `MessageListResult`
 * with an `items` array. We append to `items` without touching the cursor
 * because the optimistic row sits at the tail (most recent).
 */
interface MessagesCachePage {
  readonly items: ReadonlyArray<ChatMessage>;
  readonly nextCursor: string | null;
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function newIdempotencyKey(): string {
  // `crypto.randomUUID()` is available in modern browsers and Node 19+.
  // Vite targets ES2022 / modern browsers, so no fallback is needed
  // (spec §"Data Layer Notes" mandates `crypto.randomUUID()` verbatim).
  return crypto.randomUUID();
}

export function useSendMessage(): UseMutationResult<
  SendMessageResult,
  Error,
  SendMessageVariables
> {
  const queryClient = useQueryClient();

  // Stable refs to the store actions so the mutation function is referentially
  // stable (avoids re-creating the mutation on every render).
  const setAbortController = useChatTurnStore((s) => s.setAbortController);
  const setIdempotencyKey = useChatTurnStore((s) => s.setIdempotencyKey);
  const setStreaming = useChatTurnStore((s) => s.setStreaming);
  const appendText = useChatTurnStore((s) => s.appendText);
  const addToolChip = useChatTurnStore((s) => s.addToolChip);
  const updateLastToolChip = useChatTurnStore((s) => s.updateLastToolChip);
  const resetTurn = useChatTurnStore((s) => s.reset);
  const setChatStatus = useChatTurnStore((s) => s.setChatStatus);

  // Cache the bag of actions in a ref so the mutationFn closure doesn't have
  // to depend on them (useMutation re-creates the fn on prop changes; with
  // primitive refs the closure stays stable).
  const actionsRef = useRef({
    setAbortController,
    setIdempotencyKey,
    setStreaming,
    appendText,
    addToolChip,
    updateLastToolChip,
    resetTurn,
    setChatStatus,
  });
  actionsRef.current = {
    setAbortController,
    setIdempotencyKey,
    setStreaming,
    appendText,
    addToolChip,
    updateLastToolChip,
    resetTurn,
    setChatStatus,
  };

  const mutationFn = useCallback(
    async (vars: SendMessageVariables): Promise<SendMessageResult> => {
      const actions = actionsRef.current;
      const idempotencyKey = newIdempotencyKey();
      const controller = new AbortController();

      // Turn lifecycle — store transitions (steps 1 + 3 of the spec list).
      actions.resetTurn();
      actions.setIdempotencyKey(idempotencyKey);
      actions.setAbortController(controller);
      actions.setStreaming(true);

      // Step 2 — optimistic user bubble.
      const optimistic = buildOptimisticUserMessage({
        conversationId: vars.conversationId,
        content: vars.content,
        idempotencyKey,
      });
      const messagesKey = conversationKeys.messages(vars.conversationId);
      queryClient.setQueryData<MessagesCachePage | undefined>(
        messagesKey,
        (prev) => {
          if (prev === undefined) {
            return { items: [optimistic], nextCursor: null };
          }
          return { ...prev, items: [...prev.items, optimistic] };
        },
      );

      // Step 4 — open SSE.
      const { VITE_BFF_URL } = getEnv();
      const url = joinUrl(
        VITE_BFF_URL,
        `/api/v1/conversations/${encodeURIComponent(vars.conversationId)}/messages`,
      );
      const token = useAuthStore.getState().accessToken;
      const headers: Record<string, string> = {
        "Idempotency-Key": idempotencyKey,
      };
      if (token !== null) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const body: { content: string; model?: string } = {
        content: vars.content,
      };
      if (vars.model !== undefined) body.model = vars.model;

      let stopReason: string | null = null;
      let errorCode: string | null = null;
      let errorMessage: string | null = null;
      // Turn-scoped: has THIS response already reset the graph pane? The first
      // graph result of a response REPLACES the prior response's graph
      // (non-cumulative — owner decision 2026-06-22); later graph results in
      // the SAME response compose onto it via `addNodes`. This lives in the
      // turn closure because it is per-response state the stateless, per-frame
      // `dispatchFrame` cannot hold.
      let graphReplacedThisTurn = false;

      try {
        const stream = streamChat(url, body, {
          headers,
          signal: controller.signal,
        });
        for await (const frame of stream) {
          if (frame.type === "graph_delta") {
            // Non-cumulative dispatch (see `graphReplacedThisTurn` above).
            // Within a response, re-affirmation still consolidates and only
            // newly-seen ids enter the reveal queue (addNodes/replaceNodes).
            const delta = mapWireToGraphDelta(frame);
            // A 0-node result (empty search, or every node filtered as
            // merged/deleted) is NOT "a new graph": leave the current graph
            // untouched (UC-CG-05) and do NOT consume the response's one-shot
            // replace — a later non-empty result this response still replaces.
            if (delta.nodes.length > 0) {
              const gs = useGraphStore.getState();
              if (graphReplacedThisTurn) {
                gs.addNodes(delta);
              } else {
                gs.replaceNodes(delta);
                graphReplacedThisTurn = true;
              }
            }
            continue;
          }
          dispatchFrame(frame, actions);
          if (frame.type === "done") {
            stopReason = frame.stop_reason;
          } else if (frame.type === "error") {
            errorCode = frame.code;
            errorMessage = frame.message;
          }
        }
      } finally {
        // Terminal cleanup — the stop button + streaming pill must disappear
        // even if the generator threw. Note: the accumulators (streamingText,
        // toolChips) are NOT cleared here; the bubble renderer flushes them
        // after the invalidation refetches the persisted row.
        actions.setStreaming(false);
        actions.setAbortController(null);
      }

      // Step 5 — post-turn invalidation (both messages + usage).
      void queryClient.invalidateQueries({ queryKey: messagesKey });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.usage(vars.conversationId),
      });

      return {
        stopReason,
        errorCode,
        errorMessage,
        idempotencyKey,
      };
    },
    [queryClient],
  );

  return useMutation({ mutationFn });
}

/* ---------- internal: graph-tool catalog ---------- */

/**
 * The closed set of graph-producing chat tools (chat tool catalog, plan §3.3 /
 * `tool-catalog.ts`).
 *
 * Match must be exact (no prefix/substring) — the backend forwards the
 * registered tool slug verbatim on `tool_start.tool` and `graph_delta.sourceTool`.
 *
 * Both READ tools (`traverse`, `get_node`, `list_nodes`, `search`) and the
 * write-bearing `ingest_directed` produce `graph_delta` frames; both must flip
 * the right-pane status to `loading` on `tool_start`. See
 * `chat.feature.spec.md` v1.5.0 §2 UI-12 / §9 Scenario 6 / §11 UC-CG-14.
 *
 * Why this lives here and not in `features/graph/lib/map.ts`:
 *   The graph feature must remain UNAWARE of the chat dispatcher (REQ-6
 *   unidirectionality). The dispatcher is the only place that needs to ask
 *   "is the current tool one that will emit a `graph_delta`?" — keeping the
 *   helper here keeps the import direction chat → graph only.
 */
const GRAPH_TOOLS: ReadonlySet<string> = new Set<string>([
  "traverse",
  "get_node",
  "list_nodes",
  "search",
  "ingest_directed",
]);

function isGraphTool(toolName: string): boolean {
  return GRAPH_TOOLS.has(toolName);
}

/* ---------- internal: frame dispatcher ---------- */

interface TurnActions {
  readonly appendText: (delta: string) => void;
  readonly addToolChip: (chip: {
    tool: string;
    argsSummary: string;
    ok: boolean | null;
  }) => void;
  readonly updateLastToolChip: (ok: boolean) => void;
  readonly setChatStatus: (next: ChatStatus) => void;
}

function dispatchFrame(frame: ChatSSEFrame, actions: TurnActions): void {
  switch (frame.type) {
    case "llm_start":
      // The visual iteration marker lives in MessageStream (TC-08); here we
      // only flip the derived chat phase so the indicator (TC-FE-09) can
      // show "pensando…" until the first text/tool frame arrives.
      actions.setChatStatus("thinking");
      return;
    case "text_delta":
      actions.appendText(frame.delta);
      // `streaming` is idempotent — repeated text_delta frames stay in the
      // same phase. We always set it explicitly so that a `text_delta` that
      // arrives BEFORE `llm_start` (defensive: server may emit them
      // out-of-order on retry) still produces a coherent chatStatus.
      actions.setChatStatus("streaming");
      return;
    case "tool_start":
      actions.addToolChip({
        tool: frame.tool,
        argsSummary: frame.argsSummary,
        ok: null,
      });
      actions.setChatStatus("tool_running");
      // Only graph-producing tools flip the right-pane status. A non-graph
      // tool (e.g. `list_node_types`, `get_history_*`) leaves
      // `useGraphStore.status` untouched — AC-F.8 + AC-F.21 (I-7).
      if (isGraphTool(frame.tool)) {
        useGraphStore.getState().setStatus("loading");
      }
      return;
    case "tool_result":
      actions.updateLastToolChip(frame.ok);
      // The LLM resumes generating text after a tool returns; transitioning
      // back to `streaming` covers the gap before the next `text_delta`.
      actions.setChatStatus("streaming");
      return;
    case "graph_delta":
      // Handled in the stream loop (mutationFn), NOT here: the non-cumulative
      // replace-vs-add decision needs turn-scoped state ("has THIS response
      // already reset the graph?"), and dispatchFrame is stateless/per-frame.
      // The loop intercepts graph_delta before calling dispatchFrame, so this
      // case is a documented no-op.
      return;
    case "done":
      // I-7 — only flips status to `ready` if a graph delta actually landed
      // this turn; a chat-only `done` leaves the pane untouched.
      useGraphStore.getState().settleTurn("done");
      // chatStatus → idle (terminal success). Accumulators stay populated
      // for the bubble to flush after the invalidation refetch.
      actions.setChatStatus("idle");
      return;
    case "error":
      // I-7 — only paints the graph pane red if a graph tool was in flight
      // (status === "loading" | "revealing"); otherwise the existing
      // subgraph (or empty state) is preserved.
      useGraphStore.getState().settleTurn("error");
      // chatStatus → error (sticky banner). The next `reset()` on the next
      // send clears it back to `idle` — see plan §12.2.
      actions.setChatStatus("error");
      return;
  }
}
