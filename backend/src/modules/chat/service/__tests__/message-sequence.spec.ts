// Regression coverage for the v2.2 faithful-multi-row-persistence fix.
//
// WHY THIS EXISTS: multi-turn chat broke on the 2nd turn because a tool-bearing
// turn persisted an assistant `tool_use` block with no following `tool_result`
// row — Anthropic 400 ("tool_use ids ... without tool_result blocks"). The fix
// persists the turn across multiple rows; the new failure surface is a
// COUNT-bounded slice (recent window / older summary slice) that cuts in the
// MIDDLE of a turn. `sanitizeAnthropicSequence` is the guard. These tests
// encode the invariant it must hold: ANY contiguous slice of correctly-ordered
// rows becomes a valid Anthropic request (or empty) after sanitisation.

import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

import {
  sanitizeAnthropicSequence,
  contentHasToolUse,
  contentHasToolResult,
} from "../message-sequence.js";

type MessageParam = Anthropic.Messages.MessageParam;

const userText = (text: string): MessageParam => ({
  role: "user",
  content: [{ type: "text", text }],
});
const assistantText = (text: string): MessageParam => ({
  role: "assistant",
  content: [{ type: "text", text }],
});
const assistantToolUse = (id: string): MessageParam => ({
  role: "assistant",
  content: [{ type: "tool_use", id, name: "list_node_types", input: {} }],
});
const userToolResult = (id: string): MessageParam => ({
  role: "user",
  content: [{ type: "tool_result", tool_use_id: id, content: "ok" }],
});

/**
 * The invariant a valid Anthropic request must satisfy (the exact rule whose
 * violation produced the original 400): every assistant `tool_use` block is
 * immediately followed by a `user` message carrying the matching `tool_result`,
 * and no leading `user[tool_result]` dangles without a preceding `tool_use`.
 */
function isValidSequence(messages: readonly MessageParam[]): boolean {
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    if (m.role === "assistant" && contentHasToolUse(m.content)) {
      const next = messages[i + 1];
      if (!next || next.role !== "user" || !contentHasToolResult(next.content)) {
        return false;
      }
    }
    if (m.role === "user" && contentHasToolResult(m.content)) {
      const prev = messages[i - 1];
      if (!prev || prev.role !== "assistant" || !contentHasToolUse(prev.content)) {
        return false;
      }
    }
  }
  return true;
}

describe("sanitizeAnthropicSequence (v2.2 multi-row boundary guard)", () => {
  it("leaves a clean, already-valid sequence untouched", () => {
    const seq = [
      userText("Quantos tipos de nó existem?"),
      assistantToolUse("tu_1"),
      userToolResult("tu_1"),
      assistantText("Existem 10."),
      userText("E os link types?"),
    ];
    const out = sanitizeAnthropicSequence(seq);
    expect(out).toEqual(seq);
    expect(isValidSequence(out)).toBe(true);
  });

  it("drops a LEADING dangling user[tool_result] (window cut after its tool_use)", () => {
    // The recent window started mid-pair: the assistant[tool_use] fell off the
    // front, leaving the user[tool_result] orphaned. This is the exact shape
    // that 400s Anthropic ("tool_result ... without tool_use").
    const seq = [
      userToolResult("tu_OLD"), // orphan — paired tool_use was sliced off
      assistantText("Existem 10."),
      userText("E os link types?"),
    ];
    const out = sanitizeAnthropicSequence(seq);
    expect(out).toEqual([userText("E os link types?")]);
    expect(isValidSequence(out)).toBe(true);
  });

  it("drops a TRAILING dangling assistant[tool_use] (older slice cut before its tool_result)", () => {
    const seq = [
      userText("Quem é Anna?"),
      assistantText("A esposa do dono."),
      assistantToolUse("tu_TAIL"), // its tool_result fell off the tail
    ];
    const out = sanitizeAnthropicSequence(seq);
    expect(out).toEqual([
      userText("Quem é Anna?"),
      assistantText("A esposa do dono."),
    ]);
    expect(isValidSequence(out)).toBe(true);
  });

  it("drops a leading assistant message (a sequence must start on a user turn)", () => {
    const seq = [assistantText("...continuação"), userText("Nova pergunta")];
    const out = sanitizeAnthropicSequence(seq);
    expect(out).toEqual([userText("Nova pergunta")]);
  });

  it("drops empty-content rows anywhere (Anthropic rejects empty content)", () => {
    const empty: MessageParam = { role: "assistant", content: [] };
    const seq = [userText("oi"), empty, assistantText("olá")];
    const out = sanitizeAnthropicSequence(seq);
    expect(out).toEqual([userText("oi"), assistantText("olá")]);
  });

  it("trims a window that begins mid-pair AND ends mid-pair, keeping the valid core (incl. an intact pair)", () => {
    const seq = [
      userToolResult("tu_orphan_lead"), // leading orphan → dropped
      userText("pergunta"), //              clean user start → kept
      assistantToolUse("tu_1"), //          intact pair → kept
      userToolResult("tu_1"), //            intact pair → kept
      assistantText("resposta"), //         kept
      assistantToolUse("tu_tail"), //       trailing orphan → dropped
    ];
    const out = sanitizeAnthropicSequence(seq);
    expect(out).toEqual([
      userText("pergunta"),
      assistantToolUse("tu_1"),
      userToolResult("tu_1"),
      assistantText("resposta"),
    ]);
    expect(isValidSequence(out)).toBe(true);
  });

  it("returns empty when the slice is entirely tool scaffolding", () => {
    const seq = [userToolResult("tu_X"), assistantToolUse("tu_Y")];
    expect(sanitizeAnthropicSequence(seq)).toEqual([]);
  });
});
