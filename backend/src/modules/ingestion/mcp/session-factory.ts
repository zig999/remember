// Per-session MCP server factory for the `ingest` toolset.
//
// BR-21 (revised) + BR-28: every MCP session that wants to drive ingestion
// must carry an ambient `llm_run_id`. The session factory takes that id,
// builds a fresh `McpServer` instance, and registers the four `propose_*`
// tools scoped to the run. The toolset is invisible (zero tools registered)
// until the ambient run is set — the transport layer surfaces that as
// `STRUCTURAL_INVALID`.
//
// Why per-session McpServer (vs. shared singleton)
// ------------------------------------------------
// A single ambient `llm_run_id` cannot be safely carried as a module-level
// mutable variable on the project-wide McpServer (concurrent runs would
// race). Per-session instances scope the run-id to the lifetime of one MCP
// session, matching the "MCP session is scoped per run" constraint in the
// task contract.
//
// Real SDK note (infrastructure-pending)
// --------------------------------------
// The task references `@modelcontextprotocol/sdk` (Streamable HTTP). That
// SDK is not yet installed in `backend/package.json` (see the infra-pending
// report). The session factory deliberately depends only on the project's
// internal `McpServer` skeleton (`src/mcp/server.ts`) which is the same
// surface today's tests use. When the SDK is added, swapping
// `buildMcpServer(...)` for `new SdkMcpServer(...)` is a local change —
// the toolset registration and the dispatch contract stay identical.

import type { Pool } from "pg";
import type { Logger } from "pino";

import { buildMcpServer, type McpServer } from "../../../mcp/server.js";
import type { CatalogSnapshot } from "../catalog/catalog.js";
import { registerIngestToolset } from "./toolset.js";

/** Dependencies shared across every session — owned by the bootstrap. */
export interface IngestSessionFactoryDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

/** Per-session bag — what the factory hands back to the transport layer. */
export interface IngestSession {
  /**
   * The McpServer instance scoped to this session. The four `propose_*` tools
   * are registered against `"ingest"` toolset key with the ambient
   * `llm_run_id` baked in.
   */
  readonly mcp: McpServer;
  /** Echoed back so the transport can stamp it on dispatch logs. */
  readonly llm_run_id: string;
  /**
   * `true` iff the toolset is exposed. When the ambient `llm_run_id` is
   * empty / missing, the factory still returns a McpServer with NO tools
   * registered (BR-21 first bullet) and `tools_registered === false`. The
   * transport surfaces that as `STRUCTURAL_INVALID` without writing a
   * `tool_call` row (BR-23 exception).
   */
  readonly tools_registered: boolean;
}

/**
 * Build a fresh, run-scoped MCP session.
 *
 * Steps:
 *   1. Allocate a per-session `McpServer` (children of the project logger).
 *   2. If `llm_run_id` is non-empty: register the `ingest` toolset against
 *      it with the ambient run id and the boot-time catalog snapshot.
 *   3. If `llm_run_id` is empty / undefined: skip registration and flag
 *      `tools_registered: false`.
 *
 * The function is intentionally synchronous — there is no I/O — so the
 * transport can build a session in the path of a single MCP request.
 *
 * @param deps    Bootstrap-owned shared dependencies (pool, logger, catalog).
 * @param llmRunId  Ambient run id obtained from the MCP session bootstrap
 *                  (header, query param, or session-init message; the
 *                  transport decides).
 */
export function createIngestSession(
  deps: IngestSessionFactoryDeps,
  llmRunId: string | undefined | null
): IngestSession {
  const trimmedId = (llmRunId ?? "").trim();
  // Child logger keeps the session identifiable in the structured log stream
  // without leaking the run-id through every nested call.
  const sessionLogger = deps.logger.child({
    component: "mcp.ingest.session",
    llm_run_id: trimmedId.length > 0 ? trimmedId : null,
  });
  const mcp = buildMcpServer(sessionLogger);

  if (trimmedId.length === 0) {
    sessionLogger.warn("ingest_session_no_ambient_run");
    return { mcp, llm_run_id: "", tools_registered: false };
  }

  registerIngestToolset({
    mcp,
    pool: deps.pool,
    logger: sessionLogger,
    catalog: deps.catalog,
    llm_run_id: trimmedId,
  });

  return { mcp, llm_run_id: trimmedId, tools_registered: true };
}
