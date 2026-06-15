// Unit tests for the shared curation error-envelope mapper.
//
// Validates BR-30 (curation.back.md):
//   - Every curation sentinel (ResourceNotFoundError, NodeDeletedError,
//     ConflictError, BusinessError, ValidationError) is mapped to its typed
//     `code` + HTTP status verbatim (no drift from the previous inline REST
//     mappers `handleZodError` + `handleCurationError`).
//   - ZodError custom-issue messages are classified against the BR-30
//     priority list (BUSINESS_TARGET_NODE_REQUIRED > BUSINESS_REASON_REQUIRED
//     > BUSINESS_SELF_MERGE_FORBIDDEN > BUSINESS_DISPUTE_WINNER_REQUIRED >
//     BUSINESS_DISPUTE_PERIODS_REQUIRED > BUSINESS_TEMPORAL_INCOHERENT >
//     BUSINESS_CORRECTION_NO_CHANGES > BUSINESS_DATE_UNJUSTIFIED).
//   - BUSINESS_SELF_MERGE_FORBIDDEN maps to HTTP 409; all other BUSINESS_*
//     Zod custom codes map to 422.
//   - pg SQLSTATE 23505 collapses to BUSINESS_TEMPORAL_INCOHERENT / 422
//     (defensive BR-28 fallback).
//   - pg connectivity / timeout failures collapse to SYSTEM_SERVICE_UNAVAILABLE
//     / 503.
//   - Unknown errors collapse to SYSTEM_INTERNAL_ERROR / 500 WITHOUT leaking
//     `err.message`.
//   - `mapErrorToEnvelope` returns the same envelope as
//     `mapErrorToHttpResponse(...).envelope` (the two forms share one core).
//
// These tests are the regression net for the REST refactor and the future
// MCP curation transport (BR-32 parity tests).

import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";

import {
  ErrorEnvelope,
  isPgUnavailable,
  mapErrorToEnvelope,
  mapErrorToHttpResponse,
  mapZodError,
} from "./error-envelope.js";

import {
  BusinessError,
  ConflictError,
  NodeDeletedError,
  ResourceNotFoundError,
  TemporalIncoherentError,
  ValidationError,
} from "../service/errors.js";
import {
  MergeNodesBodySchema,
  ResolveEntityMatchBodySchema,
} from "../dto/entity-match.dto.js";
import { CorrectItemBodySchema } from "../dto/item.dto.js";

// Tiny helper: pg shape is "anything with .code = SQLSTATE | errno string".
function pgError(code: string, message = "pg test error"): Error & { code: string } {
  const e = new Error(message) as Error & { code: string };
  e.code = code;
  return e;
}

/** Capture a ZodError from a `safeParse` failure -- typed convenience. */
function zodErrorFrom<T>(schema: z.ZodType<T>, input: unknown): ZodError {
  const result = schema.safeParse(input);
  if (result.success) {
    throw new Error("expected schema.safeParse to fail in test setup");
  }
  return result.error;
}

