// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * useThemeStore tests.
 *
 * Pins:
 *  - Persists to localStorage under the canonical key `remember.theme`.
 *  - Mutating the theme writes `<html data-theme="...">` (BR-14).
 *  - `set(theme)` and `toggle()` agree on the active theme.
 *  - The persisted envelope shape matches front.back.md §2
 *    ({ state: { theme, version }, version }).
 *
 * Since the package does not ship `jsdom` (TC-02 TD-1), the spec installs a
 * minimal fake DOM + storage shim on `globalThis` BEFORE importing the
 * store. The store reads `document.documentElement` and `localStorage` once
 * at import time; we feed those reads through our shim so we can assert
 * against them with no transitive jsdom dependency.
 */

interface FakeStorage {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
  clear: () => void;
  readonly length: number;
  key: (i: number) => string | null;
}

function makeFakeStorage(): FakeStorage {
  const store: Record<string, string> = {};
  return {
    getItem: (k) => (k in store ? (store[k] ?? null) : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => Object.keys(store)[i] ?? null,
  };
}

function installShim(): { html: { getAttribute: (k: string) => string | null }; storage: FakeStorage } {
  const attrs: Record<string, string> = {};
  const html = {
    getAttribute: (name: string): string | null => attrs[name] ?? null,
    setAttribute: (name: string, value: string): void => {
      attrs[name] = value;
    },
  };
  const storage = makeFakeStorage();
  (globalThis as { document?: unknown }).document = { documentElement: html };
  (globalThis as { localStorage?: FakeStorage }).localStorage = storage;
  (globalThis as { sessionStorage?: FakeStorage }).sessionStorage = makeFakeStorage();
  return { html, storage };
}

describe("useThemeStore", () => {
  let html: { getAttribute: (k: string) => string | null };
  let storage: FakeStorage;

  beforeEach(() => {
    const shim = installShim();
    html = shim.html;
    storage = shim.storage;
    (html as unknown as { setAttribute: (n: string, v: string) => void }).setAttribute(
      "data-theme",
      "dark",
    );
    // Reset module registry so each test gets a fresh store instance that
    // reads the freshly installed DOM/storage shims.
    vi.resetModules();
  });

  afterEach(() => {
    storage.clear();
  });

  it("uses the canonical storage key 'remember.theme' (BR-09)", async () => {
    const mod = await import("../theme");
    expect(mod.THEME_STORAGE_KEY).toBe("remember.theme");
  });

  it("set('light') updates <html data-theme='light'> and persists to localStorage", async () => {
    const { useThemeStore, THEME_STORAGE_KEY } = await import("../theme");
    useThemeStore.getState().set("light");
    expect(html.getAttribute("data-theme")).toBe("light");
    const raw = storage.getItem(THEME_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as {
      state: { theme: string; version: number };
      version: number;
    };
    expect(parsed.state.theme).toBe("light");
    expect(parsed.state.version).toBe(1);
    expect(parsed.version).toBe(1);
  });

  it("set('dark') updates <html data-theme='dark'>", async () => {
    const { useThemeStore } = await import("../theme");
    useThemeStore.getState().set("light");
    useThemeStore.getState().set("dark");
    expect(html.getAttribute("data-theme")).toBe("dark");
  });

  it("toggle() flips between dark and light and writes data-theme", async () => {
    const { useThemeStore } = await import("../theme");
    const initial = useThemeStore.getState().theme;
    const expected = initial === "dark" ? "light" : "dark";
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe(expected);
    expect(html.getAttribute("data-theme")).toBe(expected);
  });

  it("set with the same theme is a no-op (no extra localStorage write)", async () => {
    const { useThemeStore, THEME_STORAGE_KEY } = await import("../theme");
    const current = useThemeStore.getState().theme;
    storage.clear();
    useThemeStore.getState().set(current);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
