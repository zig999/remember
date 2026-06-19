# Front-end Spec — Global (Remember)

> Stack: Vite 6 + React 19 + TypeScript strict | State: Zustand v5 (client) + TanStack Query v5 (server) | Fetching: TanStack Query v5 over Fastify REST + MCP
> Version: 1.0.0 | Status: draft | Layer: permanent

> This is the global frontend architecture document for the Remember SPA — written once, updated as the project evolves. Per-feature configurations (data fetching, error mapping, transforms) go in each `.feature.spec.md`. The foundation of the design system lives in `design-system/`. This wave specifies **the foundation only**; the five functional areas (Graph / Search / Ingest / Curation / History) are out of scope here and will be specified in subsequent `/u-spec` waves.

> Normative sources:
> - Project Charter and infrastructure deviations — `CLAUDE.md` (root)
> - Domain catalog (10 NodeTypes, 13 LinkTypes, confidence thresholds, temporal model) — `remember-modelagem-v7.md` (§3.5, §4–§6, §15)
> - Functional analysis (UI behavior per area) — `temp/front/frontend-analise-funcional.md`
> - Structural skeleton (3 regions + z-1 backdrop + glass layers) — `temp/front/layout.md`

---

## 1. Stack and Patterns

The frontend stack is **fixed** by `CLAUDE.md`. Substitutions require an explicit owner instruction and a Change Request.

- **Framework / build:** Vite 6
- **Language:** TypeScript **strict mode** (`"strict": true`, `"noUncheckedIndexedAccess": true`)
- **UI library:** React 19 — `ref` is a normal prop, **no `forwardRef`**
- **Styling:** Tailwind CSS v4, **CSS-first** via `@theme` in `theme.css` — **no `tailwind.config.ts`**
- **Component primitives:** shadcn/ui on Radix UI — files under `components/ui/` are **owned code** (do not regenerate via CLI; extend by composition)
- **Client state:** Zustand v5
- **Server state / data fetching:** TanStack Query v5 (`@tanstack/react-query`)
- **Routing:** TanStack Router (type-safe)
- **Tables:** TanStack Table
- **Forms:** React Hook Form v7 + Zod v4 (`zodResolver`), schema-first (`schema → z.infer → form`)
- **Animation:** Framer Motion (mandatory `prefers-reduced-motion` gate)
- **Notifications:** sonner (toasts)
- **Icons:** lucide-react (the only icon set; 10 NodeType icons live in `design-system/tokens.md §6`)
- **Graph visualization:** **React Flow `@xyflow/react` v12 (MIT)** for rendering + **`d3-force`** for layout (see §7)
- **Design-system playground:** Storybook 9 (`@storybook/react-vite`) with `addon-a11y` and `addon-vitest` (browser mode)
- **Testing:** Vitest (unit) + Playwright (E2E) + MSW (network mocks). Stories run as component tests through `addon-vitest` (`@vitest/browser` + Playwright).
- **i18n:** **disabled** — single-owner application, pt-BR only; strings live directly in the code

### 1.1 Stack version pin (do not bump silently)

| Package | Pin | Reason |
|---|---|---|
| `vitest` | major **4** | `addon-vitest` (Storybook 9) couples to the v4 browser mode |
| `vite` | **6.x** + override declared in `package.json` | required by `addon-vitest` peer constraint |
| `@xyflow/react` | **12.x** | MIT licence; v11 → v12 changed the package name (`reactflow` → `@xyflow/react`) |
| `tailwindcss` | **4.x** | CSS-first config; v3 → v4 is breaking (no `tailwind.config.ts`) |

Bumping `vitest` or `vite` without re-running the Storybook browser-mode test suite is forbidden — see *Known Gotchas* in `CLAUDE.md`.

### 1.2 Fixed contract

These constraints are imperative defaults; "on demand" means only when the Task Contract asks for it.

- Do **not** swap any item in §1 without an explicit owner instruction.
- Tailwind v4 entry: `@import "tailwindcss";` — **never** the v3 `@tailwind base/components/utilities` triplet.
- No `content` array (v4 auto-detects).
- Gradients: `bg-linear-to-*` (v4) — not `bg-gradient-to-*` (v3 syntax).
- **No arbitrary values** (`w-[347px]`, `p-[13px]`) — use tokens.
- `style=""` / `style={{}}` is forbidden except for a dynamic value with no token equivalent (e.g., a computed node `x`/`y` on the graph canvas).

