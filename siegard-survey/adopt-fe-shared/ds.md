---
contract_version: siegard-survey/1
target: frontend
files:
  - src/components/ds/ChatBubble/ChatBubble.tsx
  - src/components/ds/ChatBubble/ChatBubble.types.ts
  - src/components/ds/ChatBubble/ChatBubble.variants.ts
  - src/components/ds/ChatBubble/index.ts
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
  - src/components/ds/ConversationMenu/ConversationMenu.types.ts
  - src/components/ds/ConversationMenu/index.ts
  - src/components/ds/GlassSurface/GlassSurface.tsx
  - src/components/ds/GlassSurface/GlassSurface.types.ts
  - src/components/ds/GlassSurface/GlassSurface.variants.ts
  - src/components/ds/GlassSurface/index.ts
  - src/components/ds/GraphNode/GraphNode.tsx
  - src/components/ds/GraphNode/GraphNode.types.ts
  - src/components/ds/GraphNode/index.ts
  - src/components/ds/StateBadge/StateBadge.tsx
  - src/components/ds/StateBadge/StateBadge.types.ts
  - src/components/ds/StateBadge/index.ts
  - src/components/ui/.gitkeep
  - src/components/ui/avatar/avatar.tsx
  - src/components/ui/avatar/avatar.types.ts
  - src/components/ui/avatar/index.ts
  - src/components/ui/badge/badge.tsx
  - src/components/ui/badge/badge.types.ts
  - src/components/ui/badge/index.ts
  - src/components/ui/command/command.tsx
  - src/components/ui/command/command.types.ts
  - src/components/ui/command/index.ts
  - src/components/ui/dropdown-menu/dropdown-menu.tsx
  - src/components/ui/dropdown-menu/dropdown-menu.types.ts
  - src/components/ui/dropdown-menu/index.ts
  - src/components/ui/form/form.tsx
  - src/components/ui/form/form.types.ts
  - src/components/ui/form/index.ts
  - src/components/ui/popover/index.ts
  - src/components/ui/popover/popover.tsx
  - src/components/ui/popover/popover.types.ts
  - src/lib/cn.ts
  - src/lib/motion.ts
  - src/lib/tokens.ts
  - src/styles/theme.css
---

## Facts
### Message bubble (domain/chat/message, styled by domain/chat/message-role)
- A message bubble takes exactly one message role, `user` or `assistant`. The role decides which side of the pane the bubble sits on and the bubble's fill. `src/components/ds/ChatBubble/ChatBubble.types.ts` (`ChatBubbleVariant`); `src/components/ds/ChatBubble/ChatBubble.tsx` (`glassFill`).
- The message text is shown as plain text, exactly as given, with its line breaks kept. It is not rendered as markup. `src/components/ds/ChatBubble/ChatBubble.tsx` (`<p data-testid="bubble-content">`, `whitespace-pre-wrap`).
- Only one assistant stop reason, `cancelled`, shows a notice below the bubble, and its text is "Resposta interrompida". Every other stop reason, a stop reason the table does not know, and an absent stop reason all show no notice. `src/components/ds/ChatBubble/ChatBubble.tsx` (`STOP_NOTICE_BY_REASON`, `stopNotice`).
  - The notice is plain text with no status or alert role, so it is not announced again after it appears. `src/components/ds/ChatBubble/ChatBubble.tsx` (`<p data-testid="stop-notice">`).
