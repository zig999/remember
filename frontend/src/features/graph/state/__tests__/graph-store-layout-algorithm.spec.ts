/**
 * graph-store — layoutAlgorithm + snapshot v2 (TC-02).
 *
 * Why these tests matter:
 *  - `setLayoutAlgorithm` is the single new writer: it must (a) update the
 *    algorithm slice, (b) bump `layoutNonce` so the dispatcher re-runs, and
 *    (c) discard `userPinned` (the user just asked for a fresh layout under
 *    a different algorithm — preserving stale pins would partly override
 *    the new shape).
 *  - `setLayoutAlgorithm(currentAlgo)` is a no-op — preserves `layoutNonce`
 *    so a redundant click doesn't tag a save and a force-layout re-run.
 *  - `getSnapshot` returns v2 with `layout_algorithm`.
 *  - `hydrate` accepts v1 (defaults `layoutAlgorithm` to `'force'`) AND v2
 *    (restores the stored algorithm). This is the explicit backward-compat
 *    requirement called out in the TC.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { useGraphStore } from "../graph-store";

beforeEach(() => {
  useGraphStore.getState().clear();
});

describe("setLayoutAlgorithm", () => {
  it("defaults to 'force' on a freshly-cleared store", () => {
    expect(useGraphStore.getState().layoutAlgorithm).toBe("force");
  });

  it("switches the algorithm AND bumps layoutNonce", () => {
    const before = useGraphStore.getState().layoutNonce;
    useGraphStore.getState().setLayoutAlgorithm("tree");
    const after = useGraphStore.getState();
    expect(after.layoutAlgorithm).toBe("tree");
    expect(after.layoutNonce).toBe(before + 1);
  });

  it("discards userPinned when the algorithm changes", () => {
    // Seed a pinned node so we can confirm setLayoutAlgorithm clears it.
    useGraphStore.getState().addNodes({
      sourceTool: "list_nodes",
      nodes: [{ id: "x", type: "concept", label: "X" }],
      links: [],
    });
    useGraphStore.getState().setNodePosition("x", { x: 10, y: 20 });
    expect(useGraphStore.getState().userPinned.has("x")).toBe(true);

    useGraphStore.getState().setLayoutAlgorithm("radial");
    expect(useGraphStore.getState().userPinned.size).toBe(0);
  });

  it("is a no-op when called with the current algorithm (no nonce bump)", () => {
    // Initial state: force, nonce 0. Calling setLayoutAlgorithm('force')
    // must NOT bump the nonce — otherwise every redundant click costs a
    // layout re-run and a debounced PUT to the BFF.
    const before = useGraphStore.getState().layoutNonce;
    useGraphStore.getState().setLayoutAlgorithm("force");
    expect(useGraphStore.getState().layoutNonce).toBe(before);
    expect(useGraphStore.getState().layoutAlgorithm).toBe("force");
  });
});

describe("getSnapshot — v2", () => {
  it("returns version: 2 and includes layout_algorithm", () => {
    useGraphStore.getState().setLayoutAlgorithm("tree");
    const snap = useGraphStore.getState().getSnapshot();
    expect(snap.version).toBe(2);
    expect(snap.layout_algorithm).toBe("tree");
  });

  it("carries the default 'force' algorithm when never explicitly set", () => {
    const snap = useGraphStore.getState().getSnapshot();
    expect(snap.layout_algorithm).toBe("force");
  });
});

describe("hydrate — backward compatibility", () => {
  it("accepts a v1 snapshot and defaults layoutAlgorithm to 'force'", () => {
    // A graph saved before TC-02 has no `layout_algorithm` field. The
    // store must hydrate without throwing and leave the algorithm at the
    // default ('force').
    useGraphStore.getState().hydrate({
      version: 1,
      nodes: [{ id: "n1", type: "concept", label: "N1" }],
      links: [],
      positions: { n1: { x: 5, y: 7 } },
      user_pinned: [],
    });
    const s = useGraphStore.getState();
    expect(s.layoutAlgorithm).toBe("force");
    expect(s.nodes.size).toBe(1);
    expect(s.positions.get("n1")).toEqual({ x: 5, y: 7 });
  });

  it("accepts a v2 snapshot and restores the stored layoutAlgorithm", () => {
    useGraphStore.getState().hydrate({
      version: 2,
      nodes: [{ id: "n1", type: "concept", label: "N1" }],
      links: [],
      positions: { n1: { x: 1, y: 2 } },
      user_pinned: [],
      layout_algorithm: "radial",
    });
    expect(useGraphStore.getState().layoutAlgorithm).toBe("radial");
  });
});
