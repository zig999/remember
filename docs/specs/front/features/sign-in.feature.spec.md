# Sign-In -- Feature Spec

> Route: `/sign-in` | Related flows: `_flows/auth.flow.md`
> Consumed domains: **none (client-side auth via Stack Auth SDK — no BFF endpoints)** | Status: draft | Layer: permanent

> **Normative brief:** `temp/login-screen-plan.md` (authoritative) + Requirement inline decisions D1–D3, R1–R6.
>
> **Deviation note (D5 / R5):** this feature introduces a layout refactor that deviates from `front.md §2` (single root layout), `§3.1` (guard in `__root.beforeLoad`), `§5.1` (ErrorBoundary in root), and `front.back.md BR-04` (guard in `__root`). Owner-authorized. Reconcile `front.md` on the next `/u-improve` wave.
>
> **Deviation detail:**
> - `AmbientBackdrop` moves from `AppShell` → `__root` so both protected and unprotected routes share the backdrop.
> - The JWT guard (`beforeLoad`) moves from `__root` → a **pathless layout route** (`id="protected"`) that wraps all currently protected routes. `/sign-in` is a direct child of `RootRoute` (outside the protected layout), receiving only `AmbientBackdrop` + `AppErrorBoundary` + `AppToaster`.
> - `AppShell` no longer renders `<AmbientBackdrop/>`.
>
> **Auth approach (D2 = Option A):** Stack Auth client SDK (`@stackframe/react`, pinned). SPA calls the SDK's sign-in method → receives JWT → calls `useAuthStore.setToken(jwt)` → TanStack Router navigates. The BFF's auth middleware (JWKS/EdDSA) is unchanged.
>
> **R2 note:** Exact SDK method signatures (`signInWithCredential`, `getAuthJson`) must be confirmed against the pinned `@stackframe/react` version during implementation. The spec describes the **functional contract** without fixing method names.

---

## 1. Consumed Endpoints

> No BFF endpoints are consumed by this feature. Authentication is performed client-side via the Stack Auth SDK (`@stackframe/react`). The BFF's JWKS verification middleware is unchanged and requires no new endpoint.

| Domain | operationId | Purpose |
|--------|-------------|---------|
| — | — | No BFF calls. Stack Auth client SDK (`stackApp.signIn({ email, password })`) is called directly by `useSignIn`. |

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

**Entry condition:** form submitted, Stack Auth call in progress.

**What to display:**
- All form fields disabled.
- Button "Entrar" replaced by loading state: `Button` with `disabled` + spinner icon (`Loader2` from `lucide-react`, `animate-spin`) + text "Entrando…".
- No error message visible (clears any previous error).

### UI-03 — error (credential / network)

**Entry condition:** Stack Auth call returns a credential error (`invalid_credentials` or equivalent) or a network error.

**What to display:**
- Form fields re-enabled.
- Inline error message below the form (above the button) in `text-body-sm text-danger`, linked to the form root via `role="alert"`. Message variants:
  - Credential error: "E-mail ou senha incorretos."
  - Network error: "Erro de conexão. Verifique sua rede e tente novamente."
- A `toast.error(...)` via sonner is also fired (secondary notification — does not replace the inline message).
- Button returns to "Entrar" (enabled).

### UI-04 — success (redirecting)

**Entry condition:** Stack Auth sign-in succeeded, JWT obtained, `useAuthStore.setToken(jwt)` called.

**What to display:**
- Button shows brief success state (optional: "Entrando…" keeps spinner or becomes a checkmark for ~300 ms) then the router navigates automatically.
- User sees this state for < 500 ms before the redirect completes — no loading screen required.
- Navigation target: `?redirect` search param value if present and safe (same-origin path), otherwise `/chat` (default).

---

## 3. State Transition Table

| From | Trigger | To | Side Effect |
|------|---------|----|-------------|
| — | `/sign-in` mounted | UI-01 (idle) | CRT power-on entrance animation plays; if `?reason=session_expired`, show session-expired notice |
| UI-01 | Form submitted (valid) | UI-02 (submitting) | `stackApp.signIn()` called; fields disabled |
| UI-01 | Form submitted (invalid client-side) | UI-01 (idle, field errors shown) | RHF field errors displayed inline; no network call |
| UI-02 | Stack Auth success | UI-04 (success) | `useAuthStore.setToken(jwt)` called; router navigates to `?redirect` or `/chat` |
| UI-02 | Stack Auth credential error | UI-03 (error) | Inline error + `toast.error(...)` fired; fields re-enabled |
| UI-02 | Stack Auth network error | UI-03 (error) | Inline error + `toast.error(...)` fired; fields re-enabled |
| UI-03 | User edits any field | UI-01 (idle) | Inline error cleared (reset on first keystroke via `onChange` or on re-submit) |
| UI-03 | Form re-submitted | UI-02 (submitting) | Same as UI-01 → submit |
| UI-04 | `router.navigate()` fires | — (feature unmounts) | Route transition to protected area |

---

## 4. Requests, Order and Cache

> This feature makes no BFF calls. The Stack Auth SDK manages its own HTTP communication. There is no TanStack Query cache entry for sign-in.

