import { afterEach, describe, expect, it } from "vitest";
import type { AttributeKey, NodeAttribute } from "../../types";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  staleAttribute,
  unmountForms,
} from "./entity-form-support";
import { addValue, multiKey, removeValue } from "./entity-form-multi-support";
import { typeInto } from "./entity-form-value-type-support";
import { temporalKey } from "./entity-form-validity-support";
import { effectsWhere, reviewedEffectsIn } from "./entity-form-effect-support";

afterEach(() => {
  unmountForms();
});

interface FirstValueCase {
  readonly label: string;
  readonly catalog: AttributeKey;
  readonly attributes: readonly NodeAttribute[];
}

interface AdditionCase {
  readonly label: string;
  readonly attributes: readonly NodeAttribute[];
  readonly typed: string;
}

interface EmptiedCase {
  readonly label: string;
  readonly catalog: AttributeKey;
}

describe("entity form review stating the effect of each changed field", () => {
  it("states exactly one effect for each changed field, a key with several changed fields included", async () => {
    const container = await renderForm(
      nodeHolding([
        heldAttribute("title", "Alpha"),
        heldAttribute("tag", "Alpha"),
        heldAttribute("tag", "Beta"),
      ]),
      [catalogKey("title"), multiKey("tag")],
    );
    await typeInto(container, "title", "Alpha", "Gamma");
    await typeInto(container, "tag", "Alpha", "Alpha-edited");
    await typeInto(container, "tag", "Beta", "Beta-edited");
    const entries = await reviewedEffectsIn(container);
    expect(entries.map(({ effects }) => effects.length)).toEqual([1, 1, 1]);
  });

  it("states a succession for a field of a temporal key that started from a current attribute and was changed to another non-empty value", async () => {
    const container = await renderForm(
      nodeHolding([heldAttribute("role", "Open")]),
      [temporalKey("role")],
    );
    await typeInto(container, "role", "Open", "Closed");
    const entries = await reviewedEffectsIn(container);
    expect(effectsWhere(entries, { key: "role", previous: "Open" })).toEqual([
      ["Sucessão"],
    ]);
  });

  it("states a correction for a field of a key that is not temporal that started from a current attribute and was changed to another non-empty value", async () => {
    const container = await renderForm(
      nodeHolding([heldAttribute("title", "Alpha")]),
      [catalogKey("title")],
    );
    await typeInto(container, "title", "Alpha", "Beta");
    const entries = await reviewedEffectsIn(container);
    expect(effectsWhere(entries, { key: "title", previous: "Alpha" })).toEqual([
      ["Correção"],
    ]);
  });

  it.each<FirstValueCase>([
    {
      label: "the node holds no attribute of the key",
      catalog: catalogKey("title"),
      attributes: [],
    },
    {
      label: "the node holds only a superseded attribute of the key",
      catalog: catalogKey("title"),
      attributes: [staleAttribute("title", "Retired")],
    },
    {
      label: "the key is temporal and the node holds no attribute of it",
      catalog: temporalKey("role"),
      attributes: [],
    },
  ])(
    "states a first value for a field given a value when $label",
    async ({ catalog, attributes }) => {
      const container = await renderForm(nodeHolding(attributes), [catalog]);
      await typeInto(container, catalog.key, "", "Gamma");
      const entries = await reviewedEffectsIn(container);
      expect(effectsWhere(entries, { key: catalog.key, next: "Gamma" })).toEqual(
        [["Primeiro valor"]],
      );
    },
  );

  it.each<AdditionCase>([
    {
      label: "the key holds an active attribute",
      attributes: [heldAttribute("tag", "Alpha")],
      typed: "Gamma",
    },
    {
      label: "the key holds only an uncertain attribute",
      attributes: [heldAttribute("tag", "Alpha", { status: "uncertain" })],
      typed: "Gamma",
    },
    {
      label: "the value is held only by a superseded attribute of the key",
      attributes: [
        heldAttribute("tag", "Alpha"),
        staleAttribute("tag", "Retired"),
      ],
      typed: "Retired",
    },
  ])(
    "states an addition for a field added to a multi-valued key when $label",
    async ({ attributes, typed }) => {
      const container = await renderForm(nodeHolding(attributes), [
        multiKey("tag"),
      ]);
      await addValue(container, "tag");
      await typeInto(container, "tag", "", typed);
      const entries = await reviewedEffectsIn(container);
      expect(effectsWhere(entries, { key: "tag", next: typed })).toEqual([
        ["Adição"],
      ]);
    },
  );

  it.each<EmptiedCase>([
    { label: "a key that is not temporal", catalog: catalogKey("title") },
    { label: "a temporal key", catalog: temporalKey("title") },
  ])(
    "states a removal for a field of $label emptied after starting with a value",
    async ({ catalog }) => {
      const container = await renderForm(
        nodeHolding([heldAttribute(catalog.key, "Alpha")]),
        [catalog],
      );
      await typeInto(container, catalog.key, "Alpha", "");
      const entries = await reviewedEffectsIn(container);
      expect(
        effectsWhere(entries, { key: catalog.key, previous: "Alpha" }),
      ).toEqual([["Remoção"]]);
    },
  );

  it("states a removal for a field removed from a multi-valued key after starting with a value", async () => {
    const container = await renderForm(
      nodeHolding([
        heldAttribute("tag", "Alpha"),
        heldAttribute("tag", "Beta"),
      ]),
      [multiKey("tag")],
    );
    await removeValue(container, "tag", "Alpha");
    const entries = await reviewedEffectsIn(container);
    expect(effectsWhere(entries, { key: "tag", previous: "Alpha" })).toEqual([
      ["Remoção"],
    ]);
  });
});

