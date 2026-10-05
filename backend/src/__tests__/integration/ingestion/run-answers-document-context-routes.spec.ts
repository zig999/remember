import { expect, it } from "vitest";
import pino from "pino";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";

import { buildApp } from "../../../app.js";
import type { Env } from "../../../config/env.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { buildNeonAuth } from "../../../middleware/auth.js";
import {
  DOCUMENT_CONTEXT,
  HOLDS_NONE,
  RUN_ID,
  runReadPool,
  type HeldDocumentContext,
} from "../../unit/ingestion/run-document-context-fixture.js";

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

const authFixture = buildAuthFixture();

async function signValidJwt(privateKey: CryptoKey): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
    .sign(privateKey);
}

async function getRunAnswer(
  held: HeldDocumentContext,
  promptVersion: string
): Promise<Record<string, unknown>> {
  const fixture = await authFixture;
  const token = await signValidJwt(fixture.privateKey);
  const app = await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: runReadPool({
      status: "completed",
      prompt_version: promptVersion,
      held,
    }),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
  });
  try {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/ingest/llm-runs/${RUN_ID}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    return res.json() as Record<string, unknown>;
  } finally {
    await app.close();
  }
}

it("carries the document context status of a run that holds one over REST", async () => {
  const body = await getRunAnswer({ status: "too-long", context: null }, "v5");

  expect(body.document_context_status).toBe("too-long");
});

it("carries the whole document context of a run that holds one over REST", async () => {
  const body = await getRunAnswer(
    { status: "produced", context: DOCUMENT_CONTEXT },
    "v5"
  );

  expect(body.document_context).toEqual(DOCUMENT_CONTEXT);
});

it("carries each entity of the document context with its node type and every name in the recorded order over REST", async () => {
  const body = await getRunAnswer(
    { status: "produced", context: DOCUMENT_CONTEXT },
    "v5"
  );

  const context = body.document_context as { entities: unknown };
  expect(context.entities).toEqual(DOCUMENT_CONTEXT.entities);
});

it("carries no document context for a run that holds none over REST", async () => {
  const body = await getRunAnswer({ status: "failed", context: null }, "v5");

  expect(body.document_context ?? null).toBeNull();
});

it("carries no document context status for a run that holds none over REST", async () => {
  const body = await getRunAnswer(HOLDS_NONE, "v4");

  expect(body.document_context_status ?? null).toBeNull();
});
