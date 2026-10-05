import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { conversationKeys } from "./keys";
import type { CancelWire } from "./_transforms";

export function useCancelTurn(
  conversationId: string,
): UseMutationResult<CancelWire, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return http<CancelWire>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/cancel`,
        {
          method: "POST",
          headers: authHeader(),
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.usage(conversationId),
      });
    },
  });
}
