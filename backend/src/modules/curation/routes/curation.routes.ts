// Fastify routes for the curation domain — REST surface.
//
// Mounted under `/api/v1/curation/*` by the bootstrap (`app.ts`). The parent
// scope enforces Neon Auth JWT (BR-01); handlers do NOT re-check the token.
//
// Endpoints implemented:
//   - GET  /api/v1/curation/queue                            (UC-01)
//   - GET  /api/v1/curation/metrics                          (BR-33)
//   - POST /api/v1/curation/entity-matches/{node_id}/resolve (UC-02, UC-03)
//   - POST /api/v1/curation/nodes/merge                      (UC-04)
//   - POST /api/v1/curation/disputes/resolve                 (UC-05, UC-06, UC-07)
//   - POST /api/v1/curation/items/confirm                    (UC-08)
//   - POST /api/v1/curation/items/reject                     (UC-09)
//   - POST /api/v1/curation/items/correct                    (UC-10)
//
// Error mapping: thrown service / Zod errors flow through the shared
// `mapErrorToHttpResponse` mapper in `curation/mcp/error-envelope.ts`
// (BR-30). The mapper is the single source of truth for both REST and the
// (future) MCP curation transport; this file no longer carries inline
// `handleZodError` / `handleCurationError` cascades.

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

export interface CurationRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  /**
   * Ingestion catalog snapshot — separate from `catalog` because only the
   * ingestion catalog carries the closed-value-domain map
   * (`attributeValidValuesByKeyId`) materialized by TC-02. Required by
   * `correctItemService` (UC-10 / BR-23). The knowledge-graph snapshot is
   * still used by the dispute service and the queue listing.
   */
  readonly ingestionCatalog: IngestionCatalogSnapshot;
}

/**
 * Apply the shared mapper's result to a Fastify reply. Encapsulates the
 * `reply.status(...).send(...)` glue so every route shares one call shape.
 * Unknown-error 500s are NOT re-thrown to the global handler here: the
 * shared mapper already produces the canonical SYSTEM_INTERNAL_ERROR /
 * SYSTEM_SERVICE_UNAVAILABLE envelopes byte-identical to what the global
 * handler would emit (see `backend/src/middleware/error-handler.ts`), and
 * surfacing them from this layer keeps REST and MCP error codes in lockstep.
 */
function sendError(
  err: unknown,
  reply: FastifyReply,
  logger: Logger
): FastifyReply {
  const { statusCode, envelope, logLevel } = mapErrorToHttpResponse(err);
  // Infra / unknown faults (logLevel "error": pg unavailable, unhandled
  // exceptions) have their `err.message` masked in the envelope. Log the
  // original server-side so the cause is not lost — before the BR-30 refactor
  // these errors were re-thrown to the global handler, which logged them with
  // this same shape (see middleware/error-handler.ts). Expected client-driven
  // faults (logLevel "warn": business / validation / not-found) are NOT logged
  // here, matching the pre-refactor behaviour and avoiding log noise.
  if (logLevel === "error") {
    logger.error(
      {
        route: reply.request.routeOptions?.url ?? reply.request.url,
        method: reply.request.method,
        error_code: envelope.error.code,
        cause_message: err instanceof Error ? err.message : String(err),
        cause_name: err instanceof Error ? err.name : typeof err,
      },
      "curation_request_failed"
    );
  }
  return reply.status(statusCode).send(envelope);
}

export async function registerCurationRoutes(
  app: FastifyInstance,
  deps: CurationRouteDeps
): Promise<void> {
  // ---------------------------------------------------------------------
  // UC-01: GET /queue
  // ---------------------------------------------------------------------
  app.get(
    "/queue",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = ListReviewQueueQuerySchema.parse(request.query ?? {});
      const body = await listReviewQueueService({ pool: deps.pool }, query);
      return reply.status(200).send(body);
    }
  );

  // ---------------------------------------------------------------------
  // BR-33: GET /metrics — read-only §16 calibration snapshot.
  //
  // Wraps the shared mapper with a graceful-degradation override: ANY residual
  // 500 outcome is re-mapped to 503 SYSTEM_SERVICE_UNAVAILABLE so the front
  // spec MetricsStrip (R1) can fall back to per-kind totals from /queue. 401
  // auth failures and 2xx responses are NEVER degraded.
  //
  // The original `error_class` is preserved in the server-side WARN log via
  // sendError's existing `logLevel: "error"` branch (no silent swallow —
  // CLAUDE.md Rule 12 "Fail Loud").
  // ---------------------------------------------------------------------
  app.get(
    "/metrics",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await computeCurationMetricsService({
          pool: deps.pool,
          logger: deps.logger,
        });
        // Bare success body — consistent with every other curation REST
        // endpoint (queue/confirm/reject/...). The SPA's httpCuration returns
        // the raw 2xx JSON, so an `{ ok, result }` wrapper here would surface
        // as all-undefined fields client-side (toCurationMetrics → parseIso
        // throws on `computed_at`). Error/degraded paths stay enveloped below.
        return reply.status(200).send(result);
      } catch (err) {
        // Apply the shared mapper first to get the canonical envelope; THEN
        // re-map residual 500 → 503 per BR-33's graceful-degradation contract.
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
        // Preserve "Fail Loud" — log the original cause server-side for the
        // 503 and 500-mapped-to-503 cases (the masked envelope hides it from
        // the client). The shared mapper's logLevel decides WARN vs ERROR.
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

  // ---------------------------------------------------------------------
  // UC-02 + UC-03: POST /entity-matches/{node_id}/resolve
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // UC-04: POST /nodes/merge
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // UC-05 + UC-06 + UC-07: POST /disputes/resolve
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // UC-08: POST /items/confirm
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // UC-09: POST /items/reject
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // UC-10: POST /items/correct
  // ---------------------------------------------------------------------
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
