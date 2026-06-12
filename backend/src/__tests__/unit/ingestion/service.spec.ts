// TC-02 acceptance criteria covered:
//  - "POST with new content returns 201 with outcome=created"
//  - "POST with same content returns 200 with outcome=noop_existing and empty chunks array"
//  - "On SQLSTATE 23505 on raw_information_content_hash_key:
//     no-op path returning outcome=noop_existing"
//  - "GET /raw-information/{id} returns 404 for unknown id"
//
// Strategy: unit-test the service against an in-memory fake `PoolClient` that
// stubs `pg.query` based on the SQL prefix. The fake records inserts so we
// can verify what the service writes (chunk count, llm_run, etc.).

import { describe, expect, it } from "vitest";

import { CHUNKING_VERSION } from "../../../modules/ingestion/chunker/config.js";
import {
  composeIdempotencyKey,
  sha256Hex,
} from "../../../modules/ingestion/hash.js";
import {
  getRawInformationById,
  ingestRawInformation,
  listChunksByRawInformationId,
  ResourceNotFoundError,
} from "../../../modules/ingestion/service/ingestion.service.js";

/** Minimal QueryResult shape that the repository expects from `pg.query`. */
interface FakeQueryResult<R = unknown> {
  rows: R[];
  rowCount: number;
}

/** Fake state — what the service inserted across the test. */
interface FakeState {
  raw_information: Map<string, Record<string, unknown>>;
  raw_chunks: Array<Record<string, unknown>>;
  llm_runs: Map<string, Record<string, unknown>>;
  // For introspection by tests.
  byHash: Map<string, string>; // content_hash -> raw_information_id
  byIdemKey: Map<string, string>; // idempotency_key -> llm_run_id
}

function emptyState(): FakeState {
  return {
    raw_information: new Map(),
    raw_chunks: [],
    llm_runs: new Map(),
    byHash: new Map(),
    byIdemKey: new Map(),
  };
}

let uuidCounter = 0;
function nextUuid(prefix: string): string {
  uuidCounter += 1;
  const suffix = uuidCounter.toString(16).padStart(8, "0");
  return `${prefix.padEnd(8, "0")}-1111-2222-3333-${suffix.padEnd(12, "0")}`;
}

/**
 * Build a fake `PoolClient` against a fresh state. The fake recognizes the
 * SQL the repository emits via prefix matching — exhaustively, so a missing
 * branch throws (we surface "fake client received unknown SQL" loudly).
 */
