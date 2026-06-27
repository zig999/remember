/**
 * IngestPanel — left column of `/ingest` (dev_tc_005).
 *
 * Pure-controlled, presentational component. The state machine
 * (idle → sending → extracting → polling → complete | error | noop) lives in
 * `IngestWorkspace`; this panel just renders the current view and raises the
 * callback the user clicked.
 *
 * Form structure (`ingest.feature.spec.md §2`):
 *  - `<textarea>` (content) + `<select>` (source_type) + `<button>` (Ingerir)
 *  - progress / summary / error region (`aria-live="polite"`, `role="alert"`
 *    on error band)
 *
 * Accessibility (`ingest.feature.spec.md §8`):
 *  - `<label htmlFor>` for both inputs (visible labels)
 *  - `aria-busy="true"` on the progress region while sending/extracting
 *  - `role="alert"` on the error band
 *  - `aria-disabled` reflects `disabled`
 *  - All form controls disabled while the run is in flight
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { IngestSourceType } from "../../api";
import type { IngestPanelProps } from "./IngestPanel.types";
import { IngestSummary } from "./IngestSummary";
import { IngestErrorBand } from "./_IngestErrorBand";
import { IngestNoopNotice } from "./_IngestNoopNotice";

const SOURCE_TYPE_OPTIONS: ReadonlyArray<{
  readonly value: IngestSourceType;
  readonly label: string;
}> = [
  { value: "pdf", label: "PDF" },
  { value: "email", label: "E-mail" },
  { value: "ata", label: "Ata" },
  { value: "chat", label: "Chat" },
  { value: "artigo", label: "Artigo" },
  { value: "transcricao", label: "Transcrição" },
  { value: "outro", label: "Outro" },
];

/** Codes that map to "retryable" errors — show the "Tentar novamente" CTA. */
const RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  "SYSTEM_LLM_PROVIDER_UNAVAILABLE",
  "SYSTEM_INTERNAL_ERROR",
  "SYSTEM_UPSTREAM",
  "SYSTEM_TIMEOUT",
  "SYSTEM_NETWORK",
  // The polling loop ends in `status: 'failed'` — caller surfaces this as
  // `RUN_FAILED` (synthetic, not in the openapi). Treat it as retryable.
  "RUN_FAILED",
]);

function isInputDisabled(phase: IngestPanelProps["phase"]): boolean {
  switch (phase) {
    case "sending":
    case "extracting":
    case "polling":
    case "revealing":
    case "complete":
    case "noop":
      return true;
    default:
      return false;
  }
}

function isProgressBusy(phase: IngestPanelProps["phase"]): boolean {
  return phase === "sending" || phase === "extracting" || phase === "polling";
}

function progressCopy(phase: IngestPanelProps["phase"]): string | null {
  switch (phase) {
    case "sending":
      return "Enviando documento…";
    case "extracting":
      return "Extraindo conhecimento… (pode levar alguns minutos)";
    case "polling":
      return "Verificando extração…";
    case "revealing":
      return "Compondo o grafo…";
    default:
      return null;
  }
}

