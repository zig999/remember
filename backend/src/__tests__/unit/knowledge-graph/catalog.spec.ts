// Unit tests for the catalog snapshot assembler (BR-03, BR-04 validation
// is downstream of these maps).

import { describe, expect, it } from "vitest";

import {
  attributeKeyCacheKey,
  buildSnapshot,
} from "../../../modules/knowledge-graph/catalog/catalog.js";

const nodeType = (id: string, name: string) => ({
  id,
  name,
  description: `${name} description`,
  version: 1,
});

const linkType = (id: string, name: string) => ({
  id,
  name,
  label: name,
  description: `${name} description`,
  inverse_name: `inverse_of_${name}`,
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: true,
  requires_valid_to_on_change: false,
  version: 1,
});

const attributeKey = (id: string, ntId: string, key: string) => ({
  id,
  node_type_id: ntId,
  key,
  value_type: "date" as const,
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: true,
  description: `${key} description`,
  version: 1,
});

describe("buildSnapshot", () => {
  it("indexes node_type by name and id", () => {
    const snap = buildSnapshot({
      nodeTypes: [nodeType("nt-1", "Project"), nodeType("nt-2", "Person")],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    });
    expect(snap.nodeTypeByName.get("Project")?.id).toBe("nt-1");
    expect(snap.nodeTypeById.get("nt-2")?.name).toBe("Person");
    expect(snap.nodeTypeByName.get("UnknownType")).toBeUndefined();
  });

  it("indexes link_type by name and id", () => {
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [
        linkType("lt-1", "participates_in"),
        linkType("lt-2", "reports_to"),
      ],
      linkTypeRules: [],
      attributeKeys: [],
    });
    expect(snap.linkTypeByName.get("participates_in")?.id).toBe("lt-1");
    expect(snap.linkTypeById.get("lt-2")?.name).toBe("reports_to");
  });

  it("preserves the link_type_rules array verbatim", () => {
    const rules = [
      {
        id: "rule-1",
        link_type_id: "lt-1",
        source_node_type_id: "nt-2",
        target_node_type_id: "nt-1",
        valid_from: null,
        valid_to: null,
      },
    ];
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: rules,
      attributeKeys: [],
    });
    expect(snap.linkTypeRules).toEqual(rules);
  });

  it("indexes attribute_key by (node_type_id, key) and id", () => {
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [
        attributeKey("ak-1", "nt-1", "deadline"),
        attributeKey("ak-2", "nt-2", "email"),
      ],
    });
    expect(
      snap.attributeKeyByNodeTypeAndKey.get(
        attributeKeyCacheKey("nt-1", "deadline")
      )?.id
    ).toBe("ak-1");
    expect(snap.attributeKeyById.get("ak-2")?.key).toBe("email");
    // Same `key` under a different node_type is a different entry.
    expect(
      snap.attributeKeyByNodeTypeAndKey.get(
        attributeKeyCacheKey("nt-1", "email")
      )
    ).toBeUndefined();
  });
});
