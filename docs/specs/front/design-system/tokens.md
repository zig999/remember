# Design System — Tokens (Remember)

> Part of: `docs/specs/front/design-system/` | Layer: permanent
> Index: [`_index.md`](./_index.md)
> Implementation file: `frontend/src/styles/theme.css` — Tailwind v4 `@theme` block (CSS-first; **no `tailwind.config.ts`**)
> Version: 1.0.0 | Status: draft

> This file is the **canonical source of truth** for all visual tokens consumed by Remember's frontend. Every component spec references token names from this file; no component invents raw values.
>
> Two formats — keep both in sync:
> - **CSS block** — implementation reference. Agents use Tailwind utility classes (`bg-surface-glass`, `text-content`, `rounded-md`) exclusively. `var(--token-name)` is only allowed for dynamic inline values with no equivalent Tailwind utility (e.g., a computed React Flow node position).
> - **YAML manifest** — machine-readable index for zero-ambiguity extraction by AI agents without CSS parsing.

> **Naming rule (Tailwind v4):** Token names follow the `--{category}-{semantic}` pattern, where category maps to Tailwind utility prefixes:
> `--color-*` → `bg-*`, `text-*`, `border-*`, `ring-*` | `--spacing-*` → `p-*`, `m-*`, `gap-*` | `--radius-*` → `rounded-*` | `--shadow-*` → `shadow-*` | `--text-*` → `text-*` (font-size) | `--duration-*` → `duration-*` | `--ease-*` → `ease-*` | `--z-*` → `z-*` | `--blur-*` → `backdrop-blur-*` | `--opacity-*` → `opacity-*`.
> Token name becomes the class suffix directly: `--color-content` → `text-content`. **Never** use prefixes that duplicate the category (`--color-bg-surface` → `bg-bg-surface` ❌).

> **Tailwind v4 border-namespace gotcha (load-bearing):** `--color-border-*` (color) and `--border-*` (width) are **two distinct namespaces**. Mixing them makes the border **silently disappear**. Every border MUST be written as the pair `border <color-token>` — e.g., `border border-border-glass` (width = default 1 px, color = glass border token). See `front.md §8.3`.

---

## 1. Token system overview

| Category | Purpose | Section |
|---|---|---|
| `color.*` | Theme background / surface / content; confidence-state colors (5); node-type colors (10); link/edge stylings (13); border-color namespace | §3, §6, §7 |
| `spacing.*` | 4-pt grid (`4 / 8 / 12 / 16 / 24 / 32`) | §4 |
| `text.*` | Typographic scale ("Terminal Native", 9 tokens, rem @ 13px base) | §5 |
| `radius.*` | iOS-flavored soft corners (5-step scale) | §8 |
| `shadow.*` | Layered elevation (4-step scale, very subtle) | §8 |
| `surface.glass.*` | Frosted-glass surface — background tint + border + blur per theme + level | §9 |
| `backdrop.treatment.*` | Per-theme ambient-backdrop treatment (darken + desaturate + blur) | §10 |
| `graph.depth.*` | The "fundo profundo" overlay used only in the Graph area | §10 |
| `border.*` | Border-width namespace (distinct from color namespace) | §7, §8 |
| `motion.*` | Durations, easings, and four named transition variants (uncertain pulse / promote / supersede / merge) | §11 |
| `z.*` | Layer / stacking scale | §12 |

---

## 2. Token declarations (CSS source of truth)

> Two themes share token **names**; the **values** for color/glass/backdrop differ between `dark` (default) and `light`. The Tailwind v4 `@theme` block sets defaults; a `[data-theme="light"] { ... }` override block applies the light values.

