/**
 * useListMessages — GET /api/v1/conversations/:id/messages.
 *
 * Spec references:
 *  - openapi.yaml `listMessages` (chronological, paginated with `before`)
 *  - chat.feature.spec.md §4 (request #3: critical priority, staleTime 0 —
 *    volatile, manual revalidation; limit=50)
 *  - §4 transforms: `result.items[].created_at` → Date
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { conversationKeys } from "./keys";
import {
  toMessageList,
  type MessageListResult,
  type MessageListWire,
} from "./_transforms";

export interface ListMessagesParams {
  /** Page size — clamped server-side to [1, 200]. Default 50. */
  readonly limit?: number;
  /** RFC3339 cutoff — only messages with `created_at < before` returned. */
  readonly before?: string;
}

function buildQueryString(params: ListMessagesParams): string {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.before !== undefined) search.set("before", params.before);
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function useListMessages(
  conversationId: string | null | undefined,
  params: ListMessagesParams = {},
): UseQueryResult<MessageListResult> {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId ?? "__noop__"),
    queryFn: async () => {
      const wire = await http<MessageListWire>(
        `/api/v1/conversations/${encodeURIComponent(
          conversationId as string,
        )}/messages${buildQueryString(params)}`,
        { method: "GET", headers: authHeader() },
      );
      return toMessageList(wire);
    },
    enabled: typeof conversationId === "string" && conversationId.length > 0,
    staleTime: 0, // volatile per §4 BR-08
    refetchOnWindowFocus: false,
  });
}
