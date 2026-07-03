// Single source of truth for the error-mapping primitives shared by the global
// Fastify error handler (`middleware/error-handler.ts`) and the per-domain
// mappers (`knowledge-graph/mcp/error-envelope.ts`, `curation/mcp/error-envelope.ts`).
//
// Before this module the `ErrorEnvelope` type, the pg-detection sets, and the
// 503/500 terminal envelopes were copy-pasted in all three places — "kept in
// sync" by comment only. They now live here; each consumer keeps ONLY its own
// domain-specific branch table (KG/QR error classes; curation sentinels + the
// BR-30 Zod priority list) and composes it with these shared terminals.
//
// Fastify-independent on purpose: the MCP transports (which have no
// `FastifyReply`) consume the per-domain mappers built on top of this.

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
 * `reply.status(...)`; MCP transports ignore it (they speak JSON-RPC over HTTP
 * 200 and surface the envelope inside the result).
 */
export interface MappedError {
  readonly statusCode: number;
  readonly envelope: ErrorEnvelope;
  readonly logLevel: "warn" | "error";
}

// ---------------------------------------------------------------------------
// pg detection — the canonical copy (middleware + both domain mappers import it).
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

/** Detect pg connection / timeout errors — "the backing service is sick". */
export function isPgUnavailable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code !== "string") return false;
  return PG_UNAVAILABLE_SQLSTATES.has(code) || PG_UNAVAILABLE_ERRNOS.has(code);
}

/** Detect pg SQLSTATE 23505 (unique_violation) — curation BR-28 defensive fallback. */
export function isPgUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  return code === "23505";
}

// ---------------------------------------------------------------------------
// Canonical code → HTTP status registry (P2.1, `docs/specs/_global/error-codes.md`).
// ---------------------------------------------------------------------------
//
// Single source of truth for the REST rendering. MCP transports IGNORE this
// map (they wrap the same `error.code` inside `content` + `isError: true` on
// HTTP 200 at the SDK kernel), but every domain sentinel MUST publish its code
// here so REST + MCP surface byte-identical codes on the same business
// condition (P2.1 parity contract).
//
// Business OUTCOMES (`already_ingested`, `noop_already_deleted`, disputed /
// uncertain / consolidated proposals, …) are NOT errors and MUST NOT appear
// here — they surface as `ok: true` on both transports.
export const codeToHttpStatus: Record<string, number> = {
  // Authentication — enforced by middleware before any handler runs.
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_TOKEN_INVALID: 401,
  AUTH_UNAUTHORIZED: 401,
  AUTH_FORBIDDEN: 403,

  // Validation — Zod / DTO structural failure.
  VALIDATION_REQUIRED_FIELD: 422,
  VALIDATION_INVALID_FORMAT: 422,
  VALIDATION_OUT_OF_RANGE: 422,

  // Resource — referenced entity missing / duplicated / conflicted.
  RESOURCE_NOT_FOUND: 404,
  RESOURCE_ALREADY_EXISTS: 409,
  RESOURCE_CONFLICT: 409,

  // Business — Ingestion (`ingestion.spec.md`).
  BUSINESS_RUN_NOT_RETRYABLE: 409,
  BUSINESS_RUN_NOT_RUNNABLE: 409,
  BUSINESS_RUN_NOT_RUNNING: 409,
  BUSINESS_LINK_RULE_VIOLATION: 422,

  // Business — Knowledge Graph (`knowledge-graph.spec.md`).
  BUSINESS_NODE_DELETED: 410,
  BUSINESS_UNKNOWN_NODE_TYPE: 422,
  BUSINESS_UNKNOWN_LINK_TYPE: 422,
  BUSINESS_UNKNOWN_ATTRIBUTE_KEY: 404,
  BUSINESS_INVALID_TRAVERSE_DEPTH: 422,

  // Business — Query / Retrieval (`query-retrieval.spec.md`).
  BUSINESS_INVALID_SEARCH_QUERY: 422,
  BUSINESS_INVALID_SEARCH_LAYER: 422,
  BUSINESS_FRAGMENT_NOT_ACCEPTED: 404,
  BUSINESS_RAW_INFORMATION_DELETED: 410,

  // Business — Curation (`curation.spec.md`).
  BUSINESS_REVIEW_NOT_PENDING: 409,
  BUSINESS_TARGET_NODE_REQUIRED: 422,
  BUSINESS_INVALID_TARGET_NODE: 422,
  BUSINESS_SELF_MERGE_FORBIDDEN: 409,
  BUSINESS_ITEM_NOT_DISPUTED: 409,
  BUSINESS_DISPUTE_WINNER_REQUIRED: 422,
  BUSINESS_DISPUTE_PERIODS_REQUIRED: 422,
  BUSINESS_ITEM_NOT_UNCERTAIN: 409,
  BUSINESS_ITEM_NOT_DELETABLE: 409,
  BUSINESS_CORRECTION_NO_CHANGES: 422,
  BUSINESS_DATE_UNJUSTIFIED: 422,
  BUSINESS_TEMPORAL_INCOHERENT: 422,
  BUSINESS_REASON_REQUIRED: 422,

  // Business — Chat (`chat.spec.md`).
  BUSINESS_CHAT_DISABLED: 503,
  BUSINESS_CHAT_PROVIDER_UNAVAILABLE: 503,
  BUSINESS_CONVERSATION_ARCHIVED: 409,
  BUSINESS_IDEMPOTENCY_MISMATCH: 409,
  BUSINESS_TURN_IN_PROGRESS: 409,
  BUSINESS_CHAT_INGEST_DISABLED: 503,

  // System — infrastructure / unhandled.
  SYSTEM_INTERNAL_ERROR: 500,
  SYSTEM_SERVICE_UNAVAILABLE: 503,
  SYSTEM_LLM_PROVIDER_UNAVAILABLE: 502,
};

