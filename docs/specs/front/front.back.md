# Front-Global -- Technical Spec (Frontend Foundation)

> Stack: Vite 6 + React 19 + TypeScript strict | Client state: Zustand v5 | Server state: TanStack Query v5 | Router: TanStack Router | Auth: Neon Auth (Stack Auth) JWT | Version: 1.0.0 | Status: draft | Layer: permanent
> Business spec: `front.md`

> Scope note: this `front-global` domain is a **frontend foundation wave** — there is no BFF code being designed here. This document collects the technical decisions that support the frontend architecture defined in `front.md`: build config, state architecture, router config, API client, auth client, theming, graph visualization config, tests, dev tooling. Standard `.back.md` sections (Data Model, BR, ST, EV) are reinterpreted for the frontend context — there is no database, so "Data Model" describes the **shape of persisted client state**, "BR" describes **invariant behaviours** the implementation must enforce, "EV" describes the **named motion/state transitions** referenced by `front.md §9`.

---

## 1. Stack and Patterns

> Stack baseline is defined by `CLAUDE.md` and locked by `front.md §1`. This table records the foundation-level technical decisions that extend or pin those defaults.

| Aspect | Value | Note |
|---|---|---|
| Build / dev server | Vite 6 (`vite`, `@vitejs/plugin-react`) | CLAUDE.md default; pinned by `front.md §1.1` (`addon-vitest` peer constraint requires a version override declared in `package.json`) |
| Language | TypeScript strict (`"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`) | `front.md §1`; the three flags are mandatory — implementation MUST NOT relax them |
| UI runtime | React 19 | `forwardRef` forbidden — `ref` is a normal prop (`front.md §1`, `§6.4`) |
| Styling | Tailwind v4 CSS-first via `@theme` in `styles/theme.css`; `@tailwindcss/postcss` plugin | No `tailwind.config.ts` file may exist in the repo; v3 `@tailwind base/components/utilities` triplet is forbidden |
| Component primitives | shadcn/ui (Radix UI) under `components/ui/` | Owned code — never regenerated via CLI |
| Client state | Zustand v5 | Four stores only (`§4.3` of `front.md`); promotion rule = "two or more screens" |
| Server state | TanStack Query v5 (`@tanstack/react-query`) | Single global `QueryClient`; defaults pinned in §3 below |
| Router | TanStack Router (`@tanstack/react-router`) | File-based routes under `src/router/`; single `__root` shell |
| Forms | React Hook Form v7 + Zod v4 + `@hookform/resolvers/zod` | Schema-first: `schema → z.infer → form` |
| API client | Native `fetch` wrapped in `lib/http.ts` | No `axios` / `ky` (CLAUDE.md `Anti-patterns`); envelope parsed centrally |
| Auth client | Neon Auth (Stack Auth) JWT verified BFF-side via JWKS; SPA holds bearer in memory + `sessionStorage` | No service key on the client; no refresh-token logic in this wave (re-login on expiry) |
| Architecture pattern | Feature-folder monorepo single-app (`features/<area>/{api,components,hooks,types.ts}`) | Cross-feature import forbidden — enforced by `eslint-plugin-import` `no-restricted-paths` |
| Graph renderer | React Flow `@xyflow/react` v12 (MIT) | Pinned by `front.md §1.1`; v11 → v12 is a package-name rename |
| Graph layout | `d3-force` | Existing nodes pinned with `fx`/`fy` |
| Animation | Framer Motion (`framer-motion`) | All variants live in `lib/motion.ts`; `prefers-reduced-motion` gate is mandatory |
| Notifications | `sonner` | Single `<Toaster>` mounted in `__root` |
| Icons | `lucide-react` | Only icon set in the repo |
| Testing (unit) | Vitest v4 + `@vitest/browser` | Pinned by `front.md §1.1` — version coupled to Storybook `addon-vitest` |
| Testing (E2E) | Playwright | Used by `addon-vitest` browser mode and by app-level E2E |
| Network mocks | MSW (Mock Service Worker) | Mocks the BFF envelope shape — both `result` and `error` branches |
| Design-system playground | Storybook 9 (`@storybook/react-vite` + `addon-a11y` + `addon-vitest`) | Stories double as component tests in browser mode |
| Lint | ESLint + `eslint-plugin-react-hooks` + `eslint-plugin-storybook` + `eslint-plugin-import` | `no-restricted-paths` enforces feature isolation |
| Type generator | None — types live next to their feature | No OpenAPI codegen in this wave (BFF stack contract is loose); revisit if the API surface grows |

