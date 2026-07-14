# Design System Rules — Remember (compact summary)

> Source: `docs/specs/front/design-system/` (tokens.md, composition.md, components.md, implementation.md)
> Version: 2.0.0 | Status: draft

> ## ⚠ v2.0 — design system migrado para o UI-Kit (TUI)
> O contrato base de tokens (cores/tipografia/fontes/radius/sombra) vem do **kit** (submodule
> `vendor/ui-kit`), consumido em `theme.css`. **Autoridade:** [`design-system/tokens.md`](./design-system/tokens.md) §Migração.
> Mudou: fontes → **JetBrains Mono única**; escala tipográfica → **Tailwind built-in** (base 16px);
> cores → **phosphor**; radius **0**; **flat** (sem sombra); **glass achatado**; `state/node/link`
> **remapeados p/ accents do TUI**. As regras de contrato/border/motion/z-index/feature/a11y abaixo
> permanecem válidas; os nomes de token de **cor/tipografia** foram atualizados (§1.1, §3).

---

## 1. Mandatory Token Rules

### 1.1 Semantic tokens only — no raw values

```
# Contrato base (do kit): superfícies + texto + ação
bg-background / bg-surface / bg-elevated / bg-muted / bg-hover / bg-input
text-foreground / text-muted-foreground / text-accent
bg-primary / text-primary-foreground / bg-destructive / bg-warning / text-info / text-success
# Domínio (eternal) — catálogos em tokens.md §3–§4; cores REMAPEADAS p/ accents do TUI
text-state-{accepted,uncertain,low-confidence,disputed,superseded}[-fg]
bg-state-* / bg-node-* / stroke-link-*
# Borda (cor + largura), radius=0 (sem pill), FLAT (sem shadow), glass achatado
border border-border / border-border-strong / border-border-focus
rounded-{sm,md,lg,xl}(=0)   (sem shadow-*; sem rounded-pill)
# Tipografia: escala built-in do Tailwind + peso/tracking (base 16px, mono única)
text-{xs,sm,base,lg,xl,2xl,3xl,4xl}  font-{normal,medium,semibold,bold}  tracking-{tight,normal,wide}
# Layout / stacking / motion (mantidos)
gap-{xs..2xl}  p-{xs..2xl}  m-{xs..2xl}   max-w-{3xs…7xl} (→ --container-* §4.1)
z-{backdrop,base,panel,drawer,popover,frame,modal,toast}
duration-{instant,fast,moderate,entrance,pulse}   ease-{out,in,in-out,out-quint,out-expo,back}
```

**No arbitrary values** (`w-[347px]`, `p-[13px]`). Use spacing tokens.

### 1.2 Two-namespace border rule (LOAD-BEARING)

```
border border-border-glass      ✓  width=1px (default), color=glass token
border-2 border-border-error    ✓  width=2px, color=error token
border-border-glass             ✗  color only — width=0 → silently invisible
```

Every border must write **both** a width utility AND a color utility.

### 1.3 Background from `--color-surface-glass-*` namespace

`bg-surface-glass-*` generates only from `--color-surface-glass-*` tokens. `--surface-glass-*` (no `color-` prefix) emits no `bg-*` utility.

---

## 2. Component Contract Rules

### 2.1 Every exported component MUST

- Accept `className` and merge via `cn()` — never string concatenation.
- Accept `ref` as a normal prop (React 19) — **`forwardRef` is forbidden**.
- Consume semantic tokens only — no raw values.
- Use CVA only when there are 2+ visual variants.
- File structure: `Component.tsx` + `Component.types.ts` + `index.ts`.

### 2.2 Motion factories (all in `lib/motion.ts` — no inline variants)

