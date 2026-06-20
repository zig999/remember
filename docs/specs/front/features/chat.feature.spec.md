# Feature Spec — Chat (`/chat`)

> Route: `/chat` — **primary view** (owner decision 2026-06-20; `/` redirects here)
> Domain: chat (single domain — all 9 operationIds)
> Version: 1.0.0 | Status: draft | Layer: permanent

> This is the feature spec for the chat conversation workspace. It documents the implemented code;
> the source of truth is `frontend/src/features/chat/`. Cross-references: `front.md`, `chat.flow.md`,
> `ChatBubble.component.spec.md`, `ConversationMenu.component.spec.md`.

---

## §1 Consumed Endpoints

> Selection map only — Method+Path and Auth are in `domains/chat/openapi.yaml`.

| Domain | operationId | Purpose |
|---|---|---|
| chat | `listConversations` | Load conversation list for `ConversationMenu`; drives `include_archived` toggle |
| chat | `createConversation` | `onCreate` in `ConversationMenu` / `HeaderConversationMenu` |
| chat | `getConversation` | Load the active conversation's metadata (title, `archived_at`) |
| chat | `updateConversation` | Rename, archive, or unarchive the active or listed conversation |
| chat | `deleteConversation` | Delete a conversation from the list (cascade) |
| chat | `listMessages` | Load persisted message history for `MessageStream` |
| chat | `sendMessage` | Submit a user turn; SSE stream drives streaming bubble in `MessageStream` |
| chat | `getConversationUsage` | Lazy token + tool-call aggregates shown in `UsageBadge` inside `Composer` |
| chat | `cancelTurn` | Cooperative stop — invoked by `Composer` stop button via `useCancelTurn` |

---

## §2 Feature States (UI)

### UI-01 — idle / empty (no conversation selected)

**Entry condition:** `/chat` mounted with no `?conversation` search param, OR the param is missing/empty.

- `ChatWorkspace` renders the 40%/60% split.
- Left column (`ConversationView`, `conversationId = undefined`): centered copy "Selecione ou crie uma conversa para começar."
- Right column: glass stub panel "Grafo em breve".
- `ConversationMenu` in the `Header` shows trigger label "Nova conversa".
- No data fetches for messages or usage (neither conversationId is available).

### UI-02 — loading (history fetch in progress)

**Entry condition:** `?conversation=<uuid>` present, `useListMessages` is in `isPending` state.

- `MessageStream` shows `data-state="loading"`.
- Three alternating skeleton bubbles (assistant 3/5 width, user 2/5, assistant 4/5) with `animate-pulse`.
- Root `<section>` has `aria-busy="true"` and `aria-live="polite"`.
- `Composer` is already mounted and active (send mode) — loading is scoped to the message list only.

### UI-03 — success (history loaded, no streaming)

**Entry condition:** `useListMessages` resolves successfully; `useChatTurnStore.isStreaming === false`.

- `MessageStream` shows `data-state="success"`.
- Persisted messages rendered in chronological order as `ChatBubble` with `animate={false}` (no entrance flash on initial load).
- User bubbles: `variant="user"` (right-aligned). Assistant bubbles: `variant="assistant"` (left-aligned).
- `aria-busy` absent on the region.
- Auto-scrolled to the bottom on initial mount (scroll behavior `auto`).
- `Composer` in send mode: `GlassSurface level="ambient"`, textarea enabled, Send button visible.
- `UsageBadge` visible in Composer footer once `getConversationUsage` resolves.

### UI-04 — streaming (SSE turn open)

**Entry condition:** `useSendMessage` mutation started; `useChatTurnStore.isStreaming === true`.

- `MessageStream` shows `data-state="streaming"`.
- Root `<section>` gains `aria-busy="true"` (live region already `polite`).
- Optimistic user bubble appended immediately (before SSE opens).
- Streaming assistant bubble (`key="streaming"`) appended: `variant="assistant"`, `streaming={true}`, `animate={true}`; `StreamingCursor` blinks at the tail of accumulated text.
- `ToolCallChip` list rendered above bubble content, one chip per `tool_start` frame; chips transition pending → success/error as `tool_result` frames arrive.
- `Composer` switches to **stop mode**: textarea `disabled`, Send button replaced by destructive Stop button with `aria-label="Parar geração"`.
- Auto-scroll fires after each `text_delta` (smooth behavior, `auto` when `prefers-reduced-motion`).
- Document-level `keydown` listener active for `Escape` → abort.

