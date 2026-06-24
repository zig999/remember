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
 * Convert a `ReviewQueueItem` into its addressable `SelectedItem` form.
 * Used by keyboard navigation (j/k, 1..9) so the page can map index
 * lookups in the queue back into the selection store.
 *
 * Returns `null` for disputed items with no sides (defensive — the
 * BFF guarantees ≥ 1 side, but we don't crash if that ever drifts).
 */
export function toSelectedItem(item: ReviewQueueItem): SelectedItem | null {
  if (item.kind === "entity_match") {
    return { kind: "entity_match", id: item.nodeId };
  }
  const firstSide = item.sides[0];
  if (firstSide === undefined) return null;
  return { kind: "disputed", id: firstSide.itemId };
}

/**
 * Return the queue index that matches the current selection — or `-1`
 * when there is no selection / no match.
 */
export function indexOfSelected(
  list: ReviewQueueList | undefined,
  selected: SelectedItem | null,
): number {
  if (list === undefined || selected === null) return -1;
  for (let i = 0; i < list.items.length; i += 1) {
    const item = list.items[i];
    if (item === undefined) continue;
    if (selected.kind === "entity_match" && item.kind === "entity_match") {
      if (item.nodeId === selected.id) return i;
    } else if (selected.kind === "disputed" && item.kind === "disputed") {
      if (item.sides.some((s) => s.itemId === selected.id)) return i;
    }
  }
  return -1;
}

/**
 * Find the next/previous queue item relative to the current selection.
 * Wraps around the queue boundaries so j on the last item lands back
 * on the first — matches the spec's "list is a ring" feel (BDD §9
 * Scenario 8 implies wrap-around with `j` on the last item).
 */
export function neighbour(
  list: ReviewQueueList | undefined,
  selected: SelectedItem | null,
  direction: "next" | "prev",
): SelectedItem | null {
  if (list === undefined || list.items.length === 0) return null;
  const cur = indexOfSelected(list, selected);
  const len = list.items.length;
  // When nothing is selected, j → first, k → last.
  const idx =
    cur === -1
      ? direction === "next"
        ? 0
        : len - 1
      : direction === "next"
        ? (cur + 1) % len
        : (cur - 1 + len) % len;
  const target = list.items[idx];
  if (target === undefined) return null;
  return toSelectedItem(target);
}

/**
 * 1-indexed item lookup (matches the spec's `1..9` shortcut: "1 =
 * primeiro item"). Returns null if the index is out of range or the
 * queue does not have that many items.
 */
export function selectByIndex(
  list: ReviewQueueList | undefined,
  oneBasedIndex: number,
): SelectedItem | null {
  if (list === undefined) return null;
  if (oneBasedIndex < 1 || oneBasedIndex > 9) return null;
  const target = list.items[oneBasedIndex - 1];
  if (target === undefined) return null;
  return toSelectedItem(target);
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
