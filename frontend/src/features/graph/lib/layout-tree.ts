/**
 * layout-tree — `runTreeLayout` pure function (TC-02).
 *
 * Tidy tree (top-down) layout powered by `d3-hierarchy`. Same signature as
 * `runForceLayout`: takes `(nodeIds, linkPairs, pinnedPositions)` and returns
 * a fresh `Map<string, GraphPosition>` with one entry per input node id.
 *
 * Algorithm:
 *  1. `buildSpanningTree` derives a single rooted tree (or a virtual
 *     super-root over multiple components — see `spanning-tree.ts`).
 *  2. `d3.hierarchy()` wraps the rooted tree; `d3.tree().nodeSize([w, h])`
 *     computes (x, y) for every node so siblings keep at least `w` apart
 *     horizontally and parent/child layers are `h` apart vertically.
 *  3. Pinned positions override the layout output — same contract as the
 *     other two runners: a pinned node never moves regardless of algorithm.
 *  4. The virtual super-root (when present) is dropped from the output.
 *
 * Calibration:
 *  - LINK_DISTANCE ≈ 180px is the force-layout link target; we calibrate
 *    nodeSize roughly to that scale so visual density across algorithms
 *    stays comparable. Treat the numbers below as implementation judgment —
 *    `assumptions_allowed` covers this.
 */
import { hierarchy, tree } from "d3-hierarchy";

import type { GraphPosition } from "../state/graph-store";
import {
  buildSpanningTree,
  SUPER_ROOT_ID,
  type SpanningTreeNode,
} from "./spanning-tree";

/** Horizontal gap between sibling subtrees, in canvas units. Approximates
 *  the d3-force `LINK_DISTANCE` so a tree-laid subgraph looks comparable in
 *  density to the force version. */
const TREE_NODE_WIDTH = 200;
/** Vertical gap between layers, in canvas units. */
const TREE_LAYER_HEIGHT = 140;

/**
 * Tidy tree (top-down) layout.
 *
 * @param nodeIds         The ids to lay out (every id appears in the result).
 * @param linkPairs       Undirected edges; used to derive the spanning tree.
 *                        Cross-links not in the spanning tree are ignored
 *                        here — they remain visible as floating edges in RF.
 * @param pinnedPositions Map of `id → {x, y}`. Any id in this map keeps its
 *                        exact coordinates in the output, regardless of what
 *                        the tree would have placed it at.
 * @returns A fresh Map with one entry per `nodeIds`. Coordinates are finite
 *          numbers (d3-tree produces finite values for any finite input).
 */
export function runTreeLayout(
  nodeIds: readonly string[],
  linkPairs: readonly { readonly source: string; readonly target: string }[],
  pinnedPositions: ReadonlyMap<string, GraphPosition>,
): Map<string, GraphPosition> {
  const out = new Map<string, GraphPosition>();
  if (nodeIds.length === 0) return out;

  const rootSpan = buildSpanningTree(nodeIds, linkPairs);
  // Defensive — `buildSpanningTree` only returns null on empty input.
  if (rootSpan === null) return out;

  // d3.hierarchy + tree() walk the SpanningTreeNode structure. We pass the
  // children accessor explicitly because the default reads `data.children`
  // — works here too, but being explicit documents the shape.
  const root = hierarchy<SpanningTreeNode>(rootSpan, (d) => d.children);

  // `nodeSize` separates siblings by [w, h] regardless of the subtree shape
  // (vs. `size` which fits everything in a bounding box). For a graph that
  // can grow per-turn we prefer constant inter-node spacing so the layout
  // stays predictable.
  const layout = tree<SpanningTreeNode>().nodeSize([
    TREE_NODE_WIDTH,
    TREE_LAYER_HEIGHT,
  ]);
  layout(root);

  // Collect every laid-out node into the output Map. d3-hierarchy's
  // `.descendants()` returns the root + every descendant in BFS order.
  for (const node of root.descendants()) {
    const id = node.data.id;
    // Drop the virtual super-root — it carries no real node.
    if (id === SUPER_ROOT_ID) continue;
    const pinned = pinnedPositions.get(id);
    if (pinned !== undefined) {
      out.set(id, { x: pinned.x, y: pinned.y });
      continue;
    }
    // `node.x`/`node.y` are guaranteed numbers after `layout(root)` runs
    // (d3-hierarchy's contract). `?? 0` defends against a hypothetical
    // future API change — keeps `out` valued.
    out.set(id, { x: node.x ?? 0, y: node.y ?? 0 });
  }

  return out;
}
