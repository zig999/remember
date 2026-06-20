# Flow Spec — Chat (`chat.flow.md`)

> Feature: `/chat` — primary view
> Version: 1.0.0 | Status: draft | Layer: permanent

---

## Involved Screens

| Screen | Route | Feature spec |
|---|---|---|
| Root redirect | `/` | — (beforeLoad redirect only) |
| Chat workspace | `/chat` | `features/chat.feature.spec.md` |
| Chat workspace + active conversation | `/chat?conversation=<uuid>` | `features/chat.feature.spec.md` |
| Sign-in | `/sign-in` | (later wave — foundation stub) |

---

## Sub-flows

### Sub-flow A — New conversation

1. User lands on `/chat` or navigates to it.
2. `ConversationMenu` trigger shows "Nova conversa".
3. User opens the dropdown and clicks "Nova conversa".
4. `createConversation` fires (POST).
5. On success: navigate to `/chat?conversation=<new-id>`.
6. `MessageStream` mounts with UI-09 (empty conversation — no messages).
7. User types in `Composer` and submits — transitions to UI-04 (streaming).

### Sub-flow B — Select existing conversation

1. User opens `ConversationMenu` in the Header.
2. List loaded from `listConversations`.
3. User clicks a conversation row.
4. `onSelect(id)` fires → navigate to `/chat?conversation=<id>`.
5. `listMessages(id)` fires → skeleton (UI-02) shown, then history (UI-03 / UI-09).

### Sub-flow C — Send message and receive streaming response

1. User types a message in `Composer` and presses Enter or clicks Send.
2. Optimistic user bubble appended to cache (immediate).
3. SSE opened; streaming assistant bubble appears (UI-04).
4. `text_delta` frames accumulate text; `StreamingCursor` blinks.
5. `tool_start` / `tool_result` frames add/settle `ToolCallChip`s.
6. `done` frame received; `isStreaming` → false; Composer returns to send mode.
7. Cache invalidated; persisted assistant row appears in history (UI-03).

---

## Happy Path — Navigation to Active Conversation

```
User opens browser
        │
        ▼
 [/] beforeLoad
        │ redirect
        ▼
 [/chat] — UI-01 (no conversation)
        │
        │  User opens ConversationMenu → selects a conversation
        ▼
 [/chat?conversation=<id>] — UI-02 (loading)
        │
        │  listMessages resolves (messages exist)
        ▼
 [/chat?conversation=<id>] — UI-03 (success)
        │
        │  User types and submits Composer
        ▼
 [/chat?conversation=<id>] — UI-04 (streaming)
        │
        │  done frame received
        ▼
 [/chat?conversation=<id>] — UI-03 (success, with new messages)
```

---

## Alternative Flows

### A1 — Empty conversation after create

Route: `/chat?conversation=<new-id>` with `items = []` → UI-09.

User types first message → UI-04 → UI-03 with two messages (user + assistant).

### A2 — Archived conversation

Route: `/chat?conversation=<archived-id>` → `getConversation` reveals `archivedAt !== null`.

`Composer` shows `ArchivedBanner` (UI-08). History still visible. User clicks "Reativar" → `updateConversation` → `archived_at: null` → Composer returns to send mode.

### A3 — History fetch error

`listMessages` rejects → UI-07 (inline error). User clicks "Tentar novamente" → `refetch()` → UI-02 → UI-03 (or UI-07 again if error persists).

### A4 — Stop in mid-stream

During UI-04, user clicks Stop or presses `Escape`. `abortController.abort()` fires. `useCancelTurn` fires `POST /cancel` (best-effort). SSE terminates with `done{stop_reason:"cancelled"}`. Composer returns to send mode. Assistant row persisted with partial text + `stop_reason = "cancelled"`.

### A5 — Provider unavailable

