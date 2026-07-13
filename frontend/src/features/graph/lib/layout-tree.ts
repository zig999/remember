/**
 * layout-tree — `runTreeLayout` pure function (TC-02).
 *
 * Tidy tree (left-to-right) layout powered by `d3-hierarchy`. Same signature
 * as `runForceLayout`: takes `(nodeIds, linkPairs, pinnedPositions)` and
 * returns a fresh `Map<string, GraphPosition>` with one entry per input id.
 *
 * Orientation — left-to-right (LR):
 *  d3.tree lays a tree out along two axes: BREADTH (siblings, `node.x`) and
 *  DEPTH (parent→child layers, `node.y`). A top-down tree maps breadth→canvasX
 *  and depth→canvasY, so a high-fan-out root (a project with many tasks) spreads
 *  its children across one very wide horizontal row — a barely readable strip.
 *  We instead grow the tree rightward: DEPTH→canvasX (layers march right) and
 *  BREADTH→canvasY (siblings stack vertically). A wide fan-out then becomes a
 *  vertical column, which reads better on a wide viewport with vertical scroll.
 *  For genuinely hub-and-spoke graphs the radial layout still distributes best.
 *
 * Algorithm:
 *  1. `buildSpanningTree` derives a single rooted tree (or a virtual
 *     super-root over multiple components — see `spanning-tree.ts`).
 *  2. `d3.hierarchy()` wraps the rooted tree; `d3.tree().nodeSize([b, d])`
 *     keeps siblings ≥ `b` apart in breadth and layers ≥ `d` apart in depth.
 *  3. Project with the axes swapped (depth→x, breadth→y) for the LR growth.
 *  4. Pinned positions override the layout output — same contract as the
 *     other two runners: a pinned node never moves regardless of algorithm.
 *  5. The virtual super-root (when present) is dropped from the output.
 */
import { hierarchy, tree } from "d3-hierarchy";

import type { GraphPosition } from "../state/graph-store";
import {
  buildSpanningTree,
  SUPER_ROOT_ID,
  type SpanningTreeNode,
} from "./spanning-tree";

/** Breadth gap between sibling subtrees, in canvas units. In LR orientation
 *  this is the VERTICAL spacing between stacked siblings — sized to the node
 *  card height (~64px) plus margin so vertically adjacent cards never touch. */
const TREE_SIBLING_GAP = 110;
/** Depth gap between parent and child layers, in canvas units. In LR
 *  orientation this is the HORIZONTAL spacing between columns — sized to the
 *  widest node card (`max-w-3xs` ≈ 256px) plus room for the edge label
 *  ("faz parte de", …) that sits on the connector between columns. */
const TREE_LEVEL_GAP = 340;

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

  // `nodeSize` separates siblings by [breadth, depth] regardless of the
  // subtree shape (vs. `size` which fits everything in a bounding box). For a
  // graph that can grow per-turn we prefer constant inter-node spacing so the
  // layout stays predictable.
  const layout = tree<SpanningTreeNode>().nodeSize([
    TREE_SIBLING_GAP,
    TREE_LEVEL_GAP,
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
    // Axis swap for LR growth: d3's `node.y` (depth) → canvasX so layers march
    // rightward, and `node.x` (breadth) → canvasY so siblings stack vertically.
    // Both are guaranteed numbers after `layout(root)` (d3-hierarchy contract);
    // `?? 0` defends against a hypothetical future API change.
    out.set(id, { x: node.y ?? 0, y: node.x ?? 0 });
  }

  return out;
}
