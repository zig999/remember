# GlassSurface — Back (Technical Decisions)

> Companion to: `GlassSurface.component.spec.md` (COMP-02, v1.1.0)
> Layer: permanent | Status: draft v1.0.0
> Scope: **frontend foundation atom** — no backend domain. Sections that would normally describe data model, business rules (BR), domain events (EV), and external integrations are marked **N/A** with rationale in §3.

---

## 1. Purpose of this document

This file documents the **technical implementation decisions** required to realize the contract approved in `GlassSurface.component.spec.md` v1.1.0. It does NOT restate the spec — it pins down:

- File layout and exports
- The CVA factory shape for 3 levels × 7 accents (with the load-bearing Tailwind v4 dual-namespace pattern preserved)
- Framer Motion variant catalogue per level + the reduced-motion gate
- Performance posture for `backdrop-filter` (GPU-expensive)
- Token → utility mapping (which Tailwind class each ingredient resolves to)
- Accessibility implementation (focus ring composition, contrast budget)
- Testing strategy (unit, visual regression, addon-vitest browser tests)
- Storybook story matrix and decorator wiring
- React 19 ref-as-prop pattern (no `forwardRef`)

Every decision is traceable to a section in the component spec or to `design-system/tokens.md`.

---

## 2. Stack reaffirmation

| Concern | Choice | Source |
|---|---|---|
| Framework | React 19 (strict) — `ref` as a normal prop, **no `forwardRef`** | `CLAUDE.md` Stack / Component contract |
| Language | TypeScript strict | `CLAUDE.md` Conventions |
| Styling | Tailwind v4 CSS-first (`@theme` in `theme.css`, no `tailwind.config.ts`) | `CLAUDE.md` Styling |
| Variant factory | `class-variance-authority` (CVA) — required because ≥ 2 variants exist (level × accent) | `CLAUDE.md` Component contract |
| Class merge | `cn()` = `tailwind-merge` + `clsx` — `frontend/src/lib/cn.ts` | `CLAUDE.md`; spec §11 |
| Motion | Framer Motion + `useReducedMotion()` | spec §7, §16 |
| Tests | Vitest (unit) + `@storybook/addon-vitest` (browser-mode stories-as-tests) + Playwright (only if E2E needed) | `CLAUDE.md` Testing |
| Storybook | `@storybook/react-vite` v9 with `addon-a11y` and `addon-vitest` | `CLAUDE.md` Stack — Frontend |

> **Build-toolchain pin** (from `CLAUDE.md` Known Gotchas): `vitest` is pinned at v4 with a Vite override due to `addon-vitest`. Do **not** bump vitest/vite while implementing this atom — the stories-as-tests harness would break.

---

## 3. Data model / Business rules / Domain events / Integrations — N/A

`GlassSurface` is a **pure presentational container atom**. It owns:

- Zero database rows
- Zero backend endpoints (no REST, no MCP tool)
- Zero domain events (`{ ok, result }` envelopes do not flow through it)
- Zero external integrations (no Anthropic, no Neon, no Stack Auth — all those live in the BFF)

| Standard back-spec section | Status | Rationale |
|---|---|---|
| Data model (tables, indexes, FK) | **N/A** | The component has no persisted state. Internal state (`mounted`/`unmounting`, motion variant phase) is React-local and ephemeral. |
| Business rules (BR-NN) | **N/A** | No business logic. The only "rule" enforceable on the BFF side does not apply here — the component decides nothing about confidence, validity, or curation. |
| Domain events (EV-NN) | **N/A** | No producers, no consumers. Framer Motion variant lifecycle events (`onAnimationStart`, `onAnimationComplete`) are local React callbacks, not domain events. |
| State machine (ST-NN) | **N/A** | The mount/enter/exit/idle/exit transitions are driven by React's reconciler + Framer Motion's `AnimatePresence`. They are documented in the **front** spec (§4) and need no backend state machine. |
| External integrations | **N/A** | None. The atom imports only from `framer-motion`, `class-variance-authority`, and project utilities (`cn`, `motion.ts`, tokens via Tailwind). |
| Migrations / seeds | **N/A** | No schema. |
| Error code catalog | **N/A** | The atom never throws domain errors. It is type-safe by construction; any misuse (e.g., invalid `level`) is a TypeScript compile error, not a runtime `BUSINESS_*` code. |
| Authentication / authorization | **N/A** | The atom renders client-side, downstream of `requireNeonAuth` (which guards the route, not the component). |

---

## 4. File structure

> Path: `frontend/src/components/ds/GlassSurface/`
> Convention from `CLAUDE.md` Component contract: `component.tsx`, `component.types.ts`, `index.ts`. The CVA factory lives in a separate `.variants.ts` per project convention (multiple variants justify the split).

```
frontend/src/components/ds/GlassSurface/
├── GlassSurface.tsx              # The component (function declaration; ref-as-prop)
├── GlassSurface.types.ts         # GlassLevel, GlassAccent, GlassSurfaceProps
├── GlassSurface.variants.ts      # cva() factory — level × accent
├── GlassSurface.stories.tsx      # 14 stories (see §10)
├── GlassSurface.test.tsx         # Unit tests — class composition, ref forwarding, reduced motion
└── index.ts                      # Re-exports: GlassSurface, types
```

