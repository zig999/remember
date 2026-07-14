# GlassSurface — Component Spec

> ## ⚠ v2.0 — GlassSurface agora renderiza FLAT (adoção do UI-Kit / TUI)
> A identidade terminal do kit **removeu o material de vidro fosco**: os tokens `surface-glass-*` foram
> remapeados para superfícies **opacas** do kit, `--blur-glass-*` = **0**, sombras = **none**, cantos **retos**.
> A **API** (`level` ambient/panel/modal, `fill`, `radius`, `accent`, `role`) permanece, mas o resultado
> visual é um **painel sólido de borda** — sem translucidez, sem `backdrop-filter`, sem inner-highlight.
> Toda referência abaixo a "frosted/translúcido/blur/oklch" é **histórica**. Autoridade: [`../design-system/tokens.md`](../design-system/tokens.md) §6.

> Path: `frontend/src/components/ds/GlassSurface/`
> COMP-02 | Used in features: (foundation atom — base material of every floating layer in the shell: header, footer, Graph filter panel, Graph selection-context panel, Provenance drawer, popovers, command palette, modals — `front.md §2.2`, `tokens.md §9`)
> Status: approved | Layer: permanent

---

## 1. Purpose and Responsibilities

`GlassSurface` is the **frosted-glass container atom** of the Remember design system. It composes the four ingredients of a glass surface from `design-system/tokens.md §9` — translucent tinted background, top-edge inner highlight (`--shadow-glass`), thin glass border, and `backdrop-filter: blur(...)` — into one reliable primitive so no consumer has to remember the Tailwind v4 two-namespace border gotcha (`tokens.md §7.2`).

It is the **base material** of: the header and footer (level `ambient`), every panel that floats on the Graph canvas (level `panel`), the Provenance drawer (level `panel`), every popover/picker (level `panel`), and every modal (level `modal`). Without it, glass surfaces are reinvented inconsistently and the project's "sobreposição sem perda de contexto" principle (`layout.md §5`) fails the first contrast check.

GlassSurface enters with a Framer Motion variant tied to its level (`panel` and `modal` enter with `motion.transition.glass-panel` / `motion.transition.glass-modal` semantics — added to `lib/motion.ts` alongside the `tokens.md §11.2` vocabulary) and exits with `--ease-in`. It respects `prefers-reduced-motion` (no motion).

**Out of scope for this component:**
- **Positioning** — `GlassSurface` is a container only. The consumer positions it (`absolute`, `fixed`, anchored, slotted into a layer wrapper).
- **Layer z-index assignment** — the consumer applies the `z-panel` / `z-drawer` / `z-popover` / `z-modal` class. The atom doesn't pick its own layer.
- **Focus trap** — focus trap is a modal/drawer concern (the consumer uses `<DialogPrimitive.Content>` from Radix on top of `GlassSurface`).
- **Backdrop/scrim** — modal scrims are a separate concern; the consumer renders the scrim under the `GlassSurface`.
- **Content semantics** — the surface does not own headings, labels, or ARIA roles for its content; it only owns its container role (`role="group"` by default, configurable).
- **Theming** — `GlassSurface` consumes tokens; the theme is decided by the `[data-theme="…"]` attribute on a root ancestor (`tokens.md §2`).

---

## 2. When to Use / When Not to Use

| Use when | Do not use when |
|---|---|
| Building any **floating** layer (z1–z4) that should let the ambient backdrop show through | The surface should be **opaque** (e.g., the body of a `/sign-in` card on a non-glass page) → use `<div className="bg-surface ...">` |
| Composing the header or footer frame (level `ambient`) | The surface should be on the workspace base (`z-base`) and is the page background itself → use `bg-primary` directly |
| Wrapping a Radix `Dialog.Content` (level `modal`) or `Popover.Content` (level `panel`) | The element is the body of a graph node (tiny tile) → use the inline node renderer (graph component, later wave) — not a full glass surface per node |
| Building the Provenance drawer (level `panel`) | The element is a sonner toast — toasts have their own glass treatment via `sonner` configuration (later wave) |

---

## 3. Props Contract

```ts
import type { GlassLevel, GlassAccent, GlassSurfaceProps } from '@/components/ds/GlassSurface/GlassSurface.types'
```

