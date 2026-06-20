# Design System — Component Catalog (Remember)

> Part of: `docs/specs/front/design-system/` | Layer: permanent
> Index: [`_index.md`](./_index.md)
> Version: 1.0.0 | Status: draft

---

## 1. Overview

This file catalogs all design-system (DS) components — both foundational atoms in `components/ds/` and the `components/ui/` shadcn/ui primitives. For each component it records:

- Location and spec reference
- Slot contract (primary props)
- Rendered states

Feature-local components (inside `features/chat/components/`) are listed by name in §3 for orientation but do not have full catalog entries here — their specs live in the feature spec (`chat.feature.spec.md §10`).

---

## 2. DS Atom Catalog (`components/ds/`)

### 2.1 GlassSurface

| Property | Value |
|---|---|
| Path | `src/components/ds/GlassSurface/` |
| Spec | `docs/specs/front/components/GlassSurface.component.spec.md` |
| Variants | `level`: `ambient` / `panel` / `modal` |
| Key slots | `level`, `accent`, `animate`, `role`, `aria-label` |
| Rendered states | default (no accent), + 6 accent states (accepted / uncertain / disputed / superseded / focus / error), + entering (Framer Motion, gate: `animate`) |

### 2.2 StateBadge

| Property | Value |
|---|---|
| Path | `src/components/ds/StateBadge/` |
| Spec | `docs/specs/front/components/StateBadge.component.spec.md` |
| Variants | `state`: `accepted` / `uncertain` / `low-confidence` / `disputed` / `superseded` |
| Key slots | `state`, `label`, `size` |
| Rendered states | 5 confidence states (color + icon per state) |

### 2.3 GraphNode

| Property | Value |
|---|---|
| Path | `src/components/ds/GraphNode/` |
| Spec | (inline in feature spec — later wave) |
| Variants | `nodeType` (10 types from catalog) |
| Key slots | `nodeType`, `label`, `confidence`, `selected`, `pinned` |
| Rendered states | default, selected, pinned, confidence-degraded |

### 2.4 ChatBubble

| Property | Value |
|---|---|
| Path | `src/components/ds/ChatBubble/` |
| Spec | `docs/specs/front/components/ChatBubble.component.spec.md` |
| Variants | `variant`: `user` / `assistant` |
| Key slots | `variant`, `content`, `streaming`, `error`, `stopReason`, `animate`, `toolChips` |
| Rendered states | idle, streaming, error, stopped (cancelled), entering |
| Notes | Uses `GlassSurface level="modal"` at `z-base`. Not a modal in ARIA sense. |

### 2.5 ConversationMenu

| Property | Value |
|---|---|
| Path | `src/components/ds/ConversationMenu/` |
| Spec | `docs/specs/front/components/ConversationMenu.component.spec.md` |
| Variants | no CVA — single visual appearance |
| Key slots | `activeConversationId`, `conversations`, `isLoading`, `includeArchived`, 7 callbacks |
| Rendered states | closed, open, loading (skeleton), renaming, deleting |
| Notes | Pure UI — no I/O. Mounts in Header only on `/chat` via `HeaderConversationMenu`. |

---

## 3. shadcn/ui Primitives (`components/ui/`)

These are **owned code** — do not regenerate via CLI. Extend by composition.

| Component | Path | Used by |
|---|---|---|
| `Button` | `components/ui/button/` | Composer (send/stop), MessageStream (retry), ConversationMenu, ArchivedBanner |
| `Textarea` | `components/ui/textarea/` | Composer |
| `Input` | `components/ui/input/` | ConversationMenu (rename) |
| `Switch` | `components/ui/switch/` | ConversationMenu (include-archived toggle) |
| `Dialog` + `DialogContent` + `DialogHeader` + `DialogFooter` + `DialogTitle` + `DialogDescription` | `components/ui/dialog/` | ConversationMenu (delete confirmation) |
| `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent` + `DropdownMenuItem` + `DropdownMenuSeparator` | `components/ui/dropdown-menu/` | ConversationMenu, Header (settings) |
| `Tooltip` | `components/ui/tooltip/` | (available — not yet used in chat wave) |
| `Popover` | `components/ui/popover/` | (available — not yet used in chat wave) |

---

## 4. Feature-Local Components (reference only)

The following components live inside `features/chat/components/` and are not DS atoms. They are listed here for orientation. Full specs are in `chat.feature.spec.md §10`.

| Component | Feature | Role |
|---|---|---|
| `ChatWorkspace` | chat | Page-level 40/60 container-query split |
| `ConversationView` | chat | Left column — routes to empty state or message+compose layout |
| `MessageStream` | chat | Scrollable history + streaming bubble list |
| `Composer` | chat | Input band (send / stop / archived / disabled modes) |
| `StreamingCursor` | chat | Blinking caret appended to streaming bubble text |
| `ToolCallChip` | chat | Inline tool-call status chip (pending/success/error) |
| `UsageBadge` | chat | Token + tool-call aggregates in Composer footer |
| `HeaderConversationMenu` | chat (shell) | Adapter wiring `ConversationMenu` to chat data layer, mounted in `Header` |

---

## 5. Component Composition Rules

### 5.1 Who may use DS atoms

Any feature may import from `components/ds/` or `components/ui/`. DS atoms are the shared library.

### 5.2 Who may NOT import from another feature

Feature-local components (`features/<x>/components/`) may NOT be imported by a different feature (`features/<y>/`). Only `components/ds/`, `components/ui/`, `lib/`, and `state/` are shared.

Exception: DS atoms in `components/ds/` may import types from `features/chat/types.ts` when those types are data-only (no React, no runtime coupling). Current example: `ChatBubble.types.ts` imports `ToolCallData` from `features/chat/types.ts`.

### 5.3 CVA usage rule

CVA is used **only when there are 2+ visual variants**. Current CVA users:

| Component | Variants axis |
|---|---|
| `ChatBubble` | `variant`: user / assistant (alignment + max-width) |
| `GlassSurface` | `level`: ambient / panel / modal (bg + blur + shadow + radius) |
| `Button` | `variant` + `size` |
| `StateBadge` | `state` (5 confidence states) |

Components with a single appearance do NOT use CVA.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Initial component catalog. DS atoms: GlassSurface, StateBadge, GraphNode, ChatBubble, ConversationMenu. Shadcn/ui primitives used in chat wave. Feature-local reference table. |
