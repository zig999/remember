# Design System — Composition (Remember)

> Part of: `docs/specs/front/design-system/` | Layer: permanent
> Index: [`_index.md`](./_index.md)
> Version: 1.0.0 | Status: draft

---

## 1. Glass Visual Effects

### 1.1 Glass levels — material summary

Three glass levels exist (defined in `tokens.md §9`). Each level is a compound of: translucent tinted background, `backdrop-filter: blur(...)`, top-edge inner highlight, and a thin border.

| Level | Tailwind classes (applied by `GlassSurface`) | Use |
|---|---|---|
| `ambient` | `bg-surface-glass-ambient` + `backdrop-blur-sm` + `shadow-glass` + `border border-border-glass` + `rounded-md` | Header, footer, Composer input band, `ArchivedBanner` |
| `panel` | `bg-surface-glass-panel` + `backdrop-blur-md` + `shadow-glass` + `border border-border-glass` + `rounded-lg` | Filter panels, graph stubs, side panels |
| `modal` | `bg-surface-glass-modal` + `backdrop-blur-lg` + `shadow-glass-heavy` + `border border-border-glass` + `rounded-xl` | `ChatBubble` surface, Dialog content, command palette |

### 1.2 Accent borders

`GlassSurface accent` prop replaces `border-border-glass` with a state-borne color:

| Accent | Border token | Usage |
|---|---|---|
| `none` (default) | `border-border-glass` | All default surfaces |
| `accepted` | `border-border-accepted` | Confirmed fact panel |
| `uncertain` | `border-border-uncertain` | Provisional fact panel |
| `disputed` | `border-border-disputed` | Curation queue item |
| `superseded` | `border-border-superseded` | Archived item panel |
| `error` | `border-border-error` | Error state (e.g., `ChatBubble error={true}`) |
| `focus` | `border-border-focus` | Keyboard focus ring on glass surfaces |

### 1.3 Composition rule — ChatBubble

`ChatBubble` uses `GlassSurface level="modal"` as the inner surface but is rendered at `z-base` (not at `z-modal`). This is intentional:

- `level="modal"` picks the heaviest glass material (most blur + opacity + shadow) so bubbles feel visually present against the ambient backdrop.
- `z-base` means the bubble is part of the workspace, not a floating overlay. There is no focus trap, no scrim.
- The outer wrapper (`chatBubble` CVA) handles alignment (`self-end` / `self-start`) and max-width.

---

## 2. Hierarchy

### 2.1 Z-layer surface hierarchy

The workspace follows the z-scale from `tokens.md §12` (`front.md §2.2`):

```
z-toast    (50) — sonner notifications (topo de tudo)
z-modal    (41) — actual dialogs, ⌘K palette (focus trap; glass modal, 28%)
z-overlay  (40) — modal scrim/backdrop
z-popover  (30) — dropdowns, pickers (DropdownMenu, ConversationMenu panel)
z-drawer   (25) — Provenance drawer (non-modal; glass panel, 20%)
z-chrome   (20) — Header, Footer (ambient glass chrome, 14%)
z-panel    (10) — graph filter panels, selection context
z-base      (0) — workspace content (ChatWorkspace, MessageStream, ChatBubble)
z-veil     (-1) — darkening veil above backdrop
z-backdrop (-2) — ambient landscape backdrop (neon scene)
```

> `z-frame` é um alias de migração que aponta para `z-chrome` (20) — remover após Header.tsx migrar.

**Chat-specific rule:** `ChatBubble` is always `z-base`. `ConversationMenu` dropdown panel is at `z-popover` (Radix manages this). The `Dialog` for delete confirmation is at `z-modal`.

### 2.2 Content hierarchy within `ChatWorkspace`

```
ChatWorkspace
├── Left column (w-2/5 @lg)
│   └── ConversationView
│       ├── MessageStream (overflow-y-auto)
│       │   ├── ChatBubble (user, assistant — z-base)
│       │   └── ChatBubble (streaming — z-base, animate)
│       └── Composer
│           ├── GlassSurface level="ambient"
│           ├── Textarea + Send/Stop button
│           └── UsageBadge footer slot
└── Right column (w-3/5 @lg)
    └── GlassSurface level="panel" — graph stub
```

---

## 3. Layout

### 3.1 ChatWorkspace split — container query (not media query)

The 40%/60% split uses a **container query** on the workspace root:

```tsx
<div className="@container flex h-full w-full flex-col @lg:flex-row">
  <div className="flex-1 @lg:w-2/5 @lg:flex-none">{/* chat */}</div>
  <div className="flex-1 @lg:w-3/5 @lg:flex-none">{/* graph */}</div>
</div>
```

- `@container` enables `@lg:` modifiers on descendants.
- Below the container's `lg` breakpoint: columns stack vertically (mobile/narrow window).
- At `@lg` and above: side-by-side at 2/5 + 3/5.
- **Forbidden:** CSS `@media` queries for this split. Container queries are the project convention.

### 3.2 MessageStream layout

`MessageStream` is a `<section>` with `overflow-y-auto` and a sentinel element at the bottom for `scrollIntoView`. The scroll container is the section itself — not the window.

Auto-scroll behavior:
- Initial history load: `scrollIntoView({ block: "end", behavior: "auto" })` — no animation cascade.
- Each `text_delta`: `scrollIntoView({ block: "end", behavior: "smooth" })` — or `"auto"` if `prefers-reduced-motion`.

### 3.3 Composer anchoring

`Composer` is a `<div className="shrink-0">` within `ConversationView`'s flex column. It never scrolls. `GlassSurface level="ambient"` gives it the lightest glass treatment.

---

## 4. Density

The chat workspace follows a **medium density** pattern:

| Element | Token |
|---|---|
| Bubble gap in `MessageStream` | `gap-md` (16 px on the 4-pt grid) |
| Internal bubble padding | `px-md py-sm` (16 + 8) |
| Composer internal padding | `px-lg py-md` (24 + 16) |
| Message list outer padding | `px-lg py-md` (24 + 16) |
| Skeleton/bubble height | min `h-12` (48 px) for skeletons |

All spacing values reference the `--spacing-*` named tokens from `tokens.md §4`. No arbitrary values.

---

## 5. Motion Composition

### 5.1 ChatBubble entrance

History bubbles (`animate={false}`) do not play any entrance animation. This is intentional: re-mounting a 50-message conversation should not cascade-animate the whole list.

Streaming bubble (`animate={true}`) plays `transitionGlassModal` via `GlassSurface` — the same factory used when a Dialog opens. This creates a subtle visual signal ("a new message is arriving") without being jarring.

### 5.2 StreamingCursor

`StreamingCursor` uses a CSS `@keyframes cursor-blink` (opacity 1 → 0 → 1, ~1.1s loop) applied via `motion-safe:[animation:cursor-blink_...]`. This is pure CSS, not Framer Motion — a single-property decorative keyframe on a tiny element is the cheapest path. The `motion-safe:` Tailwind variant gates it on `prefers-reduced-motion: no-preference`.

### 5.3 ToolCallChip states

`Loader2` (pending): spins via `animate-spin` (Tailwind CSS animation). This is Tailwind's built-in animation utility, not Framer Motion — for a small, purely decorative spinner that is on/off based on a boolean, this is appropriate and consistent with the stack.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Initial composition doc: glass effects, hierarchy, ChatWorkspace layout, density, motion composition for chat components. |
