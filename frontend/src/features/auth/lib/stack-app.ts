/**
 * stack-app — Stack Auth (Neon Auth) client singleton (TC-03).
 *
 * Spec references:
 *  - docs/specs/front/features/sign-in.feature.spec.md §10 (artifact list).
 *  - temp/login-screen-plan.md §3 (D2 = Option A — SDK client-side).
 *
 * R2 deviation note (exact SDK method signatures confirmed at implementation
 * time against the pinned version 2.8.108 — see TC-03 inference_log):
 *  - `signInWithCredential({ email, password, noRedirect })`
 *      → Promise<Result<undefined, KnownErrors["EmailPasswordMismatch"] | ...>>
 *    The Result is a tagged union `{ status: "ok" } | { status: "error", error }`.
 *  - `getAccessToken()` (inherited from `AuthLike`) → Promise<string | null>.
 *    We prefer `getAccessToken()` over `getAuthJson().accessToken` because we
 *    only need the access token bearer (the refresh token has no role in this
 *    wave — front.back.md ST-01 documents "no refresh-token logic").
 *  - We pass `noRedirect: true` so the SDK never navigates the browser away
 *    from /sign-in; TC-03 owns the navigation (FL-AUTH-03).
 *
 * tokenStore = "memory":
 *  - Per front.back.md §2, the SPA stores its bearer in sessionStorage via
 *    `useAuthStore` (the one source of truth for `lib/http.ts` Authorization
 *    injection). The SDK only needs to hold the post-sign-in tokens long
 *    enough for us to extract the access token and call `setToken`; an
 *    in-memory token store is sufficient and avoids any double-write to
 *    cookies / localStorage that could compete with `useAuthStore`.
 *
 * Lazy initialization (LAZY-INIT) via dynamic import:
 *  - The Stack Auth SDK is large (entire UI kit, providers, page handlers).
 *    Statically importing it from `useSignIn` would force every test suite
 *    that imports the route tree to load the SDK on cold start — observed
 *    to time out the `routes.spec` suite under vitest's node environment.
 *  - We therefore expose a `getStackApp(): Promise<StackClientApp>` that
 *    awaits the dynamic import on first call and memoizes the result. The
 *    hook's `signIn` handler is already async, so awaiting here costs at
 *    most one extra microtask per session (and zero on warm calls).
 *  - Production bundling: Vite splits the SDK into its own async chunk —
 *    this is the recommended pattern for owner-heavy SDKs.
 *
 * R6 — version pin:
 *  - `@stackframe/react` is pinned to an exact version in package.json (no
 *    caret, no tilde). Bumping requires re-confirming the method names above
 *    and re-running the verification gates.
 */
import type { StackClientApp as StackClientAppType } from "@stackframe/react";

/** Public type — what `getStackApp()` resolves to. */
export type StackApp = StackClientAppType;

/**
 * Read a required env var. Throws at call-site if missing — main.tsx already
 * validates these via `lib/env.ts` and renders the EnvErrorFallback before
 * any module that calls into `getStackApp` is reached, so this throw doubles
 * as a defensive guard: a code-loading-order bug would surface loudly here
 * instead of silently constructing a misconfigured SDK client.
 */
function requireEnv(name: "VITE_STACK_PROJECT_ID" | "VITE_STACK_PUBLISHABLE_CLIENT_KEY"): string {
  const value = import.meta.env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `Stack Auth env ${name} is missing — env validation in main.tsx should have caught this before first use.`,
    );
  }
  return value;
}

let memoized: Promise<StackApp> | null = null;

/**
 * Return the lazily-constructed singleton Stack Auth client. First call
 * awaits the dynamic import + constructs the client; subsequent calls
 * resolve immediately from the memoized Promise.
 */
export function getStackApp(): Promise<StackApp> {
  if (memoized === null) {
    memoized = (async () => {
      const sdk = await import("@stackframe/react");
      return new sdk.StackClientApp({
        projectId: requireEnv("VITE_STACK_PROJECT_ID"),
        publishableClientKey: requireEnv("VITE_STACK_PUBLISHABLE_CLIENT_KEY"),
        // "memory" — see header rationale. Tokens flow stackApp → useAuthStore.
        tokenStore: "memory",
        // "none" — TC-03 owns navigation via TanStack Router; the SDK must
        // not call window.location to redirect after sign-in (would race the
        // protected layout guard).
        redirectMethod: "none",
      });
    })();
  }
  return memoized;
}

/**
 * Test-only: drop the memoized client so a vi.mock can be installed for a
 * fresh import. Not exported from `features/auth/index.ts`.
 */
export function __resetStackAppForTests(): void {
  memoized = null;
}
