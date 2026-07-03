# design-system-tokens -- Back-end Spec (frontend implementation reference)

> Stack: Vite 6 + React 19 + TypeScript (strict) + Tailwind CSS v4 (CSS-first) | DB: N/A | Version: 1.0.0 | Status: draft | Layer: permanent
> Business spec: `tokens.md`
>
> **Domain shape.** This is a frontend design-system foundation domain — there is no backend, no database, no domain events. "Back" here means **the technical decisions the implementation group needs in order to wire the tokens into the React/Vite/Tailwind/Storybook toolchain**. Sections of `TEMPLATE.back.md` that map to BFF concerns (data model, BRs, state machine, EVs, integrations) are marked `N/A` with the reason — `u-spec-back-writing` §Quality Gate explicitly allows this.

---

## 1. Stack and Patterns

| Aspect | Value | Note |
|--------|-------|------|
| Build / runtime | Vite 6 + React 19 + TypeScript strict | CLAUDE.md default |
| CSS engine | Tailwind CSS v4, **CSS-first via `@theme`** | CLAUDE.md default — **`tailwind.config.ts` is forbidden** |
| Tailwind entry | `@import "tailwindcss";` (v4 syntax) | **NEVER** `@tailwind base/components/utilities` (v3) — Known Gotchas / CLAUDE.md |
| Theme source of truth | `frontend/src/styles/theme.css` (single file, `@theme` block + `[data-theme="light"]` override) | The CSS block in `tokens.md` §2 is copied verbatim. Spec and CSS must stay in sync (Section 3 of this doc) |
| Class composer | `cn()` = `tailwind-merge` + `clsx` in `frontend/src/lib/utils.ts` | CLAUDE.md default — string concatenation forbidden |
| Variant API | `class-variance-authority` (CVA) **only when ≥ 2 visual variants** | CLAUDE.md default — single-variant components use plain `cn()` |
| Motion library | Framer Motion via `frontend/src/lib/motion.ts` (semantic variant module) | Token-driven variants exported once, never re-declared per component |
| Icon library | `lucide-react` — mapping centralized in `frontend/src/features/graph/types/node-type-map.ts` | `tokens.md` §6.3 declares this is the single source for `nodeType → (color, icon)` pairs |
| Font loading | **System Inter fallback + bundled `@fontsource-variable/inter`** (npm package, self-hosted woff2) | See §6 below — no Google Fonts CDN |
| Storybook | Storybook 9 (`@storybook/react-vite`), `addon-a11y` + `addon-vitest` | CLAUDE.md default — `preview.tsx` imports `theme.css` (§9) |
| Theme switching | `[data-theme="dark"|"light"]` attribute on `<html>`; Zustand store + `useEffect` syncer | See §4 below |
| Validation | N/A | No DTOs / no runtime data — tokens are static CSS |

---

## 2. Data Model

> **N/A — no persistent data.** Tokens are static CSS custom properties declared in `theme.css` at build time. No tables, no migrations, no FKs. Three artifacts (CSS, YAML manifest, TypeScript node-type map) are the only persistence-adjacent concerns and they live in source control.

**Static artifacts inventory:**

| Artifact | Path | Format | Authority | Sync rule |
|----------|------|--------|-----------|-----------|
| CSS theme | `frontend/src/styles/theme.css` | CSS `@theme` block + `[data-theme="light"]` override | **Build-time source of truth for Tailwind v4** | Mirror of `tokens.md` §2 CSS block — Section 3 of this doc enforces the diff workflow |
| YAML manifest | `frontend/src/styles/token-manifest.yaml` | YAML (per `tokens.md` §13) | **Machine-readable index for AI agents / tooling** | Mirror of `tokens.md` §13 — same diff workflow |
| Node-type map | `frontend/src/features/graph/types/node-type-map.ts` | TypeScript `const` map | **Single source for `nodeType → (colorToken, lucideIcon)`** | Manually curated; every entry must match `tokens.md` §6.3 row-for-row |

