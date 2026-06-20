# Chat -- Business Specification

> Version: 2.0.0 | Status: draft | Layer: permanent
> Technical contract: `openapi.yaml`
> Backend spec: `back/chat.back.md`
> Source of truth (deviation note): this domain is an ADDITIVE deviation from
> `/remember-modelagem-v7.md` -- v7 does NOT specify a chat surface. The deviation is
> tracked in §1 and `back/chat.back.md` §1 for future reconciliation. The inegociable
> rule of v7 §2 holds: the LLM never reaches the database directly.

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Give the Owner (single-owner) a conversational entry point into the knowledge graph: the SPA creates a `Conversation`, posts ONE user message per turn, and the BFF drives an Anthropic agentic tool-use loop over the 13 read-only `query` tools, streaming tokens back over Server-Sent Events. The BFF persists every user/assistant message and reconstructs the model context from the database (recent window + rolling summary) -- the client never resends the history. |
| Core entity | `Conversation` (aggregate root) -- owns an ordered sequence of `ChatMessage` rows (`role in {user, assistant}`) and a `summary_rolling` distillation of older turns. `ChatToolCall` records auditable tool executions. A `turn` is one nested `POST /conversations/:id/messages` request (the agentic loop bounded by `MAX_ITERATIONS`, `TURN_TIMEOUT_MS`, or model `stop_reason`). |
| Bounded context | (a) CRUD over `/conversations` (create / list with cursor / read / patch title or archive / delete cascade); (b) the nested turn endpoint `POST /conversations/:id/messages` (SSE, mandatory `Idempotency-Key`, persists user before + assistant after); (c) message history listing `GET /conversations/:id/messages` (paginated); (d) token-usage summary `GET /conversations/:id/usage`; (e) optional cooperative cancel `POST /conversations/:id/cancel`; (f) request validation (Zod) + JWT gate (inherited `requireNeonAuth`); (g) kill-switch (`CHAT_ENABLED`); (h) Anthropic factory wiring (`defaultAnthropicFactory` pattern from `ingestion`); (i) lazy resolution of the `query` toolset; (j) agentic tool-use loop in `chat-agent.service.runTurn` emitting an `AsyncIterable<ChatEvent>`; (k) SSE framing; (l) abort propagation from socket close. |
| Out of scope | Cost/USD accounting, citations attached to assistant messages, guardrail events, pending tool-confirmation flow, write/curation tools, embeddings-based retrieval (permanent non-goal, v7 §20.1), frontend. See §8. |

> **Statefulness change (v2.0).** This version replaces the stateless v1 contract
> (`POST /api/v1/chat` carrying the full client-side history) with a STATEFUL
> conversation resource. The transformation is modelled after the reference
> 2ndbrain app: the SPA creates a conversation, then sends ONE message per turn;
> the BFF persists messages and reconstructs the model context server-side. The
> agentic loop, READ-ONLY tool catalog, SSE framing, sanity ceilings, and abort
> semantics are PRESERVED from v1.

> **Normative deviation (additive).** This domain extends the BFF surface beyond
> v7 §2 (which lists REST + MCP transports only). The deviation remains intentional:
> (1) tools remain the 13 read-only `query` toolset entries already audited by v7;
> (2) the LLM never gains direct DB access (each tool keeps its own `BEGIN READ ONLY`);
> (3) the schema change introduced here (`chat_conversation`, `chat_message`,
> `chat_tool_call`) is OUTSIDE the v7 §11 compliance flow because chat stores
> synthesised answers, not facts anchored to `raw_information` -- see §6 and §8.
> Reconcile via a future `/u-improve` pass that amends v7 §2 with the chat transport.

---

## 2. Actors

> Single-owner system per v7 §2.3 / ADR A20. There is no `User` entity. Authentication
> exists as the network-access gate (v7 §2.5 / ADR A29). The persisted tables therefore
> carry NO `user_id` column -- every row belongs to the Owner by construction.

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner | The single data owner, authenticated by Neon Auth (Stack Auth) -- JWT validated by the `requireNeonAuth` preHandler on the `/api/v1` scope. Reaches the BFF from the SPA over the network. | Full CRUD over `Conversation` (`createConversation`, `listConversations`, `getConversation`, `updateConversation`, `deleteConversation`). Send one user message per turn (`sendMessage`), list messages (`listMessages`), inspect usage (`getConversationUsage`), cooperatively cancel an in-flight turn (`cancelTurn`). Receive `text_delta`, `tool_start`, `tool_result`, `done`, `error` frames over SSE. May cancel the turn by closing the TCP connection or by calling `cancelTurn`. |
| LLM (server-driven) | The Anthropic model selected by `model` (default `CHAT_MODEL=claude-opus-4-8`). Runs inside the BFF process; never reaches the network directly other than to Anthropic. | Issue `tool_use` blocks for any of the 13 tools of the `query` toolset (READ-ONLY). MUST NOT call any write or curation tool (none are registered on the agentic registry). MUST NOT read the database directly (v7 §2 inegociable). |

> Both actors meet on the single `chat-agent.service.runTurn` core. The LLM's tool
> invocations execute under the Owner's JWT context -- there is no privilege escalation.

---

## 3. Use Cases

### UC-01 -- Owner creates a new conversation

**Actor:** Owner | **Pre:** Owner is authenticated; `CHAT_ENABLED=true`. | **Post:** A new `Conversation` row exists with `archived_at = NULL`, `summary_rolling = NULL`, no messages. The Owner has received the conversation id and creation timestamps.