### 1.1 `vite.config.ts` decisions

| Decision | Value | Rationale |
|---|---|---|
| Plugins | `@vitejs/plugin-react` only | Keep the plugin chain minimal — no SWC, no SSR plugin |
| `resolve.alias` | Mirror `tsconfig.json` `paths` exactly | Single source of truth — see §1.3 |
| `server.port` | `5173` (Vite default) | No port collision with BFF (`3000`) |
| `server.proxy` | `'/api': { target: process.env.VITE_BFF_URL ?? 'http://localhost:3000', changeOrigin: true }` | Avoids CORS in dev; production uses the env-injected base URL directly |
| `build.target` | `'es2022'` | Matches Node 20 LTS feature parity and current browser baseline |
| `build.sourcemap` | `true` | Required for pino-forwarded client errors to be readable |
| `build.rollupOptions.output.manualChunks` | `{ 'react-vendor': ['react','react-dom'], 'tanstack': ['@tanstack/react-query','@tanstack/react-router','@tanstack/react-table'], 'graph': ['@xyflow/react','d3-force'], 'motion': ['framer-motion'] }` | Four named vendor chunks; keeps the graph and motion bundles loadable on demand |
| `build.chunkSizeWarningLimit` | `350` (kb) | Slightly above the 300 kb budget (`front.md` Performance Budgets) — fail loud before the budget breaks |

### 1.2 `tsconfig.json` decisions

| Compiler option | Value | Rationale |
|---|---|---|
| `target` | `ES2022` | Matches `vite.config.ts` |
| `module` | `ESNext` | Vite is ESM-native |
| `moduleResolution` | `bundler` | Required by Vite + TanStack Router file-based routing |
| `strict` | `true` | Foundation rule |
| `noUncheckedIndexedAccess` | `true` | Foundation rule — forces `T \| undefined` on array/index access |
| `exactOptionalPropertyTypes` | `true` | Distinguishes `undefined` from "absent" — important for env parsing |
| `noImplicitOverride` | `true` | Catches missed `override` keywords on derived classes |
| `jsx` | `react-jsx` | New JSX transform (React 19) |
| `paths` | See §1.3 | Single source for the alias map |
| `verbatimModuleSyntax` | `true` | Avoids the ambiguous `import type` issues that hit Vite |
| `skipLibCheck` | `true` | Tolerates upstream type debt |

### 1.3 Path aliases (single source)

Declared **once** in `tsconfig.json` `compilerOptions.paths`. `vite.config.ts` reads the same map via `vite-tsconfig-paths` (permitted addition — it is dev-tooling, not runtime).

| Alias | Maps to |
|---|---|
| `@/components/*` | `src/components/*` |
| `@/features/*` | `src/features/*` |
| `@/shell/*` | `src/shell/*` |
| `@/state/*` | `src/state/*` |
| `@/lib/*` | `src/lib/*` |
| `@/router/*` | `src/router/*` |
| `@/styles/*` | `src/styles/*` |

> Foundation rule: a path alias MUST be declared in `tsconfig.json` first, then loaded by `vite-tsconfig-paths`. Duplicating the map in `vite.config.ts` is forbidden — drift between the two breaks the typecheck.

### 1.4 PostCSS / Tailwind v4

| Decision | Value |
|---|---|
| PostCSS plugin | `@tailwindcss/postcss` only |
| Entry CSS | `styles/theme.css` imported from `src/main.tsx` |
| Entry directive | `@import "tailwindcss";` (v4) — never the v3 triplet |
| Theme block | All semantic tokens declared inside one `@theme { ... }` block; `[data-theme="light"]` overrides follow |
| Content scanning | Auto (v4) — no `content` array |
| Class merging | `cn()` in `lib/cn.ts` = `twMerge(clsx(...))` |

---

## 2. Data Model (persisted client state)

> No database in this domain. This section describes the **shape of state that is persisted** outside React (in `localStorage`, `sessionStorage`, or the URL) — the implementation MUST follow these shapes exactly, because they survive reloads and must be backward-readable.

### Store: `useThemeStore` (persisted to `localStorage`)

> Storage key: `remember.theme` — set early in `index.html` (see BR-09).

| Field | Type | Constraints | Description |
|---|---|---|---|
| `theme` | `"dark" \| "light"` | Required; no other values | Active theme; mirrored on `<html data-theme="…">` |
| `version` | `1` | Required; integer literal | Schema version of the persisted payload — incremented on breaking shape changes |

