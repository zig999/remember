// @vitest-environment node
import { describe, expect, it, beforeEach, vi } from "vitest";

describe("useAsOfStore", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("initial asOf is null (= 'now')", async () => {
    const { useAsOfStore } = await import("../as-of");
    expect(useAsOfStore.getState().asOf).toBeNull();
  });

  it("set(Date) updates the in-memory cursor", async () => {
    const { useAsOfStore } = await import("../as-of");
    const date = new Date("2026-01-15T00:00:00Z");
    useAsOfStore.getState().set(date);
    expect(useAsOfStore.getState().asOf).toEqual(date);
  });

  it("set(null) resets the cursor to 'now'", async () => {
    const { useAsOfStore } = await import("../as-of");
    useAsOfStore.getState().set(new Date("2026-01-15T00:00:00Z"));
    useAsOfStore.getState().set(null);
    expect(useAsOfStore.getState().asOf).toBeNull();
  });

  it("does not write to localStorage or sessionStorage (URL is source of truth)", async () => {
    // Install a fake localStorage that records writes — assert none happen.
    const writes: Array<[string, string]> = [];
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: () => null,
      setItem: (k: string, v: string) => {
        writes.push([k, v]);
      },
      removeItem: () => undefined,
      clear: () => undefined,
      length: 0,
      key: () => null,
    } as Storage;
    (globalThis as { sessionStorage?: Storage }).sessionStorage = (
      globalThis as { localStorage: Storage }
    ).localStorage;
    const { useAsOfStore } = await import("../as-of");
    useAsOfStore.getState().set(new Date("2026-01-15"));
    expect(writes).toEqual([]);
  });
});
