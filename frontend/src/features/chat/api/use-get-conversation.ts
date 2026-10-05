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
