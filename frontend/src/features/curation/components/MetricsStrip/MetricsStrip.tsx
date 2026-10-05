import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { CurationMetrics } from "../../types";

export interface MetricsStripFallback {
  readonly entityMatchQueueCount: number;
  readonly disputedQueueCount: number;
}

export interface MetricsStripProps {
  readonly metrics: CurationMetrics | null;
  readonly settled: boolean;
  readonly hasError: boolean;
  readonly fallback?: MetricsStripFallback;
  readonly className?: string;
}

interface Cell {
  readonly label: string;
  readonly value: string;
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function buildCells(props: MetricsStripProps): ReadonlyArray<Cell> {
  const { metrics, hasError, fallback } = props;
  if (metrics) {
    return [
      { label: "Aceitação", value: formatPercent(metrics.acceptRate) },
      { label: "Em revisão", value: String(metrics.needsReviewCount) },
      { label: "Incertos", value: String(metrics.uncertainCount) },
      { label: "Disputados", value: String(metrics.disputedCount) },
      { label: "Fila entidades", value: String(metrics.entityMatchQueueCount) },
    ];
  }
  if (hasError && fallback) {
    return [
      { label: "Aceitação", value: "—" },
      { label: "Em revisão", value: "—" },
      { label: "Incertos", value: "—" },
      {
        label: "Disputados",
        value: String(fallback.disputedQueueCount),
      },
      {
        label: "Fila entidades",
        value: String(fallback.entityMatchQueueCount),
      },
    ];
  }
  return [];
}

export const MetricsStrip: FC<MetricsStripProps> = (props) => {
  const { settled, className } = props;
  const cells = buildCells(props);
  const skeleton = !settled || cells.length === 0;
  const [lead, ...counts] = cells;

  return (
    <div
      role="region"
      aria-label="Métricas de curadoria"
      aria-busy={skeleton || undefined}
      className={cn("flex flex-col gap-sm", className)}
    >
      {skeleton || lead === undefined ? (
        <div className="grid grid-cols-2 gap-x-md gap-y-sm">
          {Array.from({ length: 5 }, (_unused, i) => (
            <div
              key={i}
              role="status"
              aria-label="Carregando métrica"
              className="flex flex-col gap-xs"
            >
              <span className="h-3 w-16 animate-pulse rounded-sm bg-elevated" />
              <span className="h-5 w-10 animate-pulse rounded-sm bg-elevated" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-sm">
            <span className="text-xs text-muted-foreground">{lead.label}</span>
            <span className="text-lg font-semibold tracking-tight tabular-nums text-foreground">
              {lead.value}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-md gap-y-sm">
            {counts.map((cell) => (
              <div key={cell.label} className="flex flex-col gap-xs">
                <span className="text-xs text-muted-foreground">{cell.label}</span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {cell.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
