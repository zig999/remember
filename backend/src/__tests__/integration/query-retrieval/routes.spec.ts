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
import { buildNeonAuth } from "../../../middleware/auth.js";
import { buildSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";

/**
 * Unwrap the `{ ok: true, result }` success envelope returned by the QR REST
 * read endpoints (openapi v1.2.0; CLAUDE.md "REST devolve o envelope direto").
 * Success bodies are read through this; ERROR bodies stay raw
 * (`res.json() as { error: { code } }`) — the error envelope has no `result`.
 */
const okResult = (res: { json: () => unknown }): unknown =>
  (res.json() as { ok: true; result: unknown }).result;

// ---------------------------------------------------------------------------
// Fixture: fake DB store (minimal, scoped to the four scenarios we cover)
// ---------------------------------------------------------------------------

interface AcceptedFragmentFakeRow {
  fragment_id: string;
  fragment_text: string;
  fragment_confidence: number | string;
  fragment_llm_run_id: string;
  fragment_created_at: Date;
  raw_information_id: string;
  chunk_index: number;
  source_type: string;
  received_at: Date;
  document_title: string | null;
}

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
  /** TC-be-002: accepted-fragment rows keyed by `${llm_run_id}|${raw_information_id}`. */
  acceptedFragments: AcceptedFragmentFakeRow[];
  /** TC-be-002: predicate that decides which rows belong to a query. */
  acceptedFragmentFilter?: (
    row: AcceptedFragmentFakeRow,
    llmRunId: string | null,
    rawInformationId: string | null
  ) => boolean;
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
    acceptedFragments: [],
  };
}

/**
 * TC-be-002 helper — default filter mirrors the production SQL:
 *   - status excluded here (rows already represent `accepted`)
 *   - llm_run_id / raw_information_id intersection
 *   - tombstone short-circuit handled by removing the row from `acceptedFragments`
 *     in the fixture (the predicate does not re-check `tombstones`).
 */
