/**
 * Ingest api — wire types and pure wire→domain transforms.
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §4 (Response transforms
 *    table — `ingestRawInformation` extracts `{ outcome, llm_run_id,
 *    chunk_count, affected_nodes? }`; `getLlmRunById` extracts `{ status,
 *    summary, finished_at }`; both used by the UI).
 *  - docs/specs/domains/ingestion/openapi.yaml — `IngestRawInformationResponse`,
 *    `LlmRun`, `LlmRunSummary`, `LlmRunStatus`, `SourceType`,
 *    `RetryLlmRunRequest`, `RunLlmExtractionRequest`.
 *
 * Design:
 *  - All functions are pure (no React, no fetch). Tested directly in
 *    `__tests__/transforms.spec.ts`.
 *  - Dates are parsed with `new Date(iso)` and validated via `getTime()`
 *    NaN check to fail loudly on malformed wire data.
 *  - The spec's `affected_nodes?` field is NOT in the current
 *    `IngestRawInformationResponse` openapi schema; treated as optional
 *    forward-compat (`undefined` if absent). TC-05 (graph assembly) will
 *    surface this divergence to the spec author if the schema is not
 *    extended by then. Recorded under `spec_divergences` in delivery.md.
 */

/* ------------------------------------------------------------------ *
 * Wire types — verbatim from openapi.yaml (snake_case)                *
 * ------------------------------------------------------------------ */

export type SourceTypeWire =
  | "pdf"
  | "email"
  | "ata"
  | "chat"
  | "artigo"
  | "transcricao"
  | "outro";

/** Alias used by `IngestPanel` / `IngestWorkspace` (TC-05). The wire enum and
 *  the surface enum are identical strings — keep a single source of truth. */
export type IngestSourceType = SourceTypeWire;

export type LlmRunStatusWire = "running" | "completed" | "failed";

export interface ChunkRefWire {
  readonly id: string;
  readonly chunk_index: number;
  readonly offset_start: number;
  readonly offset_end: number;
}

export interface IngestRawInformationRequestWire {
  readonly source_type: SourceTypeWire;
  readonly content: string;
  readonly storage_ref?: string | null;
  readonly metadata?: Record<string, unknown>;
  readonly model: string;
  readonly prompt_version: string;
}

/** Surface alias — TC-02 hooks pass snake_case directly on the wire, so the
 *  surface request is structurally identical. */
export type IngestRawInformationRequest = IngestRawInformationRequestWire;

/** Surface alias — the outcome discriminator on the ingest response. */
export type IngestOutcome = "created" | "noop_existing";

/** Minimal node descriptor for the optional `affected_nodes` field
 *  (spec §4 "Composed models" — used by TC-05 graph assembly). Shape is
 *  forward-declared here; if the BFF starts emitting it, the existing
 *  `node_type` + `canonical_name` fields are the contract. */
export interface AffectedNodeWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
}

export interface IngestRawInformationResponseWire {
  readonly outcome: "created" | "noop_existing";
  readonly raw_information_id: string;
  readonly content_hash: string;
  readonly chunk_count: number;
  readonly chunks: ReadonlyArray<ChunkRefWire>;
  readonly llm_run_id: string;
  readonly idempotency_key: string;
  /** Reserved forward-compat; not yet in openapi.yaml — see header note. */
  readonly affected_nodes?: ReadonlyArray<AffectedNodeWire>;
}

export interface LlmRunSummaryWire {
  readonly accepted: number;
  readonly consolidated: number;
  readonly superseded_previous: number;
  readonly needs_review: number;
  readonly uncertain: number;
  readonly disputed: number;
  readonly rejected: number;
  readonly error: number;
  readonly orphaned_fragments: number;
}

export interface LlmRunWire {
  readonly id: string;
  readonly model: string;
  readonly prompt_version: string;
  readonly started_at: string;
  readonly finished_at: string | null;
  readonly status: LlmRunStatusWire;
  readonly attempts: number;
  readonly input_raw_information_id: string;
  readonly idempotency_key: string;
  readonly summary: LlmRunSummaryWire;
  /** Optional — populated by the BFF once §4 step 4 (graph assembly) is
   *  wired through. Treated as forward-compat by `toLlmRun`. */
  readonly affected_nodes?: ReadonlyArray<AffectedNodeWire>;
}