Adjacent shared infrastructure (these files are added/extended by this work, but they are NOT inside the GlassSurface folder):

```
frontend/src/lib/motion.ts        # Add: glassPanelMotion, glassModalMotion  (alongside §11.2 variants from tokens.md)
frontend/src/lib/cn.ts            # Existing — used as-is
frontend/eslint-rules/no-glass-surface-opaque-override.js   # Custom rule (spec §11.2)
.storybook/decorators/withAmbientBackdrop.tsx                # Decorator that mounts treated backdrop slice (spec §9)
```

### 4.1 `index.ts` shape

Per `CLAUDE.md`: per-component `index.ts` re-exporting that single component's public surface is allowed (explicit stack exception to the no-barrel rule).

```ts
export { GlassSurface } from './GlassSurface'
export type { GlassLevel, GlassAccent, GlassSurfaceProps } from './GlassSurface.types'
```

No `export *`. Only the named symbols above.

---

## 5. CVA implementation — 3 levels × 7 accents

The atom is the **canonical example** of the `border <color-token>` pair pattern from `tokens.md §7.2`. The CVA factory is structured to make it **impossible** to forget either half.

### 5.1 Base class — emits BOTH border namespace halves

```ts
// GlassSurface.variants.ts
import { cva, type VariantProps } from 'class-variance-authority'

export const glassSurface = cva(
  // BASE — width + default color (the load-bearing pair).
  // Width class is "border" (= --border-DEFAULT = 1px).
  // Color class is "border-border-glass" (= --color-border-glass).
  // Tailwind v4 keeps these in distinct namespaces; missing either makes the
  // edge silently disappear with no warning. NEVER edit one without the other.
  'border border-border-glass',
  {
    variants: {
      level: {
        ambient: 'bg-surface-glass-ambient backdrop-blur-glass-sm shadow-sm rounded-none',
        panel:   'bg-surface-glass-panel   backdrop-blur-glass-md shadow-md shadow-glass rounded-lg',
        modal:   'bg-surface-glass-modal   backdrop-blur-glass-lg shadow-lg shadow-glass rounded-xl',
      },
      accent: {
        none:       '',                                              // keep default border-border-glass from BASE
        accepted:   'border-border-accepted',                        // COLOR ONLY — width stays from BASE
        uncertain:  'border-border-uncertain',
        disputed:   'border-border-disputed',
        superseded: 'border-border-superseded',
        focus:      'border-border-focus ring-2 ring-border-focus',  // color + inner ring (still 1px width)
        error:      'border-border-error',
      },
    },
    defaultVariants: { level: 'panel', accent: 'none' },
  },
)

export type GlassSurfaceVariants = VariantProps<typeof glassSurface>
```

### 5.2 Why both namespaces appear in the BASE (not in the variants)

`tailwind-merge` resolves Tailwind class conflicts so the **last writer wins**. When the consumer (or the variant) adds `border-border-accepted`, `tailwind-merge` replaces the color half — but the width class `border` from the BASE survives because it lives in a **different namespace** (`--border-*` vs `--color-border-*`). This is why:

1. The width class `border` is in the BASE (never duplicated in variants).
2. Every accent variant emits **only** the color half (`border-border-*`).
3. The `focus` accent adds `ring-2 ring-border-focus` on top — the ring is in yet another namespace (`--ring-*` is not split; `ring-2` carries both width and color shorthand for the ring utility).

This invariant is **enforced by tests** (§9.3): a regression test asserts that for every accent, the final class string contains both `border` (width) AND a `border-border-*` (color) token.

### 5.3 Radius override — handled in the component, not in CVA

The `radius` prop is appended **after** the CVA output so `tailwind-merge` resolves it deterministically (radius prop wins over the level default; consumer `className` wins over both — last writer wins). See §6 for the call site.

---

## 6. Component implementation pattern (React 19 + Framer Motion)

```tsx
// GlassSurface.tsx
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { glassSurface } from './GlassSurface.variants'
import { glassPanelMotion, glassModalMotion } from '@/lib/motion'
import type { GlassSurfaceProps } from './GlassSurface.types'

export function GlassSurface({
  level,
  accent = 'none',
  animate = true,
  radius,
  role = 'group',
  className,
  ref,            // React 19: ref is a normal prop. NO forwardRef.
  children,
  ...rest
}: GlassSurfaceProps) {
  const prefersReduce = useReducedMotion()
  const motionEnabled = animate && !prefersReduce && level !== 'ambient'

  // Select level-tied variant — only panel/modal have enter/exit.
  const variants = motionEnabled
    ? level === 'panel' ? glassPanelMotion
    : level === 'modal' ? glassModalMotion
    : undefined
    : undefined

  return (
    <motion.div
      ref={ref}
      role={role}
      className={cn(glassSurface({ level, accent }), radius, className)}
      {...(variants
        ? { initial: 'hidden', animate: 'visible', exit: 'exit', variants }
        : null)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
```

### 6.1 Why `motion.div` is always used (even with `animate=false`)

