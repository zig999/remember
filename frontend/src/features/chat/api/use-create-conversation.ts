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

export interface CreateConversationVariables {
  readonly title?: string;
}

export function useCreateConversation(): UseMutationResult<
  Conversation,
  Error,
  CreateConversationVariables | void
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars) => {
      const body: CreateConversationVariables = vars ?? {};
      const wire = await http<ConversationWire>("/api/v1/conversations", {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return toConversation(wire);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
    },
  });
}
