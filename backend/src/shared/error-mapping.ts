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

/** 503 — a backing service (pg) is temporarily unavailable. */
export function serviceUnavailableError(): MappedError {
  return mapped(503, "error", {
    code: "SYSTEM_SERVICE_UNAVAILABLE",
    message: "A backing service is temporarily unavailable.",
  });
}

/** 500 — generic internal error. NEVER leaks `err.message` to the client. */
export function internalError(): MappedError {
  return mapped(500, "error", {
    code: "SYSTEM_INTERNAL_ERROR",
    message: "Internal server error.",
  });
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
