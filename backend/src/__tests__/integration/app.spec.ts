// TC-01 acceptance criteria covered:
//  - "GET /health returns 200" (when DB ping succeeds)
//  - "A request without Authorization header returns 401 AUTH_UNAUTHORIZED"
//  - "A request with an expired JWT returns 401 AUTH_TOKEN_EXPIRED"
//  - "pino emits JSON" (assertion via logger options at build time)
//
// Strategy: build the Fastify app with stub dependencies (pg pool that resolves
// `SELECT 1`, a stub Supabase auth that uses an in-memory JWKS resolver), then
// inject requests with Fastify's `app.inject()` — no real network, no real DB.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pino from "pino";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
} from "jose";

import { buildApp } from "../../app.js";
import type { Env } from "../../config/env.js";
import { buildMcpServer } from "../../mcp/server.js";
import { buildSupabaseAuth } from "../../middleware/auth.js";

/** Minimal pg.Pool surface used by the app (only `pingDatabase` is called). */
function fakePool(opts: { fail?: boolean } = {}): import("pg").Pool {
  const client = {
    query: async () => {
      if (opts.fail) {
        const err = Object.assign(new Error("ECONNREFUSED"), {
          code: "ECONNREFUSED",
        });
        throw err;
      }
      return { rows: [{ ok: 1 }], rowCount: 1 } as never;
    },
    release: () => undefined,
  };
  return {
    connect: async () => client as never,
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

async function signJwt(
  privateKey: CryptoKey,
  expSecondsFromNow: number
): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expSecondsFromNow)
    .sign(privateKey);
}

describe("Fastify app (integration)", () => {
  let fixture: AuthFixture;

  beforeAll(async () => {
    fixture = await buildAuthFixture();
  });

  afterAll(() => undefined);

  it("GET /health returns 200 when DB ping succeeds", async () => {
    // TC-01: BFF starts without errors; GET /health returns 200.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
      auth: buildSupabaseAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
    });
    try {
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.ok).toBe(true);
      expect(body.database).toBe("ok");
      expect(body.service).toBe("segundo-cerebro-bff");
      expect(typeof body.checked_at).toBe("string");
    } finally {
      await app.close();
    }
  });

  it("GET /health returns 503 when DB ping fails", async () => {
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool({ fail: true }),
      auth: buildSupabaseAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
    });
    try {
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(503);
      const body = res.json() as Record<string, unknown>;
      expect(body.ok).toBe(false);
      expect(body.database).toBe("unreachable");
    } finally {
      await app.close();
    }
  });

  it("returns 401 AUTH_UNAUTHORIZED on /api/v1/_self without Authorization header", async () => {
    // TC-01: request without Authorization header returns 401 AUTH_UNAUTHORIZED.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
      auth: buildSupabaseAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
    });
    try {
      const res = await app.inject({ method: "GET", url: "/api/v1/_self" });
      expect(res.statusCode).toBe(401);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("AUTH_UNAUTHORIZED");
    } finally {
      await app.close();
    }
  });

  it("returns 401 AUTH_TOKEN_EXPIRED on /api/v1/_self with an expired JWT", async () => {
    // TC-01: expired JWT -> 401 AUTH_TOKEN_EXPIRED.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
      auth: buildSupabaseAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
    });
    try {
      const token = await signJwt(fixture.privateKey, -60); // expired
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/_self",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.error.code).toBe("AUTH_TOKEN_EXPIRED");
    } finally {
      await app.close();
    }
  });

  it("returns 200 on /api/v1/_self when a valid JWT is supplied", async () => {
    // Happy path: BR-01 of knowledge-graph.back.md — auth scope opens up.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
      auth: buildSupabaseAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
    });
    try {
      const token = await signJwt(fixture.privateKey, 60); // valid 1 min
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/_self",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; result: { user_id: string } };
      expect(body.ok).toBe(true);
      expect(body.result.user_id).toBe("user-123");
    } finally {
      await app.close();
    }
  });

  it("returns 401 AUTH_TOKEN_INVALID on /api/v1/_self with a tampered JWT", async () => {
    // BR-01: malformed / wrong signature -> AUTH_TOKEN_INVALID.
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: fakePool(),
      auth: buildSupabaseAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(silentLogger),
    });
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/_self",
        headers: { authorization: "Bearer not.a.jwt" },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("AUTH_TOKEN_INVALID");
    } finally {
      await app.close();
    }
  });
});
