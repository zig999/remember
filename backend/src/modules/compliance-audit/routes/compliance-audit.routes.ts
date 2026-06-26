// Fastify routes for the compliance-audit domain — REST surface.
//
// Mounted by the bootstrap (`app.ts`). The parent scope already enforces
// Neon Auth JWT (back spec §1 Auth row); handlers here do NOT re-check
// the token.
//
// Endpoints implemented (BR-13 — append-only; only POST is the destructive
// `compliance_delete`; everything else is GET):
//   - POST /api/v1/compliance/deletions                     (UC-01)
//   - GET  /api/v1/compliance/deletions                     (UC-02)
//   - GET  /api/v1/compliance/deletions/{complianceDeletionId} (UC-03)
//   - GET  /api/v1/audit/curation-actions                   (UC-04)
//   - GET  /api/v1/audit/curation-actions/{curationActionId} (UC-05)

import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";
import { ZodError } from "zod";

import {
  ComplianceDeleteRequestSchema,
  ComplianceDeletionIdParamSchema,
  ListComplianceDeletionsQuerySchema,
} from "../dto/compliance-delete.dto.js";
import {
  CurationActionIdParamSchema,
  ListCurationActionsQuerySchema,
} from "../dto/curation-action.dto.js";
import {
  complianceDelete,
  getComplianceDeletionById,
  getCurationActionById,
  listComplianceDeletions,
  listCurationActions,
} from "../service/compliance-audit.service.js";
import { withTransaction } from "../service/transaction.js";
import {
  InternalFailure,
  ResourceNotFoundError,
  ValidationFailure,
} from "../service/errors.js";

export interface ComplianceAuditRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
}

/**
 * Register the five compliance + audit routes. Two prefixes are used —
 * `/compliance` for the destructive verb + its audit reads, `/audit` for the
 * cross-domain CurationAction read. Both are mounted under the protected
 * `/api/v1` scope by `app.ts`.
 */
