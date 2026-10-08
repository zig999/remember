import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../../knowledge-graph/index.js";
import type { CatalogSnapshot as IngestionCatalogSnapshot } from "../../ingestion/index.js";
import {
  MergeNodesBodySchema,
  NodeIdPathSchema,
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
import { computeCurationMetricsService } from "../service/metrics.service.js";
import { listReviewQueueService } from "../service/queue.service.js";
import { mapErrorToHttpResponse } from "../mcp/error-envelope.js";
import { sendError } from "./send-error.js";

export interface CurationRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  readonly ingestionCatalog: IngestionCatalogSnapshot;
}

export async function registerCurationRoutes(
  app: FastifyInstance,
  deps: CurationRouteDeps
): Promise<void> {
  app.get(
    "/queue",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = ListReviewQueueQuerySchema.parse(request.query ?? {});
      const body = await listReviewQueueService({ pool: deps.pool }, query);
      return reply.status(200).send(body);
    }
  );

  app.get(
    "/metrics",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await computeCurationMetricsService({
          pool: deps.pool,
          logger: deps.logger,
        });
        return reply.status(200).send(result);
      } catch (err) {
        const { statusCode, envelope, logLevel } = mapErrorToHttpResponse(err);
        const degradedStatus = statusCode === 500 ? 503 : statusCode;
        const degradedEnvelope =
          statusCode === 500
            ? {
                ok: false as const,
                error: {
                  code: "SYSTEM_SERVICE_UNAVAILABLE",
                  message: "A backing service is temporarily unavailable.",
                },
              }
            : envelope;
        if (logLevel === "error" || statusCode === 500) {
          deps.logger.warn(
            {
              route: "GET /api/v1/curation/metrics",
              operation: "getCurationMetrics",
              transport: "rest",
              original_status: statusCode,
              outcome: degradedStatus,
              error_code: degradedEnvelope.error.code,
              error_class:
                err instanceof Error
                  ? (err as { code?: string }).code ?? err.name
                  : typeof err,
              cause_message:
                err instanceof Error ? err.message : String(err),
            },
            "curation_metrics_degraded"
          );
        }
        return reply.status(degradedStatus).send(degradedEnvelope);
      }
    }
  );

  app.post(
    "/entity-matches/:node_id/resolve",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = NodeIdPathSchema.parse(request.params);
      let body;
      try {
        body = ResolveEntityMatchBodySchema.parse(request.body ?? {});
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
      try {
        const result = await resolveEntityMatchService(
          { pool: deps.pool, logger: deps.logger },
          params.node_id,
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
    }
  );

  app.post(
    "/nodes/merge",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let body;
      try {
        body = MergeNodesBodySchema.parse(request.body ?? {});
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
      try {
        const result = await mergeNodesService(
          { pool: deps.pool, logger: deps.logger },
          body.survivor_id,
          body.absorbed_id,
          body.reason
        );
        return reply.status(200).send(result);
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
    }
  );

  app.post(
    "/disputes/resolve",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let body;
      try {
        body = ResolveDisputeBodySchema.parse(request.body ?? {});
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
      try {
        const result = await resolveDisputeService(
          { pool: deps.pool, logger: deps.logger, catalog: deps.catalog },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
    }
  );

  app.post(
    "/items/confirm",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let body;
      try {
        body = ConfirmItemBodySchema.parse(request.body ?? {});
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
      try {
        const result = await confirmItemService(
          {
            pool: deps.pool,
            logger: deps.logger,
            catalog: deps.ingestionCatalog,
          },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
    }
  );

  app.post(
    "/items/reject",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let body;
      try {
        body = RejectItemBodySchema.parse(request.body ?? {});
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
      try {
        const result = await rejectItemService(
          {
            pool: deps.pool,
            logger: deps.logger,
            catalog: deps.ingestionCatalog,
          },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
    }
  );

  app.post(
    "/items/correct",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let body;
      try {
        body = CorrectItemBodySchema.parse(request.body ?? {});
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
      try {
        const result = await correctItemService(
          {
            pool: deps.pool,
            logger: deps.logger,
            catalog: deps.ingestionCatalog,
          },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
    }
  );
}