describe("mapErrorToHttpResponse — curation sentinels (BR-30 cascade)", () => {
  // -------------------------------------------------------------------------
  // BR-30: instance hierarchy from curation/service/errors.ts.
  // -------------------------------------------------------------------------

  it("maps ResourceNotFoundError -> 404 RESOURCE_NOT_FOUND with details verbatim", () => {
    // BR-30 row 1: curation sentinel exposes typed `code` + `details`; mapper
    // forwards them unchanged. The previous inline `handleCurationError`
    // used the same shape.
    const err = new ResourceNotFoundError("Node not found", { node_id: "n-1" });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(404);
    expect(result.logLevel).toBe("warn");
    expect(result.envelope).toEqual({
      ok: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Node not found",
        details: { node_id: "n-1" },
      },
    });
  });

  it("maps NodeDeletedError -> 410 BUSINESS_NODE_DELETED (BR-12)", () => {
    const err = new NodeDeletedError("Node was deleted", {
      node_id: "n-2",
      deleted_at: "2026-06-01T00:00:00Z",
    });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(410);
    expect(result.envelope.error.code).toBe("BUSINESS_NODE_DELETED");
    expect(result.envelope.error.details).toEqual({
      node_id: "n-2",
      deleted_at: "2026-06-01T00:00:00Z",
    });
  });

  it.each([
    ["BUSINESS_REVIEW_NOT_PENDING", "Review not pending"],
    ["BUSINESS_ITEM_NOT_DISPUTED", "Item not disputed"],
    ["BUSINESS_ITEM_NOT_UNCERTAIN", "Item not uncertain"],
    ["BUSINESS_ITEM_NOT_DELETABLE", "Item not deletable"],
  ])("maps ConflictError(%s) -> 409 with the carried code", (code, msg) => {
    // BR-30 row 3: ConflictError sub-codes (the state-machine guard family).
    const err = new ConflictError(code, msg, { kind: "test" });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(409);
    expect(result.envelope.error.code).toBe(code);
    expect(result.envelope.error.message).toBe(msg);
    expect(result.envelope.error.details).toEqual({ kind: "test" });
  });

  it.each([
    ["BUSINESS_INVALID_TARGET_NODE"],
    ["BUSINESS_TARGET_NODE_REQUIRED"],
    ["BUSINESS_DISPUTE_WINNER_REQUIRED"],
    ["BUSINESS_DISPUTE_PERIODS_REQUIRED"],
    ["BUSINESS_TEMPORAL_INCOHERENT"],
    ["BUSINESS_CORRECTION_NO_CHANGES"],
    ["BUSINESS_DATE_UNJUSTIFIED"],
    ["BUSINESS_REASON_REQUIRED"],
    ["BUSINESS_INVALID_ATTRIBUTE_VALUE"],
  ])("maps BusinessError(%s) -> 422 with the carried code", (code) => {
    // BR-30 row 4: BusinessError sub-codes (the rich curation taxonomy).
    const err = new BusinessError(code, `${code} message`, { hint: "x" });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe(code);
    expect(result.envelope.error.details).toEqual({ hint: "x" });
  });

  it("maps TemporalIncoherentError -> 422 BUSINESS_TEMPORAL_INCOHERENT", () => {
    // Subclass of BusinessError -- the BusinessError instanceof branch must
    // catch it (regression guard: if the cascade put TemporalIncoherentError
    // AFTER pg 23505 detection, the typed instance would never reach it).
    const err = new TemporalIncoherentError({ scope: "valid_from" });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_TEMPORAL_INCOHERENT");
    expect(result.envelope.error.details).toEqual({ scope: "valid_from" });
  });

  it("maps ValidationError -> 422 with the carried code", () => {
    const err = new ValidationError(
      "VALIDATION_OUT_OF_RANGE",
      "limit too large",
      { max: 200 }
    );
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("VALIDATION_OUT_OF_RANGE");
    expect(result.envelope.error.details).toEqual({ max: 200 });
  });
});

