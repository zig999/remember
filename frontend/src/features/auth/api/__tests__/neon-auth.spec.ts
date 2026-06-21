// @vitest-environment node
/**
 * Tests for `features/auth/api/neon-auth.ts` — raw-fetch Better Auth client
 * (TC-01).
 *
 * Strategy:
 *  - MSW is not installed in the project; the project's existing test pattern
 *    (see `lib/__tests__/http.spec.ts`) is to mock `globalThis.fetch` per test
 *    and assert URL + init shape. We follow that pattern here — no new test
 *    dependency, hermetic, fast.
 *  - Each test owns its fetch stub (set in beforeEach -> overridden in test).
 *
 * Coverage matrix (from execution_contract.validation.criteria):
 *   step 1 success (200), step 1 401 (INVALID_EMAIL_OR_PASSWORD),
 *   step 2 success (200 with JWT), step 2 401 (NO_SESSION),
 *   step 2 200 but missing token field (NO_TOKEN), network error.
 *
 * Plus contract details that protect future regressions (Golden Rule 9):
 *   credentials:'include' is passed on BOTH calls; Content-Type set on step 1;
 *   trailing slash in VITE_NEON_AUTH_URL is stripped; AuthError.code/name.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signInWithEmail, fetchAccessToken, AuthError } from "../neon-auth";
import { __resetEnvCacheForTests } from "../../../../lib/env";

const ENV: ImportMetaEnv = {
  VITE_BFF_URL: "https://bff.example.com",
  VITE_NEON_AUTH_URL: "https://auth.example.com/neondb/auth",
} as unknown as ImportMetaEnv;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  __resetEnvCacheForTests();
  Object.assign(import.meta.env, ENV);
  // Default: a noop stub so an accidental real call still fails fast.
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("fetch not stubbed in this test"));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

/* ---------- AuthError shape ---------------------------------------------- */

describe("AuthError", () => {
  it("carries name='AuthError' and the constructor code/message", () => {
    const err = new AuthError("X_CODE", "x message");
    expect(err.name).toBe("AuthError");
    expect(err.code).toBe("X_CODE");
    expect(err.message).toBe("x message");
    expect(err).toBeInstanceOf(Error);
  });
});

/* ---------- Step 1: POST /sign-in/email ----------------------------------- */

describe("signInWithEmail (step 1)", () => {
  it("resolves on 200 and sends credentials:'include' + JSON body", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ token: "opaque" }));
    globalThis.fetch = fetchSpy;
    await signInWithEmail("user@example.com", "pw");
    const call = fetchSpy.mock.calls[0]!;
    expect(call[0]).toBe("https://auth.example.com/neondb/auth/sign-in/email");
    const init = call[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ email: "user@example.com", password: "pw" }));
  });

  it("throws AuthError('INVALID_EMAIL_OR_PASSWORD') on 401 with matching code", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ code: "INVALID_EMAIL_OR_PASSWORD", message: "bad creds" }, 401),
      );
    try {
      await signInWithEmail("u@e.com", "x");
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe("INVALID_EMAIL_OR_PASSWORD");
    }
  });

  it("maps any 401 to INVALID_EMAIL_OR_PASSWORD even when code is missing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 401));
    await expect(signInWithEmail("u@e.com", "x")).rejects.toMatchObject({
      name: "AuthError",
      code: "INVALID_EMAIL_OR_PASSWORD",
    });
  });

  it("maps a non-2xx, non-401 to UNKNOWN by default", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    await expect(signInWithEmail("u@e.com", "x")).rejects.toMatchObject({
      name: "AuthError",
      code: "UNKNOWN",
    });
  });

  it("preserves a server-supplied code when present and not 401", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ code: "MISSING_ORIGIN", message: "no origin" }, 400));
    await expect(signInWithEmail("u@e.com", "x")).rejects.toMatchObject({
      name: "AuthError",
      code: "MISSING_ORIGIN",
    });
  });

  it("network failure (TypeError) → AuthError('NETWORK')", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(signInWithEmail("u@e.com", "x")).rejects.toMatchObject({
      name: "AuthError",
      code: "NETWORK",
    });
  });

  it("AbortError (DOMException) → AuthError('NETWORK')", async () => {
    const ab = new DOMException("aborted", "AbortError");
    globalThis.fetch = vi.fn().mockRejectedValue(ab);
    await expect(signInWithEmail("u@e.com", "x")).rejects.toMatchObject({
      name: "AuthError",
      code: "NETWORK",
    });
  });
});

/* ---------- Step 2: GET /token ------------------------------------------- */

describe("fetchAccessToken (step 2)", () => {
  it("returns the JWT on 200 and sends credentials:'include'", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(jsonResponse({ token: "header.payload.sig" }));
    globalThis.fetch = fetchSpy;
    const jwt = await fetchAccessToken();
    expect(jwt).toBe("header.payload.sig");
    const call = fetchSpy.mock.calls[0]!;
    expect(call[0]).toBe("https://auth.example.com/neondb/auth/token");
    const init = call[1] as RequestInit;
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("include");
  });

  it("throws AuthError('NO_SESSION') on 401", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 401));
    await expect(fetchAccessToken()).rejects.toMatchObject({
      name: "AuthError",
      code: "NO_SESSION",
    });
  });

  it("throws AuthError('NO_TOKEN') on 200 with missing token field", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ unrelated: true }));
    await expect(fetchAccessToken()).rejects.toMatchObject({
      name: "AuthError",
      code: "NO_TOKEN",
    });
  });

  it("throws AuthError('NO_TOKEN') on 200 with empty-string token", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ token: "" }));
    await expect(fetchAccessToken()).rejects.toMatchObject({ code: "NO_TOKEN" });
  });

  it("throws AuthError('NO_TOKEN') on 200 with non-JSON body", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("not json", { status: 200 }));
    await expect(fetchAccessToken()).rejects.toMatchObject({ code: "NO_TOKEN" });
  });

  it("maps non-2xx, non-401 to UNKNOWN", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    await expect(fetchAccessToken()).rejects.toMatchObject({ code: "UNKNOWN" });
  });

  it("network failure (TypeError) → AuthError('NETWORK')", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchAccessToken()).rejects.toMatchObject({ code: "NETWORK" });
  });
});

/* ---------- Base URL normalisation ---------------------------------------- */

describe("base URL normalisation", () => {
  it("strips a trailing slash from VITE_NEON_AUTH_URL", async () => {
    __resetEnvCacheForTests();
    Object.assign(import.meta.env, {
      ...ENV,
      VITE_NEON_AUTH_URL: "https://auth.example.com/neondb/auth/",
    } as unknown as ImportMetaEnv);
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ token: "j" }));
    globalThis.fetch = fetchSpy;
    await fetchAccessToken();
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      "https://auth.example.com/neondb/auth/token",
    );
  });
});