Persisted JSON example:
```json
{ "state": { "theme": "dark", "version": 1 }, "version": 1 }
```

### Store: `useGraphViewStore` (persisted to `sessionStorage`)

> Storage key: `remember.graph` — cleared on tab close (session scope is intentional; pinned positions are a working-session concern, not a global preference).

| Field | Type | Constraints | Description |
|---|---|---|---|
| `pinnedPositions` | `Record<string, { x: number; y: number }>` | UUID keys map to React Flow positions | Pinned graph node positions — referenced by `front.md §7.1` |
| `expansionSet` | `string[]` | UUID array | Set of node ids that have been expanded via `traverse` in the current session |
| `selection` | `string \| null` | UUID or null | Currently selected node id |
| `panelCollapsed` | `boolean` | Required | Whether the side panel is collapsed |
| `version` | `1` | Required | Schema version |

### Store: `useAsOfStore` (in-memory mirror of the URL)

> Not persisted to any web storage. The URL `?as_of=…` query param is the source of truth (`front.md §3.2`); the store is the in-memory cache that components read.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `asOf` | `Date \| null` | `null` means "now" | Time-travel cursor parsed from the URL |

### Store: `useCommandPaletteStore` (in-memory only)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `open` | `boolean` | Required | Whether ⌘K is open |

### URL state contract

The URL is the canonical place for view state per `front.md §3.2`. The implementation MUST parse and write through TanStack Router `useSearch()` / `navigate({ search })`. Direct `window.location` manipulation is forbidden.

| Search param | Type | Default | Used by |
|---|---|---|---|
| `as_of` | ISO date string `YYYY-MM-DD` | absent = "now" | Search, Graph |
| `q` | URL-encoded string | absent | Search |
| `layers` | CSV of `"fragment" \| "node" \| "chunk"` | `"fragment,node,chunk"` | Search |
| `uncertain` | `"0" \| "1"` | `"0"` | Search, Graph |
| `depth` | `"1" \| "2" \| "3"` | `"1"` | Graph |
| `node` | UUID | absent | Graph |

### Auth token storage

| Field | Storage | Lifetime | Rationale |
|---|---|---|---|
| `accessToken` (JWT) | In-memory Zustand store (`useAuthStore`, not persisted) + mirrored to `sessionStorage` key `remember.auth.token` | Until tab closes or 401 occurs | Foundation policy — refresh-token flow is **out of scope this wave**. JWT expiry produces a redirect to `/sign-in?reason=session_expired` (BR-04). |
| Username / claims (decoded JWT) | Same store | Same | Read-only; never written back. Verified server-side by the BFF, the client only trusts it for display. |

> Why `sessionStorage` and not `localStorage`: prevents the token from leaking across tabs/contexts that the user did not actively start. `localStorage` would persist across logout-equivalent events (close-tab) and complicate the single-owner trust model.

### Indexes / lookup considerations

> Not applicable — no database. Equivalent client-side concern is **query key shape**, owned by each feature's `api/keys.ts` (`front.md §4.2`). The foundation only declares the global rule that `invalidateQueries` calls MUST resolve their key through a factory.

### Relationships

> Not applicable — no foreign keys. Cross-store reads are forbidden by convention: a Zustand store reads only its own slice. Cross-cutting concerns (e.g., theme affecting graph colors) are realized via CSS tokens, not via JS state coupling.

---

## 3. Business Rules (BR)

> Each BR encodes an invariant the foundation must enforce. The "UC" reference is the section of `front.md` it traces back to (the foundation does not currently have a numbered UC list; references use the section anchor instead).

### BR-01 -- Single source of truth for path aliases
**Related spec section:** `front.md §6.3`
**Where to validate:** build time (typecheck + `vite-tsconfig-paths`)
**Description:** Path aliases are declared once in `tsconfig.json`. `vite.config.ts` loads them via `vite-tsconfig-paths`. Duplicating the map elsewhere is forbidden. CI MUST fail if the two diverge.
**Error returned:** N/A (build-time) — `tsc --noEmit` or Vite resolution error.

### BR-02 -- API base URL via env only
**Related spec section:** `front.md §3`, CLAUDE.md `Security`
**Where to validate:** `lib/http.ts` boot; env validation via Zod schema in `lib/env.ts`
**Description:** The BFF base URL is read from `import.meta.env.VITE_BFF_URL` only. It MUST be a valid URL; a Zod schema validates it at startup and crashes the app loudly on misconfiguration. Hardcoded URLs in feature code are forbidden.
**Error returned:** Boot-time `console.error` + visible fallback page; in production, the page renders an in-frame `ErrorBoundary` fallback "Configuração inválida — contate o operador."