```ts
// canonical types — declared once and re-exported via index.ts
export type GlassLevel = 'ambient' | 'panel' | 'modal'

/** State-borne accent on the surface — non-default usage. Examples: a panel showing an
 *  `uncertain` aggregate state, an error-bordered modal asking destructive confirmation. */
export type GlassAccent =
  | 'none'
  | 'accepted'
  | 'uncertain'
  | 'disputed'
  | 'superseded'
  | 'focus'
  | 'error'

/** Background-fill override, independent of `level` (see §6.6). 'none' keeps the
 *  level's own bg-surface-glass-<level>; the others swap ONLY the background token. */
export type GlassFill = 'none' | 'ambient' | 'ambient-accent'

export type GlassSurfaceProps = React.ComponentPropsWithoutRef<'div'> & {
  /** The composition level — drives bg-opacity, backdrop-blur, and shadow. */
  level: GlassLevel
  /** Optional state-borne border accent. Default 'none' = use --color-border-glass. */
  accent?: GlassAccent
  /** Background-fill override, independent of `level` (see §6.6). Default 'none'. */
  fill?: GlassFill
  /** Enter / exit animation. Default true. prefers-reduced-motion always wins over true. */
  animate?: boolean
  /** Override the radius from the level default. Use one of the token classes. */
  radius?: 'rounded-sm' | 'rounded-md' | 'rounded-lg' | 'rounded-xl'
  /** ARIA role for the container. Default 'group'. Set to 'dialog' for modals, 'region' for
   *  named landmarks. The atom never sets role="alert"/"status" — that is a live-region concern. */
  role?: 'group' | 'region' | 'dialog' | 'complementary' | 'navigation' | 'contentinfo' | 'banner'
  /** When provided, exposed as aria-labelledby — used when the consumer renders its own title. */
  'aria-labelledby'?: string
  /** When provided, exposed as aria-label — used when no visible title exists. */
  'aria-label'?: string
  className?: string
  /** React 19 ref — passed as a normal prop. No forwardRef. */
  ref?: React.Ref<HTMLDivElement>
}
```

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `level` | `'ambient' \| 'panel' \| 'modal'` | yes | — | Composition level — see `tokens.md §9.1` and §6 below |
| `accent` | `GlassAccent` | no | `'none'` | Replaces the default `border-border-glass` with a state-borne color (still 1 px thick) |
| `fill` | `GlassFill` | no | `'none'` | Overrides ONLY the background tint, independent of `level` (see §6.6). `'none'` keeps the level's own fill |
| `animate` | `boolean` | no | `true` | If `true`, enters/exits with a level-tied motion variant. `prefers-reduced-motion: reduce` disables motion regardless. |
| `radius` | `'rounded-sm' \| 'rounded-md' \| 'rounded-lg' \| 'rounded-xl'` | no | per-level default (see §6) | Override the corner radius |
| `role` | (see types) | no | `'group'` | ARIA role for the container |
| `aria-labelledby` | `string` | no | `undefined` | Standard ARIA — id of the visible title |
| `aria-label` | `string` | no | `undefined` | Standard ARIA — used when no visible title |
| `className` | `string` | no | `undefined` | Extra Tailwind classes merged via `cn()` — see §11 for override rules |
| `ref` | `Ref<HTMLDivElement>` | no | — | React 19 ref-as-prop (no `forwardRef`) |
| `children` | `React.ReactNode` | no | — | Anything; the atom is a pure container |
| (other `<div>` props) | — | no | — | Spread to the underlying `<div>` (e.g., `id`, `data-*`, `onClick`) |

---

## 4. Component States

GlassSurface has minimal internal state. It tracks "mounted vs unmounting" for the entrance/exit motion variant.

| State | Trigger | Visual change | Interactivity |
|---|---|---|---|
| `idle` | Initial mount, default render | Renders the composite Tailwind classes for the given `level` + `accent`. See §6 for the exact class composition. | as configured by `role` |
| `enter` | Just mounted with `animate=true` and motion allowed | Plays the level-appropriate enter variant (see §7) | as configured |
| `exit` | About to unmount with `animate=true` and motion allowed | Plays the level-appropriate exit variant (see §7) | as configured |
| `idle :: accent="uncertain"` | `accent="uncertain"` and motion allowed | The border pulses softly via the CSS `@keyframes uncertain-border-pulse` (driven by the `data-glass-pulse="uncertain"` attribute), animating the border-color opacity — see `GlassSurface.back.md §7.2`. (Distinct from StateBadge, whose pulse is a Framer Motion opacity variant; GlassSurface uses CSS so the per-theme border color resolves through the `[data-theme]` cascade.) | as configured |
| `idle :: accent="focus"` | `accent="focus"` | Renders with `border border-border-focus` + an inner `ring-2 ring-border-focus` | as configured |

### 4.1 Transition parameters

| Parameter | Formula / Value | Unit | Applies to state |
|---|---|---|---|
| Panel enter `y` offset | `8 → 0` | px | `enter` (level `panel`) |
| Panel enter duration | `--duration-fast` (200 ms) | ms | `enter` (level `panel`) |
| Panel exit duration | `--duration-instant` (100 ms) | ms | `exit` (level `panel`) |
| Modal enter `scale` | `0.96 → 1` | — | `enter` (level `modal`) |
| Modal enter duration | `--duration-moderate` (300 ms) | ms | `enter` (level `modal`) |
| Modal exit duration | `--duration-instant` (100 ms) | ms | `exit` (level `modal`) |
| Uncertain accent — border opacity pulse | `1 → 0.55 → 1` | — | `idle :: accent="uncertain"` |
| Uncertain accent — duration | `--duration-pulse` (2400 ms) | ms | `idle :: accent="uncertain"` |

---

## 5. Events Emitted

GlassSurface has no callback props (pure container). Section omitted per `u-spec-writing` guidance.

---

## 6. Glass Levels — visual + tokens + accessibility + BDD

Always produce **all four** ingredient classes (background, blur, border [color + width], shadow). The atom internally composes them; consumers never assemble glass by hand.

### 6.1 Level `ambient`

**Visual.** The thinnest, calmest glass — used for the structural frame (header and footer). Translucent enough to let the treated ambient backdrop show through; just an 8 px blur and a hairline subtle drop shadow. **No inner top-edge highlight** (`shadow-glass` is reserved for floating layers; ambient frame uses plain `shadow-sm`). Default radius: `rounded-none` (the frame spans the viewport edges).

**Token references** (`tokens.md`):

