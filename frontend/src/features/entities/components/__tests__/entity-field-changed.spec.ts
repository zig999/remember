import { describe, expect, it } from "vitest";
import { changedFlags } from "../entity-field-changed";
import type { AttributeFieldValues } from "../entity-form-schema";
import { catalogKey, heldAttribute, staleAttribute } from "./entity-form-support";
import { multiKey } from "./entity-form-multi-support";

function fieldOf(overrides: Partial<AttributeFieldValues>): AttributeFieldValues {
  return {
    attributeKey: "tag",
    itemId: null,
    startedWith: "",
    value: "",
    validFrom: "",
    validTo: "",
    ...overrides,
  };
}

const ALPHA = heldAttribute("tag", "Alpha", { id: "at-1" });
const BETA = heldAttribute("tag", "Beta", { id: "at-2" });

describe("entity form changed field", () => {
  it.each([
    {
      label: "its value equals the value it started with, whatever validity it holds",
      field: fieldOf({
        itemId: "at-1",
        startedWith: "Alpha",
        value: "Alpha",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
      }),
      multiple: false,
      attributes: [ALPHA],
      expected: false,
    },
    {
      label: "its value differs from the value it started with",
      field: fieldOf({ itemId: "at-1", startedWith: "Alpha", value: "Gamma" }),
      multiple: false,
      attributes: [ALPHA],
      expected: true,
    },
    {
      label: "it was emptied from a held value",
      field: fieldOf({ itemId: "at-1", startedWith: "Alpha", value: "" }),
      multiple: false,
      attributes: [ALPHA],
      expected: true,
    },
    {
      label: "it is added to a multi-valued key and repeats an active value the node holds",
      field: fieldOf({ value: "Alpha" }),
      multiple: true,
      attributes: [ALPHA],
      expected: false,
    },
    {
      label: "it is added to a multi-valued key and repeats an uncertain value the node holds",
      field: fieldOf({ value: "Alpha" }),
      multiple: true,
      attributes: [heldAttribute("tag", "Alpha", { status: "uncertain" })],
      expected: false,
    },
    {
      label: "it is added to a multi-valued key and repeats a superseded value",
      field: fieldOf({ value: "Alpha" }),
      multiple: true,
      attributes: [staleAttribute("tag", "Alpha")],
      expected: true,
    },
    {
      label: "it is added to a multi-valued key with a value no attribute holds",
      field: fieldOf({ value: "Gamma" }),
      multiple: true,
      attributes: [ALPHA],
      expected: true,
    },
    {
      label: "it started from an attribute and is edited to a value another attribute of its multi-valued key holds",
      field: fieldOf({ itemId: "at-1", startedWith: "Alpha", value: "Beta" }),
      multiple: true,
      attributes: [ALPHA, BETA],
      expected: true,
    },
    {
      label: "it is added to a key that allows one value and repeats the value the node holds",
      field: fieldOf({ value: "Alpha" }),
      multiple: false,
      attributes: [ALPHA],
      expected: true,
    },
  ])(
    "reads a field as changed $expected when $label",
    ({ field, multiple, attributes, expected }) => {
      const catalog = multiple ? multiKey("tag") : catalogKey("tag");
      expect(changedFlags([field], [catalog], attributes)).toEqual([expected]);
    },
  );
});
