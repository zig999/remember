/**
 * useIngestGraphAssembly — parallel traverse + graph assembly for /ingest
 * (TC-03 of EPIC-01).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §1 (traverseNode
 *    operationId), §4 Step 4 (parallel useQueries, staleTime 5min, link
 *    dedup), §4 Composed models, §2 UI-08 (revealing state), §2 FL-08
 *    (absent `affected_nodes` → no graph fetch).
 *  - docs/specs/front/_flows/ingest.flow.md Sub-flow A steps 12-15;
 *    Sub-flow C step 6-7; FL-08.
 *
 * Behaviour:
 *  1. For each entry in `affectedNodes`, fires a parallel
 *     `GET /api/v1/nodes/:id/traverse?depth=1` via `useQueries`. `staleTime`
 *     is 5 min and `refetchOnWindowFocus` is `false` — graph links do NOT
 *     change during an ingest session (Step 4 of the feature spec).
 *  2. When ALL queries succeed: dedupes links by `id` (the same link may
 *     appear in multiple traversals), maps the wire payload to the surface
 *     `GraphDelta` shape, and calls `useGraphStore.replaceNodes(delta)` +
 *     `useGraphStore.setStatus("revealing")` — exactly once per assembly.
 *  3. When `affectedNodes` is `null` or `undefined` (FL-08): NO queries are
 *     fired and the store is NOT touched. The graph remains in
 *     `status='empty'` after extraction; the operator sees the no-graph
 *     fallback in the right pane.
 *
 * Why the wire mapping lives inline (not imported from `features/chat`):
 *  - Cross-feature imports are forbidden (`Constraint`: "No imports from
 *    `features/chat`"). The chat dispatcher will be migrated to a shared
 *    `features/graph/api/mapWireToGraphDelta.ts` in a follow-up Task
 *    Contract; until then, the assembly hook holds its own minimal mapper
 *    that uses the public `features/graph/lib/map.ts` primitives
 *    (`mapNodeType`, `mapLinkTypeLabel`, `deriveNodeState`,
 *    `deriveLinkState`).
 *
 * Wire shape assumption (`assumptions_allowed` in tc-003.md):
 *  - The traverse endpoint returns `{ nodes: GraphNodeWire[], links:
 *    GraphLinkWire[] }` with the same field shape as the SSE `graph_delta`
 *    frame — i.e. `link_type_label`, `is_temporal`, `flags` projected by
 *    the backend `graph-normalizer.ts`. The wire `LinkDetail` in
 *    `openapi.yaml` is a superset; the mapper reads only the fields it
 *    needs and ignores the rest.
 */
import { useEffect, useRef } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import {
  useGraphStore,
  type GraphLinkData,
  type GraphNodeData,
  type GraphDelta,
  type GraphLinkWire,
  type GraphNodeWire,
} from "@/features/graph";
import {
  deriveLinkState,
  deriveNodeState,
  mapLinkTypeLabel,
  mapNodeType,
} from "@/features/graph/lib/map";
import { authHeader } from "./_request";

const STALE_MS = 5 * 60_000;

/** Minimum subset of an affected node the assembly hook needs. Sourced from
 *  the `affected_nodes` array on the extraction result (FL-08 / Step 4). */
export interface IngestAffectedNode {
  readonly id: string;
  readonly canonical_name: string;
  readonly node_type: string;
}

/** Traverse wire payload — the slice of the response the assembly hook
 *  actually consumes. Mirrors the shape projected by the backend
 *  `graph-normalizer.ts` (see `assumptions_allowed` in tc-003.md). */
interface IngestTraverseWire {
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}

export interface UseIngestGraphAssemblyResult {
  /** Any traverse query is still in flight. `false` when `affectedNodes`
   *  is absent (FL-08). */
  readonly isLoading: boolean;
  /** At least one traverse query failed. `false` when `affectedNodes` is
   *  absent (FL-08). */
  readonly isError: boolean;
  /** All traverse queries resolved AND the store was updated. `false`
   *  when `affectedNodes` is absent (FL-08). */
  readonly isSuccess: boolean;
}

/**
 * Run depth-1 traversals for every affected node in parallel and assemble
 * the resulting subgraph into a single `GraphDelta` written to
 * `useGraphStore`.
 *
 * @param affectedNodes — list of nodes whose neighbourhoods to fetch.
 *   `null` / `undefined` triggers the FL-08 no-op path (no queries,
 *   no store mutation, `isLoading/isError/isSuccess` all `false`).
 */
