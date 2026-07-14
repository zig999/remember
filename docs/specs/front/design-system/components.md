# Design System — Component Catalog (Remember)

> Part of: `docs/specs/front/design-system/` | Layer: permanent
> Index: [`_index.md`](./_index.md)
> Version: 2.0.0 | Status: draft
>
> ## ⚠ v2.0 — primitivos migrados para o UI-Kit (TUI)
> Os primitivos genéricos vêm do **kit** (`@/shared/components/ui/`, submodule `vendor/ui-kit`) — ver §3.
> Os atoms `ds/*` (§2) permanecem exclusivos mas consomem o contrato do kit (GlassSurface **flat**,
> StateBadge/cores **remapeadas**). **Autoridade de tokens:** [`tokens.md`](./tokens.md) §Migração.

---

## 1. Overview

This file catalogs all design-system (DS) components — both foundational atoms in `components/ds/` and the `components/ui/` shadcn/ui primitives. For each component it records:

- Location and spec reference
- Slot contract (primary props)
- Rendered states

Feature-local components (inside `features/*/components/`) are listed by name in §4 for orientation but do not have full catalog entries here — their specs live in the feature spec.

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

## 3. Primitivos

> ⚠ **v2.0 — primitivos agora vêm do UI-Kit (TUI).** Os primitivos genéricos foram **substituídos pelos
> do kit compartilhado**, importados via alias `@/shared/components/ui/<nome>` (submodule read-only —
> nunca editar). Só permanecem em `components/ui/` (owned, eternal) os que o kit não tem. Os `ds/*` do §2
> continuam exclusivos, mas consomem o contrato do kit (GlassSurface agora **flat**; StateBadge/cores
> **remapeadas** — ver as component specs).

### 3.1 Compartilhados — do kit (`@/shared/components/ui/`)

| Component | API (mudança relevante) | Usado por |
|---|---|---|
| `Button` | `variant="primary"` (antes `default`); `asChild` | Composer, MessageStream, ConversationMenu, ArchivedBanner, SignInForm |
| `Input` | passthrough; estado inválido via `aria-invalid` (não prop `invalid`) | ConversationMenu (rename), SignInForm |
| `Label` | passthrough | SignInForm |
| `Textarea` | passthrough; `aria-invalid` | Composer, IngestPanel |
| `Switch` | `onChange(checked)` (não `onCheckedChange`) | ConversationMenu |
| `Checkbox` | nativo, `onChange(e)` | (forms) |
| `RadioGroup` / `Tabs` | compostos (kit) | curadoria / QueueTabs |
| `Card` | único, prop `tone` (não composto) | — |
| `Dialog` (+ Content/Header/Footer/Title/Description) | composto | ConversationMenu (delete) |
| `Select` | **componente único, prop `options[]`** (`onChange(value)`) — **não** `SelectTrigger/Content/Item/Value` | GraphCanvas (algoritmo), IngestPanel, DateJustification |

### 3.2 Exclusivos do eternal (`components/ui/` — owned; kit não tem)

| Component | Path | Usado por |
|---|---|---|
| `badge` | `components/ui/badge/` | (usa tokens `state-*`) |
| `form` | `components/ui/form/` | RHF wrapper |
| `command` | `components/ui/command/` | command palette |
| `dropdown-menu` | `components/ui/dropdown-menu/` | ConversationMenu, Header |
| `popover` | `components/ui/popover/` | (disponível) |
| `avatar` | `components/ui/avatar/` | (disponível) |

> Removidos do eternal (usar sob demanda a partir do kit): `table`, `tooltip`.

---

## 4. Feature-Local Components (reference only)

### 4.1 Chat feature (`features/chat/components/`)

The following components live inside `features/chat/components/` and are not DS atoms. Full specs are in `chat.feature.spec.md §10`.

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

### 4.2 Auth feature (`features/auth/components/`)

The following components live inside `features/auth/components/`. Full specs are in `sign-in.feature.spec.md §10`.

| Component | Feature | Role |
|---|---|---|
| `SignInPanel` | auth | CRT wrapper (`motion.div` with `transitionCrtPowerOn`) + `GlassSurface level="panel"` (animate=false) + welcome text + `SignInForm` |
| `SignInForm` | auth | RHF + Zod form: email (Login) + password (Senha) + submit button; manages UI states idle/submitting/error |

### 4.3 Graph feature (`features/graph/components/`)

The following components live inside `features/graph/components/`. Full spec is in `GraphSpace.component.spec.md`, `GraphEdge.component.spec.md`, and `NodeDetailPanel.component.spec.md`.

