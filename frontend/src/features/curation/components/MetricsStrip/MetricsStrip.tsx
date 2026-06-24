/**
 * MetricsStrip — top-of-queue calibration aggregates (TC-06).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §1 R1 ("getCurationMetrics" — endpoint ADITIVO;
 *    degradação R1 = derive from listReviewQueue total).
 *  - curadoria.feature.spec.md §2 UI-01 ("MetricsStrip no topo com skeleton").
 *  - curadoria.feature.spec.md §6 (503 SYSTEM_SERVICE_UNAVAILABLE — advisory;
 *    must NOT fail the screen).
 *  - openapi.yaml `getCurationMetrics` — "graceful degradation: callers should
 *    fall back to per-kind totals derived from listReviewQueue".
 *
 * Display:
 *   accept_rate · needs_review · uncertain · disputed · entity_match_queue_count
 *
 * Loading: skeleton row (5 cells of pulse-bg) until either:
 *   - the metrics query resolves OR
 *   - the metrics query errors AND a fallback total is provided (R1).
 *
 * R1 degradation: when `metrics === null && isMetricsError === true`, the
 * strip renders fallback counts derived from the queue total + the
 * homogeneous-kind split. Only `entity_match_queue_count` and
 * `disputed_queue_count` can be derived this way; the calibration rates
 * (`accept_rate`, etc.) are blanked with `—` so the operator knows they're
 * unavailable, not stale.
 *
 * Spec constraint: the strip MUST NOT cause the page to error. We accept
 * `isMetricsError` as a boolean prop; the parent's QueryCache.onError still
 * runs centrally, but the visual outcome inside /curadoria is advisory.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { CurationMetrics } from "../../types";

export interface MetricsStripFallback {
  /** Total of entity_match queue (used when metrics errors out). */
  readonly entityMatchQueueCount: number;
  /** Total of disputed queue (used when metrics errors out). */
  readonly disputedQueueCount: number;
}

export interface MetricsStripProps {
  /** Resolved metrics. `null` while pending or when the query errored. */
  readonly metrics: CurationMetrics | null;
  /** True only after `useCurationMetrics` resolves OR errors — the strip
   *  stays in skeleton mode while both are false. */
  readonly settled: boolean;
  /** True when the metrics query errored (R1 degradation path). */
  readonly hasError: boolean;
  /** R1 fallback — derived from `listReviewQueue.total` per kind. Only
   *  consulted when `metrics === null && hasError === true`. */
  readonly fallback?: MetricsStripFallback;
  readonly className?: string;
}

interface Cell {
  readonly label: string;
  readonly value: string;
}

function formatPercent(rate: number): string {
  // accept_rate is a 0..1 number per openapi.yaml.
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
    // R1: only the queue totals are derivable. Rates blank with `—`.
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

  return (
    <section
      aria-label="Métricas de curadoria"
      aria-busy={skeleton || undefined}
      className={cn(
        "grid grid-cols-2 gap-sm rounded-md border border-border bg-surface p-md sm:grid-cols-5",
        className,
      )}
    >
      {skeleton
        ? Array.from({ length: 5 }, (_unused, i) => (
            <div
              key={i}
              role="status"
              aria-label="Carregando métrica"
              className="flex flex-col gap-xs"
            >
              <span className="h-4 w-16 animate-pulse rounded-sm bg-elevated" />
              <span className="h-6 w-12 animate-pulse rounded-sm bg-elevated" />
            </div>
          ))
        : cells.map((cell) => (
            <div key={cell.label} className="flex flex-col gap-xs">
              <span className="text-caption text-body">{cell.label}</span>
              <span className="text-heading text-content">{cell.value}</span>
            </div>
          ))}
    </section>
  );
};
