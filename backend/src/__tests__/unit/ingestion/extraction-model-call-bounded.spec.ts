import { afterEach, describe, expect, it, vi } from "vitest";

import {
  defaultAnthropicFactory,
  type ExtractionMessageRequest,
} from "../../../modules/ingestion/service/extraction.service.js";

const API_KEY = "test-key";
const RUN_MODEL = "claude-run-model-under-test";
const OVERLOADED_STATUS = 529;
const IMMEDIATE_RETRY_AFTER_MS = "1";
const MAX_ATTEMPTS = 3;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const OBSERVATION_WINDOW_MS = 20 * 60 * 1000;

const CHUNK_REQUEST: ExtractionMessageRequest = {
  model: RUN_MODEL,
  system: "system prompt under test",
  tools: [],
  thinking: { type: "adaptive" },
  max_tokens: 1024,
  messages: [{ role: "user", content: "a chunk of the document" }],
};

interface Attempt {
  readonly startedAt: number;
  endedAt: number | null;
}

interface SilentModel {
  readonly attempts: Attempt[];
  readonly firstAttempt: Promise<void>;
}

function overloadedResponse(): Response {
  return new Response(
    JSON.stringify({
      type: "error",
      error: { type: "overloaded_error", message: "Overloaded" },
    }),
    {
      status: OVERLOADED_STATUS,
      headers: {
        "content-type": "application/json",
        "retry-after-ms": IMMEDIATE_RETRY_AFTER_MS,
      },
    }
  );
}

function silentModel(): SilentModel {
  const attempts: Attempt[] = [];
  let reachFirstAttempt: () => void = () => undefined;
  const firstAttempt = new Promise<void>((resolve) => {
    reachFirstAttempt = resolve;
  });
  vi.stubGlobal(
    "fetch",
    (_input: unknown, init?: RequestInit): Promise<Response> =>
      new Promise<Response>((_resolve, reject) => {
        const attempt: Attempt = { startedAt: Date.now(), endedAt: null };
        attempts.push(attempt);
        init?.signal?.addEventListener("abort", () => {
          attempt.endedAt = Date.now();
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
        reachFirstAttempt();
      })
  );
  return { attempts, firstAttempt };
}

describe("a call to the language model for extraction is bounded in wait and in retries", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("attempts a chunk extraction call at most three times when the model answers overloaded on every attempt", async () => {
    const fetchSpy = vi.fn(async () => overloadedResponse());
    vi.stubGlobal("fetch", fetchSpy);
    const stream = defaultAnthropicFactory(API_KEY).messages.stream(CHUNK_REQUEST);

    const failure = await stream.finalMessage().then(
      () => null,
      (error: unknown) => error
    );

    expect(failure, "the call must have reached the model and been refused").not.toBeNull();
    expect(fetchSpy.mock.calls.length).toBeLessThanOrEqual(MAX_ATTEMPTS);
  });

  it("waits at most five minutes per attempt and attempts at most three times when the model never answers", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const model = silentModel();
    void defaultAnthropicFactory(API_KEY)
      .messages.stream(CHUNK_REQUEST)
      .finalMessage()
      .catch(() => undefined);
    await model.firstAttempt;

    await vi.advanceTimersByTimeAsync(OBSERVATION_WINDOW_MS);
    const observedAt = Date.now();
    vi.clearAllTimers();
    const waitsMs = model.attempts.map(
      (attempt) => (attempt.endedAt ?? observedAt) - attempt.startedAt
    );

    expect(
      Math.max(...waitsMs),
      "an attempt waited on the model for more than five minutes"
    ).toBeLessThanOrEqual(FIVE_MINUTES_MS);
    expect(
      model.attempts.length,
      "the call was attempted more than three times"
    ).toBeLessThanOrEqual(MAX_ATTEMPTS);
  });
});
