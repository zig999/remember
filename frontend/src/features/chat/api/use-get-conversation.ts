/**
 * useGetConversation — GET /api/v1/conversations/:id.
 *
 * Spec references:
 *  - openapi.yaml `getConversation`
 *  - chat.feature.spec.md §4 (request #2: critical priority, staleTime 30s,
 *    on-focus revalidation, parallel with #3 `listMessages`)
 *  - §4 transforms: `result.archived_at` → Date | null, `result.created_at` → Date
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { conversationKeys } from "./keys";
import { toConversation, type ConversationWire } from "./_transforms";
import type { Conversation } from "../types";

const STALE_MS = 30_000;

export function useGetConversation(
  id: string | null | undefined,
): UseQueryResult<Conversation> {
  return useQuery({
    queryKey: conversationKeys.detail(id ?? "__noop__"),
    queryFn: async () => {
      // `enabled` below guards undefined; the cast is safe inside queryFn.
      const wire = await http<ConversationWire>(
        `/api/v1/conversations/${encodeURIComponent(id as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toConversation(wire);
    },
    enabled: typeof id === "string" && id.length > 0,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}