| Factory | Consumer | Effect |
|---|---|---|
| `transitionGlassPanel` | `GlassSurface panel` | Fade-in + upward scale |
| `transitionGlassModal` | `GlassSurface modal`, `ChatBubble` | Fade-in + upward scale |
| `transitionCrtPowerOn(reduced)` | `SignInPanel` CRT wrapper | 4-phase CRT power-on; `reduced=true` → fade-in only (WCAG required) |
| `staggerContainer` / `listItem` | `SignInPanel` content | Stagger reveal |
| `motion.pulse.uncertain` | `StateBadge` uncertain | Slow opacity oscillation |
| `motion.transition.promote` | `StateBadge` uncertain→accepted | Color morph + halo |
| `motion.transition.supersede` | Graph node superseded | Fade + slide |
| `motion.transition.merge` | Graph nodes merge | Collapse + re-anchor |
| `motion.graph.nodeReveal` | Graph nodes entering canvas | Fade-in + scale-up reveal (`opacity: 0→1`, `scale: 0.85→1`) |

`prefers-reduced-motion` gating is ad hoc, **except `transitionCrtPowerOn`** — mandatory gate (WCAG 2.2 AA).

### 2.3 Data fetching (forbidden patterns)

- `fetch` / `axios` in component — use `features/<x>/api/` hook.
- `useEffect` for data — use TanStack Query.

---

## 3. Glass Material Levels

> ⚠ **v2.0 — glass agora é FLAT** (identidade terminal): os tokens `surface-glass-*` foram remapeados
> para superfícies **opacas** do kit e `--blur-glass-*` = **0** (sem translucidez/blur). Os níveis abaixo
> permanecem como distinção de *elevação/uso*, mas renderizam como painéis sólidos de borda. Ver `tokens.md §6`.

| Level | Token class | Blur (agora) | Use |
|---|---|---|---|
| `ambient` | `bg-surface-glass-ambient` (→ `surface`) | 0 | Header, footer, Composer |
| `panel` | `bg-surface-glass-panel` (→ `surface`) | 0 | Filter panels, **sign-in panel** |
| `modal` | `bg-surface-glass-modal` (→ `elevated`) | 0 | ChatBubble, dialogs, command palette |

Sign-in exception: `GlassSurface level="panel" animate={false}` — CRT wrapper controls entrance.

---

## 4. Z-index Scale

```
z-backdrop (-2)  z-veil (-1)    z-base (0)     z-panel (10)
z-chrome   (20)  z-drawer (25)  z-popover (30)
z-overlay  (40)  z-modal  (41)  z-toast  (50)
```

`ChatBubble` is always `z-base`. Radix manages `z-popover` (dropdown) and `z-modal` (Dialog). Header/footer are `z-chrome` (migration alias: `z-frame`).

---

## 5. Feature-Specific Rules

### 5.1 Chat

| Rule | Rationale |
|---|---|
| `MessageStream`: `aria-live="polite"` + `aria-busy="true"` while loading/streaming | One live region; `aria-busy` must clear after state change |
| `StreamingCursor`: `aria-hidden="true"` | Decorative |
| `ChatBubble`: `z-base` only — never `z-modal` | Workspace content |
| SSE: `fetch + getReader` — never `EventSource` | `EventSource` cannot POST with Authorization |
| `Idempotency-Key`: `crypto.randomUUID()` per send | Prevents duplicate turns |

### 5.2 Sign-in

| Rule | Rationale |
|---|---|
| `transitionCrtPowerOn` gate mandatory | WCAG 2.2 AA — scale transform covers full panel |
| `GlassSurface animate={false}` | No entrance competition with CRT wrapper (R4) |
| `SignInForm` uses `safeZodResolver` (safeParse) | `@hookform/resolvers/zod` incompatible with Zod v4 |
| `?redirect`: validate as same-origin relative path | Safety — reject external URLs; default `/chat` |
| `@stackframe/react` only in `features/auth/` | Narrow approved exception |
| Stay on Stack Auth (`@stackframe/react`) | R1 — JWKS/EdDSA; Better Auth is a separate migration |
| Email field: `autoFocus` on mount | Sign-in focus management |

### 5.3 Graph (floating edges + layout algorithms)

