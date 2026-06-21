# Sign-In -- Feature Spec

> Route: `/sign-in` | Related flows: `_flows/auth.flow.md`
> Consumed domains: **none (client-side auth via Better Auth — no BFF endpoints)** | Status: draft | Layer: permanent

> **Normative brief:** `temp/login-better-auth-plan.md` (authoritative). Supersedes `temp/login-screen-plan.md` for auth implementation decisions. R1–R6 from the previous wave remain in effect; only the auth layer changes.
>
> **Deviation note (D5 / R5):** this feature introduces a layout refactor that deviates from `front.md §2` (single root layout), `§3.1` (guard in `__root.beforeLoad`), `§5.1` (ErrorBoundary in root), and `front.back.md BR-04` (guard in `__root`). Owner-authorized. Reconcile `front.md` on the next `/u-improve` wave.
>
> **Deviation detail:**
> - `AmbientBackdrop` moves from `AppShell` → `__root` so both protected and unprotected routes share the backdrop.
> - The JWT guard (`beforeLoad`) moves from `__root` → a **pathless layout route** (`id="protected"`) that wraps all currently protected routes. `/sign-in` is a direct child of `RootRoute` (outside the protected layout), receiving only `AmbientBackdrop` + `AppErrorBoundary` + `AppToaster`.
> - `AppShell` no longer renders `<AmbientBackdrop/>`.
>
> **Auth approach (DA = fetch cru, DB = direto, DC = refresh silencioso):** SPA calls the Better Auth endpoints directly (no SDK, no proxy). Flow is 2-step: (1) `POST {VITE_NEON_AUTH_URL}/sign-in/email` with `credentials:'include'` to set the HttpOnly session cookie, then (2) `GET {VITE_NEON_AUTH_URL}/token` with `credentials:'include'` to obtain the JWT EdDSA. JWT passed to `useAuthStore.setToken(jwt)`. A silent refresh (DC) is supported: on a 401 from the BFF, `lib/http.ts` re-calls `GET /token` once using the long-lived session cookie before redirecting to `/sign-in`. The BFF's auth middleware (JWKS/EdDSA) is unchanged.
>
> **Better Auth contract (PROVEN, 2026-06-21):** `POST {base}/sign-in/email {email, password}` with `credentials:'include'` → HTTP 200 + sets cookie `__Secure-neon-auth.session_token` (SameSite=None; Secure; Partitioned; Max-Age 7d). Then `GET {base}/token` with `credentials:'include'` → `{ token: "<JWT EdDSA>" }` (exp = iat + 900s). The JWT is what the BFF validates via JWKS. The session cookie is never sent to the BFF.

---

## 1. Consumed Endpoints

> No BFF endpoints are consumed by this feature. Authentication is performed client-side via direct `fetch` calls to the Better Auth (Neon Auth) service. The BFF's JWKS verification middleware is unchanged and requires no new endpoint.

| Domain | operationId | Purpose |
|--------|-------------|---------|
| — | — | No BFF calls. `features/auth/api/neon-auth.ts` calls `POST {VITE_NEON_AUTH_URL}/sign-in/email` and `GET {VITE_NEON_AUTH_URL}/token` directly (raw fetch, credentials:'include'). |

---

## 2. Feature States (UI)

### UI-01 — idle

**Entry condition:** `/sign-in` mounted. No form submission in progress. Includes: cold load, arrival after redirect from a protected route, and after a failed sign-in attempt where the error has been acknowledged.

**What to display:**
- Full-screen `AmbientBackdrop` behind everything (rendered by `__root`).
- Center of viewport: `GlassSurface variant="panel"` wrapped in the CRT power-on entrance animation (`transitionCrtPowerOn`). The `GlassSurface`'s own entrance (`animate` prop) is **disabled** (`animate={false}`) to avoid competing with the CRT motion (R4).
- Inside the panel, stagger-revealed content (Framer Motion `staggerContainer` + `listItem`):
  - Heading: "Bem-vindo ao Remember," in `text-heading` (Space Grotesk), `text-content`.
  - Sub-copy: "sua memória virtual." in `text-body-lg` (Space Mono), `text-body`.
  - Form (React Hook Form):
    - Field "Login" — `<label>` + `<Input type="email">` (shadcn/ui `Input`).
    - Field "Senha" — `<label>` + `<Input type="password">`.
    - Button "Entrar" (shadcn/ui `Button`, `variant="default"`).
  - Session-expired notice (conditional): if `?reason=session_expired` is present in the URL, display an inline notice "Sua sessão expirou. Faça login novamente." in `text-caption text-muted` above the form — renders in UI-01 only, no distinct state.
