// BR-14 structural validation helpers.

import { describe, expect, it } from "vitest";

import { ValidationFailure } from "../../../modules/ingestion/validation/errors.js";
import {
  assertFound,
  assertKnownType,
  assertValueInDomain,
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
    expect((caught as ValidationFailure).code).toBe("VALIDATION_INVALID_FORMAT");
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
  it("throws RESOURCE_NOT_FOUND when entity is missing", () => {
    let caught: unknown = null;
    try {
      assertFound({ entity: "raw_chunk", id: "abc", found: false });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("RESOURCE_NOT_FOUND");
  });

  it("is a no-op when entity is found", () => {
    expect(() =>
      assertFound({ entity: "raw_chunk", id: "abc", found: true })
    ).not.toThrow();
  });
});

describe("assertKnownType", () => {
  it("throws BUSINESS_UNKNOWN_LINK_TYPE on miss for kind='link_type'", () => {
    let caught: unknown = null;
    try {
      assertKnownType({ kind: "link_type", name: "bogus", found: false });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_UNKNOWN_LINK_TYPE");
  });

  it("throws BUSINESS_UNKNOWN_NODE_TYPE on miss for kind='node_type'", () => {
    let caught: unknown = null;
    try {
      assertKnownType({ kind: "node_type", name: "Bogus", found: false });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_UNKNOWN_NODE_TYPE");
  });

  it("throws BUSINESS_UNKNOWN_ATTRIBUTE_KEY on miss for kind='attribute_key'", () => {
    let caught: unknown = null;
    try {
      assertKnownType({ kind: "attribute_key", name: "bogus", found: false });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe(
      "BUSINESS_UNKNOWN_ATTRIBUTE_KEY"
    );
  });
});

describe("assertValueInDomain (BR-30)", () => {
  it("is silent when value IS in the closed domain (exact match)", () => {
    const domain = new Set(["proposta", "ata", "contrato", "relatório", "outro"]);
    expect(() => assertValueInDomain("proposta", domain)).not.toThrow();
    expect(() => assertValueInDomain("relatório", domain)).not.toThrow();
  });

  it("throws VALIDATION_INVALID_FORMAT with {value, allowed_values} on miss", () => {
    const domain = new Set(["proposta", "ata", "contrato"]);
    let caught: unknown = null;
    try {
      assertValueInDomain("PROPOSAL", domain);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    const vf = caught as ValidationFailure;
    expect(vf.code).toBe("VALIDATION_INVALID_FORMAT");
    expect(vf.message).toBe("attribute value not in closed domain");
    expect(vf.details.value).toBe("PROPOSAL");
    // allowed_values is deterministic-ordered (lexicographic).
    expect(vf.details.allowed_values).toEqual(["ata", "contrato", "proposta"]);
  });

  it("treats case differences as a miss (exact-match, no normalisation)", () => {
    const domain = new Set(["proposta"]);
    let caught: unknown = null;
    try {
      assertValueInDomain("Proposta", domain);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("VALIDATION_INVALID_FORMAT");
  });

  it("treats accent differences as a miss (exact-match, no normalisation)", () => {
    const domain = new Set(["relatório"]);
    let caught: unknown = null;
    try {
      assertValueInDomain("relatorio", domain);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("VALIDATION_INVALID_FORMAT");
  });

  it("sorts allowed_values lexicographically for diagnostic stability", () => {
    // Insertion order: zeta, alpha, mu. Expected sorted: alpha, mu, zeta.
    const domain = new Set(["zeta", "alpha", "mu"]);
    let caught: unknown = null;
    try {
      assertValueInDomain("nope", domain);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).details.allowed_values).toEqual([
      "alpha",
      "mu",
      "zeta",
    ]);
  });
});
