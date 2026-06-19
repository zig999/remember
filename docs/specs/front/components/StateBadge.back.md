# StateBadge -- Back-end Spec (frontend component implementation reference)

> Stack: Vite 6 + React 19 + TypeScript (strict) + Tailwind CSS v4 + Framer Motion + lucide-react + CVA | DB: N/A | Version: 1.0.0 | Status: draft | Layer: permanent
> Business spec: `StateBadge.component.spec.md`
>
> **Domain shape.** This is a pure-display **frontend foundation atom** — no backend, no database, no domain events, no integrations. "Back" here is the **set of technical decisions the implementation group must follow to wire the component into the React 19 / Tailwind v4 / Framer Motion / Storybook toolchain** without re-litigating choices the spec already pinned. Sections of `TEMPLATE.back.md` that map to BFF concerns (data model, BR, ST, EV, external integrations) are marked **N/A** with rationale — `u-spec-back-writing` §Quality Gate permits this.

---

## 1. Stack and Patterns

> Only values that **extend or clarify** CLAUDE.md for this specific component. Anything not listed is "CLAUDE.md default".

| Aspect | Value | Note |
|--------|-------|------|
| Build / runtime | Vite 6 + React 19 + TypeScript strict | CLAUDE.md default |
| Component layer | Design-system atom under `frontend/src/components/ds/StateBadge/` | Distinct from `components/ui/` (shadcn-owned code) and from feature folders — atoms live under `ds/` (see §2) |
| Class composer | `cn()` (`tailwind-merge` + `clsx`) at `frontend/src/lib/cn.ts` | CLAUDE.md default — string concatenation forbidden (spec §11) |
| Variant API | `class-variance-authority` (CVA) with **two independent axes** (`size`, `state`) on a single factory | Justified by ≥ 2 visual variants per axis (CLAUDE.md "Component contract"; spec §5.1/§5.2) |
| Motion library | Framer Motion, consumed **only** through `frontend/src/lib/motion.ts` | Component never inlines `transition: {…}` literals; spec §7 |
| Motion gate | Framer Motion `useReducedMotion()` hook **inside the component** + global `<MotionConfig reducedMotion="user">` at app root | Defense in depth — both gates must agree before any animation runs (spec §7.2) |
| Icon library | `lucide-react` — five icons (`check-circle-2`, `help-circle`, `circle-dashed`, `git-fork`, `archive`) | Imported tree-shaken (per-icon named imports); icons are `aria-hidden="true"` (spec §9) |
| Ref forwarding | **React 19 ref-as-prop** — `function StateBadge({ ref, ...rest })` | `forwardRef` is forbidden across the design system (CLAUDE.md "Component contract"; spec §10) |
| Label source | pt-BR strings **inline in source** as a frozen `STATE_LABELS` const | `i18n: false` (CLAUDE.md Configuration) — no translation layer |
| Token usage | Semantic Tailwind utilities only (`bg-state-*`, `text-state-*-fg`, `border-border-*`, `rounded-pill`, `text-caption`/`text-body-sm`, `p-xs`/`p-sm`, `gap-xs`/`gap-sm`) | No arbitrary values (`w-[…]` etc.) — CLAUDE.md "Component contract" |
| Border declaration | **Pair pattern** `border border-border-{state}` (width + color), or `border border-border` for `low-confidence` | Tailwind v4 two-namespace gotcha (CLAUDE.md "Known Gotchas"; tokens.back.md §4) — applies inside every CVA variant string |
| Storybook | Storybook 9 (`@storybook/react-vite`) with `addon-a11y` + `addon-vitest` browser mode | Stories are also component tests (CLAUDE.md "Testing — Frontend") |
| Tests | Vitest + Testing Library for unit; `@vitest/browser` (Playwright provider) for motion/a11y stories | See §7 |
| Validation | N/A | No runtime input data — props are visual config; TypeScript types are the contract |

---

## 2. File structure

> Foundation-atom layout. **One folder per atom**; each file has one responsibility.

```
frontend/src/components/ds/StateBadge/
├── index.ts                    ← public surface (single re-export)
├── StateBadge.tsx              ← the component (ref-as-prop, motion wiring, label resolution)
├── StateBadge.types.ts         ← ConfidenceState, StateBadgeSize, StateBadgeProps
├── StateBadge.variants.ts      ← CVA factory (the `size` × `state` matrix)
├── StateBadge.labels.ts        ← STATE_LABELS frozen const + STATE_ICONS mapping
├── StateBadge.test.tsx         ← Vitest unit + jsdom render tests (states, label override, className merge, ref forwarding)
├── StateBadge.browser.test.tsx ← Vitest browser-mode tests (motion, reduced-motion, contrast)
└── StateBadge.stories.tsx      ← Storybook 9 stories (the 15 stories from spec §8)
```

### 2.1 File responsibilities

| File | Owns | Imports from | Exports |
|------|------|--------------|---------|
| `index.ts` | Public surface of the atom | `./StateBadge`, `./StateBadge.types` | `StateBadge` (component), `ConfidenceState`, `StateBadgeSize`, `StateBadgeProps` |
| `StateBadge.tsx` | JSX + motion wiring + label resolution + ref forwarding | `framer-motion`, `lucide-react`, `@/lib/cn`, `@/lib/motion`, `./StateBadge.variants`, `./StateBadge.labels`, `./StateBadge.types` | `StateBadge` (function component) |
| `StateBadge.types.ts` | Type contract (spec §3) | (none) | `ConfidenceState`, `StateBadgeSize`, `StateBadgeProps` |
| `StateBadge.variants.ts` | The single CVA factory for `size` × `state` | `class-variance-authority`, `./StateBadge.types` (for `VariantProps` consumers) | `stateBadgeVariants` (the `cva()` instance), `type StateBadgeVariants = VariantProps<typeof stateBadgeVariants>` |
| `StateBadge.labels.ts` | `STATE_LABELS` (pt-BR, frozen) + `STATE_ICONS` (lucide icon component per state) | `lucide-react` | `STATE_LABELS`, `STATE_ICONS`, `aria-label` builder `buildAriaLabel(state, customLabel?)` |
| `StateBadge.test.tsx` | jsdom-runnable behaviour assertions | `vitest`, `@testing-library/react`, `./` | (test file — no exports) |
| `StateBadge.browser.test.tsx` | Browser-mode behaviour (motion, contrast, reduced-motion media query) | `vitest`, `@vitest/browser`, `@testing-library/react`, `./` | (test file) |
| `StateBadge.stories.tsx` | The 15 normative stories (spec §8) | `@storybook/react`, `./` | `default` export (`Meta`) + one named export per story |