**Main flow:**
1. Owner calls `POST /api/v1/conversations` with body `{}` or `{ "title": "Reuniao Apollo" }`.
2. `requireNeonAuth` validates the JWT.
3. BFF parses the body with Zod (`CreateConversationRequest`). All invariants hold (BR-30).
4. BFF inserts one `chat_conversation` row with a new `uuid` and the optional `title`.
5. BFF returns `201 Created` with body `{ ok: true, result: { id, title, archived_at: null, summary_rolling: null, created_at, updated_at } }`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID`.
- `3a` Body fails Zod parse (`title` not a string, length > 200) -> 422 `VALIDATION_INVALID_FORMAT`.

**Related endpoint:** operationId: `createConversation`

---

### UC-02 -- Owner sends a message and receives the assistant answer

**Actor:** Owner | **Pre:** Owner is authenticated; `CHAT_ENABLED=true`; an active conversation exists (`archived_at IS NULL`); no other turn is currently running on this conversation. | **Post:** Two new `chat_message` rows exist on the conversation: one `role=user` with the request content, one `role=assistant` with the streamed completion + `stop_reason`. Any tool calls executed are persisted as `chat_tool_call` rows. The owner has received the full assistant answer as `text_delta` frames, possibly preceded by `tool_start`/`tool_result` pairs, followed by a `done` frame.

**Main flow:**
1. Owner calls `POST /api/v1/conversations/:id/messages` with body `{ "content": "Quem é o Rodrigo?" }` and header `Idempotency-Key: <uuid>` (BR-26).
2. `requireNeonAuth` validates the JWT.
3. BFF parses the body with Zod (`SendMessageRequest`) and parses the `Idempotency-Key` as a UUID (BR-26).
4. BFF loads the conversation by `:id` (BR-22); confirms `archived_at IS NULL` (BR-25); confirms no other turn is in progress on this conversation (BR-28).
5. BFF checks the idempotency table (UNIQUE `(conversation_id, idempotency_key)` partial index, BR-27): no match -> proceed; match with identical `(content, model)` -> idempotent replay (UC-07); match with different body -> 409 `BUSINESS_IDEMPOTENCY_MISMATCH`.
6. BFF inserts the `chat_message{role:"user", content:[{type:"text", text: <content>}], idempotency_key, model}` row BEFORE opening the SSE (BR-29).
7. BFF reconstructs the model context from the database (BR-31): system prompt + `summary_rolling` (if non-null) + the last `CHAT_RECENT_WINDOW` messages (default 10) ordered by `created_at`.
8. BFF opens the SSE stream (`200 OK`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`).
9. `chat-agent.service.runTurn` enters iteration 1: emits `llm_start{iteration:1}`, opens `anthropic.messages.stream({system, model, messages, tools, tool_choice:{type:"auto", disable_parallel_tool_use:true}})`.
10. As the Anthropic SDK yields `text_delta` events, the service emits `text_delta{delta}` over SSE (BR-08) and accumulates the assistant text in memory.
11. If the model emits a `tool_use` block, the service dispatches the tool (BR-05/BR-06/BR-07), emits `tool_start` + `tool_result` frames (BR-09), persists a `chat_tool_call` row (BR-32), and rebuilds the next iteration's in-loop history (BR-13). The loop continues until the model emits a non-`tool_use` stop reason, a sanity ceiling is reached, or the turn aborts.
12. On terminal state, the service emits `done{stop_reason, model, tokens_in, tokens_out}` and closes the stream.
13. BFF inserts the `chat_message{role:"assistant", content: <serialised final blocks>, stop_reason, model, tokens_in, tokens_out, latency_ms}` row AFTER the terminal frame (BR-29).
14. If the conversation now has more than `CHAT_SUMMARY_AFTER_TURNS` user turns (default 20) AND `CHAT_SUMMARY_ENABLED=true`, the BFF schedules a non-blocking summary refresh (BR-33). The HTTP response has already terminated.
15. If the conversation `title IS NULL` after this turn AND `CHAT_TITLE_ENABLED=true`, the BFF schedules a non-blocking title-distillation job (BR-34). The HTTP response has already terminated.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Body fails Zod (`content` empty, > `MAX_CONTENT_LENGTH`, non-string `model`) -> 422 `VALIDATION_INVALID_FORMAT` (pre-stream).
- `3b` `Idempotency-Key` header missing -> 422 `VALIDATION_REQUIRED_FIELD` (pre-stream, BR-26).
- `3c` `Idempotency-Key` is not a valid UUID -> 422 `VALIDATION_INVALID_FORMAT` (pre-stream, BR-26).
- `4a` Conversation `:id` does not exist -> 404 `RESOURCE_NOT_FOUND` (pre-stream).
- `4b` Conversation `archived_at IS NOT NULL` -> 409 `BUSINESS_CONVERSATION_ARCHIVED` (pre-stream, BR-25).
- `4c` Another turn is in progress on this conversation -> 409 `BUSINESS_TURN_IN_PROGRESS` (pre-stream, BR-28).
- `5a` `Idempotency-Key` matches with different `(content, model)` -> 409 `BUSINESS_IDEMPOTENCY_MISMATCH` (pre-stream, BR-27).
- `5b` `Idempotency-Key` matches with identical `(content, model)` -> idempotent replay path (UC-07).
- `8a` `CHAT_ENABLED=false` -> 503 `BUSINESS_CHAT_DISABLED` (pre-stream).
- `9a` Anthropic client cannot initialise -> 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (pre-stream).
- `10a` Anthropic stream aborts mid-flight with a provider error -> `event: error` frame `{code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE", message}`, stream closes; the assistant row persisted in step 13 carries `stop_reason = "provider_error"` and the partial accumulated text (BR-29).
- `10b` Owner closes the TCP connection -> abort propagation (BR-12); the assistant row persisted in step 13 carries `stop_reason = "cancelled"` and the partial accumulated text.
- `11a` Iteration ceiling reached -> UC-03.
- `11b` Turn wall-clock exceeded -> UC-05.
- `12a` Unhandled exception in the loop -> `event: error` frame `{code: "SYSTEM_INTERNAL_ERROR"}`, stream closes; assistant row persisted with `stop_reason = "internal_error"`.

**Related endpoint:** operationId: `sendMessage`

---

### UC-03 -- Iteration ceiling reached (model keeps calling tools without converging)

**Actor:** Owner | **Pre:** Same as UC-02; the model keeps emitting `stop_reason: "tool_use"` past `MAX_ITERATIONS`. | **Post:** The Owner receives a `done{stop_reason:"max_iterations"}` frame and the stream closes; the assistant row is persisted with `stop_reason = "max_iterations"`.

**Main flow:**
1. Iterations 1..N proceed as in UC-02 (each ending in a `tool_use` block).
2. Before opening iteration `N+1` where `N+1 > MAX_ITERATIONS`, the service emits `done{stop_reason:"max_iterations", model, tokens_in, tokens_out}` (BR-15).
3. The stream closes.
4. BFF persists the assistant row with `stop_reason = "max_iterations"` and the accumulated partial text.

**Related endpoint:** operationId: `sendMessage`

---

### UC-04 -- Owner lists, reads, archives, or deletes conversations

**Actor:** Owner | **Pre:** Owner is authenticated. | **Post:** The requested CRUD effect has occurred.

**Main flow (list):**
1. Owner calls `GET /api/v1/conversations?limit=20&cursor=<opaque>&include_archived=false`.
2. BFF parses the query string with Zod (BR-35); rejects `limit` outside `[1, 100]`.
3. BFF returns one page of conversations ordered by `created_at DESC, id DESC` (BR-35); `archived_at IS NOT NULL` rows are excluded unless `include_archived=true`. Response body: `{ ok: true, result: { items: [...], next_cursor: <opaque|null> } }`.

**Main flow (read one):**
1. Owner calls `GET /api/v1/conversations/:id`.
2. BFF loads the row by id; returns it or 404 `RESOURCE_NOT_FOUND`.

**Main flow (patch):**
1. Owner calls `PATCH /api/v1/conversations/:id` with body `{ "title": "New title" }` OR `{ "archived_at": "<iso8601>" }` OR `{ "archived_at": null }`.
2. BFF parses with Zod (BR-36): `title` (string, length 1..200) and `archived_at` (RFC3339 timestamp or null) are both optional, but at least one MUST be present.
3. BFF updates the row (BR-36); updates `updated_at` via the `set_updated_at` trigger; returns the updated conversation.

**Main flow (delete):**
1. Owner calls `DELETE /api/v1/conversations/:id`.
2. BFF deletes the conversation row; `chat_message` and `chat_tool_call` rows are removed by `ON DELETE CASCADE` (BR-37).
3. BFF returns `204 No Content`.

**Alternative flows (any of the four):**
- `1a` JWT invalid -> 401.
- `2a` (list) Query string fails Zod -> 422 `VALIDATION_INVALID_FORMAT`.
- `2a` (patch) Body fails Zod (both fields missing, `title` outside length range, `archived_at` not a valid timestamp) -> 422 `VALIDATION_INVALID_FORMAT`.
- `2a` (read/patch/delete) `:id` not found -> 404 `RESOURCE_NOT_FOUND`.

**Related endpoints:** operationIds: `listConversations`, `getConversation`, `updateConversation`, `deleteConversation`

---

### UC-05 -- Turn timeout (wall-clock budget exceeded)

**Actor:** Owner | **Pre:** Same as UC-02; the active iteration runs past `TURN_TIMEOUT_MS`. | **Post:** The Anthropic stream is aborted; `done{stop_reason:"turn_timeout"}` is emitted; the stream closes; assistant row persisted with `stop_reason = "turn_timeout"`.

**Main flow:**
1. The wall-clock timer started at the first `llm_start` reaches `TURN_TIMEOUT_MS`.
2. Service calls `stream.abort()` on the in-flight Anthropic stream.
3. Service emits `done{stop_reason:"turn_timeout", model, tokens_in, tokens_out}` (BR-16) and closes the SSE.
4. BFF persists the assistant row with `stop_reason = "turn_timeout"` and the partial accumulated text.

**Related endpoint:** operationId: `sendMessage`

---

### UC-06 -- Owner cancels the turn (cancel endpoint OR client disconnect)

