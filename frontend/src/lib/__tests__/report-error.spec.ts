// @vitest-environment node
/**
 * Tests for `lib/report-error.ts` — the stub forwarder.
 *
 * Why these tests exist (Golden Rule 9): the behaviour is intentionally
 * minimal this wave (console.error in dev, no-op in prod). The tests pin
 * that contract so a future wave does not accidentally introduce a network
 * call or a third-party tracker that the project explicitly forbids
 * (front.md §11 — no Sentry / Datadog / analytics).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { reportError } from "../report-error";

describe("reportError()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls console.error in dev mode with the error + context payload", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    // Vitest runs under Vite — import.meta.env.DEV is true.
    reportError(new Error("boom"), { source: "test", queryKey: ["nodes"] });
    expect(spy).toHaveBeenCalledTimes(1);
    const [tag, payload] = spy.mock.calls[0] as [string, Record<string, unknown>];
    expect(tag).toBe("[report-error]");
    expect(payload.source).toBe("test");
    expect(payload.queryKey).toEqual(["nodes"]);
    expect(payload.error).toBeInstanceOf(Error);
  });

  it("is a no-op when DEV is false (production build)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const originalDev = import.meta.env.DEV;
    // Override DEV flag for the assertion. import.meta.env is mutable in Vitest.
    (import.meta.env as Record<string, unknown>).DEV = false;
    try {
      reportError(new Error("silent"));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      (import.meta.env as Record<string, unknown>).DEV = originalDev;
    }
  });
});
