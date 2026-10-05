import type { Pool, PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import type {
  DocumentContext,
  DocumentContextStatus,
  IngestToolName,
  LlmRunStatus,
  LlmRunSummary,
  ValidationOutcome,
} from "../dto/llm-run.dto.js";
import type { LlmRunRow } from "./ingestion.repository.js";

export type { LlmRunRow };

export interface ToolCallRow {
  readonly id: string;
  readonly llm_run_id: string;
  readonly tool_name: IngestToolName;
  readonly arguments: Record<string, unknown>;
  readonly result: Record<string, unknown> | null;
  readonly validation_outcome: ValidationOutcome;
  readonly created_at: Date;
}

export interface RecentIngestionRow {
  readonly raw_information_id: string;
  readonly source_type: string;
  readonly raw_status: string;
  readonly received_at: Date;
  readonly content_preview: string;
  readonly llm_run_id: string | null;
  readonly run_status: LlmRunStatus | null;
  readonly started_at: Date | null;
  readonly finished_at: Date | null;
  readonly prompt_version: string | null;
  readonly model: string | null;
}

export async function findRecentIngestions(
  client: PoolClient,
  limit: number
): Promise<RecentIngestionRow[]> {
  const result = await client.query<RecentIngestionRow>(
    `SELECT ri.id            AS raw_information_id,
            ri.source_type   AS source_type,
            ri.status        AS raw_status,
            ri.received_at   AS received_at,
            left(ri.content, 80) AS content_preview,
            lr.id            AS llm_run_id,
            lr.status        AS run_status,
            lr.started_at    AS started_at,
            lr.finished_at   AS finished_at,
            lr.prompt_version AS prompt_version,
            lr.model         AS model
       FROM raw_information ri
       LEFT JOIN LATERAL (
         SELECT id, status, started_at, finished_at, prompt_version, model
           FROM llm_run
          WHERE input_raw_information_id = ri.id
          ORDER BY started_at DESC
          LIMIT 1
       ) lr ON true
      ORDER BY ri.received_at DESC
      LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function findLlmRunById(
  client: PoolClient,
  id: string
): Promise<LlmRunRow | null> {
  const result = await client.query<LlmRunRow>(
    `SELECT id, model, prompt_version, started_at, finished_at, status,
            attempts, input_raw_information_id, idempotency_key,
            document_context, document_context_status
       FROM llm_run
      WHERE id = $1
      LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function recordDocumentContext(
  client: PoolClient,
  args: { llm_run_id: string; document_context: DocumentContext }
): Promise<LlmRunRow | null> {
  const result = await client.query<LlmRunRow>(
    `UPDATE llm_run
        SET document_context = $2::jsonb
      WHERE id = $1
      RETURNING id, model, prompt_version, started_at, finished_at, status,
                attempts, input_raw_information_id, idempotency_key,
                document_context, document_context_status`,
    [args.llm_run_id, JSON.stringify(args.document_context)]
  );
  return result.rows[0] ?? null;
}

export async function recordDocumentContextStatus(
  client: PoolClient,
  args: {
    llm_run_id: string;
    document_context_status: DocumentContextStatus;
  }
): Promise<LlmRunRow | null> {
  const result = await client.query<LlmRunRow>(
    `UPDATE llm_run
        SET document_context_status = $2::document_context_status
      WHERE id = $1
      RETURNING id, model, prompt_version, started_at, finished_at, status,
                attempts, input_raw_information_id, idempotency_key,
                document_context, document_context_status`,
    [args.llm_run_id, args.document_context_status]
  );
  return result.rows[0] ?? null;
}

export async function aggregateToolCallOutcomes(
  client: PoolClient,
  llmRunId: string
): Promise<LlmRunSummary> {
  const result = await client.query<{
    validation_outcome: ValidationOutcome;
    n: string;
  }>(
    `SELECT validation_outcome, count(*)::text AS n
       FROM tool_call
      WHERE llm_run_id = $1
      GROUP BY validation_outcome`,
    [llmRunId]
  );
  const summary: LlmRunSummary = {
    accepted: 0,
    consolidated: 0,
    superseded_previous: 0,
    needs_review: 0,
    uncertain: 0,
    disputed: 0,
    rejected: 0,
    error: 0,
    orphaned_fragments: 0,
  };
  for (const row of result.rows) {
    summary[row.validation_outcome] = Number.parseInt(row.n, 10);
  }

  const orphan = await client.query<{ n: number }>(
    `SELECT count(*)::int AS n
       FROM information_fragment
      WHERE llm_run_id = $1
        AND status = 'proposed'
        AND id NOT IN (
          SELECT fragment_id FROM provenance WHERE fragment_id IS NOT NULL
        )`,
    [llmRunId]
  );
  summary.orphaned_fragments = orphan.rows[0]?.n ?? 0;

  return summary;
}

export async function retryLlmRunRow(
  client: PoolClient,
  llmRunId: string
): Promise<LlmRunRow | null> {
  const updated = await client.query<LlmRunRow>(
    `UPDATE llm_run
        SET status = 'running',
            attempts = attempts + 1,
            finished_at = NULL
      WHERE id = $1 AND status = 'failed'
      RETURNING id, model, prompt_version, started_at, finished_at, status,
                attempts, input_raw_information_id, idempotency_key,
                document_context, document_context_status`,
    [llmRunId]
  );
  if (updated.rows.length === 0) return null;

  await client.query(
    `UPDATE information_fragment
        SET status = 'rejected'
      WHERE llm_run_id = $1
        AND status = 'proposed'
        AND id NOT IN (
          SELECT fragment_id FROM provenance WHERE fragment_id IS NOT NULL
        )`,
    [llmRunId]
  );

  return updated.rows[0] ?? null;
}

export async function closeLlmRunRow(
  client: PoolClient,
  args: { llm_run_id: string; outcome: "completed" | "failed" }
): Promise<LlmRunRow | null> {
  const result = await client.query<LlmRunRow>(
    `UPDATE llm_run
        SET status = $2::llm_run_status,
            finished_at = now()
      WHERE id = $1 AND status = 'running'
      RETURNING id, model, prompt_version, started_at, finished_at, status,
                attempts, input_raw_information_id, idempotency_key,
                document_context, document_context_status`,
    [args.llm_run_id, args.outcome]
  );
  return result.rows[0] ?? null;
}

export async function countToolCalls(
  client: PoolClient,
  llmRunId: string
): Promise<number> {
  const result = await client.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM tool_call WHERE llm_run_id = $1`,
    [llmRunId]
  );
  return Number.parseInt(result.rows[0]?.n ?? "0", 10);
}

export async function findToolCallsByRun(
  client: PoolClient,
  args: { llm_run_id: string; limit: number; offset: number }
): Promise<ToolCallRow[]> {
  const result = await client.query<ToolCallRow>(
    `SELECT id, llm_run_id, tool_name, arguments, result, validation_outcome, created_at
       FROM tool_call
      WHERE llm_run_id = $1
      ORDER BY created_at ASC, id ASC
      LIMIT $2 OFFSET $3`,
    [args.llm_run_id, args.limit, args.offset]
  );
  return result.rows;
}

export async function insertToolCall(
  client: PoolClient,
  args: {
    llm_run_id: string;
    tool_name: IngestToolName;
    arguments: Record<string, unknown>;
    result: Record<string, unknown> | null;
    validation_outcome: ValidationOutcome;
  }
): Promise<ToolCallRow> {
  const res = await client.query<ToolCallRow>(
    `INSERT INTO tool_call (llm_run_id, tool_name, arguments, result, validation_outcome)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::validation_outcome)
     RETURNING id, llm_run_id, tool_name, arguments, result, validation_outcome, created_at`,
    [
      args.llm_run_id,
      args.tool_name,
      JSON.stringify(args.arguments),
      args.result === null ? null : JSON.stringify(args.result),
      args.validation_outcome,
    ]
  );
  const row = res.rows[0];
  if (row === undefined) {
    throw new InvariantError("insertToolCall: no row returned");
  }
  return row;
}

export async function insertToolCallStandalone(
  pool: Pool,
  args: {
    llm_run_id: string;
    tool_name: IngestToolName;
    arguments: Record<string, unknown>;
    result: Record<string, unknown> | null;
    validation_outcome: ValidationOutcome;
  }
): Promise<ToolCallRow> {
  const client = await pool.connect();
  let discardConnection = false;
  try {
    await client.query("BEGIN");
    const row = await insertToolCall(client, args);
    await client.query("COMMIT");
    return row;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      discardConnection = true;
    }
    throw err;
  } finally {
    client.release(discardConnection);
  }
}

export async function countFragmentsAnchoredToSource(
  client: PoolClient,
  args: {
    fragment_ids: readonly string[];
    expected_raw_information_id: string;
  }
): Promise<number> {
  if (args.fragment_ids.length === 0) return 0;
  const result = await client.query<{ n: string }>(
    `SELECT count(DISTINCT f.id)::text AS n
       FROM information_fragment f
       JOIN fragment_source fs ON fs.fragment_id = f.id
       JOIN raw_chunk rc       ON rc.id = fs.raw_chunk_id
      WHERE f.id = ANY($1::uuid[])
        AND rc.raw_information_id = $2`,
    [args.fragment_ids, args.expected_raw_information_id]
  );
  return Number.parseInt(result.rows[0]?.n ?? "0", 10);
}

export async function countChunksInSource(
  client: PoolClient,
  args: { chunk_ids: readonly string[]; expected_raw_information_id: string }
): Promise<number> {
  if (args.chunk_ids.length === 0) return 0;
  const result = await client.query<{ n: string }>(
    `SELECT count(*)::text AS n
       FROM raw_chunk
      WHERE id = ANY($1::uuid[])
        AND raw_information_id = $2`,
    [args.chunk_ids, args.expected_raw_information_id]
  );
  return Number.parseInt(result.rows[0]?.n ?? "0", 10);
}

export async function insertFragmentWithSources(
  client: PoolClient,
  args: {
    llm_run_id: string;
    text: string;
    confidence: number;
    chunk_ids: readonly string[];
  }
): Promise<{ id: string }> {
  const fragRes = await client.query<{ id: string }>(
    `INSERT INTO information_fragment (llm_run_id, "text", confidence)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [args.llm_run_id, args.text, args.confidence]
  );
  const fragmentId = fragRes.rows[0]?.id;
  if (fragmentId === undefined) {
    throw new InvariantError("insertFragmentWithSources: no fragment id returned");
  }
  await client.query(
    `INSERT INTO fragment_source (fragment_id, raw_chunk_id)
     SELECT $1, c FROM unnest($2::uuid[]) AS c
     ON CONFLICT DO NOTHING`,
    [fragmentId, args.chunk_ids]
  );
  return { id: fragmentId };
}

export async function findNodeTypeIdByNodeId(
  client: PoolClient,
  nodeId: string
): Promise<string | null> {
  const result = await client.query<{ node_type_id: string }>(
    `SELECT node_type_id FROM knowledge_node WHERE id = $1 LIMIT 1`,
    [nodeId]
  );
  return result.rows[0]?.node_type_id ?? null;
}
