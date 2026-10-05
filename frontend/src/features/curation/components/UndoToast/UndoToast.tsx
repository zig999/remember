import { useEffect, useState, type FC } from "react";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";

export interface UndoToastProps {
  readonly label: string;
  readonly deadlineMs: number;
  readonly onUndo: () => void;
  readonly className?: string;
}

export const UNDO_WINDOW_MS = 5_000;
const TICK_MS = 100;

function secondsRemaining(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export const UndoToast: FC<UndoToastProps> = ({
  label,
  deadlineMs,
  onUndo,
  className,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const remaining = secondsRemaining(deadlineMs, now);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-md text-xs text-foreground",
        className,
      )}
    >
      <div className="flex flex-col gap-xs">
        <span>{label}</span>
        <span
          aria-label={`Tempo restante para desfazer: ${remaining} segundos`}
          className="text-xs text-body"
        >
          {remaining}s
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onUndo}
        aria-label="Desfazer ação"
      >
        <Undo2 aria-hidden="true" className="size-4" />
        Desfazer
      </Button>
    </div>
  );
};
