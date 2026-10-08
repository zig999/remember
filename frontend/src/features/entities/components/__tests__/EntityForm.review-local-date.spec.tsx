import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import { typeInto } from "./entity-form-value-type-support";
import {
  fixClockAt,
  releaseClock,
  temporalKey,
} from "./entity-form-validity-support";
import { reviewedFieldsIn } from "./entity-form-review-support";

const OWNERS_ZONE = "America/Sao_Paulo";

const NODE = nodeHolding([
  heldAttribute("title", "Alpha"),
  heldAttribute("role", "Open"),
]);

const CATALOG = [catalogKey("title"), temporalKey("role")];

let zoneBefore: string | undefined;

beforeAll(() => {
  zoneBefore = process.env.TZ;
  process.env.TZ = OWNERS_ZONE;
});

afterAll(() => {
  if (zoneBefore === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = zoneBefore;
  }
});

afterEach(() => {
  releaseClock();
  unmountForms();
});

describe("entity form review of an unstated validity start in the owner's local date", () => {
  it("shows today in the review as the date in the owner's time zone at an hour when UTC is already on the next day", async () => {
    const eveningLocal = new Date(2026, 0, 31, 23, 30);
    expect(eveningLocal.toISOString().slice(0, 10)).toBe("2026-02-01");
    fixClockAt(eveningLocal);
    const container = await renderForm(NODE, CATALOG);
    await typeInto(container, "role", "Open", "Closed");
    const listed = await reviewedFieldsIn(container);
    const shown = listed.find(({ key }) => key === "role")?.start ?? "";
    expect({
      showsLocalDate: shown.includes("2026-01-31"),
      showsUtcDate: shown.includes("2026-02-01"),
    }).toEqual({ showsLocalDate: true, showsUtcDate: false });
  });
});
