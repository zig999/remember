/**
 * Ingest api — wire → surface mappers (dev_tc_005).
 *
 * Spec: `ingest.feature.spec.md §4 Response transforms`. Pure functions; no
 * React, no store reads.
 */
import type {
  AffectedNode,
  AffectedNodeWire,
  IngestRawInformationResponse,
  IngestRawInformationResponseWire,
  LlmRun,
  LlmRunSummary,
  LlmRunSummaryWire,
  LlmRunWire,
} from "./types";

function toAffectedNode(wire: AffectedNodeWire): AffectedNode {
  return {
    id: wire.id,
    canonicalName: wire.canonical_name,
    nodeType: wire.node_type,
  };
}

export function toIngestRawInformationResponse(
  wire: IngestRawInformationResponseWire,
): IngestRawInformationResponse {
  const out: {
    outcome: IngestRawInformationResponse["outcome"];
    rawInformationId: string;
    contentHash: string;
    chunkCount: number;
    llmRunId: string;
    idempotencyKey: string;
    affectedNodes?: ReadonlyArray<AffectedNode>;
  } = {
    outcome: wire.outcome,
    rawInformationId: wire.raw_information_id,
    contentHash: wire.content_hash,
    chunkCount: wire.chunk_count,
    llmRunId: wire.llm_run_id,
    idempotencyKey: wire.idempotency_key,
  };
  if (wire.affected_nodes !== undefined) {
    out.affectedNodes = wire.affected_nodes.map(toAffectedNode);
  }
  return out;
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
  const out: {
    id: string;
    model: string;
    promptVersion: string;
    startedAt: string;
    finishedAt: string | null;
    status: LlmRunWire["status"];
    attempts: number;
    inputRawInformationId: string;
    idempotencyKey: string;
    summary: LlmRunSummary;
    affectedNodes?: ReadonlyArray<AffectedNode>;
  } = {
    id: wire.id,
    model: wire.model,
    promptVersion: wire.prompt_version,
    startedAt: wire.started_at,
    finishedAt: wire.finished_at,
    status: wire.status,
    attempts: wire.attempts,
    inputRawInformationId: wire.input_raw_information_id,
    idempotencyKey: wire.idempotency_key,
    summary: toLlmRunSummary(wire.summary),
  };
  if (wire.affected_nodes !== undefined) {
    out.affectedNodes = wire.affected_nodes.map(toAffectedNode);
  }
  return out;
}
