---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/chat/components/ChatStatusIndicator.tsx
  - src/features/chat/components/ChatWorkspace.tsx
  - src/features/chat/components/Composer.tsx
  - src/features/chat/components/Composer.types.ts
  - src/features/chat/components/ConversationView.tsx
  - src/features/chat/components/MessageStream.tsx
  - src/features/chat/components/StreamingCursor.tsx
  - src/features/chat/components/ToolCallChip/ToolCallChip.tsx
  - src/features/chat/components/ToolCallChip/ToolCallChip.types.ts
  - src/features/chat/components/ToolCallChip/index.ts
  - src/features/chat/components/UsageBadge/UsageBadge.tsx
  - src/features/chat/components/UsageBadge/UsageBadge.types.ts
  - src/features/chat/components/UsageBadge/index.ts
  - src/features/chat/components/index.ts
read_outside_area:
  - "src/features/chat/state/chat-turn.ts — the turn store the area reads (isStreaming, streamingText, toolChips, abortController, chatStatus), opened to learn every phase value and how a pending tool call is marked"
  - "src/features/chat/api/useSendMessage.ts — opened to learn where the composer's last errorCode comes from (pre-stream answer or terminal error frame) and that a null errorCode means the turn succeeded"
  - "src/components/ds/ChatBubble/ChatBubble.tsx — opened to learn what a stop reason handed to a bubble renders, and that the bubble renders its own tool-call and cursor stubs rather than ToolCallChip or StreamingCursor (a search of src found no file outside tests and stories that mounts UsageBadge, ToolCallChip or StreamingCursor)"
---

## Facts
### Chat workspace (conversation selection)
- The active conversation is whatever the route search parameter `conversation` names. When the parameter is absent, no conversation is active. `src/features/chat/components/ChatWorkspace.tsx` (`chatRoute.useSearch()`).
- With no active conversation, the left pane shows the text "Selecione ou crie uma conversa para começar.". `src/features/chat/components/ConversationView.tsx` (`ConversationView`, `conversation-view-empty`).
- When the active conversation changes, including selecting the first one and leaving all of them, the graph pane's subgraph is cleared and any open node detail panel is closed. `src/features/chat/components/ChatWorkspace.tsx` (`useEffect` on `[conversation]`, `useGraphStore.getState().clear()`, `setSelectedNode(null)`).
- When the active conversation changes, the saved graph view for that conversation is restored, and it is saved again whenever the graph changes. `src/features/chat/components/ChatWorkspace.tsx` (`useGraphPersistence(conversation)`).
- Clicking a node in the graph pane swaps that pane from the graph to the node detail panel for that node. Closing the panel brings the graph back. `src/features/chat/components/ChatWorkspace.tsx` (`handleNodeSelect`, `handleDetailClose`, `selectedNode !== null ? <NodeDetailPanel> : <GraphSpace>`).
- The node detail panel gets the clicked node's label at click time, so it can show the label before the detail has loaded. If the node has no label, none is passed. `src/features/chat/components/ChatWorkspace.tsx` (`setSelectedNode({ id, label: node?.label })`, `nodeLabel`).
- Selecting a node or closing its detail panel sends no message and does not change the turn. `src/features/chat/components/ChatWorkspace.tsx` (`handleNodeSelect`, `handleDetailClose`).
- The graph pane receives the graph's status and, when one exists, its error message. `src/features/chat/components/ChatWorkspace.tsx` (`status`, `errorMessage`).
- Changing the active conversation clears the graph and the node selection, and does not stop a turn already in flight. That turn is aborted only when the message list leaves the screen. `src/features/chat/components/ChatWorkspace.tsx` (`useEffect` on `[conversation]`), `src/features/chat/components/MessageStream.tsx` (unmount `useEffect` cleanup).

