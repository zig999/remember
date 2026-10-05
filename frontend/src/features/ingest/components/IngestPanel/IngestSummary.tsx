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
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-xs font-medium text-foreground">
            {summary[key]}
          </dd>
        </div>
      ))}
    </dl>
  );
};
