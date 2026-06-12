// Wire the four `ingest` MCP tools (UC-08..UC-11) into the project's
// `McpServer` registry. Each registration is parameterised by an ambient
// `llm_run_id`: at runtime, the MCP transport opens a session, sets the
// ambient id, and registers the toolset on a per-session McpServer instance.
//
// CLAUDE.md "Architecture / Backend": the `ingest` toolset is MCP-only;
// `query` and `curation` are mirrored in REST. This module owns ONLY the
// `ingest` side.

import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { ProposeAttributeInputSchema } from "../dto/propose-attribute.dto.js";
import { ProposeFragmentInputSchema } from "../dto/propose-fragment.dto.js";
import { ProposeLinkInputSchema } from "../dto/propose-link.dto.js";
import { ProposeNodeInputSchema } from "../dto/propose-node.dto.js";
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

  deps.mcp.registerTool("ingest", {
    name: "propose_fragment",
    description:
      "Propose an atomic InformationFragment for the active LLMRun (§14.1 of v7).",
    inputSchema: ProposeFragmentInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeFragmentHandler(sharedDeps),
  });

  deps.mcp.registerTool("ingest", {
    name: "propose_node",
    description:
      "Propose a KnowledgeNode (entity) — match-or-create under advisory lock.",
    inputSchema: ProposeNodeInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeNodeHandler({
      ...sharedDeps,
      catalog: deps.catalog,
    }),
  });

  deps.mcp.registerTool("ingest", {
    name: "propose_link",
    description:
      "Propose a KnowledgeLink between two existing nodes (5-layer validated).",
    inputSchema: ProposeLinkInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeLinkHandler({
      ...sharedDeps,
      catalog: deps.catalog,
    }),
  });

  deps.mcp.registerTool("ingest", {
    name: "propose_attribute",
    description:
      "Propose a NodeAttribute literal (5-layer validated; value parsed against key.value_type).",
    inputSchema: ProposeAttributeInputSchema as unknown as z.ZodTypeAny,
    handler: buildProposeAttributeHandler({
      ...sharedDeps,
      catalog: deps.catalog,
    }),
  });

  deps.logger.info(
    { component: "mcp.ingest", llm_run_id: deps.llm_run_id },
    "ingest_toolset_registered"
  );
}
