---
title: Shell pending curation read and the frontend's token-renewal code
summary: The area the pending-read renewal scope lands in, which is one shell hook in frontend/src/shell/api that has no renewal,
  beside four request wrappers that each carry their own copy of the 401 renew-and-retry.
area:
- frontend/src/shell
- frontend/src/lib
- frontend/src/state
- frontend/src/features/auth/api
- frontend/src/features/curation/api
- frontend/src/features/entities/api
- frontend/src/features/ingest/api
modules:
- name: shell-status-api
  path: frontend/src/shell/api/use-shell-status.ts
  role: touched
- name: app-shell
  path: frontend/src/shell/AppShell.tsx
  role: adjacent
- name: auth-store
  path: frontend/src/state/auth.ts
  role: depends-on
- name: neon-auth-client
  path: frontend/src/features/auth/api/neon-auth.ts
  role: depends-on
- name: http-client
  path: frontend/src/lib/http.ts
  role: adjacent
- name: curation-request
  path: frontend/src/features/curation/api/_request.ts
  role: adjacent
- name: query-client
  path: frontend/src/lib/query-client.ts
  role: adjacent
conventions:
- statement: A 401 is answered once by a silent refresh that calls fetchAccessToken and stores the result with setToken. On
    failure the wrapper calls clear() and then redirects to /sign-in?reason=session_expired. A `__retried` flag stops a second
    attempt.
  seen_at: frontend/src/lib/http.ts
- statement: Each request wrapper keeps its own module-level redirectImpl, which uses window.location.replace and has a __set...RedirectForTests
    setter, so tests can capture the redirect.
  seen_at: frontend/src/features/curation/api/_request.ts
- statement: Server reads are TanStack Query hooks with a typed queryKey, a refetchInterval, retry false, and `enabled` gated
    on the token.
  seen_at: frontend/src/shell/api/use-shell-status.ts
- statement: Token state lives in the zustand store, which persists to sessionStorage. Code outside React reads it with useAuthStore.getState().
  seen_at: frontend/src/state/auth.ts
- statement: Tests sit in a sibling __tests__ directory as *.spec.ts(x), and the session-expiry behaviour of a wrapper has
    its own spec file.
  seen_at: frontend/src/features/entities/api/__tests__/edit-request-session.spec.ts
- statement: The source carries no comments, and the project forbids fetch inside components. The shell hook is the existing
    exception that calls fetch directly inside an api/ hook.
  seen_at: frontend/src/shell/api/use-shell-status.ts
must_not_duplicate:
- what: fetchAccessToken, the call to the identity provider's /token endpoint that sends the session cookie (credentials include).
    It throws AuthError on failure.
  at: frontend/src/features/auth/api/neon-auth.ts
- what: The auth store's setToken and clear. clear() removes the stored token from the store and from sessionStorage.
  at: frontend/src/state/auth.ts
- what: The sign-in address and reason string "/sign-in?reason=session_expired", already used by the other wrappers.
  at: frontend/src/lib/http.ts
- what: The trySilentRefresh and redirectImpl pattern, already copied into the curation, entities and ingest wrappers. The
    pending read should follow it, and a fifth full copy should be a deliberate choice.
  at: frontend/src/features/curation/api/_request.ts
risks:
- risk: getJson in the shell hook never inspects the status. A 401 body becomes `data` with no total, so the count shows 0
    without any signal. Adding the single renew-and-retry changes what the count shows when the token has expired.
  consumers:
  - frontend/src/shell/AppShell.tsx
  - frontend/src/shell/__tests__/AppShell.spec.tsx
- risk: The /health read uses the same getJson helper but must stay without a bearer and must not trigger renewal. Changing
    getJson for the pending read could alter that request.
  consumers:
  - frontend/src/shell/AppShell.tsx
  - frontend/src/shell/Footer.tsx
- risk: The query key is shell/curation-count and its queryFn closes over a token captured at render time. After renewal the
    retry must use the fresh token from the store, or it repeats the stale bearer and the 401.
  consumers:
  - frontend/src/shell/api/use-shell-status.ts
- risk: Several wrappers already renew on 401 and redirect. A concurrent shell renewal on the same expired token may race
    with a page's own renewal, and each would call clear() and redirect.
  consumers:
  - frontend/src/lib/http.ts
  - frontend/src/features/curation/api/_request.ts
  - frontend/src/features/entities/api/_edit-request.ts
  - frontend/src/features/ingest/api/_request.ts
- risk: Nothing in the shell tests covers use-shell-status. The shell specs never mock fetch for the pending read, so the
    new behaviour has no existing harness and the AppShell specs may exercise it implicitly.
  consumers:
  - frontend/src/shell/__tests__/AppShell.spec.tsx
  - frontend/src/shell/__tests__/Header.spec.tsx
sources:
- intake/scope.md
---

## What it is
This is the frontend territory the pending-read renewal lands in.
The pending curation read is `useCurationCount` in the shell's api hook.
It calls a local `getJson` that attaches the bearer from the store and returns the body without checking the status.
Renewal is already implemented four times, in `lib/http.ts` and in the curation, entities and ingest request wrappers.

## Notes
The surveyor did not open the ingest and entities wrappers in full.
The health read in the same file carries no bearer, and the scope leaves it unchanged.
`lib/query-client.ts` routes an `EnvelopeError` through `routeError`, whose `redirect` action also calls `clear()` and navigates.
How a renewal failure surfaces from the shell hook is an open design point for the tasks.