| # | operationId | Domain | Execution | Priority | Cache TTL | Revalidation | Params / Headers |
|---|-------------|--------|-----------|----------|-----------|--------------|-----------------|
| 1 | `stackApp.signIn` | Stack Auth SDK (client) | sequential (on form submit) | critical | n/a (no cache — auth call) | n/a | `{ email, password }` via SDK |

> **No response transforms.** The JWT is extracted from the SDK response and passed directly to `useAuthStore.setToken()`. No reshape required.

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
> Field name `login` matches the UI label "Login"; it is the Stack Auth credential email (D3).

---

## 6. API Error → UI Mapping

> The Stack Auth SDK throws exceptions (not BFF envelopes). These are caught in `useSignIn`'s mutation handler.

| Error type | Display | User message | Action |
|------------|---------|--------------|--------|
| SDK credential error (`invalid_credentials` or equivalent) | inline + toast | "E-mail ou senha incorretos." | Dismiss (user edits form) |
| SDK network / fetch error (offline, timeout) | inline + toast | "Erro de conexão. Verifique sua rede e tente novamente." | Dismiss (user retries) |
| `AUTH_UNAUTHORIZED` from BFF (post-redirect, if token rejected) | redirect | — | → `/sign-in?reason=session_expired` (handled globally by `front.md §5`) |
| SDK unknown error | inline + toast | "Erro inesperado. Tente novamente." | Dismiss |

> **Note:** BFF error codes (`AUTH_*`, `SYSTEM_*`) do not appear during sign-in itself (there is no BFF call). They appear after redirect to protected areas if the JWT is rejected. The global handler in `front.md §5` covers those cases.

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
  And the Stack Auth SDK call resolves successfully
  And useAuthStore.setToken is called with the received JWT
  And the router navigates to /chat (or ?redirect target if present)
  And the /sign-in route unmounts
```

### Critical error — invalid credentials

```
Given the user is on /sign-in (not authenticated)
When they enter an incorrect email or password and click "Entrar"
Then the Stack Auth SDK returns a credential error
  And the form returns to idle state (fields re-enabled, button shows "Entrar")
  And an inline error message "E-mail ou senha incorretos." is displayed with role="alert"
  And a toast.error fires with the same message
  And no navigation occurs
```

### Session-expired redirect

```
Given the user's JWT has expired and the router guard fires
When the guard redirects to /sign-in?reason=session_expired
Then the sign-in page displays (UI-01 idle)
  And the inline notice "Sua sessão expirou. Faça login novamente." is visible
  And after valid sign-in the router navigates back to the route the user was accessing
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
| `SignInPanel` | create | `/sign-in` | Composes CRT wrapper + `GlassSurface panel` + welcome text + `SignInForm`; single-use → no separate `component.spec.md` (documented inline here) |
| `SignInForm` | create | `/sign-in` | RHF + Zod form with email/password/submit; single-use → documented inline |
| `useSignIn` | create | `/sign-in` | Mutation hook: calls Stack Auth SDK, calls `setToken`, calls `router.navigate`; lives in `features/auth/api/useSignIn.ts` |
| `transitionCrtPowerOn` factory | create | `/sign-in` | New canonical factory in `src/lib/motion.ts`; consumes `duration-*` + `ease-*` tokens; 4-phase CRT animation + reduced-motion fallback |
| `stack-app.ts` | create | `features/auth/` | `StackClientApp` singleton (`@stackframe/react`); initialized with `VITE_STACK_PROJECT_ID` + `VITE_STACK_PUBLISHABLE_CLIENT_KEY` |
| `src/router/__root.tsx` | update | all routes | Move `AmbientBackdrop` here; remove `beforeLoad` guard + `PUBLIC_ROUTES`; render `<AmbientBackdrop/> + <AppErrorBoundary><Outlet/></AppErrorBoundary> + <AppToaster/>` |
| `src/router/routes.tsx` | update | all routes | Add `protectedLayoutRoute` (pathless, id="protected", guard here, renders `<AppShell><Outlet/></AppShell>`); reparent all currently protected routes; `/sign-in` remains direct child of `RootRoute` |
| `src/shell/AppShell.tsx` | update | all protected routes | Remove `<AmbientBackdrop/>` (it moved to `__root`) |
| `src/main.tsx` | update | app bootstrap | Validate `VITE_STACK_PROJECT_ID` + `VITE_STACK_PUBLISHABLE_CLIENT_KEY` in env validation block |

---

## 11. Out of Scope

- Refresh-token logic (the `useAuthStore` has no refresh; JWT ~1h; expiry → guard redirects to `/sign-in`) (R3 — maintained)
- Sign-up / registration screen (not requested; single-owner project)
- Password reset / forgot-password flow (not requested)
- Social / OAuth sign-in (not requested)
- The full Chrome refactor test coverage (route guard + protected layout) beyond the sign-in route — will be verified by the existing `routes.spec.tsx` update
- E2E sign-in with real Stack Auth credentials (requires test credentials; annotated as a test dependency — see §8)
- Migrating from Stack Auth to Better Auth (R1 — explicitly deferred)
- Backend changes of any kind (spec-back is NO-OP per Requirement)

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Sign-in feature spec: CRT animation, auth flow (Option A — Stack Auth SDK), chrome refactor (layout route), form + a11y. Deviation from front.md §2/§3.1/§5.1/front.back.md BR-04 registered. | sdd_front |
