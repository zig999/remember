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
import { http, EnvelopeError, DEFAULT_TIMEOUT_MS } from "../http";
import { __resetEnvCacheForTests } from "../env";

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