// ---------------------------------------------------------------------------
// Shared builders.
// ---------------------------------------------------------------------------

/**
 * Build a `MappedError` from its parts. (Was the private `ok422or` helper in the
 * knowledge-graph mapper; promoted here so every domain branch is uniform.)
 */
export function mapped(
  statusCode: number,
  logLevel: "warn" | "error",
  error: ErrorEnvelope["error"]
): MappedError {
  return { statusCode, logLevel, envelope: { ok: false, error } };
}

/**
 * Render a `MappedError` from a namespaced code + message, resolving the HTTP
 * status through the canonical `codeToHttpStatus` registry. Unknown codes fall
 * back to 500 (defense-in-depth: any sentinel leaking without being registered
 * still produces a valid response, and the fallback is loud enough — 5xx +
 * `error` log level — that the miss shows up in metrics).
 *
 * `logLevel` is derived from the resolved status: 4xx → `"warn"` (client-side
 * problem, expected under normal operation), 5xx → `"error"` (server-side or
 * transport issue, must page).
 */
export function renderErrorEnvelope(
  code: string,
  message: string,
  details?: unknown
): MappedError {
  const statusCode = codeToHttpStatus[code] ?? 500;
  const logLevel: "warn" | "error" = statusCode >= 500 ? "error" : "warn";
  const error: ErrorEnvelope["error"] =
    details === undefined ? { code, message } : { code, message, details };
  return { statusCode, logLevel, envelope: { ok: false, error } };
}

/** 503 — a backing service (pg) is temporarily unavailable. */
export function serviceUnavailableError(): MappedError {
  return renderErrorEnvelope(
    "SYSTEM_SERVICE_UNAVAILABLE",
    "A backing service is temporarily unavailable."
  );
}

/** 500 — generic internal error. NEVER leaks `err.message` to the client. */
export function internalError(): MappedError {
  return renderErrorEnvelope("SYSTEM_INTERNAL_ERROR", "Internal server error.");
}

// ---------------------------------------------------------------------------
// MCP tool-result error form (MCP spec 2025-06-18).
// ---------------------------------------------------------------------------

/**
 * MCP `tools/call` result for a failed call. Per the spec, tool *execution*
 * errors are reported in the result with `isError: true` (NOT as a JSON-RPC
 * protocol error — those are reserved for malformed requests / unknown methods).
 */
export interface McpToolErrorResult {
  readonly content: ReadonlyArray<{ readonly type: "text"; readonly text: string }>;
  readonly isError: true;
}

/**
 * Render a failed `ErrorEnvelope` as an MCP tool-call error result. The
 * structured `{ code, message, details }` is serialized into the text content
 * block so a standard MCP client (which reads `content` + `isError`) can recover
 * the full error. This is the third rendering of the SAME classification the
 * REST (`mapErrorToHttpResponse`) and bare-envelope (`mapErrorToEnvelope`) forms
 * produce — single classification, three wire shapes.
 */
export function toMcpToolResult(envelope: ErrorEnvelope): McpToolErrorResult {
  return {
    content: [{ type: "text", text: JSON.stringify(envelope.error) }],
    isError: true,
  };
}
