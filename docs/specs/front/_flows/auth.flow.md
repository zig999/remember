# Auth -- Flow Spec

> Flow ID: FLOW-AUTH-01 | Objective: User authenticates and accesses protected areas of Remember | Status: draft | Layer: permanent
> Domains involved: none (client-side via Better Auth — direct fetch to Neon Auth) + front.md §5 (global error handling for post-auth BFF rejections)

---

## 1. Involved Features

> Every feature listed here must have a corresponding .feature.spec.md.

| # | Route | Feature Spec | Primary Domain |
|---|-------|-------------|----------------|
| 1 | `/sign-in` | `features/sign-in.feature.spec.md` | Auth (Better Auth — direct fetch to Neon Auth; no BFF domain) |
| 2 | `/chat` | `features/chat.feature.spec.md` | chat |

---

## 2. Happy Path

```mermaid
flowchart TD
  A[User accesses any protected route] --> B{JWT in useAuthStore — valid?}
  B -->|yes| C[Protected route mounts normally]
  B -->|no| D[[Redirect to /sign-in?reason=session_expired or /sign-in]]
  D --> E[/sign-in mounts — CRT animation plays]
  E --> F[User fills Login + Senha and clicks Entrar]
  F --> G[[Better Auth: POST /sign-in/email then GET /token]]
  G --> H{Auth result}
  H -->|success| I[[setToken called — JWT stored in useAuthStore]]
  I --> J[[router.navigate to redirect param or /chat]]
  J --> C
  H -->|credential error| K[UI-03 — inline error + toast]
  K --> F
  C --> L([End])
```

**Detailed steps:**

1. User navigates to a protected route (e.g., `/chat`, `/graph`, or any route under the `protectedLayoutRoute`).
2. The `protectedLayoutRoute`'s `beforeLoad` checks `useAuthStore.isFresh()`:
   - If token is present and `exp` > now: route mounts (step 8).
   - If token is absent or expired: throws `redirect({ to: "/sign-in", search: { reason: "session_expired" } })` (or plain `/sign-in` if the user was never logged in).
3. `/sign-in` mounts. `AmbientBackdrop` is already rendering from `__root`. The CRT power-on animation plays (`transitionCrtPowerOn`).
4. If `?reason=session_expired` is in the URL, the inline notice "Sua sessão expirou. Faça login novamente." is shown (UI-01 conditional).
5. User fills in "Login" (email) and "Senha" fields.
6. On submit, client-side Zod validation runs:
   - Invalid: inline field errors shown (UI-01, no network call).
   - Valid: proceed to step 7.
7. `useSignIn` mutation fires → Better Auth 2-step:
   - Step 1: `POST {VITE_NEON_AUTH_URL}/sign-in/email` with `credentials:'include'` (sets HttpOnly session cookie).
   - Step 2 (on step 1 success): `GET {VITE_NEON_AUTH_URL}/token` with `credentials:'include'` → `{ token: "<JWT EdDSA>" }`.
   - Submitting state (UI-02): fields disabled, button shows spinner + "Entrando…" throughout both steps.
8. Step 2 resolves: `{ token: "<JWT>" }` received:
   - `useAuthStore.setToken(jwt)` called.
   - `router.navigate` to `?redirect` param (if present and safe, same-origin) or `/chat`.
9. Protected route mounts with a fresh JWT in the store. BFF requests include `Authorization: Bearer <jwt>` via `http.ts`.

---

## 3. Alternative Flows

| # | Condition | From | To | Behavior |
|---|-----------|------|----|----------|
| 3a | Credential error (step 1 returns 401 `INVALID_EMAIL_OR_PASSWORD`) | `/sign-in` UI-02 | `/sign-in` UI-03 | Inline error "E-mail ou senha incorretos." + toast.error; form re-enabled; step 2 never called; no navigation |
| 3b | Network error (offline, CORS failure, either step fails) | `/sign-in` UI-02 | `/sign-in` UI-03 | Inline error "Erro de conexão. Verifique sua rede e tente novamente." + toast.error; form re-enabled |
| 3c | JWT expires mid-session (BFF returns 401) | Any protected route | Retry or `/sign-in?reason=session_expired` | `lib/http.ts` (BR-19) attempts silent refresh via `GET {VITE_NEON_AUTH_URL}/token` (credentials:'include'). If session cookie valid → new JWT → retry original request (no redirect). If cookie expired too → clear token + redirect to `/sign-in?reason=session_expired` |
| 3d | User accesses `/sign-in` with a valid fresh JWT | `/sign-in` | `/chat` | `beforeLoad` on sign-in route (or on mount) detects valid token → redirects directly to `/chat` (or `?redirect` target). No sign-in form shown. |
| 3e | Client-side form validation failure (e.g., blank email) | `/sign-in` UI-01 | `/sign-in` UI-01 | RHF field errors shown inline; no SDK call; form remains in idle state with validation messages |
| 3f | `?redirect` param points to an external URL | post-auth | `/chat` | Safety guard: `redirect` param validated as a same-origin relative path; external URLs are discarded and default `/chat` is used |
| 3g | `prefers-reduced-motion` active | `/sign-in` mount | `/sign-in` UI-01 | CRT phases 1–3 skipped; panel appears via opacity fade-in only (WCAG 2.2 AA compliant) |

