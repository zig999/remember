// Error-to-envelope mapper for knowledge-graph and query-retrieval.
//
// BR-24 (knowledge-graph.back.md and query-retrieval.back.md): REST and MCP
// transports surface IDENTICAL error codes / messages / details for every
// thrown service error. This module owns ONLY the KG/QR domain branch table;
// the shared types, pg detection, and 503/500 terminals live in
// `src/shared/error-mapping.ts` (single source — no more "kept in sync" copies).
//
// Three renderings of one classification:
//   - `mapErrorToHttpResponse(err, extra?)` -> { statusCode, envelope, logLevel }  (REST)
//   - `mapErrorToEnvelope(err, extra?)`     -> { ok: false, error: {...} }         (bare envelope)
//   - MCP tool-call form: callers wrap `mapErrorToEnvelope(err)` with
//     `toMcpToolResult` from the shared module (wired by the MCP transport).
//
// `extraDetails` is merged into `details` for error classes that carry their own
// per-class detail object; classes whose details are intentionally fixed ignore
// it (preserves the original REST behaviour).
//
// Fastify-independent on purpose — the MCP transport (no `FastifyReply`) consumes it.

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
import {
  internalError,
  isPgUnavailable,
  mapped,
  serviceUnavailableError,
} from "../../../shared/error-mapping.js";

// Re-exported for back-compat with existing importers (routes, toolsets, specs).
export { isPgUnavailable } from "../../../shared/error-mapping.js";
export type { ErrorEnvelope, MappedError } from "../../../shared/error-mapping.js";
import type { MappedError } from "../../../shared/error-mapping.js";

// ---------------------------------------------------------------------------
// Mapper — pure function, no I/O. The single source of truth for both forms.
// ---------------------------------------------------------------------------

/**
 * Map any thrown value to the full `{ statusCode, envelope, logLevel }` triple.
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
    return mapped(404, "warn", {
      code: err.code,
      message: err.message,
      details: { entity: err.entity, id: err.entityId, ...extraDetails },
    });
  }
  if (err instanceof NodeDeletedError) {
    return mapped(410, "warn", {
      code: err.code,
      message: err.message,
      details: { node_id: err.nodeId, ...extraDetails },
    });
  }
  if (err instanceof UnknownNodeTypeError) {
    return mapped(422, "warn", {
      code: err.code,
      message: err.message,
      details: { node_type: err.nodeType, ...extraDetails },
    });
  }
  if (err instanceof UnknownLinkTypeError) {
    return mapped(422, "warn", {
      code: err.code,
      message: err.message,
      details: { link_type: err.linkType, ...extraDetails },
    });
  }
  if (err instanceof InvalidTraverseDepthError) {
    return mapped(422, "warn", {
      code: err.code,
      message: err.message,
      details: { depth: err.depth, max: err.max, ...extraDetails },
    });
  }
  if (err instanceof UnknownAttributeKeyError) {
    return mapped(404, "warn", {
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
    return mapped(422, "warn", {
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }
  if (err instanceof InvalidSearchLayerError) {
    return mapped(422, "warn", {
      code: err.code,
      message: err.message,
      details: { invalid: err.invalid, allowed: err.allowed },
    });
  }
  if (err instanceof FragmentNotAcceptedError) {
    return mapped(404, "warn", {
      code: err.code,
      message: err.message,
      details: { fragment_id: err.fragmentId, status: err.status },
    });
  }
  if (err instanceof RawInformationDeletedError) {
    return mapped(410, "warn", {
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
    // for the operator's audit log only). Distinct from the generic
    // SYSTEM_INTERNAL_ERROR: keeps the class's own `code`.
    return mapped(500, "error", {
      code: err.code,
      message: "Internal server error.",
    });
  }

  // ----- shared cross-cutting errors -----

  if (err instanceof ZodError) {
    return mapped(422, "warn", {
      code: "VALIDATION_INVALID_FORMAT",
      message: "Request payload failed validation.",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
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
export function mapErrorToEnvelope(
  err: unknown,
  extraDetails?: Record<string, unknown>
) {
  return mapErrorToHttpResponse(err, extraDetails).envelope;
}
