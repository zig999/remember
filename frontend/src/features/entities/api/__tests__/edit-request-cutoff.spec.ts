import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { entityEdit } from "../_edit-request";
import { ACCEPTED_WIRE, SOME_EDIT } from "./edit-support";
import { answersAfter, factsOf, jsonResponse, stubFetch } from "./support";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("edit without an answer", () => {
  it("is cut off at 30000 ms and not before, with the abort reading Request timed out after 30s and the failure SYSTEM_TIMEOUT", async () => {
    const requests = stubFetch(
      answersAfter(60_000, () => jsonResponse(ACCEPTED_WIRE)),
    );
    const call = entityEdit("n-1", SOME_EDIT).then(
      () => null,
      (error: unknown) => factsOf(error),
    );
    const signal = requests[0]?.signal;
    await vi.advanceTimersByTimeAsync(29_999);
    const abortedBefore = signal?.aborted;
    await vi.advanceTimersByTimeAsync(1);
    const abortedAtCutoff = signal?.aborted;
    await vi.advanceTimersByTimeAsync(60_000);
    const failure = await call;
    const reason = signal?.reason as { message?: unknown } | undefined;
    expect({
      abortedBefore,
      abortedAtCutoff,
      abortReason: reason?.message,
      code: failure?.code,
    }).toEqual({
      abortedBefore: false,
      abortedAtCutoff: true,
      abortReason: "Request timed out after 30s",
      code: "SYSTEM_TIMEOUT",
    });
  });

  it("fails with SYSTEM_TIMEOUT reading Tempo limite excedido na requisição.", async () => {
    stubFetch(answersAfter(60_000, () => jsonResponse(ACCEPTED_WIRE)));
    const call = entityEdit("n-1", SOME_EDIT).then(
      () => null,
      (error: unknown) => factsOf(error),
    );
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await call).toMatchObject({
      message: "Tempo limite excedido na requisição.",
    });
  });
});
