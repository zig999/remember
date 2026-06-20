# Design System — Implementation (Remember)

> Part of: `docs/specs/front/design-system/` | Layer: permanent
> Index: [`_index.md`](./_index.md)
> Version: 1.1.0 | Status: draft

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

### 1.3 Sign-in checklist

- [ ] Email field has `<label htmlFor="login">` (visible label "Login" — not only `aria-label`).
- [ ] Password field has `<label htmlFor="senha">` (visible label "Senha").
- [ ] Both inputs set `aria-invalid="true"` + `aria-describedby="<error-id>"` on validation failure.
- [ ] Inline credential error uses `role="alert"` (announces immediately after sign-in failure).
- [ ] Session-expired notice uses `role="status"` (informational, not urgent).
- [ ] Submit button is `<button type="submit">` (keyboard-activatable via `Enter`).
- [ ] Loading spinner inside button is `aria-hidden="true"` (decorative); button text changes to "Entrando…".
- [ ] On mount, focus is placed on the email input (`autoFocus`).
- [ ] `transitionCrtPowerOn` applies `prefers-reduced-motion` contract: when `useReducedMotion()` is true, phases 1–3 are skipped; only a fade-in plays (WCAG 2.2 AA compliant).
- [ ] No header / footer / skip-to-content on `/sign-in` (chrome is absent; skip-to-content not needed).

---

## 2. Animation Guidelines

### 2.1 Motion factories in `lib/motion.ts`

All motion variants are exported from `lib/motion.ts`. No component inlines its own `animate={…}` / timing curves (rule from `front.md §9.2`).

| Factory | Used by | Effect |
|---|---|---|
| `transitionGlassPanel` | `GlassSurface level="panel"` | Fade-in + slight scale on panel open |
| `transitionGlassModal` | `GlassSurface level="modal"`, `ChatBubble` | Fade-in + slight upward scale — same as Dialog opening |
| `transitionCrtPowerOn` | `SignInPanel` (CRT wrapper) | 4-phase CRT "power-on" entrance; reduced-motion fallback = fade-in only |
| `motion.pulse.uncertain` | `StateBadge` (uncertain state) | Slow opacity oscillation |
| `motion.transition.promote` | `StateBadge` (uncertain→accepted) | Color morph + halo collapse |
| `motion.transition.supersede` | Graph node (superseded state) | Fade to grey + slide |
| `motion.transition.merge` | Graph nodes (merge operation) | Collapse + edge re-anchor |

### 2.2 `transitionCrtPowerOn` — specification

**Location:** `src/lib/motion.ts` (new export — sign-in wave)
**Consumer:** `SignInPanel` wraps the `GlassSurface` in a `motion.div` using this factory.
**Purpose:** Decorative entrance that evokes "CRT TV powering on" — reinforces the technological aesthetic.

**Phases (full motion):**

| Phase | Duration | Properties | Easing |
|-------|----------|-----------|--------|
| 1 — Ignição (dot) | ~120 ms | `scaleX: 0.02 → 0.02`, `scaleY: 0.02`, `opacity: 0.7 → 1.0` | `ease-out` |
| 2 — Varredura H (horizontal line) | ~180 ms | `scaleX: 0.02 → 1.0`, `scaleY: 0.02`, `opacity: 1.0` | `ease-out-expo` |
| 3 — Abertura V (full panel) | ~240 ms | `scaleX: 1.0`, `scaleY: 0.02 → 1.0` | `ease-out-expo` |
| 4 — Conteúdo (stagger) | ~300 ms | `staggerContainer` + `listItem` on welcome text, form fields, button | `ease-out` |

**Token references:** `--duration-fast` (200ms), `--duration-moderate` (300ms), `--ease-out-expo`, `--ease-out`.
**`transform-origin`:** `center center` (the panel opens from its center, as a real CRT).
**`prefers-reduced-motion` contract (mandatory — WCAG 2.2 AA):**

```ts
// Pseudocode — implementation confirmed at dev time against pinned @stackframe/react
export function transitionCrtPowerOn(reduced: boolean) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2, ease: /* ease-out */ },
    };
  }
  return {
    initial: { scaleX: 0.02, scaleY: 0.02, opacity: 0.7 },
    animate: {
      opacity: 1,
      scaleX: [0.02, 1, 1],
      scaleY: [0.02, 0.02, 1],
    },
    transition: {
      duration: 0.54,
      times: [0, 0.45, 1],
      ease: /* ease-out-expo */,
    },
  };
}
```

**`reduced` argument:** the factory accepts a boolean. Consumers pass `useReducedMotion()` from Framer Motion (or read `window.matchMedia("(prefers-reduced-motion: reduce)").matches`).

**Note on GlassSurface entrance (R4):** `SignInPanel` wraps the `GlassSurface` in the CRT `motion.div` AND passes `animate={false}` to `GlassSurface` so GlassSurface's own entrance does not compete. The CRT wrapper is the sole entrance authority for the sign-in panel.

