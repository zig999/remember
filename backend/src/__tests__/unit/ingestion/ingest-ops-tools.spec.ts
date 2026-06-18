// Read-only operational `ingest` tools (plan B) — `health`,
// `get_ingestion_status`, `list_recent_ingestions`.
//
// These are additive, read-only co-tenants of the `ingest` toolset: they take
// no `llm_run_id` proposal binding and write no `tool_call` audit row. The
// suite drives the handlers straight off the shared registry (no HTTP), with a
// fake pool that matches queries by SQL substring — so it asserts:
//   - health surfaces DB reachability inside `result` (MCP call always ok).
//   - get_ingestion_status reuses getLlmRunById (status + summary), maps an
//     unknown id to RESOURCE_NOT_FOUND, and a malformed id to
//     VALIDATION_INVALID_FORMAT.
//   - list_recent_ingestions returns the rows and applies the default limit.

import { describe, expect, it, vi } from "vitest";
import pino from "pino";

import { buildMcpServer, type McpServer } from "../../../mcp/server.js";
import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { registerIngestToolset } from "../../../modules/ingestion/index.js";

const silentLogger = pino({ level: "silent" });
// Valid RFC-9562 v4 UUID (version nibble 4, variant nibble 8) — Zod v4's
// `.uuid()` validates the variant, so a `...-4444-...` 4th group would fail.
const RUN_ID = "44444444-4444-4444-8444-444444444444";

interface Envelope {
  ok: boolean;
  result?: unknown;
  error?: { code: string; message: string; details?: unknown };
}

