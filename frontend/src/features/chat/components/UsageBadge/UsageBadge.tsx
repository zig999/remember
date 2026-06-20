/**
 * UsageBadge — token + tool-call usage display (TC-10, EPIC-04).
 *
 * Shown in the Composer footer (TC-09 left a `composer-usage-slot`). Surfaces
 * the three aggregate counters returned by GET /conversations/:id/usage —
 * tokens_in, tokens_out, tool_calls — so the operator can see cost / activity
 * at a glance.
 *
 * Lazy contract (TC-10 known context):
 *  - The hook is enabled as soon as a non-empty conversationId is provided
 *    (see `use-get-conversation-usage.ts`); it fetches after the conversation
 *    surface mounts.
 *  - This component renders `null` while the query is in flight or has not
 *    resolved yet (`isLoading` OR `data == null`). No skeleton, no zero-state
 *    fallback — the layout simply stays empty until the badge can show real
 *    numbers. The Composer footer reserves the row regardless (TC-09).
 *
 * Spec references:
 *  - dev_tc_010 task contract — props, hidden-while-loading behavior, three
 *    metrics, and the pt-BR aria-label format:
 *    "Uso: X tokens de entrada, Y tokens de saída, Z chamadas de ferramenta".
 *  - features/chat/types.ts `UsageData` — `messageCount`, `tokens_in`,
 *    `tokens_out`, `tool_calls`. We only render the latter three.
 *  - features/chat/api/use-get-conversation-usage.ts — staleTime 30s,
 *    disabled while conversationId is empty.
 *
 * Composition contract:
 *  - Feature-local: lives in features/chat/components/UsageBadge/ and is
 *    imported by the Composer (or a parent within the chat feature).
 *  - Visual surface: plain `<span>` with semantic tokens (no shared
 *    `components/ui/badge` — that variant set fills the chip; here we want a
 *    quiet, foot-of-composer micro-typographic readout).
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import { useGetConversationUsage } from "../../api/use-get-conversation-usage";
import type { UsageBadgeProps } from "./UsageBadge.types";

/* ---------- copy (pt-BR; verbatim from TC-10 constraints) ---------- */

function buildAriaLabel(
  tokensIn: number,
  tokensOut: number,
  toolCalls: number,
): string {
  return (
    `Uso: ${tokensIn} tokens de entrada, ` +
    `${tokensOut} tokens de saída, ` +
    `${toolCalls} chamadas de ferramenta`
  );
}

export const UsageBadge: FC<UsageBadgeProps> = ({
  conversationId,
  className,
}) => {
  const query = useGetConversationUsage(conversationId);

  // Hidden while loading (TC-10 "lazy" contract — see file header). We
  // intentionally check both `isLoading` and `data == null` because TanStack
  // Query may surface `data` as undefined after the query becomes enabled
  // but before the first fetch resolves (and as null in the typed contract
  // would be unusual but kept defensive).
  if (query.isLoading || query.data == null) {
    return null;
  }

  const { tokens_in, tokens_out, tool_calls } = query.data;
  const ariaLabel = buildAriaLabel(tokens_in, tokens_out, tool_calls);

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      data-testid="usage-badge"
      className={cn(
        "inline-flex items-center gap-sm text-caption text-muted",
        className,
      )}
    >
      <span data-testid="usage-badge-tokens-in">
        <span aria-hidden="true">↑ </span>
        {tokens_in}
      </span>
      <span data-testid="usage-badge-tokens-out">
        <span aria-hidden="true">↓ </span>
        {tokens_out}
      </span>
      <span data-testid="usage-badge-tool-calls">
        <span aria-hidden="true">⚙ </span>
        {tool_calls}
      </span>
    </span>
  );
};
