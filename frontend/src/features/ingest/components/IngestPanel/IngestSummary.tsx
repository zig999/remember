/**
 * IngestSummary — compact counts table for `LlmRunSummary` (dev_tc_005).
 *
 * Spec: `ingest.feature.spec.md §2 UI-07` — display
 * `accepted/consolidated/needs_review/uncertain/disputed/rejected/error`
 * (the spec intentionally hides `superseded_previous` and
 * `orphaned_fragments` from v1).
 *
 * No `StateBadge` import — this worktree branched from main and the project
 * `StateBadge` is owned by other TCs not present here. We render the labels
 * inline using semantic tokens (no hardcoded colour / spacing).
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { LlmRunSummary } from "../../api";

export interface IngestSummaryProps {
  readonly summary: LlmRunSummary;
  readonly className?: string;
}

interface Row {
  readonly key: keyof LlmRunSummary;
  readonly label: string;
}

const ROWS: ReadonlyArray<Row> = [
  { key: "accepted", label: "Aceitos" },
  { key: "consolidated", label: "Consolidados" },
  { key: "needsReview", label: "Aguardando revisão" },
  { key: "uncertain", label: "Incertos" },
  { key: "disputed", label: "Em conflito" },
  { key: "rejected", label: "Rejeitados" },
  { key: "error", label: "Erros" },
];

export const IngestSummary: FC<IngestSummaryProps> = ({ summary, className }) => {
  return (
    <dl
      data-testid="ingest-summary"
      className={cn("flex flex-col gap-xs", className)}
    >
      {ROWS.map(({ key, label }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-md"
          data-testid={`ingest-summary-row-${key}`}
        >
          <dt className="text-body-sm text-muted">{label}</dt>
          <dd className="text-body-sm font-medium text-content">
            {summary[key]}
          </dd>
        </div>
      ))}
    </dl>
  );
};
