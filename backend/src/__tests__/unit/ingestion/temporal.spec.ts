// BR-16 temporal validation tests.
//
// Validates the layer in isolation (no DB / no other layer). Verifies
// (P2.1 namespaced codes; deprecated shorthand — TEMPORAL_INCOHERENT,
// DATE_UNJUSTIFIED — retired by TC-04):
//   - `valid_from >= valid_to` -> BUSINESS_TEMPORAL_INCOHERENT.
//   - `change_hint = 'correction'` without errata signal -> BUSINESS_TEMPORAL_INCOHERENT.
//   - `requires_valid_from = true` with no date sources -> BUSINESS_DATE_UNJUSTIFIED.
//   - `valid_from` supplied without `valid_from_basis` -> BUSINESS_DATE_UNJUSTIFIED.
//   - `received_at` fallback (v7 §6.5 / §13c / A14, TC-FR-001): when
//     `requires_valid_from=true` AND `valid_from` is absent AND
//     `document_date` is absent BUT `received_at` IS available, the layer
//     resolves `valid_from := received_at` (date portion), `basis := 'received'`.
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
        received_at: null,
      })
    ).not.toThrow();
  });

  it("rejects valid_from >= valid_to with BUSINESS_TEMPORAL_INCOHERENT", () => {
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
        received_at: "2026-06-12T10:00:00.000Z",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_TEMPORAL_INCOHERENT");
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
        received_at: null,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_TEMPORAL_INCOHERENT");
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
        received_at: null,
      })
    ).not.toThrow();
  });

  it("rejects BUSINESS_DATE_UNJUSTIFIED when valid_from supplied without basis", () => {
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
        received_at: null,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_DATE_UNJUSTIFIED");
  });

  it("rejects BUSINESS_DATE_UNJUSTIFIED when requires_valid_from but ALL three chain links are absent", () => {
    // Only fires when stated (valid_from), document_date AND received_at are
    // ALL null — the full chain is empty (v7 §6.5 / A14).
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
        received_at: null,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_DATE_UNJUSTIFIED");
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
        received_at: null,
      })
    ).not.toThrow();
  });

  // -------------------------------------------------------------------
  // TC-FR-001 — received_at fallback (v7 §6.5 / §13c / A14)
  // -------------------------------------------------------------------

  it("AC-1: falls back to received_at when stated and document dates are absent", () => {
    // requires_valid_from=true, valid_from=null, document_date=null,
    // received_at IS available -> resolved {valid_from := received_at date,
    // valid_from_basis := 'received'}.
    const resolved = validateTemporal({
      valid_from: null,
      valid_to: null,
      valid_from_basis: null,
      requires_valid_from: true,
      change_hint: "none",
      fragment_texts: ["sem data explícita"],
      document_date: null,
      received_at: "2026-06-13T20:53:15.377Z",
    });
    expect(resolved.valid_from).toBe("2026-06-13");
    expect(resolved.valid_from_basis).toBe("received");
  });

  it("AC-1: received_at fallback extracts only the YYYY-MM-DD portion", () => {
    // The DTO requires `valid_from` to match /^\d{4}-\d{2}-\d{2}$/ — the
    // fallback must NOT propagate the time component.
    const resolved = validateTemporal({
      valid_from: null,
      valid_to: null,
      valid_from_basis: null,
      requires_valid_from: true,
      change_hint: "none",
      fragment_texts: [],
      document_date: null,
      received_at: "2026-01-15T08:30:00.123Z",
    });
    expect(resolved.valid_from).toBe("2026-01-15");
    expect(resolved.valid_from_basis).toBe("received");
  });

  it("AC-2: still rejects BUSINESS_DATE_UNJUSTIFIED when received_at is ALSO null", () => {
    // Original behaviour preserved when the entire chain is empty.
    let caught: unknown = null;
    try {
      validateTemporal({
        valid_from: null,
        valid_to: null,
        valid_from_basis: null,
        requires_valid_from: true,
        change_hint: "none",
        fragment_texts: [],
        document_date: null,
        received_at: null,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_DATE_UNJUSTIFIED");
  });

  it("AC-3: no behaviour change when valid_from IS present (stated)", () => {
    // When the caller supplied a stated valid_from + basis, the resolved
    // values mirror the input exactly — received_at is irrelevant.
    const resolved = validateTemporal({
      valid_from: "2025-12-31",
      valid_to: null,
      valid_from_basis: "stated",
      requires_valid_from: true,
      change_hint: "none",
      fragment_texts: ["go-live em 2025-12-31"],
      document_date: null,
      received_at: "2026-06-13T20:53:15.377Z",
    });
    expect(resolved.valid_from).toBe("2025-12-31");
    expect(resolved.valid_from_basis).toBe("stated");
  });

  it("AC-3: no behaviour change when document_date is the source (precedence over received)", () => {
    // Document is the SECOND link of the chain — when it is present,
    // received_at is never consulted. Validator passes without resolving
    // synthetic valid_from values (preserves prior contract: the consolidator
    // sees null/null for this branch, just like before TC-FR-001).
    const resolved = validateTemporal({
      valid_from: null,
      valid_to: null,
      valid_from_basis: null,
      requires_valid_from: true,
      change_hint: "none",
      fragment_texts: [],
      document_date: "2026-03-01",
      received_at: "2026-06-13T20:53:15.377Z",
    });
    expect(resolved.valid_from).toBeNull();
    expect(resolved.valid_from_basis).toBeNull();
  });

  it("received_at fallback ignored when requires_valid_from = false", () => {
    // No fallback is needed — the layer just echoes the input back.
    const resolved = validateTemporal({
      valid_from: null,
      valid_to: null,
      valid_from_basis: null,
      requires_valid_from: false,
      change_hint: "none",
      fragment_texts: [],
      document_date: null,
      received_at: "2026-06-13T20:53:15.377Z",
    });
    expect(resolved.valid_from).toBeNull();
    expect(resolved.valid_from_basis).toBeNull();
  });

  it("received_at fallback rejected when timestamp is malformed", () => {
    // The fallback only fires for parseable ISO-8601 prefixes. A short or
    // non-date string falls through to BUSINESS_DATE_UNJUSTIFIED — defense-in-depth
    // against unexpected upstream shapes.
    let caught: unknown = null;
    try {
      validateTemporal({
        valid_from: null,
        valid_to: null,
        valid_from_basis: null,
        requires_valid_from: true,
        change_hint: "none",
        fragment_texts: [],
        document_date: null,
        received_at: "not-a-date",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationFailure);
    expect((caught as ValidationFailure).code).toBe("BUSINESS_DATE_UNJUSTIFIED");
  });
});
