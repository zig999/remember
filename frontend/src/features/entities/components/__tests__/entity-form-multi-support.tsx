import { act } from "react";
import type { AttributeKey } from "../../types";
import { catalogKey } from "./entity-form-support";

export function multiKey(key: string): AttributeKey {
  return { ...catalogKey(key), allowsMultiple: true };
}

export function groupOf(container: HTMLElement, key: string): HTMLElement {
  const group = container.querySelector<HTMLElement>(
    `[data-testid="entity-group-${key}"]`,
  );
  if (group === null) throw new Error(`no field group rendered for ${key}`);
  return group;
}

export function inputsOf(
  container: HTMLElement,
  key: string,
): HTMLInputElement[] {
  return Array.from(groupOf(container, key).querySelectorAll("input"));
}

export function valuesIn(container: HTMLElement, key: string): string[] {
  return inputsOf(container, key).map((input) => input.value);
}

export function sortedValuesIn(container: HTMLElement, key: string): string[] {
  return [...valuesIn(container, key)].sort();
}

export function buttonsIn(
  container: HTMLElement,
  key: string,
): HTMLButtonElement[] {
  return Array.from(groupOf(container, key).querySelectorAll("button"));
}

export function addButtonOf(
  container: HTMLElement,
  key: string,
): HTMLButtonElement {
  const found = buttonsIn(container, key).find((button) =>
    (button.textContent ?? "").includes("Adicionar valor"),
  );
  if (found === undefined) throw new Error(`no add control rendered for ${key}`);
  return found;
}

export function removeButtonsOf(
  container: HTMLElement,
  key: string,
): HTMLButtonElement[] {
  return buttonsIn(container, key).filter((button) =>
    (button.getAttribute("aria-label") ?? "").startsWith("Remover valor"),
  );
}

async function press(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.click();
  });
}

export async function addValue(
  container: HTMLElement,
  key: string,
): Promise<void> {
  await press(addButtonOf(container, key));
}

function inputHolding(
  container: HTMLElement,
  key: string,
  value: string,
): { input: HTMLInputElement; position: number } {
  const inputs = inputsOf(container, key);
  const position = inputs.findIndex((input) => input.value === value);
  const input = inputs[position];
  if (input === undefined) {
    throw new Error(`no field of ${key} holds "${value}"`);
  }
  return { input, position };
}

export async function removeValue(
  container: HTMLElement,
  key: string,
  value: string,
): Promise<void> {
  const { position } = inputHolding(container, key, value);
  const button = removeButtonsOf(container, key)[position];
  if (button === undefined) {
    throw new Error(`no remove control pairs with the field holding "${value}"`);
  }
  await press(button);
}

export async function retypeValue(
  container: HTMLElement,
  key: string,
  value: string,
  replacement: string,
): Promise<void> {
  const { input } = inputHolding(container, key, value);
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (setter === undefined) throw new Error("no native value setter");
  await act(async () => {
    setter.call(input, replacement);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
