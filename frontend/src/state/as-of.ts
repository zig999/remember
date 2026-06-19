/**
 * useAsOfStore — time-travel cursor (in-memory mirror of the URL `?as_of=…`).
 *
 * Spec references:
 *  - front.md §3.2 (URL is the single source of truth for view state)
 *  - front.md §4.3 (client state catalog)
 *  - front.back.md §2 (Store: useAsOfStore — in-memory mirror)
 *
 * The URL is the source of truth — this store is the in-memory cache
 * components read. The router (`useSearch()`) syncs the URL into this store
 * when `?as_of` changes; components only READ from this store, never write
 * directly. Writing happens via `navigate({ search: { as_of: ... } })`.
 */

import { create } from "zustand";

export interface AsOfState {
  /** Time-travel cursor — `null` means "now" (no `?as_of` param). */
  asOf: Date | null;
  /** Set the in-memory cursor — called by the router sync layer. */
  set: (next: Date | null) => void;
}

export const useAsOfStore = create<AsOfState>((set) => ({
  asOf: null,
  set: (next) => set({ asOf: next }),
}));
