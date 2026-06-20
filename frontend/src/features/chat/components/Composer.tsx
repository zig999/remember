/**
 * Composer — chat input band with send/stop modes, validation, archived
 * banner, and disabled state (TC-09).
 *
 * Spec references:
 *  - TC-09 task contract — four modes:
 *      • Send mode (UI-03)        — textarea enabled, send button.
 *      • Stop mode (UI-04)        — textarea disabled, stop button, Esc aborts.
 *      • Archived banner (UI-08)  — entire input area replaced by notice +
 *        'Reativar' button.
 *      • Disabled (UI-10)         — textarea disabled, inline notice (when the
 *        last send returned BUSINESS_CHAT_DISABLED or
 *        BUSINESS_CHAT_PROVIDER_UNAVAILABLE pre-stream).
 *  - docs/specs/domains/chat/chat.spec.md §UC-02 — `sendMessage` body
 *    `{ content, model? }`; `content` length is bounded `[1, MAX_CONTENT_LENGTH]`
 *    (default 32768, BR-32).
 *  - docs/specs/domains/chat/chat.spec.md §BR-25 — writes on
 *    archived_at IS NOT NULL refuse with pre-stream
 *    `409 BUSINESS_CONVERSATION_ARCHIVED`.
 *  - docs/specs/domains/chat/chat.spec.md §BR-14 / §UC-09 — `CHAT_ENABLED=false`
 *    -> `503 BUSINESS_CHAT_DISABLED` pre-stream.
 *  - docs/specs/domains/chat/chat.spec.md §BR-21 — Anthropic factory throws
 *    -> `503 BUSINESS_CHAT_PROVIDER_UNAVAILABLE` pre-stream.
 *  - docs/specs/front/front.md §"WCAG 2.2 AA" — textarea has an associated
 *    label (visually hidden 'Mensagem para o assistente'); send/stop button
 *    carries aria-label; invalid field exposes aria-invalid + aria-describedby
 *    pointing at the message id.
 *
 * Data layer wiring (TC-04 dependencies):
 *  - `useSendMessage()` is the turn orchestrator — call `.mutateAsync(...)` on
 *    submit. It manages the Idempotency-Key, optimistic bubble, AbortController
 *    stash in `useChatTurnStore`, SSE consumption, and post-turn invalidation.
 *  - `useChatTurnStore` exposes `isStreaming` and `abortController`. Stop mode
 *    is gated by `isStreaming === true`; the stop button calls
 *    `abortController.abort()` (which propagates to the in-flight `fetch`).
 *  - Pre-stream BUSINESS_* errors do NOT throw — `useSendMessage` resolves
 *    with `{ errorCode, errorMessage }` (see useSendMessage.ts L225-L262 and
 *    chat-stream.ts §"Pre-stream HTTP errors yield a terminal `error` frame").
 *    The Composer reads `mutation.data?.errorCode` to switch into the
 *    disabled inline state.
 *
 * Why a Composer-local Zod schema (and not `components/ui/form`):
 *  - The form has exactly one field; the `Form*` a11y helpers are designed for
 *    multi-field forms with description + error rows per field. A direct
 *    `useForm` + Zod resolver keeps the wiring legible and the visually-hidden
 *    label + manual aria-describedby easy to verify in unit tests.
 *
 * Keyboard contract (TC-09 constraints):
 *  - Enter on the textarea -> submit, when content is non-empty.
 *  - Shift+Enter -> insert newline (default textarea behaviour preserved).
 *  - Esc, while `isStreaming === true` -> abort the in-flight controller. We
 *    install a document-level keydown listener because the textarea is
 *    `disabled` in stop mode (a disabled textarea cannot focus → cannot
 *    receive keydown).
 *
 * Out of scope (per TC-09):
 *  - UsageBadge rendering (TC-10). A `data-testid="composer-usage-slot"`
 *    placeholder marks the footer slot where TC-10 will mount.
 *  - The unarchive mutation itself — TC-09 calls `onUnarchive`; the parent
 *    wires the actual `updateConversation` request.
 */
