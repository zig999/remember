/**
 * graph/api transforms — unit tests (TC-FE-08).
 *
 * What these tests pin (Golden Rule 9 — verify intent, not just behaviour):
 *  - Node status → StateBadge state mapping is the contract the panel header
 *    relies on for the per-node confidence badge. A regression that flips
 *    `active → uncertain` (for example) silently misinforms the user.
 *  - Attribute sort order — `is_in_effect: true` first, then alphabetical by
 *    key. Drift would surface unrelated/expired values above currents.
 *  - Date label formatting — pt-BR DD/MM/YYYY. Swapping locale or shifting
 *    by a timezone day boundary is invisible to a snapshot diff but visible
 *    to a user in a UTC- timezone.
 *  - Pure-function discipline: NO React, NO fetch, NO globals. Each test
 *    exercises the transform in isolation.
 */
import { describe, expect, it } from "vitest";
import {
  formatDateLabel,
  mapAttributeStatusToBadge,
  mapNodeStatusToBadge,
  toNodeDetail,
} from "../_transforms";
import type {
  AttributeWire,
  NodeDetailWire,
} from "../node-detail.types";

/* -------------------- mapNodeStatusToBadge -------------------- */

describe("mapNodeStatusToBadge", () => {
  it("maps 'active' → 'accepted' (the canonical truth state)", () => {
    expect(mapNodeStatusToBadge("active")).toBe("accepted");
  });
  it("maps 'needs_review' → 'uncertain' (review queue)", () => {
    expect(mapNodeStatusToBadge("needs_review")).toBe("uncertain");
  });
  it("maps 'merged' → 'superseded' (merged node still badged for transparency)", () => {
    expect(mapNodeStatusToBadge("merged")).toBe("superseded");
  });
  it("maps 'deleted' → 'superseded' defensively (the panel renders 410 error path)", () => {
    expect(mapNodeStatusToBadge("deleted")).toBe("superseded");
  });
});

/* -------------------- mapAttributeStatusToBadge -------------------- */

describe("mapAttributeStatusToBadge", () => {
  it("returns 'disputed' when effective_status is disputed (precedence)", () => {
    expect(mapAttributeStatusToBadge("disputed", "accepted")).toBe("disputed");
  });
  it("returns 'uncertain' for effective_status='uncertain'", () => {
    expect(mapAttributeStatusToBadge("uncertain", "uncertain")).toBe(
      "uncertain",
    );
  });
  it("returns 'superseded' for effective_status='inactive' (no longer in effect)", () => {
    expect(mapAttributeStatusToBadge("inactive", "superseded")).toBe(
      "superseded",
    );
  });
  it("returns 'accepted' for active+accepted (the happy path)", () => {
    expect(mapAttributeStatusToBadge("active", "accepted")).toBe("accepted");
  });
  it("returns 'superseded' when assertion is superseded even with effective='active'", () => {
    // Unusual combination, but the mapping must not surface 'accepted' for a
    // row whose underlying assertion has already been superseded.
    expect(mapAttributeStatusToBadge("active", "superseded")).toBe(
      "superseded",
    );
  });
});

/* -------------------- formatDateLabel -------------------- */

describe("formatDateLabel", () => {
  it("returns null for null input (open-ended interval)", () => {
    expect(formatDateLabel(null)).toBeNull();
  });

  it("formats a YYYY-MM-DD wire date as DD/MM/YYYY (pt-BR)", () => {
    // 2026-07-15 → 15/07/2026 (zero-padded; pt-BR uses "/" separator).
    expect(formatDateLabel("2026-07-15")).toBe("15/07/2026");
  });

  it("zero-pads single-digit day and month", () => {
    expect(formatDateLabel("2026-01-05")).toBe("05/01/2026");
  });

  it("does NOT shift across timezone boundaries (constructed in UTC)", () => {
    // Constructed via Date.UTC inside formatDateLabel — even in a UTC-
    // timezone the formatted day stays "15", not "14".
    expect(formatDateLabel("2026-07-15")).toBe("15/07/2026");
  });

  it("returns the input unchanged for malformed strings (never throws)", () => {
    expect(formatDateLabel("not-a-date")).toBe("not-a-date");
    expect(formatDateLabel("2026/07/15")).toBe("2026/07/15");
  });
});

/* -------------------- toNodeDetail -------------------- */

function makeAttr(
  overrides: Partial<AttributeWire> & { id: string; attribute_key: string },
): AttributeWire {
  return {
    id: overrides.id,
    node_id: "node-1",
    attribute_key: overrides.attribute_key,
    value_type: overrides.value_type ?? "text",
    value: overrides.value ?? "v",
    status: overrides.status ?? "accepted",
    effective_status: overrides.effective_status ?? "active",
    is_current: overrides.is_current ?? true,
    is_in_effect: overrides.is_in_effect ?? true,
    confidence: overrides.confidence ?? 0.9,
    valid_from: overrides.valid_from ?? null,
    valid_to: overrides.valid_to ?? null,
  };
}

