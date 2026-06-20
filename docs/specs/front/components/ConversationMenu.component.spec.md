# ConversationMenu — Component Spec

> Path: `frontend/src/components/ds/ConversationMenu/`
> COMP-04 | Used in features: chat (via `shell/HeaderConversationMenu.tsx` mounted in `Header`)
> Status: draft | Layer: permanent

---

## §1 Purpose and Responsibilities

`ConversationMenu` is a **pure-UI DS component** — a dropdown mounted in the global Header (only when the user is on the `/chat` route) that provides full conversation management:

- Lists recent/archived conversations.
- Allows creating a new conversation.
- Allows renaming, archiving/unarchiving, and deleting an existing conversation.
- Exposes a toggle for showing archived conversations in the list.

It is a **controlled, callback-first component**: it never performs I/O. All mutations are delegated to the consumer (`HeaderConversationMenu`) via seven callbacks. The consumer wires each callback to the appropriate TanStack Query mutation.

**Responsibilities:**
- Rendering the trigger button (truncated active title, chevron/spinner).
- Rendering the dropdown list with per-item action buttons (rename, archive/unarchive, delete).
- Owning three pieces of **internal UI-only state**: `open` (dropdown), `renamingId` (inline rename), `deletingId` (delete confirmation dialog).
- Emitting events when the user interacts with a conversation item.

**Out of scope (this component deliberately does NOT):**
- Fetch conversations — that is the consumer's responsibility.
- Persist `includeArchived` — it is a controlled prop; the consumer owns the boolean.
- Navigate — `onSelect`, `onCreate` callbacks fire; the consumer navigates.
- Render message content.
- Implement pagination beyond the initial `limit=20` page.
- Handle ⌘K.

---

## §2 Props Contract

```ts
// src/components/ds/ConversationMenu/ConversationMenu.types.ts
import type { Ref } from "react";
import type { Conversation } from "@/features/chat/types";

export interface ConversationMenuProps {
  activeConversationId?: string | null;
  activeTitle?: string | null;
  conversations: ReadonlyArray<Conversation>;
  isLoading?: boolean;
  includeArchived?: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, newTitle: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}
```

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `activeConversationId` | `string \| null` | no | `null` | UUID of the active conversation; `null` when none selected. Trigger shows "Nova conversa" when null. |
| `activeTitle` | `string \| null` | no | `null` | Title of the active conversation for the trigger label. Falls back to "Conversa sem título" when null + id not null. |
| `conversations` | `ReadonlyArray<Conversation>` | **yes** | — | List from `listConversations`. |
| `isLoading` | `boolean` | no | `false` | While true: trigger shows a spinner; if `conversations` is also empty, shows a skeleton list. |
| `includeArchived` | `boolean` | no | `false` | Controlled toggle for the footer Switch. Consumer must call `onIncludeArchivedChange` and rebind the prop. |
| `onSelect` | `(id: string) => void` | **yes** | — | Fired when a conversation row is clicked (normal select). |
| `onCreate` | `() => void` | **yes** | — | Fired when "Nova conversa" is clicked. |
| `onRename` | `(id: string, newTitle: string) => void` | **yes** | — | Fired when rename is confirmed with a non-empty title. |
| `onArchive` | `(id: string) => void` | **yes** | — | Fired when archive button is clicked for a non-archived conversation. |
| `onUnarchive` | `(id: string) => void` | **yes** | — | Fired when unarchive button is clicked for an archived conversation. |
| `onDelete` | `(id: string) => void` | **yes** | — | Fired after the user confirms deletion in the confirmation dialog. |
| `onIncludeArchivedChange` | `(value: boolean) => void` | **yes** | — | Fired when the footer Switch is toggled. Consumer updates the filter and refetches. |
| `className` | `string` | no | `undefined` | Merged onto the trigger `<button>` via `cn()`. |
| `ref` | `Ref<HTMLButtonElement>` | no | `undefined` | React 19 ref-as-prop — forwarded to the trigger `<button>` element. |

### §2.1 Data contract — `Conversation`