- No header, no footer, no command palette — chrome is absent on this route.

### UI-02 — submitting

**Entry condition:** form submitted, Better Auth 2-step call in progress (step 1 `POST /sign-in/email` or step 2 `GET /token`).

**What to display:**
- All form fields disabled.
- Button "Entrar" replaced by loading state: `Button` with `disabled` + spinner icon (`Loader2` from `lucide-react`, `animate-spin`) + text "Entrando…".
- No error message visible (clears any previous error).

### UI-03 — error (credential / network)

**Entry condition:** step 1 returns 401 (credential error) or either step returns a network error.

**What to display:**
- Form fields re-enabled.
- Inline error message below the form (above the button) in `text-body-sm text-danger`, linked to the form root via `role="alert"`. Message variants:
  - Credential error (`INVALID_EMAIL_OR_PASSWORD`): "E-mail ou senha incorretos."
  - Session error (step 2 `GET /token` fails after step 1 success — rare): "Erro ao obter sessão. Tente novamente."
  - Network error: "Erro de conexão. Verifique sua rede e tente novamente."
- A `toast.error(...)` via sonner is also fired (secondary notification — does not replace the inline message).
- Button returns to "Entrar" (enabled).

### UI-04 — success (redirecting)

**Entry condition:** Both Better Auth steps succeeded, JWT obtained from `GET /token`, `useAuthStore.setToken(jwt)` called.

**What to display:**
- Button shows brief success state (optional: "Entrando…" keeps spinner or becomes a checkmark for ~300 ms) then the router navigates automatically.
- User sees this state for < 500 ms before the redirect completes — no loading screen required.
- Navigation target: `?redirect` search param value if present and safe (same-origin path), otherwise `/chat` (default).

---

## 3. State Transition Table

| From | Trigger | To | Side Effect |
|------|---------|----|-------------|
| — | `/sign-in` mounted | UI-01 (idle) | CRT power-on entrance animation plays; if `?reason=session_expired`, show session-expired notice |
| UI-01 | Form submitted (valid) | UI-02 (submitting) | `signInWithEmail(email, password)` called (step 1); fields disabled |
| UI-01 | Form submitted (invalid client-side) | UI-01 (idle, field errors shown) | RHF field errors displayed inline; no network call |
| UI-02 | Step 1 success (cookie set) | UI-02 (submitting) | `fetchAccessToken()` called (step 2); still loading |
| UI-02 | Step 2 success (JWT received) | UI-04 (success) | `useAuthStore.setToken(jwt)` called; router navigates to `?redirect` or `/chat` |
| UI-02 | Step 1 credential error (`INVALID_EMAIL_OR_PASSWORD`) | UI-03 (error) | Inline credential error + `toast.error(...)` fired; fields re-enabled |
| UI-02 | Step 1 or step 2 network error | UI-03 (error) | Inline network error + `toast.error(...)` fired; fields re-enabled |
| UI-02 | Step 2 session error (`NO_SESSION` / `NO_TOKEN`) | UI-03 (error) | Inline session error + `toast.error(...)` fired; fields re-enabled |
| UI-03 | User edits any field | UI-01 (idle) | Inline error cleared (reset on first keystroke via `onChange` or on re-submit) |
| UI-03 | Form re-submitted | UI-02 (submitting) | Same as UI-01 → submit |
| UI-04 | `router.navigate()` fires | — (feature unmounts) | Route transition to protected area |

---

## 4. Requests, Order and Cache

> This feature makes no BFF calls. `features/auth/api/neon-auth.ts` calls the Better Auth service directly. There is no TanStack Query cache entry for sign-in — the mutation is a `useMutation` with no query key.

