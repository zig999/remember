# Flow Spec — Chat (`chat.flow.md`)

> Feature: `/chat` — primary view
> Version: 1.2.0 | Status: draft | Layer: permanent

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
   - **If the tool is graph-producing** (`traverse`, `get_node`, `list_nodes`, `search`, or — v1.2.0, when `CHAT_INGEST_ENABLED=true` — `ingest_directed`): right-column transitions to UI-12 (graph loading) — see Sub-flow D.
6. **NEW (v1.1.0): `graph_delta` frame received** (only when a graph tool ran in this turn) — see Sub-flow D, steps D2–D5. Runs in **parallel** with the text streaming on the left.
7. `done` frame received; `isStreaming` → false; Composer returns to send mode.
8. Cache invalidated; persisted assistant row appears in history (UI-03).

### Sub-flow D — Graph reveal during a turn (new — EPIC-FE-03)

> Driver: the SSE pipeline of Sub-flow C. Independent of (and parallel to) the chat-column transitions. Right-column states are UI-11..UI-14 (`chat.feature.spec.md §2`).

1. **D1 — `tool_start { tool ∈ graph-producing }`:** `useSendMessage` dispatcher inspects `frame.tool`; if it is `traverse` / `get_node` / `list_nodes` / `search` / `ingest_directed` (the last only when `CHAT_INGEST_ENABLED=true`), calls `useGraphStore.setStatus("loading")`. Right column transitions UI-11 → UI-12. `GraphStatusOverlay` shows "Buscando na memória…" with `aria-live="polite"`. A previously-loaded subgraph (UI-14) stays visible **underneath** the overlay (no clear).
2. **D2 — `tool_result { ok: true }`:** chip settles; no graph state change yet (the data arrives in the next frame).
3. **D3 — `graph_delta { source_tool, nodes[], links[] }`** (7th SSE frame, added in this revision): dispatcher calls `mapWireToGraphDelta(frame)` → `useGraphStore.addNodes(delta)`:
   - Merge nodes/links by `id` (re-affirmation consolidates, never duplicates).
   - Enqueue only **new** ids into `revealQueue`.
   - `setStatus("revealing")`; `receivedDeltaThisTurn = true`.
   - Right column transitions UI-12 → UI-13.
4. **D4 — reveal loop:** `useGraphReveal` dequeues one id every `revealStaggerMs` (default 90 ms), marking it revealed in `useGraphStore.revealedIds`. Each newly-revealed node animates in via Framer Motion (`opacity 0→1` + `scale 0.85→1`, ~180 ms). An edge is mounted only when **both** its endpoints are revealed. Existing nodes are pinned (`fx`/`fy`) — no layout jump.
   - `prefers-reduced-motion: reduce`: all nodes reveal in one tick (opacity-only, no stagger / no scale).
5. **D5 — `done`:** `useGraphStore.settleTurn("done")` → `status = "ready"` (UI-14) because `receivedDeltaThisTurn === true`. Graph is fully interactive (pan/zoom/select). The dispatcher then performs the chat invalidations (Sub-flow C step 8).

**Failure variants:**

- **D6 — `tool_result { ok: false }`** while a graph tool is in flight: `useGraphStore.setStatus("error", message)`. Right column → UI-14-error. A subgraph loaded before the error stays visible underneath.
- **D7 — `error` frame** while a graph tool is in flight: `useGraphStore.settleTurn("error")`. UI-14-error.
- **D8 — Abort during D2–D4:** SSE terminates; `useGraphStore.settleTurn("done")`. Already-revealed nodes remain visible; reveal queue closes without freezing (UC-CG-10).

**Empty result variant:**

- **D9 — `graph_delta` with `nodes: []`:** `addNodes` does nothing (no merge, no enqueue). `receivedDeltaThisTurn` is **not** set. On `done`, `settleTurn("done")` keeps the panel in UI-11 (no error — empty result is a valid outcome, UC-CG-05).

### Sub-flow E — Click a node to show inline detail (new — EPIC-FE-03)

1. User is on `/chat?conversation=<uuid>` with a populated graph (UI-14).
2. User clicks a `GraphNodeAdapter` in the React Flow canvas.
3. `GraphSpace` fires `onNodeSelect(nodeId)` → `ChatWorkspace` sets local state `selectedNode = { id, label }`.
4. `ChatWorkspace` unmounts `<GraphSpace>` and mounts `<NodeDetailPanel nodeId={…} nodeLabel={…} onClose={…} />` in the same right-column slot.
5. `useNodeDetail(nodeId)` (TanStack Query → `GET /api/v1/nodes/:id`) fetches aliases + current attributes.
6. The chat column (left) is **untouched**: same messages, same scroll position, same `chatStatus`. No mutation fires.
7. User clicks the close action → `selectedNode = null` → `<GraphSpace>` re-mounts in the right column at UI-14 (with `useGraphStore` data preserved across the swap — the store is independent of the panel mount).