| Ingredient | Token | Tailwind utility | Value (dark default) |
|---|---|---|---|
| Background | `--surface-glass-ambient` | `bg-surface-glass-ambient` | `oklch(22% 0.012 250 / 0.55)` |
| Backdrop blur | `--blur-glass-sm` | `backdrop-blur-glass-sm` | `8px` |
| Border color | `--color-border-glass` | `border-border-glass` | `oklch(95% 0.005 250 / 0.18)` |
| Border width | `--border-DEFAULT` | `border` | `1px` |
| Shadow | `--shadow-sm` | `shadow-sm` | (very subtle drop) |
| Radius | n/a | `rounded-none` | `0` |

**Composed Tailwind:** `bg-surface-glass-ambient backdrop-blur-glass-sm border border-border-glass shadow-sm rounded-none`

**Accessibility (WCAG 2.2 AA).** The composition of `surface-glass-ambient` × `backdrop-darken` (0.55 dark / 0.18 light) MUST keep any `text-content` placed on the surface ≥ 4.5:1 contrast (`tokens.md §9.3`). A contrast smoke test in the Storybook story (`text-content` on `bg-surface-glass-ambient`, both themes) verifies this on CI.

**BDD — ambient default render**

```
Given the component receives level="ambient" and a child <span>Header</span>
When it mounts
Then the root <div> has the canonical class composition
  "bg-surface-glass-ambient backdrop-blur-glass-sm border border-border-glass shadow-sm rounded-none"
And it has role="group"
And no enter motion variant is attached (ambient frames are always present)
```

### 6.2 Level `panel`

**Visual.** The workhorse of the shell — Graph filter panels, selection-context panel, Provenance drawer, popovers, command suggestions. Slightly more opaque than ambient (so legibility is excellent over a busy graph canvas), a 16 px blur, the dedicated **glass shadow** (drop + inner top-edge highlight) and a soft 14 px radius. Default radius: `rounded-lg`.

**Token references** (`tokens.md`):

| Ingredient | Token | Tailwind utility | Value (dark default) |
|---|---|---|---|
| Background | `--surface-glass-panel` | `bg-surface-glass-panel` | `oklch(22% 0.012 250 / 0.65)` |
| Backdrop blur | `--blur-glass-md` | `backdrop-blur-glass-md` | `16px` |
| Border color | `--color-border-glass` | `border-border-glass` | (default glass edge) |
| Border width | `--border-DEFAULT` | `border` | `1px` |
| Shadow (drop) | `--shadow-md` | `shadow-md` | (12 px soft drop) |
| Shadow (top-edge highlight) | `--shadow-glass` | `shadow-glass` | `inset 0 1px 0 0 rgba(255,255,255,0.06)` + drop |
| Radius | `--radius-lg` | `rounded-lg` | `14px` |

**Composed Tailwind:** `bg-surface-glass-panel backdrop-blur-glass-md border border-border-glass shadow-md shadow-glass rounded-lg`

> **Tailwind shadow-stack note.** `shadow-md` and `shadow-glass` are layered — the resulting `box-shadow` is the union of both. The atom always emits both classes (Tailwind concatenates the values in the cascade order).

**Accessibility (WCAG 2.2 AA).** `text-content` and `text-body` placed on `bg-surface-glass-panel` over the treated ambient backdrop MUST clear 4.5:1 (regular text) and 3:1 (large text 18 px / 14 px bold). The 0.65 alpha and the panel-blur are calibrated for this; the smoke test asserts contrast in both themes.

**BDD — panel default render**

```
Given the component receives level="panel" and a child <p className="text-body">Olá</p>
When it mounts
Then the root <div> has the canonical class composition
  "bg-surface-glass-panel backdrop-blur-glass-md border border-border-glass shadow-md shadow-glass rounded-lg"
And it has role="group"
And it renders <p>Olá</p> as a child
```

**BDD — panel enter motion**

```
Given the test environment reports prefers-reduced-motion: no-preference
And the component receives level="panel" and animate=true
When it mounts
Then the inner motion element plays the variant "motion.transition.glass-panel"
And starts at opacity 0 with y=8px
And, after --duration-fast (200 ms) with --ease-out, finishes at opacity 1 with y=0
```

### 6.3 Level `modal`

**Visual.** The heaviest glass — for modals and the command palette. The most opaque of the three (so the modal reads as a "stop and read" plane), a 24 px blur, the largest shadow stack (`shadow-lg` + `shadow-glass`), and a 20 px radius. Default radius: `rounded-xl`.

**Token references** (`tokens.md`):

| Ingredient | Token | Tailwind utility | Value (dark default) |
|---|---|---|---|
| Background | `--surface-glass-modal` | `bg-surface-glass-modal` | `oklch(22% 0.012 250 / 0.78)` |
| Backdrop blur | `--blur-glass-lg` | `backdrop-blur-glass-lg` | `24px` |
| Border color | `--color-border-glass` | `border-border-glass` | (default glass edge) |
| Border width | `--border-DEFAULT` | `border` | `1px` |
| Shadow (drop) | `--shadow-lg` | `shadow-lg` | (32 px deep drop) |
| Shadow (top-edge highlight) | `--shadow-glass` | `shadow-glass` | `inset 0 1px 0 0 rgba(255,255,255,0.06)` + drop |
| Radius | `--radius-xl` | `rounded-xl` | `20px` |

**Composed Tailwind:** `bg-surface-glass-modal backdrop-blur-glass-lg border border-border-glass shadow-lg shadow-glass rounded-xl`

