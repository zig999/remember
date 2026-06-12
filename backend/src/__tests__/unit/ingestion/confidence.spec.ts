// BR-17 confidence routing (TC-03 acceptance criterion):
// "propose_link with confidence <0.40 returns ok:true with outcome=rejected
//  reason=BELOW_CONFIDENCE_FLOOR".
//
// Also pins the bucket boundaries documented in `ingestion.back.md` BR-17 +
// A13:
//   >= 0.75            -> active
//   0.40 <= c < 0.75   -> uncertain
//   < 0.40             -> below_floor (link/attribute NOT created)

import { describe, expect, it } from "vitest";

import {
  CONFIDENCE_FLOOR,
  CONFIDENCE_UNCERTAIN_UPPER,
  routeConfidence,
} from "../../../modules/ingestion/validation/confidence.js";

describe("routeConfidence (BR-17)", () => {
  it("routes a high-confidence (>= 0.75) to 'active'", () => {
    expect(routeConfidence(0.75)).toEqual({ kind: "active" });
    expect(routeConfidence(0.9)).toEqual({ kind: "active" });
    expect(routeConfidence(1)).toEqual({ kind: "active" });
  });

  it("routes mid-confidence (0.40 <= c < 0.75) to 'uncertain'", () => {
    expect(routeConfidence(0.4)).toEqual({ kind: "uncertain" });
    expect(routeConfidence(0.5)).toEqual({ kind: "uncertain" });
    expect(routeConfidence(0.749999)).toEqual({ kind: "uncertain" });
  });

  it("routes sub-floor (< 0.40) to 'below_floor'", () => {
    expect(routeConfidence(0)).toEqual({ kind: "below_floor" });
    expect(routeConfidence(0.39)).toEqual({ kind: "below_floor" });
    expect(routeConfidence(0.399999)).toEqual({ kind: "below_floor" });
  });

  it("the published constants exactly match the spec", () => {
    // A13: floor=0.40, upper=0.75. Pinned by the spec table.
    expect(CONFIDENCE_FLOOR).toBe(0.4);
    expect(CONFIDENCE_UNCERTAIN_UPPER).toBe(0.75);
  });
});
