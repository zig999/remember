// Unit tests for the chat tool-catalog gating logic (chat.back.md §1 Testing
// row (xv) / BR-05 v2.4 / BR-44).
//
// WHY these matter — three INDEPENDENT intent-bearing failures the catalog
// must distinguish:
//
//   1. With `CHAT_INGEST_ENABLED=false` (default) the catalog must advertise
//      EXACTLY the 13 read-only `query`-toolset tools. If a v2.4 ingestion
//      entry leaked into this catalog the LLM would call a tool the chat
//      domain has no adapter for (BR-43 only applies when the flag is on).
//
//   2. With `CHAT_INGEST_ENABLED=true` AND both `ingest`-toolset entries
//      registered, the catalog must advertise EXACTLY 15 names in a fixed
//      order (BR-44 step 2: the 2 ingest entries appear AFTER the 13 query
//      entries so the Anthropic `tools[]` hash is stable across reloads —
//      this enables prompt caching, see LLM cost audit).
//
//   3. With `CHAT_INGEST_ENABLED=true` but the `ingest`-toolset MISSING either
//      `start_async_ingestion` OR `get_ingestion_status`, the catalog must
//      gracefully degrade to 13 names AND log a single ERROR at boot
//      (BR-44 step 6 defensive degradation). Regression here would silently
//      half-mount a 14-tool catalog (model sees one entry but the other path
//      is dead) — a fail-loud requirement of CLAUDE.md Golden Rule 12.
//
// The module under test is a process-scope SINGLETON with sticky cache
// semantics (BR-05). Every test calls `__resetChatToolCatalogForTests()` in
// `beforeEach` to isolate cases.

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Logger } from "pino";

import type { McpServer, McpTool, ToolsetName } from "../../../../mcp/server.js";
import {
  buildChatToolCatalog,
  CHAT_TOOL_NAMES,
  CHAT_INGEST_TOOL_NAMES,
  __resetChatToolCatalogForTests,
} from "../tool-catalog.js";

/** Minimal McpTool that satisfies the registry's contract without a real Zod
 *  schema or pg-backed handler. The catalog only stores the reference. */
function fakeTool(name: string): McpTool {
  return {
    name,
    description: `fake ${name}`,
    inputSchema: { _def: { typeName: "ZodObject" } } as unknown as McpTool["inputSchema"],
    handler: vi.fn().mockResolvedValue({ ok: true, result: {} }),
  };
}

/** Build a stub `McpServer` whose `getTool(toolset, name)` returns the fake
 *  tool when the (toolset, name) pair is in `present`, otherwise undefined.
 *  We do NOT instantiate the real `McpServer` because its constructor wires a
 *  pino logger; the catalog uses only the `getTool` surface. */
function makeMcpStub(
  present: ReadonlyArray<{ toolset: ToolsetName; name: string }>
): McpServer {
  const map = new Map(
    present.map((p) => [`${p.toolset}:${p.name}`, fakeTool(p.name)] as const)
  );
  return {
    getTool: vi.fn((toolset: ToolsetName, name: string) =>
      map.get(`${toolset}:${name}`)
    ),
  } as unknown as McpServer;
}

function makeLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  } as unknown as Logger;
}

const ALL_QUERY_TOOLS = CHAT_TOOL_NAMES.map((name) => ({
  toolset: "query" as const,
  name,
}));
const ALL_INGEST_TOOLS = CHAT_INGEST_TOOL_NAMES.map((name) => ({
  toolset: "ingest" as const,
  name,
}));