`sendMessage` returns `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (pre-stream, 503). Mutation resolves with `errorCode`. Composer enters UI-10 (disabled, inline notice). User must reload or wait.

### A6 — Deep link to `/chat?conversation=<uuid>` (direct URL access)

User enters `/chat?conversation=<uuid>` directly in the browser. `__root` JWT guard runs first (redirect to `/sign-in` if no token). If authenticated: `getConversation(id)` fires; if `RESOURCE_NOT_FOUND` → navigate to `/chat` (UI-01) via the `onError` handler registered in `HeaderConversationMenu` / the query's error state in `ConversationView`.

---

## Navigation Rules

| ID | Condition | Behavior | Fallback |
|---|---|---|---|
| FL-01 | Root route `/` is matched | `beforeLoad` throws `redirect({ to: "/chat" })` — the chat workspace is the primary view | If `/chat` fails to mount (bundle error): `AppErrorBoundary` in-frame fallback |
| FL-02 | `?conversation=<uuid>` present in URL (deep link or select) | Mount `ConversationView` with that id; fire parallel queries (getConversation + listMessages) | If `RESOURCE_NOT_FOUND`: navigate to `/chat` (drop param) |
| FL-03 | `createConversation` succeeds | Navigate to `/chat?conversation=<new-id>` | If navigation fails (router error): stay on `/chat`; show toast |
| FL-04 | `deleteConversation` on the active conversation | Navigate to `/chat` (drop `?conversation` param) | — |
| FL-05 | `onArchive` on the active conversation | Navigate to `/chat` (drop `?conversation` param) | — |
| FL-06 | JWT absent / expired on `__root` beforeLoad | Redirect to `/sign-in?reason=session_expired` (global rule, `front.md §5`) | `/sign-in` page stub |
| FL-07 | Navigation away from `/chat` while streaming | `MessageStream` unmounts; `useEffect` cleanup calls `abortController.abort()` | SSE reader resolves with AbortError cleanly; no zombie fetch |

---

## Deep Links

| Deep link | Precondition | Behavior on entry |
|---|---|---|
| `/chat` | None (public) | JWT guard → if no token: `/sign-in`; otherwise: UI-01 (no conversation) |
| `/chat?conversation=<uuid>` | Valid JWT | JWT guard → fire `getConversation` + `listMessages`; if `RESOURCE_NOT_FOUND`: → `/chat` |
| `/chat?conversation=<uuid>` (archived) | Valid JWT | UI-08 (Composer shows ArchivedBanner); history still loaded |

---

## Data Persisted Between Screens

| State | Value | Mechanism | When reset |
|---|---|---|---|
| Active conversation id | UUID string | URL `?conversation` search param | On navigation away or explicit removal |
| Streaming turn accumulators (`streamingText`, `toolChips`) | Ephemeral | `useChatTurnStore` (Zustand, no persistence) | On `useChatTurnStore.reset()` — called on conversation switch, on `useSendMessage` terminal frame |
| `AbortController` reference | In-memory | `useChatTurnStore.abortController` | On `setAbortController(null)` — called on terminal frame or abort |
| `includeArchived` toggle | Boolean | Local `useState` in `HeaderConversationMenu` | On component unmount (navigating away from `/chat`) |
| Selected theme | `"dark"` / `"light"` | `useThemeStore`, persisted in `localStorage` | Never (permanent user preference) |

---

## Streaming Teardown on Navigation

When the user navigates away from `/chat` (or changes `?conversation`) while a turn is streaming:

1. `MessageStream` unmounts.
2. `useEffect` cleanup in `MessageStream` reads `useChatTurnStore.getState().abortController` and calls `abort()`.
3. The `streamChat` generator's `reader.read()` rejects with `AbortError` → generator returns cleanly.
4. `useSendMessage` finally-block fires: `setStreaming(false)`, `setAbortController(null)`.
5. Post-turn `invalidateQueries` fires (even on abort) — ensures the partial assistant row appears if the user returns to the same conversation.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-20 | Front Spec Agent | initial | Regenerated from implemented code. Root redirect FL-01, 7 navigation rules, 3 sub-flows, streaming teardown. |
