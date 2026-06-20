/**
 * useCancelTurn — POST /api/v1/conversations/:id/cancel.
 *
 * Spec references:
 *  - openapi.yaml `cancelTurn` (202 Accepted with `{ cancelled: true }`)
 *  - chat.feature.spec.md §4 request #6 (mutation; called from the stop
 *    button OR on unmount with a turn in flight)
 *  - §3 transition table: stop button → call cancelTurn + AbortController.abort();
 *    awaits `done{stop_reason:"cancelled"}` — the SSE then fires the
 *    messages/usage invalidation on the streaming-done transition.
 *
 * Signature per TC-03 task summary: `useCancelTurn(conversationId)` — the
 * conversation id is bound at hook construction; `mutate()` takes no vars.
 * The id is captured at hook time, not at mutate time, because the stop
 * button always targets the currently active conversation.
 *
 * Cache: we invalidate `usage(id)` opportunistically. The SSE's terminal
 * `done` frame will also invalidate `messages(id)` + `usage(id)`; doing
 * one of them here is a belt-and-suspenders guard for cases where the SSE
 * already closed before the cancel call resolved.
 */
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
