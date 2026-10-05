import type { FC } from "react";
import { cn } from "@/lib/cn";
import { useGetConversationUsage } from "../../api/use-get-conversation-usage";
import type { UsageBadgeProps } from "./UsageBadge.types";

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
        "inline-flex items-center gap-sm text-xs text-muted-foreground",
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
