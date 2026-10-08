import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

const mocks = vi.hoisted(() => ({ fetchAccessToken: vi.fn() }));

vi.mock("../../../auth/api/neon-auth", () => ({
  AuthError: class AuthError extends Error {},
  signInWithEmail: vi.fn(),
  fetchAccessToken: mocks.fetchAccessToken,
}));

import { useAuthStore } from "../../../../state/auth";
import { useNodeListing } from "../listing.hooks";
import {
  advance,
  answersAfter,
  jsonResponse,
  mountQuery,
  stubFetch,
  unmountAll,
} from "./support";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  useAuthStore.getState().clear();
  mocks.fetchAccessToken.mockReset();
});

afterEach(() => {
  unmountAll();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("read answered 401 on its first attempt", () => {
  it("starts one refresh and repeats the read once with the new token, the same options and a fresh cutoff, never starting a second refresh", async () => {
    useAuthStore.getState().setToken("old.token");
    mocks.fetchAccessToken.mockResolvedValue("new.token");
    const requests = stubFetch((request, attempt) =>
      attempt === 1
        ? answersAfter(20_000, () => jsonResponse({}, 401))(request, attempt)
        : answersAfter(29_000, () => jsonResponse({}, 401))(request, attempt),
    );
    const mounted = mountQuery(() => useNodeListing({ nodeType: "Project" }));
    await advance(0);
    await advance(20_000);
    await advance(0);
    await advance(0);
    await advance(29_000);
    await advance(0);
    await advance(0);
    const [first, repeat] = requests;
    expect({
      refreshes: mocks.fetchAccessToken.mock.calls.length,
      requests: requests.length,
      firstAuthorization: first?.authorization,
      repeatAuthorization: repeat?.authorization,
      repeatTarget: [repeat?.method, repeat?.url.href],
      repeatAnswered: (
        mounted.snapshot().error as { httpStatus?: unknown } | null
      )?.httpStatus,
    }).toEqual({
      refreshes: 1,
      requests: 2,
      firstAuthorization: "Bearer old.token",
      repeatAuthorization: "Bearer new.token",
      repeatTarget: [first?.method, first?.url.href],
      repeatAnswered: 401,
    });
  });
});
