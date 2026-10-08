import { describe, expect, it } from "vitest";
import { valueTypeMessage } from "../entity-value-types";
import {
  BOOL_WORDING,
  DATE_WORDING,
  NUMBER_WORDING,
} from "./value-type-wording";

const LARGEST_FINITE_POWER = `1${"0".repeat(308)}`;
const FIRST_INFINITE_POWER = `1${"0".repeat(309)}`;

const DATES_OFF_THE_PATTERN = [
  "2026-2-3",
  "2026-02-3",
  "2026-2-03",
  "20260203",
  "26-02-03",
  "12026-02-03",
  "2026-02-033",
  "2026/02/03",
  "2026.02.03",
  "03-02-2026",
  "2026-02-03 ",
  " 2026-02-03",
  "2026-02-03\n",
  "2026-02-03T10:00",
  "abcd-ef-gh",
  "today",
];

const DATES_NAMING_NO_DAY = [
  "2026-02-30",
  "2026-02-31",
  "2025-02-29",
  "1900-02-29",
  "2100-02-29",
  "2026-00-10",
  "2026-13-10",
  "2026-99-10",
  "2026-01-00",
  "2026-01-32",
  "2026-04-31",
  "2026-06-31",
  "2026-09-31",
  "2026-11-31",
];

const DATES_NAMING_AN_EXISTING_DAY = [
  "2024-02-29",
  "2000-02-29",
  "2400-02-29",
  "2026-02-28",
  "2025-02-28",
  "1900-02-28",
  "2026-01-01",
  "2026-01-31",
  "2026-03-31",
  "2026-05-31",
  "2026-07-31",
  "2026-08-31",
  "2026-10-31",
  "2026-12-31",
  "2026-04-30",
  "2026-06-30",
  "2026-09-30",
  "2026-11-30",
  "9999-12-31",
];

const NUMBERS_OFF_THE_PATTERN = [
  "1,5",
  "1e5",
  "1E5",
  "+1",
  ".5",
  "5.",
  "5.5.5",
  "--5",
  "- 5",
  "5-",
  " 5",
  "5 ",
  "5\n",
  "0x10",
  "Infinity",
  "NaN",
  "-",
  "-.5",
  "1_000",
  "1 000",
  "abc",
];

const NUMBERS_NOT_FINITE: [string, string][] = [
  ["a 400-digit integer", "9".repeat(400)],
  ["a negative 400-digit integer", `-${"9".repeat(400)}`],
  ["a 400-digit integer with a decimal part", `${"9".repeat(400)}.5`],
  ["a 1 followed by 309 zeros", FIRST_INFINITE_POWER],
];

const NUMBERS_FINITE: [string, string][] = [
  ["0", "0"],
  ["-0", "-0"],
  ["-12", "-12"],
  ["12.5", "12.5"],
  ["0.0", "0.0"],
  ["007", "007"],
  ["-0.5", "-0.5"],
  ["a 30-digit integer", "123456789012345678901234567890"],
  ["a 34-digit decimal", "3.141592653589793238462643383279"],
  ["a 1 followed by 308 zeros", LARGEST_FINITE_POWER],
  ["a negative 1 followed by 308 zeros", `-${LARGEST_FINITE_POWER}`],
];

const BOOLS_NOT_EXACT = [
  "True",
  "TRUE",
  "False",
  "FALSE",
  " true",
  "true ",
  "false\n",
  "1",
  "0",
  "yes",
  "no",
  "t",
  "truefalse",
  '"true"',
];

const ANY_TEXT = [
  "2026-02-30",
  "abc",
  " ",
  "true",
  "1,5",
  "1e5",
  "<b>x</b>",
  "two\nlines",
];

describe("value-type grammar of a date", () => {
  it.each(DATES_OFF_THE_PATTERN)(
    "refuses %j, which does not match the date pattern",
    (value) => {
      expect(valueTypeMessage("date", value)).not.toBeNull();
    },
  );

  it.each(DATES_NAMING_NO_DAY)(
    "refuses %j, which matches the date pattern but names no existing day",
    (value) => {
      expect(valueTypeMessage("date", value)).not.toBeNull();
    },
  );

  it.each(DATES_NAMING_AN_EXISTING_DAY)(
    "does not refuse %j, which matches the date pattern and names an existing day",
    (value) => {
      expect(valueTypeMessage("date", value)).toBeNull();
    },
  );
});

describe("value-type grammar of a number", () => {
  it.each(NUMBERS_OFF_THE_PATTERN)(
    "refuses %j, which does not match the number pattern",
    (value) => {
      expect(valueTypeMessage("number", value)).not.toBeNull();
    },
  );

  it.each(NUMBERS_NOT_FINITE)(
    "refuses %s, which matches the number pattern but is not finite",
    (_description, value) => {
      expect(valueTypeMessage("number", value)).not.toBeNull();
    },
  );

  it.each(NUMBERS_FINITE)(
    "does not refuse %s, which matches the number pattern and reads as a finite number",
    (_description, value) => {
      expect(valueTypeMessage("number", value)).toBeNull();
    },
  );
});

describe("value-type grammar of a bool", () => {
  it.each(BOOLS_NOT_EXACT)(
    "refuses %j, which is not exactly true or exactly false",
    (value) => {
      expect(valueTypeMessage("bool", value)).not.toBeNull();
    },
  );

  it.each(["true", "false"])("does not refuse exactly %j", (value) => {
    expect(valueTypeMessage("bool", value)).toBeNull();
  });
});

describe("value-type grammar of a text", () => {
  it.each(ANY_TEXT)("does not refuse the text %j", (value) => {
    expect(valueTypeMessage("text", value)).toBeNull();
  });
});

describe("value-type grammar of an empty value", () => {
  it.each(["date", "number", "bool", "text"])(
    "does not refuse the empty value of a %s field",
    (valueType) => {
      expect(valueTypeMessage(valueType, "")).toBeNull();
    },
  );
});

describe("wording of a refused value", () => {
  it.each([
    ["date", "2026-2-3 off the pattern", "2026-2-3", DATE_WORDING],
    ["date", "2026-02-30 naming no day", "2026-02-30", DATE_WORDING],
    ["number", "1,5 off the pattern", "1,5", NUMBER_WORDING],
    ["number", "a 400-digit integer", "9".repeat(400), NUMBER_WORDING],
    ["bool", "True not exactly true", "True", BOOL_WORDING],
  ])(
    "writes the rule's own text for a %s value that does not read as its type (%s)",
    (valueType, _description, value, wording) => {
      expect(valueTypeMessage(valueType, value)).toBe(wording);
    },
  );
});