Using `motion.div` unconditionally avoids a component-identity flip when the consumer toggles `animate` (which would unmount/remount the subtree). When `variants` is `undefined`, `motion.div` behaves like a plain `<div>` — no animation runs, no `will-change` is applied by Framer Motion.

### 6.2 Why `level === 'ambient'` is short-circuited to "no motion"

Per spec §7 table: ambient frames are always present from first paint — they have **no enter/exit variant**. Skipping the variant assignment for ambient also avoids any incidental `will-change` insertion on a structural element that lives forever.

### 6.3 Exit motion + `AnimatePresence`

`exit` variants only fire when the element unmounts **inside** a Framer Motion `<AnimatePresence>` boundary. The atom does NOT provide its own `AnimatePresence` wrapper — that is the **consumer's responsibility** (e.g., Radix `Dialog.Content` wrapped by `<AnimatePresence>` in the consumer). Document this clearly in the component README/JSDoc.

---

## 7. Motion variants — file location and shape

> The variants live in `frontend/src/lib/motion.ts`, alongside the four normative variants from `tokens.md §11.2` (`pulse.uncertain`, `transition.promote`, `transition.supersede`, `transition.merge`). They are exported as plain Framer Motion `Variants` objects.

### 7.1 New exports added by this work

```ts
// frontend/src/lib/motion.ts (excerpt — added by this work)
import type { Variants } from 'framer-motion'

// Tokens are referenced by CSS var name; Framer Motion reads them at runtime
// against the resolved CSS environment so the theme switch works without rebuild.
const D_FAST     = 'var(--duration-fast)'      // 200ms
const D_MODERATE = 'var(--duration-moderate)'  // 300ms
const D_INSTANT  = 'var(--duration-instant)'   // 100ms
const E_OUT      = [0.25, 1, 0.5, 1] as const           // --ease-out
const E_IN       = [0.7, 0, 0.84, 0] as const           // --ease-in
const E_OUT_Q    = [0.22, 1, 0.36, 1] as const          // --ease-out-quint

// Framer Motion cannot read CSS-var transition durations directly via the
// `transition.duration` field — it expects seconds. The duration tokens are
// mirrored as constants here so the unit conversion happens in ONE place.
// If a token changes in tokens.md, update this mirror as part of the change.
const SEC = (ms: number) => ms / 1000
const T_FAST     = SEC(200)
const T_MODERATE = SEC(300)
const T_INSTANT  = SEC(100)

export const glassPanelMotion: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: T_FAST,     ease: E_OUT } },
  exit:    { opacity: 0, y: 8, transition: { duration: T_INSTANT,  ease: E_IN  } },
}

export const glassModalMotion: Variants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1,    transition: { duration: T_MODERATE, ease: E_OUT_Q } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: T_INSTANT,  ease: E_IN    } },
}
```

> **Why duration constants are mirrored** instead of read from CSS vars: Framer Motion's `transition.duration` is a **number in seconds**, not a CSS string. The mirror is the single conversion point — a comment in `motion.ts` explicitly references `tokens.md §11.1` so any change there triggers an update here. (An automated check could later parse `tokens.md` and assert parity — out of scope for this iteration.)

### 7.2 `accent="uncertain"` border pulse — composition

The spec §6.4 and §8 require a pulse scoped to the **border color** when `accent="uncertain"` and motion is allowed. Two implementation options:

| Option | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Animate the CSS variable `--color-border-uncertain` opacity on the element itself via a sibling Framer Motion variant `uncertainBorderPulse` (animates `borderColor`) — combined with the entrance variant via `useAnimation` choreography | Slightly more code; one `motion.div` handles both entrance and pulse via combined variants object |
| B | Wrap the surface in a second `motion.div` for the pulse | Adds a DOM node and an extra paint layer; rejected for performance |

Implementation sketch for Option A (live in `motion.ts` alongside `glassPanelMotion`):

```ts
// frontend/src/lib/motion.ts (excerpt — Option A)
export const uncertainBorderPulse: Variants = {
  // Designed to be MERGED with glassPanelMotion / glassModalMotion via
  // `variants: { ...glassPanelMotion, ...uncertainBorderPulse }` in GlassSurface.
  // The 'visible' key is intentionally absent here so it does not clobber the
  // entrance 'visible'. Instead, an additional 'pulse' key is used as a follow-on.
  pulse: {
    borderColor: [
      'oklch(75% 0.15 75 / 1)',     // --color-border-uncertain @ 1
      'oklch(75% 0.15 75 / 0.55)',  // @ 0.55 — trough
      'oklch(75% 0.15 75 / 1)',     // back to 1
    ],
    transition: {
      duration: 2.4,                // --duration-pulse (2400ms)
      ease: [0.65, 0, 0.35, 1],     // --ease-in-out
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
}
```

The component chains `animate="visible"` then transitions to `animate="pulse"` once the entrance completes (`onAnimationComplete`). Reduced motion disables both — including the pulse.