export interface RetryLlmRunRequestWire {
  readonly reason?: string;
}

/** Empty in v1.0.0 — declared as a type alias so call sites can read the
 *  intent without inventing a fresh `{}` literal. */
export type RunLlmExtractionRequestWire = Record<string, never>;

/* ------------------------------------------------------------------ *
 * Domain types — camelCase, Date objects                              *
 * ------------------------------------------------------------------ */

export interface AffectedNode {
  readonly id: string;
  readonly nodeType: string;
  readonly canonicalName: string;
}

export interface IngestRawInformationResult {
  readonly outcome: "created" | "noop_existing";
  readonly rawInformationId: string;
  readonly contentHash: string;
  readonly chunkCount: number;
  readonly chunks: ReadonlyArray<ChunkRefWire>;
  readonly llmRunId: string;
  readonly idempotencyKey: string;
  /** `undefined` while the BFF does not emit it (spec forward-compat). */
  readonly affectedNodes?: ReadonlyArray<AffectedNode>;
}

export interface LlmRunSummary {
  readonly accepted: number;
  readonly consolidated: number;
  readonly supersededPrevious: number;
  readonly needsReview: number;
  readonly uncertain: number;
  readonly disputed: number;
  readonly rejected: number;
  readonly error: number;
  readonly orphanedFragments: number;
}

export interface LlmRun {
  readonly id: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
  readonly status: LlmRunStatusWire;
  readonly attempts: number;
  readonly inputRawInformationId: string;
  readonly idempotencyKey: string;
  readonly summary: LlmRunSummary;
  /** Optional — surfaced via `toLlmRun` when the BFF includes it. */
  readonly affectedNodes?: ReadonlyArray<AffectedNode>;
}

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

function parseIso(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ISO date string: ${value}`);
  }
  return d;
}

function parseIsoOrNull(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  return parseIso(value);
}

/* ------------------------------------------------------------------ *
 * Transforms                                                          *
 * ------------------------------------------------------------------ */

export function toAffectedNode(wire: AffectedNodeWire): AffectedNode {
  return {
    id: wire.id,
    nodeType: wire.node_type,
    canonicalName: wire.canonical_name,
  };
}

export function toIngestRawInformationResult(
  wire: IngestRawInformationResponseWire,
): IngestRawInformationResult {
  const base: IngestRawInformationResult = {
    outcome: wire.outcome,
    rawInformationId: wire.raw_information_id,
    contentHash: wire.content_hash,
    chunkCount: wire.chunk_count,
    chunks: wire.chunks,
    llmRunId: wire.llm_run_id,
    idempotencyKey: wire.idempotency_key,
  };
  // `exactOptionalPropertyTypes` — only attach the key when the wire
  // carried it. Empty array is a valid signal (no nodes affected); only
  // truly-absent is forwarded as `undefined`.
  if (wire.affected_nodes !== undefined) {
    return { ...base, affectedNodes: wire.affected_nodes.map(toAffectedNode) };
  }
  return base;
}

export function toLlmRunSummary(wire: LlmRunSummaryWire): LlmRunSummary {
  return {
    accepted: wire.accepted,
    consolidated: wire.consolidated,
    supersededPrevious: wire.superseded_previous,
    needsReview: wire.needs_review,
    uncertain: wire.uncertain,
    disputed: wire.disputed,
    rejected: wire.rejected,
    error: wire.error,
    orphanedFragments: wire.orphaned_fragments,
  };
}

export function toLlmRun(wire: LlmRunWire): LlmRun {
  return {
    id: wire.id,
    model: wire.model,
    promptVersion: wire.prompt_version,
    startedAt: parseIso(wire.started_at),
    finishedAt: parseIsoOrNull(wire.finished_at),
    status: wire.status,
    attempts: wire.attempts,
    inputRawInformationId: wire.input_raw_information_id,
    idempotencyKey: wire.idempotency_key,
    summary: toLlmRunSummary(wire.summary),
    ...(wire.affected_nodes !== undefined && {
      affectedNodes: wire.affected_nodes.map(toAffectedNode),
    }),
  };
}
