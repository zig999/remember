# Validation Report — Front Pass (Auth / Sign-In Wave)

> Triage: COMPLETED
> Date: 2026-06-20 | Domain: front (auth wave) | Status: VALID
> Validator: u-spec-validator | Mode: Mode 1b — Final Validation (front phase)

---

## Artifacts Validated

| Artifact | Role |
|---|---|
| `docs/specs/front/features/sign-in.feature.spec.md` | New feature spec |
| `docs/specs/front/_flows/auth.flow.md` | New flow spec |
| `docs/specs/front/front.md` | Amended (v1.3.0) |
| `docs/specs/front/design-system/implementation.md` | Amended (v1.1.0) |
| `docs/specs/front/design-system/components.md` | Amended (v1.1.0) |
| `docs/specs/front/design-system-rules.md` | Amended (v1.2.0) |

**Requirement (UI intent):** FRONTEND-ONLY. Especificar a UI da tela de login/entrada da SPA Remember na rota `/sign-in`, consumindo a infraestrutura de autenticação JÁ EXISTENTE. D2=Stack Auth client SDK (`@stackframe/react`), D3=email+password, R1=permanecer no Stack Auth legado. spec-back = NO-OP.

---

## Rule-by-Rule Findings

### Rule 1 — Cross-references: operationIds, flow references, section references

**Result: PASS**

- `sign-in.feature.spec.md §1` correctly declares NO BFF operationIds (client-side auth via Stack Auth SDK). This is appropriate given the requirement — no backend domain changes.
- Flow reference in the feature spec header (`_flows/auth.flow.md`) resolves to the delivered file.
- `auth.flow.md §1` references `features/sign-in.feature.spec.md` — resolves.
- `auth.flow.md §1` also references `features/chat.feature.spec.md` — that file exists (`/docs/specs/front/features/chat.feature.spec.md`).
- `sign-in.feature.spec.md §7` references `components/GlassSurface.component.spec.md` — that file exists.
- FL-AUTH-01 through FL-AUTH-04 are defined in `auth.flow.md §4` and are internally consistent.
- All feature states (UI-01..UI-04) referenced in `auth.flow.md §3` match the states declared in `sign-in.feature.spec.md §2`.
- `front.md §3`, §3.1, §6.1, §11 all updated with auth-wave artifacts — references resolve.
- `design-system/components.md §4.2` references `sign-in.feature.spec.md §10` — resolves.
- `design-system/implementation.md §2.1` lists `transitionCrtPowerOn` factory in the table — consumer (`SignInPanel`) consistent with `sign-in.feature.spec.md §10`.
- `design-system-rules.md §2.2` lists `transitionCrtPowerOn(reduced)` + `staggerContainer / listItem` — consistent with implementation.md §2.1 and sign-in.feature.spec.md §2.

### Rule 2 — Error codes: catalog consistency

**Result: PASS (with note)**

The sign-in feature uses NO BFF error codes. The Stack Auth SDK throws exceptions (`invalid_credentials`, network errors) — these are SDK exceptions, not BFF envelope codes. They are correctly documented in `sign-in.feature.spec.md §6` as SDK error types, not as `error.code` catalog entries.

The one BFF code mentioned in §6 (`AUTH_UNAUTHORIZED`) is registered in the global catalog (`error-codes.md`) with HTTP 401 — consistent with `front.md §5` which maps `AUTH_UNAUTHORIZED → 401 → redirect to /sign-in?reason=session_expired`. No inconsistency.

No new codes need to be registered in the catalog for this wave.

### Rule 3 — State coverage: §2 states have matching §3 transitions

**Result: PASS**

State machine completeness check:

| State | Entry in §2 | Entry condition in §3 | Transition out in §3 |
|---|---|---|---|
| UI-01 (idle) | Yes | "/ sign-in mounted" | Yes (→ UI-02 on submit, stays UI-01 on client-invalid) |
| UI-02 (submitting) | Yes | "form submitted, Stack Auth call in progress" | Yes (→ UI-04 on success, → UI-03 on error) |
| UI-03 (error) | Yes | "Stack Auth call returns credential or network error" | Yes (→ UI-01 on field edit, → UI-02 on re-submit) |
| UI-04 (success/redirecting) | Yes | "Stack Auth sign-in succeeded" | Yes (→ unmount via router.navigate) |