function buildFakeClient(state: FakeState, opts: {
  preInsertedHash?: string;
  preInsertedRunIdempKey?: string;
} = {}): import("pg").PoolClient {
  // Pre-populate if asked — exercises the noop_existing branch.
  if (opts.preInsertedHash !== undefined) {
    const rid = nextUuid("rinfo");
    state.byHash.set(opts.preInsertedHash, rid);
    state.raw_information.set(rid, {
      id: rid,
      source_type: "ata",
      content: "existing content",
      storage_ref: null,
      content_hash: opts.preInsertedHash,
      received_at: new Date("2026-06-11T20:00:00Z"),
      metadata: {},
    });
    // Also pre-insert a chunk for the count query.
    state.raw_chunks.push({
      id: nextUuid("chunk"),
      raw_information_id: rid,
      chunk_index: 0,
      text: "existing content",
      offset_start: 0,
      offset_end: 16,
      locator: null,
      chunking_version: CHUNKING_VERSION,
    });
    if (opts.preInsertedRunIdempKey !== undefined) {
      const runId = nextUuid("llmrun");
      state.byIdemKey.set(opts.preInsertedRunIdempKey, runId);
      state.llm_runs.set(runId, {
        id: runId,
        model: "claude-opus-4-7",
        prompt_version: "v1",
        started_at: new Date("2026-06-11T20:00:01Z"),
        finished_at: null,
        status: "running",
        attempts: 1,
        input_raw_information_id: rid,
        idempotency_key: opts.preInsertedRunIdempKey,
      });
    }
  }

  return {
    query: async (...args: unknown[]): Promise<FakeQueryResult> => {
      const sql = String(args[0]).trim();
      const params = (args[1] as unknown[]) ?? [];
      return handleQuery(state, sql, params);
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
}

function handleQuery(
  state: FakeState,
  sql: string,
  params: unknown[]
): FakeQueryResult {
  // INSERT INTO raw_information
  if (sql.startsWith("INSERT INTO raw_information")) {
    const [source_type, content, content_hash, metadataJson] = params as [
      string,
      string,
      string,
      string
    ];
    if (state.byHash.has(content_hash)) {
      const err = Object.assign(new Error("duplicate key value"), {
        code: "23505",
        constraint: "raw_information_content_hash_key",
      });
      throw err;
    }
    const id = nextUuid("rinfo");
    const row = {
      id,
      source_type,
      content,
      storage_ref: null,
      content_hash,
      received_at: new Date("2026-06-11T20:24:00Z"),
      metadata: JSON.parse(metadataJson) as Record<string, unknown>,
    };
    state.raw_information.set(id, row);
    state.byHash.set(content_hash, id);
    return { rows: [row], rowCount: 1 };
  }

  // SELECT raw_information by content_hash
  if (
    sql.startsWith("SELECT") &&
    sql.includes("FROM raw_information") &&
    sql.includes("content_hash = $1")
  ) {
    const id = state.byHash.get(String(params[0]));
    if (id === undefined) return { rows: [], rowCount: 0 };
    return { rows: [state.raw_information.get(id)!], rowCount: 1 };
  }

  // SELECT raw_information by id
  if (
    sql.startsWith("SELECT") &&
    sql.includes("FROM raw_information") &&
    sql.includes("id = $1")
  ) {
    const row = state.raw_information.get(String(params[0]));
    if (row === undefined) return { rows: [], rowCount: 0 };
    return { rows: [row], rowCount: 1 };
  }

  // INSERT INTO raw_chunk
  if (sql.startsWith("INSERT INTO raw_chunk")) {
    const [rid, indices, texts, starts, ends, versions] = params as [
      string,
      number[],
      string[],
      number[],
      number[],
      string[]
    ];
    const rows = indices.map((ci, i) => ({
      id: nextUuid("chunk"),
      raw_information_id: rid,
      chunk_index: ci,
      text: texts[i],
      offset_start: starts[i],
      offset_end: ends[i],
      locator: null,
      chunking_version: versions[i],
    }));
    for (const r of rows) state.raw_chunks.push(r);
    return { rows, rowCount: rows.length };
  }

  // SELECT chunks by raw_information_id
  if (
    sql.startsWith("SELECT") &&
    sql.includes("FROM raw_chunk") &&
    sql.includes("raw_information_id = $1") &&
    sql.includes("ORDER BY")
  ) {
    const rid = String(params[0]);
    const rows = state.raw_chunks
      .filter((c) => c.raw_information_id === rid)
      .sort(
        (a, b) =>
          (a.chunk_index as number) - (b.chunk_index as number)
      );
    return { rows, rowCount: rows.length };
  }

  // SELECT count(*) FROM raw_chunk ...
  if (sql.startsWith("SELECT count(*)") && sql.includes("FROM raw_chunk")) {
    const rid = String(params[0]);
    const n = state.raw_chunks.filter((c) => c.raw_information_id === rid).length;
    return { rows: [{ n: String(n) }], rowCount: 1 };
  }

  // INSERT INTO llm_run
  if (sql.startsWith("INSERT INTO llm_run")) {
    const [model, prompt_version, input_raw_information_id, idempotency_key] =
      params as [string, string, string, string];
    if (state.byIdemKey.has(idempotency_key)) {
      const err = Object.assign(new Error("duplicate key value"), {
        code: "23505",
        constraint: "llm_run_idempotency_key_key",
      });
      throw err;
    }
    const id = nextUuid("llmrun");
    const row = {
      id,
      model,
      prompt_version,
      started_at: new Date("2026-06-11T20:24:01Z"),
      finished_at: null,
      status: "running" as const,
      attempts: 1,
      input_raw_information_id,
      idempotency_key,
    };
    state.llm_runs.set(id, row);
    state.byIdemKey.set(idempotency_key, id);
    return { rows: [row], rowCount: 1 };
  }

  // SELECT llm_run by idempotency_key
  if (
    sql.startsWith("SELECT") &&
    sql.includes("FROM llm_run") &&
    sql.includes("idempotency_key = $1")
  ) {
    const id = state.byIdemKey.get(String(params[0]));
    if (id === undefined) return { rows: [], rowCount: 0 };
    return { rows: [state.llm_runs.get(id)!], rowCount: 1 };
  }

  throw new Error(`fake client received unknown SQL: ${sql.slice(0, 120)}`);
}

const validInput = {
  source_type: "ata" as const,
  content: "Ata Apollo de teste — go-live em 2026-07-15.",
  metadata: { title: "ata" },
  model: "claude-opus-4-7",
  prompt_version: "v1",
};

describe("ingestRawInformation — create path (BR-01, UC-01)", () => {
  it("returns status 201 with outcome=created and a non-empty chunks array", async () => {
    const state = emptyState();
    const client = buildFakeClient(state);
    const result = await ingestRawInformation(client, validInput);
    expect(result.status).toBe(201);
    expect(result.body.outcome).toBe("created");
    expect(result.body.chunks.length).toBeGreaterThan(0);
    expect(result.body.chunk_count).toBe(result.body.chunks.length);
    // content_hash must match sha256(content) — sanity check.
    expect(result.body.content_hash).toBe(sha256Hex(validInput.content));
    // idempotency_key composition (BR-08).
    expect(result.body.idempotency_key).toBe(
      composeIdempotencyKey({
        content_hash: result.body.content_hash,
        prompt_version: validInput.prompt_version,
        model: validInput.model,
        chunking_version: CHUNKING_VERSION,
      })
    );
  });

  it("persists at least one raw_chunk and one llm_run row", async () => {
    const state = emptyState();
    const client = buildFakeClient(state);
    await ingestRawInformation(client, validInput);
    expect(state.raw_chunks.length).toBeGreaterThan(0);
    expect(state.llm_runs.size).toBe(1);
  });

  it("returned chunks are sorted by chunk_index ascending", async () => {
    const state = emptyState();
    const client = buildFakeClient(state);
    // Multi-chunk input — use PDF with explicit form-feed boundaries so the
    // chunker emits >1 chunk on a small input.
    const result = await ingestRawInformation(client, {
      ...validInput,
      source_type: "pdf",
      content: "página A\fpágina B\fpágina C",
    });
    expect(result.body.chunks.length).toBe(3);
    expect(result.body.chunks.map((c) => c.chunk_index)).toEqual([0, 1, 2]);
  });
});

describe("ingestRawInformation — noop_existing path (BR-09, UC-01 alt 4a)", () => {
  it("returns status 200 with outcome=noop_existing and an empty chunks array when content_hash already exists", async () => {
    const state = emptyState();
    const contentHash = sha256Hex(validInput.content);
    const idempKey = composeIdempotencyKey({
      content_hash: contentHash,
      prompt_version: validInput.prompt_version,
      model: validInput.model,
      chunking_version: CHUNKING_VERSION,
    });
    const client = buildFakeClient(state, {
      preInsertedHash: contentHash,
      preInsertedRunIdempKey: idempKey,
    });
    const result = await ingestRawInformation(client, validInput);
    expect(result.status).toBe(200);
    expect(result.body.outcome).toBe("noop_existing");
    expect(result.body.chunks).toEqual([]);
    // chunk_count is the existing count (we pre-inserted one chunk).
    expect(result.body.chunk_count).toBe(1);
    expect(result.body.content_hash).toBe(contentHash);
    expect(result.body.idempotency_key).toBe(idempKey);
  });

  it("never re-inserts raw_information or llm_run on the noop path", async () => {
    const state = emptyState();
    const contentHash = sha256Hex(validInput.content);
    const idempKey = composeIdempotencyKey({
      content_hash: contentHash,
      prompt_version: validInput.prompt_version,
      model: validInput.model,
      chunking_version: CHUNKING_VERSION,
    });
    const client = buildFakeClient(state, {
      preInsertedHash: contentHash,
      preInsertedRunIdempKey: idempKey,
    });
    const sizeBefore = {
      ri: state.raw_information.size,
      lr: state.llm_runs.size,
      ch: state.raw_chunks.length,
    };
    await ingestRawInformation(client, validInput);
    expect(state.raw_information.size).toBe(sizeBefore.ri);
    expect(state.llm_runs.size).toBe(sizeBefore.lr);
    expect(state.raw_chunks.length).toBe(sizeBefore.ch);
  });
});

describe("getRawInformationById", () => {
  it("returns the row when found", async () => {
    const state = emptyState();
    const client = buildFakeClient(state);
    const created = await ingestRawInformation(client, validInput);
    const fetched = await getRawInformationById(client, created.body.raw_information_id);
    expect(fetched.id).toBe(created.body.raw_information_id);
    expect(fetched.content_hash).toBe(created.body.content_hash);
    expect(typeof fetched.received_at).toBe("string");
  });

  it("throws ResourceNotFoundError when the id is unknown", async () => {
    const state = emptyState();
    const client = buildFakeClient(state);
    await expect(
      getRawInformationById(client, "00000000-0000-0000-0000-000000000000")
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

describe("listChunksByRawInformationId", () => {
  it("returns chunks ordered by chunk_index ascending", async () => {
    const state = emptyState();
    const client = buildFakeClient(state);
    const created = await ingestRawInformation(client, {
      ...validInput,
      source_type: "pdf",
      content: "A\fB\fC\fD",
    });
    const list = await listChunksByRawInformationId(
      client,
      created.body.raw_information_id
    );
    expect(list.total).toBe(4);
    expect(list.items.map((i) => i.chunk_index)).toEqual([0, 1, 2, 3]);
    expect(list.items.map((i) => i.text)).toEqual(["A", "B", "C", "D"]);
  });

  it("throws ResourceNotFoundError when the parent raw_information does not exist", async () => {
    const state = emptyState();
    const client = buildFakeClient(state);
    await expect(
      listChunksByRawInformationId(client, "00000000-0000-0000-0000-000000000000")
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