**Accessibility (WCAG 2.2 AA).** With 0.78 alpha and 24 px blur the modal is the easiest to read of the three, but it MUST still pass the contrast smoke test for `text-content` and `text-body`. The consumer typically wraps it in a Radix `Dialog.Content` that sets `role="dialog"` + `aria-modal="true"` and supplies `aria-labelledby` pointing to the modal title — GlassSurface forwards `aria-labelledby` / `aria-label` unchanged.

**BDD — modal default render**

```
Given the component receives level="modal" and aria-labelledby="dialog-title"
When it mounts
Then the root <div> has the canonical class composition
  "bg-surface-glass-modal backdrop-blur-glass-lg border border-border-glass shadow-lg shadow-glass rounded-xl"
And it exposes aria-labelledby="dialog-title"
```

**BDD — modal enter motion**

```
Given the test environment reports prefers-reduced-motion: no-preference
And the component receives level="modal" and animate=true
When it mounts
Then the inner motion element plays the variant "motion.transition.glass-modal"
And starts at opacity 0 with scale 0.96
And, after --duration-moderate (300 ms) with --ease-out-quint, finishes at opacity 1 with scale 1
```

### 6.4 Accent variants (override border color, not width)

The seven accents apply over **any** level. They replace the default `border-border-glass` color — width stays `border` (1 px) because color and width are independent namespaces (see §10).

| Accent | Border-color class | Extra | When to use |
|---|---|---|---|
| `none` (default) | `border-border-glass` | — | Neutral glass edge |
| `accepted` | `border-border-accepted` | — | Surface aggregates "tudo confirmado" |
| `uncertain` | `border-border-uncertain` | CSS `@keyframes uncertain-border-pulse` via `data-glass-pulse="uncertain"` (see `.back.md §7.2`) | Surface aggregates an uncertain fact (curation card holding an uncertain link) |
| `disputed` | `border-border-disputed` | — | Curation card surface holding a `disputed` item |
| `superseded` | `border-border-superseded` | — | Historical panel (`as_of` past) |
| `focus` | `border-border-focus` | `ring-2 ring-border-focus` | Surface in keyboard focus (e.g., focused popover) |
| `error` | `border-border-error` | — | Destructive confirmation surface |

> Width is always `border` (1 px). To make the border heavier on selection, the consumer uses an outer `ring-2`/`ring-4` from the matching color, **not** a different `border-N` class — see §10 and `tokens.md §7.2`.

### 6.5 Radius override

| Prop value | When to override |
|---|---|
| (omitted) | Use level default (`ambient` → `rounded-none`, `panel` → `rounded-lg`, `modal` → `rounded-xl`) |
| `rounded-sm` | Smallest standardized scale token (`--radius-sm` = 6px) — e.g. the chat bubble (modal material, minimal corners) |
| `rounded-md` | Inline glass tiles inside a card (rare) |
| `rounded-lg` | Force panel-radius on a non-panel level (rare) |
| `rounded-xl` | Force modal-radius on a panel that visually anchors the area (e.g., the dominant filter panel of the Graph) |

### 6.6 Fill override (background-only, independent of level)

`fill` swaps **only** the background tint of the surface; `level` keeps owning blur, shadow, radius, and the enter/exit motion variant. This lets a consumer mount a level's full material (e.g. the `modal` tier — rounded corners, deep shadow, glass-modal entrance) while painting it with a lighter or tinted background.

| Prop value | Background token | When to use |
|---|---|---|
| `none` (default) | the level's own `bg-surface-glass-<level>` | normal case — fill follows level |
| `ambient` | `bg-surface-glass-ambient` | the plain ambient glass fill on any level (ChatBubble `user` side) |
| `ambient-accent` | `bg-surface-glass-ambient-accent` | ambient glass + a touch of accent (ChatBubble `assistant` side) — token defined per-theme in `theme.css` |

> **Why a sanctioned axis and not a `className` `bg-*` override.** §11 reserves `bg-*` for the surface itself. The override is emitted from the CVA **after** `level`, so the level's `bg-surface-glass-<level>` is dropped by `tailwind-merge` (it groups `bg-surface-glass-*` as `background-color` and keeps the last writer — verified). The dual-namespace hazard of §10 is **border-color only**; background is safe to override this way. The surface stays glass (the fill tokens are translucent), so the §11.2 lint rule (opaque `bg-*` only) is not in tension.

The component surfaces `data-fill="<value>"` for spec-driven tests.

---

## 7. Motion contract (enter / exit per level + reduced motion)

GlassSurface's enter/exit variants (`motion.transition.glass-panel` / `motion.transition.glass-modal`) live in `frontend/src/lib/motion.ts`, alongside the normative `tokens.md §11.2` catalog. Components import — they never invent. The `accent="uncertain"` border pulse is the one exception: it is **not** a Framer Motion variant but a CSS `@keyframes uncertain-border-pulse` in `theme.css`, so the `[data-theme]` cascade resolves the border color per theme (see `GlassSurface.back.md §7.2`).

| Level | Enter | Exit | Variant export |
|---|---|---|---|
| `ambient` | **No motion.** The frame is always present from the first paint. | **No motion.** | (none) |
| `panel` | `opacity: 0 → 1` AND `y: 8 → 0` over `--duration-fast` (200 ms) with `--ease-out` | `opacity: 1 → 0` AND `y: 0 → 8` over `--duration-instant` (100 ms) with `--ease-in` | `motion.transition.glass-panel` |
| `modal` | `opacity: 0 → 1` AND `scale: 0.96 → 1` over `--duration-moderate` (300 ms) with `--ease-out-quint` | `opacity: 1 → 0` AND `scale: 1 → 0.96` over `--duration-instant` (100 ms) with `--ease-in` | `motion.transition.glass-modal` |

