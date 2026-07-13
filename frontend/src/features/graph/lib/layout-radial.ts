/**
 * layout-radial — `runRadialLayout` pure function (TC-02).
 *
 * Radial tree layout powered by `d3-hierarchy`. Same signature as
 * `runForceLayout` and `runTreeLayout`. Computes a polar layout
 * `(angle, radius)` then projects to Cartesian `(x, y)` with
 * `x = r·sin(θ)` / `y = -r·cos(θ)`. The negation on y places angle 0 at the
 * top of the canvas (the d3 convention is angle 0 = right, but a top-anchored
 * zero feels more natural when the root is at the centre).
 *
 * Adaptive radius (anti-overlap):
 *  d3's `.size([2π, R])` compresses every ring into a FIXED outer radius R, so
 *  a densely populated inner ring (small r, many nodes) has an arc-length per
 *  node far below the node card width — cards overlap. And a deep tree squeezes
 *  more rings into the same R, collapsing the radial gap between layers. We
 *  therefore take d3 only for the ANGLES (via `.size([2π, 1])` + a depth-scaled
 *  `.separation`) and compute each ring's radius ourselves so it grows with the
 *  ring's occupancy and with depth:
 *
 *    r[d] = max( d · MIN_RING_GAP,                       // radial gap between rings
 *                (count[d] · NODE_FOOTPRINT) / (2π) )     // arc ≥ footprint per node
 *    r[d] = max( r[d], r[d-1] + MIN_RING_GAP )            // keep rings monotonic
 *
 *  The second term is exactly the circumference needed for `count[d]` cards to
 *  sit side by side without touching, so overlap disappears and the layout
 *  scales automatically with the number of nodes. `fitView` (on by default in
 *  GraphCanvas) zooms out to fit whatever bounding box this produces, so a
 *  larger radius costs nothing at the viewport.
 *
 * Algorithm:
 *  1. `buildSpanningTree` derives the same rooted tree as `runTreeLayout`.
 *  2. `d3.tree().size([2π, 1]).separation(...)` assigns each node an angle
 *     `x` ∈ [0, 2π]; its `y` (a normalized radius) is discarded.
 *  3. Compute per-ring radii from node counts per depth (see above).
 *  4. Project to Cartesian using the d3 angle and our ring radius; the root
 *     sits at (0, 0).
 *  5. Pinned positions override the projection — same contract as the other
 *     two runners.
 *  6. The virtual super-root (forest case) is dropped from the output.
 */
import { hierarchy, tree } from "d3-hierarchy";

import type { GraphPosition } from "../state/graph-store";
import {
  buildSpanningTree,
  SUPER_ROOT_ID,
  type SpanningTreeNode,
} from "./spanning-tree";

/** Footprint reserved per node around a ring, in canvas units. Sized to the
 *  widest node card (`GraphNode` is `max-w-3xs` = 16rem ≈ 256px) plus margin,
 *  so adjacent cards on the same ring never touch. This is the value the
 *  angular-density term of the ring radius is calibrated against. */
const NODE_FOOTPRINT = 270;

/** Minimum radial gap between consecutive rings, in canvas units. Approximates
 *  the force layout's `LINK_DISTANCE` (180) with margin so a tree-laid radial
 *  subgraph reads at a comparable density and deep trees never compress. */
const MIN_RING_GAP = 200;

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

  // `.size([2π, 1])` assigns x ∈ [0, 2π] as the angle; the y (∈ [0, 1]) is a
  // normalized radius we discard — we compute the real ring radius below.
  // `.separation` is the canonical radial idiom: siblings get a unit gap,
  // cousins twice that, and dividing by `a.depth` keeps inner rings (few
  // nodes, small circumference) from over-spreading. `a.depth` is ≥ 1 for
  // every non-root node, so there is no divide-by-zero (the root is never a
  // `separation` argument).
  const layout = tree<SpanningTreeNode>()
    .size([2 * Math.PI, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
  layout(root);

  // Count real nodes per depth (the super-root, when present, sits at depth 0
  // but is not rendered — we skip it so it never inflates a ring). This feeds
  // the angular-density term of each ring's radius.
  const countPerDepth = new Map<number, number>();
  for (const node of root.descendants()) {
    if (node.data.id === SUPER_ROOT_ID) continue;
    countPerDepth.set(node.depth, (countPerDepth.get(node.depth) ?? 0) + 1);
  }

  // Precompute a monotonic radius per depth. The radius must be strictly
  // increasing with depth so an outer ring never lands inside an inner one.
  const maxDepth = countPerDepth.size === 0
    ? 0
    : Math.max(...countPerDepth.keys());
  const radiusPerDepth = new Map<number, number>();
  let prevRadius = 0;
  for (let d = 0; d <= maxDepth; d++) {
    const count = countPerDepth.get(d) ?? 0;
    // Ring 0 is the centre. When the input is a forest the "real" nodes start
    // at depth 1 (children of the virtual super-root), so a forest has no
    // node at the centre and every component root shares ring 1.
    // Angular term: smallest radius at which `count` cards fit around the ring
    // without touching. The straight-line (chord) distance between two adjacent
    // nodes is `2r·sin(π/count)`; requiring it ≥ footprint gives
    // `r ≥ footprint / (2·sin(π/count))`. With one node on the ring there is no
    // neighbour, so the term is 0. (For large `count` this ≈ the arc estimate
    // `count·footprint / 2π`.)
    const angularTerm = count >= 2
      ? NODE_FOOTPRINT / (2 * Math.sin(Math.PI / count))
      : 0;
    const radius = d === 0
      ? 0
      : Math.max(
          // Radial term: guarantees a gap of MIN_RING_GAP between rings.
          d * MIN_RING_GAP,
          angularTerm,
          // Monotonic guard: never smaller than the previous ring + a gap.
          prevRadius + MIN_RING_GAP,
        );
    radiusPerDepth.set(d, radius);
    prevRadius = radius;
  }

  for (const node of root.descendants()) {
    const id = node.data.id;
    if (id === SUPER_ROOT_ID) continue;
    const pinned = pinnedPositions.get(id);
    if (pinned !== undefined) {
      out.set(id, { x: pinned.x, y: pinned.y });
      continue;
    }
    // Polar → Cartesian. `node.x` is θ (angle, radians); the radius comes from
    // our adaptive per-depth table, not from d3's normalized y. Negating
    // sin/cos by convention puts angle 0 at the top of the canvas, which feels
    // more natural than the d3 default (angle 0 to the right) for a
    // center-rooted tree.
    const theta = node.x ?? 0;
    const radius = radiusPerDepth.get(node.depth) ?? 0;
    const x = radius * Math.sin(theta);
    const y = -radius * Math.cos(theta);
    out.set(id, { x, y });
  }

  return out;
}