| Component | Feature | Role | Notes |
|---|---|---|---|
| `GraphSpace` | graph | Container — ReactFlowProvider + status overlay + empty state | Spec: `GraphSpace.component.spec.md` |
| `GraphCanvas` | graph | `<ReactFlow>` controlled canvas + Panel top-right (algorithm Select + Reorganizar) | Consumes `useForceLayout` dispatcher (force/tree/radial) |
| `GraphNodeAdapter` | graph | Custom RF node — wraps `ds/GraphNode` + **invisible** `<Handle>` ports (top/bottom) | Handles invisible: `opacity-0 pointer-events-none`; floating-edge geometry comes from `getEdgeParams` |
| `GraphEdgeAdapter` | graph | Custom RF edge — floating geometry via `useInternalNode` + `getEdgeParams` | REQ-1: connects at nearest node boundary, not fixed handle |
| `GraphStatusOverlay` | graph | `aria-live="polite"` loading/error overlay | |
| `GraphEmptyState` | graph | Centered empty state copy | |
| `NodeDetailPanel` | graph | Inline node detail — replaces GraphSpace in right pane; progressive disclosure of attributes (Phase A), relationships (Phase B), and lazy full provenance (Phase C) | Spec: `NodeDetailPanel.component.spec.md` v2.0 |
| `NodeAttributeRow` | graph | Single attribute row + Phase A inline provenance disclosure + Phase C lazy provenance disclosure | Sub-component of `NodeDetailPanel`; stays in `NodeDetailPanel/` directory |
| `NodeRelationshipRow` | graph | Single relationship row + Phase B inline link provenance + Phase C lazy provenance disclosure | Sub-component of `NodeDetailPanel`; stays in `NodeDetailPanel/` directory |
| `NodeProvenanceChain` | graph | Renders a `ProvenanceResponse` (Phase C result): chunk index/offsets/excerpt + RawInformation metadata | Reused by both `NodeAttributeRow` and `NodeRelationshipRow` |

---

## 5. Component Composition Rules

### 5.1 Who may use DS atoms

Any feature may import from `components/ds/` or `components/ui/`. DS atoms are the shared library.

### 5.2 Who may NOT import from another feature

Feature-local components (`features/<x>/components/`) may NOT be imported by a different feature (`features/<y>/`). Only `components/ds/`, `components/ui/`, `lib/`, and `state/` are shared.

Exception: DS atoms in `components/ds/` may import types from `features/*/types.ts` when those types are data-only (no React, no runtime coupling). Current example: `ChatBubble.types.ts` imports `ToolCallData` from `features/chat/types.ts`.

**REQ-6 (unidirectionality):** `features/graph/` MUST NOT import from `features/chat/`. A structural test enforces this. `NodeDetailPanel` and all its sub-components are confined to `features/graph/`.

### 5.3 CVA usage rule

CVA is used **only when there are 2+ visual variants**. Current CVA users:

| Component | Variants axis |
|---|---|
| `ChatBubble` | `variant`: user / assistant (alignment + max-width) |
| `GlassSurface` | `level`: ambient / panel / modal (bg + blur + shadow + radius) |
| `Button` | `variant` + `size` |
| `StateBadge` | `state` (5 confidence states) |

Components with a single appearance do NOT use CVA. `SignInPanel` and `SignInForm` are single-use, single-appearance — no CVA.

### 5.4 Sign-in layout exception

`SignInPanel` wraps `GlassSurface level="panel"` with `animate={false}` to disable GlassSurface's entrance. The CRT `motion.div` wrapper (via `transitionCrtPowerOn()`) is responsible for the full entrance animation. This is the only case where a consumer disables `GlassSurface`'s `animate` prop.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Initial component catalog. DS atoms: GlassSurface, StateBadge, GraphNode, ChatBubble, ConversationMenu. Shadcn/ui primitives used in chat wave. Feature-local reference table. |
| 1.1.0 | 2026-06-20 | Front Spec Agent | minor | Auth wave: added `Input` + `Label` to shadcn/ui primitives table (sign-in uses them). Added §4.2 auth feature-local components (SignInPanel, SignInForm). §5.4: sign-in `animate={false}` CRT exception documented. |
| 1.2.0 | 2026-06-23 | Front Spec Agent | minor | Graph-improvement wave: §3 `Select` added to shadcn/ui primitives (algorithm selector). §4.3 graph feature-local reference table added (GraphCanvas Panel, invisible handles in GraphNodeAdapter, floating-edge GraphEdgeAdapter). |
| 1.3.0 | 2026-06-26 | Front Spec Agent | minor | Progressive-disclosure wave: §4.3 updated — `NodeDetailPanel` description updated to cover Phase A/B/C. Added 3 new sub-components: `NodeAttributeRow`, `NodeRelationshipRow`, `NodeProvenanceChain`. §5.2 REQ-6 unidirectionality note added explicitly. |
