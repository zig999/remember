import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

const mocks = vi.hoisted(() => ({
  fetchAccessToken: vi.fn(),
  toast: Object.assign(vi.fn<(message: string) => string>(), {
    dismiss: vi.fn(),
  }),
}));

vi.mock("sonner", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toast: mocks.toast,
}));

vi.mock("../../../auth/api/neon-auth", () => ({
  AuthError: class AuthError extends Error {},
  signInWithEmail: vi.fn(),
  fetchAccessToken: mocks.fetchAccessToken,
}));

import { useAuthStore } from "../../../../state/auth";
import { __setEditRedirectForTests } from "../../api/_edit-request";
import { answers, jsonResponse } from "../../api/__tests__/support";
import {
  confirmAndAwaitAnswer,
  unmountStatusForms,
} from "./entity-form-conflict-support";
import { reviewedEditWith } from "./entity-form-failure-support";
import { alertsOf } from "./entity-form-value-type-support";

const redirect = vi.fn<(url: string) => void>();

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.toast.dismiss.mockClear();
  mocks.fetchAccessToken.mockReset();
  redirect.mockClear();
  __setEditRedirectForTests(redirect);
  useAuthStore.getState().clear();
});

afterEach(() => {
  __setEditRedirectForTests(null);
  unmountStatusForms();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("entity form whose edit is answered 401 and whose session cannot be refreshed", () => {
  it("shows no alert of either kind, neither the refusal's nor the could-not-be-sent one", async () => {
    const edit = await reviewedEditWith(answers(() => jsonResponse({}, 401)));
    useAuthStore.getState().setToken("stale.token");
    mocks.fetchAccessToken.mockRejectedValue(new Error("no session"));
    await confirmAndAwaitAnswer(edit);
    expect({
      alerts: alertsOf(edit.container),
      pagesReplaced: redirect.mock.calls.length,
    }).toEqual({ alerts: [], pagesReplaced: 1 });
  });
});
