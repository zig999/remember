/**
 * ChatStatusIndicator — discreet "waiting" hint shown below the last message
 * bubble while the chat turn is between phases that have no visible text yet.
 *
 * REQ-2 (plan §1 — "Os dois painéis exibem indicador de Processing/Waiting") —
 * the ChatSpace half of the two-pane waiting affordance. Covers the gap
 * between `send` and the first `text_delta` (when MessageStream would
 * otherwise be silent for several seconds while the model "thinks") and
 * during a tool call (when the SSE stream is held by `tool_start` →
 * `tool_result` with no token output in between).
 *
 * Spec references:
 *   - temp/chat-graphspace-plan.md §7.2 "ChatSpace changes — chatStatus
 *     state machine; ChatStatusIndicator"
 *   - temp/chat-graphspace-plan.md §12.2 "Estado do ChatSpace (chatStatus,
 *     derivado da SSE)"
 *   - AC-F.17 (plan §13, Playwright) — after send and BEFORE the first
 *     token, the indicator shows "pensando…" with `aria-live="polite"`.
 *   - AC-F.18 — during a graph tool, the indicator shows
 *     "consultando a memória… (tool)".
 *   - AC-F.19 — on `done`, the indicator is gone.
 *   - Task contract TC-FE-10 known_context:
 *       • "small, discrete line below last bubble — not a modal or overlay"
 *       • "Messages: 'pensando…' when chatStatus='thinking';
 *          'consultando a memória… (tool name)' when chatStatus='tool_running'"
 *       • "Component disappears (unmounts or hides) when chatStatus =
 *          'idle' | 'streaming' | 'error'"
 *       • "aria-live='polite' required (AC-F.17)"
 *
 * State machine consumed (state is owned by `useChatTurnStore`; TC-FE-04
 * already added `chatStatus` + `setChatStatus`; this component is the
 * read-only surface):
 *
 *   idle         → indicator NOT rendered (null)
 *   thinking     → "pensando…"
 *   streaming    → indicator NOT rendered (token text takes over)
 *   tool_running → "consultando a memória…" (+ optional " (tool name)" suffix)
 *   error        → indicator NOT rendered (a separate banner — owned by the
 *                  bubble / a future TC — surfaces the failure)
 *
 * Why a separate, ephemeral component (not a slot inside ChatBubble):
 *   The indicator must announce on the SAME aria-live region as the
 *   MessageStream so screen readers don't speak the running text twice;
 *   embedding it inside a bubble nested under MessageStream's
 *   `aria-live="polite"` region preserves that constraint. The indicator
 *   is also semantically distinct from the bubble — it is meta status,
 *   not content. Mounting/unmounting it (instead of toggling visibility)
 *   guarantees AT re-reads the new text every time `chatStatus` flips.
 *
 * Why NO import of `useGraphStore` (TC constraint, AC-U.3):
 *   The graph store status (`empty | loading | revealing | ready | error`)
 *   drives the RIGHT pane's overlay — a sibling concern. Crossing the chat
 *   → graph boundary in this file would violate REQ-6 unidirectionality
 *   (chat reading graph state) AND inflate the chat feature with graph
 *   knowledge it doesn't need. The two indicators are independently
 *   driven by their own slice; AC-F.19 (both gone on `done`) is satisfied
 *   by both reducers settling on the terminal frame.
 *
 * Tool-name source — the assumption_allowed (TC line 47) is "Tool name
 * passed via chatStatus context or a separate 'activeTool' field in the
 * store". We re-use the existing `toolChips` slice (TC-FE-04 untouched):
 * the most recent chip with `ok === null` is, by the SSE invariant
 * (openapi.yaml §"Frame ordering"), the running tool. This avoids adding
 * a new store field for a derived value AND keeps the dispatcher
 * (`useSendMessage`) unchanged (constraint: surgical changes).
 *
 * Accessibility:
 *   - `role="status"` + `aria-live="polite"` so AT announces the phrase
 *     without interrupting the user.
 *   - `aria-atomic="true"` — when the phrase flips
 *     ("pensando…" → "consultando a memória…") screen readers read the
 *     whole new value, not just the diff.
 *   - Decorative icon is `aria-hidden`. The animation on the icon is
 *     guarded by `prefers-reduced-motion` (Tailwind's `motion-safe:` —
 *     CLAUDE.md frontend §"Animation accessibility").
 *
 * Design system (CLAUDE.md "Stack Frontend" + tokens.md):
 *   - Layout/typography: `gap-xs`, `px-lg`, `py-xs`, `text-xs` (~11px,
 *     `--color-muted` per tokens.md §typography). One-line height keeps
 *     the bubble→indicator transition compact.
 *   - Colours: `text-muted-foreground` for the prose, `text-muted-foreground` for the spinner —
 *     low priority, secondary content (tokens.md §5.3 "muted = lowest
 *     priority").
 *   - No CVA: single visual variant (TC assumption line 46).
 */
