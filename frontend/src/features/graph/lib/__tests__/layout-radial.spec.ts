/**
 * layout-radial — `runRadialLayout` unit tests (TC-02).
 *
 * Why these tests matter:
 *  - Same pin invariant as the other two runners (AC-F.12).
 *  - Star topology: a hub with N leaves must place the hub at the centre
 *    (0, 0) and arrange the leaves on a circle around it. We verify the
 *    leaves' distances from the centre are equal — the radial property —
 *    and that they don't all collapse to the same point (radial fan-out).
 *  - Single-node case: one entry, finite coordinate.
 */
import { describe, expect, it } from "vitest";

import type { GraphPosition } from "../../state/graph-store";
import { runRadialLayout } from "../layout-radial";

describe("runRadialLayout — empty input", () => {
  it("returns an empty Map when no node ids are given", () => {
    const out = runRadialLayout([], [], new Map());
    expect(out.size).toBe(0);
  });
});

describe("runRadialLayout — single node", () => {
  it("returns one position for the lone node (at the centre)", () => {
    const out = runRadialLayout(["solo"], [], new Map());
    expect(out.size).toBe(1);
    const pos = out.get("solo");
    expect(pos).toBeDefined();
    expect(Number.isFinite(pos!.x)).toBe(true);
    expect(Number.isFinite(pos!.y)).toBe(true);
    // Root of a single-node tree sits at (0, 0) (depth 0, radius 0).
    expect(pos!.x).toBeCloseTo(0);
    expect(pos!.y).toBeCloseTo(0);
  });
});

describe("runRadialLayout — star topology", () => {
  it("hub sits near the centre and leaves are radially equidistant from it", () => {
    // Hub 'h' connected to 4 leaves. Hub has degree 4 → root tiebreaker
    // picks it as root. d3.tree.size([2π, R]) gives leaves the SAME y
    // (depth 1 → radius = R); the projection puts them at distance R from
    // the hub, evenly spaced around the circle.
    const out = runRadialLayout(
      ["h", "a", "b", "c", "d"],
      [
        { source: "h", target: "a" },
        { source: "h", target: "b" },
        { source: "h", target: "c" },
        { source: "h", target: "d" },
      ],
      new Map(),
    );

    expect(out.size).toBe(5);
    const hub = out.get("h")!;
    expect(hub).toBeDefined();
    // Root is at the centre.
    expect(hub.x).toBeCloseTo(0);
    expect(hub.y).toBeCloseTo(0);

    // Each leaf is at the same distance from the hub (the outer-ring
    // radius). Compute the distance for one leaf and assert the others
    // match. Tolerance accommodates floating-point drift in trig.
    const dist = (p: GraphPosition): number =>
      Math.hypot(p.x - hub.x, p.y - hub.y);
    const radii = ["a", "b", "c", "d"].map((id) => dist(out.get(id)!));
    const r0 = radii[0]!;
    expect(r0).toBeGreaterThan(0); // leaves are NOT at the centre
    for (const r of radii) {
      expect(r).toBeCloseTo(r0, 4);
    }

    // Leaves don't all collapse to the same Cartesian point — the radial
    // fan-out must spread them. We check pairwise distances are positive.
    const leafPositions = ["a", "b", "c", "d"].map((id) => out.get(id)!);
    for (let i = 0; i < leafPositions.length; i++) {
      for (let j = i + 1; j < leafPositions.length; j++) {
        const a = leafPositions[i]!;
        const b = leafPositions[j]!;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d).toBeGreaterThan(0);
      }
    }
  });
});

describe("runRadialLayout — pin invariant", () => {
  it("pinned nodes keep their EXACT coordinates", () => {
    const pinned = new Map<string, GraphPosition>([
      ["h", { x: 9, y: -42 }],
    ]);
    const out = runRadialLayout(
      ["h", "x", "y"],
      [
        { source: "h", target: "x" },
        { source: "h", target: "y" },
      ],
      pinned,
    );
    expect(out.get("h")).toEqual({ x: 9, y: -42 });
    // Unpinned children get finite computed positions.
    expect(Number.isFinite(out.get("x")!.x)).toBe(true);
    expect(Number.isFinite(out.get("y")!.y)).toBe(true);
  });
});
