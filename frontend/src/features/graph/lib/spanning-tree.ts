/**
 * spanning-tree — shared BFS spanning-tree builder for the tree/radial
 * layout runners (TC-02).
 *
 * Why this seam:
 *  - `runTreeLayout` and `runRadialLayout` both feed d3-hierarchy a single
 *    rooted tree. The input graph is undirected (link source/target are just
 *    endpoints — see `GraphLinkData`) and may be a forest (disconnected
 *    components). We derive ONE virtual rooted tree that covers every input
 *    node:
 *      1. Pick the highest-degree node as the root of each component (tie:
 *         smallest id — stable across runs so the same delta always lays out
 *         the same way).
 *      2. Run BFS from each component root to derive its spanning tree.
 *      3. If there is more than one component, attach all component roots as
 *         children of a single virtual super-root.
 *  - Cross-links (edges that close a cycle in BFS) are NOT in the spanning
 *    tree. They remain in React Flow as floating edges — that's the
 *    contract called out in the TC's `known_context`.
 *
 * The super-root carries a sentinel id so callers can drop it from the
 * output position Map.
 */

/** Sentinel id used for the virtual super-root attached to component roots
 *  when the input graph is a forest. Callers must filter this id out of the
 *  output Map — the super-root is a layout artifact, not a real node. */
export const SUPER_ROOT_ID = "__super_root__";

/** Plain tree-node shape consumed by `d3.hierarchy(rootNode, ...)`. The
 *  children array is empty for leaves. */
export interface SpanningTreeNode {
  readonly id: string;
  readonly children: SpanningTreeNode[];
}

/** A link pair as accepted by the layout runners — `source`/`target` are
 *  node ids; direction is ignored for spanning-tree purposes. */
interface LinkPair {
  readonly source: string;
  readonly target: string;
}

/**
 * Build a spanning tree from the input nodeIds + linkPairs. Returns:
 *  - A single SpanningTreeNode covering every input id.
 *  - When the input is a forest (≥ 2 components) the returned root has id
 *    `SUPER_ROOT_ID` and children = component roots. Callers drop the
 *    super-root from the output position Map.
 *  - When the input is a single connected graph the returned root is a real
 *    node — the highest-degree node in the graph (tie: smallest id).
 *
 * Empty `nodeIds` returns `null` — caller short-circuits to an empty Map.
 *
 * @throws never. Cycles and self-loops are tolerated (BFS visits each node
 *   exactly once via the `visited` set).
 */
export function buildSpanningTree(
  nodeIds: readonly string[],
  linkPairs: readonly LinkPair[],
): SpanningTreeNode | null {
  if (nodeIds.length === 0) return null;

  // Build the undirected adjacency list. We use a Map<string, Set<string>>
  // so duplicate edges (e.g. an edge added twice in a delta) collapse to
  // one neighbour entry — BFS would see them as one regardless.
  const adj = new Map<string, Set<string>>();
  for (const id of nodeIds) {
    adj.set(id, new Set());
  }
  for (const { source, target } of linkPairs) {
    // Defensive: skip a link whose endpoint is not in nodeIds — same posture
    // as runForceLayout. A self-loop (source === target) is also dropped:
    // it would create a child node with the same id as its parent, which
    // d3-hierarchy then rejects as a cycle.
    if (source === target) continue;
    const srcSet = adj.get(source);
    const tgtSet = adj.get(target);
    if (!srcSet || !tgtSet) continue;
    srcSet.add(target);
    tgtSet.add(source);
  }

  // Component-by-component BFS. For each unvisited id, pick the highest-
  // degree unvisited node (tiebreak: smallest id) as the component root,
  // then walk BFS from it.
  const visited = new Set<string>();
  const componentRoots: SpanningTreeNode[] = [];

  // Sort ids by (-degree, id) once — `findUnvisited` can then take the first
  // remaining entry. Stable order so the same graph always produces the same
  // tree (key for snapshot/regression tests).
  const sortedByDegree = [...nodeIds].sort((a, b) => {
    const da = adj.get(a)!.size;
    const db = adj.get(b)!.size;
    if (da !== db) return db - da; // higher degree first
    return a < b ? -1 : a > b ? 1 : 0; // smaller id first
  });

  for (const candidateRoot of sortedByDegree) {
    if (visited.has(candidateRoot)) continue;

    // BFS from candidateRoot. We materialise nodes as we discover them and
    // wire each one into its parent's children array, so the final root
    // already carries the full subtree on return.
    const rootNode: SpanningTreeNode = { id: candidateRoot, children: [] };
    const idToNode = new Map<string, SpanningTreeNode>();
    idToNode.set(candidateRoot, rootNode);
    visited.add(candidateRoot);

    // Use a single queue array as a FIFO with a head index — avoids the
    // O(n) shift() cost on large components.
    const queue: string[] = [candidateRoot];
    let head = 0;
    while (head < queue.length) {
      const currentId = queue[head]!;
      head += 1;
      const currentNode = idToNode.get(currentId)!;
      // Iterate neighbours in stable id order so the tree shape is
      // deterministic across runs / browsers (Set iteration order is
      // insertion-order, but neighbours arrive in link-list order, which
      // is also stable — we still sort to defend against future churn).
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

  // Single component → real root. Forest → virtual super-root that wraps
  // every component root. Callers strip the super-root from the output.
  if (componentRoots.length === 1) {
    return componentRoots[0]!;
  }
  return {
    id: SUPER_ROOT_ID,
    children: componentRoots,
  };
}
