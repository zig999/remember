// Anthropic message-sequence sanitiser — shared by the turn context-builder
// (BR-31) and the distillation jobs (BR-33).
//
// WHY THIS EXISTS (chat.back.md v2.2 — faithful multi-row persistence):
// An agentic turn is persisted across SEPARATE `chat_message` rows —
// assistant `[text?, tool_use]`, then a synthetic user `[tool_result]`, then a
// final assistant `[text]`. Replaying those rows 1:1 yields a VALID Anthropic
// sequence ONLY when the slice begins and ends on a clean turn boundary.
//
// Any consumer that reads a COUNT-bounded slice (the recent window — BR-31 —
// or the older slice — BR-33) can cut the slice in the MIDDLE of a turn:
//
//   - A leading user `[tool_result]` whose paired assistant `[tool_use]` fell
//     outside the slice → Anthropic 400 ("tool_result ... without tool_use").
//   - A trailing assistant `[tool_use]` whose paired user `[tool_result]` fell
//     outside the slice → Anthropic 400 ("tool_use ... without tool_result").
//   - An empty-content row (a turn that terminated with no text — e.g. a
//     provider error before the first delta) → Anthropic 400 (empty content).
//
// `sanitizeAnthropicSequence` trims those boundary artefacts so ANY contiguous
// slice of correctly-ordered rows becomes a valid request by construction. It
// is intentionally conservative: it only drops from the two ends and removes
// empty-content rows; it never reorders or rewrites a block.

import type Anthropic from "@anthropic-ai/sdk";

type MessageParam = Anthropic.Messages.MessageParam;

/** True when `content` is a non-empty array of content blocks. */
function hasBlocks(content: unknown): content is unknown[] {
  return Array.isArray(content) && content.length > 0;
}

/** True when any block in `content` is a `tool_result` block. */
export function contentHasToolResult(content: unknown): boolean {
  if (!Array.isArray(content)) return false;
  return content.some(
    (b) =>
      typeof b === "object" &&
      b !== null &&
      (b as { type?: unknown }).type === "tool_result"
  );
}

/** True when any block in `content` is a `tool_use` block. */
export function contentHasToolUse(content: unknown): boolean {
  if (!Array.isArray(content)) return false;
  return content.some(
    (b) =>
      typeof b === "object" &&
      b !== null &&
      (b as { type?: unknown }).type === "tool_use"
  );
}

/**
 * Trim a contiguous slice of persisted message rows (already mapped to
 * `MessageParam`) into a VALID Anthropic message sequence:
 *
 *   1. Drop every empty-content message (any role) — Anthropic rejects them.
 *   2. Drop from the FRONT while the first message is an `assistant` message
 *      OR a `user` message carrying a `tool_result` block — i.e. until the
 *      sequence starts on a clean user turn.
 *   3. Drop from the BACK while the last message is an `assistant` message
 *      carrying a `tool_use` block whose paired `tool_result` is absent.
 *
 * The result is either a valid sequence (starts on a user turn, every
 * `tool_use` paired with a following `tool_result`) or empty.
 */
export function sanitizeAnthropicSequence(
  messages: readonly MessageParam[]
): MessageParam[] {
  // (1) Drop empty-content rows.
  let arr = messages.filter((m) => hasBlocks(m.content));

  // (2) Trim the front to a clean user-turn start.
  let start = 0;
  while (start < arr.length) {
    const m = arr[start]!;
    if (m.role === "assistant") {
      start += 1;
      continue;
    }
    if (m.role === "user" && contentHasToolResult(m.content)) {
      start += 1;
      continue;
    }
    break;
  }
  arr = arr.slice(start);

  // (3) Trim a trailing dangling assistant `tool_use` (its paired
  //     `tool_result` user row was sliced off the tail).
  let end = arr.length;
  while (end > 0) {
    const m = arr[end - 1]!;
    if (m.role === "assistant" && contentHasToolUse(m.content)) {
      end -= 1;
      continue;
    }
    break;
  }
  arr = arr.slice(0, end);

  return arr;
}
