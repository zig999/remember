// Graph traversal service — UC-06 `traverseNode`.
//
// Implements the BFS engine documented in `knowledge-graph.back.md`:
//   - Per-hop materialisation (NOT recursive CTE) — the merged-node
//     substitution + decay scoring require service-layer work between hops
//     (back spec §7 / BR-13 / BR-14).
//   - `depth ∈ [1, 3]`; out-of-range -> `InvalidTraverseDepthError`
//     (BR-05).
//   - `direction = both` decomposes into two independent BFS halves
//     (outbound + inbound) merged by `link.id` after dedup (BR-22).
//   - Score = `TRAVERSAL_DECAY ** hop` (BR-14).
//   - Merged endpoints are substituted to their survivor BEFORE being
//     added to the response or enqueued for further expansion
//     (BR-13). Merged nodes themselves are NEVER expanded.
//   - The starting node is included in the result `nodes` list.
//   - link_types[] are resolved to UUIDs in the catalog cache BEFORE BFS
//     starts (BR-04).
//
// The exported `traverseNodes()` method is the INTERNAL contract consumed
// by `query-retrieval` (TC-06) — it accepts an array of starting node ids
// and returns the merged traversal result. The REST handler is a thin
// adapter that validates inputs and shapes the response.

import type { PoolClient } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type {
  TraversalLinkResponse,
  TraversalResultResponse,
} from "../dto/traversal.dto.js";
import {
  fetchTraversalHop,
  findNodeById,
  findNodesByIds,
  listProvenanceByTargets,
  type KnowledgeNodeRow,
  type LinkResolvedRow,
} from "../repository/graph.repository.js";
import {
  TRAVERSAL_DECAY,
  TRAVERSAL_DEPTH_MAX,
  TRAVERSAL_DEPTH_MIN,
} from "../traversal/config.js";
import {
  groupProvenance,
  toLinkDetail,
  toNodeSummary,
} from "./formatters.js";
import {
  InvalidTraverseDepthError,
  NodeDeletedError,
  ResourceNotFoundError,
  UnknownLinkTypeError,
} from "./errors.js";

export interface TraverseInput {
  readonly startingNodeId: string;
  readonly direction: "out" | "in" | "both";
  /** Catalog NAMES — resolved to UUIDs inside the service (BR-04). */
  readonly linkTypeNames?: readonly string[];
  readonly depth: number;
  readonly asOf?: string;
  readonly inEffectOnly: boolean;
}

/**
 * Resolve a single starting node, then defer to `traverseNodes` so REST
 * and the internal TC-06 entry points share the BFS implementation.
 *
 * Throws:
 *   - InvalidTraverseDepthError (BR-05) — depth outside [1, 3].
 *   - UnknownLinkTypeError (BR-04) — element of `linkTypeNames` not in catalog.
 *   - ResourceNotFoundError — starting node id absent.
 *   - NodeDeletedError (BR-11) — starting node tombstoned.
 *
 * On a `merged` starting node, the result substitutes the survivor as the
 * starting node id (BR-13) — the response includes the survivor in `nodes`.
 */
export async function traverseNodeService(
  client: PoolClient,
  catalog: CatalogSnapshot,
  input: TraverseInput,
  logger: Logger
): Promise<TraversalResultResponse> {
  assertDepth(input.depth);

  const linkTypeIds = resolveLinkTypeIds(catalog, input.linkTypeNames);

  // BR-11: starting node lifecycle.
  const starting = await findNodeById(client, input.startingNodeId);
  if (starting === null) {
    throw new ResourceNotFoundError("KnowledgeNode", input.startingNodeId);
  }
  if (starting.status === "deleted") {
    throw new NodeDeletedError(input.startingNodeId);
  }

  // Merged starting node — follow the pointer once. The survivor is always
  // ACTIVE (BR-13 path-compression invariant); we re-fetch to obtain the
  // canonical_name / status the response surfaces.
  let startingResolved = starting;
  if (
    starting.status === "merged" &&
    starting.merged_into_node_id !== null
  ) {
    const survivor = await findNodeById(client, starting.merged_into_node_id);
    if (survivor !== null && survivor.status !== "deleted") {
      startingResolved = survivor;
    }
  }

  const result = await traverseNodes(
    client,
    {
      startingNodeIds: [startingResolved.id],
      direction: input.direction,
      linkTypeIds,
      depth: input.depth,
      asOf: input.asOf,
      inEffectOnly: input.inEffectOnly,
    },
    logger
  );

  return {
    starting_node_id: startingResolved.id,
    nodes: result.nodes.map(toNodeSummary),
    links: result.links.slice(),
  };
}

/**
 * Internal BFS entry point — accepts an array of starting node ids so
 * `query-retrieval` (TC-06) can batch graph expansion in one call.
 *
 * The signature is part of a cross-domain contract (TC-05 -> TC-06) and
 * MUST remain stable. The shape returned is intentionally NOT the REST
 * envelope — TC-06 needs the raw node rows (to compute its own ranking).
 */
