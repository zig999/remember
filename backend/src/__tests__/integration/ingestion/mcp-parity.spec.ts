// TC-06 (P2.1) — REST ↔ MCP byte-identical parity guard for the ingestion
// `propose_*` rejection paths.
//
// Companion to compliance BR-14 and curation BR-32 parity contracts. Per
// `ingestion.back.md` §1 Testing row (v1.6.1, BR-13..BR-18 parity citation):
//
//   "The same error-triggering call over REST and over MCP MUST return the
//    byte-identical `error.code` in the response envelope. The regression
//    catches any future revert of the P2.1 namespaced taxonomy on either
//    transport."
//
// This suite drives the same catalog + same fake pool on both wires and pins
// the parity of the layered-validation rejection codes:
//
//   (a) Zod-invalid `propose_link` body   -> VALIDATION_INVALID_FORMAT on both.
//   (b) `propose_link` with unknown link_type -> BUSINESS_UNKNOWN_LINK_TYPE.
//
// The MCP-only case (`missing llm_run_id`) is already covered by
// `mcp-endpoint.spec.ts` (REST has llm_run_id in the URL path, so there is no
// counterpart on that transport). Cases (a) and (b) are the ones both wires
// share a code for; they are the parity anchor of the test row.

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
// Fixture identifiers
// ---------------------------------------------------------------------------

const RUN_RUNNING_ID = "c0c0c0c0-1111-4222-8333-100000000001";
const RAW_INFO_ID = "11111111-1111-4111-8111-111111111111";
const NODE_TYPE_PERSON_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const NODE_TYPE_PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const LINK_TYPE_PARTICIPATES_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";
const SOURCE_NODE_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd1";
const TARGET_NODE_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd2";
const FRAGMENT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1";

