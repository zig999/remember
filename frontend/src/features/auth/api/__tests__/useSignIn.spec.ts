/**
 * useSignIn — unit tests (TC-03).
 *
 * What we test:
 *   1. `resolveSafeRedirect` (FL-AUTH-03): the pure same-origin guard — a
 *      tight table-driven test of every relevant input class. This is the
 *      security-critical seam, so we exercise it directly without the SDK
 *      mock in the loop.
 *   2. `classifySignInError`: the discriminator that decides which message
 *      the form will show — exercised against the Stack Auth `KnownError`
 *      shape, native `TypeError`, and arbitrary throws.
 *   3. `useSignIn` integration:
 *      - Success: `setToken` is called BEFORE `navigate` (BR-04 ordering).
 *      - Credential error: `error.type === 'credential'` and `toast.error`
 *        is called with the canonical pt-BR message.
 *      - FL-AUTH-03: a `?redirect=https://evil.com` URL falls back to
 *        `/chat` when sign-in succeeds.
 *
 * Strategy:
 *   - The Stack Auth SDK is mocked entirely — we never need to reach the
 *     network. The mock owns the resolved `Result<undefined, KnownError>` so
 *     each test selects which branch to exercise.
 *   - TanStack Router's `useNavigate` is mocked to a spy — we assert on the
 *     order of `setToken` vs `navigate` via `mock.invocationCallOrder`.
 *   - `sonner`'s `toast` is mocked to spy on `error()` invocations.
 *   - We use the project's `createRoot + act` harness (no
 *     @testing-library/react in the repo) to drive a tiny host component
 *     that consumes `useSignIn` and exposes its API on a ref.
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
 * The two SDK methods + the navigate/toast spies live here so the per-test
 * `beforeEach` can clear their call records without re-mocking.
 */
type SignInResult =
  | { status: "ok"; data: undefined }
  | { status: "error"; error: unknown };

const mocks = vi.hoisted(() => {
  // Mutable holders the tests poke before each call. Returning fns keeps the
  // closure live across the hoisted boundary.
  const state = {
    nextSignInResult: { status: "ok", data: undefined } as SignInResult,
    nextAccessToken: "jwt.payload.sig" as string | null,
  };
  return {
    state,
    signInWithCredential: vi.fn(async () => state.nextSignInResult),
    getAccessToken: vi.fn(async () => state.nextAccessToken),
    navigate: vi.fn(),
    toastError: vi.fn(),
  };
});

vi.mock("../../lib/stack-app", () => ({
  // The SUT only consumes `getStackApp()` — return a tiny stub exposing the
  // two methods the hook touches. The Promise must resolve fresh each call
  // (the hook awaits it inside `signIn`), so we return a `Promise.resolve`
  // wrapped lazily.
  getStackApp: () =>
    Promise.resolve({
      signInWithCredential: mocks.signInWithCredential,
      getAccessToken: mocks.getAccessToken,
    }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, warning: vi.fn(), success: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));

// Aliases that read more naturally in the assertions below.
const signInWithCredential = mocks.signInWithCredential;
const getAccessToken = mocks.getAccessToken;
const navigate = mocks.navigate;
const toastError = mocks.toastError;

/* ---------- Imports of the SUT (after mocks) ----------------------------- */

import {
  useSignIn,
  resolveSafeRedirect,
  classifySignInError,
  type UseSignInReturn,
} from "../useSignIn";
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
  it("maps KnownErrors.EmailPasswordMismatch shape to credential", () => {
    expect(
      classifySignInError({ errorCode: "EMAIL_PASSWORD_MISMATCH", message: "x" }),
    ).toEqual({ type: "credential" });
  });

  it("maps any *PASSWORD_MISMATCH variant to credential", () => {
    expect(classifySignInError({ errorCode: "INTERNAL_PASSWORD_MISMATCH" })).toEqual({
      type: "credential",
    });
  });

  it("maps native TypeError to network", () => {
    expect(classifySignInError(new TypeError("Failed to fetch"))).toEqual({
      type: "network",
    });
  });

  it("maps message mentioning 'failed to fetch' to network even when not TypeError", () => {
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
  // Reset SDK + spy state.
  mocks.state.nextSignInResult = { status: "ok", data: undefined };
  mocks.state.nextAccessToken = "jwt.payload.sig";
  signInWithCredential.mockClear();
  getAccessToken.mockClear();
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
  it("calls setToken BEFORE navigate (BR-04 ordering)", async () => {
    const ref = mount();
    const setTokenSpy = vi.spyOn(useAuthStore.getState(), "setToken");

    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "secret" });
    });

    expect(signInWithCredential).toHaveBeenCalledWith({
      email: "u@example.com",
      password: "secret",
      noRedirect: true,
    });
    expect(setTokenSpy).toHaveBeenCalledWith("jwt.payload.sig");
    expect(navigate).toHaveBeenCalledTimes(1);

    // Invocation order — setToken must precede navigate.
    const setTokenOrder = setTokenSpy.mock.invocationCallOrder[0];
    const navigateOrder = navigate.mock.invocationCallOrder[0];
    expect(setTokenOrder).toBeDefined();
    expect(navigateOrder).toBeDefined();
    expect(setTokenOrder!).toBeLessThan(navigateOrder!);
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

  it("treats SDK success with null access token as unknown error", async () => {
    mocks.state.nextAccessToken = null;
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Erro inesperado. Tente novamente.");
    expect(ref.current!.getState().error).toEqual({ type: "unknown" });
  });
});

describe("useSignIn — error flow", () => {
  it("credential error: sets error.type='credential' AND toasts the canonical message", async () => {
    mocks.state.nextSignInResult = {
      status: "error",
      error: { errorCode: "EMAIL_PASSWORD_MISMATCH", message: "mismatch" },
    };
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "wrong" });
    });
    expect(ref.current!.getState().error).toEqual({ type: "credential" });
    expect(toastError).toHaveBeenCalledWith("E-mail ou senha incorretos.");
    expect(navigate).not.toHaveBeenCalled();
    // setToken must NOT be called on the failure path.
    expect(useAuthStore.getState().accessToken).toBe(null);
  });

  it("network error: thrown TypeError → error.type='network' + network toast", async () => {
    signInWithCredential.mockImplementationOnce(async () => {
      throw new TypeError("Failed to fetch");
    });
    const ref = mount();
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().error).toEqual({ type: "network" });
    expect(toastError).toHaveBeenCalledWith(
      "Erro de conexão. Verifique sua rede e tente novamente.",
    );
  });

  it("unknown error: any other throw → error.type='unknown' + unknown toast", async () => {
    signInWithCredential.mockImplementationOnce(async () => {
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
    // Note: capturing the *true* mid-flight value would require a test
    // harness with full act-environment support (jsdom + React 19 +
    // @testing-library/react); the project deliberately avoids that dep
    // and relies on the createRoot+act pattern. We verify the observable
    // contract — `isLoading` returns to false once the call settles — and
    // delegate the true→false transition to React's batching.
    const ref = mount();
    expect(ref.current!.getState().isLoading).toBe(false);
    await act(async () => {
      await ref.current!.signIn({ login: "u@example.com", senha: "x" });
    });
    expect(ref.current!.getState().isLoading).toBe(false);
  });

  it("isLoading settles to false after a failed call (error path)", async () => {
    signInWithCredential.mockImplementationOnce(async () => {
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
