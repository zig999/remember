/**
 * MessageStream — scrollable list of chat messages (TC-08).
 *
 * Renders the conversation's persisted history (from `useListMessages`) plus
 * the in-flight streaming assistant bubble (from `useChatTurnStore`). Owns:
 *
 *   - UI-02 (loading)        — 3 alternating skeleton bubbles while the
 *                              history fetch is `isPending`.
 *   - UI-03 (success)        — history rendered chronologically; auto-scroll
 *                              to bottom on mount and on each `text_delta`.
 *   - UI-04 (streaming)      — `aria-busy='true'` on the root region; a
 *                              streaming assistant bubble is appended below
 *                              the history; its content is the running
 *                              `streamingText` accumulator.
 *   - UI-05 (streaming-done) — when `isStreaming` flips false, the streaming
 *                              bubble disappears and the assistant message
 *                              comes back through the history list (via
 *                              `useSendMessage`'s post-turn invalidation).
 *   - UI-06 (streaming-error)— if the turn ended in error AND there is no
 *                              persisted assistant message yet, the streaming
 *                              bubble flips to `error=true` (no separate
 *                              banner — the bubble itself carries the state).
 *   - UI-07 (error)          — inline error banner with a Retry button that
 *                              calls `refetch()` when the history fetch
 *                              fails. (No toast: history failure is a local
 *                              UI affordance, not a global notification.)
 *   - UI-09 (empty)          — pt-BR copy "Nenhuma mensagem ainda. Envie uma
 *                              mensagem para começar." when the conversation
 *                              has no messages and no streaming turn is in
 *                              flight.
 *
 * Accessibility (TC-08 constraints):
 *  - `aria-live='polite'` on the root region — the same region for ALL
 *    updates, never nested inside a bubble. This avoids screen readers
 *    re-announcing the whole history on every delta.
 *  - `aria-busy='true'` on the root region (NOT just on the bubble) while
 *    `useChatTurnStore.isStreaming`. AT can pause reading until the live
 *    update settles.
 *  - The StreamingCursor inside the streaming bubble has its own
 *    `aria-hidden='true'` (set in StreamingCursor.tsx); MessageStream does
 *    not need to repeat it.
 *
 * Auto-scroll contract (TC-08 known context):
 *  - `useRef` on a sentinel element below the message list, `scrollIntoView`
 *    in a layout effect that fires after the history loads AND after each
 *    `streamingText` change. We do NOT scroll the window — we scroll the
 *    list's overflow container (the section has `overflow-y-auto`).
 *  - Per spec §8 normative scroll behaviour: an initial history load uses
 *    `behavior: 'auto'` (no animation cascade); incremental deltas use
 *    `behavior: 'smooth'`. Reduced-motion downgrades smooth → auto.
 *
 * AbortController cleanup:
 *  - On unmount, abort whatever `AbortController` is currently registered in
 *    `useChatTurnStore`. This handles route changes / conversation switches
 *    mid-stream. The Composer's stop button does the same on Esc; we cover
 *    the unmount path too so a navigation never leaves a zombie fetch
 *    feeding the (now-unmounted) store.
 *
 * History vs. streaming bubble rendering:
 *  - History bubbles: `animate={false}` (TC-08 constraint — no entrance
 *    cascade when re-mounting a 50-message conversation).
 *  - Streaming assistant bubble: `animate={true}`, `streaming={true}` while
 *    `isStreaming` is true. When `isStreaming` flips false, the streaming
 *    bubble is removed (the persisted assistant message arrives via the
 *    next listMessages refetch and is rendered as history).
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import type { FC } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { ChatBubble } from "@/components/ds/ChatBubble";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useListMessages } from "../api/use-list-messages";
import { useChatTurnStore } from "../state/chat-turn";
import type { ChatMessage, ChatContentBlock } from "../types";

/* ---------------- copy (verbatim pt-BR, TC-08 constraints) ---------------- */

