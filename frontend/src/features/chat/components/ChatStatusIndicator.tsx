import { Loader2 } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/cn";
import { useChatTurnStore } from "../state/chat-turn";
import type { ToolCallData } from "../types";

const COPY_THINKING = "pensando…";
const COPY_TOOL_PREFIX = "consultando a memória…";

function pickActiveToolName(
  chips: ReadonlyArray<ToolCallData>,
): string | null {
  for (let i = chips.length - 1; i >= 0; i -= 1) {
    const chip = chips[i];
    if (chip !== undefined && chip.ok === null) return chip.tool;
  }
  return null;
}

export interface ChatStatusIndicatorProps {
  readonly className?: string;
}

export const ChatStatusIndicator: FC<ChatStatusIndicatorProps> = ({
  className,
}) => {
  const chatStatus = useChatTurnStore((s) => s.chatStatus);
  const toolChips = useChatTurnStore((s) => s.toolChips);

  if (chatStatus !== "thinking" && chatStatus !== "tool_running") {
    return null;
  }

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
        "flex items-center gap-xs px-lg py-xs text-xs text-muted-foreground",
        className,
      )}
    >
      <Loader2
        aria-hidden="true"
        className="size-3.5 shrink-0 motion-safe:animate-spin"
      />
      <span>{label}</span>
    </div>
  );
};
