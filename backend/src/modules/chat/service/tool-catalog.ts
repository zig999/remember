// Lazy tool-catalog resolver — looks up the read-only `query`-toolset tools
// in the in-process `McpServer` registry (BR-05 v2.4) AND, when the feature
// flag `env.CHAT_INGEST_ENABLED === true`, two additional `ingest`-toolset
// tools (`start_async_ingestion`, `get_ingestion_status` — BR-44). The
// resolved catalog is memoized for the lifetime of the process.
//
// Why lazy? Tool registration is performed by `query-retrieval`,
// `knowledge-graph`, and (for the v2.4 ingestion entries) `ingestion` at boot
// time. Mounting the chat route is sequenced AFTER those registrars on the
// `/api/v1` scope, so by the first request all the required tools are
// present. Resolving on first request (instead of at module load) keeps the
// boot order tolerant — chat does not need to know which OTHER module
// registered each tool.
//
// Why memoize? The registry is mutable in principle (chat.back.md §7) but no
// existing domain mutates it post-boot. Caching the resolved `McpTool`
// references avoids a 15-entry map lookup on every chat request and matches
// the lifetime contract chat.back.md BR-05 declares.
//
// Why `undefined` on a `query`-portion miss? BR-05: "if any of the 13 query
// names is missing at resolution time, the resolver returns `undefined` and
// the route is not registered". A missing query tool is a deployment bug —
// the route registrar logs a single ERROR with the diff and does NOT serve a
// degraded chat surface.
//
// Defensive degradation on the v2.4 ingestion portion (BR-44 step 6): when
// `CHAT_INGEST_ENABLED=true` but ONE OR BOTH of the two ingest entries is
// missing in the registry, we log ERROR `chat.tool_catalog_partial_resolution`
// and FALL BACK to the 13-tool catalog (the route still mounts; the Owner
// sees no ingestion offer). This is distinct from the `query`-portion miss
// because the chat surface remains usable without the ingestion capability.

import type { Logger } from "pino";

import type { McpServer, McpTool, ToolsetName } from "../../../mcp/server.js";

/** The 13 read-only `query`-toolset tools the chat agentic loop is always
 *  allowed to call (BR-05 v2.4 step 1). */
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

/** The 2 `ingest`-toolset tools added to the chat catalog when
 *  `env.CHAT_INGEST_ENABLED === true` (BR-05 v2.4 step 2 / BR-44). Order is
 *  fixed — they appear AFTER the 13 query entries in the resolved catalog so
 *  the Anthropic `tools[]` array hash is stable across reloads (BR-44 step 2). */
export const CHAT_INGEST_TOOL_NAMES = [
  "start_async_ingestion",
  "get_ingestion_status",
] as const;

/** Toolset for the 13 read-only entries — always `query`. */
const CHAT_QUERY_TOOLSET: ToolsetName = "query";
/** Toolset for the 2 v2.4 ingestion entries — `ingest`. */
const CHAT_INGEST_TOOLSET: ToolsetName = "ingest";

/**
 * Resolved chat tool catalog: a map from tool name to the live `McpTool`
 * reference returned by `McpServer.getTool(toolset, name)`. The map is dense
 * over the names the catalog includes (13 or 15 depending on the feature
 * flag); a partial resolution of the REQUIRED query portion returns
 * `undefined`.
 */
export type ResolvedChatToolCatalog = Readonly<Record<string, McpTool>>;

/** Minimal env shape consumed by the catalog builder. Mirrors the
 *  `CHAT_INGEST_ENABLED` field on the project-wide `Env` (registered by TC-02);
 *  declared as an indexable record (with `CHAT_INGEST_ENABLED` callout) so the
 *  builder accepts the full `Env` even before TC-02 lands the property. The
 *  defensive `=== true` check below treats absence as `false`. */
export type ChatToolCatalogEnv = {
  readonly CHAT_INGEST_ENABLED?: boolean;
} & Readonly<Record<string, unknown>>;

// Module-scope cache. `null` = "not yet resolved"; `undefined` = "tried and
// the REQUIRED query portion was incomplete — do not retry"; `object` = the
// resolved catalog. The tri-state is necessary so a once-failed resolution
// stays sticky for the process lifetime (BR-05 forbids mounting the route on
// a partial query catalog).
let CACHED: ResolvedChatToolCatalog | undefined | null = null;
// Tracks the flag value used to populate `CACHED`. When a subsequent call
// presents a different flag value, we re-resolve — production never flips
// the flag at runtime (BR-44 step 4), but tests do.
let CACHED_FOR_INGEST_FLAG: boolean | null = null;

