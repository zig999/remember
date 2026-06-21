/**
 * useSignIn — unit tests (TC-01).
 *
 * What we test:
 *   1. `resolveSafeRedirect` (FL-AUTH-03): the pure same-origin guard — a
 *      tight table-driven test of every relevant input class. This is the
 *      security-critical seam, so we exercise it directly without any
 *      Better Auth client in the loop.
 *   2. `classifySignInError`: the discriminator that decides which message
 *      the form will show — exercised against AuthError codes
 *      (INVALID_EMAIL_OR_PASSWORD, NETWORK, NO_SESSION, NO_TOKEN, UNKNOWN),
 *      native TypeError, and arbitrary throws.
 *   3. `useSignIn` integration:
 *      - Success: BOTH neon-auth calls fire in order; setToken is called
 *        BEFORE navigate (BR-04 ordering).
 *      - Credential error (step 1): error.type === 'credential', step 2 is
 *        NOT called, no token, no navigate.
 *      - NO_SESSION / NO_TOKEN (step 2): error.type === 'session', no token.
 *      - Network error: error.type === 'network'.
 *      - FL-AUTH-03: a `?redirect=https://evil.com` URL falls back to /chat.
 *
 * Strategy:
 *   - `./neon-auth` is mocked entirely — we never need to reach the
 *     network. The mocks expose the two functions the hook calls and the
 *     real AuthError class so `classifySignInError` can `instanceof`-match.
 *   - TanStack Router's `useNavigate` is mocked to a spy — we assert on the
 *     order of `setToken` vs `navigate` via `mock.invocationCallOrder`.
 *   - `sonner`'s `toast` is mocked to spy on `error()` invocations.
 *   - We use the project's `createRoot + act` harness (no
 *     @testing-library/react in the repo).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createRef, useImperativeHandle, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as React from "react";

/* ---------- Module mocks (must precede imports of the SUT) -------------- */

/**
 * Hoisted state — `vi.mock(...)` factories are hoisted above ALL top-level
 * code by Vitest, so any outer variable they reference must be declared via
 * `vi.hoisted` (which is also hoisted) or it will be undefined at factory
 * invocation time.
 *
 * The neon-auth functions + navigate/toast spies live here so the per-test
 * `beforeEach` can clear their call records without re-mocking.
 *
 * We import the REAL `AuthError` class inside the hoisted factory so the
 * classifier's `instanceof AuthError` checks succeed against the same class
 * the mocked functions throw.
 */
const mocks = vi.hoisted(() => {
  return {
    signInWithEmail: vi.fn(async (_email: string, _password: string) => undefined),
    fetchAccessToken: vi.fn(async () => "jwt.payload.sig"),
    navigate: vi.fn(),
    toastError: vi.fn(),
  };
});

vi.mock("../neon-auth", async () => {
  // Re-export the real AuthError class so `instanceof` lines in
  // classifySignInError match the errors thrown by tests below.
  const actual = await vi.importActual<typeof import("../neon-auth")>("../neon-auth");
  return {
    AuthError: actual.AuthError,
    signInWithEmail: mocks.signInWithEmail,
    fetchAccessToken: mocks.fetchAccessToken,
  };
});

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, warning: vi.fn(), success: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));

// Aliases that read more naturally in the assertions below.
const signInWithEmail = mocks.signInWithEmail;
const fetchAccessToken = mocks.fetchAccessToken;
const navigate = mocks.navigate;
const toastError = mocks.toastError;

/* ---------- Imports of the SUT (after mocks) ----------------------------- */

import {
  useSignIn,
  resolveSafeRedirect,
  classifySignInError,
  type UseSignInReturn,
} from "../useSignIn";
import { AuthError } from "../neon-auth";
import { useAuthStore } from "../../../../state/auth";

/* ---------- Pure-function tests ----------------------------------------- */

