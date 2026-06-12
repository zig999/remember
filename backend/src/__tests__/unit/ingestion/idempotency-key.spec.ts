// BR-08 (UC-01, A18) — idempotency key composition.
//
// Acceptance: "Vitest: idempotency key composition matches BR-08 formula".
// Formula: sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version),
// UTF-8 strings concatenated WITHOUT separator, hex lowercase 64 chars.

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { composeIdempotencyKey } from "../../../modules/ingestion/hash.js";

function expectedKey(args: {
  content_hash: string;
  prompt_version: string;
  model: string;
  chunking_version: string;
}): string {
  // Independent reference implementation — concatenate strings as UTF-8 and
  // sha256. This must exactly match the production composeIdempotencyKey.
  return createHash("sha256")
    .update(
      args.content_hash + args.prompt_version + args.model + args.chunking_version,
      "utf8"
    )
    .digest("hex");
}

describe("composeIdempotencyKey (BR-08)", () => {
  it("matches a reference sha256 of the concatenated UTF-8 inputs", () => {
    const args = {
      content_hash:
        "9b2c1e0f3a4d5b6c7e8f9012345678abcdef1234567890abcdef1234567890ab",
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    };
    expect(composeIdempotencyKey(args)).toBe(expectedKey(args));
  });

  it("is exactly 64 hex chars, lowercase", () => {
    const key = composeIdempotencyKey({
      content_hash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    });
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("bumping prompt_version changes the key (BR-08, §8)", () => {
    const base = {
      content_hash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    };
    const bumped = { ...base, prompt_version: "v2" };
    expect(composeIdempotencyKey(base)).not.toBe(composeIdempotencyKey(bumped));
  });

  it("bumping model changes the key", () => {
    const base = {
      content_hash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    };
    const bumped = { ...base, model: "gpt-5" };
    expect(composeIdempotencyKey(base)).not.toBe(composeIdempotencyKey(bumped));
  });

  it("bumping chunking_version changes the key (BR-03 invariant)", () => {
    const base = {
      content_hash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    };
    const bumped = { ...base, chunking_version: "v2" };
    expect(composeIdempotencyKey(base)).not.toBe(composeIdempotencyKey(bumped));
  });

  it("operand order matters — swapping model ↔ prompt_version flips the key", () => {
    const a = composeIdempotencyKey({
      content_hash: "a".repeat(64),
      prompt_version: "X",
      model: "Y",
      chunking_version: "v1",
    });
    const b = composeIdempotencyKey({
      content_hash: "a".repeat(64),
      prompt_version: "Y",
      model: "X",
      chunking_version: "v1",
    });
    expect(a).not.toBe(b);
  });
});
