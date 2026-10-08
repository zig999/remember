import { describe, expect, it } from "vitest";
import pino from "pino";
import type { LightMyRequestResponse } from "fastify";
import type { Pool } from "pg";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";

import { buildApp } from "../../../app.js";
import type { Env } from "../../../config/env.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { buildNeonAuth } from "../../../middleware/auth.js";

interface CurationActionStoredRow {
  id: string;
  action: string;
  target_kind: string;
  target_id: string | null;
  payload: Record<string, unknown>;
  reason: string | null;
  created_at: Date;
}

interface AuthFixture {
  publicJwk: JWK & { kid: string; alg: string };
  privateKey: CryptoKey;
}

interface QueryResult {
  rows: unknown[];
  rowCount: number;
}

const AUDIT_ACTIONS_URL = "/api/v1/audit/curation-actions";
const EDIT_ENTITY_ACTION_ID = "aa000001-0000-4000-8000-000000000000";
const MERGE_NODES_ACTION_ID = "aa000002-0000-4000-8000-000000000000";
const COMPLIANCE_DELETE_ACTION_ID = "aa000003-0000-4000-8000-000000000000";
const NODE_ID = "bb000001-0000-4000-8000-000000000000";
const RAW_ID = "bb000002-0000-4000-8000-000000000000";

const envFixture = Object.freeze({
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

function curationActionRow(
  overrides: Partial<CurationActionStoredRow>
): CurationActionStoredRow {
  return {
    id: EDIT_ENTITY_ACTION_ID,
    action: "edit_entity",
    target_kind: "node",
    target_id: NODE_ID,
    payload: {},
    reason: null,
    created_at: new Date("2026-10-01T12:00:00Z"),
    ...overrides,
  };
}

function filterByAction(
  rows: CurationActionStoredRow[],
  params: unknown[],
  sql: string
): CurationActionStoredRow[] {
  if (!sql.includes("action = $")) return rows;
  return rows.filter((r) => r.action === String(params[0]));
}

function answerCurationActionSql(
  rows: CurationActionStoredRow[],
  sql: string,
  params: unknown[]
): QueryResult {
  if (sql.includes("count(*)")) {
    const total = filterByAction(rows, params, sql).length;
    return { rows: [{ total }], rowCount: 1 };
  }
  if (sql.includes("WHERE id = $1")) {
    const found = rows.filter((r) => r.id === String(params[0]));
    return { rows: found, rowCount: found.length };
  }
  const filtered = filterByAction(rows, params, sql);
  const offset = Number(params[params.length - 1]);
  const limit = Number(params[params.length - 2]);
  const page = filtered.slice(offset, offset + limit);
  return { rows: page, rowCount: page.length };
}

function buildFakePool(rows: CurationActionStoredRow[]): Pool {
  const client = {
    query: async (sql: string, params: unknown[] = []): Promise<QueryResult> => {
      const text = sql.trim();
      if (text.includes("FROM curation_action")) {
        return answerCurationActionSql(rows, text, params);
      }
      throw new Error(`fake client: unknown SQL: ${text.slice(0, 200)}`);
    },
    release: (): undefined => undefined,
  };
  return {
    connect: async () => client,
    on: (): undefined => undefined,
    end: async (): Promise<void> => undefined,
  } as unknown as Pool;
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

async function getAsOwner(
  rows: CurationActionStoredRow[],
  url: string
): Promise<LightMyRequestResponse> {
  const fixture = await buildAuthFixture();
  const token = await signValidJwt(fixture.privateKey);
  const app = await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(rows),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
  });
  try {
    return await app.inject({
      method: "GET",
      url,
      headers: { authorization: `Bearer ${token}` },
    });
  } finally {
    await app.close();
  }
}

describe("Audit listing over curation actions of kind edit_entity", () => {
  it("returns an edit_entity curation action held in the store", async () => {
    const rows = [curationActionRow({ reason: "renamed" })];

    const res = await getAsOwner(rows, AUDIT_ACTIONS_URL);

    expect(res.statusCode).toBe(200);
    expect(res.json().items.map((i: { id: string }) => i.id)).toEqual([
      EDIT_ENTITY_ACTION_ID,
    ]);
  });

  it("returns only edit_entity actions when filtered by action=edit_entity", async () => {
    const rows = [
      curationActionRow({}),
      curationActionRow({ id: MERGE_NODES_ACTION_ID, action: "merge_nodes" }),
      curationActionRow({
        id: COMPLIANCE_DELETE_ACTION_ID,
        action: "compliance_delete",
        target_kind: "raw_information",
        target_id: RAW_ID,
      }),
    ];

    const res = await getAsOwner(rows, `${AUDIT_ACTIONS_URL}?action=edit_entity`);

    expect(res.statusCode).toBe(200);
    expect(res.json().items.map((i: { id: string }) => i.id)).toEqual([
      EDIT_ENTITY_ACTION_ID,
    ]);
    expect(res.json().total).toBe(1);
  });
});

describe("Audit listing action filter spelled with a hyphen", () => {
  it("answers 422 VALIDATION_INVALID_FORMAT for action=edit-entity", async () => {
    const rows = [curationActionRow({})];

    const res = await getAsOwner(rows, `${AUDIT_ACTIONS_URL}?action=edit-entity`);

    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe("VALIDATION_INVALID_FORMAT");
  });
});

describe("Reading one curation action of kind edit_entity", () => {
  it("answers 200 carrying the edit_entity action and its recorded fields", async () => {
    const payload = { changed: { name: "Acme Ltda" } };
    const rows = [curationActionRow({ payload, reason: "renamed" })];

    const res = await getAsOwner(rows, `${AUDIT_ACTIONS_URL}/${EDIT_ENTITY_ACTION_ID}`);

    expect(res.statusCode).toBe(200);
    expect(typeof res.json().action).toBe("string");
    expect(res.json()).toEqual({
      id: EDIT_ENTITY_ACTION_ID,
      action: res.json().action,
      target_kind: "node",
      target_id: NODE_ID,
      payload,
      reason: "renamed",
      created_at: "2026-10-01T12:00:00.000Z",
    });
  });
});
