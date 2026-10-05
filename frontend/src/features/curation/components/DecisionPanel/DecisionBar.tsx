import type { FC, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";
import type { ButtonProps } from "@/shared/components/ui/button";

export interface DecisionBarButtonProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly variant?: ButtonProps["variant"];
  readonly onClick: () => void;
  readonly destructive?: boolean;
  readonly hidden?: boolean;
}

export interface DecisionBarProps {
  readonly evidenceViewed: boolean;
  readonly submitting?: boolean;
  readonly buttons: ReadonlyArray<DecisionBarButtonProps>;
  readonly blockedHintId?: string;
  readonly className?: string;
}

export const DecisionBar: FC<DecisionBarProps> = ({
  evidenceViewed,
  submitting = false,
  buttons,
  blockedHintId,
  className,
}) => {
  function gated(handler: () => void) {
    return (e: MouseEvent<HTMLButtonElement>) => {
      if (!evidenceViewed) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      handler();
    };
  }

  return (
    <div
      role="toolbar"
      aria-label="Ações de decisão"
      className={cn(
        "flex flex-wrap items-center gap-md border-t border-border p-md",
        className,
      )}
    >
      {buttons
        .filter((b) => b.hidden !== true)
        .map((b) => (
          <Button
            key={b.id}
            type="button"
            variant={b.variant ?? (b.destructive ? "destructive" : "primary")}
            aria-disabled={!evidenceViewed || undefined}
            aria-describedby={
              !evidenceViewed && blockedHintId ? blockedHintId : undefined
            }
            loading={submitting}
            onClick={gated(b.onClick)}
          >
            {b.label}
          </Button>
        ))}
    </div>
  );
};
