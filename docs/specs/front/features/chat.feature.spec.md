# Feature Spec — Chat (`/chat`)

> Route: `/chat` — **primary view** (owner decision 2026-06-20; `/` redirects here)
> Domain: chat (single domain — all 9 operationIds)
> Version: 1.2.0 | Status: draft | Layer: permanent

> This is the feature spec for the chat conversation workspace. It documents the implemented code;
> the source of truth is `frontend/src/features/chat/` and `frontend/src/features/graph/`.
> Cross-references: `front.md`, `chat.flow.md`, `ChatBubble.component.spec.md`,
> `ConversationMenu.component.spec.md`, `GraphSpace.component.spec.md`, `GraphEdge.component.spec.md`,
> `NodeDetailPanel.component.spec.md`.

---

## §1 Consumed Endpoints

> Selection map only — Method+Path and Auth are in `domains/chat/openapi.yaml` (chat operations) and `domains/knowledge-graph/openapi.yaml` (`getNodeById`).
>
> **v2.3 note:** `start_async_ingestion` and `get_ingestion_status` are server-side tool dispatches inside the `sendMessage` SSE loop (gated by `CHAT_INGEST_ENABLED=true`). They are NOT REST operationIds and do NOT appear in this table. The SPA consumes them only as `tool_start`/`tool_result` SSE frames (see §4 Data Layer Notes / `chat-stream.ts`).

| Domain | operationId | Purpose |
|---|---|---|
| chat | `listConversations` | Load conversation list for `ConversationMenu`; drives `include_archived` toggle |
| chat | `createConversation` | `onCreate` in `ConversationMenu` / `HeaderConversationMenu` |
| chat | `getConversation` | Load the active conversation's metadata (title, `archived_at`) |
| chat | `updateConversation` | Rename, archive, or unarchive the active or listed conversation |
| chat | `deleteConversation` | Delete a conversation from the list (cascade) |
| chat | `listMessages` | Load persisted message history for `MessageStream` |
| chat | `sendMessage` | Submit a user turn; SSE stream drives streaming bubble in `MessageStream` AND emits `graph_delta` frames consumed by `useGraphStore` (see §4.1) |
| chat | `getConversationUsage` | Lazy token + tool-call aggregates shown in `UsageBadge` inside `Composer` |
| chat | `cancelTurn` | Cooperative stop — invoked by `Composer` stop button via `useCancelTurn` |
| knowledge-graph | `getNodeById` | Inline node detail in `NodeDetailPanel` (right column, replaces `GraphSpace` while open) — fetches aliases + current attributes for a selected node |

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
- `ToolCallChip` list rendered above bubble content, one chip per `tool_start` frame; chips transition pending → success/error as `tool_result` frames arrive. When `CHAT_INGEST_ENABLED=true`, the model may also emit `start_async_ingestion` and `get_ingestion_status` tool calls — these produce chips using the same generic chip rendering path (no special UI treatment needed; the chip label uses the tool name verbatim).
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

> **§2 — GraphSpace right-column states (UI-11..UI-14).** The states below describe the 60% right pane (the GraphSpace panel). They are **independent** of UI-01..UI-10 (which describe the 40% chat column) — at any moment one of UI-01..UI-10 (chat column) AND one of UI-11..UI-14 (graph column) is active. The right-column state is driven by `useGraphStore.status` (the `GraphStatus` enum), populated by the SSE `graph_delta` dispatcher (see `chat.flow.md §C — Sub-flow D / Graph reveal sequence`).

### UI-11 — graph empty (right column, no nodes yet)

**Entry condition:** `useGraphStore.status === "empty"` — either no graph tool has run yet in the active conversation, or the conversation was just switched and `clear()` ran.

- `GraphSpace` renders `GraphEmptyState`: centered copy "A memória aparecerá aqui conforme você conversa." inside a `GlassSurface level="ambient"`.
- React Flow canvas is mounted but invisible (no nodes / no edges).
- No `GraphStatusOverlay` is shown.
- `aria-busy="false"` on the panel root.

### UI-12 — graph loading (right column, graph tool in flight)

**Entry condition:** SSE `tool_start` frame for a graph-producing tool (`traverse`, `get_node`, `list_nodes`, `search`) was received; no `graph_delta` has arrived yet.

