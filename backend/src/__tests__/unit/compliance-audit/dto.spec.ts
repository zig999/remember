// Unit tests for compliance-audit DTOs (BR-01, BR-09, BR-10).

import { describe, expect, it } from "vitest";

import {
  ComplianceDeleteRequestSchema,
  ListComplianceDeletionsQuerySchema,
} from "../../../modules/compliance-audit/dto/compliance-delete.dto.js";
import { ListCurationActionsQuerySchema } from "../../../modules/compliance-audit/dto/curation-action.dto.js";
import { REDACTED_LITERAL } from "../../../modules/compliance-audit/service/compliance-audit.service.js";

describe("ComplianceDeleteRequestSchema — BR-01", () => {
  const validId = "8f4a2c10-1d2e-4b3f-9a01-1234567890ab";

  it("accepts a non-empty reason after trim", () => {
    const out = ComplianceDeleteRequestSchema.parse({
      raw_information_id: validId,
      reason: "LGPD request",
    });
    expect(out.reason).toBe("LGPD request");
  });

  it("rejects whitespace-only reason", () => {
    expect(() =>
      ComplianceDeleteRequestSchema.parse({
        raw_information_id: validId,
        reason: "   ",
      })
    ).toThrow();
  });

  it("rejects missing reason", () => {
    expect(() =>
      ComplianceDeleteRequestSchema.parse({ raw_information_id: validId })
    ).toThrow();
  });

  it("rejects reason longer than 1000 chars", () => {
    expect(() =>
      ComplianceDeleteRequestSchema.parse({
        raw_information_id: validId,
        reason: "a".repeat(1001),
      })
    ).toThrow();
  });

  it("rejects malformed raw_information_id", () => {
    expect(() =>
      ComplianceDeleteRequestSchema.parse({
        raw_information_id: "not-a-uuid",
        reason: "fine",
      })
    ).toThrow();
  });

  it("trims surrounding whitespace from reason", () => {
    const out = ComplianceDeleteRequestSchema.parse({
      raw_information_id: validId,
      reason: "  LGPD request   ",
    });
    expect(out.reason).toBe("LGPD request");
  });
});

describe("ListComplianceDeletionsQuerySchema — BR-09 semi-open range", () => {
  it("accepts no filters (uses defaults)", () => {
    const out = ListComplianceDeletionsQuerySchema.parse({});
    expect(out.limit).toBe(50);
    expect(out.offset).toBe(0);
  });

  it("rejects executed_from >= executed_to with custom code", () => {
    const parsed = ListComplianceDeletionsQuerySchema.safeParse({
      executed_from: "2026-06-30T00:00:00Z",
      executed_to: "2026-06-30T00:00:00Z",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some(
          (i) => i.code === "custom" && i.message === "VALIDATION_OUT_OF_RANGE"
        )
      ).toBe(true);
    }
  });

  it("accepts unbounded one-sided range (BR-09)", () => {
    const out = ListComplianceDeletionsQuerySchema.parse({
      executed_from: "2026-06-01T00:00:00Z",
    });
    expect(out.executed_from).toBe("2026-06-01T00:00:00Z");
    expect(out.executed_to).toBeUndefined();
  });

  it("coerces limit/offset from query string", () => {
    const out = ListComplianceDeletionsQuerySchema.parse({
      limit: "25",
      offset: "10",
    });
    expect(out.limit).toBe(25);
    expect(out.offset).toBe(10);
  });

  it("rejects limit > 100", () => {
    expect(() =>
      ListComplianceDeletionsQuerySchema.parse({ limit: "200" })
    ).toThrow();
  });
});

describe("ListCurationActionsQuerySchema — BR-10 enum", () => {
  it("accepts each of the 7 curation tool names", () => {
    const tools = [
      "resolve_entity_match",
      "merge_nodes",
      "resolve_dispute",
      "confirm_item",
      "reject_item",
      "correct_item",
      "compliance_delete",
    ] as const;
    for (const action of tools) {
      const out = ListCurationActionsQuerySchema.parse({ action });
      expect(out.action).toBe(action);
    }
  });

  it("rejects unknown action filter values", () => {
    const parsed = ListCurationActionsQuerySchema.safeParse({
      action: "invalid_action",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects created_from >= created_to with custom code", () => {
    const parsed = ListCurationActionsQuerySchema.safeParse({
      created_from: "2026-06-30T10:00:00Z",
      created_to: "2026-06-30T09:00:00Z",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some(
          (i) => i.code === "custom" && i.message === "VALIDATION_OUT_OF_RANGE"
        )
      ).toBe(true);
    }
  });
});

describe("REDACTED_LITERAL — byte pin (BR-04)", () => {
  it("is exactly the 10-char string `[REDACTED]`", () => {
    // Pin every byte to detect any reformatting / localization drift.
    expect(REDACTED_LITERAL).toBe("[REDACTED]");
    expect(REDACTED_LITERAL.length).toBe(10);
    // UTF-8 byte sequence: 0x5B 0x52 0x45 0x44 0x41 0x43 0x54 0x45 0x44 0x5D
    const bytes = Array.from(new TextEncoder().encode(REDACTED_LITERAL));
    expect(bytes).toEqual([0x5b, 0x52, 0x45, 0x44, 0x41, 0x43, 0x54, 0x45, 0x44, 0x5d]);
  });
});