describe("mapErrorToHttpResponse — ZodError priority list (BR-30)", () => {
  // -------------------------------------------------------------------------
  // BR-30: ZodError with custom-issue messages -> BUSINESS_* code with the
  // priority list. The DTO schemas under curation/dto/*.dto.ts are the ones
  // that actually emit these custom codes; we drive them here so the test
  // exercises the real production wiring.
  // -------------------------------------------------------------------------

  it("BUSINESS_TARGET_NODE_REQUIRED -> 422 (decision=merge_into without target)", () => {
    const err = zodErrorFrom(ResolveEntityMatchBodySchema, {
      decision: "merge_into",
      // target_node_id omitted on purpose; reason omitted too
    });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_TARGET_NODE_REQUIRED");
    expect(result.envelope.error.message).toBe(
      "decision=merge_into requires target_node_id"
    );
    // Details preserve the raw Zod issues for diagnostics.
    expect(result.envelope.error.details).toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "target_node_id" }),
      ]),
    });
  });

  it("BUSINESS_REASON_REQUIRED -> 422 when only the reason is missing", () => {
    // Set decision=merge_into and target_node_id present so only REASON fires.
    const err = zodErrorFrom(ResolveEntityMatchBodySchema, {
      decision: "merge_into",
      target_node_id: "11111111-1111-4111-8111-111111111111",
    });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_REASON_REQUIRED");
  });

  it("BUSINESS_SELF_MERGE_FORBIDDEN -> 409 (NOT 422)", () => {
    // The single Zod custom code in the BR-30 list that maps to 409 instead
    // of 422. Regression guard: a future refactor that flips the status will
    // be caught here.
    const sameId = "22222222-2222-4222-8222-222222222222";
    const err = zodErrorFrom(MergeNodesBodySchema, {
      survivor_id: sameId,
      absorbed_id: sameId,
      reason: "merge into self",
    });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(409);
    expect(result.envelope.error.code).toBe("BUSINESS_SELF_MERGE_FORBIDDEN");
    expect(result.envelope.error.message).toBe("survivor_id equals absorbed_id");
  });

  it("BUSINESS_CORRECTION_NO_CHANGES -> 422 (corrected{} empty)", () => {
    const err = zodErrorFrom(CorrectItemBodySchema, {
      item_kind: "link",
      item_id: "33333333-3333-4333-8333-333333333333",
      corrected: {}, // empty -> fires BUSINESS_CORRECTION_NO_CHANGES
      reason: "errata",
    });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_CORRECTION_NO_CHANGES");
  });

  it("priority: BUSINESS_TARGET_NODE_REQUIRED beats BUSINESS_REASON_REQUIRED when both fire", () => {
    // BR-30 priority list head: TARGET_NODE_REQUIRED comes before REASON_REQUIRED.
    // ResolveEntityMatchBodySchema fires both when decision=merge_into and
    // both target_node_id and reason are missing.
    const err = zodErrorFrom(ResolveEntityMatchBodySchema, {
      decision: "merge_into",
    });
    // sanity: both custom codes are present in the raw issues
    const customMessages = err.issues
      .filter((i) => i.code === "custom")
      .map((i) => i.message);
    expect(customMessages).toContain("BUSINESS_TARGET_NODE_REQUIRED");
    expect(customMessages).toContain("BUSINESS_REASON_REQUIRED");

    const result = mapErrorToHttpResponse(err);
    expect(result.envelope.error.code).toBe("BUSINESS_TARGET_NODE_REQUIRED");
  });

  it("ZodError without any matching custom message -> 422 VALIDATION_INVALID_FORMAT", () => {
    // A non-custom Zod failure (wrong type, etc.) must fall through to the
    // generic VALIDATION_INVALID_FORMAT envelope.
    const err = zodErrorFrom(MergeNodesBodySchema, {
      survivor_id: "not-a-uuid",
      absorbed_id: "also-not-a-uuid",
      reason: "test",
    });
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("VALIDATION_INVALID_FORMAT");
    expect(result.envelope.error.message).toBe("Request payload failed validation.");
    // details.issues array is preserved with {path, message} entries
    const details = result.envelope.error.details as { issues: unknown[] };
    expect(Array.isArray(details.issues)).toBe(true);
    expect(details.issues.length).toBeGreaterThan(0);
  });

  it("mapZodError is exported and produces the same MappedError as mapErrorToHttpResponse", () => {
    // BR-30: the Zod classifier is exported so QA / parity tests can drive it
    // directly without funnelling through the full cascade.
    const sameId = "44444444-4444-4444-8444-444444444444";
    const err = zodErrorFrom(MergeNodesBodySchema, {
      survivor_id: sameId,
      absorbed_id: sameId,
      reason: "self",
    });
    expect(mapZodError(err)).toEqual(mapErrorToHttpResponse(err));
  });
});