- `GraphStatusOverlay` is shown above the canvas with copy "Buscando na memória…" and a soft spinner.
- If the panel was previously in UI-13 / UI-14 (graph already populated), the existing subgraph stays visible **underneath** the overlay (no flicker, no clear).
- If the panel was previously in UI-11 (empty), the overlay sits over the empty-state copy.
- `aria-busy="true"` on the panel root; `aria-live="polite"` on the overlay.

### UI-13 — graph revealing (right column, nodes entering 1 by 1)

**Entry condition:** `useGraphStore.status === "revealing"` — at least one `graph_delta` frame was processed; `revealQueue` is non-empty.

- React Flow canvas shows the previously-revealed nodes immediately.
- `useGraphReveal` dequeues one id per tick (default `revealStaggerMs = 90`) and marks it as revealed in `useGraphStore.revealedIds`.
- Each newly-revealed node animates in via Framer Motion: `opacity 0→1` + `scale 0.85→1`, ~180 ms ease-out.
- An edge is only mounted (visible) once **both** its endpoints are in `revealedIds`.
- Existing node positions are **pinned** (d3-force `fx`/`fy`) — no layout jump (`temp/chat-graphspace-plan.md` D5).
- `aria-busy="true"` on the panel root while the queue is draining.
- `prefers-reduced-motion: reduce`: all nodes are revealed in the same tick (`opacity 0→1` only, no scale / no stagger).

### UI-14 — graph ready (right column, stable interactive graph) and UI-14-error (graph error overlay)

**Entry condition (UI-14):** `useGraphStore.status === "ready"` — the `revealQueue` is empty; the `done` frame was received and at least one `graph_delta` was processed in the turn (`receivedDeltaThisTurn`).

- React Flow canvas shows all nodes and edges fully interactive.
- Pan / zoom / fitView controls are active.
- Click on a node fires `onNodeSelect(nodeId)` → `ChatWorkspace` mounts `NodeDetailPanel` in place of `GraphSpace` (inline; never modal/drawer). See `NodeDetailPanel.component.spec.md`.
- `aria-busy="false"` on the panel root.

**Entry condition (UI-14-error):** SSE `error` frame received OR `tool_result` for a graph tool returned `ok: false` while a graph tool was in flight.

- `GraphStatusOverlay` shows a discrete error message (default: "Não foi possível carregar a memória.").
- If a subgraph was already loaded before the error, it **remains visible** underneath the overlay — partial state is preserved (`temp/chat-graphspace-plan.md` UC-CG-06; Golden Rule 12 "fail loud, do not silently downgrade").
- `aria-live="polite"` on the overlay; no toast (graph error is a panel-local affordance, not a global notification).

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

### §3 — GraphSpace right-column transitions (UI-11..UI-14)

> These transitions run independently of the chat-column transitions above and are driven by SSE frames in `useSendMessage` writing to `useGraphStore`. Origin: `temp/chat-graphspace-plan.md` §12.3 (GraphStatus state machine) and §8.2 (event/effect table).

| From | Trigger | To | Side Effect |
|---|---|---|---|
| UI-11 (empty) | SSE `tool_start { tool ∈ graph-producing }` | UI-12 (loading) | `useGraphStore.setStatus("loading")` |
| UI-12 (loading) | SSE `graph_delta { source_tool, nodes[], links[] }` | UI-13 (revealing) | `mapWireToGraphDelta(frame)` → `useGraphStore.addNodes(delta)`; new ids enqueued in `revealQueue`; `setStatus("revealing")` |
| UI-13 (revealing) | `revealQueue` drained AND SSE `done` received | UI-14 (ready) | `useGraphStore.settleTurn("done")` — sets `status="ready"` only if `receivedDeltaThisTurn === true`, else returns to UI-11 |
| UI-13 (revealing) | `revealQueue` drained, `done` not yet received | UI-13 | Stays in revealing (new deltas may still arrive in same turn) |
| UI-12 (loading) | SSE `tool_result { ok: false }` while a graph tool is in flight | UI-14-error (error overlay) | `setStatus("error", errorMessage)`; existing subgraph (if any) stays visible |
| UI-12 / UI-13 | SSE `error` frame while a graph tool was in flight | UI-14-error | `useGraphStore.settleTurn("error")` — keeps previous subgraph; sets error overlay |
| any | URL `?conversation=` param changes (new conversation selected) | UI-11 | `useGraphStore.clear()` resets nodes/links/positions/queue (`temp/chat-graphspace-plan.md` UC-CG-08) |
| any | Stop button clicked / Esc during UI-12 or UI-13 | UI-14 or UI-11 | `abortController.abort()`; `settleTurn("done")` — already-revealed nodes remain (`temp/chat-graphspace-plan.md` UC-CG-10) |
| UI-14 (ready) | SSE `tool_start` (new turn invokes another graph tool) | UI-12 (loading) | Progressive expansion (UC-CG-02) — `setStatus("loading")`; previous subgraph stays under the overlay |
| UI-14 (ready) | User clicks a node | UI-14 + `NodeDetailPanel` mounted | `onNodeSelect(nodeId)` → `ChatWorkspace` mounts `NodeDetailPanel`; graph status unchanged; `GraphSpace` unmounts, `NodeDetailPanel` takes its place. Closing the panel returns to UI-14. Pan/zoom/drag never alter `chatStatus`. |

