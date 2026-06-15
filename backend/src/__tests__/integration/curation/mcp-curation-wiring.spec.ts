// Integration tests for the TC-mcc-03 MCP curation transport WIRING.
//
// Acceptance criteria addressed (validation.criteria of dev_tc_mcc_003):
//   - POST /api/v1/mcp/curation is registered under the auth-protected scope
//     (401 without a Bearer token).
//   - The route is mounted only when `ingestionCatalog` is defined (the same
//     guard that controls the curation REST mirror).
//   - tools/list returns 8 tool names — the 7 owned by the curation domain +
//     `compliance_delete` (owned by compliance-audit, co-tenant on the same
//     transport via the closed whitelist).
//   - tools/call on a foreign tool name (`propose_node` ingest, `get_node`
//     query) returns { ok: false, error.code: "NOT_FOUND" } even though those
//     tools are present on the same shared `McpServer` registry under their
//     own toolset keys.
//   - The transport does NOT read or require any `X-LLM-Run-Id` header.
//
// Strategy mirrors `__tests__/integration/knowledge-graph/mcp-query-kg.spec.ts`:
// build the real Fastify app with a minimal fake pg.Pool (we never call a
// service — these tests only exercise transport-level dispatch + wiring) and a
// test JWKS the middleware accepts. REST↔MCP behavioural parity tests are out
// of scope of this task (they belong to TC-mcc-04 / BR-32).

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
import { buildSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";
import { buildSnapshot as buildIngestionSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { CURATION_TOOL_NAMES } from "../../../modules/curation/index.js";

// ---------------------------------------------------------------------------
// Fixtures — env, logger, JWT, fake pool.
// ---------------------------------------------------------------------------

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

async function signValidJwt(privateKey: CryptoKey): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
    .sign(privateKey);
}

/**
 * Minimal fake pool. The wiring tests never reach a service (tools/list +
 * NOT_FOUND envelope), so we don't need the elaborate fake-DB the curation
 * routes spec maintains. A `connect()` that returns a no-op client is
 * sufficient — and if anything DOES try to write SQL, we'd want to fail loud
 * (Rule 12).
 */
function buildFakePool(): import("pg").Pool {
  return {
    connect: async () => ({
      query: async (sql: string) => {
        const upper = String(sql).trim().toUpperCase();
        if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }
        if (upper === "SELECT 1 AS OK") {
          return { rows: [{ ok: 1 }], rowCount: 1 };
        }
        // Any other SQL means a tool handler was reached, which is outside the
        // scope of these wiring tests — fail loud.
        throw new Error(`unexpected SQL in wiring test: ${sql.slice(0, 80)}`);
      },
      release: () => undefined,
    }),
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

function buildKgCatalog() {
  return buildSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

function buildIngestionCatalog() {
  return buildIngestionSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
    attributeValidValues: [],
  });
}

async function buildAppWith(
  fixture: AuthFixture,
  opts: { withIngestionCatalog: boolean }
) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    catalog: buildKgCatalog(),
    ...(opts.withIngestionCatalog
      ? { ingestionCatalog: buildIngestionCatalog() }
      : {}),
  });
}

// ---------------------------------------------------------------------------
// JSON-RPC helpers.
// ---------------------------------------------------------------------------

function rpcCall(name: string, args: Record<string, unknown> = {}): unknown {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
}

function rpcList(): unknown {
  return { jsonrpc: "2.0", id: 1, method: "tools/list" };
}

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    tools?: Array<{ name: string; description: string; inputSchema?: unknown }>;
  };
  error?: { code: number; message: string };
}

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

/** Parse the structured { code, message, details } an isError MCP result carries. */
function mcpErrPayload(body: JsonRpcEnvelope): { code: string; message: string; details?: unknown } {
  return JSON.parse(body.result?.content?.[0]?.text ?? "{}");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP curation transport — wiring (BR-29)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("rejects requests without a Bearer token (401)", async () => {
    // The route inherits the parent scope's `requireNeonAuth` preHandler
    // (BR-29 rule 1). No header means 401 before the JSON-RPC dispatcher is
    // even reached.
    const app = await buildAppWith(fixture, { withIngestionCatalog: true });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        payload: rpcList(),
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("is NOT mounted when ingestionCatalog is absent", async () => {
    // BR-29 last paragraph + known_context: the transport mounts only when
    // `ingestionCatalog` is defined (same guard as the curation REST mirror).
    // With the catalog absent, the route does not exist and Fastify returns
    // 404 even with a valid token.
    const app = await buildAppWith(fixture, { withIngestionCatalog: false });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcList(),
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("tools/list returns 8 tool names (7 curation + compliance_delete)", async () => {
    const app = await buildAppWith(fixture, { withIngestionCatalog: true });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcList(),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      const tools = body.result?.tools ?? [];
      const names = tools.map((t) => t.name).sort();
      const expected = [
        ...CURATION_TOOL_NAMES,
        "compliance_delete",
      ].sort();
      expect(names).toEqual(expected);
      // Every tool descriptor surfaces a non-empty input schema (BR-31).
      const withoutSchema = tools.filter(
        (t) => t.inputSchema === undefined || t.inputSchema === null
      );
      expect(withoutSchema).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("dispatches without an X-LLM-Run-Id header (BR-29 rule 2)", async () => {
    // The curation transport must NOT require the ingest header. We use the
    // whitelist gate to assert dispatch is reached — no header is sent and
    // an unknown tool name still produces the expected NOT_FOUND envelope.
    const app = await buildAppWith(fixture, { withIngestionCatalog: true });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT }, // NO X-LLM-Run-Id
        payload: rpcCall("does_not_exist", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

describe("MCP curation transport — closed whitelist (BR-29 rule 5)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("rejects `propose_node` (ingest tool) with NOT_FOUND", async () => {
    // The ingest tool IS registered on the shared McpServer (under the
    // `ingest` toolset key); the closed whitelist must refuse it.
    const app = await buildAppWith(fixture, { withIngestionCatalog: true });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("propose_node", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("rejects `get_node` (query tool) with NOT_FOUND", async () => {
    // The query tool IS registered on the shared McpServer (under the
    // `query` toolset key); the closed whitelist must refuse it.
    const app = await buildAppWith(fixture, { withIngestionCatalog: true });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("get_node", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});
