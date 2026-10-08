import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  staleAttribute,
  unmountForms,
  valuesByKey,
} from "./entity-form-support";

afterEach(() => {
  unmountForms();
});

describe("entity form starting values", () => {
  it("starts each field with its key's current attribute value, and empty where the key holds no current attribute", async () => {
    const catalog = [
      catalogKey("status_text"),
      catalogKey("owner"),
      catalogKey("location"),
      catalogKey("deadline"),
    ];
    const node = nodeHolding([
      staleAttribute("owner", "Old-owner"),
      heldAttribute("location", "Lisbon"),
      staleAttribute("status_text", "Old-status"),
      heldAttribute("status_text", "New-status"),
    ]);
    const container = await renderForm(node, catalog);
    expect(valuesByKey(container, catalog)).toEqual({
      status_text: "New-status",
      owner: "",
      location: "Lisbon",
      deadline: "",
    });
  });
});