```css
/* ============================================================
   Remember design tokens — Tailwind v4 @theme (CSS-first).
   Implementation: frontend/src/styles/theme.css
   Default theme = dark. Light overrides live in [data-theme="light"].
   OKLCH is the source of truth. Hex shown for tooling reference only.
   ============================================================ */
@theme {
  /* ---------- Colors ---------- */

  /* Application surfaces — DARK defaults                                                       */
  /* Generated classes: --color-primary → bg-primary; --color-surface → bg-surface; etc.        */
  --color-primary:           oklch(15% 0.012 250);   /* ≈ #0e131a — root background under glass */
  --color-surface:           oklch(20% 0.014 250);   /* ≈ #161c25 — base workspace surface      */
  --color-elevated:          oklch(24% 0.016 250);   /* ≈ #1c2330 — elevated panels, dropdowns  */
  --color-input:             oklch(15% 0.012 250 / 0.55); /* translucent field — inputs on glass (a touch darker than panel) */

  /* Text hierarchy (opacity-based — see §5.3)                                                  */
  --color-content:           oklch(97% 0.008 250);   /* ≈ #f3f4f7 — titles, labels, primary text */
  --color-content-inverse:   oklch(98% 0.005 250);   /* ≈ #f8f9fb — text on saturated fills (action/accent/danger) */
  --color-body:              oklch(85% 0.010 250);   /* ≈ #d2d6dd — paragraphs, descriptions    */
  --color-muted:             oklch(65% 0.012 250);   /* ≈ #969aa6 — placeholders, metadata      */

  /* Primary action / focus                                                                     */
  --color-action:            oklch(68% 0.160 265);   /* ≈ #6793fa — PRIMARY (CTA, focused)       */
  --color-action-hover:      oklch(74% 0.130 265);   /* ≈ #82a8fd */
  --color-action-active:     oklch(60% 0.180 265);   /* ≈ #4a78ea */
  --color-accent:            oklch(66.1% 0.259 313); /* ≈ #c84dff — ACCENT (vivid violet highlight) */

  /* Generic semantic accents                                                                   */
  --color-data:              oklch(76% 0.125 210);   /* ≈ #27c6dd — metric/data highlight       */
  --color-warning:           oklch(78% 0.140 82);    /* ≈ #e4ad3c — attention (uncertain base)  */
  --color-danger:            oklch(64% 0.220 20);    /* ≈ #f53a51 — error / destructive         */

  /* ---------- Confidence-state colors (5 — the centerpiece) -----------------------------------
     Spec normative source: remember-modelagem-v7.md §3.5, §6.6.
     Threshold mapping (BFF):
       confidence ≥ 0.75  → accepted
       0.40 ≤ x < 0.75    → uncertain     (sinalizado; promovido por corroboração)
       confidence < 0.40  → low-confidence (NÃO consolida — show only in diagnostic UIs)
       conflict at same period → disputed (curation queue)
       replaced by a newer version → superseded
     -------------------------------------------------------------------------------------------- */
  --color-state-accepted:        oklch(72% 0.160 155);  /* ≈ #35c177 — green                       */
  --color-state-uncertain:       oklch(76% 0.150 82);   /* ≈ #e0a61e — amber                       */
  --color-state-low-confidence:  oklch(58% 0.025 260);  /* ≈ #727b8a — neutral grey (discreet)     */
  --color-state-disputed:        oklch(70% 0.180 45);   /* ≈ #f6722b — orange (distinct from amber)*/
  --color-state-superseded:      oklch(46% 0.018 260);  /* ≈ #525862 — muted grey                  */

  /* Same family — foreground == text on tinted background (AA over the bg token above)         */
  --color-state-accepted-fg:        oklch(96% 0.035 155);
  --color-state-uncertain-fg:       oklch(96% 0.035 82);
  --color-state-low-confidence-fg:  oklch(96% 0.008 260);
  --color-state-disputed-fg:        oklch(96% 0.020 45);
  --color-state-superseded-fg:      oklch(96% 0.008 260);

  /* ---------- NodeType colors (10 — normative catalog) ----------------------------------------
     Source: remember-modelagem-v7.md §15.1 + 0001_seed.sql (Document is seeded in 0001_seed).
     Mapping name → lucide-react icon is canonical (consumed by graph node component).
     -------------------------------------------------------------------------------------------- */
  --color-node-person:        oklch(74% 0.150 300);  /* ≈ #ba93fb — violet      | lucide: user           */
  --color-node-organization:  oklch(68% 0.130 250);  /* ≈ #549de5 — blue        | lucide: building-2     */
  --color-node-project:       oklch(74% 0.120 190);  /* ≈ #2ac3bb — teal        | lucide: rocket         */
  --color-node-event:         oklch(72% 0.170 35);   /* ≈ #fc7756 — coral       | lucide: calendar-clock */
  --color-node-role:          oklch(72% 0.180 325);  /* ≈ #db78e2 — magenta     | lucide: id-badge       */
  --color-node-category:      oklch(70% 0.100 130);  /* ≈ #8aab67 — olive       | lucide: tag            */
  --color-node-concept:       oklch(76% 0.130 88);   /* ≈ #d3ac41 — mustard     | lucide: lightbulb      */
  --color-node-location:      oklch(72% 0.120 155);  /* ≈ #60bb83 — sage-green  | lucide: map-pin        */
  --color-node-document:      oklch(70% 0.040 260);  /* ≈ #909fb8 — slate-blue  | lucide: file-text      */
  --color-node-task:          oklch(70% 0.170 22);   /* ≈ #f66c6d — terracotta  | lucide: square-check   */

  /* ---------- LinkType colors (13 — normative catalog) ----------------------------------------
     Source: remember-modelagem-v7.md §15.2 + 0001_seed.sql.
     Stroke style is decided in §7 (temporal = solid, stable = dashed).
     -------------------------------------------------------------------------------------------- */
  --color-link-participates-in:        oklch(70% 0.14 200);   /* temporal */
  --color-link-member-of:              oklch(68% 0.14 220);   /* temporal */
  --color-link-holds-role:             oklch(70% 0.14 280);   /* temporal */
  --color-link-responsible-for:        oklch(70% 0.16 25);    /* temporal */
  --color-link-reports-to:             oklch(70% 0.14 240);   /* temporal */
  --color-link-part-of:                oklch(65% 0.05 250);   /* stable   */
  --color-link-located-in:             oklch(68% 0.12 145);   /* stable   */
  --color-link-organizes:              oklch(72% 0.13 175);   /* temporal */
  --color-link-belongs-to-category:    oklch(70% 0.10 110);   /* stable   */
  --color-link-related-to:             oklch(60% 0.02 250);   /* stable   */
  --color-link-concerns:               oklch(72% 0.10 95);    /* stable   */
  --color-link-delivered-to:           oklch(72% 0.15 50);    /* temporal */
  --color-link-sponsors:               oklch(72% 0.13 220);   /* temporal */

  /* ---------- Border (color + width — TWO namespaces, do not mix) -----------------------------*/
  --color-border:            oklch(35% 0.012 250);     /* default separator / card border         */
  --color-border-glass:      oklch(95% 0.005 250 / 0.18); /* 18% white — top-edge of glass tile   */
  --color-border-focus:      oklch(68% 0.160 265);     /* ≈ #6793fa — same hue as --color-action   */
  --color-border-error:      oklch(64% 0.220 20);   /* mirrors --color-danger */
  --color-border-accepted:   oklch(72% 0.160 155);  /* mirrors --color-state-accepted */
  --color-border-uncertain:  oklch(76% 0.150 82);   /* mirrors --color-state-uncertain */
  --color-border-disputed:   oklch(70% 0.180 45);   /* mirrors --color-state-disputed */
  --color-border-superseded: oklch(46% 0.018 260);  /* mirrors --color-state-superseded */

  /* Border WIDTH namespace — distinct from color! */
  --border-thin:    1px;
  --border-DEFAULT: 1px;   /* class: border */
  --border-2:       2px;
  --border-thick:   3px;

  /* ---------- Container scale — width t-shirt sizes (see §4.1) -------------------------------*/
  --container-3xs: 16rem;  --container-2xs: 18rem;  --container-xs: 20rem;
  --container-sm:  24rem;  --container-md:  28rem;  --container-lg: 32rem;
  --container-xl:  36rem;  --container-2xl: 42rem;  --container-3xl: 48rem;
  --container-4xl: 56rem;  --container-5xl: 64rem;  --container-6xl: 72rem;  --container-7xl: 80rem;

  /* ---------- Spacing — 4-pt grid -----------------------------------------------------------*/
  --spacing-xs:  4px;
  --spacing-sm:  8px;
  --spacing-md:  12px;
  --spacing-lg:  16px;
  --spacing-xl:  24px;
  --spacing-2xl: 32px;

  /* ---------- Typography — "Terminal Native" (rem @ 13px <html> base) -----------------------*/
  --text-display:    2.77rem;  /* ~36px */  --text-display--font-weight: 700;  --text-display--letter-spacing: -0.02em;
  --text-heading:    1.385rem; /* ~18px */  --text-heading--font-weight: 600;  --text-heading--letter-spacing: -0.02em;
  --text-subheading: 1.077rem; /* ~14px */  --text-subheading--font-weight: 500;
  --text-body-lg:    1rem;     /* ~13px */  --text-body-lg--font-weight: 400;
  --text-body-sm:    0.923rem; /* ~12px */  --text-body-sm--font-weight: 400;
  --text-label:      0.923rem; /* ~12px */  --text-label--font-weight: 500;
  --text-badge:      0.923rem; /* ~12px */  --text-badge--font-weight: 700;
  --text-caption:    0.846rem; /* ~11px */  --text-caption--font-weight: 400;
  --text-code:       0.923rem; /* ~12px */  --text-code--font-weight: 400;
  --tracking-display: -0.02em;
  --tracking-heading: -0.02em;

  /* Font families — Space Grotesk = titles only; Space Mono = body / UI / everything else      */
  --font-sans: "Space Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "Space Mono", ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;

  /* ---------- iOS-flavored corners & elevation ---------------------------------------------*/
  --radius-sm:    6px;
  --radius-md:    10px;
  --radius-lg:    14px;
  --radius-xl:    20px;
  --radius-pill:  9999px;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.18);
  --shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.18);
  --shadow-lg: 0 12px 32px -6px rgba(0, 0, 0, 0.35), 0 4px 8px -4px rgba(0, 0, 0, 0.22);
  --shadow-glass: 0 8px 24px -6px rgba(0, 0, 0, 0.40), inset 0 1px 0 0 rgba(255, 255, 255, 0.06);

  /* ---------- Glass surface — frosted material ----------------------------------------------*/
  --surface-glass-ambient:   oklch(22% 0.012 250 / 0.55);
  --surface-glass-panel:     oklch(22% 0.012 250 / 0.65);
  --surface-glass-modal:     oklch(22% 0.012 250 / 0.78);

  --blur-glass-sm:  8px;
  --blur-glass-md:  16px;
  --blur-glass-lg:  24px;

  /* ---------- Ambient backdrop treatment ---------------------------------------------------*/
  --backdrop-darken:      0.55;
  --backdrop-desaturate:  0.30;
  --backdrop-blur:        12px;

  --graph-depth-overlay:  oklch(12% 0.012 250 / 0.92);

  /* Generic modal/dialog veil (distinct from the Graph-scoped --graph-depth-overlay).         */
  --color-overlay:        oklch(12% 0.012 250 / 0.60);

  /* ---------- Motion -----------------------------------------------------------------------*/
  --duration-instant:   100ms;
  --duration-fast:      200ms;
  --duration-moderate:  300ms;
  --duration-entrance:  500ms;
  --duration-pulse:    2400ms;

  --ease-out:        cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in:         cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);
  --ease-out-quint:  cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-back:       cubic-bezier(0.34, 1.56, 0.64, 1); /* overshoot (y>1; §9.1 v1.1.0) */

  /* ---------- Z-index scale ----------------------------------------------------------------*/
  --z-backdrop:  -1;
  --z-base:       0;
  --z-panel:     10;
  --z-drawer:    20;
  --z-popover:   30;
  --z-frame:     40;
  --z-modal:     50;
  --z-toast:     60;
}

/* ============================================================
   LIGHT theme override — same names, recalibrated values.
   Every color must clear WCAG 2.2 AA over the treated light backdrop.
   ============================================================ */
[data-theme="light"] {
  --color-primary:           oklch(98% 0.005 250);
  --color-surface:           oklch(94% 0.006 250);
  --color-elevated:          oklch(99% 0.003 250);
  --color-input:             oklch(88% 0.006 250 / 0.55); /* translucent field — a touch darker than the light glass panel */

  --color-content:           oklch(20% 0.014 250);
  --color-content-inverse:   oklch(98% 0.005 250);   /* white text still reads on the darker light-theme action/danger fills */
  --color-body:              oklch(35% 0.012 250);
  --color-muted:             oklch(55% 0.010 250);

  --color-action:            oklch(50% 0.18 265);   /* primary, light-tuned (same hue 265)      */
  --color-action-hover:      oklch(45% 0.19 265);
  --color-action-active:     oklch(40% 0.18 265);
  --color-accent:            oklch(55% 0.250 313); /* ≈ #a224d5 — accent, darker for light glass */

  --color-data:              oklch(55% 0.15 200);
  --color-warning:           oklch(58% 0.15 75);
  --color-danger:            oklch(50% 0.20 25);

  --color-state-accepted:        oklch(50% 0.17 150);
  --color-state-uncertain:       oklch(58% 0.15 75);
  --color-state-low-confidence:  oklch(60% 0.02 250);
  --color-state-disputed:        oklch(52% 0.18 45);
  --color-state-superseded:      oklch(60% 0.01 250);

  --color-state-accepted-fg:        oklch(20% 0.05 150);
  --color-state-uncertain-fg:       oklch(20% 0.05 75);
  --color-state-low-confidence-fg:  oklch(20% 0.005 250);
  --color-state-disputed-fg:        oklch(20% 0.05 45);
  --color-state-superseded-fg:      oklch(25% 0.005 250);

  /* NodeType / LinkType — re-tuned for light glass (lower lightness, keep hue). */
  --color-node-person:        oklch(55% 0.16 280);
  --color-node-organization:  oklch(48% 0.15 220);
  --color-node-project:       oklch(50% 0.16 175);
  --color-node-event:         oklch(55% 0.17 50);
  --color-node-role:          oklch(52% 0.16 320);
  --color-node-category:      oklch(50% 0.12 110);
  --color-node-concept:       oklch(55% 0.12 95);
  --color-node-location:      oklch(50% 0.13 145);
  --color-node-document:      oklch(50% 0.06 245);
  --color-node-task:          oklch(55% 0.17 25);

  --color-link-participates-in:     oklch(50% 0.15 200);
  --color-link-member-of:           oklch(48% 0.15 220);
  --color-link-holds-role:          oklch(52% 0.16 280);
  --color-link-responsible-for:     oklch(55% 0.17 25);
  --color-link-reports-to:          oklch(50% 0.15 240);
  --color-link-part-of:             oklch(50% 0.05 250);
  --color-link-located-in:          oklch(50% 0.13 145);
  --color-link-organizes:           oklch(52% 0.14 175);
  --color-link-belongs-to-category: oklch(50% 0.12 110);
  --color-link-related-to:          oklch(55% 0.02 250);
  --color-link-concerns:            oklch(55% 0.12 95);
  --color-link-delivered-to:        oklch(55% 0.16 50);
  --color-link-sponsors:            oklch(52% 0.14 220);

  --color-border:            oklch(80% 0.010 250);
  --color-border-glass:      oklch(20% 0.005 250 / 0.14);
  --color-border-focus:      oklch(50% 0.18 265);
  /* Confidence-state borders mirror the light state colors above (W-DS-1):
     without these, the borders would inherit dark-calibrated values on light glass. */
  --color-border-error:      oklch(50% 0.20 25);
  --color-border-accepted:   oklch(50% 0.17 150);
  --color-border-uncertain:  oklch(58% 0.15 75);
  --color-border-disputed:   oklch(52% 0.18 45);
  --color-border-superseded: oklch(60% 0.01 250);

  --surface-glass-ambient:   oklch(98% 0.005 250 / 0.60);
  --surface-glass-panel:     oklch(98% 0.005 250 / 0.72);
  --surface-glass-modal:     oklch(98% 0.005 250 / 0.85);

  --backdrop-darken:      0.18;
  --backdrop-desaturate:  0.25;
  --backdrop-blur:        14px;

  --graph-depth-overlay:  oklch(98% 0.005 250 / 0.88);

  /* Modal veil stays a dark scrim on light theme so modal content lifts off the page. */
  --color-overlay:        oklch(20% 0.014 250 / 0.40);

  --shadow-sm: 0 1px 2px 0 rgba(20, 24, 32, 0.10);
  --shadow-md: 0 4px 12px -2px rgba(20, 24, 32, 0.14), 0 2px 4px -2px rgba(20, 24, 32, 0.08);
  --shadow-lg: 0 12px 32px -6px rgba(20, 24, 32, 0.18), 0 4px 8px -4px rgba(20, 24, 32, 0.12);
  --shadow-glass: 0 8px 24px -6px rgba(20, 24, 32, 0.20), inset 0 1px 0 0 rgba(255, 255, 255, 0.40);
}
```