```ts
// src/features/chat/types.ts
export interface Conversation {
  readonly id: string;
  readonly title: string | null;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
}
```

`archivedAt !== null` → item is archived; rendered with "(arquivada)" label and unarchive button.

---

## §3 Component States

| State | Entry condition | Observable behavior |
|---|---|---|
| `closed` | `open === false` (default) | Trigger button visible. Dropdown content not rendered. |
| `open` | `open === true` (user clicked trigger) | Dropdown panel visible with conversation list, "Nova conversa" CTA, include-archived toggle. |
| `loading` | `open === true` AND `isLoading === true` AND `conversations.length === 0` | Three skeleton rows (animated `bg-muted/30 animate-pulse`). |
| `renaming` | `renamingId !== null` | The matching conversation row is replaced by an inline `<Input>` + confirm/cancel buttons. Dropdown stays open. |
| `deleting` | `deletingId !== null` | `Dialog` confirmation modal opens (outside the dropdown Portal). Dropdown closes. |

**Internal UI-only state** (never exposed as props):

| Field | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `false` | Controlled Dropdown open/close. |
| `renamingId` | `string \| null` | `null` | ID of the conversation being inline-renamed. |
| `renameDraft` | `string` | `""` | Current value of the rename input. |
| `deletingId` | `string \| null` | `null` | ID queued for delete confirmation. |

---

## §4 Events Emitted

| Event | Callback prop | Payload type | When emitted | Consumer action |
|---|---|---|---|---|
| select | `onSelect` | `id: string` | User clicks a conversation row | Navigate to `/chat?conversation=<id>` |
| create | `onCreate` | — | User clicks "Nova conversa" | `createConversation()` + navigate on success |
| rename | `onRename` | `id: string, newTitle: string` | User confirms rename with non-empty title (Enter or check button) | `updateConversation({ id, title: newTitle })` |
| archive | `onArchive` | `id: string` | User clicks the archive icon on a non-archived row | `updateConversation({ id, archivedAt: new Date().toISOString() })` |
| unarchive | `onUnarchive` | `id: string` | User clicks the unarchive icon on an archived row | `updateConversation({ id, archivedAt: null })` |
| delete | `onDelete` | `id: string` | User confirms deletion in the dialog | `deleteConversation({ id })` |
| include-archived-change | `onIncludeArchivedChange` | `value: boolean` | Footer Switch toggled | `setIncludeArchived(value)` in consumer; query key changes |

---

## §5 Variants and Compositions

| Variant | Props combination | Usage context |
|---|---|---|
| No active conversation | `activeConversationId={null}` | `/chat` before any selection; trigger shows "Nova conversa" |
| Active conversation | `activeConversationId="<uuid>" activeTitle="Reuniao Apollo"` | Normal `/chat?conversation=<id>` state |
| Loading state | `isLoading={true} conversations={[]}` | While `listConversations` is in flight on initial mount |
| With archived visible | `includeArchived={true}` with archived items in `conversations` | After user toggles "Mostrar arquivadas" |

---

## §6 Do / Don't

**Do:**

```tsx
// Correct — controlled includeArchived, all callbacks wired
<ConversationMenu
  activeConversationId={activeId}
  activeTitle={activeTitle}
  conversations={conversations}
  isLoading={listQuery.isLoading}
  includeArchived={includeArchived}
  onSelect={(id) => navigate({ to: "/chat", search: { conversation: id } })}
  onCreate={() => createMutation.mutate(undefined, { onSuccess: ... })}
  onRename={(id, title) => updateMutation.mutate({ id, title })}
  onArchive={(id) => updateMutation.mutate({ id, archivedAt: ... })}
  onUnarchive={(id) => updateMutation.mutate({ id, archivedAt: null })}
  onDelete={(id) => deleteMutation.mutate({ id })}
  onIncludeArchivedChange={setIncludeArchived}
/>
```

**Don't:**