| Rule | Rationale |
|---|---|
| `GraphNodeAdapter` handles: `opacity-0 pointer-events-none` | Handles are RF routing endpoints only — visual attachment computed by `getEdgeParams` |
| `GraphEdgeAdapter`: call `useInternalNode(sourceId)` + `useInternalNode(targetId)` | Never use RF-injected `sourceX/Y/targetX/Y` — those come from fixed Handle offsets |
| `getEdgeParams` returns `null` → render nothing (not `{0,0}`) | Unmeasured nodes must not produce phantom edges at canvas origin |
| Layout algorithm stored as `layoutAlgorithm: 'force' \| 'tree' \| 'radial'` in `useGraphStore` | Single source of truth; `setLayoutAlgorithm` bumps `layoutNonce` → `useForceLayout` re-runs |
| All layout runners share signature `(nodeIds, linkPairs, pinnedPositions) → Map<string,{x,y}>` | Uniform pin contract — no runner skips the pin set |
| Tree/radial: spanning tree by BFS from highest-degree node; virtual super-root for forests | Cross-links (not in spanning tree) remain as floating edges |
| Algorithm Select options: `'force'` → 'Força', `'tree'` → 'Árvore', `'radial'` → 'Radial' | pt-BR labels; string literals in code (i18n disabled) |
| `getSnapshot` emits `version: 2` (adds `layout_algorithm`); `hydrate` reads v1 (default `'force'`) and v2 | Backward-compatible snapshot migration |
| `d3-hierarchy` bundled in `graph` manualChunk (`['@xyflow/react','d3-force','d3-hierarchy']`) | Co-located with d3-force; single lazy-loadable graph bundle |

---

## 6. Accessibility Floors

| Requirement | Value |
|---|---|
| Contrast | WCAG 2.2 AA: ≥ 4.5:1 normal, ≥ 3:1 large — on glass over backdrop, both themes |
| Target size | ≥ 32 px project floor. Chat items + sign-in button: `min-h-10` (40 px) |
| Keyboard | Every action reachable via Tab + Enter / Space |
| Focus ring | `border-border-focus ring-2 ring-offset-2` — never obscured |
| Labels | Every input has a programmatic label |
| Error state | `aria-invalid="true"` + `aria-describedby` → error message |
| Sign-in credential error | `role="alert"` |
| Sign-in session-expired notice | `role="status"` |

---

## 7. Forbidden Patterns

```
forwardRef               → ref is a normal prop (React 19)
@media for layout        → Tailwind breakpoints / container queries
className concat         → cn() only
raw values               → semantic tokens
fetch/axios in component → features/<x>/api/ hook
useEffect for data       → TanStack Query
export * barrels         → per-component index.ts only
z-modal on ChatBubble    → z-base
EventSource for SSE POST → fetch + getReader
zodResolver (@hookform)  → safeZodResolver (safeParse-based) — Zod v4 incompatibility
GlassSurface animate on sign-in → animate={false}; CRT wrapper controls entrance
Better Auth SDK          → stay on Stack Auth (@stackframe/react)
@stackframe/react outside features/auth/ → narrow exception only
Fixed Handle coords in GraphEdgeAdapter → use useInternalNode + getEdgeParams (floating)
getEdgeParams null path at {0,0} → render null (phantom-edge prevention)
Direct d3-hierarchy import outside useForceLayout runners → all layout in the hook module
```

---

## Changelog

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0.0 | 2026-06-18 | Front Spec Agent | Initial foundation rules: tokens, glass levels, z-index, component contract, motion. |
| 1.1.0 | 2026-06-20 | Front Spec Agent | Chat wave: glass levels detail, chat-specific rules, a11y floors, forbidden patterns. |
| 1.3.0 | 2026-06-23 | Front Spec Agent | Graph-improvement wave: §5.3 graph rules added (floating-edge contract, layout algorithm selector, pin set contract, BFS spanning tree, algorithm Select labels, snapshot v2); §7 graph forbidden patterns added. Synced to tokens.md — rule 12b compliant. |
| 1.2.0 | 2026-06-20 | Front Spec Agent | Auth/sign-in wave: §2.2 motion factories table (transitionCrtPowerOn + stagger); §3 glass sign-in panel exception; §5.2 sign-in specific rules; §6 a11y floors (sign-in items); §7 forbidden patterns (sign-in items). Synced to tokens.md — rule 12b compliant. |
