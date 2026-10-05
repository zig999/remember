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
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });
      queryClient.removeQueries({ queryKey: conversationKeys.messages(id) });
      queryClient.removeQueries({ queryKey: conversationKeys.usage(id) });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}