describe("resolveSafeRedirect (FL-AUTH-03)", () => {
  const safe: ReadonlyArray<[string, string]> = [
    ["plain path", "/chat"],
    ["nested path", "/conversations/abc-123"],
    ["with query", "/search?q=ada"],
    ["with hash", "/graph#node-1"],
    ["with trailing slash", "/graph/"],
  ];
  it.each(safe)("accepts %s", (_label, value) => {
    expect(resolveSafeRedirect(value)).toBe(value);
  });

  const unsafe: ReadonlyArray<[string, string | null]> = [
    ["null", null],
    ["empty", ""],
    ["protocol-relative", "//evil.com"],
    ["https url", "https://evil.com"],
    ["http url", "http://evil.com"],
    ["javascript url", "javascript:alert(1)"],
    ["data url", "data:text/html,<script>"],
    ["embedded scheme", "/redirect?next=https://evil.com"], // contains :// → blocked
    ["backslash", "/\\evil.com"],
    ["bare", "chat"],
    ["dot path", "../chat"],
  ];
  it.each(unsafe)("falls back to /chat for %s", (_label, value) => {
    expect(resolveSafeRedirect(value)).toBe("/chat");
  });

  it("falls back to /chat for absurdly long candidates (sanity cap)", () => {
    const long = "/" + "a".repeat(4096);
    expect(resolveSafeRedirect(long)).toBe("/chat");
  });
});

describe("classifySignInError", () => {
  it("maps AuthError('INVALID_EMAIL_OR_PASSWORD') to credential", () => {
    expect(classifySignInError(new AuthError("INVALID_EMAIL_OR_PASSWORD", "x"))).toEqual({
      type: "credential",
    });
  });

  it("maps AuthError('NETWORK') to network", () => {
    expect(classifySignInError(new AuthError("NETWORK", "x"))).toEqual({ type: "network" });
  });

  it("maps AuthError('NO_SESSION') to session", () => {
    expect(classifySignInError(new AuthError("NO_SESSION", "x"))).toEqual({ type: "session" });
  });

  it("maps AuthError('NO_TOKEN') to session", () => {
    expect(classifySignInError(new AuthError("NO_TOKEN", "x"))).toEqual({ type: "session" });
  });

  it("maps AuthError with an unrecognised code to unknown", () => {
    expect(classifySignInError(new AuthError("SOMETHING_ELSE", "x"))).toEqual({
      type: "unknown",
    });
  });

  it("maps native TypeError (defensive) to network", () => {
    expect(classifySignInError(new TypeError("Failed to fetch"))).toEqual({ type: "network" });
  });

  it("maps message mentioning 'failed to fetch' (defensive) to network", () => {
    expect(classifySignInError({ message: "Network call failed to fetch /api" })).toEqual({
      type: "network",
    });
  });

  it("maps everything else to unknown", () => {
    expect(classifySignInError(new Error("boom"))).toEqual({ type: "unknown" });
    expect(classifySignInError(null)).toEqual({ type: "unknown" });
    expect(classifySignInError("string")).toEqual({ type: "unknown" });
  });
});

/* ---------- Integration tests (hook driven via tiny host) --------------- */

interface Harness {
  signIn: UseSignInReturn["signIn"];
  getState: () => Pick<UseSignInReturn, "isLoading" | "error">;
}

/**
 * Minimal host that exposes `useSignIn`'s API on the ref so tests can drive
 * it imperatively without depending on @testing-library/react.
 */
