// Unit tests for the compliance-audit MCP toolset — P2.1 canonical taxonomy
// (compliance-audit.back.md BR-14 / BR-15 v1.4.0).
//
// Scope: the Zod-parse-failure branch of `compliance_delete`. On the pre-P2.1
// build every failed parse collapsed into the §14 short code
// `STRUCTURAL_INVALID`; after P2.1 the handler surfaces the same
// Zod-discriminated `VALIDATION_*` codes REST already emits (byte-parity on
// both transports):
//   - missing / undefined field   -> VALIDATION_REQUIRED_FIELD
//   - wrong format (UUID, etc.)   -> VALIDATION_INVALID_FORMAT
//   - reason too long / empty     -> VALIDATION_OUT_OF_RANGE
//
// The RESOURCE_NOT_FOUND / SYSTEM_INTERNAL_ERROR sentinel branches are covered
// end-to-end (with a fake pg store) by
// `__tests__/integration/curation/mcp-curation-parity.spec.ts` (BR-32 #5).

import { describe, expect, it } from "vitest";
import pino from "pino";
import type { Pool } from "pg";

import type { McpTool } from "../../../mcp/server.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { registerComplianceToolset } from "../../../modules/compliance-audit/mcp/compliance-toolset.js";

type ErrEnv = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};

/**
 * Build a toolset harness and return the raw `compliance_delete` handler. The
 * pool is passed as an unused sentinel — every branch these tests exercise
 * fails at Zod parse time, before any query runs.
 */
function buildHandler(): McpTool["handler"] {
  const logger = pino({ level: "silent" });
  const mcp = buildMcpServer(logger);
  registerComplianceToolset({
    mcp,
    pool: {} as unknown as Pool,
    logger,
  });
  const tool = mcp.getTool("curation", "compliance_delete");
  if (!tool) throw new Error("compliance_delete not registered");
  return tool.handler;
}

describe("compliance_delete MCP toolset — P2.1 Zod parse discrimination (BR-15 v1.4.0)", () => {
  it("missing raw_information_id -> VALIDATION_REQUIRED_FIELD (not STRUCTURAL_INVALID)", async () => {
    // Regression against the pre-P2.1 behaviour: this used to return
    // `STRUCTURAL_INVALID` on both missing-field AND format-violation.
    const handler = buildHandler();
    const result = (await handler({
      reason: "LGPD request",
    })) as ErrEnv;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("VALIDATION_REQUIRED_FIELD");
    expect(result.error.message).toContain("raw_information_id");
  });

  it("missing reason -> VALIDATION_REQUIRED_FIELD", async () => {
    const handler = buildHandler();
    const result = (await handler({
      raw_information_id: "8f4a2c10-1d2e-4b3f-9a01-1234567890ab",
    })) as ErrEnv;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("VALIDATION_REQUIRED_FIELD");
    expect(result.error.message).toContain("reason");
  });

  it("malformed raw_information_id UUID -> VALIDATION_INVALID_FORMAT", async () => {
    const handler = buildHandler();
    const result = (await handler({
      raw_information_id: "not-a-uuid",
      reason: "LGPD request",
    })) as ErrEnv;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("VALIDATION_INVALID_FORMAT");
  });

  it("whitespace-only reason -> VALIDATION_OUT_OF_RANGE (trim then min 1)", async () => {
    const handler = buildHandler();
    const result = (await handler({
      raw_information_id: "8f4a2c10-1d2e-4b3f-9a01-1234567890ab",
      reason: "   ",
    })) as ErrEnv;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("VALIDATION_OUT_OF_RANGE");
  });

  it("reason > 1000 chars -> VALIDATION_OUT_OF_RANGE", async () => {
    const handler = buildHandler();
    const result = (await handler({
      raw_information_id: "8f4a2c10-1d2e-4b3f-9a01-1234567890ab",
      reason: "a".repeat(1001),
    })) as ErrEnv;
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("VALIDATION_OUT_OF_RANGE");
  });

  it("envelope carries the per-issue details block for the LLM", async () => {
    const handler = buildHandler();
    const result = (await handler({})) as ErrEnv;
    expect(result.ok).toBe(false);
    expect(result.error.details).toMatchObject({ issues: expect.any(Array) });
  });

  it("does NOT emit any deprecated §14 short code (STRUCTURAL_INVALID / NOT_FOUND / INTERNAL)", async () => {
    // Sweep the four Zod parse failure inputs and assert every code is one of
    // the canonical `VALIDATION_*` set. Guarantees the pre-P2.1 short codes are
    // fully retired on this handler.
    const handler = buildHandler();
    const inputs: unknown[] = [
      {}, // missing both
      { raw_information_id: "8f4a2c10-1d2e-4b3f-9a01-1234567890ab" }, // missing reason
      { reason: "x" }, // missing raw_information_id
      { raw_information_id: "not-a-uuid", reason: "x" }, // bad format
    ];
    for (const input of inputs) {
      const result = (await handler(input)) as ErrEnv;
      expect(result.ok).toBe(false);
      expect([
        "VALIDATION_REQUIRED_FIELD",
        "VALIDATION_INVALID_FORMAT",
        "VALIDATION_OUT_OF_RANGE",
      ]).toContain(result.error.code);
    }
  });
});
