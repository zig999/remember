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

import { __setRedirectForTests } from "../../../../lib/http";
import { useAuthStore } from "../../../../state/auth";
import { useNodeListing } from "../listing.hooks";
import {
  answers,
  compareFailures,
  jsonResponse,
  unmountAll,
} from "./support";

beforeEach(() => {
  __setRedirectForTests(vi.fn());
  useAuthStore.getState().clear();
  mocks.fetchAccessToken.mockReset();
});

afterEach(() => {
  unmountAll();
  __setRedirectForTests(null);
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("failed read answered 401", () => {
  it("fails with the status, code, message and details the http function gives when the session refresh fails", async () => {
    useAuthStore.getState().setToken("stale.token");
    mocks.fetchAccessToken.mockRejectedValue(new Error("no session"));
    const { viaRead, viaHttp } = await compareFailures(
      "/api/v1/nodes",
      answers(() => jsonResponse({}, 401)),
      () => useNodeListing({}),
    );
    expect(viaRead).toEqual(viaHttp);
  });

  it("fails with the status, code, message and details the http function gives when the repeat after a refresh is answered 401", async () => {
    useAuthStore.getState().setToken("stale.token");
    mocks.fetchAccessToken.mockResolvedValue("new.token");
    const { viaRead, viaHttp } = await compareFailures(
      "/api/v1/nodes",
      answers(() => jsonResponse({}, 401)),
      () => useNodeListing({}),
    );
    expect(viaRead).toEqual(viaHttp);
  });
});