- While a bubble is streaming, it is marked busy to assistive technology (`aria-busy="true"`) and an inline cursor is added after the text. The cursor is hidden from assistive technology. When streaming ends, the busy mark is removed. `src/components/ds/ChatBubble/ChatBubble.tsx` (`ariaBusy`, `StreamingCursorStub`).
- An errored bubble adds no wording of its own. The error is shown only by switching the bubble's border to the error accent. `src/components/ds/ChatBubble/ChatBubble.tsx` (`glassAccent`).
- The bubble's state is resolved in this order: error, then streaming, then stopped (a stop notice is present), then idle. `src/components/ds/ChatBubble/ChatBubble.tsx` (`data-state` ternary).
- The bubble does not stop a user bubble from being marked as streaming. `src/components/ds/ChatBubble/ChatBubble.types.ts` (`streaming?: boolean`); `src/components/ds/ChatBubble/ChatBubble.tsx` (no role check).
- An empty message text is accepted and renders an empty bubble. `src/components/ds/ChatBubble/ChatBubble.types.ts` (`content: string`); `src/components/ds/ChatBubble/ChatBubble.tsx` (no check).

### Tool chips inside a bubble (domain/chat-workspace/tool-chip)
- When a bubble is given one or more tool calls, it shows one chip per call, above the message text, in the order given. With none, no chip row is shown. `src/components/ds/ChatBubble/ChatBubble.tsx` (`toolChips.map`).
- Each chip shows only the tool's name. Its outcome is pending when `ok` is null, ok when true, and error when false, and the outcome is shown by colour only. The chip has no role and no accessible state text. `src/components/ds/ChatBubble/ChatBubble.tsx` (`ToolChipStub`, `data-ok`).

### Conversation menu, trigger (domain/chat/conversation)
- With no active conversation, the trigger shows "Nova conversa". With an active conversation, it shows that conversation's title, or "Conversa sem título" when the title is null. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`triggerLabel`, `STRINGS.triggerFallback`, `STRINGS.titleFallback`).
- The trigger's accessible name is "Conversas — " followed by the active title, or by "Nova conversa" when the active title is null, whether or not a conversation is active. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`triggerAriaLabel`).
- While the conversation listing is loading, the trigger is disabled, so the menu cannot be opened, and a spinner replaces the chevron. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`disabled={isLoading}`).

### Conversation menu, listing (domain/chat/conversation-listing)
- The first entry of the menu creates a new conversation. It sends no title and closes the menu. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`handleCreate`, `onCreate: () => void`).
- While loading with no conversations yet, the menu shows a placeholder skeleton. When not loading and there are no conversations, it shows "Nenhuma conversa ainda". `src/components/ds/ConversationMenu/ConversationMenu.tsx` (skeleton branch, `STRINGS.empty`).
- While loading, any conversations already held are still listed. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`isLoading && conversations.length === 0` guard).
- The menu shows conversations in the order it receives them. It does not sort, filter or cap them. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`conversations.map`).
- Each row shows the conversation's title, or "Conversa sem título" when the title is null. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`itemTitle`).
- A conversation is treated as archived when its archived instant is not null. An archived row shows an "Arquivada" mark, which is hidden from assistive technology, and its accessible name is the title followed by "(arquivada)". `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`isArchived`, `STRINGS.archivedBadge`, `itemAriaLabel`, `STRINGS.archivedSuffix`).
- The active conversation's row is marked only by a highlighted background. Its accessible name does not change. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`isActive && "bg-elevated"`, `data-active`).
- Choosing a row selects that conversation and closes the menu. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`handleSelect`).
- Every row offers rename and delete. A conversation that is not archived also offers archive, and an archived one offers reactivate (unarchive) instead. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`isArchived ?` unarchive : archive buttons).
- Archiving and reactivating each act on the conversation at once, with no confirmation, and close the menu. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`handleArchive`, `handleUnarchive`).
- Archived conversations are hidden from the listing by default (`includeArchived` defaults to false). The owner turns them on with a "Mostrar arquivadas" switch at the foot of the menu. Flipping the switch only reports the new value; the menu does not store it. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`includeArchived = false`, `onIncludeArchivedChange`, `STRINGS.showArchived`).

### Conversation menu, rename
- Renaming replaces the row in place with a text field. The field starts with the current title, or empty when the title is null. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`startRename`).
- Enter or the confirm control commits the rename. The title sent is the field's text with outer whitespace trimmed. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`commitRename`, `renameDraft.trim()`).
- Escape or the cancel control drops the rename and sends nothing. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`onRenameKeyDown`, `cancelRename`).
- Closing the menu while a rename is in progress drops the rename and sends nothing. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`useEffect` on `open`).
- The menu sets no length limit on the new title. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`commitRename`, no bound).

### Conversation menu, delete
- Deleting always asks for confirmation first. The menu closes and a dialog opens with the title "Excluir conversa" and the body "Tem certeza? Esta ação não pode ser desfeita." `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`requestDelete`, `STRINGS.deleteTitle`, `STRINGS.deleteBody`).
- Only the confirm action sends the delete. Cancelling or dismissing the dialog sends nothing. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`confirmDelete`, `cancelDelete`, `onOpenChange`).

