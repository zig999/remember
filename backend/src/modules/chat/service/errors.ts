// Typed sentinel errors for the chat domain + mapper to the canonical
// `ErrorEnvelope` consumed by the global error-mapping layer.
//
// Two new business codes are introduced by this domain (chat.back.md §10):
//   - BUSINESS_CHAT_DISABLED            (503) — kill-switch on (BR-14).
//   - BUSINESS_CHAT_PROVIDER_UNAVAILABLE (503) — Anthropic factory throws or
//                                                 the SDK stream rejects
//                                                 mid-flight (BR-21 / BR-11).
//
// Both are pre-stream candidates (rendered via the standard REST envelope by
// the route handler before `reply.hijack()` runs). `BUSINESS_CHAT_PROVIDER_
// UNAVAILABLE` may ALSO appear as an in-stream SSE `error` frame when the
// provider fails mid-stream — see chat.back.md §10 / BR-23. The mapping
// returned by `mapChatError` carries `statusCode: 503` in both cases; the
// route handler decides whether to use it as an HTTP status (pre-stream) or
// to fold the envelope into an SSE frame (in-stream).
//
// All other error classes used by chat live in the global catalog and are
// reused as-is (`VALIDATION_INVALID_FORMAT`, `AUTH_*`, `SYSTEM_INTERNAL_ERROR`,
// `SYSTEM_SERVICE_UNAVAILABLE`). They are not modeled here.

import { mapped, type MappedError } from "../../../shared/error-mapping.js";

/**
 * BR-14 — `env.CHAT_ENABLED === false`. Route handler must short-circuit with
 * 503 BEFORE any factory or `reply.hijack()` call so the SPA receives the
 * standard REST envelope, not an SSE frame.
 */
export class ChatDisabledError extends Error {
  public readonly statusCode = 503;
  public readonly code = "BUSINESS_CHAT_DISABLED" as const;

  constructor() {
    super("chat surface is disabled by CHAT_ENABLED=false");
    this.name = "ChatDisabledError";
  }
}

/**
 * BR-21 (pre-stream) + BR-11 (in-stream) — Anthropic factory throws on
 * construction OR the streaming call rejects mid-flight with a NON-`AbortError`.
 * The exposed message is INTENTIONALLY sanitized — the upstream error may
 * include credentials, internal endpoints, or other provider strings that
 * must never reach the client (BR-11 explicit requirement).
 */
export class ChatProviderUnavailableError extends Error {
  public readonly statusCode = 503;
  public readonly code = "BUSINESS_CHAT_PROVIDER_UNAVAILABLE" as const;

  constructor(message = "chat provider is temporarily unavailable") {
    super(message);
    this.name = "ChatProviderUnavailableError";
  }
}

/** Discriminated union of every chat sentinel error. */
export type ChatError = ChatDisabledError | ChatProviderUnavailableError;

/**
 * Map a chat sentinel error to a `MappedError`. The route handler uses the
 * `statusCode` for the HTTP response (pre-stream) and the `envelope` for the
 * SSE `error` frame body (in-stream). Other error classes are NOT handled
 * here — they propagate to the global error handler.
 */
export function mapChatError(err: ChatError): MappedError {
  if (err instanceof ChatDisabledError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
    });
  }
  // ChatProviderUnavailableError — `error` level so the operator sees it in
  // the structured logs (kill-switch flips are operational; provider outages
  // are real failures).
  return mapped(err.statusCode, "error", {
    code: err.code,
    message: err.message,
  });
}

/** Narrow-test helper used by the mapper guard and by error-mapping.ts. */
export function isChatError(err: unknown): err is ChatError {
  return (
    err instanceof ChatDisabledError ||
    err instanceof ChatProviderUnavailableError
  );
}
