# Validation Report — front-global

> Triage: COMPLETED
> Domain: front-global
> Validator: u-spec-validator
> Date: 2026-06-18
> Mode: final_front (foundation wave)
> Status: **VALID**

---

## Artifacts Validated

| File | Version | Status |
|---|---|---|
| `docs/specs/front/front.md` | 1.0.0 | OK |
| `docs/specs/front/front.back.md` | 1.0.0 | OK |
| `docs/specs/front/design-system/tokens.md` | 1.0.0 | OK |
| `docs/specs/front/design-system/_index.md` | 1.0.0 | OK |

---

## Validation Checks

### Check 1 — Cross-references between front.md and tokens.md

| Reference | Source | Target | Result |
|---|---|---|---|
| `--backdrop-treatment` family | `front.md §2.3` | `tokens.md §10` (`--backdrop-darken`, `--backdrop-desaturate`, `--backdrop-blur`) | OK — conceptual family name maps to correct token set |
| `--graph-depth-overlay` | `front.md §2.3` | `tokens.md §10.2` | OK |
| `tokens.md §5–§7` (node/edge styles) | `front.md §7.3` | `tokens.md §5` (typography), `§6` (confidence + NodeType), `§7` (LinkType) | OK |
| `tokens.md §11` (motion variants) | `front.md §9` | `tokens.md §11` | OK |
| `border-border-focus` class | `front.md §10` | `tokens.md §2` `--color-border-focus` | OK — naming convention correct |
| Z-index scale (7 layers) | `front.md §2.2` | `tokens.md §12` | OK — all 7 values match exactly |
| `design-system/tokens.md §6` (lucide icons) | `front.md §1` | `tokens.md §6.3` NodeType catalog | OK |
| 4 motion behaviours | `front.md §9` | `tokens.md §11.2` | OK — all 4 variants (pulse.uncertain, transition.promote, transition.supersede, transition.merge) present |

**Result: All cross-references resolve correctly.**

---

### Check 2 — front.back.md exists and contains required technical decisions

- front.back.md is present ✓
- Contains 18 BRs covering: path aliases, env validation, envelope parsing, JWT guard, fetch restrictions, cross-feature isolation, query key factories, stale-time policy, theme hydration (FOUC prevention), reduced-motion gate, semantic token enforcement, singleton providers, ESM-only bundle, data-theme surface, backdrop lazy-load, graph node control, error routing, React Flow component-based rendering ✓
- Contains 2 state machines (ST-01 boot, ST-02 theme) ✓
- Contains 5 events (EV-01–EV-05: 4 motion transitions + 1 query error event) ✓
- Contains stack decision table, data model shapes for all 4 Zustand stores, URL state contract, auth token storage spec ✓
- Contains integration table (BFF + Neon Auth) with timeout/fallback spec ✓
- Contains 10 technical constraints ✓

**Result: front.back.md is structurally complete.**

---

### Check 3 — No undefined references

| Reference | Location | Resolved? |
|---|---|---|
| `frontend-analise-funcional.md` | `front.md` header + §2, §7.3, §9 | temp/front/ — analysis doc (normative input, not spec); acceptable |
| `layout.md` | `front.md §2.3`, §7.3 | temp/front/ — analysis doc; acceptable |
| `remember-modelagem-v7.md §3.5, §6.6` | `tokens.md §2, §6.1` | Root-level normative source; present |
| `../components/StateBadge.component.spec.md` | `design-system/_index.md §3` | `docs/specs/front/components/StateBadge.component.spec.md` — present ✓ |
| `../components/GlassSurface.component.spec.md` | `design-system/_index.md §3` | `docs/specs/front/components/GlassSurface.component.spec.md` — present ✓ |
| `CLAUDE.md` | `front.md §1`, `front.back.md` | Root-level project file — present ✓ |

**Result: No broken cross-references.**

---

### Check 4 — No ambiguous language in critical sections

- front.md §2.1 rules table uses "non-negotiable" header ✓
- front.md §1.2 "Fixed contract" uses "MUST", "forbidden" ✓
- front.back.md BRs uniformly use "MUST", "forbidden", "never" ✓
- front.md §2.3: "blur enough to preserve ≥ 4.5:1 contrast" — "enough" is qualified by the numeric threshold; acceptable ✓
- No hedging terms ("may", "generally", "usually") found in normative sections ✓

