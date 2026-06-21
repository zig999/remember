// @vitest-environment node
/**
 * Tests for `lib/http.ts` — the BFF envelope-aware fetch wrapper.
 *
 * Why these tests exist (Golden Rule 9):
 *  - BR-03 (envelope-first parsing) is the SINGLE seam that translates
 *    `ok: false` into an exception the global error router can route.
 *    If the wrapper accidentally returns the envelope instead of throwing,
 *    every feature hook silently treats failures as successes — the worst
 *    possible regression for "fail loud".
 *  - The ingest carve-out (no 30 s cutoff) is load-bearing for the
 *    LLM-bound ingest flow per CLAUDE.md "ingest_document client timeout ≠
 *    failure". Non-ingest calls MUST still time out.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, EnvelopeError, DEFAULT_TIMEOUT_MS, __setRedirectForTests } from "../http";
import { __resetEnvCacheForTests } from "../env";
import { useAuthStore } from "../../state/auth";

// Mock the Better Auth client so `trySilentRefresh()` is hermetic.
const mocks = vi.hoisted(() => ({
  fetchAccessToken: vi.fn(async () => "new.jwt.token"),
}));
vi.mock("../../features/auth/api/neon-auth", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/neon-auth")>(
    "../../features/auth/api/neon-auth",
  );
  return {
    AuthError: actual.AuthError,
    signInWithEmail: vi.fn(),
    fetchAccessToken: mocks.fetchAccessToken,
  };
});

const ENV: ImportMetaEnv = {
  VITE_BFF_URL: "https://bff.example.com",
  VITE_NEON_AUTH_URL: "https://auth.example.com",
} as unknown as ImportMetaEnv;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("http()", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = import.meta.env;

  beforeEach(() => {
    __resetEnvCacheForTests();
    // Vitest provides import.meta.env via Vite; override for the suite.
    Object.assign(import.meta.env, ENV);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.assign(import.meta.env, originalEnv);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns result on ok: true envelope", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: { hello: "world" } }));
    const r = await http<{ hello: string }>("/api/v1/query/health");
    expect(r).toEqual({ hello: "world" });
  });

  it("throws EnvelopeError on ok: false with the envelope code preserved", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          ok: false,
          error: { code: "BUSINESS_DUPLICATE", message: "Já existe", details: { id: "x" } },
        },
        409,
      ),
    );
    await expect(http("/api/v1/x")).rejects.toMatchObject({
      name: "EnvelopeError",
      code: "BUSINESS_DUPLICATE",
      httpStatus: 409,
      message: "Já existe",
      details: { id: "x" },
    });
  });

  it("maps HTTP 5xx to SYSTEM_* even without a JSON body", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("upstream down", { status: 503 }));
    try {
      await http("/api/v1/x");
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(EnvelopeError);
      const ev = err as EnvelopeError;
      expect(ev.httpStatus).toBe(503);
      expect(ev.code.startsWith("SYSTEM_")).toBe(true);
    }
  });

  it("preserves a parseable envelope inside a 5xx response", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ ok: false, error: { code: "SYSTEM_UPSTREAM", message: "Indisponível" } }, 502),
      );
    await expect(http("/api/v1/x")).rejects.toMatchObject({
      code: "SYSTEM_UPSTREAM",
      httpStatus: 502,
      message: "Indisponível",
    });
  });

  it("maps a network failure to SYSTEM_NETWORK", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(http("/api/v1/x")).rejects.toMatchObject({
      code: "SYSTEM_NETWORK",
      httpStatus: 0,
    });
  });

  it("non-ingest call passes an AbortSignal to fetch (30s cutoff)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: null }));
    globalThis.fetch = fetchSpy;
    await http("/api/v1/query/health");
    const call = fetchSpy.mock.calls[0];
    expect(call).toBeDefined();
    const init = call![1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    // sanity: the default cutoff constant is the spec'd 30s.
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });

  it("ingest call skips the internal AbortController (no client-side cutoff)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: { run_id: "x" } }));
    globalThis.fetch = fetchSpy;
    await http("/api/v1/mcp/ingest", { ingest: true });
    const call = fetchSpy.mock.calls[0];
    expect(call).toBeDefined();
    const init = call![1] as RequestInit;
    // No signal was created internally and no caller signal was passed.
    expect(init.signal).toBeUndefined();
  });

  it("ingest call forwards a caller-supplied signal unchanged", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: null }));
    globalThis.fetch = fetchSpy;
    const controller = new AbortController();
    await http("/api/v1/mcp/ingest", { ingest: true, signal: controller.signal });
    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    expect(init.signal).toBe(controller.signal);
  });

  it("rejects with SYSTEM_INVALID_RESPONSE on non-JSON body and 2xx status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("not json", { status: 200 }));
    await expect(http("/api/v1/x")).rejects.toMatchObject({
      code: "SYSTEM_INVALID_RESPONSE",
      httpStatus: 200,
    });
  });

  it("joins base URL and relative path without double slashes", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: 1 }));
    globalThis.fetch = fetchSpy;
    await http("/api/v1/x");
    expect(fetchSpy.mock.calls[0]![0]).toBe("https://bff.example.com/api/v1/x");
  });

  it("non-ingest call aborts after 30s with SYSTEM_TIMEOUT", async () => {
    vi.useFakeTimers();
    let abortReason: unknown;
    globalThis.fetch = vi.fn((_url, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const sig = init?.signal;
        sig?.addEventListener("abort", () => {
          abortReason = sig.reason;
          // Mimic the platform: fetch rejects with the abort reason
          // (a DOMException) when its signal aborts.
          reject(sig.reason);
        });
      });
    }) as typeof fetch;
    const promise = http("/api/v1/x");
    // Attach an early rejection handler so the unhandled-rejection guard does
    // not fire while we advance the fake timer.
    const guard = promise.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS + 50);
    await guard;
    await expect(promise).rejects.toMatchObject({
      code: "SYSTEM_TIMEOUT",
      httpStatus: 0,
    });
    expect(abortReason).toBeInstanceOf(DOMException);
  });
});

/* ---------- DC silent refresh on BFF 401 (TC-01) ------------------------- */

