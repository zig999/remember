// Typed validation failure used by the 5-layer MCP `ingest` pipeline.
//
// BR-13 of `ingestion.back.md`: rejection is a business RESULT, not a
// programmer exception. Each layer throws a `ValidationFailure` with the
// matching MCP envelope code; the handler catches it, persists the
// `tool_call` row with `validation_outcome = 'rejected'`, and returns the
// MCP error envelope.
//
// The code field is one of the closed set documented in `ingestion.spec.md`
// §6.2 / CLAUDE.md "Architecture / Backend":
//   STRUCTURAL_INVALID | UNKNOWN_TYPE | RULE_VIOLATION |
//   TEMPORAL_INCOHERENT | DATE_UNJUSTIFIED | NOT_FOUND | INTERNAL

export type McpEnvelopeErrorCode =
  | "STRUCTURAL_INVALID"
  | "UNKNOWN_TYPE"
  | "RULE_VIOLATION"
  | "TEMPORAL_INCOHERENT"
  | "DATE_UNJUSTIFIED"
  | "NOT_FOUND"
  | "INTERNAL";

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
