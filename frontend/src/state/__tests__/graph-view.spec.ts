// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("useGraphViewStore", () => {
  let sessionStorage: FakeStorage;
  let localStorage: FakeStorage;

  beforeEach(() => {
    sessionStorage = makeFakeStorage();
    localStorage = makeFakeStorage();
    (globalThis as { sessionStorage?: FakeStorage }).sessionStorage = sessionStorage;
    (globalThis as { localStorage?: FakeStorage }).localStorage = localStorage;
    vi.resetModules();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("uses the canonical storage key 'remember.graph'", async () => {
    const { GRAPH_STORAGE_KEY } = await import("../graph-view");
    expect(GRAPH_STORAGE_KEY).toBe("remember.graph");
  });

  it("initial state: empty pins, empty expansion, no selection, panel open", async () => {
    const { useGraphViewStore } = await import("../graph-view");
    const s = useGraphViewStore.getState();
    expect(s.pinnedPositions).toEqual({});
    expect(s.expansionSet).toEqual([]);
    expect(s.selection).toBeNull();
    expect(s.panelCollapsed).toBe(false);
    expect(s.version).toBe(1);
  });

  it("pin(id, pos) and unpin(id) mutate pinnedPositions", async () => {
    const { useGraphViewStore } = await import("../graph-view");
    useGraphViewStore.getState().pin("n1", { x: 10, y: 20 });
    expect(useGraphViewStore.getState().pinnedPositions["n1"]).toEqual({ x: 10, y: 20 });
    useGraphViewStore.getState().unpin("n1");
    expect(useGraphViewStore.getState().pinnedPositions["n1"]).toBeUndefined();
  });

  it("setExpanded toggles ids in expansionSet without duplicates", async () => {
    const { useGraphViewStore } = await import("../graph-view");
    useGraphViewStore.getState().setExpanded("a", true);
    useGraphViewStore.getState().setExpanded("a", true); // duplicate
    expect(useGraphViewStore.getState().expansionSet).toEqual(["a"]);
    useGraphViewStore.getState().setExpanded("a", false);
    expect(useGraphViewStore.getState().expansionSet).toEqual([]);
  });

  it("persists to sessionStorage (NOT localStorage) under 'remember.graph'", async () => {
    const { useGraphViewStore, GRAPH_STORAGE_KEY } = await import("../graph-view");
    useGraphViewStore.getState().pin("n1", { x: 5, y: 6 });
    const raw = sessionStorage.getItem(GRAPH_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(localStorage.getItem(GRAPH_STORAGE_KEY)).toBeNull();
    const parsed = JSON.parse(raw as string) as {
      state: { pinnedPositions: Record<string, { x: number; y: number }>; version: number };
    };
    expect(parsed.state.pinnedPositions["n1"]).toEqual({ x: 5, y: 6 });
    expect(parsed.state.version).toBe(1);
  });

  it("reset() clears every field except version", async () => {
    const { useGraphViewStore } = await import("../graph-view");
    useGraphViewStore.getState().pin("n1", { x: 1, y: 1 });
    useGraphViewStore.getState().setExpanded("n1", true);
    useGraphViewStore.getState().setSelection("n1");
    useGraphViewStore.getState().setPanelCollapsed(true);
    useGraphViewStore.getState().reset();
    const s = useGraphViewStore.getState();
    expect(s.pinnedPositions).toEqual({});
    expect(s.expansionSet).toEqual([]);
    expect(s.selection).toBeNull();
    expect(s.panelCollapsed).toBe(false);
    expect(s.version).toBe(1);
  });
});
