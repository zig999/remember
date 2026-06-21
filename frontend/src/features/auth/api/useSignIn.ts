/**
 * useSignIn — Better Auth (Neon Auth) sign-in mutation hook (TC-01).
 *
 * Spec references:
 *  - docs/specs/front/features/sign-in.feature.spec.md §1, §3, §4, §6, §9
 *  - docs/specs/front/_flows/auth.flow.md FL-AUTH-03 (safe redirect)
 *  - temp/login-better-auth-plan.md §0, §3 (Better Auth 2-step contract)
 *
 * Two-step Better Auth flow (see `api/neon-auth.ts` header):
 *   1. `signInWithEmail(email, password)` — POST /sign-in/email; sets the
 *      session cookie on success.
 *   2. `fetchAccessToken()` — GET /token; returns the JWT EdDSA bearer.
 *
 * Step 2 is sequential — never invoked if step 1 fails (the spec's BR
 * "credentials:'include' must already have set the session cookie before we
 * ask for a token"). This is also reflected in error classification: a step-1
 * failure surfaces as a credential error; a step-2 failure (rare — server
 * configuration issue) surfaces as `unknown`.
 *
 * Success ordering (BR-04):
 *   stepCount: setToken BEFORE navigate — the protected layout guard reads
 *   `isFresh()` synchronously on navigation; setting the token after
 *   `navigate()` would bounce the operator back to /sign-in.
 *
 * Error classification:
 *   AuthError("INVALID_EMAIL_OR_PASSWORD") → { type: "credential" }
 *   AuthError("NETWORK")                   → { type: "network" }
 *   AuthError("NO_SESSION" | "NO_TOKEN")   → { type: "unknown" }
 *   any other thrown value                 → { type: "unknown" }
 *
 *   We keep the existing `SignInError` discriminant union (credential |
 *   network | unknown) so `SignInForm` and its tests stay unchanged — the
 *   user-visible strings already match the spec §6 mapping.
 */
import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/state/auth";
import { SIGN_IN_ERROR_MESSAGE } from "../components/SignInForm";
import type { SignInError, SignInFormValues } from "../schema";
import { signInWithEmail, fetchAccessToken, AuthError } from "./neon-auth";

export interface UseSignInReturn {
  /** Imperative submit handler — wire to RHF's `handleSubmit(onSubmit)`. */
  readonly signIn: (values: SignInFormValues) => Promise<void>;
  /** UI-02 gate — true while either Better Auth call is in flight. */
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
 * Map an `AuthError` (or any thrown value) into a `SignInError` discriminant.
 *
 * Exported for unit testing — the classifier is the seam between the
 * Better Auth code namespace and the form's display contract.
 */
export function classifySignInError(reason: unknown): SignInError {
  if (reason instanceof AuthError) {
    switch (reason.code) {
      case "INVALID_EMAIL_OR_PASSWORD":
        return { type: "credential" };
      case "NETWORK":
        return { type: "network" };
      case "NO_SESSION":
      case "NO_TOKEN":
        // The credential check passed (or this is step 2) but we couldn't
        // mint a JWT — surface as a generic "unexpected" error so the
        // operator retries. Distinct from `credential` because the
        // remediation differs (it is NOT "fix your password").
        return { type: "unknown" };
      default:
        return { type: "unknown" };
    }
  }
  // Native fetch failure that escaped neon-auth.ts (defensive) — also
  // anything else we didn't anticipate.
  if (reason instanceof TypeError) return { type: "network" };
  if (typeof reason === "object" && reason !== null) {
    const msg = (reason as { message?: unknown }).message;
    if (typeof msg === "string") {
      const lower = msg.toLowerCase();
      if (lower.includes("failed to fetch") || lower.includes("network")) {
        return { type: "network" };
      }
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
        // Step 1 — credential exchange. Throws AuthError on non-2xx.
        await signInWithEmail(values.login, values.senha);

        // Step 2 — JWT minting from the freshly-set session cookie. Sequential
        // by contract (the cookie MUST already exist).
        const jwt = await fetchAccessToken();

        // BR-04 ordering: setToken before navigate so the protected layout
        // guard sees a fresh token when it runs.
        useAuthStore.getState().setToken(jwt);

        const redirectParam = readRedirectParam();
        const target = resolveSafeRedirect(redirectParam);
        // We don't `await` — the loading state visually unmounts when the
        // destination route takes over. Awaiting would block on a route
        // that may need to load data, prolonging the spinner unnecessarily.
        void navigate({ to: target });
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
