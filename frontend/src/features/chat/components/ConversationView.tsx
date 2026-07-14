/**
 * ConversationView — left-column wrapper of the chat workspace (TC-07).
 *
 * Renders one of two states based on the URL `?conversation` search param
 * (TC-01 chatRoute owns the validated search; ChatWorkspace forwards the
 * conversation id here):
 *
 *  - No active conversation -> UI-01 empty state (centered hint copy).
 *  - Active conversation    -> the MessageStream (TC-08) over the Composer
 *                              (TC-09), both filling their slots.
 *
 * Layout: fills its parent column (height/width 100%); the parent
 * ChatWorkspace owns the 40% / 60% column split via container query.
 *
 * The active branch needs the conversation's archived state to drive the
 * Composer (BR-25 archived banner + 'Reativar'), so it fetches via
 * `useGetConversation` and wires `onUnarchive` to `useUpdateConversation`.
 * Those hooks live in the inner `ActiveConversation` component so they only
 * run when a conversation is selected (the empty branch returns before any
 * hook — Rules of Hooks).
 */
import type { FC } from "react";
import { useGetConversation, useUpdateConversation } from "../api";
import { MessageStream } from "./MessageStream";
import { Composer } from "./Composer";

export interface ConversationViewProps {
  /**
   * Active conversation id from `?conversation` (TC-01 chatRoute
   * validateSearch). `undefined` when no conversation is selected —
   * triggers the UI-01 empty state.
   */
  conversationId: string | undefined;
}

export const ConversationView: FC<ConversationViewProps> = ({
  conversationId,
}) => {
  if (conversationId === undefined) {
    return (
      <section
        aria-label="Conversa"
        className="flex h-full w-full flex-col items-center justify-center gap-md px-lg text-foreground"
        data-testid="conversation-view-empty"
      >
        <p className="text-body text-body">
          Selecione ou crie uma conversa para começar.
        </p>
      </section>
    );
  }

  return <ActiveConversation conversationId={conversationId} />;
};

/**
 * Active branch — owns the conversation-detail fetch (for archived state) and
 * the un-archive mutation, then composes MessageStream over Composer. Split
 * out so its hooks never run on the empty branch.
 */
const ActiveConversation: FC<{ conversationId: string }> = ({
  conversationId,
}) => {
  const conversationQuery = useGetConversation(conversationId);
  const updateMutation = useUpdateConversation();
  // Until the detail loads, treat as not-archived (the Composer's send band is
  // the safe default; if it turns out archived the banner swaps in on load).
  const isArchived = conversationQuery.data?.archivedAt != null;

  return (
    <section
      aria-label="Conversa"
      className="flex h-full w-full flex-col"
      data-testid="conversation-view"
      data-conversation-id={conversationId}
    >
      <div
        className="min-h-0 flex-1 overflow-hidden"
        data-testid="message-stream-slot"
        aria-label="Mensagens da conversa"
      >
        <MessageStream conversationId={conversationId} className="h-full" />
      </div>
      <div
        className="shrink-0 p-lg pt-sm"
        data-testid="composer-slot"
        aria-label="Compositor de mensagem"
      >
        <Composer
          conversationId={conversationId}
          isArchived={isArchived}
          onUnarchive={() =>
            updateMutation.mutate({ id: conversationId, archivedAt: null })
          }
        />
      </div>
    </section>
  );
};
