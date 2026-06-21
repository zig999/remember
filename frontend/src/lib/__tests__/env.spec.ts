// @vitest-environment node
/**
 * Tests for `lib/env.ts` — Zod-validated `import.meta.env` surface
 * (front.back.md BR-02).
 *
 * Why these tests exist (Golden Rule 9): if the env validator silently
 * accepts a missing or non-URL `VITE_BFF_URL`, every BFF call later fails
 * with an opaque network error — there is no second guard rail. The "fail
 * loud at boot" contract is the only safety net.
 *
 * TC-01 (Better Auth migration): the schema now requires only
 * VITE_BFF_URL + VITE_NEON_AUTH_URL — the Stack Auth env vars
 * (VITE_STACK_PROJECT_ID, VITE_STACK_PUBLISHABLE_CLIENT_KEY) were removed.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getEnv, EnvInvalidError, __resetEnvCacheForTests } from "../env";

const validSource = {
  VITE_BFF_URL: "https://bff.example.com",
  VITE_NEON_AUTH_URL: "https://auth.example.com",
} as unknown as ImportMetaEnv;

describe("getEnv()", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetEnvCacheForTests();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("returns a frozen object on valid env", () => {
    const env = getEnv(validSource);
    expect(env.VITE_BFF_URL).toBe("https://bff.example.com");
    expect(env.VITE_NEON_AUTH_URL).toBe("https://auth.example.com");
    expect(Object.isFrozen(env)).toBe(true);
  });

  it("caches the result across calls", () => {
    const a = getEnv(validSource);
    const b = getEnv(validSource);
    expect(a).toBe(b);
  });

  it("throws EnvInvalidError when VITE_BFF_URL is absent (fail loud)", () => {
    const source = { VITE_NEON_AUTH_URL: "https://auth.example.com" } as unknown as ImportMetaEnv;
    expect(() => getEnv(source)).toThrow(EnvInvalidError);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("throws EnvInvalidError when VITE_BFF_URL is not a URL", () => {
    const source = {
      VITE_BFF_URL: "not-a-url",
      VITE_NEON_AUTH_URL: "https://auth.example.com",
    } as unknown as ImportMetaEnv;
    expect(() => getEnv(source)).toThrow(EnvInvalidError);
  });

  it("throws EnvInvalidError when VITE_NEON_AUTH_URL is absent", () => {
    const source = { VITE_BFF_URL: "https://bff.example.com" } as unknown as ImportMetaEnv;
    expect(() => getEnv(source)).toThrow(EnvInvalidError);
  });

  it("throws EnvInvalidError when VITE_NEON_AUTH_URL is not a URL", () => {
    const source = {
      VITE_BFF_URL: "https://bff.example.com",
      VITE_NEON_AUTH_URL: "not-a-url",
    } as unknown as ImportMetaEnv;
    expect(() => getEnv(source)).toThrow(EnvInvalidError);
  });

  it("validates with ONLY VITE_BFF_URL + VITE_NEON_AUTH_URL (no Stack Auth vars required)", () => {
    // TC-01 regression guard — the Stack Auth keys were removed and must NOT
    // be requested by the validator any more.
    const minimal = {
      VITE_BFF_URL: "https://bff.example.com",
      VITE_NEON_AUTH_URL: "https://auth.example.com",
    } as unknown as ImportMetaEnv;
    const env = getEnv(minimal);
    expect(env).toBeDefined();
    // No Stack Auth fields should be present on the parsed env object.
    expect((env as unknown as Record<string, unknown>)["VITE_STACK_PROJECT_ID"]).toBeUndefined();
    expect(
      (env as unknown as Record<string, unknown>)["VITE_STACK_PUBLISHABLE_CLIENT_KEY"],
    ).toBeUndefined();
  });

  it("EnvInvalidError carries the Zod issues for diagnostics", () => {
    const source = { VITE_BFF_URL: "x" } as unknown as ImportMetaEnv;
    try {
      getEnv(source);
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(EnvInvalidError);
      const ev = err as EnvInvalidError;
      expect(ev.issues.length).toBeGreaterThan(0);
      // At least one issue points to one of the two known fields.
      const paths = ev.issues.flatMap((i) => i.path);
      expect(paths).toContain("VITE_BFF_URL");
    }
  });
});
