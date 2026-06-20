/**
 * SignInPage — route component for /sign-in (TC-03).
 *
 * Spec references:
 *  - docs/specs/front/features/sign-in.feature.spec.md §2 (UI-01..04)
 *  - temp/login-screen-plan.md §7 (Files to create — SignInPage at the route)
 *
 * Composition:
 *   <SignInPanel>
 *     <SignInForm onSubmit={useSignIn().signIn} ... />
 *   </SignInPanel>
 *
 * `sessionExpired` is derived from `?reason=session_expired` (the BR-04 guard
 * redirects there when `isFresh()` rejects). We read the raw `window.location`
 * search instead of going through TanStack Router's typed `useSearch` because:
 *  - signInRoute does not (yet) declare a `validateSearch` for `reason` —
 *    keeping that off the route avoids forcing a one-off search schema for a
 *    single optional informational flag.
 *  - Reading directly from `window.location` is hermetic enough for unit
 *    tests (each test installs its own location).
 */
import { useMemo, type ReactElement } from "react";
import { SignInPanel } from "@/features/auth/components/SignInPanel";
import { useSignIn } from "@/features/auth/api/useSignIn";

function readSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("reason") === "session_expired";
  } catch {
    return false;
  }
}

export function SignInPage(): ReactElement {
  const { signIn, isLoading, error } = useSignIn();
  // `useMemo` so re-renders during the loading state do not re-parse the URL
  // (the URL does not change while we are on /sign-in).
  const sessionExpired = useMemo(readSessionExpired, []);

  return (
    <SignInPanel
      onSubmit={signIn}
      isSubmitting={isLoading}
      error={error}
      sessionExpired={sessionExpired}
    />
  );
}
