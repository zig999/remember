/**
 * useGraphStore — Zustand v5 store for the GraphSpace subgraph (TC-FE-02).
 *
 * Source of truth for the live subgraph rendered in the right pane: nodes,
 * links, force-layout positions, reveal queue/set, status, and the
 * per-turn "did we get any graph data this turn?" flag (I-7).
 *
 * Spec references:
 *  - temp/chat-graphspace-plan.md Rev. 2026-06-21 §6.4 (state shape +
 *    action contracts), §6.3 (view API split), §6.6 (reveal cadence).
 *  - docs/specs/front/components/GraphSpace.component.spec.md §2
 *    (component contract — GraphSpace consumes nodes/links/status).
 *  - Invariants pinned by this module:
 *    * I-7 — `settleTurn` only flips status when a graph tool was in
 *      flight this turn. `done` without delta → status unchanged; `error`
 *      while status is `empty` (no graph tool in flight) → unchanged.
 *    * D2 — useGraphStore is the **single writer** to the subgraph.
 *      GraphSpace and its subcomponents are read-only sinks (REQ-6).
 *    * Re-affirmation consolidates, never duplicates (project principle):
 *      `addNodes` merges into the existing Maps; only IDs not yet seen by
 *      the reveal pipeline enter `revealQueue`.
 *    * State dependent on the clock is **derived in read, never written**
 *      — the store holds only the raw materials.
 *
 * Why Zustand (not TanStack Query):
 *  - The subgraph is ephemeral UI state driven by the SSE dispatcher; it
 *    has no cache semantics (no fetch key, no staleness). Query would
 *    require manual `setQueryData` plumbing that subverts its role —
 *    same reasoning as `useChatTurnStore` (front.md §4.3).
 *
 * Why a module-level singleton (not React Context):
 *  - The SSE dispatcher in `features/chat/api/useSendMessage.ts` lives
 *    outside the GraphSpace subtree and must call `addNodes` / `setStatus`
 *    / `settleTurn` directly via `useGraphStore.getState()`. A Context
 *    would force the dispatcher to be a child of a provider — same shape
 *    as `useChatTurnStore`.
 */
import { create } from "zustand";
import type {
  GraphDelta,
  GraphLinkData,
  GraphNodeData,
  GraphStatus,
} from "../types";

/** Force-layout position written by `useForceLayout` (TC-FE-05) and read
 *  by the React Flow adapter. Coordinates are in the canvas frame; the
 *  store holds only the raw {x,y} pair — no zoom/pan transform. */
export interface GraphPosition {
  readonly x: number;
  readonly y: number;
}

export interface GraphState {
  /** Live nodes keyed by id — `Map` for O(1) merge/lookup and stable
   *  insertion order (used by tests to assert "id N was added"). */
  nodes: Map<string, GraphNodeData>;
  /** Live links keyed by id — same Map semantics as `nodes`. */
  links: Map<string, GraphLinkData>;
  /** Force-layout positions keyed by node id. Empty until `useForceLayout`
   *  populates it; cleared on `clear()`. */
  positions: Map<string, GraphPosition>;
  /** IDs of nodes added by `addNodes` that the reveal pipeline has NOT
   *  yet animated. Consumed by `useGraphReveal` via `dequeueReveal()`. */
  revealQueue: string[];
  /** IDs already revealed (animated in). Used both to short-circuit the
   *  reveal queue (a re-affirmed id never re-enters) and by adapters that
   *  need to know whether to render a node opaque. */
  revealedIds: Set<string>;
  /** Current GraphStatus — exactly 5 values, no `"idle"` (I-4). The
   *  status owner is the chat dispatcher; it transitions
   *  empty → loading → revealing → ready via `setStatus` and `settleTurn`. */
  status: GraphStatus;
  /** Optional error blurb rendered by `GraphStatusOverlay` when
   *  `status === "error"`. Cleared on every non-error transition.
   *  Declared as `string | undefined` (not `?:`) so reducers can clear
   *  it explicitly under `exactOptionalPropertyTypes: true`. */
  errorMessage: string | undefined;
  /** I-7 flag — set `true` by `addNodes` (any successful delta in the
   *  current turn), reset `false` at turn-start (`clear()` and inside
   *  `settleTurn`). Drives whether `settleTurn("done")` advances status
   *  to `ready` or leaves it alone. */
  receivedDeltaThisTurn: boolean;

