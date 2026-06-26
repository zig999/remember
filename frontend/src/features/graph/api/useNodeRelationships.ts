/**
 * useNodeRelationships — GET /api/v1/nodes/:id/traverse?depth=1&direction=both
 * (dev_tc_001, Phase B of NodeDetailPanel v2.0).
 *
 * TanStack Query hook returning the relationships of a `KnowledgeNode` for
 * the "Relações" section of `NodeDetailPanel`. Backs the lazy Phase B chain
 * (does NOT fetch attribute provenance — that ships inline with
 * `useNodeDetail`).
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9
 *    "useNodeRelationships hook" — query key, staleTime 5min, enabled gate.
 *  - docs/specs/domains/knowledge-graph/openapi.yaml `traverseNode` —
 *    request path + response schema (`TraversalResult`).
 *  - CLAUDE.md "Data layer — TanStack Query" — every server call is a
 *    `features/<x>/api/` hook; `fetch` direct in a component is forbidden.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { graphNodeKeys } from "./keys";
import { toTraversalResult } from "./traversal.transforms";
import type {
  TraversalResultView,
  TraversalResultWire,
} from "./traversal.types";

const STALE_MS = 5 * 60_000;

export function useNodeRelationships(
  id: string | null | undefined,
): UseQueryResult<TraversalResultView> {
  return useQuery({
    queryKey: graphNodeKeys.relationships(id ?? "__noop__"),
    queryFn: async () => {
      const wire = await http<TraversalResultWire>(
        `/api/v1/nodes/${encodeURIComponent(id as string)}/traverse?depth=1&direction=both`,
        { method: "GET", headers: authHeader() },
      );
      return toTraversalResult(wire);
    },
    enabled: typeof id === "string" && id.length > 0,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
