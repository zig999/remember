import type { FastifyReply } from "fastify";
import type { Logger } from "pino";

import { mapErrorToHttpResponse } from "../mcp/error-envelope.js";

const REQUEST_FAILED_LOG_MESSAGE = "curation_request_failed";

export function sendError(
  err: unknown,
  reply: FastifyReply,
  logger: Logger
): FastifyReply {
  const { statusCode, envelope, logLevel } = mapErrorToHttpResponse(err);
  if (logLevel === "error") {
    logger.error(
      {
        route: reply.request.routeOptions?.url ?? reply.request.url,
        method: reply.request.method,
        error_code: envelope.error.code,
        cause_message: err instanceof Error ? err.message : String(err),
        cause_name: err instanceof Error ? err.name : typeof err,
      },
      REQUEST_FAILED_LOG_MESSAGE
    );
  }
  return reply.status(statusCode).send(envelope);
}