### UI-05 — streaming-done (turn ended, invalidation in flight)

**Entry condition:** SSE `done` frame received; `isStreaming` flipped to `false`; query invalidation triggered but not yet resolved.

- Streaming assistant bubble removed.
- `Composer` returns to send mode.
- `MessageStream` briefly shows the history list without the assistant response (the invalidation refetch is in flight). No flicker target — the persisted row arrives quickly via the refetch.
- Cache keys invalidated: `conversationKeys.messages(id)` and `conversationKeys.usage(id)`.

### UI-06 — streaming-error (SSE error frame received)

**Entry condition:** SSE stream terminates with an `error` frame (`code`, `message` present).

- `isStreaming` flipped to `false`; `Composer` returns to send mode.
- If the stop reason maps to `BUSINESS_CHAT_DISABLED` or `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`: `Composer` enters disabled inline notice state (UI-10).
- Otherwise: the streaming bubble was removed and no separate banner appears — the user can retry immediately.
- `errorCode` is stored in `mutation.data.errorCode`; `disabledNoticeFor()` in Composer reads it.

### UI-07 — error (history fetch failed)

**Entry condition:** `useListMessages` is in `isError` state.

- `MessageStream` shows `data-state="error"`.
- Inline error band with `AlertTriangle` icon, copy "Não foi possível carregar o histórico. Tente novamente.", and a "Tentar novamente" Button (secondary, sm) that calls `refetch()`.
- `role="alert"` on the error container so screen readers announce it immediately.
- No toast (history failure is a local affordance, not a global notification).
- `Composer` is still mounted and its send mode is still accessible.

### UI-08 — archived (conversation archived, Composer blocked)

**Entry condition:** Active conversation's `archivedAt !== null` (derived from `getConversation` result).

- `Composer` short-circuits to `ArchivedBanner`:
  - `GlassSurface level="ambient"`.
  - `AlertTriangle` icon, title "Conversa arquivada", body "Esta conversa está arquivada. Reative para enviar novas mensagens."
  - "Reativar" Button (secondary, sm) emits `onUnarchive` → `updateConversation({ archived_at: null })`.
- History messages still visible (read is unconditional per BR-25).
- `SendMessage` mutation is not reachable from this state.

### UI-09 — empty conversation (history loaded, zero messages, no streaming)

**Entry condition:** `useListMessages` resolves with `items = []`; `isStreaming === false`.

- `MessageStream` shows `data-state="empty"`.
- Centered copy: "Nenhuma mensagem ainda. Envie uma mensagem para começar."
- `Composer` in normal send mode — user can immediately type.

### UI-10 — disabled (provider unavailable or chat disabled)

**Entry condition:** Last `useSendMessage` result returned `errorCode === "BUSINESS_CHAT_DISABLED"` or `errorCode === "BUSINESS_CHAT_PROVIDER_UNAVAILABLE"`.

- `Composer` send-band: textarea `disabled`, Send button `disabled`.
- Inline notice below the textarea:
  - `BUSINESS_CHAT_DISABLED`: "O chat está temporariamente indisponível (desativado)."
  - `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`: "O provedor do chat está indisponível. Tente novamente em instantes."
- `aria-describedby` on the textarea points at the notice paragraph ID.
- State is transient: a page reload (which resets mutation state) or a new session restores send mode.

---

## §3 State Transition Table

