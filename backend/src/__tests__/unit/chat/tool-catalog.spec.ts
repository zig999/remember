// TC-01 acceptance criteria covered:
//   - buildChatToolCatalog(mcp) returns undefined if ANY of the 13 query-tool
//     names is unresolved.
//   - Successful resolution returns a map covering all 13 names.
//   - Subsequent calls return the cached value (no re-lookup).
//
// Spec refs: chat.back.md BR-05 (catalog lazy + module-scope cache).

import { describe, expect, it, beforeEach } from "vitest";
import { z } from "zod";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import {
  CHAT_TOOL_NAMES,
  buildChatToolCatalog,
  __resetChatToolCatalogForTests,
} from "../../../modules/chat/service/tool-catalog.js";

const noopLogger = pino({ level: "silent" });

function makeRegistry(tools: readonly string[]): ReturnType<typeof buildMcpServer> {
  const mcp = buildMcpServer(noopLogger);
  for (const name of tools) {
    mcp.registerTool("query", {
      name,
      description: `stub ${name}`,
      inputSchema: z.object({}),
      handler: async () => ({ ok: true }),
    });
  }
  return mcp;
}

describe("chat/service/tool-catalog", () => {
  beforeEach(() => {
    __resetChatToolCatalogForTests();
  });

  // BR-05: 13 names listed in chat.back.md / chat.spec.md.
  it("CHAT_TOOL_NAMES enumerates exactly the 13 read-only query tools", () => {
    expect(CHAT_TOOL_NAMES).toHaveLength(13);
    // 9 knowledge-graph + 4 query-retrieval (chat.back.md BR-05).
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

  // BR-05 happy path: every name resolves -> dense catalog.
  it("returns a dense catalog when ALL 13 tools are registered", () => {
    const mcp = makeRegistry(CHAT_TOOL_NAMES);
    const catalog = buildChatToolCatalog(mcp);
    expect(catalog).toBeDefined();
    expect(Object.keys(catalog!).sort()).toEqual([...CHAT_TOOL_NAMES].sort());
    for (const name of CHAT_TOOL_NAMES) {
      expect(catalog![name].name).toBe(name);
    }
  });

  // BR-05 partial: any missing name -> undefined (route is not mounted).
  it("returns undefined when ANY of the 13 names is unresolved", () => {
    // Drop one tool from the registry.
    const partial = CHAT_TOOL_NAMES.filter((n) => n !== "search");
    const mcp = makeRegistry(partial);
    expect(buildChatToolCatalog(mcp)).toBeUndefined();
  });

  it("returns undefined when the registry is completely empty", () => {
    const mcp = makeRegistry([]);
    expect(buildChatToolCatalog(mcp)).toBeUndefined();
  });

  // BR-05 caching contract: once-resolved, never re-resolves.
  it("memoises the resolved catalog across calls (module-scope cache)", () => {
    const mcp = makeRegistry(CHAT_TOOL_NAMES);
    const a = buildChatToolCatalog(mcp);
    const b = buildChatToolCatalog(mcp);
    // Same frozen object reference — no re-resolution.
    expect(a).toBe(b);
  });

  // BR-05 caching contract: a once-missing catalog stays sticky.
  it("memoises the undefined verdict (a once-missing catalog stays sticky)", () => {
    const partial = CHAT_TOOL_NAMES.filter((n) => n !== "traverse");
    const mcpA = makeRegistry(partial);
    expect(buildChatToolCatalog(mcpA)).toBeUndefined();

    // Even if a NEW registry is fully populated, the cached `undefined` wins
    // until the test reset fires. Production code has no reset — partial
    // resolution is sticky for the process lifetime.
    const mcpB = makeRegistry(CHAT_TOOL_NAMES);
    expect(buildChatToolCatalog(mcpB)).toBeUndefined();
  });
});
