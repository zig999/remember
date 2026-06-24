/**
 * layout-radial — `runRadialLayout` pure function (TC-02).
 *
 * Radial tree layout powered by `d3-hierarchy`. Same signature as
 * `runForceLayout` and `runTreeLayout`. Computes a polar layout
 * `(angle, radius)` via `d3.tree().size([2π, R])` then projects to Cartesian
 * `(x, y)` with `x = r·sin(θ)` / `y = -r·cos(θ)`. The negation on y places
 * angle 0 at the top of the canvas (the d3 convention is angle 0 = right,
 * but a top-anchored zero feels more natural when the root is at the centre).
 *
 * Algorithm:
 *  1. `buildSpanningTree` derives the same rooted tree as `runTreeLayout`.
 *  2. `d3.tree().size([2π, RADIAL_RADIUS])` assigns each node `x` ∈ [0, 2π]
 *     (the angle in radians) and `y` ∈ [0, R] (the distance from the centre).
 *  3. Project to Cartesian; the root sits at (0, 0).
 *  4. Pinned positions override the projection — same contract as the other
 *     two runners.
 *  5. The virtual super-root (forest case) is dropped from the output.
 */
import { hierarchy, tree } from "d3-hierarchy";

import type { GraphPosition } from "../state/graph-store";
import {
  buildSpanningTree,
  SUPER_ROOT_ID,
  type SpanningTreeNode,
} from "./spanning-tree";

/** Outer-ring radius, in canvas units. Tuned so a 5–10 node tree fits inside
 *  the default React Flow viewport without immediately needing `fitView`. */
const RADIAL_RADIUS = 320;

/**
 * Radial tree layout.
 *
 * @param nodeIds         The ids to lay out.
 * @param linkPairs       Undirected edges; used to derive the spanning tree.
 * @param pinnedPositions Pinned coordinates overriding the projection.
 * @returns A fresh Map keyed by node id with finite `{x, y}` values.
 */
export function runRadialLayout(
  nodeIds: readonly string[],
  linkPairs: readonly { readonly source: string; readonly target: string }[],
  pinnedPositions: ReadonlyMap<string, GraphPosition>,
): Map<string, GraphPosition> {
  const out = new Map<string, GraphPosition>();
  if (nodeIds.length === 0) return out;

  const rootSpan = buildSpanningTree(nodeIds, linkPairs);
  if (rootSpan === null) return out;

  const root = hierarchy<SpanningTreeNode>(rootSpan, (d) => d.children);

  // `.size([2π, R])` assigns x ∈ [0, 2π] as the angle and y ∈ [0, R] as the
  // radius. With only one node `x` is 0 (centre) — the projection below
  // places it at (0, 0).
  const layout = tree<SpanningTreeNode>().size([
    2 * Math.PI,
    RADIAL_RADIUS,
  ]);
  layout(root);

  for (const node of root.descendants()) {
    const id = node.data.id;
    if (id === SUPER_ROOT_ID) continue;
    const pinned = pinnedPositions.get(id);
    if (pinned !== undefined) {
      out.set(id, { x: pinned.x, y: pinned.y });
      continue;
    }
    // Polar → Cartesian. We treat `node.x` as θ (angle, radians) and
    // `node.y` as r (radius). Negating sin/cos by convention puts angle 0
    // at the top of the canvas, which feels more natural than the d3
    // default (angle 0 to the right) for a center-rooted tree.
    const theta = node.x ?? 0;
    const radius = node.y ?? 0;
    const x = radius * Math.sin(theta);
    const y = -radius * Math.cos(theta);
    out.set(id, { x, y });
  }

  return out;
}
