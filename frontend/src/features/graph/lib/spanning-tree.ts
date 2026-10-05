export const SUPER_ROOT_ID = "__super_root__";

export interface SpanningTreeNode {
  readonly id: string;
  readonly children: SpanningTreeNode[];
}

interface LinkPair {
  readonly source: string;
  readonly target: string;
}

export function buildSpanningTree(
  nodeIds: readonly string[],
  linkPairs: readonly LinkPair[],
): SpanningTreeNode | null {
  if (nodeIds.length === 0) return null;

  const adj = new Map<string, Set<string>>();
  for (const id of nodeIds) {
    adj.set(id, new Set());
  }
  for (const { source, target } of linkPairs) {
    if (source === target) continue;
    const srcSet = adj.get(source);
    const tgtSet = adj.get(target);
    if (!srcSet || !tgtSet) continue;
    srcSet.add(target);
    tgtSet.add(source);
  }

  const visited = new Set<string>();
  const componentRoots: SpanningTreeNode[] = [];

  const sortedByDegree = [...nodeIds].sort((a, b) => {
    const da = adj.get(a)!.size;
    const db = adj.get(b)!.size;
    if (da !== db) return db - da;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  for (const candidateRoot of sortedByDegree) {
    if (visited.has(candidateRoot)) continue;

    const rootNode: SpanningTreeNode = { id: candidateRoot, children: [] };
    const idToNode = new Map<string, SpanningTreeNode>();
    idToNode.set(candidateRoot, rootNode);
    visited.add(candidateRoot);

    const queue: string[] = [candidateRoot];
    let head = 0;
    while (head < queue.length) {
      const currentId = queue[head]!;
      head += 1;
      const currentNode = idToNode.get(currentId)!;
      const neighbours = [...adj.get(currentId)!].sort();
      for (const neighbourId of neighbours) {
        if (visited.has(neighbourId)) continue;
        visited.add(neighbourId);
        const child: SpanningTreeNode = { id: neighbourId, children: [] };
        currentNode.children.push(child);
        idToNode.set(neighbourId, child);
        queue.push(neighbourId);
      }
    }

    componentRoots.push(rootNode);
  }

  if (componentRoots.length === 1) {
    return componentRoots[0]!;
  }
  return {
    id: SUPER_ROOT_ID,
    children: componentRoots,
  };
}
