// TC-01 acceptance: the global error handler maps every thrown error to the
// canonical envelope. Covers BR-18 of knowledge-graph.back.md (pg-error
// mapping) and the AUTH_* codes from BR-01.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AuthError } from "../../middleware/auth.js";
import {
  classify,
  isPgUnavailable,
} from "../../middleware/error-handler.js";

describe("classify", () => {
  it("maps AuthError to a 401 envelope with the original code", () => {
    // BR-01 of knowledge-graph.back.md: AUTH_* codes flow through unchanged.
    const result = classify(new AuthError("AUTH_TOKEN_EXPIRED", "expired"));
    expect(result.statusCode).toBe(401);
    expect(result.envelope).toEqual({
      ok: false,
      error: { code: "AUTH_TOKEN_EXPIRED", message: "expired" },
    });
    expect(result.logLevel).toBe("warn");
  });

  it("maps a Zod parse error to 422 VALIDATION_INVALID_FORMAT with structured details", () => {
    const schema = z.object({ id: z.string().uuid() });
    const parsed = schema.safeParse({ id: "not-a-uuid" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return; // narrow

    const result = classify(parsed.error);
    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("VALIDATION_INVALID_FORMAT");
    expect(Array.isArray(result.envelope.error.details)).toBe(true);
    expect(result.envelope.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "id" }),
      ])
    );
  });

  it("maps a Fastify validation error to 422", () => {
    const err = Object.assign(new Error("invalid body"), {
      validation: [{ keyword: "required", instancePath: "/foo" }],
    });
    const result = classify(err);
    expect(result.statusCode).toBe(422);
    expect(result.envelope.error.code).toBe("VALIDATION_INVALID_FORMAT");
  });

  it("maps a pg ECONNREFUSED error to 503 SYSTEM_SERVICE_UNAVAILABLE", () => {
    // BR-18 of knowledge-graph.back.md: connection error -> 503.
    const err = Object.assign(new Error("connect ECONNREFUSED"), {
      code: "ECONNREFUSED",
    });
    const result = classify(err);
    expect(result.statusCode).toBe(503);
    expect(result.envelope.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    expect(result.logLevel).toBe("error");
  });

  it("maps a pg statement-timeout (57014) to 503", () => {
    // BR-18: statement timeout -> 503 SYSTEM_SERVICE_UNAVAILABLE.
    const err = Object.assign(new Error("canceling statement due to timeout"), {
      code: "57014",
    });
    const result = classify(err);
    expect(result.statusCode).toBe(503);
    expect(result.envelope.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
  });

  it("maps a generic Error to 500 SYSTEM_INTERNAL_ERROR without leaking the message", () => {
    // SECURITY: 500 path must not echo internal error messages.
    const result = classify(new Error("something secret leaked"));
    expect(result.statusCode).toBe(500);
    expect(result.envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    expect(result.envelope.error.message).toBe("Internal server error.");
    // The original message is NOT in the envelope.
    expect(JSON.stringify(result.envelope)).not.toContain("secret leaked");
  });

  it("forwards a Fastify HTTP error's statusCode but rewrites the envelope", () => {
    const err = Object.assign(new Error("not found"), { statusCode: 404 });
    const result = classify(err);
    expect(result.statusCode).toBe(404);
    expect(result.envelope.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("treats string non-errors as 500", () => {
    const result = classify("oh no");
    expect(result.statusCode).toBe(500);
    expect(result.envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
  });
});

describe("isPgUnavailable", () => {
  it("recognises ECONNREFUSED / ETIMEDOUT / ENOTFOUND / ECONNRESET", () => {
    expect(isPgUnavailable({ code: "ECONNREFUSED" })).toBe(true);
    expect(isPgUnavailable({ code: "ETIMEDOUT" })).toBe(true);
    expect(isPgUnavailable({ code: "ENOTFOUND" })).toBe(true);
    expect(isPgUnavailable({ code: "ECONNRESET" })).toBe(true);
  });

  it("recognises pg SQLSTATEs 57P03 and 57014", () => {
    expect(isPgUnavailable({ code: "57P03" })).toBe(true);
    expect(isPgUnavailable({ code: "57014" })).toBe(true);
  });

  it("ignores unrelated error codes", () => {
    expect(isPgUnavailable({ code: "23505" })).toBe(false);
    expect(isPgUnavailable({ code: "ENOENT" })).toBe(false);
    expect(isPgUnavailable(undefined)).toBe(false);
    expect(isPgUnavailable(null)).toBe(false);
    expect(isPgUnavailable(new Error("plain"))).toBe(false);
  });
});
