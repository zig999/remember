/**
 * useGraphViewStore — graph view state (pinned positions, expansion set,
 * selection, panel collapse) persisted to sessionStorage.
 *
 * Spec references:
 *  - front.md §4.3 (client state catalog)
 *  - front.md §7 (graph viz — React Flow + d3-force, existing nodes pinned)
 *  - front.back.md §2 (Store shape + storage key `remember.graph`)
 *
 * Persistence is sessionStorage on purpose: pinned positions are a working-
 * session concern, not a global preference. Cleared on tab close.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** A React Flow node position. */
export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphViewState {
  /** UUID → pinned position (React Flow coordinates). */
  pinnedPositions: Record<string, NodePosition>;
  /** Node ids that have been expanded via `traverse` this session. */
  expansionSet: string[];
  /** Currently selected node id (or null). */
  selection: string | null;
  /** Whether the side panel is collapsed. */
  panelCollapsed: boolean;
  /** Persisted schema version (BR-09 envelope convention). */
  version: 1;

  /* ---- actions ---- */
  pin: (nodeId: string, pos: NodePosition) => void;
  unpin: (nodeId: string) => void;
  setExpanded: (nodeId: string, expanded: boolean) => void;
  setSelection: (nodeId: string | null) => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  /** Reset everything except `version` — used on theme switch / sign-out. */
  reset: () => void;
}

/** Storage key — front.back.md §2. */
export const GRAPH_STORAGE_KEY = "remember.graph";

const INITIAL: Pick<
  GraphViewState,
  "pinnedPositions" | "expansionSet" | "selection" | "panelCollapsed" | "version"
> = {
  pinnedPositions: {},
  expansionSet: [],
  selection: null,
  panelCollapsed: false,
  version: 1,
};

export const useGraphViewStore = create<GraphViewState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      pin: (nodeId, pos) =>
        set({ pinnedPositions: { ...get().pinnedPositions, [nodeId]: pos } }),
      unpin: (nodeId) => {
        const next = { ...get().pinnedPositions };
        delete next[nodeId];
        set({ pinnedPositions: next });
      },
      setExpanded: (nodeId, expanded) => {
        const current = get().expansionSet;
        const has = current.includes(nodeId);
        if (expanded && !has) set({ expansionSet: [...current, nodeId] });
        else if (!expanded && has)
          set({ expansionSet: current.filter((id) => id !== nodeId) });
      },
      setSelection: (nodeId) => set({ selection: nodeId }),
      setPanelCollapsed: (collapsed) => set({ panelCollapsed: collapsed }),
      reset: () => set({ ...INITIAL }),
    }),
    {
      name: GRAPH_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      partialize: (state) => ({
        pinnedPositions: state.pinnedPositions,
        expansionSet: state.expansionSet,
        selection: state.selection,
        panelCollapsed: state.panelCollapsed,
        version: state.version,
      }),
    },
  ),
);
