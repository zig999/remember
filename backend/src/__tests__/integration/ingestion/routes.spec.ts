// TC-02 acceptance criteria covered:
//  - "POST with new content returns 201 with outcome=created and correct chunk array"
//  - "POST with same content returns 200 with outcome=noop_existing and empty chunks array"
//  - "GET /raw-information/{id} returns 404 for unknown id"
//  - "GET /raw-information/{id}/chunks returns ordered list by chunk_index"
//
// Strategy: build the real Fastify app with a fake pg.Pool that hands out a
// fake PoolClient backed by an in-memory store. Auth is bypassed by signing a
// valid RS256 JWT against a test JWKS the middleware accepts.

import { beforeAll, describe, expect, it } from "vitest";
import pino from "pino";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
} from "jose";

import { buildApp } from "../../../app.js";
import type { Env } from "../../../config/env.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { buildSupabaseAuth } from "../../../middleware/auth.js";
import { CHUNKING_VERSION } from "../../../modules/ingestion/chunker/config.js";
import {
  composeIdempotencyKey,
  sha256Hex,
} from "../../../modules/ingestion/hash.js";

interface FakeStore {
  raw_information: Map<string, Record<string, unknown>>;
  raw_chunks: Array<Record<string, unknown>>;
  llm_runs: Map<string, Record<string, unknown>>;
  byHash: Map<string, string>;
  byIdemKey: Map<string, string>;
  uuidCounter: { n: number };
  txState: "idle" | "open";
}

function emptyStore(): FakeStore {
  return {
    raw_information: new Map(),
    raw_chunks: [],
    llm_runs: new Map(),
    byHash: new Map(),
    byIdemKey: new Map(),
    uuidCounter: { n: 0 },
    txState: "idle",
  };
}

function nextUuid(store: FakeStore, prefixHex: string): string {
  // Produce a syntactically valid v4 UUID. `z.string().uuid()` requires the
  // version digit (M) to be 1..5 and the variant digit (N) to be 8, 9, a or b.
  store.uuidCounter.n += 1;
  const suffix = store.uuidCounter.n.toString(16).padStart(12, "0");
  const head = prefixHex.padStart(8, "0").slice(0, 8);
  return `${head}-1111-4222-8333-${suffix}`;
}

