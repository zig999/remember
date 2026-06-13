// TC-FR-002 — Regression: the caller-supplied `valid_from_basis` enum on the
// `propose_link` / `propose_attribute` DTOs accepts only `stated` and
// `document`. The third value, `received`, is a backend-only fallback
// applied by the temporal validator (see `validation/temporal.ts`) and must
// be rejected at the API boundary.
//
// BR-16 (§13 — Temporal validation): callers justify dates with `stated` or
// `document`. The BFF supplies `received` internally as the last-resort
// fallback (§6.5 / A14). Allowing callers to send `received` would let the
// LLM bypass the textual/document justification chain and quietly claim a
// fallback that should be earned by the validator — breaking the
// anti-hallucination guarantee.

import { describe, expect, it } from "vitest";

import {
  ProposeAttributeInputSchema,
} from "../../../modules/ingestion/dto/propose-attribute.dto.js";
import {
  ProposeLinkInputSchema,
  ValidFromBasisSchema,
} from "../../../modules/ingestion/dto/propose-link.dto.js";

// Real RFC-4122 v4 UUIDs (Zod v4's `.uuid()` validator pins the version nibble
// to 1-8 and the variant nibble to 8/9/a/b — synthetic "1111-..." strings are
// rejected).
const SOURCE_NODE_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const TARGET_NODE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const FRAGMENT_ID = "cccccccc-cccc-4ccc-9ccc-cccccccccccc";

const LINK_INPUT_BASE = {
  source_node_id: SOURCE_NODE_ID,
  link_type: "located_in",
  target_node_id: TARGET_NODE_ID,
  confidence: 0.9,
  fragment_ids: [FRAGMENT_ID],
  valid_from: "2026-01-01",
} as const;

const ATTR_INPUT_BASE = {
  node_id: SOURCE_NODE_ID,
  key: "headcount",
  value: "42",
  confidence: 0.9,
  fragment_ids: [FRAGMENT_ID],
  valid_from: "2026-01-01",
} as const;

describe("ValidFromBasisSchema (TC-FR-002 — caller-supplied enum)", () => {
  // BR-16: the caller-supplied basis is closed to two values.
  it("accepts 'stated'", () => {
    expect(ValidFromBasisSchema.safeParse("stated").success).toBe(true);
  });

  it("accepts 'document'", () => {
    expect(ValidFromBasisSchema.safeParse("document").success).toBe(true);
  });

  it("rejects 'received' — that value is the BFF-internal fallback only", () => {
    const result = ValidFromBasisSchema.safeParse("received");
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary strings", () => {
    expect(ValidFromBasisSchema.safeParse("inferred").success).toBe(false);
    expect(ValidFromBasisSchema.safeParse("").success).toBe(false);
  });
});

describe("ProposeLinkInputSchema rejects valid_from_basis='received' (TC-FR-002)", () => {
  // BR-16 / §6.5 / A14: the LLM must never claim the BFF fallback directly.
  it("rejects the payload at the Zod boundary", () => {
    const parsed = ProposeLinkInputSchema.safeParse({
      ...LINK_INPUT_BASE,
      valid_from_basis: "received",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const onValidFromBasis = parsed.error.issues.some((i) =>
        i.path.includes("valid_from_basis")
      );
      expect(onValidFromBasis).toBe(true);
    }
  });

  it("still accepts 'stated' and 'document' (no regression)", () => {
    expect(
      ProposeLinkInputSchema.safeParse({
        ...LINK_INPUT_BASE,
        valid_from_basis: "stated",
      }).success
    ).toBe(true);
    expect(
      ProposeLinkInputSchema.safeParse({
        ...LINK_INPUT_BASE,
        valid_from_basis: "document",
      }).success
    ).toBe(true);
  });
});

describe("ProposeAttributeInputSchema rejects valid_from_basis='received' (TC-FR-002)", () => {
  // The attribute DTO imports the same `ValidFromBasisSchema` from the link
  // DTO, so this is the matching coverage on the second tool surface.
  it("rejects the payload at the Zod boundary", () => {
    const parsed = ProposeAttributeInputSchema.safeParse({
      ...ATTR_INPUT_BASE,
      valid_from_basis: "received",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const onValidFromBasis = parsed.error.issues.some((i) =>
        i.path.includes("valid_from_basis")
      );
      expect(onValidFromBasis).toBe(true);
    }
  });

  it("still accepts 'stated' and 'document' (no regression)", () => {
    expect(
      ProposeAttributeInputSchema.safeParse({
        ...ATTR_INPUT_BASE,
        valid_from_basis: "stated",
      }).success
    ).toBe(true);
    expect(
      ProposeAttributeInputSchema.safeParse({
        ...ATTR_INPUT_BASE,
        valid_from_basis: "document",
      }).success
    ).toBe(true);
  });
});