  /** Merge a delta into the store. Re-affirmed ids update in place; only
   *  new ids enter `revealQueue`. Sets `receivedDeltaThisTurn = true`
   *  whenever it runs — even if every id was already known, the fact
   *  that a graph tool produced output is what I-7 cares about. */
  addNodes: (delta: GraphDelta) => void;
  /** Remove a set of node ids and any link whose `source` or `target`
   *  references one of them (orphan cleanup). The positions entry and
   *  revealed-ids membership for the removed nodes are dropped too. */
  removeNodes: (ids: readonly string[]) => void;
  /** Reset to empty / `status === "empty"`. Called on conversation
   *  switch — the right pane goes back to `GraphEmptyState`. Also
   *  resets `receivedDeltaThisTurn` (new conversation = new turn). */
  clear: () => void;
  /** Set the status (and optional error blurb). Used by the dispatcher
   *  on `tool_start` (→ `"loading"`) and on intermediate transitions.
   *  Non-`error` transitions clear `errorMessage`. */
  setStatus: (status: GraphStatus, errorMessage?: string) => void;
  /** Pop the head of `revealQueue` and return it; `undefined` when
   *  empty. Caller (`useGraphReveal`) is responsible for adding the id
   *  to `revealedIds` once the entrance animation finishes. */
  dequeueReveal: () => string | undefined;
  /** Terminal SSE frame handler (I-7).
   *
   *  - `"done"`: if `receivedDeltaThisTurn` is `true` → advance to
   *    `"ready"`. Otherwise leave `status` untouched (a chat-only turn
   *    must not flip the graph pane to "ready" when it had no business
   *    in this turn).
   *  - `"error"`: if a graph tool was in flight this turn — i.e. the
   *    current status is `"loading"` or `"revealing"` — set
   *    `status = "error"`. Otherwise leave it untouched (chat-only
   *    failure must not paint the graph pane red).
   *
   *  In either case, the per-turn delta flag is reset for the next turn. */
  settleTurn: (frame: "done" | "error") => void;
}

/** A graph tool was active iff the status reflects an in-flight subgraph
 *  fetch or reveal. `"empty"`, `"ready"`, and `"error"` do not. Centralized
 *  here so `settleTurn` and any future caller share one definition. */
function graphToolInFlight(status: GraphStatus): boolean {
  return status === "loading" || status === "revealing";
}

/** Build the "factory-fresh" state. Returned by `clear()` and on first
 *  `create()`. The Maps/Set are freshly constructed every call so callers
 *  never share aliasing through the initial value. */
function makeInitialState(): Pick<
  GraphState,
  | "nodes"
  | "links"
  | "positions"
  | "revealQueue"
  | "revealedIds"
  | "status"
  | "errorMessage"
  | "receivedDeltaThisTurn"
> {
  return {
    nodes: new Map<string, GraphNodeData>(),
    links: new Map<string, GraphLinkData>(),
    positions: new Map<string, GraphPosition>(),
    revealQueue: [],
    revealedIds: new Set<string>(),
    status: "empty",
    errorMessage: undefined,
    receivedDeltaThisTurn: false,
  };
}

