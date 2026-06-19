# Validation Report — design-system-tokens

> Triage: COMPLETED
> Date: 2026-06-18
> Domain: design-system-tokens
> Mode: Incremental (back phase)
> Validator: Spec Validator (u-spec-validator)

---

## Status: VALID

No blocking inconsistencies found. Two warning-level issues are noted below.

---

## Inputs Validated

| File | Status |
|------|--------|
| `docs/specs/front/design-system/tokens.md` v1.0.0 | Loaded |
| `docs/specs/front/design-system/tokens.back.md` v1.0.0 | Loaded |
| `docs/specs/front/front.md` v1.0.0 | Loaded (cross-reference) |
| `docs/specs/front/design-system/_index.md` v1.0.0 | Loaded |
| `migrations/0001_seed.sql` | Loaded (normative catalog) |
| `migrations/0002_ontology_status_task.sql` | Loaded (catalog extension: Task) |

---

## Validation Checks

### Check 1 — All 10 NodeTypes have color tokens

**Result: PASS**

Normative catalog (after `0001_seed.sql` + `0002_ontology_status_task.sql`):
Person, Organization, Project, Event, Role, Category, Concept, Location, Document, Task — **10 total**.

`tokens.md §2` CSS block and `§6.3` catalog table declare all 10:
`--color-node-{person, organization, project, event, role, category, concept, location, document, task}`.

Light theme override (`[data-theme="light"]`) re-tunes all 10 with lower lightness + same hue — correct.

YAML manifest (`§13`) has all 10 under `color.node-*`. Consistent.

Each NodeType also has an assigned `lucide-react` icon declared in `§6.3`, centralized in `node-type-map.ts` per the spec. Consistent with `tokens.back.md §8`.

---

### Check 2 — All 13 LinkTypes have visual tokens

**Result: PASS**

Normative catalog (`0001_seed.sql`): participates_in, member_of, holds_role, responsible_for, reports_to, part_of, located_in, organizes, belongs_to_category, related_to, concerns, delivered_to, sponsors — **13 total**.

`tokens.md §7` and CSS block (`§2`) declare all 13 `--color-link-*` tokens with correct temporal/stable classification:
- **Temporal (solid stroke):** participates_in, member_of, holds_role, responsible_for, reports_to, organizes, delivered_to, sponsors — 8 links
- **Stable (dashed stroke):** part_of, located_in, belongs_to_category, related_to, concerns — 5 links

Note: `0001_seed.sql` marks `part_of` and `located_in` as `is_temporal = true` with `requires_valid_from = true`, but `tokens.md §7` classifies them as "stable" (dashed stroke). This reflects a deliberate spec choice (structural relationship vs. temporal event-like relationship) — the visual distinction is by stroke style, not by the `is_temporal` DB flag alone. This is a pre-existing design decision and not a contradiction.

Light theme override re-tunes all 13 link colors. YAML manifest has all 13 under `color.link-*`. Consistent.

---

### Check 3 — Confidence state thresholds correct

**Result: PASS**

`tokens.md §6.1` thresholds:
- `accepted` ⇐ confidence ≥ 0.75
- `uncertain` ⇐ 0.40 ≤ confidence < 0.75
- `low-confidence` ⇐ confidence < 0.40 (does not consolidate — diagnostic UIs only)
- `disputed` ⇐ conflict at same period (curation queue)
- `superseded` ⇐ replaced by newer version (historical view)

These match `remember-modelagem-v7.md §3.5/§6.6` as cited. CSS comment in `§2` restates the same thresholds. All 5 states have bg + fg + border tokens (dark theme) and all 5 bg + fg tokens (light theme — see Warning 1 below for missing border tokens in light theme).

---

### Check 4 — Dual border namespace correctly maintained

**Result: PASS**

`tokens.md §2` correctly declares two distinct namespaces:
- `--color-border-*` (color): border, border-glass, border-focus, border-error, border-accepted, border-uncertain, border-disputed, border-superseded
- `--border-*` (width): thin (1px), DEFAULT (1px), 2 (2px), thick (3px)

`tokens.md §7.2` provides "Do / Don't" examples. `tokens.back.md §4` provides the full implementation pattern and explains the gotcha mechanism. YAML manifest (`§13`) correctly segregates `color.border-*` and `border.*`. The Tailwind v4 naming rule is internally consistent — `--color-border-glass` → `border-border-glass` (color utility); `--border-2` → `border-2` (width utility). Pair usage is enforced throughout the spec.

---

### Check 5 — Dark/light theme coverage

**Result: PASS (with Warning 1)**

Dark theme (`@theme` block): complete — all categories covered.

Light theme (`[data-theme="light"]` override) covers:
- Application surfaces: primary, surface, elevated — YES
- Text hierarchy: content, body, muted — YES
- Action colors (action, action-hover, action-active) — YES
- Semantic accents: data, warning, danger — YES
- All 5 confidence state colors (bg + fg): accepted, uncertain, low-confidence, disputed, superseded — YES
- All 10 NodeType colors — YES
- All 13 LinkType colors — YES
- Border: border, border-glass, border-focus — YES
- Glass surface tokens: ambient, panel, modal — YES
- Backdrop treatment tokens: darken, desaturate, blur — YES
- Graph depth overlay — YES
- Shadow tokens: sm, md, lg, glass — YES

**Missing from light theme override (see Warning 1):** `--color-border-error`, `--color-border-accepted`, `--color-border-uncertain`, `--color-border-disputed`, `--color-border-superseded`. These five border-color tokens are defined in the dark `@theme` block but not in the `[data-theme="light"]` override. They will retain dark-calibrated values in light theme, which may reduce contrast against the light glass backgrounds.

