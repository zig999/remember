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
import { GlassSurface } from "@/components/ds/GlassSurface";
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
  // Lead = acceptance rate (always cells[0] when buildCells returns rows);
  // counts = the four queue breakdowns. Destructure so the strict index
  // access is narrowed once, then guarded in the render below.
  const [lead, ...counts] = cells;

  return (
    <GlassSurface
      level="ambient"
      role="region"
      aria-label="Métricas de curadoria"
      aria-busy={skeleton || undefined}
      className={cn("flex flex-col gap-sm p-md", className)}
    >
      {skeleton || lead === undefined ? (
        // Loading: a quiet 2-col grid of pulse cells. Never a 5-across row —
        // that collides the long labels in this narrow queue column (root
        // font is 13px, so even @sm ≈ 312px triggers inside a ~340px column).
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
          {/* Lead: acceptance rate is the calibration headline — one
              emphasized number, not five competing ones. */}
          <div className="flex items-baseline justify-between gap-sm">
            <span className="text-caption text-muted">{lead.label}</span>
            <span className="text-heading tabular-nums text-content">
              {lead.value}
            </span>
          </div>
          {/* Queue breakdown: 2 columns so the longer labels ("Fila
              entidades") get room and never collide. */}
          <div className="grid grid-cols-2 gap-x-md gap-y-sm">
            {counts.map((cell) => (
              <div key={cell.label} className="flex flex-col gap-xs">
                <span className="text-caption text-muted">{cell.label}</span>
                <span className="text-subheading tabular-nums text-content">
                  {cell.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassSurface>
  );
};