### Graph node (domain/graph-explorer/graph-node-view)
- A graph node takes one of ten node types. Each type has a fixed pt-BR name, which is the node's default subtitle; a caller can override the subtitle. `src/components/ds/GraphNode/GraphNode.types.ts` (`GraphNodeType`); `src/components/ds/GraphNode/GraphNode.tsx` (`NODE_STYLE`, `subtitle ?? style.label`).
- A node's accessible name is its type's pt-BR name, then ": ", then the node's label. `src/components/ds/GraphNode/GraphNode.tsx` (`aria-label={`${style.label}: ${label}`}`).
- A node that has a confidence state shows it as an icon-only state badge. A node without one shows no badge. `src/components/ds/GraphNode/GraphNode.tsx` (`state && <StateBadge iconOnly …/>`).
- A selected node's border shows the selection instead of its state's border colour. The state is still shown by the badge. `src/components/ds/GraphNode/GraphNode.tsx` (`accent = selected ? "focus" : …`).

### Confidence state badge (domain/graph-explorer/confidence-state)
- The badge shows one of five confidence states. Each state has a fixed pt-BR label, which a caller can override. `src/components/ds/StateBadge/StateBadge.types.ts` (`ConfidenceState`); `src/components/ds/StateBadge/StateBadge.tsx` (`STATE_LABELS`, `resolvedLabel`).
- The badge's accessible name is always "Estado de confiança: " followed by the label, including when only the icon is visible. `src/components/ds/StateBadge/StateBadge.tsx` (`aria-label`, `iconOnly`).
- The visible label is shown unless the badge is icon-only. The icon is always shown and is hidden from assistive technology. `src/components/ds/StateBadge/StateBadge.tsx` (`!iconOnly && <span>`, `aria-hidden`).

### Initials avatar
- An avatar's accessible name is the full name. Its initials are the first letter of the first word plus the first letter of the last word, or the first two letters when there is one word, uppercased. A blank name gives "?". `src/components/ui/avatar/avatar.tsx` (`initials`, `aria-label={name}`).

### Form field messages
- A field in error is marked invalid to assistive technology and is described by its help text and its error message. A field not in error is described by its help text only. `src/components/ui/form/form.tsx` (`FormControl`).
- A field's error message replaces any other message text given to it. When there is neither an error message nor other text, nothing is shown. `src/components/ui/form/form.tsx` (`FormMessage`, `body`).

