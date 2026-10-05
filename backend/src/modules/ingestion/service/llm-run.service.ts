import type { PoolClient } from "pg";

import type {
  LlmRunResponse,
  LlmRunStatus,
  ListToolCallsResponse,
  ToolCallResponse,
} from "../dto/llm-run.dto.js";
import {
  aggregateToolCallOutcomes,
  closeLlmRunRow,
  countToolCalls,
  findLlmRunById,
  findRecentIngestions,
  findToolCallsByRun,
  retryLlmRunRow,
  type ToolCallRow,
} from "../repository/llm-run.repository.js";
import type { LlmRunRow } from "../repository/ingestion.repository.js";
import { ResourceNotFoundError } from "./ingestion.service.js";
import {
  deriveAffectedNodes,
  getCachedAffectedNodes,
  setCachedAffectedNodes,
  type AffectedNode,
} from "./affected-nodes.js";
import { documentContextFields } from "./run-document-context.js";

export { ResourceNotFoundError };

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

export class RunNotRunningError extends Error {
  public readonly statusCode = 409;
  public readonly code = "BUSINESS_RUN_NOT_RUNNING" as const;
  public readonly llmRunId: string;
  public readonly currentStatus: "completed" | "failed";

  constructor(llmRunId: string, currentStatus: "completed" | "failed") {
    super(
      `LLMRun ${llmRunId} is in status '${currentStatus}'; propose-* is only available while the run is 'running'.`
    );
    this.name = "RunNotRunningError";
    this.llmRunId = llmRunId;
    this.currentStatus = currentStatus;
  }
}

export async function getLlmRunById(
  client: PoolClient,
  llmRunId: string
): Promise<LlmRunResponse> {
  const row = await findLlmRunById(client, llmRunId);
  if (row === null) {
    throw new ResourceNotFoundError("llm_run", llmRunId);
  }
  const summary = await aggregateToolCallOutcomes(client, llmRunId);

  let affectedNodes: readonly AffectedNode[] | undefined;
  if (row.status === "completed") {
    const cached = getCachedAffectedNodes(llmRunId);
    if (cached !== undefined) {
      affectedNodes = cached;
    } else {
      try {
        const derived = await deriveAffectedNodes(client, llmRunId);
        setCachedAffectedNodes(llmRunId, derived);
        affectedNodes = derived;
      } catch {
        affectedNodes = undefined;
      }
    }
  }

  return toLlmRunResponse(row, summary, affectedNodes);
}

export interface RecentIngestionItem {
  readonly raw_information_id: string;
  readonly source_type: string;
  readonly raw_status: string;
  readonly received_at: string;
  readonly content_preview: string;
  readonly llm_run_id: string | null;
  readonly run_status: LlmRunStatus | null;
  readonly started_at: string | null;
  readonly finished_at: string | null;
  readonly prompt_version: string | null;
  readonly model: string | null;
}

export async function listRecentIngestions(
  client: PoolClient,
  limit: number
): Promise<RecentIngestionItem[]> {
  const rows = await findRecentIngestions(client, limit);
  return rows.map((r) => ({
    raw_information_id: r.raw_information_id,
    source_type: r.source_type,
    raw_status: r.raw_status,
    received_at: r.received_at.toISOString(),
    content_preview: r.content_preview,
    llm_run_id: r.llm_run_id,
    run_status: r.run_status,
    started_at: r.started_at === null ? null : r.started_at.toISOString(),
    finished_at: r.finished_at === null ? null : r.finished_at.toISOString(),
    prompt_version: r.prompt_version,
    model: r.model,
  }));
}

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
    const refreshed = await findLlmRunById(client, llmRunId);
    const currentStatus = refreshed?.status ?? "running";
    if (currentStatus === "failed") {
      throw new RunNotRetryableError(llmRunId, "running");
    }
    throw new RunNotRetryableError(llmRunId, currentStatus);
  }
  const summary = await aggregateToolCallOutcomes(client, llmRunId);
  return toLlmRunResponse(updated, summary);
}

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
  summary: LlmRunResponse["summary"],
  affectedNodes?: readonly AffectedNode[]
): LlmRunResponse {
  const base: LlmRunResponse = {
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
    ...documentContextFields(row),
  };
  if (affectedNodes !== undefined) {
    return { ...base, affected_nodes: [...affectedNodes] };
  }
  return base;
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
