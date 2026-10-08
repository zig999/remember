import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { entityGet } from "./_request";
import { entityKeys } from "./keys";
import { toNodeRead } from "./_transforms";
import type { NodeRead, NodeReadWire } from "../types";

export function useNodeRead(nodeId: string): UseQueryResult<NodeRead> {
  return useQuery({
    queryKey: entityKeys.node(nodeId),
    queryFn: async ({ signal }) =>
      toNodeRead(
        await entityGet<NodeReadWire>(
          `/api/v1/nodes/${encodeURIComponent(nodeId)}`,
          signal,
        ),
      ),
  });
}