> **Graph-producing tools** (catalog source for `tool_start` filter — see `chat-graphspace-plan.md §B1`): `traverse`, `get_node`, `list_nodes`, `search`. Other read-only tools (`list_node_types`, `get_provenance_*`, `get_history_*`, `list_attribute_keys`, `list_link_types`) do NOT emit a `graph_delta` and do NOT transition the graph column out of its current state.

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
| `STRUCTURAL_INVALID` | in-stream, NOT terminal (tool_result fed back to model) | No SPA-level display — the BFF feeds the error back to the model as a failed `tool_result` block; the model surfaces a natural-language explanation in the next `text_delta` | — | — (when `CHAT_INGEST_ENABLED=true` and `start_async_ingestion` fails its layered-validation check — e.g. content too large or schema invalid — `chat.spec.md` BR-43 step 2 / §6; the turn continues)
| `SYSTEM_SERVICE_UNAVAILABLE` (ingestion path) | in-stream, NOT terminal (tool_result fed back to model) | No SPA-level display — fed back to model as failed `tool_result` | — | — (when `CHAT_INGEST_ENABLED=true` and `start_async_ingestion` cannot reach Postgres during intake — `chat.spec.md` BR-43 step 2; distinct from the tool-timeout case covered above which uses the same code but is generated by the tool dispatcher, not by the ingestion service)

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

### Scenario 6 — Async ingestion via chat (CHAT_INGEST_ENABLED=true)

**Given** `/chat?conversation=<uuid>` is mounted and `CHAT_INGEST_ENABLED=true` at the BFF  
**When** the user sends a message explicitly requesting document ingestion  
**Then** the model emits a `tool_use` block for `start_async_ingestion`  
**And** a `tool_start { tool: "start_async_ingestion", argsSummary: "source_type=... content_len=N" }` SSE frame arrives  
**And** a `ToolCallChip` is rendered in pending state with label `start_async_ingestion`  
**And** a `tool_result { tool: "start_async_ingestion", ok: true }` SSE frame settles the chip to success  
**And** no `graph_delta` frame is emitted for this tool (ingestion tools are non-graph tools)  
**And** the model continues and emits `text_delta` frames summarising the ingestion run  
**And** after the `done` frame, `isStreaming` flips false and the Composer returns to send mode  
**And** the turn invalidation refetch completes normally  

---

## §10 Components Created / Updated