---

## 2. Application Shell — 3 fixed regions + z-1 ambient backdrop

The Remember SPA is a **desktop workstation**, not a website. The shell is a **fixed three-region frame** over an ambient backdrop. There is **no sidebar**. Detail and controls appear as **floating glass layers** above the workspace — never as columns that push it aside.

```
╔═══════════════════════════════════════════════════════════════════╗
║  HEADER   (fixed, thin, never scrolls)                              ║  ← Region 1
╠═══════════════════════════════════════════════════════════════════╣
║                                                                     ║
║  WORKSPACE  (fills all remaining space; the only region that scrolls)  ║  ← Region 2
║                                                                     ║
╠═══════════════════════════════════════════════════════════════════╣
║  FOOTER   (fixed, thin, never scrolls)                              ║  ← Region 3
╚═══════════════════════════════════════════════════════════════════╝
        ↓ underneath everything ↓
   z-1 AMBIENT BACKDROP — fixed landscape photo (treated: darkened + desaturated + blurred)
```

### 2.1 Region rules (non-negotiable)

| Rule | Reason |
|---|---|
| Header and footer are **fixed**; they never scroll | Frame stability |
| The workspace is the **only** region that scrolls; each area controls its own scrolling | Predictable focus retention |
| Floating glass layers (z1–z5) **overlay** the workspace; they never reduce the header/footer or shift the regions | Glass = overlay without context loss |
| The ambient backdrop (`z-backdrop`) is fixed and does **not** scroll | It behaves like a desk background |
| Header/footer content of this wave is the **foundation only** — navigation tabs, status segments, and the command palette trigger are specified in later waves | Avoids coupling the foundation to area-specific features |

### 2.2 Layer / z-index scale (canonical)

The CSS implementation uses **named Tailwind utilities** (defined in `theme.css` `@theme` block). Numeric values are listed below for reference only; agents reference layers by Tailwind class.

| Layer | Tailwind class | z-index | Role | Scrolls? | Modal? |
|---|---|---|---|---|---|
| Ambient backdrop | `z-backdrop` | `-1` | Treated landscape photo behind the frame | no | — |
| Workspace base | `z-base` | `0` | The mounted area (Graph / Search / Ingest / Curation / History) | yes (per area) | — |
| Graph panels | `z-panel` | `10` | Filters and selection context — anchored glass | no | no (non-modal) |
| Provenance drawer | `z-drawer` | `20` | Invocable from any fact, in any area — glass surface | no | no (non-modal) |
| Popovers / pickers | `z-popover` | `30` | Time picker (`as_of`), filter menus, dropdowns | no | no |
| Frame (header/footer) | `z-frame` | `40` | Above base content, below modals | no | — |
| Command palette / modals | `z-modal` | `50` | ⌘K palette, confirmation dialogs — capture focus | no | **yes** |
| Toasts | `z-toast` | `60` | Sonner notifications — ephemeral, no focus capture | no | no |

> **Why header/footer sit below modals (z40 < z50):** a modal must be able to dim the entire screen, frame included. This matches `layout.md §5`.

### 2.3 Ambient backdrop (`z-backdrop`) — strict rules

The backdrop is **ambient context, never content**. It exists so glass surfaces have something real to blur and refract through.

- Asset: a landscape photograph per theme (one dark, one light). Stored under `public/backdrop/`.
- Served **outside the initial bundle**: lazy `<link rel="preload" as="image">` after the critical render — must not count against the LCP budget (`< 2.5 s`).
- Always served at `object-fit: cover; object-position: center;` with no distortion.
- **Always treated, never raw** — applied via a CSS filter token chain (`--backdrop-treatment` family) declared in `design-system/tokens.md §10`. Treatment combines: darken + desaturate + blur enough to preserve ≥ 4.5:1 contrast for `text-content` on top.
- The Graph area receives an **extra depth layer** between `z-backdrop` and the canvas (`--graph-depth-overlay` token, near-opaque) — the canvas is the only place where node/edge colors carry information, and they must not compete with landscape colors. This realizes `layout.md §5`'s "fundo profundo" rule.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables any parallax / `scale`/`translate` animation on the backdrop. Default is no motion; motion is opt-in.
- **Per theme, one backdrop.** Theme switch swaps the asset and the treatment tokens together — never crossed.

---

## 3. Routing Conventions

The router is **TanStack Router** (type-safe). Routes are declared in `src/router/`.

