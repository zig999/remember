import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { SOME_VARIABLES, mountEdit, outcomeOf, unmountEdits } from "./edit-support";
import { stubFetch, type RecordedRequest } from "./support";

afterEach(() => {
  unmountEdits();
  vi.restoreAllMocks();
});

function rejectsOnceCancelled(request: RecordedRequest): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    if (request.signal?.aborted === true) reject(request.signal.reason);
  });
}

describe("edit outcome", () => {
  it("is unreachable with SYSTEM_ABORTED, not a refusal, when the caller cancels the edit before an answer", async () => {
    stubFetch(rejectsOnceCancelled);
    const caller = new AbortController();
    caller.abort();
    expect(
      await outcomeOf(mountEdit(), { ...SOME_VARIABLES, signal: caller.signal }),
    ).toMatchObject({
      kind: "unreachable",
      failure: { code: "SYSTEM_ABORTED" },
    });
  });
});
