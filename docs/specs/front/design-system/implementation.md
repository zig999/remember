# Design System — Implementation (Remember)

> Part of: `docs/specs/front/design-system/` | Layer: permanent
> Index: [`_index.md`](./_index.md)
> Version: 1.0.0 | Status: draft

---

## 1. Accessibility QA Checklist

### 1.1 Global rules

- [ ] **WCAG 2.2 AA contrast** — text on any surface (glass over backdrop, glass over glass) clears ≥ 4.5:1 for normal text, ≥ 3:1 for large text and icons. Both themes verified.
- [ ] **Target size** — all interactive elements ≥ 32 px (project floor; conversation menu items use `min-h-10` = 40 px).
- [ ] **Keyboard reachable** — every action reachable via `Tab` + `Enter` / `Space`. No mouse-only affordances.
- [ ] **Focus visible** — focus ring uses `border-border-focus` + `ring-2 ring-offset-2`. Never obscured by glass overlays or header/footer.
- [ ] **Skip-to-content** — `__root` provides a skip link before the header.
- [ ] **No `forwardRef`** — `ref` is passed as a normal prop (React 19). All DS atoms comply.

### 1.2 Chat-specific checklist

- [ ] `MessageStream` root `<section aria-live="polite">` — live region present and scoped.
- [ ] `aria-busy="true"` set on the `MessageStream` section during loading (UI-02) AND during streaming (UI-04). NOT left stuck after state transitions.
- [ ] `StreamingCursor` `aria-hidden="true"` — cursor never announced by AT.
- [ ] `ChatBubble` streaming: `aria-busy="true"` on bubble wrapper while streaming; removed when `streaming` flips false.
- [ ] `ChatBubble` error state: `GlassSurface accent="error"` (border only — no ARIA role change; error is conveyed visually; the `content` prop provides the text message).
- [ ] `Composer` textarea: `<label htmlFor=… className="sr-only">` present; `aria-invalid` set when validation error; `aria-describedby` points at message paragraph.
- [ ] `Composer` send/stop buttons: explicit `aria-label` on icon-only buttons.
- [ ] `Composer` Esc → abort: document-level `keydown` listener — not textarea-level (textarea is `disabled` in stop mode).
- [ ] `ConversationMenu` trigger: `aria-label="Conversas — {title}"`.
- [ ] `ConversationMenu` inline rename: `role="group"`, `aria-label="Renomeando …"` on the container; `aria-label` on input.
- [ ] `ConversationMenu` delete dialog: `DialogDescription` linked to `aria-describedby`; focus trap via Radix Dialog; focus returns to trigger after close.
- [ ] `ToolCallChip` `role="status"` + `aria-label="{tool} — {status}"` (pt-BR).
- [ ] `UsageBadge` `role="status"` + `aria-label="Uso: …"` (pt-BR).
- [ ] Skeleton rows in `MessageStream`: `role="presentation"` (no AT announcements during load).
- [ ] `ErrorBanner` (history fetch failure): `role="alert"` (announces immediately).

---

## 2. Animation Guidelines

### 2.1 Motion factories in `lib/motion.ts`

All motion variants are exported from `lib/motion.ts`. No component inlines its own `animate={…}` / timing curves (rule from `front.md §9.2`).

| Factory | Used by | Effect |
|---|---|---|
| `transitionGlassPanel` | `GlassSurface level="panel"` | Fade-in + slight scale on panel open |
| `transitionGlassModal` | `GlassSurface level="modal"`, `ChatBubble` | Fade-in + slight upward scale — same as Dialog opening |
| `motion.pulse.uncertain` | `StateBadge` (uncertain state) | Slow opacity oscillation |
| `motion.transition.promote` | `StateBadge` (uncertain→accepted) | Color morph + halo collapse |
| `motion.transition.supersede` | Graph node (superseded state) | Fade to grey + slide |
| `motion.transition.merge` | Graph nodes (merge operation) | Collapse + edge re-anchor |

