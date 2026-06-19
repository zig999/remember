/**
 * useCommandPaletteStore — open/closed state of ⌘K (in-memory only).
 *
 * Spec references:
 *  - front.md §4.3 (client state catalog)
 *  - front.back.md §2 (Store: useCommandPaletteStore — in-memory only)
 *
 * The palette UI ships in a later wave; the foundation reserves the store
 * shape so any global keyboard handler can already toggle it.
 */

import { create } from "zustand";

export interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}));
