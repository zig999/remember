import { openReviewIn } from "./entity-form-review-support";

export interface ReviewedEffect {
  readonly key: string;
  readonly previous: string;
  readonly next: string;
  readonly effects: readonly string[];
}

export interface EntryMatch {
  readonly key: string;
  readonly previous?: string;
  readonly next?: string;
}

const ITEM_PREFIX = "entity-review-item-";

function textsIn(item: Element, testId: string): string[] {
  return Array.from(
    item.querySelectorAll(`[data-testid="${testId}"]`),
  ).map((found) => found.textContent ?? "");
}

function reviewedEffectOf(item: Element): ReviewedEffect {
  const key = (item.getAttribute("data-testid") ?? "").slice(ITEM_PREFIX.length);
  return {
    key,
    previous: textsIn(item, `entity-review-previous-${key}`)[0] ?? "",
    next: textsIn(item, `entity-review-new-${key}`)[0] ?? "",
    effects: textsIn(item, `entity-review-effect-${key}`),
  };
}

function ordering(first: ReviewedEffect, second: ReviewedEffect): number {
  return `${first.key}\u0000${first.previous}\u0000${first.next}`.localeCompare(
    `${second.key}\u0000${second.previous}\u0000${second.next}`,
  );
}

export async function reviewedEffectsIn(
  container: HTMLElement,
): Promise<ReviewedEffect[]> {
  const panel = await openReviewIn(container);
  return Array.from(panel.querySelectorAll(`[data-testid^="${ITEM_PREFIX}"]`))
    .map(reviewedEffectOf)
    .sort(ordering);
}

export function entriesWhere(
  entries: readonly ReviewedEffect[],
  match: EntryMatch,
): ReviewedEffect[] {
  return entries.filter(
    (entry) =>
      entry.key === match.key &&
      (match.previous === undefined || entry.previous === match.previous) &&
      (match.next === undefined || entry.next === match.next),
  );
}

export function effectsWhere(
  entries: readonly ReviewedEffect[],
  match: EntryMatch,
): (readonly string[])[] {
  return entriesWhere(entries, match).map((entry) => entry.effects);
}