| Property | Value |
|---|---|
| Route prefix | `/` (the app owns the root domain) |
| Root route (`/`) | Redirects to `/graph` (the Graph area is the home of a knowledge workstation — `frontend-analise-funcional.md §10`) |
| Fallback route (404) | `/not-found` — rendered inside the workspace region; the frame stays visible |
| Protected routes | All routes are protected — the `__root` loader runs the JWT guard (Neon Auth / Stack Auth) before any area mounts. Token absent / expired → redirect to `/sign-in`. The `/sign-in` route is unprotected. |
| Layout strategy | **Single root layout** (`__root`) renders the 3-region shell once; child routes mount only inside the workspace region |

### 3.1 Route map (foundation only)

The five functional areas register their routes in later waves. The foundation pre-allocates the slots so the navigation works from day one:

| Route | Purpose | Status in this wave |
|---|---|---|
| `/sign-in` | Authentication entry | Foundation: stub page using `GlassSurface` |
| `/graph` | Graph explorer (the home) | Foundation: empty workspace + frame |
| `/search` | Lexical search | Reserved (specified in a later wave) |
| `/ingest` | Ingest a document | Reserved (specified in a later wave) |
| `/curation` | Review queues | Reserved (specified in a later wave) |
| `/history` | Runs and audit trail | Reserved (specified in a later wave) |
| `/not-found` | Fallback | Foundation: rendered inside `GlassSurface` |

### 3.2 URL is the single source of truth for view state

The following live in the URL (`search` params), never only in memory — so refresh / back / forward / deep-link all work:

| State | Param | Used by | Format |
|---|---|---|---|
| Time-travel cursor (`as_of`) | `?as_of=YYYY-MM-DD` (omitted = "now") | All read areas (Search, Graph) | ISO date |
| Search query | `?q=<term>` | `/search` | URL-encoded string |
| Search layers | `?layers=fragment,node,chunk` | `/search` | CSV |
| Include uncertain | `?uncertain=1` | `/search`, `/graph` | `0` / `1` |
| Graph expand depth | `?depth=1\|2\|3` | `/graph` | `1`–`3` |
| Graph seed node id | `?node=<uuid>` | `/graph` | UUID |

> The foundation enforces these param names; later waves bind components to them via `useSearch()` from TanStack Router.

### 3.3 Application bootstrapping — loading state

Before any route area mounts, the `__root` loader performs synchronous checks (token presence, decoded `exp`). The **bootstrapping window** is the time between the HTML first paint (inline theme script runs, CSS loads) and the router completing its first `beforeLoad`. During this window:

| Phase | User sees | Duration |
|---|---|---|
| HTML first paint + inline theme script | `<html data-theme="dark">` with no React content — background is `bg-primary`, Inter starts loading | < 50 ms on fast connections |
| React hydration (JS parses + mounts) | First render of `AppShell` — the 3-region frame appears (header + footer as `GlassSurface level="ambient"`, workspace empty) | Typically 100–200 ms |
| `__root` `beforeLoad` JWT check | Frame visible, workspace still empty — router checks `useAuthStore.accessToken` | Synchronous (< 1 ms) |
| Route resolution | Redirect to `/sign-in` (no token) OR area content starts loading | Immediate |

**No explicit loading spinner is shown during bootstrapping.** The SPA is client-only (no SSR), so the initial paint is always an empty shell. A spinner would appear for < 200 ms and flash — this is worse UX than no spinner. The frame stability (header + footer from the first frame) is the visual anchor.

**If the app fails to bootstrap** (env invalid — BR-02 in `front.back.md`): a full-screen error page (`AppShell` not rendered) with the message "Configuração inválida — contate o operador." is shown. This is the only case where the 3-region frame does not appear.

---

## 4. Global State Strategy

The Remember frontend has **two state classes** with a strict boundary. Mixing them is forbidden.

### 4.1 Server state — TanStack Query v5

All data that comes from the BFF (`/api/v1/**`) is server state. It is always fetched through a Query hook in `features/<x>/api/`.

| Rule | Value |
|---|---|
| `staleTime` for **stable** data (catalog: NodeTypes, LinkTypes, AttributeKeys; node detail not under live ingest) | `5 * 60 * 1000` (5 min) |
| `staleTime` for **volatile** data (search results, run status while `extracting`, review queue counts) | `0` |
| `retry` (global default) | `1` — single retry, then surface |
| `refetchOnWindowFocus` (global default) | `true` for volatile, `false` for stable |
| Mutation cache | Always `invalidateQueries` on success for the affected keys |
| Optimistic updates | **On demand only** — never the default |
| Error handling | Centralized in the `QueryClient` `QueryCache.onError` callback (see §5) |

