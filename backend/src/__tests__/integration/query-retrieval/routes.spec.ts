// Integration tests for the TC-06 query-retrieval routes.
//
// Acceptance criteria covered (validation.criteria of dev_tc_006):
//   - POST /search stopword-only query -> 422 BUSINESS_INVALID_SEARCH_QUERY
//   - POST /search expand=false skips traverseNodes()
//   - POST /search zero-result query -> 200 / total=0 / items=[]
//   - GET /provenance/links/{id} -> 410 BUSINESS_RAW_INFORMATION_DELETED on
//     tombstone
//   - GET /provenance/fragments/{id} non-accepted -> 404
//     BUSINESS_FRAGMENT_NOT_ACCEPTED
//
// Pattern mirrors the knowledge-graph integration suite: build the real
// Fastify app with a fake `pg.Pool` whose client interprets a small set of
// SQL templates. JWT auth is signed against a test JWKS the middleware
// accepts.

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
import { buildSupabaseAuth } from "../../../middleware/auth.js";
import { buildSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";

// ---------------------------------------------------------------------------
// Fixture: fake DB store (minimal, scoped to the four scenarios we cover)
// ---------------------------------------------------------------------------

interface Store {
  /** Drives the parsed-tsquery short-circuit. */
  parsedTsQueryByInput: Map<string, string>;
  /** Fragment hits returned by the fragment layer (per input). */
  fragmentHitsByQuery: Map<
    string,
    {
      id: string;
      text: string;
      confidence: number;
      status: "accepted";
      created_at: Date;
      score: number;
    }[]
  >;
  /** Whether the `knowledge_link` of the given id exists. */
  linkExists: Set<string>;
  /** Tombstones keyed by raw_information_id. */
  tombstones: Map<string, Date>;
  /** Provenance chain for `chainByLink` keyed on link_id. */
  chainByLink: Map<string, ChainRow[]>;
  /** Fragments with status (for getProvenanceByFragment). */
  fragments: Map<
    string,
    { id: string; status: "accepted" | "proposed" | "rejected" | "deleted" }
  >;
  /** Fragment-anchored provenance rows (used by chainByFragment). */
  chainByFragment: Map<string, ChainRow[]>;
  /** Count of traversal SQL invocations — asserts expand=false skips traverseNodes. */
  traversalCalls: number;
}

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

function emptyStore(): Store {
  return {
    parsedTsQueryByInput: new Map(),
    fragmentHitsByQuery: new Map(),
    linkExists: new Set(),
    tombstones: new Map(),
    chainByLink: new Map(),
    fragments: new Map(),
    chainByFragment: new Map(),
    traversalCalls: 0,
  };
}

// ---------------------------------------------------------------------------
// Fake pg client — interprets the SQL templates issued by the module.
// ---------------------------------------------------------------------------

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

      // ---- parsed tsquery check ----
      if (text.includes("websearch_to_tsquery") && text.includes("AS q")) {
        const input = String(params[1] ?? "");
        const parsed = store.parsedTsQueryByInput.get(input) ?? "";
        return { rows: [{ q: parsed }], rowCount: 1 };
      }

      // ---- fragment layer ----
      if (
        text.includes("FROM information_fragment f") &&
        text.includes("status = 'accepted'") &&
        text.includes("text_search @@ websearch_to_tsquery")
      ) {
        const input = String(params[1] ?? "");
        const rows = store.fragmentHitsByQuery.get(input) ?? [];
        return { rows, rowCount: rows.length };
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

      // ---- dedup join (fragment_source) ----
      if (
        text.includes("FROM fragment_source fs") &&
        text.includes("raw_chunk_id = ANY")
      ) {
        return { rows: [], rowCount: 0 };
      }

      // ---- provenance for fragment hits in search ----
      if (
        text.includes("FROM information_fragment f") &&
        text.includes("JOIN fragment_source fs ON fs.fragment_id = f.id") &&
        text.includes("WHERE f.id = ANY")
      ) {
        return { rows: [], rowCount: 0 };
      }

      // ---- traversal hop (knowledge-graph.traverseNodes) ----
      if (text.includes("FROM knowledge_link_resolved")) {
        store.traversalCalls += 1;
        return { rows: [], rowCount: 0 };
      }
      if (
        text.includes("FROM knowledge_node kn") &&
        text.includes("JOIN node_type nt")
      ) {
        return { rows: [], rowCount: 0 };
      }
      // NOTE: a more specific matcher for chainByLink runs below; keep the
      // generic "search-side provenance for links" matcher constrained to
      // the ANY($1::uuid[]) shape so it does not steal the chainByLink call.
      if (
        text.includes("FROM provenance p") &&
        text.includes("JOIN information_fragment f ON f.id = p.fragment_id") &&
        text.includes("p.link_id = ANY")
      ) {
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

      // ---- node_type listing / link_type listing / attribute_key listing ----
      if (text.includes("FROM node_type") && text.includes("ORDER BY")) {
        return { rows: [], rowCount: 0 };
      }
      if (text.includes("FROM link_type") && !text.includes("link_type_rule")) {
        return { rows: [], rowCount: 0 };
      }

      // Unknown — return empty so tests fail loud only on missing predicates.
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
// JWT + env fixtures (mirrors the knowledge-graph integration suite)
// ---------------------------------------------------------------------------

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
    auth: buildSupabaseAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    catalog: emptyCatalogSnapshot(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("query-retrieval — GET /api/v1/search", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns 422 BUSINESS_INVALID_SEARCH_QUERY on stopword-only query (parsed empty)", async () => {
    const store = emptyStore();
    // Postgres parses "o a de" to an empty tsquery -> service raises 422.
    store.parsedTsQueryByInput.set("o a de", "");
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/search?query=o%20a%20de",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string; details?: { parsed?: string } } };
      expect(body.error.code).toBe("BUSINESS_INVALID_SEARCH_QUERY");
      expect(body.error.details?.parsed).toBe("");
    } finally {
      await app.close();
    }
  });

  it("returns 200 / total=0 / items=[] for a zero-result query (BR-22)", async () => {
    const store = emptyStore();
    store.parsedTsQueryByInput.set("Iniciativa Lunar", "'iniciativa' & 'lunar'");
    // No fragment / node / chunk hits seeded -> zero result.
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/search?query=Iniciativa%20Lunar",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        query: string;
        total: number;
        items: unknown[];
        limit: number;
        offset: number;
      };
      expect(body.query).toBe("Iniciativa Lunar");
      expect(body.total).toBe(0);
      expect(body.items).toEqual([]);
      expect(body.limit).toBe(20);
      expect(body.offset).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("does NOT invoke traverseNodes() when expand=false", async () => {
    const store = emptyStore();
    store.parsedTsQueryByInput.set("Apollo", "'apollo'");
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/search?query=Apollo&expand=false",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(store.traversalCalls).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns 422 on layers[] outside the closed set", async () => {
    const store = emptyStore();
    store.parsedTsQueryByInput.set("Apollo", "'apollo'");
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/search?query=Apollo&layers=graph",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_INVALID_SEARCH_LAYER");
    } finally {
      await app.close();
    }
  });

  it("requires a valid JWT (401 without auth header)", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/search?query=anything",
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});

describe("query-retrieval — GET /api/v1/provenance/links/:link_id", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns 410 BUSINESS_RAW_INFORMATION_DELETED on tombstoned raw", async () => {
    const store = emptyStore();
    const linkId = "00000000-0000-4000-8000-000000000001";
    const rawId = "00000000-0000-4000-8000-0000000000aa";
    const deletedAt = new Date("2026-05-14T12:01:00Z");

    store.linkExists.add(linkId);
    store.chainByLink.set(linkId, [
      {
        fragment_id: "00000000-0000-4000-8000-000000000fff",
        fragment_text: "Some text",
        fragment_confidence: 0.9,
        fragment_status: "accepted",
        raw_chunk_id: "00000000-0000-4000-8000-000000000ccc",
        chunk_index: 0,
        offset_start: 0,
        offset_end: 9,
        excerpt: "Some text",
        locator: null,
        raw_information_id: rawId,
        source_type: "ata",
        received_at: new Date(),
        metadata: {},
      },
    ]);
    store.tombstones.set(rawId, deletedAt);

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/provenance/links/${linkId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(410);
      const body = res.json() as {
        error: {
          code: string;
          details?: { raw_information_id?: string; deleted_at?: string };
        };
      };
      expect(body.error.code).toBe("BUSINESS_RAW_INFORMATION_DELETED");
      expect(body.error.details?.raw_information_id).toBe(rawId);
      expect(body.error.details?.deleted_at).toBe(deletedAt.toISOString());
    } finally {
      await app.close();
    }
  });

  it("returns 404 RESOURCE_NOT_FOUND when the link does not exist", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/provenance/links/00000000-0000-4000-8000-000000000999",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

describe("query-retrieval — GET /api/v1/provenance/fragments/:fragment_id", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns 404 BUSINESS_FRAGMENT_NOT_ACCEPTED for non-accepted fragments", async () => {
    const store = emptyStore();
    const fid = "00000000-0000-4000-8000-000000000bbb";
    store.fragments.set(fid, { id: fid, status: "rejected" });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/provenance/fragments/${fid}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as {
        error: { code: string; details?: { status?: string } };
      };
      expect(body.error.code).toBe("BUSINESS_FRAGMENT_NOT_ACCEPTED");
      expect(body.error.details?.status).toBe("rejected");
    } finally {
      await app.close();
    }
  });

  it("returns 404 RESOURCE_NOT_FOUND when the fragment id is unknown", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/provenance/fragments/00000000-0000-4000-8000-000000000ccc",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("returns 200 with non-empty fragments[] / chunks[] on the happy path", async () => {
    const store = emptyStore();
    const fid = "00000000-0000-4000-8000-000000000aaa";
    const chunkId = "00000000-0000-4000-8000-0000000000cc";
    const rawId = "00000000-0000-4000-8000-0000000000ab";
    store.fragments.set(fid, { id: fid, status: "accepted" });
    store.chainByFragment.set(fid, [
      {
        fragment_id: fid,
        fragment_text: "Maria Oliveira coordena Apollo.",
        fragment_confidence: 0.92,
        fragment_status: "accepted",
        raw_chunk_id: chunkId,
        chunk_index: 0,
        offset_start: 0,
        offset_end: 31,
        excerpt: "Maria Oliveira coordena Apollo.",
        locator: { page: 1 },
        raw_information_id: rawId,
        source_type: "ata",
        received_at: new Date("2026-06-11T18:30:00Z"),
        metadata: { title: "Ata Apollo" },
      },
    ]);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/provenance/fragments/${fid}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        fragments: {
          id: string;
          status: string;
          chunks: { id: string; raw_information: { id: string; metadata: unknown } }[];
        }[];
      };
      expect(body.fragments.length).toBe(1);
      expect(body.fragments[0]!.id).toBe(fid);
      expect(body.fragments[0]!.status).toBe("accepted");
      expect(body.fragments[0]!.chunks.length).toBe(1);
      expect(body.fragments[0]!.chunks[0]!.raw_information.id).toBe(rawId);
    } finally {
      await app.close();
    }
  });
});