### Conversation view (active conversation)
- With an active conversation, the left pane shows the message list above the composer. `src/features/chat/components/ConversationView.tsx` (`ActiveConversation`).
- A conversation counts as archived when its detail carries a non-null `archivedAt`. Until the detail has loaded, and also when it fails to load, the conversation is treated as not archived and the send band is shown. `src/features/chat/components/ConversationView.tsx` (`conversationQuery.data?.archivedAt != null`).
- Choosing to reactivate an archived conversation sends an update for that conversation with `archivedAt: null`. `src/features/chat/components/ConversationView.tsx` (`updateMutation.mutate({ id: conversationId, archivedAt: null })`).
- The conversation section's accessible name is "Conversa". This applies to both the empty and the active state. `src/features/chat/components/ConversationView.tsx` (`aria-label="Conversa"`).
- The message-list slot's accessible name is "Mensagens da conversa". `src/features/chat/components/ConversationView.tsx` (`message-stream-slot` `aria-label`).
- The composer slot's accessible name is "Compositor de mensagem". `src/features/chat/components/ConversationView.tsx` (`composer-slot` `aria-label`).

### Composer (what the owner types and sends)
- For an archived conversation, the whole input area is replaced by a banner. It has no text field and no send button. `src/features/chat/components/Composer.tsx` (`if (isArchived) return <ArchivedBanner>`).
- The archived banner's title is "Conversa arquivada". It is also the banner's accessible name. `src/features/chat/components/Composer.tsx` (`ARCHIVED_TITLE`, `aria-label={ARCHIVED_TITLE}`).
- The archived banner says "Esta conversa está arquivada. Reative para enviar novas mensagens.". `src/features/chat/components/Composer.tsx` (`ARCHIVED_BODY`).
- The archived banner offers one action, "Reativar", which asks for the conversation to be unarchived. `src/features/chat/components/Composer.tsx` (`ARCHIVED_ACTION`, `onUnarchive`), `src/features/chat/components/Composer.types.ts` (`onUnarchive`).
- Sending carries the active conversation's identifier and the typed content, and nothing else. No model is chosen. `src/features/chat/components/Composer.tsx` (`mutation.mutateAsync({ conversationId, content })`).
- Content must be at least 1 character long. `src/features/chat/components/Composer.tsx` (`composerSchema`, `.min(1, MSG_EMPTY)`).
- Content may be at most 32768 characters long. `src/features/chat/components/Composer.tsx` (`MAX_CONTENT_LENGTH = 32768`, `.max(MAX_CONTENT_LENGTH, MSG_TOO_LONG)`).
- The minimum length is checked on the content as typed, without trimming, so content made only of whitespace passes the composer's check. `src/features/chat/components/Composer.tsx` (`z.string().min(1)`).
- Content is checked on every change, so the too-long message appears while the owner types and not only when they send. `src/features/chat/components/Composer.tsx` (`mode: "onChange"`).
- Both length bounds are checked before any request is made. Content that fails either bound sends nothing. `src/features/chat/components/Composer.tsx` (`handleSubmit(onSubmit)`).
- Only one validation message per field is shown: the first problem found. `src/features/chat/components/Composer.tsx` (`safeZodResolver`, first issue wins).
- Enter without Shift sends the message through the same checks as the send button. Shift+Enter inserts a new line. `src/features/chat/components/Composer.tsx` (`onTextareaKeyDown`, `requestSubmit()`).
- When a send succeeds (no error code), the text field is emptied. When it fails, the typed text stays so the owner can edit it and try again. `src/features/chat/components/Composer.tsx` (`onSubmit`, `if (result.errorCode === null) reset({ content: "" })`).
- While a turn is streaming, the text field is disabled and the send button is replaced by a stop button. `src/features/chat/components/Composer.tsx` (`isTextareaDisabled = isStreaming || …`, `isStreaming ? stop : send`).
- The stop button aborts the turn in flight. `src/features/chat/components/Composer.tsx` (`onStopClick`, `abortController.abort()`).
- While a turn is streaming, Escape aborts it from anywhere on the page, not only from the text field. Escape does nothing when no turn is in flight. `src/features/chat/components/Composer.tsx` (document `keydown` listener, `e.key !== "Escape"`, `controller !== null`).
- If the last send ended with `BUSINESS_CHAT_DISABLED` or `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, the text field and the send button are disabled and an inline notice is shown. `src/features/chat/components/Composer.tsx` (`disabledNoticeFor`, `isTextareaDisabled`, `disabled={disabledNotice !== null}`).
- The composer never clears the last send's outcome. Once the disabled notice is shown, the owner cannot send from that composer again while it stays on screen. `src/features/chat/components/Composer.tsx` (`mutation.data?.errorCode`, no reset of `mutation`).
- Any other error code from the last send leaves the composer usable. `src/features/chat/components/Composer.tsx` (`disabledNoticeFor` returns `null`).
- The composer shows at most one message line under the field. A validation message takes precedence over the disabled notice. `src/features/chat/components/Composer.tsx` (`hasError ? errors.content?.message : disabledNotice`).
- A validation message is announced as an alert. The disabled notice is not. `src/features/chat/components/Composer.tsx` (`role={hasError ? "alert" : undefined}`).
- When the field has a validation message it is marked invalid, and it is described by whichever message line is present. `src/features/chat/components/Composer.tsx` (`aria-invalid={hasError}`, `aria-describedby={describedBy}`).
- The text field's accessible label is "Mensagem para o assistente". `src/features/chat/components/Composer.tsx` (`LABEL_TEXTAREA`).
- The send button's accessible name is "Enviar mensagem". `src/features/chat/components/Composer.tsx` (`ARIA_SEND`).
- The stop button's accessible name is "Parar geração". `src/features/chat/components/Composer.tsx` (`ARIA_STOP`).
- The composer band's accessible name is "Compositor de mensagem". `src/features/chat/components/Composer.tsx` (`aria-label="Compositor de mensagem"`).
- The composer's footer row is rendered empty: no usage readout appears under the composer. `src/features/chat/components/Composer.tsx` (`composer-usage-slot`).

### Message list (history and the turn in flight)
- While the history is loading, three placeholder bubbles are shown in the order assistant, owner, assistant, and the list is marked busy. `src/features/chat/components/MessageStream.tsx` (`SKELETON_ROWS`, `LoadingSkeleton`, `aria-busy="true"`).
- When the history fails to load, an inline alert says "Não foi possível carregar o histórico. Tente novamente.". The same text is the alert's accessible name. `src/features/chat/components/MessageStream.tsx` (`ErrorBanner`, `COPY_ERROR`, `role="alert"`).
- The history-failure alert offers "Tentar novamente", which loads the history again. `src/features/chat/components/MessageStream.tsx` (`COPY_RETRY`, `query.refetch()`).
- When the conversation has no messages and no turn is streaming, the list says "Nenhuma mensagem ainda. Envie uma mensagem para começar.". `src/features/chat/components/MessageStream.tsx` (`COPY_EMPTY`, `isEmpty = messages.length === 0 && !isStreaming`).
- The history is shown in the order the message listing returns its items. The screen does not re-sort it. `src/features/chat/components/MessageStream.tsx` (`query.data?.items`, `messages.map`).
- Each message is shown as a bubble styled by its message role. `src/features/chat/components/MessageStream.tsx` (`variant={m.role}`).
- A message's shown text joins the `text` of its content blocks in order. A block without text adds nothing. `src/features/chat/components/MessageStream.tsx` (`joinContent`).
- A message with a non-null stop reason passes that reason to its bubble. A message whose stop reason is null passes none. `src/features/chat/components/MessageStream.tsx` (`m.stop_reason !== null ? { stopReason } : {}`).
- While a turn is streaming, an extra assistant bubble below the history shows the assistant text received so far, marked as streaming. `src/features/chat/components/MessageStream.tsx` (`isStreaming ? <ChatBubble key="streaming" content={streamingText} streaming>`).
- When streaming ends for any reason, the in-flight bubble is removed. The screen keeps no in-flight text after that. `src/features/chat/components/MessageStream.tsx` (`isStreaming ? … : null`).
- A turn that ends in failure gets no failure wording from the message list. The in-flight bubble is removed, and the waiting hint does not show in the failed phase. `src/features/chat/components/MessageStream.tsx` (streaming bubble without `error`), `src/features/chat/components/ChatStatusIndicator.tsx` (returns `null` unless `thinking`/`tool_running`).
- The waiting hint sits below the last bubble and only in the list's non-empty state. It is not shown while the history is loading or after the history failed to load. `src/features/chat/components/MessageStream.tsx` (`<ChatStatusIndicator />` inside the success branch).
- The message list's accessible name is "Mensagens da conversa". It is a polite live region in every state, and it is marked busy only while loading or while a turn is streaming. `src/features/chat/components/MessageStream.tsx` (`LABEL_REGION`, `aria-live="polite"`, `aria-busy`).
- When the history first loads, the list jumps to the bottom without animation. `src/features/chat/components/MessageStream.tsx` (`useLayoutEffect`, `behavior: "auto"`).
- That first jump happens once while the message list stays on screen. Switching to another conversation with the list still on screen does not repeat it. `src/features/chat/components/MessageStream.tsx` (`hasInitialScrolledRef`).
- Each time the streamed assistant text grows, the list scrolls to the bottom: smoothly, or without animation when the owner prefers reduced motion. Nothing else triggers this scroll; a tool call starting or ending does not. `src/features/chat/components/MessageStream.tsx` (`useEffect` on `[streamingText, isStreaming, prefersReducedMotion]`).
- When the message list leaves the screen, it aborts any turn in flight. `src/features/chat/components/MessageStream.tsx` (unmount cleanup, `controller?.abort()`).

### Waiting hint (status indicator)
- While the assistant is thinking, the hint reads "pensando…". `src/features/chat/components/ChatStatusIndicator.tsx` (`COPY_THINKING`).
- While a tool call runs, the hint reads "consultando a memória… (<tool>)", naming the most recent tool call still waiting for its result. With none waiting, it reads "consultando a memória…". `src/features/chat/components/ChatStatusIndicator.tsx` (`COPY_TOOL_PREFIX`, `pickActiveToolName`).
- A tool call counts as waiting for its result while its outcome is null. `src/features/chat/components/ChatStatusIndicator.tsx` (`chip.ok === null`).
- In every other phase (idle, text streaming, failed), the hint is not shown. `src/features/chat/components/ChatStatusIndicator.tsx` (`if (chatStatus !== "thinking" && chatStatus !== "tool_running") return null`).
- The hint is a polite, atomic status region, so every change is announced whole. `src/features/chat/components/ChatStatusIndicator.tsx` (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`).

