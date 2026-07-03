// Typed validation failure used by the 5-layer MCP `ingest` pipeline.
//
// BR-13 of `ingestion.back.md`: rejection is a business RESULT, not a
// programmer exception. Each layer throws a `ValidationFailure` with the
// matching MCP envelope code; the handler catches it, persists the
// `tool_call` row with `validation_outcome = 'rejected'`, and returns the
// MCP error envelope.
//
// The code field is one of the P2.1 namespaced set documented in
// `docs/specs/_global/error-codes.md` §14. The seven deprecated short codes
// (STRUCTURAL_INVALID / UNKNOWN_TYPE / RULE_VIOLATION / TEMPORAL_INCOHERENT /
// DATE_UNJUSTIFIED / NOT_FOUND / INTERNAL) were retired by TC-04; each call
// site now picks the correct discriminant:
//
//   STRUCTURAL_INVALID       -> VALIDATION_REQUIRED_FIELD  (Zod missing)
//                            -> VALIDATION_INVALID_FORMAT  (Zod shape / cross-table FK / closed-domain / parse)
//                            -> VALIDATION_OUT_OF_RANGE    (numeric bound)
//   UNKNOWN_TYPE             -> BUSINESS_UNKNOWN_NODE_TYPE
//                            -> BUSINESS_UNKNOWN_LINK_TYPE
//                            -> BUSINESS_UNKNOWN_ATTRIBUTE_KEY
//   RULE_VIOLATION           -> BUSINESS_LINK_RULE_VIOLATION
//   TEMPORAL_INCOHERENT      -> BUSINESS_TEMPORAL_INCOHERENT
//   DATE_UNJUSTIFIED         -> BUSINESS_DATE_UNJUSTIFIED
//   NOT_FOUND                -> RESOURCE_NOT_FOUND
//   INTERNAL                 -> SYSTEM_INTERNAL_ERROR
//
// The extra `BUSINESS_RUN_NOT_RUNNING` code is emitted by the MCP handler
// guard when the ambient `llm_run_id` points to a row whose `status` is not
// `'running'` (BR-21 / catalog Ingestion section).

export type McpEnvelopeErrorCode =
  // Validation layer — Zod / structural discrimination.
  | "VALIDATION_REQUIRED_FIELD"
  | "VALIDATION_INVALID_FORMAT"
  | "VALIDATION_OUT_OF_RANGE"
  // Resource layer — referenced row missing.
  | "RESOURCE_NOT_FOUND"
  // Business layer — catalog / graph-rule / temporal / run-state.
  | "BUSINESS_UNKNOWN_NODE_TYPE"
  | "BUSINESS_UNKNOWN_LINK_TYPE"
  | "BUSINESS_UNKNOWN_ATTRIBUTE_KEY"
  | "BUSINESS_LINK_RULE_VIOLATION"
  | "BUSINESS_TEMPORAL_INCOHERENT"
  | "BUSINESS_DATE_UNJUSTIFIED"
  | "BUSINESS_RUN_NOT_RUNNING"
  // System layer — unhandled / unreachable.
  | "SYSTEM_INTERNAL_ERROR";

/** Typed sentinel used by the layered validation to fail with a known code. */
export class ValidationFailure extends Error {
  public readonly code: McpEnvelopeErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(
    code: McpEnvelopeErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ValidationFailure";
    this.code = code;
    this.details = details;
  }
}

/**
 * Type guard — narrow an unknown thrown value to `ValidationFailure`.
 */
export function isValidationFailure(err: unknown): err is ValidationFailure {
  return err instanceof ValidationFailure;
}
