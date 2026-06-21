/**
 * useChatTurnStore — ephemeral per-turn streaming state.
 *
 * Spec references:
 *  - docs/specs/front/front.md §4.3 (client state catalog) —
 *    "Ephemeral per-turn state: accumulated streaming text, in-flight
 *    ToolCallChip list, AbortController reference, current Idempotency-Key
 *    — reset on conversation switch or turn completion". Persistence:
 *    "none (session only)".
 *  - docs/specs/front/features/chat.feature.spec.md §"Data Layer Notes" —
 *    "Zustand slice `useChatTurnStore` holds ephemeral turn state (streaming
 *    text, in-flight chips) — never persisted."
 *
 * Why NOT TanStack Query:
 *  - Streaming accumulators (token-by-token text, chips arriving live) are
 *    not server snapshots — they are intermediate UI state that has no cache
 *    semantics. Putting them in Query would either thrash the cache on every
 *    delta or require manual `setQueryData` calls that subvert Query's role.
 *
 * Why NOT persisted:
 *  - A reload mid-turn invalidates the in-flight `AbortController` and the
 *    server's view of the active turn. Persisting a stale chip list would
 *    show ghost UI on next mount. See front.md §4.3 ("session only").
 */

import { create } from "zustand";
import type { ToolCallData } from "../types";

/**
 * `chatStatus` — fine-grained derived state of the chat pane (TC-FE-04).
 *
 * Drives the `ChatStatusIndicator` waiting hint (REQ-2) — the indicator UI is
 * delivered by TC-FE-09; this slice only owns the state machine.
 *
 * Transitions (plan §12.2):
 *
 *   idle ──user sends──▶ idle ──llm_start──▶ thinking
 *                              ──text_delta──▶ streaming ──done──▶ idle
 *                              ──tool_start──▶ tool_running
 *                                ──tool_result──▶ streaming
 *   (any) ──error frame──▶ error ──(new send/reset)──▶ idle
 *   (any) ──Stop/abort──▶ idle (caller resets the store)
 *
 * Why a sticky `error` (rather than `error → idle`):
 *   The plan diagram pins `error` until the next user action — the UI uses
 *   it to surface a discreet error banner. The TC validation criterion
 *   shorthand `"done/error → idle"` is read as "done → idle; error → error
 *   (cleared on next send via `reset()`)" — this matches §12.2 and avoids
 *   the banner vanishing instantly. Documented in delivery spec_divergences.
 */
export type ChatStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "tool_running"
  | "error";

export interface ChatTurnState {
  /** Accumulated assistant text from `text_delta` frames. */
  streamingText: string;
  /** Tool-call chips accumulated from `tool_start` / `tool_result` frames. */
  toolChips: ReadonlyArray<ToolCallData>;
  /**
   * AbortController owning the in-flight `fetch` for the current SSE turn.
   * Held here so the stop button can call `abort()` from a different
   * component subtree than the orchestrator hook that created it.
   */
  abortController: AbortController | null;
  /**
   * Idempotency-Key (UUID) generated once per send attempt; kept so the
   * caller can detect a retry of the same logical turn.
   */
  idempotencyKey: string | null;
  /** True while the SSE stream is open (`fetch` opened, no terminal frame yet). */
  isStreaming: boolean;
  /**
   * Fine-grained chat phase derived from the SSE lifecycle (TC-FE-04).
   * `idle` is the resting state; the dispatcher transitions on every
   * incoming frame (see `ChatStatus` for the full state machine).
   */
  chatStatus: ChatStatus;

  /** Clear all turn state — called on conversation switch and on terminal frame. */
  reset: () => void;
  /** Stash the AbortController created by `useSendMessage`. */
  setAbortController: (ac: AbortController | null) => void;
  /** Append a `text_delta` chunk to `streamingText`. */
  appendText: (delta: string) => void;
  /** Stash the per-send-attempt idempotency UUID. */
  setIdempotencyKey: (key: string | null) => void;
  /** Mark/clear the streaming flag (orchestrator hook owns the transitions). */
  setStreaming: (next: boolean) => void;
  /** Add a `tool_start` chip with `ok=null` (pending). */
  addToolChip: (chip: ToolCallData) => void;
  /**
   * Settle the last chip with a `tool_result.ok`. The spec invariant
   * (openapi.yaml `sendMessage` §"Frame ordering invariants" #2) guarantees
   * every `tool_start` is followed by exactly one `tool_result`, so the
   * latest pending chip is always the one being settled.
   */
  updateLastToolChip: (ok: boolean) => void;
  /**
   * Set the chat phase (TC-FE-04). Idempotent — calling with the current
   * value is a no-op-equivalent (still a `set()` call but no observable
   * change). The orchestrator hook owns the transitions; the indicator
   * component reads the value via a Zustand selector (TC-FE-09).
   */
  setChatStatus: (next: ChatStatus) => void;
}

const initialState = {
  streamingText: "",
  toolChips: [] as ReadonlyArray<ToolCallData>,
  abortController: null as AbortController | null,
  idempotencyKey: null as string | null,
  isStreaming: false,
  chatStatus: "idle" as ChatStatus,
};

export const useChatTurnStore = create<ChatTurnState>((set) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  setAbortController: (abortController) => set({ abortController }),

  appendText: (delta) =>
    set((state) => ({ streamingText: state.streamingText + delta })),

  setIdempotencyKey: (idempotencyKey) => set({ idempotencyKey }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  addToolChip: (chip) =>
    set((state) => ({ toolChips: [...state.toolChips, chip] })),

  updateLastToolChip: (ok) =>
    set((state) => {
      if (state.toolChips.length === 0) return state;
      const next = state.toolChips.slice();
      const lastIdx = next.length - 1;
      const last = next[lastIdx];
      if (last === undefined) return state;
      next[lastIdx] = { ...last, ok };
      return { toolChips: next };
    }),

  setChatStatus: (chatStatus) => set({ chatStatus }),
}));
