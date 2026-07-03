// Integration tests for the compliance-audit REST↔MCP PARITY — BR-14 / BR-15
// (compliance-audit.back.md v1.4.0, P2.1 canonical taxonomy).
//
// This test is the CI enforcement gate for the P2.1 invariant: the same forced
// input MUST produce byte-identical `error.code` on BOTH transports. Before
// P2.1 the MCP path used to collapse Zod parse failures to the §14 short
// `STRUCTURAL_INVALID` and the not-found sentinel to `NOT_FOUND`; the taxonomy
// unification retired the `mcpCode` pair, so the MCP handler now surfaces the
// same namespaced code REST already emits.
//
// Acceptance criteria (validation.criteria of dev_tc_003):
//   (a) Missing `raw_information_id`   -> `VALIDATION_REQUIRED_FIELD` on BOTH
//   (b) Malformed UUID                  -> `VALIDATION_INVALID_FORMAT`  on BOTH
//   (c) Unknown raw_information_id      -> `RESOURCE_NOT_FOUND`         on BOTH
//   (d) Legacy orphan tombstone (BR-17) -> `SYSTEM_INTERNAL_ERROR`      on BOTH
//
// Strategy (Rule 11 — match the codebase's conventions): use the same fake
// `pg.Pool` + `buildApp` harness as `routes.spec.ts` (this directory) and
// `curation/mcp-curation-parity.spec.ts`. The fake client is minimal — every
// case here fails BEFORE the cascade queries run — so only the two selects
// exercised by the two error branches need matchers.

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
import { buildSnapshot as buildKnowledgeGraphSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";
import { buildSnapshot as buildIngestionSnapshot } from "../../../modules/ingestion/catalog/catalog.js";

// ---------------------------------------------------------------------------
// Minimal in-memory store — only the tables `complianceDelete` reads before
// throwing on the four forced-error branches this test covers.
// ---------------------------------------------------------------------------

interface RawInformationRow {
  id: string;
  status: "active" | "needs_review" | "merged" | "deleted";
}
interface ComplianceDeletionStoredRow {
  id: string;
  raw_information_id: string;
  reason: string;
  executed_at: Date;
  affected: { chunks: number; fragments: number; links: number; attributes: number };
}

interface Store {
  raws: RawInformationRow[];
  compliance_deletions: ComplianceDeletionStoredRow[];
}

function buildEmptyStore(): Store {
  return { raws: [], compliance_deletions: [] };
}

const UNKNOWN_RAW = "ee000000-0000-4000-8000-0000000000cc";
const ORPHAN_RAW = "ee000000-0000-4000-8000-0000000000dd";

// ---------------------------------------------------------------------------
// Fake pg client — only handles the queries reached on the four forced-error
// paths. Any unmatched SQL is a bug in the test, so we throw loudly.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFakeClient(store: Store): any {
  return {
    query: async (sql: string | { text: string }, params: unknown[] = []) => {
      const rawText = typeof sql === "string" ? sql : sql.text;
      const text = rawText.trim();
      const upper = text.toUpperCase();
      if (
        upper === "BEGIN" ||
        upper === "BEGIN READ ONLY" ||
        upper === "COMMIT" ||
        upper === "ROLLBACK"
      ) {
        return { rows: [], rowCount: 0 };
      }
      if (upper === "SELECT 1 AS OK") {
        return { rows: [{ ok: 1 }], rowCount: 1 };
      }

      // loadRawInformationForUpdate — used by cases (c) and (d).
      if (
        text.includes("FROM raw_information") &&
        text.includes("FOR UPDATE") &&
        text.includes("SELECT id, status")
      ) {
        const id = String(params[0]);
        const row = store.raws.find((r) => r.id === id);
        if (!row) return { rows: [], rowCount: 0 };
        return { rows: [{ id: row.id, status: row.status }], rowCount: 1 };
      }

      // findComplianceDeletionByRawId — used only by case (d) to force the
      // orphan tombstone branch (BR-17). We always return 0 rows: the raw is
      // status='deleted' but there is no companion compliance_deletion row.
      if (
        text.includes("FROM compliance_deletion") &&
        text.includes("WHERE raw_information_id = $1") &&
        text.includes("ORDER BY executed_at DESC") &&
        text.includes("LIMIT 1")
      ) {
        const id = String(params[0]);
        const row = store.compliance_deletions.find(
          (r) => r.raw_information_id === id
        );
        return row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      throw new Error(
        `fake client: unexpected SQL on the parity test forced-error paths: ${text.slice(0, 200)}`
      );
    },
    release: () => undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFakePool(store: Store): any {
  const client = buildFakeClient(store);
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  };
}

// ---------------------------------------------------------------------------
// Fixtures + Auth — same shape as routes.spec.ts / mcp-curation-parity.spec.ts.
// ---------------------------------------------------------------------------

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

/**
 * Empty catalog snapshots — required by `buildApp` because the MCP curation
 * transport (POST /api/v1/mcp/curation) is only mounted when
 * `ingestionCatalog !== undefined` (app.ts line 236), even though the
 * `compliance_delete` tool itself never reads either catalog. Providing empty
 * snapshots is the minimal wiring to expose the transport under test.
 */
const knowledgeGraphCatalog = buildKnowledgeGraphSnapshot({
  nodeTypes: [],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});
const ingestionCatalog = buildIngestionSnapshot({
  nodeTypes: [],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
  attributeValidValues: [],
});

async function buildAppWith(store: Store, fixture: AuthFixture) {
  return buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    catalog: knowledgeGraphCatalog,
    ingestionCatalog,
  });
}

