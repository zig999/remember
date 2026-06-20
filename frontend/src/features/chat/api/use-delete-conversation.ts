/**
 * useDeleteConversation — DELETE /api/v1/conversations/:id.
 *
 * Spec references:
 *  - openapi.yaml `deleteConversation` (returns 204 No Content; cascade
 *    delete — chat tables are OUTSIDE the v7 §11 compliance flow.)
 *  - chat.feature.spec.md §4 request #9
 *  - §3 transition table: on success navigate to /chat (no id) AND
 *    invalidate `conversationKeys.list()` (handled here; navigation is the
 *    caller's responsibility).
 *
 * Because the endpoint returns 204, this hook uses the local `httpVoid`
 * helper (see `_request.ts`) instead of `http<T>()` — `http<T>` always
 * tries to `response.json()` which throws on an empty body. Narrow scope:
 * only this hook depends on `httpVoid`.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { authHeader, httpVoid } from "./_request";
import { conversationKeys } from "./keys";

export interface DeleteConversationVariables {
  readonly id: string;
}

export function useDeleteConversation(): UseMutationResult<
  void,
  Error,
  DeleteConversationVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      await httpVoid(`/api/v1/conversations/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeader(),
      });
    },
    onSuccess: (_data, { id }) => {
      // Drop the detail + nested children from the cache outright — the
      // entity no longer exists. List queries refresh from the server.
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });
      queryClient.removeQueries({ queryKey: conversationKeys.messages(id) });
      queryClient.removeQueries({ queryKey: conversationKeys.usage(id) });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}
