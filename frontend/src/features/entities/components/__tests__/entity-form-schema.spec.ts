import { describe, expect, it } from "vitest";
import { buildFormValues } from "../entity-form-schema";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  staleAttribute,
} from "./entity-form-support";

const CATALOG = [catalogKey("status_text"), catalogKey("deadline")];

const NODE = nodeHolding([
  heldAttribute("status_text", "New-status", { id: "at-current-77" }),
  {
    ...staleAttribute("deadline", "Old-deadline"),
    id: "at-stale-12",
  },
]);

describe("entity form field state", () => {
  it.each([
    {
      held: "a current attribute",
      key: "status_text",
      expected: {
        itemId: "at-current-77",
        startedWith: "New-status",
        value: "New-status",
      },
    },
    {
      held: "no current attribute",
      key: "deadline",
      expected: { itemId: null, startedWith: "", value: "" },
    },
  ])(
    "records the current attribute a field started from, the value it started with and its value, for a key holding $held",
    ({ key, expected }) => {
      const entry = buildFormValues(NODE, CATALOG).fields.find(
        (field) => field.attributeKey === key,
      );
      expect({
        itemId: entry?.itemId ?? null,
        startedWith: entry?.startedWith,
        value: entry?.value,
      }).toEqual(expected);
    },
  );
});
