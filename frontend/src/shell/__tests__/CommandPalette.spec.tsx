/**
 * CommandPalette — unit test (Golden Rule 9).
 *
 * The load-bearing new behavior is the global ⌘K / Ctrl+K keybind toggling the
 * command-palette store. We mock the command UI (so cmdk/Dialog don't need
 * browser-only APIs in jsdom) and useNavigate, then assert the keydown toggles
 * the store both ways.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CommandPalette } from "../CommandPalette";
import { useCommandPaletteStore } from "../../state/command-palette";

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => () => undefined }));
vi.mock("../../components/ui/command", () => ({
  CommandDialog: () => null,
  CommandInput: () => null,
  CommandList: () => null,
  CommandEmpty: () => null,
  CommandGroup: () => null,
  CommandItem: () => null,
}));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  useCommandPaletteStore.setState({ open: false });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function pressCmdK() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  });
}

describe("CommandPalette — ⌘K keybind", () => {
  it("toggles the palette store open and closed", () => {
    act(() => root.render(<CommandPalette />));
    expect(useCommandPaletteStore.getState().open).toBe(false);

    pressCmdK();
    expect(useCommandPaletteStore.getState().open).toBe(true);

    pressCmdK();
    expect(useCommandPaletteStore.getState().open).toBe(false);
  });

  it("also responds to Ctrl+K (non-mac)", () => {
    act(() => root.render(<CommandPalette />));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "K", ctrlKey: true }));
    });
    expect(useCommandPaletteStore.getState().open).toBe(true);
  });
});