```tsx
// Do NOT perform fetch inside the component
const { data } = useQuery(...); // WRONG — fetch belongs in the consumer (HeaderConversationMenu)

// Do NOT persist includeArchived locally inside ConversationMenu — it is controlled
// The component has no local state for includeArchived; the consumer owns it.

// Do NOT navigate inside the component
navigate({ to: "/chat", search: { conversation: id } }); // WRONG — emit onSelect; consumer navigates
```

---

## §7 BDD Scenarios

### Scenario 1 — Open dropdown, see conversation list

**Given** `conversations` contains two items and `isLoading={false}`  
**When** the user clicks the trigger button  
**Then** the dropdown opens (`data-testid="conversation-menu-content"` visible)  
**And** two `[data-testid^="conversation-menu-item-"]` items are visible  
**And** "Nova conversa" CTA is at the top  

### Scenario 2 — Create new conversation

**Given** the dropdown is open  
**When** the user clicks `[data-testid="conversation-menu-create"]`  
**Then** `onCreate()` fires  
**And** the dropdown closes  

### Scenario 3 — Rename with Enter key

**Given** the dropdown is open and a conversation row is visible  
**When** the user clicks the rename button on that row  
**Then** an inline input appears (`data-testid^="conversation-menu-rename-input-"`) with `autoFocus`  
**When** the user types "New Title" and presses Enter  
**Then** `onRename(id, "New Title")` fires  
**And** the rename row is replaced by the normal row  

### Scenario 4 — Delete with confirmation dialog

**Given** the dropdown is open  
**When** the user clicks the delete button on a row  
**Then** the dropdown closes  
**And** a confirmation `Dialog` opens (`data-testid="conversation-menu-delete-dialog"`)  
**When** the user clicks "Confirmar"  
**Then** `onDelete(id)` fires  
**And** the dialog closes  
**And** focus returns to the trigger button  

### Scenario 5 — Cancel rename with Escape

**Given** a rename input is active  
**When** the user presses `Escape`  
**Then** `onRename` is NOT fired  
**And** the inline input is replaced by the normal row  

### Scenario 6 — Loading state — spinner on trigger

**Given** `isLoading={true}` and `conversations={[]}`  
**When** the dropdown opens  
**Then** `data-testid="conversation-menu-spinner"` is visible on the trigger  
**And** `data-testid="conversation-menu-skeleton"` is visible inside the dropdown  

---

## §8 Accessibility Contract

| Requirement | Implementation |
|---|---|
| Trigger accessible name | `aria-label="Conversas — {activeTitle ?? 'Nova conversa'}"` on the trigger `<button>`. |
| Minimum item height | `min-h-10` (40 px) on all `DropdownMenuItem` rows and the rename row (`min-h-10` on the `<div role="group">`). Exceeds WCAG SC 2.5.8 (24 px); project floor is 32 px. |
| Keyboard navigation | Radix `DropdownMenu` handles `ArrowUp/Down`, `Enter`, `Space`, `Escape` for standard items. |
| Rename Enter/Escape | `onKeyDown` on rename `<Input>`: `Enter` → `commitRename`; `Escape` → `cancelRename`. |
| Focus return after delete | After dialog close: `queueMicrotask(() => triggerRef.current?.focus())` restores focus to the trigger button. |
| Rename group label | `role="group" aria-label="Renomeando {itemTitle}"` on the rename row container. |
| Rename input label | `aria-label="Novo título para {itemTitle}"` on the rename `<Input>`. |
| Confirm/cancel buttons | `aria-label="Confirmar renomeação"` and `aria-label="Cancelar renomeação"` on the icon-only buttons. |
| Per-item action buttons | `aria-label="{action} {itemTitle}"` on each action button (rename, archive, unarchive, delete). |
| Delete dialog | `Dialog` (Radix): full focus trap + Esc closes. `DialogDescription` linked to content via `aria-describedby`. |
| Loading spinner | `data-testid="conversation-menu-spinner"` with `aria-hidden="true"` (decorative); trigger `disabled` attribute prevents interaction. |

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Regenerated from implemented code (`ConversationMenu.tsx`, `ConversationMenu.types.ts`). 7 callbacks, 5 states, rename/delete flows, a11y. |