---

### Check 6 — tokens.back.md contains technical decisions for implementation

**Result: PASS**

`tokens.back.md` (17 sections) covers all required implementation decisions:
- §1: Stack and Patterns (Tailwind v4, CSS-first, class composer, motion, icon, font, Storybook)
- §2: Data model (N/A — static CSS; artifacts inventory with paths and sync rules)
- §3: Token delivery mechanism (static pipeline, diff workflow, naming-to-utility mapping)
- §4: Dual border namespace — load-bearing implementation pattern
- §5: Dark/light theming (mechanism, state management, FOUC prevention, hydration)
- §6: Font loading strategy (self-hosted Inter, font-display: swap, rationale)
- §7: Motion implementation (Framer Motion + token mapping, reduced-motion, AnimatePresence)
- §8: Icon integration (single mapping module, consumption rule, size convention, bundle impact)
- §9: CVA integration pattern (state-variant and NodeType-variant examples)
- §10: Performance considerations (CSS bundle, backdrop-filter, OKLCH support)
- §11: Storybook integration (token availability, theme switcher, stories to test tokens)
- §12–§15: BR/ST/EV/Integrations — N/A with explicit justification (frontend foundation domain)
- §16: Known Technical Constraints (version pinning, border gotcha, OKLCH-only, no SSR, etc.)
- §17: Out of Scope (token-generation script, linter, a11y contrast matrix, etc.)

---

### Check 7 — No undefined cross-references between tokens.md and front.md

**Result: PASS (with Warning 2)**

| Reference | Source | Target | Status |
|-----------|--------|--------|--------|
| `front.md §8.3` → dual-border-namespace gotcha | `front.md` | `tokens.md §7.2` | PASS — `tokens.md §7.2` exists and defines it |
| `front.md §2.2` z-index Tailwind classes | `front.md` | `tokens.md §12` | PASS — all 8 z-tokens match (z-backdrop through z-toast) |
| `front.md §9` motion variants (pulse/promote/supersede/merge) | `front.md` | `tokens.md §11.2` | PASS — all 4 variants defined |
| `front.md §2.3` `--backdrop-treatment` family | `front.md` | `tokens.md §10` | PASS — §10 defines backdrop-darken, backdrop-desaturate, backdrop-blur + graph-depth-overlay |
| `front.md §1` lucide-react icons for NodeType | `front.md` | `tokens.md §6.3` | PASS — 10 NodeType→icon mappings consistent |
| `tokens.md §2` comment references `0002_catalog_tier1.sql` | `tokens.md` | migrations directory | WARNING 2 — file does not exist (see below) |

---

## Issues Found

| # | Severity | Type | Source File | Description | Suggested Fix | Responsible | Selected |
|---|----------|------|-------------|-------------|---------------|-------------|----------|
| W-1 | warning | coverage | `tokens.md` §2 / `[data-theme="light"]` | Five confidence-state border-color tokens (`--color-border-error`, `--color-border-accepted`, `--color-border-uncertain`, `--color-border-disputed`, `--color-border-superseded`) are absent from the light theme override. They inherit dark-calibrated OKLCH values, which may not clear WCAG 2.2 AA against light glass backgrounds. `tokens.md` mandates AA in both themes. | Add light-theme overrides for these 5 tokens in the `[data-theme="light"]` block. Example: `--color-border-accepted: oklch(50% 0.17 150);` (matching the re-tuned `--color-state-accepted` lightness). | Front Spec Agent | [ ] |
| W-2 | warning | documentation-drift | `tokens.md` §2, §6.3, §7 comments | Spec comments cite `0002_catalog_tier1.sql` as the source for the Document NodeType and the concerns/delivered_to/sponsors LinkTypes. This file does not exist in `migrations/`. These catalog items are in `0001_seed.sql` (the consolidated seed). | Update the CSS comment block and section headers in `tokens.md §2`, `§6.3`, `§7` to cite `0001_seed.sql` instead of `0002_catalog_tier1.sql`. The Task NodeType is in `0002_ontology_status_task.sql`. | Front Spec Agent | [ ] |

---

## Coverage Map

| Concern | tokens.md | tokens.back.md | front.md | Status |
|---------|-----------|----------------|----------|--------|
| 10 NodeType color tokens | §2, §6.3 | §8 (node-type-map.ts) | §1 (lucide icons ref) | COVERED |
| 13 LinkType color + stroke tokens | §2, §7 | §3 (delivery), §8 | §7 (graph) | COVERED |
| 5 Confidence state tokens (bg+fg+border) | §2, §6.1 | §9.1 (CVA pattern) | §9 (motion semantics) | COVERED |
| Dual border namespace | §2, §7.2, §14 | §4 (load-bearing rule) | §8.3 (gotcha) | COVERED |
| Dark default + light override | §2 | §5 (FOUC, Zustand) | §8 (mechanics) | COVERED (W-1) |
| Glass surface tokens | §9 | §10.2 (perf) | §2.3 (backdrop rule) | COVERED |
| Motion variants | §11 | §7 (Framer Motion) | §9 (semantics) | COVERED |
| Z-index layer scale | §12 | — | §2.2 (layer table) | COVERED |
| Spacing + typography + radius + shadow | §3–§5, §8 | §3.3 (naming map) | — | COVERED |
| YAML manifest sync with CSS | §13 | §3.2 (diff workflow) | — | COVERED |
| Token delivery pipeline | — | §3 | — | COVERED |
| Font loading strategy | §2 (font vars) | §6 | — | COVERED |

---

## Triage History

(No previous reports — initial run.)
