// TC-01 acceptance criteria covered:
//  - "missing required env var crashes with a clear message"
//  - "all env vars validated with Zod at startup"
//  - "no hardcoded secrets" (env reads secrets from process.env only)

import { describe, expect, it } from "vitest";

import { EnvValidationError, InvalidOwnerTimezoneError, loadEnv } from "../../config/env.js";

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

  // --- LOCAL_OPERATOR_TOKEN fail-closed guard (A1) -----------------------
  // The dev-only static-bearer bypass must NEVER be enableable outside an
  // EXPLICIT development environment. Because NODE_ENV defaults to
  // "development", the guard checks the RAW source — so a prod box that forgets
  // NODE_ENV but carries the token refuses to start rather than fail open.
  const TOKEN = "x".repeat(24); // >= 16

  it("accepts LOCAL_OPERATOR_TOKEN only with explicit NODE_ENV=development", () => {
    const env = loadEnv({
      ...baseEnv,
      NODE_ENV: "development",
      LOCAL_OPERATOR_TOKEN: TOKEN,
    });
    expect(env.LOCAL_OPERATOR_TOKEN).toBe(TOKEN);
  });

  it("refuses to start when LOCAL_OPERATOR_TOKEN is set with NODE_ENV != development", () => {
    expect(() =>
      loadEnv({ ...baseEnv, NODE_ENV: "production", LOCAL_OPERATOR_TOKEN: TOKEN })
    ).toThrowError(EnvValidationError);
  });

  it("refuses to start when LOCAL_OPERATOR_TOKEN is set but NODE_ENV is absent (default-development is NOT trusted)", () => {
    const { NODE_ENV: _unused, ...rest } = baseEnv;
    void _unused;
    expect(() =>
      loadEnv({ ...rest, LOCAL_OPERATOR_TOKEN: TOKEN })
    ).toThrowError(EnvValidationError);
  });

  it("rejects a LOCAL_OPERATOR_TOKEN shorter than 16 chars", () => {
    expect(() =>
      loadEnv({ ...baseEnv, NODE_ENV: "development", LOCAL_OPERATOR_TOKEN: "short" })
    ).toThrowError(EnvValidationError);
  });

  // --- Chat surface (chat.back.md §8) ------------------------------------
  // All 8 chat env vars are OPTIONAL with defaults; missing values must boot
  // the BFF normally with the spec defaults.
  describe("chat env vars (chat.back.md §8)", () => {
    it("applies spec defaults when no chat env var is set", () => {
      const env = loadEnv(baseEnv);
      expect(env.CHAT_ENABLED).toBe(true);
      expect(env.CHAT_MODEL).toBe("claude-opus-4-8");
      // TC-005 / chat.back.md v2.8 / BR-18 v4: default bumped from `v3` to
      // `v4` (the directed-ingestion-aware prompt). Lineage: v2.4 bumped
      // v1->v2 (ingestion directives), TC-01 v2.5 bumped v2->v3 (ontology
      // block), TC-005 v2.8 bumps v3->v4 (directed-ingestion block 4C).
      expect(env.CHAT_PROMPT_VERSION).toBe("v4");
      expect(env.MAX_HISTORY_MESSAGES).toBe(40);
      expect(env.MAX_ITERATIONS).toBe(8);
      expect(env.TURN_TIMEOUT_MS).toBe(90_000);
      expect(env.TOOL_TIMEOUT_MS).toBe(15_000);
      expect(env.TOOL_RESULT_MAX_CHARS).toBe(8000);
    });

    it("coerces CHAT_ENABLED='false' to the boolean false (BR-14 kill-switch)", () => {
      const env = loadEnv({ ...baseEnv, CHAT_ENABLED: "false" });
      expect(env.CHAT_ENABLED).toBe(false);
    });

    it("coerces CHAT_ENABLED='true' to the boolean true", () => {
      const env = loadEnv({ ...baseEnv, CHAT_ENABLED: "true" });
      expect(env.CHAT_ENABLED).toBe(true);
    });

    it("coerces numeric env strings to integers", () => {
      const env = loadEnv({
        ...baseEnv,
        MAX_HISTORY_MESSAGES: "20",
        MAX_ITERATIONS: "5",
        TURN_TIMEOUT_MS: "60000",
        TOOL_TIMEOUT_MS: "10000",
        TOOL_RESULT_MAX_CHARS: "4000",
      });
      expect(env.MAX_HISTORY_MESSAGES).toBe(20);
      expect(env.MAX_ITERATIONS).toBe(5);
      expect(env.TURN_TIMEOUT_MS).toBe(60_000);
      expect(env.TOOL_TIMEOUT_MS).toBe(10_000);
      expect(env.TOOL_RESULT_MAX_CHARS).toBe(4000);
    });

    it("accepts an override for CHAT_MODEL and CHAT_PROMPT_VERSION", () => {
      const env = loadEnv({
        ...baseEnv,
        CHAT_MODEL: "claude-sonnet-x",
        CHAT_PROMPT_VERSION: "v2",
      });
      expect(env.CHAT_MODEL).toBe("claude-sonnet-x");
      expect(env.CHAT_PROMPT_VERSION).toBe("v2");
    });

    // --- TC-02 / chat.back.md v2.0.0 §8 — five new optional env vars ----
    describe("v2 additive chat env vars (TC-02)", () => {
      it("applies the v2 defaults (chat.back.md v2.0.0 §8)", () => {
        // BR-31 / BR-33 / BR-34 lean on these defaults; missing values must
        // yield the spec defaults rather than a boot failure.
        const env = loadEnv(baseEnv);
        expect(env.CHAT_UTILITY_MODEL).toBe("claude-haiku-4-5");
        expect(env.CHAT_RECENT_WINDOW).toBe(10);
        expect(env.CHAT_SUMMARY_AFTER_TURNS).toBe(20);
        expect(env.CHAT_TITLE_ENABLED).toBe(true);
        expect(env.CHAT_SUMMARY_ENABLED).toBe(true);
        expect(env.MAX_CONTENT_LENGTH).toBe(32_768);
      });

      it("coerces CHAT_SUMMARY_ENABLED='false' (BR-33 disable)", () => {
        // BR-33 last paragraph: false => summary_rolling stays NULL forever.
        const env = loadEnv({ ...baseEnv, CHAT_SUMMARY_ENABLED: "false" });
        expect(env.CHAT_SUMMARY_ENABLED).toBe(false);
      });

      it("coerces CHAT_TITLE_ENABLED='false' (BR-34 disable)", () => {
        const env = loadEnv({ ...baseEnv, CHAT_TITLE_ENABLED: "false" });
        expect(env.CHAT_TITLE_ENABLED).toBe(false);
      });

      it("coerces integer env strings for CHAT_RECENT_WINDOW / CHAT_SUMMARY_AFTER_TURNS / MAX_CONTENT_LENGTH", () => {
        const env = loadEnv({
          ...baseEnv,
          CHAT_RECENT_WINDOW: "20",
          CHAT_SUMMARY_AFTER_TURNS: "50",
          MAX_CONTENT_LENGTH: "16384",
        });
        expect(env.CHAT_RECENT_WINDOW).toBe(20);
        expect(env.CHAT_SUMMARY_AFTER_TURNS).toBe(50);
        expect(env.MAX_CONTENT_LENGTH).toBe(16_384);
      });

      it("accepts an override for CHAT_UTILITY_MODEL", () => {
        const env = loadEnv({
          ...baseEnv,
          CHAT_UTILITY_MODEL: "claude-haiku-9",
        });
        expect(env.CHAT_UTILITY_MODEL).toBe("claude-haiku-9");
      });

      // --- v2.4 / BR-44 — CHAT_INGEST_ENABLED feature flag -------------
      it("defaults CHAT_INGEST_ENABLED to false (BR-44)", () => {
        // BR-44: boot-time catalog gate. Default OFF means the async-ingestion
        // capability is opt-in — the v2.0 13-tool read-only catalog continues
        // to be the safe default behaviour.
        const env = loadEnv(baseEnv);
        expect(env.CHAT_INGEST_ENABLED).toBe(false);
      });

      it("coerces CHAT_INGEST_ENABLED='true' to the boolean true", () => {
        // BR-44 step 1: enabling the flag swells the catalog to 15 tools at
        // boot. The env loader is the single source of truth for the gate.
        const env = loadEnv({ ...baseEnv, CHAT_INGEST_ENABLED: "true" });
        expect(env.CHAT_INGEST_ENABLED).toBe(true);
      });

      it("coerces CHAT_INGEST_ENABLED='false' to the boolean false", () => {
        const env = loadEnv({ ...baseEnv, CHAT_INGEST_ENABLED: "false" });
        expect(env.CHAT_INGEST_ENABLED).toBe(false);
      });

      it("preserves legacy MAX_HISTORY_MESSAGES alongside the new MAX_CONTENT_LENGTH", () => {
        // Spec divergence: MAX_HISTORY_MESSAGES is functionally superseded
        // by MAX_CONTENT_LENGTH in v2 but kept here for backward
        // compatibility (see delivery file `spec_divergences`).
        const env = loadEnv(baseEnv);
        expect(env.MAX_HISTORY_MESSAGES).toBe(40);
        expect(env.MAX_CONTENT_LENGTH).toBe(32_768);
      });
    });

    // --- v2.9 / BR-47 — OWNER_TZ IANA-zone fail-closed validation -------
    describe("OWNER_TZ (BR-47 v2.9)", () => {
      it("defaults OWNER_TZ to 'America/Sao_Paulo' (BR-47 step 3)", () => {
        // chat.back.md §8: single-owner default; never required to set.
        const env = loadEnv(baseEnv);
        expect(env.OWNER_TZ).toBe("America/Sao_Paulo");
      });

      it("accepts an explicit valid IANA zone (UTC)", () => {
        // UTC is a stable canonical alias every ICU build knows; covers the
        // common case of operators running the BFF in a UTC-only container.
        const env = loadEnv({ ...baseEnv, OWNER_TZ: "UTC" });
        expect(env.OWNER_TZ).toBe("UTC");
      });

      it("accepts an explicit valid IANA zone (Europe/Lisbon)", () => {
        // A DST-bearing zone — confirms `Intl.DateTimeFormat`'s zone DB
        // accepts the canonical IANA id.
        const env = loadEnv({ ...baseEnv, OWNER_TZ: "Europe/Lisbon" });
        expect(env.OWNER_TZ).toBe("Europe/Lisbon");
      });

      it("throws InvalidOwnerTimezoneError on an unknown IANA zone (fail-closed)", () => {
        // BR-47 step 4 — the BFF must REFUSE to start with a bad zone rather
        // than blow up on the first chat turn with a runtime 500.
        expect(() =>
          loadEnv({ ...baseEnv, OWNER_TZ: "Invalid/Zone" })
        ).toThrowError(InvalidOwnerTimezoneError);
      });

      it("InvalidOwnerTimezoneError carries the bad zone string", () => {
        // Helps the operator log line the actual misconfigured value.
        const err = grabError(() =>
          loadEnv({ ...baseEnv, OWNER_TZ: "Bogus/Zone" })
        ) as InvalidOwnerTimezoneError;
        expect(err).toBeInstanceOf(InvalidOwnerTimezoneError);
        expect(err.timezone).toBe("Bogus/Zone");
        expect(err.message).toMatch(/Bogus\/Zone/);
      });
    });
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