describe("buildChatToolCatalog (BR-05 v2.4 / BR-44 gating)", () => {
  beforeEach(() => {
    __resetChatToolCatalogForTests();
  });

  it("CHAT_INGEST_ENABLED=false → exactly 13 query names, no ingest names (row xv default)", () => {
    // BR-05 v2.4 step 1: when the rollout flag is OFF (the default), the
    // catalog must be EXACTLY the 13 read-only query-toolset tools. An extra
    // entry would mean the LLM gets advertised an ingestion capability the
    // chat domain has no dispatcher for (BR-43 only fires when the flag is on).
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: false });

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).sort()).toEqual([...CHAT_TOOL_NAMES].sort());
    // Negative assertion — neither ingest tool leaks through.
    expect(catalog!["start_async_ingestion"]).toBeUndefined();
    expect(catalog!["get_ingestion_status"]).toBeUndefined();
  });

  it("CHAT_INGEST_ENABLED undefined → treated as false (defensive `=== true` check, 13 names)", () => {
    // BR-44 step 4: production sets the flag explicitly; the defensive
    // `=== true` guard in the catalog treats `undefined` as `false`. A
    // regression that swapped to `!= false` or `Boolean(env.X)` would let
    // truthy non-boolean values (e.g. "1", "true") enable ingestion at boot —
    // which is a deployment-time mistake, not the intended contract.
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const catalog = buildChatToolCatalog(mcp, {} as { CHAT_INGEST_ENABLED?: boolean });

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).length).toBe(13);
  });

  it("CHAT_INGEST_ENABLED=true + both ingest tools registered → exactly 15 names (row xv enabled)", () => {
    // BR-44 step 2: when the flag is ON and the ingest registrar advertised
    // both `start_async_ingestion` and `get_ingestion_status`, the catalog
    // must expose 15 entries. A regression that resolved only one or returned
    // 13 would silently break the chat agent's ingestion offer.
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const logger = makeLogger();
    const catalog = buildChatToolCatalog(
      mcp,
      { CHAT_INGEST_ENABLED: true },
      logger
    );

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).length).toBe(15);
    // The two v2.4 entries must be present and reference the registered tools.
    expect(catalog!["start_async_ingestion"]).toBeDefined();
    expect(catalog!["start_async_ingestion"].name).toBe("start_async_ingestion");
    expect(catalog!["get_ingestion_status"]).toBeDefined();
    expect(catalog!["get_ingestion_status"].name).toBe("get_ingestion_status");
    // No defensive-degradation log on the happy path.
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("CHAT_INGEST_ENABLED=true + ONE ingest tool missing → degrades to 13 names + boot ERROR log (row xv defensive)", () => {
    // BR-44 step 6: defensive degradation. The flag being on AND the registry
    // being incomplete is a DEPLOYMENT BUG (the ingest registrar ran with the
    // wrong tier or feature subset). The catalog must mount with the 13-name
    // surface so the chat domain stays usable, AND must log a single ERROR so
    // an operator notices. The fail-loud requirement (CLAUDE.md Golden Rule 12)
    // forbids silently mounting a 14-tool catalog.
    const mcp = makeMcpStub([
      ...ALL_QUERY_TOOLS,
      // Intentionally omit `start_async_ingestion`, register only the other.
      { toolset: "ingest", name: "get_ingestion_status" },
    ]);
    const logger = makeLogger();
    const catalog = buildChatToolCatalog(
      mcp,
      { CHAT_INGEST_ENABLED: true },
      logger
    );

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).length).toBe(13);
    // Neither ingest entry remains — all-or-nothing per BR-44 step 6.
    expect(catalog!["start_async_ingestion"]).toBeUndefined();
    expect(catalog!["get_ingestion_status"]).toBeUndefined();

    // The ERROR carries the diff so the operator can correlate.
    expect(logger.error).toHaveBeenCalledOnce();
    const [payload] = (logger.error as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(payload).toMatchObject({
      event: "chat.tool_catalog_partial_resolution",
      missing: ["start_async_ingestion"],
    });
  });

  it("CHAT_INGEST_ENABLED=true + BOTH ingest tools missing → degrades to 13 names + ERROR log naming both", () => {
    // Edge of the defensive-degradation path: both ingest entries missing.
    // Same intent as the previous test but proves the missing[] array is
    // built defensively (not a single-entry shortcut).
    const mcp = makeMcpStub(ALL_QUERY_TOOLS);
    const logger = makeLogger();
    const catalog = buildChatToolCatalog(
      mcp,
      { CHAT_INGEST_ENABLED: true },
      logger
    );

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).length).toBe(13);
    expect(logger.error).toHaveBeenCalledOnce();
    const [payload] = (logger.error as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(payload).toMatchObject({
      event: "chat.tool_catalog_partial_resolution",
      missing: [...CHAT_INGEST_TOOL_NAMES],
    });
  });

  it("query-portion miss → undefined (route NOT mountable — sticky)", () => {
    // BR-05 v2.4 step 3: a missing REQUIRED query name is a deployment bug
    // and the route must NOT mount on a partial catalog. The result is
    // `undefined` AND sticky — a subsequent call returns undefined without
    // re-checking the registry. Regression here would mount a degraded chat
    // surface (some tools missing) and let the LLM hit unknown-tool errors
    // for queries the catalog implicitly promised it could serve.
    const incomplete = ALL_QUERY_TOOLS.slice(0, -1); // drop one query name
    const mcp = makeMcpStub(incomplete);
    const logger = makeLogger();

    const first = buildChatToolCatalog(
      mcp,
      { CHAT_INGEST_ENABLED: false },
      logger
    );
    expect(first).toBeUndefined();

    // Sticky — even if the registry is "fixed" between calls, the cached
    // undefined wins. Build a new stub with everything registered and assert
    // the cached miss survives.
    const fixedMcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const second = buildChatToolCatalog(
      fixedMcp,
      { CHAT_INGEST_ENABLED: false },
      logger
    );
    expect(second).toBeUndefined();
  });

  it("memoization → same catalog reference returned on second call (same flag)", () => {
    // BR-05 v2.4: the resolved catalog is memoized for the lifetime of the
    // process. Identity matters — the route handler closes over the
    // reference and the Anthropic `tools[]` array is built ONCE from it.
    // A regression that re-resolved on every call would also re-build the
    // tools[] array and break prompt caching (per the LLM cost audit memory).
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const env = { CHAT_INGEST_ENABLED: true };

    const a = buildChatToolCatalog(mcp, env, makeLogger());
    const b = buildChatToolCatalog(mcp, env, makeLogger());
    expect(a).toBe(b);
  });

  // ---------------------------------------------------------------------------
  // Row (xvii) — get_ingestion_status reuse (BR-45)
  // ---------------------------------------------------------------------------

  it("(xvii) get_ingestion_status → reuses the ingest-toolset handler VERBATIM (no chat-side wrapper)", async () => {
    // BR-45: the chat domain does NOT wrap `get_ingestion_status` — it points
    // straight at the ingestion module's read-only handler (same Zod schema,
    // same `BEGIN READ ONLY` semantics, same envelope mapping). Catalog
    // identity proves this: the `McpTool` reference returned by the registry
    // must be the SAME object stored in the resolved catalog.
    // A regression that copied the handler into a chat-owned wrapper would
    // diverge the schema over time AND break the audit trail of `tool_call`
    // rows (which are written by the ingest handler, not the chat module).
    const registered = fakeTool("get_ingestion_status");
    const ingestMap = new Map<string, McpTool>([
      ["ingest:start_async_ingestion", fakeTool("start_async_ingestion")],
      ["ingest:get_ingestion_status", registered],
    ]);
    const mcp = {
      getTool: vi.fn((toolset: ToolsetName, name: string) => {
        if (toolset === "query") return fakeTool(name);
        return ingestMap.get(`${toolset}:${name}`);
      }),
    } as unknown as McpServer;

    const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: true });
    expect(catalog).toBeDefined();
    // Identity is the contract — same reference both sides.
    expect(catalog!["get_ingestion_status"]).toBe(registered);

    // The chat-agent loop (chat-agent.service.ts) dispatches by invoking
    // `catalog[toolName].handler(input)`. We simulate that invocation and
    // assert the registered handler is the one that runs (no shim).
    const input = { llm_run_id: "11111111-1111-1111-1111-111111111111" };
    await catalog!["get_ingestion_status"].handler(input);
    expect((registered.handler as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(input);
  });

  it("flag flip across calls → cache invalidated and re-resolved", () => {
    // BR-44 step 4 declares the flag is boot-only in production. The tests
    // (and a hypothetical hot toggle) need the cache to invalidate when the
    // flag value changes between calls, otherwise this very test suite would
    // bleed state into itself.
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);

    const off = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: false });
    expect(Object.keys(off!).length).toBe(13);

    const on = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: true });
    expect(Object.keys(on!).length).toBe(15);
    expect(on).not.toBe(off);
  });
});