| Component Name | Action | Feature | Rationale |
|---|---|---|---|
| `ChatBubble` | create | chat | Shared DS atom for every message bubble (assistant and user, history and streaming) |
| `ConversationMenu` | create | chat | Shared DS component for conversation management dropdown in Header |
| `ChatWorkspace` | create + update (TC-FE-11) | chat | Feature-local page component (40%/60% container-query split). Updated to mount `<GraphSpace>` in the right column (replaces the legacy `GlassSurface` stub) and to swap to `<NodeDetailPanel>` inline when a node is selected. |
| `ConversationView` | create | chat | Feature-local column wrapper — routes between empty state and message/compose view |
| `MessageStream` | create | chat | Feature-local scrollable history + streaming bubble list |
| `Composer` | create | chat | Feature-local input band (send / stop / archived / disabled modes) |
| `StreamingCursor` | create | chat | Feature-local blinking cursor, purely decorative, `aria-hidden` |
| `ToolCallChip` | create | chat | Feature-local tool-call status chip rendered inside ChatBubble during streaming |
| `UsageBadge` | create | chat | Feature-local usage counters in Composer footer |
| `HeaderConversationMenu` | create | chat | Shell adapter that wires `ConversationMenu` to chat data layer; mounts in `Header` only on `/chat` |
| `ChatStatusIndicator` | create | chat | Feature-local "pensando…" / "consultando memória…" line in `MessageStream` covering the window between send and first SSE frame (REQ-2) |
| `GraphSpace` | create | graph | Feature-local container — mounts a React Flow canvas with `d3-force` layout; consumes `nodes`/`links` props from `useGraphStore`; exposes `GraphSpaceHandle` ref. See `GraphSpace.component.spec.md`. |
| `GraphCanvas` | create | graph | Internal: `<ReactFlow>` wrapper with viewport controls, registers `nodeTypes`/`edgeTypes` |
| `GraphNodeAdapter` | create | graph | Custom React Flow node type — wraps `components/ds/GraphNode` + `<Handle source/target>`, applies `useGraphReveal` animation |
| `GraphEdgeAdapter` | create | graph | Custom React Flow edge type: solid (`is_temporal=true`) vs. dashed (`is_temporal=false`), color from `--color-link-*` tokens. See `GraphEdge.component.spec.md`. |
| `GraphStatusOverlay` | create | graph | Loading/error overlay above the canvas (UI-12 / UI-14-error) — `aria-live="polite"`, no retry button (panel-local affordance) |
| `GraphEmptyState` | create | graph | UI-11 centered copy "A memória aparecerá aqui conforme você conversa." |
| `NodeDetailPanel` | create | graph | Inline detail view (replaces `GraphSpace` in the right column while open) — fetches `getNodeById`, shows aliases + current attributes. View-only (REQ-6). See `NodeDetailPanel.component.spec.md`. |

> `ChatBubble`, `ConversationMenu`, `GraphSpace`, `GraphEdge`, and `NodeDetailPanel` qualify for their own `component.spec.md` files (used in 2+ contexts OR complex internal logic). See the referenced specs in `docs/specs/front/components/`.

---

## §11 Chat ↔ Graph Use Cases (UC-CG-*)

> This section documents the chat-to-graph interaction surface — the right-column GraphSpace and its driver, the `graph_delta` SSE frame. The full plan (alternatives, decisions D1–D5, risks) lives in `temp/chat-graphspace-plan.md` §11. This section is the **normative summary** consumed by QA and downstream specs.

**Actor (primary):** Operator (single owner). **Channel:** the SSE turn at `POST /conversations/:id/messages`. **Pre-conditions (common):** BFF reachable, authenticated session, conversation selected.

