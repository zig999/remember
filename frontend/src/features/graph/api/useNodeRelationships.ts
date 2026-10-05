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