### 2.3 Decorative motion

Per `front.md §9` (owner-directed 2026-06-19): decorative motion is allowed and encouraged. The `StreamingCursor` blink, `ToolCallChip` spinner, and `transitionCrtPowerOn` are all decorative — they reinforce aesthetic and UX, not domain state changes. CSS animations (`cursor-blink` keyframe, `animate-spin`) are appropriate for small, single-property effects.

### 2.4 `prefers-reduced-motion`

Not a mandatory project rule (removed 2026-06-19). Gating is per-component, ad hoc. Current components that gate:

- `ChatBubble` — gates the entrance animation via `useReducedMotion()`.
- `MessageStream` autoscroll — downgrades smooth→auto when `useReducedMotion() === true`.
- `StreamingCursor` — gated via `motion-safe:` Tailwind variant on the blink keyframe.
- `GlassSurface` — gates its own entrance animation.
- **`transitionCrtPowerOn`** — **mandatory gate** (WCAG 2.2 AA): when reduced motion is preferred, phases 1–3 (scale transforms) are replaced with a simple fade-in only.

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

> **Sign-in applies the same pattern:** `SignInForm` must use a `safeZodResolver` (same as Composer), NOT `zodResolver` from `@hookform/resolvers`.

### 3.4 SSE client — EventSource limitation

`EventSource` (native browser API) cannot send `POST` requests with `Authorization` headers. The chat feature uses `fetch + getReader` instead. This is the correct pattern; do not substitute `EventSource`.

### 3.5 Tailwind `max-w-*` / spacing token collision (resolved)

Named spacing tokens (`--spacing-{xs,sm,md,lg,xl,2xl}`) shadow `max-w-*` / `min-w-*` container scale utilities. Fixed in `theme.css` via `--container-*` scale + unlayered `.max-w-*` / `.min-w-*` overrides. See `CLAUDE.md` "Known Gotchas". Do not use `@utility` for this fix.

> **Sign-in panel width:** `max-w-md` on `SignInPanel` resolves correctly to `--container-md` = 28rem (via the unlayered override). Do not use `max-w-[28rem]`.

### 3.6 Sonner toast base styles — unlayered cascade

Sonner's base styles are unlayered — they beat Tailwind `@layer utilities` regardless of specificity. For glass toast customization, use `sonner` CSS variables + inline `box-shadow` (not Tailwind utility classes on the toast root). See MEMORY.md "Tailwind v4 color-namespace utilities" for the AppToaster pattern.

### 3.7 `@stackframe/react` SDK — method names (R2)

Exact method names (`signInWithCredential`, `getAuthJson`, or equivalent) must be confirmed against the pinned version of `@stackframe/react` at implementation time. The spec describes the functional contract: call the SDK's email+password sign-in method → extract the JWT → pass to `useAuthStore.setToken()`. Do not hardcode method names from the spec into code without verifying the installed package's API.

### 3.8 Stack Auth legado vs Better Auth (R1)

The project uses **Stack Auth** (JWKS/EdDSA, `NEON_AUTH_URL`). Neon Auth's new implementation ("Better Auth") has different client methods. Do NOT use Better Auth methods on the assumption of documentation currency. Stay on Stack Auth; any migration is a separate, backend-affecting wave.

---

## 4. QA Test Viewports

Per `CLAUDE.md` responsive rules:

| Viewport | Tailwind breakpoint | Expected layout |
|---|---|---|
| 320 px | base/mobile | `/sign-in` panel: full-width minus `p-lg` padding; stacks vertically. `/chat`: columns stacked. |
| 768 px | `md` | `/sign-in` panel: `max-w-md` (28rem) centered. `/chat`: columns stacked (container below `@lg`). |
| 1024 px | `lg` | `/sign-in` panel: `max-w-md` centered. `/chat`: two-column 40%/60% split active. |
| 1440 px | `xl` / `2xl` | `/sign-in` panel: `max-w-md` centered. `/chat`: two-column 40%/60% split. |

Note: the chat split is a **container query** on `ChatWorkspace`, not a viewport media query. The 1024px column switch point is when the *workspace container* (not the viewport) crosses the `lg` threshold.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Initial implementation doc: accessibility checklist (global + chat), animation guidelines, known gotchas (border namespaces, GlassSurface ARIA, Zod v4 resolver, SSE, max-w collision, Sonner), QA viewports. |
| 1.1.0 | 2026-06-20 | Front Spec Agent | minor | Auth wave: added §1.3 sign-in accessibility checklist; added `transitionCrtPowerOn` to motion factory table (§2.1) and full specification (§2.2); added sign-in-specific gotchas (§3.3 Zod resolver extends to SignInForm, §3.7 Stack Auth SDK method names — R2, §3.8 Stack Auth vs Better Auth — R1); updated QA viewports with sign-in panel behavior. |
