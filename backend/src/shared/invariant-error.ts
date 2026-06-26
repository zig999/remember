// Typed error for "this should never happen" invariant violations — a DB row
// that must exist after an INSERT ... RETURNING, an enum value outside the
// closed domain the schema guarantees, a developer-supplied SQL identifier that
// fails validation. These are PROGRAMMER bugs / corrupted state, not domain
// rejections, so they are NOT mapped to a business error code: the global
// Fastify error handler falls through to a generic 500 `SYSTEM_INTERNAL_ERROR`
// (never leaking `message` to the client; the message is logged server-side).
//
// Using this class instead of a bare `throw new Error(...)` makes the intent
// explicit at the call site and lets callers / tests assert on the type.

export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvariantError";
  }
}
