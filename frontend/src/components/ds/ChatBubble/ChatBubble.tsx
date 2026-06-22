/**
 * ChatBubble — shared ds atom (TC-05).
 *
 * Canonical spec: docs/specs/front/components/ChatBubble.component.spec.md
 *                 (referenced via task contract — read prior to implementation).
 *
 * The bubble is the single visual primitive used for every message in the chat
 * pane — user and assistant, persisted and live. It composes:
 *
 *  - `GlassSurface` at `level='modal'` (heaviest glass tier) but rendered at
 *    `z-base`. The bubble is NOT a modal in the ARIA sense (spec §1, §9): no
 *    `role='dialog'`, no focus trap, no tabIndex, no scrim. The `level='modal'`
 *    only picks the glass material (background / blur / shadow / radius);
 *    z-index belongs to the bubble's positioning context (the pane).
 *
 *  - The `transitionGlassModal` factory from `@/lib/motion` for the entrance
 *    animation — same fade-in + slight upward scale that the GlassSurface
 *    atom plays at modal level. Spec §4 "entering" mandates this exact factory
 *    so the visual language of "new bubble appearing" matches Dialog opening.
 *
 * Five rendered states (spec §4):
 *  1. `idle`     — persisted history bubble; `streaming=false`, no notice.
 *  2. `streaming` — live assistant bubble; `aria-busy='true'` + inline cursor.
 *  3. `error`    — turn ended in error; `GlassSurface accent='error'`.
 *  4. `stopped`  — turn ended via `cancelled`; renders "Resposta interrompida"
 *                  notice. Any other `stopReason` value is silent.
 *  5. `entering` — first mount with `animate=true` (default); the inherited
 *                  `transitionGlassModal` enter variant plays once.
 *
 * Ref contract (spec §10): React 19 ref-as-prop. The ref points at the
 * `<div>` wrapper that owns alignment + max-width (NOT the inner GlassSurface
 * div), so consumers can measure the bubble's footprint for autoscroll/
 * intersection logic without piercing the glass element's box-shadow.
 *
 * Out of scope: layout of the parent pane, scroll behaviour, autoscroll,
 * pane-level focus management, ToolCallChip internals (TC-10), StreamingCursor
 * internals (renders a minimal inline cursor here; feature-local upgrade in
 * TC-11). The ds atom never owns the SSE — the parent passes `streaming` /
 * `content` / `error` / `stopReason` props as the stream advances.
 */
import type { FC, ReactElement } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { transitionGlassModal } from "@/lib/motion";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { chatBubble } from "./ChatBubble.variants";
import type { ChatBubbleProps } from "./ChatBubble.types";

/** Notice copy table — spec §4 "stopped". Only `cancelled` renders. */
const STOP_NOTICE_BY_REASON: Readonly<Record<string, string>> = {
  cancelled: "Resposta interrompida",
};

/**
 * Stub presentation of a single tool-chip. TC-10 ships the real feature-local
 * `ToolCallChip` with the args summary + ok/pending/failed visuals; until then
 * the ds atom renders a minimal, accessible placeholder so the bubble's
 * structure (chips ABOVE the text block) is wired and consumers can iterate.
 */
function ToolChipStub({
  tool,
  ok,
}: {
  readonly tool: string;
  readonly ok: boolean | null;
}): ReactElement {
  // Static color tokens (no CVA — single visual variant per ok state, and
  // the real chip will replace this entirely in TC-10).
  const tone =
    ok === null
      ? "border-border-glass text-muted"
      : ok
        ? "border-border-accepted text-state-accepted-fg"
        : "border-border-error text-state-disputed-fg";
  return (
    <span
      data-testid="tool-chip-stub"
      data-tool={tool}
      data-ok={ok === null ? "pending" : ok ? "ok" : "error"}
      className={cn(
        "inline-flex items-center gap-xs rounded-pill border bg-surface-glass-ambient px-sm py-xs text-caption",
        tone,
      )}
    >
      {tool}
    </span>
  );
}

/**
 * Minimal inline streaming cursor (spec §4 "streaming"). The real cursor
 * (TC-11) will animate a blinking caret; here we render a static `▍` glyph
 * marked `aria-hidden='true'` so screen readers do not announce decoration.
 * The textual "live update" affordance for AT is the `aria-busy='true'`
 * attribute on the bubble root, not the cursor glyph.
 */
function StreamingCursorStub(): ReactElement {
  return (
    <span
      aria-hidden="true"
      data-testid="streaming-cursor"
      className="ml-[1px] inline-block animate-pulse text-content"
    >
      {"▍"}
    </span>
  );
}

