import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import type { RawChunkInput } from "../chunker/v1.js";
import type {
  DocumentContext,
  DocumentContextStatus,
} from "../dto/llm-run.dto.js";
import type { SourceType } from "../dto/source-type.js";
import type {
  ChunkLocator,
  RawChunkResponse,
  RawInformationResponse,
} from "../dto/raw-information.dto.js";

export const RAW_INFORMATION_CONTENT_HASH_CONSTRAINT =
  "raw_information_content_hash_key" as const;

export const LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT =
  "llm_run_idempotency_key_key" as const;

export interface RawInformationRow {
  readonly id: string;
  readonly source_type: SourceType;
  readonly content: string;
  readonly storage_ref: string | null;
  readonly content_hash: string;
  readonly received_at: Date;
  readonly metadata: Record<string, unknown>;
  readonly original_input: string | null;
}

export interface RawChunkRow {
  readonly id: string;
  readonly raw_information_id: string;
  readonly chunk_index: number;
  readonly text: string;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly locator: ChunkLocator;
  readonly chunking_version: string;
}

export interface LlmRunRow {
  readonly id: string;
  readonly model: string;
  readonly prompt_version: string;
  readonly started_at: Date;
  readonly finished_at: Date | null;
  readonly status: "running" | "completed" | "failed";
  readonly attempts: number;
  readonly input_raw_information_id: string;
  readonly idempotency_key: string;
  readonly document_context: DocumentContext | null;
  readonly document_context_status: DocumentContextStatus | null;
}

export async function insertRawInformation(
  client: PoolClient,
  args: {
    source_type: SourceType;
    content: string;
    content_hash: string;
    metadata: Record<string, unknown>;
    original_input?: string | null;
  }
): Promise<RawInformationRow> {
  const result = await client.query<RawInformationRow>(
    `INSERT INTO raw_information (source_type, content, content_hash, metadata, original_input)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     RETURNING id, source_type, content, storage_ref, content_hash, received_at, metadata, original_input`,
    [
      args.source_type,
      args.content,
      args.content_hash,
      JSON.stringify(args.metadata),
      args.original_input ?? null,
    ]
  );
  const row = result.rows[0];
  if (row === undefined) {
    throw new InvariantError("insertRawInformation: no row returned");
  }
  return row;
}

export async function findRawInformationByHash(
  client: PoolClient,
  contentHash: string
): Promise<RawInformationRow | null> {
  const result = await client.query<RawInformationRow>(
    `SELECT id, source_type, content, storage_ref, content_hash, received_at, metadata, original_input
       FROM raw_information
      WHERE content_hash = $1
      LIMIT 1`,
    [contentHash]
  );
  return result.rows[0] ?? null;
}

export async function findRawInformationById(
  client: PoolClient,
  id: string
): Promise<RawInformationRow | null> {
  const result = await client.query<RawInformationRow>(
    `SELECT id, source_type, content, storage_ref, content_hash, received_at, metadata, original_input
       FROM raw_information
      WHERE id = $1
      LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function insertRawChunks(
  client: PoolClient,
  rawInformationId: string,
  chunks: readonly RawChunkInput[]
): Promise<RawChunkRow[]> {
  if (chunks.length === 0) return [];
  const indices = chunks.map((c) => c.chunk_index);
  const texts = chunks.map((c) => c.text);
  const starts = chunks.map((c) => c.offset_start);
  const ends = chunks.map((c) => c.offset_end);
  const versions = chunks.map((c) => c.chunking_version);

  const result = await client.query<RawChunkRow>(
    `INSERT INTO raw_chunk
       (raw_information_id, chunk_index, "text", offset_start, offset_end, chunking_version)
     SELECT $1, ci.chunk_index, ci.text, ci.offset_start, ci.offset_end, ci.chunking_version
       FROM unnest($2::int[],   $3::text[], $4::int[], $5::int[], $6::text[])
         AS ci(chunk_index, text, offset_start, offset_end, chunking_version)
     RETURNING id, raw_information_id, chunk_index, "text", offset_start, offset_end,
               locator, chunking_version`,
    [rawInformationId, indices, texts, starts, ends, versions]
  );
  return result.rows.sort((a, b) => a.chunk_index - b.chunk_index);
}

export async function findChunksByRawInformationId(
  client: PoolClient,
  rawInformationId: string
): Promise<RawChunkRow[]> {
  const result = await client.query<RawChunkRow>(
    `SELECT id, raw_information_id, chunk_index, "text", offset_start, offset_end,
            locator, chunking_version
       FROM raw_chunk
      WHERE raw_information_id = $1
      ORDER BY chunk_index ASC`,
    [rawInformationId]
  );
  return result.rows;
}

export async function insertLlmRun(
  client: PoolClient,
  args: {
    model: string;
    prompt_version: string;
    input_raw_information_id: string;
    idempotency_key: string;
  }
): Promise<LlmRunRow> {
  const result = await client.query<LlmRunRow>(
    `INSERT INTO llm_run (model, prompt_version, input_raw_information_id, idempotency_key)
     VALUES ($1, $2, $3, $4)
     RETURNING id, model, prompt_version, started_at, finished_at, status,
               attempts, input_raw_information_id, idempotency_key,
               document_context, document_context_status`,
    [args.model, args.prompt_version, args.input_raw_information_id, args.idempotency_key]
  );
  const row = result.rows[0];
  if (row === undefined) {
    throw new InvariantError("insertLlmRun: no row returned");
  }
  return row;
}

export async function findLlmRunByIdempotencyKey(
  client: PoolClient,
  idempotencyKey: string
): Promise<LlmRunRow | null> {
  const result = await client.query<LlmRunRow>(
    `SELECT id, model, prompt_version, started_at, finished_at, status,
            attempts, input_raw_information_id, idempotency_key,
            document_context, document_context_status
       FROM llm_run
      WHERE idempotency_key = $1
      LIMIT 1`,
    [idempotencyKey]
  );
  return result.rows[0] ?? null;
}

export function toRawInformationResponse(
  row: RawInformationRow
): RawInformationResponse {
  return {
    id: row.id,
    source_type: row.source_type,
    content: row.content,
    storage_ref: row.storage_ref,
    content_hash: row.content_hash,
    received_at: row.received_at.toISOString(),
    metadata: row.metadata ?? {},
  };
}

export function toRawChunkResponse(row: RawChunkRow): RawChunkResponse {
  return {
    id: row.id,
    raw_information_id: row.raw_information_id,
    chunk_index: row.chunk_index,
    text: row.text,
    offset_start: row.offset_start,
    offset_end: row.offset_end,
    locator: row.locator ?? null,
    chunking_version: row.chunking_version,
  };
}
