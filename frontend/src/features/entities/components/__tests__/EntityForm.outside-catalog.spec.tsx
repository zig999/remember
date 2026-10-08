import { afterEach, describe, expect, it } from "vitest";
import { allowed, closedKey } from "./entity-form-closed-support";
import {
  controlSignatureOf,
  controlsCarrying,
  formTextOf,
  groupsTextOf,
} from "./entity-form-outside-support";
import {
  multiKey,
  sortedValuesIn,
  valuesIn,
} from "./entity-form-multi-support";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import { acceptedFlagOf, typedKey } from "./entity-form-value-type-support";

const CATALOG = [
  catalogKey("alpha"),
  multiKey("tags"),
  closedKey("status", [allowed("Aberto"), allowed("Fechado")]),
];

const HELD = [
  heldAttribute("alpha", "A-held"),
  heldAttribute("tags", "T-one"),
  heldAttribute("tags", "T-two"),
  heldAttribute("status", "Aberto"),
];

const OUTSIDE = [
  heldAttribute("birth_date", "Zq-outside-one"),
  heldAttribute("retired_key", "Zq-outside-two"),
  heldAttribute("retired_key", "Zq-outside-three"),
];

const OUTSIDE_VALUES = OUTSIDE.map((attribute) => attribute.value);

afterEach(() => {
  unmountForms();
});

describe("entity form attributes outside the catalog", () => {
  it("shows the value of an attribute whose key the catalog does not hold, and adds no field for it", async () => {
    const catalog = [catalogKey("alpha")];
    const held = heldAttribute("alpha", "A-held");
    const outside = heldAttribute("birth_date", "Zq-outside-one");
    const without = await renderForm(nodeHolding([held]), catalog);
    const withOutside = await renderForm(nodeHolding([held, outside]), catalog);
    expect({
      valueShown: formTextOf(withOutside).includes("Zq-outside-one"),
      fieldsAdded:
        controlSignatureOf(withOutside).length -
        controlSignatureOf(without).length,
    }).toEqual({ valueShown: true, fieldsAdded: 0 });
  });

  it("shows the value of every attribute outside the catalog, across keys and across several values of one key", async () => {
    const container = await renderForm(
      nodeHolding([...HELD, ...OUTSIDE]),
      CATALOG,
    );
    const text = formTextOf(container);
    expect(OUTSIDE_VALUES.filter((value) => !text.includes(value))).toEqual([]);
  });

  it("leaves the form with exactly the controls its catalog keys give, whatever lies outside the catalog", async () => {
    const without = await renderForm(nodeHolding(HELD), CATALOG);
    const withOutside = await renderForm(
      nodeHolding([...HELD, ...OUTSIDE]),
      CATALOG,
    );
    expect(controlSignatureOf(withOutside)).toEqual(
      controlSignatureOf(without),
    );
  });

  it("gives no input, select, textarea, combobox or button that carries or represents an outside-catalog value", async () => {
    const container = await renderForm(
      nodeHolding([...HELD, ...OUTSIDE]),
      CATALOG,
    );
    const carriers = OUTSIDE_VALUES.flatMap((value) =>
      controlsCarrying(container, value),
    );
    expect(carriers).toEqual([]);
  });

  it("keeps an attribute whose key the catalog holds in its own field group, with its own values", async () => {
    const container = await renderForm(
      nodeHolding([...HELD, ...OUTSIDE]),
      CATALOG,
    );
    expect({
      alpha: valuesIn(container, "alpha"),
      tags: sortedValuesIn(container, "tags"),
    }).toEqual({ alpha: ["A-held"], tags: ["T-one", "T-two"] });
  });

  it("renders nothing beyond the catalog's field groups when no attribute lies outside the catalog", async () => {
    const container = await renderForm(nodeHolding(HELD), CATALOG);
    expect(formTextOf(container)).toBe(groupsTextOf(container, CATALOG));
  });

  it("keeps the value-type flag true when an outside-catalog value would be refused by a date or a number type", async () => {
    const node = nodeHolding([
      heldAttribute("day", "2026-02-03"),
      heldAttribute("legacy_date", "2026-02-30"),
      heldAttribute("legacy_number", "1,5"),
    ]);
    const container = await renderForm(node, [typedKey("day", "date")]);
    expect(acceptedFlagOf(container)).toBe("true");
  });
});
