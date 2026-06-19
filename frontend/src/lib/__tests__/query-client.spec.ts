// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import { toast } from "sonner";
import {
  createQueryClient,
  queryClient,
  STABLE_STALE_MS,
  VOLATILE_STALE_MS,
  applyErrorAction,
} from "../query-client";
import { EnvelopeError } from "../http";

describe("query-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("module exports a single shared queryClient instance (BR-12)", () => {
    expect(queryClient).toBeDefined();
    // Defining via createQueryClient() should return distinct instances.
    const other = createQueryClient();
    expect(other).not.toBe(queryClient);
  });

  it("default options: retry=1, staleTime=STABLE_STALE_MS (BR-08)", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.staleTime).toBe(STABLE_STALE_MS);
    expect(STABLE_STALE_MS).toBe(5 * 60 * 1000);
    expect(VOLATILE_STALE_MS).toBe(0);
  });

  it("applyErrorAction routes danger toast via sonner.toast.error", () => {
    applyErrorAction({ kind: "toast", tone: "danger", message: "Erro." });
    expect(toast.error).toHaveBeenCalledWith("Erro.");
  });

  it("applyErrorAction routes warning toast via sonner.toast.warning", () => {
    applyErrorAction({ kind: "toast", tone: "warning", message: "Atenção." });
    expect(toast.warning).toHaveBeenCalledWith("Atenção.");
  });

  it("applyErrorAction silent action is a no-op (does not toast)", () => {
    applyErrorAction({ kind: "silent" });
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("queryCache.onError routes an EnvelopeError through routeError", async () => {
    const client = createQueryClient();
    // Use a SYSTEM_* code so it goes through the danger-toast branch.
    const err = new EnvelopeError({
      code: "SYSTEM_UNKNOWN",
      httpStatus: 500,
      message: "Boom",
    });
    // Simulate the cache emitting an error event.
    client.getQueryCache().config.onError?.(err, {
      queryKey: ["fake"],
      // The cache hands a Query object; we only need the minimum shape.
    } as unknown as never);
    expect(toast.error).toHaveBeenCalled();
  });
});