export async function registerComplianceAuditRoutes(
  app: FastifyInstance,
  deps: ComplianceAuditRouteDeps
): Promise<void> {
  // ---------------------------------------------------------------------
  // UC-01: POST /api/v1/compliance/deletions
  // ---------------------------------------------------------------------
  app.post(
    "/compliance/deletions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let body;
      try {
        body = ComplianceDeleteRequestSchema.parse(request.body ?? {});
      } catch (err) {
        return handleZodError(err, reply);
      }

      try {
        const result = await withTransaction(deps.pool, (client) =>
          complianceDelete({ logger: deps.logger }, client, body)
        );
        const status = result.outcome === "deleted" ? 201 : 200;
        return reply.status(status).send(result);
      } catch (err) {
        return handleAuditError(err, reply);
      }
    }
  );

  // ---------------------------------------------------------------------
  // UC-02: GET /api/v1/compliance/deletions
  // ---------------------------------------------------------------------
  app.get(
    "/compliance/deletions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let query;
      try {
        query = ListComplianceDeletionsQuerySchema.parse(request.query ?? {});
      } catch (err) {
        return handleZodError(err, reply);
      }
      try {
        const body = await listComplianceDeletions(deps.pool, query);
        return reply.status(200).send(body);
      } catch (err) {
        return handleAuditError(err, reply);
      }
    }
  );

  // ---------------------------------------------------------------------
  // UC-03: GET /api/v1/compliance/deletions/{complianceDeletionId}
  // ---------------------------------------------------------------------
  app.get(
    "/compliance/deletions/:complianceDeletionId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let params;
      try {
        params = ComplianceDeletionIdParamSchema.parse(request.params);
      } catch (err) {
        return handleZodError(err, reply);
      }
      try {
        const body = await getComplianceDeletionById(
          deps.pool,
          params.complianceDeletionId
        );
        return reply.status(200).send(body);
      } catch (err) {
        return handleAuditError(err, reply);
      }
    }
  );

  // ---------------------------------------------------------------------
  // UC-04: GET /api/v1/audit/curation-actions
  // ---------------------------------------------------------------------
  app.get(
    "/audit/curation-actions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let query;
      try {
        query = ListCurationActionsQuerySchema.parse(request.query ?? {});
      } catch (err) {
        return handleZodError(err, reply);
      }
      try {
        const body = await listCurationActions(deps.pool, query);
        return reply.status(200).send(body);
      } catch (err) {
        return handleAuditError(err, reply);
      }
    }
  );

  // ---------------------------------------------------------------------
  // UC-05: GET /api/v1/audit/curation-actions/{curationActionId}
  // ---------------------------------------------------------------------
  app.get(
    "/audit/curation-actions/:curationActionId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let params;
      try {
        params = CurationActionIdParamSchema.parse(request.params);
      } catch (err) {
        return handleZodError(err, reply);
      }
      try {
        const body = await getCurationActionById(
          deps.pool,
          params.curationActionId
        );
        return reply.status(200).send(body);
      } catch (err) {
        return handleAuditError(err, reply);
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

/**
 * Translate ZodError into our standard envelope. Two special-case mappings:
 *  - issue.message === 'VALIDATION_OUT_OF_RANGE' (from `superRefine` for
 *    semi-open range guards) -> error.code: VALIDATION_OUT_OF_RANGE.
 *  - empty / missing `reason` or `raw_information_id` -> the most specific
 *    code we can infer (VALIDATION_REQUIRED_FIELD vs VALIDATION_OUT_OF_RANGE).
 *  - anything else -> VALIDATION_INVALID_FORMAT.
 */
/** HTTP status for all validation (`VALIDATION_*`) failures on these routes. */
const VALIDATION_STATUS = 422;

function handleZodError(err: unknown, reply: FastifyReply): FastifyReply {
  if (!(err instanceof ZodError)) {
    throw err;
  }
  // Priority 1 — explicit semi-open range refinement.
  if (
    err.issues.some((i) => i.code === "custom" && i.message === "VALIDATION_OUT_OF_RANGE")
  ) {
    return reply.status(VALIDATION_STATUS).send({
      ok: false,
      error: {
        code: "VALIDATION_OUT_OF_RANGE",
        message: "Time range bounds must satisfy `from < to`.",
        details: { issues: zodIssuesAsDetails(err) },
      },
    });
  }
  // Priority 2 — required-field detection. Zod v4 surfaces a missing or
  // undefined field as `invalid_type` whose message mentions `received
  // undefined` (the legacy `received` property is no longer on the issue
  // object). We also keep a backwards-compatible match against `code:
  // required` for forward / older zod variants.
  const reqField = err.issues.find((i) => {
    if (i.code === "invalid_type") {
      const received = (i as { received?: string }).received;
      if (received === "undefined") return true;
      if (
        typeof i.message === "string" &&
        i.message.toLowerCase().includes("received undefined")
      ) {
        return true;
      }
    }
    if ((i.code as string) === "required") return true;
    return false;
  });
  if (reqField) {
    return reply.status(VALIDATION_STATUS).send({
      ok: false,
      error: {
        code: "VALIDATION_REQUIRED_FIELD",
        message: `Field '${reqField.path.join(".")}' is required.`,
        details: { issues: zodIssuesAsDetails(err) },
      },
    });
  }
  // Priority 3 — `reason` length / trim violations. We can detect those by
  // the path being "reason" and the issue being `too_small` (empty after
  // trim) or `too_big` (> 1000 chars). Both map to OUT_OF_RANGE.
  if (
    err.issues.some(
      (i) =>
        (i.code === "too_small" || i.code === "too_big") &&
        i.path[0] === "reason"
    )
  ) {
    return reply.status(VALIDATION_STATUS).send({
      ok: false,
      error: {
        code: "VALIDATION_OUT_OF_RANGE",
        message:
          "Field 'reason' must be non-empty after trim and ≤ 1000 characters.",
        details: { issues: zodIssuesAsDetails(err) },
      },
    });
  }
  return reply.status(VALIDATION_STATUS).send({
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

/** Map service errors -> envelope responses. */
function handleAuditError(err: unknown, reply: FastifyReply): FastifyReply {
  if (err instanceof ResourceNotFoundError) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err instanceof ValidationFailure) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err instanceof InternalFailure) {
    return reply.status(err.statusCode).send({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  throw err;
}
