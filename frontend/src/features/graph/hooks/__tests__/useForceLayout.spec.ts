/**
 * useForceLayout — d3-force pinning + layout (TC-FE-05).
 *
 * Why these tests matter (per u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - AC-F.12 / D5 — the "existing nodes do not jump" invariant. If pinning
 *    ever regresses (e.g. by forgetting to seed `fx`/`fy` on already-placed
 *    nodes), every new delta would shuffle the whole subgraph and users would
 *    see the canvas explode on every tool call. The "pinned existing nodes
 *    keep their exact coordinates" test pins this — quite literally.
 *  - Re-affirmation consolidates (project principle) — a re-arrived node
 *    already has a position, so it must remain in place. Validated by the
 *    same pin test.
 *  - The hook must NOT import `@xyflow/react` — the structural test enforces
 *    this so a future refactor never accidentally couples the layout
 *    computation to React Flow internals.
 *  - Orphan-link defense: if `useForceLayout` ever received a link whose
 *    endpoint is not in nodes, d3-force throws on link resolution. The
 *    filter test pins this so a bug in `removeNodes` doesn't crash the
 *    whole canvas.
 *
 * Strategy:
 *  - Most tests exercise `runForceLayout` directly — it is a pure function
 *    of (nodeIds, linkPairs, pinnedPositions) and easy to assert against.
 *  - One integration test mounts the hook via the project's
 *    createRoot + act + useImperativeHandle harness (same pattern as
 *    `useSignIn.spec.ts` — no @testing-library/react in the repo) and
 *    asserts that the store's `positions` Map is populated after the effect
 *    runs, and that an existing pinned node survives a second delta.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createRef, useImperativeHandle, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as React from "react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import type {
  GraphDelta,
  GraphLinkData,
  GraphNodeData,
} from "@/features/graph/types";
import { useGraphStore } from "../../state/graph-store";
import { runForceLayout, useForceLayout } from "../useForceLayout";

/* -------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function makeNode(id: string): GraphNodeData {
  return { id, type: "concept", label: `Node ${id}`, state: "accepted" };
}

function makeLink(id: string, source: string, target: string): GraphLinkData {
  return {
    id,
    source,
    target,
    label: "related_to",
    linkTypeLabel: "relacionado a",
    isTemporal: false,
  };
}

function makeDelta(
  nodes: GraphNodeData[],
  links: GraphLinkData[] = [],
): GraphDelta {
  return { sourceTool: "list_nodes", nodes, links };
}

beforeEach(() => {
  useGraphStore.getState().clear();
});

/* -------------------------------------------------------------------------
 * Pure runner — runForceLayout
 * ------------------------------------------------------------------------- */

describe("runForceLayout — empty input", () => {
  it("returns an empty Map when no nodes are given", () => {
    const result = runForceLayout([], [], new Map());
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });
});

describe("runForceLayout — pin invariant (AC-F.12 / D5)", () => {
  it("pinned nodes keep their EXACT pre-existing coordinates after the simulation runs", () => {
    // Pin two nodes at known coordinates. A third unpinned node will be
    // pushed around by the force field.
    const pinned = new Map([
      ["a", { x: -200, y: -100 }],
      ["b", { x: 300, y: 50 }],
    ]);

    const result = runForceLayout(
      ["a", "b", "new"],
      [
        { source: "a", target: "b" },
        { source: "a", target: "new" },
      ],
      pinned,
    );

    expect(result.get("a")).toEqual({ x: -200, y: -100 });
    expect(result.get("b")).toEqual({ x: 300, y: 50 });
  });

  it("places new (unpinned) nodes with finite, well-defined coordinates", () => {
    const pinned = new Map([["a", { x: 0, y: 0 }]]);
    const result = runForceLayout(
      ["a", "new"],
      [{ source: "a", target: "new" }],
      pinned,
    );

    const newPos = result.get("new");
    expect(newPos).toBeDefined();
    expect(Number.isFinite(newPos!.x)).toBe(true);
    expect(Number.isFinite(newPos!.y)).toBe(true);
  });

  it("re-running with the same pinned positions keeps them unchanged (re-affirmation invariant)", () => {
    const pinned = new Map([
      ["a", { x: 42, y: 17 }],
      ["b", { x: -33, y: 88 }],
    ]);
    const first = runForceLayout(
      ["a", "b"],
      [{ source: "a", target: "b" }],
      pinned,
    );

    // Take the first run as the new pin set and run again — the canvas is
    // effectively replaying the same delta.
    const second = runForceLayout(
      ["a", "b"],
      [{ source: "a", target: "b" }],
      first,
    );

    expect(second.get("a")).toEqual({ x: 42, y: 17 });
    expect(second.get("b")).toEqual({ x: -33, y: 88 });
  });
});

