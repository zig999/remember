import { afterEach, describe, expect, it } from "vitest";
import {
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import { addValue } from "./entity-form-multi-support";
import {
  acceptedFlagOf,
  alertsOf,
  invalidMarkOf,
  messageIn,
  messagesByValue,
  typedKey,
  typeInto,
} from "./entity-form-value-type-support";
import {
  BOOL_WORDING,
  DATE_WORDING,
  NUMBER_WORDING,
} from "./value-type-wording";

afterEach(() => {
  unmountForms();
});

const TWO_DATES = [typedKey("start", "date"), typedKey("end", "date")];

describe("entity form message of a value its key's type refuses", () => {
  it("writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a text field or on a field emptied again", async () => {
    const keys = [
      typedKey("dateRefused", "date"),
      typedKey("numberRefused", "number"),
      typedKey("boolRefused", "bool"),
      typedKey("textAnything", "text"),
      typedKey("dateEmptied", "date"),
      typedKey("numberEmptied", "number"),
      typedKey("boolEmptied", "bool"),
    ];
    const container = await renderForm(nodeHolding([]), keys);
    await typeInto(container, "dateRefused", "", "2026-02-30");
    await typeInto(container, "numberRefused", "", "1,5");
    await typeInto(container, "boolRefused", "", "yes");
    await typeInto(container, "textAnything", "", "2026-02-30");
    await typeInto(container, "dateEmptied", "", "2026-02-30");
    await typeInto(container, "dateEmptied", "2026-02-30", "");
    await typeInto(container, "numberEmptied", "", "1,5");
    await typeInto(container, "numberEmptied", "1,5", "");
    await typeInto(container, "boolEmptied", "", "yes");
    await typeInto(container, "boolEmptied", "yes", "");
    expect(
      Object.fromEntries(
        keys.map(({ key }) => [key, messageIn(container, key)]),
      ),
    ).toEqual({
      dateRefused: DATE_WORDING,
      numberRefused: NUMBER_WORDING,
      boolRefused: BOOL_WORDING,
      textAnything: null,
      dateEmptied: null,
      numberEmptied: null,
      boolEmptied: null,
    });
  });

  it("marks only the field holding the refused value as invalid", async () => {
    const container = await renderForm(nodeHolding([]), TWO_DATES);
    await typeInto(container, "start", "", "2026-02-30");
    expect({
      start: invalidMarkOf(container, "start"),
      end: invalidMarkOf(container, "end"),
    }).toEqual({ start: "true", end: null });
  });

  it("announces the message once as an alert when a field holds a refused value", async () => {
    const container = await renderForm(nodeHolding([]), TWO_DATES);
    await typeInto(container, "start", "", "2026-02-30");
    expect(alertsOf(container)).toEqual([DATE_WORDING]);
  });

  it("clears the message and the invalid mark once the owner fixes the value", async () => {
    const container = await renderForm(nodeHolding([]), TWO_DATES);
    await typeInto(container, "start", "", "2026-02-30");
    await typeInto(container, "start", "2026-02-30", "2026-02-28");
    expect({
      message: messageIn(container, "start"),
      invalid: invalidMarkOf(container, "start"),
      alerts: alertsOf(container),
    }).toEqual({ message: null, invalid: null, alerts: [] });
  });

  it("validates each entry of a multi-valued key by its own key's value type", async () => {
    const node = nodeHolding([
      heldAttribute("when", "2026-02-03"),
      heldAttribute("amounts", "12"),
    ]);
    const container = await renderForm(node, [
      typedKey("when", "date", true),
      typedKey("amounts", "number", true),
    ]);
    await addValue(container, "when");
    await typeInto(container, "when", "", "12");
    await addValue(container, "amounts");
    await typeInto(container, "amounts", "", "2026-02-03");
    expect({
      when: messagesByValue(container, "when"),
      amounts: messagesByValue(container, "amounts"),
    }).toEqual({
      when: { "2026-02-03": null, "12": DATE_WORDING },
      amounts: { "12": null, "2026-02-03": NUMBER_WORDING },
    });
  });
});

describe("entity form value-type validity flag", () => {
  const typesOfAKind = [
    typedKey("day", "date"),
    typedKey("amount", "number"),
    typedKey("active", "bool"),
    typedKey("note", "text"),
  ];

  it("is true while every field holds a value that reads as its key's type, a text field holding anything", async () => {
    const node = nodeHolding([
      heldAttribute("day", "2026-02-03"),
      heldAttribute("amount", "12"),
      heldAttribute("active", "true"),
      heldAttribute("note", "2026-02-30"),
    ]);
    const container = await renderForm(node, typesOfAKind);
    expect(acceptedFlagOf(container)).toBe("true");
  });

  it("is true while every field of a date, a number and a bool key is empty", async () => {
    const container = await renderForm(nodeHolding([]), typesOfAKind);
    expect(acceptedFlagOf(container)).toBe("true");
  });

  it("is false while one field holds a value its key's type refuses and the others are fine", async () => {
    const node = nodeHolding([
      heldAttribute("day", "2026-02-03"),
      heldAttribute("amount", "12"),
    ]);
    const container = await renderForm(node, typesOfAKind);
    await typeInto(container, "amount", "12", "1,5");
    expect(acceptedFlagOf(container)).toBe("false");
  });

  it("returns to true once the refused value is fixed", async () => {
    const node = nodeHolding([heldAttribute("amount", "12")]);
    const container = await renderForm(node, typesOfAKind);
    await typeInto(container, "amount", "12", "1,5");
    await typeInto(container, "amount", "1,5", "1.5");
    expect(acceptedFlagOf(container)).toBe("true");
  });

  it("returns to true once the field holding the refused value is emptied", async () => {
    const node = nodeHolding([heldAttribute("amount", "12")]);
    const container = await renderForm(node, typesOfAKind);
    await typeInto(container, "amount", "12", "1,5");
    await typeInto(container, "amount", "1,5", "");
    expect(acceptedFlagOf(container)).toBe("true");
  });
});
