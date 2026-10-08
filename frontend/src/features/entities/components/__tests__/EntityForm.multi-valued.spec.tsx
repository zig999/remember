import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  staleAttribute,
  unmountForms,
} from "./entity-form-support";
import {
  addValue,
  buttonsIn,
  inputsOf,
  multiKey,
  removeValue,
  retypeValue,
  sortedValuesIn,
  valuesIn,
} from "./entity-form-multi-support";

afterEach(() => {
  unmountForms();
});

describe("entity form multi-valued keys", () => {
  it("shows one field for each current attribute the node holds of the key and none for a non-current one", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      staleAttribute("tag", "Retired"),
      heldAttribute("tag", "Beta"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    expect(inputsOf(container, "tag")).toHaveLength(2);
  });

  it("starts each field of the key with the value of its own attribute", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      heldAttribute("tag", "Beta"),
      heldAttribute("tag", "Gamma"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    expect(sortedValuesIn(container, "tag")).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("adds one field to the key when the owner adds a field", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      heldAttribute("tag", "Beta"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    await addValue(container, "tag");
    expect(inputsOf(container, "tag")).toHaveLength(3);
  });

  it("starts an added field empty, whatever values the key already holds, and leaves the held fields as they were", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      heldAttribute("tag", "Beta"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    await addValue(container, "tag");
    expect(sortedValuesIn(container, "tag")).toEqual(["", "Alpha", "Beta"]);
  });

  it("removes the field the owner removes and leaves the others holding their own values", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      heldAttribute("tag", "Beta"),
      heldAttribute("tag", "Gamma"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    await removeValue(container, "tag", "Beta");
    expect(sortedValuesIn(container, "tag")).toEqual(["Alpha", "Gamma"]);
  });

  it("keeps what the owner typed in a field when another field of the key is removed", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      heldAttribute("tag", "Beta"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    await retypeValue(container, "tag", "Beta", "Beta-edited");
    await removeValue(container, "tag", "Alpha");
    expect(valuesIn(container, "tag")).toEqual(["Beta-edited"]);
  });

  it("offers no add or remove control on a key that does not allow multiple current values", async () => {
    const node = nodeHolding([
      heldAttribute("status_text", "Open"),
      heldAttribute("tag", "Alpha"),
    ]);
    const container = await renderForm(node, [
      catalogKey("status_text"),
      multiKey("tag"),
    ]);
    expect(buttonsIn(container, "status_text")).toHaveLength(0);
  });

  it("lists a field per current attribute and lets the owner add one and remove one", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      staleAttribute("tag", "Retired"),
      heldAttribute("tag", "Beta"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    const opened = sortedValuesIn(container, "tag");
    await addValue(container, "tag");
    const added = sortedValuesIn(container, "tag");
    await removeValue(container, "tag", "Alpha");
    const removed = sortedValuesIn(container, "tag");
    expect([opened, added, removed]).toEqual([
      ["Alpha", "Beta"],
      ["", "Alpha", "Beta"],
      ["", "Beta"],
    ]);
  });
});