| From | Trigger | To | Side Effect |
|---|---|---|---|
| UI-01 | URL gains `?conversation=<uuid>` (select or create) | UI-02 | `listMessages(id)` fires; `getConversation(id)` fires; `getConversationUsage(id)` fires lazy |
| UI-02 | `listMessages` resolves (empty) | UI-09 | — |
| UI-02 | `listMessages` resolves (non-empty) | UI-03 | Auto-scroll to bottom (behavior: `auto`) |
| UI-02 | `listMessages` rejects | UI-07 | `role="alert"` banner replaces skeleton |
| UI-03 | User submits Composer | UI-04 | Generate `Idempotency-Key` (`crypto.randomUUID()`); optimistic user bubble inserted into `messages` cache; `AbortController` stashed in `useChatTurnStore`; SSE opened via `streamChat` |
| UI-04 | `text_delta` frame | UI-04 | `appendText(delta)`; auto-scroll (smooth) |
| UI-04 | `tool_start` frame | UI-04 | `addToolChip({ tool, argsSummary, ok: null })` |
| UI-04 | `tool_result` frame | UI-04 | `updateLastToolChip(ok)` |
| UI-04 | `done` frame | UI-05 | `setStreaming(false)`; `setAbortController(null)`; `invalidateQueries(messages(id))`; `invalidateQueries(usage(id))` |
| UI-04 | `error` frame (BUSINESS_CHAT_DISABLED / BUSINESS_CHAT_PROVIDER_UNAVAILABLE) | UI-10 | `setStreaming(false)`; `setAbortController(null)`; `errorCode` stored in `mutation.data` |
| UI-04 | `error` frame (other codes) | UI-03 | `setStreaming(false)`; `setAbortController(null)` |
| UI-04 | Stop button clicked / Esc pressed | UI-04→UI-05 | `abortController.abort()`; `useCancelTurn` fires `POST cancel` (best-effort); SSE emits `done{stop_reason:"cancelled"}` |
| UI-04 | Component unmount (navigation) | — | `abortController.abort()` (in `useEffect` cleanup) |
| UI-05 | `invalidateQueries` refetch completes | UI-03 | Streaming bubble gone; persisted assistant row appears in history list |
| UI-07 | "Tentar novamente" clicked | UI-02 | `query.refetch()` |
| UI-08 | "Reativar" clicked → `updateConversation` succeeds | UI-03 | `conversationKeys.all` invalidated; `Composer` switches to send mode |
| any | `?conversation` param removed from URL | UI-01 | `useChatTurnStore.reset()`; all conversation-scoped queries become inactive |
| any | `?conversation` param changed to a different UUID | UI-02 | `useChatTurnStore.reset()`; new conversation's queries fire |
| UI-01 | `onCreate()` fires → `createConversation` succeeds | UI-02 | Navigate to `/chat?conversation=<new-id>`; `conversationKeys.all` invalidated |
| any | `onDelete(id)` fires (active conversation) | UI-01 | Navigate to `/chat`; `conversationKeys.all` invalidated |
| any | `onArchive(id)` fires (active conversation) | UI-01 | Navigate to `/chat`; `conversationKeys.all` invalidated |

---

## §4 Requests, Order and Cache

### Execution order

On mount with `?conversation=<uuid>`:

1. **Parallel (on mount):**
   - `listConversations` (ConversationMenu, Header) — priority: high; staleTime: 30s; refetchOnWindowFocus: true
   - `getConversation(id)` — priority: critical; staleTime: 30s; refetchOnWindowFocus: true
   - `listMessages(id)` — priority: critical; staleTime: 0; refetchOnWindowFocus: true
2. **Sequential after step 1 #2 and #3 settle:**
   - `getConversationUsage(id)` — priority: lazy; staleTime: 30s; refetchOnWindowFocus: false

On mount without `?conversation`:
- Only `listConversations` fires (Header always mounts on `/chat`).

### Cache keys

```ts
conversationKeys.all                  // ["conversations"]  — root invalidation
conversationKeys.list({ includeArchived }) // ["conversations", "list", { includeArchived }]
conversationKeys.detail(id)           // ["conversations", id]
conversationKeys.messages(id)         // ["conversations", id, "messages"]
conversationKeys.usage(id)            // ["conversations", id, "usage"]
```

TTL / revalidation summary:

| Query | staleTime | refetchOnWindowFocus |
|---|---|---|
| `listConversations` | 30 s | true |
| `getConversation(id)` | 30 s | true |
| `listMessages(id)` | 0 (volatile) | true |
| `getConversationUsage(id)` | 30 s | false (lazy) |

### Response transforms

Applied in `features/chat/api/_transforms.ts`:

| operationId | Transform |
|---|---|
| `listConversations` | `Conversation.archived_at: string\|null` → `archivedAt: Date\|null`; `created_at: string` → `createdAt: Date`; drops `summary_rolling`, `updated_at` (unused by SPA) |
| `getConversation` | Same date casts as above |
| `listMessages` | `ChatMessage.created_at: string` → `createdAt: Date`; all other fields passed through verbatim |
| `getConversationUsage` | `result.messages: number` → `messageCount: number` (rename); all other fields pass through |

