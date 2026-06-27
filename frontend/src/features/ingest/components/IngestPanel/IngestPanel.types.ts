/**
 * IngestPanel — public type contract (dev_tc_005).
 *
 * The left column of `IngestWorkspace`. The workspace owns the orchestration
 * state machine and passes the panel pure props: current form values, the
 * current UI phase, an optional summary (for UI-07), an optional error
 * message + code (for UI-06), and the four callbacks the panel raises
 * (submit, retry, reset, idempotency-CTA).
 *
 * Single-use, feature-local — does not qualify for a global
 * `component.spec.md` (spec §10 note).
 */
import type { IngestSourceType, LlmRunSummary } from "../../api";

/** UI phases driven by `IngestWorkspace`. Mirrors `ingest.feature.spec.md
 *  §2` UI-01..UI-08; UI-09 (node-selected) is invisible to the panel — it
 *  affects only the right column. */
export type IngestPhase =
  | "idle" // UI-01 — empty form
  | "ready" // UI-02 — content + source_type filled, button enabled
  | "sending" // UI-03 — POST ingestRawInformation in flight
  | "noop" // UI-04 — idempotent reuse, awaiting "Ver grafo existente"
  | "extracting" // UI-05 — runLlmExtraction (or polling) in flight
  | "polling" // UI-05 (polling sub-state) — connection drop fallback
  | "revealing" // UI-08 — graph animating in (summary already shown)
  | "complete" // UI-07 — extraction done, summary visible
  | "error"; // UI-06 — error band

export interface IngestPanelProps {
  /** Current UI phase — drives which subview is rendered. */
  readonly phase: IngestPhase;
  /** Current textarea content. Controlled. */
  readonly content: string;
  /** Current source-type selection. Empty string = unselected. */
  readonly sourceType: IngestSourceType | "";
  /** Inline form validation message (Zod / submit guard). */
  readonly validationMessage?: string;
  /** Optional summary — shown in UI-07/UI-08. */
  readonly summary?: LlmRunSummary;
  /** Optional error message — shown in UI-06. */
  readonly errorMessage?: string;
  /** Optional error code — used by the panel to gate the "Tentar novamente"
   *  CTA (only for retryable codes). */
  readonly errorCode?: string;

  /** Raised on textarea change. */
  readonly onContentChange: (content: string) => void;
  /** Raised on source-type change. */
  readonly onSourceTypeChange: (sourceType: IngestSourceType | "") => void;
  /** Raised on "Ingerir" click — passes through. */
  readonly onSubmit: () => void;
  /** Raised on "Ver grafo existente" click in UI-04. */
  readonly onAssembleExisting: () => void;
  /** Raised on "Tentar novamente" click in UI-06. */
  readonly onRetry: () => void;
  /** Raised on "Ingerir outro documento" click in UI-04, UI-06, UI-07. */
  readonly onReset: () => void;
  /** Additional Tailwind classes — merged via `cn()`. */
  readonly className?: string;
}