### 7.1 Reduced-motion fallback (mandatory)

`GlassSurface` MUST detect `prefers-reduced-motion: reduce` via the `useReducedMotion()` hook from Framer Motion (or an equivalent `matchMedia` check) and, when reduce is requested, render statically:

- `enter` → no transition; opacity is 1 and transform is identity from the first frame.
- `exit` → no transition; the element disappears immediately on unmount.
- `accent="uncertain"` → border does **not** pulse; the color is static.

This applies regardless of the `animate` prop (reduced motion always wins). The atom never animates `width`, `height`, `padding`, or `margin` (`tokens.md §11.3`); only `opacity`, `transform.translateY`, and `transform.scale`.

### 7.2 BDD — reduced motion

```
Given the test environment reports prefers-reduced-motion: reduce
And the component receives level="modal" and animate=true
When it mounts
Then no Framer Motion variant runs
And the surface is visible immediately with full opacity and scale 1
```

```
Given the test environment reports prefers-reduced-motion: reduce
And the component receives level="panel" and accent="uncertain"
When it mounts
Then the border renders with border-border-uncertain
And no pulse animation runs
```

---

## 8. Internal state behavior (accent details)

Beyond §4, two accents have notable behaviors:

| Accent | Behavior |
|---|---|
| `uncertain` | Sets `data-glass-pulse="uncertain"`, which drives the CSS `@keyframes uncertain-border-pulse` in `theme.css` (animates `--color-border-uncertain` opacity between 1 and 0.55 over `--duration-pulse` = 2400 ms, looped). A CSS animation — **not** a Framer Motion variant — so the per-theme border color resolves correctly; gated by `@media (prefers-reduced-motion: no-preference)`. See `.back.md §7.2`. |
| `focus` | Adds an inner `ring-2 ring-border-focus`. Used when a popover is keyboard-focused (the consumer toggles `accent="focus"` based on focus state). |

---

## 9. Storybook stories (mandatory)

> All stories live in `frontend/src/components/ds/GlassSurface/GlassSurface.stories.tsx`. Each story renders the surface over a representative slice of the treated ambient backdrop (decorator: `withAmbientBackdrop`) so the glass effect is visible. Stories are also vitest-browser tests via `@storybook/addon-vitest`.

| Story | Args | Decorator (theme) | What it verifies |
|---|---|---|---|
| `Ambient/Dark` | `{ level: 'ambient' }` | `dark` (default) | Frame composition + thin shadow + no enter motion |
| `Ambient/Light` | `{ level: 'ambient' }` | `light` | Light-theme calibration — contrast smoke test |
| `Panel/Dark` | `{ level: 'panel' }` | `dark` | Default panel composition + glass shadow + `rounded-lg` |
| `Panel/Light` | `{ level: 'panel' }` | `light` | Light-theme calibration |
| `Panel/AccentUncertain` | `{ level: 'panel', accent: 'uncertain' }` | `dark` | Amber border + pulse loop (visual snapshot at peak and trough) |
| `Panel/AccentFocus` | `{ level: 'panel', accent: 'focus' }` | `dark` | Focus border + ring (composition test) |
| `Panel/AccentDisputed` | `{ level: 'panel', accent: 'disputed' }` | `dark` | Orange border — distinct from uncertain amber |
| `Modal/Dark` | `{ level: 'modal' }` | `dark` | Modal composition + `rounded-xl` + deep shadow |
| `Modal/Light` | `{ level: 'modal' }` | `light` | Light-theme calibration |
| `Modal/AccentError` | `{ level: 'modal', accent: 'error' }` | `dark` | Destructive-confirm appearance |
| `Fill/Ambient (modal material)` | `{ level: 'modal', fill: 'ambient' }` | `dark` | §6.6 — modal material, ambient fill (ChatBubble user side) |
| `Fill/AmbientAccent (assistant bubble)` | `{ level: 'modal', fill: 'ambient-accent' }` | `dark` | §6.6 — accent-tinted ambient fill (ChatBubble assistant side) |
| `Fill/AmbientAccent/Light` | `{ level: 'modal', fill: 'ambient-accent' }` | `light` | §6.6 — light-theme calibration of the tinted fill |
| `Motion/PanelEnter` | `{ level: 'panel' }` + play function toggling mount | `dark` | Enter animation plays once (`addon-vitest` browser test) |
| `Motion/ModalEnter` | `{ level: 'modal' }` + play function toggling mount | `dark` | Modal enter animation plays once |
| `Motion/ReducedMotion` | `{ level: 'modal' }` | `dark` + `prefers-reduced-motion: reduce` parameter | No motion runs; static render |
| `A11y/ContrastSmoke` | All three levels, `text-content` placeholder | `dark` and `light` | `addon-a11y` reports zero contrast violations on every level × theme |

> **Implementation rule.** Stories use the `withAmbientBackdrop` decorator (a thin wrapper rendering a representative landscape slice under the treated filter chain of `tokens.md §10.1`) so the glass effect is visible. Without the decorator, glass over an empty background is meaningless.

---

## 10. Tailwind v4 dual-namespace pattern — implementation notes

