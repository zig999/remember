// Wire the four `ingest` MCP tools (UC-08..UC-11) into the project's
// `McpServer` registry. Each registration is parameterised by an ambient
// `llm_run_id`: at runtime, the MCP transport opens a session, sets the
// ambient id, and registers the toolset on a per-session McpServer instance.
//
// CLAUDE.md "Architecture / Backend" + BR-28: the four `propose_*` tools are
// dual-transport (MCP + REST mirror); this module owns the MCP side. The
// transport-agnostic business logic lives in `modules/ingestion/service/`.
//
// BR-24: the JSON Schemas used by external transports (Anthropic tool-use,
// Fastify body validation) are derived from the same Zod sources once at
// module init — they are imported here from `../dto/index.js` to keep the
// MCP registration co-located with the canonical schema bundle.

import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  IngestToolDescriptions,
  IngestToolInputJsonSchemas,
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
} from "../dto/index.js";
import type { McpServer } from "../../../mcp/server.js";
import { buildProposeAttributeHandler } from "./propose-attribute.handler.js";
import { buildProposeFragmentHandler } from "./propose-fragment.handler.js";
import { buildProposeLinkHandler } from "./propose-link.handler.js";
import { buildProposeNodeHandler } from "./propose-node.handler.js";

/** Per-session dependencies the toolset registrar consumes. */
export interface IngestToolsetSessionDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  readonly llm_run_id: string;
}

/**
 * Return the JSON Schemas used by external transports (Anthropic tool-use
 * loop, future REST mirror). Exposed so the orchestrator (TC-12) can derive
 * tool defs without re-importing each schema by hand. Read-only snapshot of
 * the module-init derivation.
 */
export function getIngestToolJsonSchemas(): typeof IngestToolInputJsonSchemas {
  return IngestToolInputJsonSchemas;
}

/**
 * Register the four `ingest` tools on `mcp` under the `ingest` toolset key.
 * Tools share the ambient `llm_run_id` baked at registration time.
 *
 * If `llm_run_id` is missing or empty, BR-21 says we must NOT register the
 * toolset at all — the transport keeps the `ingest` surface invisible to
 * the LLM until a valid run is active.
 */
export function registerIngestToolset(deps: IngestToolsetSessionDeps): void {
  if (!deps.llm_run_id || deps.llm_run_id.trim() === "") {
    deps.logger.warn(
      { component: "mcp.ingest" },
      "ingest_toolset_registration_skipped_no_run"
    );
    return;
  }

  const sharedDeps = {
    pool: deps.pool,
    logger: deps.logger,
    llm_run_id: deps.llm_run_id,
  };

  // BR-24: pin the JSON Schemas at registration time so a forgotten boot-time
  // derivation surfaces here, not deep inside the future orchestrator.
  const jsonSchemas = IngestToolInputJsonSchemas;

  deps.mcp.registerTool("ingest", {
    name: "propose_fragment",
    description: IngestToolDescriptions.propose_fragment,
    inputSchema: ProposeFragmentInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeFragmentHandler(sharedDeps),
  });

  deps.mcp.registerTool("ingest", {
    name: "propose_node",
    description: IngestToolDescriptions.propose_node,
    inputSchema: ProposeNodeInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeNodeHandler({
      ...sharedDeps,
      catalog: deps.catalog,
    }),
  });

  deps.mcp.registerTool("ingest", {
    name: "propose_link",
    description: IngestToolDescriptions.propose_link,
    inputSchema: ProposeLinkInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeLinkHandler({
      ...sharedDeps,
      catalog: deps.catalog,
    }),
  });

  deps.mcp.registerTool("ingest", {
    name: "propose_attribute",
    description: IngestToolDescriptions.propose_attribute,
    inputSchema: ProposeAttributeInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeAttributeHandler({
      ...sharedDeps,
      catalog: deps.catalog,
    }),
  });

  deps.logger.info(
    {
      component: "mcp.ingest",
      llm_run_id: deps.llm_run_id,
      json_schema_tools: Object.keys(jsonSchemas),
    },
    "ingest_toolset_registered"
  );
}