/** MCP Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

// ---------------------------------------------------------------------------
// Minimal fake pool — the parity test bodies fail at the structural layer
// (Zod / catalog lookup) BEFORE any DB read past the run lookup. We serve the
// `llm_run` row and BEGIN/COMMIT/ROLLBACK; anything else is unexpected.
// ---------------------------------------------------------------------------

function buildFakePool(): import("pg").Pool {
  return {
    connect: async () => ({
      query: async (...args: unknown[]) => {
        const sql = String(args[0]).replace(/\s+/g, " ").trim();
        const params = (args[1] as unknown[]) ?? [];
        const upper = sql.toUpperCase();
        if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }
        if (sql.startsWith("INSERT INTO tool_call")) {
          // Audit row insert (standalone tx from MCP handler); no-op OK.
          return { rows: [{ id: "tc-fake" }], rowCount: 1 };
        }
        if (
          sql.startsWith("SELECT") &&
          sql.includes("FROM llm_run") &&
          sql.includes("WHERE id = $1")
        ) {
          if (String(params[0]) !== RUN_RUNNING_ID) {
            return { rows: [], rowCount: 0 };
          }
          return {
            rows: [
              {
                id: RUN_RUNNING_ID,
                model: "claude",
                prompt_version: "v1",
                started_at: new Date("2026-06-12T10:00:00Z"),
                finished_at: null,
                status: "running",
                attempts: 1,
                input_raw_information_id: RAW_INFO_ID,
                idempotency_key:
                  "0011223344556677889900112233445566778899aabbccddeeff00112233aabb",
              },
            ],
            rowCount: 1,
          };
        }
        // No other SQL should fire: the layered rejection is early.
        return { rows: [], rowCount: 0 };
      },
      release: () => undefined,
    }),
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

// ---------------------------------------------------------------------------
// Catalog — Person/Project + participates_in only. `unknown_rel` deliberately
// absent to trigger the BUSINESS_UNKNOWN_LINK_TYPE branch.
// ---------------------------------------------------------------------------

function buildIngestionCatalog() {
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
    attributeKeys: [],
  });
}

// ---------------------------------------------------------------------------
// App bootstrap (auth + env fixtures)
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
  // Required by the ingestion module's TC-12 orchestrator registration.
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

async function buildParityApp(fixture: AuthFixture) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    ingestionCatalog: buildIngestionCatalog(),
  });
}

// ---------------------------------------------------------------------------
// MCP JSON-RPC helpers
// ---------------------------------------------------------------------------

function rpc(method: string, params?: unknown): unknown {
  return {
    jsonrpc: "2.0",
    id: 1,
    method,
    ...(params !== undefined ? { params } : {}),
  };
}
function toolCall(name: string, args: Record<string, unknown> = {}): unknown {
  return rpc("tools/call", { name, arguments: args });
}

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
}

function mcpErrCode(body: JsonRpcEnvelope): string {
  const text = body.result?.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text) as { code?: string };
  return String(parsed.code ?? "");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TC-06 — REST ↔ MCP parity guard (ingestion propose_* rejections)", () => {
  let fixture: AuthFixture;
  let token: string;

  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("propose_link with unknown link_type — REST and MCP return byte-identical BUSINESS_UNKNOWN_LINK_TYPE", async () => {
    // Structural layer (Layer 1) fires at `assertKnownType('link_type', …)` on
    // both transports. The single shared service (`proposeLinkService`) is the
    // seam that guarantees parity; this test pins that seam by comparing the
    // wire outputs.
    const app = await buildParityApp(fixture);
    try {
      const restRes = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-link`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          source_node_id: SOURCE_NODE_ID,
          target_node_id: TARGET_NODE_ID,
          link_type: "unknown_rel", // not in the catalog
          confidence: 0.9,
          fragment_ids: [FRAGMENT_ID],
          change_hint: "none",
        },
      });
      expect(restRes.statusCode).toBe(200);
      const restBody = restRes.json() as {
        ok: boolean;
        error?: { code: string };
      };
      expect(restBody.ok).toBe(false);
      const restCode = restBody.error?.code ?? "";

      const mcpRes = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: toolCall("propose_link", {
          llm_run_id: RUN_RUNNING_ID,
          source_node_id: SOURCE_NODE_ID,
          target_node_id: TARGET_NODE_ID,
          link_type: "unknown_rel",
          confidence: 0.9,
          fragment_ids: [FRAGMENT_ID],
          change_hint: "none",
        }),
      });
      expect(mcpRes.statusCode).toBe(200);
      const mcpBody = mcpRes.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.isError).toBe(true);
      const mcpCode = mcpErrCode(mcpBody);

      // Byte-identical parity — this is the actual regression guard.
      expect(restCode).toBe("BUSINESS_UNKNOWN_LINK_TYPE");
      expect(mcpCode).toBe(restCode);
    } finally {
      await app.close();
    }
  });

  it("propose_link with Zod-invalid body (missing fragment_ids) — REST and MCP return byte-identical VALIDATION_INVALID_FORMAT", async () => {
    // Zod (Layer 0) fires BEFORE the service on both transports:
    //   - REST: the route handler's `ProposeLinkInputSchema.parse(body)` throws
    //           a ZodError; the global error handler maps to HTTP 422 with the
    //           `VALIDATION_INVALID_FORMAT` envelope.
    //   - MCP:  `zodErrorEnvelope` in `extraction.service.ts` / the MCP tool
    //           registrar renders the same code on `isError: true`.
    // The wire codes must match — that is the parity contract for this row.
    const app = await buildParityApp(fixture);
    try {
      const restRes = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${RUN_RUNNING_ID}/propose-link`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          source_node_id: SOURCE_NODE_ID,
          target_node_id: TARGET_NODE_ID,
          link_type: "participates_in",
          confidence: 0.9,
          // fragment_ids intentionally missing (Zod-required).
          change_hint: "none",
        },
      });
      // Per `error-mapping.ts`: VALIDATION_INVALID_FORMAT -> 422.
      expect(restRes.statusCode).toBe(422);
      const restBody = restRes.json() as {
        ok?: boolean;
        error?: { code?: string };
      };
      const restCode = String(restBody.error?.code ?? "");

      const mcpRes = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/ingest",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: toolCall("propose_link", {
          llm_run_id: RUN_RUNNING_ID,
          source_node_id: SOURCE_NODE_ID,
          target_node_id: TARGET_NODE_ID,
          link_type: "participates_in",
          confidence: 0.9,
          // fragment_ids intentionally missing.
          change_hint: "none",
        }),
      });
      expect(mcpRes.statusCode).toBe(200);
      const mcpBody = mcpRes.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.isError).toBe(true);
      const mcpCode = mcpErrCode(mcpBody);

      expect(restCode).toBe("VALIDATION_INVALID_FORMAT");
      expect(mcpCode).toBe(restCode);
    } finally {
      await app.close();
    }
  });
});
