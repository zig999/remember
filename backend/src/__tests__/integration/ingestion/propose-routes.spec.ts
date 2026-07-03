// TC-13 — Integration tests for the four propose-* REST mirror routes.
//
// Acceptance criteria addressed here:
//   - "POST /llm-runs/:id/propose-fragment returns 200 with ok:true envelope
//      when run is running and input is valid"
//   - "POST /llm-runs/:id/propose-fragment returns 200 with ok:false
//      VALIDATION_INVALID_FORMAT envelope when chunk_ids do not belong to the
//      run's source (service-level layered-validation rejection — BR-13). P2.1
//      namespaced; deprecated shorthand: STRUCTURAL_INVALID."
//   - "POST /llm-runs/:id/propose-node returns 409 BUSINESS_RUN_NOT_RUNNING
//      when run exists but is completed"
//   - "POST /llm-runs/:id/propose-link returns 404 RESOURCE_NOT_FOUND when
//      llmRunId is unknown"
//   - "POST /llm-runs/:id/propose-attribute returns 422 on Zod parse failure
//      (malformed body / missing required field)"
//   - "all four mirrors call the same service function as the MCP handler
//      (no duplicated business logic)"
//
// Strategy: build the real Fastify app with a fake `pg.Pool` that hands out a
// fake `PoolClient` backed by an in-memory store. Auth is bypassed by signing
// a valid RS256 JWT against a test JWKS the middleware accepts. The catalog
// is built from in-memory seed data (Person/Project, participates_in, project_name).
//
// Note on the envelope semantics (BR-28 / SD-1 in delivery): any
// `ValidationFailure` raised by the propose-* service surfaces as HTTP 200
// with `{ ok: false, error: ... }`. ZodErrors at the route boundary continue
// to surface as HTTP 422 via the global error handler — see the inference log
// in the delivery report for the rationale.

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
import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";

// ---------------------------------------------------------------------------
// Fixture identifiers — typed-UUID layout matches `z.string().uuid()`.
// ---------------------------------------------------------------------------

const RUN_RUNNING_ID = "c0c0c0c0-1111-4222-8333-100000000001";
const RUN_COMPLETED_ID = "c0c0c0c0-1111-4222-8333-100000000002";
const UNKNOWN_RUN_ID = "00000000-0000-4000-8000-000000000000";
const RAW_INFO_ID = "11111111-1111-4111-8111-111111111111";
const NODE_TYPE_PERSON_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const NODE_TYPE_PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const LINK_TYPE_PARTICIPATES_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";
const ATTR_KEY_PROJECT_NAME_ID = "cccccccc-cccc-4ccc-8ccc-ccccccccccc1";
const SOURCE_NODE_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd1";
const TARGET_NODE_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd2";
const FRAGMENT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1";
const CHUNK_VALID_ID = "ffffffff-ffff-4fff-8fff-fffffffffff1";
const CHUNK_OTHER_SOURCE_ID = "ffffffff-ffff-4fff-8fff-fffffffffff2";

// ---------------------------------------------------------------------------
// Fake store + client. We model JUST the queries the propose-* services and
// the route's pre-check make. Unknown SQL throws so unexpected queries fail
// loudly.
// ---------------------------------------------------------------------------

interface FakeStore {
  llm_runs: Map<string, {
    id: string;
    model: string;
    prompt_version: string;
    started_at: Date;
    finished_at: Date | null;
    status: "running" | "completed" | "failed";
    attempts: number;
    input_raw_information_id: string;
    idempotency_key: string;
  }>;
  fragments_inserted: number;
  fragment_sources_inserted: number;
  nodes_inserted: number;
  links_inserted: number;
  attributes_inserted: number;
  provenance_inserted: number;
  uuidCounter: { n: number };
}

function emptyStore(): FakeStore {
  return {
    llm_runs: new Map(),
    fragments_inserted: 0,
    fragment_sources_inserted: 0,
    nodes_inserted: 0,
    links_inserted: 0,
    attributes_inserted: 0,
    provenance_inserted: 0,
    uuidCounter: { n: 0 },
  };
}

