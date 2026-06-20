/**
 * useGetConversationUsage — GET /api/v1/conversations/:id/usage.
 *
 * Spec references:
 *  - openapi.yaml `getConversationUsage`
 *  - chat.feature.spec.md §4 (request #4: lazy, sequential after #2;
 *    staleTime 30s, manual revalidation)
 *  - §4 transforms: rename `messages` → `messageCount`, flatten to root.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { conversationKeys } from "./keys";
import { toUsageData, type UsageWire } from "./_transforms";
import type { UsageData } from "../types";

const STALE_MS = 30_000;

export function useGetConversationUsage(
  conversationId: string | null | undefined,
): UseQueryResult<UsageData> {
  return useQuery({
    queryKey: conversationKeys.usage(conversationId ?? "__noop__"),
    queryFn: async () => {
      const wire = await http<UsageWire>(
        `/api/v1/conversations/${encodeURIComponent(
          conversationId as string,
        )}/usage`,
        { method: "GET", headers: authHeader() },
      );
      return toUsageData(wire);
    },
    enabled: typeof conversationId === "string" && conversationId.length > 0,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
