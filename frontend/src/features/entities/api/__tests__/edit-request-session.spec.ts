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
import { __setEditRedirectForTests, entityEdit } from "../_edit-request";
import { SOME_EDIT, failureOf, sentBody } from "./edit-support";
import { answers, answersAfter, jsonResponse, stubFetch } from "./support";

const redirect = vi.fn<(url: string) => void>();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  redirect.mockClear();
  __setEditRedirectForTests(redirect);
  useAuthStore.getState().clear();
  mocks.fetchAccessToken.mockReset();
});

afterEach(() => {
  __setEditRedirectForTests(null);
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("edit answered 401 on its first attempt", () => {
  it("starts one refresh and repeats the edit once with the new token, the same options and a fresh cutoff, never starting a second refresh", async () => {
    useAuthStore.getState().setToken("old.token");
    mocks.fetchAccessToken.mockResolvedValue("new.token");
    const requests = stubFetch((request, attempt) =>
      attempt === 1
        ? answersAfter(20_000, () => jsonResponse({}, 401))(request, attempt)
        : answersAfter(29_000, () => jsonResponse({}, 401))(request, attempt),
    );
    const call = failureOf(entityEdit("n-1", SOME_EDIT));
    await vi.advanceTimersByTimeAsync(20_000);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(29_000);
    const failure = await call;
    const [first, repeat] = requests;
    expect({
      refreshes: mocks.fetchAccessToken.mock.calls.length,
      requests: requests.length,
      firstAuthorization: first?.authorization,
      repeatAuthorization: repeat?.authorization,
      repeatTarget: [repeat?.method, repeat?.url.href],
      repeatBody: sentBody(1),
      repeatAnswered: failure.httpStatus,
    }).toEqual({
      refreshes: 1,
      requests: 2,
      firstAuthorization: "Bearer old.token",
      repeatAuthorization: "Bearer new.token",
      repeatTarget: [first?.method, first?.url.href],
      repeatBody: sentBody(0),
      repeatAnswered: 401,
    });
  });

  it("fails with SYSTEM_UNKNOWN carrying status 401 when the repeat after a refresh is answered 401 with no readable error code", async () => {
    useAuthStore.getState().setToken("old.token");
    mocks.fetchAccessToken.mockResolvedValue("new.token");
    stubFetch(answers(() => jsonResponse({}, 401)));
    expect(await failureOf(entityEdit("n-1", SOME_EDIT))).toMatchObject({
      httpStatus: 401,
      code: "SYSTEM_UNKNOWN",
      message: "Erro desconhecido do servidor.",
    });
  });
});

describe("edit whose session refresh fails", () => {
  it("clears the stored token, replaces the page with /sign-in?reason=session_expired and fails with AUTH_SESSION_EXPIRED", async () => {
    useAuthStore.getState().setToken("stale.token");
    mocks.fetchAccessToken.mockRejectedValue(new Error("no session"));
    stubFetch(answers(() => jsonResponse({}, 401)));
    const failure = await failureOf(entityEdit("n-1", SOME_EDIT));
    expect({
      storedToken: useAuthStore.getState().accessToken,
      redirects: redirect.mock.calls,
      code: failure.code,
    }).toEqual({
      storedToken: null,
      redirects: [["/sign-in?reason=session_expired"]],
      code: "AUTH_SESSION_EXPIRED",
    });
  });

  it("fails carrying status 401 and reading Sua sessão expirou. Faça login novamente.", async () => {
    useAuthStore.getState().setToken("stale.token");
    mocks.fetchAccessToken.mockRejectedValue(new Error("no session"));
    stubFetch(answers(() => jsonResponse({}, 401)));
    expect(await failureOf(entityEdit("n-1", SOME_EDIT))).toMatchObject({
      httpStatus: 401,
      message: "Sua sessão expirou. Faça login novamente.",
    });
  });
});
