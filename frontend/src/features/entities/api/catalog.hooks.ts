import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { entityGet } from "./_request";
import { entityKeys } from "./keys";
import { toAttributeKeys } from "./_transforms";
import type { AttributeKey, AttributeKeyListWire } from "../types";

export function useAttributeKeys(
  nodeType: string | null,
): UseQueryResult<readonly AttributeKey[]> {
  const name = nodeType ?? "";
  return useQuery({
    queryKey: entityKeys.attributeKeys(name),
    enabled: name.length > 0,
    queryFn: async ({ signal }) => {
      const search = new URLSearchParams({ node_type: name });
      return toAttributeKeys(
        await entityGet<AttributeKeyListWire>(
          `/api/v1/attribute-keys?${search.toString()}`,
          signal,
        ),
      );
    },
  });
}
