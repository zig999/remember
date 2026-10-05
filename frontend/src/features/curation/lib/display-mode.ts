import type { ReviewQueueItem } from "../types";

export type DisplayMode = "summary" | "full-diff";

export const HIGH_SIMILARITY_THRESHOLD = 0.9;

export function resolveDisplayMode(item: ReviewQueueItem): DisplayMode {
  if (item.kind === "entity_match") {
    if (item.candidates.length === 1) {
      const top = item.candidates[0];
      if (top !== undefined && top.similarity >= HIGH_SIMILARITY_THRESHOLD) {
        return "summary";
      }
    }
    return "full-diff";
  }
  if (item.sides.length === 2) {
    const noOverlap = item.sides.some((s) => s.validTo !== null);
    if (noOverlap) return "summary";
  }
  return "full-diff";
}