### Composed models

`ActiveConversation` (defined in `features/chat/types.ts`) is assembled at the feature level by composing:

- `getConversation` → `id`, `title`, `isArchived`, `archivedAt`
- `listMessages` → `messages[]`
- `getConversationUsage` → `usage` (optional — arrives lazily)

`ConversationView` receives `conversationId` from `ChatWorkspace`; `MessageStream` and `Composer` fetch their respective slices independently via their own hooks.

---

## §5 Input Validations

> Technical constraints (required, minLength, maxLength) are in `openapi.yaml`. This section covers user-facing messages and timing only.

| Field | Trigger | User message |
|---|---|---|
| `content` (Composer textarea) — empty | submit (Enter or send button) | "Digite uma mensagem antes de enviar." |
| `content` — exceeds 32 768 characters | onChange (live) | "A mensagem é muito longa. Reduza o texto." |
| Rename input (ConversationMenu) — empty after trim | Enter key or confirm button | Silently cancels rename (no message — empty trim = cancel) |

Validation is realized by `composerSchema` (Zod `z.object({ content: z.string().min(1).max(32768) })`) wired via `useForm` + a `safeParse`-based resolver. The `mode: "onChange"` setting triggers the live error for the oversized case.

---

## §6 API Error → UI Mapping

> Pre-stream errors arrive as a REST `{ ok: false, error: { code, message } }` envelope.
> In-stream errors arrive as an SSE `error` frame with `{ code, message }`.
> Both paths surface as `mutation.data.errorCode` / `mutation.data.errorMessage`.

| error.code | HTTP / path | Display | Message | Action |
|---|---|---|---|---|
| `RESOURCE_NOT_FOUND` | 404 (any CRUD endpoint) | Inline empty state or inline error per component | "Conversa não encontrada." | Remove `?conversation` param, navigate to `/chat` |
| `BUSINESS_CONVERSATION_ARCHIVED` | 409 (pre-stream `sendMessage`) | `Composer` switches to `ArchivedBanner` (UI-08) | — | "Reativar" → `updateConversation` |
| `BUSINESS_TURN_IN_PROGRESS` | 409 (pre-stream `sendMessage`) | Toast `warning` | "Uma resposta já está sendo gerada. Aguarde." | — |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | 409 (pre-stream `sendMessage`) | Toast `warning` | "Chave duplicada com conteúdo diferente. Tente novamente." | User may retry with new content |
| `BUSINESS_CHAT_DISABLED` | 503 (pre-stream) | Inline notice in Composer (UI-10) | "O chat está temporariamente indisponível (desativado)." | — |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503 (pre-stream or in-stream) | Inline notice in Composer (UI-10) | "O provedor do chat está indisponível. Tente novamente em instantes." | User may retry after waiting |
| `VALIDATION_REQUIRED_FIELD` | 422 | Toast `warning` | "Campo obrigatório ausente." | — (should not occur — `useSendMessage` always sends `Idempotency-Key`) |
| `VALIDATION_INVALID_FORMAT` | 422 | Toast `warning` | "Formato inválido na requisição." | — |
| `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` | 401 | Global: clear token + redirect to `/sign-in?reason=session_expired` | — | Handled by `QueryCache.onError` (see `front.md §5`) |
| `SYSTEM_INTERNAL_ERROR` | in-stream SSE error frame | Toast `danger` | "Algo deu errado. Tente novamente." | — |
| `SYSTEM_NETWORK` | network (client-generated) | Toast `danger` | "Falha de rede ao contactar o servidor." | Retry |
| `SYSTEM_INVALID_RESPONSE` | client-generated (null body) | Toast `danger` | "Resposta do servidor sem corpo." | — |
| `SYSTEM_UPSTREAM` | 5xx pre-stream | Toast `danger` | "Algo deu errado. Tente novamente." | — |

---

## §7 Shared Components Used

> Only `src/components/` global components (never feature-local ones).