### Streaming cursor
- The streaming cursor is hidden from assistive technology. `src/features/chat/components/StreamingCursor.tsx` (`aria-hidden="true"`).

### Tool-call chip
- A tool-call chip shows the tool's name and, when it is not empty, the summary of the call's arguments. `src/features/chat/components/ToolCallChip/ToolCallChip.tsx` (`tool`, `argsSummary.length > 0`).
- A chip's status is "em andamento" while the result is awaited (outcome null), "concluído" when the outcome is true, and "erro" when it is false. `src/features/chat/components/ToolCallChip/ToolCallChip.tsx` (`statusLabel`).
- A chip's accessible name is "<tool> — <status>", and the chip is a status region. `src/features/chat/components/ToolCallChip/ToolCallChip.tsx` (`ariaLabel = \`${tool} — ${status}\``, `role="status"`).
- A chip takes one tool call, given by tool name, argument summary and outcome. `src/features/chat/components/ToolCallChip/ToolCallChip.types.ts` (`ToolCallChipProps.chip`).

### Usage badge
- The usage badge shows three counts of the conversation usage: tokens in, tokens out, and tool calls. It does not show the message count. `src/features/chat/components/UsageBadge/UsageBadge.tsx` (`tokens_in`, `tokens_out`, `tool_calls`).
- The badge shows nothing while the usage is loading or when no usage is available, which includes a failed load. It has no placeholder and no zero state. `src/features/chat/components/UsageBadge/UsageBadge.tsx` (`if (query.isLoading || query.data == null) return null`).
- The badge's accessible name is "Uso: X tokens de entrada, Y tokens de saída, Z chamadas de ferramenta", filled with the three counts. `src/features/chat/components/UsageBadge/UsageBadge.tsx` (`buildAriaLabel`).
- The badge reads the usage of the one conversation it is given. `src/features/chat/components/UsageBadge/UsageBadge.types.ts` (`conversationId`).