---

## 3. Token delivery mechanism (spec → CSS → Tailwind utility → component)

The pipeline is **fully static** — there is no runtime token registry, no JS token object, no token-to-CSS-variable converter. Tailwind v4 generates utility classes directly from `@theme` declarations.

### 3.1 Flow

```
tokens.md  (canonical spec; humans + AI agents read this)
   │   diff workflow (§3.2)
   ▼
frontend/src/styles/theme.css   (CSS source of truth — @theme block)
   │   processed by @tailwindcss/vite at build time
   ▼
Generated utility classes      (bg-state-accepted, text-content, rounded-md, …)
   │   imported once via @import "tailwindcss" in app entry
   ▼
Components consume utilities   (className="bg-state-accepted text-state-accepted-fg rounded-md")
```

### 3.2 Diff workflow — `tokens.md` ↔ `theme.css` ↔ `token-manifest.yaml`

Three files carry the same data. Drift is the load-bearing risk of this domain. **Rule:** every change to a token goes through `tokens.md` first; CSS and YAML are downstream copies.

| Step | Tool | Purpose |
|------|------|---------|
| 1 | Edit `docs/specs/front/design-system/tokens.md` | Spec change goes here first (Changelog updated) |
| 2 | Mirror the §2 CSS block into `frontend/src/styles/theme.css` | Verbatim copy of CSS — no edits while transcribing |
| 3 | Mirror the §13 YAML block into `frontend/src/styles/token-manifest.yaml` | Verbatim copy of YAML |
| 4 | If a NodeType/LinkType is added/removed, update `frontend/src/features/graph/types/node-type-map.ts` accordingly | Catalog matches `tokens.md` §6.3 / §7 |
| 5 | Run `npm run typecheck && npm run build && npm run build-storybook` inside `frontend/` | Compile gate (CSS errors and missing classes surface here) |

> **No automated sync script in v1.0.** Adding a generator is explicit out-of-scope (§8). A static checker that asserts CSS / YAML agree with `tokens.md` is a candidate for a future iteration once the spec stabilizes; for now the diff workflow is human-discipline + code review.

### 3.3 Naming-to-utility mapping (Tailwind v4 auto-generation)

Tailwind v4 derives utility prefixes from the **first segment** of the CSS variable name (`tokens.md` "Naming rule"). Implementation consequence:

| `@theme` declaration | Generated Tailwind utility class |
|----------------------|----------------------------------|
| `--color-state-accepted: …;` | `bg-state-accepted`, `text-state-accepted`, `border-state-accepted`, `ring-state-accepted` |
| `--spacing-md: 12px;` | `p-md`, `m-md`, `gap-md`, `space-x-md`, … |
| `--radius-lg: 14px;` | `rounded-lg` |
| `--shadow-glass: …;` | `shadow-glass` |
| `--text-display: 30px;` | `text-display` (font-size; collides cleanly with `text-{color}` because Tailwind resolves by utility kind) |
| `--duration-fast: 200ms;` | `duration-fast` |
| `--ease-out-quint: cubic-bezier(…)` | `ease-out-quint` |
| `--blur-glass-md: 16px;` | `backdrop-blur-glass-md` |
| `--z-modal: 41;` | `z-modal` |

**Hard rule (load-bearing):** never prefix a token with its category twice — `--color-bg-surface` would generate `bg-bg-surface`, which is forbidden by `tokens.md` Naming rule.

---

## 4. Dual border namespace — implementation pattern (load-bearing)

The CLAUDE.md "Known Gotchas" section calls this out: **`--color-border-*` (color) and `--border-*` (width) are two distinct namespaces in Tailwind v4. Mixing them makes the border silently disappear** (renders as transparent or zero-width with no console warning).

### 4.1 Required pair pattern

**Every border declaration consists of exactly two utility classes:** one width, one color. Either alone is broken.