### BR-03 -- Envelope-first response parsing
**Related spec section:** `front.md §5`
**Where to validate:** `lib/http.ts` response interceptor
**Description:** Every BFF response is parsed as `{ ok: boolean, result?: T, error?: { code: string, message: string, details?: unknown } }`. The fetch wrapper:
1. Reads HTTP status first — `≥ 500` and `0` (network) are mapped to `SYSTEM_*` immediately (without parsing JSON if the body is non-JSON).
2. On a JSON body: branches on `ok`. `ok === true` returns `result`; `ok === false` throws an `EnvelopeError` carrying `error.code` and the original HTTP status.
3. `EnvelopeError` is caught by the global `QueryCache.onError` callback (`front.md §4.1`) and routed per the table in `front.md §5`.
**Error returned:** Throws `EnvelopeError`; rendered per `front.md §5` table.

### BR-04 -- JWT guard on protected routes
**Related spec section:** `front.md §3` (Protected routes), CLAUDE.md `Auth` deviation
**Where to validate:** TanStack Router `__root` `beforeLoad`
**Description:** Every route except `/sign-in` is protected. Before any area mounts, the `__root` loader reads the JWT from `useAuthStore`. Absent or expired token (decoded `exp` < `now() + 30s`) redirects to `/sign-in?reason=session_expired`. The expiry check is local (no token introspection round-trip in the foundation).
**Error returned:** Redirect to `/sign-in?reason=session_expired`. A 401 from the BFF (token rejected server-side) follows the same flow via `QueryCache.onError`.

### BR-05 -- No `fetch` / `axios` inside components
**Related spec section:** `front.md §4.5`
**Where to validate:** ESLint (`no-restricted-imports`) + code review
**Description:** Components never call `fetch` or `axios` directly. All BFF calls go through a TanStack Query hook in `features/<area>/api/`. `useEffect` for fetching is also forbidden.
**Error returned:** N/A (lint-time).

### BR-06 -- Cross-feature import forbidden
**Related spec section:** `front.md §6.1`
**Where to validate:** ESLint `import/no-restricted-paths` rule
**Description:** A file under `features/A/**` MUST NOT import from `features/B/**`. Shared code lives in `components/`, `lib/`, or `state/`. The rule is configured in `.eslintrc.cjs`.
**Error returned:** N/A (lint-time).

### BR-07 -- Query key factory mandatory for invalidations
**Related spec section:** `front.md §4.2`
**Where to validate:** code review + ESLint custom rule (deferred — added to TD list)
**Description:** Every `invalidateQueries({ queryKey })` MUST resolve `queryKey` through a key factory exported from a feature's `api/keys.ts`. Inline literal keys (`["nodes", id]`) are forbidden in any `invalidateQueries` call.
**Error returned:** N/A (build-time).

### BR-08 -- Stale-time policy by data class
**Related spec section:** `front.md §4.1`
**Where to validate:** Each feature's Query hook; default in the global `QueryClient`
**Description:** Catalog and stable detail queries use `staleTime: 5 * 60 * 1000`. Volatile queries (search, run status while `extracting`, queue counts) use `staleTime: 0`. The global default is `5 * 60 * 1000`; volatile hooks override it explicitly. Hooks that depend on `as_of` MUST include `as_of` in the query key (else cache poisoning).
**Error returned:** N/A.

### BR-09 -- Theme hydration before React mount (no FOUC)
**Related spec section:** `front.md §8.1`
**Where to validate:** `index.html` inline script + `useThemeStore` rehydration
**Description:** `index.html` runs a small inline script before the React bundle parses, reading `localStorage.getItem("remember.theme")` and setting `<html data-theme="…">`. The script MUST be safe against `localStorage` access errors (private mode, quota) — falling back to `prefers-color-scheme` then to `"dark"`. The Zustand store rehydrates from the same key on mount; the inline script and the store MUST agree.
**Error returned:** N/A — failure falls back to default theme silently (deviation from "fail loud" is justified: a wrong theme is preferable to a broken boot).

