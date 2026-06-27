/**
 * mapWireToGraphDelta — unit tests (dev_tc_001).
 *
 * Tests the wire→surface mapping in isolation from the chat dispatcher and
 * from the ingest screen. The function is consumed by both `/chat` (SSE
 * `graph_delta` frames) and `/ingest` (traverse-assembled deltas), so the
 * coverage here pins the surface contract both callers depend on.
 *
 * What each test verifies (per u-fe-standards "Tests verify intent, not
 * just behavior"):
 *  - "maps a wire frame into surface GraphDelta" — happy-path field
 *    mapping (snake → camel), including the `linkTypeLabel` slug fallback
 *    when the wire omits the catalog-resolved pt-BR label.
 *  - "projects wire `link_type_label` into surface `linkTypeLabel`" —
 *    catalog projection is forwarded verbatim, not transformed.
 *  - "filters out merged/deleted nodes and orphan links" — I-2 invariant
 *    (filtered nodes never reach the surface; links anchored on them are
 *    dropped).
 *  - "falls back to 'concept' for unknown node_type slugs" — G-B safety
 *    net (open catalog).
 *  - "preserves inEffect when present and elides it when absent" —
 *    exactOptionalPropertyTypes compliance: the surface shape never
 *    carries an explicit `undefined`.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { mapWireToGraphDelta } from "../mapWireToGraphDelta";
import { useGraphStore } from "../../state/graph-store";
import type { MapWireToGraphDeltaInput } from "../mapWireToGraphDelta";

beforeEach(() => {
  // The mapper reads the live `useGraphStore` to decide whether a link
  // endpoint outside THIS delta is already in the store (cross-delta
  // dedupe). Reset the store between tests so the orphan-link guard
  // assertions are deterministic.
  useGraphStore.getState().clear();
});

describe("mapWireToGraphDelta — pure mapper", () => {
  it("maps a wire frame into surface GraphDelta (nodes + links)", () => {
    const input: MapWireToGraphDeltaInput = {
      sourceTool: "traverse",
      nodes: [
        {
          id: "n1",
          node_type: "person",
          canonical_name: "Rodrigo",
          status: "active",
        },
        {
          id: "n2",
          node_type: "project",
          canonical_name: "Remember",
          status: "needs_review",
        },
      ],
      links: [
        {
          id: "l1",
          source_node_id: "n1",
          target_node_id: "n2",
          link_type: "participates_in",
          is_temporal: true,
        },
      ],
    };
    const delta = mapWireToGraphDelta(input);
    expect(delta.sourceTool).toBe("traverse");
    expect(delta.nodes).toHaveLength(2);
    expect(delta.nodes[0]).toEqual({
      id: "n1",
      type: "person",
      label: "Rodrigo",
      state: "accepted",
    });
    expect(delta.nodes[1]).toEqual({
      id: "n2",
      type: "project",
      label: "Remember",
      state: "uncertain",
    });
    expect(delta.links).toHaveLength(1);
    expect(delta.links[0]).toMatchObject({
      id: "l1",
      source: "n1",
      target: "n2",
      label: "participates_in",
      isTemporal: true,
      state: "accepted",
    });
    // Wire did not carry `link_type_label` → mapper falls back to the
    // humanized slug. Pins the contract: the surface ALWAYS exposes a
    // non-empty `linkTypeLabel`, never `undefined` (GraphEdge.spec §7
    // Scenario 8). Without this assertion, a future regression that
    // dropped the fallback would surface as `undefined` text on the canvas.
    expect(delta.links[0]?.linkTypeLabel).toBe("participates in");
  });

  it("projects wire `link_type_label` into surface `linkTypeLabel` (pt-BR)", () => {
    // The wire field carries the catalog-resolved pt-BR display label.
    // The mapper MUST pass it through unchanged — the visible canvas text
    // comes from the backend, not from the frontend. Regression guard:
    // a refactor that lower-cased / title-cased the value would silently
    // change the rendered label.
    const input: MapWireToGraphDeltaInput = {
      sourceTool: "traverse",
      nodes: [
        { id: "n1", node_type: "person", canonical_name: "A", status: "active" },
        { id: "n2", node_type: "person", canonical_name: "B", status: "active" },
      ],
      links: [
        {
          id: "l1",
          source_node_id: "n1",
          target_node_id: "n2",
          link_type: "participates_in",
          link_type_label: "participa de",
          is_temporal: true,
        },
      ],
    };
    const delta = mapWireToGraphDelta(input);
    expect(delta.links[0]?.label).toBe("participates_in");
    expect(delta.links[0]?.linkTypeLabel).toBe("participa de");
  });

  it("filters out merged/deleted nodes (I-2) and orphan links", () => {
    const input: MapWireToGraphDeltaInput = {
      sourceTool: "list_nodes",
      nodes: [
        { id: "n1", node_type: "person", canonical_name: "A", status: "active" },
        { id: "n2", node_type: "person", canonical_name: "B", status: "merged" },
        { id: "n3", node_type: "person", canonical_name: "C", status: "deleted" },
      ],
      links: [
        // n1→n2 — orphan (n2 filtered): drop
        { id: "l1", source_node_id: "n1", target_node_id: "n2", link_type: "x", is_temporal: false },
        // n2→n3 — both filtered: drop
        { id: "l2", source_node_id: "n2", target_node_id: "n3", link_type: "x", is_temporal: false },
      ],
    };
    const delta = mapWireToGraphDelta(input);
    expect(delta.nodes.map((n) => n.id)).toEqual(["n1"]);
    expect(delta.links).toHaveLength(0);
  });

  it("falls back to 'concept' for unknown node_type slugs (G-B)", () => {
    const input: MapWireToGraphDeltaInput = {
      sourceTool: "get_node",
      nodes: [
        {
          id: "n1",
          node_type: "mystery_type_not_in_union",
          canonical_name: "X",
          status: "active",
        },
      ],
      links: [],
    };
    const delta = mapWireToGraphDelta(input);
    expect(delta.nodes[0]?.type).toBe("concept");
  });

  it("preserves inEffect when present and elides it when absent (exactOptional)", () => {
    const input: MapWireToGraphDeltaInput = {
      sourceTool: "traverse",
      nodes: [
        { id: "n1", node_type: "person", canonical_name: "A", status: "active" },
        { id: "n2", node_type: "person", canonical_name: "B", status: "active" },
      ],
      links: [
        // with explicit is_in_effect: false
        {
          id: "l1",
          source_node_id: "n1",
          target_node_id: "n2",
          link_type: "x",
          is_temporal: true,
          is_in_effect: false,
        },
        // without is_in_effect — must not appear on the surface link
        {
          id: "l2",
          source_node_id: "n1",
          target_node_id: "n2",
          link_type: "x",
          is_temporal: false,
        },
      ],
    };
    const delta = mapWireToGraphDelta(input);
    expect(delta.links[0]?.inEffect).toBe(false);
    expect("inEffect" in (delta.links[1] ?? {})).toBe(false);
  });

  it("keeps a link whose endpoint is already in the store (cross-delta dedupe)", () => {
    // Seed the store with a node from a prior delta. A new delta that
    // introduces only the *other* endpoint of a link should keep the link
    // — the mapper's job is to drop links that would otherwise be orphan,
    // not links anchored on store-resident nodes.
    useGraphStore.getState().addNodes({
      sourceTool: "list_nodes",
      nodes: [{ id: "preexisting", type: "person", label: "Prior", state: "accepted" }],
      links: [],
    });
    const input: MapWireToGraphDeltaInput = {
      sourceTool: "traverse",
      nodes: [
        { id: "fresh", node_type: "person", canonical_name: "New", status: "active" },
      ],
      links: [
        {
          id: "l1",
          source_node_id: "preexisting",
          target_node_id: "fresh",
          link_type: "knows",
          is_temporal: false,
        },
      ],
    };
    const delta = mapWireToGraphDelta(input);
    expect(delta.nodes.map((n) => n.id)).toEqual(["fresh"]);
    expect(delta.links).toHaveLength(1);
    expect(delta.links[0]?.source).toBe("preexisting");
  });
});
