import type { ReviewQueueItem, ReviewQueueList } from "../types";
import type { SelectedItem } from "../state/curation-store";

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

export function toSelectedItem(item: ReviewQueueItem): SelectedItem | null {
  if (item.kind === "entity_match") {
    return { kind: "entity_match", id: item.nodeId };
  }
  const firstSide = item.sides[0];
  if (firstSide === undefined) return null;
  return { kind: "disputed", id: firstSide.itemId };
}

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

export function neighbour(
  list: ReviewQueueList | undefined,
  selected: SelectedItem | null,
  direction: "next" | "prev",
): SelectedItem | null {
  if (list === undefined || list.items.length === 0) return null;
  const cur = indexOfSelected(list, selected);
  const len = list.items.length;
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
