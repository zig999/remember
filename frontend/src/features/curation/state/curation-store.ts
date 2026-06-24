/**
 * useCurationStore — Zustand v5 client state for /curation (TC-04).
 *
 * Source of truth for view-state that is NOT a server cache:
 *   - `selectedItem`     — id of the queue item currently in the DecisionPanel
 *   - `evidenceViewed`   — whether the curator has scrolled/focused the
 *     ProvenanceTrail of the current item (UI-02 → UI-03 gate)
 *   - `sessionResolved`  — counter of decisions completed THIS session;
 *     resets when the page unmounts (not persisted)
 *   - `lastSeenTotal`    — last total of the review queue observed by the
 *     polling pill; feed by `updateLastSeen(total)` whenever the queue
 *     resolves; drives the "N novos" pill (UI-01)
 *   - `selectedItems`    — Set of ids checked in QueueList for batch mode
 *     (TC-06 will read this; TC-04 wires it for future use)
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §2 UI-01/UI-02/UI-03
 *  - docs/specs/front/_flows/curadoria.flow.md §2 Sub-flow A steps 5-9,
 *    §6 "Data persisted"
 *
 * Why Zustand (and not React Context):
 *  - Selection / evidenceViewed are SHARED across CurationPage, DecisionPanel
 *    and EvidencePanel — sibling subtrees of the route component. A Context
 *    would force a single ancestor provider that re-renders everything every
 *    time the counter changes. A Zustand store lets each panel subscribe to
 *    exactly the slice it needs.
 *  - Mirrors the same pattern used by `useGraphStore` (features/graph/state)
 *    and `useChatTurnStore` (features/chat). Conformance > taste.
 *
 * Re-affirmation principle: this store NEVER holds derived state (e.g.
 * "is this item destructive?"). Derived booleans live in selectors / the
 * components themselves so a single source of truth is impossible to
 * desync from the raw inputs.
 */
import { create } from "zustand";

/**
 * Composite identifier of a queue item — the URL deep-link encodes it as
 * `?item=<kind>:<id>`. `kind` is the queue family (entity_match or
 * disputed) and `id` is `node_id` (entity_match) or the synthetic dispute
 * key the backend returns (disputed). The store holds the pair so panels
 * downstream can route purely from this without re-parsing the URL.
 */
export type SelectedItemKind = "entity_match" | "disputed";

export interface SelectedItem {
  readonly kind: SelectedItemKind;
  readonly id: string;
}

export interface CurationState {
  /** Currently active item in the DecisionPanel. `null` = UI-01 (idle). */
  selectedItem: SelectedItem | null;

  /** Did the curator look at the evidence yet? Gate for arming the
   *  DecisionBar (UI-02 → UI-03). Reset to `false` whenever `selectedItem`
   *  changes (every item starts with evidenceViewed=false). */
  evidenceViewed: boolean;

  /** Number of items decided in the current page session. Persists across
   *  refetches but resets when the page unmounts. Surfaced in the rodapé
   *  of the DecisionPanel as "N resolvidos · M restantes · …" (UI-03). */
  sessionResolved: number;

  /** Last `listReviewQueue.total` we saw resolve. Compared against the
   *  next resolve to compute the polling pill delta ("N novos"). `null`
   *  before the first resolve so the pill never flashes on mount. */
  lastSeenTotal: number | null;

  /** Set of queue item ids checked for batch mode. TC-04 wires it; the
   *  BatchBar (TC-06) is the consumer. Stored as a Set for O(1) toggle. */
  selectedItems: ReadonlySet<string>;

  /** Set the active item (deep-link, click, keyboard nav). Resets
   *  `evidenceViewed` to false because every new item must re-prove its
   *  evidence. `null` returns to UI-01. */
  setSelectedItem: (item: SelectedItem | null) => void;

  /** Mark the evidence as viewed (ProvenanceTrail scrolled or focused —
   *  UI-02 → UI-03). Idempotent: re-calling with `true` is a no-op. */
  setEvidenceViewed: (viewed: boolean) => void;

  /** Bump the session-resolved counter by 1. Called on POST 200 of any
   *  curation action (UI-06). */
  incrementResolved: () => void;

  /** Update `lastSeenTotal` to the latest queue total. Called from the
   *  CurationPage queue-resolve effect — AFTER the pill has been read
   *  for the current render, so the next polling tick computes the
   *  delta against the value the user just saw. */
  updateLastSeen: (total: number) => void;

  /** Replace the batch-selection set. The caller computes the new set
   *  (toggle / clear / select-all); the store just stores it. Idempotent
   *  on reference equality at the consumer level. */
  setSelectedItems: (items: ReadonlySet<string>) => void;

  /** Reset every field to the initial state. Called on route unmount so
   *  the next visit starts clean (the page is single-owner — no
   *  cross-session memory beyond `lastSeenTotal`, which is server-truth
   *  on first poll anyway). */
  reset: () => void;
}

function makeInitialState(): Pick<
  CurationState,
  | "selectedItem"
  | "evidenceViewed"
  | "sessionResolved"
  | "lastSeenTotal"
  | "selectedItems"
> {
  return {
    selectedItem: null,
    evidenceViewed: false,
    sessionResolved: 0,
    lastSeenTotal: null,
    selectedItems: new Set<string>(),
  };
}

export const useCurationStore = create<CurationState>((set) => ({
  ...makeInitialState(),

  setSelectedItem: (item) => {
    // Re-selecting the same item is a no-op (avoids spurious resets of
    // evidenceViewed). Comparing by kind+id, not by reference — the URL
    // search routine creates a fresh object every render.
    set((state) => {
      const same =
        state.selectedItem !== null &&
        item !== null &&
        state.selectedItem.kind === item.kind &&
        state.selectedItem.id === item.id;
      if (same) return {};
      return { selectedItem: item, evidenceViewed: false };
    });
  },

  setEvidenceViewed: (viewed) => {
    set((state) => {
      if (state.evidenceViewed === viewed) return {};
      return { evidenceViewed: viewed };
    });
  },

  incrementResolved: () => {
    set((state) => ({ sessionResolved: state.sessionResolved + 1 }));
  },

  updateLastSeen: (total) => {
    set((state) => {
      if (state.lastSeenTotal === total) return {};
      return { lastSeenTotal: total };
    });
  },

  setSelectedItems: (items) => {
    set({ selectedItems: items });
  },

  reset: () => {
    set(makeInitialState());
  },
}));

/**
 * Parse a `?item=<kind>:<id>` URL search param into a `SelectedItem`.
 * Returns `null` if the string is malformed or the kind is unknown — the
 * page falls through to first-item auto-select (Sub-flow A step 5).
 *
 * Exported separately from the store so the router validateSearch can
 * reuse the same parse and the QA tests can pin the regex to one place.
 */
export function parseItemSearchParam(raw: unknown): SelectedItem | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const colon = raw.indexOf(":");
  if (colon < 1 || colon >= raw.length - 1) return null;
  const kind = raw.slice(0, colon);
  const id = raw.slice(colon + 1);
  if (kind !== "entity_match" && kind !== "disputed") return null;
  return { kind, id };
}

/**
 * Stringify a `SelectedItem` into the URL search param form. Inverse of
 * `parseItemSearchParam`. Returns `undefined` when `item === null` so
 * callers can spread the result into a `to` search object without
 * polluting the URL with empty values.
 */
export function stringifyItemSearchParam(
  item: SelectedItem | null,
): string | undefined {
  if (item === null) return undefined;
  return `${item.kind}:${item.id}`;
}
