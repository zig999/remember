import { act } from "react";
import type { AttributeKey } from "../../types";
import { catalogKey, helpTextsOf } from "./entity-form-support";
import { inputsOf, retypeValue } from "./entity-form-multi-support";

export function typedKey(
  key: string,
  valueType: string,
  allowsMultiple = false,
): AttributeKey {
  return { ...catalogKey(key), valueType, allowsMultiple };
}

export async function typeInto(
  container: HTMLElement,
  key: string,
  held: string,
  typed: string,
): Promise<void> {
  await retypeValue(container, key, held, typed);
  await act(async () => {
    await Promise.resolve();
  });
}

export function messageOf(input: HTMLInputElement): string | null {
  return helpTextsOf(input)[0] ?? null;
}

export function inputOf(container: HTMLElement, key: string): HTMLInputElement {
  const input = inputsOf(container, key)[0];
  if (input === undefined) throw new Error(`no field rendered for ${key}`);
  return input;
}

export function messageIn(container: HTMLElement, key: string): string | null {
  return messageOf(inputOf(container, key));
}

export function invalidMarkOf(
  container: HTMLElement,
  key: string,
): string | null {
  return inputOf(container, key).getAttribute("aria-invalid");
}

export function messagesByValue(
  container: HTMLElement,
  key: string,
): Record<string, string | null> {
  return Object.fromEntries(
    inputsOf(container, key).map((input) => [input.value, messageOf(input)]),
  );
}

export function alertsOf(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[role="alert"]')).map(
    (alert) => alert.textContent ?? "",
  );
}

export function acceptedFlagOf(container: HTMLElement): string | null {
  const form = container.querySelector('[data-testid="entity-form"]');
  if (form === null) throw new Error("no form rendered");
  return form.getAttribute("data-value-types-accepted");
}
