// TC-04 (v2.8) acceptance criteria covered:
//   - buildChatToolCatalog(mcp, env) returns undefined if ANY of the 13 query
//     names is unresolved (revoked-but-restated BR-05 invariant).
//   - With CHAT_INGEST_ENABLED=false (or absent): catalog has exactly 13 names.
//   - With CHAT_INGEST_ENABLED=true AND the `ingest_directed` name registered:
//     catalog has exactly 14 names, with `ingest_directed` resolved on the
//     `ingest` toolset AFTER the 13 query entries.
//   - With CHAT_INGEST_ENABLED=true AND `ingest` toolset missing the entry:
//     defensive degradation — log ERROR 'chat.tool_catalog_partial_resolution'
//     AND fall back to the 13-tool catalog (route still mounts — BR-44 step 6).
//   - Subsequent calls return the cached value (no re-lookup).
//
// Spec refs: chat.back.md BR-05 v2.8 (catalog gate), BR-44 v2.8 (CHAT_INGEST_ENABLED
// gates `ingest_directed`).

import { describe, expect, it, beforeEach, vi } from "vitest";
import { z } from "zod";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import {
  CHAT_TOOL_NAMES,
  CHAT_INGEST_TOOL_NAMES,
  buildChatToolCatalog,
  __resetChatToolCatalogForTests,
  type ChatToolCatalogEnv,
} from "../../../modules/chat/service/tool-catalog.js";
import type { ToolsetName } from "../../../mcp/server.js";

const noopLogger = pino({ level: "silent" });

const ENV_FLAG_OFF: ChatToolCatalogEnv = { CHAT_INGEST_ENABLED: false };
const ENV_FLAG_ON: ChatToolCatalogEnv = { CHAT_INGEST_ENABLED: true };

interface ToolSpec {
  readonly toolset: ToolsetName;
  readonly name: string;
}

function makeRegistry(specs: readonly ToolSpec[]): ReturnType<typeof buildMcpServer> {
  const mcp = buildMcpServer(noopLogger);
  for (const { toolset, name } of specs) {
    mcp.registerTool(toolset, {
      name,
      description: `stub ${toolset}.${name}`,
      inputSchema: z.object({}),
      handler: async () => ({ ok: true }),
    });
  }
  return mcp;
}

const QUERY_SPECS: readonly ToolSpec[] = CHAT_TOOL_NAMES.map((name) => ({
  toolset: "query" as ToolsetName,
  name,
}));
const INGEST_SPECS: readonly ToolSpec[] = CHAT_INGEST_TOOL_NAMES.map((name) => ({
  toolset: "ingest" as ToolsetName,
  name,
}));