| # | Call | Execution | Priority | Cache TTL | Notes |
|---|------|-----------|----------|-----------|-------|
| 1 | `POST {VITE_NEON_AUTH_URL}/sign-in/email` | sequential (on form submit, step 1) | critical | n/a | `credentials:'include'`; body `{ email, password }` |
| 2 | `GET {VITE_NEON_AUTH_URL}/token` | sequential (after step 1 success, step 2) | critical | n/a | `credentials:'include'`; returns `{ token: "<JWT>" }` |

**Execution order:** step 1 MUST complete successfully before step 2 is called. On step 1 failure, step 2 is never called.

**No response transforms.** The JWT string is extracted from `body.token` and passed directly to `useAuthStore.setToken()`. No reshape required.

**DC — Silent refresh (post-sign-in, mid-session):** When `lib/http.ts` receives a 401 from the BFF, it calls `fetchAccessToken()` once (step 2 only — the session cookie is still valid for up to 7 days). If a fresh JWT is returned, the store is updated and the failed request is retried once. If step 2 also fails (`NO_SESSION`), the store is cleared and the router redirects to `/sign-in?reason=session_expired`. This logic lives in `lib/http.ts`, not in this feature.

---

## 5. Input Validations

> Technical constraints (required, minLength, maxLength, pattern, enum) are defined in the Zod schema (`src/features/auth/schema.ts`). §5 specifies only UX behavior.

| Field | User message | When to validate |
|-------|--------------|------------------|
| `login` (email) | "Informe um e-mail válido." | `blur` (after first touch) + `submit` |
| `senha` (password) | "Informe a senha." | `blur` (after first touch) + `submit` |

> Schema (Zod v4 — informational, not duplicated here):
> ```ts
> z.object({
>   login: z.email("Informe um e-mail válido."),
>   senha: z.string().min(1, "Informe a senha."),
> })
> ```
> Field name `login` matches the UI label "Login"; it maps to the `email` field in the Better Auth API body (D3 — unchanged from previous wave).

---

## 6. API Error → UI Mapping

> The Better Auth calls throw `AuthError` instances (see `neon-auth.ts`). These are caught in `useSignIn`'s `onError` handler. There are no BFF envelope codes during sign-in itself.

| Error type | Display | User message | Action |
|------------|---------|--------------|--------|
| `AuthError.code === "INVALID_EMAIL_OR_PASSWORD"` (step 1 → HTTP 401) | inline + toast | "E-mail ou senha incorretos." | Dismiss (user edits form) |
| `AuthError.code === "NO_SESSION"` (step 2 → HTTP 401) | inline + toast | "Erro ao obter sessão. Tente novamente." | Dismiss (user retries) |
| `AuthError.code === "NO_TOKEN"` (step 2 → HTTP 200 but no token in body) | inline + toast | "Erro ao obter sessão. Tente novamente." | Dismiss (user retries) |
| Network / fetch error (offline, CORS failure, timeout) | inline + toast | "Erro de conexão. Verifique sua rede e tente novamente." | Dismiss (user retries) |
| `AuthError.code === "AUTH_FAILED"` (step 1 → any non-401 HTTP error) | inline + toast | "Erro inesperado. Tente novamente." | Dismiss |
| `AUTH_UNAUTHORIZED` from BFF (post-redirect, if token rejected) | redirect | — | → `/sign-in?reason=session_expired` (handled globally by `front.md §5`) |

> **Note:** BFF error codes (`AUTH_*`, `SYSTEM_*`) do not appear during sign-in itself (there is no BFF call at sign-in time). They appear after redirect to protected areas if the JWT is rejected. The global handler in `front.md §5` covers those cases. Mid-session refresh (DC) is handled by `lib/http.ts` before the redirect fires.

---

## 7. Shared Components Used

> Components from `src/components/` (global shared layer) only.

| Component | Spec file | Feature-specific props | Notes |
|-----------|-----------|----------------------|-------|
| `GlassSurface` | `components/GlassSurface.component.spec.md` | `level="panel"`, `animate={false}` | `animate={false}` disables GlassSurface's own entrance; CRT wrapper handles the entrance instead (R4) |
| `Button` | none (shadcn/ui owned primitive) | `disabled={isSubmitting}` | Loading state adds `Loader2` icon inline |
| `Input` | none (shadcn/ui owned primitive) | `type="email"` / `type="password"`, `aria-invalid`, `aria-describedby` | Standard shadcn/ui Input |
| `Label` | none (shadcn/ui owned primitive) | `htmlFor` binding | One per field |

