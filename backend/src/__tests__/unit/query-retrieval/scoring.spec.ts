// Unit tests for the layer-weight constants — BR-07 / BR-02 of `.spec.md`.
//
// These tests are intentionally tiny: the contract is that the three
// constants exist, are typed as compile-time numeric literals, and that
// their ORDER (fragment > node > chunk) remains invariant. Changing this
// ordering is a calibration decision that requires deliberate spec review.

import { describe, expect, it } from "vitest";

import {
  LAYER_WEIGHT_CHUNK,
  LAYER_WEIGHT_FRAGMENT,
  LAYER_WEIGHT_NODE,
} from "../../../modules/query-retrieval/repository/scoring.js";

describe("layer weights — BR-07 (constants + ordering)", () => {
  it("exposes the documented numeric values", () => {
    // The exact values appear in the spec / OpenAPI examples; changing
    // them changes ranking calibration and is therefore a spec change.
    expect(LAYER_WEIGHT_FRAGMENT).toBe(1.0);
    expect(LAYER_WEIGHT_NODE).toBe(0.9);
    expect(LAYER_WEIGHT_CHUNK).toBe(0.6);
  });

  it("enforces the fragment > node > chunk ordering invariant", () => {
    // Cenario C12 / BR-02 of `.spec.md`: identical-score-from-rank-cd hits
    // MUST rank fragment above node above chunk so that the search list
    // privileges the most authoritative layer.
    expect(LAYER_WEIGHT_FRAGMENT).toBeGreaterThan(LAYER_WEIGHT_NODE);
    expect(LAYER_WEIGHT_NODE).toBeGreaterThan(LAYER_WEIGHT_CHUNK);
  });

  it("keeps weights inside [0, 1] for ts_rank_cd composition", () => {
    for (const w of [LAYER_WEIGHT_FRAGMENT, LAYER_WEIGHT_NODE, LAYER_WEIGHT_CHUNK]) {
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });
});
