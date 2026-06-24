/**
 * resolveDisplayMode — purity + threshold tests (TC-05).
 *
 * Why each test (Rule 9 — encode the WHY):
 *  - entity_match: exactly 1 candidate ≥ 0.9 -> summary. The threshold is the
 *    contract of "obvious match"; any change MUST come via spec CR.
 *  - entity_match: 1 candidate just below 0.9 -> full-diff. Encodes the
 *    boundary so a sloppy refactor that flips `>=` to `>` is caught.
 *  - entity_match: multiple candidates -> full-diff regardless of top
 *    similarity. The spec says "1 candidate" — adding a high-confidence
 *    top to a multi-candidate list does NOT degrade the curator to summary.
 *  - entity_match: zero candidates -> full-diff. Defensive: the spec snippet
 *    indexes `candidates[0]` which can be undefined; a regression that
 *    returned "summary" here would hide the absence of competition.
 *  - disputed: 2 sides, one with validTo != null -> summary. "Sem
 *    sobreposição" is the WHY: old vs new, not simultaneous claims.
 *  - disputed: 2 sides both open -> full-diff. The competition is live.
 *  - disputed: 3+ sides -> full-diff. Multi-way collision can never be
 *    summarized.
 *  - purity: same input -> same output (no hidden state).
 */
import { describe, it, expect } from "vitest";
import { resolveDisplayMode } from "../display-mode";
import type {
  EntityMatchQueueItem,
  DisputeQueueItem,
} from "../../types";

function buildEntity(
  similarities: ReadonlyArray<number>,
): EntityMatchQueueItem {
  return {
    kind: "entity_match",
    nodeId: "n1",
    nodeType: "Person",
    canonicalName: "Maria",
    candidates: similarities.map((s, i) => ({
      candidateNodeId: `c${i}`,
      canonicalName: `Cand ${i}`,
      similarity: s,
    })),
    createdAt: new Date(0),
  };
}

function buildDispute(
  validTos: ReadonlyArray<Date | null>,
): DisputeQueueItem {
  return {
    kind: "disputed",
    itemKind: "attribute",
    scope: {
      sourceNodeId: null,
      targetNodeId: null,
      linkType: null,
      nodeId: "n1",
      attributeKey: "role",
    },
    sides: validTos.map((vt, i) => ({
      itemId: `s${i}`,
      value: `v${i}`,
      targetNodeId: null,
      validFrom: new Date(0),
      validTo: vt,
      validFromSource: "stated" as const,
      confidence: 0.8,
      status: "disputed" as const,
    })),
    createdAt: new Date(0),
  };
}

describe("resolveDisplayMode — entity_match", () => {
  it("returns 'summary' for 1 candidate with similarity ≥ 0.9", () => {
    expect(resolveDisplayMode(buildEntity([0.92]))).toBe("summary");
  });

  it("treats exactly 0.9 as eligible for summary (boundary >=)", () => {
    expect(resolveDisplayMode(buildEntity([0.9]))).toBe("summary");
  });

  it("returns 'full-diff' for 1 candidate just below 0.9", () => {
    expect(resolveDisplayMode(buildEntity([0.89]))).toBe("full-diff");
  });

  it("returns 'full-diff' for multiple candidates even if top ≥ 0.9", () => {
    expect(resolveDisplayMode(buildEntity([0.95, 0.7]))).toBe("full-diff");
  });

  it("returns 'full-diff' for zero candidates (defensive)", () => {
    expect(resolveDisplayMode(buildEntity([]))).toBe("full-diff");
  });
});

describe("resolveDisplayMode — disputed", () => {
  it("returns 'summary' for 2 sides with at least one closed window", () => {
    expect(
      resolveDisplayMode(buildDispute([new Date("2023-01-01"), null])),
    ).toBe("summary");
  });

  it("returns 'full-diff' for 2 sides both open (live overlap)", () => {
    expect(resolveDisplayMode(buildDispute([null, null]))).toBe("full-diff");
  });

  it("returns 'full-diff' for ≥3 sides regardless of windows", () => {
    expect(
      resolveDisplayMode(
        buildDispute([new Date("2023-01-01"), null, null]),
      ),
    ).toBe("full-diff");
  });
});

describe("resolveDisplayMode — purity", () => {
  it("returns the same result on repeated calls with the same input", () => {
    const item = buildEntity([0.95]);
    const a = resolveDisplayMode(item);
    const b = resolveDisplayMode(item);
    expect(a).toBe(b);
  });
});
