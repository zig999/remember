// Fastify routes for the curation domain — REST surface.
//
// Mounted under `/api/v1/curation/*` by the bootstrap (`app.ts`). The parent
// scope enforces Supabase JWT auth (BR-01); handlers do NOT re-check the token.
//
// Endpoints implemented:
//   - GET  /api/v1/curation/queue                            (UC-01)
//   - POST /api/v1/curation/entity-matches/{node_id}/resolve (UC-02, UC-03)
//   - POST /api/v1/curation/nodes/merge                      (UC-04)
//   - POST /api/v1/curation/disputes/resolve                 (UC-05, UC-06, UC-07)
//   - POST /api/v1/curation/items/confirm                    (UC-08)
//   - POST /api/v1/curation/items/reject                     (UC-09)
//   - POST /api/v1/curation/items/correct                    (UC-10)

import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";
import { ZodError } from "zod";

import type { CatalogSnapshot } from "../../knowledge-graph/index.js";
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
import {
  BusinessError,
  ConflictError,
  NodeDeletedError,
  ResourceNotFoundError,
  ValidationError,
} from "../service/errors.js";
import { resolveDisputeService } from "../service/dispute.service.js";
import {
  confirmItemService,
  correctItemService,
  rejectItemService,
} from "../service/item.service.js";
import { listReviewQueueService } from "../service/queue.service.js";

export interface CurationRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
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
        return handleZodError(err, reply);
      }
      try {
        const result = await resolveEntityMatchService(
          { pool: deps.pool, logger: deps.logger },
          params.node_id,
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return handleCurationError(err, reply);
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
        return handleZodError(err, reply);
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
        return handleCurationError(err, reply);
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
        return handleZodError(err, reply);
      }
      try {
        const result = await resolveDisputeService(
          { pool: deps.pool, logger: deps.logger, catalog: deps.catalog },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return handleCurationError(err, reply);
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
        return handleZodError(err, reply);
      }
      try {
        const result = await confirmItemService(
          { pool: deps.pool, logger: deps.logger },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return handleCurationError(err, reply);
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
        return handleZodError(err, reply);
      }
      try {
        const result = await rejectItemService(
          { pool: deps.pool, logger: deps.logger },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return handleCurationError(err, reply);
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
        return handleZodError(err, reply);
      }
      try {
        const result = await correctItemService(
          { pool: deps.pool, logger: deps.logger },
          body
        );
        return reply.status(200).send(result);
      } catch (err) {
        return handleCurationError(err, reply);
      }
    }
  );
}

/**
 * Translate a ZodError into our standardized error envelope. Inspects custom
 * issue messages that encode the BUSINESS_* error.code; falls back to
 * VALIDATION_INVALID_FORMAT otherwise.
 */
function handleZodError(err: unknown, reply: FastifyReply): FastifyReply {
  if (!(err instanceof ZodError)) {
    throw err;
  }
  // Priority lookup: BUSINESS_* > BUSINESS_TARGET_NODE_REQUIRED > REASON >
  // others. If multiple custom codes appear we surface the highest priority
  // per the openapi.yaml examples.
  const codePriority = [
    "BUSINESS_TARGET_NODE_REQUIRED",
    "BUSINESS_REASON_REQUIRED",
    "BUSINESS_SELF_MERGE_FORBIDDEN",
    "BUSINESS_DISPUTE_WINNER_REQUIRED",
    "BUSINESS_DISPUTE_PERIODS_REQUIRED",
    "BUSINESS_TEMPORAL_INCOHERENT",
    "BUSINESS_CORRECTION_NO_CHANGES",
    "BUSINESS_DATE_UNJUSTIFIED",
  ];
  const seen = new Set<string>();
  for (const issue of err.issues) {
    if (issue.code === "custom" && typeof issue.message === "string") {
      seen.add(issue.message);
    }
  }
  for (const code of codePriority) {
    if (seen.has(code)) {
      const status = code === "BUSINESS_SELF_MERGE_FORBIDDEN" ? 409 : 422;
      return reply.status(status).send({
        ok: false,
        error: {
          code,
          message: messageForCode(code),
          details: { issues: zodIssuesAsDetails(err) },
        },
      });
    }
  }
  return reply.status(422).send({
    ok: false,
    error: {
      code: "VALIDATION_INVALID_FORMAT",
      message: "Request payload failed validation.",
      details: { issues: zodIssuesAsDetails(err) },
    },
  });
}

function zodIssuesAsDetails(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

function messageForCode(code: string): string {
  switch (code) {
    case "BUSINESS_TARGET_NODE_REQUIRED":
      return "decision=merge_into requires target_node_id";
    case "BUSINESS_REASON_REQUIRED":
      return "reason is required for the requested operation";
    case "BUSINESS_SELF_MERGE_FORBIDDEN":
      return "survivor_id equals absorbed_id";
    case "BUSINESS_DISPUTE_WINNER_REQUIRED":
      return "decision=prefer_one requires winner_id (member of item_ids)";
    case "BUSINESS_DISPUTE_PERIODS_REQUIRED":
      return "decision=adjust_periods requires periods[] (one entry per item_id)";
    case "BUSINESS_TEMPORAL_INCOHERENT":
      return "Adjusted periods violate `valid_from < valid_to` or overlap on a functional scope";
    case "BUSINESS_CORRECTION_NO_CHANGES":
      return "corrected{} must change at least one of value, target_node_id, valid_from, valid_to";
    case "BUSINESS_DATE_UNJUSTIFIED":
      return "valid_from change requires a justification (stated|document|received)";
    default:
      return "Request payload failed validation.";
  }
}

function handleCurationError(err: unknown, reply: FastifyReply): FastifyReply {
  if (err instanceof ResourceNotFoundError) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err instanceof NodeDeletedError) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err instanceof ConflictError) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err instanceof BusinessError) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err instanceof ValidationError) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  // Defensive mapping for 23505 unique violation on the partial-guard index
  // (BR-28). Should never reach here under normal operation.
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  ) {
    return reply.status(422).send({
      ok: false,
      error: {
        code: "BUSINESS_TEMPORAL_INCOHERENT",
        message:
          "A duplicate-guard index rejected the resolution; another row currently occupies this scope.",
      },
    });
  }
  throw err;
}
