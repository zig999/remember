// TC-01 acceptance criteria covered:
//   - BUSINESS_CHAT_DISABLED maps to HTTP 503.
//   - BUSINESS_CHAT_PROVIDER_UNAVAILABLE maps to HTTP 503.
//   - mapChatError returns the canonical ErrorEnvelope shape.
//
// Spec refs: chat.back.md §10 error catalog; BR-14 / BR-21 / BR-11.

import { describe, expect, it } from "vitest";

import {
  ChatDisabledError,
  ChatProviderUnavailableError,
  isChatError,
  mapChatError,
} from "../../../modules/chat/service/errors.js";

describe("chat/service/errors", () => {
  // BR-14: kill-switch surfaces 503 BUSINESS_CHAT_DISABLED.
  it("ChatDisabledError carries statusCode 503 and the BUSINESS_CHAT_DISABLED code", () => {
    const err = new ChatDisabledError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("BUSINESS_CHAT_DISABLED");
    expect(err.name).toBe("ChatDisabledError");
    expect(err.message).toMatch(/disabled/i);
  });

  // BR-21 (pre-stream) / BR-11 (in-stream).
  it("ChatProviderUnavailableError carries statusCode 503 and the BUSINESS_CHAT_PROVIDER_UNAVAILABLE code", () => {
    const err = new ChatProviderUnavailableError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("BUSINESS_CHAT_PROVIDER_UNAVAILABLE");
    expect(err.name).toBe("ChatProviderUnavailableError");
  });

  it("ChatProviderUnavailableError accepts a sanitised override message", () => {
    const err = new ChatProviderUnavailableError("upstream connection refused");
    expect(err.message).toBe("upstream connection refused");
  });

  // chat.back.md §10: pre-stream rendering uses statusCode 503.
  it("mapChatError(ChatDisabledError) -> 503 + BUSINESS_CHAT_DISABLED envelope", () => {
    const mapped = mapChatError(new ChatDisabledError());
    expect(mapped.statusCode).toBe(503);
    expect(mapped.logLevel).toBe("warn");
    expect(mapped.envelope.ok).toBe(false);
    expect(mapped.envelope.error.code).toBe("BUSINESS_CHAT_DISABLED");
    expect(mapped.envelope.error.message).toMatch(/disabled/i);
  });

  it("mapChatError(ChatProviderUnavailableError) -> 503 + BUSINESS_CHAT_PROVIDER_UNAVAILABLE envelope", () => {
    const mapped = mapChatError(new ChatProviderUnavailableError());
    expect(mapped.statusCode).toBe(503);
    expect(mapped.logLevel).toBe("error");
    expect(mapped.envelope.ok).toBe(false);
    expect(mapped.envelope.error.code).toBe("BUSINESS_CHAT_PROVIDER_UNAVAILABLE");
  });

  // Narrow-test helper used at the route boundary.
  it("isChatError recognises the two chat sentinels and rejects others", () => {
    expect(isChatError(new ChatDisabledError())).toBe(true);
    expect(isChatError(new ChatProviderUnavailableError())).toBe(true);
    expect(isChatError(new Error("generic"))).toBe(false);
    expect(isChatError(null)).toBe(false);
    expect(isChatError(undefined)).toBe(false);
  });
});
