/**
 * useCurationKeyboard — document-level keyboard shortcuts for /curation (TC-07).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §8 "Atalhos de teclado (j/k, x, e, m/s,
 *    1..9, c/r/u, ?); document-level keydown listener no CurationPage;
 *    desabilitado quando foco em input/textarea/select".
 *  - §9 Scenario 8 — keyboard 100%.
 *
 * Why a single document-level listener:
 *  - Shortcuts must work no matter which non-input element has focus
 *    (the queue, the panel, an inert region of the page). A per-component
 *    listener would force every consumer to re-implement the same gate;
 *    a single listener attached to `window` (capture: false) keeps the
 *    routing in one place.
 *  - The hook DISABLES itself when the active element is an editable
 *    surface (`<input>`, `<textarea>`, `<select>`, or `[contenteditable]`).
 *    This is critical: the ReasonField inside DecisionPanel is a
 *    `<textarea>` and the curator MUST be able to type `c`, `r`, `m`, `s`
 *    into it without firing decisions. The check is checked at the moment
 *    of keydown, not at hook init, so focus changes during the session
 *    are honoured.
 *  - We also skip when a modifier is held (`Ctrl`, `Meta`, `Alt`) — those
 *    belong to browser/OS shortcuts (Ctrl+R reload, Cmd+S save, etc.).
 *    `Shift` is allowed because `?` requires Shift on US layouts.
 *
 * Why callbacks (not direct store writes):
 *  - The keyboard hook is dumb infrastructure: it MAPS keystrokes to
 *    semantic actions. Wiring (which store, which mutation) lives in the
 *    page. This keeps the hook reusable by tests (a spec can pass a stub
 *    bag of callbacks and assert each keystroke routes correctly) and
 *    keeps the page in control of which actions are even enabled (e.g.
 *    `m` only fires when the item is `entity_match` AND a candidate is
 *    selected — that gating belongs to the page, not the hook).
 */
import { useEffect, useMemo, useRef, type RefObject } from "react";

/* ------------------------------------------------------------------ *
 * Public API                                                          *
 * ------------------------------------------------------------------ */

/** Bag of callbacks the page wires to its own semantic actions. Every
 *  field is optional — missing callbacks are silently ignored (the
 *  shortcut becomes a no-op for the page that doesn't support it). */
export interface CurationKeyboardCallbacks {
  readonly onNext?: () => void;
  readonly onPrev?: () => void;
  readonly onToggleCheck?: () => void;
  readonly onEvidence?: () => void;
  readonly onMerge?: () => void;
  readonly onKeepSeparate?: () => void;
  /** 1-9 selects the Nth visible queue item (1-indexed). `n` is in
   *  `[1, 9]`. Page is responsible for index-vs-page clamp. */
  readonly onSelectIndex?: (n: number) => void;
  readonly onConfirm?: () => void;
  readonly onReject?: () => void;
  readonly onUndo?: () => void;
  readonly onToggleHelp?: () => void;
}

export interface UseCurationKeyboardOptions {
  /** Master switch. When `false`, the listener is detached entirely (used
   *  to disable shortcuts when the drawer is open and consuming its own
   *  key handling, for example). Defaults to `true`. */
  readonly enabled?: boolean;
  /**
   * Optional ref to a target element. When provided, the keydown
   * listener is attached to that element (capture phase) instead of
   * `window`. This is useful for tests that need to scope the listener
   * to a fixture without polluting the global namespace. Defaults to
   * `window`.
   */
  readonly target?: RefObject<HTMLElement | null>;
}

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

/**
 * Returns `true` when the event originated from an editable surface that
 * MUST receive the key normally (typing into ReasonField, CorrectionForm,
 * etc.). Exported for direct test coverage — the gate is the single most
 * regression-prone branch of the hook.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // Native contenteditable surfaces (rich-text fields, code mirrors).
  if (target.isContentEditable) return true;
  // Radix Select trigger / combobox forwards key events to a hidden
  // listbox; we treat any element with `role="combobox"` as editable
  // because typing into it should not fire decisions.
  const role = target.getAttribute("role");
  if (role === "combobox" || role === "listbox" || role === "textbox") {
    return true;
  }
  return false;
}

/** Pure mapper from KeyboardEvent.key to a semantic action name (or
 *  `null` when the key is not a recognised shortcut). Exported for
 *  direct test coverage and so the page can reuse the same key set if
 *  it needs to render a help legend. */