// ---------------------------------------------------------------------------
// JSON-RPC helpers — identical to `mcp-curation-parity.spec.ts` (BR-32).
// ---------------------------------------------------------------------------

function rpcCall(name: string, args: Record<string, unknown>): unknown {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
}

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
}

interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

/** Parse the structured `{ code, message, details }` an isError MCP result carries. */
function mcpErrPayload(body: JsonRpcEnvelope): {
  code: string;
  message: string;
  details?: unknown;
} {
  return JSON.parse(body.result?.content?.[0]?.text ?? "{}");
}

// ---------------------------------------------------------------------------
// Reusable driver — POST a payload to REST and to MCP against equivalent
// stores, and return the observed error codes on each transport. The two
// stores are independent instances (fresh seed each call) so REST-side
// mutations do not leak into the MCP-side app. BR-14 requires the CODES to
// match byte-for-byte; the fixture state is equivalent by construction.
// ---------------------------------------------------------------------------

interface ParityCase {
  readonly seed: () => Store;
  readonly payload: unknown;
  readonly restStatus: number;
  readonly expectedCode: string;
}

async function runParity(
  fixture: AuthFixture,
  token: string,
  tc: ParityCase
): Promise<{ restCode: string; mcpCode: string }> {
  // REST
  const restStore = tc.seed();
  const appRest = await buildAppWith(restStore, fixture);
  let restCode: string;
  try {
    const res = await appRest.inject({
      method: "POST",
      url: "/api/v1/compliance/deletions",
      headers: { authorization: `Bearer ${token}` },
      payload: tc.payload,
    });
    expect(res.statusCode).toBe(tc.restStatus);
    const body = res.json() as ErrorEnvelope;
    restCode = body.error.code;
  } finally {
    await appRest.close();
  }

  // MCP
  const mcpStore = tc.seed();
  const appMcp = await buildAppWith(mcpStore, fixture);
  let mcpCode: string;
  try {
    const res = await appMcp.inject({
      method: "POST",
      url: "/api/v1/mcp/curation",
      headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
      payload: rpcCall(
        "compliance_delete",
        // MCP `arguments` must be an object — non-object payloads (case `null`
        // for missing raw_information_id) are wrapped so we still exercise the
        // Zod-parse-failure branch on the compliance_delete handler.
        (tc.payload && typeof tc.payload === "object"
          ? (tc.payload as Record<string, unknown>)
          : {}) as Record<string, unknown>
      ),
    });
    // MCP always answers HTTP 200; the error rides on `result.isError`.
    expect(res.statusCode).toBe(200);
    const env = res.json() as JsonRpcEnvelope;
    expect(env.result?.isError).toBe(true);
    mcpCode = mcpErrPayload(env).code;
  } finally {
    await appMcp.close();
  }

  return { restCode, mcpCode };
}

// ---------------------------------------------------------------------------
// Tests — BR-14 four canonical parity assertions.
// ---------------------------------------------------------------------------

