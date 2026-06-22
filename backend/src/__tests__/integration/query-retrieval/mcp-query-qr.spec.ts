// Integration tests for the TC-04 MCP query transport — query-retrieval half.
//
// Acceptance criteria (validation.criteria of dev_tc_eqmt_004):
//   - POST /api/v1/mcp/query `tools/list` advertises the four query-retrieval
//     tool names: `search`, `get_provenance_link`, `get_provenance_attribute`,
//     `get_provenance_fragment` (alongside the nine knowledge-graph tools).
//   - tools/call search success parity with REST GET /api/v1/search.
//   - tools/call get_provenance_link 404 parity with REST.
//   - tools/call get_provenance_fragment BUSINESS_FRAGMENT_NOT_ACCEPTED
//     parity with REST.
//   - No tool_call rows written by any query-transport call (read-only).
//
// Strategy mirrors `mcp-query-kg.spec.ts`: build the real Fastify app with the
// same fake-pg pattern that `query-retrieval/routes.spec.ts` uses (the SAME
// seeded store powers BOTH REST and MCP in each test) so the two transports
// share the SAME service-layer codepath. JWT auth is signed against a test
// JWKS the middleware accepts.

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
import { QUERY_RETRIEVAL_TOOL_NAMES } from "../../../modules/query-retrieval/mcp/query-toolset.js";

// ---------------------------------------------------------------------------
// Fixture: fake DB store (subset of query-retrieval/routes.spec.ts, scoped to
// the three scenarios this suite covers).
// ---------------------------------------------------------------------------

interface ChainRow {
  fragment_id: string;
  fragment_text: string;
  fragment_confidence: number;
  fragment_status: "accepted" | "proposed" | "rejected" | "deleted";
  raw_chunk_id: string;
  chunk_index: number;
  offset_start: number;
  offset_end: number;
  excerpt: string;
  locator: Record<string, unknown> | null;
  raw_information_id: string;
  source_type: string;
  received_at: Date;
  metadata: Record<string, unknown>;
}

interface Store {
  parsedTsQueryByInput: Map<string, string>;
  linkExists: Set<string>;
  tombstones: Map<string, Date>;
  chainByLink: Map<string, ChainRow[]>;
  fragments: Map<
    string,
    { id: string; status: "accepted" | "proposed" | "rejected" | "deleted" }
  >;
  chainByFragment: Map<string, ChainRow[]>;
  /** Read-only invariant probe: any INSERT bumps this; MUST stay at 0. */
  insertCount: number;
}

function emptyStore(): Store {
  return {
    parsedTsQueryByInput: new Map(),
    linkExists: new Set(),
    tombstones: new Map(),
    chainByLink: new Map(),
    fragments: new Map(),
    chainByFragment: new Map(),
    insertCount: 0,
  };
}