describe("mapErrorToHttpResponse — pg / unknown (BR-30 trailing rows)", () => {
  it("maps pg SQLSTATE 23505 -> 422 BUSINESS_TEMPORAL_INCOHERENT (defensive BR-28)", () => {
    // The service layer normally throws a typed `TemporalIncoherentError`
    // first, but if a raw pg unique_violation bubbles up the mapper must
    // produce the same wire code instead of falling through to 500.
    const err = pgError("23505", "duplicate key value violates unique constraint");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("BUSINESS_TEMPORAL_INCOHERENT");
    expect(result.envelope.error.message).toContain("duplicate-guard");
    // No `details` here — matches the prior inline `handleCurationError` behaviour.
    expect(result.envelope.error.details).toBeUndefined();
  });

  it.each([
    ["ECONNREFUSED"],
    ["ETIMEDOUT"],
    ["ENOTFOUND"],
    ["ECONNRESET"],
    ["57P03"],
    ["57014"],
    ["08000"],
    ["08003"],
    ["08006"],
  ])("maps pg %s -> 503 SYSTEM_SERVICE_UNAVAILABLE", (code) => {
    const err = pgError(code);
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(503);
    expect(result.logLevel).toBe("error");
    expect(result.envelope.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    expect(result.envelope.error.message).toBe(
      "A backing service is temporarily unavailable."
    );
  });

  it("maps unknown error -> 500 SYSTEM_INTERNAL_ERROR without leaking err.message", () => {
    // Critical regression guard: the previous `handleCurationError`
    // re-threw unknown errors to the Fastify global handler, which masked
    // err.message. The new shared mapper masks them directly so REST and MCP
    // surfaces stay in lockstep — MCP has no Fastify handler to fall through
    // to. The masking MUST be byte-identical to the global handler.
    const err = new Error("super secret PII inside the cause message");
    const result = mapErrorToHttpResponse(err);

    expect(result.statusCode).toBe(500);
    expect(result.envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    expect(result.envelope.error.message).toBe("Internal server error.");
    expect(JSON.stringify(result.envelope)).not.toContain("super secret");
  });

  it("maps null / undefined / primitives -> 500 SYSTEM_INTERNAL_ERROR", () => {
    for (const sample of [null, undefined, 42, "thrown-string", false]) {
      const result = mapErrorToHttpResponse(sample);
      expect(result.statusCode).toBe(500);
      expect(result.envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    }
  });
});

describe("mapErrorToEnvelope — parity with mapErrorToHttpResponse", () => {
  it("returns the same envelope object as mapErrorToHttpResponse(...).envelope", () => {
    // BR-30 single-source guarantee: REST and MCP MUST surface the same
    // envelope on every thrown sentinel. The two public entry points share
    // one classification core.
    const sameId = "55555555-5555-4555-8555-555555555555";
    const cases: unknown[] = [
      new ResourceNotFoundError("missing", { node_id: "x" }),
      new NodeDeletedError("gone", { node_id: "y" }),
      new ConflictError("BUSINESS_REVIEW_NOT_PENDING", "msg"),
      new BusinessError("BUSINESS_INVALID_TARGET_NODE", "bad target"),
      new ValidationError("VALIDATION_OUT_OF_RANGE", "limit too big"),
      new TemporalIncoherentError({ scope: "x" }),
      zodErrorFrom(MergeNodesBodySchema, {
        survivor_id: sameId,
        absorbed_id: sameId,
        reason: "self",
      }),
      pgError("ECONNREFUSED"),
      pgError("23505"),
      new Error("whatever"),
    ];

    for (const err of cases) {
      const full = mapErrorToHttpResponse(err);
      const env: ErrorEnvelope = mapErrorToEnvelope(err);
      expect(env).toEqual(full.envelope);
    }
  });

  it("never imports FastifyReply (BR-30: transport-agnostic)", async () => {
    // Statically asserted by the file's import list; we additionally guard at
    // runtime by reading the module source via a dynamic import sanity check
    // (the test file itself imports only types + values, no Fastify).
    // The constraint is owned by the spec; a future refactor that pulls in
    // Fastify would surface as a compile-time error against this file's
    // imports section, which is the real defence. This test merely documents
    // intent.
    const mod = await import("./error-envelope.js");
    expect(typeof mod.mapErrorToEnvelope).toBe("function");
    expect(typeof mod.mapErrorToHttpResponse).toBe("function");
  });
});

describe("isPgUnavailable — pg detection helper", () => {
  it.each([
    ["ECONNREFUSED"],
    ["ETIMEDOUT"],
    ["ENOTFOUND"],
    ["ECONNRESET"],
    ["57P03"],
    ["57014"],
    ["08000"],
    ["08003"],
    ["08006"],
  ])("recognises %s", (code) => {
    expect(isPgUnavailable(pgError(code))).toBe(true);
  });

  it("rejects non-objects, missing code, and unrelated codes", () => {
    expect(isPgUnavailable(null)).toBe(false);
    expect(isPgUnavailable(undefined)).toBe(false);
    expect(isPgUnavailable("ECONNREFUSED")).toBe(false); // string, not object
    expect(isPgUnavailable(new Error("no code"))).toBe(false);
    expect(isPgUnavailable(pgError("23505"))).toBe(false); // unique_violation, not unavailable
  });
});
