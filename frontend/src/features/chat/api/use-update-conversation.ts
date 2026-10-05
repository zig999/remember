import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { conversationKeys } from "./keys";
import { toConversation, type ConversationWire } from "./_transforms";
import type { Conversation } from "../types";

export interface UpdateConversationVariables {
  readonly id: string;
  readonly title?: string | null;
  readonly archivedAt?: string | null;
}

export function useUpdateConversation(): UseMutationResult<
  Conversation,
  Error,
  UpdateConversationVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, archivedAt }) => {
      const body: Record<string, unknown> = {};
      if (title !== undefined) body["title"] = title;
      if (archivedAt !== undefined) body["archived_at"] = archivedAt;
      const wire = await http<ConversationWire>(
        `/api/v1/conversations/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      return toConversation(wire);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(data.id),
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
    },
  });
}
