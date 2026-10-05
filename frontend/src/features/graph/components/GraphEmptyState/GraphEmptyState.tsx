import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { GraphEmptyStateProps } from "./GraphEmptyState.types";

export const GRAPH_EMPTY_STATE_COPY =
  "A memória aparecerá aqui conforme você conversa.";

export const GraphEmptyState: FC<GraphEmptyStateProps> = ({
  className,
  ref,
}) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center p-lg",
        className,
      )}
    >
      <p
        className="text-xs text-muted-foreground text-center max-w-md"
      >
        {GRAPH_EMPTY_STATE_COPY}
      </p>
    </div>
  );
};
