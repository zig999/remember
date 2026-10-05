import { Position, type InternalNode, type Node } from "@xyflow/react";

export interface FloatingEdgeParams {
  sourceX: number;
  sourceY: number;
  sourcePos: Position;
  targetX: number;
  targetY: number;
  targetPos: Position;
}

function getNodeIntersection(
  node: InternalNode<Node>,
  other: InternalNode<Node>,
): { x: number; y: number } {
  const w = node.measured.width ?? 0;
  const h = node.measured.height ?? 0;
  if (w === 0 || h === 0) {
    const p = node.internals.positionAbsolute;
    return { x: p.x, y: p.y };
  }
  const nodePos = node.internals.positionAbsolute;
  const otherPos = other.internals.positionAbsolute;
  const otherW = other.measured.width ?? 0;
  const otherH = other.measured.height ?? 0;

  const w2 = w / 2;
  const h2 = h / 2;
  const x1 = otherPos.x + otherW / 2;
  const y1 = otherPos.y + otherH / 2;
  const x2 = nodePos.x + w2;
  const y2 = nodePos.y + h2;

  const xx1 = (x1 - x2) / (2 * w2) - (y1 - y2) / (2 * h2);
  const yy1 = (x1 - x2) / (2 * w2) + (y1 - y2) / (2 * h2);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w2 * (xx3 + yy3) + x2;
  const y = h2 * (-xx3 + yy3) + y2;

  return { x, y };
}

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
  return Position.Bottom;
}

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
