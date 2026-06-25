// TC-MCI-001 — Integration tests for POST /api/v1/mcp/ingest.
//
// Acceptance criteria addressed (v1.2.4):
//   - "MCP endpoint returns 401 when JWT is missing or invalid"
//   - "auth guard on MCP endpoint must use requireNeonAuth (same JWKS as REST)"
//   - "MCP endpoint is mounted under the auth-protected scope" (smoke test
//      with a valid JWT)
//   - "tools/list always returns all 4 propose_* tools (no per-session gating)"
//   - "Missing/invalid `llm_run_id` arg returns isError: true + STRUCTURAL_INVALID"
//   - "Valid `llm_run_id` pointing to a non-running run returns isError: true
//      + STRUCTURAL_INVALID"
//
// Strategy: build the full Fastify app via `buildApp` with the same fake
// pool + in-memory JWKS pattern used by the existing app.spec.ts. The
// ingestion catalog snapshot is built in-memory so the transport's `if
// ingestionCatalog` gate is satisfied (otherwise the route is not mounted).

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
import { buildNeonAuth } from "../../../middleware/auth.js";
import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { INGEST_TOOL_NAMES } from "../../../modules/ingestion/index.js";

const RUN_ID = "44444444-4444-4444-4444-444444444444";

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

const envFixture: Env = Object.freeze({
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  PG_POOL_MIN: 2,
  PG_POOL_MAX: 10,
  PG_STATEMENT_TIMEOUT_MS: 10_000,
  NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth",
  NEON_AUTH_JWKS_TTL_S: 600,
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

async function signJwt(privateKey: CryptoKey, expSecondsFromNow: number): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expSecondsFromNow)
    .sign(privateKey);
}