### 2.2 Why this layout (vs. a single file)

- `*.variants.ts` separates the CVA class strings (rarely change) from the component logic (motion, label resolution) — easier code review.
- `*.labels.ts` isolates pt-BR strings + the icon map: a future i18n decision (if `i18n: false` ever flips) touches one file.
- `*.types.ts` lets other features import `ConfidenceState` without dragging in Framer Motion / lucide as transitive deps (cheap type-only imports).
- Two test files: `*.test.tsx` runs under jsdom (fast, default Vitest provider); `*.browser.test.tsx` runs in real Playwright (Chromium) browser mode where `prefers-reduced-motion`, `backdrop-filter`, and Framer Motion's `useAnimate` actually behave as in production.

### 2.3 Per-component `index.ts` — stack exception confirmed

CLAUDE.md "Component contract" pins: a per-component `index.ts` re-exporting that single component's public surface is **allowed** (the broader "no barrel" rule does not apply at this scope). Consumers import as `import { StateBadge } from '@/components/ds/StateBadge'`.

---

## 3. CVA implementation — the `size` × `state` factory

> Single `cva()` instance with two **independent** variant axes. No compound variants — every (size, state) pair is the cross product of the two axes. Spec §5.

### 3.1 Factory shape (sketch — not normative code)

```ts
// StateBadge.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const stateBadgeVariants = cva(
  // Base classes — present on every render, regardless of variant
  'inline-flex items-center rounded-pill font-medium select-none',
  {
    variants: {
      size: {
        sm: 'text-caption p-xs gap-xs',     // in-row size — icon at 12 px (set via className on the <Icon /> child)
        md: 'text-body-sm p-sm gap-sm',     // selection-panel size — icon at 16 px
      },
      state: {
        accepted:        'bg-state-accepted text-state-accepted-fg border border-border-accepted',
        uncertain:       'bg-state-uncertain text-state-uncertain-fg border border-border-uncertain',
        'low-confidence':'bg-state-low-confidence text-state-low-confidence-fg border border-border',
        disputed:        'bg-state-disputed text-state-disputed-fg border border-border-disputed',
        superseded:      'bg-state-superseded text-state-superseded-fg border border-border-superseded',
      },
    },
    defaultVariants: { size: 'sm', state: 'accepted' },
  },
);

export type StateBadgeVariants = VariantProps<typeof stateBadgeVariants>;
```

### 3.2 Axis independence — why no compound variants

Spec §5.2 is explicit: `size` and `state` are independent — every combination is valid, no exceptions. `cva()`'s `compoundVariants` array is therefore not used. Adding compound variants later (e.g., "size=md + state=superseded gets a heavier muted border") would be a spec CR — not a refactor.

### 3.3 Border-pair pattern preserved inside every variant string

Every `state` variant either includes **both** `border` (width) + `border-border-{state}` (color), or — for `low-confidence` only — `border border-border` (default neutral pair). Spec §6.3 mandates `low-confidence` uses the neutral default border to stay visually quiet on diagnostic surfaces. CLAUDE.md "Known Gotchas" + tokens.back.md §4 are the source-of-truth on this.

### 3.4 Type re-export

`StateBadgeVariants` (from `VariantProps<typeof stateBadgeVariants>`) is exported from `StateBadge.variants.ts`. `StateBadgeProps` in `StateBadge.types.ts` does **not** extend `VariantProps` — instead it declares `state: ConfidenceState` and `size?: StateBadgeSize` explicitly. Rationale: `ConfidenceState` is the canonical type used by BFF mappers across the app and must be the named type, not a CVA-derived union. The CVA type still exists for Storybook controls.

### 3.5 Icon sizing — outside the CVA factory

