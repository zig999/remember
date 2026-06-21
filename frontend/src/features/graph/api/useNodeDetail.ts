/**
 * useNodeDetail — GET /api/v1/nodes/:id (TC-FE-08).
 *
 * TanStack Query hook returning the canonical name, aliases, and current
 * attributes of a `KnowledgeNode`. Backs `NodeDetailPanel` (the inline panel
 * shown inside the graph pane when the user clicks a node in `GraphSpace`).
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9
 *    "useNodeDetail hook" — query key, staleTime 5min, enabled gate.
 *  - docs/specs/domains/knowledge-graph/openapi.yaml `getNodeById` — request
 *    path + response schema (`NodeDetail`).
 *  - CLAUDE.md "Data layer — TanStack Query" — every server call is a
 *    `features/<x>/api/` hook; `fetch` direct in a component is forbidden.
 *
 * Contract:
 *  - Stable data → `staleTime: 5 * 60_000` (5min, per spec §9).
 *  - `refetchOnWindowFocus: false` — opening the panel after a tab switch
 *    must not flash spinner on cached node detail.
 *  - `enabled` gate — guards against `useQuery({ queryFn() called with
 *    undefined id })` when the parent unmounts the panel mid-flight (the
 *    `?conversation` watcher in `ChatWorkspace` clears `selectedNodeId`).
 *
 * Error surface:
 *  - `useQuery` exposes the raw `EnvelopeError` via `query.error`. The panel
 *    branches on `error.code` (`RESOURCE_NOT_FOUND`, `BUSINESS_NODE_DELETED`,
 *    `SYSTEM_*`) per spec §3 state table. The hook itself does NOT translate
 *    the error — the central `QueryCache.onError` mapper in
 *    `lib/error-routing.ts` is the single error router.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { graphNodeKeys } from "./keys";
import { toNodeDetail } from "./_transforms";
import type { NodeDetailView, NodeDetailWire } from "./node-detail.types";

/** 5min — node detail is stable data (alias / attribute writes go through
 *  the curation flow which invalidates this key explicitly when needed). */
const STALE_MS = 5 * 60_000;

/**
 * Fetch the node detail and transform to the surface shape.
 *
 * `id` is typed `string | undefined` so the call site does not have to
 * remember to short-circuit; the `enabled` flag in the hook guards the
 * actual fetch. When `id` is missing we still produce a unique cache slot
 * (`__noop__`) to keep the key shape stable.
 */
export function useNodeDetail(
  id: string | null | undefined,
): UseQueryResult<NodeDetailView> {
  return useQuery({
    queryKey: graphNodeKeys.detail(id ?? "__noop__"),
    queryFn: async () => {
      // `enabled` below guards undefined/empty; the cast is safe inside queryFn.
      const wire = await http<NodeDetailWire>(
        `/api/v1/nodes/${encodeURIComponent(id as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toNodeDetail(wire);
    },
    enabled: typeof id === "string" && id.length > 0,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
