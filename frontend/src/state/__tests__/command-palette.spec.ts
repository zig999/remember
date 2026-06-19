// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("useCommandPaletteStore", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("starts closed", async () => {
    const { useCommandPaletteStore } = await import("../command-palette");
    expect(useCommandPaletteStore.getState().open).toBe(false);
  });

  it("setOpen(true) opens; setOpen(false) closes", async () => {
    const { useCommandPaletteStore } = await import("../command-palette");
    useCommandPaletteStore.getState().setOpen(true);
    expect(useCommandPaletteStore.getState().open).toBe(true);
    useCommandPaletteStore.getState().setOpen(false);
    expect(useCommandPaletteStore.getState().open).toBe(false);
  });

  it("toggle() flips the open state", async () => {
    const { useCommandPaletteStore } = await import("../command-palette");
    expect(useCommandPaletteStore.getState().open).toBe(false);
    useCommandPaletteStore.getState().toggle();
    expect(useCommandPaletteStore.getState().open).toBe(true);
    useCommandPaletteStore.getState().toggle();
    expect(useCommandPaletteStore.getState().open).toBe(false);
  });
});
