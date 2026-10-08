import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { entityGet } from "./_request";
import { entityKeys } from "./keys";
import { toNodeListing, toNodeTypes } from "./_transforms";
import type {
  NodeListing,
  NodeListingNarrowing,
  NodeListingWire,
  NodeType,
  NodeTypeListWire,
} from "../types";

function buildListingQs(namePrefix: string, nodeType: string): string {
  const search = new URLSearchParams();
  if (namePrefix.length > 0) search.set("name_prefix", namePrefix);
  if (nodeType.length > 0) search.set("node_type", nodeType);
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function useNodeTypes(): UseQueryResult<readonly NodeType[]> {
  return useQuery({
    queryKey: entityKeys.nodeTypes(),
    queryFn: async ({ signal }) =>
      toNodeTypes(await entityGet<NodeTypeListWire>("/api/v1/node-types", signal)),
  });
}

export function useNodeListing(
  narrowing: NodeListingNarrowing = {},
): UseQueryResult<NodeListing> {
  const namePrefix = narrowing.namePrefix ?? "";
  const nodeType = narrowing.nodeType ?? "";
  return useQuery({
    queryKey: entityKeys.nodeListing(namePrefix, nodeType),
    queryFn: async ({ signal }) =>
      toNodeListing(
        await entityGet<NodeListingWire>(
          `/api/v1/nodes${buildListingQs(namePrefix, nodeType)}`,
          signal,
        ),
      ),
  });
}
