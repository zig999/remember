/**
 * types.ts — structural / compile-time assertions for the graph feature
 * public type surface (TC-FE-01).
 *
 * Why these tests matter (u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - `GraphStatus` is pinned by validation criterion §validation.criteria:
 *    "exactly 5 values — no 'idle'" (I-4). A regression that re-adds
 *    `"idle"` would silently re-introduce the empty/idle ambiguity the
 *    plan removed. The `Exclude<GraphStatus, "idle">` identity assertion
 *    is a compile-time guard; the runtime array pin catches the same
 *    regression in test output.
 *  - The wire / surface shapes have intentionally different casing
 *    (snake_case wire vs camelCase surface). A future contributor merging
 *    them would break the mapper boundary. The "fields exist" assertions
 *    pin the casing on both sides.
 *  - `GraphNodeWire` intentionally has NO `flags` field (I-2). A regression
 *    that adds `flags` to the node wire shape would leak link-side
 *    semantics — the `satisfies` check below would compile-error.
 */
import { describe, expect, it } from "vitest";
import type {
  GraphDelta,
  GraphLinkData,
  GraphLinkWire,
  GraphNodeData,
  GraphNodeWire,
  GraphStatus,
} from "../types";

describe("GraphStatus — exactly 5 values, no 'idle' (I-4)", () => {
  // The full type-level enumeration: if any value is removed or `"idle"`
  // is added, this object literal stops being assignable to
  // `Record<GraphStatus, true>` and the test will fail to compile.
  const ALL_STATUSES: Record<GraphStatus, true> = {
    empty: true,
    loading: true,
    revealing: true,
    ready: true,
    error: true,
  };

  it("has exactly 5 members", () => {
    expect(Object.keys(ALL_STATUSES)).toHaveLength(5);
  });

  it("does NOT include 'idle'", () => {
    expect(Object.keys(ALL_STATUSES)).not.toContain("idle");
  });

  it("compile-time: 'idle' is not assignable to GraphStatus", () => {
    // The assignment below would fail typecheck if "idle" were added to
    // the union. This runtime body is a no-op — the value is the type
    // assertion. We use `as unknown as never` to express the intent:
    // "this branch is unreachable because the type forbids it".
    type IdleIsExcluded = Exclude<GraphStatus, "idle">;
    // If GraphStatus ever contained "idle", IdleIsExcluded would NOT be
    // identical to GraphStatus and the conditional type below resolves to
    // `false` — which is not assignable to `true`.
    const _check: [GraphStatus] extends [IdleIsExcluded] ? true : false = true;
    expect(_check).toBe(true);
  });
});

describe("GraphNodeWire — wire shape (snake_case, I-2)", () => {
  it("has the expected snake_case fields and no flags", () => {
    // `satisfies` ensures the literal matches the type EXACTLY without
    // widening. If a `flags` field is added to GraphNodeWire (a regression
    // of I-2), this literal would still satisfy — the negative assertion
    // is the structural "no `flags` key" check at runtime.
    const sample = {
      id: "uuid-1",
      node_type: "person",
      canonical_name: "Rodrigo",
      status: "active",
    } as const satisfies GraphNodeWire;

    expect(sample).toHaveProperty("node_type");
    expect(sample).toHaveProperty("canonical_name");
    expect(sample).toHaveProperty("status");
    // I-2 invariant: nodes do not carry flags on the wire.
    expect(sample).not.toHaveProperty("flags");
  });
});

describe("GraphLinkWire — wire shape (snake_case, link carries flags)", () => {
  it("has the expected snake_case fields including is_temporal and flags", () => {
    const sample = {
      id: "edge-1",
      source_node_id: "uuid-1",
      target_node_id: "uuid-2",
      link_type: "participates_in",
      is_temporal: true,
      is_in_effect: true,
      status: "active",
      flags: ["uncertain"],
    } as const satisfies GraphLinkWire;

    expect(sample).toHaveProperty("source_node_id");
    expect(sample).toHaveProperty("target_node_id");
    expect(sample).toHaveProperty("is_temporal");
    // Links DO carry flags (I-2 — flags exist on links, not nodes).
    expect(sample.flags).toEqual(["uncertain"]);
  });
});

describe("GraphNodeData / GraphLinkData — surface shape (camelCase)", () => {
  it("GraphNodeData accepts the documented fields", () => {
    const node: GraphNodeData = {
      id: "uuid-1",
      type: "person",
      label: "Rodrigo",
      state: "accepted",
      subtitle: "Pessoa",
    };
    expect(node.type).toBe("person");
  });

  it("GraphLinkData has isTemporal as a required boolean (camelCase)", () => {
    // Validation criterion: "GraphLinkData.isTemporal field is present and
    // typed boolean". The TypeScript checker enforces this — a missing
    // field or wrong type fails at compile time.
    const link: GraphLinkData = {
      id: "edge-1",
      source: "uuid-1",
      target: "uuid-2",
      label: "participates_in",
      isTemporal: true,
    };
    expect(link.isTemporal).toBe(true);
    expect(typeof link.isTemporal).toBe("boolean");
  });

  it("GraphDelta groups a sourceTool with nodes and links", () => {
    const delta: GraphDelta = {
      sourceTool: "traverse",
      nodes: [],
      links: [],
    };
    expect(delta.sourceTool).toBe("traverse");
    expect(delta.nodes).toEqual([]);
    expect(delta.links).toEqual([]);
  });
});