const LABEL_REGION = "Mensagens da conversa";
const COPY_EMPTY = "Nenhuma mensagem ainda. Envie uma mensagem para começar.";
const COPY_ERROR =
  "Não foi possível carregar o histórico. Tente novamente.";
const COPY_RETRY = "Tentar novamente";

/* ---------------- helpers ---------------- */

/**
 * Join the wire `content[]` blocks into a single string for the bubble.
 *
 * Spec §7 adapter: ChatBubble takes a flat `content: string`; the wire keeps
 * the Anthropic-style `content[]` blocks. v1 emits only `text` blocks, but
 * the adapter is forgiving — unknown block types simply contribute nothing,
 * which keeps a forward-compatible payload (`image`/`tool_use`/…) from
 * crashing the SPA.
 */
function joinContent(blocks: ReadonlyArray<ChatContentBlock>): string {
  let out = "";
  for (const block of blocks) {
    if (typeof block.text === "string") {
      out += block.text;
    }
  }
  return out;
}

/* ---------------- subcomponents (private — scope to this file) ---------------- */

/**
 * UI-02 skeleton band — three alternating bubbles with a pulsing tint.
 *
 * Rendering as `<div role="presentation">` (no role on each shape) keeps the
 * AT tree quiet during loading; the root region's `aria-live='polite'`
 * announces when the real bubbles arrive.
 */
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
        // Same vertical rhythm as a real ChatBubble so the swap from skeleton
        // to history bubble does NOT shift the layout (CLS guard).
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

/**
 * UI-07 — history fetch error band. Inline (NOT a modal / toast) so the
 * recovery affordance stays anchored to the failed surface.
 */
const ErrorBanner: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  // `role="alert"` lifts the failure into the AT live-region channel; using
  // a plain div (NOT GlassSurface, which restricts its `role` to landmark
  // roles per its component spec) keeps the contract simple. The visual
  // glass tint is composed via Tailwind tokens — matches the GlassSurface
  // ambient appearance one-to-one.
  <div
    role="alert"
    aria-label={COPY_ERROR}
    data-testid="message-stream-error"
    className="m-lg flex flex-col gap-sm rounded-md border border-border-glass bg-surface-glass-ambient px-lg py-md text-content"
  >
    <div className="flex items-start gap-sm">
      <AlertTriangle
        className="size-4 shrink-0 text-state-disputed"
        aria-hidden="true"
      />
      <p className="flex-1 text-body-sm text-content">{COPY_ERROR}</p>
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

/* ---------------- public component ---------------- */

export interface MessageStreamProps {
  readonly conversationId: string;
  readonly className?: string;
}