**State transition table:**

| Current State | Event | Condition | Next State | Action |
|---------------|-------|-----------|------------|--------|
| Any protected route | `beforeLoad` fires | `isFresh() === false` | `/sign-in` | redirect |
| `/sign-in` mounted | `isFresh() === true` | — | `/chat` or `?redirect` | redirect (already logged in) |
| `/sign-in` UI-01 | Form submitted | client validation passes | `/sign-in` UI-02 | SDK call in flight |
| `/sign-in` UI-01 | Form submitted | client validation fails | `/sign-in` UI-01 | inline-error |
| `/sign-in` UI-02 | Step 2 success (JWT received) | — | `/sign-in` UI-04 → unmount | `setToken` + redirect |
| `/sign-in` UI-02 | Step 1 credential error (`INVALID_EMAIL_OR_PASSWORD`) | — | `/sign-in` UI-03 | inline-error + toast-error |
| `/sign-in` UI-02 | Network error (step 1 or step 2) | — | `/sign-in` UI-03 | inline-error + toast-error |
| `/sign-in` UI-03 | User edits field | — | `/sign-in` UI-01 | inline-error cleared |
| Any protected route | BFF returns 401 | token expired mid-session | Retry (if cookie valid) OR `/sign-in?reason=session_expired` | BR-19 silent refresh → retry; if refresh fails → redirect + clear token |

---

## 4. Navigation Rules (FL)

### FL-AUTH-01 — Guard: authenticated user bypasses sign-in

**Condition:** user navigates to `/sign-in` with a fresh JWT in `useAuthStore`.
**Behavior:** `beforeLoad` (or a `useEffect` on mount) detects `isFresh() === true` and immediately calls `router.navigate({ to: "/chat" })` (or the `?redirect` target).
**Fallback:** if `isFresh()` throws (store corrupt), treat as unauthenticated and render the sign-in form normally.

### FL-AUTH-02 — Guard: unauthenticated user blocked from protected routes

**Condition:** user navigates to any route under `protectedLayoutRoute` without a fresh JWT.
**Behavior:** `protectedLayoutRoute.beforeLoad` calls `useAuthStore.isFresh()`. If false, throws `redirect({ to: "/sign-in", search: previousRoute ? { reason: "session_expired" } : {} })`.
**Fallback:** if the redirect itself fails (router error), render the sign-in form at whatever URL the user is on, with a generic notice.

### FL-AUTH-03 — Safe redirect after sign-in

**Condition:** `?redirect` search param present in `/sign-in` URL.
**Behavior:** after successful sign-in, navigate to the `redirect` param value **only if** it is a relative same-origin path (starts with `/` and does not contain `://`). Otherwise, navigate to `/chat`.
**Fallback:** if param is absent or unsafe, navigate to `/chat`.

### FL-AUTH-04 — Mid-session expiry handling (with silent refresh)

**Condition:** BFF returns `AUTH_UNAUTHORIZED` (401) during any protected-area API call.
**Behavior:** `lib/http.ts` (BR-19) attempts `GET {VITE_NEON_AUTH_URL}/token` with `credentials:'include'` once. If a new JWT is returned, `useAuthStore.setToken(jwt)` is called and the original request is retried. If the refresh call also fails (session cookie expired), `useAuthStore` is cleared and the router navigates to `/sign-in?reason=session_expired`.
**Fallback:** if the router navigate fails, the page is left in its error state; the user must manually navigate to `/sign-in`.

---

## 5. Deep Links and Alternative Entries

| Direct route | Precondition | Behavior if not met |
|-------------|--------------|---------------------|
| `/sign-in` | — (public route, no auth required) | Always renders sign-in |
| `/sign-in?reason=session_expired` | — | Renders sign-in with expired-session notice |
| `/sign-in?redirect=/graph` | — | After sign-in, navigates to `/graph` (if safe) |
| `/chat` | Fresh JWT in `useAuthStore` | Redirect → `/sign-in` |
| Any other protected route | Fresh JWT in `useAuthStore` | Redirect → `/sign-in` |

---

## 6. Data Persisted Between Screens

| Data | From | To | Mechanism |
|------|------|----|-----------|
| JWT (access token) | `/sign-in` (on `setToken`) | All protected routes | `sessionStorage["remember.auth.token"]` (via `useAuthStore`) |
| Redirect target | Protected route `beforeLoad` | `/sign-in` | URL search param `?redirect=<path>` |
| Theme preference | All routes | All routes | `localStorage["remember.theme"]` (via `useThemeStore`) |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Auth flow: guard, sign-in, redirect, mid-session expiry, FL-AUTH-01 through FL-AUTH-04. | sdd_front |
| 1.1.0 | 2026-06-21 | Front Spec Agent | minor | Auth layer replaced: Stack Auth SDK → Better Auth 2-step flow. §1 domain note updated. Flowchart updated (2-step sign-in). Alt flow 3a/3b/3c updated (Better Auth errors; silent refresh in 3c). State transition table updated. FL-AUTH-04 updated (BR-19 silent refresh before redirect). | sdd_front |
