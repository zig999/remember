/**
 * IngestProgressArea — public type contract (TC-04).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 (UI-03, UI-04,
 *    UI-05, UI-06, UI-07), §6 (error-code → UI mapping), §8 (aria-live,
 *    aria-busy, role="alert").
 */
import type { IngestPhase, IngestRunSummary } from "../IngestPanel/IngestPanel.types";

export interface IngestProgressAreaProps {
  /** Current UI phase. Drives copy + visibility + aria-busy. */
  readonly phase: IngestPhase;
  /** Optional progress message override (UI-05 polling fallback). */
  readonly progressMessage?: string;
  /** Summary — required when phase is `complete`. */
  readonly summary?: IngestRunSummary;
  /** Error code (see §6) — required when phase is `error`. */
  readonly errorCode?: string;
  /** UI-04 — "Ver grafo existente" CTA. */
  readonly onVerGrafoExistente?: () => void;
  /** UI-04 / UI-06 / UI-07 — "Ingerir outro documento" reset. */
  readonly onIngerirOutro?: () => void;
  /** UI-06 — "Tentar novamente" retry (only when run is `failed`). */
  readonly onRetry?: () => void;
  /** Optional className merged via `cn()`. */
  readonly className?: string;
}