### BR-10 -- Reduced-motion gate on every animation
**Related spec section:** `front.md §9.1`, `§10`
**Where to validate:** `lib/motion.ts` shared variants
**Description:** Every Framer Motion variant exported from `lib/motion.ts` is wrapped in a `prefers-reduced-motion` gate. Under reduced motion, state changes are still **legible** (color/shape change instantly) but no animation runs. Components MUST consume only the variants from `lib/motion.ts` — inline `animate={…}` definitions are forbidden.
**Error returned:** N/A.

### BR-11 -- Semantic tokens only (no raw values)
**Related spec section:** `front.md §1.2`, `§6.4`
**Where to validate:** code review; ESLint custom rule (deferred — added to TD list)
**Description:** Tailwind classes consume only semantic tokens declared in `styles/theme.css`. Arbitrary values (`w-[347px]`, `bg-[#1e293b]`) are forbidden. Inline `style={{ }}` is forbidden except for a dynamic value with no token equivalent (e.g., a graph node's computed `x`/`y`).
**Error returned:** N/A (lint-time + code review).

### BR-12 -- Single global `QueryClient`, single `Toaster`, single `<AppErrorBoundary>`
**Related spec section:** `front.md §4`, `§5.1`
**Where to validate:** `main.tsx` + `__root.tsx`
**Description:** Exactly one `QueryClient` is constructed in `main.tsx` and provided through `QueryClientProvider`. Exactly one `<Toaster>` (sonner) is mounted in `__root`. Exactly one `<AppErrorBoundary>` wraps the `__root` outlet. Duplicate providers are a regression — caught by a Vitest smoke test.
**Error returned:** N/A.

### BR-13 -- ESM-only bundle; no CommonJS transitive surface
**Related spec section:** §1 of this document
**Where to validate:** `package.json` `"type": "module"`; Vite warnings on CommonJS-only deps
**Description:** The frontend package is ESM (`"type": "module"`). Any dependency that ships only CommonJS is flagged at build time and added to `optimizeDeps.include` explicitly — never silently tolerated.
**Error returned:** N/A.

### BR-14 -- `data-theme` is the only theme switch surface
**Related spec section:** `front.md §8.1`
**Where to validate:** `useThemeStore.set()` subscriber
**Description:** Switching themes writes `<html data-theme="dark">` (or `"light"`) — exactly one attribute on one element. CSS class toggles (`.dark`, `.light`), inline styles, and Tailwind v3 `darkMode: 'class'` patterns are all forbidden.
**Error returned:** N/A.

### BR-15 -- Backdrop image lazy-loaded (out of LCP)
**Related spec section:** `front.md §2.3`
**Where to validate:** `AmbientBackdrop.tsx` mount logic
**Description:** The ambient backdrop image is requested via a `<link rel="preload" as="image">` injected **after** the initial render's `requestIdleCallback` (fallback: `setTimeout(0)`). The image MUST NOT be in the critical bundle and MUST NOT count against the LCP budget (`< 2.5 s`). Failure to load falls back to a flat-color background derived from `--surface-base`.
**Error returned:** N/A — graceful fallback.

### BR-16 -- Graph node positions controlled, never imperative
**Related spec section:** `front.md §7.3`
**Where to validate:** Graph feature implementation (later wave); foundation imposes the contract
**Description:** Node positions are owned by React Flow's controlled API and mirrored in `useGraphViewStore.pinnedPositions`. Direct DOM mutation (`element.style.transform = ...`) is forbidden. d3-force simulation runs on the data model only, not on DOM nodes.
**Error returned:** N/A.

### BR-17 -- BFF envelope failure path = single error map
**Related spec section:** `front.md §5`
**Where to validate:** `lib/http.ts` + global `QueryCache.onError`
**Description:** The mapping from `error.code` → UI behaviour (toast / inline / redirect / boundary) is centralized in `lib/error-routing.ts`. Per-feature hooks MUST NOT add ad-hoc handling for the codes covered by the table in `front.md §5`; they MAY add feature-specific handling for `BUSINESS_*` codes the feature itself defines.
**Error returned:** Per the routing map.

### BR-18 -- React Flow rendering is React-component-based, never SVG-direct
**Related spec section:** `front.md §7.1`
**Where to validate:** Graph feature implementation (later wave)
**Description:** Custom node and edge renderers are registered through React Flow's `nodeTypes` / `edgeTypes` props. Direct SVG element construction outside the React tree is forbidden — every node and edge MUST be a React component so semantic tokens, lucide icons, and Framer Motion variants apply.
**Error returned:** N/A.

---

## 4. State Machine (ST)

### ST-01 -- App boot

```
┌──────────────────────────────────────────────────────────────────┐
│  bootstrapping  (env validated, QueryClient built, router built)  │
└────────────────────┬─────────────────────────────────────────────┘
                     │  env valid + theme hydrated
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  unauthenticated  (no JWT, or JWT decoded exp expired)            │
└────────────────────┬─────────────────────────────────────────────┘
                     │  sign-in success → token stored
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  authenticated  (JWT present, area can mount)                     │
└────────────────────┬─────────────────────────────────────────────┘
                     │  401 from BFF  OR  exp passed
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  session_expired  (token cleared, redirect to /sign-in)           │
└──────────────────────────────────────────────────────────────────┘
```

| From | To | Event | Guard | Section |
|---|---|---|---|---|
| `bootstrapping` | `unauthenticated` | `boot_complete` | `useAuthStore.accessToken === null` | §3, §4 |
| `bootstrapping` | `authenticated` | `boot_complete` | token present AND decoded `exp` > `now() + 30s` | §3 |
| `bootstrapping` | `boot_failed` | `env_invalid` | env Zod schema rejects | BR-02 |
| `unauthenticated` | `authenticated` | `sign_in_success` | token written to `useAuthStore` | §3 |
| `authenticated` | `session_expired` | `bff_returned_401` | `EnvelopeError.code === "AUTH_UNAUTHORIZED"` | BR-04, §5 |
| `authenticated` | `session_expired` | `local_token_expired` | `decoded.exp <= now()` | BR-04 |
| `session_expired` | `unauthenticated` | `redirect_complete` | route is `/sign-in` | §3 |

Terminal state: `boot_failed` (only escape is reload after fixing env).

Invalid transition policy: throw — surfaced via the `AppErrorBoundary`. No silent recovery.

### ST-02 -- Theme

| From | To | Event | Guard | Section |
|---|---|---|---|---|
| `dark` | `light` | `user_toggled_theme` | none | §8.1 |
| `light` | `dark` | `user_toggled_theme` | none | §8.1 |
| (cold start) | `dark` | `hydrate` | no `localStorage` value AND `prefers-color-scheme: dark` (or missing) | §8.1, BR-09 |
| (cold start) | `light` | `hydrate` | no `localStorage` value AND `prefers-color-scheme: light` | §8.1, BR-09 |
| (cold start) | persisted value | `hydrate` | `localStorage.getItem("remember.theme") in { "dark", "light" }` | BR-09 |

---

## 5. Domain Events (EV)

> The frontend has no message bus. "Events" here are the **named state transitions** referenced by `front.md §9` ("movimento com significado") — they are the public motion contract: any component that wants to express one of these transitions imports the corresponding variant from `lib/motion.ts`. The payloads below are the prop shape passed to the Framer Motion variant.

### EV-01 -- `motion.pulse.uncertain`
**Dispatched when:** a fact in `uncertain` state is mounted in any surface that supports state badges (StateBadge atom, GraphNode, FragmentRow).
**Producer:** the component that renders the fact.
**Consumer (variant):** Framer Motion `motion.pulse.uncertain` from `lib/motion.ts`.
**Payload (variant props):**
```json
{
  "state": "uncertain",
  "reducedMotion": false,
  "tokens": {
    "color": "var(--color-state-uncertain)",
    "duration": "var(--duration-pulse)",
    "easing":   "var(--ease-in-out)"
  }
}
```
**Delivery semantics:** synchronous (DOM event loop) — at-most-once per mount, repeats according to the variant's loop config.

### EV-02 -- `motion.transition.promote`
**Dispatched when:** an `uncertain` fact is consolidated (`uncertain → accepted`). Triggered by a TanStack Query refetch that returns a higher confidence than the previous cache value. The component diffs the state and runs the variant.
**Producer:** any component rendering a fact (StateBadge, GraphNode).
**Consumer (variant):** `motion.transition.promote` from `lib/motion.ts`.
**Payload (variant props):**
```json
{
  "from": "uncertain",
  "to": "accepted",
  "reducedMotion": false,
  "tokens": {
    "colorFrom": "var(--color-state-uncertain)",
    "colorTo":   "var(--color-state-accepted)",
    "duration":  "var(--duration-moderate)",
    "easing":    "var(--ease-out-quint)"
  }
}
```
**Delivery semantics:** exactly-once per transition (the consuming component MUST gate on a `prevState !== state` check; the variant itself does not de-duplicate).

### EV-03 -- `motion.transition.supersede`
**Dispatched when:** a fact transitions to `superseded` because a newer version exists (`is_current` becomes `false`).
**Producer:** any component rendering a fact.
**Consumer (variant):** `motion.transition.supersede` from `lib/motion.ts`.
**Payload (variant props):**
```json
{
  "to": "superseded",
  "reducedMotion": false,
  "tokens": {
    "color":    "var(--color-state-superseded)",
    "duration": "var(--duration-entrance)",
    "easing":   "var(--ease-in)"
  }
}
```
**Delivery semantics:** exactly-once per transition.

### EV-04 -- `motion.transition.merge`
**Dispatched when:** the operator merges two entities (a curation action). The Graph feature subscribes to the mutation success and triggers the variant on the source node before unmounting it.
**Producer:** Graph feature (later wave); foundation reserves the variant.
**Consumer (variant):** `motion.transition.merge` from `lib/motion.ts`.
**Payload (variant props):**
```json
{
  "sourceId":  "<uuid>",
  "targetId":  "<uuid>",
  "targetPosition": { "x": 0, "y": 0 },
  "reducedMotion": false,
  "tokens": {
    "duration": "var(--duration-entrance)",
    "easing":   "var(--ease-out-expo)"
  }
}
```
**Delivery semantics:** exactly-once per merge mutation.

### EV-05 -- `query.envelope.error`
**Dispatched when:** any TanStack Query hook resolves to a BFF envelope with `ok === false`.
**Producer:** `lib/http.ts` (throws `EnvelopeError`) → `QueryCache.onError`.
**Consumer:** the global error router in `lib/error-routing.ts` (per `front.md §5` table) — and, transitively, sonner (toasts) or the router (redirects).
**Payload:**
```json
{
  "code":     "AUTH_UNAUTHORIZED",
  "httpStatus": 401,
  "message":  "Token inválido ou expirado.",
  "details":  null,
  "queryKey": ["nodes", "list", { "filter": "…" }]
}
```
**Delivery semantics:** at-most-once per query attempt (TanStack Query default `retry: 1` may produce two attempts; only the final failure reaches `onError`).

---

## 6. External Integrations

> The frontend integrates with two external surfaces only.

| Service | Type | Purpose | Timeout | Fallback |
|---|---|---|---|---|
| Remember BFF (`/api/v1/**`) | REST (JSON envelope) | All data reads/writes; runs `ingest`, `query`, `curation` toolsets via REST mirrors | Default: TanStack Query has no built-in network timeout; `lib/http.ts` wraps `fetch` with an `AbortController` set to **30 s** for non-ingest calls. `/ingest` and `/mcp/ingest` MUST be called with `AbortSignal.timeout(0)` (no client-side cutoff) per `CLAUDE.md` "ingest_document client timeout ≠ failure" memory. | On timeout: TanStack Query `retry: 1` re-attempts; second failure surfaces `SYSTEM_TIMEOUT` toast. Ingest "timeout" is **not** a failure — UI displays "A extração continua no servidor". |
| Neon Auth (Stack Auth) | OIDC / JWT issuer | Issues the JWT the SPA carries on every BFF request. JWKS validation happens **server-side** (BFF middleware) — the SPA does not call JWKS itself. | N/A (server-side concern); SPA only handles the OAuth-style redirect to `${VITE_NEON_AUTH_URL}/sign-in` | On Neon Auth unreachable: sign-in screen surfaces "Serviço de login indisponível — tente novamente em alguns minutos." (`SYSTEM_AUTH_UPSTREAM_DOWN`). No silent fallback. |

> The frontend has no other external integrations in this wave. Future waves may add: a CDN for the backdrop asset (currently bundled in `public/backdrop/`), telemetry (currently forbidden — see `front.md §11`).

---

## 7. Known Technical Constraints

1. **`vitest` v4 + `vite` v6 + Storybook `addon-vitest` peer chain** — `package.json` MUST declare an `overrides` entry pinning Vite v6 to satisfy `addon-vitest`'s peer range. Bumping `vitest` or `vite` requires re-running the Storybook browser-mode test suite end-to-end. Documented in `front.md §1.1` and CLAUDE.md `Known Gotchas`.
2. **Tailwind v4 two `border` namespaces** — `--color-border-*` (color) and `--border-*` (width) are distinct namespaces; mixing them makes the border disappear silently. Every glass-surface border in components MUST be written as the pair `border <color-token>` (`front.md §8.3`). Foundation does not yet enforce this with a lint rule — added to the technical-debt list.
3. **React 19 `forwardRef` deprecation** — third-party libraries that still ship `forwardRef` work transparently; project code MUST NOT introduce new `forwardRef` usage. ESLint rule via `react-hooks` is insufficient — code review + custom check is the current safeguard.
4. **TanStack Router file-based vs. code-based** — the foundation adopts **code-based** route declaration in `src/router/`. File-based may be evaluated later if the route count grows; the migration is mechanical and isolated to `src/router/`.
5. **No refresh-token flow this wave** — JWT expiry (~1 h from Neon Auth) causes a redirect to `/sign-in?reason=session_expired`. Refresh-token handling is deferred to a later wave; CLAUDE.md memory `ingest-document client timeout ≠ failure` already covers the longer-running concern (server-side completion despite client-side disconnect).
6. **Single-owner = no telemetry / no error tracker** — `front.md §11` prohibits Sentry / Bugsnag / Datadog RUM / any analytics lib. Client-side errors above `SYSTEM_*` route through the BFF (pino logs) — the foundation MUST provide a `lib/report-error.ts` that POSTs to a BFF endpoint (`/api/v1/system/client-error`) **only if that endpoint exists**; absent the endpoint, errors stay in `console.error`. Implementing the BFF endpoint is **out of scope this wave**.
7. **Backdrop assets are placeholders** — `public/backdrop/dusk.jpg` and `public/backdrop/dawn.jpg` are placeholder names; the final commissioned assets replace them with no spec change required. The fallback (BR-15) covers the missing-asset case.
8. **`addon-vitest` requires Playwright on the host** — Storybook stories-as-tests run in a real browser via `@vitest/browser` + Playwright. CI MUST install Playwright browsers (`npx playwright install --with-deps`); local dev MUST run the same command at least once.
9. **Path alias drift between `tsconfig.json` and `vite.config.ts`** — mitigated by `vite-tsconfig-paths`. If that plugin is ever removed (e.g., during a Vite major bump), the duplicated map MUST be re-introduced and a CI check added.
10. **No OpenAPI codegen** — types for BFF responses are hand-written in each feature's `types.ts`. If the BFF surface grows beyond ~20 endpoints, evaluate `openapi-typescript` (read-only types, no runtime weight). Out of scope this wave.

---

## 8. Out of Scope

This foundation does NOT include:

- **Refresh-token / silent re-auth flow** — expiry produces a redirect. Re-evaluate when ingest sessions routinely exceed JWT lifetime.
- **Client-side error reporting endpoint** — `lib/report-error.ts` is a stub; the BFF `POST /api/v1/system/client-error` endpoint that would receive forwarded errors is out of scope.
- **Per-area state stores (Graph data, Search filters, Ingest run progress)** — the foundation reserves `useGraphViewStore`, but the per-area Query hooks and feature stores ship in the area-specific waves.
- **Per-area route content** — `/graph`, `/search`, `/ingest`, `/curation`, `/history` are foundation-stubbed with an empty workspace + frame; their content is out of scope.
- **Header and footer content** — the foundation's `Header.tsx` and `Footer.tsx` are placeholders. Navigation tabs, `as_of` segment, curation counter, run progress, ⌘K trigger all ship in later waves.
- **Provenance drawer (z-drawer)** — reserved in the layer scale; not implemented in the foundation.
- **Command palette (⌘K)** — store reserved, UI not implemented.
- **Time picker for `as_of`** — reserved in URL state contract, picker UI not implemented.
- **Sign-in screen content** — `/sign-in` is a foundation stub; full Neon Auth UX is later.
- **OpenAPI codegen** — see Constraint 10.
- **Service Worker / offline mode** — not in scope; no PWA manifest, no `workbox`.
- **CDN strategy for the backdrop asset** — bundled under `public/` for now.

---

## Changelog

> Mandatory — never remove previous entries.

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-18 | Back Spec Agent | initial | Initial foundation: Vite 6 / TS strict / Tailwind v4 / TanStack stack pins; persisted client state shapes; 18 BRs covering aliases, env, envelope, auth guard, lint guards, motion gate, theme hydration; ST for boot + theme; 5 named motion/error events; BFF + Neon Auth integrations; technical-debt list. | -- |
| 1.0.1 | 2026-06-19 | Owner review | patch | EV-01–04 motion payloads now reference the canonical token names from `tokens.md §11.1` (`--duration-*` / `--ease-*`) instead of the non-existent `--motion-duration-*` / `--motion-easing-*` (W-FG-3). | -- |
