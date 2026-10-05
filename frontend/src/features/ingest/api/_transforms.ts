export type SourceTypeWire =
  | "pdf"
  | "email"
  | "ata"
  | "chat"
  | "artigo"
  | "transcricao"
  | "outro";

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

export type IngestRawInformationRequest = IngestRawInformationRequestWire;

export type IngestOutcome = "created" | "noop_existing";

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
  readonly affected_nodes?: ReadonlyArray<AffectedNodeWire>;
}

export interface RetryLlmRunRequestWire {
  readonly reason?: string;
}

export type RunLlmExtractionRequestWire = Record<string, never>;

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
  readonly affectedNodes?: ReadonlyArray<AffectedNode>;
}

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