### 2.2 Decorative motion

Per `front.md §9` (owner-directed 2026-06-19): decorative motion is allowed and encouraged. The `StreamingCursor` blink and `ToolCallChip` spinner are decorative — CSS animations (`cursor-blink` keyframe, `animate-spin`) are appropriate for these small, single-property effects.

### 2.3 `prefers-reduced-motion`

Not a mandatory project rule (removed 2026-06-19). Gating is per-component, ad hoc. Current components that gate:

- `ChatBubble` — gates the entrance animation via `useReducedMotion()`.
- `MessageStream` autoscroll — downgrades smooth→auto when `useReducedMotion() === true`.
- `StreamingCursor` — gated via `motion-safe:` Tailwind variant on the blink keyframe.
- `GlassSurface` — gates its own entrance animation.

---

## 3. Known Implementation Constraints and Gotchas

### 3.1 Tailwind v4 — two border namespaces

`--color-border-*` (color) and `--border-*` (width) are **distinct namespaces**. Mixing them makes the border silently disappear. Every border must be written as the pair:

```
border border-border-glass       ✓  width=1px (default), color=glass token
border-2 border-border-error     ✓  width=2px, color=error token
border-border-glass              ✗  color only — width defaults to 0
```

### 3.2 `GlassSurface level="modal"` ≠ modal in ARIA

`ChatBubble` uses `GlassSurface level="modal"` to get the heaviest glass material. This does NOT imply `role="dialog"`, focus trap, or `z-modal`. Consumers MUST NOT add those — the bubble is at `z-base` in the workspace flow.

### 3.3 Zod v4 + `@hookform/resolvers` incompatibility

`Composer` uses a custom `safeZodResolver` that wraps `schema.safeParse()` instead of using `@hookform/resolvers/zod`. The v4 resolver inspects `ZodError.errors` (renamed to `.issues` in v4) and silently re-throws, causing unhandled rejections on every invalid submit. The inline `safeParse` wrapper avoids this entirely. Do not use `zodResolver` from `@hookform/resolvers` until the package is updated for Zod v4.

### 3.4 SSE client — EventSource limitation

`EventSource` (native browser API) cannot send `POST` requests with `Authorization` headers. The chat feature uses `fetch + getReader` instead. This is the correct pattern; do not substitute `EventSource`.

### 3.5 Tailwind `max-w-*` / spacing token collision (resolved)

Named spacing tokens (`--spacing-{xs,sm,md,lg,xl,2xl}`) shadow `max-w-*` / `min-w-*` container scale utilities. Fixed in `theme.css` via `--container-*` scale + unlayered `.max-w-*` / `.min-w-*` overrides. See `CLAUDE.md` "Known Gotchas". Do not use `@utility` for this fix.

### 3.6 Sonner toast base styles — unlayered cascade

Sonner's base styles are unlayered — they beat Tailwind `@layer utilities` regardless of specificity. For glass toast customization, use `sonner` CSS variables + inline `box-shadow` (not Tailwind utility classes on the toast root). See MEMORY.md "Tailwind v4 color-namespace utilities" for the AppToaster pattern.

---

## 4. QA Test Viewports

Per `CLAUDE.md` responsive rules:

| Viewport | Tailwind breakpoint | Expected chat layout |
|---|---|---|
| 320 px | base/mobile | Columns stacked (chat full-width, graph below) |
| 768 px | `md` | Columns stacked (container below `@lg`) |
| 1024 px | `lg` | Two-column 40%/60% split active (`@lg` container query) |
| 1440 px | `xl` / `2xl` | Two-column 40%/60% split |

Note: the split is a **container query** on `ChatWorkspace`, not a viewport media query. The 1024px column switch point is when the *workspace container* (not the viewport) crosses the `lg` threshold.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Initial implementation doc: accessibility checklist (global + chat), animation guidelines, known gotchas (border namespaces, GlassSurface ARIA, Zod v4 resolver, SSE, max-w collision, Sonner), QA viewports. |