**Actor:** Owner | **Pre:** Same as UC-02; a turn is currently in progress on this conversation. | **Post:** The Anthropic stream is aborted; if the SSE socket is still writable, a `done{stop_reason:"cancelled"}` frame is emitted; assistant row persisted with `stop_reason = "cancelled"`.

**Main flow (cancel endpoint):**
1. Owner calls `POST /api/v1/conversations/:id/cancel` from a SECOND HTTP call while the original turn's SSE is still open.
2. BFF loads the in-flight turn for `:id` (BR-38); if none -> 404 `RESOURCE_NOT_FOUND`.
3. BFF calls `AbortController.abort(reason="cancelled")` on the in-flight turn.
4. BFF returns `202 Accepted` with body `{ ok: true, result: { cancelled: true } }`.
5. The original SSE call sees the abort: service calls `stream.abort()`, emits `done{stop_reason:"cancelled"}` if the socket is still writable (BR-12), and closes.
6. BFF persists the assistant row with `stop_reason = "cancelled"`.

**Main flow (client disconnect):**
1. SPA closes the TCP connection -> `req.raw.on('close')` fires on the BFF.
2. Service calls `stream.abort()`; if the socket is still writable emits `done{stop_reason:"cancelled"}` and closes; otherwise no further frame is emitted (BR-12).
3. BFF persists the assistant row with `stop_reason = "cancelled"`.

**Alternative flows:**
- `2a` (cancel endpoint) Conversation `:id` exists but has no in-flight turn -> 404 `RESOURCE_NOT_FOUND` (BR-38).
- `2b` (cancel endpoint) Conversation `archived_at IS NOT NULL` -> 409 `BUSINESS_CONVERSATION_ARCHIVED` (BR-25).

**Related endpoints:** operationIds: `cancelTurn`, `sendMessage` (the SSE side of the cancellation)

---

### UC-07 -- Idempotent replay returns the original assistant message without re-running the loop

**Actor:** Owner | **Pre:** Owner is authenticated; an earlier `sendMessage` call on this conversation with the same `Idempotency-Key` AND the same `(content, model)` has already produced an assistant message. | **Post:** The Owner receives the previously stored assistant message verbatim, replayed over a single-shot SSE stream; no new `chat_message` rows are inserted; no Anthropic call is made.