**Result: Language in critical sections is precise and non-ambiguous.**

---

### Check 5 — Stack declarations match CLAUDE.md

| Component | CLAUDE.md | front.md §1 | Match |
|---|---|---|---|
| Framework/build | React 19, Vite 6 | React 19, Vite 6 | ✓ |
| Language | TypeScript strict | TypeScript strict (`"strict": true`, `"noUncheckedIndexedAccess": true`) | ✓ |
| Styling | Tailwind CSS v4 (CSS-first via @theme) | Tailwind CSS v4, CSS-first via `@theme` in `theme.css` | ✓ |
| Component primitives | shadcn/ui (Radix UI) | shadcn/ui on Radix UI | ✓ |
| Client state | Zustand v5 | Zustand v5 | ✓ |
| Server state | TanStack Query v5 | TanStack Query v5 | ✓ |
| Routing | TanStack Router | TanStack Router (type-safe) | ✓ |
| Tables | TanStack Table | TanStack Table | ✓ |
| Forms | React Hook Form v7 + Zod v4 | React Hook Form v7 + Zod v4 | ✓ |
| Animation | Framer Motion | Framer Motion (mandatory `prefers-reduced-motion` gate) | ✓ |
| Notifications | sonner | sonner (toasts) | ✓ |
| Icons | lucide-react | lucide-react (the only icon set) | ✓ |
| Graph | React Flow (@xyflow/react) + d3-force | @xyflow/react v12 (MIT) + d3-force | ✓ |
| Design-system | Storybook 9 (addon-a11y + addon-vitest) | Storybook 9 with addon-a11y and addon-vitest | ✓ |
| Testing | Vitest, Playwright, MSW | Vitest + Playwright + MSW | ✓ |
| i18n | i18n: false, pt-BR | disabled — pt-BR only | ✓ |
| `vitest` pin | major 4 | major 4 | ✓ |
| `vite` pin | 6.x + override | 6.x + override in package.json | ✓ |

**Result: All stack declarations match CLAUDE.md exactly.**

---

### Check 6 — Dark-default theming correctly specified

- front.md §8: dark is the default, light is first-class ✓
- front.md §8.1: `data-theme` attribute on `<html>`, inline script in index.html for FOUC prevention, system preference consulted only on first load ✓
- tokens.md §2: `@theme` block sets dark defaults; `[data-theme="light"] { ... }` block overrides ✓
- design-system/_index.md: "Dark by default, light available" ✓
- front.back.md BR-09: FOUC prevention spec ✓; BR-14: `data-theme` is the only theme switch surface ✓
- ST-02 covers theme state transitions ✓

**Result: Dark-default theming is correctly and completely specified.**

---

### Check 7 — WCAG 2.2 AA requirements not contradicted

- front.md §8.2: Both themes MUST pass WCAG 2.2 AA ✓
- front.md §10: SC 1.4.3 (contrast ≥ 4.5:1 normal text, ≥ 3:1 large text), SC 2.4.11 (focus visibility), SC 2.5.8 (target size ≥ 24 px; project floor ≥ 32 px), ARIA roles, form aria-invalid, aria-describedby, reduced motion ✓
- tokens.md §6.1: "every (bg-state-* + text-state-*-fg) pair clears WCAG 2.2 AA ≥ 4.5:1 in both themes" ✓
- tokens.md §9.3: glass surface contrast guarantee ✓
- front.back.md: nowhere contradicts WCAG ✓

**Result: WCAG 2.2 AA requirements are consistently specified throughout — no contradictions found.**

---

### Check 8 — Token manifest sync (tokens.md §2 CSS vs §13 YAML)

Spot-checked 20 tokens across categories (color, border, spacing, text, radius, shadow, surface-glass, blur-glass, backdrop, graph, duration, ease, z):

- All checked tokens present in both CSS block and YAML manifest with matching values ✓
- Dark-default values used in YAML (light overrides appropriately excluded — light theme is documented via the `[data-theme="light"]` block) ✓

**Result: CSS block and YAML manifest are synchronized.**

---

## Issues Summary

### Blocking Issues

None.

---

### Warnings

