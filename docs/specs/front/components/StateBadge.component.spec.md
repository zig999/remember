# StateBadge — Component Spec

> ## ⚠ v2.0 — cores de estado remapeadas para os accents do TUI
> As 5 cores de confiança não usam mais a paleta oklch própria: foram **remapeadas** para os accents do kit
> (`accepted→success`, `uncertain→warning`, `disputed→destructive`, `low-confidence`/`superseded→muted-foreground`).
> ⚠ `low-confidence` e `superseded` **colidem** no mesmo tom → distinção por **ícone**. Tipografia usa
> tamanhos built-in do Tailwind (badge = `text-xs font-bold`); cantos retos (sem `pill`). A semântica dos
> estados (thresholds, ícones, motion) é inalterada. Autoridade: [`../design-system/tokens.md`](../design-system/tokens.md) §3.

> Path: `frontend/src/components/ds/StateBadge/`
> COMP-01 | Used in features: (foundation atom — consumed wherever a fact's confidence state must be legible: `/search` results, `/graph` node selection panel, `/curation` cards, provenance drawer)
> Status: approved | Layer: permanent

---

## 1. Purpose and Responsibilities

`StateBadge` renders the **confidence state** of any fact (a `KnowledgeLink`, a `NodeAttribute`, an `InformationFragment`, or a `KnowledgeNode`) as a small visual selo — color + lucide icon + short pt-BR label — drawn from the five-state vocabulary defined in `design-system/tokens.md §6.1`. It is the foundation atom that realizes the project's invariant "**confiança explícita** — incerteza nunca é escondida" (`frontend-analise-funcional.md §1, §9`).

The badge is **purely display**: it receives a state plus optional configuration and renders. It owns one ambient animation (the uncertain pulse) and three entrance/exit transition variants (promote / supersede / merge) — all consumed from `lib/motion.ts`, never reinvented. Motion is **semantic**, not decorative: the uncertain pulse is the visible proof of "incerteza nunca escondida"; the promote, supersede, and merge variants make state changes self-explanatory (`frontend-analise-funcional.md §9`).

**Out of scope for this component:**
- Click / hover behavior to **open the provenance drawer** — that is the consumer's responsibility (the badge is non-interactive by default).
- Computing the state from a raw `confidence` number — the BFF already exposes the canonical state via the envelope (`validation_outcome` / `effective_state`); the consumer passes it in.
- Showing the numeric confidence value — that is a separate `<ConfidenceMeter />` (later wave).
- Tooltip with the "why" of the state — added in a later wave as a Radix `Tooltip` composed around this badge.

---

## 2. When to Use / When Not to Use

| Use when | Do not use when |
|---|---|
| Marking a fact, attribute, link, or node with its confidence state (`accepted` / `uncertain` / `low-confidence` / `disputed` / `superseded`) | The element is a **node type** identity (e.g., "this is a Person") → use `NodeTypeBadge` (later wave) |
| Surfacing a state inline in a search result row, a graph selection panel, a curation card, a provenance drawer item | Showing a **generic status** unrelated to the confidence vocabulary (e.g., the `LLMRun.status` of `running`/`completed`/`failed`) → use `RunStatusBadge` (later wave) |
| Inside a glass surface, on a card, on a graph node halo | As a **clickable filter chip** → use `FilterChip` (later wave) |

---

## 3. Props Contract

> Binding contract. Prop changes without a spec CR are breaking changes. The `ConfidenceState` enum is the single source of truth — declared in this module and imported everywhere else.

```ts
// canonical type — declared once in this module and imported everywhere
export type ConfidenceState =
  | 'accepted'
  | 'uncertain'
  | 'low-confidence'
  | 'disputed'
  | 'superseded'

export type StateBadgeSize = 'sm' | 'md'

export type StateBadgeProps = {
  state: ConfidenceState
  /** When true (default), the uncertain state animates the ambient pulse and any state change
   *  animates the matching transition variant from lib/motion.ts.
   *  When false, the badge changes instantly. (prefers-reduced-motion always wins over true.) */
  animate?: boolean
  /** Compact (`sm`, default) is the in-row size; `md` is the selection-panel size. */
  size?: StateBadgeSize
  /** Render only the icon + color halo; hide the pt-BR label. The full label is still exposed
   *  via aria-label for screen readers. Use for tight contexts (table cells, dense legends). */
  iconOnly?: boolean
  /** Override the pt-BR label rendered next to the icon. Defaults are listed in §6. */
  label?: string
  /** Standard className merged via cn(); never via string concat. */
  className?: string
  /** React 19 ref — passed as a normal prop. No forwardRef. */
  ref?: React.Ref<HTMLSpanElement>
}
```

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `state` | `ConfidenceState` | yes | — | The state to render — one of the five vocabulary values |
| `animate` | `boolean` | no | `true` | If `true`, the uncertain state pulses and state changes animate. `prefers-reduced-motion: reduce` always disables motion regardless. |
| `size` | `'sm' \| 'md'` | no | `'sm'` | Visual size — `sm` for in-row, `md` for selection panels |
| `iconOnly` | `boolean` | no | `false` | Hide the label visually; keep it as `aria-label` |
| `label` | `string` | no | (per-state pt-BR default — see §6) | Override the rendered pt-BR label |
| `className` | `string` | no | `undefined` | Extra Tailwind classes merged via `cn()` |
| `ref` | `Ref<HTMLSpanElement>` | no | — | React 19 ref-as-prop |

> **Sourcing:** `state` comes from the BFF envelope. For a link/attribute, it is derived from `effective_status` + `flag` (see `remember-modelagem-v7.md §5.4 / §6.6`). The component never derives the state itself; the consumer maps the BFF field to the prop.

---

## 4. Component States

Internal state is **minimal**: the component records its previous `state` prop in a `ref` so it can play the correct one-shot transition variant (`promote` / `supersede` / `merge`) when the prop changes.

| State | Trigger | Visual change | Interactivity |
|---|---|---|---|
| `idle` | Initial render with any `state` | Draws the bg/text/border tokens for `state` + lucide icon + pt-BR label | non-interactive (pure display) |
| `idle :: state="uncertain" :: animate=true` | `state === 'uncertain'` and `animate=true` and `prefers-reduced-motion: no-preference` | Plays `motion.pulse.uncertain` ambient loop on the badge | non-interactive |
| `transition :: promoted` | Prop changes `'uncertain' → 'accepted'` while mounted (`animate=true` + motion allowed) | One-shot `motion.transition.promote` (color morph + scale 1 → 1.06 → 1) | non-interactive |
| `transition :: superseded` | Prop changes `* → 'superseded'` while mounted (`animate=true` + motion allowed) | One-shot `motion.transition.supersede` (opacity 1 → 0.45 + y 0 → 4) | non-interactive |
| `transition :: merged` | Consumer passes `data-state-transition="merge"` (advanced — used by graph node merge) | One-shot `motion.transition.merge` (translates toward target + scale halo on the surviving badge) | non-interactive |

> **Transition parameters** (all sourced from `tokens.md §11`):

| Parameter | Formula / Value | Unit | Applies to state |
|---|---|---|---|
| Uncertain pulse opacity range | `1 → 0.55 → 1` | — | `idle :: uncertain` |
| Uncertain pulse duration | `--duration-pulse` (2400 ms) | ms | `idle :: uncertain` |
| Uncertain pulse easing | `--ease-in-out` | — | `idle :: uncertain` |
| Promote duration | `--duration-moderate` (300 ms) | ms | `transition :: promoted` |
| Promote easing | `--ease-out-quint` | — | `transition :: promoted` |
| Promote scale curve | `1 → 1.06 → 1` | — | `transition :: promoted` |
| Supersede duration | `--duration-entrance` (500 ms) | ms | `transition :: superseded` |
| Supersede easing | `--ease-in` | — | `transition :: superseded` |
| Supersede final opacity | `0.45` | — | `transition :: superseded` |
| Supersede y translate | `0 → 4` | px | `transition :: superseded` |
| Merge duration | `--duration-entrance` (500 ms) | ms | `transition :: merged` |
| Merge easing | `--ease-out-expo` | — | `transition :: merged` |
| Merge surviving-badge scale | `1 → 1.08 → 1` | — | `transition :: merged` |

---

## 5. Variants and Compositions

### 5.1 Size variants (CVA)

`size` has two values → CVA is used (per `front.md §6.3`: CVA is justified at 2+ visual variants).

| Variant | Prop | Class composition (Tailwind tokens) | Usage context |
|---|---|---|---|
| `sm` (default) | `size="sm"` | `text-caption` + `p-xs gap-xs` + `rounded-pill` + `border` + icon at 12 px | In-row inside search results, table cells, graph node halo |
| `md` | `size="md"` | `text-body-sm` + `p-sm gap-sm` + `rounded-pill` + `border` + icon at 16 px | Selection-panel header in `/graph`, curation card title row |

### 5.2 State variants (the 5 — driven by the `state` prop, also CVA on the same `cva()` factory)

`state` has five values → handled by the same CVA factory as `size` (compound variants are not used; each axis is independent).

> Default labels are **pt-BR** and live in `frontend/src/components/ds/StateBadge/StateBadge.tsx` as a frozen object (`const STATE_LABELS = Object.freeze({ ... })`). There is no i18n layer — strings are in the source (`CLAUDE.md` `i18n: false`).

---

## 6. State catalog — visual, tokens, accessibility, BDD

> Each of the five states gets a dedicated subsection. **No state has a fallback** — when a new state is added to `ConfidenceState`, this section MUST grow a new entry in the same CR.

### 6.1 `accepted`

- **Visual:** green pill with a check icon and the pt-BR label "Aceito". The most "settled" of the five — static, no motion.
- **Default label (pt-BR):** `"Aceito"`
- **Lucide icon:** `check-circle-2`
- **Tokens (background + foreground + border):**
  - Background: `bg-state-accepted` (token `--color-state-accepted`)
  - Foreground: `text-state-accepted-fg` (token `--color-state-accepted-fg`)
  - Border (pair): `border border-border-accepted` (width `--border-DEFAULT` + color `--color-border-accepted`)
- **Motion:** none (this is the resting state — the absence of motion is the signal).
- **WCAG 2.2 AA contrast:** the `bg-state-accepted` / `text-state-accepted-fg` pair clears **≥ 4.5:1** in both themes (verified in `tokens.md §6.1`). The badge is intended to sit on glass surfaces (`surface-glass-ambient`, `surface-glass-panel`) and on the workspace `bg-surface` — the tinted background of the badge isolates it from those backdrops, so contrast is measured **inside the badge** (bg vs fg).

```
Given the component receives state="accepted" and no other props
When it mounts
Then it renders a <span> with classes "bg-state-accepted text-state-accepted-fg border border-border-accepted rounded-pill text-caption p-xs gap-xs"
And it contains the lucide "check-circle-2" icon and the pt-BR text "Aceito"
And the element has aria-label="Estado de confiança: Aceito"
And no Framer Motion animation is running on it
```

### 6.2 `uncertain`

- **Visual:** amber pill with a help-circle icon and the pt-BR label "Incerto". **Pulses gently** while in this state — opacity oscillates `1 → 0.55 → 1` on a 2400 ms loop. The pulse is the visible promise that the system is *not* hiding doubt.
- **Default label (pt-BR):** `"Incerto"`
- **Lucide icon:** `help-circle`
- **Tokens (background + foreground + border):**
  - Background: `bg-state-uncertain` (token `--color-state-uncertain`)
  - Foreground: `text-state-uncertain-fg` (token `--color-state-uncertain-fg`)
  - Border (pair): `border border-border-uncertain`
- **Motion:** `motion.pulse.uncertain` (ambient, infinite loop) — opacity `1 → 0.55 → 1`, `--duration-pulse` (2400 ms), `--ease-in-out`. Gated by `prefers-reduced-motion: no-preference`.
- **WCAG 2.2 AA contrast:** the `bg-state-uncertain` / `text-state-uncertain-fg` pair clears **≥ 4.5:1** in both themes. The pulse drops opacity of the entire badge to 0.55 momentarily — this changes the **alpha of the composite over the backdrop**, not the bg/fg pair ratio inside the badge. The contrast contract is "the badge MUST be readable in its low-opacity trough"; verified by `tokens.md §6.1` calibration against the glass backdrop tokens.

```
Given the component receives state="uncertain" and animate=true
And the test environment reports prefers-reduced-motion: no-preference
When it mounts
Then the inner element runs the Framer Motion variant "motion.pulse.uncertain" indefinitely
And the badge renders the lucide "help-circle" icon with the pt-BR text "Incerto"
And aria-label="Estado de confiança: Incerto"
```

```
Given the component receives state="uncertain" and animate=true
And the test environment reports prefers-reduced-motion: reduce
When it mounts
Then no Framer Motion animation runs
And the badge renders statically with the uncertain bg/text/border tokens and the "help-circle" icon
And aria-label="Estado de confiança: Incerto"
```

### 6.3 `low-confidence`

- **Visual:** neutral grey pill with a dashed-circle icon and the pt-BR label "Baixa confiança". **No state-specific border color** (uses the neutral default `border-border`). Discreet by design — this state appears **only in diagnostic UIs** (e.g., `/history` run detail), not in user-facing surfaces.
- **Default label (pt-BR):** `"Baixa confiança"`
- **Lucide icon:** `circle-dashed`
- **Tokens (background + foreground + border):**
  - Background: `bg-state-low-confidence` (token `--color-state-low-confidence`)
  - Foreground: `text-state-low-confidence-fg` (token `--color-state-low-confidence-fg`)
  - Border (pair): `border border-border` (the neutral default — there is intentionally no `--color-border-low-confidence` token, to keep this state visually quiet)
- **Motion:** none.
- **WCAG 2.2 AA contrast:** the `bg-state-low-confidence` / `text-state-low-confidence-fg` pair clears **≥ 4.5:1** in both themes. The neutral border may visually merge with neutral glass backdrops; this is intentional — the state is for diagnostic surfaces where the operator does not need it to "pop".

```
Given the component receives state="low-confidence"
When it mounts
Then it renders with classes "bg-state-low-confidence text-state-low-confidence-fg border border-border rounded-pill"
And it contains the lucide "circle-dashed" icon and the pt-BR text "Baixa confiança"
And aria-label="Estado de confiança: Baixa confiança"
And no Framer Motion animation runs
```

### 6.4 `disputed`

- **Visual:** orange pill with a git-fork icon and the pt-BR label "Em disputa". The colour is intentionally distinct from `uncertain` amber — disputed is louder. **No ambient motion** (the colour and icon are already loud enough — adding motion would compete with the uncertain pulse for attention).
- **Default label (pt-BR):** `"Em disputa"`
- **Lucide icon:** `git-fork`
- **Tokens (background + foreground + border):**
  - Background: `bg-state-disputed` (token `--color-state-disputed`)
  - Foreground: `text-state-disputed-fg` (token `--color-state-disputed-fg`)
  - Border (pair): `border border-border-disputed`
- **Motion:** none.
- **WCAG 2.2 AA contrast:** the `bg-state-disputed` / `text-state-disputed-fg` pair clears **≥ 4.5:1** in both themes.

```
Given the component receives state="disputed"
When it mounts
Then it renders with classes "bg-state-disputed text-state-disputed-fg border border-border-disputed rounded-pill"
And it contains the lucide "git-fork" icon and the pt-BR text "Em disputa"
And aria-label="Estado de confiança: Em disputa"
And no Framer Motion animation runs
```

### 6.5 `superseded`

- **Visual:** muted grey pill with an archive icon and the pt-BR label "Superado", rendered at **reduced opacity** to communicate "historical layer". When a badge transitions **into** this state while mounted, plays the `supersede` one-shot variant.
- **Default label (pt-BR):** `"Superado"`
- **Lucide icon:** `archive`
- **Tokens (background + foreground + border):**
  - Background: `bg-state-superseded` (token `--color-state-superseded`)
  - Foreground: `text-state-superseded-fg` (token `--color-state-superseded-fg`)
  - Border (pair): `border border-border-superseded`
- **Motion:** `motion.transition.supersede` is played **once** when the prop transitions `* → 'superseded'` while the badge is mounted. After it plays, the badge rests at the final state — opacity `0.45`, y translated `4 px`. Gated by `prefers-reduced-motion`.
- **WCAG 2.2 AA contrast:** the `bg-state-superseded` / `text-state-superseded-fg` pair clears **≥ 4.5:1** in both themes **at full opacity**. The post-transition resting opacity (`0.45`) lowers the effective contrast of the composite over the backdrop — this is **deliberate** (historical content should recede). For this state only, the AA contract is "the badge MUST remain *identifiable* at 0.45 opacity" — verified by `tokens.md §6.1` calibration against glass backdrop tokens. Consumers that render superseded badges in critical surfaces (e.g., the curation `correct_item` history) MUST wrap the badge in a Radix `Tooltip` to preserve discoverability.

```
Given the component receives state="superseded"
When it mounts (no prior state)
Then it renders with classes "bg-state-superseded text-state-superseded-fg border border-border-superseded rounded-pill"
And it contains the lucide "archive" icon and the pt-BR text "Superado"
And aria-label="Estado de confiança: Superado"
```

```
Given the component is mounted with state="accepted" and animate=true and motion is allowed
When the parent re-renders with state="superseded"
Then the badge plays the "motion.transition.supersede" variant once
And after the animation completes, it renders the superseded bg/text/border tokens, label "Superado", opacity 0.45, and y translate 4px
```

---

## 7. Motion contract

> All motion variants live in `frontend/src/lib/motion.ts` and are consumed via Framer Motion `variants`. The component never inlines `transition: {...}` literals — it only references the named variants.

### 7.1 The four variants

| Variant | Purpose | Animated properties | Duration / easing | Iteration | Token references |
|---|---|---|---|---|---|
| `motion.pulse.uncertain` | Ambient "provisional" hint while in `uncertain` | `opacity: 1 → 0.55 → 1` | `--duration-pulse` (2400 ms), `--ease-in-out` | infinite (loops while `state === 'uncertain'`) | `tokens.md §11.2` |
| `motion.transition.promote` | Played once on `uncertain → accepted` | `backgroundColor` (state-uncertain → state-accepted) **and** `scale: 1 → 1.06 → 1` | `--duration-moderate` (300 ms), `--ease-out-quint` | once | `tokens.md §11.2` |
| `motion.transition.supersede` | Played once on `* → superseded` | `opacity: 1 → 0.45` **and** `y: 0 → 4` (slide down into the historical layer) | `--duration-entrance` (500 ms), `--ease-in` | once | `tokens.md §11.2` |
| `motion.transition.merge` | Played once when consumer signals a node-merge collapse via `data-state-transition="merge"` | source: `x, y → target.x, target.y` and `opacity: 1 → 0`; target (surviving badge): `scale: 1 → 1.08 → 1` (absorb halo) | `--duration-entrance` (500 ms), `--ease-out-expo` | once | `tokens.md §11.2` |

### 7.2 Reduced-motion contract

- All four variants are **gated** by `@media (prefers-reduced-motion: no-preference)` at the CSS level, and additionally by a `useReducedMotion()` check at the component level (Framer Motion).
- When `prefers-reduced-motion: reduce` is reported, the badge:
  - Does **not** play the uncertain pulse — it renders the uncertain state statically.
  - Does **not** play promote / supersede / merge transitions — state changes are applied **instantly** (the bg/text/border tokens swap, opacity and y translate jump to the final value).
- The `animate` prop is **necessary but not sufficient**: `animate=true` AND `prefers-reduced-motion: no-preference` are both required for motion to run.
- The `animate` prop is **not a kill switch for state changes** — even with `animate=false`, prop changes still update the visual; only the in-between transition is skipped.

### 7.3 Promotion transition (uncertain → accepted)

```
Given the component is mounted with state="uncertain" and animate=true and motion is allowed
When the parent re-renders with state="accepted"
Then the badge plays the "motion.transition.promote" variant once
And after the animation completes, it renders the accepted bg/text/border tokens and label "Aceito"
And the uncertain pulse stops
```

### 7.4 Merge transition (two badges → one)

```
Given two StateBadge instances are rendered (source and target of a node merge)
And the consumer triggers a merge by setting data-state-transition="merge" on both and providing the target coordinates
And animate=true and motion is allowed
When the merge variant plays
Then the source badge translates toward the target coordinates, fades to opacity 0
And the target badge scales 1 → 1.08 → 1 once (the "absorb" halo)
And after the animation completes, the source badge is removed from the DOM by its consumer
```

> The merge variant is **driven by the consumer** (the graph merge controller) — the badge only renders the visual when signaled via the `data-state-transition` attribute. The badge does not "know about" the other badge.

---

## 8. Storybook stories

> Files live at `frontend/src/components/ds/StateBadge/StateBadge.stories.tsx`. Every visual permutation gets a story; transitions are demonstrated by a controllable story.

| Story | Purpose | Args / interaction |
|---|---|---|
| `Default` | The five states in a row at default size | renders all 5 (`accepted`, `uncertain`, `low-confidence`, `disputed`, `superseded`) side-by-side |
| `Accepted` | Single accepted badge | `state="accepted"` |
| `Uncertain` | Single uncertain badge with the ambient pulse running | `state="uncertain"`, `animate=true` |
| `LowConfidence` | Single low-confidence badge (diagnostic surface example) | `state="low-confidence"` |
| `Disputed` | Single disputed badge | `state="disputed"` |
| `Superseded` | Single superseded badge at the resting historical opacity | `state="superseded"` |
| `Sizes` | `sm` and `md` of each state in a 5×2 grid | renders the 10 combinations |
| `IconOnly` | `iconOnly=true` row of the 5 states | demonstrates the dense / table-cell variant; `aria-label` is asserted by `addon-a11y` |
| `CustomLabel` | A single badge with `label="Validado"` overriding the default `"Aceito"` | demonstrates label override |
| `ReducedMotionStatic` | Uncertain badge with a global decorator that simulates `prefers-reduced-motion: reduce` | static rendering, no pulse |
| `PromoteTransition` | Interactive — a button toggles `state` between `uncertain` and `accepted` | plays `motion.transition.promote` on each transition |
| `SupersedeTransition` | Interactive — a button toggles `state` between `accepted` and `superseded` | plays `motion.transition.supersede` |
| `MergeTransition` | Two badges side-by-side; pressing the action triggers `data-state-transition="merge"` on both | plays `motion.transition.merge` |
| `OnGlassPanel` | The 5 states rendered on a `bg-surface-glass-panel` backdrop | visual sanity check against the typical surface |
| `LightTheme` | The 5 states rendered with `data-theme="light"` on the story root | exercises the light token override |

> Every story (except the interactive transitions) is also a Vitest component test via `addon-vitest` browser mode (`@vitest/browser` + Playwright). `addon-a11y` runs against every story to verify WCAG 2.2 AA rules.

---

## 9. Accessibility Contract (WCAG 2.2 AA)

| Requirement | Implementation |
|---|---|
| Label | `aria-label="Estado de confiança: <pt-BR label>"` is always present, even when `iconOnly=true`. The label uses the resolved label (custom `label` prop if provided, otherwise the per-state default from `STATE_LABELS`). |
| Role | The root element is a `<span>` (`role` defaults to `text`); **not** `role="status"` — the badge is **not** a live region. When state changes, the consumer announces it (or doesn't) — that is consumer policy. |
| Keyboard | None — the badge is non-interactive by default. If wrapped in a `<button>` or anchor by a consumer, the wrapping element handles focus and keyboard. |
| Focus management | Not applicable — non-interactive. The lucide icon is `aria-hidden="true"` (decorative); the visible label and `aria-label` carry meaning. |
| ARIA states | None applicable — the badge has no `expanded`/`busy`/`selected` semantic. The `state` is communicated by `aria-label`. |
| Contrast (badge interior) | Every `(bg-state-* + text-state-*-fg)` pair MUST clear **WCAG 2.2 AA ≥ 4.5:1** on both themes — tested against `tokens.md §6.1` in unit + Storybook a11y tests. |
| Contrast (over backdrop) | The badge is designed to sit on glass surfaces (`surface-glass-ambient`, `surface-glass-panel`, `surface-glass-modal`) and the solid `bg-surface`. The tinted badge background isolates the interior — contrast is measured **inside the badge**, not against the backdrop. The `superseded` resting opacity (0.45) is the only exception — see §6.5. |
| Reduced motion | All four motion variants gated by `@media (prefers-reduced-motion: no-preference)` AND by Framer Motion's `useReducedMotion()` — when reduced, the badge renders statically and prop changes are applied without animation. |
| Target size | Not applicable — non-interactive. When wrapped in an interactive element, the wrapper enforces ≥ 32 px tap target. |
| Information conveyed by colour | Colour is **never** the only signal — every state carries (1) a distinct lucide icon and (2) a distinct pt-BR label. The icon-only variant still exposes the label via `aria-label`. |

### 9.1 Keyboard scenario — non-interactive

```
Given the component renders with no onClick or tabIndex
When the user presses Tab
Then focus moves past the badge to the next focusable element in tab order
And no focus ring appears on the badge (it is non-interactive)
```

> When a consumer wraps the badge in a button, the button (not the badge) participates in tab order and shows the focus ring via `--color-border-focus`.

---

## 10. React 19 ref-as-prop contract

> Mandatory across the design system (`CLAUDE.md` "Component contract"): React 19 passes `ref` as a normal prop — `forwardRef` is **prohibited**.

- The component signature is `function StateBadge({ ref, ...rest }: StateBadgeProps)` — `ref` is destructured from props and attached to the root `<span>`.
- The `ref` type is `React.Ref<HTMLSpanElement>` — narrowed to the actual root element type, not `Ref<HTMLElement>` or `unknown`.
- The component does **not** wrap with `forwardRef`. Any reviewer or lint rule that sees `forwardRef` in this file MUST reject the change.
- Consumers attach a ref with the standard React syntax: `<StateBadge ref={badgeRef} state="accepted" />`. No `useImperativeHandle` exists; only the underlying DOM node is exposed.

### 10.1 BDD scenario — ref forwards to the root element

```
Given a consumer creates a useRef<HTMLSpanElement>(null) and passes it as ref to <StateBadge state="accepted" />
When the component mounts
Then the ref's `.current` is the root <span> element of the badge
And the consumer can call standard DOM methods on it (getBoundingClientRect, focus is NOT applicable because the span is non-focusable)
```

---

## 11. `cn()` className merge contract

> Mandatory (`CLAUDE.md` "Component contract"): every shared UI component merges `className` via `cn()` — never via string concatenation or template literals.

- `cn()` is the project utility at `frontend/src/lib/cn.ts`, composed of `clsx` + `tailwind-merge`.
- The component composes its base classes (from the CVA factory) and any consumer-passed `className` via a single `cn()` call: `cn(stateBadgeVariants({ state, size }), className)`.
- `tailwind-merge` resolves conflicts deterministically — if a consumer passes `className="rounded-md"`, it overrides the default `rounded-pill`; if a consumer passes `className="bg-primary"`, it overrides `bg-state-accepted`. This is **intentional** — the design system allows surface overrides but expects them to be rare and reviewed.
- **Forbidden patterns** (rejected by lint):
  - `` className={`${baseClasses} ${className}`} `` — string concatenation.
  - `className={baseClasses + " " + className}` — operator concatenation.
  - Manually written `Array.join(" ")` over class arrays — use `cn()` instead.

### 11.1 BDD scenario — className override

```
Given a consumer renders <StateBadge state="accepted" className="rounded-md shadow-md" />
When the component mounts
Then the root <span> has `rounded-md` (overriding the default `rounded-pill` via tailwind-merge)
And the root <span> has `shadow-md` (additive — no conflict)
And the root <span> retains `bg-state-accepted` and `text-state-accepted-fg` (no conflict with the consumer's classes)
```

---

## 12. Do / Don't

| Do | Don't |
|---|---|
| Pass the `state` directly from a BFF response field (mapped at the boundary) | Pass a `confidence` number and derive the state inside the badge — the badge never thresholds |
| Wrap the badge in a Radix `Tooltip` if you need a "why" explanation (later wave) | Add `onClick` to the badge itself — wrap it in a `<button>` if interaction is needed (separation of concerns) |
| Use `size="sm"` inside table rows and search-result cards | Mix `size` values within the same list — pick one per surface |
| Use `iconOnly` only when the surface already shows the full state name elsewhere | Use `iconOnly` in a curation card — operator decisions require the full label |
| Let `animate` stay `true`; trust `prefers-reduced-motion` to silence motion when needed | Force `animate=false` to "be safe" — that masks the uncertain pulse, which is the whole point of the state |
| Use `border border-border-<state>` (both halves of the pair) | Use `border-border-<state>` alone — the border vanishes silently (Tailwind v4 two-namespace gotcha) |
| Pass `state` from the BFF's `effective_status` + flags | Render `low-confidence` in user-facing surfaces — it appears only in diagnostic UIs (`/history` run detail) |
| Pass `ref` as a normal prop | Wrap with `forwardRef` — React 19 deprecates it for new code |
| Pass extra classes via `className` (merged via `cn()`) | Concatenate `className` with string interpolation — always use `cn()` |

---

## 13. Internal Dependencies

| Component / Module | Source | Usage |
|---|---|---|
| `motion.pulse.uncertain` | `frontend/src/lib/motion.ts` (`tokens.md §11.2`) | Ambient pulse loop when `state="uncertain"` and motion is allowed |
| `motion.transition.promote` | `frontend/src/lib/motion.ts` (`tokens.md §11.2`) | Played once when the prop transitions `uncertain → accepted` |
| `motion.transition.supersede` | `frontend/src/lib/motion.ts` (`tokens.md §11.2`) | Played once when the prop transitions `* → superseded` |
| `motion.transition.merge` | `frontend/src/lib/motion.ts` (`tokens.md §11.2`) | Played once when the consumer signals a merge via `data-state-transition="merge"` |
| `cn()` | `frontend/src/lib/cn.ts` (`front.md §6.4`) | Merging `className` |
| `cva()` | `class-variance-authority` (`front.md §6.3`) | CVA factory for the `size` × `state` matrix (≥ 2 visual variants per axis) |
| `lucide-react` icons | `lucide-react` package (`front.md §11`) | Five icons: `check-circle-2`, `help-circle`, `circle-dashed`, `git-fork`, `archive` |
| Framer Motion | `framer-motion` package | `<motion.span>` root + `useReducedMotion()` |
| Tokens (colours, radius, spacing, border, motion) | `design-system/tokens.md §6, §7, §8, §11` | All visual values |

> **No imports from any feature module.** The badge is a foundation atom; it knows nothing about graph, search, ingest, curation, or history.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-18 | Spec Writer | initial | Foundation atom — one variant per confidence state (accepted / uncertain / low-confidence / disputed / superseded), two sizes (sm/md), uncertain pulse + three transition variants (promote / supersede / merge) consumed from `lib/motion.ts`. pt-BR labels in source; React 19 ref-as-prop; semantic tokens only. | -- |
| 1.1.0 | 2026-06-18 | Spec Writer | minor | Authoritative rewrite: per-state subsections with visual / token / WCAG / BDD content; explicit motion contract (§7); Storybook stories list (§8); explicit React 19 ref-as-prop contract (§10); explicit `cn()` className merge contract (§11); aligned to the canonical `.component.spec.md` template structure (omitted Events Emitted per template rule — pure display component with no callbacks). | -- |
