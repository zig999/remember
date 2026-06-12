// Typed sentinel errors emitted by the curation services. The route layer
// maps each one to its HTTP status + `error.code` envelope (back spec BR-28,
// CLAUDE.md "Architecture / Backend"). Unhandled errors propagate to the
// global Fastify error handler.

/** Generic shape every curation error carries. */
export interface CurationErrorDetails {
  readonly [key: string]: unknown;
}

abstract class CurationError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly details: CurationErrorDetails;

  constructor(message: string, details: CurationErrorDetails = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

/** 404 — RESOURCE_NOT_FOUND. */
export class ResourceNotFoundError extends CurationError {
  public readonly statusCode = 404;
  public readonly code = "RESOURCE_NOT_FOUND" as const;
}

/** 410 — BUSINESS_NODE_DELETED (BR-12). */
export class NodeDeletedError extends CurationError {
  public readonly statusCode = 410;
  public readonly code = "BUSINESS_NODE_DELETED" as const;
}

/** 422 — Spec-pre-flight cross-field validations. */
export class ValidationError extends CurationError {
  public readonly statusCode = 422;
  public readonly code: string;
  constructor(code: string, message: string, details?: CurationErrorDetails) {
    super(message, details);
    this.code = code;
  }
}

/** 409 — State-machine guard mismatches (BR-22). */
export class ConflictError extends CurationError {
  public readonly statusCode = 409;
  public readonly code: string;
  constructor(code: string, message: string, details?: CurationErrorDetails) {
    super(message, details);
    this.code = code;
  }
}

/** 422 — Business validation. */
export class BusinessError extends CurationError {
  public readonly statusCode = 422;
  public readonly code: string;
  constructor(code: string, message: string, details?: CurationErrorDetails) {
    super(message, details);
    this.code = code;
  }
}

/** Defensive: SQLSTATE 23505 fallback (BR-28). */
export class TemporalIncoherentError extends BusinessError {
  constructor(details?: CurationErrorDetails) {
    super(
      "BUSINESS_TEMPORAL_INCOHERENT",
      "Adjusted periods violate semi-open invariant or functional-scope overlap.",
      details
    );
  }
}
