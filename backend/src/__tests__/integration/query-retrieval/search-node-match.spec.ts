import { beforeAll, describe, expect, it } from "vitest";
import pino from "pino";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import type { Pool, PoolClient } from "pg";

import { buildApp } from "../../../app.js";
import type { Env } from "../../../config/env.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { buildNeonAuth } from "../../../middleware/auth.js";
import { buildSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";

const NODE_ID = "11111111-1111-4111-8111-111111111111";
const APPROXIMATE_SCORE = 0.72;
const APPROXIMATE_SIMILARITY = 0.8;
const RECEIVED_AT = new Date("2026-06-11T18:30:00Z");
const MCP_ACCEPT = "application/json, text/event-stream";
const TRANSACTION_STATEMENTS = new Set([
  "BEGIN",
  "BEGIN READ ONLY",
  "COMMIT",
  "ROLLBACK",
  "SELECT 1 AS OK",
]);

interface Rows {
  rows: unknown[];
  rowCount: number;
}

interface WireItem {
  kind: string;
  id: string;
  match?: string;
  similarity?: number;
}

interface JsonRpcEnvelope {
  result?: { content?: Array<{ type: string; text: string }>; isError?: boolean };
}

function result(rows: unknown[]): Rows {
  return { rows, rowCount: rows.length };
}

function idsIn(params: readonly unknown[]): string[] {
  const list: unknown = params.find((param) => Array.isArray(param));
  if (!Array.isArray(list)) return [];
  return list.filter((value): value is string => typeof value === "string");
}

function provenanceRow(anchorId: string): unknown {
  return {
    anchor_id: anchorId,
    fragment_id: `fragment-for-${anchorId}`,
    fragment_text: "texto",
    fragment_confidence: 0.9,
    raw_chunk_id: "chunk-1",
    offset_start: 0,
    offset_end: 5,
    excerpt: "texto",
    raw_information_id: "raw-1",
    source_type: "ata",
    received_at: RECEIVED_AT,
  };
}

function approximateNodeRow(): unknown {
  return {
    node_id: NODE_ID,
    canonical_name: "Petrobras",
    status: "active",
    score: APPROXIMATE_SCORE,
    similarity: APPROXIMATE_SIMILARITY,
    matched_alias_ids: [],
  };
}

function respond(sql: string, params: readonly unknown[]): Rows {
  if (TRANSACTION_STATEMENTS.has(sql.trim().toUpperCase())) return result([]);
  if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
    return result([{ q: "'petrobrass'" }]);
  }
  if (sql.includes("plainto_tsquery")) {
    return result(idsIn(params).map(provenanceRow));
  }
  if (sql.includes("word_similarity") && sql.includes("node_alias")) {
    return result([approximateNodeRow()]);
  }
  return result([]);
}

function buildFakePool(): Pool {
  const client = {
    query: async (sql: string, params: unknown[] = []): Promise<Rows> =>
      respond(String(sql), params),
    release: (): void => undefined,
  } as unknown as PoolClient;
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as Pool;
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

async function signValidJwt(privateKey: CryptoKey): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
    .sign(privateKey);
}

async function buildAppWith(fixture: AuthFixture) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    catalog: buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    }),
  });
}

type App = Awaited<ReturnType<typeof buildAppWith>>;

async function searchOverRest(app: App, token: string): Promise<WireItem[]> {
  const res = await app.inject({
    method: "GET",
    url: "/api/v1/search?query=Petrobrass&expand=false",
    headers: { authorization: `Bearer ${token}` },
  });
  return (res.json() as { result: { items: WireItem[] } }).result.items;
}

async function searchOverMcp(app: App, token: string): Promise<WireItem[]> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/mcp/query",
    headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
    payload: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search",
        arguments: { query: "Petrobrass", expand: false },
      },
    },
  });
  const envelope = res.json() as JsonRpcEnvelope;
  const text = envelope.result?.content?.[0]?.text ?? "null";
  return (JSON.parse(text) as { items: WireItem[] }).items;
}

function nodeItemsOf(items: readonly WireItem[]): unknown[] {
  return items
    .filter((item) => item.kind === "node")
    .map((item) => ({
      id: item.id,
      match: item.match ?? undefined,
      similarity: item.similarity ?? undefined,
    }));
}

const EXPECTED_APPROXIMATE_NODE_ITEMS = [
  { id: NODE_ID, match: "approximate", similarity: APPROXIMATE_SIMILARITY },
];

describe("query-retrieval search answer: the match of a knowledge node matched approximately", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("shows the match approximate and its similarity on the node item of the REST search answer", async () => {
    const app = await buildAppWith(fixture);
    try {
      const items = await searchOverRest(app, token);

      expect(nodeItemsOf(items)).toEqual(EXPECTED_APPROXIMATE_NODE_ITEMS);
    } finally {
      await app.close();
    }
  });

  it("shows the match approximate and its similarity on the node item of the MCP search answer", async () => {
    const app = await buildAppWith(fixture);
    try {
      const items = await searchOverMcp(app, token);

      expect(nodeItemsOf(items)).toEqual(EXPECTED_APPROXIMATE_NODE_ITEMS);
    } finally {
      await app.close();
    }
  });
});