export const useGraphStore = create<GraphState>((set, get) => ({
  ...makeInitialState(),

  addNodes: (delta) => {
    // Re-affirmation consolidates: merge incoming nodes/links over the
    // existing Maps. `Map.set` overwrites, which is exactly the §6.4
    // "merge — existing node data is updated" contract — the wire payload
    // carries the latest canonical_name / status, so we want it to win.
    set((state) => {
      const nextNodes = new Map(state.nodes);
      const nextLinks = new Map(state.links);
      const nextRevealQueue = state.revealQueue.slice();

      for (const node of delta.nodes) {
        // Only ids the reveal pipeline has not seen yet enter the queue.
        // Test both `revealedIds` (already animated) AND `nextNodes`
        // pre-insert (an id added earlier in the SAME delta but not yet
        // animated) — without the pre-insert check we would re-enqueue
        // duplicates within a single delta.
        if (!state.revealedIds.has(node.id) && !nextNodes.has(node.id)) {
          nextRevealQueue.push(node.id);
        }
        nextNodes.set(node.id, node);
      }

      for (const link of delta.links) {
        nextLinks.set(link.id, link);
      }

      return {
        nodes: nextNodes,
        links: nextLinks,
        revealQueue: nextRevealQueue,
        receivedDeltaThisTurn: true,
      };
    });
  },

  removeNodes: (ids) => {
    if (ids.length === 0) return; // no-op short-circuit — avoids a needless re-render

    set((state) => {
      const idSet = new Set(ids);
      const nextNodes = new Map(state.nodes);
      const nextLinks = new Map(state.links);
      const nextPositions = new Map(state.positions);
      const nextRevealedIds = new Set(state.revealedIds);

      for (const id of idSet) {
        nextNodes.delete(id);
        nextPositions.delete(id);
        nextRevealedIds.delete(id);
      }

      // Drop any link whose endpoint was removed — leaving orphan edges
      // would render a phantom stroke into empty space.
      for (const [linkId, link] of state.links) {
        if (idSet.has(link.source) || idSet.has(link.target)) {
          nextLinks.delete(linkId);
        }
      }

      // Drop any queued reveal of a now-removed node — the animation
      // would have nothing to land on.
      const nextRevealQueue = state.revealQueue.filter((id) => !idSet.has(id));

      // Keep the local var for symmetry, even though we only need
      // `nextLinks` to have the deletions applied.
      void nextLinks;

      return {
        nodes: nextNodes,
        links: nextLinks,
        positions: nextPositions,
        revealedIds: nextRevealedIds,
        revealQueue: nextRevealQueue,
      };
    });
  },

  clear: () => {
    set(makeInitialState());
  },

  setStatus: (status, errorMessage) => {
    // Non-error transitions wipe any stale error blurb so a recovered
    // graph never carries the previous failure label.
    set({
      status,
      errorMessage: status === "error" ? errorMessage : undefined,
    });
  },

  dequeueReveal: () => {
    const queue = get().revealQueue;
    if (queue.length === 0) return undefined;

    const [head, ...rest] = queue;
    set({ revealQueue: rest });
    return head;
  },

  settleTurn: (frame) => {
    const { status, receivedDeltaThisTurn } = get();

    if (frame === "done") {
      // I-7: only flip to `ready` if a graph delta actually landed this
      // turn. A chat-only turn ("hi, how are you?") must leave the
      // pane's status untouched — usually `empty`, but if the user
      // already had a populated graph the prior turn we must keep
      // whatever status was set (`ready` typically).
      if (receivedDeltaThisTurn) {
        set({ status: "ready", errorMessage: undefined, receivedDeltaThisTurn: false });
      } else {
        set({ receivedDeltaThisTurn: false });
      }
      return;
    }

    // frame === "error"
    // I-7: only paint the graph pane red if a graph tool was actively
    // running this turn. A pure chat-side failure (e.g. LLM hiccup with
    // no tool calls) must not destroy the existing visible subgraph.
    if (graphToolInFlight(status)) {
      set({ status: "error", receivedDeltaThisTurn: false });
    } else {
      set({ receivedDeltaThisTurn: false });
    }
  },
}));