function buildFakeClient(store: FakeStore): import("pg").PoolClient {
  return {
    query: async (...args: unknown[]) => {
      const sqlRaw = String(args[0]).trim();
      const params = (args[1] as unknown[]) ?? [];

      // Transaction control statements — accept them so the route can issue
      // BEGIN/COMMIT/ROLLBACK without our store needing to model isolation.
      const upper = sqlRaw.toUpperCase();
      if (upper === "BEGIN") {
        store.txState = "open";
        return { rows: [], rowCount: 0 };
      }
      if (upper === "COMMIT" || upper === "ROLLBACK") {
        store.txState = "idle";
        return { rows: [], rowCount: 0 };
      }
      if (upper === "SELECT 1 AS OK") {
        return { rows: [{ ok: 1 }], rowCount: 1 };
      }

      // INSERT raw_information
      if (sqlRaw.startsWith("INSERT INTO raw_information")) {
        const [source_type, content, content_hash, metadataJson] = params as [
          string,
          string,
          string,
          string
        ];
        if (store.byHash.has(content_hash)) {
          const err = Object.assign(new Error("duplicate key value"), {
            code: "23505",
            constraint: "raw_information_content_hash_key",
          });
          throw err;
        }
        const id = nextUuid(store, "abcdef01");
        const row = {
          id,
          source_type,
          content,
          storage_ref: null,
          content_hash,
          received_at: new Date("2026-06-11T20:24:00Z"),
          metadata: JSON.parse(metadataJson) as Record<string, unknown>,
        };
        store.raw_information.set(id, row);
        store.byHash.set(content_hash, id);
        return { rows: [row], rowCount: 1 };
      }
      // SELECT raw_information by content_hash
      if (
        sqlRaw.startsWith("SELECT") &&
        sqlRaw.includes("FROM raw_information") &&
        sqlRaw.includes("content_hash = $1")
      ) {
        const id = store.byHash.get(String(params[0]));
        if (id === undefined) return { rows: [], rowCount: 0 };
        return { rows: [store.raw_information.get(id)!], rowCount: 1 };
      }
      // SELECT raw_information by id
      if (
        sqlRaw.startsWith("SELECT") &&
        sqlRaw.includes("FROM raw_information") &&
        sqlRaw.includes("id = $1")
      ) {
        const row = store.raw_information.get(String(params[0]));
        if (row === undefined) return { rows: [], rowCount: 0 };
        return { rows: [row], rowCount: 1 };
      }
      // INSERT raw_chunk
      if (sqlRaw.startsWith("INSERT INTO raw_chunk")) {
        const [rid, indices, texts, starts, ends, versions] = params as [
          string,
          number[],
          string[],
          number[],
          number[],
          string[]
        ];
        const rows = indices.map((ci, i) => ({
          id: nextUuid(store, "deadbeef"),
          raw_information_id: rid,
          chunk_index: ci,
          text: texts[i],
          offset_start: starts[i],
          offset_end: ends[i],
          locator: null,
          chunking_version: versions[i],
        }));
        for (const r of rows) store.raw_chunks.push(r);
        return { rows, rowCount: rows.length };
      }
      // SELECT chunks ordered
      if (
        sqlRaw.startsWith("SELECT") &&
        sqlRaw.includes("FROM raw_chunk") &&
        sqlRaw.includes("raw_information_id = $1") &&
        sqlRaw.includes("ORDER BY")
      ) {
        const rid = String(params[0]);
        const rows = store.raw_chunks
          .filter((c) => c.raw_information_id === rid)
          .sort(
            (a, b) =>
              (a.chunk_index as number) - (b.chunk_index as number)
          );
        return { rows, rowCount: rows.length };
      }
      // SELECT count(*) raw_chunk
      if (sqlRaw.startsWith("SELECT count(*)") && sqlRaw.includes("FROM raw_chunk")) {
        const rid = String(params[0]);
        const n = store.raw_chunks.filter((c) => c.raw_information_id === rid).length;
        return { rows: [{ n: String(n) }], rowCount: 1 };
      }
      // INSERT llm_run
      if (sqlRaw.startsWith("INSERT INTO llm_run")) {
        const [model, prompt_version, input_raw_information_id, idempotency_key] =
          params as [string, string, string, string];
        if (store.byIdemKey.has(idempotency_key)) {
          const err = Object.assign(new Error("duplicate key value"), {
            code: "23505",
            constraint: "llm_run_idempotency_key_key",
          });
          throw err;
        }
        const id = nextUuid(store, "c0c0c0c0");
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
        store.llm_runs.set(id, row);
        store.byIdemKey.set(idempotency_key, id);
        return { rows: [row], rowCount: 1 };
      }
      // SELECT llm_run by idempotency_key
      if (
        sqlRaw.startsWith("SELECT") &&
        sqlRaw.includes("FROM llm_run") &&
        sqlRaw.includes("idempotency_key = $1")
      ) {
        const id = store.byIdemKey.get(String(params[0]));
        if (id === undefined) return { rows: [], rowCount: 0 };
        return { rows: [store.llm_runs.get(id)!], rowCount: 1 };
      }

      throw new Error(`fake client: unknown SQL: ${sqlRaw.slice(0, 100)}`);
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
}

function buildFakePool(store: FakeStore): import("pg").Pool {
  const client = buildFakeClient(store);
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

const envFixture: Env = Object.freeze({
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  PG_POOL_MIN: 2,
  PG_POOL_MAX: 10,
  PG_STATEMENT_TIMEOUT_MS: 10_000,
  SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_KEY: "test-service-key",
  SUPABASE_JWKS_TTL_S: 600,
}) as Env;

const silentLogger = pino({ level: "silent" });

interface AuthFixture {
  publicJwk: JWK & { kid: string; alg: string };
  privateKey: CryptoKey;
}

async function buildAuthFixture(): Promise<AuthFixture> {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  return {
    privateKey,
    publicJwk: { ...publicJwk, kid: "test-kid", alg: "RS256", use: "sig" },
  };
}

async function signValidJwt(privateKey: CryptoKey): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
    .sign(privateKey);
}

async function buildAppWith(store: FakeStore, fixture: AuthFixture) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildSupabaseAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
  });
}

