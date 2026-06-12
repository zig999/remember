// BR-15 graph-rule validation. The catalog snapshot is built in-memory
// (no DB) so the test exercises the lookup logic, not the migration.

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  isLinkRuleActive,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import { ValidationFailure } from "../../../modules/ingestion/validation/errors.js";
import { validateGraphRule } from "../../../modules/ingestion/validation/graph-rules.js";

const nodeTypes = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Person" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Project" },
];

const linkTypes = [
  {
    id: "00000000-0000-0000-0000-000000000010",
    name: "participates_in",
    is_temporal: true,
    allows_multiple_current: true,
    requires_valid_from: true,
    requires_valid_to_on_change: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    name: "reports_to",
    is_temporal: true,
    allows_multiple_current: false,
    requires_valid_from: true,
    requires_valid_to_on_change: true,
  },
];

function buildTestSnapshot(rules: {
  link_type_id: string;
  source_node_type_id: string;
  target_node_type_id: string;
  valid_from: Date | null;
  valid_to: Date | null;
}[]): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes,
    linkTypes,
    linkTypeRules: rules,
    attributeKeys: [],
  });
}

describe("validateGraphRule (BR-15)", () => {
  const today = new Date("2026-06-12T12:00:00Z");

  it("accepts a triple authorised by an active rule", () => {
    const snapshot = buildTestSnapshot([
      {
        link_type_id: linkTypes[0]!.id,
        source_node_type_id: nodeTypes[0]!.id,
        target_node_type_id: nodeTypes[1]!.id,
        valid_from: null,
        valid_to: null,
      },
    ]);
    expect(() =>
      validateGraphRule(
        snapshot,
        {
          source_node_type_id: nodeTypes[0]!.id,
          link_type_id: linkTypes[0]!.id,
          target_node_type_id: nodeTypes[1]!.id,
        },
        today
      )
    ).not.toThrow();
  });

  it("rejects a triple not in the rule set with RULE_VIOLATION", () => {
    const snapshot = buildTestSnapshot([
      {
        link_type_id: linkTypes[0]!.id,
        source_node_type_id: nodeTypes[0]!.id,
        target_node_type_id: nodeTypes[1]!.id,
        valid_from: null,
        valid_to: null,
      },
    ]);
    let caught: unknown = null;
    try {
      validateGraphRule(
        snapshot,
        {
          source_node_type_id: nodeTypes[1]!.id, // Project -> Project: not allowed
          link_type_id: linkTypes[0]!.id,
          target_node_type_id: nodeTypes[1]!.id,
        },
        today
      );
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("RULE_VIOLATION");
  });

  it("respects valid_to of a rule (expired = not active)", () => {
    const snapshot = buildTestSnapshot([
      {
        link_type_id: linkTypes[0]!.id,
        source_node_type_id: nodeTypes[0]!.id,
        target_node_type_id: nodeTypes[1]!.id,
        valid_from: null,
        valid_to: new Date("2026-06-12T00:00:00Z"), // expired AT today (semi-open)
      },
    ]);
    // 2026-06-12 is not before today (today=2026-06-12), so semi-open says expired.
    const active = isLinkRuleActive(snapshot, {
      source_node_type_id: nodeTypes[0]!.id,
      link_type_id: linkTypes[0]!.id,
      target_node_type_id: nodeTypes[1]!.id,
      today,
    });
    expect(active).toBe(false);
  });

  it("respects valid_from of a rule (not yet effective)", () => {
    const snapshot = buildTestSnapshot([
      {
        link_type_id: linkTypes[0]!.id,
        source_node_type_id: nodeTypes[0]!.id,
        target_node_type_id: nodeTypes[1]!.id,
        valid_from: new Date("2027-01-01T00:00:00Z"),
        valid_to: null,
      },
    ]);
    const active = isLinkRuleActive(snapshot, {
      source_node_type_id: nodeTypes[0]!.id,
      link_type_id: linkTypes[0]!.id,
      target_node_type_id: nodeTypes[1]!.id,
      today,
    });
    expect(active).toBe(false);
  });
});
