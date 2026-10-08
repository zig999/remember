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
import {
  STATUS_KEYS,
  TYPED_STATUS,
  acceptedAnswer,
  confirmAndAwaitAnswer,
  confirmAndStayInsideTheWindow,
  conflictAnswer,
  reviewedEditOfStatus,
  unmountStatusForms,
} from "./entity-form-conflict-support";
import { reasonControlIn } from "./entity-form-reason-support";
import { valuesByKey } from "./entity-form-support";
import { TYPED_REASON } from "./entity-form-undo-support";
import { alertsOf } from "./entity-form-value-type-support";

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

describe("entity form answering the edit with a conflict", () => {
  it("still holds the status the owner typed and alerts that the node changed since the form was opened, though the status was superseded elsewhere", async () => {
    const edit = await reviewedEditOfStatus(conflictAnswer);
    await confirmAndAwaitAnswer(edit);
    expect({
      values: valuesByKey(edit.container, STATUS_KEYS),
      alerts: alertsOf(edit.container),
    }).toEqual({
      values: { status_text: TYPED_STATUS },
      alerts: ["Este nó mudou desde que você abriu o formulário."],
    });
  });

  it("leaves the reason as the owner typed it", async () => {
    const edit = await reviewedEditOfStatus(conflictAnswer);
    await confirmAndAwaitAnswer(edit);
    expect(reasonControlIn(edit.container)?.value).toBe(TYPED_REASON);
  });

  it("shows no conflict alert while the edit has not been sent", async () => {
    const edit = await reviewedEditOfStatus(conflictAnswer);
    await confirmAndStayInsideTheWindow(edit);
    expect(alertsOf(edit.container)).toEqual([]);
  });

  it("shows no conflict alert when the edit is accepted", async () => {
    const edit = await reviewedEditOfStatus(acceptedAnswer);
    await confirmAndAwaitAnswer(edit);
    expect(alertsOf(edit.container)).toEqual([]);
  });
});
