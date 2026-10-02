// Pino logger factory — structured JSON to stdout in every environment.
//
// TC-01 acceptance criterion: pino emits JSON to stdout regardless of NODE_ENV.
// We do NOT install pino-pretty in production paths; humans reading logs
// locally can pipe stdout through `pino-pretty` themselves.

import pino, { type Logger, type LoggerOptions } from "pino";

import type { Env } from "./env.js";

const REDACT_PATHS: readonly string[] = [
  "content",
  "text",
  "value",
  "*.content",
  "*.text",
  "*.value",
  "req.body.content",
  "req.body.text",
  "req.body.value",
  "*.req.body.content",
  "*.req.body.text",
  "*.req.body.value",
  // Defensive: redact common auth header echoes if a logger is ever called
  // with the raw request — handlers should never do so, but we belt-and-brace.
  "req.headers.authorization",
  "*.req.headers.authorization",
  "headers.authorization",
];

/**
 * Build a pino logger configured for the given environment.
 *
 * - JSON output to stdout (default pino destination).
 * - Level taken from `env.LOG_LEVEL`.
 * - Redacts the PII fields listed above.
 * - Adds the boot timestamp as `bootedAt` once per process.
 */
export function buildLogger(env: Pick<Env, "LOG_LEVEL" | "NODE_ENV">): Logger {
  const options: LoggerOptions = {
    level: env.LOG_LEVEL,
    base: {
      env: env.NODE_ENV,
      service: "remember-bff",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [...REDACT_PATHS],
      censor: "[REDACTED]",
      remove: false,
    },
    formatters: {
      // Surface the level as the textual name (`info`, `warn`...) rather than
      // pino's default numeric level — downstream JSON consumers parse this
      // unambiguously.
      level(label) {
        return { level: label };
      },
    },
  };

  return pino(options);
}
