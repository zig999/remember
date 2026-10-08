import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { entityEdit } from "../_edit-request";
import { ACCEPTED_WIRE, SOME_EDIT, failureOf, refusalBody } from "./edit-support";
import {
  answers,
  answersAfter,
  failsWith,
  jsonResponse,
  stubFetch,
  textResponse,
} from "./support";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("failed edit", () => {
  it.each([
    {
      name: "a 422 refusal",
      status: 422,
      code: "VALIDATION_INVALID_FORMAT",
      message: "Request payload failed validation.",
      details: { issues: [{ path: "changes.0.value", message: "Required" }] },
    },
    {
      name: "a 500 refusal",
      status: 500,
      code: "SYSTEM_INTERNAL_ERROR",
      message: "Internal server error.",
      details: { cause: "trace-1" },
    },
  ])(
    "fails with the status, code, message and details read from $name",
    async ({ status, code, message, details }) => {
      stubFetch(
        answers(() => jsonResponse(refusalBody(code, message, details), status)),
      );
      expect(await failureOf(entityEdit("n-1", SOME_EDIT))).toEqual({
        httpStatus: status,
        code,
        message,
        details,
      });
    },
  );

  it("fails with SYSTEM_INVALID_RESPONSE carrying the answer's status when a 2xx answer is not JSON", async () => {
    stubFetch(answers(() => textResponse("<html>ok</html>", 200)));
    expect(await failureOf(entityEdit("n-1", SOME_EDIT))).toMatchObject({
      httpStatus: 200,
      code: "SYSTEM_INVALID_RESPONSE",
      message: "Resposta do servidor não é JSON válido.",
    });
  });

  it.each([
    {
      name: "500 with a body that is not JSON",
      status: 500,
      answer: () => textResponse("gateway said no", 500),
      code: "SYSTEM_UPSTREAM",
      message: "Algo deu errado. Tente novamente.",
    },
    {
      name: "499 with a body that is not JSON",
      status: 499,
      answer: () => textResponse("gateway said no", 499),
      code: "SYSTEM_UNKNOWN",
      message: "Erro desconhecido do servidor.",
    },
    {
      name: "502 with a JSON body that has no error member",
      status: 502,
      answer: () => jsonResponse({ ok: false }, 502),
      code: "SYSTEM_UPSTREAM",
      message: "Algo deu errado. Tente novamente.",
    },
    {
      name: "404 with an error member whose code is not a string",
      status: 404,
      answer: () => jsonResponse({ ok: false, error: { code: 42 } }, 404),
      code: "SYSTEM_UNKNOWN",
      message: "Erro desconhecido do servidor.",
    },
  ])(
    "fails with $code, the answer's status and its fixed message when the answer is $name",
    async ({ status, answer, code, message }) => {
      stubFetch(answers(answer));
      expect(await failureOf(entityEdit("n-1", SOME_EDIT))).toMatchObject({
        httpStatus: status,
        code,
        message,
      });
    },
  );

  it("reads the fixed upstream message when a 5xx body carries a message but no readable error code", async () => {
    stubFetch(
      answers(() =>
        jsonResponse({ ok: false, error: { message: "upstream detail" } }, 502),
      ),
    );
    expect(await failureOf(entityEdit("n-1", SOME_EDIT))).toMatchObject({
      httpStatus: 502,
      code: "SYSTEM_UPSTREAM",
      message: "Algo deu errado. Tente novamente.",
    });
  });

  it("fails with SYSTEM_ABORTED reading Requisição cancelada. when its caller cancels before an answer", async () => {
    stubFetch(answersAfter(60_000, () => jsonResponse(ACCEPTED_WIRE)));
    const caller = new AbortController();
    const failure = failureOf(entityEdit("n-1", SOME_EDIT, caller.signal));
    caller.abort();
    expect(await failure).toMatchObject({
      code: "SYSTEM_ABORTED",
      message: "Requisição cancelada.",
    });
  });

  it("fails with SYSTEM_NETWORK reading Falha de rede ao contactar o servidor. when it gets no answer for another cause", async () => {
    stubFetch(failsWith(new TypeError("Failed to fetch")));
    expect(await failureOf(entityEdit("n-1", SOME_EDIT))).toMatchObject({
      code: "SYSTEM_NETWORK",
      message: "Falha de rede ao contactar o servidor.",
    });
  });
});