function defaultAcceptedFragmentFilter(
  row: AcceptedFragmentFakeRow,
  llmRunId: string | null,
  rawInformationId: string | null
): boolean {
  if (llmRunId !== null && row.fragment_llm_run_id !== llmRunId) return false;
  if (
    rawInformationId !== null &&
    row.raw_information_id !== rawInformationId
  ) {
    return false;
  }
  return true;
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
      // Match only the dedicated `findTombstone` SQL — its SELECT lists
      // `executed_at` and binds an `ANY($1::uuid[])` array. Otherwise the
      // matcher would steal the `NOT EXISTS compliance_deletion` subquery
      // used by `listAcceptedFragments` (which embeds the same FROM clause).
      if (
        text.includes("FROM compliance_deletion") &&
        text.includes("executed_at") &&
        text.includes("ANY($1::uuid[])")
      ) {
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

      // ---- TC-be-002: listAcceptedFragments — count ----
      // (placed BEFORE generic tombstone/fragment-status matchers so the
      // shared `compliance_deletion` substring does not get stolen by the
      // later tombstone matcher; same reasoning for the DISTINCT-ON page.)
      if (
        text.includes("COUNT(DISTINCT f.id)") &&
        text.includes("information_fragment")
      ) {
        const llmRunId = (params[0] as string | null) ?? null;
        const rawId = (params[1] as string | null) ?? null;
        const filter = store.acceptedFragmentFilter ?? defaultAcceptedFragmentFilter;
        // The production SQL deduplicates on fragment.id; the fixture stores
        // each fragment once, so a uniqueness pass on `fragment_id` is enough.
        const matched = new Set<string>();
        for (const row of store.acceptedFragments) {
          if (filter(row, llmRunId, rawId)) matched.add(row.fragment_id);
        }
        return { rows: [{ total: matched.size }], rowCount: 1 };
      }

      // ---- TC-be-002: listAcceptedFragments — page (DISTINCT ON) ----
      if (
        text.includes("DISTINCT ON (f.id)") &&
        text.includes("information_fragment")
      ) {
        const llmRunId = (params[0] as string | null) ?? null;
        const rawId = (params[1] as string | null) ?? null;
        const limit = Number(params[2] ?? 20);
        const offset = Number(params[3] ?? 0);
        const filter = store.acceptedFragmentFilter ?? defaultAcceptedFragmentFilter;

        // Dedup by fragment_id (lowest chunk_index wins).
        const byId = new Map<string, AcceptedFragmentFakeRow>();
        for (const row of store.acceptedFragments) {
          if (!filter(row, llmRunId, rawId)) continue;
          const prev = byId.get(row.fragment_id);
          if (prev === undefined || row.chunk_index < prev.chunk_index) {
            byId.set(row.fragment_id, row);
          }
        }
        const deduped = Array.from(byId.values());

        // Sort: received_at DESC NULLS LAST, fragment_created_at DESC, fragment_id ASC.
        deduped.sort((a, b) => {
          const ra = a.received_at?.getTime() ?? -Infinity;
          const rb = b.received_at?.getTime() ?? -Infinity;
          if (rb !== ra) return rb - ra;
          const ca = a.fragment_created_at.getTime();
          const cb = b.fragment_created_at.getTime();
          if (cb !== ca) return cb - ca;
          return a.fragment_id < b.fragment_id ? -1 : a.fragment_id > b.fragment_id ? 1 : 0;
        });

        const page = deduped.slice(offset, offset + limit);
        return { rows: page, rowCount: page.length };
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
      const body = okResult(res) as {
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
        original_input: null,
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
        original_input: null,
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
      const body = okResult(res) as {
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

// ---------------------------------------------------------------------------
// TC-be-002 — GET /api/v1/fragments/accepted
// ---------------------------------------------------------------------------

describe("query-retrieval — GET /api/v1/fragments/accepted", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  const RUN_ID = "11111111-1111-4111-8111-111111111111";
  const RAW_ID = "22222222-2222-4222-8222-222222222222";

  function makeRow(over: Partial<AcceptedFragmentFakeRow>): AcceptedFragmentFakeRow {
    return {
      fragment_id: "aaaaaaaa-0000-4000-8000-000000000001",
      fragment_text: "Texto do fragmento.",
      fragment_confidence: 0.9,
      fragment_llm_run_id: RUN_ID,
      fragment_created_at: new Date("2026-06-11T18:31:14Z"),
      raw_information_id: RAW_ID,
      chunk_index: 0,
      source_type: "ata",
      received_at: new Date("2026-06-11T18:30:00Z"),
      document_title: "Ata Apollo",
      ...over,
    };
  }

  // Encodes WHY: the SPA CorrectionForm picker calls this endpoint with a
  // raw_information_id and expects { ok: true, result: { total, items, ... } }.
  // Drift in the envelope or field names would break the form (BR-26).
  it("returns 200 with paginated envelope on raw_information_id filter", async () => {
    const store = emptyStore();
    store.acceptedFragments = [makeRow({})];
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/fragments/accepted?raw_information_id=${RAW_ID}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        ok: true;
        result: {
          total: number;
          limit: number;
          offset: number;
          items: {
            fragment_id: string;
            text: string;
            confidence: number;
            llm_run_id: string;
            created_at: string;
            source: {
              raw_information_id: string;
              chunk_index: number;
              source_type: string;
              received_at: string;
              document_title: string | null;
            };
          }[];
        };
      };
      expect(body.ok).toBe(true);
      expect(body.result.total).toBe(1);
      expect(body.result.limit).toBe(20);
      expect(body.result.offset).toBe(0);
      expect(body.result.items.length).toBe(1);
      const item = body.result.items[0]!;
      expect(item.fragment_id).toBe("aaaaaaaa-0000-4000-8000-000000000001");
      expect(item.confidence).toBe(0.9);
      expect(item.created_at).toBe("2026-06-11T18:31:14.000Z");
      expect(item.source.raw_information_id).toBe(RAW_ID);
      expect(item.source.received_at).toBe("2026-06-11T18:30:00.000Z");
      expect(item.source.document_title).toBe("Ata Apollo");
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: omitting both filters would offer the entire fragments table.
  // The contract refuses with 422 and a structured `requires_one_of` detail
  // so the SPA can highlight the right form fields.
  it("returns 422 VALIDATION_INVALID_FORMAT when no filter is supplied", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/fragments/accepted",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as {
        ok: false;
        error: { code: string };
      };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: bad UUID at the boundary protects the SQL layer (cast
  // failures would surface as a generic 500 otherwise).
  it("returns 422 VALIDATION_INVALID_FORMAT on bad llm_run_id UUID", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/fragments/accepted?llm_run_id=not-a-uuid",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_INVALID_FORMAT");
    } finally {
      await app.close();
    }
  });

  it("returns 422 VALIDATION_INVALID_FORMAT on bad raw_information_id UUID", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/fragments/accepted?raw_information_id=still-not-a-uuid",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: limit > 100 must be refused — uncapped pages risk
  // memory pressure on the BFF + slow client renders.
  it("returns 422 when limit exceeds the maximum (100)", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/fragments/accepted?raw_information_id=${RAW_ID}&limit=250`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: JWT enforcement is shared (BR-01). The endpoint must NOT
  // bypass auth — a single carve-out would leak a fragment listing publicly.
  it("returns 401 without a JWT", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/fragments/accepted?raw_information_id=${RAW_ID}`,
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: a fragment that maps to two chunks must appear ONCE — the
  // contract is "what is available to cite", not the full chunk chain.
  it("returns each fragment exactly once even when it has multiple chunks", async () => {
    const store = emptyStore();
    store.acceptedFragments = [
      makeRow({ chunk_index: 3 }),
      makeRow({ chunk_index: 0 }), // first chunk by index — should be picked
      makeRow({ chunk_index: 1 }),
    ];
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/fragments/accepted?raw_information_id=${RAW_ID}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { total: number; items: { source: { chunk_index: number } }[] };
      };
      expect(body.result.total).toBe(1);
      expect(body.result.items.length).toBe(1);
      expect(body.result.items[0]!.source.chunk_index).toBe(0);
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: BR-14 tombstone short-circuit — compliance-deleted documents
  // must never surface as citable evidence (silent omission, not 410).
  it("silently omits fragments whose RawInformation is compliance-deleted", async () => {
    const store = emptyStore();
    // The production query has `NOT EXISTS compliance_deletion`. The fixture
    // models that exclusion via the filter predicate.
    store.acceptedFragmentFilter = (row, llmRunId, rawId) => {
      if (store.tombstones.has(row.raw_information_id)) return false;
      return defaultAcceptedFragmentFilter(row, llmRunId, rawId);
    };
    store.acceptedFragments = [makeRow({})];
    store.tombstones.set(RAW_ID, new Date("2026-06-11T19:00:00Z"));

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/fragments/accepted?raw_information_id=${RAW_ID}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { result: { total: number; items: unknown[] } };
      expect(body.result.total).toBe(0);
      expect(body.result.items).toEqual([]);
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: when both filters are supplied, the result must satisfy
  // BOTH (intersection) — not the union — so the picker can disambiguate
  // re-extractions over the same document.
  it("applies intersection semantics when both filters are supplied", async () => {
    const store = emptyStore();
    const OTHER_RUN = "33333333-3333-4333-8333-333333333333";
    const OTHER_RAW = "44444444-4444-4444-8444-444444444444";
    store.acceptedFragments = [
      makeRow({
        fragment_id: "aaaaaaaa-0000-4000-8000-00000000000a",
        fragment_llm_run_id: RUN_ID,
        raw_information_id: RAW_ID,
      }),
      makeRow({
        fragment_id: "aaaaaaaa-0000-4000-8000-00000000000b",
        fragment_llm_run_id: OTHER_RUN,
        raw_information_id: RAW_ID,
      }),
      makeRow({
        fragment_id: "aaaaaaaa-0000-4000-8000-00000000000c",
        fragment_llm_run_id: RUN_ID,
        raw_information_id: OTHER_RAW,
      }),
    ];
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/fragments/accepted?llm_run_id=${RUN_ID}&raw_information_id=${RAW_ID}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { total: number; items: { fragment_id: string }[] };
      };
      expect(body.result.total).toBe(1);
      expect(body.result.items[0]!.fragment_id).toBe(
        "aaaaaaaa-0000-4000-8000-00000000000a"
      );
    } finally {
      await app.close();
    }
  });

  // Encodes WHY: deterministic ordering is part of the contract — drift
  // would break SPA stable rendering / cursor expectations.
  it("orders by received_at DESC, created_at DESC, fragment_id ASC", async () => {
    const store = emptyStore();
    store.acceptedFragments = [
      makeRow({
        fragment_id: "aaaaaaaa-0000-4000-8000-00000000000a",
        received_at: new Date("2026-06-10T00:00:00Z"),
        fragment_created_at: new Date("2026-06-10T01:00:00Z"),
      }),
      makeRow({
        fragment_id: "aaaaaaaa-0000-4000-8000-00000000000b",
        received_at: new Date("2026-06-12T00:00:00Z"), // newer document
        fragment_created_at: new Date("2026-06-12T00:30:00Z"),
      }),
      makeRow({
        fragment_id: "aaaaaaaa-0000-4000-8000-00000000000c",
        received_at: new Date("2026-06-12T00:00:00Z"), // same document timestamp
        fragment_created_at: new Date("2026-06-12T00:10:00Z"), // older fragment
      }),
    ];
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/fragments/accepted?raw_information_id=${RAW_ID}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        result: { items: { fragment_id: string }[] };
      };
      expect(body.result.items.map((i) => i.fragment_id)).toEqual([
        "aaaaaaaa-0000-4000-8000-00000000000b",
        "aaaaaaaa-0000-4000-8000-00000000000c",
        "aaaaaaaa-0000-4000-8000-00000000000a",
      ]);
    } finally {
      await app.close();
    }
  });
});