export function useIngestGraphAssembly(
  affectedNodes: ReadonlyArray<IngestAffectedNode> | null | undefined,
): UseIngestGraphAssemblyResult {
  const nodes = affectedNodes ?? [];
  // The `enabled` predicate guards against the FL-08 path: `useQueries`
  // produces an empty result list, and the empty derived flags below all
  // collapse to `false` (the result the spec mandates for FL-08).
  const enabled = affectedNodes != null && affectedNodes.length > 0;

  const queries = useQueries({
    queries: nodes.map((node) => ({
      queryKey: ["ingest", "traverse", node.id] as const,
      queryFn: async (): Promise<IngestTraverseWire> => {
        const wire = await http<IngestTraverseWire>(
          `/api/v1/nodes/${encodeURIComponent(node.id)}/traverse?depth=1`,
          { method: "GET", headers: authHeader() },
        );
        return wire;
      },
      enabled,
      staleTime: STALE_MS,
      refetchOnWindowFocus: false,
    })),
  });

  const isLoading = enabled && queries.some((q) => q.isLoading);
  const isError = enabled && queries.some((q) => q.isError);
  const isSuccess =
    enabled && queries.length > 0 && queries.every((q) => q.isSuccess);

  // Idempotency latch — `replaceNodes` + `setStatus` fire EXACTLY ONCE per
  // successful assembly. Without the latch, every re-render after success
  // would re-replace the graph and re-trigger the reveal animation. The ref
  // is keyed by the concatenated affected-node ids: a different ingest
  // session (different set of affected ids) MUST be allowed to re-assemble.
  const assembledForKeyRef = useRef<string | null>(null);
  const affectedKey = enabled ? nodes.map((n) => n.id).join("|") : null;

  useEffect(() => {
    if (!isSuccess) return;
    if (affectedKey === null) return;
    if (assembledForKeyRef.current === affectedKey) return;

    const delta = assembleDelta(queries);
    useGraphStore.getState().replaceNodes(delta);
    useGraphStore.getState().setStatus("revealing");
    assembledForKeyRef.current = affectedKey;
  }, [isSuccess, affectedKey, queries]);

  return { isLoading, isError, isSuccess };
}

/* -------------------------------------------------------------------------
 * Internal: assemble the deduplicated GraphDelta from N traverse results.
 *
 * Pure code (Golden Rule 5 — no LLM), exported under-test only via the
 * hook surface. Kept private to this file because it depends on the wire
 * shape contract enforced by the queryFn above.
 * ------------------------------------------------------------------------- */
function assembleDelta(
  queries: ReadonlyArray<UseQueryResult<IngestTraverseWire>>,
): GraphDelta {
  // Deduplicate by id using Maps — same node / link may appear in
  // multiple traversals (a hub node neighboured by two affected ids will
  // surface twice). Last write wins; the wire payload is identical across
  // calls because traverse is read-only and `staleTime: 5min` pins the
  // cache, so "last wins" is benign.
  const nodesById = new Map<string, GraphNodeData>();
  const linksById = new Map<string, GraphLinkData>();

  for (const q of queries) {
    const data = q.data;
    if (!data) continue;

    // Nodes — drop those whose status maps to `undefined` (`merged` /
    // `deleted`, per I-2): they have no visible representation and would
    // render as ghosts in the canvas.
    for (const wireNode of data.nodes) {
      const state = deriveNodeState(wireNode.status);
      if (state === undefined) continue;
      const node: GraphNodeData = {
        id: wireNode.id,
        type: mapNodeType(wireNode.node_type),
        label: wireNode.canonical_name,
        state,
      };
      nodesById.set(wireNode.id, node);
    }

    // Links — dedupe by id; drop those whose endpoints are not in the
    // accumulated visible-node set. We resolve this AFTER the node pass so
    // the dedup horizon is the FULL union of all traversals.
    for (const wireLink of data.links) {
      const link: GraphLinkData = {
        id: wireLink.id,
        source: wireLink.source_node_id,
        target: wireLink.target_node_id,
        label: wireLink.link_type,
        linkTypeLabel: mapLinkTypeLabel(
          wireLink.link_type,
          wireLink.link_type_label,
        ),
        isTemporal: wireLink.is_temporal,
        state: deriveLinkState(wireLink.status, wireLink.flags),
        ...(wireLink.is_in_effect === undefined
          ? {}
          : { inEffect: wireLink.is_in_effect }),
      };
      linksById.set(wireLink.id, link);
    }
  }

  // Filter orphan links AFTER the union: a link arriving in traversal A
  // whose endpoint shows up only in traversal B is legitimately retained.
  // Without this second pass we would race the ordering and drop valid
  // edges between affected-node neighbourhoods.
  const orphanFiltered: GraphLinkData[] = [];
  for (const link of linksById.values()) {
    if (nodesById.has(link.source) && nodesById.has(link.target)) {
      orphanFiltered.push(link);
    }
  }

  return {
    sourceTool: "traverseNode",
    nodes: Array.from(nodesById.values()),
    links: orphanFiltered,
  };
}
