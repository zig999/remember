// Unit tests for the curation DTOs.
//
// Acceptance criteria covered (validation.criteria of dev_tc_007):
//   - resolve_dispute(prefer_one) without winner_id -> BUSINESS_DISPUTE_WINNER_REQUIRED
//   - correct_item without changes -> BUSINESS_CORRECTION_NO_CHANGES
//   - merge_nodes with survivor_id === absorbed_id -> BUSINESS_SELF_MERGE_FORBIDDEN
//
// These DTO-level checks run BEFORE the transaction opens (BR-13 layered
// validation, step 1 + step 2).

import { describe, expect, it } from "vitest";

import {
  MergeNodesBodySchema,
  ResolveEntityMatchBodySchema,
} from "../../../modules/curation/dto/entity-match.dto.js";
import { ResolveDisputeBodySchema } from "../../../modules/curation/dto/dispute.dto.js";
import {
  CorrectItemBodySchema,
  RejectItemBodySchema,
} from "../../../modules/curation/dto/item.dto.js";
import { ListReviewQueueQuerySchema } from "../../../modules/curation/dto/queue.dto.js";

const UUID_A = "00000000-0000-4000-8000-000000000001";
const UUID_B = "00000000-0000-4000-8000-000000000002";
const UUID_C = "00000000-0000-4000-8000-000000000003";

describe("ListReviewQueueQuerySchema", () => {
  // BR-03: pagination ranges.
  it("BR-03: defaults limit=20 offset=0 when absent", () => {
    const parsed = ListReviewQueueQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
    expect(parsed.kind).toBeUndefined();
  });

  it("BR-03: rejects limit > 100", () => {
    expect(() =>
      ListReviewQueueQuerySchema.parse({ limit: "250" })
    ).toThrow();
  });

  it("BR-04: rejects unknown kind", () => {
    expect(() =>
      ListReviewQueueQuerySchema.parse({ kind: "unknown_kind" })
    ).toThrow();
  });

  it("BR-04: accepts kind=entity_match", () => {
    const parsed = ListReviewQueueQuerySchema.parse({ kind: "entity_match" });
    expect(parsed.kind).toBe("entity_match");
  });
});

