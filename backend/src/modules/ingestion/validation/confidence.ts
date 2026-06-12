// Confidence routing (BR-17 of `ingestion.back.md`, A13 of v7).
//
//   confidence >= 0.75            -> assertion status = 'active'
//   0.40 <= confidence < 0.75     -> assertion status = 'uncertain'
//   confidence < 0.40             -> link/attribute NOT created;
//                                    supporting fragments stay `proposed`,
//                                    surfaced with `low_confidence` flag.
//
// The third branch is NOT a 5-layer validation failure — it is a business
// result. The handler turns it into `{ ok: true, result: { outcome: "rejected",
// reason: "BELOW_CONFIDENCE_FLOOR" } }` and records the `tool_call` with
// `validation_outcome = 'rejected'`.

export const CONFIDENCE_FLOOR = 0.4 as const;
export const CONFIDENCE_UNCERTAIN_UPPER = 0.75 as const;

/** Status to write on the created assertion (link or attribute). */
export type ConfidenceRoute =
  | { kind: "active" }
  | { kind: "uncertain" }
  | { kind: "below_floor" };

/** Classify the LLM-reported confidence into one of the three routing buckets. */
export function routeConfidence(confidence: number): ConfidenceRoute {
  if (confidence >= CONFIDENCE_UNCERTAIN_UPPER) return { kind: "active" };
  if (confidence >= CONFIDENCE_FLOOR) return { kind: "uncertain" };
  return { kind: "below_floor" };
}
