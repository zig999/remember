// Error-to-envelope mapper for the curation domain.
//
// BR-30 (curation.back.md): REST and MCP transports surface IDENTICAL error
// codes / messages / details for every thrown service error. This module owns
// ONLY the curation domain branch table (the sentinel hierarchy + the BR-30 Zod
// custom-code priority list + the BR-28 unique-violation fallback); the shared
// types, pg detection, and 503/500 terminals live in
// `src/shared/error-mapping.ts` (single source — no more "kept in sync" copies).
//
// Three renderings of one classification:
//   - `mapErrorToHttpResponse(err)` -> { statusCode, envelope, logLevel }  (REST)
//   - `mapErrorToEnvelope(err)`     -> { ok: false, error: {...} }         (bare envelope)
//   - MCP tool-call form: callers wrap `mapErrorToEnvelope(err)` with
//     `toMcpToolResult` from the shared module (wired by the MCP transport).
//
// Fastify-independent on purpose — the MCP transport (no `FastifyReply`) consumes it.

import { ZodError } from "zod";

import {
  BusinessError,
  ConflictError,
  NodeDeletedError,
  ResourceNotFoundError,
  ValidationError,
} from "../service/errors.js";
import {
  internalError,
  isPgUnavailable,
  isPgUniqueViolation,
  mapped,
  serviceUnavailableError,
} from "../../../shared/error-mapping.js";

// Re-exported for back-compat with existing importers (routes, toolset, specs).
export { isPgUnavailable } from "../../../shared/error-mapping.js";
export type { ErrorEnvelope, MappedError } from "../../../shared/error-mapping.js";
import type { MappedError } from "../../../shared/error-mapping.js";

// ---------------------------------------------------------------------------
// ZodError -> custom-code priority list (BR-30).
//
// The curation DTOs encode `BUSINESS_*` cross-field validations as Zod `custom`
// issues whose `message` is the BUSINESS_* code itself. When multiple custom
// codes fire on the same parse, the priority list below decides which one
// surfaces (matching the existing REST behaviour byte-for-byte).
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
 * BUSINESS_* code (with its HTTP status) when a custom-issue message hits one of
 * the codes; falls back to `VALIDATION_INVALID_FORMAT` / 422 otherwise.
 *
 * Exported for unit tests (BR-30 parity assertions) — not for the route layer.
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
      return mapped(status, "warn", {
        code,
        message: messageForZodCustomCode(code),
        details: { issues: zodIssuesAsDetails(err) },
      });
    }
  }
  return mapped(422, "warn", {
    code: "VALIDATION_INVALID_FORMAT",
    message: "Request payload failed validation.",
    details: { issues: zodIssuesAsDetails(err) },
  });
}

// ---------------------------------------------------------------------------
// Mapper — pure function, no I/O. The single source of truth for both forms.
// ---------------------------------------------------------------------------

/**
 * Map any thrown value to the full `{ statusCode, envelope, logLevel }` triple.
 *
 * Priority order:
 *   1. Curation sentinel hierarchy (ResourceNotFoundError, NodeDeletedError,
 *      ConflictError, BusinessError, ValidationError) — each carries its own
 *      `statusCode` + `code` + `details`.
 *   2. ZodError — custom-issue messages classified via the BR-30 priority list.
 *   3. pg SQLSTATE `23505` (unique_violation) — defensive map to
 *      `BUSINESS_TEMPORAL_INCOHERENT` 422 (BR-28).
 *   4. pg connection / timeout — 503 `SYSTEM_SERVICE_UNAVAILABLE`.
 *   5. Anything else — 500 `SYSTEM_INTERNAL_ERROR` (generic message, no leak).
 */
export function mapErrorToHttpResponse(err: unknown): MappedError {
  // ----- curation sentinels (instance hierarchy from service/errors.ts) -----

  if (err instanceof ResourceNotFoundError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }
  if (err instanceof NodeDeletedError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }
  if (err instanceof ConflictError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }
  // NOTE: `TemporalIncoherentError` extends `BusinessError` — this branch covers it.
  if (err instanceof BusinessError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }
  if (err instanceof ValidationError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // ----- shared cross-cutting errors -----

  if (err instanceof ZodError) {
    return mapZodError(err);
  }

  // Defensive: SQLSTATE 23505 on the partial-guard index (BR-28). Should never
  // reach here under normal operation — a typed `TemporalIncoherentError` would
  // have been thrown by the service first. We keep the fallback so a service
  // path that bubbles a raw pg error still produces the right wire code.
  if (isPgUniqueViolation(err)) {
    return mapped(422, "warn", {
      code: "BUSINESS_TEMPORAL_INCOHERENT",
      message:
        "A duplicate-guard index rejected the resolution; another row currently occupies this scope.",
    });
  }

  if (isPgUnavailable(err)) {
    return serviceUnavailableError();
  }

  // Unknown — generic 500. Do NOT leak `err.message` to the client.
  return internalError();
}

/**
 * Map any thrown value to the canonical MCP envelope. Same classification core
 * as `mapErrorToHttpResponse`, but returns only the wire-level envelope (no
 * `statusCode` — MCP responses are HTTP 200 + JSON-RPC `result`).
 */
export function mapErrorToEnvelope(err: unknown) {
  return mapErrorToHttpResponse(err).envelope;
}
