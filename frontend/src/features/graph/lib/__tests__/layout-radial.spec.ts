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

describe("runRadialLayout — adaptive radius (anti-overlap)", () => {
  it("a densely populated ring spreads so adjacent nodes never overlap", () => {
    // Hub with many leaves: all leaves land on ring 1. With the old fixed
    // radius (320) the arc-length per leaf collapses below the node width and
    // cards overlap. The adaptive radius must grow the ring so the arc-length
    // between the two closest neighbours is at least the node footprint.
    const LEAF_COUNT = 20;
    const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => `leaf-${i}`);
    const out = runRadialLayout(
      ["hub", ...leaves],
      leaves.map((id) => ({ source: "hub", target: id })),
      new Map(),
    );

    const hub = out.get("hub")!;
    expect(hub.x).toBeCloseTo(0);
    expect(hub.y).toBeCloseTo(0);

    // Ring radius: every leaf is equidistant from the hub.
    const r = Math.hypot(out.get("leaf-0")!.x, out.get("leaf-0")!.y);

    // Closest pairwise distance across all leaves must clear the node
    // footprint (270). This is the property that guarantees no overlap —
    // it fails under the old fixed-radius layout (2π·320/20 ≈ 100px < 270).
    let minDist = Infinity;
    for (let i = 0; i < LEAF_COUNT; i++) {
      for (let j = i + 1; j < LEAF_COUNT; j++) {
        const a = out.get(`leaf-${i}`)!;
        const b = out.get(`leaf-${j}`)!;
        minDist = Math.min(minDist, Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
    expect(minDist).toBeGreaterThanOrEqual(270 - 1e-6);
    // Sanity: the ring grew well past the old fixed 320 to make room.
    expect(r).toBeGreaterThan(320);
  });

  it("deep chains keep a constant radial gap between rings (no compression)", () => {
    // A path graph puts one node per depth. Under the old `size([2π, R])` the
    // rings compress into R=320. The adaptive radius must keep every distinct
    // ring at least MIN_RING_GAP (200) apart. NOTE: buildSpanningTree re-roots
    // at the highest-degree node (the path's centre), so node id order is NOT
    // depth order — we compare the SORTED set of distinct ring radii instead.
    const ids = ["root", "n1", "n2", "n3", "n4", "n5", "n6"];
    const links = ids.slice(1).map((id, i) => ({ source: ids[i]!, target: id }));
    const out = runRadialLayout(ids, links, new Map());

    const distinctRadii = [
      ...new Set(
        ids.map((id) =>
          Math.round(Math.hypot(out.get(id)!.x, out.get(id)!.y)),
        ),
      ),
    ].sort((a, b) => a - b);

    // Re-rooted at the centre, a 7-node path has depths 0..3 → 4 distinct rings.
    expect(distinctRadii.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < distinctRadii.length; i++) {
      expect(distinctRadii[i]! - distinctRadii[i - 1]!).toBeGreaterThanOrEqual(
        200 - 1,
      );
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