describe("runForceLayout — collision (anti-overlap)", () => {
  it("keeps every pair of unpinned nodes at least a node-footprint apart", () => {
    // A hub with many leaves: without forceCollide the leaves bunch up around
    // the hub and overlap. The collision force must guarantee that NO pair of
    // node centres ends closer than one footprint (270). We check the closest
    // pair across the whole settled layout.
    const LEAF_COUNT = 15;
    const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => `leaf-${i}`);
    const ids = ["hub", ...leaves];
    const result = runForceLayout(
      ids,
      leaves.map((id) => ({ source: "hub", target: id })),
      new Map(),
    );

    let minDist = Infinity;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = result.get(ids[i]!)!;
        const b = result.get(ids[j]!)!;
        minDist = Math.min(minDist, Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
    // forceCollide is iterative and not a hard constraint, so allow a small
    // slack below the ideal footprint — but it must clear the old bunched
    // distance (nodes used to settle ~180px apart, the old LINK_DISTANCE).
    expect(minDist).toBeGreaterThan(230);
  });

  it("pinned nodes stay EXACT even when collision would push them apart", () => {
    // Two nodes pinned closer than the footprint. Collision wants to shove
    // them apart, but fx/fy must win — pinned coordinates are inviolate.
    const pinned = new Map([
      ["a", { x: 0, y: 0 }],
      ["b", { x: 10, y: 0 }], // only 10px apart — well inside the footprint
    ]);
    const result = runForceLayout(["a", "b"], [], pinned);
    expect(result.get("a")).toEqual({ x: 0, y: 0 });
    expect(result.get("b")).toEqual({ x: 10, y: 0 });
  });
});

describe("runForceLayout — output shape", () => {
  it("returns a Map<string, {x:number;y:number}> with one entry per input node", () => {
    const result = runForceLayout(
      ["a", "b", "c"],
      [],
      new Map([["a", { x: 0, y: 0 }]]),
    );
    expect(result.size).toBe(3);
    for (const id of ["a", "b", "c"]) {
      const pos = result.get(id);
      expect(pos).toBeDefined();
      expect(typeof pos!.x).toBe("number");
      expect(typeof pos!.y).toBe("number");
    }
  });
});

describe("runForceLayout — orphan-link defense", () => {
  it("drops links whose endpoint is not in the node list (no throw, no phantom)", () => {
    // 'ghost' is referenced by a link but absent from nodeIds — d3-force
    // would otherwise build a phantom SimNode and place it; the hook must
    // drop the link to keep the simulation honest.
    const result = runForceLayout(
      ["a", "b"],
      [
        { source: "a", target: "b" },
        { source: "a", target: "ghost" }, // <- must be ignored
      ],
      new Map(),
    );
    expect(result.size).toBe(2);
    expect(result.has("a")).toBe(true);
    expect(result.has("b")).toBe(true);
    expect(result.has("ghost")).toBe(false);
  });
});

describe("runForceLayout — isolated nodes", () => {
  it("places isolated nodes (no links) somewhere finite", () => {
    const result = runForceLayout(["solo"], [], new Map());
    const pos = result.get("solo");
    expect(pos).toBeDefined();
    expect(Number.isFinite(pos!.x)).toBe(true);
    expect(Number.isFinite(pos!.y)).toBe(true);
  });
});

/* -------------------------------------------------------------------------
 * Hook integration — useForceLayout
 * ------------------------------------------------------------------------- */

