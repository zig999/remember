// BR-14 structural validation helpers.

import { describe, expect, it } from "vitest";

import { ValidationFailure } from "../../../modules/ingestion/validation/errors.js";
import {
  assertFound,
  assertKnownType,
  parseAttributeValue,
} from "../../../modules/ingestion/validation/structural.js";

describe("parseAttributeValue (BR-14)", () => {
  it("accepts a valid YYYY-MM-DD date", () => {
    expect(() =>
      parseAttributeValue({ value: "2026-06-12", value_type: "date" })
    ).not.toThrow();
  });

  it("rejects a free-form date like 'tomorrow'", () => {
    let caught: unknown = null;
    try {
      parseAttributeValue({ value: "tomorrow", value_type: "date" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("STRUCTURAL_INVALID");
  });

  it("rejects a 'date' value with extra trailing chars", () => {
    let caught: unknown = null;
    try {
      parseAttributeValue({ value: "2026-06-12 ", value_type: "date" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
  });

  it("accepts integer and decimal number strings", () => {
    expect(() =>
      parseAttributeValue({ value: "42", value_type: "number" })
    ).not.toThrow();
    expect(() =>
      parseAttributeValue({ value: "-3.14", value_type: "number" })
    ).not.toThrow();
  });

  it("rejects 'NaN' / non-numeric for value_type='number'", () => {
    let caught: unknown = null;
    try {
      parseAttributeValue({ value: "NaN", value_type: "number" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
  });

  it("accepts only 'true' / 'false' for bool", () => {
    expect(() =>
      parseAttributeValue({ value: "true", value_type: "bool" })
    ).not.toThrow();
    expect(() =>
      parseAttributeValue({ value: "false", value_type: "bool" })
    ).not.toThrow();
    expect(() =>
      parseAttributeValue({ value: "1", value_type: "bool" })
    ).toThrow();
  });

  it("accepts any non-empty text for value_type='text'", () => {
    expect(() =>
      parseAttributeValue({ value: "qualquer string", value_type: "text" })
    ).not.toThrow();
  });
});

describe("assertFound", () => {
  it("throws NOT_FOUND when entity is missing", () => {
    let caught: unknown = null;
    try {
      assertFound({ entity: "raw_chunk", id: "abc", found: false });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("NOT_FOUND");
  });

  it("is a no-op when entity is found", () => {
    expect(() =>
      assertFound({ entity: "raw_chunk", id: "abc", found: true })
    ).not.toThrow();
  });
});

describe("assertKnownType", () => {
  it("throws UNKNOWN_TYPE on miss", () => {
    let caught: unknown = null;
    try {
      assertKnownType({ kind: "link_type", name: "bogus", found: false });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("UNKNOWN_TYPE");
  });
});