function nextUuid(store: FakeStore, prefixHex: string): string {
  store.uuidCounter.n += 1;
  const suffix = store.uuidCounter.n.toString(16).padStart(12, "0");
  const head = prefixHex.padStart(8, "0").slice(0, 8);
  return `${head}-1111-4222-8333-${suffix}`;
}

function seedRunningRun(store: FakeStore, id: string): void {
  store.llm_runs.set(id, {
    id,
    model: "claude",
    prompt_version: "v1",
    started_at: new Date("2026-06-12T10:00:00Z"),
    finished_at: null,
    status: "running",
    attempts: 1,
    input_raw_information_id: RAW_INFO_ID,
    idempotency_key:
      "0011223344556677889900112233445566778899aabbccddeeff00112233aabb",
  });
}

function seedCompletedRun(store: FakeStore, id: string): void {
  store.llm_runs.set(id, {
    id,
    model: "claude",
    prompt_version: "v1",
    started_at: new Date("2026-06-12T09:00:00Z"),
    finished_at: new Date("2026-06-12T09:30:00Z"),
    status: "completed",
    attempts: 1,
    input_raw_information_id: RAW_INFO_ID,
    idempotency_key:
      "11223344556677889900112233445566778899aabbccddeeff00112233aabbcc",
  });
}