export type CurationShortcut =
  | "next"
  | "prev"
  | "toggleCheck"
  | "evidence"
  | "merge"
  | "keepSeparate"
  | "confirm"
  | "reject"
  | "undo"
  | "toggleHelp"
  | { readonly kind: "selectIndex"; readonly n: number };

export function mapKey(event: KeyboardEvent): CurationShortcut | null {
  // Shift is allowed (needed for `?`); Ctrl/Alt/Meta route to the OS.
  if (event.ctrlKey || event.altKey || event.metaKey) return null;
  const key = event.key;
  if (key === "j") return "next";
  if (key === "k") return "prev";
  if (key === "x") return "toggleCheck";
  if (key === "e") return "evidence";
  if (key === "m") return "merge";
  if (key === "s") return "keepSeparate";
  if (key === "c") return "confirm";
  if (key === "r") return "reject";
  if (key === "u") return "undo";
  if (key === "?") return "toggleHelp";
  // 1..9 select Nth item. event.key is "1".."9" on all common layouts.
  if (key.length === 1 && key >= "1" && key <= "9") {
    return { kind: "selectIndex", n: Number(key) };
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Hook                                                                *
 * ------------------------------------------------------------------ */

/**
 * Attach a document-level keydown listener wiring the spec's curation
 * shortcuts to caller-supplied callbacks. Returns nothing — the hook is
 * an effect-style attach/detach.
 */
export function useCurationKeyboard(
  callbacks: CurationKeyboardCallbacks,
  options: UseCurationKeyboardOptions = {},
): void {
  const { enabled = true, target } = options;

  // Keep the callbacks fresh without re-attaching the listener on every
  // render. Callers usually pass inline closures that change identity
  // each render; rebinding the document listener every time would
  // thrash performance AND drop in-flight keystrokes.
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Resolve the target element. `target` is a RefObject; the actual
  // element may be null on the first render (the consumer hasn't
  // mounted its anchor yet). We re-resolve inside the effect so the
  // listener attaches to whichever element is mounted at the time the
  // effect runs.
  const targetRef = useMemo(() => target ?? null, [target]);

  useEffect(() => {
    if (!enabled) return undefined;
    const el: EventTarget = targetRef?.current ?? window;

    function onKeyDown(event: Event): void {
      if (!(event instanceof KeyboardEvent)) return;
      // Skip when typing into a form control.
      if (isEditableTarget(event.target)) return;
      const action = mapKey(event);
      if (action === null) return;
      // Spec-driven gate: shortcuts that would change the page state
      // call `preventDefault()` so a stray `c` does not also reach a
      // sibling listener (e.g. the BatchBar's local hotkeys). We don't
      // prevent default for `?` because some browsers may render a
      // search panel — letting it through is fine, the hook fires the
      // callback FIRST.
      const cb = callbacksRef.current;

      if (typeof action === "object") {
        // selectIndex (1..9)
        if (cb.onSelectIndex !== undefined) {
          event.preventDefault();
          cb.onSelectIndex(action.n);
        }
        return;
      }

      switch (action) {
        case "next":
          if (cb.onNext !== undefined) {
            event.preventDefault();
            cb.onNext();
          }
          return;
        case "prev":
          if (cb.onPrev !== undefined) {
            event.preventDefault();
            cb.onPrev();
          }
          return;
        case "toggleCheck":
          if (cb.onToggleCheck !== undefined) {
            event.preventDefault();
            cb.onToggleCheck();
          }
          return;
        case "evidence":
          if (cb.onEvidence !== undefined) {
            event.preventDefault();
            cb.onEvidence();
          }
          return;
        case "merge":
          if (cb.onMerge !== undefined) {
            event.preventDefault();
            cb.onMerge();
          }
          return;
        case "keepSeparate":
          if (cb.onKeepSeparate !== undefined) {
            event.preventDefault();
            cb.onKeepSeparate();
          }
          return;
        case "confirm":
          if (cb.onConfirm !== undefined) {
            event.preventDefault();
            cb.onConfirm();
          }
          return;
        case "reject":
          if (cb.onReject !== undefined) {
            event.preventDefault();
            cb.onReject();
          }
          return;
        case "undo":
          if (cb.onUndo !== undefined) {
            event.preventDefault();
            cb.onUndo();
          }
          return;
        case "toggleHelp":
          if (cb.onToggleHelp !== undefined) {
            cb.onToggleHelp();
          }
          return;
      }
    }

    el.addEventListener("keydown", onKeyDown);
    return () => {
      el.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, targetRef]);
}
