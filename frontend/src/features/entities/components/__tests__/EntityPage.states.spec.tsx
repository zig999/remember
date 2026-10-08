import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import {
  NODE_ID,
  click,
  flush,
  keysAnswer,
  neverAnswers,
  nodeAnswer,
  observe,
  openEntityPage,
  pageSettled,
  refusal,
  requestCounts,
  retryButton,
  unmountPages,
  waitForAlert,
  waitForRequest,
} from "./page-support";

const SERVER_CODE = "SYSTEM_CODIGO_PROPRIO_DA_FALHA";
const SERVER_MESSAGE = "mensagem-propria-da-falha-do-servidor";
const COULD_NOT_LOAD = "Não foi possível carregar o formulário. Tente novamente.";

function serverFailure(): Promise<Response> {
  return refusal(500, SERVER_CODE, SERVER_MESSAGE);
}

afterEach(() => {
  unmountPages();
  vi.restoreAllMocks();
});

describe("entity page while the node or the catalog is being fetched", () => {
  it("stands a loading indication in place of the form while the node is being fetched", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: neverAnswers,
      keys: neverAnswers,
    });
    await waitForRequest(page, "node");
    expect(observe(page)).toMatchObject({
      loading: expect.any(String),
      alert: null,
      form: false,
    });
  });

  it("stands a loading indication in place of the form while the catalog is being fetched", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: () => nodeAnswer("active"),
      keys: neverAnswers,
    });
    await waitForRequest(page, "keys");
    expect(observe(page)).toMatchObject({
      loading: expect.any(String),
      alert: null,
      form: false,
    });
  });

  it("reads the loading indication Carregando formulário…", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: neverAnswers,
      keys: neverAnswers,
    });
    await waitForRequest(page, "node");
    expect(observe(page).loading).toBe("Carregando formulário…");
  });
});

describe("entity page for an identity at which no knowledge node is held", () => {
  it("shows the alert Nó não encontrado.", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: () => refusal(404, "RESOURCE_NOT_FOUND", "KnowledgeNode not found"),
      keys: neverAnswers,
    });
    await pageSettled(page);
    expect(observe(page).alert).toBe("Nó não encontrado.");
  });
});

describe("entity page for a node or a catalog that fails to load", () => {
  it("shows the could-not-load-form alert when the node read fails for another cause", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: serverFailure,
      keys: neverAnswers,
    });
    await pageSettled(page);
    expect(observe(page).alert).toContain(COULD_NOT_LOAD);
  });

  it("shows the could-not-load-form alert when the catalog read fails for an active node", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: () => nodeAnswer("active"),
      keys: serverFailure,
    });
    await waitForAlert(page);
    expect(observe(page).alert).toContain(COULD_NOT_LOAD);
  });

  it("labels the could-not-load-form alert's action Tentar novamente", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: serverFailure,
      keys: neverAnswers,
    });
    await pageSettled(page);
    expect(observe(page).actionLabel).toBe("Tentar novamente");
  });

  it("loads the node and the catalog again when the action is used after the catalog failed", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: () => nodeAnswer("active"),
      keys: (attempt) => (attempt === 1 ? serverFailure() : keysAnswer()),
    });
    await waitForAlert(page);
    await click(retryButton(page));
    await flush(60);
    expect(requestCounts(page)).toEqual({ node: 2, keys: 2 });
  });

  it("loads the node and then the catalog when the action is used after the node failed", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: (attempt) =>
        attempt === 1 ? serverFailure() : nodeAnswer("active"),
      keys: () => keysAnswer(),
    });
    await pageSettled(page);
    await click(retryButton(page));
    await flush(60);
    const counts = requestCounts(page);
    expect({ node: counts.node, catalogRequested: counts.keys > 0 }).toEqual({
      node: 2,
      catalogRequested: true,
    });
  });
});

describe("entity page alerts for a failed read", () => {
  it.each([
    {
      label: "node-not-found alert",
      answer: () =>
        refusal(404, "RESOURCE_NOT_FOUND", SERVER_MESSAGE),
      code: "RESOURCE_NOT_FOUND",
    },
    {
      label: "could-not-load-form alert",
      answer: serverFailure,
      code: SERVER_CODE,
    },
  ])(
    "carries no code or message of the failure's own in the $label",
    async ({ answer, code }) => {
      const page = await openEntityPage(NODE_ID, {
        node: answer,
        keys: neverAnswers,
      });
      await pageSettled(page);
      const alert = observe(page).alert;
      expect({
        alertShown: alert !== null,
        showsCode: (alert ?? "").includes(code),
        showsMessage: (alert ?? "").includes(SERVER_MESSAGE),
      }).toEqual({ alertShown: true, showsCode: false, showsMessage: false });
    },
  );
});