describe("http() — DC silent refresh on 401", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = import.meta.env;
  let redirectSpy: ReturnType<typeof vi.fn>;
  // Import the mocked module reference so we can override per-test behavior.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let neonAuth: typeof import("../../features/auth/api/neon-auth");

  beforeEach(async () => {
    __resetEnvCacheForTests();
    Object.assign(import.meta.env, ENV);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    redirectSpy = vi.fn();
    __setRedirectForTests(redirectSpy);
    useAuthStore.getState().clear();
    neonAuth = await import("../../features/auth/api/neon-auth");
    mocks.fetchAccessToken.mockReset();
    mocks.fetchAccessToken.mockResolvedValue("new.jwt.token");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.assign(import.meta.env, originalEnv);
    __setRedirectForTests(null);
    vi.restoreAllMocks();
    vi.useRealTimers();
    useAuthStore.getState().clear();
  });

  it("on 401: refreshes JWT, stores it, and retries the original request once (success)", async () => {
    const fetchSpy = vi
      .fn()
      // First call → 401
      .mockResolvedValueOnce(jsonResponse({}, 401))
      // Retry → 200 envelope
      .mockResolvedValueOnce(jsonResponse({ ok: true, result: { hello: "world" } }));
    globalThis.fetch = fetchSpy;

    const r = await http<{ hello: string }>("/api/v1/q");
    expect(r).toEqual({ hello: "world" });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(mocks.fetchAccessToken).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe("new.jwt.token");
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it("on 401 + refresh failure: clears store, redirects, throws AUTH_SESSION_EXPIRED", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({}, 401));
    globalThis.fetch = fetchSpy;
    mocks.fetchAccessToken.mockRejectedValueOnce(
      new neonAuth.AuthError("NO_SESSION", "no cookie"),
    );
    useAuthStore.getState().setToken("stale.jwt");

    await expect(http("/api/v1/q")).rejects.toMatchObject({
      code: "AUTH_SESSION_EXPIRED",
      httpStatus: 401,
    });
    expect(useAuthStore.getState().accessToken).toBe(null);
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith("/sign-in?reason=session_expired");
  });

  it("does NOT retry more than once: a 2nd consecutive 401 propagates as AUTH_SESSION_EXPIRED-shaped failure", async () => {
    // First call 401, refresh succeeds, retry ALSO 401 — without __retried
    // guard this would be an infinite loop. We assert the loop stops.
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({}, 401));
    globalThis.fetch = fetchSpy;

    // The 2nd request is the retry with __retried:true. It returns 401 again,
    // which falls through the silent-refresh branch and into the normal
    // envelope-parsing path (which will trip on empty {} not having `ok`).
    // The shape is the post-retry generic failure — what we care about is
    // that fetch was called exactly twice (no third attempt).
    await expect(http("/api/v1/q")).rejects.toBeInstanceOf(EnvelopeError);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(mocks.fetchAccessToken).toHaveBeenCalledTimes(1);
  });

  it("does NOT trigger silent refresh on 200, 4xx (non-401), or 5xx", async () => {
    // 200 OK
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({ ok: true, result: 1 }),
    );
    await expect(http("/api/v1/q")).resolves.toBe(1);
    // 403 (envelope error)
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ok: false, error: { code: "AUTH_FORBIDDEN", message: "no" } }, 403),
      );
    await expect(http("/api/v1/q")).rejects.toMatchObject({ code: "AUTH_FORBIDDEN" });
    // 500
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse({}, 500));
    await expect(http("/api/v1/q")).rejects.toBeInstanceOf(EnvelopeError);
    // fetchAccessToken NEVER called across these three paths.
    expect(mocks.fetchAccessToken).not.toHaveBeenCalled();
  });
});
