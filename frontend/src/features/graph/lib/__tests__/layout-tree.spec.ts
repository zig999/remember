/**
 * layout-tree — `runTreeLayout` unit tests (TC-02).
 *
 * Why these tests matter:
 *  - The pin invariant must hold across ALL three runners — a regression
 *    where the tree path forgets to apply pinned coordinates would break
 *    AC-F.12 silently (only spotted when the user notices a node moved
 *    after a layout switch).
 *  - Spanning-tree derivation: single node → one position; two-node chain
 *    → root above child (parent at smaller y by d3 convention with our
 *    nodeSize). Both pin the basic shape.
 *  - Forest case (disconnected components): the virtual super-root must be
 *    stripped from the output Map; both component members must receive a
 *    finite position.
 */
import { describe, expect, it } from "vitest";

import type { GraphPosition } from "../../state/graph-store";
import { runTreeLayout } from "../layout-tree";
import { SUPER_ROOT_ID } from "../spanning-tree";

describe("runTreeLayout — empty input", () => {
  it("returns an empty Map when no node ids are given", () => {
    const out = runTreeLayout([], [], new Map());
    expect(out).toBeInstanceOf(Map);
    expect(out.size).toBe(0);
  });
});

describe("runTreeLayout — single node", () => {
  it("returns one position for the lone node", () => {
    const out = runTreeLayout(["a"], [], new Map());
    expect(out.size).toBe(1);
    const pos = out.get("a");
    expect(pos).toBeDefined();
    expect(Number.isFinite(pos!.x)).toBe(true);
    expect(Number.isFinite(pos!.y)).toBe(true);
  });
});

describe("runTreeLayout — two-node chain", () => {
  it("places the root above the child (root has smaller y in tree layout)", () => {
    // Two nodes connected by one link. Highest-degree tiebreak: both have
    // degree 1, smallest id wins → 'a' is root. d3.tree(nodeSize=[w, h])
    // places the root at y=0 and the single child at y=h>0. Our convention
    // matches d3's default (no inversion), so the child has the LARGER y.
    const out = runTreeLayout(
      ["a", "b"],
      [{ source: "a", target: "b" }],
      new Map(),
    );
    expect(out.size).toBe(2);

    const rootPos = out.get("a")!;
    const childPos = out.get("b")!;
    expect(rootPos).toBeDefined();
    expect(childPos).toBeDefined();
    // The child sits below the root — strict inequality so a regression
    // that swaps the axis is caught.
    expect(childPos.y).toBeGreaterThan(rootPos.y);
  });
});

describe("runTreeLayout — pin invariant", () => {
  it("pinned nodes keep their EXACT coordinates regardless of where the tree would place them", () => {
    const pinned = new Map<string, GraphPosition>([
      ["a", { x: -777, y: 333 }],
      ["b", { x: 123, y: 456 }],
    ]);
    const out = runTreeLayout(
      ["a", "b", "c"],
      [
        { source: "a", target: "b" },
        { source: "a", target: "c" },
      ],
      pinned,
    );
    expect(out.get("a")).toEqual({ x: -777, y: 333 });
    expect(out.get("b")).toEqual({ x: 123, y: 456 });
    // The unpinned child still gets a finite computed position.
    const cPos = out.get("c");
    expect(cPos).toBeDefined();
    expect(Number.isFinite(cPos!.x)).toBe(true);
    expect(Number.isFinite(cPos!.y)).toBe(true);
  });
});

describe("runTreeLayout — disconnected forest", () => {
  it("places every node of every component and DROPS the virtual super-root from the output", () => {
    // Two disconnected components: {a, b} and {c, d}. The spanning-tree
    // builder attaches a virtual super-root with id SUPER_ROOT_ID; the
    // runner must strip it.
    const out = runTreeLayout(
      ["a", "b", "c", "d"],
      [
        { source: "a", target: "b" },
        { source: "c", target: "d" },
      ],
      new Map(),
    );

    expect(out.size).toBe(4);
    for (const id of ["a", "b", "c", "d"]) {
      const pos = out.get(id);
      expect(pos).toBeDefined();
      expect(Number.isFinite(pos!.x)).toBe(true);
      expect(Number.isFinite(pos!.y)).toBe(true);
    }
    // The virtual super-root id must NOT appear in the output Map.
    expect(out.has(SUPER_ROOT_ID)).toBe(false);
  });
});

describe("runTreeLayout — output shape", () => {
  it("returns a Map with one entry per input id (no orphans, no extras)", () => {
    const ids = ["root", "child1", "child2", "grand"];
    const out = runTreeLayout(
      ids,
      [
        { source: "root", target: "child1" },
        { source: "root", target: "child2" },
        { source: "child1", target: "grand" },
      ],
      new Map(),
    );
    expect(out.size).toBe(ids.length);
    for (const id of ids) {
      expect(out.has(id)).toBe(true);
    }
  });
});