## Answers
- Rename a conversation — the trimmed title is empty → nothing is sent and the field closes silently, with no message. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`commitRename`).
- Delete a conversation — the confirmation is cancelled or dismissed → nothing is sent, with no message. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`cancelDelete`).
- Open the conversation menu — the listing is loading → the trigger is disabled and cannot be activated, with no message. `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`disabled={isLoading}`).
- Read a form field's wiring — used outside a form field → throws `Error` ("useFormField deve ser usado dentro de <FormField>"); this is a developer misuse that no owner sees. `src/components/ui/form/form.tsx` (`useFormField`).

## Vocabularies
- Message role (domain/chat/message-role): `user`, `assistant`. `src/components/ds/ChatBubble/ChatBubble.types.ts` (`ChatBubbleVariant`).
- Assistant stop reasons that show a notice (domain/chat/assistant-stop-reason): `cancelled` → "Resposta interrompida". No other value is listed. `src/components/ds/ChatBubble/ChatBubble.tsx` (`STOP_NOTICE_BY_REASON`).
- Tool chip outcome (domain/chat-workspace/tool-chip-outcome): `pending` (ok null), `ok` (ok true), `error` (ok false). `src/components/ds/ChatBubble/ChatBubble.tsx` (`data-ok`).
- Confidence state (domain/graph-explorer/confidence-state), with its pt-BR labels: `accepted` "Aceito", `uncertain` "Incerto", `low-confidence` "Baixa confiança", `disputed` "Em disputa", `superseded` "Superado". `src/components/ds/StateBadge/StateBadge.types.ts` (`ConfidenceState`); `src/components/ds/StateBadge/StateBadge.tsx` (`STATE_LABELS`).
  - The same five keys close the state colour tokens. `src/lib/tokens.ts` (`state`, `stateFg`); `src/styles/theme.css` (`--color-state-*`).
- Node type (domain/knowledge-base/node-type), with its pt-BR labels: `person` "Pessoa", `organization` "Organização", `project` "Projeto", `event` "Evento", `role` "Papel", `category` "Categoria", `concept` "Conceito", `location` "Local", `document` "Documento", `task` "Tarefa". `src/components/ds/GraphNode/GraphNode.types.ts` (`GraphNodeType`); `src/components/ds/GraphNode/GraphNode.tsx` (`NODE_STYLE`).
  - The same ten keys close the node colour tokens. `src/lib/tokens.ts` (`nodeType`); `src/styles/theme.css` (`--color-node-*`).
- Link type (domain/knowledge-base/link-type), spelled as colour-token keys: `participates-in`, `member-of`, `holds-role`, `responsible-for`, `reports-to`, `part-of`, `located-in`, `organizes`, `belongs-to-category`, `related-to`, `concerns`, `delivered-to`, `sponsors`. `src/lib/tokens.ts` (`linkType`); `src/styles/theme.css` (`--color-link-*`).

## Upstream artifacts
- The conversation shape the chat feature owns. The menu reads `id`, `title` (nullable) and `archivedAt` (null means not archived). `src/components/ds/ConversationMenu/ConversationMenu.types.ts` (`Conversation` from `@/features/chat/types`); `src/components/ds/ConversationMenu/ConversationMenu.tsx` (`c.archivedAt`, `c.title`, `c.id`).
- The tool-call shape the chat feature owns. The bubble reads `tool` and `ok` (boolean or null). `src/components/ds/ChatBubble/ChatBubble.types.ts` (`ToolCallData` from `@/features/chat/types`); `src/components/ds/ChatBubble/ChatBubble.tsx` (`chip.tool`, `chip.ok`).
- The shared UI-kit primitives (Dialog, Button, Input, Switch, Label), which a vendored module owns. `src/components/ds/ConversationMenu/ConversationMenu.tsx`; `src/components/ui/command/command.tsx`; `src/components/ui/form/form.tsx` (imports from `@/shared/components/ui/*`).
- The vendored UI-kit theme contract and React Flow's structural stylesheet, both imported into the theme. `src/styles/theme.css` (`@import "../../vendor/ui-kit/frontend/src/theme.css"`, `@import "@xyflow/react/dist/base.css"`).

## Outside the domain
- Bubble alignment, max-width, fill and radius, the entrance motion, and the reduced-motion gating: surface. `src/components/ds/ChatBubble/ChatBubble.tsx`.
- Holds no domain fact; CVA alignment classes only. `src/components/ds/ChatBubble/ChatBubble.variants.ts`.
- Holds no domain fact; re-exports only. `src/components/ds/ChatBubble/index.ts`, `src/components/ds/ConversationMenu/index.ts`, `src/components/ds/GlassSurface/index.ts`, `src/components/ds/GraphNode/index.ts`, `src/components/ds/StateBadge/index.ts`, `src/components/ui/avatar/index.ts`, `src/components/ui/badge/index.ts`, `src/components/ui/command/index.ts`, `src/components/ui/dropdown-menu/index.ts`, `src/components/ui/form/index.ts`, `src/components/ui/popover/index.ts`.
- Conversation-menu control labels ("Nova conversa" create item, "Renomear", "Arquivar", "Reativar", "Excluir", "Confirmar renomeação", "Cancelar renomeação", "Renomeando …", "Novo título para …", "Cancelar", "Confirmar"), focus return to the trigger, the 40px item floor and the icons: surface. `src/components/ds/ConversationMenu/ConversationMenu.tsx`.
- Holds no domain fact beyond the callback contract already listed. `src/components/ds/ConversationMenu/ConversationMenu.types.ts`.
- Holds no domain fact. The glass material, the accent vocabulary (`none`, `accepted`, `uncertain`, `disputed`, `superseded`, `focus`, `error`), fill, radius, roles, the motion variants and the uncertain border pulse are styling. `src/components/ds/GlassSurface/GlassSurface.tsx`, `src/components/ds/GlassSurface/GlassSurface.types.ts`, `src/components/ds/GlassSurface/GlassSurface.variants.ts`.
- Mapping from state to node border accent (uncertain, disputed and superseded colour the border; accepted and low-confidence do not), node-type icons and colours, truncation: colour and layout. `src/components/ds/GraphNode/GraphNode.tsx`.
- Holds no domain fact beyond the node-type vocabulary and props already listed. `src/components/ds/GraphNode/GraphNode.types.ts`.
- State-badge icons, sizes, colours and the state-change motions (uncertain→accepted plays promote, any→superseded plays supersede, a merge attribute plays merge, the uncertain pulse): motion and colour. `src/components/ds/StateBadge/StateBadge.tsx`.
- Empty file. `src/components/ui/.gitkeep`.
- Avatar deterministic swatch colour and sizes: colour. `src/components/ui/avatar/avatar.tsx`, `src/components/ui/avatar/avatar.types.ts`.
- Holds no domain fact; badge variants are visual intents. `src/components/ui/badge/badge.tsx`, `src/components/ui/badge/badge.types.ts`.
- Holds no domain fact. The command-palette styling and its default dialog name "Paleta de comandos" are a control label. `src/components/ui/command/command.tsx`, `src/components/ui/command/command.types.ts`.
- Holds no domain fact; Radix wrappers with styling only. `src/components/ui/dropdown-menu/dropdown-menu.tsx`, `src/components/ui/dropdown-menu/dropdown-menu.types.ts`, `src/components/ui/popover/popover.tsx`, `src/components/ui/popover/popover.types.ts`.
- Holds no domain fact; context-shape types and id derivation. `src/components/ui/form/form.types.ts`.
- Holds no domain fact; className merge configuration. `src/lib/cn.ts`.
- Holds no domain fact; motion variant factories, durations and easings. `src/lib/motion.ts`.
- Token values (colours, spacing, fonts, radius, shadow, glass, z-index): surface. The literal colour values here differ from the theme's kit-mapped variables, which is also surface. `src/lib/tokens.ts`.
- Theme tokens, utilities, keyframes, toast motion and the autofill workaround: surface. A comment in this file states confidence thresholds (≥0.75, 0.40–0.75, <0.40). That is text, not evidence, and is not taken as a fact here. `src/styles/theme.css`.

## Observed and not decided here
- For an active conversation whose title is null, the trigger shows "Conversa sem título" (`activeConversationId !== null` → `activeTitle ?? STRINGS.titleFallback`, `src/components/ds/ConversationMenu/ConversationMenu.tsx` `triggerLabel`). Its accessible name says "Conversas — Nova conversa" (`activeTitle ?? STRINGS.triggerFallback`, `src/components/ds/ConversationMenu/ConversationMenu.tsx` `triggerAriaLabel`).
