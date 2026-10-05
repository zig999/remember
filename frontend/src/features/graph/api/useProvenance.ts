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
