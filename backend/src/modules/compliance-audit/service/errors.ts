// Typed sentinel errors emitted by the compliance-audit services. The route /
// MCP layer maps each one to its HTTP status + `error.code` envelope (BR-15).
//
// Three families:
//   - ResourceNotFoundError -> 404 / NOT_FOUND
//   - ValidationFailure     -> 422 / STRUCTURAL_INVALID
//   - InternalFailure       -> 500 / INTERNAL (the BR-17 legacy-orphan alarm)
//
// Anything else propagates to the global Fastify error handler (500
// SYSTEM_INTERNAL_ERROR / MCP INTERNAL).

export interface ComplianceAuditErrorDetails {
  readonly [key: string]: unknown;
}

abstract class ComplianceAuditError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  /** MCP envelope mapping per BR-15. */
  public abstract readonly mcpCode:
    | "STRUCTURAL_INVALID"
    | "NOT_FOUND"
    | "INTERNAL";
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
  public readonly mcpCode = "NOT_FOUND" as const;
}

/** 422 — Cross-field validation that escapes the route-level Zod parse. */
export class ValidationFailure extends ComplianceAuditError {
  public readonly statusCode = 422;
  public readonly code: string;
  public readonly mcpCode = "STRUCTURAL_INVALID" as const;
  constructor(
    code: string,
    message: string,
    details?: ComplianceAuditErrorDetails
  ) {
    super(message, details);
    this.code = code;
  }
}

/**
 * 500 — UC-01 alt `4c` legacy inconsistency: `raw_information.status =
 * 'deleted'` exists with no `compliance_deletion` row. BR-17 mandates an
 * operational alarm (already emitted at the service layer) and a generic
 * 500 to the client.
 */
export class InternalFailure extends ComplianceAuditError {
  public readonly statusCode = 500;
  public readonly code = "SYSTEM_INTERNAL_ERROR" as const;
  public readonly mcpCode = "INTERNAL" as const;
  public readonly reason: string;
  constructor(reason: string, details?: ComplianceAuditErrorDetails) {
    super("Unexpected internal error.", details);
    this.reason = reason;
  }
}
