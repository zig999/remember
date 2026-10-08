import { describe, expect, it } from "vitest";
import type { AttributeKey, NodeAttribute } from "../../types";
import { changeOfField, type FieldChange } from "../entity-change-effect";
import type { AttributeFieldValues } from "../entity-form-schema";
import { catalogKey, heldAttribute } from "./entity-form-support";
import { multiKey } from "./entity-form-multi-support";
import { temporalKey } from "./entity-form-validity-support";

function fieldOf(
  overrides: Partial<AttributeFieldValues>,
): AttributeFieldValues {
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

interface ChangeCase {
  readonly label: string;
  readonly field: AttributeFieldValues;
  readonly catalog: AttributeKey;
  readonly attributes: readonly NodeAttribute[];
  readonly expected: FieldChange;
}

describe("entity change of a field", () => {
  it.each<ChangeCase>([
    {
      label: "a field of a temporal key started from a current attribute and given another value is a set change naming that attribute with the effect succession",
      field: fieldOf({
        attributeKey: "role",
        itemId: "at-1",
        startedWith: "Open",
        value: "Closed",
      }),
      catalog: temporalKey("role"),
      attributes: [heldAttribute("role", "Open", { id: "at-1" })],
      expected: { kind: "set", effect: "succession", itemId: "at-1" },
    },
    {
      label: "a field of a key that is not temporal started from a current attribute and given another value is a set change naming that attribute with the effect correction",
      field: fieldOf({
        attributeKey: "title",
        itemId: "at-1",
        startedWith: "Alpha",
        value: "Beta",
      }),
      catalog: catalogKey("title"),
      attributes: [heldAttribute("title", "Alpha", { id: "at-1" })],
      expected: { kind: "set", effect: "correction", itemId: "at-1" },
    },
    {
      label: "a field of a multi-valued key started from a current attribute and given a value another attribute holds is a correction naming the attribute it started from",
      field: fieldOf({ itemId: "at-1", startedWith: "Alpha", value: "Beta" }),
      catalog: multiKey("tag"),
      attributes: [
        heldAttribute("tag", "Alpha", { id: "at-1" }),
        heldAttribute("tag", "Beta", { id: "at-2" }),
      ],
      expected: { kind: "set", effect: "correction", itemId: "at-1" },
    },
    {
      label: "an emptied field of a key that is not temporal is a remove change naming the attribute it started from with the effect removal",
      field: fieldOf({
        attributeKey: "title",
        itemId: "at-1",
        startedWith: "Alpha",
        value: "",
      }),
      catalog: catalogKey("title"),
      attributes: [heldAttribute("title", "Alpha", { id: "at-1" })],
      expected: { kind: "remove", effect: "removal", itemId: "at-1" },
    },
    {
      label: "an emptied field of a temporal key is a remove change with the effect removal, not a succession",
      field: fieldOf({
        attributeKey: "role",
        itemId: "at-1",
        startedWith: "Open",
        value: "",
      }),
      catalog: temporalKey("role"),
      attributes: [heldAttribute("role", "Open", { id: "at-1" })],
      expected: { kind: "remove", effect: "removal", itemId: "at-1" },
    },
    {
      label: "a field given a value for a key of which the node holds no attribute is a set change naming no attribute with the effect first-value",
      field: fieldOf({ attributeKey: "title", value: "Gamma" }),
      catalog: catalogKey("title"),
      attributes: [],
      expected: { kind: "set", effect: "first-value", itemId: null },
    },
    {
      label: "a field added to a multi-valued key of which the node holds an active attribute, with a value nothing holds, is a set change naming no attribute with the effect addition",
      field: fieldOf({ value: "Gamma" }),
      catalog: multiKey("tag"),
      attributes: [heldAttribute("tag", "Alpha")],
      expected: { kind: "set", effect: "addition", itemId: null },
    },
    {
      label: "a field added to a multi-valued key of which the node holds only a disputed attribute is an addition, a disputed attribute being live",
      field: fieldOf({ value: "Gamma" }),
      catalog: multiKey("tag"),
      attributes: [heldAttribute("tag", "Alpha", { status: "disputed" })],
      expected: { kind: "set", effect: "addition", itemId: null },
    },
  ])("gives $label", ({ field, catalog, attributes, expected }) => {
    expect(changeOfField(field, catalog, attributes)).toEqual(expected);
  });
});
