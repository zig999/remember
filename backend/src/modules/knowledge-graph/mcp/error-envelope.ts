// Shared error-to-envelope mapper for knowledge-graph and query-retrieval.
//
// BR-24 (knowledge-graph.back.md and query-retrieval.back.md): the inline
// error mappers that lived in each domain's `routes.ts` are extracted here so
// that REST and MCP transports surface IDENTICAL error codes / messages /
// details for every thrown service error. The refactor is behaviour-preserving:
// no HTTP status code, error code, or response shape changes when a route
// switches from its old inline mapper to this module.
//
// Two exports, sharing one classification core:
//   - `mapErrorToEnvelope(err)`     -> `{ ok: false, error: { code, message, details? } }`
//                                      The "pure envelope" form documented in the
//                                      task contract. Used by the MCP query
//                                      transport (TC-02+), which speaks JSON-RPC
//                                      and does not carry an HTTP status code.
//   - `mapErrorToHttpResponse(err)` -> `{ statusCode, envelope, logLevel }`
//                                      Used by the REST routes that previously
//                                      called `reply.status(...).send({...})`
//                                      with an inline `instanceof` cascade. The
//                                      classification core is identical to the
//                                      envelope-only path; this form just
//                                      carries the per-error HTTP status.
//
// Both forms accept an optional `extraDetails` object. The REST handlers
// merge route-scoped context into `details` (e.g. `{ node_id }`, `{ link_id }`)
// so this argument keeps the existing behaviour. MCP callers pass no extras.
//
// pg / unknown handling MIRRORS `backend/src/middleware/error-handler.ts`:
//   - pg connection errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, ECONNRESET) and
//     pg SQLSTATEs (57P03, 57014, 08000, 08003, 08006) -> 503 SYSTEM_SERVICE_UNAVAILABLE
//   - Anything else -> 500 SYSTEM_INTERNAL_ERROR (generic message, no leak)
//
// This module is intentionally independent of Fastify -- it does not import
// `FastifyReply` so the MCP transport (which has no reply) can consume it.

import { ZodError } from "zod";

import {
  InvalidTraverseDepthError,
  NodeDeletedError,
  ResourceNotFoundError,
  UnknownAttributeKeyError,
  UnknownLinkTypeError,
  UnknownNodeTypeError,
} from "../service/errors.js";
import {
  EmptyProvenanceError,
  FragmentNotAcceptedError,
  InvalidSearchLayerError,
  InvalidSearchQueryError,
  RawInformationDeletedError,
} from "../../query-retrieval/service/errors.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Canonical error envelope returned on every failed request / tool call. */
export interface ErrorEnvelope {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

/**
 * Full mapping result. REST routes consume `statusCode` to set
 * `reply.status(...)`; MCP transports ignore it.
 */
export interface MappedError {
  readonly statusCode: number;
  readonly envelope: ErrorEnvelope;
  readonly logLevel: "warn" | "error";
}

// ---------------------------------------------------------------------------
// pg detection — kept in sync with `backend/src/middleware/error-handler.ts`.
// ---------------------------------------------------------------------------

const PG_UNAVAILABLE_SQLSTATES: ReadonlySet<string> = new Set([
  "57P03", // cannot_connect_now
  "57014", // query_canceled (statement timeout)
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
]);

const PG_UNAVAILABLE_ERRNOS: ReadonlySet<string> = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNRESET",
]);

/** Public for unit tests — detects "pg is sick" without depending on `pg`. */
export function isPgUnavailable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code !== "string") return false;
  return PG_UNAVAILABLE_SQLSTATES.has(code) || PG_UNAVAILABLE_ERRNOS.has(code);
}

// ---------------------------------------------------------------------------
// Mapper — pure function, no I/O. The single source of truth for both forms.
// ---------------------------------------------------------------------------

/**
 * Map any thrown value to the full `{ statusCode, envelope, logLevel }` triple.
 *
 * `extraDetails` is merged into `envelope.error.details` for error classes that
 * already carry their own per-class detail object (currently:
 * `ResourceNotFoundError`, `NodeDeletedError`, `UnknownLinkTypeError`,
 * `InvalidTraverseDepthError`, `UnknownAttributeKeyError`). For error classes
 * whose details are intentionally fixed (e.g. `InvalidSearchQueryError` already
 * carries a structured `details`; `EmptyProvenanceError` deliberately omits
 * details), the extras are ignored to preserve existing REST behaviour.
 *
 * Behaviour mirrors the inline mappers that previously lived in:
 *   - `backend/src/modules/knowledge-graph/routes/knowledge-graph.routes.ts`
 *   - `backend/src/modules/query-retrieval/routes/query-retrieval.routes.ts`
 *
 * Unknown errors collapse to 500 SYSTEM_INTERNAL_ERROR with a generic message;
 * `err.message` is NEVER leaked to the client (caller logs the original at
 * ERROR level — `logLevel` in the result signals that).
 */
