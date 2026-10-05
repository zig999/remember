import type { FC } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";

export interface IngestErrorBandProps {
  readonly errorMessage?: string | undefined;
  readonly isRetryable: boolean;
  readonly onRetry: () => void;
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
      <p className="text-xs font-medium text-foreground">Erro na ingestão</p>
      <p className="text-xs text-foreground">
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