### 4.2 Query key factories (always centralized per entity)

Per-feature `api/keys.ts` exports a frozen object — never inline string arrays.

```ts
// example shape — concrete keys are owned by each feature
export const nodeKeys = {
  all: ["nodes"] as const,
  list: (filters: NodeListFilters) => ["nodes", "list", filters] as const,
  detail: (id: string, asOf?: string) => ["nodes", id, asOf ?? "now"] as const,
};
```

> Foundation rule: every entry that appears under `invalidateQueries` must come from a key factory — no inline literals.

### 4.3 Client state — Zustand v5

Zustand owns **only** state that survives navigation but does not belong on the server. The foundation defines these stores; later waves register their per-area state into them.

| Store | File | Owns | Persistence |
|---|---|---|---|
| `useThemeStore` | `src/state/theme.ts` | Active theme (`dark` \| `light`); writes the `data-theme` attribute on `<html>` and persists | `localStorage` (`remember.theme`) |
| `useAsOfStore` | `src/state/as-of.ts` | Time-travel cursor (`Date \| null`); the URL is the source of truth, the store is the in-memory mirror | URL only |
| `useGraphViewStore` | `src/state/graph-view.ts` | Pinned node positions, expansion set, selection, panel collapse — survives a `/graph` ↔ `/search` round-trip | `sessionStorage` (`remember.graph`) |
| `useCommandPaletteStore` | `src/state/command-palette.ts` | Open/closed state of ⌘K | none |

### 4.4 Local state (the default)

Anything scoped to a single screen or component stays in `useState` / `useReducer` inside the component. The default is **local** — promote to Zustand only when **two or more screens** read or mutate the same value.

### 4.5 Forbidden patterns (stack-specific)

- `fetch` / `axios` called directly inside a component → use a `features/<x>/api/` Query hook
- `useEffect` used for data fetching → same
- `forwardRef` → React 19 passes `ref` as a normal prop
- Custom CSS media queries → use Tailwind named breakpoints or container queries
- `className` concatenation via string `+ " "` → use `cn()` (`tailwind-merge` + `clsx`)
- Duplicated query keys or token literals → reuse the centralized factory / semantic token
- Reading a server value out of a Zustand store → server values live in TanStack Query

---

## 5. Global Error Handling

The BFF returns a logical envelope (`{ ok, result, error }`) — REST returns it directly with an HTTP status, MCP renders it as `content` / `isError`. The frontend always reads `ok` first, then either `result` or `error.code`.

| BFF error code (envelope) | HTTP | UI behavior | Component |
|---|---|---|---|
| `AUTH_UNAUTHORIZED` | `401` | Clear in-memory token + redirect to `/sign-in?reason=session_expired` | Router `__root` loader / TanStack Query `QueryCache.onError` |
| `AUTH_FORBIDDEN` | `403` | Display `AccessDenied` page with support link (single-owner, this should be impossible — log loud) | `ErrorBoundary` |
| `VALIDATION_INVALID_FORMAT` | `400` | Surface field-level errors via React Hook Form `setError`; do not toast | inline (feature-specific) |
| `RESOURCE_NOT_FOUND` | `404` | Inline empty state inside the area — never a global toast | feature-specific |
| `RESOURCE_GONE` (LGPD `compliance_delete`) | `410` | Inline notice: "Esta fonte foi removida por conformidade." — never silent | feature-specific |
| `BUSINESS_*` (e.g., `BUSINESS_DUPLICATE`) | `409` / `422` | Toast `warning` with the message + the action button (e.g., "Ver run existente") | sonner toast |
| `SYSTEM_*` (500+) | `500` / `502` / `503` | Toast `danger` "Algo deu errado. Tente novamente." + capture into the global error boundary if the page cannot render | sonner + `ErrorBoundary` |
| `SYSTEM_ABORTED` | — | **Silent** — no toast, no redirect, no boundary. TanStack Query request cancellation on component unmount is silent by design (the user never asked for the result). | `lib/error-routing.ts` |
| Network offline | — | Toast `warning` "Sem conexão." with auto-retry from TanStack Query (1 retry) | `NetworkBoundary` wrapper |
| Request timeout (client-side) on **ingest** | — | **Never a failure** — see `CLAUDE.md` note "ingest_document client timeout ≠ failure". UI displays "A extração continua no servidor — você pode sair" and lets the user revisit via History | `/ingest` feature (later wave) |

