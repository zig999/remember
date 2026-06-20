/**
 * Chat feature — api barrel.
 *
 * Public surface for the chat data layer. Components consume hooks from
 * here; the underlying `_request.ts` / `_transforms.ts` modules are
 * implementation details (prefixed `_` to signal that).
 */

export { conversationKeys } from "./keys";

export {
  useListConversations,
  type ListConversationsParams,
} from "./use-list-conversations";
export { useGetConversation } from "./use-get-conversation";
export {
  useListMessages,
  type ListMessagesParams,
} from "./use-list-messages";
export { useGetConversationUsage } from "./use-get-conversation-usage";

export {
  useCreateConversation,
  type CreateConversationVariables,
} from "./use-create-conversation";
export {
  useUpdateConversation,
  type UpdateConversationVariables,
} from "./use-update-conversation";
export {
  useDeleteConversation,
  type DeleteConversationVariables,
} from "./use-delete-conversation";
export { useCancelTurn } from "./use-cancel-turn";

// Re-export the surface-side result types so callers can type their
// `useQuery(...).data`.
export type {
  ConversationListResult,
  MessageListResult,
} from "./_transforms";
