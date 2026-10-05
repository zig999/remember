import { hierarchy, tree } from "d3-hierarchy";

import type { GraphPosition } from "../state/graph-store";
import {
  buildSpanningTree,
  SUPER_ROOT_ID,
  type SpanningTreeNode,
} from "./spanning-tree";

const TREE_SIBLING_GAP = 110;
const TREE_LEVEL_GAP = 340;

export function runTreeLayout(
  nodeIds: readonly string[],
  linkPairs: readonly { readonly source: string; readonly target: string }[],
  pinnedPositions: ReadonlyMap<string, GraphPosition>,
): Map<string, GraphPosition> {
  const out = new Map<string, GraphPosition>();
  if (nodeIds.length === 0) return out;

  const rootSpan = buildSpanningTree(nodeIds, linkPairs);
  if (rootSpan === null) return out;

  const root = hierarchy<SpanningTreeNode>(rootSpan, (d) => d.children);

  const layout = tree<SpanningTreeNode>().nodeSize([
    TREE_SIBLING_GAP,
    TREE_LEVEL_GAP,
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
    out.set(id, { x: node.y ?? 0, y: node.x ?? 0 });
  }

  return out;
}