---

## 3. Color tokens (semantic surface + content)

### 3.1 Surface and content

| CSS token | Tailwind class | Intent | Use here | Do NOT use here |
|---|---|---|---|---|
| `--color-primary` | `bg-primary` | Root background under the glass frame | `html`, `body`, the `__root` layout | Modals, glass panels, popovers |
| `--color-surface` | `bg-surface` | Solid content surface (where no glass is wanted) | The 404 fallback body, sign-in card body | Floating panels (use glass tokens) |
| `--color-elevated` | `bg-elevated` | Solid elevated surface | Tooltip body, very dense dropdown | Workspace background |
| `--color-content` | `text-content` | Primary text | Titles, field labels, key values | Helper text |
| `--color-body` | `text-body` | Body text | Paragraphs, descriptions | Page titles |
| `--color-muted` | `text-muted` | Lowest-priority text | Placeholders, metadata, hints | Field labels |

### 3.2 Action and alert

| CSS token | Tailwind class | Intent | Use here | Do NOT use here |
|---|---|---|---|---|
| `--color-action` | `bg-action` / `text-action` | The primary action color (CTA + focus accent) | Primary button, focus ring base hue | KPI, neutral data |
| `--color-action-hover` | `bg-action-hover` | Hover state of the primary action | — | — |
| `--color-action-active` | `bg-action-active` | Pressed state | — | — |
| `--color-accent` | `bg-accent` / `text-accent` | Vivid violet accent / highlight (≈ #c84dff) — secondary brand color | Accent highlights, gradient CTA end-stop | Large fills, body text |
| `--color-data` | `text-data` / `bg-data` | Informational data highlight | Metric callouts, neutral charts | Buttons, alerts |
| `--color-warning` | `text-warning` / `bg-warning` | Attention | Warning banners | Positive data, primary action |
| `--color-danger` | `text-danger` / `bg-danger` | Error / destructive | Validation errors, destructive confirm | Mild alerts |

**Critical rule:** `--color-data` is **not** an action color. Never use `bg-data` on a button, link, or any element that triggers an operation.

### 3.3 Text hierarchy — via opacity, never via different hues

| Level | Description | Token |
|---|---|---|
| Primary | Titles, labels, active values | `text-content` |
| Secondary | Body text, descriptions | `text-body` |
| Tertiary | Hints, metadata, timestamps | `text-muted` |
| Placeholder | Input placeholder | `text-muted` |

**Forbidden:** different hues to create text hierarchy; more than 3 text hierarchy levels per component.

---

## 4. Spacing tokens (4-pt grid)

| Token | Tailwind class | Typical usage |
|---|---|---|
| `--spacing-xs` | `p-xs`, `gap-xs`, `m-xs` | Icon ↔ label gap, badge padding |
| `--spacing-sm` | `p-sm`, `gap-sm`, `m-sm` | Inline element gap, tag padding |
| `--spacing-md` | `p-md`, `gap-md`, `m-md` | Button padding, default form-field gap |
| `--spacing-lg` | `p-lg`, `gap-lg`, `m-lg` | Card padding, spacing between nearby sections |
| `--spacing-xl` | `p-xl`, `gap-xl`, `m-xl` | Margin between sections, container padding |
| `--spacing-2xl` | `p-2xl`, `gap-2xl`, `m-2xl` | Spacing between distinct content blocks |

> **Mandatory — 4-pt grid:** use only multiples of 4 px (4, 8, 12, 16, 24, 32, 48, 64).
> **Forbidden values:** 5, 7, 9, 10, 13, 15, 17 px.
> **Forbidden Tailwind classes:** `p-5`, `p-7`, `p-9`, `p-11` (map to 20/28/36/44 px — outside the grid).
> **Forbidden:** arbitrary values such as `p-[13px]` or `gap-[7px]`.

### 4.1 Container scale (width t-shirt sizes)

`max-w-*` / `min-w-*` t-shirt sizes resolve against the `--container-*` scale (rem-based, 1rem = 13px
base): `max-w-sm` = 24rem, `max-w-md` = 28rem, … `max-w-7xl` = 80rem (full scale `3xs`→`7xl`).
Use these for content/panel widths (form column, card, dialog, dropdown).

> **Why it needs an explicit override (load-bearing):** the named `--spacing-*` tokens **shadow** the
> container scale *inside* the `max-w-*`/`min-w-*` utilities — Tailwind v4 lets spacing win, so
> `max-w-sm` would otherwise resolve to `var(--spacing-sm)` = 8px and silently collapse the layout.
> `theme.css` fixes this with **unlayered** `.max-w-*`/`.min-w-*` rules pointing at `var(--container-*)`
> (an unlayered declaration outranks anything in `@layer utilities`). Do **not** use `@utility` for
> this — it merges into the same rule and Tailwind's spacing declaration still wins. The `--container-*`
> scale also feeds Tailwind container-query variants (`@sm:`, `@md:`). Numeric widths (`max-w-96`) and
> named padding/gap (`p-md`) are unaffected.

---

## 5. Typographic scale ("Terminal Native")

> **Two families:** Space Grotesk (display + headings only) · Space Mono (body, UI, labels,
> badges, code — **the body font**). Loaded via Google Fonts in `index.html`.
> **Non-standard base:** `html { font-size: 13px }` — so `1rem ≈ 13px` and the scale is in `rem`
> (spacing stays in absolute px and is unaffected). Global `letter-spacing: 0`; titles get
> `-0.02em` via `--tracking-display` / `--tracking-heading`, applied automatically to `h1`, `h2`,
> `[data-typo]`. Smoothing: antialiased + grayscale.
> **Weight + tracking** are baked into each `text-*` utility via Tailwind v4 modifiers
> (`--text-*--font-weight` / `--text-*--letter-spacing`); **family** is applied by element
> (body = mono; `h1`/`h2`/`[data-typo]` = sans).

| Token | Tailwind class | Size (≈px) | Weight | Family | Default color | Usage |
|---|---|---|---|---|---|---|
| `--text-display` | `text-display` | 2.77rem (~36) | 700 | Grotesk | `text-content` | Page / hero titles |
| `--text-heading` | `text-heading` | 1.385rem (~18) | 600 | Grotesk | `text-content` | Section titles, card headers |
| `--text-subheading` | `text-subheading` | 1.077rem (~14) | 500 | Mono | `text-content` | Subtitles, group labels, sidebar sections |
| `--text-body-lg` | `text-body-lg` | 1rem (~13) | 400 | Mono | `text-body` | Primary body, descriptions |
| `--text-body-sm` | `text-body-sm` | 0.923rem (~12) | 400 | Mono | `text-body` | Secondary text, metadata |
| `--text-label` | `text-label` | 0.923rem (~12) | 500 | Mono | `text-content` | Form labels, table headers |
| `--text-badge` | `text-badge` | 0.923rem (~12) | 700 | Mono | `text-content` | Pills, chips, status badges |
| `--text-caption` | `text-caption` | 0.846rem (~11) | 400 | Mono | `text-muted` | Hints, timestamps, versions |
| `--text-code` | `text-code` | 0.923rem (~12) | 400 | Mono | `text-body` | UUIDs, technical values, snippets |

### 5.1 Line-height by context

| Context | Tailwind class | Value | Rule |
|---|---|---|---|
| Headings (20 px+) | `leading-tight` | 1.2 | Tighter — titles scanned |
| Body (14–16 px) | `leading-relaxed` | 1.6 | Looser — body read linearly |
| Caption (12 px) | `leading-snug` | 1.4 | Compact but readable |

**Forbidden:** `leading-none` or `leading-loose` in any UI context.

### 5.2 Font weight by role

| Role | Tailwind | Applies to |
|---|---|---|
| Headings | `font-medium` / `font-semibold` | Section titles, page titles |
| Form labels | `font-medium` | Field labels |
| Body / values | `font-normal` | Paragraphs, input values |
| Highlighted numbers | `font-bold` | Metrics, KPI values |

**Forbidden:** `font-bold` on running text; `font-light` on any text smaller than 24 px.

---

## 6. Confidence-state colors (5) and NodeType colors (10)

### 6.1 Confidence states — the centerpiece of "confiança explícita"

> Normative thresholds (BFF — `remember-modelagem-v7.md §3.5 / §6.6`):
> `accepted` ⇐ `confidence ≥ 0.75`
> `uncertain` ⇐ `0.40 ≤ confidence < 0.75` (sinalizado, promovido por corroboração)
> `low-confidence` ⇐ `confidence < 0.40` (**não consolida** — only diagnostic UIs render it)
> `disputed` ⇐ conflict at the same period (curation queue)
> `superseded` ⇐ replaced by a newer version (historical view)

| State | Color token | FG token | Border token | Tailwind classes (bg + text) | Lucide icon | Motion |
|---|---|---|---|---|---|---|
| `accepted` | `--color-state-accepted` | `--color-state-accepted-fg` | `--color-border-accepted` | `bg-state-accepted` + `text-state-accepted-fg` | `check-circle-2` | none (still) |
| `uncertain` | `--color-state-uncertain` | `--color-state-uncertain-fg` | `--color-border-uncertain` | `bg-state-uncertain` + `text-state-uncertain-fg` | `help-circle` | `motion.pulse.uncertain` (slow opacity oscillation, see §11) |
| `low-confidence` | `--color-state-low-confidence` | `--color-state-low-confidence-fg` | — | `bg-state-low-confidence` + `text-state-low-confidence-fg` | `circle-dashed` | none |
| `disputed` | `--color-state-disputed` | `--color-state-disputed-fg` | `--color-border-disputed` | `bg-state-disputed` + `text-state-disputed-fg` | `git-fork` | none (the badge is loud enough) |
| `superseded` | `--color-state-superseded` | `--color-state-superseded-fg` | `--color-border-superseded` | `bg-state-superseded` + `text-state-superseded-fg` | `archive` | `motion.transition.supersede` on entering this state |

> **Contrast guarantee:** every `(bg-state-* + text-state-*-fg)` pair clears **WCAG 2.2 AA ≥ 4.5:1** in both themes.

### 6.2 Transitions between states (StateBadge consumes these)

| From → To | Motion variant | Token |
|---|---|---|
| `uncertain` → `accepted` | Color morph + halo collapse | `motion.transition.promote` |
| any → `superseded` | Fade to grey + slide on Y axis | `motion.transition.supersede` |
| two `node` → one `node` (merge) | Two badges collapse to one | `motion.transition.merge` |

See §11 for the exact durations and easings.

### 6.3 NodeType catalog (10) — color + lucide-react icon

Normative source: `remember-modelagem-v7.md §15.1` + migration `0001_seed.sql` (includes Document, consolidated from the former Tier-1 catalog).

| NodeType | Color token | Tailwind class (bg + border) | lucide-react icon | Semantic meaning |
|---|---|---|---|---|
| Person | `--color-node-person` | `bg-node-person` + `border-node-person` | `user` | Pessoa física |
| Organization | `--color-node-organization` | `bg-node-organization` + `border-node-organization` | `building-2` | Empresa, instituição, time |
| Project | `--color-node-project` | `bg-node-project` + `border-node-project` | `rocket` | Iniciativa com objetivo e prazo |
| Event | `--color-node-event` | `bg-node-event` + `border-node-event` | `calendar-clock` | Acontecimento datado |
| Role | `--color-node-role` | `bg-node-role` + `border-node-role` | `id-badge` | Papel exercido por uma pessoa |
| Category | `--color-node-category` | `bg-node-category` + `border-node-category` | `tag` | Categoria / classe taxonômica |
| Concept | `--color-node-concept` | `bg-node-concept` + `border-node-concept` | `lightbulb` | Conceito abstrato, tema |
| Location | `--color-node-location` | `bg-node-location` + `border-node-location` | `map-pin` | Lugar físico ou virtual |
| Document | `--color-node-document` | `bg-node-document` + `border-node-document` | `file-text` | Documento (Tier 1, seeded em 0001_seed) |
| Task | `--color-node-task` | `bg-node-task` + `border-node-task` | `square-check` | Tarefa com status / priority |

> **Implementation rule:** the mapping `nodeType → (colorToken, lucideIcon)` lives in **one** module — `frontend/src/features/graph/types/node-type-map.ts`. Every consumer (graph node renderer, search result card, provenance drawer) imports from there. Inlining colors per consumer is forbidden.

---

## 7. LinkType catalog (13) — colors + temporal vs stable stroke

Normative sources: `remember-modelagem-v7.md §15.2` + migration `0001_seed.sql`. The `is_temporal` boolean on each LinkType drives the **stroke style**.

| LinkType | Color token | Temporal? | Stroke style (React Flow `edgeType`) | Default `markerEnd` |
|---|---|---|---|---|
| `participates_in` | `--color-link-participates-in` | **temporal** | **solid** (`strokeDasharray: 0`) | arrow |
| `member_of` | `--color-link-member-of` | **temporal** | **solid** | arrow |
| `holds_role` | `--color-link-holds-role` | **temporal** | **solid** | arrow |
| `responsible_for` | `--color-link-responsible-for` | **temporal** | **solid** | arrow |
| `reports_to` | `--color-link-reports-to` | **temporal** | **solid** | arrow |
| `part_of` | `--color-link-part-of` | stable | **dashed** (`strokeDasharray: 4 4`) | arrow |
| `located_in` | `--color-link-located-in` | stable | **dashed** | arrow |
| `organizes` | `--color-link-organizes` | **temporal** | **solid** | arrow |
| `belongs_to_category` | `--color-link-belongs-to-category` | stable | **dashed** | arrow |
| `related_to` | `--color-link-related-to` | stable | **dashed** | arrow (thin) |
| `concerns` | `--color-link-concerns` | stable | **dashed** | arrow |
| `delivered_to` | `--color-link-delivered-to` | **temporal** | **solid** | arrow |
| `sponsors` | `--color-link-sponsors` | **temporal** | **solid** | arrow |

### 7.1 Edge stroke widths (the `--border-*` namespace)

| Token | Tailwind class | Use |
|---|---|---|
| `--border-thin` (1 px) | `stroke-[length:var(--border-thin)]` | Default edge weight |
| `--border-2` (2 px) | `stroke-[length:var(--border-2)]` | Corroborated (≥ 2 sources) — visually "stronger" edge |
| `--border-thick` (3 px) | `stroke-[length:var(--border-thick)]` | Selected edge |

> Confidence visually thickens the edge: 1 source → 1 px, 2 sources → 2 px, ≥ 3 sources → 3 px. Selection toggles to thick regardless.

### 7.2 Cross-namespace pair (border-color vs border-width) — load-bearing

**Always declare both halves.** Examples:

| Want | Correct | Incorrect (border vanishes) |
|---|---|---|
| 1 px default border in glass color | `border border-border-glass` | `border-border-glass` alone |
| 2 px accepted-state outline | `border-2 border-border-accepted` | `border-border-accepted` alone |
| 3 px error outline | `border-thick border-border-error` | `border-border-error` alone |

---

## 8. Radius and shadow (iOS aesthetic — explicit semantic tokens)

> Soft corners, subtle layered shadows, and the clean typographic scale of §5 together realize the iOS aesthetic mandated by `frontend-analise-funcional.md §9`. None of these are decorative — they are **semantic tokens** that every component spec references.

| Token | Tailwind class | Use |
|---|---|---|
| `--radius-sm` (6 px) | `rounded-sm` | Badges, tags, small buttons |
| `--radius-md` (10 px) | `rounded-md` | Standard buttons, cards, inputs |
| `--radius-lg` (14 px) | `rounded-lg` | Panels, popovers |
| `--radius-xl` (20 px) | `rounded-xl` | Modals, large glass tiles |
| `--radius-pill` (9999 px) | `rounded-pill` | Pill / capsule badges |

| Token | Tailwind class | Use |
|---|---|---|
| `--shadow-sm` | `shadow-sm` | Base-level cards, focused form fields |
| `--shadow-md` | `shadow-md` | Dropdowns, tooltips, anchored glass panels |
| `--shadow-lg` | `shadow-lg` | Modals, drawers |
| `--shadow-glass` | `shadow-glass` | The dedicated glass tile lift (drop + inner top-edge highlight) — see §9 |

> **iOS aesthetic rules (mandatory):**
> - Layered subtle shadows — never harsh; `--shadow-lg` is the maximum.
> - Soft corners — never less than `--radius-md` for a clickable surface; never less than `--radius-sm` for a badge.
> - The clean typographic scale of §5 is part of the same aesthetic — it is not optional.

---

## 9. Glass surface tokens (frosted material)

> Glass is the material of every floating layer (z1–z4) and of the header/footer frame. It is composed of **four** ingredients: a translucent tinted background, a top-edge inner highlight (via `--shadow-glass`), a thin border in the glass-border color, and a `backdrop-filter: blur(...)`.

### 9.1 Levels

| Level | Background token | Blur token | Border token (color) | Border width | Shadow | Where to use |
|---|---|---|---|---|---|---|
| `ambient` | `--surface-glass-ambient` | `--blur-glass-sm` (8 px) | `--color-border-glass` | `border` (1 px) | `--shadow-sm` | Header, footer |
| `panel` | `--surface-glass-panel` | `--blur-glass-md` (16 px) | `--color-border-glass` | `border` (1 px) | `--shadow-md` + `--shadow-glass` | Graph filter panels, selection context, provenance drawer |
| `modal` | `--surface-glass-modal` | `--blur-glass-lg` (24 px) | `--color-border-glass` | `border` (1 px) | `--shadow-lg` + `--shadow-glass` | Modals, command palette |

### 9.2 Tailwind class composition

The composite class for a glass surface — **always** all four ingredients:

```
bg-surface-glass-{level}  backdrop-blur-glass-{size}  border border-border-glass  shadow-glass
```

Examples (literal):

- Panel: `bg-surface-glass-panel backdrop-blur-glass-md border border-border-glass shadow-glass`
- Modal: `bg-surface-glass-modal backdrop-blur-glass-lg border border-border-glass shadow-glass shadow-lg`
- Ambient (header/footer): `bg-surface-glass-ambient backdrop-blur-glass-sm border border-border-glass shadow-sm`

> **Do not** stop at three of the four ingredients. The two-namespace border gotcha (color vs width) makes missing pieces silently invisible.

### 9.3 Contrast guarantee

For each level, the composition of `surface-glass-*` × `backdrop-treatment` (per theme) MUST yield a background dark enough (dark theme) or light enough (light theme) that `text-content` clears **WCAG 2.2 AA ≥ 4.5:1**. This is part of the spec's acceptance — a Reviewer rejects the theme calibration if any combination fails contrast.

---

## 10. Ambient backdrop and graph-depth overlay

### 10.1 Ambient backdrop (`z-backdrop`)

The landscape photograph (one per theme) sits at `z-backdrop` and is always treated:

| Token | Default (dark) | Light override |
|---|---|---|
| `--backdrop-darken` | `0.55` (dark) | `0.18` |
| `--backdrop-desaturate` | `0.30` | `0.25` |
| `--backdrop-blur` | `12px` | `14px` |

Composite CSS effect (declared once in `AmbientBackdrop.tsx`):

```css
filter:
  blur(var(--backdrop-blur))
  saturate(calc(1 - var(--backdrop-desaturate)))
  brightness(calc(1 - var(--backdrop-darken)));
```

### 10.2 Graph depth overlay (Graph area exception)

Between `z-backdrop` and the Graph canvas (`z-base`), the Graph area inserts an extra near-opaque overlay:

| Token | Dark | Light |
|---|---|---|
| `--graph-depth-overlay` | `oklch(12% 0.012 250 / 0.92)` (near-black, 92%) | `oklch(98% 0.005 250 / 0.88)` (near-white, 88%) |

This realizes `layout.md §5`'s "fundo profundo" rule: in the Graph the canvas color must dominate, so the landscape recedes to a barely-perceived texture. **Implementation:** the Graph route mounts an absolutely-positioned `<div className="absolute inset-0 bg-graph-depth-overlay" />` directly above the backdrop in its layout slot.

---

## 11. Motion tokens — "movimento com significado"

### 11.1 Duration and easing tokens

| Token | Tailwind | Value | Use |
|---|---|---|---|
| `--duration-instant` | `duration-instant` | 100 ms | Hover, focus ring, toggle |
| `--duration-fast` | `duration-fast` | 200 ms | Dropdown, tooltip, badge color morph |
| `--duration-moderate` | `duration-moderate` | 300 ms | Drawer, popover, glass surface entrance, promotion morph |
| `--duration-entrance` | `duration-entrance` | 500 ms | Page entrance, supersession, entity merge collapse |
| `--duration-pulse` | `duration-pulse` | 2400 ms | One full cycle of the uncertain pulse |

| Token | Tailwind | Curve | Use |
|---|---|---|---|
| `--ease-out` | `ease-out` | `cubic-bezier(0.25, 1, 0.5, 1)` | Entering elements (default) |
| `--ease-in` | `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Leaving elements |
| `--ease-in-out` | `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | State toggles |
| `--ease-out-quint` | `ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | Dramatic entrance |
| `--ease-out-expo` | `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Snappy, high-impact |
| `--ease-back` | `ease-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot/pop (check-in, pop-in, switch thumb) — y>1 allowed since v1.1.0 |

### 11.2 Semantic motion variants (Framer Motion)

All six variants are exported from `frontend/src/lib/motion.ts`. Components do **not** invent their own — they import.

| Variant | Purpose | Animated properties | Duration / easing | Iteration |
|---|---|---|---|---|
| `motion.pulse.uncertain` | "Provisional" hint on the uncertain state | `opacity: 1 → 0.55 → 1` | `--duration-pulse` (2400 ms), `--ease-in-out` | infinite (loops while the state is uncertain) |
| `motion.transition.promote` | Uncertain → accepted | `backgroundColor` (state-uncertain → state-accepted) AND `scale: 1 → 1.06 → 1` (halo collapse) | `--duration-moderate` (300 ms), `--ease-out-quint` | once |
| `motion.transition.supersede` | Any → superseded | `opacity: 1 → 0.45` AND `y: 0 → 4` (slight slide down to the historical layer) | `--duration-entrance` (500 ms), `--ease-in` | once |
| `motion.transition.merge` | Two nodes → one (entity match merge) | source node `x, y` → target node `x, y` AND `opacity: 1 → 0`; target receives `scale: 1 → 1.08 → 1` (absorb) | `--duration-entrance` (500 ms), `--ease-out-expo` | once |
| `motion.transition.glass-panel` | Glass panel enter/exit (floating panels, popovers, provenance drawer) | enter: `opacity: 0 → 1` AND `y: 8 → 0`; exit: `opacity: 1 → 0` AND `y: 0 → 8` | enter: `--duration-fast` (200 ms) `--ease-out`; exit: `--duration-instant` (100 ms) `--ease-in` | once (enter on mount, exit on unmount inside `AnimatePresence`) |
| `motion.transition.glass-modal` | Glass modal enter/exit (modals, command palette) | enter: `opacity: 0 → 1` AND `scale: 0.96 → 1`; exit: `opacity: 1 → 0` AND `scale: 1 → 0.96` | enter: `--duration-moderate` (300 ms) `--ease-out-quint`; exit: `--duration-instant` (100 ms) `--ease-in` | once (enter on mount, exit on unmount inside `AnimatePresence`) |
|  | Glass panel enter/exit (floating panels, popovers, provenance drawer) | enter:  AND ; exit:  AND  | enter:  (200 ms) ; exit:  (100 ms)  | once (enter on mount, exit on unmount) |
|  | Glass modal enter/exit (modals, command palette) | enter:  AND ; exit:  AND  | enter:  (300 ms) ; exit:  (100 ms)  | once (enter on mount, exit on unmount) |

### 11.3 Motion rules

> **Relaxed 2026-06-19 (owner-directed, front.md §9 v1.1.0):** decorative motion is now allowed; the
> reduced-motion gate is **removed as a rule** and the **anti-bounce/elastic restriction is removed**.
> The one rule that stays mandatory: components consume variants from `lib/motion.ts` (§11.2) — no
> inline variants.

- **Reduced-motion gate REMOVED as a rule.** `@media (prefers-reduced-motion: no-preference)` / `useReducedMotion()` is optional/ad hoc per behaviour — not required either way. Motion may run unconditionally. Existing gated behaviours may keep or drop their gates.
- **Bounce / elastic easings are ALLOWED** (`cubic-bezier` with y outside `[0, 1]`, spring/overshoot curves) — useful for the modern/technological feel.
- Animate **preferably `transform` and `opacity`** (best perf). Avoid animating `width` / `height` / `padding` / `margin` where a transform works — but this is now guidance, not a hard ban.
- `transition: all` is still discouraged — name properties explicitly.
- Durations/easings SHOULD come from §11.1 tokens; new factories may introduce additional curves (including bounce) in `lib/motion.ts` as needed.

---

## 12. Z-index / layer tokens

| Token | Tailwind class | z-index | Layer (see `front.md §2.2`) |
|---|---|---|---|
| `--z-backdrop` | `z-backdrop` | `-1` | Ambient backdrop (landscape) |
| `--z-base` | `z-base` | `0` | Workspace base (the mounted area) |
| `--z-panel` | `z-panel` | `10` | Graph panels (filters, selection context) |
| `--z-drawer` | `z-drawer` | `20` | Provenance drawer |
| `--z-popover` | `z-popover` | `30` | Popovers, pickers, dropdowns |
| `--z-frame` | `z-frame` | `40` | Header + footer |
| `--z-modal` | `z-modal` | `50` | Command palette, modals |
| `--z-toast` | `z-toast` | `60` | Sonner toasts |

---

## 13. Token manifest (YAML — sync with §2)

```yaml
# token-manifest — keep in sync with the CSS @theme block in §2.
# Format: {category}.{token-suffix}: {value (dark default)}
color:
  primary:                "oklch(15% 0.012 250)"
  surface:                "oklch(20% 0.014 250)"
  elevated:               "oklch(24% 0.016 250)"
  input:                  "oklch(15% 0.012 250 / 0.55)"  # translucent field surface (inputs on glass)
  content:                "oklch(97% 0.008 250)"
  content-inverse:        "oklch(98% 0.005 250)"   # text on saturated fills (action/accent/danger)
  body:                   "oklch(85% 0.010 250)"
  muted:                  "oklch(65% 0.012 250)"
  action:                 "oklch(68% 0.160 265)"   # PRIMARY ≈ #6793fa
  action-hover:           "oklch(74% 0.130 265)"
  action-active:          "oklch(60% 0.180 265)"
  accent:                 "oklch(66.1% 0.259 313)" # ACCENT ≈ #c84dff
  data:                   "oklch(76% 0.125 210)"
  warning:                "oklch(78% 0.140 82)"
  danger:                 "oklch(64% 0.220 20)"
  overlay:                "oklch(12% 0.012 250 / 0.60)"  # generic modal/dialog veil
  state-accepted:         "oklch(72% 0.160 155)"
  state-uncertain:        "oklch(76% 0.150 82)"
  state-low-confidence:   "oklch(58% 0.025 260)"
  state-disputed:         "oklch(70% 0.180 45)"
  state-superseded:       "oklch(46% 0.018 260)"
  state-accepted-fg:        "oklch(96% 0.035 155)"
  state-uncertain-fg:       "oklch(96% 0.035 82)"
  state-low-confidence-fg:  "oklch(96% 0.008 260)"
  state-disputed-fg:        "oklch(96% 0.020 45)"
  state-superseded-fg:      "oklch(96% 0.008 260)"
  node-person:            "oklch(74% 0.150 300)"
  node-organization:      "oklch(68% 0.130 250)"
  node-project:           "oklch(74% 0.120 190)"
  node-event:             "oklch(72% 0.170 35)"
  node-role:              "oklch(72% 0.180 325)"
  node-category:          "oklch(70% 0.100 130)"
  node-concept:           "oklch(76% 0.130 88)"
  node-location:          "oklch(72% 0.120 155)"
  node-document:          "oklch(70% 0.040 260)"
  node-task:              "oklch(70% 0.170 22)"
  link-participates-in:        "oklch(70% 0.14 200)"
  link-member-of:              "oklch(68% 0.14 220)"
  link-holds-role:             "oklch(70% 0.14 280)"
  link-responsible-for:        "oklch(70% 0.16 25)"
  link-reports-to:             "oklch(70% 0.14 240)"
  link-part-of:                "oklch(65% 0.05 250)"
  link-located-in:             "oklch(68% 0.12 145)"
  link-organizes:              "oklch(72% 0.13 175)"
  link-belongs-to-category:    "oklch(70% 0.10 110)"
  link-related-to:             "oklch(60% 0.02 250)"
  link-concerns:               "oklch(72% 0.10 95)"
  link-delivered-to:           "oklch(72% 0.15 50)"
  link-sponsors:               "oklch(72% 0.13 220)"
  border:                "oklch(35% 0.012 250)"
  border-glass:          "oklch(95% 0.005 250 / 0.18)"
  border-focus:          "oklch(68% 0.160 265)"
  border-error:          "oklch(64% 0.220 20)"
  border-accepted:       "oklch(72% 0.160 155)"
  border-uncertain:      "oklch(76% 0.150 82)"
  border-disputed:       "oklch(70% 0.180 45)"
  border-superseded:     "oklch(46% 0.018 260)"
border:        # WIDTH namespace — distinct from color!
  thin:    "1px"
  DEFAULT: "1px"
  "2":     "2px"
  thick:   "3px"
spacing:
  xs:   "4px"
  sm:   "8px"
  md:   "12px"
  lg:   "16px"
  xl:   "24px"
  "2xl": "32px"
container:               # §4.1 — width t-shirt sizes (max-w-*/min-w-*), rem against 13px base
  "3xs": "16rem"
  "2xs": "18rem"
  xs:    "20rem"
  sm:    "24rem"
  md:    "28rem"
  lg:    "32rem"
  xl:    "36rem"
  "2xl": "42rem"
  "3xl": "48rem"
  "4xl": "56rem"
  "5xl": "64rem"
  "6xl": "72rem"
  "7xl": "80rem"
font:
  sans: '"Space Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  mono: '"Space Mono", ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace'
text:                  # "Terminal Native" — rem against the 13px <html> base
  display:    "2.77rem"
  heading:    "1.385rem"
  subheading: "1.077rem"
  body-lg:    "1rem"
  body-sm:    "0.923rem"
  label:      "0.923rem"
  badge:      "0.923rem"
  caption:    "0.846rem"
  code:       "0.923rem"
radius:
  sm:    "6px"
  md:    "10px"
  lg:    "14px"
  xl:    "20px"
  pill:  "9999px"
shadow:
  sm:    "0 1px 2px 0 rgba(0,0,0,0.18)"
  md:    "0 4px 12px -2px rgba(0,0,0,0.25), 0 2px 4px -2px rgba(0,0,0,0.18)"
  lg:    "0 12px 32px -6px rgba(0,0,0,0.35), 0 4px 8px -4px rgba(0,0,0,0.22)"
  glass: "0 8px 24px -6px rgba(0,0,0,0.40), inset 0 1px 0 0 rgba(255,255,255,0.06)"
surface-glass:
  ambient: "oklch(22% 0.012 250 / 0.55)"
  panel:   "oklch(22% 0.012 250 / 0.65)"
  modal:   "oklch(22% 0.012 250 / 0.78)"
blur-glass:
  sm: "8px"
  md: "16px"
  lg: "24px"
backdrop:
  darken:      "0.55"
  desaturate:  "0.30"
  blur:        "12px"
graph:
  depth-overlay: "oklch(12% 0.012 250 / 0.92)"
duration:
  instant:   "100ms"
  fast:      "200ms"
  moderate:  "300ms"
  entrance:  "500ms"
  pulse:     "2400ms"
ease:
  out:        "cubic-bezier(0.25, 1, 0.5, 1)"
  in:         "cubic-bezier(0.7, 0, 0.84, 0)"
  in-out:     "cubic-bezier(0.65, 0, 0.35, 1)"
  out-quint:  "cubic-bezier(0.22, 1, 0.36, 1)"
  out-expo:   "cubic-bezier(0.16, 1, 0.3, 1)"
  back:       "cubic-bezier(0.34, 1.56, 0.64, 1)"   # overshoot — y>1 allowed (§9.1 v1.1.0)
z:
  backdrop: "-1"
  base:     "0"
  panel:    "10"
  drawer:   "20"
  popover:  "30"
  frame:    "40"
  modal:    "50"
  toast:    "60"
```

---

## 14. Semantic usage rules (canonical)

- `--color-data` is exclusive to data highlights — never an action color (never on a button or link).
- `--color-warning` is attention; `--color-danger` is error. Do not interchange.
- `--color-action` appears on at most **1** primary element per screen.
- Text on glass uses `text-content` or `text-body` — never a state color or a node-type color.
- `--color-border-focus` is exclusive to focus / selection — not decorative.
- Spacing tokens are used via Tailwind classes (`p-md`, `gap-lg`) — never arbitrary px.
- `style=""` / `style={{}}` is forbidden except for dynamic values with no token equivalent (e.g., a React Flow node `x` / `y` coordinate computed by `d3-force`).
- Every border MUST come with **both** color and width — never declare one without the other (see §7.2).
- Every animation MUST reference both a `duration-*` token and an `ease-*` token (no bare ms values).
- Every animation MUST be wrapped in `@media (prefers-reduced-motion: no-preference)`.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-18 | Spec Writer | initial | Foundation tokens: 5 confidence states, 10 NodeType colors + lucide icons, 13 LinkType colors with temporal/stable stroke distinction, glass surface (3 levels) + treated ambient backdrop + graph-depth overlay, dark default + light override, 4 semantic motion variants (uncertain pulse / promote / supersede / merge), Tailwind v4 two-namespace border rules, z-index scale. | -- |
| 1.0.1 | 2026-06-19 | Front Spec Agent | patch | Cross-domain review: added 2 GlassSurface enter/exit motion variants (`motion.transition.glass-panel` / `motion.transition.glass-modal`) to §11.2. Updated introductory count from "four" to "six". These were defined in `GlassSurface.component.spec.md §7` but absent from the canonical token catalog. | sdd_front |
| 1.0.2 | 2026-06-19 | Owner review | patch | Resolved review warnings: added the 5 confidence-state border-color tokens (`error`/`accepted`/`uncertain`/`disputed`/`superseded`) to the `[data-theme="light"]` override so they no longer inherit dark-calibrated values (W-DS-1); corrected catalog provenance comments (§6.3, §7, NodeType/LinkType source comments) to cite `0001_seed.sql` instead of the consolidated-away `0002_catalog_tier1.sql` (W-DS-2). | -- |
| 1.1.0 | 2026-06-19 | owner-directed | minor | Added `--color-content-inverse` + `--color-overlay` (§3) and the `--container-*` scale (§4.1, with the unlayered `max-w-*`/`min-w-*` override fixing the spacing-collision). §11.3 motion rules **relaxed** (front.md §9 v1.1.0): decorative motion allowed; reduced-motion gate **removed as a rule**; anti-bounce/elastic restriction removed; transform/opacity-only and max-2-props downgraded to guidance. One rule kept: components consume `lib/motion.ts` variants. | owner |