export function mapErrorToHttpResponse(
  err: unknown,
  extraDetails?: Record<string, unknown>
): MappedError {
  // ----- knowledge-graph business errors -----

  if (err instanceof ResourceNotFoundError) {
    return ok422or(404, "warn", {
      code: err.code,
      message: err.message,
      details: { entity: err.entity, id: err.entityId, ...extraDetails },
    });
  }
  if (err instanceof NodeDeletedError) {
    return ok422or(410, "warn", {
      code: err.code,
      message: err.message,
      details: { node_id: err.nodeId, ...extraDetails },
    });
  }
  if (err instanceof UnknownNodeTypeError) {
    return ok422or(422, "warn", {
      code: err.code,
      message: err.message,
      details: { node_type: err.nodeType, ...extraDetails },
    });
  }
  if (err instanceof UnknownLinkTypeError) {
    return ok422or(422, "warn", {
      code: err.code,
      message: err.message,
      details: { link_type: err.linkType, ...extraDetails },
    });
  }
  if (err instanceof InvalidTraverseDepthError) {
    return ok422or(422, "warn", {
      code: err.code,
      message: err.message,
      details: { depth: err.depth, max: err.max, ...extraDetails },
    });
  }
  if (err instanceof UnknownAttributeKeyError) {
    return ok422or(404, "warn", {
      code: err.code,
      message: err.message,
      details: {
        node_type: err.nodeType,
        key: err.key,
        ...extraDetails,
      },
    });
  }

  // ----- query-retrieval business errors -----

  if (err instanceof InvalidSearchQueryError) {
    // `details` is already structured by the error class — preserve verbatim.
    return ok422or(422, "warn", {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }
  if (err instanceof InvalidSearchLayerError) {
    return ok422or(422, "warn", {
      code: err.code,
      message: err.message,
      details: { invalid: err.invalid, allowed: err.allowed },
    });
  }
  if (err instanceof FragmentNotAcceptedError) {
    return ok422or(404, "warn", {
      code: err.code,
      message: err.message,
      details: { fragment_id: err.fragmentId, status: err.status },
    });
  }
  if (err instanceof RawInformationDeletedError) {
    return ok422or(410, "warn", {
      code: err.code,
      message: err.message,
      details: {
        raw_information_id: err.rawInformationId,
        deleted_at: err.deletedAt.toISOString(),
      },
    });
  }
  if (err instanceof EmptyProvenanceError) {
    // Legacy-data inconsistency surfaces as a generic 500 — by design the
    // class carries no `details` at the wire (anchor info stays server-side
    // for the operator's audit log only).
    return {
      statusCode: 500,
      envelope: {
        ok: false,
        error: {
          code: err.code,
          message: "Internal server error.",
        },
      },
      logLevel: "error",
    };
  }

  // ----- shared cross-cutting errors -----

  if (err instanceof ZodError) {
    return {
      statusCode: 422,
      envelope: {
        ok: false,
        error: {
          code: "VALIDATION_INVALID_FORMAT",
          message: "Request payload failed validation.",
          details: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      },
      logLevel: "warn",
    };
  }

  if (isPgUnavailable(err)) {
    return {
      statusCode: 503,
      envelope: {
        ok: false,
        error: {
          code: "SYSTEM_SERVICE_UNAVAILABLE",
          message: "A backing service is temporarily unavailable.",
        },
      },
      logLevel: "error",
    };
  }

  // Unknown — generic 500. Do NOT leak `err.message` to the client.
  return {
    statusCode: 500,
    envelope: {
      ok: false,
      error: {
        code: "SYSTEM_INTERNAL_ERROR",
        message: "Internal server error.",
      },
    },
    logLevel: "error",
  };
}

/**
 * Map any thrown value to the canonical MCP envelope. Same classification
 * core as `mapErrorToHttpResponse`, but returns only the wire-level envelope
 * (no `statusCode` — MCP responses are HTTP 200 + JSON-RPC `result`).
 *
 * Signature matches the task contract:
 *   `mapErrorToEnvelope(err: unknown): { ok: false, error: { code, message, details? } }`
 */
export function mapErrorToEnvelope(
  err: unknown,
  extraDetails?: Record<string, unknown>
): ErrorEnvelope {
  return mapErrorToHttpResponse(err, extraDetails).envelope;
}

// ---------------------------------------------------------------------------
// Small helper — single-line factory so the body of every business branch is
// uniform; status / logLevel default to the typical "client-side fault, warn".
// Errors whose semantics differ (EmptyProvenanceError, pg, unknown) bypass it.
// ---------------------------------------------------------------------------

function ok422or(
  statusCode: number,
  logLevel: "warn" | "error",
  error: ErrorEnvelope["error"]
): MappedError {
  return {
    statusCode,
    logLevel,
    envelope: { ok: false, error },
  };
}
