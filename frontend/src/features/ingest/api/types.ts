/**
 * Ingest api — wire + surface types (dev_tc_005).
 *
 * Mirrors `docs/specs/domains/ingestion/openapi.yaml`:
 *  - `IngestRawInformationRequest` / `IngestRawInformationResponse`
 *  - `LlmRun` (returned by `runLlmExtraction`, `getLlmRunById`, `retryLlmRun`)
 *  - `LlmRunSummary`
 *
 * The `affected_nodes` field on the ingest response is not yet in the formal
 * OpenAPI schema (the spec's §4 step 4 describes it as the array consumed by
 * the graph-assembly step). The dev_tc_005 task contract embeds it explicitly
 * — we accept it as an optional surface field so the BFF can land it
 * additively without re-baselining the SDK types.
 */

/** Wire `source_type` enum. */
export type IngestSourceType =
  | "pdf"
  | "email"
  | "ata"
  | "chat"
  | "artigo"
  | "transcricao"
  | "outro";

/** Idempotency outcome (openapi `IngestOutcome`). */
export type IngestOutcome = "created" | "noop_existing";

/** LLMRun terminal status (openapi `LlmRunStatus`). */
export type LlmRunStatus = "running" | "completed" | "failed";

/** A single affected-node hint returned alongside the ingest response.
 *  Snake_case on the wire — used by `useIngestGraphAssembly` to fan out
 *  parallel traverse calls. */
export interface AffectedNodeWire {
  readonly id: string;
  readonly canonical_name: string;
  readonly node_type: string;
}

export interface AffectedNode {
  readonly id: string;
  readonly canonicalName: string;
  readonly nodeType: string;
}

/** Request body for `POST /api/v1/ingest/raw-information`. */
export interface IngestRawInformationRequest {
  readonly source_type: IngestSourceType;
  readonly content: string;
  /** Optional metadata bag — out of scope for v1 of the UI, present for
   *  forward-compat. */
  readonly metadata?: Record<string, unknown>;
  /** LLM model identifier — v1 UI always sends `"claude-opus-4-8"`. */
  readonly model: string;
  /** Prompt registry key — v1 UI always sends `"v3"`. */
  readonly prompt_version: string;
}

/** Wire response for `POST /api/v1/ingest/raw-information`. */
export interface IngestRawInformationResponseWire {
  readonly outcome: IngestOutcome;
  readonly raw_information_id: string;
  readonly content_hash: string;
  readonly chunk_count: number;
  readonly llm_run_id: string;
  readonly idempotency_key: string;
  /** Forward-compat: list of nodes affected by an existing run (only present
   *  on `noop_existing` where the prior extraction has already completed). */
  readonly affected_nodes?: ReadonlyArray<AffectedNodeWire>;
}

export interface IngestRawInformationResponse {
  readonly outcome: IngestOutcome;
  readonly rawInformationId: string;
  readonly contentHash: string;
  readonly chunkCount: number;
  readonly llmRunId: string;
  readonly idempotencyKey: string;
  readonly affectedNodes?: ReadonlyArray<AffectedNode>;
}

/** LlmRunSummary (wire) — counts per validation outcome. */
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

/** Wire shape for `LlmRun`. */
export interface LlmRunWire {
  readonly id: string;
  readonly model: string;
  readonly prompt_version: string;
  readonly started_at: string;
  readonly finished_at: string | null;
  readonly status: LlmRunStatus;
  readonly attempts: number;
  readonly input_raw_information_id: string;
  readonly idempotency_key: string;
  readonly summary: LlmRunSummaryWire;
  /** Forward-compat: optional affected-nodes list returned on terminal status. */
  readonly affected_nodes?: ReadonlyArray<AffectedNodeWire>;
}

export interface LlmRun {
  readonly id: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly status: LlmRunStatus;
  readonly attempts: number;
  readonly inputRawInformationId: string;
  readonly idempotencyKey: string;
  readonly summary: LlmRunSummary;
  readonly affectedNodes?: ReadonlyArray<AffectedNode>;
}