function buildFakeClient(store: Store): import("pg").PoolClient {
  return {
    query: async (sql: string, params: unknown[] = []) => {
      const text = String(sql);
      const upper = text.trim().toUpperCase();
      if (
        upper === "BEGIN" ||
        upper === "BEGIN READ ONLY" ||
        upper === "COMMIT" ||
        upper === "ROLLBACK" ||
        upper === "SELECT 1 AS OK"
      ) {
        return { rows: [], rowCount: 0 };
      }

      // BR-23 rule 2: query transport never writes audit rows.
      if (upper.startsWith("INSERT INTO ")) {
        store.insertCount += 1;
        return { rows: [], rowCount: 0 };
      }

      // ---- parsed tsquery check ----
      if (text.includes("websearch_to_tsquery") && text.includes("AS q")) {
        const input = String(params[1] ?? "");
        const parsed = store.parsedTsQueryByInput.get(input) ?? "";
        return { rows: [{ q: parsed }], rowCount: 1 };
      }

      // ---- fragment layer (search) ----
      if (
        text.includes("FROM information_fragment f") &&
        text.includes("status = 'accepted'") &&
        text.includes("text_search @@ websearch_to_tsquery")
      ) {
        return { rows: [], rowCount: 0 };
      }

      // ---- node-alias layer ----
      if (
        text.includes("FROM node_alias na") &&
        text.includes("to_tsvector")
      ) {
        return { rows: [], rowCount: 0 };
      }

      // ---- chunk layer ----
      if (text.includes("FROM raw_chunk rc") && text.includes("text_search @@")) {
        return { rows: [], rowCount: 0 };
      }

      // ---- link existence check ----
      if (
        text.includes("FROM knowledge_link") &&
        text.includes("EXISTS") &&
        text.includes("WHERE id = $1")
      ) {
        const linkId = String(params[0]);
        return {
          rows: [{ exists: store.linkExists.has(linkId) }],
          rowCount: 1,
        };
      }

      // ---- chainByLink ----
      if (
        text.includes("FROM provenance p") &&
        text.includes("JOIN information_fragment f ON f.id = p.fragment_id") &&
        text.includes("p.link_id = $1")
      ) {
        const linkId = String(params[0]);
        const rows = store.chainByLink.get(linkId) ?? [];
        return { rows, rowCount: rows.length };
      }

      // ---- tombstone check ----
      if (text.includes("FROM compliance_deletion")) {
        const rawIds = (params[0] as string[]) ?? [];
        for (const rid of rawIds) {
          const dt = store.tombstones.get(rid);
          if (dt !== undefined) {
            return {
              rows: [{ raw_information_id: rid, performed_at: dt }],
              rowCount: 1,
            };
          }
        }
        return { rows: [], rowCount: 0 };
      }

      // ---- fragment status point read ----
      if (
        text.includes("FROM information_fragment") &&
        text.includes("WHERE id = $1") &&
        !text.includes("text_search")
      ) {
        const fid = String(params[0]);
        const row = store.fragments.get(fid);
        return row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      // ---- chainByFragment ----
      if (
        text.includes("FROM information_fragment f") &&
        text.includes("JOIN fragment_source fs ON fs.fragment_id = f.id") &&
        text.includes("WHERE f.id = $1")
      ) {
        const fid = String(params[0]);
        const rows = store.chainByFragment.get(fid) ?? [];
        return { rows, rowCount: rows.length };
      }

      // Fallback — empty rows for any SELECT we have not modelled (catalog
      // pre-warm, etc.). Writes are intercepted above.
      return { rows: [], rowCount: 0 };
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
}

function buildFakePool(store: Store): import("pg").Pool {
  return {
    connect: async () => buildFakeClient(store),
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

// ---------------------------------------------------------------------------
// JWT + env fixtures (mirrors query-retrieval/routes.spec.ts)
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

function emptyCatalogSnapshot() {
  return buildSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

async function buildAppWith(store: Store, fixture: AuthFixture) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    catalog: emptyCatalogSnapshot(),
  });
}

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

function rpcCall(name: string, args: Record<string, unknown>): unknown {
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
    // MCP tools/call result (2025-06-18): content blocks + optional isError.
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    // MCP tools/list result.
    tools?: Array<{ name: string; description?: string; inputSchema?: unknown }>;
  };
  error?: { code: number; message: string };
}

interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

/** Parse the JSON payload a successful MCP tools/call carries in its text block. */
function mcpOkPayload(body: JsonRpcEnvelope): unknown {
  return JSON.parse(body.result?.content?.[0]?.text ?? "null");
}

/** Parse the structured { code, message, details } an isError MCP result carries. */
function mcpErrPayload(body: JsonRpcEnvelope): {
  code: string;
  message: string;
  details?: unknown;
} {
  return JSON.parse(body.result?.content?.[0]?.text ?? "{}");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP query transport (QR) — tools/list (BR-25)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("advertises the four query-retrieval tool names", async () => {
    // Spec validation criterion: `search`, `get_provenance_link`,
    // `get_provenance_attribute`, `get_provenance_fragment` are present in
    // the union list. Asserted as containment (superset) so this test does
    // not break if/when other co-tenant domains add tools later.
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcList(),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      const names = ((body.result?.tools ?? []) as Array<{ name: string }>).map(
        (t) => t.name
      );
      for (const qrTool of QUERY_RETRIEVAL_TOOL_NAMES) {
        expect(names).toContain(qrTool);
      }
    } finally {
      await app.close();
    }
  });
});

