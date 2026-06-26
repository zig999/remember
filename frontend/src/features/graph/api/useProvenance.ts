/**
 * useProvenance — GET /api/v1/provenance/{links|attributes|fragments}/:id
 * (dev_tc_001, Phase C of NodeDetailPanel v2.0).
 *
 * Lazy TanStack Query hook — the query stays disabled until the consumer
 * sets `enabled` to `true` (i.e. the user expands a "Ver origem completa"
 * `<details>` disclosure). The hook is invoked unconditionally in the
 * component body so the rules of hooks hold; the `enabled` gate prevents the
 * actual fetch.
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9
 *    "useProvenance hook" — kind/id arguments, enabled gate, staleTime 5min.
 *  - docs/specs/domains/query-retrieval/openapi.yaml `getProvenanceByLink`,
 *    `getProvenanceByAttribute`, `getProvenanceByFragment` — three URL
 *    shapes, identical body (`ProvenanceResponse`).
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { graphNodeKeys } from "./keys";
import { toProvenanceResponse } from "./provenance.transforms";
import type {
  ProvenanceKind,
  ProvenanceResponseView,
  ProvenanceResponseWire,
} from "./provenance.types";

const STALE_MS = 5 * 60_000;

export function useProvenance(
  kind: ProvenanceKind,
  id: string,
  enabled: boolean,
): UseQueryResult<ProvenanceResponseView> {
  return useQuery({
    queryKey: graphNodeKeys.provenance(kind, id),
    queryFn: async () => {
      const wire = await http<ProvenanceResponseWire>(
        `/api/v1/provenance/${kind}/${encodeURIComponent(id)}`,
        { method: "GET", headers: authHeader() },
      );
      return toProvenanceResponse(wire);
    },
    enabled: enabled && id.length > 0,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
