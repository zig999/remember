import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import { addValue, inputsOf } from "./entity-form-multi-support";
import { acceptedFlagOf } from "./entity-form-value-type-support";
import {
  allowed,
  choicesOf,
  clearChoice,
  closedKey,
  openChoice,
  pickOption,
  removeChoiceShowing,
  shownLabelsIn,
} from "./entity-form-closed-support";

afterEach(() => {
  unmountForms();
});

const STAGES = [
  allowed("draft", "Rascunho"),
  allowed("review", "Em revisão"),
  allowed("done", "Concluído"),
];
const STAGE_LABELS = ["Rascunho", "Em revisão", "Concluído"];

describe("entity form closed keys offer only their allowed values", () => {
  it("offers a closed key every allowed value and nothing else, each by its label, a label-less one by its own value, in the order the catalog gives them", async () => {
    const catalog = [
      closedKey("priority", [
        allowed("k", "Medium", 30),
        allowed("c", "Urgent", 10),
        allowed("t", null, 20),
        allowed("a", "Low", 40),
        allowed("n", "", 50),
      ]),
    ];
    const container = await renderForm(nodeHolding([]), catalog);
    expect((await openChoice(container, "priority")).offered).toEqual([
      "Medium",
      "Urgent",
      "t",
      "Low",
      "n",
    ]);
  });

  it("offers a closed key only its allowed values when the node holds a current value outside them", async () => {
    const node = nodeHolding([heldAttribute("stage", "legacy-code")]);
    const container = await renderForm(node, [closedKey("stage", STAGES)]);
    expect((await openChoice(container, "stage")).offered).toEqual(STAGE_LABELS);
  });

  it("shows each allowed value by its label, not by its own value", async () => {
    const container = await renderForm(nodeHolding([]), [
      closedKey("stage", STAGES),
    ]);
    expect((await openChoice(container, "stage")).offered).toEqual(STAGE_LABELS);
  });

  it("keeps the order the catalog delivers the allowed values in, whatever their sort orders and whatever alphabetical order would give", async () => {
    const catalog = [
      closedKey("level", [
        allowed("k", "Medium", 30),
        allowed("c", "Urgent", 10),
        allowed("t", "High", 20),
        allowed("a", "Low", 40),
      ]),
    ];
    const container = await renderForm(nodeHolding([]), catalog);
    expect((await openChoice(container, "level")).offered).toEqual([
      "Medium",
      "Urgent",
      "High",
      "Low",
    ]);
  });

  it("shows an allowed value that has no label by its own value, neither as an empty option nor left out", async () => {
    const catalog = [
      closedKey("planet", [
        allowed("Mercury-code", "Mercury"),
        allowed("venus-code", null),
        allowed("Mars-code", "Mars"),
      ]),
    ];
    const container = await renderForm(nodeHolding([]), catalog);
    expect((await openChoice(container, "planet")).offered).toEqual([
      "Mercury",
      "venus-code",
      "Mars",
    ]);
  });

  it("shows an allowed value whose label is the empty string by its own value, not as an empty option", async () => {
    const catalog = [
      closedKey("planet", [
        allowed("Mercury-code", "Mercury"),
        allowed("venus-code", ""),
        allowed("Mars-code", "Mars"),
      ]),
    ];
    const container = await renderForm(nodeHolding([]), catalog);
    expect((await openChoice(container, "planet")).offered).toEqual([
      "Mercury",
      "venus-code",
      "Mars",
    ]);
  });
});

describe("entity form closed key choice holds the allowed value", () => {
  it("holds the picked allowed value's own value in the form rather than its label", async () => {
    const catalog = [
      closedKey("level", [allowed("1", "Um"), allowed("2", "Dois")], {
        valueType: "number",
      }),
    ];
    const container = await renderForm(nodeHolding([]), catalog);
    await pickOption(container, "level", "Dois");
    expect({
      shown: shownLabelsIn(container, "level"),
      accepted: acceptedFlagOf(container),
    }).toEqual({ shown: ["Dois"], accepted: "true" });
  });

  it("starts with nothing selected for a closed key the node holds no value for", async () => {
    const container = await renderForm(nodeHolding([]), [
      closedKey("stage", STAGES),
    ]);
    expect((await openChoice(container, "stage")).selected).toEqual([]);
  });

  it("starts with the node's current value selected, shown by its label", async () => {
    const node = nodeHolding([heldAttribute("stage", "review")]);
    const container = await renderForm(node, [closedKey("stage", STAGES)]);
    expect((await openChoice(container, "stage")).selected).toEqual([
      "Em revisão",
    ]);
  });

  it("lets the owner return a held closed value to nothing selected", async () => {
    const node = nodeHolding([heldAttribute("stage", "review")]);
    const container = await renderForm(node, [closedKey("stage", STAGES)]);
    await clearChoice(container, "stage");
    expect((await openChoice(container, "stage")).selected).toEqual([]);
  });
});

describe("entity form multi-valued closed keys", () => {
  const catalog = [closedKey("stage", STAGES, { allowsMultiple: true })];

  it("makes every entry of the key a choice holding its own value, with no text field", async () => {
    const node = nodeHolding([
      heldAttribute("stage", "draft"),
      heldAttribute("stage", "done"),
    ]);
    const container = await renderForm(node, catalog);
    expect({
      choices: shownLabelsIn(container, "stage"),
      textInputs: inputsOf(container, "stage").length,
    }).toEqual({ choices: ["Rascunho", "Concluído"], textInputs: 0 });
  });

  it("adds an entry that is an empty choice offering the allowed values", async () => {
    const node = nodeHolding([heldAttribute("stage", "draft")]);
    const container = await renderForm(node, catalog);
    await addValue(container, "stage");
    expect(await openChoice(container, "stage", 1)).toEqual({
      offered: STAGE_LABELS,
      selected: [],
    });
  });

  it("removes the entry the owner removes and leaves the others holding their values", async () => {
    const node = nodeHolding([
      heldAttribute("stage", "draft"),
      heldAttribute("stage", "review"),
      heldAttribute("stage", "done"),
    ]);
    const container = await renderForm(node, catalog);
    await removeChoiceShowing(container, "stage", "Em revisão");
    expect(shownLabelsIn(container, "stage")).toEqual(["Rascunho", "Concluído"]);
  });
});

describe("entity form control by kind of key", () => {
  it("renders a text input for a key without allowed values and a choice for a key with them", async () => {
    const node = nodeHolding([
      heldAttribute("note", "Free text"),
      heldAttribute("stage", "draft"),
    ]);
    const container = await renderForm(node, [
      catalogKey("note"),
      closedKey("stage", STAGES),
    ]);
    expect({
      note: {
        textInputs: inputsOf(container, "note").length,
        choices: choicesOf(container, "note").length,
      },
      stage: {
        textInputs: inputsOf(container, "stage").length,
        choices: choicesOf(container, "stage").length,
      },
    }).toEqual({
      note: { textInputs: 1, choices: 0 },
      stage: { textInputs: 0, choices: 1 },
    });
  });
});
