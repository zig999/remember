import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import { acceptedFlagOf, inputOf, typeInto } from "./entity-form-value-type-support";
import {
  OFFERED_BOTH,
  OFFERED_NEITHER,
  dateInputsIn,
  endInputOf,
  fixClockAt,
  offeredValidityIn,
  releaseClock,
  setDate,
  startInputOf,
  temporalKey,
  todayNoteOf,
} from "./entity-form-validity-support";

const NODE = nodeHolding([
  heldAttribute("title", "Alpha"),
  heldAttribute("role", "Open"),
]);

const CATALOG = [catalogKey("title"), temporalKey("role")];

afterEach(() => {
  releaseClock();
  unmountForms();
});

describe("entity form validity of a changed field", () => {
  it("offers a validity start and a validity end for a changed field of a temporal key and accepts the end left empty", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    const end = endInputOf(container, "role");
    expect({
      ...offeredValidityIn(container, "role"),
      endRequired: end?.required,
      endInvalid: end?.getAttribute("aria-invalid") ?? null,
      accepted: acceptedFlagOf(container),
    }).toEqual({
      ...OFFERED_BOTH,
      endRequired: false,
      endInvalid: null,
      accepted: "true",
    });
  });

  it("offers no validity start and no validity end for a changed field of a key that is not temporal", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "title", "Alpha", "Beta");
    expect({
      ...offeredValidityIn(container, "title"),
      dateInputs: dateInputsIn(container, "title").length,
      typed: inputOf(container, "title").value,
    }).toEqual({ ...OFFERED_NEITHER, dateInputs: 0, typed: "Beta" });
  });

  it("offers no validity for an unchanged field of a temporal key while another field of the form is changed", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "title", "Alpha", "Beta");
    expect({
      role: offeredValidityIn(container, "role"),
      roleValue: inputOf(container, "role").value,
    }).toEqual({ role: OFFERED_NEITHER, roleValue: "Open" });
  });

  it("withdraws the validity of a temporal field when its value goes back to the value it started with", async () => {
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    const whileChanged = offeredValidityIn(container, "role");
    await typeInto(container, "role", "Closed", "Open");
    expect({
      whileChanged,
      afterReverting: offeredValidityIn(container, "role"),
    }).toEqual({ whileChanged: OFFERED_BOTH, afterReverting: OFFERED_NEITHER });
  });
});

describe("entity form unstated validity start", () => {
  it("shows a validity start the owner has not stated as the calendar date of today", async () => {
    fixClockAt(new Date(2026, 5, 15, 12, 0));
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    expect(todayNoteOf(container, "role")?.textContent).toContain("2026-06-15");
  });

  it("keeps the validity start empty in the form while it shows as today, even after the owner states an end", async () => {
    fixClockAt(new Date(2026, 5, 15, 12, 0));
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    await setDate(endInputOf(container, "role"), "2026-12-31");
    expect(startInputOf(container, "role")?.value).toBe("");
  });

  it("stops showing today once the owner states a validity start and keeps the start the owner typed", async () => {
    fixClockAt(new Date(2026, 5, 15, 12, 0));
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    await setDate(startInputOf(container, "role"), "2026-03-01");
    expect({
      noteShown: todayNoteOf(container, "role") !== null,
      start: startInputOf(container, "role")?.value,
    }).toEqual({ noteShown: false, start: "2026-03-01" });
  });
});
