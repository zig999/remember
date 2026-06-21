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
  deriveLinkState,
  deriveNodeState,
  mapNodeType,
  useGraphStore,
  type GraphDelta,
  type GraphLinkData,
  type GraphLinkWire,
  type GraphNodeData,
  type GraphNodeWire,
} from "@/features/graph";
import type {
  ChatContentBlock,
  ChatMessage,
  ChatMessageRole,
} from "../types";
import {
  streamChat,
  type ChatSSEFrame,
  type ChatSSEFrameGraphDelta,
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

      try {
        const stream = streamChat(url, body, {
          headers,
          signal: controller.signal,
        });
        for await (const frame of stream) {
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
 * The closed set of READ-ONLY graph-producing query tools (chat tool catalog,
 * plan §3.3 / `tool-catalog.ts`).
 *
 * Match must be exact (no prefix/substring) — the backend forwards the
 * registered tool slug verbatim on `tool_start.tool` and `graph_delta.sourceTool`.
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
]);

function isGraphTool(toolName: string): boolean {
  return GRAPH_TOOLS.has(toolName);
}

/* ---------- internal: wire → GraphDelta mapping ---------- */

/**
 * Map a `graph_delta` SSE frame (wire shape, snake_case) into the surface
 * `GraphDelta` consumed by `useGraphStore.addNodes`.
 *
 * Filter rule (I-2): nodes whose `status` maps to `undefined` (currently
 * `merged` / `deleted`) are dropped — they have no visible representation
 * in the surface store and would render as ghosts. Links anchored on a
 * filtered-out endpoint are dropped too (consistent with the orphan-link
 * cleanup in `useGraphStore.removeNodes`).
 *
 * Pure function — exported for unit testing in isolation from the dispatcher.
 */
export function mapWireToGraphDelta(
  frame: ChatSSEFrameGraphDelta,
): GraphDelta {
  const mappedNodes: GraphNodeData[] = [];
  const visibleIds = new Set<string>();
  for (const wireNode of frame.nodes as readonly GraphNodeWire[]) {
    const state = deriveNodeState(wireNode.status);
    if (state === undefined) {
      // Filtered out (merged / deleted) — do not propagate to the surface
      // store. Re-affirmation of a previously visible id by a `merged`
      // status is intentionally NOT applied here either; the dispatcher
      // would need an explicit `removeNodes` to take such a node down.
      continue;
    }
    const node: GraphNodeData = {
      id: wireNode.id,
      type: mapNodeType(wireNode.node_type),
      label: wireNode.canonical_name,
      state,
    };
    mappedNodes.push(node);
    visibleIds.add(wireNode.id);
  }

  const mappedLinks: GraphLinkData[] = [];
  for (const wireLink of frame.links as readonly GraphLinkWire[]) {
    // Drop links whose endpoints are not in the visible set for THIS delta
    // AND not already in the store. The store dedupes by id on merge, so a
    // link whose endpoints were established by a prior delta still lands;
    // a link whose endpoints would be orphan after the filter is dropped.
    const sourceVisible =
      visibleIds.has(wireLink.source_node_id) ||
      useGraphStore.getState().nodes.has(wireLink.source_node_id);
    const targetVisible =
      visibleIds.has(wireLink.target_node_id) ||
      useGraphStore.getState().nodes.has(wireLink.target_node_id);
    if (!sourceVisible || !targetVisible) continue;

    const link: GraphLinkData = {
      id: wireLink.id,
      source: wireLink.source_node_id,
      target: wireLink.target_node_id,
      label: wireLink.link_type,
      isTemporal: wireLink.is_temporal,
      state: deriveLinkState(wireLink.status, wireLink.flags),
      ...(wireLink.is_in_effect === undefined
        ? {}
        : { inEffect: wireLink.is_in_effect }),
    };
    mappedLinks.push(link);
  }

  return {
    sourceTool: frame.sourceTool,
    nodes: mappedNodes,
    links: mappedLinks,
  };
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
    case "graph_delta": {
      // Map wire payload → surface delta and push into the graph store.
      // The store will merge by id (re-affirmation consolidates, never
      // duplicates — project principle) and enqueue only newly-seen ids
      // for the reveal pipeline (TC-FE-08).
      const delta = mapWireToGraphDelta(frame);
      useGraphStore.getState().addNodes(delta);
      return;
    }
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