> **Theme caveat.** The literal `oklch(75% 0.15 75 / α)` above is the **dark** value of `--color-border-uncertain`. For light theme, Framer Motion still works because `tailwind-merge` and the `[data-theme="light"]` block do not affect Framer Motion arrays. The mitigation is to render the pulse via CSS `@keyframes` driven by a `data-state="pulsing"` attribute — moving the color resolution back into CSS where the theme cascade applies. **Decision:** use a CSS animation, not Framer Motion array values, for the uncertain pulse. The CSS animation is defined in `theme.css` next to the token block:
>
> ```css
> /* theme.css */
> @keyframes uncertain-border-pulse {
>   0%, 100% { border-color: var(--color-border-uncertain); }
>   50%      { border-color: color-mix(in oklch, var(--color-border-uncertain) 55%, transparent); }
> }
> @media (prefers-reduced-motion: no-preference) {
>   [data-glass-pulse="uncertain"] {
>     animation: uncertain-border-pulse var(--duration-pulse) var(--ease-in-out) infinite;
>   }
> }
> ```
>
> The component sets `data-glass-pulse="uncertain"` when `accent="uncertain"`. `prefers-reduced-motion: reduce` automatically disables the animation because the rule lives inside the `no-preference` media query. **This is the final pattern** — `uncertainBorderPulse` Framer variant is **not** shipped.

### 7.3 Summary of motion exports

| Export | Source | Used where |
|---|---|---|
| `glassPanelMotion` | new (this work) — `lib/motion.ts` | `GlassSurface` (level `panel`) |
| `glassModalMotion` | new (this work) — `lib/motion.ts` | `GlassSurface` (level `modal`) |
| Uncertain border pulse | new (this work) — CSS `@keyframes uncertain-border-pulse` in `theme.css`, gated by `data-glass-pulse="uncertain"` and `@media (prefers-reduced-motion: no-preference)` | `GlassSurface` (accent `uncertain`) |
| `motion.transition.promote`, `motion.transition.supersede`, `motion.transition.merge`, `motion.pulse.uncertain` | existing — `tokens.md §11.2` | NOT consumed by `GlassSurface` directly (used by other atoms like StateBadge) |

---

## 8. Performance posture — `backdrop-filter` is expensive

`backdrop-filter: blur(...)` is one of the most expensive CSS effects. The atom is the **base material** of every floating layer — at peak there could be 4–6 instances on screen (header + footer + panel + popover + drawer + modal). Without discipline, this hits compositing and INP budgets fast.

### 8.1 Decisions

| Concern | Decision | Rationale |
|---|---|---|
| `will-change` | **Do NOT add `will-change: backdrop-filter`** on the base element. Framer Motion adds `will-change: transform, opacity` automatically during the enter/exit transition and removes it afterwards. | Permanent `will-change` on every glass surface defeats its purpose (it tells the browser to keep a layer warm even when idle, blowing memory). |
| Compositing isolation | Each `GlassSurface` is its own stacking context via `shadow-glass` (the `inset` portion forces a paint layer) and the layer z-index applied by the consumer. No explicit `transform: translateZ(0)` hack is needed. | Avoids forcing extra layers; trusts the browser's compositor heuristics. |
| Blur strength | The three blur values (8/16/24 px) were chosen on the **low end** of what reads as "glass" — `24px` is the ceiling. | Higher blur radii (e.g., 40 px) cost ~4× more on most GPUs. |
| Low-end fallback | **Decision: no automatic fallback.** The supported environments (modern Chromium / WebKit on desktop and recent mobile) handle `backdrop-filter` natively. If a measurable INP regression appears in the future (Lighthouse gate ≥ 85), the mitigation is a `@supports not (backdrop-filter: blur(1px))` block in `theme.css` that swaps the glass surface tokens to higher alpha (0.85+) and drops the blur — the visual fallback is "translucent solid". This is opt-in, NOT shipped in v1. | Premature optimization; trust the perf budget gate to surface real regressions. |
| Animating `backdrop-filter` | **Forbidden.** The atom never animates `backdrop-filter` (e.g., morphing the blur radius). Only `opacity` and `transform` are animated (per `tokens.md §11.3`). | Animating `backdrop-filter` triggers per-frame re-rasterization of everything below — catastrophic for INP. |
| Scroll-bound parents | When a `GlassSurface` is inside a scrolling container, the parent should NOT also have `backdrop-filter` (nested blurs are O(n²)). Document this in the JSDoc on the component. | Composition cost. |
| `transform: translate3d` workaround | Not applied by the component itself. If a consumer reports tearing on Safari, the consumer can apply `transform: translateZ(0)` via `className` — but the atom does not bake this in (it would force a new compositing layer permanently). | Same reasoning as `will-change`. |

### 8.2 Performance acceptance criteria

The atom contributes to the global frontend budget from `CLAUDE.md`:

- **LCP < 2.5s** — `GlassSurface` instances participating in LCP (typically the header `ambient` frame) MUST render in the critical path with no JS hydration delay. The component is a React function with no `useEffect` data fetching and no async imports — meets this trivially.
- **INP < 100ms** — the atom contributes to INP via the entrance motion when a user opens a popover/modal. The 200/300 ms enter durations are within budget because INP measures the time-to-first-paint of the response, not the full animation length.
- **Lighthouse ≥ 85 perf** — verified by running Lighthouse on a representative page (Provenance drawer over Graph) in CI; budget enforced at the page level, not per-component.