## Answers
- Send message — content is empty → inline alert, nothing sent ("Digite uma mensagem antes de enviar."). `src/features/chat/components/Composer.tsx` (`MSG_EMPTY`, `.min(1)`).
- Send message — content is longer than 32768 characters → inline alert while typing, nothing sent ("A mensagem é muito longa. Reduza o texto."). `src/features/chat/components/Composer.tsx` (`MSG_TOO_LONG`, `.max(MAX_CONTENT_LENGTH)`).
- Send message — the last send ended with `BUSINESS_CHAT_DISABLED` → text field and send button disabled, inline notice ("O chat está temporariamente indisponível (desativado)."). `src/features/chat/components/Composer.tsx` (`DISABLED_CHAT_DISABLED`).
- Send message — the last send ended with `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` → text field and send button disabled, inline notice ("O provedor do chat está indisponível. Tente novamente em instantes."). `src/features/chat/components/Composer.tsx` (`DISABLED_PROVIDER_UNAVAILABLE`).
- Send message — the last send ended with any other error code → the composer stays usable, the typed text is kept, and the composer shows no notice. `src/features/chat/components/Composer.tsx` (`disabledNoticeFor` returns `null`, `onSubmit`).
- Send message — the conversation is archived → no input offered; banner "Conversa arquivada" / "Esta conversa está arquivada. Reative para enviar novas mensagens." with the action "Reativar". `src/features/chat/components/Composer.tsx` (`ArchivedBanner`).
- List messages — the history cannot be loaded → inline alert "Não foi possível carregar o histórico. Tente novamente." with "Tentar novamente". `src/features/chat/components/MessageStream.tsx` (`ErrorBanner`).
- Get conversation usage — the usage is loading, cannot be loaded, or is absent → the badge shows nothing. `src/features/chat/components/UsageBadge/UsageBadge.tsx` (`query.isLoading || query.data == null`).

