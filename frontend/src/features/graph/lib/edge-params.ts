/**
 * getEdgeParams — pure helper for the floating-edge geometry (TC-01 / REQ-1).
 *
 * Replaces the fixed-handle coordinates React Flow injects (sourceX/Y/
 * targetX/Y, derived from each node's static `<Handle>` offset) with the
 * intersection of the center-to-center line with each node's measured
 * bounding rectangle. Result:
 *   - the edge always emerges from / lands on the *nearest* point on the
 *     node boundary, regardless of where the user drags the node;
 *   - the chosen `Position` cardinal (top/right/bottom/left) reflects the
 *     actual side the line crosses, so the bezier handle direction stays
 *     visually consistent with the link.
 *
 * The helper is intentionally pure (no React hooks, no DOM, no React Flow
 * store reads) — `GraphEdgeAdapter` calls `useInternalNode` itself and
 * passes the snapshots in. This keeps it unit-testable from a Vitest
 * harness without spinning up a `<ReactFlowProvider>`.
 *
 * Returns `null` when either node is unmeasured (no `internals` /
 * `positionAbsolute` yet, or zero-sized `measured`). Callers MUST render
 * nothing in that case — never fall back to (0,0).
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphEdge.component.spec.md §1 (floating
 *    edge), §6 Do/Don't, §7 Scenario 6
 *  - docs/specs/front/components/GraphSpace.component.spec.md §9 (Key
 *    constraints — floating-edge getEdgeParams contract)
 *  - docs/specs/front/front.md §7.1 Edge routing decision, §7.4
 *    GraphEdgeAdapter row
 */
import { Position, type InternalNode, type Node } from "@xyflow/react";

export interface FloatingEdgeParams {
  sourceX: number;
  sourceY: number;
  sourcePos: Position;
  targetX: number;
  targetY: number;
  targetPos: Position;
}

/**
 * Intersection of the segment from `other` (outside) to the centre of the
 * `node` rectangle with the node's bounding box. Returns the point on the
 * node boundary closest to `other` along the line that joins both centres.
 *
 * The math is the classic centre-to-centre rectangle clip used in the
 * React Flow "floating edges" example: parameterise the segment, solve for
 * the intersection with the four sides, keep the side whose parameter is
 * the smallest positive (= the first crossing, i.e. the rectangle
 * boundary closest to `other`).
 *
 * Coordinates: React Flow's `positionAbsolute` is the **top-left** of the
 * node; we shift to the centre to compute the geometry.
 */
function getNodeIntersection(
  node: InternalNode<Node>,
  other: InternalNode<Node>,
): { x: number; y: number } {
  const w = node.measured.width ?? 0;
  const h = node.measured.height ?? 0;
  // Caller pre-filters unmeasured nodes; this is defensive only.
  if (w === 0 || h === 0) {
    const p = node.internals.positionAbsolute;
    return { x: p.x, y: p.y };
  }
  const nodePos = node.internals.positionAbsolute;
  const otherPos = other.internals.positionAbsolute;
  const otherW = other.measured.width ?? 0;
  const otherH = other.measured.height ?? 0;

  // Centres.
  const w2 = w / 2;
  const h2 = h / 2;
  const x1 = otherPos.x + otherW / 2;
  const y1 = otherPos.y + otherH / 2;
  const x2 = nodePos.x + w2;
  const y2 = nodePos.y + h2;

  // Parametric line from (x1,y1) to (x2,y2). Solve at the rectangle of `node`.
  // Algorithm adapted from the React Flow floating-edges recipe (MIT).
  const xx1 = (x1 - x2) / (2 * w2) - (y1 - y2) / (2 * h2);
  const yy1 = (x1 - x2) / (2 * w2) + (y1 - y2) / (2 * h2);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w2 * (xx3 + yy3) + x2;
  const y = h2 * (-xx3 + yy3) + y2;

  return { x, y };
}

/**
 * Pick the cardinal `Position` of the node side that the intersection
 * point sits on. We compare the intersection coordinates against the
 * node's bounding rect — the closest edge wins.
 *
 * Tie-breaking: vertical sides (left/right) take precedence over
 * horizontal (top/bottom) at the corners — this matches the React Flow
 * reference behaviour and keeps the bezier handle direction consistent
 * for diagonal layouts.
 */
function getEdgePosition(
  node: InternalNode<Node>,
  point: { x: number; y: number },
): Position {
  const nodePos = node.internals.positionAbsolute;
  const w = node.measured.width ?? 0;
  const h = node.measured.height ?? 0;

  const nx = Math.round(nodePos.x);
  const ny = Math.round(nodePos.y);
  const px = Math.round(point.x);
  const py = Math.round(point.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + w - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + h - 1) return Position.Bottom;
  // Fallback — degenerate cases (rounding) — pick bottom for top-down
  // layouts so the source handle keeps its default orientation.
  return Position.Bottom;
}

/**
 * Compute the floating-edge endpoints + cardinal positions for an edge
 * between `source` and `target`. Returns `null` when either node is
 * unmeasured (no measured width/height) — the adapter MUST render
 * nothing in that case (see GraphEdge.spec §1 + §6 Do/Don't).
 */
export function getEdgeParams(
  source: InternalNode<Node> | null | undefined,
  target: InternalNode<Node> | null | undefined,
): FloatingEdgeParams | null {
  if (!source || !target) return null;
  const sw = source.measured.width ?? 0;
  const sh = source.measured.height ?? 0;
  const tw = target.measured.width ?? 0;
  const th = target.measured.height ?? 0;
  if (sw === 0 || sh === 0 || tw === 0 || th === 0) return null;

  const sourceIntersection = getNodeIntersection(source, target);
  const targetIntersection = getNodeIntersection(target, source);
  const sourcePos = getEdgePosition(source, sourceIntersection);
  const targetPos = getEdgePosition(target, targetIntersection);

  return {
    sourceX: sourceIntersection.x,
    sourceY: sourceIntersection.y,
    sourcePos,
    targetX: targetIntersection.x,
    targetY: targetIntersection.y,
    targetPos,
  };
}