> **Load-bearing.** Tailwind v4 splits border into two namespaces:
> - `--color-border-*` → border-color utilities (`border-border-glass`, `border-border-focus`, …).
> - `--border-*` → border-width utilities (`border` (1 px), `border-2`, `border-thick`).
>
> **Mixing them silently fails** — if you write `border-border-glass` alone, the rendered border falls back to width 0 and the edge disappears with no warning. Every border in the atom MUST emit **both** halves as a pair: `border <color-token>`.

### 10.1 Canonical composition utility

The atom builds its class list via `cva()` (`class-variance-authority`) and merges consumer `className` with `cn()` (`tailwind-merge` + `clsx`). Sketch:

```ts
// GlassSurface.variants.ts
import { cva } from 'class-variance-authority'

export const glassSurface = cva(
  // ALWAYS emit both halves: width ("border") + color ("border-border-glass").
  // Missing either half makes the edge silently disappear.
  'border border-border-glass',
  {
    variants: {
      level: {
        ambient: 'bg-surface-glass-ambient backdrop-blur-glass-sm shadow-sm rounded-none',
        panel:   'bg-surface-glass-panel   backdrop-blur-glass-md shadow-md shadow-glass rounded-lg',
        modal:   'bg-surface-glass-modal   backdrop-blur-glass-lg shadow-lg shadow-glass rounded-xl',
      },
      accent: {
        none:       '',                                                // keep default border-border-glass
        accepted:   'border-border-accepted',                          // replaces color half only
        uncertain:  'border-border-uncertain',
        disputed:   'border-border-disputed',
        superseded: 'border-border-superseded',
        focus:      'border-border-focus ring-2 ring-border-focus',    // color + inner ring
        error:      'border-border-error',
      },
      // §6.6 — background-only override; emitted AFTER level so tailwind-merge
      // drops the level's bg and keeps this one (background-color group).
      fill: {
        none:             '',                                  // keep the level's own bg
        ambient:          'bg-surface-glass-ambient',
        'ambient-accent': 'bg-surface-glass-ambient-accent',
      },
    },
    defaultVariants: { level: 'panel', accent: 'none', fill: 'none' },
  },
)
```

```tsx
// GlassSurface.tsx (excerpt) — React 19 ref-as-prop, no forwardRef
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { glassSurface } from './GlassSurface.variants'
import { glassPanelMotion, glassModalMotion } from '@/lib/motion'

export function GlassSurface({
  level, accent = 'none', fill = 'none', animate = true, radius, role = 'group', className, ref, children, ...rest
}: GlassSurfaceProps) {
  const reduceMotion = useReducedMotion()
  const variant = !animate || reduceMotion ? undefined
                : level === 'panel' ? glassPanelMotion
                : level === 'modal' ? glassModalMotion
                : undefined

  return (
    <motion.div
      ref={ref}
      role={role}
      className={cn(glassSurface({ level, accent, fill }), radius, className)}
      {...(variant ? { initial: 'hidden', animate: 'visible', exit: 'exit', variants: variant } : null)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
```

### 10.2 Correct vs incorrect border pairs (regression matrix)

| Intent | Correct | Incorrect (border vanishes) |
|---|---|---|
| Default 1 px glass edge | `border border-border-glass` | `border-border-glass` alone |
| Uncertain accent | `border border-border-uncertain` | `border-border-uncertain` alone |
| Focus accent with ring | `border border-border-focus ring-2 ring-border-focus` | `border-border-focus ring-2 ring-border-focus` (no width!) |
| Heavy 2 px error (if ever needed via override) | `border-2 border-border-error` | `border-border-error` alone |

> The unit test suite includes one assertion per accent that asserts both the width class (`border`) and the color class (`border-border-*`) appear in the final `className`.

---

## 11. `cn()` className merge contract

`GlassSurface` merges consumer `className` via `cn()` (`tailwind-merge` + `clsx`) — `tailwind-merge` resolves Tailwind class conflicts so the **last writer wins**. This makes consumer overrides predictable, but means consumers can break invariants if not careful. The contract below names what is overridable and what is not.

| Override case | Behavior | Allowed? |
|---|---|---|
| Add positioning utilities (`absolute`, `fixed`, `inset-0`, `top-…`) | Appended; the atom is position-agnostic by design | **Yes — required for any non-trivial placement** |
| Add z-index (`z-panel`, `z-drawer`, `z-popover`, `z-modal`) | Appended | **Yes — required (the atom never picks a layer)** |
| Add sizing (`w-…`, `h-…`, `max-w-…`) | Appended | Yes |
| Add padding / gap (`p-md`, `gap-lg`, …) | Appended | Yes |
| Override `radius` via `className="rounded-md"` | Wins over `radius` prop (last writer) — but prefer the `radius` prop for type-safety | Yes, but prop preferred |
| Override `bg-…` (e.g., `bg-surface`) | `tailwind-merge` replaces the glass background — **the surface stops being glass** | **No — defeats the purpose** |
| Override `backdrop-blur-…` | Replaces the per-level blur — **glass effect weakens or disappears** | **No** |
| Override `border-border-…` (drop the color half by overriding to `border-none`) | Replaces border — **edge silently disappears** | **No** |
| Override `border` width (e.g., `border-2`) | Replaces width — visually inconsistent but functional | Discouraged (use accent + outer `ring-*`) |
| Override `shadow-glass` / `shadow-md` / `shadow-lg` | Replaces shadow — loses the inner top-edge highlight on `panel`/`modal` | **No** |

