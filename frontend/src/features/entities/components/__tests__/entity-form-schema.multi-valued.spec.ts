import { describe, expect, it } from "vitest";
import { buildFormValues, emptyField } from "../entity-form-schema";
import {
  heldAttribute,
  nodeHolding,
  staleAttribute,
} from "./entity-form-support";
import { multiKey } from "./entity-form-multi-support";

describe("entity form multi-valued field state", () => {
  it("ties each field of a multi-valued key to its own current attribute, with the value it started with", () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha", { id: "at-1" }),
      { ...staleAttribute("tag", "Retired"), id: "at-9" },
      heldAttribute("tag", "Beta", { id: "at-2" }),
    ]);
    const entries = [...buildFormValues(node, [multiKey("tag")]).fields].sort(
      (left, right) => (left.itemId ?? "").localeCompare(right.itemId ?? ""),
    );
    expect(entries).toEqual([
      {
        attributeKey: "tag",
        itemId: "at-1",
        startedWith: "Alpha",
        value: "Alpha",
        validFrom: "",
        validTo: "",
      },
      {
        attributeKey: "tag",
        itemId: "at-2",
        startedWith: "Beta",
        value: "Beta",
        validFrom: "",
        validTo: "",
      },
    ]);
  });

  it("builds a field added to a key from no current attribute and with no value", () => {
    expect(emptyField("tag")).toEqual({
      attributeKey: "tag",
      itemId: null,
      startedWith: "",
      value: "",
      validFrom: "",
      validTo: "",
    });
  });
});