| ID | Title | Trigger | Effect |
|---|---|---|---|
| **UC-CG-01** | Load subgraph from a query | User sends a message; the LLM calls a graph tool (e.g., `traverse`). | Bubble appears → `chatStatus=thinking` → `tool_start` flips graph to UI-12 → `tool_result{ok}` settles chip → `graph_delta` → `replaceNodes(delta)` (first graph result of the response — replaces any prior graph; **non-cumulative**) → UI-13 (`revealing`) → nodes reveal 1×1 (Framer Motion) → `done` → UI-14 (`ready`). Edges only appear after both endpoints are revealed. |
| **UC-CG-02** | Compose within a response · replace across responses | Another graph tool in the **same** response returns more nodes; OR a **subsequent** response returns a graph. | **Same response:** later results `addNodes` — merge by `id` (no duplicate, no re-animation); existing nodes stay pinned (no layout jump, D5); only inédito ids reveal. **New response:** the first graph result calls `replaceNodes` — the prior response's graph is **cleared** and re-laid out fresh (non-cumulative — owner decision 2026-06-22; dragged pins/positions do not carry over). |
| **UC-CG-03** | Detail a specific node (`get_node`) | The LLM calls `get_node`. | `graph_delta` arrives with 1 node + 0 links; if it is the response's first graph result it `replaceNodes` (graph becomes just that node); a later result in the same response merges if already present. |
| **UC-CG-04** | Textual search with hydration (`search`) | The LLM calls `search`. | BFF hydrates `items(kind=node)` → `NodeSummary` server-side before emitting the `graph_delta`. `kind=fragment`/`link` items do NOT enter the graph (they still appear in the textual response). |
| **UC-CG-05** | Empty result | Graph tool returns `ok: true` with 0 nodes. | No new nodes; if panel was UI-11 it stays at UI-11; if subgraph was already populated, it stays unchanged. NOT an error. |
| **UC-CG-06** | Graph tool failure | `tool_result { ok: false }` while a graph tool was in flight. | Transition to UI-14-error; subgraph (if any) remains visible underneath the overlay (`fail loud`). |
| **UC-CG-07** | Waiting indicators on both panes | Any turn in progress. | Chat column shows `ChatStatusIndicator` ("pensando…" / "consultando a memória…"); graph column shows `GraphStatusOverlay` while a graph tool is in flight. Both clear on `done`. |
| **UC-CG-08** | Switch conversations | `?conversation=` URL param changes. | `ChatWorkspace` calls `useGraphStore.clear()` → UI-11 (empty). New conversation starts with empty graph. |
| **UC-CG-09** | Local interaction in the graph (unidirectional) | User pans/zooms, drags, or clicks a node. | Updates only view-local state (viewport, selection). Click → `onNodeSelect(nodeId)` opens `NodeDetailPanel` **inside the right column** (never modal/drawer/route). **Never** writes to `useChatTurnStore`; **never** issues a new mutation; ChatSpace is untouched (REQ-6). |
| **UC-CG-10** | Stop during reveal | User clicks Stop or presses Esc during UI-12 or UI-13. | `abortController.abort()` → SSE terminates → `settleTurn("done")`. Already-revealed nodes stay; reveal queue closes; UI never gets stuck. |
| **UC-CG-11** | Reduced motion | `prefers-reduced-motion: reduce`. | All new nodes reveal in the same tick (opacity-only, no scale, no stagger). |
| **UC-CG-12** | Unknown node type (fallback) | `node_type` from the wire is not one of the 10 `GraphNodeType` slugs (ontology is data-driven and extensible). | `mapNodeType` returns a neutral default (icon + color); render does not crash (robustness against future catalog additions). |
| **UC-CG-13** | Page reload | User reloads `/chat?conversation=<uuid>`. | Graph panel returns to UI-11 (empty) — the subgraph is ephemeral per session (D4). Expected, documented; NOT a defect. |

### §11 — Unidirectionality invariant (REQ-6)

The graph column is a **sink**: data flows chat → graph only. The structural guarantees are:

- `GraphSpace`, `GraphCanvas`, `GraphNodeAdapter`, `GraphEdgeAdapter`, `GraphStatusOverlay`, `GraphEmptyState`, `NodeDetailPanel` **never import** any action from `useChatTurnStore` or any mutation from `features/chat/api/*`. This is verifiable by lint / structural test (`import/no-restricted-paths`).
- The only side effects of graph interaction are: change of viewport (React Flow internal), change of `selectedNode` local state in `ChatWorkspace`, fetch of `getNodeById` for the detail panel. None of these alter `useChatTurnStore`, the messages cache, or the URL chat scope.

---

## §12 Out of Scope

The following are explicitly deferred from this wave and must NOT be inferred from the implemented code or from the API contract:

