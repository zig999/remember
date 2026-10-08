import { act } from "react";
import { reviewPanelOf } from "./entity-form-review-support";

type ReasonControl = HTMLTextAreaElement | HTMLInputElement;

function isTextControl(found: Element | null): found is ReasonControl {
  return (
    found instanceof HTMLTextAreaElement ||
    (found instanceof HTMLInputElement && found.type === "text")
  );
}

export function reasonControlIn(container: HTMLElement): ReasonControl | null {
  const panel = reviewPanelOf(container);
  if (panel === null) return null;
  for (const label of Array.from(panel.querySelectorAll("label"))) {
    const id = label.getAttribute("for");
    if (id === null) continue;
    const control = label.ownerDocument.getElementById(id);
    if (isTextControl(control) && panel.contains(control)) return control;
  }
  return null;
}

export async function typeReason(
  container: HTMLElement,
  reason: string,
): Promise<void> {
  const control = reasonControlIn(container);
  if (control === null) throw new Error("the review holds no reason field");
  const prototype =
    control instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter === undefined) throw new Error("no native value setter");
  await act(async () => {
    setter.call(control, reason);
    control.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

export function saveOfferedIn(container: HTMLElement): boolean {
  return (
    container.querySelector('[data-testid="entity-review-confirm"]') !== null
  );
}
