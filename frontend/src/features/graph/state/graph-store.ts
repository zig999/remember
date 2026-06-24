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

/** Layout algorithm selector (TC-02). The same three runners share one
 *  signature — `useForceLayout` dispatches by this discriminator. New
 *  algorithms join this union and the dispatcher case statement together. */
export type GraphLayoutAlgorithm = "force" | "tree" | "radial";

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
  /** IDs of nodes the USER has repositioned via drag (TC-FE drag). A node
   *  in this set keeps its `positions` entry as a permanent pin: the force
   *  layout already pins any node that has a position (AC-F.12), so this set
   *  is the explicit record of *user intent* — distinct from a coordinate
   *  the force field merely computed. Used to (a) let a future "reorganizar"
   *  reset auto-placed nodes only, and (b) drop the pin on remove/clear. */
  userPinned: Set<string>;
  /** Monotonic counter bumped by `resetLayout` (TC-FE drag, Phase 2). It is a
   *  dependency of the `useForceLayout` effect: bumping it forces ONE force
   *  pass that IGNORES the pin set, re-flowing every node into a fresh layout
   *  (the "Reorganizar" affordance). Distinct from a delta-driven run, which
   *  honours pins. Reset to 0 by `clear()`. */
  layoutNonce: number;
  /** Active layout algorithm (TC-02). Defaults to `'force'` so legacy
   *  behaviour is preserved. Switching via `setLayoutAlgorithm` selects the
   *  runner used by `useForceLayout` AND bumps `layoutNonce` so the new
   *  algorithm runs immediately, ignoring user pins (the user just asked
   *  for a different layout — preserving stale pins would defeat that). */
  layoutAlgorithm: GraphLayoutAlgorithm;

  /** Merge a delta into the store. Re-affirmed ids update in place; only
   *  new ids enter `revealQueue`. Sets `receivedDeltaThisTurn = true`
   *  whenever it runs — even if every id was already known, the fact
   *  that a graph tool produced output is what I-7 cares about. */
  addNodes: (delta: GraphDelta) => void;
  /** Replace the whole visible graph with a single delta — the
   *  non-cumulative counterpart to `addNodes`. Used for the FIRST
   *  `graph_delta` of a chat response so each response shows ONLY its own
   *  graph: clears the prior response's nodes/links/positions/pins and
   *  enqueues every node in the delta for a fresh 1-by-1 reveal. Links whose
   *  endpoints are not among THIS delta's own nodes are dropped (no orphan
   *  strokes). Leaves `status` untouched so the in-flight `"loading"` set on
   *  `tool_start` flows into the reveal. Sets `receivedDeltaThisTurn = true`;
   *  later deltas in the SAME response use `addNodes` to compose onto it. */
  replaceNodes: (delta: GraphDelta) => void;
  /** Remove a set of node ids and any link whose `source` or `target`
   *  references one of them (orphan cleanup). The positions entry and
   *  revealed-ids membership for the removed nodes are dropped too. */
  removeNodes: (ids: readonly string[]) => void;
  /** User drag-and-drop commit (TC-FE drag). Pins one node at the given
   *  canvas coordinate and records it in `userPinned`. Writes a fresh
   *  `positions` Map so the `useForceLayout` / `GraphCanvas` subscribers
   *  re-render (Zustand strict-equality). Does NOT re-run the force pass —
   *  that effect is keyed on `nodes`/`links`, not `positions` — so a drag is
   *  a pure position override; the next delta's force run reads this coord
   *  from the pin set and snaps the node back to it (AC-F.12). No-op if the
   *  node id is not currently in the graph. */
  setNodePosition: (id: string, position: GraphPosition) => void;
  /** "Reorganizar" (TC-FE drag, Phase 2). Discards all user pins and forces a
   *  fresh force-layout pass that re-flows every node from scratch. Clears
   *  `userPinned` and bumps `layoutNonce` (the force effect re-runs ignoring
   *  pins). Positions are NOT cleared here — the reset pass overwrites them in
   *  place, so the nodes glide from their current spots to the new layout with
   *  no `{0,0}` flash. No-op-safe on an empty graph (the force effect early
   *  returns). */
  resetLayout: () => void;
  /** Switch to a different layout algorithm (TC-02). Sets
   *  `layoutAlgorithm = algo` AND bumps `layoutNonce` — the
   *  `useForceLayout` effect re-runs with the new runner and ignores the
   *  pin set so the fresh layout is unobstructed (same semantics as
   *  `resetLayout`, but also changes the algorithm). No-op if `algo`
   *  equals the current algorithm — avoids a needless layout pass. */
  setLayoutAlgorithm: (algo: GraphLayoutAlgorithm) => void;
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

  // ---- Graph view persistence (BR-42) ---------------------------------------

  /** Snapshot shape written to / read from the BFF persistence endpoint.
   *  Bumped to `version: 2` in TC-02 to carry `layoutAlgorithm`. `hydrate`
   *  also accepts `version: 1` (legacy) — see its docstring. */
  getSnapshot: () => GraphSnapshotV2;

  /**
   * Restore a saved snapshot (BR-42). Sets nodes/links/positions/userPinned
   * from the saved data and makes all nodes immediately visible — NO 1-by-1
   * reveal animation (snapshot = "ultima versão apresentada", shown instantly).
   *
   * Backward compatibility (TC-02):
   *  - `version: 1` snapshots are accepted unchanged; `layoutAlgorithm`
   *    defaults to `'force'` so a graph saved before TC-02 hydrates with
   *    the previous behaviour.
   *  - `version: 2` snapshots restore the stored `layoutAlgorithm` too.
   *  - Any other version value is treated like v1 + default algorithm — we
   *    never throw on hydrate, since a corrupt snapshot must not block the
   *    chat UI.
   */
  hydrate: (snapshot: GraphSnapshotV1 | GraphSnapshotV2) => void;
}

