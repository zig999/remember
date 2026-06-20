// TC-02 acceptance criteria covered:
//   - String of exactly TOOL_RESULT_MAX_CHARS code points is NOT truncated.
//   - String of TOOL_RESULT_MAX_CHARS + 1 IS truncated and the marker is appended.
//   - Truncation counts CODE POINTS, not UTF-16 code units (surrogate pairs).
//
// Spec refs: chat.back.md BR-13 (Unicode-codepoint-bounded truncation +
// `\n[truncated: <n> chars]` marker).

import { describe, expect, it } from "vitest";

import { truncateToolResult } from "../../../modules/chat/service/truncate-tool-result.js";

// Default ceiling from the env defaults (chat.back.md §8 — `TOOL_RESULT_MAX_CHARS = 8000`).
const MAX = 8000;

describe("chat/truncate-tool-result", () => {
  // BR-13: boundary — exactly MAX is NOT truncated.
  it("string of exactly MAX code points is NOT truncated", () => {
    const input = "x".repeat(MAX);
    const out = truncateToolResult(input, MAX);
    expect(out.truncated).toBe(false);
    expect(out.value).toBe(input);
    expect(out.totalChars).toBe(MAX);
  });

  // BR-13: boundary — MAX + 1 IS truncated; marker appended.
  it("string of MAX + 1 code points IS truncated and marker appended", () => {
    const input = "x".repeat(MAX + 1);
    const out = truncateToolResult(input, MAX);
    expect(out.truncated).toBe(true);
    expect(out.totalChars).toBe(MAX + 1);
    expect(out.value).toBe(`${"x".repeat(MAX)}\n[truncated: ${MAX + 1} chars]`);
  });

  // BR-13: empty string is a no-op (defensive).
  it("empty string: no truncation, totalChars = 0", () => {
    const out = truncateToolResult("", MAX);
    expect(out.truncated).toBe(false);
    expect(out.value).toBe("");
    expect(out.totalChars).toBe(0);
  });

  // BR-13: short string passes through unchanged.
  it("short string under the ceiling: unchanged", () => {
    const out = truncateToolResult('{"ok":true}', MAX);
    expect(out.truncated).toBe(false);
    expect(out.value).toBe('{"ok":true}');
    expect(out.totalChars).toBe(11);
  });

  // BR-13: truncation marker tells the model how many code points were cut
  // (well — the FULL original size, so model can also infer the cut amount).
  it("truncation marker carries the FULL (pre-truncation) code-point length", () => {
    const input = "y".repeat(10_000);
    const out = truncateToolResult(input, 100);
    expect(out.truncated).toBe(true);
    expect(out.totalChars).toBe(10_000);
    expect(out.value.endsWith("\n[truncated: 10000 chars]")).toBe(true);
    // Head is exactly 100 code points.
    const head = out.value.split("\n[truncated:")[0];
    expect([...head].length).toBe(100);
  });

  // BR-13: code-point counting — emoji (surrogate pair) is ONE char, not two.
  // A string of 5 four-byte emojis is 5 code points but 10 UTF-16 code units.
  // With maxChars = 5, no truncation should occur.
  it("counts code points, not UTF-16 code units (surrogate pairs)", () => {
    const fivePiles = "🗂️🗂️🗂️🗂️🗂️"; // 5 base emojis (note: each is actually 2 codepoints with VS-16)
    // Use a pure astral plane char to be unambiguous: 𝕏 (U+1D54F) — single
    // code point, two UTF-16 code units.
    const fiveAstral = "𝕏𝕏𝕏𝕏𝕏";
    expect([...fiveAstral].length).toBe(5);
    expect(fiveAstral.length).toBe(10); // UTF-16 code units — proves the difference.

    const out = truncateToolResult(fiveAstral, 5);
    expect(out.truncated).toBe(false);
    expect(out.value).toBe(fiveAstral);
    expect(out.totalChars).toBe(5);

    // Sanity: ensure the multi-codepoint emoji string is at least exercising
    // the iteration path (no exception on iteration), without locking into
    // the exact grapheme/codepoint count of that specific emoji.
    const outEmoji = truncateToolResult(fivePiles, 1_000);
    expect(outEmoji.truncated).toBe(false);
  });

  // BR-13: when maxChars is smaller than the input, code-point truncation
  // is precise (no half-surrogate left dangling).
  it("astral truncation: head boundary is on a full code point (no half-surrogate)", () => {
    const input = "𝕏𝕏𝕏𝕏𝕏"; // 5 code points
    const out = truncateToolResult(input, 3);
    expect(out.truncated).toBe(true);
    expect(out.totalChars).toBe(5);
    // Head is exactly 3 code points = 6 UTF-16 code units.
    const head = out.value.split("\n[truncated:")[0];
    expect([...head].length).toBe(3);
    expect(head.length).toBe(6);
    expect(out.value).toBe("𝕏𝕏𝕏\n[truncated: 5 chars]");
  });
});
