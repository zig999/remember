/**
 * useThemeStore — active theme (`dark` | `light`) persisted to localStorage.
 *
 * Spec references:
 *  - front.md §4.3 (client state — Zustand store catalog)
 *  - front.md §8 (theming model — `data-theme` is the only switch surface)
 *  - front.back.md §2 (persisted state shape: { theme, version })
 *  - front.back.md BR-09 (hydration before React mount; no FOUC)
 *  - front.back.md BR-14 (data-theme is the only theme switch surface)
 *  - front.back.md ST-02 (theme state machine)
 *
 * Storage key: `remember.theme` (matches the inline script in index.html so
 * the pre-mount hydration and the Zustand store agree).
 *
 * The store SUBSCRIBES to its own state and writes `data-theme="…"` on the
 * `<html>` root on every change — this is the one and only theme-switch
 * surface (BR-14). The initial value is also written defensively on store
 * creation in case the inline script failed (private mode, quota).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "dark" | "light";

export interface ThemeState {
  theme: Theme;
  version: 1;
  /** Set the active theme. Writes `data-theme` on `<html>` synchronously. */
  set: (next: Theme) => void;
  /** Flip between dark and light. */
  toggle: () => void;
}

/** Storage key — MUST match the inline hydration script in `index.html`. */
export const THEME_STORAGE_KEY = "remember.theme";

/**
 * Read the current `data-theme` attribute as the initial value. Falls back
 * to `"dark"` if the document is unavailable (SSR-style boot, tests).
 */
function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

/**
 * Apply a theme by writing `data-theme` on `<html>`. BR-14: this is the
 * ONLY theme switch surface — no class toggles, no inline styles.
 */
function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: readInitialTheme(),
      version: 1,
      set: (next) => {
        if (get().theme === next) return;
        applyTheme(next);
        set({ theme: next });
      },
      toggle: () => {
        const next: Theme = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Persist only the slice that survives reloads.
      partialize: (state) => ({ theme: state.theme, version: state.version }),
      // After rehydration, re-apply the persisted value to <html> (defensive:
      // covers the case where the inline script failed but localStorage worked).
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