export const IngestPanel: FC<IngestPanelProps> = ({
  phase,
  content,
  sourceType,
  validationMessage,
  summary,
  errorMessage,
  errorCode,
  onContentChange,
  onSourceTypeChange,
  onSubmit,
  onAssembleExisting,
  onRetry,
  onReset,
  className,
}) => {
  const disabled = isInputDisabled(phase);
  const isReadyPhase: boolean = phase === "ready";
  const isSendingPhase: boolean = phase === "sending";
  const canSubmit = isReadyPhase && content.length >= 1 && sourceType !== "";
  const showSubmit = phase === "idle" || isReadyPhase || isSendingPhase;
  const isRetryable = errorCode !== undefined && RETRYABLE_ERROR_CODES.has(errorCode);
  const showSummary =
    summary !== undefined && (phase === "complete" || phase === "revealing");
  const showNoopNotice = phase === "noop";
  const showError = phase === "error";
  const progress = progressCopy(phase);

  return (
    <section
      data-testid="ingest-panel"
      aria-label="Ingestão de documento"
      className={cn(
        "flex h-full flex-col gap-lg p-lg",
        "bg-surface-glass-ambient",
        className,
      )}
    >
      <header className="flex flex-col gap-xs">
        <h2 className="text-heading text-content">Ingerir documento</h2>
        <p className="text-body-sm text-muted">
          Cole o texto ou arraste um arquivo .txt para extrair conhecimento
          estruturado.
        </p>
      </header>

      <form
        className="flex flex-1 flex-col gap-md"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
        data-testid="ingest-form"
      >
        <div className="flex flex-col gap-xs">
          <label
            htmlFor="ingest-content"
            className="text-label text-content"
          >
            Conteúdo do documento
          </label>
          <textarea
            id="ingest-content"
            data-testid="ingest-content"
            className={cn(
              "min-h-32 flex-1 rounded-md border border-border bg-surface p-md text-body-sm text-content",
              "focus:border-border-focus focus:outline-none",
            )}
            placeholder="Cole aqui o conteúdo do documento…"
            value={content}
            disabled={disabled}
            aria-label="Conteúdo do documento"
            aria-invalid={
              validationMessage !== undefined && validationMessage.length > 0
            }
            onChange={(e) => onContentChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-xs">
          <label
            htmlFor="ingest-source-type"
            className="text-label text-content"
          >
            Tipo de fonte
          </label>
          <select
            id="ingest-source-type"
            data-testid="ingest-source-type"
            className={cn(
              "rounded-md border border-border bg-surface p-md text-body-sm text-content",
              "focus:border-border-focus focus:outline-none",
            )}
            value={sourceType}
            disabled={disabled}
            aria-label="Tipo de fonte"
            aria-invalid={
              validationMessage !== undefined && validationMessage.length > 0
            }
            onChange={(e) =>
              onSourceTypeChange(e.target.value as IngestSourceType | "")
            }
          >
            <option value="">Selecione o tipo…</option>
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {validationMessage !== undefined && validationMessage.length > 0 ? (
          <p
            data-testid="ingest-validation"
            className="text-body-sm text-state-disputed"
          >
            {validationMessage}
          </p>
        ) : null}

        {showSubmit ? (
          <button
            type="submit"
            data-testid="ingest-submit"
            disabled={!canSubmit || isSendingPhase}
            aria-disabled={!canSubmit || isSendingPhase}
            aria-label={isSendingPhase ? "Ingerindo…" : "Ingerir"}
            className={cn(
              "self-start rounded-md bg-action px-lg py-md text-label text-content-inverse",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "hover:bg-action-hover focus:outline-none focus:bg-action-active",
            )}
          >
            {isSendingPhase ? "Enviando…" : "Ingerir"}
          </button>
        ) : null}
      </form>

      <div
        data-testid="ingest-progress"
        role="region"
        aria-label="Progresso da ingestão"
        aria-live="polite"
        aria-busy={isProgressBusy(phase)}
        className="flex flex-col gap-md"
      >
        {progress !== null ? (
          <p
            data-testid="ingest-progress-copy"
            className="text-body-sm text-content"
          >
            {progress}
          </p>
        ) : null}

        {showNoopNotice ? (
          <IngestNoopNotice
            onAssembleExisting={onAssembleExisting}
            onReset={onReset}
          />
        ) : null}

        {showError ? (
          <IngestErrorBand
            errorMessage={errorMessage}
            isRetryable={isRetryable}
            onRetry={onRetry}
            onReset={onReset}
          />
        ) : null}

        {showSummary && summary !== undefined ? (
          <div
            data-testid="ingest-complete"
            className="flex flex-col gap-sm rounded-md border border-border-glass p-md"
          >
            <p className="text-label text-content">Extração concluída</p>
            <IngestSummary summary={summary} />
            {summary.needsReview > 0 ? (
              <p
                data-testid="ingest-needs-review-notice"
                className="text-body-sm text-state-uncertain"
              >
                Alguns nós aguardam revisão. Acesse Curadoria para detalhes.
              </p>
            ) : null}
            <button
              type="button"
              data-testid="ingest-reset"
              onClick={onReset}
              className="self-start text-body-sm text-action underline"
            >
              Ingerir outro documento
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};
