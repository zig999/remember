# Validation Report — GlassSurface

> Triage: COMPLETED
> Date: 2026-06-19
> Domain: glass-surface
> Status: VALID
> Mode: Component spec validation (Mode 1b — front phase)
> Artifacts validated:
>   - `docs/specs/front/components/GlassSurface.component.spec.md` (v1.1.0)
>   - `docs/specs/front/components/GlassSurface.back.md` (v1.0.0)
>   - `docs/specs/front/design-system/tokens.md` (v1.0.0) — cross-reference

---

## Result Summary

**VALID** — no blocking inconsistencies. One warning-level observation noted.

| Check | Description | Result |
|---|---|---|
| 1 | Component spec and back.md internal consistency | PASS |
| 2 | All token references in component spec resolve in tokens.md | PASS |
| 3 | Dual border namespace pattern consistently demonstrated in BOTH files | PASS |
| 4 | Motion variants match between spec, back.md, and tokens.md | PASS (with W-01 noted) |
| 5 | All 3 glass levels covered in both documents | PASS |
| 6 | WCAG 2.2 AA requirements consistent across all files | PASS |
| 7 | File paths in back.md are valid relative paths | PASS |

---

## Inconsistencies

### Blocking

None.

### Warnings

| # | ID | Type | Source file | Target file | Problem | Suggested fix | Agent | Severity | Selected |
|---|---|---|---|---|---|---|---|---|---|
| 1 | W-01 | spec-implementation-drift | `GlassSurface.component.spec.md` §8 | `GlassSurface.back.md` §7.2 | Spec §8 and §4 state table describe the uncertain pulse as using `motion.pulse.uncertain` (Framer Motion variant) scoped to the border-color, implying a Framer Motion implementation. Back.md §7.2 supersedes this with CSS `@keyframes uncertain-border-pulse` in `theme.css`, explicitly stating "This is the final pattern" and that the Framer variant is "NOT shipped." The spec wording is slightly imprecise about the implementation vehicle. User-observable behavior is identical; back.md is authoritative on the mechanism. | Update `GlassSurface.component.spec.md` §8 to note that the uncertain pulse is implemented as a CSS `@keyframes` animation (driven by `data-glass-pulse="uncertain"` attribute) rather than a Framer Motion variant. This aligns the spec with the back.md implementation decision without changing the behavioral contract. | Front Spec Agent | warning | [x] |

---

## Coverage Map

| Ingredient | Component Spec (§6) | Back.md (§9.1) | tokens.md (§9) |
|---|---|---|---|
| `ambient` level — background | `bg-surface-glass-ambient` ✓ | `bg-surface-glass-ambient` ✓ | `--surface-glass-ambient` ✓ |
| `ambient` level — blur | `backdrop-blur-glass-sm` ✓ | `backdrop-blur-glass-sm` ✓ | `--blur-glass-sm` ✓ |
| `ambient` level — border | `border border-border-glass` ✓ | `border border-border-glass` ✓ | `--color-border-glass` + `--border-DEFAULT` ✓ |
| `ambient` level — shadow | `shadow-sm` ✓ | `shadow-sm` ✓ | `--shadow-sm` ✓ |
| `panel` level — background | `bg-surface-glass-panel` ✓ | `bg-surface-glass-panel` ✓ | `--surface-glass-panel` ✓ |
| `panel` level — blur | `backdrop-blur-glass-md` ✓ | `backdrop-blur-glass-md` ✓ | `--blur-glass-md` ✓ |
| `panel` level — shadow | `shadow-md shadow-glass` ✓ | `shadow-md shadow-glass` ✓ | `--shadow-md` + `--shadow-glass` ✓ |
| `modal` level — background | `bg-surface-glass-modal` ✓ | `bg-surface-glass-modal` ✓ | `--surface-glass-modal` ✓ |
| `modal` level — blur | `backdrop-blur-glass-lg` ✓ | `backdrop-blur-glass-lg` ✓ | `--blur-glass-lg` ✓ |
| `modal` level — shadow | `shadow-lg shadow-glass` ✓ | `shadow-lg shadow-glass` ✓ | `--shadow-lg` + `--shadow-glass` ✓ |
| 7 accent variants | All documented in §6.4 ✓ | All in CVA factory §5.1 ✓ | All border-color tokens defined ✓ |
| Panel enter/exit motion | §7 table ✓ | `glassPanelMotion` §7.1 ✓ | `--duration-fast`, `--duration-instant`, `--ease-out`, `--ease-in` ✓ |
| Modal enter/exit motion | §7 table ✓ | `glassModalMotion` §7.1 ✓ | `--duration-moderate`, `--duration-instant`, `--ease-out-quint`, `--ease-in` ✓ |
| Ambient — no motion | §7 table ✓ | §6.2 explains why ✓ | N/A |
| Uncertain pulse | §8 ✓ | §7.2 CSS keyframe decision ✓ | `--duration-pulse`, `--ease-in-out` ✓ |
| Reduced motion gate | §7.1 ✓ | §11.4 (three gates) ✓ | §11.3 rule ✓ |
| WCAG 2.2 AA text contrast | §6.1–6.3 ✓ | §11.2 ✓ | §9.3 ✓ |
| WCAG 2.2 AA border contrast | §14 ✓ | §11.1 ✓ | §9.3 ✓ |
| Dual-namespace border pair | §10.2 regression matrix ✓ | §5.1 BASE comment + §9.3 ✓ | §7.2 + §14 ✓ |
| React 19 ref-as-prop | §12 ✓ | §13 ✓ | N/A |
| BDD scenarios | 13 scenarios in §15 ✓ | 14 unit tests in §12.1 ✓ | N/A |
| Storybook stories | 14 stories in §9 ✓ | 14 stories in §10.3 ✓ | N/A |

