import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { ToolCallChipProps } from "./ToolCallChip.types";

const STATUS_PENDING = "em andamento";
const STATUS_OK = "concluído";
const STATUS_ERROR = "erro";

function statusLabel(ok: boolean | null): string {
  if (ok === null) return STATUS_PENDING;
  if (ok) return STATUS_OK;
  return STATUS_ERROR;
}

export const ToolCallChip: FC<ToolCallChipProps> = ({ chip, className }) => {
  const { tool, argsSummary, ok } = chip;
  const status = statusLabel(ok);
  const ariaLabel = `${tool} — ${status}`;

  const icon =
    ok === null ? (
      <Loader2
        className="size-3.5 shrink-0 animate-spin text-muted-foreground"
        aria-hidden="true"
      />
    ) : ok ? (
      <CheckCircle2
        className="size-3.5 shrink-0 text-state-accepted"
        aria-hidden="true"
      />
    ) : (
      <XCircle
        className="size-3.5 shrink-0 text-state-disputed"
        aria-hidden="true"
      />
    );

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      data-testid="tool-call-chip"
      data-state={ok === null ? "pending" : ok ? "ok" : "error"}
      className={cn(
        "inline-flex items-center gap-xs rounded-pill border border-border bg-elevated px-md py-xs text-xs text-foreground",
        className,
      )}
    >
      {icon}
      <span className="font-medium">{tool}</span>
      {argsSummary.length > 0 && (
        <span className="text-muted-foreground">{argsSummary}</span>
      )}
    </span>
  );
};
