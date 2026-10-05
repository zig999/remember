import { useCallback, useEffect, useId, useRef } from "react";
import type { CSSProperties, FC, KeyboardEvent } from "react";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { z, type ZodType } from "zod";
import { Send, Square, ArchiveRestore, AlertTriangle } from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/cn";
import { useSendMessage } from "../api/useSendMessage";
import { useChatTurnStore } from "../state/chat-turn";
import type { ComposerProps } from "./Composer.types";

const MAX_CONTENT_LENGTH = 32768;

const MSG_EMPTY = "Digite uma mensagem antes de enviar.";
const MSG_TOO_LONG = "A mensagem é muito longa. Reduza o texto.";

const LABEL_TEXTAREA = "Mensagem para o assistente";
const ARIA_SEND = "Enviar mensagem";
const ARIA_STOP = "Parar geração";

const ARCHIVED_TITLE = "Conversa arquivada";
const ARCHIVED_BODY =
  "Esta conversa está arquivada. Reative para enviar novas mensagens.";
const ARCHIVED_ACTION = "Reativar";

const DISABLED_CHAT_DISABLED =
  "O chat está temporariamente indisponível (desativado).";
const DISABLED_PROVIDER_UNAVAILABLE =
  "O provedor do chat está indisponível. Tente novamente em instantes.";

const composerSchema = z.object({
  content: z
    .string()
    .min(1, MSG_EMPTY)
    .max(MAX_CONTENT_LENGTH, MSG_TOO_LONG),
});

type ComposerFormValues = z.infer<typeof composerSchema>;

function safeZodResolver<TValues extends FieldValues, TSchema extends ZodType>(
  schema: TSchema,
): Resolver<TValues> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data as TValues, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (errors[path] === undefined) {
        errors[path] = { type: issue.code, message: issue.message };
      }
    }
    return {
      values: {} as TValues,
      errors: errors as never,
    };
  };
}

interface ArchivedBannerProps {
  readonly onUnarchive: () => void;
  readonly className?: string;
}

const ArchivedBanner: FC<ArchivedBannerProps> = ({
  onUnarchive,
  className,
}) => (
  <GlassSurface
    level="ambient"
    role="region"
    aria-label={ARCHIVED_TITLE}
    animate={false}
    className={cn(
      "flex flex-col gap-sm rounded-md px-lg py-md text-foreground",
      className,
    )}
    data-testid="composer-archived-banner"
  >
    <div className="flex items-start gap-sm">
      <AlertTriangle
        className="size-4 shrink-0 text-state-superseded"
        aria-hidden="true"
      />
      <div className="flex-1">
        <p className="text-xs font-medium font-semibold text-foreground">
          {ARCHIVED_TITLE}
        </p>
        <p className="mt-xs text-xs text-muted-foreground">{ARCHIVED_BODY}</p>
      </div>
    </div>
    <div className="flex justify-end">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onUnarchive}
        data-testid="composer-unarchive-button"
      >
        <ArchiveRestore className="size-4" aria-hidden="true" />
        {ARCHIVED_ACTION}
      </Button>
    </div>
  </GlassSurface>
);

function disabledNoticeFor(errorCode: string | null | undefined): string | null {
  if (errorCode === "BUSINESS_CHAT_DISABLED") return DISABLED_CHAT_DISABLED;
  if (errorCode === "BUSINESS_CHAT_PROVIDER_UNAVAILABLE") {
    return DISABLED_PROVIDER_UNAVAILABLE;
  }
  return null;
}

export const Composer: FC<ComposerProps> = ({
  conversationId,
  isArchived,
  onUnarchive,
  className,
  style,
}) => {
  if (isArchived) {
    return (
      <ArchivedBanner
        onUnarchive={onUnarchive}
        {...(className !== undefined ? { className } : {})}
      />
    );
  }

  return (
    <ComposerSendBand
      conversationId={conversationId}
      {...(className !== undefined ? { className } : {})}
      {...(style !== undefined ? { style } : {})}
    />
  );
};

interface ComposerSendBandProps {
  readonly conversationId: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const ComposerSendBand: FC<ComposerSendBandProps> = ({
  conversationId,
  className,
  style,
}) => {
  const reactId = useId();
  const textareaId = `composer-textarea-${reactId}`;
  const messageId = `composer-message-${reactId}`;

  const form = useForm<ComposerFormValues>({
    resolver: safeZodResolver<ComposerFormValues, typeof composerSchema>(
      composerSchema,
    ),
    defaultValues: { content: "" },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const isStreaming = useChatTurnStore((s) => s.isStreaming);

  const mutation = useSendMessage();
  const lastErrorCode = mutation.data?.errorCode ?? null;
  const disabledNotice = disabledNoticeFor(lastErrorCode);

  const onSubmit = useCallback<SubmitHandler<ComposerFormValues>>(
    async (values) => {
      const result = await mutation.mutateAsync({
        conversationId,
        content: values.content,
      });
      if (result.errorCode === null) {
        reset({ content: "" });
      }
    },
    [conversationId, mutation, reset],
  );

  const formRef = useRef<HTMLFormElement | null>(null);

  const onTextareaKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  useEffect(() => {
    if (!isStreaming) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const controller = useChatTurnStore.getState().abortController;
      if (controller !== null) {
        e.preventDefault();
        controller.abort();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isStreaming]);

  const onStopClick = useCallback(() => {
    const controller = useChatTurnStore.getState().abortController;
    controller?.abort();
  }, []);

  const isTextareaDisabled = isStreaming || disabledNotice !== null;
  const hasError = errors.content !== undefined;
  const describedBy =
    hasError || disabledNotice !== null ? messageId : undefined;

  return (
    <GlassSurface
      level="ambient"
      role="region"
      aria-label="Compositor de mensagem"
      animate={false}
      className={cn(
        "flex flex-col gap-sm rounded-md px-lg py-md",
        className,
      )}
      style={style}
      data-testid="composer-send-band"
    >
      <form
        ref={formRef}
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
        noValidate
        className="flex flex-col gap-sm"
      >
        <label htmlFor={textareaId} className="sr-only">
          {LABEL_TEXTAREA}
        </label>

        <div className="flex items-end gap-sm">
          <Textarea
            id={textareaId}
            placeholder="Pergunte algo…"
            aria-invalid={hasError}
            disabled={isTextareaDisabled}
            aria-describedby={describedBy}
            onKeyDown={onTextareaKeyDown}
            {...register("content")}
            data-testid="composer-textarea"
          />
          {isStreaming ? (
            <Button
              type="button"
              variant="destructive"
              size="md"
              aria-label={ARIA_STOP}
              onClick={onStopClick}
              data-testid="composer-stop-button"
            >
              <Square className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="md"
              aria-label={ARIA_SEND}
              disabled={disabledNotice !== null}
              data-testid="composer-send-button"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {(hasError || disabledNotice !== null) && (
          <p
            id={messageId}
            role={hasError ? "alert" : undefined}
            className={cn(
              "text-xs",
              hasError ? "text-state-disputed" : "text-muted-foreground",
            )}
            data-testid="composer-message"
          >
            {hasError ? errors.content?.message : disabledNotice}
          </p>
        )}

        <div
          className="flex items-center justify-end"
          data-testid="composer-usage-slot"
        />
      </form>
    </GlassSurface>
  );
};
