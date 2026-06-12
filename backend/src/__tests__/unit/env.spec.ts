// TC-01 acceptance criteria covered:
//  - "missing required env var crashes with a clear message"
//  - "all env vars validated with Zod at startup"
//  - "no hardcoded secrets" (env reads secrets from process.env only)

import { describe, expect, it } from "vitest";

import { EnvValidationError, loadEnv } from "../../config/env.js";

const baseEnv = {
  NODE_ENV: "test",
  PORT: "3000",
  LOG_LEVEL: "info",
  DATABASE_URL: "postgresql://user:pw@localhost:5432/db",
  NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth",
  ANTHROPIC_API_KEY: "sk-ant-test-fixture",
} satisfies NodeJS.ProcessEnv;

describe("loadEnv", () => {
  it("parses a valid environment", () => {
    // TC-01: BFF starts without errors when env is complete.
    const env = loadEnv(baseEnv);
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("test");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.DATABASE_URL).toBe(baseEnv.DATABASE_URL);
    expect(env.NEON_AUTH_URL).toBe(baseEnv.NEON_AUTH_URL);
    expect(env.NEON_AUTH_JWKS_TTL_S).toBe(600);
    expect(env.PG_POOL_MIN).toBe(2);
    expect(env.PG_POOL_MAX).toBe(10);
    expect(env.PG_STATEMENT_TIMEOUT_MS).toBe(10_000);
  });

  it("applies defaults when optional vars are omitted", () => {
    const env = loadEnv(baseEnv);
    // Defaults flow from the schema, not from process.env.
    expect(env.NODE_ENV).toBe("test"); // explicit override
    expect(env.PORT).toBe(3000);
  });

  it("freezes the returned config object", () => {
    const env = loadEnv(baseEnv);
    expect(Object.isFrozen(env)).toBe(true);
  });

  it("throws EnvValidationError when DATABASE_URL is missing", () => {
    // TC-01: missing required var crashes with a clear message.
    const { DATABASE_URL: _unused, ...rest } = baseEnv;
    void _unused;
    expect(() => loadEnv(rest)).toThrowError(EnvValidationError);
  });

  it("throws when DATABASE_URL has an unsupported scheme", () => {
    // VALIDATION: format guard. DATABASE_URL must be postgres(ql)://...
    expect(() => loadEnv({ ...baseEnv, DATABASE_URL: "mysql://host/db" })).toThrowError(
      EnvValidationError
    );
  });

  it("throws when NEON_AUTH_URL is missing", () => {
    const { NEON_AUTH_URL: _unused, ...rest } = baseEnv;
    void _unused;
    expect(() => loadEnv(rest)).toThrowError(EnvValidationError);
  });

  it("throws when ANTHROPIC_API_KEY is missing (TC-12 / BR-29)", () => {
    // TC-12 acceptance criterion: ANTHROPIC_API_KEY absence at boot causes
    // the Zod env parse to fail (the process refuses to start). The
    // orchestrator (BR-26) is the sole LLM caller of the BFF.
    const { ANTHROPIC_API_KEY: _unused, ...rest } = baseEnv;
    void _unused;
    expect(() => loadEnv(rest)).toThrowError(EnvValidationError);
  });

  it("rejects an out-of-range PORT", () => {
    expect(() => loadEnv({ ...baseEnv, PORT: "70000" })).toThrowError(
      EnvValidationError
    );
  });

  it("rejects an unsupported LOG_LEVEL", () => {
    expect(() => loadEnv({ ...baseEnv, LOG_LEVEL: "verbose" })).toThrowError(
      EnvValidationError
    );
  });

  it("aggregates multiple missing fields in a single error", () => {
    // The operator should see all issues at once, not one per restart.
    const err = grabError(() => loadEnv({}));
    expect(err).toBeInstanceOf(EnvValidationError);
    const issues = (err as EnvValidationError).issues.map((i) => i.path);
    expect(issues).toEqual(
      expect.arrayContaining([
        "DATABASE_URL",
        "NEON_AUTH_URL",
        "ANTHROPIC_API_KEY",
      ])
    );
  });

  it("produces a human-readable, multi-line message", () => {
    // The first thing the operator sees on a failed boot must be actionable.
    const err = grabError(() => loadEnv({})) as EnvValidationError;
    expect(err.message).toMatch(/Invalid backend environment configuration/);
    expect(err.message).toMatch(/DATABASE_URL/);
    expect(err.message).toMatch(/NEON_AUTH_URL/);
  });
});

function grabError(fn: () => unknown): unknown {
  try {
    fn();
    return undefined;
  } catch (e) {
    return e;
  }
}