**Main flow:**
1. Owner calls `POST /api/v1/conversations/:id/messages` with body `{ "content": "Quem é o Rodrigo?" }` and `Idempotency-Key: <same-uuid-as-before>` (BR-26).
2. BFF performs steps 2-4 of UC-02.
3. BFF finds the existing `chat_message{role:"user", idempotency_key}` row (BR-27); compares the stored `(content, model)` with the request; they match.
4. BFF loads the corresponding `chat_message{role:"assistant"}` row (the next row by `created_at`, same conversation, the immediate successor of the matched user row).
5. BFF opens the SSE stream and emits a SINGLE replay sequence: `llm_start{iteration:1}` -> one `text_delta` frame carrying the full stored assistant content (or multiple `text_delta` frames at the implementation's discretion) -> `done{stop_reason: <stored>, model: <stored>, tokens_in: <stored>, tokens_out: <stored>}` (BR-27).
6. The stream closes.

**Alternative flows:**
- `3a` Idempotency-Key matches but the assistant row does not yet exist (i.e. the original turn is still running OR crashed before persisting the assistant row) -> 409 `BUSINESS_TURN_IN_PROGRESS` if a turn is in-flight (BR-28); otherwise the assistant row is recovered by repeating UC-02 from step 6 onwards (the user row is reused, no new user insert) and the Idempotency-Key continues to point at the same user row (BR-27).
- `3b` Idempotency-Key matches with DIFFERENT `(content, model)` -> 409 `BUSINESS_IDEMPOTENCY_MISMATCH` (BR-27).

**Related endpoint:** operationId: `sendMessage`

---

### UC-08 -- Owner lists messages and inspects usage on a conversation

**Actor:** Owner | **Pre:** Owner is authenticated. | **Post:** None (read-only).

**Main flow (list messages):**
1. Owner calls `GET /api/v1/conversations/:id/messages?limit=50&before=<iso8601>`.
2. BFF loads the conversation by `:id` -> 404 if absent.
3. BFF returns up to `limit` messages on this conversation ordered by `created_at ASC, id ASC`, optionally filtered by `created_at < before` (BR-39); the response includes `next_before` (the `created_at` of the first item of the page) when more pages exist.
4. Response body: `{ ok: true, result: { items: [...], next_before: <iso8601|null> } }`.

**Main flow (usage):**
1. Owner calls `GET /api/v1/conversations/:id/usage`.
2. BFF loads the conversation -> 404 if absent.
3. BFF aggregates over `chat_message WHERE conversation_id = :id AND role = 'assistant'` and returns `{ messages: <int>, tokens_in: <sum>, tokens_out: <sum>, tool_calls: <count from chat_tool_call> }` (BR-40).

**Alternative flows:**
- `1a` JWT invalid -> 401.
- `2a` Conversation `:id` not found -> 404 `RESOURCE_NOT_FOUND`.
- `1b` (list messages) Query string out of range -> 422 `VALIDATION_INVALID_FORMAT`.

**Related endpoints:** operationIds: `listMessages`, `getConversationUsage`

---

### UC-09 -- Kill-switch enabled (chat surface disabled)

**Actor:** Owner | **Pre:** `CHAT_ENABLED=false` in BFF env at boot. | **Post:** Any chat endpoint returns `503 BUSINESS_CHAT_DISABLED` with the standard error envelope; no SSE is opened, no DB write occurs.

**Main flow:**
1. Owner calls any `POST/PATCH/DELETE/GET /api/v1/conversations[/...]` endpoint.
2. `requireNeonAuth` validates the JWT.
3. The route handler shorts on `env.CHAT_ENABLED === false` and returns `503 { ok: false, error: { code: "BUSINESS_CHAT_DISABLED", message } }` (BR-14).

**Alternative flows:**
- `2a` JWT invalid -> 401 (precedes the kill-switch check).

**Related endpoints:** all `chat`-domain operationIds.

---

## 4. Business Rules

> Rules BR-01..BR-24 preserve the v1 turn semantics (with `sendMessage` substituted
> for `chatTurn`). Rules BR-25..BR-40 are NEW in v2.0 and cover persistence, the
> conversation aggregate, idempotency, context reconstruction, distillation, and
> compliance.

### BR-01 -- Turn body has exactly one user `content` field (no client-side history)
The `sendMessage` body is `{ content: string, model?: string }`. `content.length >= 1` AND `content.length <= MAX_CONTENT_LENGTH` (default 32768). Out of range -> 422 `VALIDATION_INVALID_FORMAT`. Covered by UC-02..UC-08.

### BR-02 -- Persisted role enum is exactly `{user, assistant}`
The `chat_message_role` enum has two values. The transient `assistant(tool_use)` / `user(tool_result)` blocks the loop synthesises during an iteration are NEVER persisted as their own `chat_message` rows -- they live only inside the in-loop Anthropic history. Covered by UC-02.

### BR-03 -- Reserved (was "Roles `user|assistant` in client body" in v1.x — superseded by BR-01/BR-02 in v2.0)
Body has no `role` field; the server assigns `role=user` to the inserted request row and `role=assistant` to the inserted completion row. No client-supplied role is accepted. Covered by UC-02.

### BR-04 -- `content` is a non-empty string (turn body)
`sendMessage` request `content` is a string of length >= 1. Empty / non-string -> 422 `VALIDATION_INVALID_FORMAT`. The persisted `chat_message.content` column is `jsonb` (a structured representation of the Anthropic content blocks, e.g. `[{type:"text", text:"..."}]`), but the **wire body for `sendMessage` is a flat string** (BR-01). Covered by UC-02.

### BR-05 -- Tool catalog is the read-only `query` toolset, resolved lazily
The agentic loop exposes exactly the 13 tools of the `query` toolset (9 of `knowledge-graph`: `get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types`, `list_attribute_keys`; 4 of `query-retrieval`: `search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`). Resolution is `mcp.getTool('query', name)` against the in-process `McpServer`, performed lazily on the first request and cached for the process lifetime. `registerChatRoutes` is mounted only when the registry resolves the full catalog; otherwise the routes stay unregistered. Covered by UC-02.

### BR-06 -- Tools are READ-ONLY (v7 §2 inegociable)
No write or curation tool is registered. The agentic loop MUST NOT call any other tool name; the Anthropic `tools[]` sent on each iteration is exactly the 13 read-only names. Each tool invocation opens its own short `BEGIN READ ONLY` transaction (the same `withReadOnly` helper used by `query-retrieval`). The LLM never reaches the database directly. Covered by UC-02.

### BR-07 -- Tool result envelope is the standard business envelope
Every tool call returns `{ ok: true, result }` on success or `{ ok: false, error: { code, message, details? } }` on validation/business failure. The SSE `tool_result{tool, ok}` mirrors the `ok` field. Tool errors are NOT propagated as SSE `error` frames -- they are sent back to the model as the `tool_result` block of the next iteration so the model can react. Covered by UC-02.

### BR-08 -- `text_delta` frames are emitted as the Anthropic SDK yields them
The service does not batch tokens across SDK events. Empty deltas are skipped (the schema requires `delta.length >= 1`). The SSE writer flushes each frame immediately to defeat proxy buffering (`X-Accel-Buffering: no`). Covered by UC-02.

### BR-09 -- `tool_start.args_summary` is a redacted summary
`args_summary` is a short (<= 200 chars) string built by the service from the tool inputs. It MUST NOT include raw `value` / `text` columns or full document bodies. The format is tool-specific (e.g. `search`: `query="<first 60 chars of query>"`; `get_node`: `id=<uuid>`; `traverse`: `id=<uuid> depth=<n>`). When the inputs cannot be summarised safely, `args_summary` falls back to `"<n keys>"`. Covered by UC-02.

### BR-10 -- Unknown tool name returns an error tool_result without aborting the turn
If the model emits a `tool_use` block whose `name` is not in the resolved catalog (defensive guard; cannot occur with `tool_choice: "auto"` over the registered set), the service emits `tool_result{tool: <name>, ok: false}` and sends back to the model a `user(tool_result)` block of `{ ok: false, error: { code: "VALIDATION_INVALID_FORMAT", message: "unknown tool name" } }`, then continues the loop. Covered by UC-02.

### BR-11 -- Mid-stream provider failure surfaces as one SSE `error` frame
If the Anthropic stream aborts mid-turn with a network/provider error, the service emits exactly ONE `event: error` frame with `code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE"`, then closes the stream. No `done` frame is emitted. The assistant row is still persisted (BR-29) with `stop_reason = "provider_error"` and the partial accumulated text. Covered by UC-02 (`10a`).

### BR-12 -- Client disconnect triggers `stream.abort()`
On `req.raw.on('close')`, the service calls `stream.abort()` on the in-flight Anthropic stream and, IF the socket is still writable, emits `done{stop_reason:"cancelled"}` and closes the SSE. If the socket is already closed, no further frame is emitted. The assistant row is still persisted with `stop_reason = "cancelled"` (BR-29). Covered by UC-06.

### BR-13 -- Tool results sent back to the model are truncated to `TOOL_RESULT_MAX_CHARS`
The body of a `tool_result` block forwarded to the next Anthropic iteration is truncated to `TOOL_RESULT_MAX_CHARS` Unicode code points (default 8000). Truncation appends an explicit marker `"\n[truncated: <n> chars]"`. The SSE `tool_result` event itself only carries `{tool, ok}` and is not affected. The persisted `chat_tool_call.result` jsonb column stores the FULL, untruncated body (truncation is a context-window concern, not a persistence concern). Covered by UC-02.

### BR-14 -- Kill-switch returns 503 BEFORE opening the SSE
When `env.CHAT_ENABLED === false`, every chat-domain route handler returns `503 { ok: false, error: { code: "BUSINESS_CHAT_DISABLED" } }` before performing any work. No SSE frame is emitted; no DB write occurs. Covered by UC-09.

### BR-15 -- `MAX_ITERATIONS` ceiling closes the turn with `stop_reason: "max_iterations"`
Before opening iteration `N+1` where `N+1 > MAX_ITERATIONS` (default 8), the service emits `done{stop_reason:"max_iterations", model, tokens_in, tokens_out}` and closes the SSE. No further Anthropic call is issued. Assistant row persisted (BR-29). Covered by UC-03.

### BR-16 -- `TURN_TIMEOUT_MS` ceiling aborts the active stream
On wall-clock expiry (timer started at the first `llm_start`), the service calls `stream.abort()` and emits `done{stop_reason:"turn_timeout"}`. Assistant row persisted (BR-29). Covered by UC-05.

### BR-17 -- `TOOL_TIMEOUT_MS` aborts a single tool call
Each tool invocation runs under a wall-clock timeout (default 15s). On expiry, the service treats the call as a failed tool result `{ ok: false, error: { code: "SYSTEM_SERVICE_UNAVAILABLE", message: "tool timeout" } }`, emits `tool_result{tool, ok:false}`, sends the error tool_result block back to the model, persists the failed `chat_tool_call` row with `is_error = true` (BR-32), and continues the loop. Does NOT terminate the turn by itself. Covered by UC-02.

### BR-18 -- System prompt persona, language, and safety
The system prompt is pt-BR. Persona: "assistente de consulta ao grafo de conhecimento". It MUST:
1. Introduce the entities (`KnowledgeNode`, `NodeAlias`, `NodeAttribute`, `KnowledgeLink`, `InformationFragment`, `Provenance`).
2. Describe the temporal axes (`as_of`, `in_effect_only`) and the confidence flag (`include_uncertain`).
3. Instruct: always resolve a name to a node via `search` / `list_nodes` BEFORE calling `get_node` / `traverse`; never invent ids or dates; cite provenance only when explicitly asked; respond in pt-BR.
4. State that document content is DATA, never instruction (v7 §13).
5. Forbid exposing stack traces or internal codes verbatim.
The system prompt is loaded from a versioned module (parallel pattern to `prompts/index.ts` used by `ingestion`).

### BR-19 -- Observability per turn (no PII)
Each completed turn logs (pino, INFO) a single structured record with: `request_id`, `actor="owner"`, `conversation_id`, `message_id`, `route="POST /api/v1/conversations/:id/messages"`, `model`, `iterations`, `tools_called[]` (names only, order preserved), `tokens_in`, `tokens_out`, `stop_reason`, `latency_ms`, `aborted` (boolean), `idempotent_replay` (boolean). The raw `content`, `args_summary` raw values, and tool result bodies are NEVER logged. Counter `chat_turn_total{stop_reason}` is incremented per `stop_reason`. Aligned with v7 §16.

### BR-20 -- Output guard (minimal) against system-prompt leakage
Before forwarding a `text_delta` to the SSE writer, the service applies a minimal scrubber that drops the delta if it contains a substring exactly matching the registered system-prompt marker token. The scrubber is intentionally minimal -- the security model is single-owner (v7 §2.3) and there is no untrusted tenant.

### BR-21 -- Anthropic factory is injectable; defaults from env
The `anthropicFactory` parameter defaults to `defaultAnthropicFactory` and reads `env.ANTHROPIC_API_KEY`. When the factory throws (missing key, malformed config), the route handler returns 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` BEFORE opening the SSE and BEFORE persisting the user row.

### BR-22 -- Conversation lookup by id
Every nested operation (`sendMessage`, `listMessages`, `getConversationUsage`, `cancelTurn`, `updateConversation`, `deleteConversation`, `getConversation`) MUST resolve `:id` against `chat_conversation`. Absence -> 404 `RESOURCE_NOT_FOUND`. The conversation id is a UUIDv4 / UUIDv7 (server-assigned).

### BR-23 -- Pre-stream error envelope vs in-stream error frame
Any error raised BEFORE the SSE is opened is rendered via the standard REST envelope (`VALIDATION_*`, `AUTH_*`, `RESOURCE_NOT_FOUND`, `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, `BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_IDEMPOTENCY_MISMATCH`, `BUSINESS_TURN_IN_PROGRESS`). Any error raised AFTER the SSE has opened is rendered as ONE `event: error` frame (only `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` and `SYSTEM_INTERNAL_ERROR` are valid in-stream codes).

