import { hierarchy, tree } from "d3-hierarchy";

import type { GraphPosition } from "../state/graph-store";
import {
  buildSpanningTree,
  SUPER_ROOT_ID,
  type SpanningTreeNode,
} from "./spanning-tree";

const NODE_FOOTPRINT = 270;

const MIN_RING_GAP = 200;

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

  const layout = tree<SpanningTreeNode>()
    .size([2 * Math.PI, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
  layout(root);

  const countPerDepth = new Map<number, number>();
  for (const node of root.descendants()) {
    if (node.data.id === SUPER_ROOT_ID) continue;
    countPerDepth.set(node.depth, (countPerDepth.get(node.depth) ?? 0) + 1);
  }

  const maxDepth = countPerDepth.size === 0
    ? 0
    : Math.max(...countPerDepth.keys());
  const radiusPerDepth = new Map<number, number>();
  let prevRadius = 0;
  for (let d = 0; d <= maxDepth; d++) {
    const count = countPerDepth.get(d) ?? 0;
    const angularTerm = count >= 2
      ? NODE_FOOTPRINT / (2 * Math.sin(Math.PI / count))
      : 0;
    const radius = d === 0
      ? 0
      : Math.max(
          d * MIN_RING_GAP,
          angularTerm,
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
    const theta = node.x ?? 0;
    const radius = radiusPerDepth.get(node.depth) ?? 0;
    const x = radius * Math.sin(theta);
    const y = -radius * Math.cos(theta);
    out.set(id, { x, y });
  }

  return out;
}