describe("entity form review judging each effect against the node as the form loaded it", () => {
  it("states a first value for both of two fields added to a multi-valued key of which the node holds no live attribute", async () => {
    const container = await renderForm(nodeHolding([]), [multiKey("tag")]);
    await typeInto(container, "tag", "", "Alpha");
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Beta");
    const entries = await reviewedEffectsIn(container);
    expect(
      entries.map(({ key, next, effects }) => ({ key, next, effects })),
    ).toEqual([
      { key: "tag", next: "Alpha", effects: ["Primeiro valor"] },
      { key: "tag", next: "Beta", effects: ["Primeiro valor"] },
    ]);
  });

  it("states an addition for both of two fields added to a multi-valued key of which the node holds a live attribute", async () => {
    const container = await renderForm(
      nodeHolding([heldAttribute("tag", "Alpha")]),
      [multiKey("tag")],
    );
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Beta");
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Gamma");
    const entries = await reviewedEffectsIn(container);
    expect(
      entries.map(({ key, next, effects }) => ({ key, next, effects })),
    ).toEqual([
      { key: "tag", next: "Beta", effects: ["Adição"] },
      { key: "tag", next: "Gamma", effects: ["Adição"] },
    ]);
  });

  it("states an addition for a field added while the same edit removes the only live attribute of the key", async () => {
    const container = await renderForm(
      nodeHolding([heldAttribute("tag", "Alpha")]),
      [multiKey("tag")],
    );
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Gamma");
    await removeValue(container, "tag", "Alpha");
    const entries = await reviewedEffectsIn(container);
    expect(effectsWhere(entries, { key: "tag", next: "Gamma" })).toEqual([
      ["Adição"],
    ]);
  });
});

describe("entity form review wording of the effects", () => {
  it("names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending punctuation", async () => {
    const container = await renderForm(
      nodeHolding([
        heldAttribute("title", "Alpha"),
        heldAttribute("role", "Open"),
        heldAttribute("owner", "Ana"),
        heldAttribute("tag", "Alpha"),
      ]),
      [
        catalogKey("title"),
        temporalKey("role"),
        catalogKey("note"),
        multiKey("tag"),
        catalogKey("owner"),
      ],
    );
    await typeInto(container, "title", "Alpha", "Beta");
    await typeInto(container, "role", "Open", "Closed");
    await typeInto(container, "note", "", "Hello");
    await addValue(container, "tag");
    await typeInto(container, "tag", "", "Gamma");
    await typeInto(container, "owner", "Ana", "");
    const entries = await reviewedEffectsIn(container);
    expect(
      Object.fromEntries(entries.map(({ key, effects }) => [key, effects])),
    ).toEqual({
      title: ["Correção"],
      role: ["Sucessão"],
      note: ["Primeiro valor"],
      tag: ["Adição"],
      owner: ["Remoção"],
    });
  });
});
