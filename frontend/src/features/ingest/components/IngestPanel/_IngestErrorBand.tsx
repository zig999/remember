/**
 * _IngestErrorBand — internal sub-component of IngestPanel (dev_tc_004_r1).
 *
 * Extracted from `IngestPanel.tsx` to keep that file ≤ 300 lines
 * (`u-fe-standards/SKILL.md` Code Quality Gate). Rendering logic and ARIA
 * contract are unchanged — see `ingest.feature.spec.md §2 UI-06` and §8.
 *
 * Underscore prefix marks the file as an internal sibling; not re-exported
 * from the per-component `index.ts`.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface IngestErrorBandProps {
  /** Error message — displayed under the heading. Falls back to a generic
   *  copy when `undefined`. */
  readonly errorMessage?: string | undefined;
  /** Whether the "Tentar novamente" CTA is shown. Computed by IngestPanel
   *  from the error code. */
  readonly isRetryable: boolean;
  /** Raised on "Tentar novamente" click. */
  readonly onRetry: () => void;
  /** Raised on "Ingerir outro documento" click. */
  readonly onReset: () => void;
}

export const IngestErrorBand: FC<IngestErrorBandProps> = ({
  errorMessage,
  isRetryable,
  onRetry,
  onReset,
}) => {
  return (
    <div
      data-testid="ingest-error"
      role="alert"
      className={cn(
        "flex flex-col gap-sm rounded-md border border-border-error p-md",
        "bg-surface",
      )}
    >
      <p className="text-label text-content">Erro na ingestão</p>
      <p className="text-body-sm text-content">
        {errorMessage ?? "Algo deu errado. Tente novamente."}
      </p>
      <div className="flex flex-wrap gap-sm">
        {isRetryable ? (
          <Button
            type="button"
            size="sm"
            data-testid="ingest-retry"
            onClick={onRetry}
          >
            Tentar novamente
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="ingest-reset"
          onClick={onReset}
        >
          Ingerir outro documento
        </Button>
      </div>
    </div>
  );
};
