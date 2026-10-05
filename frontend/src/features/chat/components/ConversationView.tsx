import type { FC } from "react";
import { useGetConversation, useUpdateConversation } from "../api";
import { MessageStream } from "./MessageStream";
import { Composer } from "./Composer";

export interface ConversationViewProps {
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

const ActiveConversation: FC<{ conversationId: string }> = ({
  conversationId,
}) => {
  const conversationQuery = useGetConversation(conversationId);
  const updateMutation = useUpdateConversation();
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
