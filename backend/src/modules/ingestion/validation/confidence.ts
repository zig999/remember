export const CONFIDENCE_FLOOR = 0.4 as const;
export const CONFIDENCE_UNCERTAIN_UPPER = 0.75 as const;

/** Status to write on the created assertion (link or attribute). */
export type ConfidenceRoute =
  | { kind: "active" }
  | { kind: "uncertain" }
  | { kind: "below_floor" };

export function routeConfidence(confidence: number): ConfidenceRoute {
  if (confidence >= CONFIDENCE_UNCERTAIN_UPPER) return { kind: "active" };
  if (confidence >= CONFIDENCE_FLOOR) return { kind: "uncertain" };
  return { kind: "below_floor" };
}