describe("Compliance-Audit MCP parity — P2.1 canonical taxonomy (BR-14 / BR-15 v1.4.0)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("(a) missing `raw_information_id` -> VALIDATION_REQUIRED_FIELD on BOTH transports", async () => {
    // Zod-parse rejection happens before any DB query — the fake pool matcher
    // set is intentionally empty. WHY: the pre-P2.1 build collapsed this to
    // the §14 short `STRUCTURAL_INVALID` on MCP while REST already emitted
    // `VALIDATION_REQUIRED_FIELD`. Byte-parity is the CI guard for BR-15.
    const { restCode, mcpCode } = await runParity(fixture, token, {
      seed: buildEmptyStore,
      payload: { reason: "LGPD request" },
      restStatus: 422,
      expectedCode: "VALIDATION_REQUIRED_FIELD",
    });
    expect(restCode).toBe("VALIDATION_REQUIRED_FIELD");
    expect(mcpCode).toBe(restCode);
  });

  it("(b) malformed UUID -> VALIDATION_INVALID_FORMAT on BOTH transports", async () => {
    // Same rationale as (a): pre-P2.1 the MCP path returned the §14 short
    // `STRUCTURAL_INVALID`, breaking parity. The Zod discriminator now maps
    // format violations to `VALIDATION_INVALID_FORMAT` on both transports.
    const { restCode, mcpCode } = await runParity(fixture, token, {
      seed: buildEmptyStore,
      payload: { raw_information_id: "not-a-uuid", reason: "LGPD request" },
      restStatus: 422,
      expectedCode: "VALIDATION_INVALID_FORMAT",
    });
    expect(restCode).toBe("VALIDATION_INVALID_FORMAT");
    expect(mcpCode).toBe(restCode);
  });

  it("(c) unknown raw_information_id -> RESOURCE_NOT_FOUND on BOTH transports", async () => {
    // The service throws `ResourceNotFoundError` when
    // `loadRawInformationForUpdate` returns 0 rows (UC-01 alt 4a).
    // Pre-P2.1 the MCP path surfaced the §14 short `NOT_FOUND`; the
    // taxonomy unification (compliance-audit BR-15 v1.4.0) retired the pair.
    const { restCode, mcpCode } = await runParity(fixture, token, {
      seed: buildEmptyStore,
      payload: {
        raw_information_id: UNKNOWN_RAW,
        reason: "LGPD request",
      },
      restStatus: 404,
      expectedCode: "RESOURCE_NOT_FOUND",
    });
    expect(restCode).toBe("RESOURCE_NOT_FOUND");
    expect(mcpCode).toBe(restCode);
  });

  it("(d) legacy orphan tombstone -> SYSTEM_INTERNAL_ERROR on BOTH transports", async () => {
    // BR-17 alarm: the raw is `status='deleted'` but no `compliance_deletion`
    // companion row exists. The service throws `InternalFailure`; both
    // transports must surface `SYSTEM_INTERNAL_ERROR` (pre-P2.1 MCP path
    // returned the §14 short `INTERNAL`). No audit rows on this branch.
    const seedOrphan: () => Store = () => {
      const s = buildEmptyStore();
      s.raws.push({ id: ORPHAN_RAW, status: "deleted" });
      return s;
    };
    const { restCode, mcpCode } = await runParity(fixture, token, {
      seed: seedOrphan,
      payload: { raw_information_id: ORPHAN_RAW, reason: "LGPD request" },
      restStatus: 500,
      expectedCode: "SYSTEM_INTERNAL_ERROR",
    });
    expect(restCode).toBe("SYSTEM_INTERNAL_ERROR");
    expect(mcpCode).toBe(restCode);
  });

  it("does NOT emit any deprecated §14 short code across the four parity cases", async () => {
    // Sweep — regression against the pre-P2.1 taxonomy. Reject the entire set
    // { STRUCTURAL_INVALID, NOT_FOUND, INTERNAL } on either transport for any
    // of the four cases. If a future change re-introduces `mcpCode`, this
    // check fails loudly (Rule 12).
    const cases: ParityCase[] = [
      {
        seed: buildEmptyStore,
        payload: { reason: "LGPD request" },
        restStatus: 422,
        expectedCode: "VALIDATION_REQUIRED_FIELD",
      },
      {
        seed: buildEmptyStore,
        payload: { raw_information_id: "not-a-uuid", reason: "LGPD request" },
        restStatus: 422,
        expectedCode: "VALIDATION_INVALID_FORMAT",
      },
      {
        seed: buildEmptyStore,
        payload: { raw_information_id: UNKNOWN_RAW, reason: "LGPD request" },
        restStatus: 404,
        expectedCode: "RESOURCE_NOT_FOUND",
      },
      {
        seed: () => {
          const s = buildEmptyStore();
          s.raws.push({ id: ORPHAN_RAW, status: "deleted" });
          return s;
        },
        payload: { raw_information_id: ORPHAN_RAW, reason: "LGPD request" },
        restStatus: 500,
        expectedCode: "SYSTEM_INTERNAL_ERROR",
      },
    ];
    const forbidden = new Set(["STRUCTURAL_INVALID", "NOT_FOUND", "INTERNAL"]);
    for (const tc of cases) {
      const { restCode, mcpCode } = await runParity(fixture, token, tc);
      expect(forbidden.has(restCode)).toBe(false);
      expect(forbidden.has(mcpCode)).toBe(false);
      expect(restCode).toBe(tc.expectedCode);
      expect(mcpCode).toBe(restCode);
    }
  });
});
