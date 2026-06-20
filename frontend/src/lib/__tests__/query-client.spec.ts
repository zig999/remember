// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// TC-11: stub the router so a 'toast-and-navigate' action does not require
// a mounted RouterProvider during the unit test, and we can assert the call.
// Uses vi.hoisted so the mocks survive vi.mock's hoisting (Vitest docs).
const { navigateMock, authClearMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(() => Promise.resolve()),
  authClearMock: vi.fn(),
}));

vi.mock("@/router/router", () => ({
  router: { navigate: navigateMock },
}));
// vite-tsconfig-paths resolves `@/router/router` to the on-disk path before
// vi.mock can match by alias; mocking BOTH spellings catches whichever
// resolution path the runner takes (see ChatWorkspace.spec for the same
// pattern).
vi.mock("../../router/router", () => ({
  router: { navigate: navigateMock },
}));

// Stub the auth store so we can verify `clear()` runs on AUTH_* redirects
// without spinning up the full Zustand subscriber tree.
vi.mock("@/state/auth", () => ({
  useAuthStore: {
    getState: () => ({ clear: authClearMock }),
  },
}));
vi.mock("../../state/auth", () => ({
  useAuthStore: {
    getState: () => ({ clear: authClearMock }),
  },
}));

import { toast } from "sonner";
import {
  createQueryClient,
  queryClient,
  STABLE_STALE_MS,
  VOLATILE_STALE_MS,
  applyErrorAction,
  contextFromQuery,
  contextFromMutation,
} from "../query-client";
import { EnvelopeError } from "../http";

describe("query-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
    authClearMock.mockClear();
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

  /* ---------- TC-11 — error routing wiring ---------- */

  it("applyErrorAction redirect clears the auth store (AUTH_* path)", () => {
    // Why this matters: an AUTH_* failure means the bearer is stale or
    // tampered. If `clear()` is skipped, a refresh or back-button trip
    // could revive the dead token from sessionStorage — TC-11 forbids
    // exactly that regression.
    applyErrorAction({ kind: "redirect", to: "/sign-in?reason=session_expired" });
    expect(authClearMock).toHaveBeenCalledTimes(1);
  });

  it("applyErrorAction toast-and-navigate shows warning + calls router.navigate", () => {
    // Why this matters: the chat workspace must drop a stale ?conversation=
    // search param when the BFF returns RESOURCE_NOT_FOUND. If we only
    // toast, the query retries forever; if we only navigate, the operator
    // never learns why.
    applyErrorAction({
      kind: "toast-and-navigate",
      tone: "warning",
      message: "Conversa não encontrada.",
      to: "/chat",
    });
    expect(toast.warning).toHaveBeenCalledWith("Conversa não encontrada.");
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith({ to: "/chat", search: {} });
  });

  it("contextFromQuery flags conversation detail keys but not the list root", () => {
    expect(contextFromQuery({ queryKey: ["conversations", "abc-1"] })).toEqual({
      isConversationResource: true,
    });
    expect(
      contextFromQuery({ queryKey: ["conversations", "list", { includeArchived: false }] }),
    ).toEqual({ isConversationResource: false });
    expect(contextFromQuery(undefined)).toEqual({});
  });

  it("contextFromMutation reads the optional mutationKey", () => {
    expect(
      contextFromMutation({ options: { mutationKey: ["conversations", "abc-1", "send"] } }),
    ).toEqual({ isConversationResource: true });
    expect(contextFromMutation({ options: {} })).toEqual({});
    expect(contextFromMutation(undefined)).toEqual({});
  });

  it("queryCache.onError on conversation detail 404 → warning toast + navigate", () => {
    const client = createQueryClient();
    const err = new EnvelopeError({
      code: "RESOURCE_NOT_FOUND",
      httpStatus: 404,
      message: "missing",
    });
    client.getQueryCache().config.onError?.(err, {
      queryKey: ["conversations", "abc-1"],
    } as unknown as never);
    expect(toast.warning).toHaveBeenCalledWith("Conversa não encontrada.");
    expect(navigateMock).toHaveBeenCalledWith({ to: "/chat", search: {} });
    // Sanity: SYSTEM_ABORTED would have been silent — confirm we are NOT
    // accidentally toasting danger for the 404.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("queryCache.onError on AUTH_TOKEN_EXPIRED clears the auth store (no toast)", () => {
    const client = createQueryClient();
    const err = new EnvelopeError({
      code: "AUTH_TOKEN_EXPIRED",
      httpStatus: 401,
      message: "expired",
    });
    client.getQueryCache().config.onError?.(err, {
      queryKey: ["conversations", "abc-1", "messages"],
    } as unknown as never);
    expect(authClearMock).toHaveBeenCalledTimes(1);
    // AUTH redirects must NOT raise a toast — the /sign-in page carries
    // the session_expired reason instead (front.md §5).
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("queryCache.onError on SYSTEM_ABORTED stays silent (no toast, no nav, no clear)", () => {
    // Regression guard: front.md §5 silent path must survive the TC-11
    // wiring — if any of these fire, an unmount/navigation cancel would
    // start surfacing as a user-visible error.
    const client = createQueryClient();
    const err = new EnvelopeError({
      code: "SYSTEM_ABORTED",
      httpStatus: 0,
      message: "aborted",
    });
    client.getQueryCache().config.onError?.(err, {
      queryKey: ["conversations", "abc-1"],
    } as unknown as never);
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(authClearMock).not.toHaveBeenCalled();
  });
});