export interface TraverseNodesInput {
  readonly startingNodeIds: readonly string[];
  readonly direction: "out" | "in" | "both";
  /** Already-resolved LinkType UUIDs (resolved by the caller via catalog). */
  readonly linkTypeIds?: readonly string[];
  readonly depth: number;
  readonly asOf?: string;
  readonly inEffectOnly: boolean;
}

export interface TraverseNodesResult {
  /** All distinct nodes reached, INCLUDING the starting ids. Order is BFS. */
  readonly nodes: readonly KnowledgeNodeRow[];
  /** All distinct traversal links with hop + score. Provenance batched. */
  readonly links: readonly TraversalLinkResponse[];
}

export async function traverseNodes(
  client: PoolClient,
  input: TraverseNodesInput,
  logger: Logger
): Promise<TraverseNodesResult> {
  assertDepth(input.depth);

  // BFS state: frontier of node ids to expand at the NEXT hop, plus the
  // accumulated node + link envelopes (keyed by id for dedup).
  const visitedNodeIds = new Set<string>(input.startingNodeIds);
  const nodesById = new Map<string, KnowledgeNodeRow>();
  const linksById = new Map<string, TraversalLinkResponse>();

  // Seed the node accumulator with the starting nodes (UC-06 contract: the
  // response `nodes` list includes the starting node, BR-13 says the
  // substitution is transparent — `startingNodeIds` is the caller's
  // responsibility to substitute survivors).
  const seedRows = await findNodesByIds(client, input.startingNodeIds);
  for (const row of seedRows) {
    nodesById.set(row.id, row);
  }

  let frontier: readonly string[] = input.startingNodeIds;

  for (let hop = 1; hop <= input.depth; hop += 1) {
    if (frontier.length === 0) break;

    // Compose the directional fetch(es). `both` runs two independent halves
    // (BR-22); the union is deduped by `link.id` because a given row CAN
    // appear in both halves when the starting frontier contains an endpoint
    // of the edge in both source and target positions (rare but possible).
    const hopLinks: LinkResolvedRow[] = [];
    if (input.direction === "out" || input.direction === "both") {
      const out = await fetchTraversalHop(client, {
        currentIds: frontier,
        direction: "out",
        linkTypeIds: input.linkTypeIds,
        asOf: input.asOf,
        inEffectOnly: input.inEffectOnly,
      });
      hopLinks.push(...out);
    }
    if (input.direction === "in" || input.direction === "both") {
      const inn = await fetchTraversalHop(client, {
        currentIds: frontier,
        direction: "in",
        linkTypeIds: input.linkTypeIds,
        asOf: input.asOf,
        inEffectOnly: input.inEffectOnly,
      });
      hopLinks.push(...inn);
    }

    if (hopLinks.length === 0) break;

    // Discover the NEW endpoint node ids encountered at this hop. For each
    // hop link, the "other" endpoint is the one not in `visitedNodeIds`
    // (more precisely: the one not in the FRONTIER for this hop, since the
    // frontier defines the BFS layer boundary; but `visitedNodeIds`
    // suffices because we dedupe before enqueueing).
    const candidateNodeIds = new Set<string>();
    for (const row of hopLinks) {
      candidateNodeIds.add(row.source_node_id);
      candidateNodeIds.add(row.target_node_id);
    }

    // Fetch all candidate nodes in ONE batched query (also the place where
    // we detect merged endpoints for substitution, BR-13).
    const unknownIds = Array.from(candidateNodeIds).filter(
      (id) => !nodesById.has(id)
    );
    const fetched = await findNodesByIds(client, unknownIds);
    for (const row of fetched) nodesById.set(row.id, row);

    // BR-13 — merged-node substitution. Any candidate whose `status =
    // 'merged'` must be transparently swapped for `merged_into_node_id`
    // (always ACTIVE by invariant). We fetch the survivors in a second
    // batched query so the response `nodes` list contains BOTH the survivor
    // (visible) and never the merged loser (hidden from the envelope).
    const substitution = await buildMergedSubstitution(
      client,
      candidateNodeIds,
      nodesById
    );

    // Apply substitution to the links and aggregate them, computing hop +
    // score on first sight.
    const score = Math.pow(TRAVERSAL_DECAY, hop);
    for (const row of hopLinks) {
      const sourceId = substitution.get(row.source_node_id) ?? row.source_node_id;
      const targetId = substitution.get(row.target_node_id) ?? row.target_node_id;

      // Skip self-edges that emerged purely because of merged substitution
      // (both endpoints collapsed to the same survivor) — they convey no
      // graph information beyond what the survivor itself already provides.
      // A pre-existing self-loop (source === target in the raw row) is a
      // legitimate edge in the underlying graph and is preserved.
      const isSubstitutionInducedSelfLoop =
        sourceId === targetId && row.source_node_id !== row.target_node_id;
      if (isSubstitutionInducedSelfLoop) continue;

      // Dedup links by underlying knowledge_link.id (BR-22). Keep the
      // SMALLEST hop number seen so far (BFS guarantees the first sight is
      // the minimum hop), so we only insert on first encounter.
      if (linksById.has(row.id)) continue;

      const substitutedRow: LinkResolvedRow = {
        ...row,
        source_node_id: sourceId,
        target_node_id: targetId,
      };

      // Provenance is fetched in a batched pass AFTER all hops complete —
      // we record the link envelope skeleton here and fill provenance in a
      // single round trip at the end.
      linksById.set(row.id, {
        ...toLinkDetail(substitutedRow, []),
        hop,
        score,
      });
    }

    // Build the next frontier: substituted node ids that are NOT already
    // visited AND whose row is NOT deleted/merged (merged are never
    // enqueued — survivor takes over; deleted never reached because the
    // hop SQL excludes deleted links).
    const nextFrontier: string[] = [];
    for (const id of candidateNodeIds) {
      const substituted = substitution.get(id) ?? id;
      if (visitedNodeIds.has(substituted)) continue;
      visitedNodeIds.add(substituted);
      const row = nodesById.get(substituted);
      if (row === undefined) continue;
      if (row.status === "deleted") continue;
      if (row.status === "merged") continue; // defensive — survivor is the one we follow
      nextFrontier.push(substituted);
    }
    frontier = nextFrontier;
  }

  // BR-16 — batch provenance for ALL traversal links in ONE round trip.
  const linkIds = Array.from(linksById.keys());
  const provenanceRows = await listProvenanceByTargets(client, "link", linkIds);
  const provenanceByLinkId = groupProvenance(provenanceRows);

  // Patch provenance into each link envelope. Also surface BR-17 alarm.
  const finalLinks: TraversalLinkResponse[] = [];
  for (const [linkId, partial] of linksById.entries()) {
    const provenance = provenanceByLinkId.get(linkId) ?? [];
    if (partial.status !== "deleted" && provenance.length === 0) {
      logger.warn(
        {
          route: "GET /api/v1/nodes/:node_id/traverse",
          link_id: linkId,
          status: partial.status,
        },
        "knowledge_graph_empty_provenance"
      );
    }
    finalLinks.push({ ...partial, provenance: provenance.slice() });
  }

  // Final node list: every entry in `nodesById` whose id appears in
  // `visitedNodeIds` (i.e. seen as a link endpoint or as a starting node),
  // and that is NOT merged (merged nodes are silently hidden — only their
  // survivor is exposed). Deleted nodes were never enqueued; if one slipped
  // in via the starting-node path, the caller has already mapped to 410
  // before reaching here.
  const finalNodes: KnowledgeNodeRow[] = [];
  for (const id of visitedNodeIds) {
    const row = nodesById.get(id);
    if (row === undefined) continue;
    if (row.status === "merged") continue;
    finalNodes.push(row);
  }

  return { nodes: finalNodes, links: finalLinks };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertDepth(depth: number): void {
  if (
    !Number.isInteger(depth) ||
    depth < TRAVERSAL_DEPTH_MIN ||
    depth > TRAVERSAL_DEPTH_MAX
  ) {
    throw new InvalidTraverseDepthError(depth, TRAVERSAL_DEPTH_MAX);
  }
}

function resolveLinkTypeIds(
  catalog: CatalogSnapshot,
  names: readonly string[] | undefined
): readonly string[] | undefined {
  if (names === undefined || names.length === 0) return undefined;
  const ids: string[] = [];
  for (const name of names) {
    const row = catalog.linkTypeByName.get(name);
    if (row === undefined) {
      throw new UnknownLinkTypeError(name);
    }
    ids.push(row.id);
  }
  return ids;
}

/**
 * Build the `{ mergedId -> survivorId }` substitution map for `nodeIds`.
 * Any merged node not yet present in `nodesById` is fetched in the SAME
 * batched call we make to resolve survivors — we never issue per-node
 * queries.
 *
 * The map only contains entries where substitution applies; an active /
 * needs_review / deleted node is absent (caller falls back to identity).
 */
async function buildMergedSubstitution(
  client: PoolClient,
  candidateIds: ReadonlySet<string>,
  nodesById: Map<string, KnowledgeNodeRow>
): Promise<Map<string, string>> {
  const mergedSurvivors = new Map<string, string>();
  const survivorIdsToFetch = new Set<string>();

  for (const id of candidateIds) {
    const row = nodesById.get(id);
    if (row === undefined) continue;
    if (row.status !== "merged") continue;
    if (row.merged_into_node_id === null) continue;
    mergedSurvivors.set(id, row.merged_into_node_id);
    if (!nodesById.has(row.merged_into_node_id)) {
      survivorIdsToFetch.add(row.merged_into_node_id);
    }
  }

  if (survivorIdsToFetch.size > 0) {
    const survivors = await findNodesByIds(
      client,
      Array.from(survivorIdsToFetch)
    );
    for (const s of survivors) nodesById.set(s.id, s);
  }

  return mergedSurvivors;
}