> **Forbidden combination via `className`:** `bg-…` token that is not a glass token (`bg-primary`, `bg-surface`, `bg-elevated`, `bg-action`, …). If a consumer needs an opaque surface, the correct choice is a plain `<div className="bg-surface ...">`, not `GlassSurface`.

> **Forbidden combination via `style`:** any inline `style={{ background, backdropFilter, border, boxShadow }}` — the atom rejects this at the type level (none of these CSS keys are accepted via `style` in `GlassSurface`'s typed surface). Use tokens.

### 11.1 BDD — className override (allowed)

```
Given the component receives level="panel" and className="absolute inset-0 z-panel p-lg"
When it mounts
Then the root <div> has all glass classes from level="panel"
And it also has classes "absolute inset-0 z-panel p-lg"
```

### 11.2 BDD — className override (defeated by override of bg)

```
Given the component receives level="panel" and className="bg-surface"
When it mounts
Then tailwind-merge replaces bg-surface-glass-panel with bg-surface
And the rendered surface is opaque (no glass)
And the lint rule "no-glass-surface-opaque-override" flags the call site
```

> A custom ESLint rule (`no-glass-surface-opaque-override`) lives in `frontend/eslint-rules/` and flags any `<GlassSurface className="…">` whose className contains `bg-(primary|surface|elevated|action|data|warning|danger)`.

---

## 12. React 19 ref-as-prop contract

| Requirement | Implementation |
|---|---|
| No `forwardRef` | `GlassSurface` is declared as a plain function component. `ref` is read directly from `props`. |
| `ref` type | `React.Ref<HTMLDivElement>` — accepts both callback and ref-object forms. |
| `ref` forwarding | The atom passes `ref` directly to the underlying `<motion.div>` (Framer Motion forwards it to the DOM `<div>`). |
| Imperative API | None. The atom exposes the DOM `<div>` only — for measurements, focus management by parent, Radix `Slot` composition, etc. |
| Backward compat | `forwardRef` is forbidden in this codebase (`CLAUDE.md` "Anti-patterns — Frontend"). Any PR adding it is rejected. |

### 12.1 BDD — ref-as-prop

```
Given the parent assigns const ref = useRef<HTMLDivElement>(null)
And renders <GlassSurface ref={ref} level="panel" />
When the surface mounts
Then ref.current is the underlying <div> element
And calling ref.current.getBoundingClientRect() returns the surface bounds
```

---

## 13. Do / Don't

| Do | Don't |
|---|---|
| Always use `GlassSurface` for every floating layer — header, footer, panels, popovers, drawers, modals | Hand-roll glass with `bg-white/10 backdrop-blur-md` — you will miss the inner highlight (`--shadow-glass`) or one of the two border-namespace halves |
| Set `level="modal"` for `Dialog.Content` and `level="panel"` for `Popover.Content` | Use `level="modal"` for a popover — it darkens too much and looks heavy |
| Compose Radix primitives **on top of** `GlassSurface` (focus trap, escape-to-close, scrim) | Re-implement focus trap inside `GlassSurface` — that responsibility belongs to Radix `Dialog` |
| Apply the layer z-index outside (`z-panel`, `z-drawer`, `z-popover`, `z-modal`) | Hardcode `z-50` on a `GlassSurface` instance — always use a `z-*` token class |
| Use `accent="uncertain"` to signal the surface aggregates an uncertain fact (e.g., a curation card holding an uncertain link) | Use `accent="uncertain"` on the header or footer — the frame never carries a per-fact state |
| Trust the default `animate=true` and let `prefers-reduced-motion` disable motion when needed | Pass `animate=false` to "always be safe" — that hides the legibility cue of a surface arriving |
| Pass `aria-labelledby` to the surface and let the inner title own the text | Hardcode `aria-label="Painel"` — the consumer knows the contextual name |
| Always pair `border` (width) with a `border-border-*` (color) class | Write `border-border-glass` alone — the border silently disappears (Tailwind v4 dual namespace) |

---

## 14. Accessibility Contract

| Requirement | Implementation |
|---|---|
| Label | `aria-labelledby` is preferred (id of the visible title rendered inside the surface). When no title exists, `aria-label` is required for modals (level `modal`) — the consumer passes it. For `panel` and `ambient`, label is optional. |
| Role | Defaults to `role="group"`. Modals override with `role="dialog"` (and Radix usually sets it automatically when `Dialog.Content` is composed on top). Named regions use `role="region"`. The atom never sets `role="alert"` / `role="status"`. |
| Keyboard | The surface is not focusable itself. It does not participate in tab order. Interactive descendants own their own focus. |
| Focus management | Out of scope for this atom. When used inside `Dialog.Content`, Radix handles focus trap + return-to-trigger. |
| Focus visibility (SC 2.4.11) | When `accent="focus"` is applied (e.g., a focused popover), the surface itself shows the focus ring via `border-border-focus + ring-2 ring-border-focus`. |
| ARIA states | None applicable on the container. The surface does not own `aria-expanded`/`aria-busy`/`aria-modal` — those belong to the consumer (Radix Dialog sets `aria-modal="true"`). |
| Contrast — text on glass (SC 1.4.3) | Each `(surface-glass-<level> + backdrop-treatment-<theme>)` combination is calibrated so that `text-content` and `text-body` placed on the surface clear ≥ 4.5:1 (regular) and ≥ 3:1 (large). Verified by `A11y/ContrastSmoke` story per level × theme. |
| Contrast — border on glass (SC 1.4.11) | `border-border-glass` (default) is non-text but is decorative. State accents (`accepted`/`uncertain`/`disputed`/`error`) qualify as informative UI components and MUST clear ≥ 3:1 against the surface — verified in the accent stories. |
| Reduced motion (SC 2.3.3) | All enter/exit/accent-pulse motion gated by `prefers-reduced-motion` (`useReducedMotion()`). With reduce, the surface renders statically; `accent="uncertain"` border does not pulse. |
| Target size (SC 2.5.8) | Not applicable — the container is not interactive. Interactive descendants enforce ≥ 24 × 24 CSS px per WCAG 2.2 (project tightens to ≥ 32 px in `front.md §10`). |
| Language | App is single-owner pt-BR; any `aria-label` / `aria-labelledby` text supplied by the consumer is pt-BR. The atom does not own copy. |

---

## 15. BDD Scenarios (consolidated index)

> Each scenario in this section appears once, in the canonical numbered list. All scenarios above (§6, §7, §11, §12) are aliased here for the QA matrix.

1. **Default render — panel** → §6.2
2. **Default render — ambient** → §6.1
3. **Default render — modal** → §6.3
4. **Panel enter motion** → §6.2
5. **Modal enter motion** → §6.3
6. **Reduced motion — modal** → §7.2
7. **Reduced motion — uncertain border does not pulse** → §7.2
8. **Accent — focus** (border + ring composition) → below
9. **Accent — uncertain pulses border** (motion allowed) → below
10. **className override — additive** → §11.1
11. **className override — defeated bg override** → §11.2
12. **ref-as-prop** → §12.1
13. **Keyboard navigation — pass-through** → below

### Accent — focus

```
Given the component receives level="panel" and accent="focus"
When it mounts
Then the root <div> additionally has classes "border-border-focus ring-2 ring-border-focus"
And the default "border-border-glass" class is replaced (not stacked) by "border-border-focus"
And the width class "border" remains present
```

### Accent — uncertain pulses border

```
Given the test environment reports prefers-reduced-motion: no-preference
And the component receives level="panel" and accent="uncertain"
When it mounts
Then the border color is --color-border-uncertain
And the element carries data-glass-pulse="uncertain", driving the CSS @keyframes "uncertain-border-pulse" scoped to the border-color
And one full cycle takes --duration-pulse (2400 ms) with --ease-in-out
```

### Keyboard navigation — pass-through

```
Given the surface contains a <button>Confirmar</button>
When the user presses Tab
Then focus moves to the inner <button> as the first interactive descendant
And the surface itself does not appear in tab order (no tabIndex)
```

---

## 16. Internal Dependencies

| Component / Module | Source | Usage |
|---|---|---|
| `motion.transition.glass-panel` | `frontend/src/lib/motion.ts` (added by this spec, alongside `tokens.md §11.2`) | Enter/exit for `level="panel"` |
| `motion.transition.glass-modal` | `frontend/src/lib/motion.ts` (added by this spec, alongside `tokens.md §11.2`) | Enter/exit for `level="modal"` |
| `@keyframes uncertain-border-pulse` | `theme.css` (defined per `GlassSurface.back.md §7.2`) | Border pulse when `accent="uncertain"` — CSS animation gated by `data-glass-pulse` + `prefers-reduced-motion`, **not** a Framer Motion variant |
| `useReducedMotion()` | `framer-motion` | Detect `prefers-reduced-motion: reduce` and bypass all motion |
| `cn()` | `frontend/src/lib/cn.ts` (`front.md §6.4`) | Merging `className` (`tailwind-merge` + `clsx`) |
| `cva()` | `class-variance-authority` (`front.md §11`) | Compose the per-level + per-accent class set (≥ 2 variants → CVA required) |
| Tokens (surface-glass, blur-glass, color-border-glass, shadow-glass, border-color-state-*, radius, motion, z-index) | `design-system/tokens.md §6, §7, §8, §9, §11, §12` | All visual values — no raw values anywhere |

> **No imports from any feature module.** GlassSurface is a foundation atom; it knows nothing about graph, search, ingest, curation, or history.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-18 | Spec Writer | initial | Foundation atom — three composition levels (ambient/panel/modal) + seven accents (none/accepted/uncertain/disputed/superseded/focus/error). Enter/exit motion variants per level (added to `lib/motion.ts`); uncertain pulse on the border. Tailwind v4 two-namespace border rule enforced internally. React 19 ref-as-prop; semantic tokens only. | -- |
| 1.1.0 | 2026-06-18 | Spec Writer | enhance | Authoritative restructure: per-level sections (§6.1–§6.3) with visual + token table + a11y + BDD; explicit motion contract per level with reduced-motion fallback (§7); Tailwind v4 dual-namespace implementation notes with CVA + correct/incorrect pair matrix (§10); `cn()` className merge contract enumerating overridable vs forbidden classes (§11); React 19 ref-as-prop contract (§12); Storybook stories list covering 3 levels × theming + motion + reduced-motion + a11y contrast smoke (§9); consolidated BDD index (§15). | -- |
| 1.1.1 | 2026-06-19 | Owner review | patch | Reconciled the `accent="uncertain"` border pulse with `GlassSurface.back.md §7.2` (W-GS-1): it is realized as the CSS `@keyframes uncertain-border-pulse` (driven by `data-glass-pulse`), **not** the Framer Motion `motion.pulse.uncertain` variant — so the per-theme border color resolves through the `[data-theme]` cascade. Updated §4, §4.1, §6.4, §7, §8, §15 BDD, and §16 dependencies. | -- |
