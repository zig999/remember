import { act } from "react";
import { vi } from "vitest";
import type { AttributeKey } from "../../types";
import { catalogKey } from "./entity-form-support";
import { groupOf } from "./entity-form-multi-support";

export interface OfferedValidity {
  readonly start: boolean;
  readonly end: boolean;
}

export const OFFERED_BOTH: OfferedValidity = { start: true, end: true };

export const OFFERED_NEITHER: OfferedValidity = { start: false, end: false };

export function temporalKey(key: string): AttributeKey {
  return { ...catalogKey(key), isTemporal: true };
}

function markedIn(
  container: HTMLElement,
  key: string,
  mark: string,
): HTMLInputElement | null {
  return groupOf(container, key).querySelector<HTMLInputElement>(
    `[data-testid="${mark}-${key}"]`,
  );
}

export function startInputOf(
  container: HTMLElement,
  key: string,
): HTMLInputElement | null {
  return markedIn(container, key, "entity-valid-from");
}

export function endInputOf(
  container: HTMLElement,
  key: string,
): HTMLInputElement | null {
  return markedIn(container, key, "entity-valid-to");
}

export function todayNoteOf(
  container: HTMLElement,
  key: string,
): HTMLElement | null {
  return markedIn(container, key, "entity-valid-from-today");
}

export function dateInputsIn(
  container: HTMLElement,
  key: string,
): HTMLInputElement[] {
  return Array.from(
    groupOf(container, key).querySelectorAll<HTMLInputElement>(
      'input[type="date"]',
    ),
  );
}

export function offeredValidityIn(
  container: HTMLElement,
  key: string,
): OfferedValidity {
  return {
    start: startInputOf(container, key) !== null,
    end: endInputOf(container, key) !== null,
  };
}

export async function setDate(
  input: HTMLInputElement | null,
  value: string,
): Promise<void> {
  if (input === null) throw new Error("no date input rendered to set");
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (setter === undefined) throw new Error("no native value setter");
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await Promise.resolve();
  });
}

export function fixClockAt(instant: Date): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(instant);
}

export function releaseClock(): void {
  vi.useRealTimers();
}