### Component adapters

**GlassSurface**
| Component prop | API source | Transform |
|---------------|-----------|-----------|
| `level` | feature constant | `"panel"` — static string, no API source |
| `animate` | feature constant | `false` — static boolean, disables entrance |
| `className` | feature layout | `"w-full max-w-md"` — layout class applied by `SignInPanel` |

**Button: direct-map** — all props map directly (no rename or derivation).

**Input: direct-map** — all props map directly.

**Label: direct-map** — all props map directly.

---

## 8. Feature Accessibility

- [x] Every `<Input>` has an associated `<label htmlFor="…">` (not `aria-label` alone — visible label required)
- [x] Invalid inputs set `aria-invalid="true"` on blur/submit validation failure
- [x] Error messages linked via `aria-describedby` on the corresponding input
- [x] Inline form-level error (credential failure) uses `role="alert"` so it is announced immediately by screen readers
- [x] Button "Entrar" is keyboard reachable via `Tab`; activatable via `Enter` (native `<button type="submit">`)
- [x] `Loader2` spinner inside the loading button is `aria-hidden="true"` (decorative); button text changes to "Entrando…" (announces state change)
- [x] Session-expired notice (UI-01 conditional) uses `role="status"` or plain text — not `role="alert"` (it is not urgent, it is informational)
- [x] Focus on mount: focus is placed on the `login` input on `/sign-in` mount (`autoFocus` on the email field)
- [x] CRT animation: the `transitionCrtPowerOn` factory applies `prefers-reduced-motion` contract — when `useReducedMotion()` is true (or the media query fires), phases 1–3 are skipped and only a fade-in plays (WCAG 2.2 AA compliance for motion)
- [x] WCAG AA contrast: `text-content` + `text-body` on `GlassSurface level="panel"` over treated backdrop clears ≥ 4.5:1 in both themes (guaranteed by `tokens.md §9.3`)
- [x] Target size: "Entrar" button height ≥ 40 px (`min-h-10`) — project floor ≥ 32 px

---

## 9. BDD Scenarios

### Happy path — valid credentials

```
Given the user is on /sign-in (not authenticated)
When they enter a valid email and password and click "Entrar"
Then the form enters submitting state (fields disabled, button shows spinner + "Entrando…")
  And POST {VITE_NEON_AUTH_URL}/sign-in/email resolves with HTTP 200 (session cookie set)
  And GET {VITE_NEON_AUTH_URL}/token resolves with { token: "<JWT>" }
  And useAuthStore.setToken is called with the received JWT
  And the router navigates to /chat (or ?redirect target if present)
  And the /sign-in route unmounts
```

### Critical error — invalid credentials

```
Given the user is on /sign-in (not authenticated)
When they enter an incorrect email or password and click "Entrar"
Then POST {VITE_NEON_AUTH_URL}/sign-in/email returns HTTP 401 with code "INVALID_EMAIL_OR_PASSWORD"
  And the form returns to idle state (fields re-enabled, button shows "Entrar")
  And an inline error message "E-mail ou senha incorretos." is displayed with role="alert"
  And a toast.error fires with the same message
  And GET {VITE_NEON_AUTH_URL}/token is never called
  And no navigation occurs
```

### Session-expired redirect

```
Given the user's JWT has expired and the BFF returns 401
When lib/http.ts attempts silent refresh via GET {VITE_NEON_AUTH_URL}/token
  And the session cookie is also expired (GET /token → 401)
Then useAuthStore is cleared
  And the router redirects to /sign-in?reason=session_expired
  And the sign-in page displays (UI-01 idle)
  And the inline notice "Sua sessão expirou. Faça login novamente." is visible
  And after valid sign-in the router navigates back to the route the user was accessing
```

### Silent refresh — JWT expired but session cookie valid

```
Given the user has a valid session cookie but an expired JWT
When any protected BFF call returns 401
Then lib/http.ts calls GET {VITE_NEON_AUTH_URL}/token (credentials:'include')
  And the call succeeds (HTTP 200, new JWT)
  And useAuthStore.setToken is called with the new JWT
  And the original BFF request is retried once with the new JWT
  And no redirect to /sign-in occurs
```

### Reduced-motion CRT