A regression test in `addon-vitest` (browser mode) measures the time from `mount` to first paint of a `level="modal"` story; if it exceeds 50 ms on the CI runner, the test fails. (Note: CI variance is real — the threshold is generous.)

---

## 9. Token usage — utility mapping per level

> Mapping from `tokens.md §9.1` ingredients to Tailwind utilities, restated here for implementation convenience. The exact utility for each cell is **the one and only** Tailwind class to use; never inline values, never `style={}` for these.

### 9.1 Level → composed utility list

| Level | Background | Backdrop blur | Border (color + width pair) | Shadow stack | Radius (default) |
|---|---|---|---|---|---|
| `ambient` | `bg-surface-glass-ambient` | `backdrop-blur-glass-sm` | `border border-border-glass` | `shadow-sm` | `rounded-none` |
| `panel` | `bg-surface-glass-panel` | `backdrop-blur-glass-md` | `border border-border-glass` | `shadow-md shadow-glass` | `rounded-lg` |
| `modal` | `bg-surface-glass-modal` | `backdrop-blur-glass-lg` | `border border-border-glass` | `shadow-lg shadow-glass` | `rounded-xl` |

### 9.2 Accent → border-color utility (always replaces color half only)

| Accent | Color class added | Extra | Width class (unchanged) |
|---|---|---|---|
| `none` | (none — keeps `border-border-glass` from BASE) | — | `border` |
| `accepted` | `border-border-accepted` | — | `border` |
| `uncertain` | `border-border-uncertain` | `data-glass-pulse="uncertain"` (drives CSS keyframe) | `border` |
| `disputed` | `border-border-disputed` | — | `border` |
| `superseded` | `border-border-superseded` | — | `border` |
| `focus` | `border-border-focus` | `ring-2 ring-border-focus` | `border` |
| `error` | `border-border-error` | — | `border` |

### 9.3 What `tailwind-merge` does and does not protect

| Class category | tailwind-merge group | Consumer override possible? |
|---|---|---|
| `bg-surface-glass-*` | `bg` | Yes — but flagged by lint rule `no-glass-surface-opaque-override` (spec §11.2) |
| `backdrop-blur-glass-*` | `backdrop-blur` | Yes — but discouraged (defeats the glass effect) |
| `border` (width) | `border-width` | Yes — overriding to `border-2` keeps glass but is visually inconsistent |
| `border-border-*` (color) | `border-color` | Yes — accent variant uses this to compose |
| `ring-2 ring-border-focus` | `ring`/`ring-color` | Yes — additive when not present, replaces when present |
| `shadow-*` | `shadow` | Yes — but discouraged on `panel`/`modal` (loses the inner highlight) |
| `rounded-*` | `border-radius` | Yes — radius prop and consumer className compete; last writer wins |
| `data-glass-pulse` attribute | (HTML attr — not Tailwind) | No — set deterministically by component when `accent="uncertain"` |

---

## 10. Storybook setup

### 10.1 Story file structure

`frontend/src/components/ds/GlassSurface/GlassSurface.stories.tsx` declares one `meta` and 14 named stories (per spec §9). All stories use the `withAmbientBackdrop` decorator (declared in `.storybook/decorators/`) so the glass effect is visible.

### 10.2 Meta — common parameters

```ts
// GlassSurface.stories.tsx (excerpt)
import type { Meta, StoryObj } from '@storybook/react'
import { GlassSurface } from './GlassSurface'
import { withAmbientBackdrop } from '../../../../.storybook/decorators/withAmbientBackdrop'

const meta: Meta<typeof GlassSurface> = {
  title: 'Design System/Atoms/GlassSurface',
  component: GlassSurface,
  decorators: [withAmbientBackdrop],
  parameters: {
    layout: 'centered',
    a11y: { test: 'error' },   // addon-a11y: violations fail the run
  },
  argTypes: {
    level:  { control: 'inline-radio', options: ['ambient', 'panel', 'modal'] },
    accent: { control: 'select',       options: ['none', 'accepted', 'uncertain', 'disputed', 'superseded', 'focus', 'error'] },
    animate:{ control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof GlassSurface>
```

### 10.3 Story matrix (14 stories — derived from spec §9)

