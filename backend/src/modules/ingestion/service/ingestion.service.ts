// Ingestion service — orchestrates the `ingestRawInformation` happy path and
// the idempotent no-op path (BR-01, BR-08, BR-09).
//
// Layering (CLAUDE.md "Architecture / Backend"):
//
//   route handler  (opens TX, hands `client` here)
//        v
//   service  (this file — runs business logic and SQL via the repository)
//        v
//   repository  (parameterized pg queries)
//
// The service NEVER calls `pool.connect()` / `BEGIN`; that is the route's job
// (BR-19). Each method receives an already-open `PoolClient` and the caller
// is responsible for `COMMIT`/`ROLLBACK`.
//
// `compliance_delete` (§11) is the only writer permitted to mutate
// `raw_information` rows post-creation. This module exposes no UPDATE path —
// BR-02 is enforced by the absence of code.

import type { PoolClient } from "pg";

import { CHUNKING_VERSION } from "../chunker/config.js";
import { chunkV1 } from "../chunker/v1.js";
import {
  type IngestRawInformationRequest,
  type IngestRawInformationResponse,
} from "../dto/ingest-raw-information.dto.js";
import {
  type ListRawChunksResponse,
  type RawInformationResponse,
} from "../dto/raw-information.dto.js";
import { composeIdempotencyKey, sha256Hex } from "../hash.js";
import {
  findChunksByRawInformationId,
  findLlmRunByIdempotencyKey,
  findRawInformationByHash,
  findRawInformationById,
  insertLlmRun,
  insertRawChunks,
  insertRawInformation,
  LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT,
  RAW_INFORMATION_CONTENT_HASH_CONSTRAINT,
  toRawChunkResponse,
  toRawInformationResponse,
} from "../repository/ingestion.repository.js";

/**
 * Sentinel error meaning "the requested entity does not exist". Route layer
 * translates this to 404 + `RESOURCE_NOT_FOUND`. We use a typed sentinel
 * instead of returning a discriminated union to keep route handlers tiny.
 */
export class ResourceNotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly code = "RESOURCE_NOT_FOUND" as const;
  public readonly entity: string;
  public readonly entityId: string;

  constructor(entity: string, entityId: string) {
    super(`${entity} ${entityId} not found.`);
    this.name = "ResourceNotFoundError";
    this.entity = entity;
    this.entityId = entityId;
  }
}

/**
 * Outcome of a write attempt. Mirrors the response `outcome` enum and the
 * desired HTTP status — route layer reads `.status` to decide 201 vs 200.
 */
export interface IngestRawInformationResult {
  readonly status: 201 | 200;
  readonly body: IngestRawInformationResponse;
}

/**
 * Implementation of `POST /api/v1/ingest/raw-information`.
 *
 * Happy path (UC-01):
 *   1. Compute `content_hash = sha256(content)`.
 *   2. Compute `idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`.
 *   3. INSERT raw_information; on UNIQUE violation (content_hash), branch to the no-op path.
 *   4. Chunk via `chunkV1`; bulk INSERT raw_chunk.
 *   5. INSERT llm_run with the precomputed key.
 *   6. Return 201 with the new identifiers and the persisted chunk refs.
 *
 * Idempotent no-op path (UC-01 alt 4a):
 *   - Re-read the existing raw_information by content_hash.
 *   - Re-read the existing llm_run by idempotency_key. If not found (e.g.
 *     concurrent insert raced and we lost), surface as 500 — the DB is
 *     inconsistent in a way the spec does not anticipate (BR-09 assumes the
 *     run row is present whenever the raw_information row is).
 *   - Return 200 with `outcome = "noop_existing"` and empty `chunks` array.
 *
 * Caller is responsible for `BEGIN`/`COMMIT`. We never `ROLLBACK` here; we
 * either return a result or throw, and the route handler decides.
 */
