// Shared error-to-envelope mapper for the curation domain.
//
// BR-30 (curation.back.md): the inline `handleZodError` + `handleCurationError`
// cascades that lived in `curation/routes/curation.routes.ts` are extracted
// here so REST and MCP transports surface IDENTICAL error codes / messages /
// details for every thrown service error. The refactor is behaviour-preserving:
// no HTTP status code, error code, or response shape changes when a route
// switches from its old inline mapper to this module.
//
// Two exports, sharing one classification core:
//   - `mapErrorToEnvelope(err)`     -> `{ ok: false, error: { code, message, details? } }`
//                                      The "pure envelope" form documented in
//                                      the task contract. Used by the MCP
//                                      curation transport (TC-02+), which speaks
//                                      JSON-RPC and does not carry an HTTP
//                                      status code.
//   - `mapErrorToHttpResponse(err)` -> `{ statusCode, envelope, logLevel }`
//                                      Used by the REST routes that previously
//                                      called `reply.status(...).send({...})`
//                                      with an inline `instanceof` cascade and
//                                      a custom Zod-issue priority list. The
//                                      classification core is identical to the
//                                      envelope-only path; this form just
//                                      carries the per-error HTTP status.
//
// pg / unknown handling MIRRORS `backend/src/middleware/error-handler.ts`:
//   - pg connection errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, ECONNRESET) and
//     pg SQLSTATEs (57P03, 57014, 08000, 08003, 08006) -> 503 SYSTEM_SERVICE_UNAVAILABLE
//   - pg unique violation (SQLSTATE 23505) on the duplicate-guard partial
//     index -> 422 BUSINESS_TEMPORAL_INCOHERENT (defensive; BR-28)
//   - Anything else -> 500 SYSTEM_INTERNAL_ERROR (generic message, no leak)
//
// This module is intentionally independent of Fastify -- it does not import
// `FastifyReply` so the MCP transport (which has no reply) can consume it.

import { ZodError } from "zod";

import {
  BusinessError,
  ConflictError,
  NodeDeletedError,
  ResourceNotFoundError,
  ValidationError,
} from "../service/errors.js";

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
// pg detection -- kept in sync with `backend/src/middleware/error-handler.ts`
// and `knowledge-graph/mcp/error-envelope.ts`.
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

/** Public for unit tests -- detects "pg is sick" without depending on `pg`. */
export function isPgUnavailable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code !== "string") return false;
  return PG_UNAVAILABLE_SQLSTATES.has(code) || PG_UNAVAILABLE_ERRNOS.has(code);
}

/** Detect pg SQLSTATE 23505 (unique_violation) -- defensive BR-28 fallback. */
function isPgUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  return code === "23505";
}

// ---------------------------------------------------------------------------
// ZodError -> custom-code priority list (BR-30).
//
// The curation DTOs encode `BUSINESS_*` cross-field validations as Zod
// `custom` issues whose `message` is the BUSINESS_* code itself. When multiple
// custom codes fire on the same parse, the priority list below decides which
// one surfaces (matching the existing REST behaviour byte-for-byte).
// ---------------------------------------------------------------------------

const ZOD_CUSTOM_CODE_PRIORITY: readonly string[] = [
  "BUSINESS_TARGET_NODE_REQUIRED",
  "BUSINESS_REASON_REQUIRED",
  "BUSINESS_SELF_MERGE_FORBIDDEN",
  "BUSINESS_DISPUTE_WINNER_REQUIRED",
  "BUSINESS_DISPUTE_PERIODS_REQUIRED",
  "BUSINESS_TEMPORAL_INCOHERENT",
  "BUSINESS_CORRECTION_NO_CHANGES",
  "BUSINESS_DATE_UNJUSTIFIED",
];

