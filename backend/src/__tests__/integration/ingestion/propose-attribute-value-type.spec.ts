import pino from "pino";
import type { Pool, PoolClient } from "pg";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";

import { buildApp } from "../../../app.js";
import type { Env } from "../../../config/env.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { buildNeonAuth } from "../../../middleware/auth.js";
import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";

const RUN_ID = "c0c0c0c0-1111-4222-8333-100000000001";
const RAW_INFO_ID = "11111111-1111-4111-8111-111111111111";
const NODE_TYPE_PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const ATTR_KEY_HEADCOUNT_ID = "cccccccc-cccc-4ccc-8ccc-ccccccccccc3";
const ATTR_KEY_IS_ACTIVE_ID = "cccccccc-cccc-4ccc-8ccc-ccccccccccc4";
const NODE_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd2";
const FRAGMENT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1";
const FIRST_NON_FINITE_DIGITS = `1${"0".repeat(309)}`;
const HTTP_UNPROCESSABLE = 422;
const HTTP_OK = 200;

interface Reply {
  readonly rows: readonly unknown[];
  readonly rowCount: number;
}

const NONE: Reply = { rows: [], rowCount: 0 };

const RUN_ROW = {
  id: RUN_ID,
  model: "claude",
  prompt_version: "v1",
  started_at: new Date("2026-06-12T10:00:00Z"),
  finished_at: null,
  status: "running",
  attempts: 1,
  input_raw_information_id: RAW_INFO_ID,
  idempotency_key:
    "0011223344556677889900112233445566778899aabbccddeeff00112233aabb",
};

function answerFor(sql: string, params: readonly unknown[]): Reply | null {
  const upper = sql.toUpperCase();
  if (["BEGIN", "COMMIT", "ROLLBACK"].includes(upper)) return NONE;
  if (/^(SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT)\b/.test(upper)) return NONE;
  if (
    sql.startsWith("SELECT") &&
    sql.includes("FROM llm_run") &&
    sql.includes("WHERE id = $1")
  ) {
    return { rows: [RUN_ROW], rowCount: 1 };
  }
  if (sql.startsWith("SELECT node_type_id FROM knowledge_node")) {
    return params[0] === NODE_ID
      ? { rows: [{ node_type_id: NODE_TYPE_PROJECT_ID }], rowCount: 1 }
      : NONE;
  }
  return null;
}

function buildFakePool(): Pool {
  const client = {
    query: async (...args: unknown[]): Promise<Reply> => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const params = (args[1] as unknown[] | undefined) ?? [];
      const reply = answerFor(sql, params);
      if (reply === null) {
        throw new Error(`fake client: unknown SQL: ${sql.slice(0, 160)}`);
      }
      return reply;
    },
    release: () => undefined,
  } as unknown as PoolClient;
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as Pool;
}

function buildCatalog(): ReturnType<typeof buildSnapshot> {
  return buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_PROJECT_ID, name: "Project" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [
      {
        id: ATTR_KEY_HEADCOUNT_ID,
        node_type_id: NODE_TYPE_PROJECT_ID,
        key: "headcount",
        value_type: "number",
        is_temporal: false,
        allows_multiple_current: false,
        requires_valid_from: false,
      },
      {
        id: ATTR_KEY_IS_ACTIVE_ID,
        node_type_id: NODE_TYPE_PROJECT_ID,
        key: "is_active",
        value_type: "bool",
        is_temporal: false,
        allows_multiple_current: false,
        requires_valid_from: false,
      },
    ],
  });
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
  ANTHROPIC_API_KEY: "test-anthropic-key",
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

type App = Awaited<ReturnType<typeof buildApp>>;

async function buildAppOver(auth: AuthFixture): Promise<App> {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...auth.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    ingestionCatalog: buildCatalog(),
  });
}

interface Answer {
  readonly status: number;
  readonly body: {
    readonly ok: boolean;
    readonly error?: {
      readonly code: string;
      readonly details: unknown;
    };
  };
}

interface Proposal {
  readonly key: string;
  readonly value: unknown;
}

async function propose(app: App, token: string, proposal: Proposal): Promise<Answer> {
  const res = await app.inject({
    method: "POST",
    url: `/api/v1/ingest/llm-runs/${RUN_ID}/propose-attribute`,
    headers: { authorization: `Bearer ${token}` },
    payload: {
      node_id: NODE_ID,
      key: proposal.key,
      value: proposal.value,
      confidence: 0.9,
      fragment_ids: [FRAGMENT_ID],
      valid_from_basis: "document",
      change_hint: "none",
    },
  });
  return { status: res.statusCode, body: res.json() as Answer["body"] };
}

describe("POST propose-attribute for a number-typed or bool-typed key", () => {
  let auth: AuthFixture;
  let token: string;
  let app: App;

  beforeAll(async () => {
    auth = await buildAuthFixture();
    token = await signValidJwt(auth.privateKey);
  });

  beforeEach(async () => {
    app = await buildAppOver(auth);
  });

  afterEach(async () => {
    await app.close();
  });

  it("refuses a string of digits too large to be a finite number with VALIDATION_INVALID_FORMAT naming the value and its value type", async () => {
    const answer = await propose(app, token, {
      key: "headcount",
      value: FIRST_NON_FINITE_DIGITS,
    });

    expect(answer.body.error).toMatchObject({
      code: "VALIDATION_INVALID_FORMAT",
      details: { value: FIRST_NON_FINITE_DIGITS, value_type: "number" },
    });
  });

  it("refuses the value 1 for a bool key with VALIDATION_INVALID_FORMAT naming the value and its value type", async () => {
    const answer = await propose(app, token, { key: "is_active", value: "1" });

    expect(answer.body.error).toMatchObject({
      code: "VALIDATION_INVALID_FORMAT",
      details: { value: "1", value_type: "bool" },
    });
  });

  it("answers the refusal of the bool value 1 as HTTP 200 carrying ok false and an error", async () => {
    const answer = await propose(app, token, { key: "is_active", value: "1" });

    expect(answer).toMatchObject({
      status: HTTP_OK,
      body: { ok: false, error: { code: "VALIDATION_INVALID_FORMAT" } },
    });
  });

  it("refuses a value carried as the number 1 instead of text as a malformed proposal with HTTP 422 listing the value field", async () => {
    const answer = await propose(app, token, { key: "is_active", value: 1 });

    expect(answer).toMatchObject({
      status: HTTP_UNPROCESSABLE,
      body: {
        ok: false,
        error: {
          code: "VALIDATION_INVALID_FORMAT",
          details: expect.arrayContaining([expect.objectContaining({ path: "value" })]),
        },
      },
    });
  });
});