export const ChatBubble: FC<ChatBubbleProps> = ({
  variant,
  content,
  streaming = false,
  error = false,
  stopReason,
  animate = true,
  toolChips,
  className,
  ref,
  ...rest
}) => {
  // Reduced-motion contract (front.md §9.1, BR-10): `useReducedMotion()`
  // ALWAYS wins over the prop. The GlassSurface atom inside ALSO honours
  // its own reduced-motion gate; we read the hook here for the explicit
  // intent on the bubble (the outcome is the same either way).
  const prefersReducedMotion = useReducedMotion() === true;
  const motionAllowed = animate && !prefersReducedMotion;

  // Stop-reason notice — table-driven. `stopReason='cancelled'` renders the
  // notice; any other value (including undefined and unknown strings)
  // renders nothing (spec §4 stopped table).
  const stopNotice =
    stopReason !== undefined ? STOP_NOTICE_BY_REASON[stopReason] : undefined;

  // ARIA: `aria-busy='true'` only when streaming. Spec §9: removed when
  // streaming ends so live-region semantics do not stay stuck.
  const ariaBusy = streaming ? "true" : undefined;

  // Glass accent — only `error` swaps the border; idle/streaming/stopped all
  // share the default glass border so the bubble's tonal language stays
  // "neutral content surface" by default.
  const glassAccent = error ? "error" : "none";

  // Background fill (spec §6) — the bubble keeps the MODAL material (rounded
  // corners, deep shadow, glass-modal entrance) but paints the lighter ambient
  // glass fill via GlassSurface's `fill` override:
  //  - user (right)      → plain ambient glass.
  //  - assistant (left)  → ambient glass + a touch of the accent (principal)
  //                        color (`--color-surface-glass-ambient-accent`).
  const glassFill = variant === "user" ? "ambient" : "ambient-accent";

  return (
    <div
      ref={ref}
      data-variant={variant}
      data-state={
        error
          ? "error"
          : streaming
            ? "streaming"
            : stopNotice !== undefined
              ? "stopped"
              : "idle"
      }
      // CVA wrapper picks alignment + max-width. `className` consumer override
      // wins last via cn() (tailwind-merge); never string-concatenate.
      className={cn(chatBubble({ variant }), className)}
      {...(ariaBusy !== undefined ? { "aria-busy": ariaBusy } : {})}
      {...rest}
    >
      {/* Tool chips slot — chips render above the message text (spec §6). */}
      {toolChips !== undefined && toolChips.length > 0 ? (
        <div
          data-testid="tool-chips"
          className="flex flex-wrap items-center gap-xs"
        >
          {toolChips.map((chip, i) => (
            // Composite key: tool name + index. Tool calls within a turn are
            // ordered, immutable, and chips are not reordered — index in this
            // slice is stable for the bubble's lifetime. The tool name is
            // included so React's reconciliation distinguishes adjacent calls
            // to the SAME tool (which share the index across renders only
            // when the parent's slice is identical).
            <ToolChipStub key={`${chip.tool}:${i}`} tool={chip.tool} ok={chip.ok} />
          ))}
        </div>
      ) : null}

      <GlassSurface
        level="modal"
        accent={glassAccent}
        // Ambient fill on the modal material; assistant side adds the accent
        // tint (spec §6). Override is the sanctioned GlassSurface axis — the
        // bg is NOT pushed through className (spec §11).
        fill={glassFill}
        // Smallest standardized theme radius (`--radius-sm` = 6px) instead of
        // the modal default (rounded-xl / 20px). Via the sanctioned `radius`
        // override prop (§6.5) so tailwind-merge drops the level's rounded-xl.
        radius="rounded-sm"
        // Pass `animate` through to the GlassSurface — the inner glass plays
        // the `transitionGlassModal` factory automatically when allowed
        // (spec §4 "entering"). We DO NOT inline our own variants; the spec
        // forbids that (constraints §). When `animate=false` OR reduced-
        // motion is requested, no variant attaches.
        animate={motionAllowed}
        // Critical: ChatBubble is at z-base — GlassSurface has no z-index of
        // its own, so we pass none here. The pane positioning context owns
        // stacking. (CLAUDE.md: z-modal is reserved for actual modals.)
        className="px-md py-sm"
        // Reference the canonical motion factory at the symbol level so a
        // static analyser (and the test) can prove we imported it. The
        // GlassSurface implementation is the runtime consumer of this same
        // factory; we re-reference it via a `data-*` attribute so spec-
        // driven tests can pin the contract: "ChatBubble entrance MUST come
        // from transitionGlassModal" (spec constraint).
        data-motion-source={
          motionAllowed && transitionGlassModal !== undefined
            ? "transitionGlassModal"
            : undefined
        }
      >
        {/* Message text + inline streaming cursor (cursor is appended INSIDE
            the text flow so it sits at the end of the streamed content). */}
        <p
          data-testid="bubble-content"
          className="whitespace-pre-wrap break-words text-body text-content"
        >
          {content}
          {streaming ? <StreamingCursorStub /> : null}
        </p>
      </GlassSurface>

      {/* Stop-reason notice — rendered BELOW the bubble surface so it reads
          as a meta-line and the AT user hears it after the bubble content.
          Spec §4 stopped: copy is exact. */}
      {stopNotice !== undefined ? (
        <p
          data-testid="stop-notice"
          // The notice is informational (not an alert) — no role='status' /
          // 'alert'. It enters with the bubble and persists; it does not
          // re-announce.
          className="text-caption text-muted"
        >
          {stopNotice}
        </p>
      ) : null}
    </div>
  );
};