function messageForZodCustomCode(code: string): string {
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

function zodIssuesAsDetails(err: ZodError): Array<{ path: string; message: string }> {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

/**
 * Classify a `ZodError` against the BR-30 priority list. Returns the matched
 * BUSINESS_* code (with its HTTP status) when a custom-issue message hits one
 * of the codes; falls back to `VALIDATION_INVALID_FORMAT` / 422 otherwise.
 *
 * Exported for unit tests (BR-30 parity assertions) -- not for the route layer.
 */
export function mapZodError(err: ZodError): MappedError {
  const seen = new Set<string>();
  for (const issue of err.issues) {
    if (issue.code === "custom" && typeof issue.message === "string") {
      seen.add(issue.message);
    }
  }
  for (const code of ZOD_CUSTOM_CODE_PRIORITY) {
    if (seen.has(code)) {
      const status = code === "BUSINESS_SELF_MERGE_FORBIDDEN" ? 409 : 422;
      return {
        statusCode: status,
        logLevel: "warn",
        envelope: {
          ok: false,
          error: {
            code,
            message: messageForZodCustomCode(code),
            details: { issues: zodIssuesAsDetails(err) },
          },
        },
      };
    }
  }
  return {
    statusCode: 422,
    logLevel: "warn",
    envelope: {
      ok: false,
      error: {
        code: "VALIDATION_INVALID_FORMAT",
        message: "Request payload failed validation.",
        details: { issues: zodIssuesAsDetails(err) },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Mapper -- pure function, no I/O. The single source of truth for both forms.
// ---------------------------------------------------------------------------

/**
 * Map any thrown value to the full `{ statusCode, envelope, logLevel }` triple.
 *
 * Behaviour mirrors the inline mappers that previously lived in
 * `backend/src/modules/curation/routes/curation.routes.ts` (functions
 * `handleZodError` at line 253 and `handleCurationError` at line 329). The
 * priority order is:
 *
 *   1. Curation sentinel hierarchy (ResourceNotFoundError, NodeDeletedError,
 *      ConflictError, BusinessError, ValidationError) -- each carries its own
 *      `statusCode` + `code` + `details`.
 *   2. ZodError -- custom-issue messages classified via the BR-30 priority
 *      list (see `ZOD_CUSTOM_CODE_PRIORITY`); fallback `VALIDATION_INVALID_FORMAT`.
 *   3. pg SQLSTATE `23505` (unique_violation) -- defensive map to
 *      `BUSINESS_TEMPORAL_INCOHERENT` 422 (BR-28).
 *   4. pg connection / timeout -- 503 `SYSTEM_SERVICE_UNAVAILABLE`.
 *   5. Anything else -- 500 `SYSTEM_INTERNAL_ERROR` with a generic message;
 *      `err.message` is NEVER leaked to the client (caller logs the original
 *      at ERROR level -- `logLevel` in the result signals that).
 */
export function mapErrorToHttpResponse(err: unknown): MappedError {
  // ----- curation sentinels (instance hierarchy from service/errors.ts) -----

  if (err instanceof ResourceNotFoundError) {
    return {
      statusCode: err.statusCode,
      logLevel: "warn",
      envelope: {
        ok: false,
        error: { code: err.code, message: err.message, details: err.details },
      },
    };
  }
  if (err instanceof NodeDeletedError) {
    return {
      statusCode: err.statusCode,
      logLevel: "warn",
      envelope: {
        ok: false,
        error: { code: err.code, message: err.message, details: err.details },
      },
    };
  }
  if (err instanceof ConflictError) {
    return {
      statusCode: err.statusCode,
      logLevel: "warn",
      envelope: {
        ok: false,
        error: { code: err.code, message: err.message, details: err.details },
      },
    };
  }
  // NOTE: `TemporalIncoherentError` extends `BusinessError` -- the
  // `instanceof BusinessError` branch covers it.
  if (err instanceof BusinessError) {
    return {
      statusCode: err.statusCode,
      logLevel: "warn",
      envelope: {
        ok: false,
        error: { code: err.code, message: err.message, details: err.details },
      },
    };
  }
  if (err instanceof ValidationError) {
    return {
      statusCode: err.statusCode,
      logLevel: "warn",
      envelope: {
        ok: false,
        error: { code: err.code, message: err.message, details: err.details },
      },
    };
  }

  // ----- shared cross-cutting errors -----

  if (err instanceof ZodError) {
    return mapZodError(err);
  }

  // Defensive: SQLSTATE 23505 on the partial-guard index (BR-28). Should
  // never reach here under normal operation -- a typed `TemporalIncoherentError`
  // would have been thrown by the service first. We keep the fallback so a
  // service path that bubbles a raw pg error still produces the right wire
  // code instead of leaking 500.
  if (isPgUniqueViolation(err)) {
    return {
      statusCode: 422,
      logLevel: "warn",
      envelope: {
        ok: false,
        error: {
          code: "BUSINESS_TEMPORAL_INCOHERENT",
          message:
            "A duplicate-guard index rejected the resolution; another row currently occupies this scope.",
        },
      },
    };
  }

  if (isPgUnavailable(err)) {
    return {
      statusCode: 503,
      logLevel: "error",
      envelope: {
        ok: false,
        error: {
          code: "SYSTEM_SERVICE_UNAVAILABLE",
          message: "A backing service is temporarily unavailable.",
        },
      },
    };
  }

  // Unknown -- generic 500. Do NOT leak `err.message` to the client.
  return {
    statusCode: 500,
    logLevel: "error",
    envelope: {
      ok: false,
      error: {
        code: "SYSTEM_INTERNAL_ERROR",
        message: "Internal server error.",
      },
    },
  };
}

/**
 * Map any thrown value to the canonical MCP envelope. Same classification
 * core as `mapErrorToHttpResponse`, but returns only the wire-level envelope
 * (no `statusCode` -- MCP responses are HTTP 200 + JSON-RPC `result`).
 *
 * Signature matches the task contract:
 *   `mapErrorToEnvelope(err: unknown): { ok: false, error: { code, message, details? } }`
 */
export function mapErrorToEnvelope(err: unknown): ErrorEnvelope {
  return mapErrorToHttpResponse(err).envelope;
}
