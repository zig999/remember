# Design System Rules — Remember (compact summary)

> Source: `docs/specs/front/design-system/` (tokens.md, composition.md, components.md, implementation.md)
> Version: 1.2.0 | Status: draft

---

## 1. Mandatory Token Rules

### 1.1 Semantic tokens only — no raw values

```
bg-primary / bg-surface / bg-elevated / bg-input / bg-overlay
bg-surface-glass-ambient / -panel / -modal    backdrop-blur-glass-sm / -md / -lg
text-content / text-body / text-muted / text-content-inverse
text-action / text-danger / text-warning / text-data
text-state-{accepted,uncertain,low-confidence,disputed,superseded}[-fg]
bg-state-* / bg-node-* / bg-link-* (full catalogs: tokens.md §6–§7)
border border-border-{glass,focus,error,accepted,uncertain,disputed,superseded}
rounded-{sm,md,lg,xl,pill}   shadow-{sm,md,lg,glass}
gap-{xs,sm,md,lg,xl,2xl}    p-{xs,sm,md,lg,xl,2xl}    m-{xs,sm,md,lg,xl,2xl}
max-w-{3xs…7xl}  (resolve to --container-* via unlayered override — §4.1)
z-{backdrop,base,panel,drawer,popover,frame,modal,toast}
duration-{instant,fast,moderate,entrance,pulse}
ease-{out,in,in-out,out-quint,out-expo,back}
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

`prefers-reduced-motion` gating is ad hoc, **except `transitionCrtPowerOn`** — mandatory gate (WCAG 2.2 AA).

### 2.3 Data fetching (forbidden patterns)

- `fetch` / `axios` in component — use `features/<x>/api/` hook.
- `useEffect` for data — use TanStack Query.

---

## 3. Glass Material Levels

| Level | Token class | Blur | Use |
|---|---|---|---|
| `ambient` | `bg-surface-glass-ambient` | `backdrop-blur-sm` | Header, footer, Composer |
| `panel` | `bg-surface-glass-panel` | `backdrop-blur-md` | Filter panels, **sign-in panel** |
| `modal` | `bg-surface-glass-modal` | `backdrop-blur-lg` | ChatBubble, dialogs, command palette |

Sign-in exception: `GlassSurface level="panel" animate={false}` — CRT wrapper controls entrance.

---

## 4. Z-index Scale

```
z-backdrop (-1)  z-base (0)  z-panel (10)  z-drawer (20)
z-popover (30)   z-frame (40)  z-modal (50)  z-toast (60)
```

`ChatBubble` is always `z-base`. Radix manages `z-popover` (dropdown) and `z-modal` (Dialog). Header/footer are `z-frame`.

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
```

---

## Changelog

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0.0 | 2026-06-18 | Front Spec Agent | Initial foundation rules: tokens, glass levels, z-index, component contract, motion. |
| 1.1.0 | 2026-06-20 | Front Spec Agent | Chat wave: glass levels detail, chat-specific rules, a11y floors, forbidden patterns. |
| 1.2.0 | 2026-06-20 | Front Spec Agent | Auth/sign-in wave: §2.2 motion factories table (transitionCrtPowerOn + stagger); §3 glass sign-in panel exception; §5.2 sign-in specific rules; §6 a11y floors (sign-in items); §7 forbidden patterns (sign-in items). Synced to tokens.md — rule 12b compliant. |