function Host({ refObj }: { refObj: RefObject<Harness | null> }): React.ReactElement {
  const api = useSignIn();
  useImperativeHandle(refObj, () => ({
    signIn: api.signIn,
    getState: () => ({ isLoading: api.isLoading, error: api.error }),
  }), [api]);
  return React.createElement("div", null, null);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // Reset stub behavior + spy state for each test.
  signInWithEmail.mockReset();
  signInWithEmail.mockResolvedValue(undefined);
  fetchAccessToken.mockReset();
  fetchAccessToken.mockResolvedValue("jwt.payload.sig");
  navigate.mockClear();
  toastError.mockClear();
  useAuthStore.getState().clear();
  // Default window.location.search → no redirect param.
  window.history.replaceState({}, "", "/sign-in");
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

function mount(): RefObject<Harness | null> {
  const ref = createRef<Harness | null>();
  act(() => {
    root.render(React.createElement(Host, { refObj: ref }));
  });
  return ref;
}

describe("useSignIn — success flow", () => {
  it("calls signInWithEmail then fetchAccessToken then setToken BEFORE navigate (BR-04)", async () => {
    const ref = mount();
    const setTokenSpy = vi.spyOn(useAuthStore.getState(), "setToken");

    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "secret" });
    });

    expect(signInWithEmail).toHaveBeenCalledWith("u@example.com", "secret");
    expect(fetchAccessToken).toHaveBeenCalledTimes(1);
    expect(setTokenSpy).toHaveBeenCalledWith("jwt.payload.sig");
    expect(navigate).toHaveBeenCalledTimes(1);

    // Invocation order — signInWithEmail < fetchAccessToken < setToken < navigate.
    const order1 = signInWithEmail.mock.invocationCallOrder[0]!;
    const order2 = fetchAccessToken.mock.invocationCallOrder[0]!;
    const orderSet = setTokenSpy.mock.invocationCallOrder[0]!;
    const orderNav = navigate.mock.invocationCallOrder[0]!;
    expect(order1).toBeLessThan(order2);
    expect(order2).toBeLessThan(orderSet);
    expect(orderSet).toBeLessThan(orderNav);
  });

  it("navigates to /chat when no ?redirect is present", async () => {
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(navigate).toHaveBeenCalledWith({ to: "/chat" });
  });

  it("honors a same-origin ?redirect path", async () => {
    window.history.replaceState({}, "", "/sign-in?redirect=%2Fgraph%2Fnode-1");
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(navigate).toHaveBeenCalledWith({ to: "/graph/node-1" });
  });

  it("FL-AUTH-03: rejects external ?redirect and falls back to /chat", async () => {
    window.history.replaceState(
      {},
      "",
      "/sign-in?redirect=" + encodeURIComponent("https://evil.com"),
    );
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(navigate).toHaveBeenCalledWith({ to: "/chat" });
  });
});

describe("useSignIn — error flow", () => {
  it("credential error: step 1 throws INVALID_EMAIL_OR_PASSWORD → type=credential; step 2 NOT called", async () => {
    signInWithEmail.mockRejectedValueOnce(
      new AuthError("INVALID_EMAIL_OR_PASSWORD", "bad creds"),
    );
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "wrong" });
    });
    expect(ref.current!.getState().error).toEqual({ type: "credential" });
    expect(toastError).toHaveBeenCalledWith("E-mail ou senha incorretos.");
    expect(fetchAccessToken).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBe(null);
  });

  it("network error in step 1: AuthError('NETWORK') → type=network", async () => {
    signInWithEmail.mockRejectedValueOnce(
      new AuthError("NETWORK", "Network error contacting auth"),
    );
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().error).toEqual({ type: "network" });
    expect(toastError).toHaveBeenCalledWith(
      "Erro de conexão. Verifique sua rede e tente novamente.",
    );
  });

  it("step 2 NO_SESSION → type=session; no token stored", async () => {
    fetchAccessToken.mockRejectedValueOnce(new AuthError("NO_SESSION", "no cookie"));
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().error).toEqual({ type: "session" });
    expect(toastError).toHaveBeenCalledWith("Erro ao obter sessão. Tente novamente.");
    expect(useAuthStore.getState().accessToken).toBe(null);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("step 2 NO_TOKEN → type=session", async () => {
    fetchAccessToken.mockRejectedValueOnce(new AuthError("NO_TOKEN", "no token in body"));
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().error).toEqual({ type: "session" });
    expect(toastError).toHaveBeenCalledWith("Erro ao obter sessão. Tente novamente.");
  });

  it("unknown error: any other throw → type=unknown", async () => {
    signInWithEmail.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().error).toEqual({ type: "unknown" });
    expect(toastError).toHaveBeenCalledWith("Erro inesperado. Tente novamente.");
  });

  it("isLoading settles to false after a completed call (success path)", async () => {
    const ref = mount();
    expect(ref.current!.getState().isLoading).toBe(false);
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().isLoading).toBe(false);
  });

  it("isLoading settles to false after a failed call (error path)", async () => {
    signInWithEmail.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().isLoading).toBe(false);
    expect(ref.current!.getState().error).toEqual({ type: "unknown" });
  });
});