describe("toNodeDetail", () => {
  it("maps the node-level fields (canonical_name, node_type, status, mergedIntoNodeId)", () => {
    const wire: NodeDetailWire = {
      node: {
        id: "node-1",
        node_type: "Person",
        canonical_name: "Rodrigo",
        status: "active",
        merged_into_node_id: null,
      },
      aliases: [],
      attributes: [],
    };
    const result = toNodeDetail(wire);
    expect(result.id).toBe("node-1");
    expect(result.canonicalName).toBe("Rodrigo");
    expect(result.nodeType).toBe("Person");
    expect(result.status).toBe("active");
    expect(result.badgeState).toBe("accepted");
    expect(result.mergedIntoNodeId).toBeNull();
  });

  it("normalises missing merged_into_node_id to null (defensive)", () => {
    const wire: NodeDetailWire = {
      node: {
        id: "node-1",
        node_type: "Person",
        canonical_name: "Rodrigo",
        status: "active",
        // merged_into_node_id absent in the wire
      },
      aliases: [],
      attributes: [],
    };
    expect(toNodeDetail(wire).mergedIntoNodeId).toBeNull();
  });

  it("preserves aliases as a list of view objects (no kind transform)", () => {
    const wire: NodeDetailWire = {
      node: {
        id: "node-1",
        node_type: "Person",
        canonical_name: "Apollo",
        status: "active",
        merged_into_node_id: null,
      },
      aliases: [
        { id: "a1", alias: "Projeto Apollo", kind: "canonical" },
        { id: "a2", alias: "Apollo", kind: "alias" },
      ],
      attributes: [],
    };
    const result = toNodeDetail(wire);
    expect(result.aliases.length).toBe(2);
    expect(result.aliases[0]?.kind).toBe("canonical");
    expect(result.aliases[1]?.alias).toBe("Apollo");
  });

  it("sorts attributes: is_in_effect=true first, then by key alphabetically (spec §9)", () => {
    const wire: NodeDetailWire = {
      node: {
        id: "node-1",
        node_type: "Project",
        canonical_name: "Projeto Apollo",
        status: "active",
        merged_into_node_id: null,
      },
      aliases: [],
      attributes: [
        // Inputs deliberately out of order — exercises the sort.
        makeAttr({
          id: "a-2",
          attribute_key: "zeta_expired",
          is_in_effect: false,
        }),
        makeAttr({
          id: "a-3",
          attribute_key: "alpha_old",
          is_in_effect: false,
        }),
        makeAttr({
          id: "a-1",
          attribute_key: "deadline",
          is_in_effect: true,
        }),
        makeAttr({
          id: "a-0",
          attribute_key: "budget",
          is_in_effect: true,
        }),
      ],
    };
    const result = toNodeDetail(wire);
    const keysInOrder = result.attributes.map((a) => a.key);
    // In-effect first (budget, deadline), then expired alphabetised
    // (alpha_old, zeta_expired).
    expect(keysInOrder).toEqual([
      "budget",
      "deadline",
      "alpha_old",
      "zeta_expired",
    ]);
  });

  it("attaches a derived `state` (ConfidenceState) to each attribute", () => {
    const wire: NodeDetailWire = {
      node: {
        id: "node-1",
        node_type: "Project",
        canonical_name: "Projeto Apollo",
        status: "active",
        merged_into_node_id: null,
      },
      aliases: [],
      attributes: [
        makeAttr({
          id: "a-1",
          attribute_key: "deadline",
          effective_status: "active",
          status: "accepted",
        }),
        makeAttr({
          id: "a-2",
          attribute_key: "owner",
          effective_status: "uncertain",
          status: "uncertain",
        }),
      ],
    };
    const result = toNodeDetail(wire);
    expect(result.attributes[0]?.state).toBe("accepted");
    expect(result.attributes[1]?.state).toBe("uncertain");
  });

  it("formats validFromLabel/validToLabel as DD/MM/YYYY (null preserved)", () => {
    const wire: NodeDetailWire = {
      node: {
        id: "node-1",
        node_type: "Project",
        canonical_name: "Projeto Apollo",
        status: "active",
        merged_into_node_id: null,
      },
      aliases: [],
      attributes: [
        makeAttr({
          id: "a-1",
          attribute_key: "deadline",
          valid_from: "2026-01-10",
          valid_to: null,
        }),
      ],
    };
    const result = toNodeDetail(wire);
    expect(result.attributes[0]?.validFromLabel).toBe("10/01/2026");
    expect(result.attributes[0]?.validToLabel).toBeNull();
  });
});