/**
 * Build (or return cached) the chat tool catalog. Idempotent for a given env.
 *
 * Returns:
 *   - `ResolvedChatToolCatalog` with 13 entries when ALL 13 query names
 *     resolve AND either `CHAT_INGEST_ENABLED=false` or the defensive
 *     degradation path fired (BR-44 step 6).
 *   - `ResolvedChatToolCatalog` with 15 entries when ALL 13 query names AND
 *     both v2.4 ingestion names resolve AND `CHAT_INGEST_ENABLED=true`.
 *   - `undefined` when at least ONE of the 13 query names is missing in the
 *     registry (route is not mounted — BR-05).
 *
 * The cached state is sticky: once `undefined` was returned for the same
 * flag value, subsequent calls return `undefined` without re-checking the
 * registry (a boot-time partial resolution of the query portion is a
 * deployment bug, not a transient condition).
 *
 * @param mcp     in-process MCP registry
 * @param env     narrowed env (only `CHAT_INGEST_ENABLED` is read)
 * @param logger  optional pino logger — used only on the BR-44 step 6
 *                defensive-degradation path to emit
 *                `chat.tool_catalog_partial_resolution` at ERROR level
 */
export function buildChatToolCatalog(
  mcp: McpServer,
  env: ChatToolCatalogEnv,
  logger?: Logger
): ResolvedChatToolCatalog | undefined {
  const ingestFlag = env.CHAT_INGEST_ENABLED === true;

  // If the cache was populated under a different flag value (test reload, or
  // a hypothetical hot toggle), discard it. Production flips the flag only
  // across BFF restarts (BR-44 step 4), so this branch is effectively dead in
  // production.
  if (CACHED !== null && CACHED_FOR_INGEST_FLAG !== ingestFlag) {
    CACHED = null;
    CACHED_FOR_INGEST_FLAG = null;
  }
  if (CACHED !== null) return CACHED;

  // --- 1. Resolve the REQUIRED 13 query entries ----------------------------
  const resolved: Record<string, McpTool> = {};
  const missingQuery: string[] = [];
  for (const name of CHAT_TOOL_NAMES) {
    const tool = mcp.getTool(CHAT_QUERY_TOOLSET, name);
    if (tool === undefined) {
      missingQuery.push(name);
    } else {
      resolved[name] = tool;
    }
  }

  if (missingQuery.length > 0) {
    // Sticky miss on the required portion — chat surface is not mountable.
    CACHED = undefined;
    CACHED_FOR_INGEST_FLAG = ingestFlag;
    return undefined;
  }

  // --- 2. Optionally resolve the 2 v2.4 ingestion entries ------------------
  // Order is preserved by appending AFTER the 13 query entries (BR-44 step 2).
  if (ingestFlag) {
    const requested = [...CHAT_INGEST_TOOL_NAMES];
    const resolvedIngest: Record<string, McpTool> = {};
    const missingIngest: string[] = [];
    for (const name of CHAT_INGEST_TOOL_NAMES) {
      const tool = mcp.getTool(CHAT_INGEST_TOOLSET, name);
      if (tool === undefined) {
        missingIngest.push(name);
      } else {
        resolvedIngest[name] = tool;
      }
    }

    if (missingIngest.length > 0) {
      // BR-44 step 6 defensive degradation: log ERROR and fall back to the
      // 13-tool catalog. The chat route still mounts; the Owner has no
      // ingestion offer until the deployment is corrected.
      logger?.error(
        {
          event: "chat.tool_catalog_partial_resolution",
          requested,
          resolved: Object.keys(resolvedIngest),
          missing: missingIngest,
        },
        "chat ingestion tool portion partially resolved — falling back to 13-tool catalog (BR-44 step 6)"
      );
      // Drop any partially-resolved ingestion entries — all-or-nothing.
    } else {
      for (const name of CHAT_INGEST_TOOL_NAMES) {
        resolved[name] = resolvedIngest[name]!;
      }
    }
  }

  // Object.freeze on the dense catalog — `McpTool` refs themselves remain
  // live (the registry owns them). Freeze the wrapper so downstream code
  // (Anthropic `tools[]` builder) cannot mutate the order or add entries.
  CACHED = Object.freeze(resolved);
  CACHED_FOR_INGEST_FLAG = ingestFlag;
  return CACHED;
}

/**
 * Test-only — reset the module-scope cache. Production code MUST NOT call
 * this; the cache is sticky by contract (BR-05). Exposed because vitest
 * exercises the lazy/missing/cached paths in the same process.
 */
export function __resetChatToolCatalogForTests(): void {
  CACHED = null;
  CACHED_FOR_INGEST_FLAG = null;
}