interface Harness {
  /** Latest positions Map returned by the hook. */
  getPositions: () => ReadonlyMap<string, { x: number; y: number }>;
}

function Host({ refObj }: { refObj: RefObject<Harness | null> }): React.ReactElement {
  const positions = useForceLayout();
  useImperativeHandle(refObj, () => ({ getPositions: () => positions }), [positions]);
  return React.createElement("div");
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

function mount(): RefObject<Harness | null> {
  const ref = createRef<Harness | null>();
  act(() => {
    root.render(React.createElement(Host, { refObj: ref }));
  });
  return ref;
}

describe("useForceLayout — store integration", () => {
  it("writes positions back to the store after nodes are added", () => {
    // Seed the store BEFORE mounting so the hook's first effect sees nodes.
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b")], [makeLink("l1", "a", "b")]),
    );

    const ref = mount();

    const positions = ref.current!.getPositions();
    // The hook fires its effect synchronously inside `act` — every node
    // should now have a position both in the hook's return AND in the store.
    expect(positions.size).toBe(2);
    expect(positions.has("a")).toBe(true);
    expect(positions.has("b")).toBe(true);

    const storePositions = useGraphStore.getState().positions;
    expect(storePositions.size).toBe(2);
    expect(storePositions.has("a")).toBe(true);
    expect(storePositions.has("b")).toBe(true);
  });

  it("BDD Scenario 4 — existing nodes do not jump when a new node arrives", () => {
    // Round 1: two nodes get placed by d3-force.
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b")], [makeLink("l1", "a", "b")]),
    );
    const ref = mount();
    const beforePositions = new Map(ref.current!.getPositions());
    const aBefore = beforePositions.get("a");
    const bBefore = beforePositions.get("b");
    expect(aBefore).toBeDefined();
    expect(bBefore).toBeDefined();

    // Round 2: a brand-new node 'c' arrives linked to 'a'. The effect must
    // re-run with 'a' and 'b' pinned to their just-computed positions.
    act(() => {
      useGraphStore.getState().addNodes(
        makeDelta([makeNode("c")], [makeLink("l2", "a", "c")]),
      );
    });

    const afterPositions = ref.current!.getPositions();
    expect(afterPositions.size).toBe(3);
    // Pin invariant — EXACT equality on x/y for the pre-existing nodes.
    expect(afterPositions.get("a")).toEqual(aBefore);
    expect(afterPositions.get("b")).toEqual(bBefore);
    // The new node got a fresh position.
    const cPos = afterPositions.get("c");
    expect(cPos).toBeDefined();
    expect(Number.isFinite(cPos!.x)).toBe(true);
    expect(Number.isFinite(cPos!.y)).toBe(true);
  });

  it("clears the store positions Map when all nodes are removed", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("a"), makeNode("b")]));
    const ref = mount();
    expect(ref.current!.getPositions().size).toBe(2);

    act(() => {
      useGraphStore.getState().removeNodes(["a", "b"]);
    });

    // `removeNodes` already prunes positions, but the effect should be a
    // no-op (positions already empty) and certainly not re-populate them.
    expect(ref.current!.getPositions().size).toBe(0);
    expect(useGraphStore.getState().positions.size).toBe(0);
  });
});

/* -------------------------------------------------------------------------
 * Structural — no @xyflow/react import (constraint from the TC).
 * ------------------------------------------------------------------------- */

describe("useForceLayout — structural constraints", () => {
  it("the hook file does not import @xyflow/react (pure d3-force computation)", () => {
    // Read the source file directly. The TC's validation criterion is
    // structural — easier to assert by inspecting imports than by hoping a
    // future refactor never sneaks one in.
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const sourcePath = resolve(__dirname, "..", "useForceLayout.ts");
    const source = readFileSync(sourcePath, "utf8");

    // Allow the substring inside comments / docstrings (the constraint is
    // about IMPORTS), so match a strict `from "@xyflow/react"` pattern that
    // only appears in import/require statements.
    expect(source).not.toMatch(/from\s+["']@xyflow\/react["']/);
    expect(source).not.toMatch(/require\(\s*["']@xyflow\/react["']\s*\)/);
  });
});
