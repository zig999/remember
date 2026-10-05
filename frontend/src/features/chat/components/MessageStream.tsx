import { useEffect, useLayoutEffect, useRef } from "react";
import type { FC } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { ChatBubble } from "@/components/ds/ChatBubble";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/cn";
import { useListMessages } from "../api/use-list-messages";
import { useChatTurnStore } from "../state/chat-turn";
import type { ChatMessage, ChatContentBlock } from "../types";
import { ChatStatusIndicator } from "./ChatStatusIndicator";

const LABEL_REGION = "Mensagens da conversa";
const COPY_EMPTY = "Nenhuma mensagem ainda. Envie uma mensagem para começar.";
const COPY_ERROR =
  "Não foi possível carregar o histórico. Tente novamente.";
const COPY_RETRY = "Tentar novamente";

function joinContent(blocks: ReadonlyArray<ChatContentBlock>): string {
  let out = "";
  for (const block of blocks) {
    if (typeof block.text === "string") {
      out += block.text;
    }
  }
  return out;
}

const SKELETON_ROWS: ReadonlyArray<{ variant: "assistant" | "user"; widthClass: string }> = [
  { variant: "assistant", widthClass: "w-3/5" },
  { variant: "user", widthClass: "w-2/5" },
  { variant: "assistant", widthClass: "w-4/5" },
];

const SkeletonRow: FC<{
  variant: "assistant" | "user";
  widthClass: string;
}> = ({ variant, widthClass }) => (
  <div
    role="presentation"
    data-testid="skeleton-bubble"
    data-variant={variant}
    className={cn(
      "flex w-full",
      variant === "user" ? "justify-end" : "justify-start",
    )}
  >
    <div
      className={cn(
        "h-12 rounded-md bg-surface-glass-ambient animate-pulse",
        widthClass,
      )}
    />
  </div>
);

const LoadingSkeleton: FC = () => (
  <div
    data-testid="message-stream-skeleton"
    className="flex flex-col gap-md px-lg py-md"
  >
    {SKELETON_ROWS.map((row, idx) => (
      <SkeletonRow key={idx} variant={row.variant} widthClass={row.widthClass} />
    ))}
  </div>
);

const ErrorBanner: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div
    role="alert"
    aria-label={COPY_ERROR}
    data-testid="message-stream-error"
    className="m-lg flex flex-col gap-sm rounded-md border border-border-glass bg-surface-glass-ambient px-lg py-md text-foreground"
  >
    <div className="flex items-start gap-sm">
      <AlertTriangle
        className="size-4 shrink-0 text-state-disputed"
        aria-hidden="true"
      />
      <p className="flex-1 text-xs text-foreground">{COPY_ERROR}</p>
    </div>
    <div className="flex justify-end">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onRetry}
        data-testid="message-stream-retry"
      >
        <RotateCw className="size-4" aria-hidden="true" />
        {COPY_RETRY}
      </Button>
    </div>
  </div>
);

export interface MessageStreamProps {
  readonly conversationId: string;
  readonly className?: string;
}

export const MessageStream: FC<MessageStreamProps> = ({
  conversationId,
  className,
}) => {
  const query = useListMessages(conversationId);

  const isStreaming = useChatTurnStore((s) => s.isStreaming);
  const streamingText = useChatTurnStore((s) => s.streamingText);

  const prefersReducedMotion = useReducedMotion() === true;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasInitialScrolledRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!query.isSuccess) return;
    if (hasInitialScrolledRef.current) return;
    const node = bottomRef.current;
    if (node !== null && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "end", behavior: "auto" });
    }
    hasInitialScrolledRef.current = true;
  }, [query.isSuccess]);

  useEffect(() => {
    if (!isStreaming) return;
    if (streamingText.length === 0) return;
    const node = bottomRef.current;
    if (node !== null && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({
        block: "end",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [streamingText, isStreaming, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      const controller = useChatTurnStore.getState().abortController;
      controller?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (query.isPending) {
    return (
      <section
        aria-label={LABEL_REGION}
        aria-live="polite"
        aria-busy="true"
        className={cn(
          "flex h-full w-full flex-col overflow-y-auto",
          className,
        )}
        data-testid="message-stream"
        data-state="loading"
      >
        <LoadingSkeleton />
      </section>
    );
  }

  if (query.isError) {
    return (
      <section
        aria-label={LABEL_REGION}
        aria-live="polite"
        className={cn(
          "flex h-full w-full flex-col overflow-y-auto",
          className,
        )}
        data-testid="message-stream"
        data-state="error"
      >
        <ErrorBanner onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const messages: ReadonlyArray<ChatMessage> = query.data?.items ?? [];
  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <section
      aria-label={LABEL_REGION}
      aria-live="polite"
      {...(isStreaming ? { "aria-busy": "true" as const } : {})}
      className={cn(
        "flex h-full w-full flex-col overflow-y-auto",
        className,
      )}
      data-testid="message-stream"
      data-state={isStreaming ? "streaming" : isEmpty ? "empty" : "success"}
    >
      {isEmpty ? (
        <div
          className="flex flex-1 items-center justify-center px-lg text-foreground"
          data-testid="message-stream-empty"
        >
          <p className="text-body text-foreground">{COPY_EMPTY}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md px-lg py-md">
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              variant={m.role}
              content={joinContent(m.content)}
              animate={false}
              {...(m.stop_reason !== null ? { stopReason: m.stop_reason } : {})}
            />
          ))}

          {isStreaming ? (
            <ChatBubble
              key="streaming"
              variant="assistant"
              content={streamingText}
              streaming
              animate
            />
          ) : null}

          <ChatStatusIndicator />
        </div>
      )}

      <div
        ref={bottomRef}
        aria-hidden="true"
        data-testid="message-stream-bottom"
        className="h-0 w-0"
      />
    </section>
  );
};
