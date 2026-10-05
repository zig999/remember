import { create } from "zustand";

export type SelectedItemKind = "entity_match" | "disputed";

export interface SelectedItem {
  readonly kind: SelectedItemKind;
  readonly id: string;
}

export interface CurationState {
  selectedItem: SelectedItem | null;

  evidenceViewed: boolean;

  sessionResolved: number;

  lastSeenTotal: number | null;

  selectedItems: ReadonlySet<string>;

  setSelectedItem: (item: SelectedItem | null) => void;

  setEvidenceViewed: (viewed: boolean) => void;

  incrementResolved: () => void;

  updateLastSeen: (total: number) => void;

  setSelectedItems: (items: ReadonlySet<string>) => void;

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

export function parseItemSearchParam(raw: unknown): SelectedItem | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const colon = raw.indexOf(":");
  if (colon < 1 || colon >= raw.length - 1) return null;
  const kind = raw.slice(0, colon);
  const id = raw.slice(colon + 1);
  if (kind !== "entity_match" && kind !== "disputed") return null;
  return { kind, id };
}

export function stringifyItemSearchParam(
  item: SelectedItem | null,
): string | undefined {
  if (item === null) return undefined;
  return `${item.kind}:${item.id}`;
}
