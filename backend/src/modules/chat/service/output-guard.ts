// Output guard against system-prompt leakage (chat.back.md BR-20).
//
// Purpose: before the agentic loop yields a `ChatEvent.text_delta`, it asks
// the guard "is the system-prompt marker present in this delta?". If yes, the
// delta is dropped — not yielded, not aggregated into the assistant turn that
// will be fed back on the next iteration. The check is a single
// `String.prototype.includes` call, O(|delta|).
//
// Two properties matter:
//
//   1. The marker is imported as a NAMED constant from the prompt module
//      (`CHAT_PROMPT_MARKER_V1` in `prompts/v1.ts`). The guard never reads the
//      prompt body — it just checks against the canary token planted at the
//      head of the prompt. This keeps the guard prompt-copy-agnostic; bumping
//      the prompt copy does not require bumping the guard.
//
//   2. On drop, the guard emits a pino WARN log with an opaque payload —
//      `{ event: "chat.output_guard_drop", marker_version: "v1" }`. It NEVER
//      logs the delta content (BR-20 explicit: "never the delta content").
//      Logging the delta would defeat the guard: the delta is precisely what
//      we wanted to keep out of any observable channel.
//
// The guard signature is INTENTIONALLY narrow: pass a delta in, get a result
// out. The caller (the loop) decides what to do with a dropped delta (the
// answer is: nothing — it is discarded from both the SSE stream and the
// next-iteration assistant turn).

import type { Logger } from "pino";

import { CHAT_PROMPT_MARKER_V1 } from "../prompts/v1.js";

/**
 * Version of the prompt module the guard is currently scrubbing against. v1
 * is the only registered version today; when v2 is added, the guard will
 * scrub the UNION (chat.back.md BR-20 "the output guard is expected to scrub
 * the union of all known markers").
 */
const MARKER_VERSION = "v1" as const;

/** Output of `inspectDelta` — used by the loop to decide whether to yield. */
export interface OutputGuardDecision {
  /** Whether to drop the delta (true) or pass it through (false). */
  readonly drop: boolean;
}

/**
 * Inspect a single `text_delta` against the registered system-prompt marker.
 *
 * @param delta   The raw text delta the Anthropic SDK produced.
 * @param logger  pino logger; a WARN is emitted on drop (no delta content).
 * @returns `{ drop: true }` if the marker is present; `{ drop: false }` otherwise.
 *
 * The function is pure aside from the WARN log; it makes no assumption about
 * what the caller does with a dropped delta beyond "do not yield it". This
 * keeps the guard composable: a future filter chain (e.g. additional markers,
 * additional patterns) can wrap or extend it without restructuring the loop.
 */
export function inspectDelta(delta: string, logger: Logger): OutputGuardDecision {
  // Single O(|delta|) substring scan — `String.prototype.includes` per BR-20.
  // Empty delta is a no-op (no marker possible).
  if (delta.length > 0 && delta.includes(CHAT_PROMPT_MARKER_V1)) {
    // BR-20 explicit: log marker_version ONLY. The delta content stays out of
    // every observable channel (SSE, pino, counters).
    logger.warn(
      { event: "chat.output_guard_drop", marker_version: MARKER_VERSION },
      "chat output guard dropped a delta containing the system-prompt marker"
    );
    return { drop: true };
  }
  return { drop: false };
}
