// Unit tests for the chat tool-catalog gating logic (chat.back.md §1 Testing
// row (xv) / BR-05 v2.8 / BR-44 v2.8).
//
// WHY these matter — three INDEPENDENT intent-bearing failures the catalog
// must distinguish:
//
//   1. With `CHAT_INGEST_ENABLED=false` (default) the catalog must advertise
//      EXACTLY the 13 read-only `query`-toolset tools. If the v2.8 ingestion
//      entry leaked into this catalog the LLM would call a tool the chat
//      domain has not opted into yet.
//
//   2. With `CHAT_INGEST_ENABLED=true` AND the `ingest_directed` entry
//      registered, the catalog must advertise EXACTLY 14 names in a fixed
//      order (BR-44 v2.8 step 2: the ingest entry appears AFTER the 13 query
//      entries so the Anthropic `tools[]` hash is stable across reloads —
//      this enables prompt caching, see LLM cost audit).
//
//   3. With `CHAT_INGEST_ENABLED=true` but the `ingest`-toolset MISSING
//      `ingest_directed`, the catalog must gracefully degrade to 13 names AND
//      log a single ERROR at boot (BR-44 step 6 defensive degradation).
//      Regression here would silently mount the ingest portion at zero entries
//      without surfacing the deployment bug — a fail-loud requirement of
//      CLAUDE.md Golden Rule 12.
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
    // BR-05 v2.8 step 1: when the rollout flag is OFF (the default), the
    // catalog must be EXACTLY the 13 read-only query-toolset tools. An extra
    // entry would mean the LLM gets advertised an ingestion capability the
    // chat domain has not opted into yet.
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: false });

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).sort()).toEqual([...CHAT_TOOL_NAMES].sort());
    // Negative assertion — the ingest tool does not leak through.
    expect(catalog!["ingest_directed"]).toBeUndefined();
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

  it("CHAT_INGEST_ENABLED=true + ingest_directed registered → exactly 14 names (row xv enabled)", () => {
    // BR-44 v2.8 step 2: when the flag is ON and the ingest registrar
    // advertised `ingest_directed`, the catalog must expose 14 entries. A
    // regression that returned 13 would silently break the chat agent's
    // ingestion offer.
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const logger = makeLogger();
    const catalog = buildChatToolCatalog(
      mcp,
      { CHAT_INGEST_ENABLED: true },
      logger
    );

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).length).toBe(14);
    // The v2.8 entry must be present and reference the registered tool.
    expect(catalog!["ingest_directed"]).toBeDefined();
    expect(catalog!["ingest_directed"].name).toBe("ingest_directed");
    // No defensive-degradation log on the happy path.
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("CHAT_INGEST_ENABLED=true + ingest_directed missing → degrades to 13 names + boot ERROR log (row xv defensive)", () => {
    // BR-44 step 6: defensive degradation. The flag being on AND the registry
    // being incomplete is a DEPLOYMENT BUG (the ingest registrar ran with the
    // wrong tier or feature subset). The catalog must mount with the 13-name
    // surface so the chat domain stays usable, AND must log a single ERROR so
    // an operator notices. The fail-loud requirement (CLAUDE.md Golden Rule 12)
    // forbids silently mounting an incomplete catalog without surfacing the
    // condition.
    const mcp = makeMcpStub(ALL_QUERY_TOOLS); // no ingest entries
    const logger = makeLogger();
    const catalog = buildChatToolCatalog(
      mcp,
      { CHAT_INGEST_ENABLED: true },
      logger
    );

    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).length).toBe(13);
    // No ingest entry remains — all-or-nothing per BR-44 step 6.
    expect(catalog!["ingest_directed"]).toBeUndefined();

    // The ERROR carries the diff so the operator can correlate.
    expect(logger.error).toHaveBeenCalledOnce();
    const [payload] = (logger.error as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(payload).toMatchObject({
      event: "chat.tool_catalog_partial_resolution",
      missing: ["ingest_directed"],
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
  // Row (xvii) v2.8 — `ingest_directed` reuses the ingest-toolset handler
  // VERBATIM (seam-removal regression: no chat-side wrapper, no dispatcher
  // injection)
  // ---------------------------------------------------------------------------

  it("(xvii) ingest_directed → reuses the ingest-toolset handler VERBATIM (no chat-side wrapper)", async () => {
    // TC-04: the chat domain does NOT wrap `ingest_directed` — it points
    // straight at the ingestion module's handler (same Zod schema, same
    // envelope mapping). Catalog identity proves this: the `McpTool`
    // reference returned by the registry must be the SAME object stored in
    // the resolved catalog. A regression that re-introduced a chat-side
    // adapter (the retired `ingest-adapter.ts` seam) would break this
    // identity invariant.
    const registered = fakeTool("ingest_directed");
    const ingestMap = new Map<string, McpTool>([
      ["ingest:ingest_directed", registered],
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
    expect(catalog!["ingest_directed"]).toBe(registered);

    // The chat-agent loop (chat-agent.service.ts) dispatches by invoking
    // `catalog[toolName].handler(input)`. We simulate that invocation and
    // assert the registered handler is the one that runs (no shim).
    const input = { source_type: "note", content: "hello" };
    await catalog!["ingest_directed"].handler(input);
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
    expect(Object.keys(on!).length).toBe(14);
    expect(on).not.toBe(off);
  });

  // ---------------------------------------------------------------------------
  // TC-04 / TC-06 v2.8 — seam-removal pinning
  //
  // The two legacy v2.4 ingestion tools (`start_async_ingestion` +
  // `get_ingestion_status`) MUST NOT appear in the chat catalog on EITHER
  // flag branch after TC-04. The constant `CHAT_INGEST_TOOL_NAMES` is the
  // single source of truth — pin its value AND assert the legacy names are
  // absent from the resolved catalog on both `CHAT_INGEST_ENABLED` settings.
  // A regression that re-introduced either legacy name into the enum or the
  // catalog would re-open the async-ingestion seam the spec retired.
  // ---------------------------------------------------------------------------

  it("CHAT_INGEST_TOOL_NAMES === ['ingest_directed'] EXACTLY (TC-04 constant pin)", () => {
    // The constant is the single source the catalog reads. Asserting the
    // exact tuple guards against silent additions / reorderings (e.g.,
    // someone re-adding `get_ingestion_status` to "preserve the read path").
    expect([...CHAT_INGEST_TOOL_NAMES]).toEqual(["ingest_directed"]);
  });

  it("CHAT_INGEST_ENABLED=false → start_async_ingestion AND get_ingestion_status absent from catalog", () => {
    // Defence-in-depth: even if the constant were tampered with, on the
    // flag-off branch ingest names cannot leak through. The catalog must
    // expose only the 13 query names.
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: false });

    expect(catalog).toBeDefined();
    expect(catalog!["start_async_ingestion"]).toBeUndefined();
    expect(catalog!["get_ingestion_status"]).toBeUndefined();
  });

  it("CHAT_INGEST_ENABLED=true → start_async_ingestion AND get_ingestion_status absent from catalog", () => {
    // Even with ingest enabled, the legacy v2.4 names MUST stay out of the
    // chat catalog: only `ingest_directed` is the v2.8 chat-ingest entry.
    // A regression that mounted the retired tools would resurrect the seam.
    const mcp = makeMcpStub([...ALL_QUERY_TOOLS, ...ALL_INGEST_TOOLS]);
    const catalog = buildChatToolCatalog(mcp, { CHAT_INGEST_ENABLED: true });

    expect(catalog).toBeDefined();
    expect(catalog!["start_async_ingestion"]).toBeUndefined();
    expect(catalog!["get_ingestion_status"]).toBeUndefined();
    // Positive control — `ingest_directed` IS present on this branch.
    expect(catalog!["ingest_directed"]).toBeDefined();
  });
});