| # | Story name | Args | Theme parameter | Test focus (addon-vitest) |
|---|---|---|---|---|
| 1 | `Ambient/Dark` | `{ level: 'ambient' }` | `dark` (default) | Class composition + no motion variant attached |
| 2 | `Ambient/Light` | `{ level: 'ambient' }` | `light` | Contrast smoke (addon-a11y) |
| 3 | `Panel/Dark` | `{ level: 'panel' }` | `dark` | Default panel composition + `rounded-lg` |
| 4 | `Panel/Light` | `{ level: 'panel' }` | `light` | Light-theme contrast |
| 5 | `Panel/AccentUncertain` | `{ level: 'panel', accent: 'uncertain' }` | `dark` | `data-glass-pulse="uncertain"` set + amber border |
| 6 | `Panel/AccentFocus` | `{ level: 'panel', accent: 'focus' }` | `dark` | Border-color replaced; `border` width preserved; `ring-2` present |
| 7 | `Panel/AccentDisputed` | `{ level: 'panel', accent: 'disputed' }` | `dark` | Orange border distinct from amber |
| 8 | `Modal/Dark` | `{ level: 'modal' }` | `dark` | Modal composition + `rounded-xl` + deep shadow |
| 9 | `Modal/Light` | `{ level: 'modal' }` | `light` | Light-theme contrast |
| 10 | `Modal/AccentError` | `{ level: 'modal', accent: 'error' }` | `dark` | Red border for destructive confirm |
| 11 | `Motion/PanelEnter` | `{ level: 'panel' }` + play function toggling mount | `dark` | Enter variant runs once (motion event spy) |
| 12 | `Motion/ModalEnter` | `{ level: 'modal' }` + play function toggling mount | `dark` | Enter variant runs once |
| 13 | `Motion/ReducedMotion` | `{ level: 'modal' }` | `dark` + `prefers-reduced-motion: reduce` parameter | No motion runs; static render |
| 14 | `A11y/ContrastSmoke` | All three levels rendered side-by-side, `text-content` placeholder | `dark` and `light` (two stories merged via parameter) | addon-a11y reports zero contrast violations |

### 10.4 `withAmbientBackdrop` decorator — implementation contract

The decorator renders a representative landscape slice under the treated filter chain from `tokens.md §10.1`. Without it, glass over an empty background is meaningless. The decorator:

1. Renders an `<AmbientBackdrop>` component (the same one used in production layout — see `frontend/src/components/layout/AmbientBackdrop.tsx`, to be created as part of the layout work).
2. Sets `data-theme` based on a Storybook global (`globalTypes.theme`) so each story renders against `dark` or `light` deterministically.
3. Provides 600×400 px viewport space for the surface to sit in.

### 10.5 Theme switching in Storybook

Add a global toolbar item via `.storybook/preview.tsx`:

```ts
// .storybook/preview.tsx (excerpt — augment, do not replace)
export const globalTypes = {
  theme: {
    name: 'Theme',
    defaultValue: 'dark',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'dark',  title: 'Dark'  },
        { value: 'light', title: 'Light' },
      ],
    },
  },
}
```

The decorator reads `context.globals.theme` and applies `data-theme="light"` to the wrapper when needed. Stories that pin a specific theme do so via `parameters.theme`.

---

## 11. Accessibility implementation

### 11.1 Focus ring composition (over glass)

When `accent="focus"`, the surface renders **both**:

1. A 1 px `border-border-focus` (replaces the default `border-border-glass` color half — width unchanged).
2. An inner `ring-2 ring-border-focus` — a 2 px solid ring inside the border perimeter.

The ring uses `--color-border-focus` which equals `--color-action` (same hue family). It clears WCAG 2.2 SC 1.4.11 (≥ 3:1 contrast against the surface) in both themes because the focus color is calibrated to the action color, which itself passes AA contrast over both `surface-glass-*` panel and modal backgrounds.

### 11.2 Contrast budget — implementation responsibility

The atom **does not** check contrast at runtime. Contrast is verified at the **token level** (`tokens.md §9.3` declares the calibration) and at the **story level** (story 14, `A11y/ContrastSmoke`, uses `addon-a11y` to fail CI if any contrast violation appears on `text-content` over the glass).

If a consumer places non-token text colors (e.g., a custom hex) on the surface, contrast becomes the consumer's responsibility — but `tokens.md §14` already forbids non-token color usage app-wide.

### 11.3 ARIA implementation

| Prop | Default | Behavior |
|---|---|---|
| `role` | `'group'` | Passed straight to `<motion.div role={...}>` |
| `aria-labelledby` | `undefined` | Spread via `...rest` (consumer-controlled) |
| `aria-label` | `undefined` | Spread via `...rest` (consumer-controlled) |

The atom **never** sets `role="alert"`, `role="status"`, `aria-live`, `aria-modal`, `aria-busy`, or `aria-expanded`. Those are consumer concerns (Radix `Dialog` sets `aria-modal` automatically when composed on top).

The atom is **not focusable** (`tabIndex` is not added). The surface does not appear in tab order — only its interactive descendants do.

### 11.4 Reduced motion gating — three places

| Surface | Gate mechanism |
|---|---|
| Framer Motion enter/exit (`glassPanelMotion`, `glassModalMotion`) | `useReducedMotion()` short-circuits `variants` to `undefined` in the component (§6 code) |
| CSS uncertain border pulse | The `@keyframes` rule is inside `@media (prefers-reduced-motion: no-preference)` in `theme.css` (§7.2) |
| Consumer-added animations via `className` | Out of scope — consumer's responsibility |

All three gates resolve to **no motion** when the user requests reduce — including the uncertain pulse.

---

## 12. Testing strategy

> Per `CLAUDE.md`: tests verify **intent**, not behavior. The tests below encode invariants that, if broken, indicate a real regression (Tailwind v4 namespace mistake, ref-as-prop misuse, motion gate bypass).

### 12.1 Unit tests (Vitest — `GlassSurface.test.tsx`)