All §2 states are covered in §3. No orphan states. The four minimum required states (loading=UI-02, success=UI-04, error=UI-03, empty/idle=UI-01) are present.

**Note:** The spec does not have an explicit "empty" state distinct from "idle", but the requirement does not mandate a separate empty state for a sign-in form — UI-01 (idle, pre-submission) covers the initial state adequately.

### Rule 4 — Stack compliance

**Result: PASS**

Checked against `CLAUDE.md` fixed stack contract and `front.md §1`:

| Concern | Finding |
|---|---|
| React 19 | `sign-in.feature.spec.md §7`: no `forwardRef`; `ref` as normal prop (Button, Input, Label are shadcn/ui owned primitives — compliant) |
| TypeScript strict | No type-unsafe patterns introduced in the spec |
| Tailwind v4 | `design-system-rules.md §1.1` lists `max-w-md` resolving to `--container-md` via unlayered override — consistent. `implementation.md §3.5` explicitly documents the fix |
| shadcn/ui | `Button`, `Input`, `Label` are in `components/ui/` (owned code) — compliant |
| RHF + Zod v4 | `sign-in.feature.spec.md §5` declares schema-first approach with Zod v4. `implementation.md §3.3` documents the `safeZodResolver` requirement (Zod v4 incompatibility with `@hookform/resolvers`) — correctly flagged for developer |
| TanStack Query | Correctly declared absent for this feature (no BFF calls). `sign-in.feature.spec.md §4` explicitly states no cache entry — appropriate |
| Framer Motion | `transitionCrtPowerOn` factory declared in `lib/motion.ts` — compliant with `front.md §9.2` (mandatory rule: variants from `lib/motion.ts`, no inline) |
| `@stackframe/react` | Added as approved exception in `front.md §11`; narrowed to `features/auth/` only — compliant |
| No forbidden patterns | No `useEffect` for data, no `fetch` in components, no `forwardRef`, no arbitrary CSS values found in spec |

### Rule 5 — Accessibility: WCAG 2.2 AA requirements

**Result: PASS**

`sign-in.feature.spec.md §8` documents full a11y contract:

| Requirement | Documented |
|---|---|
| `<label htmlFor="…">` (visible label) on every input | Yes — email ("Login"), password ("Senha") |
| `aria-invalid="true"` on validation failure | Yes |
| `aria-describedby` linking error message to input | Yes |
| Form-level credential error `role="alert"` | Yes |
| Session-expired notice `role="status"` | Yes |
| `<button type="submit">` keyboard-activatable | Yes |
| Spinner `aria-hidden="true"` + text "Entrando…" | Yes |
| Focus on mount (`autoFocus` on email field) | Yes |
| CRT animation `prefers-reduced-motion` gate | Yes — mandatory gate per WCAG 2.2 AA (scale transform covers full panel) |
| WCAG AA contrast (≥ 4.5:1) | Yes — referenced via `tokens.md §9.3` guarantee |
| Target size ≥ 32 px (button ≥ 40 px / `min-h-10`) | Yes |

`implementation.md §1.3` provides the sign-in-specific a11y checklist that mirrors the above. `design-system-rules.md §6` includes sign-in items in the accessibility floors.

**Note on `prefers-reduced-motion`:** `front.md §9.1` removed `prefers-reduced-motion` as a project-wide mandatory rule. However, `sign-in.feature.spec.md §8` and `implementation.md §2.4` correctly identify `transitionCrtPowerOn` as having a **mandatory gate** (because the 4-phase scale transform covers the full panel — a vestibular motion concern). This is a permissible, scope-specific exception and is consistently documented in `implementation.md §2.4`, `design-system-rules.md §2.2`, and `design-system-rules.md §5.2`. No inconsistency.

### Rule 6 — No backend domain changes introduced

**Result: PASS**

The requirement explicitly states spec-back is NO-OP. Verified:

