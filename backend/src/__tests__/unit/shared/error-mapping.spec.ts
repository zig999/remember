// Unit coverage for the shared error-mapping primitives (the shell extracted
// from the global handler + the two per-domain mappers). The domain-specific
// branch tables stay covered by their own specs
// (knowledge-graph/mcp/error-envelope.spec.ts, curation/mcp/error-envelope.spec.ts,
// __tests__/unit/error-handler.spec.ts) — those remain the byte-for-byte parity guard.

import { describe, expect, it } from "vitest";

import {
  internalError,
  isPgUnavailable,
  isPgUniqueViolation,
  mapped,
  serviceUnavailableError,
  toMcpToolResult,
  type ErrorEnvelope,
} from "../../../shared/error-mapping.js";

describe("isPgUnavailable", () => {
  it("matches socket-level errnos", () => {
    for (const code of ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ECONNRESET"]) {
      expect(isPgUnavailable({ code })).toBe(true);
    }
  });

  it("matches connection/timeout SQLSTATEs", () => {
    for (const code of ["57P03", "57014", "08000", "08003", "08006"]) {
      expect(isPgUnavailable({ code })).toBe(true);
    }
  });

  it("rejects unrelated codes and non-error shapes", () => {
    expect(isPgUnavailable({ code: "23505" })).toBe(false); // unique_violation
    expect(isPgUnavailable({ code: "ENOENT" })).toBe(false);
    expect(isPgUnavailable({ code: 57 })).toBe(false); // non-string code
    expect(isPgUnavailable({})).toBe(false);
    expect(isPgUnavailable(null)).toBe(false);
    expect(isPgUnavailable("boom")).toBe(false);
  });
});

describe("isPgUniqueViolation", () => {
  it("matches only SQLSTATE 23505", () => {
    expect(isPgUniqueViolation({ code: "23505" })).toBe(true);
    expect(isPgUniqueViolation({ code: "57P03" })).toBe(false);
    expect(isPgUniqueViolation({ code: "ECONNREFUSED" })).toBe(false);
    expect(isPgUniqueViolation({})).toBe(false);
    expect(isPgUniqueViolation(null)).toBe(false);
  });
});

describe("mapped", () => {
  it("assembles the { statusCode, logLevel, envelope } triple", () => {
    const m = mapped(404, "warn", { code: "RESOURCE_NOT_FOUND", message: "gone" });
    expect(m).toEqual({
      statusCode: 404,
      logLevel: "warn",
      envelope: { ok: false, error: { code: "RESOURCE_NOT_FOUND", message: "gone" } },
    });
  });
});

describe("terminal builders", () => {
  it("serviceUnavailableError -> 503 SYSTEM_SERVICE_UNAVAILABLE (error)", () => {
    expect(serviceUnavailableError()).toEqual({
      statusCode: 503,
      logLevel: "error",
      envelope: {
        ok: false,
        error: {
          code: "SYSTEM_SERVICE_UNAVAILABLE",
          message: "A backing service is temporarily unavailable.",
        },
      },
    });
  });

  it("internalError -> 500 SYSTEM_INTERNAL_ERROR (error), never leaks a cause", () => {
    const m = internalError();
    expect(m.statusCode).toBe(500);
    expect(m.logLevel).toBe("error");
    expect(m.envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    expect(m.envelope.error.message).toBe("Internal server error.");
    expect(m.envelope.error.details).toBeUndefined();
  });
});

describe("toMcpToolResult", () => {
  const envelope: ErrorEnvelope = {
    ok: false,
    error: { code: "NOT_FOUND", message: "no such node", details: { id: "n1" } },
  };

  it("renders an MCP tool-call error result (isError + text content)", () => {
    const result = toMcpToolResult(envelope);
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
  });

  it("serializes the full structured error into the text block (recoverable)", () => {
    const result = toMcpToolResult(envelope);
    expect(JSON.parse(result.content[0].text)).toEqual(envelope.error);
  });
});
