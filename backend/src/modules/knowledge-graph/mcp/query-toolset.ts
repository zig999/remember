// Registration skeleton for the MCP `query` toolset (`get_node`, `traverse`,
// `get_history`).
//
// Per CLAUDE.md "Architecture / Backend" / ADR A28, `query` operations are
// mirrored 1:1 in REST and MCP. The REST surface for `get_node` is delivered
// in this TC (TC-04); the MCP tools that wrap it — plus `traverse` and
// `get_history` — are scheduled for TC-05 (back spec §1 stack note).
//
// This file exposes a stable registration entry point so TC-05 can plug in
// without changing the bootstrap. Today it registers ZERO tools, but proves
// that the integration point is wired (and is exercised by an integration
// test).

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type { McpServer } from "../../../mcp/server.js";

/** Per-startup dependencies the toolset registrar consumes. */
export interface QueryToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

/**
 * Register the `query` MCP toolset. TC-04 wires the registration entry
 * point and a no-op body; the actual tools land in TC-05.
 */
export function registerQueryToolset(deps: QueryToolsetDeps): void {
  // Stable log line — used by the smoke integration test to confirm the
  // registration callback was invoked at boot.
  deps.logger.info(
    {
      component: "mcp.query",
      tools_registered: 0,
      note: "skeleton — get_node/traverse/get_history land in TC-05",
    },
    "query_toolset_registered"
  );
}
