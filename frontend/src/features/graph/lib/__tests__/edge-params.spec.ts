/**
 * edge-params.ts — unit tests for `getEdgeParams` (TC-01 / REQ-1).
 *
 * What these tests pin (intent — Golden Rule 9):
 *  - Floating geometry: when nodes are vertically stacked (source above
 *    target), the source emits from its BOTTOM and the target receives at
 *    its TOP — the cardinal `Position` mirrors the layout. A regression
 *    that hard-coded the cardinal positions (e.g. always Bottom→Top) would
 *    break radial / left-to-right layouts that REQ-2 introduces.
 *  - Side-by-side nodes flip the cardinals to RIGHT (source) / LEFT
 *    (target). This is the discriminating case between "fixed handle"
 *    (would still emit Bottom→Top regardless of layout) and "floating
 *    edge" (emits from the nearest side).
 *  - Unmeasured nodes return `null` — never (0,0). The caller renders
 *    nothing in that case (GraphEdge.spec §6 Do/Don't). A regression that
 *    falls back to zero coordinates would draw a stub edge from the
 *    origin every time React Flow mounts a new node mid-reveal.
 */
import { describe, expect, it } from "vitest";
import { Position, type InternalNode, type Node } from "@xyflow/react";
import { getEdgeParams } from "../edge-params";

/**
 * Build a minimal `InternalNode` stub with measured dimensions and an
 * absolute position. We cast via `unknown` because the harness only sets
 * the fields `getEdgeParams` actually reads — the full React Flow
 * internal shape includes RF-private fields we don't need to mock.
 */
function makeNode(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): InternalNode<Node> {
  return {
    id,
    data: {},
    position: { x, y },
    measured: { width, height },
    internals: {
      positionAbsolute: { x, y },
      z: 0,
      userNode: {} as never,
    },
  } as unknown as InternalNode<Node>;
}

describe("getEdgeParams — cardinal Position selection", () => {
  it("nodes stacked vertically (source above target) → source.Bottom, target.Top", () => {
    // Source at y=0, target at y=300 — both 100×50; the centre-to-centre
    // line is vertical, so the intersection should hit source's bottom
    // edge and target's top edge.
    const source = makeNode("a", 0, 0, 100, 50);
    const target = makeNode("b", 0, 300, 100, 50);
    const params = getEdgeParams(source, target);
    expect(params).not.toBeNull();
    expect(params?.sourcePos).toBe(Position.Bottom);
    expect(params?.targetPos).toBe(Position.Top);
    // Source intersection should sit ON the bottom edge of source
    // (y = 0 + 50 = 50).
    expect(params?.sourceY).toBeCloseTo(50, 1);
    // Target intersection should sit ON the top edge of target (y=300).
    expect(params?.targetY).toBeCloseTo(300, 1);
  });

  it("nodes stacked vertically (source below target) → source.Top, target.Bottom", () => {
    const source = makeNode("a", 0, 300, 100, 50);
    const target = makeNode("b", 0, 0, 100, 50);
    const params = getEdgeParams(source, target);
    expect(params).not.toBeNull();
    expect(params?.sourcePos).toBe(Position.Top);
    expect(params?.targetPos).toBe(Position.Bottom);
  });

  it("nodes side-by-side (source left of target) → source.Right, target.Left", () => {
    // Source at x=0, target at x=300 — same y. The centre-to-centre line
    // is horizontal, so the intersection should hit source's right edge
    // and target's left edge — proving the helper picks the NEAREST
    // boundary, not a fixed Top/Bottom.
    const source = makeNode("a", 0, 0, 100, 50);
    const target = makeNode("b", 300, 0, 100, 50);
    const params = getEdgeParams(source, target);
    expect(params).not.toBeNull();
    expect(params?.sourcePos).toBe(Position.Right);
    expect(params?.targetPos).toBe(Position.Left);
    // Source intersection on source's right edge (x = 0 + 100 = 100).
    expect(params?.sourceX).toBeCloseTo(100, 1);
    // Target intersection on target's left edge (x = 300).
    expect(params?.targetX).toBeCloseTo(300, 1);
  });

  it("nodes side-by-side (source right of target) → source.Left, target.Right", () => {
    const source = makeNode("a", 300, 0, 100, 50);
    const target = makeNode("b", 0, 0, 100, 50);
    const params = getEdgeParams(source, target);
    expect(params).not.toBeNull();
    expect(params?.sourcePos).toBe(Position.Left);
    expect(params?.targetPos).toBe(Position.Right);
  });
});

describe("getEdgeParams — unmeasured / missing node guard", () => {
  it("returns null when source is undefined", () => {
    const target = makeNode("b", 0, 300, 100, 50);
    expect(getEdgeParams(undefined, target)).toBeNull();
  });

  it("returns null when target is undefined", () => {
    const source = makeNode("a", 0, 0, 100, 50);
    expect(getEdgeParams(source, undefined)).toBeNull();
  });

  it("returns null when source is null", () => {
    const target = makeNode("b", 0, 300, 100, 50);
    expect(getEdgeParams(null, target)).toBeNull();
  });

  it("returns null when source has zero width (unmeasured)", () => {
    // measured.width=0 simulates a node React Flow has mounted but not
    // yet measured — happens on the first render frame.
    const source = makeNode("a", 0, 0, 0, 50);
    const target = makeNode("b", 0, 300, 100, 50);
    expect(getEdgeParams(source, target)).toBeNull();
  });

  it("returns null when target has zero height (unmeasured)", () => {
    const source = makeNode("a", 0, 0, 100, 50);
    const target = makeNode("b", 0, 300, 100, 0);
    expect(getEdgeParams(source, target)).toBeNull();
  });
});
