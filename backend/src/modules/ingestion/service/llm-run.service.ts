// LLMRun lifecycle service — REST endpoints UC-04, UC-05, UC-06, UC-07.
//
// Layering: route handler opens the transaction and passes `client` here.
// This module is pure transactional orchestration on top of the repository.
//
// Errors:
//   - `ResourceNotFoundError` (re-exported from ingestion.service) -> 404.
//   - `RunNotRetryableError` -> 409 BUSINESS_RUN_NOT_RETRYABLE.

import type { PoolClient } from "pg";

import type {
  LlmRunResponse,
  ListToolCallsResponse,
  ToolCallResponse,
} from "../dto/llm-run.dto.js";
import {
  aggregateToolCallOutcomes,
  closeLlmRunRow,
  countToolCalls,
  findLlmRunById,
  findToolCallsByRun,
  retryLlmRunRow,
  type ToolCallRow,
} from "../repository/llm-run.repository.js";
import type { LlmRunRow } from "../repository/ingestion.repository.js";
import { ResourceNotFoundError } from "./ingestion.service.js";

export { ResourceNotFoundError };

/** 409 sentinel — caller maps to BUSINESS_RUN_NOT_RETRYABLE. */
export class RunNotRetryableError extends Error {
  public readonly statusCode = 409;
  public readonly code = "BUSINESS_RUN_NOT_RETRYABLE" as const;
  public readonly llmRunId: string;
  public readonly currentStatus: "running" | "completed";

  constructor(llmRunId: string, currentStatus: "running" | "completed") {
    super(`LLMRun ${llmRunId} is in status '${currentStatus}' and cannot be retried.`);
    this.name = "RunNotRetryableError";
    this.llmRunId = llmRunId;
    this.currentStatus = currentStatus;
  }
}

/** UC-04: GET /llm-runs/{id}. */
export async function getLlmRunById(
  client: PoolClient,
  llmRunId: string
): Promise<LlmRunResponse> {
  const row = await findLlmRunById(client, llmRunId);
  if (row === null) {
    throw new ResourceNotFoundError("llm_run", llmRunId);
  }
  const summary = await aggregateToolCallOutcomes(client, llmRunId);
  return toLlmRunResponse(row, summary);
}

/** UC-05: GET /llm-runs/{id}/tool-calls. */
export async function listToolCallsByLlmRun(
  client: PoolClient,
  args: { llm_run_id: string; limit: number; offset: number }
): Promise<ListToolCallsResponse> {
  const parent = await findLlmRunById(client, args.llm_run_id);
  if (parent === null) {
    throw new ResourceNotFoundError("llm_run", args.llm_run_id);
  }
  const total = await countToolCalls(client, args.llm_run_id);
  const rows = await findToolCallsByRun(client, args);
  return {
    total,
    limit: args.limit,
    offset: args.offset,
    items: rows.map(toToolCallResponse),
  };
}

/**
 * UC-06: POST /llm-runs/{id}/retry. The order is critical:
 *   1. Pre-read to distinguish "not found" (404) from "wrong status" (409).
 *   2. Atomic `UPDATE ... WHERE status = 'failed'`; rowCount === 0 means the
 *      pre-read showed `failed` but a concurrent transition raced us -> 409.
 *   3. Orphan-fragment cleanup happens inside `retryLlmRunRow` in the same TX.
 */
export async function retryLlmRun(
  client: PoolClient,
  llmRunId: string
): Promise<LlmRunResponse> {
  const existing = await findLlmRunById(client, llmRunId);
  if (existing === null) {
    throw new ResourceNotFoundError("llm_run", llmRunId);
  }
  if (existing.status !== "failed") {
    throw new RunNotRetryableError(llmRunId, existing.status);
  }
  const updated = await retryLlmRunRow(client, llmRunId);
  if (updated === null) {
    // The status flipped between the pre-read and the UPDATE — treat as 409.
    // Re-read the current status to surface the truthful value.
    const refreshed = await findLlmRunById(client, llmRunId);
    const currentStatus = refreshed?.status ?? "running";
    if (currentStatus === "failed") {
      // Should not happen — log internally and surface as 409 conservatively.
      throw new RunNotRetryableError(llmRunId, "running");
    }
    throw new RunNotRetryableError(llmRunId, currentStatus);
  }
  const summary = await aggregateToolCallOutcomes(client, llmRunId);
  return toLlmRunResponse(updated, summary);
}

/**
 * UC-07: internal close path. Used by the LLM orchestrator integration in
 * future TCs; exposed here so the state-machine transition lives in one place.
 */
export async function closeLlmRun(
  client: PoolClient,
  args: { llm_run_id: string; outcome: "completed" | "failed" }
): Promise<LlmRunResponse> {
  const updated = await closeLlmRunRow(client, args);
  if (updated === null) {
    throw new ResourceNotFoundError("llm_run", args.llm_run_id);
  }
  const summary = await aggregateToolCallOutcomes(client, args.llm_run_id);
  return toLlmRunResponse(updated, summary);
}

function toLlmRunResponse(
  row: LlmRunRow,
  summary: LlmRunResponse["summary"]
): LlmRunResponse {
  return {
    id: row.id,
    model: row.model,
    prompt_version: row.prompt_version,
    started_at: row.started_at.toISOString(),
    finished_at: row.finished_at === null ? null : row.finished_at.toISOString(),
    status: row.status,
    attempts: row.attempts,
    input_raw_information_id: row.input_raw_information_id,
    idempotency_key: row.idempotency_key,
    summary,
  };
}

function toToolCallResponse(row: ToolCallRow): ToolCallResponse {
  return {
    id: row.id,
    llm_run_id: row.llm_run_id,
    tool_name: row.tool_name,
    arguments: row.arguments,
    result: row.result,
    validation_outcome: row.validation_outcome,
    created_at: row.created_at.toISOString(),
  };
}