## Vocabularies
- Waiting-hint phases the indicator shows: `thinking` ("pensando…"), `tool_running` ("consultando a memória…"). Every other phase shows nothing. `src/features/chat/components/ChatStatusIndicator.tsx` (`chatStatus`).
- Tool-call chip states: `pending` ("em andamento"), `ok` ("concluído"), `error` ("erro"). `src/features/chat/components/ToolCallChip/ToolCallChip.tsx` (`data-state`, `statusLabel`).
- Message list states: `loading`, `error`, `streaming`, `empty`, `success`. `src/features/chat/components/MessageStream.tsx` (`data-state`).
- Error codes that disable the composer: `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. `src/features/chat/components/Composer.tsx` (`disabledNoticeFor`).
- Placeholder bubble kinds while loading: `assistant`, `user`. `src/features/chat/components/MessageStream.tsx` (`SKELETON_ROWS`).

## Upstream artifacts
- The route search parameter `conversation` carries the active conversation's identifier. `src/features/chat/components/ChatWorkspace.tsx` (`chatRoute.useSearch()`).
- The conversation detail is read for its `archivedAt`. `src/features/chat/components/ConversationView.tsx` (`useGetConversation`, `archivedAt`).
- The conversation update is sent as `{ id, archivedAt: null }` to unarchive. `src/features/chat/components/ConversationView.tsx` (`useUpdateConversation`).
- The send-message operation takes `{ conversationId, content }` and resolves with an `errorCode` that is null on success. `src/features/chat/components/Composer.tsx` (`useSendMessage`, `mutateAsync`, `result.errorCode`).
- The message listing returns `items`. Each message carries `id`, `role`, a `content` array of blocks with an optional `text`, and `stop_reason`. `src/features/chat/components/MessageStream.tsx` (`useListMessages`, `ChatMessage`, `ChatContentBlock`).
- The conversation usage carries `tokens_in`, `tokens_out` and `tool_calls`. `src/features/chat/components/UsageBadge/UsageBadge.tsx` (`useGetConversationUsage`).
- A tool call in the turn carries `tool`, `argsSummary` and `ok` (true, false or null while awaited). `src/features/chat/components/ToolCallChip/ToolCallChip.tsx` (`ToolCallData`), `src/features/chat/components/ChatStatusIndicator.tsx` (`ToolCallData`).
- The turn store supplies `isStreaming`, `streamingText`, `toolChips`, `abortController` and `chatStatus`. `src/features/chat/components/Composer.tsx` (`useChatTurnStore`), `src/features/chat/components/MessageStream.tsx` (`useChatTurnStore`), `src/features/chat/components/ChatStatusIndicator.tsx` (`useChatTurnStore`).
- The graph store supplies `nodes`, `links`, `status`, `errorMessage` and `clear`. The graph pane and node detail panel are owned by the graph feature. `src/features/chat/components/ChatWorkspace.tsx` (`useGraphStore`, `GraphSpace`, `NodeDetailPanel`, `useGraphPersistence`).

## Outside the domain
- Two-column 40/60 split with stacking below the container breakpoint: layout. `src/features/chat/components/ChatWorkspace.tsx`.
- Map-to-array memoization, store subscription choices, and the unused graph handle ref: rendering wiring. `src/features/chat/components/ChatWorkspace.tsx`.
- Local `safeZodResolver` working around a resolver/Zod version mismatch: framework wiring. `src/features/chat/components/Composer.tsx`.
- GlassSurface bands, button variants, icons, colours, spacing, the placeholder "Pergunte algo…", and the visually hidden label technique: surface. `src/features/chat/components/Composer.tsx`.
- Placeholder bubble widths, pulse animation, and the jsdom `scrollIntoView` guard: surface and test accommodation. `src/features/chat/components/MessageStream.tsx`.
- Spinner icon and its reduced-motion guard: surface. `src/features/chat/components/ChatStatusIndicator.tsx`.
- Cursor shape and its 1.1s blink loop gated on reduced motion: surface. `src/features/chat/components/StreamingCursor.tsx`.
- Chip icons and state colours: surface. `src/features/chat/components/ToolCallChip/ToolCallChip.tsx`.
- Arrow and gear glyphs hidden from assistive technology: surface. `src/features/chat/components/UsageBadge/UsageBadge.tsx`.
- `data-testid` attributes throughout: test hooks. `src/features/chat/components/ConversationView.tsx`, `src/features/chat/components/MessageStream.tsx`, `src/features/chat/components/Composer.tsx`.
- Prop type declarations and re-export barrels: module wiring. `src/features/chat/components/Composer.types.ts`, `src/features/chat/components/ToolCallChip/ToolCallChip.types.ts`, `src/features/chat/components/ToolCallChip/index.ts`, `src/features/chat/components/UsageBadge/UsageBadge.types.ts`, `src/features/chat/components/UsageBadge/index.ts`, `src/features/chat/components/index.ts`.

## Observed and not decided here
- The usage badge renders the three usage counts with the name "Uso: X tokens de entrada, Y tokens de saída, Z chamadas de ferramenta" (`src/features/chat/components/UsageBadge/UsageBadge.tsx`, `UsageBadge`). The composer renders its usage footer as an empty row and mounts no badge (`src/features/chat/components/Composer.tsx`, `composer-usage-slot`). No file in the area mounts the badge.
- The tool-call chip renders tool name, argument summary and "em andamento" / "concluído" / "erro" (`src/features/chat/components/ToolCallChip/ToolCallChip.tsx`, `ToolCallChip`). The message list renders the in-flight bubble with only its text and no chips (`src/features/chat/components/MessageStream.tsx`, streaming `ChatBubble`). No file in the area mounts a chip.
- The streaming cursor is exported for the in-flight bubble (`src/features/chat/components/StreamingCursor.tsx`, `StreamingCursor`). The message list passes `streaming` to the bubble and mounts no cursor itself (`src/features/chat/components/MessageStream.tsx`, streaming `ChatBubble`).
- On a conversation change, the graph and the node selection are reset (`src/features/chat/components/ChatWorkspace.tsx`, `useEffect` on `[conversation]`). The turn in flight is aborted only when the message list leaves the screen (`src/features/chat/components/MessageStream.tsx`, unmount cleanup). The first-load scroll flag is also never reset on a conversation change (`src/features/chat/components/MessageStream.tsx`, `hasInitialScrolledRef`).