/** Legacy snapshot shape — what `getSnapshot` returned before TC-02. Still
 *  accepted by `hydrate` so users with a server-side v1 snapshot continue to
 *  see their saved graph after deploying TC-02. */
export interface GraphSnapshotV1 {
  version: 1;
  nodes: GraphNodeData[];
  links: GraphLinkData[];
  positions: Record<string, { x: number; y: number }>;
  user_pinned: string[];
}

/** v2 snapshot — adds `layout_algorithm`. snake_case on the wire to match
 *  the existing `user_pinned` convention. */
export interface GraphSnapshotV2 {
  version: 2;
  nodes: GraphNodeData[];
  links: GraphLinkData[];
  positions: Record<string, { x: number; y: number }>;
  user_pinned: string[];
  layout_algorithm: GraphLayoutAlgorithm;
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
  | "userPinned"
  | "layoutNonce"
  | "layoutAlgorithm"
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
    userPinned: new Set<string>(),
    layoutNonce: 0,
    layoutAlgorithm: "force",
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

  replaceNodes: (delta) => {
    // Non-cumulative reset: each chat response starts from a blank canvas so
    // the graph reflects ONLY that response's result. Mirrors `addNodes`'
    // merge but from an empty base, dropping the prior response's
    // positions/pins/reveal state. Links whose endpoints are not among THIS
    // delta's nodes are dropped — no orphan stroke into empty space.
    set(() => {
      const nextNodes = new Map<string, GraphNodeData>();
      const nextLinks = new Map<string, GraphLinkData>();
      const revealQueue: string[] = [];

      for (const node of delta.nodes) {
        nextNodes.set(node.id, node);
        revealQueue.push(node.id);
      }
      for (const link of delta.links) {
        if (nextNodes.has(link.source) && nextNodes.has(link.target)) {
          nextLinks.set(link.id, link);
        }
      }

      return {
        nodes: nextNodes,
        links: nextLinks,
        positions: new Map<string, GraphPosition>(),
        userPinned: new Set<string>(),
        revealedIds: new Set<string>(),
        revealQueue,
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
      const nextUserPinned = new Set(state.userPinned);

      for (const id of idSet) {
        nextNodes.delete(id);
        nextPositions.delete(id);
        nextRevealedIds.delete(id);
        nextUserPinned.delete(id);
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
        userPinned: nextUserPinned,
      };
    });
  },

  setNodePosition: (id, position) => {
    set((state) => {
      // Ignore a commit for a node that is not in the graph (a stale drag
      // event arriving after a `removeNodes`/`clear`). Writing it would
      // resurrect an orphan position the force pass never reconciles.
      if (!state.nodes.has(id)) return {};
      const nextPositions = new Map(state.positions);
      nextPositions.set(id, position);
      const nextUserPinned = new Set(state.userPinned);
      nextUserPinned.add(id);
      return { positions: nextPositions, userPinned: nextUserPinned };
    });
  },

  resetLayout: () => {
    set((state) => ({
      userPinned: new Set<string>(),
      layoutNonce: state.layoutNonce + 1,
    }));
  },

  setLayoutAlgorithm: (algo) => {
    set((state) => {
      // No-op when the user picks the algorithm already active — avoids a
      // pointless layout re-run and a spurious `layoutNonce` bump (which
      // would otherwise also tag a save in `useGraphPersistence`).
      if (state.layoutAlgorithm === algo) return {};
      return {
        layoutAlgorithm: algo,
        // Discard pins too — the user just asked for a fresh layout under a
        // different algorithm, and preserving pins from the prior algorithm
        // would partially override the new shape (e.g. tree pins sitting in
        // the middle of a radial wheel).
        userPinned: new Set<string>(),
        layoutNonce: state.layoutNonce + 1,
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

  // ---- Graph view persistence (BR-42) ---------------------------------------

  getSnapshot: () => {
    const { nodes, links, positions, userPinned, layoutAlgorithm } = get();
    const posObj: Record<string, { x: number; y: number }> = {};
    for (const [id, pos] of positions) {
      posObj[id] = { x: pos.x, y: pos.y };
    }
    // TC-02 bumps the snapshot to v2 — the new `layout_algorithm` field is
    // additive. The PUT endpoint accepts the new shape; the BFF persists it
    // verbatim and returns it on the next GET.
    return {
      version: 2 as const,
      nodes: Array.from(nodes.values()),
      links: Array.from(links.values()),
      positions: posObj,
      user_pinned: Array.from(userPinned),
      layout_algorithm: layoutAlgorithm,
    };
  },

  hydrate: (snapshot) => {
    // Restore is instant — all nodes appear immediately (no 1-by-1 reveal).
    // snapshot is a "last presented version" memento: exactly what the user
    // last saw, including positions and pins.
    const nextNodes = new Map<string, GraphNodeData>();
    const nextLinks = new Map<string, GraphLinkData>();
    const nextPositions = new Map<string, GraphPosition>();
    const allNodeIds: string[] = [];

    for (const node of snapshot.nodes) {
      nextNodes.set(node.id, node);
      allNodeIds.push(node.id);
    }
    for (const link of snapshot.links) {
      nextLinks.set(link.id, link);
    }
    for (const [id, pos] of Object.entries(snapshot.positions)) {
      nextPositions.set(id, { x: pos.x, y: pos.y });
    }

    // v1 → default to 'force' (previous behaviour). v2 → restore the
    // stored algorithm. The `in` check is the safe discriminator because
    // v1 lacks the property entirely.
    const layoutAlgorithm: GraphLayoutAlgorithm =
      snapshot.version === 2 && "layout_algorithm" in snapshot
        ? snapshot.layout_algorithm
        : "force";

    set({
      nodes: nextNodes,
      links: nextLinks,
      positions: nextPositions,
      userPinned: new Set<string>(snapshot.user_pinned),
      // All nodes are already "revealed" — no animation queue.
      revealedIds: new Set<string>(allNodeIds),
      revealQueue: [],
      status: "ready",
      receivedDeltaThisTurn: false,
      errorMessage: undefined,
      layoutAlgorithm,
    });
  },
}));
