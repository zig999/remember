/**
 * useSignIn — Stack Auth sign-in mutation hook (TC-03).
 *
 * Spec references:
 *  - docs/specs/front/features/sign-in.feature.spec.md §1, §3, §4, §6, §9
 *  - docs/specs/front/_flows/auth.flow.md FL-AUTH-03 (safe redirect)
 *  - temp/login-screen-plan.md §3 (D2 = Option A — SDK client-side)
 *
 * Why a custom hook (not TanStack Query):
 *  - There is no BFF endpoint to cache; Stack Auth manages its own HTTP. A
 *    `useMutation` would buy nothing here — we already own the error
 *    classification + the post-success side effects.
 *
 * Success flow (sign-in.feature.spec.md §3 ST-2 → ST-3):
 *  1. `isLoading = true`, clear local error.
 *  2. `stackApp.signInWithCredential({ email, password, noRedirect: true })`.
 *  3. On `status === "ok"`: read the access token via `stackApp.getAccessToken()`.
 *  4. `useAuthStore.getState().setToken(jwt)` — MUST run before any navigation
 *     (front.back.md BR-04: the protected layout guard reads `isFresh()`
 *     synchronously on navigation; setting the token after `navigate()` would
 *     bounce the operator back to /sign-in).
 *  5. Read `?redirect` from search; validate same-origin (FL-AUTH-03) — fall
 *     back to `/chat` for any unsafe value.
 *  6. Navigate.
 *
 * Error flow (sign-in.feature.spec.md §6):
 *  - Classify the rejection into `credential | network | unknown`.
 *  - `credential` — Stack Auth `KnownError` with `errorCode` containing the
 *    string "EMAIL_PASSWORD_MISMATCH" / "PASSWORD" / "EMAIL", OR
 *    `signInWithCredential` returning `{ status: "error" }` (no throw).
 *  - `network` — `TypeError` whose message hints at fetch failure (the SDK
 *    wraps fetch but propagates these as native TypeErrors in Chromium /
 *    Firefox / WebKit).
 *  - `unknown` — anything else.
 *  - Set local error AND emit `toast.error(message)` per §2 UI-03 (the inline
 *    alert + a secondary toast — see SIGN_IN_ERROR_MESSAGE in SignInForm).
 */
import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/state/auth";
import { SIGN_IN_ERROR_MESSAGE } from "../components/SignInForm";
import type { SignInError, SignInFormValues } from "../schema";
import { getStackApp } from "../lib/stack-app";

export interface UseSignInReturn {
  /** Imperative submit handler — wire to RHF's `handleSubmit(onSubmit)`. */
  readonly signIn: (values: SignInFormValues) => Promise<void>;
  /** UI-02 gate — true while the SDK call is in flight. */
  readonly isLoading: boolean;
  /** UI-03 gate — the discriminated error category surfaced to the form. */
  readonly error: SignInError | null;
  /** Imperative clear, e.g. after the user edits a field. */
  readonly clearError: () => void;
}

/**
 * Read-only access to the raw search string. We don't go through
 * `useSearch()` here because:
 *  - `signInRoute` is the route on which this hook is mounted; `useSearch`
 *    would require typing the route id and re-validating the search shape
 *    (which we don't need — we're parsing a single optional param).
 *  - During tests we can stub `window.location.search` directly without
 *    standing up an entire TanStack Router fixture.
 */
function readRedirectParam(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  } catch {
    return null;
  }
}

/**
 * FL-AUTH-03 safe-redirect validation.
 *
 * A value is "safe" only if it is a same-origin RELATIVE path:
 *   - starts with `/`
 *   - does NOT start with `//` (protocol-relative URLs are off-origin)
 *   - does NOT contain `://`     (any embedded scheme is off-origin)
 *   - does NOT contain `\`        (defensive — IE/Edge legacy parsers)
 *
 * Anything else falls back to `/chat`. We never `URL`-construct the candidate
 * with an arbitrary base because that would silently normalize `//evil.com`
 * into `https://evil.com`.
 */
export function resolveSafeRedirect(candidate: string | null): "/chat" | string {
  if (candidate === null) return "/chat";
  if (candidate.length === 0) return "/chat";
  if (candidate.length > 2048) return "/chat"; // sanity cap; URLs >2KB are pathological
  if (!candidate.startsWith("/")) return "/chat";
  if (candidate.startsWith("//")) return "/chat";
  if (candidate.includes("://")) return "/chat";
  if (candidate.includes("\\")) return "/chat";
  return candidate;
}

/**
 * Classify an SDK rejection into a `SignInError` discriminant.
 *
 * The SDK exposes credential failures both as throws (legacy paths) and as
 * `Result<undefined, KnownError>` (current path). Callers must invoke
 * `classifySignInError` on whichever surface produced the failure.
 */
export function classifySignInError(reason: unknown): SignInError {
  // KnownError-shaped: { errorCode: "EMAIL_PASSWORD_MISMATCH", ... }
  if (typeof reason === "object" && reason !== null) {
    const obj = reason as { errorCode?: unknown; message?: unknown; name?: unknown };
    const code = typeof obj.errorCode === "string" ? obj.errorCode.toUpperCase() : "";
    if (
      code === "EMAIL_PASSWORD_MISMATCH" ||
      code.includes("PASSWORD_MISMATCH") ||
      code.includes("INVALID_CREDENTIAL")
    ) {
      return { type: "credential" };
    }
    // Native fetch failures surface as TypeError("Failed to fetch") / similar.
    if (obj.name === "TypeError") {
      return { type: "network" };
    }
    const msg = typeof obj.message === "string" ? obj.message.toLowerCase() : "";
    if (
      msg.includes("network") ||
      msg.includes("failed to fetch") ||
      msg.includes("load failed")
    ) {
      return { type: "network" };
    }
  }
  return { type: "unknown" };
}

export function useSignIn(): UseSignInReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SignInError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(
    async (values: SignInFormValues): Promise<void> => {
      setIsLoading(true);
      setError(null);

      let classified: SignInError | null = null;
      try {
        const stackApp = await getStackApp();
        const result = await stackApp.signInWithCredential({
          email: values.login,
          password: values.senha,
          // SDK redirect is off — TC-03 owns navigation (R4 of plan §3).
          noRedirect: true,
        });

        if (result.status === "error") {
          classified = classifySignInError(result.error);
        } else {
          // Success path: extract the access token AFTER signInWithCredential
          // has resolved, then push it into useAuthStore BEFORE navigation.
          const accessToken = await stackApp.getAccessToken();
          if (accessToken === null || accessToken.length === 0) {
            // The SDK reported success but produced no token — treat as
            // unknown (we cannot enter the protected layout without a JWT).
            classified = { type: "unknown" };
          } else {
            // BR-04 ordering: setToken first so isFresh() is true when the
            // protected layout guard runs.
            useAuthStore.getState().setToken(accessToken);

            const redirectParam = readRedirectParam();
            const target = resolveSafeRedirect(redirectParam);
            // navigate() may return a Promise in TS; we don't await it —
            // the loading state visually unmounts when the destination route
            // takes over. Awaiting would block on a route that may need to
            // load data, prolonging the spinner unnecessarily.
            void navigate({ to: target });
          }
        }
      } catch (thrown) {
        classified = classifySignInError(thrown);
      } finally {
        setIsLoading(false);
      }

      if (classified !== null) {
        setError(classified);
        toast.error(SIGN_IN_ERROR_MESSAGE[classified.type]);
      }
    },
    [navigate],
  );

  return { signIn, isLoading, error, clearError };
}