function buildIngestionCatalog() {
  return buildSnapshot({
    nodeTypes: [
      { id: "00000000-0000-4000-8000-000000000001", name: "Person" },
      { id: "00000000-0000-4000-8000-000000000002", name: "Project" },
    ],
    linkTypes: [
      {
        id: "00000000-0000-4000-8000-000000000010",
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true,
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
    ],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

/**
 * Default fake pool that:
 *   - Returns an empty rowset for any `SELECT` (so `findLlmRunById` reports
 *     "no such run" -> assertRunIsRunning throws STRUCTURAL_INVALID).
 *   - Accepts BEGIN / COMMIT / ROLLBACK / INSERT (the audit-row standalone TX
 *     swallows FK failures, but a no-op is fine for these wiring tests).
 *   - Treats `INSERT INTO tool_call` as a normal write so the standalone audit
 *     attempt does not surface a different error code.
 */
function buildFakePool(): import("pg").Pool {
  return {
    connect: async () => ({
      query: async (...args: unknown[]) => {
        const sql = String(args[0]).replace(/\s+/g, " ").trim();
        const upper = sql.toUpperCase();
        if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }
        if (sql.startsWith("INSERT INTO tool_call")) {
          return { rows: [{ id: "tc-fake" }], rowCount: 1 };
        }
        // Default: no rows (SELECT findLlmRunById sees no row).
        return { rows: [], rowCount: 0 };
      },
      release: () => undefined,
    }),
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

/**
 * Fake pool variant where `findLlmRunById` returns a `completed` (not
 * `running`) llm_run row — `assertRunIsRunning` throws STRUCTURAL_INVALID
 * with status='completed' details.
 */
function buildFakePoolWithCompletedRun(): import("pg").Pool {
  return {
    connect: async () => ({
      query: async (...args: unknown[]) => {
        const sql = String(args[0]).replace(/\s+/g, " ").trim();
        const upper = sql.toUpperCase();
        if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }
        if (sql.startsWith("INSERT INTO tool_call")) {
          return { rows: [{ id: "tc-fake" }], rowCount: 1 };
        }
        // Detect the findLlmRunById SQL (`FROM llm_run WHERE id = $1`).
        if (
          sql.includes("FROM llm_run") &&
          sql.includes("WHERE id = $1")
        ) {
          return {
            rows: [
              {
                id: RUN_ID,
                model: "claude-stub",
                prompt_version: "v1",
                started_at: new Date("2026-06-15T00:00:00Z"),
                finished_at: new Date("2026-06-15T00:01:00Z"),
                status: "completed",
                attempts: 1,
                input_raw_information_id: "11111111-1111-4111-8111-111111111111",
                idempotency_key: "k",
              },
            ],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      },
      release: () => undefined,
    }),
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

function rpc(method: string, params?: unknown): unknown {
  return { jsonrpc: "2.0", id: 1, method, ...(params !== undefined ? { params } : {}) };
}
function toolCall(name: string, args: Record<string, unknown> = {}): unknown {
  return rpc("tools/call", { name, arguments: args });
}

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    tools?: Array<{ name: string; description: string; inputSchema?: unknown }>;
    protocolVersion?: string;
    serverInfo?: { name?: string };
  };
  error?: { code: number | string; message: string };
}

function mcpErrPayload(body: JsonRpcEnvelope): { code: string; message: string; details?: unknown } {
  return JSON.parse(body.result?.content?.[0]?.text ?? "{}");
}

describe("POST /api/v1/mcp/ingest — auth + transport mount (TC-MCI-001)", () => {
  let fixture: AuthFixture;

  beforeAll(async () => {
    fixture = await buildAuthFixture();
  });

  it("returns 401 AUTH_UNAUTHORIZED when no Authorization header is sent", async () => {
    // Validation criterion: "MCP endpoint returns 401 when JWT is missing".
    // The preHandler on the `/api/v1` scope owns this — we only need to
    // confirm the route is mounted INSIDE that scope (not outside).
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        payload: rpc("initialize"),
      });
      expect(res.statusCode).toBe(401);
      const body = res.json() as { error?: { code?: string } };
      expect(body.error?.code).toBe("AUTH_UNAUTHORIZED");
    } finally {
      await app.close();
    }
  });

  it("returns 401 AUTH_TOKEN_INVALID when a malformed JWT is sent", async () => {
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        payload: rpc("initialize"),
        headers: { authorization: "Bearer not.a.jwt", accept: MCP_ACCEPT },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json() as { error?: { code?: string } };
      expect(body.error?.code).toBe("AUTH_TOKEN_INVALID");
    } finally {
      await app.close();
    }
  });

  it("returns 200 + serverInfo when a valid JWT is sent (initialize handshake)", async () => {
    // Auth happy path: with a valid JWT the SDK kernel's `initialize`
    // dispatch runs through, confirming the route is mounted and reachable.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const token = await signJwt(fixture.privateKey, 60);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        payload: rpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "t", version: "0" },
        }),
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.serverInfo?.name).toBe("remember-bff-ingest");
    } finally {
      await app.close();
    }
  });

  it("tools/list returns the four propose_* tools plus ingest_document and the three read-only ops tools (no per-session gating)", async () => {
    // BR-21 (revised, v1.2.4): the per-session factory is RETIRED — tools are
    // always listed regardless of any header / argument state. NO X-LLM-Run-Id.
    // TC-MCI-002: the high-level `ingest_document` tool is advertised alongside
    // the four low-level `propose_*` writers.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const token = await signJwt(fixture.privateKey, 60);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        payload: rpc("tools/list"),
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      const names = (body.result?.tools ?? []).map((t) => t.name).sort();
      expect(names).toEqual(
        [
          ...INGEST_TOOL_NAMES,
          "ingest_document",
          "ingest_directed",
          "health",
          "get_ingestion_status",
          "list_recent_ingestions",
        ].sort()
      );
      // TC-04 / TC-06 v2.8 seam-removal pinning: the directed-ingestion
      // entry is wire-advertised under the `ingest` toolset, and the retired
      // `start_async_ingestion` MUST NOT resurface on the wire. The exhaustive
      // list above also implies these, but the explicit positive + negative
      // assertions make the regression intent legible at a glance.
      expect(names).toContain("ingest_directed");
      expect(names).not.toContain("start_async_ingestion");
    } finally {
      await app.close();
    }
  });

  it("ingest_document with invalid args → isError + STRUCTURAL_INVALID (dispatch + envelope round-trip)", async () => {
    // Wire-level coverage for the new tool: a `tools/call` with `content`
    // missing fails Zod validation in the registrar BEFORE any DB write or LLM
    // call, so it is safe against the fake pool. Exercises dispatch + the
    // MCP `content`/`isError` rendering for `ingest_document`.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const token = await signJwt(fixture.privateKey, 60);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        payload: toolCall("ingest_document", { source_type: "outro" }), // no `content`
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("STRUCTURAL_INVALID");
    } finally {
      await app.close();
    }
  });

  it("is NOT mounted when ingestionCatalog is absent", async () => {
    // Same guard as the curation REST mirror: the transport requires the
    // ingestion catalog snapshot (the propose-{node,link,attribute} handlers
    // depend on it). With the catalog absent, Fastify returns 404 even with
    // a valid token.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      // ingestionCatalog deliberately omitted
    });
    try {
      const token = await signJwt(fixture.privateKey, 60);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        payload: rpc("tools/list"),
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/v1/mcp/ingest — Option B run-id binding (TC-MCI-001)", () => {
  let fixture: AuthFixture;

  beforeAll(async () => {
    fixture = await buildAuthFixture();
  });

  it("tools/call without `llm_run_id` in args returns isError + STRUCTURAL_INVALID", async () => {
    // BR-21 (revised) Option B: `llm_run_id` is required on every MCP call as
    // a tool argument. Omitting it triggers the MCP-facing Zod schema's
    // `z.string().min(1)` rejection -> STRUCTURAL_INVALID envelope wrapped
    // as MCP `isError: true`.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const token = await signJwt(fixture.privateKey, 60);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: toolCall("propose_fragment", {
          // llm_run_id missing
          text: "anything",
          confidence: 0.9,
          chunk_ids: ["66666666-6666-4666-8666-666666666666"],
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("STRUCTURAL_INVALID");
    } finally {
      await app.close();
    }
  });

  it("tools/call with `llm_run_id` pointing to an unknown run returns isError + STRUCTURAL_INVALID", async () => {
    // BR-21 (revised): `assertRunIsRunning` throws STRUCTURAL_INVALID when
    // the id does not resolve to any `llm_run` row. The default fake pool
    // returns no rows, so this exercises the "unknown run" branch.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const token = await signJwt(fixture.privateKey, 60);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: toolCall("propose_fragment", {
          llm_run_id: RUN_ID,
          text: "anything",
          confidence: 0.9,
          chunk_ids: ["66666666-6666-4666-8666-666666666666"],
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("STRUCTURAL_INVALID");
    } finally {
      await app.close();
    }
  });

  it("tools/call with `llm_run_id` for a non-running run returns isError + STRUCTURAL_INVALID", async () => {
    // BR-21 (revised): `assertRunIsRunning` also throws STRUCTURAL_INVALID
    // when the row exists but `status !== 'running'`. The dedicated fake pool
    // returns a `completed` row so we exercise the "row present, wrong
    // status" branch.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: buildFakePoolWithCompletedRun(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const token = await signJwt(fixture.privateKey, 60);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: toolCall("propose_fragment", {
          llm_run_id: RUN_ID,
          text: "anything",
          confidence: 0.9,
          chunk_ids: ["66666666-6666-4666-8666-666666666666"],
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("STRUCTURAL_INVALID");
    } finally {
      await app.close();
    }
  });
});
