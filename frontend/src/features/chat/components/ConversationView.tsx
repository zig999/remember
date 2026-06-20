/**
 * ConversationView — left-column wrapper of the chat workspace (TC-07).
 *
 * Renders one of two states based on the URL `?conversation` search param
 * (TC-01 chatRoute owns the validated search; ChatWorkspace forwards the
 * conversation id here):
 *
 *  - No active conversation -> UI-01 empty state (centered hint copy).
 *  - Active conversation    -> stub placeholders for MessageStream (TC-08)
 *                              and Composer (TC-09); replaced by those
 *                              components in their own task contracts.
 *
 * Layout: fills its parent column (height/width 100%); the parent
 * ChatWorkspace owns the 40% / 60% column split via container query.
 * No data-fetch here — that is the responsibility of MessageStream /
 * Composer (TC-08 / TC-09).
 */
import type { FC } from "react";

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
        className="flex h-full w-full flex-col items-center justify-center gap-md px-lg text-content"
        data-testid="conversation-view-empty"
      >
        <p className="text-body text-body">
          Selecione ou crie uma conversa para começar.
        </p>
      </section>
    );
  }

  // Stubs for TC-08 (MessageStream) and TC-09 (Composer). These slots will be
  // replaced by the real components in their respective task contracts; the
  // markers below let the hermetic gate assert the loading layout exists.
  return (
    <section
      aria-label="Conversa"
      className="flex h-full w-full flex-col"
      data-testid="conversation-view"
      data-conversation-id={conversationId}
    >
      <div
        className="flex-1 overflow-hidden"
        data-testid="message-stream-slot"
        aria-label="Mensagens da conversa"
      >
        {/* TC-08 — MessageStream renders here. */}
      </div>
      <div
        className="shrink-0"
        data-testid="composer-slot"
        aria-label="Compositor de mensagem"
      >
        {/* TC-09 — Composer renders here. */}
      </div>
    </section>
  );
};
