// A5 — the default Anthropic client factory must construct the SDK client with
// an explicit, bounded per-request timeout + retry count, so a stalled stream
// cannot hang an extraction turn for the SDK's loose implicit default and
// transient errors self-heal. This guards the bound against being silently
// dropped (e.g. a refactor reverting to `new AnthropicClient({ apiKey })`).

import { describe, expect, it } from "vitest";

import { defaultAnthropicFactory } from "../../../modules/ingestion/service/extraction.service.js";

describe("defaultAnthropicFactory — A5 bounded timeout/retries", () => {
  it("constructs the Anthropic client with an explicit timeout and maxRetries", () => {
    // The factory narrows the return to `AnthropicLike`; the real instance is an
    // `@anthropic-ai/sdk` client that exposes `timeout` / `maxRetries`.
    const client = defaultAnthropicFactory("sk-ant-test-key") as unknown as {
      timeout: number;
      maxRetries: number;
    };

    expect(client.timeout).toBe(5 * 60 * 1000);
    expect(client.maxRetries).toBe(2);
  });

  it("does not fall back to the SDK's loose implicit 10-minute default", () => {
    const client = defaultAnthropicFactory("sk-ant-test-key") as unknown as {
      timeout: number;
    };
    expect(client.timeout).toBeLessThan(10 * 60 * 1000);
  });
});