/** Minimal catalog — the read tools never touch it, but the registrar needs one. */
function buildCatalog() {
  return buildSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

type QueryFn = (sql: string, params: readonly unknown[]) => { rows: unknown[] };

/** Fake pool whose client answers reads via `respond`; rejects on `connectThrows`. */
function buildReadPool(opts: {
  respond?: QueryFn;
  connectThrows?: boolean;
}): import("pg").Pool {
  return {
    connect: async () => {
      if (opts.connectThrows === true) {
        throw new Error("db down");
      }
      return {
        query: async (...args: unknown[]) => {
          const sql = String(args[0]).replace(/\s+/g, " ").trim();
          const params = (args[1] as unknown[] | undefined) ?? [];
          const upper = sql.toUpperCase();
          if (
            upper === "BEGIN" ||
            upper === "BEGIN READ ONLY" ||
            upper === "COMMIT" ||
            upper === "ROLLBACK"
          ) {
            return { rows: [], rowCount: 0 };
          }
          const out = opts.respond?.(sql, params) ?? { rows: [] };
          return { ...out, rowCount: out.rows.length };
        },
        release: () => undefined,
      };
    },
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

function setup(pool: import("pg").Pool): McpServer {
  const mcp = buildMcpServer(silentLogger);
  registerIngestToolset({
    mcp,
    pool,
    logger: silentLogger,
    catalog: buildCatalog(),
    env: { ANTHROPIC_API_KEY: "test-key" },
  });
  return mcp;
}

async function call(
  mcp: McpServer,
  name: string,
  input: unknown
): Promise<Envelope> {
  const tool = mcp.getTool("ingest", name);
  expect(tool, `tool ${name} must be registered`).toBeDefined();
  return (await tool!.handler(input)) as Envelope;
}

describe("ingest ops tool — health", () => {
  it("reports database: 'ok' when the ping succeeds (MCP call ok)", async () => {
    const mcp = setup(
      buildReadPool({
        respond: (sql) =>
          sql.includes("SELECT 1 AS ok") ? { rows: [{ ok: 1 }] } : { rows: [] },
      })
    );
    const env = await call(mcp, "health", {});
    expect(env.ok).toBe(true);
    expect(env.result).toMatchObject({
      ok: true,
      service: "remember-bff",
      database: "ok",
    });
    expect((env.result as { checked_at: string }).checked_at).toBeTypeOf("string");
  });

  it("reports database: 'unreachable' when the DB is down — still an ok MCP call", async () => {
    // Why this matters: the BFF answering at all proves it is up; the DB is a
    // separate dependency. Collapsing a DB outage into an error envelope would
    // hide that distinction from the operator probing liveness.
    const mcp = setup(buildReadPool({ connectThrows: true }));
    const env = await call(mcp, "health", {});
    expect(env.ok).toBe(true);
    expect(env.result).toMatchObject({ ok: false, database: "unreachable" });
  });
});

describe("ingest ops tool — get_ingestion_status", () => {
  it("returns the run status + summary for a known id", async () => {
    const respond: QueryFn = (sql) => {
      if (sql.includes("FROM llm_run") && sql.includes("WHERE id = $1")) {
        return {
          rows: [
            {
              id: RUN_ID,
              model: "claude-opus-4-8",
              prompt_version: "v3",
              started_at: new Date("2026-06-18T10:42:24Z"),
              finished_at: new Date("2026-06-18T10:46:34Z"),
              status: "completed",
              attempts: 1,
              input_raw_information_id: "11111111-1111-4111-8111-111111111111",
              idempotency_key: "a".repeat(64),
            },
          ],
        };
      }
      if (sql.includes("FROM tool_call") && sql.includes("GROUP BY validation_outcome")) {
        return {
          rows: [
            { validation_outcome: "accepted", n: "23" },
            { validation_outcome: "rejected", n: "2" },
          ],
        };
      }
      return { rows: [] };
    };
    const mcp = setup(buildReadPool({ respond }));
    const env = await call(mcp, "get_ingestion_status", { llm_run_id: RUN_ID });
    expect(env.ok).toBe(true);
    expect(env.result).toMatchObject({
      id: RUN_ID,
      status: "completed",
      summary: { accepted: 23, rejected: 2, consolidated: 0 },
    });
  });

  it("maps an unknown run id to RESOURCE_NOT_FOUND", async () => {
    const mcp = setup(buildReadPool({ respond: () => ({ rows: [] }) }));
    const env = await call(mcp, "get_ingestion_status", { llm_run_id: RUN_ID });
    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("maps a malformed id to VALIDATION_INVALID_FORMAT", async () => {
    const mcp = setup(buildReadPool({ respond: () => ({ rows: [] }) }));
    const env = await call(mcp, "get_ingestion_status", { llm_run_id: "not-a-uuid" });
    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("VALIDATION_INVALID_FORMAT");
  });
});

describe("ingest ops tool — list_recent_ingestions", () => {
  it("returns recent items and applies the default limit (10) when omitted", async () => {
    const limitSpy = vi.fn();
    const respond: QueryFn = (sql, params) => {
      if (sql.includes("FROM raw_information")) {
        limitSpy(params[0]);
        return {
          rows: [
            {
              raw_information_id: "11111111-1111-4111-8111-111111111111",
              source_type: "ata",
              raw_status: "active",
              received_at: new Date("2026-06-18T10:42:24Z"),
              content_preview: "ATA DE REUNIÃO — Projeto AMS TOTVS",
              llm_run_id: RUN_ID,
              run_status: "completed",
              started_at: new Date("2026-06-18T10:42:24Z"),
              finished_at: new Date("2026-06-18T10:46:34Z"),
              prompt_version: "v3",
              model: "claude-opus-4-8",
            },
          ],
        };
      }
      return { rows: [] };
    };
    const mcp = setup(buildReadPool({ respond }));
    const env = await call(mcp, "list_recent_ingestions", {});
    expect(env.ok).toBe(true);
    const items = (env.result as { items: unknown[] }).items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      source_type: "ata",
      run_status: "completed",
      received_at: "2026-06-18T10:42:24.000Z",
    });
    expect(limitSpy).toHaveBeenCalledWith(10);
  });

  it("rejects a limit above the max with VALIDATION_INVALID_FORMAT", async () => {
    const mcp = setup(buildReadPool({ respond: () => ({ rows: [] }) }));
    const env = await call(mcp, "list_recent_ingestions", { limit: 999 });
    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("VALIDATION_INVALID_FORMAT");
  });
});