### BR-24 -- One terminal frame per turn
Every successfully opened SSE stream terminates with EXACTLY ONE of `{done, error}`. After the terminal frame, the stream closes; no further frame is emitted.

### BR-25 -- Writes are forbidden on archived conversations
`sendMessage` and `cancelTurn` MUST refuse to operate on a conversation whose `archived_at IS NOT NULL`. Pre-stream `409 BUSINESS_CONVERSATION_ARCHIVED`. Read operations (`getConversation`, `listMessages`, `getConversationUsage`) work unconditionally; `listConversations` only includes archived rows when `include_archived=true` (BR-35). Re-activate via `updateConversation { archived_at: null }`. Covered by UC-02 (`4b`), UC-06 (`2b`), UC-04.

### BR-26 -- `Idempotency-Key` is REQUIRED on `sendMessage`
`POST /conversations/:id/messages` MUST carry the header `Idempotency-Key`, whose value MUST be a valid RFC 4122 UUID. Missing -> 422 `VALIDATION_REQUIRED_FIELD`. Not a UUID -> 422 `VALIDATION_INVALID_FORMAT`. The header is mandatory because a `sendMessage` call has two compound side effects (user row insert + agentic loop + assistant row insert) that the client MUST be able to retry safely after a network drop. Covered by UC-02 (`3b`, `3c`).

### BR-27 -- Idempotent replay returns the original assistant message
Idempotency is keyed by the UNIQUE PARTIAL index `chat_message(conversation_id, idempotency_key) WHERE idempotency_key IS NOT NULL`. On `sendMessage`:
1. If no row matches -> proceed normally (UC-02).
2. If a row matches AND its stored `(content, model)` equals the request -> idempotent replay (UC-07): the BFF locates the immediate successor assistant row, opens a one-shot SSE, and replays it as `llm_start{1}` + `text_delta(<full text>)` + `done{stop_reason: <stored>}`. No new rows are inserted; no Anthropic call is made.
3. If a row matches AND its stored `(content, model)` differs -> 409 `BUSINESS_IDEMPOTENCY_MISMATCH` (pre-stream).
4. If a row matches AND no successor assistant row exists yet -> 409 `BUSINESS_TURN_IN_PROGRESS` when an in-flight turn is detected (BR-28); otherwise the user row is reused (no new user insert) and the agentic loop runs from step 7 of UC-02 onwards.

Covered by UC-02 (`5a`, `5b`), UC-07.

### BR-28 -- Single in-flight turn per conversation
Only ONE turn may be running on a given conversation at any time. The BFF tracks in-flight turns in process memory (single-owner -> single BFF instance is the v1 deployment shape). A second `sendMessage` against a conversation with an in-flight turn -> 409 `BUSINESS_TURN_IN_PROGRESS`. The check is performed AFTER the conversation-archived check (BR-25) and BEFORE the idempotency check (BR-27). Covered by UC-02 (`4c`).

### BR-29 -- Persistence sequencing: user row BEFORE SSE, assistant row AFTER terminal frame
The BFF MUST insert the user `chat_message` row BEFORE writing the first SSE header. This guarantees that on any subsequent failure (provider error, internal error, cancellation, timeout) the user's question is durable. The BFF MUST insert the assistant `chat_message` row AFTER the terminal SSE frame is emitted (or after the iterator throws). The persisted assistant row carries:
- `content`: jsonb array of the streamed content blocks (text + any model-emitted blocks);
- `stop_reason`: the terminal `stop_reason` (including the synthetic codes `provider_error`, `internal_error`, `max_iterations`, `turn_timeout`, `cancelled`);
- `idempotency_key`: NULL (the idempotency key lives on the user row);
- `model`: the resolved model id;
- `tokens_in`, `tokens_out`: the per-turn token sums;
- `latency_ms`: wall-clock from first `llm_start` to terminal frame.

On internal failure that prevents the assistant row from being written, a WARN log `chat.assistant_row_persist_failure` is emitted with the `request_id` and the failure cause. The SSE has already closed at this point -- the failure does not propagate to the client. Covered by UC-02..UC-06.

### BR-30 -- `Conversation` create body invariants
`POST /conversations` body: `{ title?: string }`. `title`, when present, MUST be a string of length 1..200. Out of range -> 422 `VALIDATION_INVALID_FORMAT`. The server assigns `id`, `created_at`, `updated_at`; `archived_at`, `summary_rolling` are initialised to NULL. Covered by UC-01.

### BR-31 -- Context reconstruction: system prompt + summary_rolling + recent window
On every `sendMessage`, the BFF reconstructs the Anthropic `messages[]` from the database as:
1. `system` prompt block (resolved via `selectChatPromptModule(env.CHAT_PROMPT_VERSION)`, BR-18).
2. IF `conversation.summary_rolling IS NOT NULL`, a synthetic `user` block at the head of `messages[]` carrying `"[contexto da conversa anterior, sintetizado]\n\n" + summary_rolling` -- a stylistic header that tells the model the block is a recap, not a user instruction.
3. The last `CHAT_RECENT_WINDOW` `chat_message` rows (default 10) of this conversation, ordered by `created_at ASC`, mapped 1:1 to Anthropic `messages[]` entries (`role` -> `role`, `content[]` -> `content`).
4. Finally, the user message that was just inserted in step 6 of UC-02 -- which is the LAST item of point 3 by construction (the user row is inserted BEFORE the loop opens, BR-29).

Client-side history is NEITHER required NOR accepted. The body of `sendMessage` carries one `content` string and nothing else. Covered by UC-02.

### BR-32 -- Tool calls are persisted with full input and result
Every tool invocation produces one `chat_tool_call` row with `conversation_id`, `message_id` (the assistant row id, set after BR-29 writes the assistant row -- alternatively NULL and patched on persistence; either order is acceptable as long as the row eventually carries the message id), `tool_name`, `arguments` (full jsonb input), `result` (full jsonb success body, NULL on error), `is_error` (boolean), `error_message` (NULL on success), `duration_ms`, `created_at`. The persisted row is the auditable record of what the model called and what came back -- it is NOT truncated by BR-13.

### BR-33 -- Rolling summary refresh policy
When the conversation has more than `CHAT_SUMMARY_AFTER_TURNS` user turns (default 20) AND `CHAT_SUMMARY_ENABLED=true`, the BFF schedules a non-blocking summary refresh AFTER the current turn's HTTP response has terminated. The refresh:
1. Computes the new `summary_rolling` by calling `CHAT_UTILITY_MODEL` (default `claude-haiku-4-5`, a smaller model) over the messages OLDER than the last `CHAT_RECENT_WINDOW`.
2. Updates `chat_conversation.summary_rolling` and `updated_at`.

The refresh is best-effort: a failure logs a WARN `chat.summary_refresh_failure` and does NOT roll back the turn (the turn has already completed). The refresh policy is OFF when `CHAT_SUMMARY_ENABLED=false`; in that case `summary_rolling` remains permanently NULL.

### BR-34 -- Title distillation policy
When `conversation.title IS NULL` after a turn completes AND `CHAT_TITLE_ENABLED=true`, the BFF schedules a non-blocking title-distillation job AFTER the HTTP response has terminated. The job:
1. Calls `CHAT_UTILITY_MODEL` over the first user message + the first assistant message of the conversation.
2. Sets `chat_conversation.title` to a string of length <= 80 and updates `updated_at`.

