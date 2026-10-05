import { useEffect, useMemo, useRef, type RefObject } from "react";

export interface CurationKeyboardCallbacks {
  readonly onNext?: () => void;
  readonly onPrev?: () => void;
  readonly onToggleCheck?: () => void;
  readonly onEvidence?: () => void;
  readonly onMerge?: () => void;
  readonly onKeepSeparate?: () => void;
  readonly onSelectIndex?: (n: number) => void;
  readonly onConfirm?: () => void;
  readonly onReject?: () => void;
  readonly onUndo?: () => void;
  readonly onToggleHelp?: () => void;
}

export interface UseCurationKeyboardOptions {
  readonly enabled?: boolean;
  readonly target?: RefObject<HTMLElement | null>;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  const role = target.getAttribute("role");
  if (role === "combobox" || role === "listbox" || role === "textbox") {
    return true;
  }
  return false;
}

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
  if (key.length === 1 && key >= "1" && key <= "9") {
    return { kind: "selectIndex", n: Number(key) };
  }
  return null;
}

export function useCurationKeyboard(
  callbacks: CurationKeyboardCallbacks,
  options: UseCurationKeyboardOptions = {},
): void {
  const { enabled = true, target } = options;

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const targetRef = useMemo(() => target ?? null, [target]);

  useEffect(() => {
    if (!enabled) return undefined;
    const el: EventTarget = targetRef?.current ?? window;

    function onKeyDown(event: Event): void {
      if (!(event instanceof KeyboardEvent)) return;
      if (isEditableTarget(event.target)) return;
      const action = mapKey(event);
      if (action === null) return;
      const cb = callbacksRef.current;

      if (typeof action === "object") {
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
