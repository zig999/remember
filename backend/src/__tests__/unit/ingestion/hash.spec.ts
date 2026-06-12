// TC-02 acceptance criteria covered:
//  - "idempotency_key = sha256(content_hash || prompt_version || model || chunking_version),
//     no separator, hex lowercase"
//  - "content_hash = sha256(content) hex lowercase 64 chars; computed via node:crypto"

import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { composeIdempotencyKey, sha256Hex } from "../../../modules/ingestion/hash.js";

describe("sha256Hex", () => {
  it("returns 64 lowercase hex characters", () => {
    const h = sha256Hex("hello world");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h.length).toBe(64);
  });

  it("matches the canonical sha256 of UTF-8 bytes", () => {
    const input = "Olá mundo";
    const expected = createHash("sha256").update(input, "utf8").digest("hex");
    expect(sha256Hex(input)).toBe(expected);
  });

  it("is deterministic", () => {
    expect(sha256Hex("a")).toBe(sha256Hex("a"));
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
  });
});

describe("composeIdempotencyKey (BR-08)", () => {
  it("returns 64 lowercase hex characters", () => {
    const k = composeIdempotencyKey({
      content_hash: "a".repeat(64),
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    });
    expect(k).toMatch(/^[0-9a-f]{64}$/);
  });

  it("concatenates operands without a separator (spec BR-08)", () => {
    const args = {
      content_hash: "a".repeat(64),
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    };
    const expected = createHash("sha256")
      .update(args.content_hash, "utf8")
      .update(args.prompt_version, "utf8")
      .update(args.model, "utf8")
      .update(args.chunking_version, "utf8")
      .digest("hex");
    expect(composeIdempotencyKey(args)).toBe(expected);
  });

  it("yields a different key when any single operand changes", () => {
    const base = {
      content_hash: "a".repeat(64),
      prompt_version: "v1",
      model: "claude-opus-4-7",
      chunking_version: "v1",
    };
    const k0 = composeIdempotencyKey(base);
    expect(composeIdempotencyKey({ ...base, content_hash: "b".repeat(64) })).not.toBe(k0);
    expect(composeIdempotencyKey({ ...base, prompt_version: "v2" })).not.toBe(k0);
    expect(composeIdempotencyKey({ ...base, model: "claude-opus-5" })).not.toBe(k0);
    expect(composeIdempotencyKey({ ...base, chunking_version: "v2" })).not.toBe(k0);
  });

  it("is deterministic across calls", () => {
    const args = {
      content_hash: "f".repeat(64),
      prompt_version: "v1",
      model: "test",
      chunking_version: "v1",
    };
    expect(composeIdempotencyKey(args)).toBe(composeIdempotencyKey(args));
  });
});
