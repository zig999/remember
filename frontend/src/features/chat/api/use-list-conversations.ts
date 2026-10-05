import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { conversationKeys } from "./keys";
import {
  toConversationList,
  type ConversationListResult,
  type ConversationListWire,
} from "./_transforms";

export interface ListConversationsParams {
  readonly limit?: number;
  readonly cursor?: string;
  readonly includeArchived?: boolean;
}

const STALE_MS = 30_000;

function buildQueryString(params: ListConversationsParams): string {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.cursor !== undefined) search.set("cursor", params.cursor);
  if (params.includeArchived === true) search.set("include_archived", "true");
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function useListConversations(
  params: ListConversationsParams = {},
): UseQueryResult<ConversationListResult> {
  const includeArchived = params.includeArchived ?? false;
  return useQuery({
    queryKey: conversationKeys.list({ includeArchived }),
    queryFn: async () => {
      const wire = await http<ConversationListWire>(
        `/api/v1/conversations${buildQueryString(params)}`,
        { method: "GET", headers: authHeader() },
      );
      return toConversationList(wire);
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}