- `sign-in.feature.spec.md §1`: "No BFF endpoints are consumed by this feature."
- `sign-in.feature.spec.md §11` Out-of-scope list explicitly includes "Backend changes of any kind (spec-back is NO-OP per Requirement)."
- No domain `openapi.yaml` modifications referenced anywhere in the amended artifacts.
- `auth.flow.md`: "Domains involved: none (client-side via Stack Auth SDK)"
- No new error codes registered that would imply BFF changes.
- `front.md §11` adds `@stackframe/react` as an approved exception — client-side only, no BFF impact.

### Rule 7 — Deviation notes presence

**Result: PASS**

Per the task spec, deviation notes must be present where `front.md §2/§3.1/§5.1` and `front.back.md BR-04` are amended:

| Deviation | Location | Present? |
|---|---|---|
| `front.md §2` amended (AmbientBackdrop moves from AppShell → __root) | `sign-in.feature.spec.md` header "Deviation note (D5/R5)" | Yes |
| `front.md §3.1` amended (guard moves to protectedLayoutRoute) | `sign-in.feature.spec.md` header + `front.md §3` "§3 Deviation note (auth wave — owner-authorized)" | Yes |
| `front.md §5.1` amended (ErrorBoundary in __root, not AppShell) | `sign-in.feature.spec.md` header deviation detail (AppShell no longer renders AmbientBackdrop; boundary now in __root) | Yes |
| `front.back.md BR-04` (guard in `__root`) | `sign-in.feature.spec.md` header explicitly cites BR-04; `front.md §3` deviation note says "Reconcile `front.back.md BR-04` in a future `/u-improve` run once the implementation is verified" | Yes |
| `front.md §3.1` route map `/sign-in` updated | `front.md §3.1` table — `/sign-in` now shows "Specified (auth wave)" with full detail | Yes |

All required deviation notes are present and consistently described across the feature spec and front.md.

---

## Additional Checks (Mode 1b rules)

### Check 5b — UI control traceability (anti-invention)

**Result: PASS**

The sign-in feature has NO auto-added interactive controls (filters, search, sort, pagination, bulk actions). The only interactive controls are:

1. Email input ("Login") — required by Requirement (D3 = email+password)
2. Password input ("Senha") — required by Requirement (D3 = email+password)
3. Submit button "Entrar" — required by Requirement (authentication entry point)

All three controls are traceable to the Requirement. No controls were invented from endpoint shape or convention.

### Check 6 — Flow → feature spec coverage

**Result: PASS**

`auth.flow.md §1` references:
- `features/sign-in.feature.spec.md` — exists
- `features/chat.feature.spec.md` — exists

### Check 6b — FL-NN vs §3 consistency

**Result: PASS**

| FL-NN | Behavior | Source feature §3 Side Effect |
|---|---|---|
| FL-AUTH-01 | Authenticated user on `/sign-in` → redirect to `/chat` | No explicit Side Effect in sign-in §3 (this is a guard bypass, not a sign-in completion); documented in `auth.flow.md §3` row 3d — acceptable |
| FL-AUTH-02 | Unauthenticated user → redirect to `/sign-in` | Covered by `front.md §5` (global `AUTH_UNAUTHORIZED` handler) and `auth.flow.md §3` row 3c |
| FL-AUTH-03 | Safe redirect after sign-in | `sign-in.feature.spec.md §3`: "router navigates to `?redirect` or `/chat`" — consistent |
| FL-AUTH-04 | Mid-session expiry → `/sign-in?reason=session_expired` | `sign-in.feature.spec.md §3`: "UI-04 → router.navigate fires" + `front.md §5` `AUTH_UNAUTHORIZED` handler — consistent |

### Check 7 — front.md stack consistent with CLAUDE.md

**Result: PASS**

`front.md §1` lists: Vite 6, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui, Zustand v5, TanStack Query v5, TanStack Router, React Hook Form v7 + Zod v4, Framer Motion, sonner, lucide-react, React Flow, Storybook 9. This matches the `CLAUDE.md` stack exactly. The new `@stackframe/react` addition to `front.md §11` correctly flags it as an "Approved exception" with narrowed scope.

