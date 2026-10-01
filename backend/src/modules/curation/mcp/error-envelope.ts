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

export { isPgUnavailable } from "../../../shared/error-mapping.js";
export type { ErrorEnvelope, MappedError } from "../../../shared/error-mapping.js";
import type { ErrorEnvelope, MappedError } from "../../../shared/error-mapping.js";

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

export function mapErrorToHttpResponse(err: unknown): MappedError {
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

  if (err instanceof ZodError) {
    return mapZodError(err);
  }

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

  return internalError();
}

export function mapErrorToEnvelope(err: unknown): ErrorEnvelope {
  return mapErrorToHttpResponse(err).envelope;
}