export async function ingestRawInformation(
  client: PoolClient,
  input: IngestRawInformationRequest
): Promise<IngestRawInformationResult> {
  // BR-01 — content hash is the idempotency anchor.
  const contentHash = sha256Hex(input.content);
  const idempotencyKey = composeIdempotencyKey({
    content_hash: contentHash,
    prompt_version: input.prompt_version,
    model: input.model,
    chunking_version: CHUNKING_VERSION,
  });

  // Attempt the INSERT; catch UNIQUE violation on content_hash and switch to
  // the no-op path. Any other 23505 (e.g. on idempotency_key alone, which
  // would mean a state inconsistency since content_hash is the primary anchor)
  // is logged and re-raised as 500 by the global error handler.
  let rawInformationRow: Awaited<ReturnType<typeof insertRawInformation>>;
  try {
    rawInformationRow = await insertRawInformation(client, {
      source_type: input.source_type,
      content: input.content,
      content_hash: contentHash,
      metadata: input.metadata,
    });
  } catch (err) {
    if (isUniqueViolation(err, RAW_INFORMATION_CONTENT_HASH_CONSTRAINT)) {
      return await noopExisting(client, contentHash, idempotencyKey);
    }
    throw err;
  }

  // Step 4 — chunking. We chunk AFTER the INSERT because:
  //  (a) the INSERT failing on UNIQUE skips the chunker entirely;
  //  (b) chunker output references the persisted raw_information_id; though
  //      the chunker itself does not consume it, the unit of work stays small
  //      if we keep the order writer-then-children.
  const chunkInputs = chunkV1(input.content, input.source_type);
  if (chunkInputs.length === 0) {
    // The chunker is supposed to emit at least one chunk for any non-empty
    // content (Zod min(1) guarantees that). Defensive guard — surface as
    // 500 if the invariant ever breaks.
    throw new Error("chunkV1 returned no chunks for non-empty content");
  }

  const chunkRows = await insertRawChunks(
    client,
    rawInformationRow.id,
    chunkInputs
  );

  // Step 5 — open the LLMRun. Insert with DEFAULTs for status/attempts/started_at.
  let llmRunRow;
  try {
    llmRunRow = await insertLlmRun(client, {
      model: input.model,
      prompt_version: input.prompt_version,
      input_raw_information_id: rawInformationRow.id,
      idempotency_key: idempotencyKey,
    });
  } catch (err) {
    // Possible only if a concurrent caller raced us with the same
    // (content_hash, model, prompt_version) tuple and inserted the run
    // between our `insertRawInformation` and `insertLlmRun` — extremely
    // unlikely because we hold the row lock from the first INSERT in the
    // same transaction. Surface as 500 (the global handler maps it).
    if (isUniqueViolation(err, LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT)) {
      throw new Error(
        `llm_run idempotency_key collision on a freshly inserted raw_information (${rawInformationRow.id}); ` +
          `database is in an inconsistent state — manual intervention required.`
      );
    }
    throw err;
  }

  return {
    status: 201,
    body: {
      outcome: "created",
      raw_information_id: rawInformationRow.id,
      content_hash: rawInformationRow.content_hash,
      chunk_count: chunkRows.length,
      chunks: chunkRows.map((c) => ({
        id: c.id,
        chunk_index: c.chunk_index,
        offset_start: c.offset_start,
        offset_end: c.offset_end,
      })),
      llm_run_id: llmRunRow.id,
      idempotency_key: llmRunRow.idempotency_key,
    },
  };
}

/**
 * The no-op idempotent branch (BR-09). Returns the existing identifiers; the
 * chunks array is empty by spec (the caller must call
 * `listRawChunksByRawInformation` if it needs the chunk refs).
 */
async function noopExisting(
  client: PoolClient,
  contentHash: string,
  idempotencyKey: string
): Promise<IngestRawInformationResult> {
  const existing = await findRawInformationByHash(client, contentHash);
  if (existing === null) {
    // Should be impossible because we just hit the UNIQUE violation; but
    // surface as 500 rather than 404 — the database is in an unexpected
    // state, not the request.
    throw new Error(
      `noopExisting: content_hash UNIQUE violated but no raw_information row found for ${contentHash}`
    );
  }
  const run = await findLlmRunByIdempotencyKey(client, idempotencyKey);
  if (run === null) {
    throw new Error(
      `noopExisting: raw_information ${existing.id} exists for content_hash ${contentHash} ` +
        `but no llm_run row matches idempotency_key ${idempotencyKey}. ` +
        `Database is inconsistent — BR-09 invariant violated.`
    );
  }

  return {
    status: 200,
    body: {
      outcome: "noop_existing",
      raw_information_id: existing.id,
      content_hash: existing.content_hash,
      // chunk_count is the total number of chunks already persisted. We
      // intentionally avoid an extra SELECT and count via a sub-query in the
      // same statement — but for clarity (and because chunk_count <= a few
      // hundred at our scale) we run a small count query.
      chunk_count: await countChunks(client, existing.id),
      chunks: [],
      llm_run_id: run.id,
      idempotency_key: run.idempotency_key,
    },
  };
}

async function countChunks(
  client: PoolClient,
  rawInformationId: string
): Promise<number> {
  const result = await client.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM raw_chunk WHERE raw_information_id = $1`,
    [rawInformationId]
  );
  const n = result.rows[0]?.n ?? "0";
  return Number.parseInt(n, 10);
}

/**
 * Implementation of `GET /api/v1/ingest/raw-information/{id}`. Throws
 * `ResourceNotFoundError` when no such row exists.
 */
export async function getRawInformationById(
  client: PoolClient,
  id: string
): Promise<RawInformationResponse> {
  const row = await findRawInformationById(client, id);
  if (row === null) {
    throw new ResourceNotFoundError("raw_information", id);
  }
  return toRawInformationResponse(row);
}

/**
 * Implementation of `GET /api/v1/ingest/raw-information/{id}/chunks`. The
 * 404 path checks for the parent existence first (so a known-empty document
 * is distinguishable from an unknown id).
 */
export async function listChunksByRawInformationId(
  client: PoolClient,
  rawInformationId: string
): Promise<ListRawChunksResponse> {
  const parent = await findRawInformationById(client, rawInformationId);
  if (parent === null) {
    throw new ResourceNotFoundError("raw_information", rawInformationId);
  }
  const rows = await findChunksByRawInformationId(client, rawInformationId);
  return {
    total: rows.length,
    items: rows.map(toRawChunkResponse),
  };
}

/**
 * Type guard — detect a pg unique-violation error on a specific constraint
 * name. `pg` exposes the SQLSTATE on `err.code` and the constraint name on
 * `err.constraint` (when available — Postgres includes it for index-backed
 * UNIQUE constraints, which is our case).
 */
export function isUniqueViolation(
  err: unknown,
  constraintName: string
): boolean {
  if (typeof err !== "object" || err === null) return false;
  const obj = err as { code?: unknown; constraint?: unknown };
  return obj.code === "23505" && obj.constraint === constraintName;
}
