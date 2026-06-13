// TC-014 — Integration test for POST /api/v1/mcp.
//
// Acceptance criteria addressed:
//   - "MCP endpoint returns 401 when JWT is missing or invalid"
//   - "auth guard on MCP endpoint must use requireNeonAuth (same JWKS as REST)"
//   - "MCP endpoint is mounted under the auth-protected scope" (smoke test
//      with a valid JWT)
//
// Strategy: build the full Fastify app via `buildApp` with the same fake
// pool + in-memory JWKS pattern used by the existing app.spec.ts. The
// catalog snapshot is built in-memory so the transport's `if catalog`
// gate is satisfied (otherwise the transport route is not mounted).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
import { LLM_RUN_HEADER } from "../../../modules/ingestion/mcp/transport.js";

const RUN_ID = "44444444-4444-4444-4444-444444444444";

function fakePool(): import("pg").Pool {
  return {
    connect: async () =>
      ({
        query: async () => ({ rows: [{ ok: 1 }], rowCount: 1 } as never),
        release: () => undefined,
      }) as never,
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

describe("POST /api/v1/mcp — auth + transport mount (TC-014)", () => {
  let fixture: AuthFixture;

  beforeAll(async () => {
    fixture = await buildAuthFixture();
  });

  afterAll(() => undefined);

  it("returns 401 AUTH_UNAUTHORIZED when no Authorization header is sent", async () => {
    // Validation criterion: "MCP endpoint returns 401 when JWT is missing".
    // The preHandler on the `/api/v1` scope owns this — we only need to
    // confirm the route is mounted INSIDE that scope (not outside).
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "initialize" },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json() as { error?: { code?: string } };
      expect(body.error?.code).toBe("AUTH_UNAUTHORIZED");
    } finally {
      await app.close();
    }
  });

  it("returns 401 AUTH_TOKEN_INVALID when a malformed JWT is sent", async () => {
    // Validation criterion: "MCP endpoint returns 401 when JWT is invalid".
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      ingestionCatalog: buildIngestionCatalog(),
    });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "initialize" },
        headers: { authorization: "Bearer not.a.jwt" },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json() as { error?: { code?: string } };
      expect(body.error?.code).toBe("AUTH_TOKEN_INVALID");
    } finally {
      await app.close();
    }
  });

  it("returns 200 + JSON-RPC initialize result when a valid JWT is sent", async () => {
    // Auth happy path: with a valid JWT the transport's `initialize`
    // dispatch runs through, confirming the route is mounted and reachable.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
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
        url: "/api/v1/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "initialize" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result?: { protocolVersion?: string } };
      expect(body.result?.protocolVersion).toBe("2024-11-05");
    } finally {
      await app.close();
    }
  });

  it("returns 200 + empty tools list when a valid JWT is sent but X-LLM-Run-Id header is missing (BR-21)", async () => {
    // Composed behaviour: auth passes, then the transport's BR-21 check
    // surfaces zero tools. The endpoint stays HTTP 200 (envelope semantics);
    // the LLM client sees an empty `tools` array and knows the ingest
    // toolset is not yet available.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
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
        url: "/api/v1/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result?: { tools?: unknown[] } };
      expect(body.result?.tools).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("returns 200 + four tools when both a valid JWT and X-LLM-Run-Id are sent", async () => {
    // End-to-end auth + session smoke test: with both credentials the
    // transport must surface the four ingest tools, each carrying the
    // JSON Schema derived from the canonical Zod source (BR-24).
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
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
        url: "/api/v1/mcp",
        payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
        headers: {
          authorization: `Bearer ${token}`,
          [LLM_RUN_HEADER]: RUN_ID,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result?: { tools: Array<{ name: string; inputSchema: unknown }> };
      };
      const names = (body.result?.tools ?? []).map((t) => t.name).sort();
      expect(names).toEqual([
        "propose_attribute",
        "propose_fragment",
        "propose_link",
        "propose_node",
      ]);
    } finally {
      await app.close();
    }
  });
});
