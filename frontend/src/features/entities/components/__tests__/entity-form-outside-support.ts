import type { AttributeKey } from "../../types";
import { groupOf } from "./entity-form-multi-support";

const CONTROLS = 'input, select, textarea, [role="combobox"], button';

export function formOf(container: HTMLElement): HTMLElement {
  const form = container.querySelector<HTMLElement>(
    '[data-testid="entity-form"]',
  );
  if (form === null) throw new Error("no form rendered");
  return form;
}

function controlsOf(container: HTMLElement): HTMLElement[] {
  return Array.from(formOf(container).querySelectorAll<HTMLElement>(CONTROLS));
}

function describeControl(control: HTMLElement): string {
  const value = control instanceof HTMLInputElement ? control.value : "";
  return [
    control.tagName.toLowerCase(),
    control.getAttribute("type") ?? "",
    control.getAttribute("role") ?? "",
    control.getAttribute("aria-label") ?? "",
    value,
  ].join("|");
}

export function controlSignatureOf(container: HTMLElement): string[] {
  return controlsOf(container).map(describeControl);
}

export function controlsCarrying(
  container: HTMLElement,
  text: string,
): string[] {
  return controlsOf(container)
    .filter((control) => {
      const carried = [
        control instanceof HTMLInputElement ? control.value : "",
        control instanceof HTMLTextAreaElement ? control.value : "",
        control.textContent ?? "",
        control.getAttribute("aria-label") ?? "",
        control.getAttribute("placeholder") ?? "",
        control.getAttribute("title") ?? "",
      ];
      return carried.some((candidate) => candidate.includes(text));
    })
    .map(describeControl);
}

export function formTextOf(container: HTMLElement): string {
  return formOf(container).textContent ?? "";
}

export function groupsTextOf(
  container: HTMLElement,
  attributeKeys: readonly AttributeKey[],
): string {
  return attributeKeys
    .map(({ key }) => groupOf(container, key).textContent ?? "")
    .join("");
}