| Component | File | Used by | Notes |
|---|---|---|---|
| `GlassSurface` | `components/ds/GlassSurface/` | `ChatWorkspace` (graph stub), `Composer` (ambient level), `ArchivedBanner` (ambient level), `ChatBubble` (modal level) | |
| `ChatBubble` | `components/ds/ChatBubble/` | `MessageStream` | See adapter block below |
| `ConversationMenu` | `components/ds/ConversationMenu/` | `Header` (via `HeaderConversationMenu`) | See adapter block below |
| `Button` | `components/ui/button/` | `MessageStream` (retry), `Composer` (send/stop), `ArchivedBanner`, `ConversationMenu` | Direct prop mapping — no adapter needed |
| `Textarea` | `components/ui/textarea/` | `Composer` | Direct — `id`, `invalid`, `disabled`, `aria-describedby`, `onKeyDown` + RHF `register` spread |
| `Input` | `components/ui/input/` | `ConversationMenu` (rename inline) | Direct |
| `Switch` | `components/ui/switch/` | `ConversationMenu` (include_archived toggle) | Direct |

### Component adapters

**ChatBubble adapter (in `MessageStream`):**

`MessageStream` consumes `ChatMessage` (wire shape) and maps to `ChatBubble` props:

| ChatBubble prop | Source / derivation |
|---|---|
| `variant` | `ChatMessage.role` — same values (`"user"` / `"assistant"`) |
| `content` | `joinContent(ChatMessage.content)` — joins text blocks from `content[]` array into a single string |
| `animate` | `false` for history bubbles (no entrance cascade on initial load) |
| `streaming` | `true` only for the live streaming bubble (not from API; from `useChatTurnStore.isStreaming`) |
| `stopReason` | `ChatMessage.stop_reason ?? undefined` — only `"cancelled"` triggers a visible notice |
| `toolChips` | Not from `listMessages` — tool chips exist only on the live streaming bubble, from `useChatTurnStore.toolChips` |

**ConversationMenu adapter (in `HeaderConversationMenu`):**

`HeaderConversationMenu` composes `useListConversations`, `useCreateConversation`, `useUpdateConversation`, `useDeleteConversation` and maps to `ConversationMenu` props:

| ConversationMenu prop | Source / derivation |
|---|---|
| `activeConversationId` | URL `?conversation` param (from `Header.useLocation`) — `undefined` → `null` |
| `activeTitle` | `conversations.find(c => c.id === activeConversationId)?.title ?? null` |
| `conversations` | `listQuery.data?.items ?? []` |
| `isLoading` | `listQuery.isLoading` |
| `includeArchived` | Local `useState(false)` in `HeaderConversationMenu` |
| `onSelect(id)` | `navigate({ to: "/chat", search: { conversation: id } })` |
| `onCreate()` | `createMutation.mutate(undefined, { onSuccess: (c) => navigate(…) })` |
| `onRename(id, newTitle)` | `updateMutation.mutate({ id, title: newTitle })` |
| `onArchive(id)` | `updateMutation.mutate({ id, archivedAt: <now iso> }, { onSuccess: () => navigate if active })` |
| `onUnarchive(id)` | `updateMutation.mutate({ id, archivedAt: null })` |
| `onDelete(id)` | `deleteMutation.mutate({ id }, { onSuccess: () => navigate if active })` |
| `onIncludeArchivedChange(v)` | `setIncludeArchived(v)` |

---

## §8 Feature Accessibility

> Baseline: WCAG 2.2 AA.

| Requirement | Implementation |
|---|---|
| Live region for streaming | Root `<section aria-live="polite">` in `MessageStream`. `aria-busy="true"` only while `isStreaming`. Never nested inside a bubble — one live region announces all updates. |
| Loading state announced | `aria-busy="true"` on the same `<section>` while `useListMessages.isPending`. |
| Streaming cursor hidden from AT | `StreamingCursor` has `aria-hidden="true"` always. |
| Error announcement | `role="alert"` on `ErrorBanner` (history fetch failure); separate from the live region to announce immediately. |
| Archived banner landmark | `role="region" aria-label="Conversa arquivada"` on `ArchivedBanner`. |
| Composer textarea label | `<label htmlFor={textareaId} className="sr-only">Mensagem para o assistente</label>`. |
| Composer send button | `aria-label="Enviar mensagem"`. |
| Composer stop button | `aria-label="Parar geração"`. |
| `aria-invalid` on invalid field | `Textarea` receives `invalid={hasError}` — the component maps to `aria-invalid="true"`. |
| `aria-describedby` on invalid field | Points at the inline message paragraph when a validation or disabled-notice message is present. |
| Esc to abort streaming | Document-level `keydown` listener installed when `isStreaming`; `Escape` → `abortController.abort()`. A disabled textarea cannot focus, so the listener must be on `document` (not the element). |
| Enter to submit | `onKeyDown` on textarea: `Enter` (without Shift) → `formRef.current.requestSubmit()`. `Shift+Enter` preserves default newline behavior. |
| Tool chips announced | `role="status"` on each `ToolCallChip`; `aria-label="{tool} — {status}"` in pt-BR. |
| Usage badge announced | `role="status"` on `UsageBadge`; `aria-label="Uso: X tokens de entrada, Y tokens de saída, Z chamadas de ferramenta"`. |
| Keyboard target size | All interactive elements ≥ 32 px (project floor, §10 of `front.md`). `ConversationMenu` items are `min-h-10` (40 px per spec §9). |
| Focus on conversation create | After `createConversation` succeeds, navigation fires → router mounts new conversation view — focus lands at the document body per TanStack Router default. |
| Focus return after delete dialog | `ConversationMenu` stores a `triggerRef`; after dialog close, `queueMicrotask(() => triggerRef.current?.focus())` restores focus to the trigger button. |