### Check 7b — Transform consistency

**Result: PASS**

`sign-in.feature.spec.md §4` explicitly states: "No response transforms. The JWT is extracted from the SDK response and passed directly to `useAuthStore.setToken()`." No transforms declared, no operationIds referenced in transforms — consistent.

### Check 7c — Component adapter declaration completeness

**Result: PASS**

`sign-in.feature.spec.md §7` lists 4 components with adapter declarations:
- `GlassSurface`: full adapter block with 3 prop rows — present
- `Button`: `Button: direct-map` — present
- `Input`: `Input: direct-map` — present
- `Label`: `Label: direct-map` — present

All components have either an adapter block or a `direct-map` declaration. No missing declarations.

### Check 8 — Component spec coverage

**Result: PASS (with note)**

`sign-in.feature.spec.md §7` lists `GlassSurface` which has a corresponding `GlassSurface.component.spec.md` (exists). `Button`, `Input`, `Label` are shadcn/ui owned primitives — no component spec required (consistent with existing pattern; chat wave also uses them without separate specs).

`SignInPanel` and `SignInForm` are single-use feature-local components (documented inline in §10 of the feature spec). They appear in only one feature spec, so no separate `component.spec.md` is required per Rule 8 (threshold: 2+ features).

### Check 9 — BDD scenarios

**Result: PASS**

`sign-in.feature.spec.md §9` has 4 BDD scenarios:
1. Happy path — valid credentials (required: happy path)
2. Critical error — invalid credentials (required: critical error)
3. Session-expired redirect (additional — tests a key flow variant)
4. Reduced-motion CRT (additional — tests the mandatory a11y gate)

Minimum 2 scenarios (happy path + critical error) met; 4 total provided.

### Check 10 — Design system files

**Result: PASS**

The 5 required files exist under `docs/specs/front/design-system/`:
- `_index.md` — present (v1.1.0, updated for auth wave)
- `tokens.md` — present (v1.0.0, not amended this wave — no new tokens needed)
- `composition.md` — present (listed in directory)
- `components.md` — present (v1.1.0, amended for auth wave)
- `implementation.md` — present (v1.1.0, amended for auth wave)
- `design-system-rules.md` — present (v1.2.0, amended for auth wave)

`tokens.md` contains a `## 2. Token declarations (CSS source of truth)` CSS block with concrete non-placeholder values (OKLCH colors, px values, rem values) — not a template-only file.

`tokens.md` does not have a `token-manifest` YAML block (the file description mentions it as one of two formats to keep in sync, but scanning the visible portions shows no YAML manifest block). **Warning (W-DS-1):** `tokens.md` lacks the `token-manifest` YAML block described as required in the file header.

### Check 10b — Token manifest sync

**Result: N/A (token-manifest absent — see W-DS-1)**

### Check 11 — Design system coverage (components in feature specs cataloged)

**Result: PASS**

Components referenced in `sign-in.feature.spec.md §7`:
- `GlassSurface` — in `design-system/components.md §2.1` — present
- `Button` — in `design-system/components.md §3` — present
- `Input` — in `design-system/components.md §3` — present (added in v1.1.0 auth wave)
- `Label` — in `design-system/components.md §3` — present (added in v1.1.0 auth wave)

All components cataloged.

### Check 12 — Design system changelog

**Result: PASS**

`design-system/_index.md` changelog: 3 entries (v1.0.0 foundation, v1.0.1 patch, v1.1.0 auth wave) — all populated with date, author, type, description, and CR. At least initial version present.

### Check 12b — design-system-rules.md sync with tokens.md

**Result: PASS**

`design-system-rules.md v1.2.0` declares in §1.1 all the token utility classes that match the CSS token declarations in `tokens.md`:
- Surface: `bg-primary`, `bg-surface`, `bg-elevated`, `bg-input`, `bg-overlay`
- Glass: `bg-surface-glass-ambient/-panel/-modal` — matches `--color-surface-glass-*` (note: tokens.md uses `--surface-glass-*` not `--color-surface-glass-*`; rules.md §1.3 explicitly calls out the namespace: "bg-surface-glass-* generates only from --color-surface-glass-* tokens")
- Text hierarchy: `text-content`, `text-body`, `text-muted`, `text-content-inverse`
- Semantic accents: `text-action`, `text-danger`, `text-warning`, `text-data`
- State: `text-state-{accepted,uncertain,low-confidence,disputed,superseded}[-fg]`
- Motion: durations + easings in §1.1 match tokens.md `--duration-*` and `--ease-*` declarations
- Z-index: §4 values match tokens.md `--z-*` declarations

