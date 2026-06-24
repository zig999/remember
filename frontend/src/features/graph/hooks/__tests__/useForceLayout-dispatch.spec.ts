/**
 * useForceLayout — algorithm dispatcher (TC-02).
 *
 * Why these tests matter:
 *  - The hook's job changed: it used to call `runForceLayout` directly;
 *    now it dispatches to one of three runners based on
 *    `state.layoutAlgorithm`. We pin the dispatch behaviour by switching
 *    algorithm and verifying that positions reflect the new layout — the
 *    tree layout places child nodes at a known offset that no
 *    force-layout output would produce by accident (the force field
 *    centres at (0, 0) and pushes nodes apart with charge, while tree
 *    places a single root at exactly (0, 0)).
 *  - Backward compatibility with the existing force path is covered by
 *    the unchanged `useForceLayout.spec.ts` file — this test is additive.
 */
// @ts-expect-error — global set for test environment only (enables async act)
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  act,
  createRef,
  useImperativeHandle,
  type RefObject,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import * as React from "react";

import { useGraphStore } from "../../state/graph-store";
import { useForceLayout } from "../useForceLayout";
import type { GraphDelta } from "../../types";

interface Harness {
  getPositions: () => ReadonlyMap<string, { x: number; y: number }>;
}

function Host({
  refObj,
}: {
  refObj: RefObject<Harness | null>;
}): React.ReactElement {
  const positions = useForceLayout();
  useImperativeHandle(
    refObj,
    () => ({ getPositions: () => positions }),
    [positions],
  );
  return React.createElement("div");
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  useGraphStore.getState().clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(): RefObject<Harness | null> {
  const ref = createRef<Harness | null>();
  act(() => {
    root.render(React.createElement(Host, { refObj: ref }));
  });
  return ref;
}

function makeDelta(): GraphDelta {
  // Use ids that disambiguate by degree (hub has degree 2, leaves degree 1)
  // so the highest-degree root pick is deterministic regardless of id sort
  // — the tree runner picks 'hub' as root, NOT the alphabetically-smallest
  // id.
  return {
    sourceTool: "list_nodes",
    nodes: [
      { id: "hub", type: "concept", label: "Hub" },
      { id: "z-leaf-a", type: "concept", label: "Leaf A" },
      { id: "z-leaf-b", type: "concept", label: "Leaf B" },
    ],
    links: [
      { id: "l1", source: "hub", target: "z-leaf-a", label: "rel", isTemporal: false },
      { id: "l2", source: "hub", target: "z-leaf-b", label: "rel", isTemporal: false },
    ],
  };
}

describe("useForceLayout — algorithm dispatch", () => {
  it("under 'tree', the hub (highest-degree root) sits at y=0 — a tree-layout signature", () => {
    // Switch BEFORE adding nodes so the very first effect runs with the
    // tree dispatcher selected.
    useGraphStore.getState().setLayoutAlgorithm("tree");
    useGraphStore.getState().addNodes(makeDelta());

    const ref = mount();
    const positions = ref.current!.getPositions();
    expect(positions.size).toBe(3);
    const hubPos = positions.get("hub")!;
    expect(hubPos).toBeDefined();
    // d3.tree() with nodeSize places the root at y=0 (the layer at depth 0).
    // Leaves at depth 1 sit at y = TREE_LAYER_HEIGHT. The force runner would
    // NEVER produce y=0 exactly for a settled simulation — charge + center
    // pull the root off the origin by a small but non-zero amount.
    expect(hubPos.y).toBeCloseTo(0);
    // Both leaves sit at the SAME y (one layer below the hub) — a tree
    // invariant that force-layout violates.
    const leafAY = positions.get("z-leaf-a")!.y;
    const leafBY = positions.get("z-leaf-b")!.y;
    expect(leafAY).toBeCloseTo(leafBY);
    expect(leafAY).toBeGreaterThan(hubPos.y);
  });

  it("switching the algorithm re-runs the layout (positions change after setLayoutAlgorithm)", () => {
    // Start with force. After the first effect, capture the positions.
    useGraphStore.getState().addNodes(makeDelta());
    const ref = mount();
    const beforePositions = new Map(ref.current!.getPositions());
    expect(beforePositions.size).toBe(3);
    const hubBefore = beforePositions.get("hub")!;

    // Switch to radial — `setLayoutAlgorithm` bumps layoutNonce, the effect
    // re-runs, and the radial root (single rooted tree) sits at (0, 0).
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm("radial");
    });

    const afterPositions = ref.current!.getPositions();
    const hubAfter = afterPositions.get("hub")!;
    // The radial root lands at (0, 0) exactly — the force-layout root
    // would not. So a change in at least one axis must be observable.
    const moved =
      Math.abs(hubAfter.x - hubBefore.x) > 0.001 ||
      Math.abs(hubAfter.y - hubBefore.y) > 0.001;
    expect(moved).toBe(true);
    expect(hubAfter.x).toBeCloseTo(0);
    expect(hubAfter.y).toBeCloseTo(0);
  });
});
