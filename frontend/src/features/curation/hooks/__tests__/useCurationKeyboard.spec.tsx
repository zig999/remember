/**
 * Unit tests for `useCurationKeyboard` (TC-07).
 *
 * Why each test exists (Rule 9 — Tests Verify Intent):
 *  - `mapKey` is a pure function — encoding what each shortcut means.
 *    A regression that changes which key fires `merge` would let the
 *    curator press `m` and accidentally reject an item. Tests pin every
 *    documented shortcut from §8 of the spec.
 *  - `isEditableTarget` is the single gate that protects the
 *    ReasonField + CorrectionForm from eating decision shortcuts.
 *    A regression here means typing `c` into the reason field would
 *    silently fire a confirm.
 *  - The hook MUST detach on `enabled=false` so the drawer can disable
 *    page shortcuts while open. A regression would have both the page
 *    and the drawer reacting to the same `c`.
 *  - The hook MUST NOT swallow `Ctrl/Cmd/Alt` modified keys — those
 *    belong to the OS/browser (Ctrl+R reload).
 *  - 1..9 maps to a 1-based index — a regression that turned it
 *    0-based would select the wrong item silently.
 */
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import {
  isEditableTarget,
  mapKey,
  useCurationKeyboard,
  type CurationKeyboardCallbacks,
} from "../useCurationKeyboard";

/* ---------- pure helpers ---------- */

describe("mapKey", () => {
  function ev(key: string, mods: Partial<KeyboardEventInit> = {}): KeyboardEvent {
    return new KeyboardEvent("keydown", { key, ...mods });
  }

  it("maps documented letter shortcuts", () => {
    expect(mapKey(ev("j"))).toBe("next");
    expect(mapKey(ev("k"))).toBe("prev");
    expect(mapKey(ev("x"))).toBe("toggleCheck");
    expect(mapKey(ev("e"))).toBe("evidence");
    expect(mapKey(ev("m"))).toBe("merge");
    expect(mapKey(ev("s"))).toBe("keepSeparate");
    expect(mapKey(ev("c"))).toBe("confirm");
    expect(mapKey(ev("r"))).toBe("reject");
    expect(mapKey(ev("u"))).toBe("undo");
    expect(mapKey(ev("?"))).toBe("toggleHelp");
  });

  it("maps 1..9 to a 1-based selectIndex", () => {
    expect(mapKey(ev("1"))).toEqual({ kind: "selectIndex", n: 1 });
    expect(mapKey(ev("5"))).toEqual({ kind: "selectIndex", n: 5 });
    expect(mapKey(ev("9"))).toEqual({ kind: "selectIndex", n: 9 });
  });

  it("does NOT map 0 (out of the spec's 1..9 range)", () => {
    expect(mapKey(ev("0"))).toBeNull();
  });

  it("ignores keys with Ctrl/Alt/Meta modifiers (belong to the OS)", () => {
    expect(mapKey(ev("c", { ctrlKey: true }))).toBeNull();
    expect(mapKey(ev("r", { metaKey: true }))).toBeNull();
    expect(mapKey(ev("m", { altKey: true }))).toBeNull();
  });

  it("allows Shift (needed for ?)", () => {
    // `?` is the post-shift key on US layouts — `event.key` arrives
    // as `?` directly; we accept it regardless of the shift flag.
    expect(mapKey(ev("?", { shiftKey: true }))).toBe("toggleHelp");
  });

  it("returns null for unknown keys", () => {
    expect(mapKey(ev("a"))).toBeNull();
    expect(mapKey(ev("Enter"))).toBeNull();
    expect(mapKey(ev("Escape"))).toBeNull();
  });
});

describe("isEditableTarget", () => {
  it("returns true for inputs, textareas, selects", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("select"))).toBe(true);
  });

  it("returns true for contenteditable elements", () => {
    const div = document.createElement("div");
    // jsdom does not derive `isContentEditable` from the attribute; the
    // production path checks the boolean prop. Stub it explicitly to
    // assert the gate without relying on browser layout state.
    Object.defineProperty(div, "isContentEditable", { value: true });
    expect(isEditableTarget(div)).toBe(true);
  });

  it("returns true for role=combobox/listbox/textbox (Radix Select trigger)", () => {
    const trigger = document.createElement("button");
    trigger.setAttribute("role", "combobox");
    expect(isEditableTarget(trigger)).toBe(true);
  });

  it("returns false for plain buttons and divs", () => {
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
  });

  it("returns false for null/non-element targets", () => {
    expect(isEditableTarget(null)).toBe(false);
  });
});

/* ---------- hook behaviour ---------- */

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

interface HarnessProps {
  readonly callbacks: CurationKeyboardCallbacks;
  readonly enabled?: boolean;
}

const Harness = ({ callbacks, enabled }: HarnessProps) => {
  useCurationKeyboard(callbacks, enabled === undefined ? {} : { enabled });
  return <div data-testid="harness" />;
};

function pressKey(key: string, target?: HTMLElement): void {
  const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  (target ?? window).dispatchEvent(ev);
}

describe("useCurationKeyboard — wiring", () => {
  it("fires onNext on `j`", () => {
    const onNext = vi.fn();
    act(() => root.render(<Harness callbacks={{ onNext }} />));
    act(() => pressKey("j"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("fires onSelectIndex with the 1-based number on `1..9`", () => {
    const onSelectIndex = vi.fn();
    act(() => root.render(<Harness callbacks={{ onSelectIndex }} />));
    act(() => pressKey("3"));
    expect(onSelectIndex).toHaveBeenCalledExactlyOnceWith(3);
  });

  it("does NOT fire when focus is in a textarea (ReasonField guard)", () => {
    const onConfirm = vi.fn();
    act(() => root.render(<Harness callbacks={{ onConfirm }} />));
    const ta = document.createElement("textarea");
    container.appendChild(ta);
    ta.focus();
    const ev = new KeyboardEvent("keydown", {
      key: "c",
      bubbles: true,
      cancelable: true,
    });
    ta.dispatchEvent(ev);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does NOT fire when enabled=false (drawer-open lockout)", () => {
    const onNext = vi.fn();
    act(() => root.render(<Harness callbacks={{ onNext }} enabled={false} />));
    act(() => pressKey("j"));
    expect(onNext).not.toHaveBeenCalled();
  });

  it("re-attaches when toggled enabled=true", () => {
    const onNext = vi.fn();
    act(() => root.render(<Harness callbacks={{ onNext }} enabled={false} />));
    act(() => pressKey("j"));
    expect(onNext).not.toHaveBeenCalled();
    act(() => root.render(<Harness callbacks={{ onNext }} enabled={true} />));
    act(() => pressKey("j"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("silently no-ops when the matching callback is undefined", () => {
    // No callbacks at all — pressing `j` should not throw.
    act(() => root.render(<Harness callbacks={{}} />));
    expect(() => pressKey("j")).not.toThrow();
  });

  it("ignores Ctrl+key (browser shortcuts win)", () => {
    const onReject = vi.fn();
    act(() => root.render(<Harness callbacks={{ onReject }} />));
    const ev = new KeyboardEvent("keydown", {
      key: "r",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(ev);
    expect(onReject).not.toHaveBeenCalled();
  });
});