describe("MCP query transport (QR) — search REST↔MCP parity (BR-25)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("zero-result search: identical payload to REST GET /search", async () => {
    // Drives both transports through searchKnowledgeService with no
    // fragment / node / chunk hits. The seeded `parsedTsQueryByInput`
    // entry keeps the parsed tsquery non-empty (BR-05 gate passes), so the
    // service runs to completion and returns total=0 / items=[].
    const store = emptyStore();
    store.parsedTsQueryByInput.set("Iniciativa Lunar", "'iniciativa' & 'lunar'");
    const app = await buildAppWith(store, fixture);
    try {
      const rest = await app.inject({
        method: "GET",
        url: "/api/v1/search?query=Iniciativa%20Lunar",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(rest.statusCode).toBe(200);
      const restBody = (rest.json() as { ok: true; result: unknown }).result;

      const mcp = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("search", { query: "Iniciativa Lunar" }),
      });
      expect(mcp.statusCode).toBe(200);
      const mcpBody = mcp.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.isError).toBeFalsy();
      // BR-25: byte-for-byte identical after stripping the MCP result envelope.
      expect(mcpOkPayload(mcpBody)).toEqual(restBody);

      // Read-only invariant.
      expect(store.insertCount).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("invalid-query parity: both surface BUSINESS_INVALID_SEARCH_QUERY", async () => {
    // Stopword-only input -> parsed tsquery empty -> service throws
    // InvalidSearchQueryError. REST renders 422 + BUSINESS_INVALID_SEARCH_QUERY;
    // MCP renders { ok: false, error.code: BUSINESS_INVALID_SEARCH_QUERY }.
    const store = emptyStore();
    store.parsedTsQueryByInput.set("o a de", "");
    const app = await buildAppWith(store, fixture);
    try {
      const rest = await app.inject({
        method: "GET",
        url: "/api/v1/search?query=o%20a%20de",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(rest.statusCode).toBe(422);
      const restErr = (rest.json() as ErrorEnvelope).error;
      expect(restErr.code).toBe("BUSINESS_INVALID_SEARCH_QUERY");

      const mcp = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("search", { query: "o a de" }),
      });
      expect(mcp.statusCode).toBe(200);
      const mcpBody = mcp.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.isError).toBe(true);
      expect(mcpErrPayload(mcpBody).code).toBe(restErr.code);

      expect(store.insertCount).toBe(0);
    } finally {
      await app.close();
    }
  });
});

describe(
  "MCP query transport (QR) — get_provenance_link 404 parity (BR-25)",
  () => {
    let fixture: AuthFixture;
    let token: string;
    beforeAll(async () => {
      fixture = await buildAuthFixture();
      token = await signValidJwt(fixture.privateKey);
    });

    it("unknown link id: REST and MCP both surface RESOURCE_NOT_FOUND", async () => {
      const store = emptyStore();
      const unknownId = "00000000-0000-4000-8000-0000deadbeef";
      const app = await buildAppWith(store, fixture);
      try {
        const rest = await app.inject({
          method: "GET",
          url: `/api/v1/provenance/links/${unknownId}`,
          headers: { authorization: `Bearer ${token}` },
        });
        expect(rest.statusCode).toBe(404);
        const restErr = (rest.json() as ErrorEnvelope).error;
        expect(restErr.code).toBe("RESOURCE_NOT_FOUND");

        const mcp = await app.inject({
          method: "POST",
          url: "/api/v1/mcp/query",
          headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
          payload: rpcCall("get_provenance_link", { link_id: unknownId }),
        });
        expect(mcp.statusCode).toBe(200);
        const mcpBody = mcp.json() as JsonRpcEnvelope;
        expect(mcpBody.result?.isError).toBe(true);
        expect(mcpErrPayload(mcpBody).code).toBe(restErr.code);

        expect(store.insertCount).toBe(0);
      } finally {
        await app.close();
      }
    });
  }
);

describe(
  "MCP query transport (QR) — get_provenance_fragment BUSINESS_FRAGMENT_NOT_ACCEPTED parity (BR-25)",
  () => {
    let fixture: AuthFixture;
    let token: string;
    beforeAll(async () => {
      fixture = await buildAuthFixture();
      token = await signValidJwt(fixture.privateKey);
    });

    it("rejected fragment: REST and MCP both surface BUSINESS_FRAGMENT_NOT_ACCEPTED", async () => {
      const store = emptyStore();
      const fid = "00000000-0000-4000-8000-000000000bbb";
      store.fragments.set(fid, { id: fid, status: "rejected" });
      const app = await buildAppWith(store, fixture);
      try {
        const rest = await app.inject({
          method: "GET",
          url: `/api/v1/provenance/fragments/${fid}`,
          headers: { authorization: `Bearer ${token}` },
        });
        expect(rest.statusCode).toBe(404);
        const restErr = (rest.json() as ErrorEnvelope).error;
        expect(restErr.code).toBe("BUSINESS_FRAGMENT_NOT_ACCEPTED");

        const mcp = await app.inject({
          method: "POST",
          url: "/api/v1/mcp/query",
          headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
          payload: rpcCall("get_provenance_fragment", { fragment_id: fid }),
        });
        expect(mcp.statusCode).toBe(200);
        const mcpBody = mcp.json() as JsonRpcEnvelope;
        expect(mcpBody.result?.isError).toBe(true);
        const errPayload = mcpErrPayload(mcpBody);
        expect(errPayload.code).toBe(restErr.code);
        // Detail surface parity — `status: "rejected"` is part of the
        // shared error-envelope (TC-01); both transports MUST carry it.
        expect(
          (errPayload.details as { status?: string } | undefined)?.status
        ).toBe("rejected");

        expect(store.insertCount).toBe(0);
      } finally {
        await app.close();
      }
    });
  }
);