| Intent | Correct (visible) | Wrong (silently invisible) |
|--------|-------------------|----------------------------|
| 1 px glass border | `border border-border-glass` | `border-border-glass` (no width → zero width) |
| 2 px accepted outline | `border-2 border-border-accepted` | `border-border-accepted` alone |
| 3 px error outline | `border-thick border-border-error` | `border-border-error` alone |
| 1 px default | `border border-border` | `border-border` alone |

> `border` alone (without color) renders the Tailwind default border color (commonly black/grey) — also wrong because it ignores the theme.

### 4.2 Enforcement strategy

| Mechanism | Layer | What it catches |
|-----------|-------|-----------------|
| Code review | Manual | First line of defense — reviewers know the rule |
| Storybook visual regression | Stories with `addon-vitest` browser mode | A border that visually disappears between commits is caught by snapshot |
| Component spec | Each component spec (`*.component.spec.md`) | Spec must declare the **pair** — never just a color or just a width |
| ESLint rule | **Deferred (§8)** | A linter that flags `border-border-*` not preceded by a width utility is a candidate; not built in v1 |

### 4.3 Why the gotcha exists

Tailwind v4's CSS-first design lets `@theme` declare arbitrary `--{namespace}-*` variables, and each namespace generates its own family of utilities. `border-*` (e.g., `border-thin`, `border-2`, `border-thick`) is a **width** utility — it maps to `border-width: var(--border-thin)`. `border-{color}` (e.g., `border-border-glass`, `border-state-accepted`) is a **color** utility — it maps to `border-color: var(--color-border-glass)`. The two never substitute for each other. Without a width utility, the element's `border-width` falls back to `0` (or the user-agent default of `medium` reset by Tailwind's preflight, which Tailwind sets to `0`). No paint → no border.

---

## 5. Dark / light theming — implementation

### 5.1 Mechanism

`tokens.md` §2 declares dark as the default (inside `@theme`) and light as an override scoped to `[data-theme="light"]`. The actual toggle happens by mutating the `data-theme` attribute on the root `<html>` element.

```ts
// frontend/src/lib/theme.ts (sketch — not normative code)
type ThemeMode = "dark" | "light";
document.documentElement.setAttribute("data-theme", mode);
```

### 5.2 State management

| Concern | Decision |
|---------|----------|
| State location | Zustand store `useThemeStore` in `frontend/src/stores/theme.ts` |
| Persistence | `localStorage` key `remember.theme` (via `zustand/middleware/persist`) |
| Initial value | `localStorage` value → else `prefers-color-scheme` media query → else `"dark"` (the spec default) |
| Applier | A small `useEffect` in `frontend/src/app/ThemeProvider.tsx` that mirrors the store value to `document.documentElement.dataset.theme` |
| Listener for OS changes | `matchMedia("(prefers-color-scheme: dark)").addEventListener("change", …)` — applied only if the user has **not** set an explicit preference |

### 5.3 Hydration / FOUC prevention

Vite + React 19 is a **client-rendered SPA** (no SSR in v1) — there is no hydration-mismatch risk in the SSR sense. However, the page can briefly paint with the wrong theme between the initial HTML render and React mount.

**Mitigation:** a **blocking inline `<script>` in `index.html`** runs before any React code and sets `data-theme` from `localStorage` / `prefers-color-scheme`:

```html
<!-- in index.html <head>, before the module script -->
<script>
  (function () {
    try {
      var stored = localStorage.getItem("remember.theme");
      var mode = stored === "light" || stored === "dark"
        ? stored
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", mode);
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  })();
</script>
```

> Inline script is a deliberate exception to "no script tags in component spec" — it is the only practical way to set the theme before the first paint. It is ~250 bytes and changes nothing about the rest of the build.

### 5.4 No SSR caveat

`tokens.md` does not require SSR. If SSR is introduced later, the inline script must be replicated server-side (or the `data-theme` attribute must be set from the request cookie). Treat that as an explicit future-work item.

---

## 6. Font loading strategy

`tokens.md` §2 declares:

```css
--font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
```

### 6.1 Decision: self-host Inter via `@fontsource-variable/inter`

| Concern | Decision |
|---------|----------|
| Source | npm package `@fontsource-variable/inter` (variable font; weights 100–900 covered by a single woff2 file) |
| Mono | **System fallback only** — `ui-monospace` is universally available on macOS/iOS, Windows 11, and recent Linux distributions. No bundled mono in v1 |
| Hosting | Self-hosted via Vite's static asset pipeline — no Google Fonts CDN, no external HTTP request at runtime |
| Import location | `frontend/src/styles/theme.css` — single `@import "@fontsource-variable/inter";` at the top of the file |
| `font-display` | `swap` (the default for `@fontsource`) — the system fallback is paint-blocked only briefly, then swaps to Inter when ready |
| Subsetting | Variable font, all Latin glyphs — Remember is pt-BR + en-us only, no extra subsetting needed (the package's `latin` subset already includes pt-BR accented characters) |

### 6.2 Rationale (vs. alternatives)

| Alternative | Why rejected |
|-------------|--------------|
| Google Fonts CDN (`<link href="…fonts.googleapis.com…">`) | Extra DNS + TCP + TLS handshake before first paint; privacy footprint; defeats the offline-friendly nature of a personal knowledge tool |
| `<link rel="preload">` to a self-hosted woff2 | Equivalent result but more boilerplate than `@fontsource` — `@fontsource` already injects the `@font-face` rule |
| System-only (drop Inter) | Inter is the spec's chosen face (iOS aesthetic, §8 of `tokens.md`); system sans varies too much across platforms |

### 6.3 Performance impact

| Asset | Approximate size (gzip / brotli) |
|-------|----------------------------------|
| `inter-latin-wght-normal.woff2` (variable) | ~50 KB / ~45 KB |

Well within the 300 KB initial-bundle budget (CLAUDE.md Performance Budgets — Frontend).

---

## 7. Motion implementation — Framer Motion + token mapping

### 7.1 Module structure

```
frontend/src/lib/motion.ts          ← all four semantic variants exported from here
frontend/src/lib/motion-tokens.ts   ← thin re-export of the duration / easing tokens as JS values
```

**`motion-tokens.ts`** (sketch — not normative code):

```ts
// Tokens are CSS variables at runtime; Framer Motion needs JS numbers/strings.
// Mirror tokens.md §11.1 exactly. Drift between this file and theme.css is the load-bearing risk.
export const duration = {
  instant:  0.1,    // 100ms
  fast:     0.2,
  moderate: 0.3,
  entrance: 0.5,
  pulse:    2.4,
} as const;

export const ease = {
  out:       [0.25, 1, 0.5, 1] as const,
  in:        [0.7, 0, 0.84, 0] as const,
  inOut:     [0.65, 0, 0.35, 1] as const,
  outQuint:  [0.22, 1, 0.36, 1] as const,
  outExpo:   [0.16, 1, 0.3, 1] as const,
};
```

**`motion.ts`** exports the four normative variants of `tokens.md` §11.2 — `pulse.uncertain`, `transition.promote`, `transition.supersede`, `transition.merge`. Each one composes `duration` and `ease` from `motion-tokens.ts`. Components import these variants — they never declare their own.

### 7.2 Reduced-motion enforcement

`tokens.md` §11.3 mandates: every animation must respect `prefers-reduced-motion`. Implementation:

| Layer | Mechanism |
|-------|-----------|
| Framer Motion | A `<MotionConfig reducedMotion="user">` wrapper at the app root in `App.tsx` — Framer Motion automatically disables animation when the OS preference is "reduce" |
| CSS-only animations (e.g., the uncertain pulse if it falls back to keyframes) | The keyframe declaration is wrapped in `@media (prefers-reduced-motion: no-preference) { … }` so the animation simply does not exist when the user prefers reduced motion |

### 7.3 `AnimatePresence` placement

`AnimatePresence` is needed for the `supersede` and `merge` variants (elements that exit the DOM during the animation). Placement rules:

| Variant | `AnimatePresence` placement |
|---------|----------------------------|
| `pulse.uncertain` | None — element does not exit |
| `transition.promote` | None — element stays mounted, only its tokens change |
| `transition.supersede` | Wrap the **parent list** (e.g., the timeline column, the search results list) — so the leaving item plays its exit before unmount |
| `transition.merge` | Wrap the **graph canvas** root — the source node exits while the target node plays its absorb scale |

> Wrap **at the smallest stable parent** — not at the app root. App-root `AnimatePresence` triggers full-tree exit on route changes, which is not what we want.

### 7.4 Token bridge — CSS variables vs JS values

Framer Motion accepts both `"var(--duration-fast)"` (as a string in `transition.duration`) and numeric values. For consistency and TypeScript safety, **we use JS values from `motion-tokens.ts`** — and a Storybook test asserts these match the CSS values. The duplication is acknowledged technical debt; it stays manageable because the motion table is short and rarely changes.

---

## 8. Icon integration — lucide-react × NodeType colors

### 8.1 Single mapping module

`tokens.md` §6.3 mandates the mapping `nodeType → (colorToken, lucideIcon)` lives in **one** file. Implementation:

```
frontend/src/features/graph/types/node-type-map.ts
```

Shape (sketch — not normative code):

```ts
import { User, Building2, Rocket, CalendarClock, IdBadge, Tag,
         Lightbulb, MapPin, FileText, SquareCheck, type LucideIcon } from "lucide-react";

export type NodeTypeName =
  | "person" | "organization" | "project" | "event" | "role"
  | "category" | "concept" | "location" | "document" | "task";

export const nodeTypeMap: Record<NodeTypeName, { icon: LucideIcon; colorClass: string; borderClass: string }> = {
  person:       { icon: User,          colorClass: "bg-node-person",        borderClass: "border-node-person" },
  organization: { icon: Building2,     colorClass: "bg-node-organization",  borderClass: "border-node-organization" },
  // ... 8 more — one row per row in tokens.md §6.3
};
```

### 8.2 Consumption rule

Every consumer (`GraphNode.tsx`, `SearchResultCard.tsx`, `ProvenanceDrawer.tsx`, `EntityBadge.tsx`) **imports `nodeTypeMap` and reads icon + class strings from it**. Inlining a color or an icon literal in a consumer is forbidden — caught in code review and Storybook visual regression.

### 8.3 Icon size convention

Lucide icons accept `size` (px) or `className`. We use **`className`** with Tailwind's `size-*` utilities, which pulls from the `--spacing-*` namespace:

| Context | Class | Pixels |
|---------|-------|--------|
| Inline with body text | `size-sm` | 8 px — N/A, too small in practice |
| Inline with subheading | `size-md` | 12 px |
| Graph node badge | `size-lg` | 16 px |
| Section header | `size-xl` | 24 px |

> Lucide's `stroke-width` default is 2 — keep it. Override per case via `strokeWidth={1.5}` only when an icon visually overpowers neighbors at small sizes.

### 8.4 Bundle impact

`lucide-react` is tree-shakable per icon — only the ~10 icons referenced in `node-type-map.ts` are bundled. Estimated cost: ~3–4 KB gzipped total.

---

## 9. CVA integration pattern

CVA (`class-variance-authority`) is used **only when a component has 2+ visual variants** (CLAUDE.md "Component contract"). For state-driven components, CVA is the canonical way to map `state` and `nodeType` props to token classes.

### 9.1 State-variant pattern (StateBadge / FragmentCard)

```ts
// frontend/src/features/graph/components/StateBadge.variants.ts (sketch — not normative code)
import { cva } from "class-variance-authority";

export const stateBadge = cva(
  "inline-flex items-center gap-xs rounded-pill px-sm py-xs text-caption font-medium border",
  {
    variants: {
      state: {
        accepted:        "bg-state-accepted text-state-accepted-fg border-border-accepted",
        uncertain:       "bg-state-uncertain text-state-uncertain-fg border-border-uncertain",
        "low-confidence":"bg-state-low-confidence text-state-low-confidence-fg",
        disputed:        "bg-state-disputed text-state-disputed-fg border-border-disputed",
        superseded:      "bg-state-superseded text-state-superseded-fg border-border-superseded",
      },
    },
    defaultVariants: { state: "accepted" },
  }
);
```

Note the **border pair pattern** (§4.1) is preserved inside the variant string — `border` (width) + `border-border-{state}` (color). Every variant either includes both halves or — for `low-confidence`, which has no border token — omits both.

### 9.2 NodeType-variant pattern (GraphNode)

```ts
// 10 variants, one per NodeType row in tokens.md §6.3
export const graphNode = cva(
  "rounded-md border px-sm py-xs text-label",
  {
    variants: {
      nodeType: {
        person:       "bg-node-person/15 border-node-person text-content",
        organization: "bg-node-organization/15 border-node-organization text-content",
        // ... 8 more
      },
    },
  }
);
```

> The `/15` opacity suffix is Tailwind v4 syntax for "node-person color at 15% alpha" — used because graph nodes need a tinted fill, not a solid fill. This is **not** an arbitrary value (Tailwind v4 supports `/n` alpha natively).

### 9.3 Type extraction

```ts
import type { VariantProps } from "class-variance-authority";
type StateBadgeVariants = VariantProps<typeof stateBadge>;
// StateBadgeVariants["state"] = "accepted" | "uncertain" | ...
```

Component prop types **extend** `VariantProps` — never re-declare the state enum.

### 9.4 When NOT to use CVA

- Single-variant components (e.g., `Container`, `PageTitle`) — use a plain `cn()` template
- Components whose variation is purely structural (slot-based composition) — variation is in JSX, not class strings

---

## 10. Performance considerations

### 10.1 CSS bundle size — Tailwind v4 JIT

Tailwind v4 generates only the utility classes that appear in source files (auto-detected — no `content` array needed). Cost ceiling:

| Source | Estimate (gzipped) |
|--------|--------------------|
| Generated utilities (full token set used) | ~25–40 KB |
| `theme.css` (`@theme` block + light override) | ~3 KB |
| Inter variable woff2 | ~50 KB |

Total CSS + font budget: ~75–100 KB gzipped — well within the 300 KB initial-bundle budget (CLAUDE.md Performance Budgets — Frontend).

### 10.2 Backdrop-filter performance

`backdrop-filter: blur(…)` is GPU-accelerated on all targeted browsers but can be expensive on low-end hardware (notably Intel UHD integrated graphics, older Android). Mitigations:

| Mitigation | Where |
|------------|-------|
| Limit to **three blur sizes** (`8 / 16 / 24` px — `--blur-glass-{sm,md,lg}`) — never custom | Already enforced by `tokens.md` §9.1 |
| Avoid blur on full-viewport elements unless necessary (panels, modals are OK; backdrop overlay is not blurred — only the ambient backdrop image is) | `AmbientBackdrop.tsx` applies `filter` (cheap) to the image element, not `backdrop-filter` to a sibling |
| **`will-change: backdrop-filter`** — apply with caution; only on glass surfaces that animate in/out | Component-level decision, documented in `surface.component.spec.md` (future) |
| Reduce blur radius for the `ambient` level (only 8 px, smallest of the three) | Already the spec default |

> **Deferred:** a `prefers-reduced-transparency` media query that disables blur entirely is a future enhancement — not all browsers support it yet (Safari only, as of 2026-06). Spec it when support is broad.

### 10.3 Re-paint cost — color tokens via CSS variables

Theme toggle changes `data-theme` once → triggers one style recalculation for the entire tree. With ~50 declared CSS variables this is a single repaint of ~5–15 ms on a mid-range laptop. Acceptable; no further optimization needed.

### 10.4 OKLCH color space — browser support

OKLCH (`tokens.md` §2 uses it for every color) is supported in all browser engines targeted by the project (Chrome 111+, Firefox 113+, Safari 15.4+). No fallback strategy required.

### 10.5 Font loading critical path

`@fontsource-variable/inter` injects `@font-face` with `font-display: swap`. First Contentful Paint uses the system fallback; the swap to Inter happens within ~200 ms on a typical connection. LCP (CLAUDE.md target < 2.5 s) is not impacted because the LCP element is typically text rendered immediately by the fallback.

---

## 11. Storybook integration

### 11.1 Token availability in stories

Storybook 9 uses Vite as its builder (`@storybook/react-vite`) — the same Vite config that builds the app. The Tailwind v4 plugin is therefore active in Storybook automatically.

**Required:** `theme.css` must be imported once in `.storybook/preview.tsx`:

```tsx
// .storybook/preview.tsx (sketch — not normative code)
import "../src/styles/theme.css";   // ← makes @theme tokens + all generated utilities available
```

Without this import, Storybook stories render in the browser-default font with no tokens — the page looks unstyled.

### 11.2 Theme switcher in Storybook

Use **`@storybook/addon-themes`** (or a custom toolbar decorator) to expose a dark/light toggle in the Storybook toolbar. Implementation:

```tsx
// .storybook/preview.tsx — sketch
import { withThemeByDataAttribute } from "@storybook/addon-themes";

export const decorators = [
  withThemeByDataAttribute({
    themes: { dark: "dark", light: "light" },
    defaultTheme: "dark",
    attributeName: "data-theme",
    parentSelector: "html",
  }),
];
```

> Mirrors the app's runtime mechanism (§5) — stories see the same theme system the app uses.

### 11.3 Stories that test tokens

| Story file | Purpose |
|------------|---------|
| `src/styles/tokens.stories.tsx` (new — deliverable of this domain) | Visual catalog: each color swatch + token name; spacing scale ladder; type scale ladder; radius scale; shadow scale; motion variant playground |
| `src/styles/glass.stories.tsx` | The three glass levels on top of the ambient backdrop — visually verifies contrast (`tokens.md` §9.3) |
| `src/styles/motion.stories.tsx` | Interactive playground for the four semantic variants (uncertain pulse, promote, supersede, merge) |

These stories are tested as components via `addon-vitest` browser mode (the project's standard — see CLAUDE.md "Testing — Frontend"). A snapshot diff catches accidental token drift.

### 11.4 Build gate

`npm run build-storybook` must succeed as part of the spec deliverable. CSS errors and missing utility classes surface here (Tailwind v4 generates classes lazily — a typo in `bg-state-acepted` produces a class that matches nothing, but does **not** fail the build by default. The visual story catalog above is what surfaces the typo).

---

## 12. Business Rules (BR)

> **N/A — frontend foundation domain, no business rules.** Token usage rules (e.g., "never use `--color-data` on a button") are **stylistic / governance rules** documented in `tokens.md` §14. They are enforced by code review and Storybook visual regression — not by runtime validation. No backend, no UCs, no `error.code` mapping applies.

---

## 13. State Machine (ST)

> **N/A — no entity lifecycle.** The five confidence states (`accepted` / `uncertain` / `low-confidence` / `disputed` / `superseded`) are **the BFF's** state machine (declared in `remember-modelagem-v7.md §6.6`) — this domain provides only the **visual representation** of those states (color + icon + motion variant). It is a renderer of state, not an owner.

---

## 14. Domain Events (EV)

> **N/A — no events.** Token changes are deploy-time edits to `theme.css`, not runtime events. No producer, no consumers, no payloads.

---

## 15. External Integrations

> **N/A — no external services.** All assets (Inter font, lucide icons) are self-hosted via npm packages. No CDN, no API calls.

---

## 16. Known Technical Constraints

- **Tailwind v4 + addon-vitest version pinning.** CLAUDE.md "Known Gotchas" — `vitest` is pinned at v4 and there is a Vite override because of `addon-vitest`. Do not bump `vitest` or `vite` while editing this domain without re-validating the Storybook browser mode (which runs the token stories as tests).
- **Two-namespace border gotcha.** §4 above is load-bearing — implementation MUST honor the pair pattern everywhere. The CLAUDE.md "Known Gotchas" entry is repeated for emphasis.
- **OKLCH-only spec.** All color tokens are OKLCH (`tokens.md` §2). Targeted browsers all support OKLCH; if a hypothetical future browser target lacks it, every color value would need to be re-authored — there is no automatic fallback.
- **System font fallback fidelity.** Inter loads asynchronously (font-display: swap). For the ~200 ms before swap, the page paints in `system-ui` — close to Inter but not identical. The iOS aesthetic (`tokens.md` §8) accepts this trade-off.
- **No automated spec ↔ CSS sync.** §3.2 is a human-discipline workflow. A static checker is feasible but out-of-scope for v1 (§17).
- **No SSR.** §5.4 — if SSR is introduced later, the theme-set inline script must be replicated server-side.
- **`backdrop-filter` performance ceiling.** §10.2 — low-end hardware may stutter at three concurrent panels with `blur(24px)`. The spec's three-level cap (`8 / 16 / 24` px) is the mitigation; no further fallback is built in v1.
- **Tailwind v4 JIT — no class concatenation at runtime.** Class names must appear **as literal strings** in source files for Tailwind to detect them. `` `bg-state-${state}` `` is **forbidden** — use CVA (§9) or an explicit `Record<State, string>` map. This is why `node-type-map.ts` enumerates the 10 classes verbatim.
- **CLAUDE.md `i18n: false`.** The spec is pt-BR only — no per-locale font fallbacks needed. If en-US is ever added, Inter already covers the glyph set.

---

## 17. Out of Scope

- **Token-generation script.** No automated transformer from `tokens.md` → `theme.css` / `token-manifest.yaml`. The diff workflow (§3.2) is manual.
- **Token-consistency linter.** No ESLint or custom-checker rule that asserts every `border-border-*` is preceded by a width utility. Reviewers + Storybook visual regression are the safety net.
- **A11y addon-vitest assertions on contrast.** Storybook `addon-a11y` flags low-contrast text in stories, but it does not perform the full WCAG 2.2 AA verification that the spec mandates for **every** glass × content × state combination. A dedicated contrast-matrix test is a future-work item.
- **`prefers-reduced-transparency` support.** §10.2 — disable blur when the OS asks. Implement when browser support broadens.
- **CSS-only fallback for OKLCH.** No `oklch() → rgb()` fallback authored. Targeted browsers all support OKLCH.
- **Mono-font self-hosting.** §6 — `ui-monospace` system fallback only. No bundled JetBrains Mono in v1.
- **SSR.** §5.4 — single-page application only.
- **Design-token export to other consumers** (mobile, native, Figma plugin). The CSS + YAML pair targets the web app exclusively.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-18 | Back Spec Agent | initial | Initial technical decisions for the design-system-tokens foundation domain: Tailwind v4 CSS-first delivery (`theme.css` mirror of `tokens.md` §2/§13), dual border-namespace pair pattern, `data-theme` attribute toggle with FOUC-prevention inline script, self-hosted Inter via `@fontsource-variable/inter`, Framer Motion variant module in `lib/motion.ts`, single `node-type-map.ts` for lucide-icon + color pairs, CVA pattern for state/type variants, Storybook 9 integration with `theme.css` import and theme-by-data-attribute decorator, performance ceiling on `backdrop-filter`. Domain has no BFF — BR/ST/EV/integrations marked N/A with justification. | -- |