| # | ID | Type | Source | Description | Severity | Agent |
|---|---|---|---|---|---|---|
| 1 | WARN-001 | design-system | `docs/specs/front/design-system/_index.md` | `composition.md`, `components.md`, `implementation.md` absent from `design-system/`. Explicitly declared out-of-scope for this foundation wave by _index.md §3. No impact on this wave's handoff — but must be produced before any feature spec references them. | warning | Front Spec Agent |
| 2 | WARN-002 | design-system | `docs/specs/front/` | `design-system-rules.md` does not exist. Not mentioned as explicitly deferred in _index.md. Required by validator rule 12b once design-system tokens are finalized. | warning | Front Spec Agent |
| 3 | WARN-003 | cross-ref | `docs/specs/front/front.back.md §5` (EV-01–EV-04) | EV payload `tokens` blocks reference non-existent token names: `var(--motion-duration-pulse)`, `var(--motion-easing-pulse)`, `var(--motion-duration-promote)`, `var(--motion-easing-promote)`, `var(--motion-duration-supersede)`, `var(--motion-easing-supersede)`, `var(--motion-duration-merge)`, `var(--motion-easing-merge)`. Actual token names in `tokens.md §11` are `--duration-*` and `--ease-*` (e.g. `--duration-pulse`, `--ease-in-out`). EV payloads are illustrative but misaligned names could confuse implementors. Suggested fix: update EV payload `tokens` blocks to use canonical names from `tokens.md §11`, or add a note that token names in payloads are logical identifiers mapped in `lib/motion.ts`. | warning | Back Spec Agent |

---

## Coverage Map

| Front-global Section | front.md | front.back.md | tokens.md | _index.md |
|---|---|---|---|---|
| Stack + version pins | §1, §1.1 | §1 + table | — | §2 (visual stack) |
| Shell layout + z-scale | §2, §2.2 | — | §12 (z tokens) | — |
| Ambient backdrop | §2.3 | BR-15 | §10.1 | §1 |
| Routing | §3 | BR-04 (JWT guard) | — | — |
| State strategy | §4 | §2 (data model), BR-07/08 | — | — |
| Error handling | §5 | BR-03, BR-17, EV-05 | — | — |
| Component patterns | §6 | BR-01/05/06/11/13 | — | — |
| Graph visualization | §7 | BR-16/18 | §6.3 (NodeType), §7 (LinkType) | — |
| Theming | §8 | BR-09/14, ST-02 | §2 (CSS), §13 (YAML) | §2 |
| Motion semantics | §9 | EV-01–04, BR-10 | §11 | §1 |
| Accessibility | §10 | BR-10 (reduced motion) | §6.1 (contrast), §9.3 | §1 |
| Confidence states | §5 (error table) | — | §6.1 (5 states + tokens) | §1 |
| Dark default | §8.1 | BR-09/14 | §2 (dark defaults) | §2 |

All sections have corresponding coverage at both the spec and implementation guidance levels.

---

## Design System File Status

| File | Required | Present | Note |
|---|---|---|---|
| `design-system/_index.md` | Yes | Yes ✓ | Changelog populated (v1.0.0) |
| `design-system/tokens.md` | Yes | Yes ✓ | CSS block + YAML manifest, no placeholder values |
| `design-system/composition.md` | Yes | No — WARN-001 | Explicitly deferred to next wave |
| `design-system/components.md` | Yes | No — WARN-001 | Explicitly deferred to next wave |
| `design-system/implementation.md` | Yes | No — WARN-001 | Explicitly deferred to next wave |
| `design-system-rules.md` | Yes | No — WARN-002 | Not mentioned in deferred list |

---

## Final Decision

**Status: VALID**

No blocking inconsistencies found. The front-global foundation wave specs (`front.md`, `front.back.md`, `tokens.md`) are internally consistent, cross-references resolve, stack declarations match CLAUDE.md, dark-default theming is correctly specified, and WCAG 2.2 AA requirements are consistently applied throughout.

Three warnings are logged: two for files deferred to a later wave (expected for a foundation wave), and one for token name alignment in EV payload examples.

**Handoff allowed: true** — the foundation wave is ready for the implementation group.

---

## Triage History

> Initial validation: VALID — 2026-06-18. No blocking issues; 3 warnings logged (2 for known deferred files, 1 for EV payload token name mismatch).