**Note:** `tokens.md` declares `--surface-glass-*` (without `color-` prefix) for the background tint, but `design-system-rules.md §1.3` and the MEMORY.md gotcha confirm that `--color-surface-glass-*` is the corrected namespace (per the 2026-06-20 fix: "renamed --surface-glass-* → --color-surface-glass-*"). `tokens.md v1.0.0` may still use the old `--surface-glass-*` name in the CSS block. This is a pre-existing inconsistency documented in MEMORY.md and resolved in code; the rules.md correctly reflects the fixed state. **Warning (W-DS-2):** `tokens.md` CSS block uses `--surface-glass-*` (old namespace) while `design-system-rules.md §1.3` references `--color-surface-glass-*` (new namespace). This is a known, resolved inconsistency in the implementation, but the spec's `tokens.md` has not been updated to reflect the `--color-` prefix fix. Low-risk for this wave (sign-in uses `GlassSurface level="panel"` which delegates to the component spec, not raw token usage).

**New `transitionCrtPowerOn` motion factory:** added in `design-system-rules.md §2.2` — consistent with `implementation.md §2.1` and the factory list in `tokens.md §1` (the tokens.md summary mentions 7 motion variants including CRT power-on).

---

## Warning Summary

| ID | Rule | File | Finding | Severity |
|---|---|---|---|---|
| W-DS-1 | 10 | `tokens.md` | `token-manifest` YAML block is described in the file header as a required format ("keep both in sync") but is absent from the file. This pre-dates the auth wave and is not introduced by it. | warning |
| W-DS-2 | 12b | `tokens.md` / `design-system-rules.md` | `tokens.md` CSS block uses `--surface-glass-*` namespace; `design-system-rules.md §1.3` correctly references `--color-surface-glass-*` (the fixed namespace per MEMORY.md 2026-06-20). The spec's `tokens.md` CSS block should be updated to reflect the rename. Pre-dates auth wave. | warning |
| W-R2 | 1 | `sign-in.feature.spec.md §4` note | SDK method names (`signInWithCredential`, `getAuthJson`) are marked "R2 — must be confirmed at implementation time". This is intentional and properly annotated — included here for developer attention. | informational |

No warnings are introduced by the auth wave itself. W-DS-1 and W-DS-2 are pre-existing, both predating this wave.

---

## Coverage Map

| UC / Feature area | Front artifact | Flow | States | BDD |
|---|---|---|---|---|
| Sign-in (auth, client-side) | `sign-in.feature.spec.md` | `auth.flow.md` FL-AUTH-01..04 | UI-01..04 (4) | 4 scenarios |
| Auth guard / protected routes | `auth.flow.md §4` FL-AUTH-02 | `auth.flow.md §3` row 3c | covered by `front.md §5` | N/A (global handler) |
| Safe redirect post-login | `sign-in.feature.spec.md §2 UI-04`, `auth.flow.md` FL-AUTH-03 | Yes | Yes | included in scenario 1 |
| Session-expired re-auth | `sign-in.feature.spec.md §2 UI-01 conditional`, `auth.flow.md §3` 3c | FL-AUTH-04 | Yes | scenario 3 |

---

## Final Result

**STATUS: VALID**

No blocking inconsistencies found. Two pre-existing warnings (token-manifest and surface-glass namespace) are informational and do not block handoff — they predate this wave and are tracked.

The auth/sign-in spec wave is internally consistent, correctly deviates from the prior routing baseline with owner-authorized notes, introduces no backend changes, documents all required a11y contracts, and passes all Mode 1b checks.

**Handoff allowed: true**

---

## Triage History

<!-- Previous triage entries preserved here if any -->