If the model returns an empty or oversized string, the job is silently dropped and `title` stays NULL (the Owner may always set it manually via `updateConversation`). Failures log `chat.title_distillation_failure` (WARN) and do not affect the turn.

### BR-35 -- Conversation listing: cursor pagination ordered by `created_at DESC, id DESC`
`GET /conversations` returns pages of conversations ordered by `(created_at DESC, id DESC)` to break ties deterministically. The `cursor` parameter is an opaque string encoding the last `(created_at, id)` pair of the previous page; the server decodes, validates, and uses it as a strict `<` bound. `limit` is bounded `[1, 100]`, default 20. `include_archived` defaults to `false` (only `archived_at IS NULL` rows are returned); when `true`, both active and archived rows are returned. Response carries `next_cursor` (opaque) when more pages exist; `null` otherwise. Covered by UC-04.

### BR-36 -- `updateConversation` accepts `title` and/or `archived_at`; at least one MUST be present
`PATCH /conversations/:id` accepts a partial body with `title?: string|null` and `archived_at?: string|null` (RFC3339). At least one of the two MUST be present in the body. `title` is a string of length 1..200 or `null` to clear. `archived_at` is a valid timestamp or `null` to un-archive. Empty body / both absent -> 422 `VALIDATION_REQUIRED_FIELD`. Covered by UC-04.

### BR-37 -- Cascade delete on `deleteConversation`
`DELETE /conversations/:id` removes the `chat_conversation` row; the `ON DELETE CASCADE` foreign keys on `chat_message.conversation_id` and `chat_tool_call.conversation_id` propagate the delete. The operation is permanent (no soft-delete column on these tables in v1). The chat tables are OUTSIDE the v7 §11 compliance flow (chat stores synthesised answers, not facts anchored to `raw_information` -- see §6 below). Response is `204 No Content`. Covered by UC-04.

### BR-38 -- `cancelTurn` requires a live in-flight turn on the conversation
`POST /conversations/:id/cancel` looks up the in-flight turn for `:id` in the BFF's in-process registry. Absent -> 404 `RESOURCE_NOT_FOUND`. Present -> calls `AbortController.abort(reason="cancelled")`, returns `202 Accepted { ok: true, result: { cancelled: true } }`. The actual termination of the SSE stream happens on the original turn's request (BR-12). Covered by UC-06.

### BR-39 -- Message listing: ascending order, `before` cursor
`GET /conversations/:id/messages` returns messages ordered by `(created_at ASC, id ASC)` (chronological). `limit` is bounded `[1, 200]`, default 50. The `before` parameter is an optional RFC3339 timestamp; when present, the server returns only messages with `created_at < before`. The response carries `next_before` (the `created_at` of the OLDEST item of the page) when more pages exist; `null` otherwise. The pagination semantics intentionally walk BACKWARDS in time (older pages) so the SPA can lazy-load context above the visible window. Covered by UC-08.

### BR-40 -- `getConversationUsage` aggregates over assistant rows + tool calls
`GET /conversations/:id/usage` returns `{ messages: <int>, tokens_in: <sum>, tokens_out: <sum>, tool_calls: <count> }` where:
- `messages` is the count of `chat_message` rows on the conversation (both roles).
- `tokens_in` / `tokens_out` are summed over `chat_message WHERE role='assistant'`, treating NULL token columns as 0.
- `tool_calls` is the count of `chat_tool_call` rows on the conversation.

The endpoint is read-only and does not load the message bodies. Covered by UC-08.

---

## 5. State Machine

> The chat domain has TWO lifecycles: the **conversation** (long-lived aggregate)
> and the **turn** (nested, short-lived). The conversation lifecycle is observable
> via REST; the turn lifecycle is observable via SSE frames.

### 5.1 Conversation lifecycle

```
[null] --POST /conversations--> [active] --PATCH archived_at=NOW--> [archived]
                                  |                                    |
                                  +--PATCH archived_at=null<-----------+
                                  |
                                  +--DELETE /conversations/:id--> [deleted (row removed)]
[archived] --DELETE /conversations/:id--> [deleted (row removed)]
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| `null` | `POST /conversations` | `active` | Zod parse OK; row inserted | UC-01 |
| `active` | `PATCH /conversations/:id { archived_at: <ts> }` | `archived` | BR-36 | UC-04 |
| `archived` | `PATCH /conversations/:id { archived_at: null }` | `active` | BR-36 | UC-04 |
| `active` \| `archived` | `DELETE /conversations/:id` | `deleted` (row removed) | BR-37 (cascade) | UC-04 |
| `archived` | `POST /conversations/:id/messages` | n/a (refused) | 409 `BUSINESS_CONVERSATION_ARCHIVED` (BR-25) | UC-02 (`4b`) |
| `archived` | `POST /conversations/:id/cancel` | n/a (refused) | 409 `BUSINESS_CONVERSATION_ARCHIVED` (BR-25) | UC-06 (`2b`) |

### 5.2 Turn lifecycle (nested under `active` conversation)

```
[idle] --POST /conversations/:id/messages--> [validating]
       --header missing--> [closed_pre_stream]
       --conv archived--> [closed_pre_stream]                  (BR-25)
       --turn in-flight--> [closed_pre_stream]                 (BR-28)
       --idempotency mismatch--> [closed_pre_stream]           (BR-27, 409)
       --idempotency replay--> [replay_open] --done--> [closed]
       --ok--> [user_row_persisted] --hijack--> [streaming_open]

[streaming_open] --llm_start(i)--> [llm_streaming(i)]
[llm_streaming(i)] --text_delta--> [llm_streaming(i)]
[llm_streaming(i)] --stop_reason=tool_use--> [tool_pending(i,t)]
[llm_streaming(i)] --stop_reason in {end_turn,max_tokens,stop_sequence}--> [done_end]
[llm_streaming(i)] --provider_error--> [done_error]
[llm_streaming(i)] --client_close OR cancelTurn--> [aborting]
[llm_streaming(i)] --turn_timeout--> [aborting_timeout]

[tool_pending(i,t)] --tool_start(t)--> [tool_running(i,t)]
[tool_running(i,t)] --tool_result(ok|err)--> [iteration_completed(i)]
[tool_running(i,t)] --tool_timeout--> [iteration_completed(i)] (BR-17)

[iteration_completed(i)] --i+1 <= MAX_ITERATIONS--> [llm_streaming(i+1)]
[iteration_completed(i)] --i+1 > MAX_ITERATIONS--> [done_max_iterations] (BR-15)

[aborting] --acknowledged--> [done_cancelled]
[aborting_timeout] --acknowledged--> [done_timeout]