---

## Token Resolution Table

All tokens referenced in `GlassSurface.component.spec.md` verified against `tokens.md §2` (CSS block):

| Token | Tailwind utility | Value (dark) | Found in tokens.md |
|---|---|---|---|
| `--surface-glass-ambient` | `bg-surface-glass-ambient` | `oklch(22% 0.012 250 / 0.55)` | ✓ |
| `--surface-glass-panel` | `bg-surface-glass-panel` | `oklch(22% 0.012 250 / 0.65)` | ✓ |
| `--surface-glass-modal` | `bg-surface-glass-modal` | `oklch(22% 0.012 250 / 0.78)` | ✓ |
| `--blur-glass-sm` | `backdrop-blur-glass-sm` | `8px` | ✓ |
| `--blur-glass-md` | `backdrop-blur-glass-md` | `16px` | ✓ |
| `--blur-glass-lg` | `backdrop-blur-glass-lg` | `24px` | ✓ |
| `--color-border-glass` | `border-border-glass` | `oklch(95% 0.005 250 / 0.18)` | ✓ |
| `--border-DEFAULT` | `border` | `1px` | ✓ |
| `--shadow-sm` | `shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.18)` | ✓ |
| `--shadow-md` | `shadow-md` | `0 4px 12px -2px ...` | ✓ |
| `--shadow-lg` | `shadow-lg` | `0 12px 32px -6px ...` | ✓ |
| `--shadow-glass` | `shadow-glass` | `0 8px 24px -6px rgba(0,0,0,0.40), inset 0 1px 0 0 rgba(255,255,255,0.06)` | ✓ |
| `--radius-lg` | `rounded-lg` | `14px` | ✓ |
| `--radius-xl` | `rounded-xl` | `20px` | ✓ |
| `--color-border-accepted` | `border-border-accepted` | `oklch(70% 0.16 150)` | ✓ |
| `--color-border-uncertain` | `border-border-uncertain` | `oklch(75% 0.15 75)` | ✓ |
| `--color-border-disputed` | `border-border-disputed` | `oklch(68% 0.17 45)` | ✓ |
| `--color-border-superseded` | `border-border-superseded` | `oklch(45% 0.01 250)` | ✓ |
| `--color-border-focus` | `border-border-focus` | `oklch(68% 0.16 240)` | ✓ |
| `--color-border-error` | `border-border-error` | `oklch(60% 0.20 25)` | ✓ |
| `--duration-fast` | `duration-fast` | `200ms` | ✓ |
| `--duration-moderate` | `duration-moderate` | `300ms` | ✓ |
| `--duration-instant` | `duration-instant` | `100ms` | ✓ |
| `--duration-pulse` | `duration-pulse` | `2400ms` | ✓ |
| `--ease-out` | `ease-out` | `cubic-bezier(0.25, 1, 0.5, 1)` | ✓ |
| `--ease-in` | `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | ✓ |
| `--ease-out-quint` | `ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | ✓ |
| `--ease-in-out` | `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | ✓ |

All 28 token references resolved. Zero missing tokens.

---

## Triage History

| Date | Validator | Action | Note |
|---|---|---|---|
| 2026-06-19 | u-spec-validator | Initial run | VALID — W-01 logged (warning, informational) |