| # | Test | What it asserts | Failure indicates |
|---|---|---|---|
| 1 | `level="panel"` default render emits all 4 glass ingredients | className contains `bg-surface-glass-panel`, `backdrop-blur-glass-md`, `border`, `border-border-glass`, `shadow-md`, `shadow-glass`, `rounded-lg` | A glass ingredient was dropped — atom no longer renders as glass |
| 2 | `level="ambient"` does NOT emit `shadow-glass` (only `shadow-sm`) | className does not contain `shadow-glass` | The ambient frame would carry the panel/modal top-edge highlight — wrong visual semantics |
| 3 | Every accent preserves the width class `border` | For each of 7 accents: className contains both `border` (width) AND a `border-border-*` (color) class | Tailwind v4 dual-namespace mistake — border would silently vanish |
| 4 | `accent="focus"` adds `ring-2 ring-border-focus` | className contains `ring-2 ring-border-focus` | Focus ring missing — SC 2.4.11 violation |
| 5 | `accent="uncertain"` sets `data-glass-pulse="uncertain"` attribute | Element has the data attribute (drives CSS pulse) | Pulse keyframe would not trigger |
| 6 | `radius="rounded-md"` prop overrides level default `rounded-lg` on `panel` | className contains `rounded-md` but not `rounded-lg` after `tailwind-merge` | Radius prop is ignored |
| 7 | `className="bg-surface"` consumer override replaces the glass bg via `tailwind-merge` | className contains `bg-surface` and not `bg-surface-glass-panel` | `cn()` is bypassed or the merge is misconfigured |
| 8 | `ref` is a normal prop (not via `forwardRef`) | `ref.current` is the underlying `<div>` after mount | React 19 contract broken |
| 9 | `animate=false` produces no motion variant on `<motion.div>` | The rendered element has no `initial`/`animate`/`exit` Framer-managed transition | Motion gate bypassed |
| 10 | `useReducedMotion()` returns `true` → no motion variant attached | Mock `useReducedMotion` to `true`; assert no transition props | Reduced-motion bypass — SC 2.3.3 violation |
| 11 | `level="ambient"` + `animate=true` → no motion variant | Per spec §7: ambient frames never animate | Ambient header/footer would animate |
| 12 | `role` defaults to `'group'`; spread to DOM | The element has `role="group"` | ARIA contract broken |
| 13 | `aria-labelledby` spread through | Element has the attribute when prop is set | ARIA contract broken |
| 14 | Other `<div>` props are spread (`id`, `data-*`, `onClick`) | Each is present on the rendered element | Spread mechanism broken |

### 12.2 Stories-as-tests (`addon-vitest` browser mode)

All 14 stories run as browser tests via `@storybook/addon-vitest`. They verify:

- Visual composition (the same assertions as unit tests, but in a real browser, against the real Tailwind output).
- `addon-a11y` runs axe-core on each story; **any contrast or focus violation fails the test**.
- Motion stories use a play function that mounts the surface and asserts the animation runs (`onAnimationComplete` callback fires within the expected duration).

### 12.3 Visual regression tests

Visual regression is **optional for v1.0.0** but recommended for the following stories (highest pixel-stability importance):

| Story | Why |
|---|---|
| `Panel/Dark`, `Panel/Light`, `Modal/Dark`, `Modal/Light` | Theme calibration — the glass tint × backdrop treatment is what makes or breaks the visual identity |
| `Panel/AccentUncertain` | The pulse animation has two visual frames (peak / trough) — both should be snapshotted |
| `Panel/AccentFocus` | Focus ring composition is load-bearing for SC 2.4.11 |

Tooling: Storybook test runner + Playwright snapshots, or Chromatic if/when adopted. **Not shipped in v1** — added as a follow-up.

### 12.4 E2E tests (Playwright)

Not required at the atom level. E2E coverage belongs to feature flows that consume `GlassSurface` (e.g., a Provenance drawer flow). The atom is exercised transitively.

---

## 13. React 19 ref-as-prop — implementation pattern

### 13.1 The contract

| Aspect | Implementation |
|---|---|
| `ref` declaration | Inside the destructured `props` parameter list, typed as `React.Ref<HTMLDivElement>` |
| `ref` forwarding | Passed directly to `<motion.div ref={ref}>` — Framer Motion v11+ forwards refs natively |
| `forwardRef` usage | **Forbidden** — `CLAUDE.md` "Anti-patterns — Frontend" and spec §12 |
| Imperative API | None — the DOM `<div>` is the only handle exposed |

### 13.2 Why no `forwardRef`

React 19 made `ref` a normal prop on function components. `forwardRef` still works but is deprecated for new code. The atom uses the new pattern to align with the rest of the design system (every atom in `components/ds/` follows this). Adding `forwardRef` would be flagged by code review (`CLAUDE.md` Conformance > taste).

### 13.3 Backward-compat note

Consumers using `React.useRef<HTMLDivElement>(null)` and passing `ref={ref}` work identically to `forwardRef` from the caller's perspective. No migration burden on consumers.

---

## 14. Custom ESLint rule — `no-glass-surface-opaque-override`

Per spec §11.2, a custom ESLint rule flags any `<GlassSurface className="...">` whose className contains a non-glass background token. Implementation:

```js
// frontend/eslint-rules/no-glass-surface-opaque-override.js
// Rule: flag any JSX element <GlassSurface> with a className literal
// containing a Tailwind bg-* utility that is NOT bg-surface-glass-*.
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid opaque bg-* overrides on GlassSurface' },
    schema: [],
    messages: {
      opaqueOverride:
        'GlassSurface must remain translucent. Use a plain <div className="bg-surface"> instead, ' +
        'or remove the bg-* utility. Found: "{{ class }}".',
    },
  },
  create(context) {
    const FORBIDDEN = /\b(bg-(primary|surface|elevated|action|data|warning|danger)(?:-\w+)?)\b/
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'GlassSurface') return
        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute' || attr.name.name !== 'className') continue
          if (!attr.value || attr.value.type !== 'Literal') continue
          const match = String(attr.value.value).match(FORBIDDEN)
          if (match) {
            context.report({
              node: attr,
              messageId: 'opaqueOverride',
              data: { class: match[1] },
            })
          }
        }
      },
    }
  },
}
```

Registered in the project's flat ESLint config under a local plugin. Limitation: only catches literal `className` strings — dynamic `className={cn('bg-primary', ...)}` constructions are not caught (acceptable trade-off; the lint rule is a guardrail, not a hermetic seal).

---

## 15. Technical constraints (carry to implementation)

1. **Toolchain pin** — do not bump `vitest` (pinned v4) or `vite` (override) while implementing this atom. The `addon-vitest` browser-mode harness depends on the pin.
2. **Single source of truth for motion durations** — Framer Motion durations live as numeric constants in `lib/motion.ts` (mirrored from `tokens.md §11.1`). Any change to a duration token requires updating both files; an automated check is out of scope for v1.
3. **CSS-first config** — never create `tailwind.config.ts`. All token references go through `@theme` in `frontend/src/styles/theme.css`.
4. **The uncertain pulse is a CSS animation, not Framer Motion** — see §7.2 decision. It is gated by `@media (prefers-reduced-motion: no-preference)` in `theme.css`, NOT by `useReducedMotion()`. Both gates exist; both must remain in sync.
5. **No `forwardRef`** — strict project rule; PRs adding it are rejected.
6. **No arbitrary Tailwind values** — `w-[347px]`, `p-[13px]`, custom `[length:...]` modifiers are forbidden (`CLAUDE.md` Styling).
7. **Single `<motion.div>` root** — do not introduce a wrapper for the pulse. The CSS animation runs on the same element as the entrance/exit (different properties: `border-color` vs `opacity`/`transform`).
8. **No `style={{}}` for visual properties** — the spec §11 declares `background`, `backdropFilter`, `border`, `boxShadow` forbidden via `style`. Enforced at the type level (the `Omit<...>` could be added in `GlassSurface.types.ts` to remove these keys from `style`; for v1, the rule is documented and lint-checked).
9. **Decorator dependency** — `withAmbientBackdrop` depends on an `AmbientBackdrop` component that will be built in the layout work. If the layout work is not done first, the decorator renders a plain treated `<div>` with the backdrop filter chain inline (acceptable interim).
10. **`AnimatePresence` is the consumer's job** — the atom emits `exit` variants but won't see them fire unless the consumer wraps it in `<AnimatePresence>`. Documented in JSDoc on the component.

---

## 16. Open items / future work

- **Visual regression automation** (Chromatic or Playwright snapshots) — out of scope v1.
- **`@supports not (backdrop-filter)` fallback block** — out of scope v1; add only if INP regression is observed.
- **Automated token-parity check** between `tokens.md §11.1` durations and `lib/motion.ts` mirrored constants — out of scope v1.
- **`style={}` key restriction at type level** — `Omit<React.ComponentPropsWithoutRef<'div'>, 'style'> & { style?: Omit<React.CSSProperties, 'background' | 'backdropFilter' | 'border' | 'boxShadow'> }` — considered for v1.1.0 if violations appear in code review.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-18 | Spec Back Agent | initial | Back-spec for GlassSurface foundation atom: file layout (`GlassSurface.tsx` + `.types.ts` + `.variants.ts` + stories + tests + index), CVA factory with Tailwind v4 dual-namespace pattern preserved in BASE (`border border-border-glass`), variant maps for 3 levels × 7 accents, motion variants `glassPanelMotion` / `glassModalMotion` added to `lib/motion.ts` with seconds-mirror of token durations, uncertain pulse implemented as CSS `@keyframes` gated by `prefers-reduced-motion` (NOT Framer Motion array) for theme correctness, React 19 ref-as-prop pattern, 14-story Storybook matrix with `withAmbientBackdrop` decorator + theme globalType, custom ESLint rule `no-glass-surface-opaque-override`, performance posture (no permanent `will-change`, no animation of `backdrop-filter`, no automatic low-end fallback), accessibility implementation (focus ring composition, contrast via tokens + addon-a11y, three reduced-motion gates), test plan (14 unit tests + 14 stories-as-tests, visual regression deferred). N/A sections justified: data model, BR, EV, state machine, integrations, migrations, error catalog, auth — pure presentational atom owns none of these. | -- |
