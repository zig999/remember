// In-process registry of in-flight chat turns — BR-28.
//
// chat.back.md v2.0.0 §1.1 / BR-28: "At most ONE in-flight turn per
// conversation is enforced by an in-process registry
// (`Map<conversation_id, AbortController>`), keyed by conversation id". This
// registry is single-process only (v1 deployment shape — §12 "In-process turn
// registry"). A multi-instance BFF would split the registry and is out of
// scope for v1.
//
// The registry exposes three operations and a `size` accessor for tests:
//
//   - `register(conversationId, controller)`: associate an AbortController
//      with a conversation. Idempotent on the value (overwrites any previous
//      controller — the caller is expected to check `get(...) === undefined`
//      under BR-28 before calling, so a same-key call is a programmer error).
//   - `get(conversationId)`: returns the controller if a turn is in flight,
//      else `undefined`. Used by `cancelTurn` (BR-38) and by `sendMessage` to
//      enforce BR-28 (single in-flight) + BR-27 (replay-vs-in-progress).
//   - `release(conversationId)`: remove the entry. The `sendMessage` finally-
//      block is the sole legitimate caller; `cancelTurn` MUST NOT release —
//      releasing is the responsibility of the request that owns the
//      AbortController (chat.back.md §1.1, "released on terminal frame OR on
//      iterator throw").
//
// Concurrency model: chat.back.md §1 "Concurrency (c)" — the registry is a
// plain `Map`; all reads/writes happen synchronously within Node's single
// event-loop turn. No locking is required as long as `register` happens
// BEFORE `await` of any long-running operation; the route handler enforces
// this ordering (BR-28 description: "The check + registration must be atomic
// within the route's single Node event-loop turn").

// Module-scoped singleton. The map identity is stable across imports (the
// module is loaded once per Node process), so every consumer sees the same
// instance.
const registry: Map<string, AbortController> = new Map();

/**
 * Associate `controller` with `conversationId`. Overwrites any prior entry —
 * callers are expected to check `get(...) === undefined` first (BR-28).
 */
export function register(
  conversationId: string,
  controller: AbortController
): void {
  registry.set(conversationId, controller);
}

/**
 * Return the AbortController registered for `conversationId`, or `undefined`
 * if no turn is in flight. Used by:
 *   - `sendMessage` (BR-28 single-in-flight guard).
 *   - `sendMessage` idempotent-replay branch (BR-27: if a user row exists but
 *     no assistant row, AND the controller is registered, the turn is still
 *     running -> 409 BUSINESS_TURN_IN_PROGRESS).
 *   - `cancelTurn` (BR-38: absent -> 404 RESOURCE_NOT_FOUND).
 */
export function get(conversationId: string): AbortController | undefined {
  return registry.get(conversationId);
}

/**
 * Remove the registry entry for `conversationId`. No-op when absent (defensive
 * — release is expected to be called in a finally-block whose register may
 * have failed before reaching this code path).
 */
export function release(conversationId: string): void {
  registry.delete(conversationId);
}

/**
 * Number of in-flight turns. EXPORTED FOR TESTS — production code reads
 * through `get(...)`. Useful for asserting cleanup in cancellation tests.
 */
export function size(): number {
  return registry.size;
}

/**
 * Drop every entry. EXPORTED FOR TESTS ONLY. Production code never clears the
 * registry — entries are released individually by the request that owns them.
 * Tests use this in `beforeEach` to isolate cases.
 */
export function clearForTests(): void {
  registry.clear();
}