import { useCallback, useEffect, useId, useRef } from "react";
import type { CSSProperties, FC, KeyboardEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Square, ArchiveRestore, AlertTriangle } from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useSendMessage } from "../api/useSendMessage";
import { useChatTurnStore } from "../state/chat-turn";
import type { ComposerProps } from "./Composer.types";

/* ---------- constants (spec-derived) ---------- */

/** chat.spec.md §BR-32 / openapi.yaml `sendMessage` content `maxLength`. */
const MAX_CONTENT_LENGTH = 32768;

/** Validation messages — verbatim from TC-09 constraints. */
const MSG_EMPTY = "Digite uma mensagem antes de enviar.";
const MSG_TOO_LONG = "A mensagem é muito longa. Reduza o texto.";

/** Accessible label / aria-label copy — verbatim from TC-09 constraints. */
const LABEL_TEXTAREA = "Mensagem para o assistente";
const ARIA_SEND = "Enviar mensagem";
const ARIA_STOP = "Parar geração";

/** Archived banner copy (BR-25). */
const ARCHIVED_TITLE = "Conversa arquivada";
const ARCHIVED_BODY =
  "Esta conversa está arquivada. Reative para enviar novas mensagens.";
const ARCHIVED_ACTION = "Reativar";

/** Inline disabled-notice copy (UI-10). */
const DISABLED_CHAT_DISABLED =
  "O chat está temporariamente indisponível (desativado).";
const DISABLED_PROVIDER_UNAVAILABLE =
  "O provedor do chat está indisponível. Tente novamente em instantes.";

/* ---------- schema (single-field) ---------- */

const composerSchema = z.object({
  content: z
    .string()
    .min(1, MSG_EMPTY)
    .max(MAX_CONTENT_LENGTH, MSG_TOO_LONG),
});

type ComposerFormValues = z.infer<typeof composerSchema>;

/* ---------- subcomponent: archived banner (UI-08) ---------- */

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
      "flex flex-col gap-sm rounded-md px-lg py-md text-content",
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
        <p className="text-label font-semibold text-content">
          {ARCHIVED_TITLE}
        </p>
        <p className="mt-xs text-body-sm text-muted">{ARCHIVED_BODY}</p>
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

/* ---------- helper: classify the last mutation outcome ---------- */

/**
 * Inspect `useSendMessage` mutation `data` and surface a Composer-level
 * disabled-notice when the last attempt returned a pre-stream BUSINESS_*
 * code that should disable the input area (UI-10 inline notice).
 *
 * Returns `null` when the input area should remain in normal send mode
 * (no last attempt, or last attempt succeeded, or last attempt failed with a
 * recoverable code that does not gate further attempts — e.g. validation).
 */
function disabledNoticeFor(errorCode: string | null | undefined): string | null {
  if (errorCode === "BUSINESS_CHAT_DISABLED") return DISABLED_CHAT_DISABLED;
  if (errorCode === "BUSINESS_CHAT_PROVIDER_UNAVAILABLE") {
    return DISABLED_PROVIDER_UNAVAILABLE;
  }
  return null;
}

/* ---------- main component ---------- */

export const Composer: FC<ComposerProps> = ({
  conversationId,
  isArchived,
  onUnarchive,
  className,
  style,
}) => {
  /* --- archived short-circuit (UI-08) --- */
  // Rendered BEFORE useSendMessage / RHF wiring is invoked so the archived
  // case is the simplest possible tree (no form, no mutation observers). The
  // parent owns `onUnarchive`; we just dispatch the click.
  if (isArchived) {
    return <ArchivedBanner onUnarchive={onUnarchive} className={className} />;
  }

  return (
    <ComposerSendBand
      conversationId={conversationId}
      className={className}
      style={style}
    />
  );
};

