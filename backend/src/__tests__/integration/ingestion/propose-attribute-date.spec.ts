import pino from "pino";
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
const ATTR_KEY_GO_LIVE_ID = "cccccccc-cccc-4ccc-8ccc-ccccccccccc2";
const NODE_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd2";
const FRAGMENT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1";
const NEW_ATTRIBUTE_ID = "22222200-1111-4222-8333-000000000001";
const IMPOSSIBLE_DAY = "2024-02-30";
const LEAP_DAY = "2024-02-29";

interface Reply {
  readonly rows: readonly unknown[];
  readonly rowCount: number;
}

interface Recorder {
  attributesInserted: number;
}

type Handler = (sql: string, params: readonly unknown[]) => Reply | null;

const NONE: Reply = { rows: [], rowCount: 0 };

function one(row: unknown): Reply {
  return { rows: [row], rowCount: 1 };
}

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

function controlStatements(sql: string): Reply | null {
  const upper = sql.toUpperCase();
  const isTransaction = ["BEGIN", "COMMIT", "ROLLBACK"].includes(upper);
  const isSavepoint = /^(SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT)\b/.test(upper);
  return isTransaction || isSavepoint ? NONE : null;
}

function runAndNodeLookups(sql: string, params: readonly unknown[]): Reply | null {
  if (
    sql.startsWith("SELECT") &&
    sql.includes("FROM llm_run") &&
    sql.includes("WHERE id = $1")
  ) {
    return one(RUN_ROW);
  }
  if (sql.startsWith("SELECT node_type_id FROM knowledge_node")) {
    return params[0] === NODE_ID ? one({ node_type_id: NODE_TYPE_PROJECT_ID }) : NONE;
  }
  return null;
}

function evidenceLookups(sql: string): Reply | null {
  if (
    sql.startsWith('SELECT id, "text", llm_run_id') &&
    sql.includes("FROM information_fragment")
  ) {
    return one({ id: FRAGMENT_ID, text: "fragment text", llm_run_id: RUN_ID });
  }
  if (sql.startsWith("SELECT (metadata->>'document_date')")) {
    return one({ document_date: "2026-06-11" });
  }
  if (sql.includes("count(DISTINCT f.id)::text AS n")) {
    return one({ n: "1" });
  }
  if (sql.includes("FROM node_attribute") && sql.includes("FOR UPDATE")) {
    return NONE;
  }
  return null;
}

function writes(recorder: Recorder): Handler {
  return (sql) => {
    if (sql.startsWith("INSERT INTO node_attribute")) {
      recorder.attributesInserted += 1;
      return one({ id: NEW_ATTRIBUTE_ID });
    }
    if (
      sql.startsWith("INSERT INTO provenance") ||
      sql.startsWith("UPDATE information_fragment")
    ) {
      return { rows: [], rowCount: 1 };
    }
    return null;
  };
}

function buildFakePool(recorder: Recorder): import("pg").Pool {
  const handlers: Handler[] = [
    controlStatements,
    runAndNodeLookups,
    evidenceLookups,
    writes(recorder),
  ];
  const client = {
    query: async (...args: unknown[]): Promise<Reply> => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const params = (args[1] as unknown[] | undefined) ?? [];
      for (const handler of handlers) {
        const reply = handler(sql, params);
        if (reply !== null) return reply;
      }
      throw new Error(`fake client: unknown SQL: ${sql.slice(0, 160)}`);
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

function buildCatalog(): ReturnType<typeof buildSnapshot> {
  return buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_PROJECT_ID, name: "Project" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [
      {
        id: ATTR_KEY_GO_LIVE_ID,
        node_type_id: NODE_TYPE_PROJECT_ID,
        key: "go_live_date",
        value_type: "date",
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

async function buildAppOver(auth: AuthFixture, recorder: Recorder): Promise<App> {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(recorder),
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
      readonly details: Record<string, unknown>;
    };
  };
}

async function proposeDate(app: App, token: string, value: string): Promise<Answer> {
  const res = await app.inject({
    method: "POST",
    url: `/api/v1/ingest/llm-runs/${RUN_ID}/propose-attribute`,
    headers: { authorization: `Bearer ${token}` },
    payload: {
      node_id: NODE_ID,
      key: "go_live_date",
      value,
      confidence: 0.9,
      fragment_ids: [FRAGMENT_ID],
      valid_from_basis: "document",
      change_hint: "none",
    },
  });
  return { status: res.statusCode, body: res.json() as Answer["body"] };
}

describe("POST propose-attribute for a date key", () => {
  let auth: AuthFixture;
  let token: string;
  let recorder: Recorder;
  let app: App;

  beforeAll(async () => {
    auth = await buildAuthFixture();
    token = await signValidJwt(auth.privateKey);
  });

  beforeEach(async () => {
    recorder = { attributesInserted: 0 };
    app = await buildAppOver(auth, recorder);
  });

  afterEach(async () => {
    await app.close();
  });

  it("refuses the value 2024-02-30 with VALIDATION_INVALID_FORMAT naming the value and its value type", async () => {
    const answer = await proposeDate(app, token, IMPOSSIBLE_DAY);

    expect(answer.body.error).toMatchObject({
      code: "VALIDATION_INVALID_FORMAT",
      details: { value: IMPOSSIBLE_DAY, value_type: "date" },
    });
  });

  it("refuses the value 2024-02-30 for a date key and records no node attribute", async () => {
    const answer = await proposeDate(app, token, IMPOSSIBLE_DAY);

    expect(answer.body).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_INVALID_FORMAT" },
    });
    expect(recorder.attributesInserted).toBe(0);
  });

  it("answers the refusal of an impossible date as HTTP 200 carrying ok false and an error", async () => {
    const answer = await proposeDate(app, token, IMPOSSIBLE_DAY);

    expect(answer.status).toBe(200);
    expect(answer.body.ok).toBe(false);
    expect(answer.body.error).toBeDefined();
  });

  it("accepts the value 2024-02-29 for a date key and records the node attribute", async () => {
    const answer = await proposeDate(app, token, LEAP_DAY);

    expect(answer.body.ok).toBe(true);
    expect(recorder.attributesInserted).toBe(1);
  });
});
