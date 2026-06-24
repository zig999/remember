/**
 * resolveDisplayMode — deterministic disclosure heuristic (TC-05).
 *
 * Spec reference: curadoria.feature.spec.md §11 ("Heurística de Disclosure
 * Progressivo — determinística — Regra 5"). The decision MUST be derived
 * from queue-item shape only; no LLM call, no async, no network.
 *
 * Golden Rule 5: routing is deterministic — code answers when code can.
 *
 * Mapping:
 *  - entity_match
 *    * exactly 1 candidate AND top similarity ≥ 0.9     -> "summary"
 *    * else (multiple candidates or low similarity)     -> "full-diff"
 *  - disputed
 *    * exactly 2 sides AND any side has a closed window
 *      (`validTo !== null`) — i.e. no temporal overlap -> "summary"
 *    * else (≥3 sides OR colliding periods)            -> "full-diff"
 *
 * Why this exact heuristic: the spec inlines it as TypeScript. The function
 * here is faithful to that snippet. Any change MUST be raised as a feature-
 * spec CR before touching this file.
 */
import type { ReviewQueueItem } from "../types";

export type DisplayMode = "summary" | "full-diff";

/** Similarity threshold above which a single entity_match candidate is
 *  deemed "obvious" and the panel can collapse into summary mode (§11). */
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
  // disputed
  if (item.sides.length === 2) {
    // Any side that already closes its window means the two cannot overlap
    // any longer — the dispute is between "old value" and "new value", not
    // between simultaneously-asserted facts. Spec §11 calls this "sem
    // sobreposição temporal".
    const noOverlap = item.sides.some((s) => s.validTo !== null);
    if (noOverlap) return "summary";
  }
  return "full-diff";
}