### 5.1 ErrorBoundary

A single `<AppErrorBoundary>` wraps the `__root` route. Any uncaught render error inside an area surfaces an in-frame fallback (header / footer stay visible) with a `Reload` action.

### 5.2 The "fail loud" rule

- A spec-aware UI never silently downgrades. If `ok === false`, the frontend either toasts, inlines an error state, or shows the boundary fallback — it never renders an empty success state.
- `console.error` is preserved in dev; in production, `SYSTEM_*` errors are forwarded to pino-based logs through the BFF (no third-party error tracker in this wave).

---

## 6. Component Patterns

### 6.1 Folder structure

```
frontend/src/
  router/                       # TanStack Router declarations
    __root.tsx                  # 3-region shell + AppErrorBoundary + AuthGuard
    sign-in.tsx
    graph.tsx
    search.tsx
    ingest.tsx
    curation.tsx
    history.tsx
    not-found.tsx
  shell/                        # The 3-region shell + ambient backdrop
    AppShell.tsx
    Header.tsx                  # foundation: placeholder
    Footer.tsx                  # foundation: placeholder
    AmbientBackdrop.tsx         # z-backdrop layer
  components/
    ui/                         # shadcn/ui — owned primitives (Button, Input, Dialog, …)
    ds/                         # design-system foundational atoms
      StateBadge/               # confidence-state badge (this wave)
      GlassSurface/             # glass container (this wave)
  features/                     # one folder per route / area
    graph/
      api/                      # TanStack Query hooks + key factory
      components/               # feature-local components (no sister-feature import)
      hooks/
      types.ts
    search/ ingest/ curation/ history/
  state/                        # Zustand stores (theme, as-of, graph view, command palette)
  lib/
    cn.ts                       # tailwind-merge + clsx wrapper
    http.ts                     # fetch wrapper that reads the BFF envelope
    motion.ts                   # shared Framer Motion variants (uncertain pulse, promote, supersede, merge)
  styles/
    theme.css                   # Tailwind v4 @theme — single source of design tokens
```

> Cross-feature imports are forbidden: a feature imports only from `components` / `lib` / `state` or from itself. The rule is enforced by ESLint's `import/no-restricted-paths`.

### 6.2 Naming

- Components: `PascalCase` (`StateBadge.tsx`)
- Hooks: `camelCase` with `use` prefix (`useNodeDetail.ts`)
- Utilities: `camelCase` (`formatAsOf.ts`)
- Types: `PascalCase` (`NodeDetail`, `LlmRunSummary`)
- CSS tokens: `--{category}-{semantic}` — see `design-system/tokens.md`

### 6.3 Path aliases

```ts
// tsconfig.json + vite.config.ts (same value declared in both — single source via shared snippet)
"@/components"  // src/components
"@/features"    // src/features
"@/shell"       // src/shell
"@/state"       // src/state
"@/lib"         // src/lib
```

### 6.4 Component contract (shared UI layer)

Every component exported from `components/` MUST:

