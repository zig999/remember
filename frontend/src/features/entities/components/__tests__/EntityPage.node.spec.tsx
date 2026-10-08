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
  NODE_NAME,
  NODE_TYPE,
  firstTextNodeContaining,
  keysAnswer,
  neverAnswers,
  nodeAnswer,
  observe,
  openEntityPage,
  pageSettled,
  refusal,
  unmountPages,
} from "./page-support";

const ATTRIBUTE = { key: "status_text", value: "Valor-do-atributo-777" };

afterEach(() => {
  unmountPages();
  vi.restoreAllMocks();
});

describe("entity page header", () => {
  it.each([
    { label: "name", text: NODE_NAME },
    { label: "node type", text: NODE_TYPE },
    { label: "status", text: "needs-review" },
  ])("shows the node's $label", async ({ text }) => {
    const page = await openEntityPage(NODE_ID, {
      node: () => nodeAnswer("needs-review"),
      keys: neverAnswers,
    });
    await pageSettled(page);
    expect(page.workspace.textContent).toContain(text);
  });

  it.each([
    { label: "name", text: NODE_NAME },
    { label: "node type", text: NODE_TYPE },
    { label: "status", text: "active" },
  ])("places the node's $label above the form", async ({ text }) => {
    const page = await openEntityPage(NODE_ID, {
      node: () => nodeAnswer("active"),
      keys: () => keysAnswer(),
    });
    await pageSettled(page);
    const form = page.workspace.querySelector("form");
    const shown = firstTextNodeContaining(page.workspace, text);
    expect({
      formShown: form !== null,
      textShown: shown !== null,
      textAboveForm:
        form !== null &&
        shown !== null &&
        (form.compareDocumentPosition(shown) &
          Node.DOCUMENT_POSITION_PRECEDING) !==
          0,
    }).toEqual({ formShown: true, textShown: true, textAboveForm: true });
  });
});

describe("entity page for a node the knowledge base delivers", () => {
  it.each(["active", "needs-review", "merged"])(
    "offers the form only for an active node and shows the attributes of any other node without a form (status %s)",
    async (status) => {
      const page = await openEntityPage(NODE_ID, {
        node: () => nodeAnswer(status, [ATTRIBUTE]),
        keys: () => keysAnswer(),
      });
      await pageSettled(page);
      const text = page.workspace.textContent ?? "";
      expect({
        form: observe(page).form,
        attributesShown:
          text.includes(ATTRIBUTE.key) && text.includes(ATTRIBUTE.value),
      }).toMatchObject(
        status === "active"
          ? { form: true }
          : { form: false, attributesShown: true },
      );
    },
  );

  it("shows no field for a node whose status is not active", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: () => nodeAnswer("needs-review", [ATTRIBUTE]),
      keys: () => keysAnswer(),
    });
    await pageSettled(page);
    expect({
      nodeShown: page.workspace.querySelector("h1") !== null,
      fields: observe(page).fields,
    }).toEqual({ nodeShown: true, fields: 0 });
  });
});

describe("entity page for a node the knowledge base refuses as deleted", () => {
  it("shows the deleted-node alert in place of the form, with no action and no code or message of the failure's own", async () => {
    const page = await openEntityPage(NODE_ID, {
      node: () =>
        refusal(
          410,
          "BUSINESS_NODE_DELETED",
          "mensagem-propria-do-no-apagado",
        ),
      keys: neverAnswers,
    });
    await pageSettled(page);
    const observed = observe(page);
    expect({
      alert: observed.alert,
      form: observed.form,
      action: observed.action,
    }).toEqual({
      alert: "Este nó foi apagado.",
      form: false,
      action: false,
    });
  });
});
