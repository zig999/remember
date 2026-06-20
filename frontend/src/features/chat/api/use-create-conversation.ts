/**
 * useCreateConversation — POST /api/v1/conversations.
 *
 * Spec references:
 *  - openapi.yaml `createConversation`
 *  - chat.feature.spec.md §4 request #7
 *  - §3 transition table: on success, navigate to /chat?conversation=<new-id>
 *    AND invalidate `conversationKeys.list()` (handled here — navigation is
 *    the caller's responsibility).
 */
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
  /** Optional title (1..200 chars). Omit to let the BFF auto-distill. */
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
      // Both filter variants must refresh (include_archived true | false).
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
    },
  });
}
