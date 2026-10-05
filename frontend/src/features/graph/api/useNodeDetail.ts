import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { graphNodeKeys } from "./keys";
import { toNodeDetail } from "./_transforms";
import type { NodeDetailView, NodeDetailWire } from "./node-detail.types";

const STALE_MS = 5 * 60_000;

export function useNodeDetail(
  id: string | null | undefined,
): UseQueryResult<NodeDetailView> {
  return useQuery({
    queryKey: graphNodeKeys.detail(id ?? "__noop__"),
    queryFn: async () => {
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