---

## §9 BDD Scenarios

> These are feature invariants — regression anchors. They are NOT Task Contract acceptance criteria.

### Scenario 1 — Happy path: send a message and receive a streaming response

**Given** `/chat?conversation=<uuid>` is mounted and `listMessages` has resolved with some history  
**When** the user types a message and presses `Enter`  
**Then** an optimistic user bubble appears immediately  
**And** a streaming assistant bubble with a blinking cursor appears  
**And** the Composer switches to stop mode (stop button visible, textarea disabled)  
**And** as `text_delta` frames arrive, the streaming text accumulates  
**And** after the `done` frame, `isStreaming` flips false and the Composer returns to send mode  
**And** after the invalidation refetch, the persisted assistant message replaces the streaming bubble  

### Scenario 2 — Select conversation from menu

**Given** the user is on `/chat` (no `?conversation`)  
**When** the user opens `ConversationMenu` and selects a conversation  
**Then** the URL becomes `/chat?conversation=<id>`  
**And** `listMessages(id)` fires  
**And** the skeleton (UI-02) is visible until history loads  

### Scenario 3 — Archive active conversation

**Given** the user is on `/chat?conversation=<uuid>` in send mode  
**When** the user archives the active conversation from `ConversationMenu`  
**Then** the URL becomes `/chat` (no `?conversation`)  
**And** `ConversationView` shows the empty state (UI-01)  

### Scenario 4 — Provider unavailable disables Composer

