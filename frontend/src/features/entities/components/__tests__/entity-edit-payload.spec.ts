import { afterEach, describe, expect, it } from "vitest";
import {
  REASON,
  UNCHANGED,
  appended,
  bodyOf,
  dropped,
  expectedBody,
  inSequence,
  patched,
  removeOf,
  sentInAnyOrder,
  setOf,
  type FieldEdit,
} from "./entity-edit-payload-support";
import { fixClockAt, releaseClock } from "./entity-form-validity-support";
import type { AttributeChangeWire } from "../../types";

interface ChangeCase {
  readonly label: string;
  readonly edit: FieldEdit;
  readonly expected: readonly AttributeChangeWire[];
}

interface ReasonCase {
  readonly label: string;
  readonly typed: string;
  readonly sent: string;
}

const TITLE_TO_BETA = patched("title", "Alpha", { value: "Beta" });

const SET_CASES: readonly ChangeCase[] = [
  {
    label: "a field of a key that is not temporal",
    edit: TITLE_TO_BETA,
    expected: [setOf("title", "Beta", "at-title")],
  },
  {
    label: "a field of a temporal key that states a validity start and end",
    edit: patched("role", "Open", {
      value: "Closed",
      validFrom: "2026-06-14",
      validTo: "2026-12-31",
    }),
    expected: [setOf("role", "Closed", "at-role", "2026-06-14", "2026-12-31")],
  },
];

const NO_ATTRIBUTE_CASES: readonly ChangeCase[] = [
  {
    label: "a first value of a key the node holds nothing for",
    edit: patched("owner", "", { value: "Ana" }),
    expected: [setOf("owner", "Ana", null)],
  },
  {
    label: "a value added to a multi-valued key that holds other values",
    edit: appended("tag", "Yellow"),
    expected: [setOf("tag", "Yellow", null)],
  },
];

const REMOVE_CASES: readonly ChangeCase[] = [
  {
    label: "a field of a key that is not temporal emptied",
    edit: patched("title", "Alpha", { value: "" }),
    expected: [removeOf("title", "at-title")],
  },
  {
    label: "a field of a temporal key emptied while it holds a validity",
    edit: patched("role", "Open", {
      value: "",
      validFrom: "2026-01-01",
      validTo: "2026-12-31",
    }),
    expected: [removeOf("role", "at-role")],
  },
  {
    label: "a field of a multi-valued key emptied",
    edit: patched("tag", "Red", { value: "" }),
    expected: [removeOf("tag", "at-tag-red")],
  },
  {
    label: "a field of a multi-valued key removed from the form",
    edit: dropped("tag", "Blue"),
    expected: [removeOf("tag", "at-tag-blue")],
  },
];

const REASON_CASES: readonly ReasonCase[] = [
  {
    label: "spaces around it, with inner spaces kept",
    typed: "  Corrigido  após a auditoria  ",
    sent: "Corrigido  após a auditoria",
  },
  {
    label: "a tab and line breaks around it",
    typed: "\n\tCorrigido após a auditoria \r\n",
    sent: "Corrigido após a auditoria",
  },
];

const FIXED_TODAY = new Date(2026, 5, 15, 12, 0);

const DATE_TEXT = /\d{4}-\d{2}-\d{2}/g;

afterEach(() => {
  releaseClock();
});