Lucide icons accept a `className` — the component applies `size-3` (12 px) when `size === 'sm'` and `size-4` (16 px) when `size === 'md'`, computed in `StateBadge.tsx` (not as a compound CVA variant — keeps the factory readable). Tailwind v4 `size-*` reads from the `--spacing-*` namespace (`size-3` ≈ 12 px when `--spacing-3` is set; if not, falls back to Tailwind's default 4-pt grid where `3 = 0.75rem ≈ 12 px`).

### 3.6 className override semantics — tailwind-merge

`cn(stateBadgeVariants({ state, size }), className)` is the single composition call (spec §11). `tailwind-merge` deterministically lets the caller override individual utilities — e.g., `className="rounded-md"` wins over the factory's `rounded-pill`. This is intentional (spec §11) and tested by `StateBadge.test.tsx`.

---

## 4. Motion implementation — Framer Motion wiring

> All four variants are owned by `frontend/src/lib/motion.ts` (tokens.back.md §7). The component **only references** them by name. Spec §7.

### 4.1 Root element — `<motion.span>`

The root element is `<motion.span>` (not `<span>`), even when motion is not running. Two reasons:
1. Switching DOM types between renders (animated vs static) would break refs and reset CSS state.
2. Framer Motion's `useReducedMotion()` hook + `<MotionConfig>` make `<motion.*>` a no-op when reduced — there is no cost to using it unconditionally.

### 4.2 Per-state motion wiring

| State | Motion behavior in `StateBadge.tsx` | Mechanism |
|-------|-------------------------------------|-----------|
| `accepted`, `low-confidence`, `disputed` | No `animate` prop on the `<motion.span>` (static) | The component conditionally passes `animate`/`variants` only when the state demands motion |
| `uncertain` (idle) | `animate="pulse"` with `variants={motion.pulse.uncertain}` — infinite loop | `useReducedMotion()` gates: when reduced, omit `animate` entirely → static render |
| `* → accepted` (transition from `uncertain`) | `animate="promote"` with `variants={motion.transition.promote}` on the **render after** the prop change | Driven by the previous-state ref (see §4.4) |
| `* → superseded` | `animate="supersede"` with `variants={motion.transition.supersede}` on the render after the prop change | Same mechanism — previous-state ref |
| `* + data-state-transition="merge"` | `animate="merge"` with `variants={motion.transition.merge}` | Triggered by consumer-supplied DOM attribute, not by prop change |

### 4.3 `useReducedMotion()` placement

```ts
// StateBadge.tsx (sketch)
import { useReducedMotion, motion } from 'framer-motion';

function StateBadge({ state, animate = true, size = 'sm', iconOnly = false, label, className, ref }: StateBadgeProps) {
  const prefersReducedMotion = useReducedMotion();   // ← single source of truth for motion gating
  const motionAllowed = animate && !prefersReducedMotion;
  // ... compute previous state, current variant name, etc.
}
```

The hook is called **once** at the top of the component body. Every subsequent decision about motion (whether to set `animate`, which variant to play) consults `motionAllowed`. This satisfies spec §7.2: `animate=true` AND `prefers-reduced-motion: no-preference` are both required.

### 4.4 Detecting state transitions — `useRef` for previous state

```ts
// StateBadge.tsx (sketch — not normative code)
const previousStateRef = useRef<ConfidenceState | null>(null);
useEffect(() => { previousStateRef.current = state; }, [state]);

// On render:
const transitioning =
  previousStateRef.current !== null &&
  previousStateRef.current !== state;
const transitionKind =
  !transitioning ? null
  : state === 'accepted'   && previousStateRef.current === 'uncertain' ? 'promote'
  : state === 'superseded' ? 'supersede'
  : null;
```

- **Initial mount:** `previousStateRef.current` is `null` → no transition fires (the spec says transitions happen "while mounted").
- **Re-render with same state:** no transition fires.
- **`uncertain → accepted`:** plays `promote` once.
- **`* → superseded`:** plays `supersede` once.
- **Other transitions (e.g., `uncertain → disputed`):** no transition variant is in scope per spec §7.1 — the badge instantly swaps tokens. This is intentional; widening the transition matrix is a spec CR.
- **Merge:** **not** triggered by the previous-state ref — it is opted-in by the consumer via the `data-state-transition="merge"` attribute (read in JSX, not as a prop). See §4.6.

### 4.5 One-shot transition completion

Framer Motion fires `onAnimationComplete` when a variant finishes. The component listens and clears any transient transition state so the badge settles into the new resting variant:

```ts
const handleAnimationComplete = (definition: string) => {
  if (definition === 'promote' || definition === 'supersede' || definition === 'merge') {
    // The transitionKind is recomputed from the ref on the next render — nothing else to do
    // unless we are tracking explicit "is currently transitioning" UI state, which we are not.
  }
};
```

In practice, because the transition variant is derived purely from the previous-state ref (which updates in `useEffect`), `onAnimationComplete` is **not needed for state tracking**. It is wired only for Storybook story instrumentation (e.g., to surface "promote ended" in a Story action panel).

### 4.6 Merge transition — consumer-driven via DOM attribute

The merge variant is the only one the badge does not derive from its own props. Spec §7.4 is explicit: the consumer (graph merge controller) sets `data-state-transition="merge"` on both badges + target coordinates via CSS custom properties on the source badge. Implementation:

```tsx
// StateBadge.tsx (sketch)
<motion.span
  ref={ref}
  data-state-transition={undefined /* set by consumer DOM-side, never by the badge */}
  animate={motionAllowed ? deriveAnimate() : false}
  variants={motionAllowed ? deriveVariants() : undefined}
  onAnimationComplete={handleAnimationComplete}
  className={cn(stateBadgeVariants({ state, size }), className)}
  aria-label={buildAriaLabel(state, label)}
>
  …
</motion.span>
```

`deriveAnimate()` and `deriveVariants()` consult **both** the previous-state ref **and** the DOM attribute (read once during render via the ref's mounted element on a layout effect, or — preferred — by exposing a `transition?: 'merge'` *internal* prop the consumer can set via React, since DOM-attribute round-trips are awkward in React). Decision: the consumer sets a `transition?: 'merge'` prop directly. The spec mentions `data-state-transition` as the **visible DOM contract**; the component also writes that attribute when `transition === 'merge'` so that CSS / tooling can observe it.

> **Implementation note for the dev group:** the spec's `data-state-transition` is the **observable** contract — emit it as a DOM attribute. The **input** is a prop on the component. The Storybook `MergeTransition` story shows the wiring.

### 4.7 `AnimatePresence` — **not used inside the badge**

`StateBadge` does not own its own `AnimatePresence`. The supersede and merge variants animate the **same** badge instance (exit-style behavior with the element staying mounted at reduced opacity, then optionally unmounted by the consumer). Wrapping its parent list in `AnimatePresence` is the **consumer's** responsibility (tokens.back.md §7.3) — the badge plays its variant either way.

### 4.8 Tokens to motion bridge

`lib/motion.ts` consumes the duration / easing tokens via `lib/motion-tokens.ts` (numeric mirrors of `tokens.md §11.1`). The badge **never** imports motion tokens directly — it only imports the named variants. This isolates the duplication acknowledged in tokens.back.md §7.4.

---

## 5. Token usage — Tailwind utility ↔ token map

> Mapping enforced by the CVA factory (§3) and the spec (§6). Every utility is generated by Tailwind v4 from a token in `theme.css` (tokens.md §2).

### 5.1 Per-state token table

| State | Background utility | Background token | Foreground utility | Foreground token | Border utility (pair) | Border color token |
|-------|--------------------|------------------|--------------------|------------------|-----------------------|--------------------|
| `accepted` | `bg-state-accepted` | `--color-state-accepted` | `text-state-accepted-fg` | `--color-state-accepted-fg` | `border border-border-accepted` | `--color-border-accepted` |
| `uncertain` | `bg-state-uncertain` | `--color-state-uncertain` | `text-state-uncertain-fg` | `--color-state-uncertain-fg` | `border border-border-uncertain` | `--color-border-uncertain` |
| `low-confidence` | `bg-state-low-confidence` | `--color-state-low-confidence` | `text-state-low-confidence-fg` | `--color-state-low-confidence-fg` | `border border-border` (neutral) | `--color-border` |
| `disputed` | `bg-state-disputed` | `--color-state-disputed` | `text-state-disputed-fg` | `--color-state-disputed-fg` | `border border-border-disputed` | `--color-border-disputed` |
| `superseded` | `bg-state-superseded` | `--color-state-superseded` | `text-state-superseded-fg` | `--color-state-superseded-fg` | `border border-border-superseded` | `--color-border-superseded` |

### 5.2 Per-size token table

| Size | Font-size utility | Font-size token | Padding utility | Padding token | Gap utility | Gap token | Icon size utility | Spacing token |
|------|-------------------|-----------------|-----------------|---------------|-------------|-----------|-------------------|---------------|
| `sm` | `text-caption` | `--text-caption` | `p-xs` | `--spacing-xs` | `gap-xs` | `--spacing-xs` | `size-3` (12 px) | `--spacing-3` |
| `md` | `text-body-sm` | `--text-body-sm` | `p-sm` | `--spacing-sm` | `gap-sm` | `--spacing-sm` | `size-4` (16 px) | `--spacing-4` |

### 5.3 Shared utilities (every render)

| Utility | Token | Purpose |
|---------|-------|---------|
| `inline-flex` | (Tailwind built-in) | Layout — icon + label inline |
| `items-center` | (Tailwind built-in) | Vertical centering of icon + label |
| `rounded-pill` | `--radius-pill` | Fully rounded ends (the "pill" silhouette) |
| `font-medium` | (Tailwind built-in) | Slightly heavier than body — improves legibility at caption size |
| `select-none` | (Tailwind built-in) | Decorative — prevents accidental text selection when the badge is part of a card/row |

### 5.4 Motion utilities (CSS layer)

Motion is driven by Framer Motion (JS), not by Tailwind utilities — there is no `animate-pulse-uncertain` class. The component does **not** apply any animation-related Tailwind utility. tokens.back.md §7 is the source of truth.

### 5.5 No arbitrary values

`w-[…]`, `text-[…]`, `bg-[…]` etc. are **forbidden** in this component (CLAUDE.md "Component contract" — "No arbitrary values — use tokens"). If a future requirement needs a value not in the token catalog, the path is: add the token to `tokens.md` → mirror to `theme.css` → use the generated utility. Never a one-off arbitrary value.

### 5.6 Lucide icons — `aria-hidden` + `strokeWidth`

The lucide icon is rendered with `aria-hidden="true"` (decorative — meaning lives in the visible label + `aria-label`). `strokeWidth` defaults to 2 (tokens.back.md §8.3). Override only if a specific icon visually overpowers neighbors at 12 px — current judgment: no override needed for the five chosen icons.

---

## 6. Accessibility implementation

> Spec §9 is the contract. Implementation maps below.

### 6.1 `aria-label` builder

```ts
// StateBadge.labels.ts (sketch)
export const STATE_LABELS = Object.freeze({
  accepted:         'Aceito',
  uncertain:        'Incerto',
  'low-confidence': 'Baixa confiança',
  disputed:         'Em disputa',
  superseded:       'Superado',
} as const) satisfies Record<ConfidenceState, string>;

export function buildAriaLabel(state: ConfidenceState, customLabel?: string): string {
  const visible = customLabel ?? STATE_LABELS[state];
  return `Estado de confiança: ${visible}`;
}
```

Applied **unconditionally** on the root `<motion.span>` — including when `iconOnly=true`. Spec §9 mandates the aria-label always carries the resolved (custom or default) pt-BR label.

### 6.2 Role choice — implicit `text`, **not** `role="status"`

The root is a plain `<span>` (from `motion.span` → renders `<span>`). No explicit `role`. Spec §9 is emphatic: the badge is **not** a live region; consumer policy decides if state changes are announced. If a consumer needs announcement, it wraps the badge in its own `aria-live` region.

### 6.3 Icon is `aria-hidden`

```tsx
<Icon className={iconSizeClass} aria-hidden="true" />
```

Spec §9: "the lucide icon is `aria-hidden=true` (decorative); the visible label and `aria-label` carry meaning."

### 6.4 `iconOnly` mode

When `iconOnly=true`, the label `<span>` is rendered with `className="sr-only"` (visually hidden but screen-reader accessible) — **not** removed from the DOM. Rationale: keeping the text in the DOM doubles the meaning channel (visual aria-label + screen-reader-only text element), preserving robustness against AT quirks. Tailwind's `sr-only` is the canonical utility for this.

### 6.5 Reduced-motion implementation (re-iterated)

- `useReducedMotion()` returns the OS preference (Framer Motion handles the listener).
- `<MotionConfig reducedMotion="user">` is set at app root (tokens.back.md §7.2) — this is the **global** gate.
- The component's `motionAllowed = animate && !prefersReducedMotion` is the **local** gate.
- Both must be true for motion to run.

### 6.6 Contrast — calibrated, not computed

Spec §6.x asserts AA contrast for every `(bg-state-*, text-state-*-fg)` pair. The pairs are calibrated in `tokens.md §6.1` — the component does **not** re-verify contrast at runtime. The Storybook `addon-a11y` runs axe-core against every story (story-as-test, §7) and surfaces regressions.

### 6.7 Target size & focus — N/A (non-interactive)

Spec §9: target size (24 × 24) and focus rings are **not** the badge's concern — the optional wrapping `<button>` owns those. This component never sets `tabIndex` and never renders a focus ring.

---

## 7. Testing approach

> Two test files (§2). Together they satisfy CLAUDE.md "Tests verify intent" — every test encodes a WHY from the spec.

### 7.1 `StateBadge.test.tsx` — jsdom (Vitest default)

Fast unit tests. Renders into jsdom; cannot exercise real CSS animations or real media queries.

| # | Test name | Spec reference | What it asserts |
|---|-----------|----------------|-----------------|
| 1 | `renders each of the five states with the correct background, foreground, border classes` | §6.1–§6.5 | Loop over five `state` values; assert each rendered class list contains the expected `bg-state-*` / `text-state-*-fg` / `border` + `border-border-*` strings |
| 2 | `renders the pt-BR default label for each state` | §6 | Loop; assert `textContent` equals `STATE_LABELS[state]` |
| 3 | `renders the correct lucide icon for each state` | §6 | Loop; assert the rendered SVG has `data-lucide` or the icon-component's display name |
| 4 | `applies size="sm" classes by default` | §3 default | Render with no `size`; assert `text-caption p-xs gap-xs` present |
| 5 | `applies size="md" classes when requested` | §5.1 | Render `size="md"`; assert `text-body-sm p-sm gap-sm` present |
| 6 | `overrides default label when `label` prop is set` | §6 | Render `state="accepted" label="Validado"`; assert visible text and aria-label both reflect "Validado" |
| 7 | `hides the visual label when iconOnly=true and keeps the aria-label intact` | §9, §6.4 | Render `iconOnly`; assert label span has `sr-only` class; assert `aria-label` still includes the pt-BR label |
| 8 | `aria-label is always `Estado de confiança: <label>`` | §9.1 | Loop over five states + a custom label; assert prefix and resolved label |
| 9 | `cn() merges consumer className with tailwind-merge precedence` | §11.1 | Render `className="rounded-md shadow-md"`; assert `rounded-md` present, `rounded-pill` absent, `shadow-md` present, `bg-state-accepted` retained |
| 10 | `forwards ref to the root span element` | §10.1 | Pass `useRef<HTMLSpanElement>(null)`; after mount assert `ref.current.tagName === 'SPAN'` |
| 11 | `does NOT use forwardRef (file does not import it)` | §10 | Static check via a `vi.mock` or by reading `StateBadge.toString()` — see §7.4 |
| 12 | `instantly switches tokens when animate=false and state prop changes` | §7.2 | Re-render from `accepted` to `superseded` with `animate={false}`; assert no transition variant fired (use `motion`-mock helper) and final classes are present |
| 13 | `low-confidence renders the neutral border (border-border, no -low-confidence color token)` | §6.3 | Render `state="low-confidence"`; assert `border-border` present, no `border-border-low-confidence` class |

### 7.2 `StateBadge.browser.test.tsx` — Vitest browser mode (Chromium via Playwright)

Real-browser tests for the things jsdom cannot fake.

| # | Test name | Spec reference | What it asserts |
|---|-----------|----------------|-----------------|
| B1 | `uncertain state runs the pulse variant when prefers-reduced-motion: no-preference` | §7.2 | Emulate `prefers-reduced-motion: no-preference`; render `state="uncertain" animate`; assert the computed opacity oscillates over time (sample at two timestamps; expect difference) |
| B2 | `uncertain state does NOT animate when prefers-reduced-motion: reduce` | §7.2 | Emulate `prefers-reduced-motion: reduce`; assert opacity stays at 1.0 over the same window |
| B3 | `uncertain → accepted plays the promote transition once` | §7.3 | Mount as `uncertain`; re-render as `accepted`; spy on Framer Motion `onAnimationComplete` with definition `"promote"`; assert called exactly once within 350 ms |
| B4 | `* → superseded plays the supersede transition, settles at opacity 0.45 and y=4` | §6.5 | Mount as `accepted`; re-render as `superseded`; await `onAnimationComplete` for `"supersede"`; read `getComputedStyle` opacity and transform |
| B5 | `data-state-transition="merge" plays the merge variant on both badges` | §7.4 | Render two badges, trigger the prop that emits `data-state-transition="merge"` on both; assert source badge opacity goes to 0 and target badge scales 1.08 then back to 1 |
| B6 | `addon-a11y / axe-core sees no violations in any of the 5 states` | §9 | One axe check per state; expect zero violations |
| B7 | `WCAG 2.2 AA contrast holds for every (bg, fg) pair in dark theme` | §9 | Sample the DOM rendered colors and run a contrast ratio calculation; assert ≥ 4.5:1 for each state |
| B8 | `WCAG 2.2 AA contrast holds for every (bg, fg) pair in light theme` | §9 | Same as B7 with `data-theme="light"` on `<html>` |
| B9 | `superseded badge remains visually identifiable at resting 0.45 opacity` | §6.5 | After supersede settles, assert the icon has a non-zero alpha composite over the panel backdrop (≥ 1.5:1 against `surface-glass-panel`) |

### 7.3 Stories-as-tests via `addon-vitest`

Per CLAUDE.md "Testing — Frontend", every Storybook story (except interactive transitions) is also a component test in browser mode through `addon-vitest`. The 15 stories in spec §8 yield 12 implicit tests (excluding `PromoteTransition`, `SupersedeTransition`, `MergeTransition` which are interactive and require manual trigger — those have explicit equivalents in §7.2 above).

### 7.4 React 19 forwardRef static guard

There is no lint rule shipped that prohibits `forwardRef` (a future-work candidate). The component test #11 takes a lightweight static guard: read the contents of `StateBadge.tsx` at test time (via `fs.readFileSync(import.meta.resolve('./StateBadge.tsx'))`) and assert it does **not** contain the substring `forwardRef`. Cheap, deterministic, surfaces the violation in CI.

### 7.5 Mocking Framer Motion in jsdom

`framer-motion` works in jsdom but does not actually animate (no requestAnimationFrame painting). The jsdom tests use a thin mock that records `animate` / `variants` props passed to `motion.span` — assertions check **the intent** (which variant was wired) rather than the visual result. Real-motion assertions live in the browser-mode file.

---

## 8. Storybook setup

> Spec §8 lists 15 stories. Implementation choices below.

### 8.1 File location and meta

```tsx
// StateBadge.stories.tsx (sketch)
import type { Meta, StoryObj } from '@storybook/react';
import { StateBadge } from './';
import { withAmbientBackdrop } from '@/.storybook/decorators/withAmbientBackdrop';

const meta = {
  title: 'Design System / Atoms / StateBadge',
  component: StateBadge,
  parameters: { layout: 'centered' },
  argTypes: {
    state: { control: 'select', options: ['accepted', 'uncertain', 'low-confidence', 'disputed', 'superseded'] },
    size:  { control: 'inline-radio', options: ['sm', 'md'] },
    animate:  { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    label:    { control: 'text' },
  },
} satisfies Meta<typeof StateBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
```

### 8.2 `withAmbientBackdrop` decorator — for on-glass stories

Spec §8 lists `OnGlassPanel` (the 5 states rendered on `bg-surface-glass-panel`). The decorator wraps the story in the same ambient-backdrop chrome the production app uses — so a story's visual identity matches the real surface.

Location: `frontend/.storybook/decorators/withAmbientBackdrop.tsx` (project-level, shared across all atom/molecule specs).

Sketch:

```tsx
// .storybook/decorators/withAmbientBackdrop.tsx
import type { Decorator } from '@storybook/react';

export const withAmbientBackdrop: Decorator = (Story, ctx) => (
  <div className="relative isolate min-h-screen w-full p-xl bg-primary">
    {/* Ambient image stand-in — backdrop-filter sources from this */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-[var(--graph-depth-overlay)]"
    />
    {/* Glass surface — the real subject of "OnGlass" stories */}
    <div className="rounded-md border border-border-glass bg-surface-glass-panel p-lg backdrop-blur-glass-md shadow-glass">
      <Story />
    </div>
  </div>
);
```

Applied to stories that need it:

```tsx
export const OnGlassPanel: Story = {
  decorators: [withAmbientBackdrop],
  render: () => (
    <div className="flex gap-md">
      {(['accepted','uncertain','low-confidence','disputed','superseded'] as const).map(s => (
        <StateBadge key={s} state={s} />
      ))}
    </div>
  ),
};
```

### 8.3 Reduced-motion decorator — `ReducedMotionStatic` story

Needs the page (the iframe Storybook serves stories in) to report `prefers-reduced-motion: reduce`. Implementation options:

1. **Story parameter** consumed by a `withReducedMotionGate` decorator that wraps the story in Framer Motion `<MotionConfig reducedMotion="always">`. Force-overrides the OS preference. Cheap.
2. **CSS injection** that sets `--motion-reduce: 1` (no native support).

Decision: **option 1** — `<MotionConfig reducedMotion="always">`. The decorator is one line and the story renders correctly under any OS preference.

```tsx
import { MotionConfig } from 'framer-motion';

export const ReducedMotionStatic: Story = {
  decorators: [(S) => <MotionConfig reducedMotion="always"><S /></MotionConfig>],
  args: { state: 'uncertain', animate: true },
};
```

### 8.4 Light-theme decorator — `LightTheme` story

Wrap the story tree with `<html data-theme="light">` — implemented as a decorator that sets `document.documentElement.dataset.theme = 'light'` on mount and restores on unmount.

Storybook 9 has `@storybook/addon-themes` (tokens.back.md §11.2) — use its `withThemeByDataAttribute` decorator at the **global** `preview.tsx` level for a toolbar toggle, and additionally pin individual stories to a theme via story-level `parameters.theme`. The dedicated `LightTheme` story is a no-arg story whose decorator forces light.

### 8.5 Interactive transition stories — `PromoteTransition`, `SupersedeTransition`, `MergeTransition`

Each is a controlled story with a small useState hook:

```tsx
export const PromoteTransition: Story = {
  render: () => {
    const [state, setState] = React.useState<ConfidenceState>('uncertain');
    return (
      <div className="flex flex-col items-center gap-md">
        <StateBadge state={state} animate />
        <button
          type="button"
          onClick={() => setState(s => s === 'uncertain' ? 'accepted' : 'uncertain')}
          className="rounded-md border border-border bg-elevated px-md py-xs text-caption"
        >
          Toggle uncertain ⇄ accepted
        </button>
      </div>
    );
  },
};
```

Same shape for `SupersedeTransition` (toggles `accepted ⇄ superseded`) and `MergeTransition` (renders two badges + triggers `data-state-transition="merge"` via a `useState<'idle' | 'merging'>` plus a button).

### 8.6 `addon-a11y` and `addon-vitest` configuration

Already configured at the Storybook root (tokens.back.md §11). No per-story configuration needed. Every static (non-interactive) story is asserted by `addon-a11y` and runs as a test in browser mode via `addon-vitest`.

### 8.7 Story file size and ordering

Stories are listed in the same order as spec §8 for traceability. The `Default` story (5 states in a row) is first so the Storybook sidebar surfaces the catalog at-a-glance.

---

## 9. React 19 ref-as-prop implementation

> Spec §10 + CLAUDE.md "Component contract". Critical: do **not** use `forwardRef`.

### 9.1 Signature

```ts
// StateBadge.types.ts
export type StateBadgeProps = {
  state: ConfidenceState;
  animate?: boolean;
  size?: StateBadgeSize;
  iconOnly?: boolean;
  label?: string;
  className?: string;
  ref?: React.Ref<HTMLSpanElement>;
};
```

```tsx
// StateBadge.tsx
export function StateBadge({
  state,
  animate = true,
  size = 'sm',
  iconOnly = false,
  label,
  className,
  ref,
}: StateBadgeProps) {
  // ... hooks (useReducedMotion, useRef for previousState, useEffect to update it)
  return (
    <motion.span
      ref={ref}
      aria-label={buildAriaLabel(state, label)}
      className={cn(stateBadgeVariants({ state, size }), className)}
      /* animate / variants wiring per §4 */
    >
      <Icon className={size === 'sm' ? 'size-3' : 'size-4'} aria-hidden="true" />
      <span className={iconOnly ? 'sr-only' : undefined}>
        {label ?? STATE_LABELS[state]}
      </span>
    </motion.span>
  );
}
```

### 9.2 Why this works in React 19

React 19 treats `ref` as a normal prop on function components — the old `forwardRef` wrapper is no longer required to expose a ref to the underlying DOM node. The `<motion.span>` accepts `ref` directly and Framer Motion forwards it to the underlying `span`. The consumer's `useRef<HTMLSpanElement>()` then `.current` is the real DOM `<span>`.

### 9.3 What is explicitly **not** done

- No `forwardRef` import from React.
- No `useImperativeHandle` — the component does not expose imperative methods.
- No `ref` type fallback like `Ref<HTMLElement>` — narrowed to `HTMLSpanElement` for type safety (spec §10).

### 9.4 Test coverage

Test #10 (jsdom) attaches a ref and asserts `.current.tagName === 'SPAN'`. Test #11 reads the source and asserts `forwardRef` is not present.

---

## 10. Performance considerations

### 10.1 Re-render cost

`StateBadge` is a leaf component with no internal expensive computation. The `useEffect` for previous-state tracking is `O(1)`. Re-renders triggered by parent state changes are cheap (~< 1 ms).

### 10.2 Motion cost

- The `uncertain` pulse animates `opacity` — a compositor-only property. GPU-accelerated, no layout/paint cost.
- The `promote` transition animates `backgroundColor` (paint) + `scale` (compositor). `scale` is cheap; the bg color animation paints the small badge area (~30–60 px²) → negligible.
- The `supersede` transition animates `opacity` + `y` (compositor only).
- The `merge` transition animates `x`/`y` + `opacity` (compositor only) + a target-side `scale` (compositor only).

Decision: **no `will-change` hint** is set on the root. `will-change` has a cost (the browser allocates a compositor layer permanently), and the animations are short-lived enough that the cost is not justified.

### 10.3 Bundle cost

- `framer-motion`: shared across the app — no per-component cost.
- Five lucide icons (`check-circle-2`, `help-circle`, `circle-dashed`, `git-fork`, `archive`): ~2 KB gzipped total (tree-shaken; each icon ≈ 400 bytes).
- `class-variance-authority`: shared across the app.
- The badge itself: ~1–2 KB gzipped for `.tsx` + `.variants.ts` + `.labels.ts` combined after minification.

Negligible against the 300 KB initial-bundle budget (CLAUDE.md Performance Budgets — Frontend).

### 10.4 Many badges on screen — search results, graph node panel, curation list

A search results page may render 20–50 badges; a curation list view may render 100+. Considerations:

- Static badges (accepted / disputed / low-confidence / superseded — no ambient motion) cost effectively zero — they are static spans.
- Uncertain badges with active pulses: each one keeps a Framer Motion animation alive. On a typical mid-range laptop, ~100 concurrent opacity animations cost ~0.5–1 ms per frame (well below the 16.6 ms budget). On a low-end device with the OS pref `prefers-reduced-motion: reduce`, all pulses are off — cost is zero.
- If a future surface ever renders **thousands** of badges at once, the recommendation is to virtualize the list (TanStack Virtual) — virtualization caps the visible badge count to the viewport, irrespective of the dataset size. This is a consumer-side decision, not a badge-side one.

### 10.5 Lighthouse / CWV impact

The badge does not block paint, does not request fonts, does not load images. LCP and INP (CLAUDE.md targets) are not impacted.

---

## 11. Data Model

> **N/A — pure-display component, no persisted data.** The `state` prop is a typed enum (`ConfidenceState`) handed in by consumers; the consumer maps the BFF response (`effective_status` / `flag` / `validation_outcome`) to the prop at the boundary. No tables, no FKs, no indexes — this is a renderer, not an owner. Spec §3 "Sourcing" is the authority on where `state` comes from.

---

## 12. Business Rules (BR)

> **N/A — no business rules at the component layer.** The five confidence states (`accepted` / `uncertain` / `low-confidence` / `disputed` / `superseded`) are owned by the BFF (`remember-modelagem-v7.md §3.5 / §6.6`). The component's contract is purely visual:
>
> - Rendering rules (which icon, label, tokens, motion per state) are in **spec §6** — they are visual contract, not business validation.
> - The component never thresholds a `confidence` number (spec §1: "the badge never thresholds") — there is nothing for a BR to govern.
> - `prefers-reduced-motion` gating is an a11y requirement, also documented in spec §7.2/§9 — implemented as code (§4.3, §6.5 of this back doc), not as a rule that can fail at runtime.
>
> No `error.code`, no validation layer, no UC mapping applies.

---

## 13. State Machine (ST)

> **N/A — the state machine belongs to the BFF.** The 5-state vocabulary (`accepted` / `uncertain` / `low-confidence` / `disputed` / `superseded`) is the BFF's state machine for fragments / attributes / links (`remember-modelagem-v7.md §3.5, §6.6`). This component is a **renderer** of that machine — it does not transition entities, it draws the current value.
>
> Internal component "state" — the previous-state ref used to pick the right transition variant (§4.4) — is **rendering bookkeeping**, not a domain state machine. Documented in spec §4 and §4.4 of this back doc.

---

## 14. Domain Events (EV)

> **N/A — no events emitted.** The component has no callbacks (`onClick`, `onAnimationStart`, `onChange`, etc.) — spec §1 is explicit: it is "purely display"; click/hover behavior (e.g., opening the provenance drawer) is the consumer's responsibility on the wrapping element. No producer, no consumers, no payloads.

---

## 15. External Integrations

> **N/A — no external services.** All dependencies are npm packages bundled by Vite: `framer-motion`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`. No HTTP, no IPC, no CDN, no API calls.

---

## 16. Known Technical Constraints

- **Tailwind v4 / addon-vitest version pinning.** CLAUDE.md "Known Gotchas" — `vitest` is pinned at v4 with a Vite override because of `addon-vitest`. The browser-mode tests in `StateBadge.browser.test.tsx` ride that pin; do not bump `vitest` / `vite` while editing this component without re-validating the browser tests.
- **Two-namespace border gotcha (load-bearing).** Every `state` variant in the CVA factory (§3) uses the pair `border border-border-{state}` (or `border border-border` for `low-confidence`). Dropping the width half makes the border vanish silently — CLAUDE.md "Known Gotchas" + tokens.back.md §4.
- **Tailwind v4 JIT — no class concatenation at runtime.** Class names must appear **as literal strings** in source files for Tailwind to detect them. `` `bg-state-${state}` `` is **forbidden** — that is the entire reason CVA is used (§3.1 enumerates every variant verbatim). The same rule applies to the lucide-icon size class (§3.5: literal `size-3` / `size-4`, not `size-${n}`).
- **Reduced-motion is a double gate.** `animate=true` alone is **not** sufficient. `useReducedMotion()` returning `true` always wins. Tests B1/B2 (§7.2) enforce both directions.
- **`previousStateRef` is `null` on first render.** This is intentional (spec §4 + §4.4) — transitions only fire when a prop change occurs **after** mount. A badge that mounts directly into `state="superseded"` does **not** play the supersede transition; it just renders at resting opacity. Consumers that want an entrance animation must drive it via `AnimatePresence` in their own tree.
- **Merge transition contract.** The `data-state-transition="merge"` DOM attribute is the observable contract; the input is a `transition?: 'merge'` (or equivalent) prop the consumer sets in React. This split is documented in §4.6 and is the subject of a dev-side decision when this component is implemented — the spec only pins the observable side.
- **`forwardRef` static guard, not lint rule.** Test #11 (§7.4) reads the source file and asserts `forwardRef` is absent. A real ESLint rule that does this project-wide is a future-work item — `eslint-plugin-react-x` or a custom rule.
- **No `i18n` layer.** `STATE_LABELS` is a pt-BR-only frozen object. If `i18n: false` ever flips (currently pinned in CLAUDE.md), the label resolution path (`label ?? STATE_LABELS[state]`) is the single point to refactor.
- **Per-state border-color token presence.** The four states `accepted` / `uncertain` / `disputed` / `superseded` each require a `--color-border-{state}` token in `theme.css`; `low-confidence` intentionally **does not**. If any of those tokens go missing in a future theme.css change, the border silently vanishes for the affected state — covered by Storybook visual regression (§7.3) and contrast tests B7/B8.

---

## 17. Out of Scope

- **Provenance drawer integration.** Click / hover that opens a provenance drawer is the **consumer's** wrapping element, never the badge. Spec §1 / §12.
- **Numeric confidence value rendering.** A separate `<ConfidenceMeter />` component (later wave) is the canonical place for the numeric value. The badge never shows a number.
- **Tooltip composition.** Wrapping the badge in a Radix `Tooltip` to explain the "why" of the state is a later-wave concern (spec §1). The badge stays untouched by tooltip logic.
- **Computing the `state` from a raw `confidence` number.** Threshold mapping (≥ 0.75 / 0.40–0.74 / < 0.40) is the **BFF's** responsibility (`remember-modelagem-v7.md §6.6`). The component receives the result. Spec §3 "Sourcing".
- **`NodeTypeBadge`, `RunStatusBadge`, `FilterChip`.** Adjacent atoms for orthogonal vocabularies — separate component specs, separate implementations. Spec §2 "When Not to Use".
- **Server-side rendering.** Vite + React 19 SPA, no SSR (tokens.back.md §5.4). If SSR is introduced later, the `useEffect`-based previous-state tracking is unaffected (effects don't run server-side, so `previousStateRef.current` stays `null` on server render — equivalent to "mounted with no prior state", which is correct).
- **Automated contrast verification across the full token matrix.** Tests B7/B8 (§7.2) check the five (bg, fg) pairs per theme. A broader contrast-matrix test that also exercises the badge against every glass × backdrop combination is a future-work item — tokens.back.md §17.
- **ESLint rule for `forwardRef` / arbitrary values / unpaired borders.** Future-work — out of scope for this component.
- **Locale-aware labels.** `i18n: false` (CLAUDE.md) — pt-BR only. Out of scope until the project decision flips.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-18 | Back Spec Agent | initial | Initial technical decisions for the StateBadge foundation atom: file layout under `frontend/src/components/ds/StateBadge/` (component / variants / labels / types / two test files / stories), single CVA factory for `size` × `state` with two independent axes and border-pair pattern preserved per variant, Framer Motion wiring via `lib/motion.ts` with `useReducedMotion()` local gate + `<MotionConfig>` global gate, previous-state ref for one-shot promote/supersede transitions, consumer-driven merge transition via `data-state-transition` DOM attribute + internal prop, per-state token map (bg / fg / border) and per-size token map (text / padding / gap / icon), `aria-label` builder with `Estado de confiança:` prefix and pt-BR labels from frozen `STATE_LABELS`, jsdom + browser-mode test split (13 + 9 tests) with stories-as-tests via `addon-vitest`, Storybook 9 wiring with `withAmbientBackdrop` decorator for on-glass stories and `MotionConfig reducedMotion="always"` decorator for the reduced-motion story, React 19 ref-as-prop signature with static `forwardRef`-absence guard. Component has no BFF — data model / BR / ST / EV / external integrations marked N/A with rationale. | -- |