describe("POST /api/v1/ingest/raw-information", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  const validBody = {
    source_type: "ata",
    content: "Ata Apollo. Conteúdo de teste.",
    metadata: { title: "Ata Apollo" },
    model: "claude-opus-4-7",
    prompt_version: "v1",
  };

  it("returns 201 outcome=created on a new content_hash", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        headers: { authorization: `Bearer ${token}` },
        payload: validBody,
      });
      expect(res.statusCode).toBe(201);
      const body = res.json() as Record<string, unknown>;
      expect(body.outcome).toBe("created");
      expect(typeof body.raw_information_id).toBe("string");
      expect(body.content_hash).toBe(sha256Hex(validBody.content));
      expect(body.idempotency_key).toBe(
        composeIdempotencyKey({
          content_hash: body.content_hash as string,
          prompt_version: validBody.prompt_version,
          model: validBody.model,
          chunking_version: CHUNKING_VERSION,
        })
      );
      const chunks = body.chunks as Array<Record<string, unknown>>;
      expect(chunks.length).toBeGreaterThan(0);
      // chunk_count matches the chunks array length on the create path.
      expect(body.chunk_count).toBe(chunks.length);
    } finally {
      await app.close();
    }
  });

  it("returns 200 outcome=noop_existing on a repeated content_hash with empty chunks array", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      // First call creates.
      const first = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        headers: { authorization: `Bearer ${token}` },
        payload: validBody,
      });
      expect(first.statusCode).toBe(201);

      // Second call with the SAME content must be a no-op.
      const second = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        headers: { authorization: `Bearer ${token}` },
        payload: validBody,
      });
      expect(second.statusCode).toBe(200);
      const body = second.json() as Record<string, unknown>;
      expect(body.outcome).toBe("noop_existing");
      expect(body.chunks).toEqual([]);
      expect(body.chunk_count).toBeGreaterThan(0); // existing total preserved
      expect(body.raw_information_id).toBe(
        (first.json() as Record<string, unknown>).raw_information_id
      );
      expect(body.llm_run_id).toBe(
        (first.json() as Record<string, unknown>).llm_run_id
      );
    } finally {
      await app.close();
    }
  });

  it("returns 401 without an Authorization header (BR-01 of knowledge-graph + ingestion auth gate)", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        payload: validBody,
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("returns 422 on a malformed body (missing required field)", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        headers: { authorization: `Bearer ${token}` },
        payload: { source_type: "ata" }, // missing content/model/prompt_version
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    } finally {
      await app.close();
    }
  });

  it("returns 422 on empty content (Zod minLength=1)", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        headers: { authorization: `Bearer ${token}` },
        payload: { ...validBody, content: "" },
      });
      expect(res.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/v1/ingest/raw-information/:id", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  const validBody = {
    source_type: "ata",
    content: "Ata Apollo. Conteúdo de teste para GET.",
    metadata: { title: "Ata GET" },
    model: "claude-opus-4-7",
    prompt_version: "v1",
  };

  it("returns 200 with the raw_information row when found", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const created = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        headers: { authorization: `Bearer ${token}` },
        payload: validBody,
      });
      const id = (created.json() as Record<string, unknown>).raw_information_id as string;
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ingest/raw-information/${id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.id).toBe(id);
      expect(body.source_type).toBe("ata");
      expect(typeof body.received_at).toBe("string");
      expect(body.content_hash).toBe(sha256Hex(validBody.content));
    } finally {
      await app.close();
    }
  });

  it("returns 404 RESOURCE_NOT_FOUND for an unknown id", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/ingest/raw-information/00000000-0000-0000-0000-000000000000",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("returns 422 on a malformed UUID path parameter", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/ingest/raw-information/not-a-uuid",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/v1/ingest/raw-information/:id/chunks", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns 200 with chunks ordered by chunk_index", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const created = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/raw-information",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          source_type: "pdf",
          content: "página A\fpágina B\fpágina C",
          metadata: {},
          model: "claude-opus-4-7",
          prompt_version: "v1",
        },
      });
      expect(created.statusCode).toBe(201);
      const id = (created.json() as Record<string, unknown>).raw_information_id as string;
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ingest/raw-information/${id}/chunks`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { total: number; items: Array<Record<string, unknown>> };
      expect(body.total).toBe(3);
      expect(body.items.map((i) => i.chunk_index)).toEqual([0, 1, 2]);
      // Each item carries the full RawChunk shape.
      const head = body.items[0]!;
      expect(typeof head.id).toBe("string");
      expect(head.raw_information_id).toBe(id);
      expect(head.chunking_version).toBe(CHUNKING_VERSION);
    } finally {
      await app.close();
    }
  });

  it("returns 404 when the parent raw_information does not exist", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/ingest/raw-information/00000000-0000-0000-0000-000000000000/chunks",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});
