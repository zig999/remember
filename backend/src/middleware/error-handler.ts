// Global Fastify error handler — single point that maps every thrown error
// to the canonical JSON envelope used by REST and MCP responses.
//
// Envelope (CLAUDE.md "Architecture / Backend"):
//   {
//     "ok": false,
//     "error": { "code": "<ERROR_CODE>", "message": "<human-readable>",
//                "details": <optional structured payload> }
//   }
//
// Error mapping (registered in docs/specs/_global/error-codes.md):
//   - AuthError                    -> 401 (code from AuthError.code)
//   - ZodError                     -> 422 VALIDATION_INVALID_FORMAT
//   - pg error: ECONNREFUSED / ETIMEDOUT / 57P03 / 57014 -> 503 SYSTEM_SERVICE_UNAVAILABLE
//   - Any other unhandled error    -> 500 SYSTEM_INTERNAL_ERROR
//
// The handler MUST NOT leak internal messages on the 500 path — the client
// gets a generic "internal error" string; the original `err.message` is
// logged server-side via pino.

import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import type { Logger } from "pino";
import { ZodError } from "zod";

import { AuthError } from "./auth.js";

/** Canonical error envelope returned by every failed request. */
export interface ErrorEnvelope {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** PostgreSQL error codes (SQLSTATE) we treat as "service unavailable". */
const PG_UNAVAILABLE_SQLSTATES: ReadonlySet<string> = new Set([
  "57P03", // cannot_connect_now
  "57014", // query_canceled (statement timeout)
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
]);

/** Node errno codes we treat as "service unavailable" when DB calls fail. */
const PG_UNAVAILABLE_ERRNOS: ReadonlySet<string> = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNRESET",
]);

/**
 * Build the Fastify error handler. Returns a closure so the bootstrap can
 * inject the project logger (we never call `console.*` in production paths).
 */
export function buildErrorHandler(logger: Logger) {
  return function errorHandler(
    err: FastifyError | Error,
    request: FastifyRequest,
    reply: FastifyReply
  ): FastifyReply {
    const { statusCode, envelope, logLevel } = classify(err);

    // Log every failure with full context — but never the request body
    // (PII rule: pino redaction handles `req.body.content/text/value`).
    logger[logLevel](
      {
        request_id: request.id,
        route: request.routeOptions?.url ?? request.url,
        method: request.method,
        error_code: envelope.error.code,
        // Original message kept server-side for diagnostics.
        cause_message: err.message,
        cause_name: err.name,
      },
      "request_failed"
    );

    return reply.status(statusCode).send(envelope);
  };
}

/**
 * Classify any thrown value into `(statusCode, envelope, logLevel)`. Pure —
 * exported for unit tests.
 */
export function classify(err: unknown): {
  statusCode: number;
  envelope: ErrorEnvelope;
  logLevel: "warn" | "error";
} {
  // 1. Auth errors — already typed.
  if (err instanceof AuthError) {
    return {
      statusCode: 401,
      envelope: { ok: false, error: { code: err.code, message: err.message } },
      logLevel: "warn",
    };
  }

  // 2. Zod parse failures — 422 with structured `issues`.
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

  // 3. Fastify validation (built-in `request.validationError`).
  //    Surfaces `statusCode = 400` and a `validation` array.
  if (isFastifyValidationError(err)) {
    return {
      statusCode: 422,
      envelope: {
        ok: false,
        error: {
          code: "VALIDATION_INVALID_FORMAT",
          message: err.message ?? "Request payload failed validation.",
          details: err.validation,
        },
      },
      logLevel: "warn",
    };
  }

  // 4. Database connectivity / statement-timeout (BR-18 of knowledge-graph).
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

  // 5. Fastify-thrown HTTP errors with a known statusCode (e.g. 404 from the
  //    router). We forward the status but rewrite the body to our envelope.
  if (isFastifyHttpError(err)) {
    return {
      statusCode: err.statusCode,
      envelope: {
        ok: false,
        error: {
          code: codeFromHttpStatus(err.statusCode),
          message: err.message,
        },
      },
      logLevel: err.statusCode >= 500 ? "error" : "warn",
    };
  }

  // 6. Anything else — generic 500. We do NOT leak the underlying message.
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

function isFastifyValidationError(
  err: unknown
): err is FastifyError & { validation: unknown[] } {
  return (
    typeof err === "object" &&
    err !== null &&
    "validation" in err &&
    Array.isArray((err as { validation: unknown }).validation)
  );
}

function isFastifyHttpError(
  err: unknown
): err is FastifyError & { statusCode: number } {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { statusCode?: unknown }).statusCode;
  return typeof code === "number" && code >= 400 && code < 600;
}

/**
 * Detect pg connection / timeout errors. `pg` exposes the SQLSTATE on
 * `err.code` (string) for protocol-level failures, and Node's `errno`/`code`
 * for socket-level ones; both shapes are checked.
 */
export function isPgUnavailable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code !== "string") return false;
  return PG_UNAVAILABLE_SQLSTATES.has(code) || PG_UNAVAILABLE_ERRNOS.has(code);
}

function codeFromHttpStatus(status: number): string {
  switch (status) {
    case 401:
      return "AUTH_UNAUTHORIZED";
    case 403:
      return "AUTH_FORBIDDEN";
    case 404:
      return "RESOURCE_NOT_FOUND";
    case 409:
      return "RESOURCE_CONFLICT";
    case 422:
      return "VALIDATION_INVALID_FORMAT";
    case 503:
      return "SYSTEM_SERVICE_UNAVAILABLE";
    default:
      return "SYSTEM_INTERNAL_ERROR";
  }
}
