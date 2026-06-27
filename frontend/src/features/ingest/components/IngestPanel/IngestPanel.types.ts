/**
 * IngestPanel — public type contract (TC-04).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §2 (UI states UI-01..UI-09),
 *    §5 (Input validations / ingestFormSchema), §7 (Component adapters),
 *    §10 (Components to create).
 *
 * The IngestPanel is the left-column container of `/ingest`. It owns the form
 * (RHF v7 + Zod v4) but does NOT own the mutations — the parent
 * (`IngestWorkspace`, TC-05) owns the network layer and drives `phase` /
 * `progressMessage` / `summary` / `errorCode` via props.
 */
import type { CSSProperties } from "react";

/**
 * Source-type enum (matches `ingestFormSchema` in §5).
 * Backend accepts these snake_case values; UI maps to pt-BR labels (see
 * `SOURCE_TYPE_LABELS` in IngestPanel.tsx).
 */
export type IngestSourceType =
  | "pdf"
  | "email"
  | "ata"
  | "chat"
  | "artigo"
  | "transcricao"
  | "outro";

/**
 * IngestPanel phase — drives UI states UI-01..UI-09 (excluding UI-09 which
 * is owned by the parent IngestWorkspace, since it swaps right-column panes).
 *  - `idle`         — UI-01 (empty form, button disabled).
 *  - `ready`        — UI-02 (both fields filled, button enabled).
 *  - `sending`      — UI-03 (POST ingestRawInformation in flight).
 *  - `noop`         — UI-04 (idempotency noop_existing — already ingested).
 *  - `extracting`   — UI-05 (runLlmExtraction blocking + polling).
 *  - `revealing`    — UI-08 (graph revealing 1-by-1).
 *  - `complete`     — UI-07 (extraction done — summary visible).
 *  - `error`        — UI-06 (error band, retry/restart available).
 *  - `node_selected`— UI-09 (right column shows NodeDetailPanel; panel itself
 *                    is unaffected, but parent may want to pass this so the
 *                    panel can stay frozen in its prior visual state).
 */
export type IngestPhase =
  | "idle"
  | "ready"
  | "sending"
  | "noop"
  | "extracting"
  | "revealing"
  | "complete"
  | "error"
  | "node_selected";

/**
 * Subset of `LlmRunSummary` rendered by IngestSummary (UI-07). The 7 outcome
 * keys mirror spec §2 UI-07. `superseded_previous` and `orphaned_fragments`
 * exist in the wire schema but are intentionally omitted from this display
 * (out of scope v1).
 */
export interface IngestRunSummary {
  readonly accepted: number;
  readonly consolidated: number;
  readonly needs_review: number;
  readonly uncertain: number;
  readonly disputed: number;
  readonly rejected: number;
  readonly error: number;
}

export interface IngestSubmitPayload {
  readonly content: string;
  readonly source_type: IngestSourceType;
}

export interface IngestPanelProps {
  /**
   * Current UI phase — see `IngestPhase`. The parent
   * (`IngestWorkspace`, TC-05) maps mutation/query state to one of these.
   */
  readonly phase: IngestPhase;

  /**
   * Optional progress message override. Used by the polling-fallback case
   * (UI-05 — switch from "Extraindo conhecimento…" to "Verificando
   * extração…" when the client connection drops). When omitted, the panel
   * uses the canonical per-phase message.
   */
  readonly progressMessage?: string;

  /**
   * Extraction summary — required when phase is `complete`. Ignored in other
   * phases (the panel renders the progress copy / error band instead).
   */
  readonly summary?: IngestRunSummary;

  /**
   * Error code from the §6 mapping table — required when phase is `error`.
   * The panel resolves it to the pt-BR message via the local error map.
   */
  readonly errorCode?: string;

  /**
   * Invoked when the user clicks "Ingerir". Parent owns the mutation; this
   * panel only validates the form (Zod) and emits the payload on success.
   */
  readonly onSubmit: (payload: IngestSubmitPayload) => void;

  /**
   * Invoked when the user clicks "Ver grafo existente" in UI-04. Parent fires
   * the traverse-assembly with the already-known `affected_nodes` from the
   * `noop_existing` response.
   */
  readonly onVerGrafoExistente?: () => void;

  /**
   * Invoked when the user clicks "Ingerir outro documento" — reset form to
   * UI-01 and clear the graph. Available in UI-04, UI-06, UI-07.
   */
  readonly onIngerirOutro?: () => void;

  /**
   * Invoked when the user clicks "Tentar novamente" in UI-06 (only when the
   * run is `failed` — the parent decides whether to expose it based on the
   * error code).
   */
  readonly onRetry?: () => void;

  /**
   * Optional className merged onto the root GlassSurface via `cn()`.
   */
  readonly className?: string;

  /** Optional inline style passthrough for parent layout positioning. */
  readonly style?: CSSProperties;
}
