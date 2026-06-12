// BR-16 temporal validation tests.
//
// Validates the layer in isolation (no DB / no other layer). Verifies:
//   - `valid_from >= valid_to` -> TEMPORAL_INCOHERENT.
//   - `change_hint = 'correction'` without errata signal -> TEMPORAL_INCOHERENT.
//   - `requires_valid_from = true` with no date sources -> DATE_UNJUSTIFIED.
//   - `valid_from` supplied without `valid_from_basis` -> DATE_UNJUSTIFIED.
//
// Also covers the success paths so regressions show up immediately.

import { describe, expect, it } from "vitest";

import { ValidationFailure } from "../../../modules/ingestion/validation/errors.js";
import { validateTemporal } from "../../../modules/ingestion/validation/temporal.js";

describe("validateTemporal (BR-16)", () => {
  it("accepts an empty period when not required", () => {
    expect(() =>
      validateTemporal({
        valid_from: null,
        valid_to: null,
        valid_from_basis: null,
        requires_valid_from: false,
        change_hint: "none",
        fragment_texts: [],
        document_date: null,
      })
    ).not.toThrow();
  });

  it("rejects valid_from >= valid_to with TEMPORAL_INCOHERENT", () => {
    let caught: unknown = null;
    try {
      validateTemporal({
        valid_from: "2026-06-12",
        valid_to: "2026-06-12",
        valid_from_basis: "stated",
        requires_valid_from: true,
        change_hint: "none",
        fragment_texts: ["go-live confirmado para 2026-06-12"],
        document_date: "2026-06-12",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("TEMPORAL_INCOHERENT");
  });

  it("requires errata signal when change_hint = 'correction'", () => {
    let caught: unknown = null;
    try {
      validateTemporal({
        valid_from: "2026-01-01",
        valid_to: null,
        valid_from_basis: "stated",
        requires_valid_from: true,
        change_hint: "correction",
        fragment_texts: ["O CNPJ é 00.000.000/0001-91"],
        document_date: null,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("TEMPORAL_INCOHERENT");
  });

  it("accepts change_hint='correction' when fragment text contains 'errata'", () => {
    expect(() =>
      validateTemporal({
        valid_from: "2026-01-01",
        valid_to: null,
        valid_from_basis: "stated",
        requires_valid_from: true,
        change_hint: "correction",
        fragment_texts: [
          "errata: a data correta de início é 2026-01-01 (typo na ata anterior)",
        ],
        document_date: null,
      })
    ).not.toThrow();
  });

  it("rejects DATE_UNJUSTIFIED when valid_from supplied without basis", () => {
    let caught: unknown = null;
    try {
      validateTemporal({
        valid_from: "2026-01-01",
        valid_to: null,
        valid_from_basis: null,
        requires_valid_from: true,
        change_hint: "none",
        fragment_texts: ["x"],
        document_date: null,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("DATE_UNJUSTIFIED");
  });

  it("rejects DATE_UNJUSTIFIED when requires_valid_from but no date sources", () => {
    let caught: unknown = null;
    try {
      validateTemporal({
        valid_from: null,
        valid_to: null,
        valid_from_basis: null,
        requires_valid_from: true,
        change_hint: "none",
        fragment_texts: ["sem data"],
        document_date: null,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("DATE_UNJUSTIFIED");
  });

  it("accepts requires_valid_from = true when document_date is available", () => {
    expect(() =>
      validateTemporal({
        valid_from: null,
        valid_to: null,
        valid_from_basis: null,
        requires_valid_from: true,
        change_hint: "none",
        fragment_texts: ["x"],
        document_date: "2026-01-01",
      })
    ).not.toThrow();
  });
});
