/**
 * useUpdateConversation — PATCH /api/v1/conversations/:id.
 *
 * Spec references:
 *  - openapi.yaml `updateConversation` (partial body: title?, archived_at?)
 *  - chat.feature.spec.md §4 request #8
 *  - §3 transition table: on rename success invalidate `detail(id)` + `list()`;
 *    on archive success invalidate `list()` (and the caller navigates).
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

export interface UpdateConversationVariables {
  readonly id: string;
  /** Pass `null` to clear, omit to leave untouched. */
  readonly title?: string | null;
  /**
   * RFC3339 timestamp to archive, `null` to un-archive, or omit. At least
   * one of `title` or `archivedAt` MUST be present (server enforces — 422
   * VALIDATION_REQUIRED_FIELD otherwise).
   */
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
