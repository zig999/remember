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

export { isPgUnavailable } from "../../../shared/error-mapping.js";
export type { ErrorEnvelope, MappedError } from "../../../shared/error-mapping.js";
import type { ErrorEnvelope, MappedError } from "../../../shared/error-mapping.js";

export function mapErrorToHttpResponse(
  err: unknown,
  extraDetails?: Record<string, unknown>
): MappedError {
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

  if (err instanceof InvalidSearchQueryError) {
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
    return mapped(500, "error", {
      code: err.code,
      message: "Internal server error.",
    });
  }

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

  return internalError();
}

export function mapErrorToEnvelope(
  err: unknown,
  extraDetails?: Record<string, unknown>
): ErrorEnvelope {
  return mapErrorToHttpResponse(err, extraDetails).envelope;
}
