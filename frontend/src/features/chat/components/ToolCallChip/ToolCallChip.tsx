/**
 * ToolCallChip — inline tool-call status chip (TC-10, EPIC-04).
 *
 * Renders inside ChatBubble content during an in-flight assistant turn, one
 * chip per tool invocation accumulated from the SSE stream. State maps 1:1
 * from the `ToolCallData.ok` tri-state:
 *
 *   ok === null   -> pending  (saw `tool_start`, awaiting `tool_result`)
 *   ok === true   -> success  (`tool_result` arrived, no error)
 *   ok === false  -> error    (`tool_result` arrived with an error)
 *
 * Spec references:
 *  - dev_tc_010 task contract — three observable states + aria-label format
 *    "{tool} — {status}" with status in pt-BR
 *    ('em andamento' | 'concluído' | 'erro').
 *  - features/chat/types.ts — `ToolCallData` is the wire-derived chip shape.
 *
 * Composition contract:
 *  - This chip is feature-local; ChatBubble (TC-05/owner) imports and renders
 *    it. ToolCallChip itself does NOT import from ChatBubble — kept as a leaf
 *    so it can be tested and styled in isolation.
 *  - Icons come from lucide-react (already in the stack — Composer uses it):
 *      Loader2 (spinning) for pending, CheckCircle2 for success, XCircle for
 *      error. Icons are decorative (`aria-hidden`); the human-readable status
 *      lives on the chip's `aria-label`.
 *  - Colors come from semantic state tokens — `text-muted-foreground` for pending (no
 *    state hue yet — see tokens.md §5.3), `text-state-accepted` for success,
 *    `text-state-disputed` for error. Never raw hex/rgb (CLAUDE.md §Stack
 *    Frontend "No arbitrary values — use tokens").
 */
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { ToolCallChipProps } from "./ToolCallChip.types";

/* ---------- status copy (pt-BR; verbatim from TC-10 constraints) ---------- */

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

  // One icon per state. Branching with discriminated `ok` keeps the JSX
  // legible and lets each branch pick its own semantic colour class without
  // a className lookup table.
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
