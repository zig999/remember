# Validation Report — StateBadge Component Spec

> ## ⚠ SUPERADO pela migração v2.0 (UI-Kit / TUI)
> Validou as cores de estado oklch próprias. Após a adoção do TUI, as 5 cores foram **remapeadas** para os
> accents do kit (colisão low-confidence/superseded → distinção por ícone). Resultado desatualizado —
> **regenerar pelo pipeline**. Ver `front/components/StateBadge.component.spec.md` e `front/design-system/tokens.md` §3.

> Domain: `state-badge` | Mode: component spec validation | Date: 2026-06-19
> Validated by: u-spec-validator | Triage: N/A

---

## Result

**status: VALID**

No blocking inconsistencies found. No warnings.

---

## Artifacts validated

| File | Version | Status |
|---|---|---|
| `docs/specs/front/components/StateBadge.component.spec.md` | 1.1.0 | checked |
| `docs/specs/front/components/StateBadge.back.md` | 1.0.0 | checked |
| `docs/specs/front/design-system/tokens.md` | 1.0.0 | checked (token references) |

---

## Check results

### Check 1 — Internal consistency (component spec vs back.md)

PASS. All structural decisions in `StateBadge.back.md` are consistent with the component spec:

- Props contract: `ConfidenceState` union, `StateBadgeSize`, all 7 props with correct types and defaults, match between §3 table and back.md §9.1 TypeScript signature.
- File layout: both documents agree on `frontend/src/components/ds/StateBadge/` as the component home.
- `STATE_LABELS` location: component spec §5.2 mentions `StateBadge.tsx`; back.md §2 splits it into `StateBadge.labels.ts`. This is an intentional architectural refinement in the back spec (documented with rationale in back.md §2.2) — not a contradiction. Observable behavior is identical.
- Motion wiring: all four variants, their triggers, and their parameters are consistent.
- React 19 ref-as-prop: both documents prohibit `forwardRef`, declare `ref?: React.Ref<HTMLSpanElement>`.
- WCAG contracts, aria-label pattern, `sr-only` for `iconOnly` mode: consistent.

### Check 2 — Token references resolve in tokens.md

PASS. Every CSS token referenced in the component spec resolves in `tokens.md §2` (CSS block) and §13 (YAML manifest):

- All 5 state background tokens (`--color-state-*`)
- All 5 state foreground tokens (`--color-state-*-fg`)
- 4 state border color tokens (`--color-border-accepted`, `--color-border-uncertain`, `--color-border-disputed`, `--color-border-superseded`): present
- Intentional absence of `--color-border-low-confidence`: confirmed as deliberate in both spec §6.3 and tokens.md §6.1 (border column shows `—`)
- Neutral default border `--color-border`: present
- Spacing tokens `--spacing-xs`, `--spacing-sm`: present
- Typography tokens `--text-caption`, `--text-body-sm`: present
- Radius token `--radius-pill`: present
- Border width token `--border-DEFAULT`: present
- Motion tokens `--duration-pulse` (2400ms), `--duration-moderate` (300ms), `--duration-entrance` (500ms): all present with correct values
- Easing tokens `--ease-in-out`, `--ease-out-quint`, `--ease-in`, `--ease-out-expo`: all present

### Check 3 — Props in component spec match TypeScript interface in back.md

PASS. Exact match on all 7 props:

| Prop | component spec §3 | back.md §9.1 |
|---|---|---|
| `state: ConfidenceState` | required | required |
| `animate?: boolean` | default `true` | default `true` |
| `size?: StateBadgeSize` | default `'sm'` | default `'sm'` |
| `iconOnly?: boolean` | default `false` | default `false` |
| `label?: string` | optional | optional |
| `className?: string` | optional | optional |
| `ref?: React.Ref<HTMLSpanElement>` | optional | optional |

### Check 4 — Motion variant names match across spec, back.md, and tokens.md

PASS. All four variants name-match and parameter-match across all three files:

| Variant | spec §7.1 | back.md §4.2 | tokens.md §11.2 | Parameters consistent |
|---|---|---|---|---|
| `motion.pulse.uncertain` | yes | yes | yes | opacity 1→0.55→1, 2400ms, ease-in-out |
| `motion.transition.promote` | yes | yes | yes | backgroundColor + scale 1→1.06→1, 300ms, ease-out-quint |
| `motion.transition.supersede` | yes | yes | yes | opacity 1→0.45, y 0→4, 500ms, ease-in |
| `motion.transition.merge` | yes | yes | yes | source: x/y + opacity 1→0; target: scale 1→1.08→1, 500ms, ease-out-expo |

### Check 5 — All 5 confidence states covered in both documents

PASS. Both documents cover `accepted`, `uncertain`, `low-confidence`, `disputed`, `superseded` in:
- Per-state visual/token/WCAG/BDD sections (component spec §6.1–§6.5)
- CVA factory state axis (back.md §3.1)
- STATE_LABELS const (back.md §6.1)
- Per-state token table (back.md §5.1)
- Test coverage (back.md §7.1 loops all 5 states in test #1–#3)

### Check 6 — WCAG 2.2 AA requirements consistent across both documents

PASS. Both documents make the same WCAG claims:

- All 5 `(bg-state-* + text-state-*-fg)` pairs certified ≥4.5:1 in both themes (verified in tokens.md §6.1)
- `superseded` special contract: resting at 0.45 opacity; the AA claim is "must remain identifiable" rather than full 4.5:1 at composite — both component spec §6.5 and back.md §7.2 (test B9) agree on this deliberate exception
- `iconOnly` mode: aria-label always present (component spec §9, back.md §6.4): consistent
- Reduced motion: double-gated by `prefers-reduced-motion` CSS and Framer Motion `useReducedMotion()` — both documents agree
- Non-interactive: no keyboard handling, no target size, no focus ring — both documents agree

### Check 7 — File paths in back.md are valid relative paths

PASS. All 13 file paths in back.md §2 are syntactically valid relative paths within `frontend/src/`. The `frontend/` directory is documented in CLAUDE.md as not yet created (future implementation target) — this is expected for a spec artifact.

---

## Coverage Map

| Aspect | component spec | back.md | tokens.md |
|---|---|---|---|
| 5 confidence states | §6.1–§6.5 | §3.1, §5.1, §6.1 | §6.1 |
| 2 size variants | §5.1 | §3.1, §5.2 | §4, §5 |
| 4 motion variants | §7.1 | §4.2 | §11.2 |
| Props contract | §3 | §9.1 | N/A |
| WCAG 2.2 AA | §9 | §6, §7.2 | §6.1, §9.3 |
| File layout | path in header | §2 full breakdown | N/A |
| React 19 ref-as-prop | §10 | §9 | N/A |
| className / cn() | §11 | §3.6 | N/A |

---

## Blocking issues

None.

---

## Warnings

None.

---

## Triage History

(No history — first validation run, result is VALID.)
