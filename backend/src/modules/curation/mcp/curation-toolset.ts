// MCP `curation` toolset — mirrors the REST endpoints 1:1 over the same
// service layer (ADR A28). Operations:
//   - list_review_queue
//   - resolve_entity_match
//   - merge_nodes
//   - resolve_dispute
//   - confirm_item
//   - reject_item
//   - correct_item
//
// `compliance_delete` is registered in the catalog but is owned by the
// `compliance-audit` domain — not implemented here (spec BR-18).

import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../../knowledge-graph/index.js";
import type { McpServer } from "../../../mcp/server.js";
import {
  MergeNodesBodySchema,
  ResolveEntityMatchBodySchema,
} from "../dto/entity-match.dto.js";
import { ResolveDisputeBodySchema } from "../dto/dispute.dto.js";
import {
  ConfirmItemBodySchema,
  CorrectItemBodySchema,
  RejectItemBodySchema,
} from "../dto/item.dto.js";
import { ListReviewQueueQuerySchema } from "../dto/queue.dto.js";
import {
  mergeNodesService,
  resolveEntityMatchService,
} from "../service/entity-match.service.js";
import { resolveDisputeService } from "../service/dispute.service.js";
import {
  confirmItemService,
  correctItemService,
  rejectItemService,
} from "../service/item.service.js";
import { listReviewQueueService } from "../service/queue.service.js";
import { UuidSchema } from "../dto/enums.dto.js";

export interface CurationToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

/** ResolveEntityMatchInput accepts `node_id` alongside the REST body. */
const ResolveEntityMatchToolInputSchema = z
  .object({
    node_id: UuidSchema,
  })
  .and(ResolveEntityMatchBodySchema);

export function registerCurationToolset(deps: CurationToolsetDeps): void {
  const ctx = {
    pool: deps.pool,
    logger: deps.logger,
    catalog: deps.catalog,
  };

  deps.mcp.registerTool("curation", {
    name: "list_review_queue",
    description: "List items pending human review.",
    inputSchema: ListReviewQueueQuerySchema,
    handler: async (input) =>
      listReviewQueueService({ pool: ctx.pool }, ListReviewQueueQuerySchema.parse(input)),
  });

  deps.mcp.registerTool("curation", {
    name: "resolve_entity_match",
    description: "Resolve a node pending entity-match review.",
    inputSchema: ResolveEntityMatchToolInputSchema,
    handler: async (input) => {
      const parsed = ResolveEntityMatchToolInputSchema.parse(input);
      return resolveEntityMatchService(
        { pool: ctx.pool, logger: ctx.logger },
        parsed.node_id,
        {
          decision: parsed.decision,
          target_node_id: parsed.target_node_id,
          reason: parsed.reason,
        }
      );
    },
  });

  deps.mcp.registerTool("curation", {
    name: "merge_nodes",
    description: "Merge two nodes directly.",
    inputSchema: MergeNodesBodySchema,
    handler: async (input) => {
      const parsed = MergeNodesBodySchema.parse(input);
      return mergeNodesService(
        { pool: ctx.pool, logger: ctx.logger },
        parsed.survivor_id,
        parsed.absorbed_id,
        parsed.reason
      );
    },
  });

  deps.mcp.registerTool("curation", {
    name: "resolve_dispute",
    description: "Resolve a set of items in `status = disputed`.",
    inputSchema: ResolveDisputeBodySchema,
    handler: async (input) => {
      const parsed = ResolveDisputeBodySchema.parse(input);
      return resolveDisputeService(
        { pool: ctx.pool, logger: ctx.logger, catalog: ctx.catalog },
        parsed
      );
    },
  });

  deps.mcp.registerTool("curation", {
    name: "confirm_item",
    description: "Promote an `uncertain` link or attribute to `active`.",
    inputSchema: ConfirmItemBodySchema,
    handler: async (input) =>
      confirmItemService(
        { pool: ctx.pool, logger: ctx.logger },
        ConfirmItemBodySchema.parse(input)
      ),
  });

  deps.mcp.registerTool("curation", {
    name: "reject_item",
    description: "Reject a link or attribute (set to `deleted`).",
    inputSchema: RejectItemBodySchema,
    handler: async (input) =>
      rejectItemService(
        { pool: ctx.pool, logger: ctx.logger },
        RejectItemBodySchema.parse(input)
      ),
  });

  deps.mcp.registerTool("curation", {
    name: "correct_item",
    description: "Correct a link or attribute (errata flow).",
    inputSchema: CorrectItemBodySchema,
    handler: async (input) =>
      correctItemService(
        { pool: ctx.pool, logger: ctx.logger },
        CorrectItemBodySchema.parse(input)
      ),
  });

  deps.logger.info(
    {
      component: "mcp.curation",
      tools_registered: 7,
    },
    "curation_toolset_registered"
  );
}
