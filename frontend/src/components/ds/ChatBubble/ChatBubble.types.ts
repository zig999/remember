import type { ComponentPropsWithoutRef, Ref } from "react";
import type { ToolCallData } from "@/features/chat/types";

export type ChatBubbleVariant = "user" | "assistant";

export type ChatBubbleProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "content"
> & {
  variant: ChatBubbleVariant;
  content: string;
  streaming?: boolean;
  error?: boolean;
  stopReason?: string;
  animate?: boolean;
  toolChips?: ReadonlyArray<ToolCallData>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};
