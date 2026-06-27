// Ingestion repository — parameterized SQL only (CLAUDE.md "Security").
//
// Owns the three tables this Task Contract writes:
//   - `raw_information` (INSERT, SELECT by id, SELECT by content_hash)
//   - `raw_chunk`       (bulk INSERT, SELECT by raw_information_id)
//   - `llm_run`         (INSERT, SELECT by idempotency_key, SELECT by id)
//
// Every method receives a `PoolClient` (live connection), never a `Pool`. The
// service layer is responsible for `BEGIN` / `COMMIT` / `ROLLBACK` and for
// returning the client to the pool — the repository never opens transactions
// of its own. This keeps BR-19 (one transaction per route) honest.
//
// String concatenation of SQL is forbidden by CLAUDE.md "Security". Every
// query below uses positional placeholders (`$1`, `$2`, ...).

import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import type { RawChunkInput } from "../chunker/v1.js";
import type { SourceType } from "../dto/source-type.js";
import type {
  ChunkLocator,
  RawChunkResponse,
  RawInformationResponse,
} from "../dto/raw-information.dto.js";

/** Constraint name used by the DB to enforce the content_hash uniqueness. */
export const RAW_INFORMATION_CONTENT_HASH_CONSTRAINT =
  "raw_information_content_hash_key" as const;

/** Constraint name used by the DB to enforce the llm_run idempotency_key uniqueness. */
export const LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT =
  "llm_run_idempotency_key_key" as const;

/** Shape returned by `INSERT INTO raw_information ... RETURNING *`. */
export interface RawInformationRow {
  readonly id: string;
  readonly source_type: SourceType;
  readonly content: string;
  readonly storage_ref: string | null;
  readonly content_hash: string;
  readonly received_at: Date;
  readonly metadata: Record<string, unknown>;
  /**
   * Verbatim user turn that triggered a chat-directed ingestion (TC-01 /
   * BR-34). `null` for every non-chat path (REST, MCP direct, document
   * ingestion). NEVER participates in `content_hash`. Covered by §11
   * `compliance_delete`.
   */
  readonly original_input: string | null;
}

/** Shape returned by `INSERT INTO raw_chunk ... RETURNING *`. */
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

/** Shape returned by `INSERT INTO llm_run ... RETURNING *`. */
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
}

/**
 * Insert a new `raw_information` row. The DB enforces the `content_hash`
 * format check and the UNIQUE constraint; the caller catches SQLSTATE 23505
 * on the unique-violation path (BR-09).
 */
export async function insertRawInformation(
  client: PoolClient,
  args: {
    source_type: SourceType;
    content: string;
    content_hash: string;
    metadata: Record<string, unknown>;
    /**
     * Optional verbatim user turn (TC-01 / BR-34). Omitted / `undefined` /
     * explicit `null` ALL persist as SQL NULL — the column has no default.
     * Never mixed into `content_hash` (the caller computes that over
     * `content` only).
     */
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
    // Programming error — the INSERT either succeeds or throws.
    throw new InvariantError("insertRawInformation: no row returned");
  }
  return row;
}

/** Look up an existing `raw_information` row by its `content_hash`. */
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

/** Look up a `raw_information` row by id. Returns `null` when missing. */
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

/**
 * Bulk-insert chunks for a `raw_information_id`. Uses `unnest(...)` so the
 * statement size is independent of N — one round trip, parameterized arrays.
 *
 * Returns the inserted rows ordered by `chunk_index` ascending. That ordering
 * is the contract of the calling route (the response chunk array is sorted).
 */
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

/**
 * Find every `raw_chunk` of the given `raw_information_id`, ordered by
 * `chunk_index` ascending. Used by GET .../chunks.
 */
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

/**
 * Insert a new `llm_run` row. Default `status = 'running'`, `attempts = 1`,
 * `finished_at = NULL` (DB defaults).
 */
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
               attempts, input_raw_information_id, idempotency_key`,
    [args.model, args.prompt_version, args.input_raw_information_id, args.idempotency_key]
  );
  const row = result.rows[0];
  if (row === undefined) {
    throw new InvariantError("insertLlmRun: no row returned");
  }
  return row;
}

/** Look up an existing `llm_run` row by its `idempotency_key`. */
export async function findLlmRunByIdempotencyKey(
  client: PoolClient,
  idempotencyKey: string
): Promise<LlmRunRow | null> {
  const result = await client.query<LlmRunRow>(
    `SELECT id, model, prompt_version, started_at, finished_at, status,
            attempts, input_raw_information_id, idempotency_key
       FROM llm_run
      WHERE idempotency_key = $1
      LIMIT 1`,
    [idempotencyKey]
  );
  return result.rows[0] ?? null;
}

/**
 * Map a `raw_information` DB row to the API response shape. Pure conversion:
 * the only adjustments are turning `Date` into ISO 8601 with offset and
 * surfacing the `metadata` jsonb as a plain object (pg returns it as such).
 */
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

/** Map a `raw_chunk` DB row to the API response shape. */
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
