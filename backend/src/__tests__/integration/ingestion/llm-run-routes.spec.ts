// Integration tests for the LLMRun REST endpoints (TC-03):
//   - GET  /api/v1/ingest/llm-runs/{id}
//   - GET  /api/v1/ingest/llm-runs/{id}/tool-calls
//   - POST /api/v1/ingest/llm-runs/{id}/retry
//
// Acceptance criteria addressed here:
//   - "POST /retry returns 409 BUSINESS_RUN_NOT_RETRYABLE for running or completed runs"
//   - "POST /retry on failed run transitions to running and increments attempts"

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

interface FakeStore {
  llm_runs: Map<string, Record<string, unknown>>;
  tool_calls: Array<Record<string, unknown>>;
  fragments: Map<string, Record<string, unknown>>;
  provenance_fragment_ids: Set<string>;
  uuidCounter: { n: number };
}

function emptyStore(): FakeStore {
  return {
    llm_runs: new Map(),
    tool_calls: [],
    fragments: new Map(),
    provenance_fragment_ids: new Set(),
    uuidCounter: { n: 0 },
  };
}

function nextUuid(store: FakeStore, prefixHex: string): string {
  store.uuidCounter.n += 1;
  const suffix = store.uuidCounter.n.toString(16).padStart(12, "0");
  const head = prefixHex.padStart(8, "0").slice(0, 8);
  return `${head}-1111-4222-8333-${suffix}`;
}

function seedRun(store: FakeStore, status: "running" | "failed" | "completed"): string {
  const id = nextUuid(store, "c0c0c0c0");
  store.llm_runs.set(id, {
    id,
    model: "claude",
    prompt_version: "v1",
    started_at: new Date("2026-06-11T20:00:00Z"),
    finished_at: status === "running" ? null : new Date("2026-06-11T20:30:00Z"),
    status,
    attempts: 1,
    input_raw_information_id: nextUuid(store, "abcdef01"),
    idempotency_key:
      "f1e2d3c4b5a6978877665544332211008899aabbccddeeff0011223344556677",
  });
  return id;
}

/**
 * Seed an `information_fragment` row. An orphan (counted by
 * `summary.orphaned_fragments`) is `status='proposed'` with `cited=false`
 * (no provenance row). `cited=true` registers a provenance row, so a proposed
 * fragment becomes non-orphan.
 */
function seedFragment(
  store: FakeStore,
  llmRunId: string,
  status: "proposed" | "accepted" | "rejected",
  opts: { cited: boolean } = { cited: false }
): string {
  const id = nextUuid(store, "f0f0f0f0");
  store.fragments.set(id, { id, llm_run_id: llmRunId, status });
  if (opts.cited) store.provenance_fragment_ids.add(id);
  return id;
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

      // SELECT llm_run by id
      if (sql.startsWith("SELECT") && sql.includes("FROM llm_run") && sql.includes("WHERE id = $1")) {
        const row = store.llm_runs.get(String(params[0]));
        if (!row) return { rows: [], rowCount: 0 };
        return { rows: [row], rowCount: 1 };
      }
      // GROUP BY validation_outcome aggregator
      if (sql.includes("GROUP BY validation_outcome")) {
        const target = String(params[0]);
        const buckets = new Map<string, number>();
        for (const tc of store.tool_calls) {
          if (tc.llm_run_id === target) {
            buckets.set(
              tc.validation_outcome as string,
              (buckets.get(tc.validation_outcome as string) ?? 0) + 1
            );
          }
        }
        return {
          rows: [...buckets.entries()].map(([validation_outcome, n]) => ({
            validation_outcome,
            n: String(n),
          })),
          rowCount: buckets.size,
        };
      }
      // count(*) tool_call
      if (sql.startsWith("SELECT count(*)") && sql.includes("FROM tool_call")) {
        const n = store.tool_calls.filter((tc) => tc.llm_run_id === String(params[0])).length;
        return { rows: [{ n: String(n) }], rowCount: 1 };
      }
      // count(*) orphaned fragments (proposed of this run with no provenance)
      if (sql.startsWith("SELECT count(*)") && sql.includes("FROM information_fragment")) {
        const target = String(params[0]);
        let n = 0;
        for (const f of store.fragments.values()) {
          if (
            f.llm_run_id === target &&
            f.status === "proposed" &&
            !store.provenance_fragment_ids.has(f.id as string)
          ) {
            n += 1;
          }
        }
        // query casts count(*)::int -> pg returns a number, not a string.
        return { rows: [{ n }], rowCount: 1 };
      }
      // listing tool_call
      if (
        sql.startsWith("SELECT") &&
        sql.includes("FROM tool_call") &&
        sql.includes("ORDER BY")
      ) {
        const matching = store.tool_calls
          .filter((tc) => tc.llm_run_id === String(params[0]))
          .slice(Number(params[2]), Number(params[2]) + Number(params[1]));
        return { rows: matching, rowCount: matching.length };
      }
      // UPDATE llm_run retry
      if (sql.startsWith("UPDATE llm_run") && sql.includes("WHERE id = $1 AND status = 'failed'")) {
        const row = store.llm_runs.get(String(params[0]));
        if (!row || row.status !== "failed") return { rows: [], rowCount: 0 };
        row.status = "running";
        row.finished_at = null;
        row.attempts = (row.attempts as number) + 1;
        return { rows: [row], rowCount: 1 };
      }
      // orphan-fragment cleanup
      if (sql.startsWith("UPDATE information_fragment") && sql.includes("status = 'rejected'")) {
        const target = String(params[0]);
        for (const f of store.fragments.values()) {
          if (
            f.llm_run_id === target &&
            f.status === "proposed" &&
            !store.provenance_fragment_ids.has(f.id as string)
          ) {
            f.status = "rejected";
          }
        }
        return { rows: [], rowCount: 0 };
      }
      throw new Error(`fake client (llm-run): unknown SQL: ${sql.slice(0, 120)}`);
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

async function buildAppWith(store: FakeStore, fixture: AuthFixture) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
  });
}

