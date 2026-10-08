import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  helpTextsByKey,
  nodeHolding,
  renderForm,
  unmountForms,
  valuesOf,
} from "./entity-form-support";

afterEach(() => {
  unmountForms();
});

describe("entity form field groups", () => {
  it("holds one field for every catalog key of the node's type, in the order the catalog lists them", async () => {
    const catalog = [
      catalogKey("gamma"),
      catalogKey("alpha"),
      catalogKey("beta"),
    ];
    const node = nodeHolding([
      heldAttribute("beta", "B-value"),
      heldAttribute("gamma", "G-value"),
    ]);
    const container = await renderForm(node, catalog);
    expect(valuesOf(container)).toEqual(["G-value", "", "B-value"]);
  });

  it("shows each field the description the catalog holds for its own key as help text", async () => {
    const catalog = [
      catalogKey("gamma", "Descrição da chave gamma"),
      catalogKey("alpha", "Descrição da chave alpha"),
      catalogKey("beta", "Descrição da chave beta"),
    ];
    const container = await renderForm(nodeHolding([]), catalog);
    expect(helpTextsByKey(container, catalog)).toEqual({
      gamma: ["Descrição da chave gamma"],
      alpha: ["Descrição da chave alpha"],
      beta: ["Descrição da chave beta"],
    });
  });

  it("adds no field for an attribute whose key the catalog does not hold", async () => {
    const catalog = [catalogKey("alpha"), catalogKey("beta")];
    const node = nodeHolding([
      heldAttribute("alpha", "A-value"),
      heldAttribute("retired_key", "Retired-value"),
    ]);
    const container = await renderForm(node, catalog);
    expect(valuesOf(container)).toEqual(["A-value", ""]);
  });

  it("offers no field, prefilled or empty, for a key holding a disputed attribute", async () => {
    const catalog = [catalogKey("alpha"), catalogKey("beta")];
    const node = nodeHolding([
      heldAttribute("alpha", "Disputed-value", { status: "disputed" }),
      heldAttribute("beta", "B-value"),
    ]);
    const container = await renderForm(node, catalog);
    expect(valuesOf(container)).toEqual(["B-value"]);
  });
});
