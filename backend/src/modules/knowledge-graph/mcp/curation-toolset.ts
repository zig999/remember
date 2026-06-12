// Registration skeleton for the MCP `curation` toolset (resolve_entity_match,
// merge_nodes, resolve_dispute, confirm_item, reject_item, correct_item,
// compliance_delete). Owned by the `curation` domain (out of scope for
// TC-04), but the registration entry point lives here next to the
// knowledge-graph MCP wiring so the bootstrap has a single set of imports
// for the read-side surface (ADR A28).
//
// TC-04 registers zero tools — the actual handlers land in the curation
// domain TC. The bootstrap calls this so the integration is exercised
// today.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { McpServer } from "../../../mcp/server.js";

/** Per-startup dependencies the toolset registrar consumes. */
export interface CurationToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
}

export function registerCurationToolset(deps: CurationToolsetDeps): void {
  deps.logger.info(
    {
      component: "mcp.curation",
      tools_registered: 0,
      note: "skeleton — curation tools land in the curation domain TC",
    },
    "curation_toolset_registered"
  );
}
