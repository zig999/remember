import { act } from "react";
import type { AllowedValue, AttributeKey } from "../../types";
import { catalogKey } from "./entity-form-support";
import { buttonsIn, groupOf, removeButtonsOf } from "./entity-form-multi-support";

export interface ClosedKeyShape {
  readonly valueType?: string;
  readonly allowsMultiple?: boolean;
}

export interface OpenedChoice {
  readonly offered: string[];
  readonly selected: string[];
}

export function allowed(
  value: string,
  label: string | null = null,
  sortOrder: number | null = null,
): AllowedValue {
  return { value, label, sortOrder };
}

export function closedKey(
  key: string,
  allowedValues: readonly AllowedValue[],
  shape: ClosedKeyShape = {},
): AttributeKey {
  return {
    ...catalogKey(key),
    valueType: shape.valueType ?? "text",
    allowsMultiple: shape.allowsMultiple ?? false,
    allowedValues,
  };
}

function textOf(element: HTMLElement): string {
  return (element.textContent ?? "").trim();
}

export function choicesOf(container: HTMLElement, key: string): HTMLElement[] {
  return Array.from(
    groupOf(container, key).querySelectorAll<HTMLElement>('[role="combobox"]'),
  );
}

function choiceOf(
  container: HTMLElement,
  key: string,
  position: number,
): HTMLElement {
  const choice = choicesOf(container, key)[position];
  if (choice === undefined) {
    throw new Error(`no choice at position ${position} rendered for ${key}`);
  }
  return choice;
}

function optionsOf(choice: HTMLElement): HTMLElement[] {
  const select = choice.parentElement;
  if (select === null) throw new Error("the choice sits in no container");
  return Array.from(select.querySelectorAll<HTMLElement>('[role="option"]'));
}

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

export function shownLabelsIn(container: HTMLElement, key: string): string[] {
  return choicesOf(container, key).map(textOf);
}

export async function openChoice(
  container: HTMLElement,
  key: string,
  position = 0,
): Promise<OpenedChoice> {
  const choice = choiceOf(container, key, position);
  await act(async () => {
    choice.click();
  });
  const options = optionsOf(choice);
  return {
    offered: options.map(textOf),
    selected: options
      .filter((option) => option.getAttribute("aria-selected") === "true")
      .map(textOf),
  };
}

export async function pickOption(
  container: HTMLElement,
  key: string,
  label: string,
  position = 0,
): Promise<void> {
  const choice = choiceOf(container, key, position);
  await act(async () => {
    choice.click();
  });
  const option = optionsOf(choice).find((element) => textOf(element) === label);
  if (option === undefined) throw new Error(`${key} offers no option "${label}"`);
  await act(async () => {
    option.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
  });
  await settle();
}

export async function clearChoice(
  container: HTMLElement,
  key: string,
): Promise<void> {
  const control = buttonsIn(container, key).find(
    (button) => button.getAttribute("role") !== "combobox",
  );
  if (control === undefined) {
    throw new Error(`no control besides the choice itself is offered for ${key}`);
  }
  await act(async () => {
    control.click();
  });
  await settle();
}

export async function removeChoiceShowing(
  container: HTMLElement,
  key: string,
  label: string,
): Promise<void> {
  const position = shownLabelsIn(container, key).indexOf(label);
  const button = removeButtonsOf(container, key)[position];
  if (position < 0 || button === undefined) {
    throw new Error(`no entry of ${key} shows "${label}" with a remove control`);
  }
  await act(async () => {
    button.click();
  });
}