function buildFakeClient(store: FakeStore): import("pg").PoolClient {
  return {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const params = (args[1] as unknown[]) ?? [];
      const upper = sql.toUpperCase();
      if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }
      if (upper === "SELECT 1 AS OK") return { rows: [{ ok: 1 }], rowCount: 1 };

      // SELECT llm_run by id (route pre-check + aggregate)
      if (
        sql.startsWith("SELECT") &&
        sql.includes("FROM llm_run") &&
        sql.includes("WHERE id = $1")
      ) {
        const row = store.llm_runs.get(String(params[0]));
        if (!row) return { rows: [], rowCount: 0 };
        return { rows: [row], rowCount: 1 };
      }

      // propose_fragment chunk-source count
      if (sql.startsWith("SELECT count(*)::text AS n FROM raw_chunk") && sql.includes("WHERE id = ANY")) {
        // First call uses (chunk_ids, expected_raw_information_id) — must match RAW_INFO_ID
        // Second call (disambiguation) uses only (chunk_ids).
        const chunkIds = params[0] as string[];
        if (params.length >= 2) {
          // First call — must match the run's source.
          const expectedRawId = String(params[1]);
          const matchCount = chunkIds.filter(
            (id) => id === CHUNK_VALID_ID && expectedRawId === RAW_INFO_ID
          ).length;
          return { rows: [{ n: String(matchCount) }], rowCount: 1 };
        }
        // Disambiguation — exists-only.
        const existCount = chunkIds.filter(
          (id) => id === CHUNK_VALID_ID || id === CHUNK_OTHER_SOURCE_ID
        ).length;
        return { rows: [{ n: String(existCount) }], rowCount: 1 };
      }

      // INSERT into information_fragment (and its sources)
      if (sql.startsWith("INSERT INTO information_fragment")) {
        store.fragments_inserted += 1;
        const fragId = nextUuid(store, "fa9add00");
        return { rows: [{ id: fragId }], rowCount: 1 };
      }
      if (sql.startsWith("INSERT INTO fragment_source")) {
        store.fragment_sources_inserted += 1;
        return { rows: [], rowCount: 1 };
      }

      // propose_node — lock key compose SELECT
      if (sql.startsWith("SELECT (CAST")) {
        return { rows: [{ key: "lockkey" }], rowCount: 1 };
      }
      // propose_node — advisory lock
      if (sql.toLowerCase().includes("pg_advisory_xact_lock")) {
        return { rows: [{}], rowCount: 1 };
      }
      if (
        sql.startsWith("SELECT na.node_id") &&
        sql.includes("FROM node_alias na") &&
        sql.includes("JOIN knowledge_node kn")
      ) {
        // No existing match — fall through to trigram path.
        return { rows: [], rowCount: 0 };
      }
      if (
        sql.startsWith("SELECT na.node_id") &&
        sql.includes("similarity(na.alias_norm")
      ) {
        // No trigram candidates — caller will create a new node.
        return { rows: [], rowCount: 0 };
      }

      // INSERT knowledge_node
      if (sql.startsWith("INSERT INTO knowledge_node")) {
        store.nodes_inserted += 1;
        const nodeId = nextUuid(store, "bea7be00");
        return { rows: [{ id: nodeId }], rowCount: 1 };
      }
      if (sql.startsWith("INSERT INTO node_alias")) {
        return { rows: [], rowCount: 1 };
      }

      // propose_link — node_type_id lookup
      if (sql.startsWith("SELECT node_type_id FROM knowledge_node")) {
        const id = String(params[0]);
        if (id === SOURCE_NODE_ID) {
          return { rows: [{ node_type_id: NODE_TYPE_PERSON_ID }], rowCount: 1 };
        }
        if (id === TARGET_NODE_ID) {
          return { rows: [{ node_type_id: NODE_TYPE_PROJECT_ID }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      // information_fragment existence check
      if (
        sql.startsWith("SELECT id, \"text\", llm_run_id") &&
        sql.includes("FROM information_fragment") &&
        sql.includes("WHERE id = ANY")
      ) {
        const fragIds = params[0] as string[];
        const rows = fragIds
          .filter((id) => id === FRAGMENT_ID)
          .map((id) => ({ id, text: "fragment text", llm_run_id: RUN_RUNNING_ID }));
        return { rows, rowCount: rows.length };
      }

      // document_date lookup
      if (sql.startsWith("SELECT (metadata->>'document_date')")) {
        return { rows: [{ document_date: "2026-06-11" }], rowCount: 1 };
      }

      // anti-hallucination count of anchored fragments
      if (sql.includes("count(DISTINCT f.id)::text AS n")) {
        const fragIds = (params[0] as string[]) ?? [];
        const expectedRaw = String(params[1] ?? "");
        const anchored =
          fragIds.filter((id) => id === FRAGMENT_ID).length *
          (expectedRaw === RAW_INFO_ID ? 1 : 0);
        return { rows: [{ n: String(anchored) }], rowCount: 1 };
      }

      // graph-consolidator SAVEPOINT statements
      if (upper.startsWith("SAVEPOINT") || upper.startsWith("RELEASE SAVEPOINT") || upper.startsWith("ROLLBACK TO SAVEPOINT")) {
        return { rows: [], rowCount: 0 };
      }

      // graph-consolidator vigent-row lookup (link + attribute)
      if (
        sql.includes("FROM knowledge_link") &&
        sql.includes("FOR UPDATE")
      ) {
        // No vigent row in scope -> accepted-new branch.
        return { rows: [], rowCount: 0 };
      }
      if (
        sql.includes("FROM node_attribute") &&
        sql.includes("FOR UPDATE")
      ) {
        return { rows: [], rowCount: 0 };
      }

      // INSERT knowledge_link
      if (sql.startsWith("INSERT INTO knowledge_link")) {
        store.links_inserted += 1;
        const linkId = nextUuid(store, "11111100");
        return { rows: [{ id: linkId }], rowCount: 1 };
      }
      // INSERT node_attribute
      if (sql.startsWith("INSERT INTO node_attribute")) {
        store.attributes_inserted += 1;
        const attrId = nextUuid(store, "22222200");
        return { rows: [{ id: attrId }], rowCount: 1 };
      }
      // INSERT provenance
      if (sql.startsWith("INSERT INTO provenance")) {
        const fragIds = (params[1] as string[]) ?? [];
        store.provenance_inserted += fragIds.length;
        return { rows: [], rowCount: fragIds.length };
      }
      // UPDATE information_fragment — §6.6 proposed -> accepted promotion that
      // follows every provenance write in graph-consolidation.service.ts.
      if (sql.startsWith("UPDATE information_fragment")) {
        return { rows: [], rowCount: ((params[0] as string[] | undefined) ?? []).length };
      }

      throw new Error(`fake client (propose): unknown SQL: ${sql.slice(0, 160)}`);
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
}

function buildFakePool(store: FakeStore): import("pg").Pool {
  const client = buildFakeClient(store);
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

// ---------------------------------------------------------------------------
// Catalog snapshot. Person/Project node types, participates_in link type,
// plus a `project_name` attribute key on Project.
// ---------------------------------------------------------------------------

function buildCatalog() {
  return buildSnapshot({
    nodeTypes: [
      { id: NODE_TYPE_PERSON_ID, name: "Person" },
      { id: NODE_TYPE_PROJECT_ID, name: "Project" },
    ],
    linkTypes: [
      {
        id: LINK_TYPE_PARTICIPATES_ID,
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true,
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
    ],
    linkTypeRules: [
      {
        link_type_id: LINK_TYPE_PARTICIPATES_ID,
        source_node_type_id: NODE_TYPE_PERSON_ID,
        target_node_type_id: NODE_TYPE_PROJECT_ID,
        valid_from: null,
        valid_to: null,
      },
    ],
    attributeKeys: [
      {
        id: ATTR_KEY_PROJECT_NAME_ID,
        node_type_id: NODE_TYPE_PROJECT_ID,
        key: "project_name",
        value_type: "text",
        is_temporal: false,
        allows_multiple_current: false,
        requires_valid_from: false,
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// App bootstrap helpers.
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
  // Required for the ingestion module's TC-12 orchestrator endpoint to register.
  // Not exercised by these tests (we don't hit `/run`), but env.ts validates
  // its presence at construction time.
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

async function buildAppWith(
  store: FakeStore,
  fixture: AuthFixture,
  catalog: ReturnType<typeof buildCatalog> = buildCatalog()
) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    ingestionCatalog: catalog,
  });
}

// ---------------------------------------------------------------------------
// Catalog variant — Project.project_name closed to {Apollo, Gemini, Mercury}.
// Used by the BR-30 domain integration tests below. Sharing the same node /
// link / attribute_key UUIDs as the default catalog so the rest of the fake
// store keeps working — only `attributeValidValues` changes.
// ---------------------------------------------------------------------------

function buildCatalogWithClosedProjectName() {
  return buildSnapshot({
    nodeTypes: [
      { id: NODE_TYPE_PERSON_ID, name: "Person" },
      { id: NODE_TYPE_PROJECT_ID, name: "Project" },
    ],
    linkTypes: [
      {
        id: LINK_TYPE_PARTICIPATES_ID,
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true,
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
    ],
    linkTypeRules: [
      {
        link_type_id: LINK_TYPE_PARTICIPATES_ID,
        source_node_type_id: NODE_TYPE_PERSON_ID,
        target_node_type_id: NODE_TYPE_PROJECT_ID,
        valid_from: null,
        valid_to: null,
      },
    ],
    attributeKeys: [
      {
        id: ATTR_KEY_PROJECT_NAME_ID,
        node_type_id: NODE_TYPE_PROJECT_ID,
        key: "project_name",
        value_type: "text",
        is_temporal: false,
        allows_multiple_current: false,
        requires_valid_from: false,
      },
    ],
    attributeValidValues: [
      { attribute_key_id: ATTR_KEY_PROJECT_NAME_ID, value: "Apollo" },
      { attribute_key_id: ATTR_KEY_PROJECT_NAME_ID, value: "Gemini" },
      { attribute_key_id: ATTR_KEY_PROJECT_NAME_ID, value: "Mercury" },
    ],
  });
}

// ---------------------------------------------------------------------------
// Tests — each describe block maps to one acceptance criterion.
// ---------------------------------------------------------------------------

describe("POST /api/v1/ingest/llm-runs/:id/propose-fragment (TC-13 / UC-08)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns HTTP 200 with ok:true envelope when run is running and input is valid", async () => {
    // criterion: "POST /llm-runs/:id/propose-fragment returns 200 with
    //  ok:true envelope when run is running and input is valid"
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-fragment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          text: "The Apollo go-live happens on 2026-07-15.",
          confidence: 0.92,
          chunk_ids: [CHUNK_VALID_ID],
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; result?: Record<string, unknown> };
      expect(body.ok).toBe(true);
      expect(body.result?.status).toBe("proposed");
      // The service inserted exactly one fragment.
      expect(store.fragments_inserted).toBe(1);
    } finally {
      await app.close();
    }
  });

  it("returns HTTP 200 with ok:false VALIDATION_INVALID_FORMAT envelope when chunk_ids do not belong to the run's source", async () => {
    // criterion: "POST /llm-runs/:id/propose-fragment returns 200 with ok:false
    //  VALIDATION_INVALID_FORMAT envelope when ... (validation rejection, not
    //  HTTP error)". P2.1 namespaced; deprecated shorthand: STRUCTURAL_INVALID.
    //
    // Interpretation note (SD-2 in delivery): the original criterion referenced
    // "text > 1000 chars" as the trigger; Zod's max(1000) intercepts that
    // before the service runs (it surfaces as HTTP 422 via the global handler,
    // consistent with the OpenAPI 422 response of this endpoint). The service-
    // level structural rejection branch (chunk_id from a different source) is
    // the equivalent layered-validation failure exercised here per BR-13.
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-fragment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          text: "another claim",
          confidence: 0.8,
          chunk_ids: [CHUNK_OTHER_SOURCE_ID], // exists but belongs to a different raw_information.
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; error?: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_INVALID_FORMAT");
      // No fragment row was committed.
      expect(store.fragments_inserted).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns HTTP 404 RESOURCE_NOT_FOUND when the llm_run id is unknown", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${UNKNOWN_RUN_ID}/propose-fragment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          text: "text",
          confidence: 0.9,
          chunk_ids: [CHUNK_VALID_ID],
        },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/v1/ingest/llm-runs/:id/propose-node (TC-13 / UC-09)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns HTTP 409 BUSINESS_RUN_NOT_RUNNING when the run exists but is completed", async () => {
    // criterion: "POST /llm-runs/:id/propose-node returns 409
    //  BUSINESS_RUN_NOT_RUNNING when run exists but is completed"
    const store = emptyStore();
    seedCompletedRun(store, RUN_COMPLETED_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_COMPLETED_ID}/propose-node`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          node_type: "Project",
          name: "Apollo",
          aliases: ["Projeto Apollo"],
        },
      });
      expect(res.statusCode).toBe(409);
      const body = res.json() as {
        ok: boolean;
        error: { code: string; details: Record<string, unknown> };
      };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("BUSINESS_RUN_NOT_RUNNING");
      expect(body.error.details.current_status).toBe("completed");
      expect(body.error.details.llm_run_id).toBe(RUN_COMPLETED_ID);
      // No node was inserted.
      expect(store.nodes_inserted).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns HTTP 200 with ok:true envelope and resolution=created_new on the happy path", async () => {
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-node`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          node_type: "Project",
          name: "Apollo",
          aliases: ["Projeto Apollo"],
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; result?: Record<string, unknown> };
      expect(body.ok).toBe(true);
      expect(body.result?.resolution).toBe("created_new");
      expect(store.nodes_inserted).toBe(1);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/v1/ingest/llm-runs/:id/propose-link (TC-13 / UC-10)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns HTTP 404 RESOURCE_NOT_FOUND when the llmRunId is unknown", async () => {
    // criterion: "POST /llm-runs/:id/propose-link returns 404
    //  RESOURCE_NOT_FOUND when llmRunId is unknown"
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${UNKNOWN_RUN_ID}/propose-link`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          source_node_id: SOURCE_NODE_ID,
          link_type: "participates_in",
          target_node_id: TARGET_NODE_ID,
          confidence: 0.91,
          fragment_ids: [FRAGMENT_ID],
          valid_from: "2026-06-11",
          valid_from_basis: "document",
          change_hint: "none",
        },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
      expect(store.links_inserted).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns HTTP 200 with ok:true envelope and outcome=accepted on the happy path", async () => {
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-link`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          source_node_id: SOURCE_NODE_ID,
          link_type: "participates_in",
          target_node_id: TARGET_NODE_ID,
          confidence: 0.91,
          fragment_ids: [FRAGMENT_ID],
          valid_from: "2026-06-11",
          valid_from_basis: "document",
          change_hint: "none",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; result?: Record<string, unknown> };
      expect(body.ok).toBe(true);
      expect(body.result?.outcome).toBe("accepted");
      expect(store.links_inserted).toBe(1);
      // BR-18 provenance invariant.
      expect(store.provenance_inserted).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/v1/ingest/llm-runs/:id/propose-attribute (TC-13 / UC-11)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns HTTP 422 on Zod parse failure (missing required field)", async () => {
    // criterion: "POST /llm-runs/:id/propose-attribute returns 422 on Zod
    //  parse failure (malformed body)"
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-attribute`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          // node_id intentionally omitted — required by ProposeAttributeInputSchema.
          key: "project_name",
          value: "Apollo",
          confidence: 0.9,
          fragment_ids: [FRAGMENT_ID],
        },
      });
      expect(res.statusCode).toBe(422);
      expect(store.attributes_inserted).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns HTTP 200 with ok:true envelope and outcome=accepted on the happy path", async () => {
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-attribute`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          node_id: TARGET_NODE_ID, // Project node — matches attribute_key scope.
          key: "project_name",
          value: "Apollo",
          confidence: 0.9,
          fragment_ids: [FRAGMENT_ID],
          valid_from_basis: "document",
          change_hint: "none",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; result?: Record<string, unknown> };
      expect(body.ok).toBe(true);
      expect(body.result?.outcome).toBe("accepted");
      expect(store.attributes_inserted).toBe(1);
      // BR-18 provenance invariant.
      expect(store.provenance_inserted).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // TC-06 (valid-values-attribute-domains) — BR-30 closed-domain enforcement
  // at the REST boundary.
  //
  //   - in-domain literal  → 200 ok:true, outcome=accepted, attribute inserted
  //   - out-of-domain     → 200 ok:false VALIDATION_INVALID_FORMAT envelope with
  //                          (P2.1 namespaced; deprecated: STRUCTURAL_INVALID)
  //                          details = { value, allowed_values }; NO inserts
  //
  // Strategy: same fake store as the happy-path test, but the app is built
  // with `buildCatalogWithClosedProjectName()` so `domainOf(project_name)`
  // returns {Apollo, Gemini, Mercury}.
  // -------------------------------------------------------------------------
  it("BR-30 closed-domain in-domain literal → 200 ok:true accepted", async () => {
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(
      store,
      fixture,
      buildCatalogWithClosedProjectName()
    );
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-attribute`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          node_id: TARGET_NODE_ID,
          key: "project_name",
          value: "Apollo", // in-domain
          confidence: 0.9,
          fragment_ids: [FRAGMENT_ID],
          valid_from_basis: "document",
          change_hint: "none",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { ok: boolean; result?: Record<string, unknown> };
      expect(body.ok).toBe(true);
      expect(body.result?.outcome).toBe("accepted");
      expect(store.attributes_inserted).toBe(1);
      expect(store.provenance_inserted).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });

  it("BR-30 closed-domain out-of-domain literal → 200 ok:false VALIDATION_INVALID_FORMAT with allowed_values", async () => {
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(
      store,
      fixture,
      buildCatalogWithClosedProjectName()
    );
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-attribute`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          node_id: TARGET_NODE_ID,
          key: "project_name",
          value: "Voyager", // NOT in {Apollo, Gemini, Mercury}
          confidence: 0.9,
          fragment_ids: [FRAGMENT_ID],
          valid_from_basis: "document",
          change_hint: "none",
        },
      });
      // Per BR-28 / SD-1: service-layer ValidationFailure surfaces as
      // HTTP 200 with { ok: false, error: ... } envelope.
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        ok: boolean;
        error?: {
          code: string;
          message: string;
          details: { value: string; allowed_values: string[] };
        };
      };
      expect(body.ok).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_INVALID_FORMAT");
      expect(body.error?.details.value).toBe("Voyager");
      // allowed_values is lexicographically sorted per TC-02/TC-03 contract.
      expect(body.error?.details.allowed_values).toEqual([
        "Apollo",
        "Gemini",
        "Mercury",
      ]);
      // The rejection fires BEFORE any INSERT — no attribute, no provenance.
      expect(store.attributes_inserted).toBe(0);
      expect(store.provenance_inserted).toBe(0);
    } finally {
      await app.close();
    }
  });
});

describe("Auth — propose-* mirrors share the plugin-level preHandler", () => {
  it("returns 401 when the bearer token is missing", async () => {
    const fixture = await buildAuthFixture();
    const store = emptyStore();
    seedRunningRun(store, RUN_RUNNING_ID);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-fragment`,
        // intentionally no authorization header
        payload: {
          text: "text",
          confidence: 0.9,
          chunk_ids: [CHUNK_VALID_ID],
        },
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});
