import { act } from "react";

export interface ReviewedField {
  readonly key: string;
  readonly previous: string;
  readonly next: string;
  readonly start: string | null;
  readonly end: string | null;
}

const ITEM_PREFIX = "entity-review-item-";

export function reviewButtonOf(
  container: HTMLElement,
): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(
    '[data-testid="entity-review-button"]',
  );
}

export function reviewPanelOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('[data-testid="entity-review"]');
}

export function reviewOfferedIn(container: HTMLElement): boolean {
  return reviewButtonOf(container) !== null || reviewPanelOf(container) !== null;
}

export async function openReviewIn(container: HTMLElement): Promise<HTMLElement> {
  const button = reviewButtonOf(container);
  if (button === null) throw new Error("no review is offered to open");
  await act(async () => {
    button.click();
  });
  const panel = reviewPanelOf(container);
  if (panel === null) {
    throw new Error("activating the review control opened no review");
  }
  return panel;
}

function textIn(item: Element, testId: string): string | null {
  return (
    item.querySelector(`[data-testid="${testId}"]`)?.textContent ?? null
  );
}

function reviewedFieldOf(item: Element): ReviewedField {
  const key = (item.getAttribute("data-testid") ?? "").slice(ITEM_PREFIX.length);
  return {
    key,
    previous: textIn(item, `entity-review-previous-${key}`) ?? "",
    next: textIn(item, `entity-review-new-${key}`) ?? "",
    start: textIn(item, `entity-review-valid-from-${key}`),
    end: textIn(item, `entity-review-valid-to-${key}`),
  };
}

function ordering(first: ReviewedField, second: ReviewedField): number {
  return `${first.key}\u0000${first.previous}`.localeCompare(
    `${second.key}\u0000${second.previous}`,
  );
}

export async function reviewedFieldsIn(
  container: HTMLElement,
): Promise<ReviewedField[]> {
  const panel = await openReviewIn(container);
  return Array.from(
    panel.querySelectorAll(`[data-testid^="${ITEM_PREFIX}"]`),
  )
    .map(reviewedFieldOf)
    .sort(ordering);
}