export const MessageStream: FC<MessageStreamProps> = ({
  conversationId,
  className,
}) => {
  /* --- history fetch (TC-03 hook) --- */
  const query = useListMessages(conversationId);

  /* --- ephemeral streaming state (TC-04 store) ---
   *
   * Subscribed reactively — each `appendText` re-renders MessageStream so the
   * streaming bubble redraws with the new accumulated text AND the
   * autoscroll effect below fires on the new content. */
  const isStreaming = useChatTurnStore((s) => s.isStreaming);
  const streamingText = useChatTurnStore((s) => s.streamingText);

  /* --- reduced-motion: downgrade smooth scroll to instant ---
   *
   * Framer Motion's hook returns null on first render in some envs; the !== false
   * check normalises to a strict boolean and matches the project convention
   * (see ChatBubble.tsx L125). */
  const prefersReducedMotion = useReducedMotion() === true;

  /* --- auto-scroll sentinel (TC-08 known context) --- */
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Track first-paint of history vs. subsequent delta updates so we can pick
  // the correct scroll behaviour ('auto' on initial mount, 'smooth' for
  // incremental streaming). useRef is correct here — we don't want a re-render
  // when the flag flips.
  const hasInitialScrolledRef = useRef<boolean>(false);

  // Initial scroll on history load (UI-03). Layout effect so the scroll
  // happens BEFORE the browser paints, eliminating the "ghost scroll from
  // top" flicker on initial conversation open. The `typeof === 'function'`
  // guard is a defensive escape hatch for jsdom (which has no
  // `scrollIntoView`) — production browsers always have it.
  useLayoutEffect(() => {
    if (!query.isSuccess) return;
    if (hasInitialScrolledRef.current) return;
    const node = bottomRef.current;
    if (node !== null && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "end", behavior: "auto" });
    }
    hasInitialScrolledRef.current = true;
  }, [query.isSuccess]);

  // Stream delta scroll — fires every time streamingText grows. Smooth
  // behaviour gives the eye a beat to register the new text without making
  // each delta feel like a hard jump; reduced-motion users get 'auto'.
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

  /* --- AbortController cleanup on unmount (TC-08 constraint) ---
   *
   * The streaming turn's controller lives in useChatTurnStore. If we unmount
   * mid-stream (route change, conversation switch), we abort it so the
   * server can free the per-turn resources and the SSE reader resolves with
   * an AbortError instead of dangling. We read the controller AT cleanup
   * time (not at effect setup) so a turn started after mount is still
   * captured. */
  useEffect(() => {
    return () => {
      const controller = useChatTurnStore.getState().abortController;
      controller?.abort();
    };
    // Empty deps: cleanup runs on unmount only — re-running on every render
    // would abort the live turn we are trying to display.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- branch: loading (UI-02) --- */
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

  /* --- branch: error (UI-07) ---
   *
   * Rendered with the same root region so screen readers stay in the same
   * live-region context; the inline alert announces the failure. */
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

  /* --- branch: success — empty (UI-09) vs history (UI-03/UI-04) --- */
  const messages: ReadonlyArray<ChatMessage> = query.data?.items ?? [];
  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <section
      aria-label={LABEL_REGION}
      aria-live="polite"
      // aria-busy='true' ONLY while streaming (TC-08 constraint). Spec §8
      // forbids leaving it stuck — the prop falls back to omission via
      // conditional spread (exactOptionalPropertyTypes-safe).
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
          className="flex flex-1 items-center justify-center px-lg text-content"
          data-testid="message-stream-empty"
        >
          <p className="text-body text-content">{COPY_EMPTY}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md px-lg py-md">
          {messages.map((m) => (
            // Stable React key: chat_message.id is a server-side UUID,
            // immutable for the lifetime of the message. No array-index
            // keys (project anti-pattern) — bubbles can be inserted at
            // either end (optimistic user bubble at the tail; older
            // messages prepended by future "load older" pagination).
            <ChatBubble
              key={m.id}
              variant={m.role}
              content={joinContent(m.content)}
              animate={false}
              {...(m.stop_reason !== null ? { stopReason: m.stop_reason } : {})}
            />
          ))}

          {/* UI-04 streaming bubble: only mounts while isStreaming. Its
              content is the live accumulator; the StreamingCursor is rendered
              inline at the end of the text (inside ChatBubble's stream slot).
              The streaming bubble is NOT keyed by id (there is no id yet —
              the assistant message row is created server-side on `done`); a
              fixed key is stable because exactly one streaming bubble can
              exist at a time per spec invariant (§9 frame ordering). */}
          {isStreaming ? (
            <ChatBubble
              key="streaming"
              variant="assistant"
              content={streamingText}
              streaming
              animate
            />
          ) : null}
        </div>
      )}

      {/* Auto-scroll sentinel — kept OUTSIDE the conditional branches so the
          ref stays stable across loading→success transitions. A zero-height
          marker is enough for `scrollIntoView` to anchor on. */}
      <div
        ref={bottomRef}
        aria-hidden="true"
        data-testid="message-stream-bottom"
        className="h-0 w-0"
      />
    </section>
  );
};
