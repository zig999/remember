// Unit coverage for the shared error-mapping primitives (the shell extracted
// from the global handler + the two per-domain mappers). The domain-specific
// branch tables stay covered by their own specs
// (knowledge-graph/mcp/error-envelope.spec.ts, curation/mcp/error-envelope.spec.ts,
// __tests__/unit/error-handler.spec.ts) — those remain the byte-for-byte parity guard.

import { describe, expect, it } from "vitest";

import {
  codeToHttpStatus,
  internalError,
  isPgUnavailable,
  isPgUniqueViolation,
  mapped,
  renderErrorEnvelope,
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

describe("codeToHttpStatus", () => {
  // P2.1: docs/specs/_global/error-codes.md — canonical registry
  it("covers every AUTH_ code from the catalog", () => {
    expect(codeToHttpStatus.AUTH_TOKEN_EXPIRED).toBe(401);
    expect(codeToHttpStatus.AUTH_TOKEN_INVALID).toBe(401);
    expect(codeToHttpStatus.AUTH_UNAUTHORIZED).toBe(401);
    expect(codeToHttpStatus.AUTH_FORBIDDEN).toBe(403);
  });

  it("covers every VALIDATION_ code from the catalog", () => {
    expect(codeToHttpStatus.VALIDATION_REQUIRED_FIELD).toBe(422);
    expect(codeToHttpStatus.VALIDATION_INVALID_FORMAT).toBe(422);
    expect(codeToHttpStatus.VALIDATION_OUT_OF_RANGE).toBe(422);
  });

  it("covers every RESOURCE_ code from the catalog", () => {
    expect(codeToHttpStatus.RESOURCE_NOT_FOUND).toBe(404);
    expect(codeToHttpStatus.RESOURCE_ALREADY_EXISTS).toBe(409);
    expect(codeToHttpStatus.RESOURCE_CONFLICT).toBe(409);
  });

  it("covers every SYSTEM_ code from the catalog", () => {
    expect(codeToHttpStatus.SYSTEM_INTERNAL_ERROR).toBe(500);
    expect(codeToHttpStatus.SYSTEM_SERVICE_UNAVAILABLE).toBe(503);
    expect(codeToHttpStatus.SYSTEM_LLM_PROVIDER_UNAVAILABLE).toBe(502);
  });

  it("covers every ingestion BUSINESS_ code", () => {
    expect(codeToHttpStatus.BUSINESS_RUN_NOT_RETRYABLE).toBe(409);
    expect(codeToHttpStatus.BUSINESS_RUN_NOT_RUNNABLE).toBe(409);
    expect(codeToHttpStatus.BUSINESS_RUN_NOT_RUNNING).toBe(409);
    expect(codeToHttpStatus.BUSINESS_LINK_RULE_VIOLATION).toBe(422);
  });

  it("covers every knowledge-graph BUSINESS_ code", () => {
    expect(codeToHttpStatus.BUSINESS_NODE_DELETED).toBe(410);
    expect(codeToHttpStatus.BUSINESS_UNKNOWN_NODE_TYPE).toBe(422);
    expect(codeToHttpStatus.BUSINESS_UNKNOWN_LINK_TYPE).toBe(422);
    expect(codeToHttpStatus.BUSINESS_UNKNOWN_ATTRIBUTE_KEY).toBe(404);
    expect(codeToHttpStatus.BUSINESS_INVALID_TRAVERSE_DEPTH).toBe(422);
  });

  it("covers every query-retrieval BUSINESS_ code", () => {
    expect(codeToHttpStatus.BUSINESS_INVALID_SEARCH_QUERY).toBe(422);
    expect(codeToHttpStatus.BUSINESS_INVALID_SEARCH_LAYER).toBe(422);
    expect(codeToHttpStatus.BUSINESS_FRAGMENT_NOT_ACCEPTED).toBe(404);
    expect(codeToHttpStatus.BUSINESS_RAW_INFORMATION_DELETED).toBe(410);
  });

  it("covers every curation BUSINESS_ code", () => {
    expect(codeToHttpStatus.BUSINESS_REVIEW_NOT_PENDING).toBe(409);
    expect(codeToHttpStatus.BUSINESS_TARGET_NODE_REQUIRED).toBe(422);
    expect(codeToHttpStatus.BUSINESS_INVALID_TARGET_NODE).toBe(422);
    expect(codeToHttpStatus.BUSINESS_SELF_MERGE_FORBIDDEN).toBe(409);
    expect(codeToHttpStatus.BUSINESS_ITEM_NOT_DISPUTED).toBe(409);
    expect(codeToHttpStatus.BUSINESS_DISPUTE_WINNER_REQUIRED).toBe(422);
    expect(codeToHttpStatus.BUSINESS_DISPUTE_PERIODS_REQUIRED).toBe(422);
    expect(codeToHttpStatus.BUSINESS_ITEM_NOT_UNCERTAIN).toBe(409);
    expect(codeToHttpStatus.BUSINESS_ITEM_NOT_DELETABLE).toBe(409);
    expect(codeToHttpStatus.BUSINESS_CORRECTION_NO_CHANGES).toBe(422);
    expect(codeToHttpStatus.BUSINESS_DATE_UNJUSTIFIED).toBe(422);
    expect(codeToHttpStatus.BUSINESS_TEMPORAL_INCOHERENT).toBe(422);
    expect(codeToHttpStatus.BUSINESS_REASON_REQUIRED).toBe(422);
  });

  it("covers every chat BUSINESS_ code", () => {
    expect(codeToHttpStatus.BUSINESS_CHAT_DISABLED).toBe(503);
    expect(codeToHttpStatus.BUSINESS_CHAT_PROVIDER_UNAVAILABLE).toBe(503);
    expect(codeToHttpStatus.BUSINESS_CONVERSATION_ARCHIVED).toBe(409);
    expect(codeToHttpStatus.BUSINESS_IDEMPOTENCY_MISMATCH).toBe(409);
    expect(codeToHttpStatus.BUSINESS_TURN_IN_PROGRESS).toBe(409);
    expect(codeToHttpStatus.BUSINESS_CHAT_INGEST_DISABLED).toBe(503);
  });

  it("declares no deprecated §14 short codes (P2.1 taxonomy retirement)", () => {
    for (const legacy of [
      "STRUCTURAL_INVALID",
      "UNKNOWN_TYPE",
      "RULE_VIOLATION",
      "TEMPORAL_INCOHERENT",
      "DATE_UNJUSTIFIED",
      "NOT_FOUND",
      "INTERNAL",
    ]) {
      expect(codeToHttpStatus[legacy]).toBeUndefined();
    }
  });
});

describe("renderErrorEnvelope", () => {
  it("resolves the HTTP status through the canonical registry", () => {
    // BR-14 / BR-15 (compliance-audit) — RESOURCE_NOT_FOUND is the shared 404 sentinel.
    const m = renderErrorEnvelope("RESOURCE_NOT_FOUND", "no such raw");
    expect(m.statusCode).toBe(404);
    expect(m.envelope).toEqual({
      ok: false,
      error: { code: "RESOURCE_NOT_FOUND", message: "no such raw" },
    });
  });

  it("assigns logLevel 'warn' for any 4xx status", () => {
    expect(renderErrorEnvelope("VALIDATION_REQUIRED_FIELD", "missing").logLevel).toBe("warn");
    expect(renderErrorEnvelope("BUSINESS_NODE_DELETED", "gone").logLevel).toBe("warn"); // 410
    expect(renderErrorEnvelope("RESOURCE_CONFLICT", "dup").logLevel).toBe("warn"); // 409
  });

  it("assigns logLevel 'error' for any 5xx status", () => {
    expect(renderErrorEnvelope("SYSTEM_INTERNAL_ERROR", "boom").logLevel).toBe("error");
    expect(renderErrorEnvelope("SYSTEM_SERVICE_UNAVAILABLE", "pg down").logLevel).toBe("error");
    expect(renderErrorEnvelope("SYSTEM_LLM_PROVIDER_UNAVAILABLE", "anthropic 401").logLevel).toBe(
      "error"
    );
  });

  it("falls back to 500 + 'error' for unknown codes (defense-in-depth)", () => {
    const m = renderErrorEnvelope("BUSINESS_NEVER_REGISTERED", "leaked");
    expect(m.statusCode).toBe(500);
    expect(m.logLevel).toBe("error");
    expect(m.envelope.error.code).toBe("BUSINESS_NEVER_REGISTERED");
  });

  it("attaches `details` only when provided (avoids `details: undefined` on the wire)", () => {
    const without = renderErrorEnvelope("RESOURCE_NOT_FOUND", "gone");
    expect("details" in without.envelope.error).toBe(false);

    const withDetails = renderErrorEnvelope("VALIDATION_OUT_OF_RANGE", "too big", { max: 3 });
    expect(withDetails.envelope.error.details).toEqual({ max: 3 });
  });

  it("keeps `serviceUnavailableError` orthogonal to `SYSTEM_LLM_PROVIDER_UNAVAILABLE` (503 vs 502)", () => {
    expect(serviceUnavailableError().statusCode).toBe(503);
    expect(renderErrorEnvelope("SYSTEM_LLM_PROVIDER_UNAVAILABLE", "provider down").statusCode).toBe(
      502
    );
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