- **Standalone `/graph` route extensions** — the `/graph` route is reserved in `front.md §3.1` and is a separate wave. This chat feature spec does NOT cover that route; the right-column `GraphSpace` is intentionally narrower (no global filters, no `as_of` time picker, no curation actions, no provenance drawer).
- **Additional write/curation tools beyond the v2.3 catalog** — the v2.3 chat catalog grows to 15 tools when `CHAT_INGEST_ENABLED=true` (13 read-only `query` tools + `start_async_ingestion` + `get_ingestion_status`). The SPA renders these additional tools as generic `ToolCallChip` entries using the existing streaming path — no dedicated UI controls or display panels are added. The `graph_delta` frame is not emitted for ingestion tools. Curation tools (`propose_*`, merge, reject, correct) remain out of scope per `chat.spec.md` §8.
- **Persisting the per-turn subgraph** — the graph is ephemeral per session (D4). Page reload clears it. Re-opening a conversation does NOT restore the previous subgraph; the operator must re-ask.
- **Click-to-traverse from a node** — clicking a node opens `NodeDetailPanel` only. It does NOT dispatch a new `traverse` tool call (that would break the unidirectionality invariant, REQ-6). A future spec change may add it, but only with an explicit decision recorded.
- **Embeddings / semantic retrieval** — retrieval is purely lexical + graph; no vectors.
- **Cost (USD) and citations** — `cost_usd` and `citations` fields are not in the API v2 and not rendered.
- **History pagination beyond initial load** — `listMessages` fetches a single page (default limit 50). Infinite scroll / "load older" (`before` param) is not implemented.
- **⌘K shortcut** — the command palette toggle is wired but the palette UI is a later wave.
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
- `tool_start { tool, argsSummary }` — creates a pending chip; if `tool` is graph-producing (`traverse` | `get_node` | `list_nodes` | `search`), also flips `useGraphStore.status` to `loading`. When `CHAT_INGEST_ENABLED=true`, the catalog also includes `start_async_ingestion` and `get_ingestion_status` — these are treated as non-graph tools (no `graph_delta` is emitted for them; the chip dispatches to the generic pending → success/error path)
- `tool_result { ok }` — settles the last chip; if `ok === false` AND a graph tool was in flight, `useGraphStore.settleTurn("error")` is invoked
- `graph_delta { sourceTool, nodes[], links[] }` — **(7th frame)** consumed by the SSE dispatcher in `useSendMessage` and mapped via `mapWireToGraphDelta()`. **Non-cumulative (owner decision 2026-06-22):** the **first** graph result of a response is applied via `useGraphStore.replaceNodes(delta)` (clears the prior response's graph and re-lays out fresh); **later** results in the **same** response use `addNodes(delta)` (compose by id). A 0-node result is skipped — the current graph is left unchanged (UC-CG-05) and the response's one-shot replace is not consumed. Wire shape is snake_case (`source_tool`, `node_type`, `canonical_name`, `is_temporal`); the front-end transform renames to camelCase. Emitted by the BFF immediately after the `tool_result` for a graph-producing tool. Within a response, re-arrival of the same node id is merged (no duplicate, no re-animation). See `temp/chat-graphspace-plan.md §4.1` for the full wire schema.
- `done { stop_reason }` — terminal success; `useGraphStore.settleTurn("done")` decides `ready` vs. `empty` based on `receivedDeltaThisTurn`
- `error { code, message }` — terminal failure; `useGraphStore.settleTurn("error")` if a graph tool was in flight

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

### `useGraphStore` — ephemeral subgraph state (right column)

Defined in `features/graph/state/graph-store.ts`. Zustand slice. Never persisted (D4 — graph is ephemeral per session). Reset on conversation switch (`clear()`) and on each terminal SSE frame (`settleTurn`).

Fields:

- `nodes: Map<string, GraphNodeData>` — dedup'd by id; merge-on-rewrite (re-affirmation consolidates, never duplicates).
- `links: Map<string, GraphLinkData>` — dedup'd by id; orphaned links removed on node removal.
- `positions: Map<string, { x: number; y: number }>` — written by `useForceLayout`; existing entries pinned (`fx`/`fy`) when new nodes arrive (D5).
- `revealQueue: string[]` — ids inserted by `addNodes` but not yet animated; drained by `useGraphReveal`.
- `revealedIds: Set<string>` — already-visible ids.
- `status: GraphStatus` — `"empty" | "loading" | "revealing" | "ready" | "error"`.
- `errorMessage?: string` — set by `settleTurn("error", msg)`.
- `receivedDeltaThisTurn: boolean` — set by `addNodes`/`replaceNodes`; reset by `settleTurn`; consumed by `settleTurn("done")` to decide `ready` vs. `empty` (I-7).

Actions (chat → graph only; the graph pane never writes here from user interaction — REQ-6):

- `addNodes(delta: GraphDelta)` — merge nodes/links by id; enqueue only **new** ids into `revealQueue`. Used for **later** graph results within the same response (compose).
- `replaceNodes(delta: GraphDelta)` — **non-cumulative** reset (owner decision 2026-06-22): clear the prior graph (nodes/links/positions/pins/revealed set), load only this delta, drop orphan links, and re-enqueue every node for a fresh 1×1 reveal. Used for the **first** graph result of each response. The replace-vs-add choice is made per response in the `useSendMessage` stream loop (`graphReplacedThisTurn`).
- `removeNodes(ids: string[])` — remove nodes AND their orphaned links.
- `clear()` — zero everything (called on `?conversation=` change).
- `setStatus(status, errorMessage?)` — set status; idempotent.
- `settleTurn(frame: "done" | "error")` — terminal-frame reducer; `"done"` → `ready` if any delta arrived this turn, else stays `empty`; `"error"` → `error` only if a graph tool was in flight.
- `dequeueReveal()` — pop one id; called by `useGraphReveal` on each tick.

### `getNodeById` query — node detail (right column inline)

Defined in `features/graph/api/useNodeDetail.ts`. TanStack Query hook over the `knowledge-graph` domain. Enabled only while `selectedNode !== null` in `ChatWorkspace` (i.e., a `NodeDetailPanel` is mounted). Key: `["nodes", id, "detail"]`. `staleTime: 30s`. No cache invalidation needed on chat actions — the chat is read-only and the node detail is read-only too. Errors render an inline error state in `NodeDetailPanel` (no toast; panel-local affordance).

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Regenerated from implemented code. Primary view (`/`→`/chat`), 40/60 split, SSE streaming, ConversationMenu in Header, 10 UI states, data layer notes. |
| 1.1.0 | 2026-06-21 | u-fe-developer (TC-FE-13) | minor | Chat ↔ GraphSpace integration documented (built under EPIC-FE-03 / TC-FE-01..TC-FE-11). §1 adds `getNodeById` (knowledge-graph). §2 adds UI-11..UI-14 (graph right-column states: empty / loading / revealing / ready / error). §3 adds the graph state-transition table driven by SSE `tool_start`/`graph_delta`/`tool_result`/`done`/`error`. §4 documents the 7th SSE frame `graph_delta` (chat-stream union) and the `useGraphStore` / `getNodeById` data layers. §10 adds the new components (`GraphSpace`, `GraphCanvas`, `GraphNodeAdapter`, `GraphEdgeAdapter`, `GraphStatusOverlay`, `GraphEmptyState`, `NodeDetailPanel`, `ChatStatusIndicator`) and records `ChatWorkspace` update. §11 adds the UC-CG-01..UC-CG-13 use-case table and the unidirectionality invariant (REQ-6). §12 (was §11) — removed "Chat ↔ Graph interaction" and "Graph explorer" rows; added new exclusions (write tools in chat, persist per-turn subgraph, click-to-traverse). Normative plan source: `temp/chat-graphspace-plan.md` Rev. 2026-06-21. |
| 1.2.0 | 2026-06-22 | Front Spec Agent | minor (additive) | **Async ingestion capability (chat.spec.md v2.3).** No new routes, no new components, no new REST operationIds. The v2.3 backend change adds two server-side tool dispatches (`start_async_ingestion` / `get_ingestion_status`) to the chat agentic loop behind `CHAT_INGEST_ENABLED=true`. Updates: §1 note (v2.3 annotation — these are NOT REST operationIds; they are SSE `tool_start`/`tool_result` frames only); §2 UI-04 (ToolCallChip list now can include ingestion tool chips via the same generic chip path); §4 `chat-stream.ts` note (tool_start union extended — ingestion tools are non-graph tools; no `graph_delta` emitted for them); §6 two new in-stream-not-terminal rows (`STRUCTURAL_INVALID` from layered-validation rejection of `start_async_ingestion`; `SYSTEM_SERVICE_UNAVAILABLE` ingestion-path from Postgres-down during intake); §9 Scenario 6 (async ingestion happy path via chat); §12 out-of-scope updated (v2.3 catalog is now 15 tools when flag is on; curation tools remain out). Revokes the v1.1.0 "13 read-only tools" framing in §12. Backend normative source: `chat.spec.md` v2.3 / `openapi.yaml` v2.3 (BR-43, BR-44, BR-45). | sdd_chat_async-ingestion |
