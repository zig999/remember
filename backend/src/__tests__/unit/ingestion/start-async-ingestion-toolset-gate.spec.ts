// Toolset-registration gate for `start_async_ingestion` (BR-32 rollout flag).
//
// BR-32 makes the tool registration BOOT-time conditional on
// `env.CHAT_INGEST_ENABLED === true`. The registrar must:
//   - register the tool when the flag is true (it then appears in
//     `mcp.getTool('ingest', 'start_async_ingestion')` and tools/list);
//   - skip `mcp.registerTool` when the flag is false or absent (default), in
//     which case `getTool` returns `undefined` and the chat module's optional
//     resolver can degrade cleanly.
//
// This is a behavior-level test against the shared registry (same setup the
// other ingest-toolset specs use), not a unit test of the handler logic —
// the handler itself is tested in `start-async-ingestion-handler.spec.ts`.

import { describe, expect, it } from "vitest";
import pino from "pino";

import { buildMcpServer, type McpServer } from "../../../mcp/server.js";
import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { registerIngestToolset } from "../../../modules/ingestion/index.js";

const silentLogger = pino({ level: "silent" });

function buildCatalog() {
  return buildSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

/** Minimal pool — the registration path itself does not exercise the DB. */
function buildPool(): import("pg").Pool {
  return {
    connect: async () => ({
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => undefined,
    }),
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

function setup(env: {
  ANTHROPIC_API_KEY: string;
  INGEST_MODEL: string;
  CHAT_INGEST_ENABLED?: boolean;
}): McpServer {
  const mcp = buildMcpServer(silentLogger);
  registerIngestToolset({
    mcp,
    pool: buildPool(),
    logger: silentLogger,
    catalog: buildCatalog(),
    env,
  });
  return mcp;
}

describe("ingest toolset — start_async_ingestion rollout gate (BR-32)", () => {
  it("CHAT_INGEST_ENABLED=true → registers start_async_ingestion (getTool returns it)", () => {
    // WHY: the chat module's optional resolver looks the tool up via
    // `mcp.getTool('ingest', 'start_async_ingestion')`. When the flag is on,
    // the tool MUST be present so the chat agentic loop can advertise an
    // ingestion capability.
    const mcp = setup({
      ANTHROPIC_API_KEY: "test-key",
      INGEST_MODEL: "claude-sonnet-4-6",
      CHAT_INGEST_ENABLED: true,
    });
    const tool = mcp.getTool("ingest", "start_async_ingestion");
    expect(tool).toBeDefined();
  });

  it("CHAT_INGEST_ENABLED=false → registration SKIPPED (getTool returns undefined)", () => {
    // WHY: the dark-launch / rollback guarantee. The chat module's resolver
    // must see `undefined` and degrade cleanly — registering the tool then
    // gating it at request time would defeat the boot-only contract and add
    // a per-call branch nobody asked for.
    const mcp = setup({
      ANTHROPIC_API_KEY: "test-key",
      INGEST_MODEL: "claude-sonnet-4-6",
      CHAT_INGEST_ENABLED: false,
    });
    const tool = mcp.getTool("ingest", "start_async_ingestion");
    expect(tool).toBeUndefined();
  });

  it("CHAT_INGEST_ENABLED ABSENT → registration SKIPPED (default-off behavior)", () => {
    // WHY: BR-32 specifies `default false`. Forgetting to set the env in a
    // deployment must NOT silently flip the rollout on. The TC-02 env declaration
    // formalises the default at the loadEnv layer; this test pins the registrar's
    // own default-off behavior so the two layers can never diverge.
    const mcp = setup({
      ANTHROPIC_API_KEY: "test-key",
      INGEST_MODEL: "claude-sonnet-4-6",
    });
    const tool = mcp.getTool("ingest", "start_async_ingestion");
    expect(tool).toBeUndefined();
  });

  it("other ingest tools are unaffected by the gate (regression — 13 tools always register)", () => {
    // WHY: a regression that broadened the gate would silently break the
    // four propose_* writers + ingest_document + 3 read-only ops. Pin the
    // invariant: only `start_async_ingestion` is gated.
    const mcp = setup({
      ANTHROPIC_API_KEY: "test-key",
      INGEST_MODEL: "claude-sonnet-4-6",
      CHAT_INGEST_ENABLED: false,
    });
    expect(mcp.getTool("ingest", "propose_fragment")).toBeDefined();
    expect(mcp.getTool("ingest", "propose_node")).toBeDefined();
    expect(mcp.getTool("ingest", "propose_link")).toBeDefined();
    expect(mcp.getTool("ingest", "propose_attribute")).toBeDefined();
    expect(mcp.getTool("ingest", "ingest_document")).toBeDefined();
    expect(mcp.getTool("ingest", "health")).toBeDefined();
    expect(mcp.getTool("ingest", "get_ingestion_status")).toBeDefined();
    expect(mcp.getTool("ingest", "list_recent_ingestions")).toBeDefined();
  });

  it("structural Zod failure → STRUCTURAL_INVALID envelope (when flag is on)", async () => {
    // WHY: the toolset-level Zod gate runs BEFORE the handler. A regression
    // would let bad input reach `ingestRawInformation` (which can produce a
    // less-helpful error). Pin the envelope.
    const mcp = setup({
      ANTHROPIC_API_KEY: "test-key",
      INGEST_MODEL: "claude-sonnet-4-6",
      CHAT_INGEST_ENABLED: true,
    });
    const tool = mcp.getTool("ingest", "start_async_ingestion");
    expect(tool).toBeDefined();
    const env = (await tool!.handler({
      // Missing required `content` and `source_type` — must fail Zod parse.
    })) as { ok: boolean; error?: { code: string } };
    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe("STRUCTURAL_INVALID");
  });
});
