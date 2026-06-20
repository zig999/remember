// Typed sentinel errors for the chat domain + mapper to the canonical
// `ErrorEnvelope` consumed by the global error-mapping layer.
//
// Codes registered here (chat.back.md v2.0.0 §10):
//
//   v1 (carry-over):
//   - BUSINESS_CHAT_DISABLED             (503) — kill-switch on (BR-14).
//   - BUSINESS_CHAT_PROVIDER_UNAVAILABLE (503) — Anthropic factory throws or
//                                                the SDK stream rejects mid-
//                                                flight (BR-21 / BR-11).
//
//   v2 (NEW in TC-02 / chat.back.md v2.0.0):
//   - RESOURCE_NOT_FOUND                 (404) — conversation lookup miss
//                                                (BR-22). Reuses the global
//                                                code; no new entry in the
//                                                global error catalog.
//   - BUSINESS_CONVERSATION_ARCHIVED     (409) — write attempt on an archived
//                                                conversation (BR-25).
//   - BUSINESS_TURN_IN_PROGRESS          (409) — single-in-flight-turn guard
//                                                hit (BR-28).
//   - BUSINESS_IDEMPOTENCY_MISMATCH      (409) — Idempotency-Key reused with
//                                                a different (content, model)
//                                                pair (BR-27).
//
// `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` may appear as an in-stream SSE `error`
// frame when the provider fails mid-stream — see chat.back.md §10 / BR-23. All
// new v2 errors are PRE-STREAM only (rendered via the standard REST envelope
// by the route handler before `reply.hijack()` runs).
//
// All other error classes used by chat live in the global catalog and are
// reused as-is (`VALIDATION_INVALID_FORMAT`, `VALIDATION_REQUIRED_FIELD`,
// `AUTH_*`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_SERVICE_UNAVAILABLE`). They are
// not modeled here.

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

/**
 * BR-22 — `repository.getConversationById` returned null. The service layer
 * raises this so the route handler can map it uniformly to a 404
 * `RESOURCE_NOT_FOUND` envelope. Used by `getConversation`, `updateConversation`,
 * `deleteConversation`, `getConversationUsage`, `sendMessage`, `cancelTurn`,
 * and `listMessages` (BR-22 applies to every conversation-scoped endpoint).
 *
 * The HTTP code is `RESOURCE_NOT_FOUND` (already in the global catalog) — no
 * new business code is added here. Status 404 is REST-only; the chat surface
 * never reaches this branch mid-stream.
 */
export class ConversationNotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly code = "RESOURCE_NOT_FOUND" as const;
  public readonly conversationId: string;

  constructor(conversationId: string) {
    super(`conversation ${conversationId} not found`);
    this.name = "ConversationNotFoundError";
    this.conversationId = conversationId;
  }
}

/**
 * BR-25 — write endpoint hit on an `archived_at IS NOT NULL` conversation.
 * Raised by the route handler (the service may also surface it from
 * `sendMessage` / `cancelTurn` if the archived check is centralised). The
 * message tells the caller how to recover (un-archive via PATCH).
 */
export class ConversationArchivedError extends Error {
  public readonly statusCode = 409;
  public readonly code = "BUSINESS_CONVERSATION_ARCHIVED" as const;

  constructor() {
    super(
      "conversation is archived; un-archive via PATCH /conversations/:id " +
        "{ archived_at: null }"
    );
    this.name = "ConversationArchivedError";
  }
}

/**
 * BR-28 — single-in-flight-turn-per-conversation guard. Raised when
 * `sendMessage` finds an `AbortController` already registered for the target
 * conversation, OR when an idempotent replay (BR-27) lands during an
 * in-progress turn (assistant row not yet persisted).
 */
export class TurnInProgressError extends Error {
  public readonly statusCode = 409;
  public readonly code = "BUSINESS_TURN_IN_PROGRESS" as const;

  constructor() {
    super("another turn is currently in progress on this conversation");
    this.name = "TurnInProgressError";
  }
}

/**
 * BR-27 — `Idempotency-Key` matches an existing user row whose `(content,
 * model)` pair differs from the new request. The semantics of idempotency
 * forbid silently overwriting; the only safe response is 409 and let the
 * client decide (resend with a fresh key, or recover the prior result).
 */
export class IdempotencyMismatchError extends Error {
  public readonly statusCode = 409;
  public readonly code = "BUSINESS_IDEMPOTENCY_MISMATCH" as const;

  constructor() {
    super(
      "Idempotency-Key matches an existing request with different content or model"
    );
    this.name = "IdempotencyMismatchError";
  }
}

/** Discriminated union of every chat sentinel error. */
export type ChatError =
  | ChatDisabledError
  | ChatProviderUnavailableError
  | ConversationNotFoundError
  | ConversationArchivedError
  | TurnInProgressError
  | IdempotencyMismatchError;

/**
 * Map a chat sentinel error to a `MappedError`. The route handler uses the
 * `statusCode` for the HTTP response (pre-stream) and the `envelope` for the
 * SSE `error` frame body (in-stream). Other error classes are NOT handled
 * here — they propagate to the global error handler.
 *
 * Log levels follow the operational-vs-failure split:
 *   - `warn`: expected, user-driven 4xx-class outcomes (kill-switch, archived,
 *             not-found, in-progress, idempotency-mismatch).
 *   - `error`: provider outages — real failures the operator must see.
 */
export function mapChatError(err: ChatError): MappedError {
  if (err instanceof ChatDisabledError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
    });
  }
  if (err instanceof ChatProviderUnavailableError) {
    // `error` level so the operator sees it in the structured logs (kill-
    // switch flips are operational; provider outages are real failures).
    return mapped(err.statusCode, "error", {
      code: err.code,
      message: err.message,
    });
  }
  if (err instanceof ConversationNotFoundError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
    });
  }
  if (err instanceof ConversationArchivedError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
    });
  }
  if (err instanceof TurnInProgressError) {
    return mapped(err.statusCode, "warn", {
      code: err.code,
      message: err.message,
    });
  }
  // IdempotencyMismatchError — exhaustive guard via the discriminated union.
  return mapped(err.statusCode, "warn", {
    code: err.code,
    message: err.message,
  });
}

/** Narrow-test helper used by the mapper guard and by error-mapping.ts. */
export function isChatError(err: unknown): err is ChatError {
  return (
    err instanceof ChatDisabledError ||
    err instanceof ChatProviderUnavailableError ||
    err instanceof ConversationNotFoundError ||
    err instanceof ConversationArchivedError ||
    err instanceof TurnInProgressError ||
    err instanceof IdempotencyMismatchError
  );
}
