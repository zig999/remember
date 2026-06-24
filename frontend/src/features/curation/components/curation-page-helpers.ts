/**
 * Pure helpers for CurationPage (TC-04).
 *
 * Extracted into its own file (no React, no TanStack imports) so unit
 * tests can pin the deep-link + auto-select rules without paying the
 * cost of standing up a router/QueryClient harness. The
 * CurationPage.tsx imports these and uses them verbatim.
 *
 * The two rules locked here:
 *  1. `findItemInQueue` — given a `SelectedItem` (kind:id), is it
 *     present in the current queue? Used for deep-link verification.
 *  2. `deriveInitialSelection` — what should the page select on the
 *     first queue resolve? deep-link wins if it points at a real item,
 *     else first item, else null (UI-07).
 */

import type { ReviewQueueItem, ReviewQueueList } from "../types";
import type { SelectedItem } from "../state/curation-store";

/**
 * Look up a `SelectedItem` inside a resolved queue. Returns the
 * matching item or `null` when not found.
 *
 * - entity_match: matches by `node_id`.
 * - disputed: matches when any `sides[].itemId` equals `target.id`.
 *   (A dispute item carries multiple sides; the deep-link addresses
 *   a single side, so any-side match counts.)
 */
export function findItemInQueue(
  list: ReviewQueueList | undefined,
  target: SelectedItem | null,
): ReviewQueueItem | null {
  if (list === undefined || target === null) return null;
  for (const item of list.items) {
    if (target.kind === "entity_match" && item.kind === "entity_match") {
      if (item.nodeId === target.id) return item;
    } else if (target.kind === "disputed" && item.kind === "disputed") {
      const matches = item.sides.some((s) => s.itemId === target.id);
      if (matches) return item;
    }
  }
  return null;
}

/**
 * Decide which item to select on queue resolve.
 *
 *   1. If `deepLink` matches an item in the queue → that item.
 *   2. Else if queue has items → the first one.
 *   3. Else → null (UI-07 EmptyQueue).
 *
 * `undefined` for the list represents "queue still loading" — must
 * return null so the auto-select effect never fires prematurely.
 */
export function deriveInitialSelection(
  list: ReviewQueueList | undefined,
  deepLink: SelectedItem | null,
): SelectedItem | null {
  if (list === undefined || list.items.length === 0) return null;
  const found = findItemInQueue(list, deepLink);
  if (found !== null) return deepLink;
  const first = list.items[0];
  if (first === undefined) return null;
  if (first.kind === "entity_match") {
    return { kind: "entity_match", id: first.nodeId };
  }
  const firstSide = first.sides[0];
  if (firstSide === undefined) return null;
  return { kind: "disputed", id: firstSide.itemId };
}
