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
  answers,
  jsonResponse,
  textResponse,
} from "../../api/__tests__/support";
import {
  confirmAndAwaitAnswer,
  unmountStatusForms,
} from "./entity-form-conflict-support";
import {
  REFUSAL_MESSAGE,
  TYPED_FORM,
  heldFormOf,
  refusalAnswer,
  reviewedEditWith,
} from "./entity-form-failure-support";
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

const FIXED_TEXT_REFUSALS = [
  {
    answered: "5xx with no readable error code",
    build: () => textResponse("Bad Gateway", 502),
    text: "Algo deu errado. Tente novamente.",
  },
  {
    answered: "below 500 with no readable error code",
    build: () => jsonResponse({}, 404),
    text: "Erro desconhecido do servidor.",
  },
  {
    answered: "2xx with a body that is not JSON",
    build: () => textResponse("<html>ok</html>", 200),
    text: "Resposta do servidor não é JSON válido.",
  },
] as const;

describe("entity form answering the edit with a refusal other than a conflict", () => {
  it("alerts with the message the refusal carries and with nothing else", async () => {
    const edit = await reviewedEditWith(answers(refusalAnswer));
    await confirmAndAwaitAnswer(edit);
    expect(alertsOf(edit.container)).toEqual([REFUSAL_MESSAGE]);
  });

  it("still holds the status the owner typed, the reason and the open review, though the node was superseded elsewhere", async () => {
    const edit = await reviewedEditWith(answers(refusalAnswer));
    await confirmAndAwaitAnswer(edit);
    expect(heldFormOf(edit.container)).toEqual(TYPED_FORM);
  });

  it.each(FIXED_TEXT_REFUSALS)(
    "alerts with the fixed text $text when the edit is answered $answered, as a refusal and not as an edit that could not be sent",
    async ({ build, text }) => {
      const edit = await reviewedEditWith(answers(build));
      await confirmAndAwaitAnswer(edit);
      expect(alertsOf(edit.container)).toEqual([text]);
    },
  );
});
