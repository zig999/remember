// Lazy tool-catalog resolver — looks up the 13 read-only `query`-toolset tools
// in the in-process `McpServer` registry (BR-05) and memoizes the result for
// the lifetime of the process.
//
// Why lazy? Tool registration is performed by `query-retrieval` and
// `knowledge-graph` at boot time. Mounting the chat route is sequenced AFTER
// those registrars on the `/api/v1` scope, so by the first request all 13
// tools are present. Resolving on first request (instead of at module load)
// keeps the boot order tolerant — chat does not need to know which OTHER
// module registered each tool.
//
// Why memoize? The registry is mutable in principle (chat.back.md §7) but no
// existing domain mutates it post-boot. Caching the resolved `McpTool`
// references avoids a 13-entry map lookup on every chat request and matches
// the lifetime contract chat.back.md BR-05 declares.
//
// Why `undefined` on a miss? BR-05: "if any of the 13 names is missing at
// resolution time, the resolver returns `undefined` and the route is not
// registered". A missing tool is a deployment bug — the route registrar logs
// a single ERROR with the diff and does NOT serve a degraded chat surface.

import type { McpServer, McpTool, ToolsetName } from "../../../mcp/server.js";

/** The 13 read-only tools the chat agentic loop is allowed to call (BR-05). */
export const CHAT_TOOL_NAMES = [
  // 9 from knowledge-graph (.spec.md BR-05).
  "get_node",
  "traverse",
  "get_history_link",
  "get_history_attribute",
  "get_history_attribute_key",
  "list_nodes",
  "list_node_types",
  "list_link_types",
  "list_attribute_keys",
  // 4 from query-retrieval (.spec.md BR-05).
  "search",
  "get_provenance_link",
  "get_provenance_attribute",
  "get_provenance_fragment",
] as const;

/** Toolset the chat catalog draws from — always `query` (read-only). */
const CHAT_TOOLSET: ToolsetName = "query";

/**
 * Resolved chat tool catalog: a map from tool name to the live `McpTool`
 * reference returned by `McpServer.getTool('query', name)`. The map is dense
 * (all 13 keys present); a partial resolution returns `undefined` instead.
 */
export type ResolvedChatToolCatalog = Readonly<Record<string, McpTool>>;

// Module-scope cache. `null` = "not yet resolved"; `undefined` = "tried and at
// least one tool was missing — do not retry"; `object` = the resolved catalog.
// The tri-state is necessary so a once-failed resolution stays sticky for the
// process lifetime (BR-05 forbids mounting the route on a partial catalog).
let CACHED: ResolvedChatToolCatalog | undefined | null = null;

/**
 * Build (or return cached) the chat tool catalog. Idempotent.
 *
 * Returns:
 *   - `ResolvedChatToolCatalog` when ALL 13 names resolve.
 *   - `undefined` when at least ONE name is missing in the registry.
 *
 * The cached state is sticky: once `undefined` was returned, subsequent calls
 * return `undefined` without re-checking the registry (a boot-time partial
 * resolution is a deployment bug, not a transient condition).
 */
export function buildChatToolCatalog(
  mcp: McpServer
): ResolvedChatToolCatalog | undefined {
  if (CACHED !== null) return CACHED;

  const resolved: Record<string, McpTool> = {};
  const missing: string[] = [];
  for (const name of CHAT_TOOL_NAMES) {
    const tool = mcp.getTool(CHAT_TOOLSET, name);
    if (tool === undefined) {
      missing.push(name);
    } else {
      resolved[name] = tool;
    }
  }

  if (missing.length > 0) {
    CACHED = undefined;
    return undefined;
  }

  CACHED = Object.freeze(resolved);
  return CACHED;
}

/**
 * Test-only — reset the module-scope cache. Production code MUST NOT call
 * this; the cache is sticky by contract (BR-05). Exposed because vitest
 * exercises the lazy/missing/cached paths in the same process.
 */
export function __resetChatToolCatalogForTests(): void {
  CACHED = null;
}
