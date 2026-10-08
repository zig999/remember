import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  staleAttribute,
  unmountForms,
} from "./entity-form-support";
import { addValue, multiKey } from "./entity-form-multi-support";
import { typedKey, typeInto } from "./entity-form-value-type-support";
import { temporalKey } from "./entity-form-validity-support";
import { reviewOfferedIn, reviewedFieldsIn } from "./entity-form-review-support";

afterEach(() => {
  unmountForms();
});

const KEYS = [catalogKey("title"), temporalKey("role"), multiKey("tag")];

const NODE = nodeHolding([
  heldAttribute("title", "Alpha"),
  heldAttribute("role", "Open"),
  heldAttribute("tag", "Alpha"),
  heldAttribute("tag", "Beta"),
]);

const HELD_BY_STATUS = nodeHolding([
  heldAttribute("title", "Alpha"),
  heldAttribute("tag", "Alpha"),
  heldAttribute("tag", "Beta", { status: "uncertain" }),
]);

const TITLE_AND_TAGS = [catalogKey("title"), multiKey("tag")];

describe("entity form offering the review", () => {
  it("offers the review only while a field differs from the value it started with", async () => {
    const container = await renderForm(NODE, KEYS);
    const atOpen = reviewOfferedIn(container);
    await typeInto(container, "title", "Alpha", "Beta");
    const whileChanged = reviewOfferedIn(container);
    await typeInto(container, "title", "Beta", "Alpha");
    const afterReturning = reviewOfferedIn(container);
    expect({ atOpen, whileChanged, afterReturning }).toEqual({
      atOpen: false,
      whileChanged: true,
      afterReturning: false,
    });
  });

  it("offers no review while a value its key's type refuses stands, even though another field is changed, and offers it again once the value is fixed", async () => {
    const container = await renderForm(
      nodeHolding([
        heldAttribute("title", "Alpha"),
        heldAttribute("amount", "12"),
      ]),
      [catalogKey("title"), typedKey("amount", "number")],
    );
    await typeInto(container, "title", "Alpha", "Beta");
    const beforeRefusal = reviewOfferedIn(container);
    await typeInto(container, "amount", "12", "1,5");
    const whileRefused = reviewOfferedIn(container);
    await typeInto(container, "amount", "1,5", "13");
    const afterFixing = reviewOfferedIn(container);
    expect({ beforeRefusal, whileRefused, afterFixing }).toEqual({
      beforeRefusal: true,
      whileRefused: false,
      afterFixing: true,
    });
  });
});

describe("entity form review of a field added with a value the key already holds", () => {
  it("does not offer the review for an added field whose value an active attribute holds or an uncertain attribute holds, and offers it for an added field with a value nothing holds", async () => {
    const container = await renderForm(HELD_BY_STATUS, [multiKey("tag")]);
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Alpha");
    const activeValueRepeated = reviewOfferedIn(container);
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Beta");
    const uncertainValueRepeated = reviewOfferedIn(container);
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Gamma");
    const valueNothingHolds = reviewOfferedIn(container);
    expect({
      activeValueRepeated,
      uncertainValueRepeated,
      valueNothingHolds,
    }).toEqual({
      activeValueRepeated: false,
      uncertainValueRepeated: false,
      valueNothingHolds: true,
    });
  });

  it("does not list an added field that repeats an active or an uncertain value while another field is changed", async () => {
    const container = await renderForm(HELD_BY_STATUS, TITLE_AND_TAGS);
    await typeInto(container, "title", "Alpha", "Beta");
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Alpha");
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Beta");
    const listed = await reviewedFieldsIn(container);
    expect(listed.map(({ key }) => key)).toEqual(["title"]);
  });

  it("lists an added field whose value only a superseded attribute holds", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      staleAttribute("tag", "Retired"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Retired");
    const listed = await reviewedFieldsIn(container);
    expect(listed.map(({ key, next }) => ({ key, next }))).toEqual([
      { key: "tag", next: "Retired" },
    ]);
  });

  it("lists a field that started with a value when the owner retypes it to a value another field of the key holds", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Alpha"),
      heldAttribute("tag", "Beta"),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    await typeInto(container, "tag", "Alpha", "Beta");
    const listed = await reviewedFieldsIn(container);
    expect(listed.map(({ key, previous, next }) => ({ key, previous, next }))).toEqual([
      { key: "tag", previous: "Alpha", next: "Beta" },
    ]);
  });
});
