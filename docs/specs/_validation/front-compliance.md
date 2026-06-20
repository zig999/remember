# Compliance Scan Report — Front Sign-In Wave

**Domain:** front (sign-in feature wave)
**Version:** sign-in.feature.spec.md v1.0.0 · auth.flow.md v1.0.0 · front.md v1.3.0 · design-system/implementation.md v1.1.0
**Regulations:** lgpd
**Scan date:** 2026-06-20
**Agent:** u-spec-compliance

---

## Verdict: compliant

**block_handoff:** false
**Findings:** 0 block_handoff · 0 create_spec_cr · 0 add_warning

---

## Artifacts Scanned

| Artifact | Path |
|----------|------|
| Feature spec | `docs/specs/front/features/sign-in.feature.spec.md` |
| Flow spec | `docs/specs/front/_flows/auth.flow.md` |
| Global front spec | `docs/specs/front/front.md` |
| Design system implementation | `docs/specs/front/design-system/implementation.md` |

---

## LGPD Check Results

| Check | Result | Evidence |
|-------|--------|----------|
| 1. No personal data stored beyond session | PASS | JWT stored in `sessionStorage["remember.auth.token"]` (cleared on tab close); email/password held only in RHF in-memory state, not persisted. |
| 2. Consent and transparency | PASS (N/A) | Single-owner system per CLAUDE.md §2.3 and normative source §2.3 — the operator IS the user; no third-party data subject; LGPD consent obligation does not apply to the sign-in form. |
| 3. Data minimization | PASS | Form collects only `email` + `password` — the minimum required for password-based authentication (D3). No excess fields. |
| 4. No PII in URLs | PASS | URL params are `?reason=session_expired` and `?redirect=<path>` only; email is never placed in a URL param; redirect param validated as same-origin path. |
| 5. Auth token handling — sessionStorage preferred over localStorage | PASS | `auth.flow.md §6` explicitly specifies `sessionStorage["remember.auth.token"]`; theme uses `localStorage` only for the non-sensitive theme preference (`remember.theme`). |
| 6. Single-owner model — no User entity created | PASS | `sign-in.feature.spec.md §1` explicitly states no BFF endpoints are consumed; no User entity is created; consistent with CLAUDE.md §2.3 and normative source §2.3. |

---

## LGPD Detection Rule Results

| Rule | Applied | Result | Notes |
|------|---------|--------|-------|
| `missing_data_retention_policy` | Yes | No gap | Email is not retained — it is POSTed to Stack Auth SDK and discarded; JWT in sessionStorage is session-scoped (auto-cleared). |
| `missing_consent_mechanism` | Yes | No gap | Single-owner system; no third-party data subject; operator signs in with their own email. |
| `missing_audit_log` | Yes | No gap | Sign-in creates no domain records (no BFF calls); Stack Auth SDK handles auth server-side. |
| `pii_field_undeclared` | Yes | No gap | This is a UI-layer spec with no OpenAPI schema; `login` field contains no real PII examples. |
| `missing_right_to_erasure` | Yes | No gap | No account deletion UC in this spec; erasure is covered by the compliance-audit domain spec. |
| `missing_data_minimization` | Yes | No gap | Email + password only — minimum required. |
| `hardcoded_pii_in_spec_example` | Yes | No gap | Zod schema snippet contains no real email addresses or PII values. |

---

## Informational Notes

- The spec correctly uses a combined credential error message ("E-mail ou senha incorretos.") that prevents user enumeration — no separate "email not found" vs "wrong password" messages. This is a positive privacy practice.
- The `?redirect` parameter is validated for same-origin safety before use (auth.flow.md FL-AUTH-03), preventing open redirect attacks that could leak auth state to third-party origins.
- The Stack Auth SDK manages its own HTTP communication; the BFF's JWKS middleware is the sole verification point for subsequent protected-area access.

---

## Action Required

None. Handoff may proceed.
