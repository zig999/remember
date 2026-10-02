// Typed sentinel errors emitted by the compliance-audit services. The route /
// MCP layer maps each one to its HTTP status + `error.code` envelope
// (compliance-audit.back.md BR-15 v1.4.0 — P2.1 canonical taxonomy).
//
// After P2.1 the `code` field is the SOLE identifier on both transports: REST
// echoes `err.code` as-is and MCP renders it through the shared
// `renderErrorEnvelope` mapper, producing byte-identical envelopes on both
// transports (no more parallel transport-specific short-code override).
//
// Anything else propagates to the global Fastify error handler
// (500 SYSTEM_INTERNAL_ERROR).

export interface ComplianceAuditErrorDetails {
  readonly [key: string]: unknown;
}

abstract class ComplianceAuditError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly details: ComplianceAuditErrorDetails;

  constructor(message: string, details: ComplianceAuditErrorDetails = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

/** 404 — RESOURCE_NOT_FOUND. UC-01 alt 4a / UC-03 / UC-05. */
export class ResourceNotFoundError extends ComplianceAuditError {
  public readonly statusCode = 404;
  public readonly code = "RESOURCE_NOT_FOUND" as const;
}

/** 422 — Cross-field validation that escapes the route-level Zod parse. */
export class ValidationFailure extends ComplianceAuditError {
  public readonly statusCode = 422;
  public readonly code: string;
  constructor(
    code: string,
    message: string,
    details?: ComplianceAuditErrorDetails
  ) {
    super(message, details);
    this.code = code;
  }
}

export class InternalFailure extends ComplianceAuditError {
  public readonly statusCode = 500;
  public readonly code = "SYSTEM_INTERNAL_ERROR" as const;
  public readonly reason: string;
  constructor(reason: string, details?: ComplianceAuditErrorDetails) {
    super("Unexpected internal error.", details);
    this.reason = reason;
  }
}
