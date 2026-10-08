import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import { multiKey } from "./entity-form-multi-support";
import { typeInto } from "./entity-form-value-type-support";
import {
  fixClockAt,
  releaseClock,
  setDate,
  startInputOf,
  endInputOf,
  temporalKey,
} from "./entity-form-validity-support";
import { reviewedFieldsIn } from "./entity-form-review-support";

afterEach(() => {
  releaseClock();
  unmountForms();
});

const NODE = nodeHolding([
  heldAttribute("title", "Alpha"),
  heldAttribute("role", "Open"),
  heldAttribute("note", "Keep"),
  heldAttribute("tag", "Alpha"),
  heldAttribute("tag", "Beta"),
]);

const CATALOG = [
  catalogKey("title"),
  temporalKey("role"),
  catalogKey("note"),
  multiKey("tag"),
];

describe("entity form review listing of changed fields", () => {
  it("lists each changed field once with the value it started with beside the value it now holds", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "title", "Alpha", "Beta");
    await typeInto(container, "title", "Beta", "Gamma");
    await typeInto(container, "tag", "Alpha", "Alpha-edited");
    await typeInto(container, "tag", "Beta", "Beta-edited");
    const listed = await reviewedFieldsIn(container);
    expect(listed.map(({ key, previous, next }) => ({ key, previous, next }))).toEqual([
      { key: "tag", previous: "Alpha", next: "Alpha-edited" },
      { key: "tag", previous: "Beta", next: "Beta-edited" },
      { key: "title", previous: "Alpha", next: "Gamma" },
    ]);
  });

  it("does not list a field that holds the value it started with, whether the owner never touched it or returned it to that value", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "title", "Alpha", "Beta");
    await typeInto(container, "role", "Open", "Closed");
    await typeInto(container, "role", "Closed", "Open");
    const listed = await reviewedFieldsIn(container);
    expect(listed.map(({ key }) => key)).toEqual(["title"]);
  });

  it("does not list a field of a temporal key whose value is the value it started with while the validity it holds differs from the validity it started with", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "title", "Alpha", "Beta");
    await typeInto(container, "role", "Open", "Closed");
    await setDate(startInputOf(container, "role"), "2026-03-01");
    await setDate(endInputOf(container, "role"), "2026-12-31");
    await typeInto(container, "role", "Closed", "Open");
    const listed = await reviewedFieldsIn(container);
    expect(listed.map(({ key }) => key)).toEqual(["title"]);
  });
});

describe("entity form review validity of a listed field of a temporal key", () => {
  it("shows the validity start the field holds", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    await setDate(startInputOf(container, "role"), "2026-03-01");
    const listed = await reviewedFieldsIn(container);
    expect(listed.find(({ key }) => key === "role")?.start ?? "").toContain(
      "2026-03-01",
    );
  });

  it("shows the validity end the field holds", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    await setDate(endInputOf(container, "role"), "2026-12-31");
    const listed = await reviewedFieldsIn(container);
    expect(listed.find(({ key }) => key === "role")?.end ?? "").toContain(
      "2026-12-31",
    );
  });

  it("shows a validity start the owner has not stated as the calendar date of today", async () => {
    fixClockAt(new Date(2026, 5, 15, 12, 0));
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    const listed = await reviewedFieldsIn(container);
    expect(listed.find(({ key }) => key === "role")?.start ?? "").toContain(
      "2026-06-15",
    );
  });
});