describe("ResolveEntityMatchBodySchema", () => {
  // BR-11: reason mandatory on merge_into.
  it("BR-11: merge_into without reason fails (BUSINESS_REASON_REQUIRED)", () => {
    const result = ResolveEntityMatchBodySchema.safeParse({
      decision: "merge_into",
      target_node_id: UUID_A,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_REASON_REQUIRED");
    }
  });

  // merge_into requires target_node_id.
  it("merge_into without target_node_id fails (BUSINESS_TARGET_NODE_REQUIRED)", () => {
    const result = ResolveEntityMatchBodySchema.safeParse({
      decision: "merge_into",
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_TARGET_NODE_REQUIRED");
    }
  });

  it("keep_separate without reason succeeds", () => {
    const result = ResolveEntityMatchBodySchema.safeParse({
      decision: "keep_separate",
    });
    expect(result.success).toBe(true);
  });
});

describe("MergeNodesBodySchema", () => {
  // BR-23: self-merge forbidden at request shape.
  it("BR-23: survivor_id === absorbed_id fails (BUSINESS_SELF_MERGE_FORBIDDEN)", () => {
    const result = MergeNodesBodySchema.safeParse({
      survivor_id: UUID_A,
      absorbed_id: UUID_A,
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_SELF_MERGE_FORBIDDEN");
    }
  });

  // BR-11: reason required.
  it("BR-11: missing reason fails", () => {
    const result = MergeNodesBodySchema.safeParse({
      survivor_id: UUID_A,
      absorbed_id: UUID_B,
    });
    expect(result.success).toBe(false);
  });

  it("BR-11: empty reason fails", () => {
    const result = MergeNodesBodySchema.safeParse({
      survivor_id: UUID_A,
      absorbed_id: UUID_B,
      reason: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("valid input succeeds", () => {
    const result = MergeNodesBodySchema.safeParse({
      survivor_id: UUID_A,
      absorbed_id: UUID_B,
      reason: "valid reason",
    });
    expect(result.success).toBe(true);
  });
});

describe("ResolveDisputeBodySchema", () => {
  // BR-15: prefer_one without winner_id -> BUSINESS_DISPUTE_WINNER_REQUIRED.
  it("BR-15: prefer_one without winner_id fails (BUSINESS_DISPUTE_WINNER_REQUIRED)", () => {
    const result = ResolveDisputeBodySchema.safeParse({
      item_kind: "attribute",
      item_ids: [UUID_A, UUID_B],
      decision: "prefer_one",
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_DISPUTE_WINNER_REQUIRED");
    }
  });

  // BR-15: prefer_one with winner_id outside item_ids -> WINNER_REQUIRED.
  it("BR-15: prefer_one with winner_id not in item_ids fails", () => {
    const result = ResolveDisputeBodySchema.safeParse({
      item_kind: "attribute",
      item_ids: [UUID_A, UUID_B],
      decision: "prefer_one",
      winner_id: UUID_C,
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_DISPUTE_WINNER_REQUIRED");
    }
  });

  // BR-16: adjust_periods requires periods[].
  it("BR-16: adjust_periods without periods fails (BUSINESS_DISPUTE_PERIODS_REQUIRED)", () => {
    const result = ResolveDisputeBodySchema.safeParse({
      item_kind: "link",
      item_ids: [UUID_A, UUID_B],
      decision: "adjust_periods",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_DISPUTE_PERIODS_REQUIRED");
    }
  });

  // BR-16: adjust_periods semi-open invariant.
  it("BR-16: adjust_periods with valid_from >= valid_to fails (BUSINESS_TEMPORAL_INCOHERENT)", () => {
    const result = ResolveDisputeBodySchema.safeParse({
      item_kind: "attribute",
      item_ids: [UUID_A, UUID_B],
      decision: "adjust_periods",
      periods: [
        { item_id: UUID_A, valid_from: "2026-07-01", valid_to: "2026-06-01" },
        { item_id: UUID_B, valid_from: "2026-01-01", valid_to: null },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_TEMPORAL_INCOHERENT");
    }
  });

  // BR-15: prefer_one — reason mandatory.
  it("BR-11: prefer_one without reason fails (BUSINESS_REASON_REQUIRED)", () => {
    const result = ResolveDisputeBodySchema.safeParse({
      item_kind: "attribute",
      item_ids: [UUID_A, UUID_B],
      decision: "prefer_one",
      winner_id: UUID_A,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_REASON_REQUIRED");
    }
  });

  it("keep_disputed with no reason succeeds", () => {
    const result = ResolveDisputeBodySchema.safeParse({
      item_kind: "attribute",
      item_ids: [UUID_A, UUID_B],
      decision: "keep_disputed",
    });
    expect(result.success).toBe(true);
  });

  it("adjust_periods one-to-one OK + semi-open invariant OK succeeds", () => {
    const result = ResolveDisputeBodySchema.safeParse({
      item_kind: "attribute",
      item_ids: [UUID_A, UUID_B],
      decision: "adjust_periods",
      periods: [
        { item_id: UUID_A, valid_from: "2026-01-01", valid_to: "2026-06-01" },
        { item_id: UUID_B, valid_from: "2026-06-01", valid_to: null },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("CorrectItemBodySchema", () => {
  // BR-17: corrected{} non-empty.
  it("BR-17: empty corrected fails (BUSINESS_CORRECTION_NO_CHANGES)", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: {},
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_CORRECTION_NO_CHANGES");
    }
  });

  // BR-17: link cannot supply `value`.
  it("BR-17: link with corrected.value fails", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "link",
      item_id: UUID_A,
      corrected: { value: "anything" },
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
  });

  // BR-17: attribute cannot supply target_node_id.
  it("BR-17: attribute with corrected.target_node_id fails", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: { target_node_id: UUID_B },
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
  });

  // BR-17: valid_from change requires valid_from_source.
  it("BR-17: valid_from without valid_from_source fails (BUSINESS_DATE_UNJUSTIFIED)", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: { valid_from: "2026-07-01" },
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_DATE_UNJUSTIFIED");
    }
  });

  // BR-17: stated requires fragment_id.
  it("BR-17: valid_from_source=stated without fragment_id fails", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: {
        valid_from: "2026-07-01",
        valid_from_source: "stated",
      },
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_DATE_UNJUSTIFIED");
    }
  });

  it("attribute correction with value only succeeds", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: { value: "2026-07-16" },
      reason: "Errata received",
    });
    expect(result.success).toBe(true);
  });

  it("valid_from with document justification succeeds (no fragment_id required)", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: {
        valid_from: "2026-07-01",
        valid_from_source: "document",
      },
      reason: "valid reason",
    });
    expect(result.success).toBe(true);
  });

  it("stated with fragment_id succeeds", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: {
        valid_from: "2026-07-01",
        valid_from_source: "stated",
        valid_from_fragment_id: UUID_B,
      },
      reason: "valid reason",
    });
    expect(result.success).toBe(true);
  });

  // Semi-open invariant.
  it("BR-17: valid_from >= valid_to fails (BUSINESS_TEMPORAL_INCOHERENT)", () => {
    const result = CorrectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      corrected: {
        valid_from: "2026-07-01",
        valid_to: "2026-06-01",
        valid_from_source: "document",
      },
      reason: "valid reason",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i) => i.message);
      expect(codes).toContain("BUSINESS_TEMPORAL_INCOHERENT");
    }
  });
});

describe("RejectItemBodySchema", () => {
  // BR-11: reason mandatory.
  it("BR-11: empty reason fails", () => {
    const result = RejectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      reason: "  ",
    });
    expect(result.success).toBe(false);
  });

  it("valid input succeeds", () => {
    const result = RejectItemBodySchema.safeParse({
      item_kind: "attribute",
      item_id: UUID_A,
      reason: "Hallucinated from header",
    });
    expect(result.success).toBe(true);
  });
});