**Given** the user sends a message and the BFF returns `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (pre-stream)  
**Then** the Composer enters disabled mode (UI-10)  
**And** the inline notice "O provedor do chat está indisponível. Tente novamente em instantes." is shown  
**And** the send button is disabled  

### Scenario 5 — Stop during streaming

**Given** the assistant bubble is streaming text  
**When** the user clicks the Stop button OR presses `Escape`  
**Then** `abortController.abort()` fires  
**And** the SSE stream terminates  
**And** `isStreaming` flips false  
**And** the Composer returns to send mode  

---

## §10 Components Created / Updated

| Component Name | Action | Feature | Rationale |
|---|---|---|---|
| `ChatBubble` | create | chat | Shared DS atom for every message bubble (assistant and user, history and streaming) |
| `ConversationMenu` | create | chat | Shared DS component for conversation management dropdown in Header |
| `ChatWorkspace` | create | chat | Feature-local page component (40%/60% container-query split) |
| `ConversationView` | create | chat | Feature-local column wrapper — routes between empty state and message/compose view |
| `MessageStream` | create | chat | Feature-local scrollable history + streaming bubble list |
| `Composer` | create | chat | Feature-local input band (send / stop / archived / disabled modes) |
| `StreamingCursor` | create | chat | Feature-local blinking cursor, purely decorative, `aria-hidden` |
| `ToolCallChip` | create | chat | Feature-local tool-call status chip rendered inside ChatBubble during streaming |
| `UsageBadge` | create | chat | Feature-local usage counters in Composer footer |
| `HeaderConversationMenu` | create | chat | Shell adapter that wires `ConversationMenu` to chat data layer; mounts in `Header` only on `/chat` |

> `ChatBubble` and `ConversationMenu` qualify for their own `component.spec.md` files (used in 2+ contexts; complex internal logic). See `ChatBubble.component.spec.md` and `ConversationMenu.component.spec.md`.

---

## §11 Out of Scope

The following are explicitly deferred from this wave and must NOT be inferred from the implemented code or from the API contract:

- **Chat ↔ Graph interaction** — clicking a node in the chat response does not open it in the graph pane and vice versa. The right-column is a static stub ("Grafo em breve").
- **Graph explorer** (`/graph`) — the full-screen standalone graph explorer is a later wave.
- **Write / curation tools** — the chat assistant uses read-only query tools only (13-tool catalog).
- **Embeddings / semantic retrieval** — retrieval is purely lexical + graph; no vectors.
- **Cost (USD) and citations** — `cost_usd` and `citations` fields are not in the API v2 and not rendered.
- **History pagination beyond initial load** — `listMessages` fetches a single page (default limit 50). Infinite scroll / "load older" (`before` param) is not implemented.
- **⌘K shortcut** — the command palette toggle is wired but the palette UI is a later wave.
- **Backend / migration changes** — this spec covers frontend only.
- **Multi-instance BFF coordination** — in-flight turn registry is single-process.

---

## Data Layer Notes

### `conversationKeys` (key factory)

Defined in `features/chat/api/keys.ts`. Shape:

```ts
conversationKeys.all                                  // root: ["conversations"]
conversationKeys.list({ includeArchived?: boolean })  // ["conversations", "list", { includeArchived }]
conversationKeys.detail(id: string)                   // ["conversations", id]
conversationKeys.messages(id: string)                 // ["conversations", id, "messages"]
conversationKeys.usage(id: string)                    // ["conversations", id, "usage"]
```

All mutation invalidations use `conversationKeys.all` for a broad sweep, or the specific sub-key for targeted invalidation (messages + usage invalidated per-turn by `useSendMessage`).

### `chat-stream.ts` — SSE client

Defined in `features/chat/api/chat-stream.ts`. Not a TanStack Query hook — it is an `AsyncGenerator<ChatSSEFrame>` consumed by `useSendMessage`. Key behaviors:

- Uses `fetch` + `response.body.getReader()` + `TextDecoder`. EventSource cannot POST with `Authorization` header.
- `AbortSignal` from `options.signal` terminates the generator cleanly on abort (returns without throwing).
- Pre-stream HTTP errors (4xx/5xx) are synthesized into a terminal `error` frame and returned.
- Network errors produce a `{ type: "error", code: "SYSTEM_NETWORK" }` frame.
- Malformed frames are skipped silently — a single bad chunk does not terminate the generator.
- Wire `args_summary` (snake_case) is renamed to `argsSummary` (camelCase) at parse time.

SSE frame discriminated union (`ChatSSEFrame`):
- `llm_start` — iteration marker (no UI mutation)
- `text_delta { delta }` — accumulated by `appendText`
- `tool_start { tool, argsSummary }` — creates a pending chip
- `tool_result { ok }` — settles the last chip
- `done { stop_reason }` — terminal success
- `error { code, message }` — terminal failure

### `useSendMessage` — turn orchestrator

Defined in `features/chat/api/useSendMessage.ts`. Coordinates:

1. Reset `useChatTurnStore`; generate `Idempotency-Key` via `crypto.randomUUID()`.
2. Insert optimistic user bubble into `conversationKeys.messages(id)` cache.
3. Create `AbortController`; stash in `useChatTurnStore.setAbortController`.
4. Open SSE via `streamChat`; dispatch each frame to store actions (`appendText`, `addToolChip`, `updateLastToolChip`).
5. On terminal frame: `setStreaming(false)`, `setAbortController(null)`, `invalidateQueries(messages + usage)`.

Auth token read via `useAuthStore.getState().accessToken` at send time (non-reactive — not via hook).

### `useChatTurnStore` — ephemeral streaming state

Defined in `features/chat/state/chat-turn.ts`. Zustand slice. Never persisted (session only). Resets on conversation switch and on turn completion. Fields: `streamingText`, `toolChips`, `abortController`, `idempotencyKey`, `isStreaming`.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Regenerated from implemented code. Primary view (`/`→`/chat`), 40/60 split, SSE streaming, ConversationMenu in Header, 10 UI states, data layer notes. |
