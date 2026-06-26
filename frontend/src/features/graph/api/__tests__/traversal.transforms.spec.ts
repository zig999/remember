/**
 * Traversal transforms — unit tests (dev_tc_001).
 *
 * What these tests pin:
 *  - Direction is computed RELATIVE to the panel's current node — the spec
 *    "→" / "←" arrows depend on it. A regression that swaps outgoing /
 *    incoming would invert the entire relationships section's semantics.
 *  - The label rendered for the link kind is `link_type` outgoing,
 *    `link_inverse_name` incoming. This is THE difference between "owns"
 *    and "is owned by" for the user.
 *  - Neighbor name comes from `result.nodes`. When that map is missing the
 *    neighbor, the transform must fall back to the raw id (defensive — the
 *    panel must still render).
 */
import { describe, expect, it } from "vitest";

import { toTraversalResult } from "../traversal.transforms";
import type { TraversalResultWire } from "../traversal.types";

const STARTING = "node-A";

function makeWire(overrides: Partial<TraversalResultWire>): TraversalResultWire {
  return {
    starting_node_id: STARTING,
    nodes: [
      {
        id: "node-A",
        node_type: "Person",
        canonical_name: "Rodrigo",
        status: "active",
      },
      {
        id: "node-B",
        node_type: "Project",
        canonical_name: "Apollo",
        status: "active",
      },
    ],
    links: [],
    ...overrides,
  };
}

describe("toTraversalResult — direction derivation", () => {
  it("'→' (outgoing) when current node is the source", () => {
    const wire = makeWire({
      links: [
        {
          id: "L1",
          source_node_id: STARTING,
          target_node_id: "node-B",
          link_type: "participates_in",
          link_inverse_name: "has_participant",
          status: "active",
          effective_status: "active",
          is_current: true,
          is_in_effect: true,
          confidence: 0.92,
          valid_from: null,
          valid_to: null,
          hop: 1,
          score: 0.5,
        },
      ],
    });
    const r = toTraversalResult(wire);
    const link = r.links[0]!;
    expect(link.direction).toBe("outgoing");
    expect(link.directionArrow).toBe("→");
    expect(link.directionLabel).toBe("participates_in");
    expect(link.neighborName).toBe("Apollo");
    expect(link.neighborNodeId).toBe("node-B");
  });

  it("'←' (incoming) when current node is the target", () => {
    const wire = makeWire({
      links: [
        {
          id: "L2",
          source_node_id: "node-B",
          target_node_id: STARTING,
          link_type: "owns",
          link_inverse_name: "is_owned_by",
          status: "active",
          effective_status: "active",
          is_current: true,
          is_in_effect: true,
          confidence: 0.5,
          valid_from: null,
          valid_to: null,
          hop: 1,
          score: 0.5,
        },
      ],
    });
    const r = toTraversalResult(wire);
    const link = r.links[0]!;
    expect(link.direction).toBe("incoming");
    expect(link.directionArrow).toBe("←");
    // Label uses the inverse name on incoming links.
    expect(link.directionLabel).toBe("is_owned_by");
    expect(link.neighborName).toBe("Apollo");
  });

  it("formats confidence as integer percent", () => {
    const wire = makeWire({
      links: [
        {
          id: "L3",
          source_node_id: STARTING,
          target_node_id: "node-B",
          link_type: "concerns",
          link_inverse_name: "concerned_by",
          status: "active",
          effective_status: "uncertain",
          is_current: true,
          is_in_effect: true,
          confidence: 0.55,
          valid_from: null,
          valid_to: null,
          hop: 1,
          score: 0.5,
        },
      ],
    });
    const r = toTraversalResult(wire);
    expect(r.links[0]!.confidenceLabel).toBe("55%");
  });

  it("falls back to raw id when the neighbor is missing from nodes[]", () => {
    const wire = makeWire({
      nodes: [
        {
          id: "node-A",
          node_type: "Person",
          canonical_name: "Rodrigo",
          status: "active",
        },
      ],
      links: [
        {
          id: "L4",
          source_node_id: STARTING,
          target_node_id: "node-Z-missing",
          link_type: "owns",
          link_inverse_name: "is_owned_by",
          status: "active",
          effective_status: "active",
          is_current: true,
          is_in_effect: true,
          confidence: 0.5,
          valid_from: null,
          valid_to: null,
          hop: 1,
          score: 0.5,
        },
      ],
    });
    const r = toTraversalResult(wire);
    expect(r.links[0]!.neighborName).toBe("node-Z-missing");
  });

  it("maps inline provenance entries (Phase B inline)", () => {
    const wire = makeWire({
      links: [
        {
          id: "L5",
          source_node_id: STARTING,
          target_node_id: "node-B",
          link_type: "owns",
          link_inverse_name: "is_owned_by",
          status: "active",
          effective_status: "active",
          is_current: true,
          is_in_effect: true,
          confidence: 0.9,
          valid_from: null,
          valid_to: null,
          hop: 1,
          score: 0.5,
          provenance: [
            {
              fragment_id: "frag-1",
              fragment_text: "Frase.",
              confidence: 0.9,
              source_type: "email",
              received_at: "2026-06-11T18:30:00Z",
            },
          ],
        },
      ],
    });
    const r = toTraversalResult(wire);
    expect(r.links[0]!.provenance).toHaveLength(1);
    expect(r.links[0]!.provenance[0]!.fragmentText).toBe("Frase.");
    expect(r.links[0]!.provenance[0]!.confidenceLabel).toBe("90%");
  });
});