describe("POST /api/v1/ingest/llm-runs/:id/retry (UC-06)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns 200 and bumps attempts on a failed run", async () => {
    const store = emptyStore();
    const runId = seedRun(store, "failed");
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${runId}/retry`,
        headers: { authorization: `Bearer ${token}` },
        payload: { reason: "transient timeout" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.status).toBe("running");
      expect(body.attempts).toBe(2);
      expect(body.finished_at).toBeNull();
      // summary present and zeroed out by default (no tool_calls yet).
      const summary = body.summary as Record<string, number>;
      expect(summary.rejected).toBe(0);
      expect(summary.accepted).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns 409 BUSINESS_RUN_NOT_RETRYABLE for a running run", async () => {
    const store = emptyStore();
    const runId = seedRun(store, "running");
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${runId}/retry`,
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      });
      expect(res.statusCode).toBe(409);
      const body = res.json() as { ok: boolean; error: { code: string; details: Record<string, unknown> } };
      expect(body.error.code).toBe("BUSINESS_RUN_NOT_RETRYABLE");
      expect(body.error.details.current_status).toBe("running");
    } finally {
      await app.close();
    }
  });

  it("returns 409 BUSINESS_RUN_NOT_RETRYABLE for a completed run", async () => {
    const store = emptyStore();
    const runId = seedRun(store, "completed");
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ingest/llm-runs/${runId}/retry`,
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      });
      expect(res.statusCode).toBe(409);
      const body = res.json() as { ok: boolean; error: { code: string; details: Record<string, unknown> } };
      expect(body.error.code).toBe("BUSINESS_RUN_NOT_RETRYABLE");
      expect(body.error.details.current_status).toBe("completed");
    } finally {
      await app.close();
    }
  });

  it("returns 404 RESOURCE_NOT_FOUND on unknown id", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/llm-runs/00000000-0000-0000-0000-000000000000/retry",
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { ok: boolean; error: { code: string } };
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/v1/ingest/llm-runs/:id", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns the run with an aggregated summary", async () => {
    const store = emptyStore();
    const runId = seedRun(store, "running");
    store.tool_calls.push(
      { id: "tc1", llm_run_id: runId, tool_name: "propose_fragment", arguments: {}, result: null, validation_outcome: "accepted", created_at: new Date("2026-06-11T20:10:00Z") },
      { id: "tc2", llm_run_id: runId, tool_name: "propose_link", arguments: {}, result: null, validation_outcome: "rejected", created_at: new Date("2026-06-11T20:11:00Z") }
    );
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ingest/llm-runs/${runId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.id).toBe(runId);
      const summary = body.summary as Record<string, number>;
      expect(summary.accepted).toBe(1);
      expect(summary.rejected).toBe(1);
      expect(summary.consolidated).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("counts only proposed, uncited fragments of this run in summary.orphaned_fragments", async () => {
    const store = emptyStore();
    const runId = seedRun(store, "completed");
    // orphan: proposed + no provenance -> COUNTED
    seedFragment(store, runId, "proposed", { cited: false });
    // proposed but cited (has provenance) -> NOT an orphan (it got promoted/used)
    seedFragment(store, runId, "proposed", { cited: true });
    // accepted -> NOT an orphan
    seedFragment(store, runId, "accepted", { cited: true });
    // proposed+uncited but belongs to ANOTHER run -> must not leak across runs
    const otherRun = seedRun(store, "completed");
    seedFragment(store, otherRun, "proposed", { cited: false });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ingest/llm-runs/${runId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const summary = (res.json() as Record<string, unknown>).summary as Record<string, number>;
      expect(summary.orphaned_fragments).toBe(1);
    } finally {
      await app.close();
    }
  });

  it("reports orphaned_fragments=0 when every proposed fragment is cited", async () => {
    const store = emptyStore();
    const runId = seedRun(store, "completed");
    seedFragment(store, runId, "proposed", { cited: true });
    seedFragment(store, runId, "accepted", { cited: true });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ingest/llm-runs/${runId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const summary = (res.json() as Record<string, unknown>).summary as Record<string, number>;
      expect(summary.orphaned_fragments).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("returns 404 RESOURCE_NOT_FOUND for unknown id", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/ingest/llm-runs/00000000-0000-0000-0000-000000000000",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/v1/ingest/llm-runs/:id/tool-calls", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns paginated tool_call rows", async () => {
    const store = emptyStore();
    const runId = seedRun(store, "running");
    for (let i = 0; i < 5; i++) {
      store.tool_calls.push({
        id: `tc-${i}`,
        llm_run_id: runId,
        tool_name: "propose_fragment",
        arguments: { i },
        result: null,
        validation_outcome: "accepted",
        created_at: new Date(`2026-06-11T20:10:${String(i).padStart(2, "0")}Z`),
      });
    }
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ingest/llm-runs/${runId}/tool-calls?limit=3&offset=1`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { total: number; limit: number; offset: number; items: unknown[] };
      expect(body.total).toBe(5);
      expect(body.limit).toBe(3);
      expect(body.offset).toBe(1);
      expect(body.items.length).toBe(3);
    } finally {
      await app.close();
    }
  });

  it("returns 404 when the parent run does not exist", async () => {
    const store = emptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/ingest/llm-runs/00000000-0000-0000-0000-000000000000/tool-calls",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
