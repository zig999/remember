import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

const mocks = vi.hoisted(() => ({
  toast: Object.assign(vi.fn<(message: string) => string>(), {
    dismiss: vi.fn(),
  }),
}));

vi.mock("sonner", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toast: mocks.toast,
}));

import { useAuthStore } from "../../../../state/auth";
import { answersAfter, failsWith } from "../../api/__tests__/support";
import {
  acceptedAnswer,
  confirmAndAwaitAnswer,
  unmountStatusForms,
} from "./entity-form-conflict-support";
import {
  TYPED_FORM,
  confirmAndAwaitCutoff,
  heldFormOf,
  reviewedEditWith,
} from "./entity-form-failure-support";
import { alertsOf } from "./entity-form-value-type-support";

const COULD_NOT_BE_SENT = "Não foi possível enviar a edição. Tente novamente.";

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.toast.dismiss.mockClear();
  useAuthStore.getState().clear();
});

afterEach(() => {
  unmountStatusForms();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("entity form whose edit cannot reach the knowledge base", () => {
  it("alerts that the edit could not be sent, with no message of the failure's own, when thirty seconds pass without an answer", async () => {
    const edit = await reviewedEditWith(answersAfter(60_000, acceptedAnswer));
    await confirmAndAwaitCutoff(edit);
    expect(alertsOf(edit.container)).toEqual([COULD_NOT_BE_SENT]);
  });

  it("still holds the status the owner typed, the reason and the open review when the request fails on the network", async () => {
    const edit = await reviewedEditWith(
      failsWith(new TypeError("Failed to fetch")),
    );
    await confirmAndAwaitAnswer(edit);
    expect(heldFormOf(edit.container)).toEqual(TYPED_FORM);
  });
});
