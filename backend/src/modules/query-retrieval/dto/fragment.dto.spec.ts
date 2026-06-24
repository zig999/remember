// Unit tests for `ListAcceptedFragmentsQuerySchema` (TC-be-002).
//
// These tests pin the validation contract — the route relies on Zod to raise
// a ZodError (the global error handler maps it to 422
// VALIDATION_INVALID_FORMAT). Each acceptance criterion of TC-be-002 that
// involves input validation has at least one test here.

import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { ListAcceptedFragmentsQuerySchema } from "./fragment.dto.js";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("ListAcceptedFragmentsQuerySchema", () => {
  // Encodes WHY: the API requires at least one source filter so the listing
  // endpoint never returns the entire fragments table. Both absent -> 422.
  it("rejects when both llm_run_id and raw_information_id are absent", () => {
    expect(() =>
      ListAcceptedFragmentsQuerySchema.parse({})
    ).toThrowError(ZodError);
  });

  it("accepts when only llm_run_id is supplied (with defaults)", () => {
    const parsed = ListAcceptedFragmentsQuerySchema.parse({ llm_run_id: UUID });
    expect(parsed.llm_run_id).toBe(UUID);
    expect(parsed.raw_information_id).toBeUndefined();
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it("accepts when only raw_information_id is supplied (with defaults)", () => {
    const parsed = ListAcceptedFragmentsQuerySchema.parse({
      raw_information_id: UUID,
    });
    expect(parsed.raw_information_id).toBe(UUID);
    expect(parsed.llm_run_id).toBeUndefined();
  });

  it("accepts when both filters are supplied (intersection semantics)", () => {
    const other = "22222222-2222-4222-8222-222222222222";
    const parsed = ListAcceptedFragmentsQuerySchema.parse({
      llm_run_id: UUID,
      raw_information_id: other,
    });
    expect(parsed.llm_run_id).toBe(UUID);
    expect(parsed.raw_information_id).toBe(other);
  });

  // Encodes WHY: bad UUID syntax must fail at the boundary so the SQL layer
  // never sees a malformed cast (which would surface as a 500).
  it("rejects a syntactically invalid UUID on llm_run_id", () => {
    expect(() =>
      ListAcceptedFragmentsQuerySchema.parse({ llm_run_id: "not-a-uuid" })
    ).toThrowError(ZodError);
  });

  it("rejects a syntactically invalid UUID on raw_information_id", () => {
    expect(() =>
      ListAcceptedFragmentsQuerySchema.parse({
        raw_information_id: "still-not-a-uuid",
      })
    ).toThrowError(ZodError);
  });

  // Encodes WHY: numeric defaults must match the openapi contract — drift
  // here would silently change the page size the SPA receives.
  it("coerces and clamps limit (string -> number; defaults to 20)", () => {
    const parsed = ListAcceptedFragmentsQuerySchema.parse({
      raw_information_id: UUID,
      limit: "50",
    });
    expect(parsed.limit).toBe(50);
  });

  it("rejects limit > 100", () => {
    expect(() =>
      ListAcceptedFragmentsQuerySchema.parse({
        raw_information_id: UUID,
        limit: 250,
      })
    ).toThrowError(ZodError);
  });

  it("rejects limit < 1", () => {
    expect(() =>
      ListAcceptedFragmentsQuerySchema.parse({
        raw_information_id: UUID,
        limit: 0,
      })
    ).toThrowError(ZodError);
  });

  it("rejects negative offset", () => {
    expect(() =>
      ListAcceptedFragmentsQuerySchema.parse({
        raw_information_id: UUID,
        offset: -1,
      })
    ).toThrowError(ZodError);
  });

  it("rejects unknown query keys (strict)", () => {
    expect(() =>
      ListAcceptedFragmentsQuerySchema.parse({
        raw_information_id: UUID,
        rogue: "bad",
      })
    ).toThrowError(ZodError);
  });
});