/* ---------- inner: send band (split so hooks stay below the archived gate) ---------- */

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
  /* --- ids for a11y wiring (label, message) --- */
  const reactId = useId();
  const textareaId = `composer-textarea-${reactId}`;
  const messageId = `composer-message-${reactId}`;

  /* --- RHF + Zod form (single field: content) --- */
  const form = useForm<ComposerFormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: { content: "" },
    // Live-validate as the user types so the > 32768 char message appears
    // immediately, not on submit (TC-09 "Content > 32768 chars: live error").
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  /* --- turn store: isStreaming + abortController (TC-04) --- */
  // Subscribe reactively to isStreaming so the send/stop swap re-renders.
  // abortController is grabbed via getState() inside the Esc / stop handlers
  // to avoid re-subscribing on every controller swap (the latest is always
  // correct at the moment the handler fires).
  const isStreaming = useChatTurnStore((s) => s.isStreaming);

  /* --- turn orchestrator (TC-04) --- */
  const mutation = useSendMessage();
  const lastErrorCode = mutation.data?.errorCode ?? null;
  const disabledNotice = disabledNoticeFor(lastErrorCode);

  /* --- submit handler --- */
  // Cleared on success so a quick Enter-Enter doesn't re-send the prior text;
  // left intact on error so the owner can edit and retry.
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

  /* --- ref to the form to programmatically submit on Enter --- */
  const formRef = useRef<HTMLFormElement | null>(null);

  /* --- keydown on textarea: Enter submits; Shift+Enter newlines --- */
  const onTextareaKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // requestSubmit() runs the same path as a click on the submit button
        // (full RHF validation + Zod schema), which we need for the empty-
        // content message to surface inline.
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  /* --- document-level Esc handler: abort the in-flight turn (stop mode) --- */
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

  /* --- stop button click: abort the in-flight controller --- */
  const onStopClick = useCallback(() => {
    const controller = useChatTurnStore.getState().abortController;
    controller?.abort();
  }, []);

  /* --- derived flags --- */
  const isTextareaDisabled = isStreaming || disabledNotice !== null;
  const hasError = errors.content !== undefined;
  // aria-describedby points at the validation message (when present) OR the
  // disabled-notice (when present). When neither exists the attribute is
  // omitted so screen readers do not announce empty text.
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
        {/* Visually hidden label — WCAG 2.2 AA: every input has a programmatic
            label. `sr-only` keeps it accessible to screen readers without
            consuming visual space (the placeholder + GlassSurface aria-label
            convey context to sighted users). */}
        <label htmlFor={textareaId} className="sr-only">
          {LABEL_TEXTAREA}
        </label>

        <div className="flex items-end gap-sm">
          <Textarea
            id={textareaId}
            placeholder="Pergunte algo…"
            invalid={hasError}
            disabled={isTextareaDisabled}
            aria-describedby={describedBy}
            onKeyDown={onTextareaKeyDown}
            // RHF spreads (name/onChange/onBlur/ref) — `register()` does NOT
            // return `onKeyDown`, so spreading it after our handler keeps
            // `onTextareaKeyDown` intact and lands RHF's ref/onChange/onBlur.
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
              variant="default"
              size="md"
              aria-label={ARIA_SEND}
              disabled={disabledNotice !== null}
              data-testid="composer-send-button"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Inline validation / notice row. We render at most one message at a
            time: the form error takes precedence; otherwise the disabled
            notice. The container has a stable id so aria-describedby points
            at a present node. */}
        {(hasError || disabledNotice !== null) && (
          <p
            id={messageId}
            role={hasError ? "alert" : undefined}
            className={cn(
              "text-caption",
              hasError ? "text-state-disputed" : "text-muted",
            )}
            data-testid="composer-message"
          >
            {hasError ? errors.content?.message : disabledNotice}
          </p>
        )}

        {/* Footer slot — UsageBadge (TC-10) will mount here. Kept as an empty
            container with a testid so the layout reserves its row before
            TC-10 lands. */}
        <div
          className="flex items-center justify-end"
          data-testid="composer-usage-slot"
        />
      </form>
    </GlassSurface>
  );
};