import { Loader2 } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/cn";
import { useChatTurnStore } from "../state/chat-turn";
import type { ToolCallData } from "../types";

/* ---------------- copy (verbatim pt-BR, TC-FE-10 known_context) ---------------- */

const COPY_THINKING = "pensando…";
const COPY_TOOL_PREFIX = "consultando a memória…";

/* ---------------- helpers ---------------- */

/**
 * The "active" tool is the most recent pending chip — `tool_start` adds
 * with `ok: null`; `tool_result` settles it (boolean). Per the wire
 * invariant (every `tool_start` followed by exactly one `tool_result`),
 * at most one chip is pending at any time, so a `findLast` over the
 * accumulator is sufficient AND correct.
 *
 * Returns `null` when no chip is pending (defensive — the dispatcher
 * sets `chatStatus = "tool_running"` after `addToolChip`, so by the
 * time this branch runs there should ALWAYS be a pending chip; the
 * null branch is the fallback for the race between the two slice
 * updates within the same React batch).
 */
function pickActiveToolName(
  chips: ReadonlyArray<ToolCallData>,
): string | null {
  // Iterate backwards — small array (chips drain on `done`), and `findLast`
  // would require ES2023 lib config; a manual loop is portable + cheap.
  for (let i = chips.length - 1; i >= 0; i -= 1) {
    const chip = chips[i];
    if (chip !== undefined && chip.ok === null) return chip.tool;
  }
  return null;
}

/* ---------------- component ---------------- */

export interface ChatStatusIndicatorProps {
  /** Extra utility classes — composes via `cn()` (tailwind-merge). */
  readonly className?: string;
}

/**
 * Discrete waiting hint, anchored below the last message bubble.
 *
 * Mounts only while the chat is in `thinking` or `tool_running`; returns
 * `null` for every other `chatStatus`. The empty render keeps MessageStream
 * compact when nothing is happening AND lets AT pick up the
 * mount-as-announcement pattern (every appearance is a fresh live-region
 * update).
 */
export const ChatStatusIndicator: FC<ChatStatusIndicatorProps> = ({
  className,
}) => {
  // Reactive selectors — only the two slices we need; Zustand bails on
  // referential equality so re-renders are limited to actual changes.
  const chatStatus = useChatTurnStore((s) => s.chatStatus);
  const toolChips = useChatTurnStore((s) => s.toolChips);

  if (chatStatus !== "thinking" && chatStatus !== "tool_running") {
    return null;
  }

  // Compose the visible label. "Thinking" is a single phrase; "tool_running"
  // appends the active tool name when known (the wire never omits it on
  // `tool_start`, so the unknown branch is a defensive fallback for the
  // intra-batch race documented in `pickActiveToolName`).
  let label: string;
  if (chatStatus === "thinking") {
    label = COPY_THINKING;
  } else {
    const active = pickActiveToolName(toolChips);
    label =
      active !== null ? `${COPY_TOOL_PREFIX} (${active})` : COPY_TOOL_PREFIX;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="chat-status-indicator"
      data-state={chatStatus}
      className={cn(
        // `flex items-center gap-xs` keeps the spinner inline with the
        // phrase; `text-xs text-muted-foreground` is the "metadata / hint" pair
        // from tokens.md (§5.3 + §typography). `px-lg py-xs` matches the
        // bubble row gutter so the indicator aligns visually with the
        // message column gutters in MessageStream.
        "flex items-center gap-xs px-lg py-xs text-xs text-muted-foreground",
        className,
      )}
    >
      <Loader2
        aria-hidden="true"
        // `motion-safe:` gates the spin on `prefers-reduced-motion: no-preference`
        // — reduced-motion users see a static icon (still informative as a
        // "waiting" glyph) without the rotation. CLAUDE.md frontend
        // §"Animation accessibility" requires this guard.
        className="size-3.5 shrink-0 motion-safe:animate-spin"
      />
      <span>{label}</span>
    </div>
  );
};
