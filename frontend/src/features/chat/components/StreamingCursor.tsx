import type { FC } from "react";
import { cn } from "@/lib/cn";

export interface StreamingCursorProps {
  readonly className?: string;
}

export const StreamingCursor: FC<StreamingCursorProps> = ({ className }) => {
  return (
    <span
      aria-hidden="true"
      data-testid="streaming-cursor"
      className={cn(
        "ml-[1px] inline-block h-[1em] w-[0.45em] align-text-bottom bg-foreground",
        "motion-safe:[animation:cursor-blink_1.1s_ease-in-out_infinite]",
        className,
      )}
    />
  );
};