describe("chat/service/tool-catalog", () => {
  beforeEach(() => {
    __resetChatToolCatalogForTests();
  });

  // BR-05 v2.4 step 1: the 13 query names are listed and stable.
  it("CHAT_TOOL_NAMES enumerates exactly the 13 read-only query tools", () => {
    expect(CHAT_TOOL_NAMES).toHaveLength(13);
    expect(CHAT_TOOL_NAMES).toEqual(
      expect.arrayContaining([
        "get_node",
        "traverse",
        "get_history_link",
        "get_history_attribute",
        "get_history_attribute_key",
        "list_nodes",
        "list_node_types",
        "list_link_types",
        "list_attribute_keys",
        "search",
        "get_provenance_link",
        "get_provenance_attribute",
        "get_provenance_fragment",
      ])
    );
  });

  // BR-44 v2.8 step 2: the single ingestion name is listed.
  it("CHAT_INGEST_TOOL_NAMES enumerates exactly [ingest_directed] (v2.8)", () => {
    expect(CHAT_INGEST_TOOL_NAMES).toEqual(["ingest_directed"]);
  });

  // BR-05 happy path: every query name resolves -> dense 13-tool catalog when
  // the feature flag is OFF. v2.4: the contract REVOKED "13 read-only" wording
  // but the 13-tool baseline is preserved when the flag is off.
  it("with CHAT_INGEST_ENABLED=false yields exactly 13 names (all from query)", () => {
    const mcp = makeRegistry(QUERY_SPECS);
    const catalog = buildChatToolCatalog(mcp, ENV_FLAG_OFF);
    expect(catalog).toBeDefined();
    const names = Object.keys(catalog!);
    expect(names).toHaveLength(13);
    expect(names.sort()).toEqual([...CHAT_TOOL_NAMES].sort());
  });

  // BR-44 step 1: even when the ingest tool IS in the registry, it is
  // NOT advertised in the chat catalog when the flag is off.
  it("with CHAT_INGEST_ENABLED=false, registered ingest tool is NOT included", () => {
    const mcp = makeRegistry([...QUERY_SPECS, ...INGEST_SPECS]);
    const catalog = buildChatToolCatalog(mcp, ENV_FLAG_OFF);
    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!)).not.toContain("ingest_directed");
  });

  // BR-44 v2.8 step 2: with the flag ON and the `ingest_directed` tool
  // registered, the catalog has exactly 14 names, and the ingest entry
  // appears AFTER the 13 query entries (deterministic order — stable
  // Anthropic tools[] hash).
  it("with CHAT_INGEST_ENABLED=true and full registry yields exactly 14 names (ingest_directed last)", () => {
    const mcp = makeRegistry([...QUERY_SPECS, ...INGEST_SPECS]);
    const catalog = buildChatToolCatalog(mcp, ENV_FLAG_ON);
    expect(catalog).toBeDefined();
    const names = Object.keys(catalog!);
    expect(names).toHaveLength(14);
    // The 14th entry is `ingest_directed`.
    expect(names.slice(-1)).toEqual(["ingest_directed"]);
    // First 13 are the query names in source order.
    expect(names.slice(0, 13)).toEqual([...CHAT_TOOL_NAMES]);
  });

  // BR-44 step 6 defensive degradation: flag ON + `ingest_directed`
  // missing -> log ERROR + fall back to 13-tool catalog. Route still mounts.
  it("with CHAT_INGEST_ENABLED=true and ingest toolset missing ingest_directed: 13-name catalog + ERROR log", () => {
    const mcp = makeRegistry(QUERY_SPECS); // no ingest entries
    const errorSpy = vi.fn();
    const logger = { error: errorSpy } as unknown as Parameters<
      typeof buildChatToolCatalog
    >[2];

    const catalog = buildChatToolCatalog(mcp, ENV_FLAG_ON, logger);
    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!)).toHaveLength(13);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [payload, msg] = errorSpy.mock.calls[0]!;
    expect(payload.event).toBe("chat.tool_catalog_partial_resolution");
    expect(payload.requested).toEqual(["ingest_directed"]);
    expect(payload.missing).toEqual(["ingest_directed"]);
    expect(payload.resolved).toEqual([]);
    expect(msg).toMatch(/falling back to 13-tool catalog/);
  });

  // BR-05: any missing QUERY name -> undefined (route is not mounted).
  it("returns undefined when ANY of the 13 query names is unresolved", () => {
    const partial = QUERY_SPECS.filter((s) => s.name !== "search");
    const mcp = makeRegistry(partial);
    expect(buildChatToolCatalog(mcp, ENV_FLAG_OFF)).toBeUndefined();
  });

  // BR-05: same applies with the flag ON — query miss dominates ingest miss.
  it("returns undefined when query is incomplete even if ingest tools are present", () => {
    const partial = QUERY_SPECS.filter((s) => s.name !== "search");
    const mcp = makeRegistry([...partial, ...INGEST_SPECS]);
    expect(buildChatToolCatalog(mcp, ENV_FLAG_ON)).toBeUndefined();
  });

  it("returns undefined when the registry is completely empty", () => {
    const mcp = makeRegistry([]);
    expect(buildChatToolCatalog(mcp, ENV_FLAG_OFF)).toBeUndefined();
  });

  // BR-05 caching contract — once resolved, never re-resolves (same flag).
  it("memoises the resolved catalog across calls (module-scope cache)", () => {
    const mcp = makeRegistry(QUERY_SPECS);
    const a = buildChatToolCatalog(mcp, ENV_FLAG_OFF);
    const b = buildChatToolCatalog(mcp, ENV_FLAG_OFF);
    expect(a).toBe(b);
  });

  // BR-05 caching contract — sticky `undefined` for the same flag value.
  it("memoises the undefined verdict (sticky on the same flag)", () => {
    const partial = QUERY_SPECS.filter((s) => s.name !== "traverse");
    const mcpA = makeRegistry(partial);
    expect(buildChatToolCatalog(mcpA, ENV_FLAG_OFF)).toBeUndefined();

    // A NEW fully-populated registry under the SAME flag is still ignored.
    const mcpB = makeRegistry(QUERY_SPECS);
    expect(buildChatToolCatalog(mcpB, ENV_FLAG_OFF)).toBeUndefined();
  });

  // Cache invalidation when the flag value changes — production never flips
  // the flag at runtime (BR-44 step 4), but tests do, and the cache MUST
  // not leak a stale resolution across the two regimes.
  it("invalidates the cache when CHAT_INGEST_ENABLED toggles between calls", () => {
    const mcp = makeRegistry([...QUERY_SPECS, ...INGEST_SPECS]);
    const a = buildChatToolCatalog(mcp, ENV_FLAG_OFF);
    expect(Object.keys(a!)).toHaveLength(13);
    const b = buildChatToolCatalog(mcp, ENV_FLAG_ON);
    expect(Object.keys(b!)).toHaveLength(14);
    expect(b).not.toBe(a);
  });

  // Treating absence as `false` — the type allows it and BR-44 defaults to off.
  it("treats CHAT_INGEST_ENABLED absent as `false` (default off)", () => {
    const mcp = makeRegistry([...QUERY_SPECS, ...INGEST_SPECS]);
    const catalog = buildChatToolCatalog(mcp, {});
    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!)).toHaveLength(13);
  });
});
