/**
 * ChatBubble — public type contract (TC-05).
 *
 * Canonical source: docs/specs/front/components/ChatBubble.component.spec.md §3.
 *
 * The bubble is the shared ds atom rendered once per persisted message (history)
 * and once for the in-flight assistant message (live, streaming). It composes
 * `GlassSurface` (level='modal', z-base) + entrance motion + optional
 * streaming-cursor and tool-chip slots. It is NOT a modal in the ARIA sense:
 * no focus trap, no role='dialog', no tabIndex on the root.
 *
 * Out of scope (spec §1): conversation layout, scroll behaviour, autoscroll,
 * focus management, message persistence, the streaming source (the live cursor
 * is a presentational slot — the parent feature owns the SSE).
 *
 * Cross-feature dependency note:
 *  - `ToolCallData` is owned by the chat feature (`features/chat/types.ts`,
 *    landed in TC-03). The ds atom imports the type so consumers of every
 *    feature receive the same shape; this is the single allowed feature →
 *    ds-types reference, narrowly scoped to a data-only type (no runtime
 *    coupling). Tool chips themselves are feature-local and built in TC-10.
 */
import type { ComponentPropsWithoutRef, Ref } from "react";
import type { ToolCallData } from "@/features/chat/types";

/**
 * Bubble variant — the visual alignment + tonal direction of the bubble. Maps
 * 1:1 to the `chat_message.role` column on the wire (user vs assistant).
 *
 * Spec §6: `user` bubbles align to the right (self-end); `assistant` bubbles
 * align to the left (self-start). Alignment lives on the bubble itself — the
 * parent (ChatBubbleList in TC-06) does not need flex-direction tricks.
 */
export type ChatBubbleVariant = "user" | "assistant";

export type ChatBubbleProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "content"
> & {
  /** Bubble alignment + role (spec §6). */
  variant: ChatBubbleVariant;
  /**
   * Message text. Empty string is legal — a freshly-opened streaming bubble
   * has `content=""` and grows via `streaming=true` + parent re-renders.
   */
  content: string;
  /**
   * True while an in-flight assistant turn is streaming text. Adds
   * `aria-busy='true'` and renders the inline streaming cursor (spec §4
   * "streaming"). Removed when streaming ends — `aria-busy` collapses to its
   * default (absent). User bubbles MUST never have `streaming=true` (the
   * type does not prohibit it; the ChatBubbleList enforces it).
   */
  streaming?: boolean;
  /**
   * True when the turn ended in an error path (server `error` frame or
   * `provider_error`/`internal_error` stop reason). Switches the underlying
   * `GlassSurface` to `accent='error'` (red border). Does NOT swap any text
   * content — the error message itself is provided via `content` (or via
   * `stopReason`, in the rare case of a stop-only signal).
   */
  error?: boolean;
  /**
   * Stop reason for the assistant turn. Only `'cancelled'` renders a visible
   * notice ("Resposta interrompida", spec §4 stopped). Any other value
   * (`'end_turn'`, `'max_tokens'`, `'stop_sequence'`, …) renders no notice —
   * the standard final-state bubble suffices.
   */
  stopReason?: string;
  /**
   * Play the entrance animation on mount. Defaults to true; the parent should
   * pass `animate=false` when re-mounting persisted history on initial load
   * (BR-02 in the feature spec) so the whole pane does not flash.
   */
  animate?: boolean;
  /**
   * Tool-call chips to render inline (above the message text). The ds atom
   * renders presentational stubs only — TC-10 ships the feature-local
   * `ToolCallChip` and parents will override these stubs via composition.
   */
  toolChips?: ReadonlyArray<ToolCallData>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};