- Accept `className` and merge it with `cn()` (`tailwind-merge` + `clsx`). String concatenation is forbidden.
- Accept `ref` as a normal prop. **`forwardRef` is forbidden.**
- Consume **only semantic tokens** (`bg-surface-glass`, `text-content`, `rounded-md`) — never raw values.
- Use CVA (`class-variance-authority`) only when there are **2+ visual variants**. No variants → no CVA.
- Be physically arranged as `{Component}.tsx` + `{Component}.types.ts` + `index.ts` (the per-component `index.ts` is a stack exception — re-exports only that one component's public surface; project-wide `export *` barrels remain forbidden).
- Respect `prefers-reduced-motion` for every animation (default = no motion).

---

## 7. Graph Visualization Decision (React Flow + d3-force)

The Graph explorer is the **central component** of Remember (`frontend-analise-funcional.md §5`). The visualization stack is fixed.

### 7.1 Decision

| Choice | Selection | Rationale |
|---|---|---|
| Renderer | **React Flow** (`@xyflow/react` v12, MIT) | Each node and edge renders as a **React component**, so node type (color + lucide icon), confidence state (semantic token), temporal-vs-stable distinction (solid vs dashed), and Framer Motion micro-interactions are all directly composable with shadcn/ui — the design system is reused, not re-implemented. |
| Layout | **`d3-force`** | Subgraph layout with **existing nodes pinned** (`fx`/`fy` set) — the graph grows by progressive expansion (BFF `traverse`), and previously placed nodes must not jump when a new neighbour arrives. |
| State of the view | **Zustand `useGraphViewStore`** | Expansion set, pin positions, selection, panel collapse — survives a round-trip to `/search` and back. |
| Server state | **TanStack Query** (`features/graph/api/`) | `traverse(node, direction, link_types, depth)` becomes a hook; `as_of` is part of the query key. |

### 7.2 Scope this stack supports

This stack is correct **for the project's regime**: hundreds of documents, **dozens of visible nodes per view** at any time. Whole-graph rendering of thousands of simultaneous nodes is **not** a goal — if it ever becomes one, a WebGL renderer (Cytoscape.js / Sigma.js) would replace React Flow. Not in scope this wave.

### 7.3 Forbidden in the graph

- DOM-direct mutation of node positions (must go through React Flow's controlled API).
- Inline `style=""` for colors / borders — node and edge styles consume **only** the semantic tokens declared in `design-system/tokens.md §5–§7`.
- Animating `width` / `height` / `padding` — only `transform` and `opacity` (see `tokens.md §11`).

---

## 8. Theming Model

The app ships with **two themes**: `dark` (default) and `light`. Both are first-class — neither is "experimental".

### 8.1 Mechanics

- Tokens are declared **once** in `styles/theme.css` inside a Tailwind v4 `@theme` block (CSS-first, no `tailwind.config.ts`).
- Theme switch is realized by setting `data-theme="dark"` or `data-theme="light"` on `<html>`. The `@theme` block declares default token values; a `[data-theme="light"] { ... }` block overrides them.
- The active theme is persisted in `localStorage` (`remember.theme`) and exposed through `useThemeStore`. Initial value is read **before** React hydration via a tiny inline script in `index.html` to avoid a flash of the wrong theme.
- The system preference (`prefers-color-scheme`) is consulted **only** on first ever load; after that, the user's explicit choice wins.

### 8.2 Per-theme assets

Theming is not "swap a color palette" — it swaps the entire visual context:

| Asset | Dark theme | Light theme |
|---|---|---|
| Ambient backdrop image | `public/backdrop/dusk.jpg` (placeholder name; final asset to be commissioned) | `public/backdrop/dawn.jpg` |
| Backdrop treatment tokens | `--backdrop-darken`, `--backdrop-desaturate`, `--backdrop-blur` | overridden in `[data-theme="light"]` |
| Glass-surface tokens | `--surface-glass-*` (dark values) | overridden in `[data-theme="light"]` |
| Graph depth overlay | `--graph-depth-overlay` (near-black, ~92% opacity in dark) | overridden (near-white, ~88% opacity in light) |
| Confidence state colors | accepted / uncertain / disputed / low-confidence / superseded | re-tuned for AA contrast on light glass |

> Both themes MUST pass **WCAG 2.2 AA** contrast against the treated backdrop and against every glass-surface variant. The treatment chain (`--backdrop-darken` + `--backdrop-desaturate` + `--backdrop-blur`) is calibrated so that `text-content` over `surface-glass` clears ≥ 4.5:1.

### 8.3 Tailwind v4 gotcha — two `border` namespaces

Tailwind v4 separates **border color** (`--color-border-*`) from **border width** (`--border-*`) into two **distinct token namespaces**. Mixing them makes the border **silently disappear** (it falls back to "no width" or "transparent"). Every component spec MUST reference each namespace explicitly:

| Want | Token namespace | Class |
|---|---|---|
| Border color | `--color-border-*` | `border-border`, `border-state-accepted`, … |
| Border width | `--border-*` | `border`, `border-2`, `border-thin` |

> **The convention adopted by this project:** every border on a glass surface is written as the pair `border <color-token>` (e.g., `border border-border-glass`). The `tokens.md` file enforces this with a sample row in §7 and a "Do / Don't" in `implementation.md` (later wave).

---

## 9. Motion

> **Policy change (2026-06-19, owner-directed, v1.1.0):** motion **may be decorative**. The earlier
> rule ("motion is never decorative; every transition explains a state change") is **revoked** —
> decorative motion that reinforces the modern / technological aesthetic (entrances, hovers, press
> feedback, sliding indicators, staggered reveals, glows, etc.) is **allowed and encouraged**.
> The one rule that **remains mandatory** is §9.2: every component consumes motion variants from
> `lib/motion.ts` — no component inlines its own.

Motion now serves two purposes: **semantic** (explains a state change) and **decorative** (gives the
UI a modern, technological feel). The four behaviours below are the canonical **semantic** motions
that StateBadge, GlassSurface and the graph nodes consume; decorative motions are added the same way —
as new canonical factories in `lib/motion.ts`.

| Behaviour | Where it appears | Token reference (see `tokens.md §11`) |
|---|---|---|
| **Uncertain pulse** | A fact in `uncertain` state pulses softly — a slow opacity oscillation on the badge / node halo. Tells the eye "this is provisional". | `motion.pulse.uncertain` |
| **Promotion (uncertain → accepted)** | When corroboration consolidates an uncertain fact, the badge **morphs** color (amber → green) and the halo collapses inward once. Tells the eye "this just became firm". | `motion.transition.promote` |
| **Supersession** | When a fact is replaced by a newer version, the old node fades to `superseded` grey and **slides** out of the active layer. Tells the eye "this is no longer current — but still here for history". | `motion.transition.supersede` |
| **Entity merge** | When the operator merges two entities, the two nodes **collapse** into one position (target absorbs source) and the source's edges re-anchor on the target. Tells the eye "these were the same". | `motion.transition.merge` |

### 9.1 Reduced motion — rule removed

The `prefers-reduced-motion` gate is **no longer a project rule** (removed 2026-06-19, owner-directed).
Motion — semantic or decorative — runs unconditionally; gating a specific behaviour is purely an
author's choice, with no requirement either way. Anti-bounce/elastic easing restrictions are likewise
**removed** (overshoot/spring/bounce curves are permitted). Existing gated behaviours (StateBadge
pulse, GlassSurface) may keep or drop their gates at will. This supersedes the prior WCAG-driven
default (see §10).

### 9.2 Implementation note (the one mandatory rule)

All motion is realized with **Framer Motion** via shared variants exported from `lib/motion.ts`. **This
is the rule that stays mandatory:** every component consumes motion variants from `lib/motion.ts` — no
component inlines its own `animate={…}` / timing curves (`front.back.md` BR-10). New motions (semantic
or decorative) are added as new canonical factories there, not inline.

---

## 10. Global Accessibility

| Requirement | Value |
|---|---|
| Standard | **WCAG 2.2 AA** |
| Keyboard navigation | Every action is reachable via `Tab` + `Enter` / `Space`. Skip-to-content link on `__root`. |
| Focus management | On modal/drawer open, focus moves to the first interactive element; on close, focus returns to the trigger. |
| Focus visibility (SC 2.4.11) | Focus ring uses `border-border-focus` + `ring-2 ring-offset-2` — never obscured by the header/footer or by glass overlays. |
| Contrast (SC 1.4.3) | ≥ 4.5:1 for normal text, ≥ 3:1 for large text — on every surface (glass over backdrop counts). |
| Target size (SC 2.5.8) | ≥ 24×24 px CSS minimum. Project floor stricter: ≥ 32 px any context. |
| ARIA | Semantic roles (`role="dialog"`, `role="status"` for the ingest progress card, `aria-live="polite"` for footer counters). |
| Forms | Invalid inputs set `aria-invalid="true"` and link the error via `aria-describedby`. |
| Reduced motion | **Not a project rule** (removed 2026-06-19 — see §9.1). `prefers-reduced-motion` gating is optional/ad hoc; no requirement. Motion may run unconditionally. |
| Images | Decorative images get `alt=""`. The ambient backdrop is decorative (`alt=""`, `role="presentation"`). |

---

## 11. Permitted and Prohibited Libraries

| Library | Status | Rationale |
|---|---|---|
| `@xyflow/react` (v12 MIT) | Permitted | Graph renderer — see §7 |
| `d3-force` | Permitted | Graph layout — see §7 |
| `framer-motion` | Permitted | Motion semantics — see §9 |
| `sonner` | Permitted | Toast notifications — see §5 |
| `lucide-react` | Permitted | Only icon set (NodeType icons map to lucide names — see `tokens.md §6`) |
| `tailwind-merge` + `clsx` | Permitted | `cn()` utility — required by every shared component |
| `class-variance-authority` | Permitted | Only when ≥ 2 visual variants exist |
| `@tanstack/react-router` / `@tanstack/react-query` / `@tanstack/react-table` | Permitted | Routing / server state / tables |
| `@hookform/resolvers` + `zod` v4 | Permitted | Forms via `zodResolver` |
| `zustand` v5 | Permitted | Client state — see §4.3 |
| `vitest` v4 + `@vitest/browser` + `playwright` | Permitted | Testing |
| `@storybook/react-vite` v9 + `@storybook/addon-a11y` + `@storybook/addon-vitest` | Permitted | Design system playground + stories-as-tests |
| `react-i18next` / `i18next` / any i18n lib | **Prohibited** | App is single-owner pt-BR — strings live in code |
| `axios` / `ky` / direct `fetch` in components | **Prohibited** | Use a TanStack Query hook in `features/<x>/api/` |
| `tailwindcss` v3 / any `tailwind.config.ts` file | **Prohibited** | v4 CSS-first via `@theme` only |
| `forwardRef` from React | **Prohibited** | React 19 — `ref` is a normal prop |
| `styled-components` / `emotion` / `@emotion/*` | **Prohibited** | Styling is exclusively Tailwind v4 + semantic tokens |
| Any icon set other than `lucide-react` | **Prohibited** | Visual consistency |
| Any graph renderer other than React Flow (Cytoscape, Sigma, Vis.js, mermaid) | **Prohibited** in this scope | Use React Flow — re-evaluate only if the scale crosses thousands of simultaneous nodes |
| Any third-party error tracker (Sentry, Bugsnag, Datadog RUM) | **Prohibited** in this wave | Logging is pino on the BFF; client errors funnel through the BFF |
| Any analytics library | **Prohibited** | Single-owner, no telemetry |

---

## 12. Out of Scope (this wave)

The foundation specifies **only** the global frame, the layer system, the tokens, and the two foundational atoms (StateBadge, GlassSurface). The following are out of scope and will be specified in subsequent `/u-spec` waves:

- Header content (navigation tabs, ⌘K trigger, settings) — `frontend-analise-funcional.md §2`
- Footer content (health indicator, `as_of` segment, curation counter, run progress) — `frontend-analise-funcional.md §2`
- The five functional areas: Graph, Search, Ingest, Curation, History — `frontend-analise-funcional.md §3–§8`
- The Provenance drawer component (z-drawer) — invokable from any fact
- Command palette (⌘K) — `frontend-analise-funcional.md §9`
- Time picker for `as_of` (popover) — referenced by Graph and Search later
- Sign-in screen content (Neon Auth flow) — `/sign-in` is foundation-stubbed in this wave
- All `.feature.spec.md`, `.flow.md`, and additional component specs beyond `StateBadge` and `GlassSurface`

> Anything not in §2–§11 above and not in the two component specs (`StateBadge.component.spec.md`, `GlassSurface.component.spec.md`) is **explicitly not specified by this wave**.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-18 | Front Spec Agent | initial | Initial foundation: 3-region shell + z-1 backdrop + layer system + fixed stack + graph viz decision + theming model. Out-of-scope: the five functional areas. | -- |
| 1.0.1 | 2026-06-19 | Front Spec Agent | patch | Cross-domain review: added §3.3 (app bootstrapping loading state — no spinner during boot; frame appears first; env-invalid fallback). | sdd_front |
| 1.0.2 | 2026-06-19 | u-fe-developer (TC-03 r1) | patch | §5 — added `SYSTEM_ABORTED` row (silent routing) to the error-code table. Reconciles the implicit divergence flagged by QA on TC-03: TanStack Query cancels in-flight requests on component unmount; without explicit handling, every navigation-while-loading produces a spurious toast. Code already lives in `lib/error-routing.ts`. | qa_tc_003 |
| 1.1.0 | 2026-06-19 | owner-directed | minor | §9 — motion policy: **decorative motion now allowed** (revokes "motion is never decorative"); §9.1 reduced-motion gate **removed as a rule** (was mandatory) and **anti-bounce/elastic restriction removed**; §10 reduced-motion row updated. The **one mandatory rule kept**: components consume canonical variants from `lib/motion.ts` (no inline). Mirrored in `tokens.md §11` + `front.back.md` BR-10. Trade-off vs WCAG 2.2 AA acknowledged (gating now ad hoc, not required). | owner |
