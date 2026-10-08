export interface ErrorEnvelope {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export interface MappedError {
  readonly statusCode: number;
  readonly envelope: ErrorEnvelope;
  readonly logLevel: "warn" | "error";
}

const PG_UNAVAILABLE_SQLSTATES: ReadonlySet<string> = new Set([
  "57P03",
  "57014",
  "08000",
  "08003",
  "08006",
]);

const PG_UNAVAILABLE_ERRNOS: ReadonlySet<string> = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNRESET",
]);

export function isPgUnavailable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code !== "string") return false;
  return PG_UNAVAILABLE_SQLSTATES.has(code) || PG_UNAVAILABLE_ERRNOS.has(code);
}

export function isPgUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  return code === "23505";
}

export const codeToHttpStatus: Record<string, number> = {
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_TOKEN_INVALID: 401,
  AUTH_UNAUTHORIZED: 401,
  AUTH_FORBIDDEN: 403,

  VALIDATION_REQUIRED_FIELD: 422,
  VALIDATION_INVALID_FORMAT: 422,
  VALIDATION_OUT_OF_RANGE: 422,

  RESOURCE_NOT_FOUND: 404,
  RESOURCE_ALREADY_EXISTS: 409,
  RESOURCE_CONFLICT: 409,

  BUSINESS_RUN_NOT_RETRYABLE: 409,
  BUSINESS_RUN_NOT_RUNNABLE: 409,
  BUSINESS_RUN_NOT_RUNNING: 409,
  BUSINESS_LINK_RULE_VIOLATION: 422,

  BUSINESS_NODE_DELETED: 410,
  BUSINESS_UNKNOWN_NODE_TYPE: 422,
  BUSINESS_UNKNOWN_LINK_TYPE: 422,
  BUSINESS_UNKNOWN_ATTRIBUTE_KEY: 404,
  BUSINESS_INVALID_TRAVERSE_DEPTH: 422,

  BUSINESS_INVALID_SEARCH_QUERY: 422,
  BUSINESS_INVALID_SEARCH_LAYER: 422,
  BUSINESS_FRAGMENT_NOT_ACCEPTED: 404,
  BUSINESS_RAW_INFORMATION_DELETED: 410,

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

  BUSINESS_NODE_NOT_ACTIVE: 409,
  BUSINESS_ENTITY_EDIT_CONFLICT: 409,
  BUSINESS_ENTITY_EDIT_DISPUTED: 409,
  BUSINESS_ENTITY_EDIT_NO_CHANGES: 422,
  BUSINESS_INVALID_ATTRIBUTE_VALUE: 422,

  BUSINESS_CHAT_DISABLED: 503,
  BUSINESS_CHAT_PROVIDER_UNAVAILABLE: 503,
  BUSINESS_CONVERSATION_ARCHIVED: 409,
  BUSINESS_IDEMPOTENCY_MISMATCH: 409,
  BUSINESS_TURN_IN_PROGRESS: 409,
  BUSINESS_CHAT_INGEST_DISABLED: 503,

  SYSTEM_INTERNAL_ERROR: 500,
  SYSTEM_SERVICE_UNAVAILABLE: 503,
  SYSTEM_LLM_PROVIDER_UNAVAILABLE: 502,
};

export function mapped(
  statusCode: number,
  logLevel: "warn" | "error",
  error: ErrorEnvelope["error"]
): MappedError {
  return { statusCode, logLevel, envelope: { ok: false, error } };
}

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

export function serviceUnavailableError(): MappedError {
  return renderErrorEnvelope(
    "SYSTEM_SERVICE_UNAVAILABLE",
    "A backing service is temporarily unavailable."
  );
}

export function internalError(): MappedError {
  return renderErrorEnvelope("SYSTEM_INTERNAL_ERROR", "Internal server error.");
}

export interface McpToolErrorResult {
  readonly content: ReadonlyArray<{ readonly type: "text"; readonly text: string }>;
  readonly isError: true;
}

export function toMcpToolResult(envelope: ErrorEnvelope): McpToolErrorResult {
  return {
    content: [{ type: "text", text: JSON.stringify(envelope.error) }],
    isError: true,
  };
}
