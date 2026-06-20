# Design System Rules — Remember (compact summary)

> Source: `docs/specs/front/design-system/` (tokens.md, composition.md, components.md, implementation.md)
> Version: 1.1.0 | Status: draft

---

## 1. Mandatory Token Rules

### 1.1 Semantic tokens only — no raw values

```
bg-primary          text-content          text-muted
bg-surface          text-body             text-content-inverse
bg-elevated         text-action           text-state-accepted
bg-input            text-state-uncertain  text-state-disputed
bg-surface-glass-ambient / -panel / -modal
border border-border-glass   border border-border-error
rounded-md / rounded-lg / rounded-xl
gap-xs / gap-sm / gap-md / gap-lg / gap-xl
p-xs / p-sm / p-md / p-lg / p-xl
shadow-glass / shadow-glass-heavy
z-backdrop / z-base / z-panel / z-drawer / z-popover / z-frame / z-modal / z-toast
```

**No arbitrary values** — `w-[347px]`, `p-[13px]` are forbidden. Use spacing tokens.

### 1.2 Two-namespace border rule (LOAD-BEARING)

Tailwind v4 separates border **color** (`--color-border-*`) from border **width** (`--border-*`).

```
border border-border-glass      ✓ — width=1px (default), color=glass token
border-2 border-border-error    ✓ — width=2px, color=error token
border-border-glass             ✗ — color only, width=0 → border invisible silently
```

**Every border must write both width utility AND color utility.**

### 1.3 Background from `--color-surface-glass-*` namespace

`bg-surface-glass-*` generates only from `--color-surface-glass-*` tokens. Do NOT use `--surface-glass-*` (missing `color-` prefix) — those emit no `bg-*` utility.

---

## 2. Component Contract Rules

### 2.1 Every exported component MUST

- Accept `className` and merge via `cn()` (`tailwind-merge` + `clsx`) — never string concatenation.
- Accept `ref` as a normal prop (React 19) — **`forwardRef` is forbidden**.
- Consume semantic tokens only — no raw values.
- Use CVA only when there are 2+ visual variants.
- Follow file structure: `Component.tsx` + `Component.types.ts` + `index.ts`.

### 2.2 Motion rules (one mandatory rule)

All motion variants are exported from `lib/motion.ts`. No component inlines its own `animate={}` / timing curves. Adding new motion = new factory in `lib/motion.ts`, not inline.

`prefers-reduced-motion` gating is ad hoc / per-author choice (not a project rule since 2026-06-19).

### 2.3 Data fetching

- `fetch` / `axios` called directly inside a component: **forbidden**.
- `useEffect` for data fetching: **forbidden**.
- All server data lives in TanStack Query hooks in `features/<x>/api/`.

---

## 3. Glass Material Levels

| Level | Token class | Blur | Use |
|---|---|---|---|
| `ambient` | `bg-surface-glass-ambient` | `backdrop-blur-sm` | Header, footer, Composer, banners |
| `panel` | `bg-surface-glass-panel` | `backdrop-blur-md` | Filter panels, graph stub, side panels |
| `modal` | `bg-surface-glass-modal` | `backdrop-blur-lg` | ChatBubble surface, dialogs, command palette |

`GlassSurface level="modal"` picks the heaviest material. It does NOT imply `role="dialog"` or focus trap. `ChatBubble` uses `level="modal"` at `z-base`.

---

## 4. Z-index Scale

```
z-backdrop (-1)  z-base (0)   z-panel (10)  z-drawer (20)
z-popover (30)   z-frame (40)  z-modal (50)  z-toast (60)
```

`ChatBubble` is always `z-base`. `ConversationMenu` dropdown is `z-popover` (Radix). Delete dialog is `z-modal` (Radix). Header/footer are `z-frame`.

---

## 5. Chat-Specific Rules

| Rule | Rationale |
|---|---|
| `MessageStream` root: `aria-live="polite"` + `aria-busy="true"` while loading/streaming | One live region for all updates; `aria-busy` must clear after state change |
| `StreamingCursor` always `aria-hidden="true"` | Cursor is decorative; AT uses `aria-busy` on the region |
| `ChatBubble` at `z-base` only — never `z-modal` | Bubbles are workspace content, not overlays |
| SSE via `fetch + getReader` — never `EventSource` | `EventSource` cannot POST with `Authorization` header |
| `Idempotency-Key`: `crypto.randomUUID()` per send | Prevents duplicate turns on retry |
| Composer `Enter` → submit; `Shift+Enter` → newline; `Esc` during streaming → abort | Document-level `keydown` for Esc (textarea is disabled in stop mode) |
| History bubbles: `animate={false}` | No cascade animation on mounting a full conversation history |

---

## 6. Accessibility Floors

| Requirement | Value |
|---|---|
| Contrast | WCAG 2.2 AA: ≥ 4.5:1 normal text, ≥ 3:1 large text / icons — on glass over backdrop, both themes |
| Target size | ≥ 32 px (project floor). Chat conversation items: `min-h-10` (40 px) |
| Keyboard | Every action reachable via Tab + Enter / Space |
| Focus ring | `border-border-focus ring-2 ring-offset-2` — never obscured |
| Labels | Every input has a programmatic label (`<label>` or `aria-label`) |
| Error state | `aria-invalid="true"` + `aria-describedby` pointing at error message |

---

## 7. Forbidden Patterns

```
forwardRef                   → ref is a normal prop (React 19)
@media queries for layout    → use Tailwind named breakpoints + container queries
className string concat      → use cn() (tailwind-merge + clsx)
raw values in className      → use semantic tokens
fetch/axios in component     → use features/<x>/api/ hook
useEffect for data           → use TanStack Query
export * barrels (project-wide) → per-component index.ts only (single component surface)
z-modal on ChatBubble        → bubbles are z-base
role="dialog" on ChatBubble  → no ARIA modal semantics on bubbles
EventSource for SSE POSTs    → use fetch + getReader
zodResolver from @hookform   → Zod v4 incompatibility; use safeParse-based resolver
```

---

## Changelog

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0.0 | 2026-06-18 | Front Spec Agent | Initial foundation rules: tokens, glass levels, z-index, component contract, motion. |
| 1.1.0 | 2026-06-20 | Front Spec Agent | Chat wave: added §3 glass levels detail (ChatBubble at z-base), §5 chat-specific rules (SSE, streaming, idempotency), §6 a11y floors (streaming checklist), §7 forbidden patterns (EventSource, zodResolver). |