---

## Happy Path — Navigation to Active Conversation

```
User opens browser
        │
        ▼
 [/] beforeLoad
        │ redirect
        ▼
 [/chat] — UI-01 (no conversation) / UI-11 (graph empty)
        │
        │  User opens ConversationMenu → selects a conversation
        ▼
 [/chat?conversation=<id>] — UI-02 (loading) / UI-11 (graph empty)
        │                                            │
        │  listMessages resolves                     │
        ▼                                            ▼
 [/chat?conversation=<id>] — UI-03 (success) / UI-11 (graph empty)
        │
        │  User types a "quem trabalha em X?" and submits Composer
        ▼
 [/chat?conversation=<id>] — UI-04 (streaming)
        │
        │  llm_start                  → ChatStatusIndicator "pensando…"
        │  tool_start{traverse}       → ChatStatusIndicator "consultando a memória…"
        │                                           ↓
        │                                       UI-12 (graph loading overlay)
        │  tool_result{ok:true}       → chip ok
        │  graph_delta{nodes, links}                ↓
        │                                       UI-13 (graph revealing — nodes 1×1)
        │  text_delta…                → assistant bubble streams text in parallel
        │  done                                     ↓
        ▼                                       UI-14 (graph ready, interactive)
 [/chat?conversation=<id>] — UI-03 (success, new messages) / UI-14 (graph ready)
        │
        │  Optional: user clicks a node in the graph
        ▼
 [/chat?conversation=<id>] — UI-03 (unchanged) / right column shows NodeDetailPanel
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
| FL-08 | SSE `tool_start { tool ∈ graph-producing }` received (graph-producing set: `traverse` / `get_node` / `list_nodes` / `search` / `ingest_directed` — the last only when `CHAT_INGEST_ENABLED=true`; v1.2.0) | Right column transitions UI-11 → UI-12; `useGraphStore.setStatus("loading")` | If `tool_result { ok: false }` follows → UI-14-error (overlay) |
| FL-09 | SSE `graph_delta` frame received | `useGraphStore.addNodes(delta)` merges by id, enqueues new ids; UI-12 → UI-13 | If `nodes: []` → no state change (UI stays where it was); `done` later resolves to UI-11 if no delta arrived |
| FL-10 | URL `?conversation=` changes | `useGraphStore.clear()` resets nodes/links/positions; right column → UI-11 | — |
| FL-11 | User clicks a node in `GraphSpace` (UI-14) | `onNodeSelect(nodeId)` → `ChatWorkspace` mounts `<NodeDetailPanel>` in the right column (swap with `<GraphSpace>`) | Closing the detail panel re-mounts `<GraphSpace>` at UI-14 (store survives the swap); chat column unaffected |

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
| Subgraph (nodes, links, positions, revealQueue, status) | Ephemeral per session (D4) | `useGraphStore` (Zustand, no persistence) | On conversation switch (`clear()` in `ChatWorkspace`); on page reload (volatile by design) |
| Selected node id (for `NodeDetailPanel`) | UUID string \| null | Local `useState` in `ChatWorkspace` | On panel close, on conversation switch |
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
| 1.2.0 | 2026-07-14 | Front Spec Agent | minor (additive, feature-flagged) | **`ingest_directed` added to graph-producing tool set (v1.5.0 of `chat.feature.spec.md`, `chat.spec.md` v2.9.0 / `openapi.yaml` v2.9.0).** Sub-flow C step 5: graph-producing tool set extended to include `ingest_directed` (gated by `CHAT_INGEST_ENABLED=true`). Sub-flow D step D1: explicit tool enumeration extended. FL-08: graph-producing set made explicit in the rule description. Version header bumped to 1.2.0. |
| 1.1.0 | 2026-06-21 | u-fe-developer (TC-FE-13) | minor | EPIC-FE-03 chat ↔ graph wave: Sub-flow C step 5 documents the graph-tool branch and step 6 the `graph_delta` frame; new **Sub-flow D — Graph reveal during a turn** (D1..D9: `tool_start` → loading, `graph_delta` → revealing, reveal loop, `done` → ready, plus failure/empty/abort variants); new **Sub-flow E — Click a node to show inline detail** (replace `GraphSpace` with `NodeDetailPanel` in the same slot; chat column untouched); Happy Path diagram updated with the parallel graph track (UI-11→UI-12→UI-13→UI-14); Navigation Rules expanded with FL-08..FL-11 (graph dispatch + reveal + conversation-clear + node-click); Data Persisted table adds `useGraphStore` (ephemeral per session) and `selectedNode` (local state). Normative source: `temp/chat-graphspace-plan.md` Rev. 2026-06-21 §8.1 (turn sequence), §8.2 (event/effect table), §12.3 (GraphStatus state machine). |
