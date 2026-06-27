/**
 * IngestProgressArea — aria-live region managing progress copy, error band,
 * idempotency-noop notice, and summary reveal (TC-04).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 UI-03, UI-04, UI-05,
 *    UI-06, UI-07, §6 (error-code → UI mapping), §8 (`aria-live="polite"`
 *    on root; `aria-busy="true"` during sending/extracting; `role="alert"`
 *    on the error band).
 *
 * The component is non-cumulative: at any time it renders ONE of:
 *   - empty placeholder (idle / ready)
 *   - sending spinner (sending)
 *   - extracting spinner with optional polling-fallback override (extracting,
 *     revealing)
 *   - "Documento já ingerido" info notice (noop)
 *   - error band (error)
 *   - summary (complete)
 *
 * `node_selected` mirrors `complete` (the panel does not change when the
 * right column swaps to NodeDetailPanel).
 */
import type { FC } from "react";
import { Loader2, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { IngestSummary } from "../IngestSummary";
import type { IngestProgressAreaProps } from "./IngestProgressArea.types";

const NOOP_TITLE = "Documento já ingerido";
const NOOP_BODY =
  "Este conteúdo já foi processado anteriormente. O grafo abaixo mostra os nós extraídos.";
const NOOP_CTA = "Ver grafo existente";
const RESET_LABEL = "Ingerir outro documento";
const RETRY_LABEL = "Tentar novamente";
const SUMMARY_TITLE = "Extração concluída";
const NEEDS_REVIEW_NOTICE =
  "Alguns nós aguardam revisão. Acesse Curadoria para detalhes.";

const SENDING_MSG = "Enviando documento…";
const EXTRACTING_MSG = "Extraindo conhecimento… (pode levar alguns minutos)";

/* ---------- §6 error-code → pt-BR message map ---------- */
const ERROR_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  VALIDATION_REQUIRED_FIELD: "Campo obrigatório ausente.",
  VALIDATION_INVALID_FORMAT: "Formato inválido na requisição.",
  VALIDATION_OUT_OF_RANGE: "Conteúdo fora do limite permitido.",
  BUSINESS_RUN_NOT_RUNNABLE:
    "Esta extração já foi concluída ou não está no estado correto.",
  BUSINESS_RUN_NOT_RETRYABLE:
    "Esta extração não pode ser reprocessada neste momento.",
  SYSTEM_LLM_PROVIDER_UNAVAILABLE:
    "O provedor de IA está indisponível. Tente novamente em instantes.",
  SYSTEM_INTERNAL_ERROR: "Algo deu errado. Tente novamente.",
  RESOURCE_NOT_FOUND:
    "Recurso não encontrado. O run ou nó pode ter sido removido.",
  BUSINESS_INVALID_TRAVERSE_DEPTH: "Parâmetro de travessia inválido.",
});

const DEFAULT_ERROR_MESSAGE = "Algo deu errado. Tente novamente.";

function resolveErrorMessage(code: string | undefined): string {
  if (code === undefined) return DEFAULT_ERROR_MESSAGE;
  return ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGE;
}

/** §6 — only `SYSTEM_LLM_PROVIDER_UNAVAILABLE` ships a "Tentar novamente"
 * action. Other failures route to "Ingerir outro documento". */
function errorAllowsRetry(code: string | undefined): boolean {
  return code === "SYSTEM_LLM_PROVIDER_UNAVAILABLE";
}

export const IngestProgressArea: FC<IngestProgressAreaProps> = ({
  phase,
  progressMessage,
  summary,
  errorCode,
  onVerGrafoExistente,
  onIngerirOutro,
  onRetry,
  className,
}) => {
  const isBusy = phase === "sending" || phase === "extracting" || phase === "revealing";

  return (
    <section
      aria-live="polite"
      aria-busy={isBusy ? "true" : "false"}
      data-testid="ingest-progress-area"
      data-phase={phase}
      className={cn("flex flex-col gap-sm", className)}
    >
      {phase === "sending" && (
        <div
          className="flex items-center gap-sm rounded-md bg-surface px-md py-sm text-body-sm text-content"
          data-testid="ingest-progress-sending"
        >
          <Loader2 className="size-4 animate-spin text-action" aria-hidden="true" />
          <span>{progressMessage ?? SENDING_MSG}</span>
        </div>
      )}

      {(phase === "extracting" || phase === "revealing") && (
        <div
          className="flex items-center gap-sm rounded-md bg-surface px-md py-sm text-body-sm text-content"
          data-testid="ingest-progress-extracting"
        >
          <Loader2 className="size-4 animate-spin text-action" aria-hidden="true" />
          <span>{progressMessage ?? EXTRACTING_MSG}</span>
        </div>
      )}

      {phase === "noop" && (
        <div
          className="flex flex-col gap-sm rounded-md border border-border bg-surface px-md py-sm"
          data-testid="ingest-progress-noop"
        >
          <div className="flex items-start gap-sm">
            <Info
              className="size-4 shrink-0 text-action"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-label font-semibold text-content">
                {NOOP_TITLE}
              </p>
              <p className="mt-xs text-body-sm text-muted">{NOOP_BODY}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onVerGrafoExistente}
              disabled={onVerGrafoExistente === undefined}
              data-testid="ingest-noop-ver-grafo"
            >
              {NOOP_CTA}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onIngerirOutro}
              disabled={onIngerirOutro === undefined}
              data-testid="ingest-noop-reset"
            >
              {RESET_LABEL}
            </Button>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div
          role="alert"
          className="flex flex-col gap-sm rounded-md border border-border-error bg-state-disputed px-md py-sm text-state-disputed-fg"
          data-testid="ingest-progress-error"
          data-error-code={errorCode}
        >
          <div className="flex items-start gap-sm">
            <AlertTriangle
              className="size-4 shrink-0"
              aria-hidden="true"
            />
            <p className="flex-1 text-body-sm">
              {resolveErrorMessage(errorCode)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            {errorAllowsRetry(errorCode) && onRetry !== undefined && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onRetry}
                data-testid="ingest-error-retry"
              >
                {RETRY_LABEL}
              </Button>
            )}
            {onIngerirOutro !== undefined && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onIngerirOutro}
                data-testid="ingest-error-reset"
              >
                {RESET_LABEL}
              </Button>
            )}
          </div>
        </div>
      )}

      {(phase === "complete" || phase === "node_selected") && summary !== undefined && (
        <div
          className="flex flex-col gap-sm rounded-md bg-surface px-md py-sm"
          data-testid="ingest-progress-summary"
        >
          <p className="text-label font-semibold text-content">{SUMMARY_TITLE}</p>
          <IngestSummary summary={summary} />
          {summary.needs_review > 0 && (
            <div
              className="flex items-start gap-sm rounded-md border border-border bg-elevated px-sm py-xs"
              data-testid="ingest-needs-review-notice"
            >
              <Info className="size-4 shrink-0 text-action" aria-hidden="true" />
              <p className="text-caption text-content">{NEEDS_REVIEW_NOTICE}</p>
            </div>
          )}
          {onIngerirOutro !== undefined && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onIngerirOutro}
                data-testid="ingest-summary-reset"
              >
                {RESET_LABEL}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