```
Given the user has prefers-reduced-motion enabled in their OS
When /sign-in mounts
Then the CRT power-on phases 1–3 (scale animation) are skipped
  And the panel appears via a simple opacity fade-in (0 → 1, 200ms)
  And the form is fully interactive immediately
```

---

## 10. Components to Create / Update

| Component | Action | Needed by | Rationale |
|-----------|--------|-----------|-----------|
| `features/auth/api/neon-auth.ts` | create | `/sign-in` | New module: `signInWithEmail()`, `fetchAccessToken()`, `AuthError` — raw `fetch` with `credentials:'include'` to the Better Auth endpoints |
| `features/auth/api/__tests__/neon-auth.spec.ts` | create | `/sign-in` | MSW tests: step 1 200/401, step 2 200/401/no-token |
| `useSignIn` | update | `/sign-in` | Rewrite to call `neon-auth.ts` (remove import of `stack-app.ts`); same public signature consumed by `SignInForm` |
| `SignInForm` | update | `/sign-in` | Update error code mapping: `INVALID_EMAIL_OR_PASSWORD` (Better Auth) instead of Stack Auth equivalent |
| `features/auth/index.ts` | update | `features/auth/` | Remove export of `stack-app`/Stack Auth types |
| `features/auth/lib/stack-app.ts` | remove | — | No longer needed; replaced by `neon-auth.ts` |
| `lib/env.ts` | update | app bootstrap | Remove `VITE_STACK_PROJECT_ID` and `VITE_STACK_PUBLISHABLE_CLIENT_KEY` from the Zod schema |
| `src/main.tsx` | update | app bootstrap | `EnvErrorFallback`: remove `VITE_STACK_*` from the env error text; keep `VITE_BFF_URL` + `VITE_NEON_AUTH_URL` |
| `lib/http.ts` | update | all protected routes | Add DC (silent refresh): on 401 from BFF, call `fetchAccessToken()` once; on success re-do the request; on failure clear store + redirect `/sign-in?reason=session_expired` |
| `frontend/.env.local` + `.env.example` | update | dev/build | Remove `VITE_STACK_PROJECT_ID` and `VITE_STACK_PUBLISHABLE_CLIENT_KEY` |
| `frontend/package.json` | update | build | `npm rm @stackframe/react` |
| `SignInPanel` | no change | `/sign-in` | UI unchanged — only auth layer changes |
| `transitionCrtPowerOn` | no change | `/sign-in` | Factory unchanged |
| `src/router/__root.tsx` | no change (already updated in prior wave) | all routes | `AmbientBackdrop` already moved here |
| `src/router/routes.tsx` | no change (already updated in prior wave) | all routes | `protectedLayoutRoute` already in place |
| `src/shell/AppShell.tsx` | no change (already updated in prior wave) | all protected routes | `<AmbientBackdrop/>` already removed |

---

## 11. Out of Scope

- Sign-up / registration screen (not requested; single-owner project)
- Password reset / forgot-password flow (not requested)
- Social / OAuth sign-in (not requested)
- Backend / BFF changes of any kind (FRONTEND-ONLY requirement)
- Any database migration
- The full Chrome refactor test coverage beyond the sign-in route (already done in prior wave)
- E2E Playwright login with real credentials (annotated as a test dependency — real credentials required)

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Sign-in feature spec: CRT animation, auth flow (Option A — Stack Auth SDK), chrome refactor (layout route), form + a11y. Deviation from front.md §2/§3.1/§5.1/front.back.md BR-04 registered. | sdd_front |
| 2.0.0 | 2026-06-21 | Front Spec Agent | major | Auth layer replaced: Stack Auth SDK → Better Auth 2-step flow (POST /sign-in/email + GET /token, credentials:'include'). §1 (no BFF calls — now Better Auth direct), §2 (UI-02 covers both steps; UI-03 maps Better Auth error codes), §3 (transition table updated for 2-step), §4 (two calls, sequential, no cache), §6 (AuthError codes from neon-auth.ts), §9 (BDD includes silent refresh scenario), §10 (create neon-auth.ts, remove stack-app.ts, update useSignIn/SignInForm/env.ts/http.ts). Refresh silencioso (DC) documented. Removed §11 "Migrating from Stack Auth" (now done). | sdd_front |