describe("the body of the edit built from the reviewed form", () => {
  it.each(SET_CASES)(
    "sends a set change carrying the value, the validity the field states and the attribute it started from for $label",
    ({ edit, expected }) => {
      expect(sentInAnyOrder(bodyOf(edit))).toEqual(
        expectedBody(REASON, expected),
      );
    },
  );

  it.each(NO_ATTRIBUTE_CASES)(
    "sends a set change that names no attribute for $label",
    ({ edit, expected }) => {
      expect(sentInAnyOrder(bodyOf(edit))).toEqual(
        expectedBody(REASON, expected),
      );
    },
  );

  it.each(REMOVE_CASES)(
    "sends one remove change naming the attribute it started from, with null value and validity, for $label",
    ({ edit, expected }) => {
      expect(sentInAnyOrder(bodyOf(edit))).toEqual(
        expectedBody(REASON, expected),
      );
    },
  );

  it("sends no change for fields the owner left as they started", () => {
    expect(sentInAnyOrder(bodyOf(UNCHANGED))).toEqual(expectedBody(REASON, []));
  });

  it.each(REASON_CASES)(
    "sends the reason trimmed when the owner typed $label",
    ({ typed, sent }) => {
      expect(bodyOf(TITLE_TO_BETA, typed).reason).toBe(sent);
    },
  );

  it.each([
    { label: "no end either", end: "" },
    { label: "an end stated", end: "2026-12-31" },
  ])(
    "sends a null validity start, and no date of today, when the owner states none and $label",
    ({ end }) => {
      fixClockAt(FIXED_TODAY);
      const body = bodyOf(
        patched("deadline", "Q1", { value: "Q2", validTo: end }),
      );
      expect({
        changes: body.changes.map(({ valid_from, valid_to }) => ({
          valid_from,
          valid_to,
        })),
        dates: JSON.stringify(body).match(DATE_TEXT) ?? [],
      }).toEqual({
        changes: [{ valid_from: null, valid_to: end === "" ? null : end }],
        dates: end === "" ? [] : [end],
      });
    },
  );

  it("sends one change for each changed field, a set change for a held or new value and a remove change for an emptied or removed one, and none for the fields left as they started", () => {
    const body = bodyOf(
      inSequence(
        TITLE_TO_BETA,
        patched("role", "Open", {
          value: "Closed",
          validFrom: "2026-06-14",
          validTo: "2026-12-31",
        }),
        patched("owner", "", { value: "Ana" }),
        dropped("tag", "Blue"),
        patched("tag", "Green", { value: "" }),
      ),
    );
    expect(sentInAnyOrder(body)).toEqual(
      expectedBody(REASON, [
        setOf("title", "Beta", "at-title"),
        setOf("role", "Closed", "at-role", "2026-06-14", "2026-12-31"),
        setOf("owner", "Ana", null),
        removeOf("tag", "at-tag-blue"),
        removeOf("tag", "at-tag-green"),
      ]),
    );
  });

  it("writes JSON null in every member that holds nothing and in the value and validity of a remove change", () => {
    const body = bodyOf(
      inSequence(
        patched("deadline", "Q1", { value: "Q2", validTo: "2026-12-31" }),
        patched("owner", "", { value: "Ana" }),
        patched("role", "Open", {
          value: "",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
        }),
        dropped("tag", "Blue"),
      ),
    );
    expect(sentInAnyOrder(body)).toEqual(
      expectedBody(REASON, [
        setOf("deadline", "Q2", "at-deadline", null, "2026-12-31"),
        setOf("owner", "Ana", null, null, null),
        removeOf("role", "at-role"),
        removeOf("tag", "at-tag-blue"),
      ]),
    );
  });

  it("sends no change for a field whose value equals the one it started with, whatever validity it holds", () => {
    const body = bodyOf(
      inSequence(
        patched("role", "Open", {
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
        }),
        patched("deadline", "Q1", { validTo: "2026-06-30" }),
      ),
    );
    expect(sentInAnyOrder(body)).toEqual(expectedBody(REASON, []));
  });

  it("sends no change for fields added to a multi-valued key that repeat an active value and an uncertain value the node holds", () => {
    const body = bodyOf(
      inSequence(appended("tag", "Red"), appended("tag", "Green")),
    );
    expect(sentInAnyOrder(body)).toEqual(expectedBody(REASON, []));
  });

  it("sends a set change for a field added to a multi-valued key that repeats only a superseded value", () => {
    expect(sentInAnyOrder(bodyOf(appended("tag", "Violet")))).toEqual(
      expectedBody(REASON, [setOf("tag", "Violet", null)]),
    );
  });
});
