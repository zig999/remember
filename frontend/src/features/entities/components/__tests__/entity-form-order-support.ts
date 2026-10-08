import { helpTextsOf } from "./entity-form-support";
import { groupOf } from "./entity-form-multi-support";
import { typeInto } from "./entity-form-value-type-support";
import {
  openReviewIn,
  reviewButtonOf,
  reviewPanelOf,
} from "./entity-form-review-support";
import { typeReason } from "./entity-form-reason-support";
import {
  endInputOf,
  setDate,
  startInputOf,
} from "./entity-form-validity-support";

export const ORDER_MESSAGE = "O início deve ser anterior ao fim.";

export const VALID_REASON = "Corrected after the audit";

export function orderAlertOf(container: HTMLElement, key: string): string | null {
  return (
    groupOf(container, key).querySelector(
      `[data-testid="entity-valid-to-error-${key}"]`,
    )?.textContent ?? null
  );
}

export function endDescribedByMessage(
  container: HTMLElement,
  key: string,
  message: string,
): boolean {
  const end = endInputOf(container, key);
  if (end === null) throw new Error(`no validity end rendered for ${key}`);
  return helpTextsOf(end).includes(message);
}

export async function changeRoleWithValidity(
  container: HTMLElement,
  start: string,
  end: string,
): Promise<void> {
  await typeInto(container, "role", "Open", "Closed");
  if (start !== "") await setDate(startInputOf(container, "role"), start);
  if (end !== "") await setDate(endInputOf(container, "role"), end);
}

export async function offerSaveWithReason(container: HTMLElement): Promise<void> {
  if (reviewPanelOf(container) === null) {
    if (reviewButtonOf(container) === null) return;
    await openReviewIn(container);
  }
  await typeReason(container, VALID_REASON);
}
