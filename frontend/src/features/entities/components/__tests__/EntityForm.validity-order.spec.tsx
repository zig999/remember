import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import {
  fixClockAt,
  releaseClock,
  setDate,
  startInputOf,
  temporalKey,
} from "./entity-form-validity-support";
import { saveOfferedIn } from "./entity-form-reason-support";
import {
  ORDER_MESSAGE,
  changeRoleWithValidity,
  endDescribedByMessage,
  offerSaveWithReason,
  orderAlertOf,
} from "./entity-form-order-support";

const NODE = nodeHolding([
  heldAttribute("title", "Alpha"),
  heldAttribute("role", "Open"),
]);

const CATALOG = [catalogKey("title"), temporalKey("role")];

interface OrderCase {
  readonly label: string;
  readonly start: string;
  readonly end: string;
}

const NOT_STRICTLY_EARLIER: readonly OrderCase[] = [
  { label: "one day later than", start: "2026-06-16", end: "2026-06-15" },
  { label: "equal to", start: "2026-06-15", end: "2026-06-15" },
];

afterEach(() => {
  releaseClock();
  unmountForms();
});

describe("entity form validity start precedes the end", () => {
  it.each(NOT_STRICTLY_EARLIER)(
    "puts the fixed message on the validity end field when the start is $label the end",
    async ({ start, end }) => {
      const container = await renderForm(NODE, CATALOG);
      await changeRoleWithValidity(container, start, end);
      expect({
        alert: orderAlertOf(container, "role"),
        describesEnd: endDescribedByMessage(container, "role", ORDER_MESSAGE),
      }).toEqual({ alert: ORDER_MESSAGE, describesEnd: true });
    },
  );

  it("raises no message when the start is one day earlier than the end", async () => {
    const container = await renderForm(NODE, CATALOG);
    await changeRoleWithValidity(container, "2026-06-14", "2026-06-15");
    expect({
      alert: orderAlertOf(container, "role"),
      describesEnd: endDescribedByMessage(container, "role", ORDER_MESSAGE),
    }).toEqual({ alert: null, describesEnd: false });
  });

  it.each<{ readonly label: string; readonly start: string }>([
    { label: "a stated start", start: "2026-06-20" },
    { label: "no start", start: "" },
  ])("raises no message when no end is stated and there is $label", async ({ start }) => {
    const container = await renderForm(NODE, CATALOG);
    await changeRoleWithValidity(container, start, "");
    expect({
      alert: orderAlertOf(container, "role"),
      describesEnd: endDescribedByMessage(container, "role", ORDER_MESSAGE),
    }).toEqual({ alert: null, describesEnd: false });
  });

  it("raises no message for an end earlier than today when the start is left unstated", async () => {
    fixClockAt(new Date(2026, 5, 15, 12, 0));
    const container = await renderForm(NODE, CATALOG);
    await changeRoleWithValidity(container, "", "2026-06-10");
    expect({
      alert: orderAlertOf(container, "role"),
      describesEnd: endDescribedByMessage(container, "role", ORDER_MESSAGE),
    }).toEqual({ alert: null, describesEnd: false });
  });

  it("offers the save with a valid reason for an end earlier than today when the start is left unstated", async () => {
    fixClockAt(new Date(2026, 5, 15, 12, 0));
    const container = await renderForm(NODE, CATALOG);
    await changeRoleWithValidity(container, "", "2026-06-10");
    await offerSaveWithReason(container);
    expect(saveOfferedIn(container)).toBe(true);
  });

  it("offers the save with a valid reason when the start is strictly earlier than the end", async () => {
    const container = await renderForm(NODE, CATALOG);
    await changeRoleWithValidity(container, "2026-06-14", "2026-06-15");
    await offerSaveWithReason(container);
    expect(saveOfferedIn(container)).toBe(true);
  });

  it.each(NOT_STRICTLY_EARLIER)(
    "withholds the save despite a valid reason once the start becomes $label the end",
    async ({ start }) => {
      const container = await renderForm(NODE, CATALOG);
      await changeRoleWithValidity(container, "2026-06-10", "2026-06-15");
      await offerSaveWithReason(container);
      const whileOrdered = saveOfferedIn(container);
      await setDate(startInputOf(container, "role"), start);
      expect({
        whileOrdered,
        whileViolated: saveOfferedIn(container),
      }).toEqual({ whileOrdered: true, whileViolated: false });
    },
  );

  it("offers the save again once a violated order is corrected", async () => {
    const container = await renderForm(NODE, CATALOG);
    await changeRoleWithValidity(container, "2026-06-20", "2026-06-15");
    await offerSaveWithReason(container);
    const whileViolated = saveOfferedIn(container);
    await setDate(startInputOf(container, "role"), "2026-06-10");
    await offerSaveWithReason(container);
    expect({
      whileViolated,
      afterCorrection: saveOfferedIn(container),
    }).toEqual({ whileViolated: false, afterCorrection: true });
  });
});