[done_end | done_max_iterations | done_cancelled | done_timeout] --done frame + persist assistant row--> [closed]
[done_error] --error frame + persist assistant row (stop_reason=provider_error|internal_error)--> [closed]
```

| From | Event | To | Condition | UC |
|------|-------|----|-----------|----|
| `idle` | `POST /conversations/:id/messages` arrives | `validating` | -- | UC-02 |
| `validating` | header `Idempotency-Key` missing/malformed | `closed_pre_stream` | 422 (BR-26) | UC-02 (`3b`/`3c`) |
| `validating` | JWT invalid | `closed_pre_stream` | 401 | UC-02 |
| `validating` | body Zod fail | `closed_pre_stream` | 422 (BR-01/BR-04) | UC-02 (`3a`) |
| `validating` | conversation not found | `closed_pre_stream` | 404 (BR-22) | UC-02 (`4a`) |
| `validating` | conversation archived | `closed_pre_stream` | 409 `BUSINESS_CONVERSATION_ARCHIVED` (BR-25) | UC-02 (`4b`) |
| `validating` | turn in-flight | `closed_pre_stream` | 409 `BUSINESS_TURN_IN_PROGRESS` (BR-28) | UC-02 (`4c`) |
| `validating` | idempotency mismatch | `closed_pre_stream` | 409 `BUSINESS_IDEMPOTENCY_MISMATCH` (BR-27) | UC-02 (`5a`) |
| `validating` | idempotency replay (match identical) | `replay_open` -> emit `llm_start{1}` + `text_delta` + `done{stored}` -> `closed` | (BR-27) | UC-07 |
| `validating` | kill-switch on | `closed_pre_stream` | 503 `BUSINESS_CHAT_DISABLED` (BR-14) | UC-09 |
| `validating` | Anthropic factory throws | `closed_pre_stream` | 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (BR-21) | UC-02 |
| `validating` | all checks pass | `user_row_persisted` | insert user `chat_message` row (BR-29) | UC-02 |
| `user_row_persisted` | `reply.hijack()` | `streaming_open` | -- | UC-02 |
| `streaming_open` | enter iteration 1 | `llm_streaming(1)` | emit `llm_start{1}` | UC-02 |
| `llm_streaming(i)` | Anthropic `text_delta` | `llm_streaming(i)` | (BR-08) + (BR-20 guard) | UC-02 |
| `llm_streaming(i)` | stop = `tool_use` | `tool_pending(i,t)` | tool name in catalog | UC-02 |
| `llm_streaming(i)` | stop = `end_turn`/`max_tokens`/`stop_sequence` | `done_end` | -- | UC-02 |
| `tool_pending(i,t)` | emit `tool_start{t}` | `tool_running(i,t)` | redacted summary (BR-09) | UC-02 |
| `tool_running(i,t)` | tool returns `{ok}` | `iteration_completed(i)` | emit `tool_result{t, ok}` (BR-07); persist `chat_tool_call` (BR-32) | UC-02 |
| `tool_running(i,t)` | tool wall-clock > `TOOL_TIMEOUT_MS` | `iteration_completed(i)` | `ok=false` (BR-17) | UC-02 |
| `iteration_completed(i)` | `i+1 <= MAX_ITERATIONS` | `llm_streaming(i+1)` | next iteration; truncate result (BR-13) | UC-02 |
| `iteration_completed(i)` | `i+1 > MAX_ITERATIONS` | `done_max_iterations` | (BR-15) | UC-03 |
| any active | provider/network error | `done_error` | (BR-11) | UC-02 (`10a`) |
| any active | client closes socket OR `cancelTurn` | `aborting` -> `done_cancelled` | (BR-12, BR-38) | UC-06 |
| any active | wall-clock > `TURN_TIMEOUT_MS` | `aborting_timeout` -> `done_timeout` | (BR-16) | UC-05 |
| any `done_*` | emit `done` frame; persist assistant row (BR-29) | `closed` | -- | -- |
| `done_error` | emit `error` frame; persist assistant row with `stop_reason=provider_error\|internal_error` | `closed` | -- | UC-02 (`10a`/`12a`) |

---

## 6. Error Behaviors

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Body fails Zod parse (empty `content`, > `MAX_CONTENT_LENGTH`, non-string `model`, title invalid, archived_at not a timestamp, body of PATCH empty) | 422 | `VALIDATION_INVALID_FORMAT` | Pre-stream. Standard REST envelope. |
| `Idempotency-Key` header missing on `sendMessage` | 422 | `VALIDATION_REQUIRED_FIELD` | Pre-stream. BR-26. |
| `Idempotency-Key` not a valid UUID | 422 | `VALIDATION_INVALID_FORMAT` | Pre-stream. BR-26. |
| `PATCH /conversations/:id` body has neither `title` nor `archived_at` | 422 | `VALIDATION_REQUIRED_FIELD` | Pre-stream. BR-36. |
| Missing `Authorization` header | 401 | `AUTH_UNAUTHORIZED` | Pre-stream. From `requireNeonAuth`. |
| JWT expired | 401 | `AUTH_TOKEN_EXPIRED` | Pre-stream. |
| JWT signature / shape invalid | 401 | `AUTH_TOKEN_INVALID` | Pre-stream. |
| Conversation `:id` not found | 404 | `RESOURCE_NOT_FOUND` | Pre-stream. BR-22 / UC-02..UC-08. |
| `cancelTurn` called but no in-flight turn for `:id` | 404 | `RESOURCE_NOT_FOUND` | Pre-stream. BR-38 / UC-06. |
| Write attempted on an archived conversation | 409 | `BUSINESS_CONVERSATION_ARCHIVED` | Pre-stream. BR-25 / UC-02 (`4b`), UC-06 (`2b`). |
| Another turn is already running on this conversation | 409 | `BUSINESS_TURN_IN_PROGRESS` | Pre-stream. BR-28 / UC-02 (`4c`). |
| `Idempotency-Key` matches with different `(content, model)` | 409 | `BUSINESS_IDEMPOTENCY_MISMATCH` | Pre-stream. BR-27 / UC-02 (`5a`). |
| Kill-switch on (`CHAT_ENABLED=false`) | 503 | `BUSINESS_CHAT_DISABLED` | Pre-stream. BR-14 / UC-09. |
| Anthropic client cannot initialise | 503 | `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | Pre-stream. BR-21. |
| Anthropic stream aborts mid-turn (network, provider) | n/a (SSE `error` frame; HTTP already 200) | `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | In-stream. BR-11 / UC-02 (`10a`). |
| Unhandled exception in agentic loop | n/a (SSE `error` frame; HTTP already 200) | `SYSTEM_INTERNAL_ERROR` | In-stream. UC-02 (`12a`). |
| Single tool call wall-clock > `TOOL_TIMEOUT_MS` | n/a (fed back to model as failed tool_result) | `SYSTEM_SERVICE_UNAVAILABLE` | In-stream, NOT terminal. BR-17. |
| Unknown tool name from model (defensive) | n/a (fed back to model as failed tool_result) | `VALIDATION_INVALID_FORMAT` | In-stream, NOT terminal. BR-10. |

> Tool-internal business errors (e.g. `BUSINESS_INVALID_SEARCH_QUERY`,
> `BUSINESS_NODE_DELETED`) flow through the agentic loop as failed tool results --
> they are not emitted on the SSE `error` channel. The SSE `error` channel is reserved
> for *terminal* errors that close the stream.

> **Compliance §11 note.** The `chat_*` tables are OUTSIDE the v7 §11 compliance
> flow. Chat stores SYNTHESISED conversations between the Owner and the model; it
> does NOT store facts anchored to `raw_information`. The `compliance_delete`
> operation (v7 §11) does NOT walk into `chat_message`/`chat_tool_call`. The Owner's
> means of erasing chat content is `DELETE /api/v1/conversations/:id`, which
> cascades via `ON DELETE CASCADE` (BR-37) and is permanent (no tombstone). This
> simplification is acceptable in v1 because (a) the surface is single-owner
> (v7 §2.3 / ADR A20) so there is no third-party PII protection requirement, and
> (b) any traceable fact in a chat answer remains anchored to its source
> `raw_information` row through the tool-result `Provenance`, which the `query`
> tools surface on demand -- the chat row itself carries no first-class facts.
> Reconcile in a future revision if compliance posture changes.

---

## 7. Cross-Domain Dependencies

| Domain | Type | Description |
|--------|------|-------------|
| `query-retrieval` | consumes | Reuses the 4 read tools (`search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`) as agentic tools. Reuses the `withReadOnly` transaction helper. |
| `knowledge-graph` | consumes | Reuses the 9 read tools (`get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types`, `list_attribute_keys`) as agentic tools, including the in-process `McpServer` registry (`mcp.getTool('query', name)`) and the catalog cache. |
| `ingestion` | consumes (pattern only, not data) | Reuses the `defaultAnthropicFactory` pattern (`modules/ingestion/service/extraction.service.ts`) and the `ANTHROPIC_API_KEY` env loader; ALSO reuses the prompt-version registry pattern (`prompts/index.ts`) for the chat system prompt. No runtime data coupling. |
| `compliance-audit` (v7 §11) | excluded | The `chat_*` tables are OUTSIDE the v7 §11 compliance flow (chat stores synthesised answers, not facts anchored to `raw_information`). Documented in §6 and BR-37. The Owner's means of erasing chat content is the standard `DELETE /conversations/:id` cascade. |

> Reverse declarations: `query-retrieval` and `knowledge-graph` MUST list `chat` as a
> downstream consumer in their next revision. `ingestion` does not need to declare
> `chat` because there is no runtime coupling. `compliance-audit` MUST list `chat` as
> an EXCLUDED domain in its next revision (chat tables are not visited by the
> compliance delete walker).

---

## 8. Out of Scope

- **Frontend / SPA components** -- BACKEND-ONLY change; the SPA work is tracked separately.
- **Cost / USD accounting at the API level** -- only `tokens_in`/`tokens_out` aggregates (BR-40). No price catalog, no `cost_usd` column.
- **Citations attached to assistant messages** -- the Owner inspects provenance on demand via the `query` tools; assistant rows do not carry a structured citation field in v1.
- **`guardrail_events` table / pending tool-confirmation flow** -- write/curation tools are not exposed; there is no need to gate destructive operations behind a confirmation handshake.
- **`pending_confirmations` table** -- not introduced (read-only tool catalog).
- **Write or curation tools in the agentic loop** -- intentionally read-only; out of v1.
- **Embeddings-based retrieval** -- permanent non-goal (v7 §20.1 / ADR A24).
- **Heavy input regex / prompt-injection scrubbing** -- single-owner (v7 §2.3 / ADR A20); minimal output guard only (BR-20).
- **Rate-limit / backpressure middleware** -- single-owner; not specified.
- **Compliance-delete integration for chat rows** -- §6 / BR-37: chat tables are outside the v7 §11 flow; the cascade DELETE is the only erasure path.
- **Multi-instance BFF coordination of in-flight turns** -- BR-28 relies on the single-process registry. A future multi-instance deployment would require an out-of-process lock (Redis, advisory lock) -- not v1.
- **Streaming of historical message reads** -- `listMessages` returns JSON, not SSE.

---

## 9. Local Glossary

| Term | Definition |
|------|-----------|
| Conversation | A long-lived aggregate (`chat_conversation` row) carrying an ordered sequence of messages, an optional title, an optional rolling summary, and an optional `archived_at` timestamp. Identified by a UUID. |
| Message | A single `chat_message` row with `role in {user, assistant}` and a jsonb `content` representing Anthropic-style content blocks (e.g. `[{type:"text", text:"..."}]`). |
| Turn | One execution of `POST /conversations/:id/messages` -- one user message in, one assistant message persisted, an SSE stream during. The agentic loop from the first `llm_start` to the terminating `done` or `error` frame. |
| Iteration | One Anthropic `messages.stream(...)` call inside a turn. A turn has at least 1 and at most `MAX_ITERATIONS` iterations. |
| Tool catalog | The 13 read-only `query`-toolset entries resolved via the in-process `McpServer` registry at first request. |
| Tool call | An auditable `chat_tool_call` row recording one tool dispatch: `tool_name`, full `arguments` jsonb, full `result` jsonb (or `error_message`), `is_error`, `duration_ms` (BR-32). |
| Context window | The Anthropic `messages[]` array reconstructed server-side on each turn: system prompt + (optional) rolling summary block + last `CHAT_RECENT_WINDOW` messages (BR-31). |
| Rolling summary | The `chat_conversation.summary_rolling` text column -- a distillation of older messages produced by `CHAT_UTILITY_MODEL` after `CHAT_SUMMARY_AFTER_TURNS` user turns (BR-33). |
| Idempotency-Key | A REQUIRED UUID header on `sendMessage` (BR-26). Identical key + identical `(content, model)` -> idempotent replay (BR-27, UC-07). Identical key + different body -> 409 `BUSINESS_IDEMPOTENCY_MISMATCH`. |
| Idempotent replay | A one-shot SSE that replays a previously persisted assistant message verbatim, without invoking Anthropic. Triggered by a matching `Idempotency-Key` + identical body (BR-27, UC-07). |
| SSE | Server-Sent Events -- `text/event-stream` framing, one event per `event: <name>\ndata: <JSON>\n\n` block. |
| Pre-stream error | An error raised before the `200 OK` SSE response line, returned as the standard REST envelope with an HTTP status. |
| In-stream error | An error raised after the SSE has been opened, emitted as one `event: error` frame, after which the stream closes. |
| `args_summary` | A short (<= 200 chars), redacted, tool-specific human-readable summary of a tool's input arguments (BR-09). |
| Kill-switch | The boot-time env `CHAT_ENABLED`; when false, every chat route returns 503 `BUSINESS_CHAT_DISABLED` without opening any SSE or writing any row (BR-14). |
| Utility model | The smaller Anthropic model identified by `CHAT_UTILITY_MODEL` (default `claude-haiku-4-5`) used for rolling-summary refresh (BR-33) and title distillation (BR-34). Distinct from `CHAT_MODEL` (the turn model). |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-19 | Spec Writer | initial | Initial version -- new `chat` domain. Additive deviation from v7 (which does not specify a chat surface). Stateless v1: single endpoint `POST /api/v1/chat`, READ-ONLY agentic loop over the 13 `query`-toolset tools, SSE framing. | -- |
| 1.0.1 | 2026-06-19 | Spec Writer | patch | Corrected pre-stream HTTP status for `VALIDATION_INVALID_FORMAT` from 400 to 422 to align with the global error-code catalog and all other domains. | REPAIR-1 |
| 2.0.0 | 2026-06-20 | Spec Writer | major (breaking) | **Stateful conversations.** Replaced `POST /api/v1/chat` with the `/conversations` resource family: `createConversation`, `listConversations`, `getConversation`, `updateConversation`, `deleteConversation`, `sendMessage` (nested turn SSE, mandatory `Idempotency-Key`), `listMessages`, `getConversationUsage`, `cancelTurn`. Introduced 3 persisted tables (`chat_conversation`, `chat_message`, `chat_tool_call`) via migration `0004_chat_persistence.sql` (DB Safety Rule applies -- migration is owned by the back-spec; this spec only describes the contract). Server reconstructs context from DB (BR-31): system prompt + `summary_rolling` + last `CHAT_RECENT_WINDOW` messages. Added BRs: BR-25 (archived = no-write), BR-26 (Idempotency-Key required), BR-27 (idempotent replay), BR-28 (single in-flight turn per conversation), BR-29 (persistence sequencing: user row before SSE, assistant row after terminal frame), BR-30 (create body invariants), BR-31 (context reconstruction), BR-32 (tool-call persistence), BR-33 (rolling summary refresh policy), BR-34 (title distillation policy), BR-35 (conversation listing pagination), BR-36 (patch body invariants), BR-37 (cascade delete + compliance §11 exclusion), BR-38 (cancel endpoint), BR-39 (message listing pagination), BR-40 (usage aggregation). New error codes: `BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_IDEMPOTENCY_MISMATCH`, `BUSINESS_TURN_IN_PROGRESS` (registered in the global catalog). Updated §1 overview, §2 actors, §5 state machine (added conversation lifecycle), §6 error behaviors (added pre-stream business codes + compliance §11 note), §7 dependencies (added `compliance-audit` as excluded), §8 out-of-scope (cost_usd, citations, guardrail_events, pending_confirmations, frontend). PRESERVED from v1: agentic loop semantics (BR-05..BR-24), READ-ONLY tool catalog, SSE framing, sanity ceilings, abort semantics, pino observability shape (BR-19 extended with `conversation_id` + `message_id` + `idempotent_replay`). | -- |
