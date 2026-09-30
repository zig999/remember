---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/chat/index.ts
  - src/modules/chat/repository/chat.repository.ts
  - src/modules/chat/routes/chat.schemas.ts
  - src/modules/chat/routes/conversations.routes.ts
read_outside_area:
  - "src/modules/chat/service/errors.ts — the HTTP status and code behind each chat sentinel error the routes answer through mapChatError"
  - "src/modules/chat/service/conversation.service.ts — how decodeCursor and encodeCursor build and refuse the listConversations cursor (InvalidCursorError)"
  - "src/middleware/error-handler.ts — what a thrown ZodError, a pg error or any other uncaught error becomes on the wire (classify)"
  - "src/shared/error-mapping.ts — the message text of the SYSTEM_SERVICE_UNAVAILABLE and SYSTEM_INTERNAL_ERROR envelopes"
  - "src/modules/chat/service/types.ts — the DoneStopReason union and the error-event synthetic_stop_reason the route resolves"
  - "src/modules/chat/service/tool-catalog.ts — the CHAT_TOOL_NAMES and CHAT_INGEST_TOOL_NAMES lists index.ts re-exports and the route probes"
  - "src/app.ts — the prefix the chat routes are mounted under (/api/v1 then /conversations)"
---

## Facts

### Conversation surface (all operations)
- The conversation operations are `POST /api/v1/conversations`, `GET /api/v1/conversations`, `GET /api/v1/conversations/:id`, `PATCH /api/v1/conversations/:id`, `DELETE /api/v1/conversations/:id`, `POST /api/v1/conversations/:id/messages`, `GET /api/v1/conversations/:id/messages`, `GET /api/v1/conversations/:id/usage`, `GET /api/v1/conversations/:id/graph`, `PUT /api/v1/conversations/:id/graph` and `POST /api/v1/conversations/:id/cancel`. `src/modules/chat/routes/conversations.routes.ts` (`registerChatRoutes`).
- Every success answers the envelope `{ ok: true, result }`, except delete, which answers 204 with no body. `src/modules/chat/routes/conversations.routes.ts` (`reply.code(...).send({ ok: true, result: ... })`).
- Every operation checks the chat kill switch (`CHAT_ENABLED === false`). Every operation except sendMessage checks it first, before it parses the path, query or body. `src/modules/chat/routes/conversations.routes.ts` (`killSwitchTripped`, `sendKillSwitch`).
- The `:id` path parameter of every conversation-scoped operation must be a UUID. `src/modules/chat/routes/chat.schemas.ts` (`ConversationIdParam` — `z.string().uuid()`).
- A conversation as answered carries `id`, `title`, `summary_rolling`, `archived_at`, `created_at`, `updated_at`. The raw row is returned as is, so the rolling summary is exposed to the caller. `src/modules/chat/repository/chat.repository.ts` (`ConversationRow`, `CONVERSATION_COLS`).
- A conversation is archived when `archived_at` is not null. `src/modules/chat/routes/conversations.routes.ts` (`conversation.archived_at !== null`).

### Create a conversation (createConversation)
- The body is optional. A missing body is treated as `{}`, which creates a conversation whose `title` is null. `src/modules/chat/routes/conversations.routes.ts` (`CreateConversationRequest.parse(request.body ?? {})`, `title: body.title ?? null`).
- `title` is optional and, when present, a string of 1 to 200 characters. A null `title` is refused. `src/modules/chat/routes/chat.schemas.ts` (`CreateConversationRequest` — `z.string().min(1).max(200).optional()`).
- Unknown body keys are dropped without a refusal. `src/modules/chat/routes/chat.schemas.ts` (`z.object` default strip).
- The id, `created_at` and `updated_at` are assigned by the store. Only `title` is inserted. `src/modules/chat/repository/chat.repository.ts` (`insertConversation` — `INSERT INTO chat_conversation (title)`).
- On success it answers 201 with `result` = the created conversation. `src/modules/chat/routes/conversations.routes.ts` (`reply.code(201)`).
- Check order: kill switch, then body validation. `src/modules/chat/routes/conversations.routes.ts` (`scoped.post("/")`).

### List conversations (listConversations)
- Query `limit` is coerced to an integer between 1 and 100 and defaults to 20. `src/modules/chat/routes/chat.schemas.ts` (`ListConversationsQuery.limit`).
- Query `cursor` is an optional opaque string. `src/modules/chat/routes/chat.schemas.ts` (`ListConversationsQuery.cursor`).
- Query `include_archived` accepts a boolean or the strings `"true"` / `"false"` and defaults to false. `src/modules/chat/routes/chat.schemas.ts` (`ListConversationsQuery.include_archived`).
- Archived conversations are left out unless `include_archived` is true. `src/modules/chat/repository/chat.repository.ts` (`listConversations` — `archived_at IS NULL`).
- Conversations are ordered by `created_at` descending, with ties broken by `id` descending. `src/modules/chat/repository/chat.repository.ts` (`listConversations` — `ORDER BY created_at DESC, id DESC`).
- The cursor continues strictly after the `(created_at, id)` pair of the previous page's last row. `src/modules/chat/repository/chat.repository.ts` (`listConversations` — `(created_at, id) < ($n::timestamptz, $m::uuid)`).
- On success it answers 200 with `result: { items, next_cursor }`. `next_cursor` is built from the last item's `created_at` and `id` when more rows exist, and is `null` otherwise. `src/modules/chat/routes/conversations.routes.ts` (`encodeCursor(last.created_at, last.id)`).
- Check order: kill switch, then query validation, then cursor decoding. `src/modules/chat/routes/conversations.routes.ts` (`scoped.get("/")`).

### Read a conversation (getConversation)
- On success it answers 200 with `result` = the conversation, archived or not. `src/modules/chat/routes/conversations.routes.ts` (`scoped.get("/:id")`).

### Update a conversation (updateConversation)
- `title` may be a string of 1 to 200 characters, or null to clear it. `src/modules/chat/routes/chat.schemas.ts` (`UpdateConversationRequest.title`).
- `archived_at` may be a datetime string, which archives the conversation with that caller-supplied instant, or null, which un-archives it. `src/modules/chat/routes/chat.schemas.ts` (`UpdateConversationRequest.archived_at` — `z.string().datetime()` or `z.null()`).
- A field absent from the body is left unchanged. A field present as null is set to null. `src/modules/chat/repository/chat.repository.ts` (`updateConversation` — `hasOwnProperty` per field).
- At least one of `title` or `archived_at` must be present. `src/modules/chat/routes/chat.schemas.ts` (`UpdateConversationRequest.refine`).
- An archived conversation can be updated. No archived check is made. `src/modules/chat/routes/conversations.routes.ts` (`scoped.patch("/:id")`).
- On success it answers 200 with `result` = the updated conversation. `src/modules/chat/routes/conversations.routes.ts` (`scoped.patch("/:id")`).
- Check order: kill switch, then `:id` format, then empty body, then body validation, then conversation existence. `src/modules/chat/routes/conversations.routes.ts` (`scoped.patch("/:id")`).

### Delete a conversation (deleteConversation)
- Deleting removes the conversation row in one statement and answers 204. The area deletes no messages, tool calls or graph view itself. `src/modules/chat/repository/chat.repository.ts` (`deleteConversation`); `src/modules/chat/routes/conversations.routes.ts` (`reply.code(204).send()`).
- An archived conversation can be deleted. No archived check is made. `src/modules/chat/routes/conversations.routes.ts` (`scoped.delete("/:id")`).
- Check order: kill switch, then `:id` format, then the row count (0 means not found). `src/modules/chat/routes/conversations.routes.ts` (`rowCount === 0`).

### List messages (listMessages)
- Query `limit` is coerced to an integer between 1 and 200 and defaults to 50. `src/modules/chat/routes/chat.schemas.ts` (`ListMessagesQuery.limit`).
- Query `before` is an optional datetime string. When given, only messages with `created_at` strictly earlier than it are returned. `src/modules/chat/routes/chat.schemas.ts` (`ListMessagesQuery.before`); `src/modules/chat/repository/chat.repository.ts` (`listMessagesPaginated` — `created_at < $n::timestamptz`).
- Only display messages are listed: real user turns (`role = 'user'` with a non-null `idempotency_key`) and terminal assistant answers (`role = 'assistant'` with a non-null `stop_reason`). Intermediate tool rows are hidden. `src/modules/chat/repository/chat.repository.ts` (`listMessagesPaginated` — `displayFilter`).
- Messages are ordered by `created_at` ascending, with ties broken by `id` ascending. `src/modules/chat/repository/chat.repository.ts` (`listMessagesPaginated` — `ORDER BY created_at ASC, id ASC`).
- A listed message carries `id`, `conversation_id`, `role`, `content` (an array of content blocks), `stop_reason`, `idempotency_key`, `model`, `tokens_in`, `tokens_out`, `latency_ms`, `created_at`. `src/modules/chat/repository/chat.repository.ts` (`MessageRow`, `MESSAGE_COLS`).
- On success it answers 200 with `result: { items, next_before }`. `next_before` is the `created_at` of the first (oldest) item on the page when more rows exist, and `null` otherwise. `src/modules/chat/routes/conversations.routes.ts` (`nextBefore`).
- Check order: kill switch, then `:id` format, then query validation, then conversation existence. `src/modules/chat/routes/conversations.routes.ts` (`scoped.get("/:id/messages")`).

### Conversation usage (getConversationUsage)
- On success it answers 200 with `result: { messages, tokens_in, tokens_out, tool_calls }`. `src/modules/chat/repository/chat.repository.ts` (`ConversationUsage`); `src/modules/chat/routes/conversations.routes.ts` (`scoped.get("/:id/usage")`).
- `messages` counts every message row of the conversation, including intermediate assistant tool rows and synthetic user tool-result rows. `src/modules/chat/repository/chat.repository.ts` (`getConversationUsage` — `count(*) FROM chat_message WHERE conversation_id = $1`).
- `tokens_in` and `tokens_out` sum the assistant messages only, and are 0 when there are none. `src/modules/chat/repository/chat.repository.ts` (`getConversationUsage` — `COALESCE(sum(...), 0)` with `role = 'assistant'`).
- `tool_calls` counts the conversation's tool-call rows. `src/modules/chat/repository/chat.repository.ts` (`getConversationUsage` — `count(*) FROM chat_tool_call`).
- An existing conversation with no messages answers 200 with zero counts. An absent conversation answers 404. `src/modules/chat/routes/conversations.routes.ts` (`scoped.get("/:id/usage")`).

### Graph view (getConversationGraph / saveConversationGraph)
- Reading answers 200 with `result` = the stored snapshot, or `null` when none was ever saved. `src/modules/chat/routes/conversations.routes.ts` (`scoped.get("/:id/graph")` — `graphView?.snapshot ?? null`).
- A conversation holds at most one graph view. Saving overwrites the previous snapshot and sets `updated_at` to the current time. `src/modules/chat/repository/chat.repository.ts` (`upsertConversationGraphView` — `ON CONFLICT (conversation_id) DO UPDATE ... updated_at = now()`).
- The saved snapshot is chosen by `version`, which is `1` or `2`. `src/modules/chat/routes/chat.schemas.ts` (`SaveGraphViewRequest` — `z.discriminatedUnion("version", ...)`).
- Both versions require `nodes`, `links`, `positions` and `user_pinned`. `src/modules/chat/routes/chat.schemas.ts` (`GraphViewSnapshotBaseFields`).
  - `nodes` and `links` are arrays of at most 2000 objects, each with a string `id`. Other fields on an entry are kept. `src/modules/chat/routes/chat.schemas.ts` (`GraphSnapshotNode`, `GraphSnapshotLink` — `.passthrough()`, `.max(2000)`).
  - `positions` is a record from string to `{ x: number, y: number }`. `src/modules/chat/routes/chat.schemas.ts` (`NodePosition`).
  - `user_pinned` is an array of strings. `src/modules/chat/routes/chat.schemas.ts` (`GraphViewSnapshotBaseFields.user_pinned`).
- A version 2 snapshot also requires `layout_algorithm`. A version 1 snapshot is stored without one. `src/modules/chat/routes/chat.schemas.ts` (`GraphViewSnapshotV2.layout_algorithm`, `GraphViewSnapshotV1`).
- What is stored is the validated snapshot. Unknown top-level keys are dropped. `src/modules/chat/routes/conversations.routes.ts` (`snapshot = bodyParsed.data`).
- On success, saving answers 200 with `result: { updated_at }`. `src/modules/chat/routes/conversations.routes.ts` (`scoped.put("/:id/graph")`).
- A graph view can be saved for an archived conversation. No archived check is made. `src/modules/chat/routes/conversations.routes.ts` (`scoped.put("/:id/graph")`).
- Save check order: kill switch, then `:id` format, then snapshot validation, then conversation existence. An invalid snapshot for an unknown conversation answers 422, not 404. `src/modules/chat/routes/conversations.routes.ts` (`scoped.put("/:id/graph")`).

### Cancel a turn (cancelTurn)
- Cancelling aborts the conversation's in-flight turn with the reason `"cancelled"` and answers 202 with `result: { cancelled: true }`. `src/modules/chat/routes/conversations.routes.ts` (`controller.abort("cancelled")`).
- Check order: kill switch, then `:id` format, then conversation existence, then archived, then an in-flight turn. `src/modules/chat/routes/conversations.routes.ts` (`scoped.post("/:id/cancel")`).

### Send a message (sendMessage)
- The body is `{ content, model? }`. `content` is a string of at least 1 character and at most `MAX_CONTENT_LENGTH` characters (from configuration). `model`, when present, is a string of at least 1 character. `src/modules/chat/routes/chat.schemas.ts` (`buildSendMessageRequestSchema`); `src/modules/chat/routes/conversations.routes.ts` (`maxContentLength: deps.env.MAX_CONTENT_LENGTH`).
- The model used is the body's `model` when given, and the configured `CHAT_MODEL` otherwise. `src/modules/chat/routes/conversations.routes.ts` (`resolvedModel`).
- An `Idempotency-Key` request header is required and must be a UUID. `src/modules/chat/routes/conversations.routes.ts` (`headerValue`); `src/modules/chat/routes/chat.schemas.ts` (`IdempotencyKeyHeader` — `z.string().uuid()`).
- Check order, first to last: header missing or empty, header not a UUID, `:id` format, body validation, kill switch, conversation existence, archived, turn already in flight, idempotency lookup (mismatch or replay), tool catalog unavailable, user-message insert, provider unavailable when the turn starts. `src/modules/chat/routes/conversations.routes.ts` (`scoped.post("/:id/messages")` steps (1)–(12)).
- A conversation has at most one turn in flight. `src/modules/chat/routes/conversations.routes.ts` (`turnRegistry.get(id) !== undefined`, `turnRegistry.register`).
- The user's message is stored as a real user turn before streaming starts: role `user`, `content` = `[{ type: "text", text: <content> }]` (the content verbatim, untrimmed), the `Idempotency-Key` value, and the resolved model. `src/modules/chat/routes/conversations.routes.ts` (`persistedContentBlock`); `src/modules/chat/repository/chat.repository.ts` (`insertUserMessage`).
- An existing user message with the same `Idempotency-Key` in the same conversation matches only when its concatenated text equals `content` and its stored model equals the resolved model. `src/modules/chat/routes/conversations.routes.ts` (`userRowMatches`); `src/modules/chat/repository/chat.repository.ts` (`findUserByIdempotencyKey`).
- A matching key whose turn has a terminal assistant answer is replayed. No new message is recorded and no model is called. `src/modules/chat/routes/conversations.routes.ts` (`handleIdempotentReplay`).
  - The answer found is the earliest assistant message with a non-null `stop_reason` created after that user message, ordered by `created_at` ascending, then `id` ascending. `src/modules/chat/repository/chat.repository.ts` (`findAssistantSuccessor`).
  - The replay streams `llm_start { iteration: 1 }`, then `text_delta { delta: <the stored text> }` (only when that text is non-empty), then `done { stop_reason, model, tokens_in, tokens_out }`. A null model is sent as `""` and null token counts as `0`. `src/modules/chat/routes/conversations.routes.ts` (`handleIdempotentReplay`).
  - On replay, a stored `stop_reason` of `provider_error` or `internal_error` (or any value outside the six done reasons) is sent as `end_turn`. `src/modules/chat/routes/conversations.routes.ts` (`mapStoredStopReason`).
- A matching key with no terminal answer and no turn in flight re-runs the turn with the existing user message. No second user message is inserted. `src/modules/chat/routes/conversations.routes.ts` (recovery path — `userMessageId = existingUserRow?.id`).
- When a concurrent insert with the same key wins (pg `23505`), the stored message is re-read. The request then answers a mismatch, a replay, or turn-in-progress. `src/modules/chat/routes/conversations.routes.ts` (`isUniqueViolation`, concurrent branch).
- If the provider refuses when the turn starts, the user message has already been recorded. `src/modules/chat/routes/conversations.routes.ts` (steps (9) then (12)).
- A started turn answers HTTP 200 as a server-sent event stream (`Content-Type: text/event-stream; charset=utf-8`). Each frame is `event: <name>` followed by `data: <json>`. `src/modules/chat/routes/conversations.routes.ts` (`writeSseHeaders`, `frameJson`).
- The stream frames and their payloads are `llm_start { iteration }`, `text_delta { delta }`, `tool_start { tool, args_summary }`, `tool_result { tool, ok }`, `graph_delta { source_tool, nodes, links }`, `done { stop_reason, model, tokens_in, tokens_out }` and `error { code, message }`. Tool arguments, tool results and assistant content blocks are never sent on the wire. `src/modules/chat/routes/conversations.routes.ts` (`projectSseFrame`).
- A `graph_delta` frame follows a `tool_result` frame only when the tool succeeded (`ok`), the catalog snapshot is present, and the tool produces graph data. `src/modules/chat/routes/conversations.routes.ts` (`projectGraphDelta`, `evt.type === "tool_result" && evt.ok && deps.catalog !== undefined`).
- An uncaught failure during the stream emits an `error` frame `{ code: "SYSTEM_INTERNAL_ERROR", message: "chat encountered an internal error" }` and records the turn as `internal_error`. `src/modules/chat/routes/conversations.routes.ts` (`synthetic` in the drain `catch`).
- Each tool result is recorded as a tool call (`tool_name`, `arguments`, `result`, `is_error`, `error_message`, `duration_ms`), first with no message. It is attached to that iteration's assistant message when the iteration ends. `src/modules/chat/routes/conversations.routes.ts` (`insertToolCall` with `message_id: null`, `attachToolCallsToMessage`).
- Each tool-bearing iteration is recorded as a pair. `src/modules/chat/repository/chat.repository.ts` (`insertIterationPair`).
  - First an intermediate assistant message (tool-use content, null `stop_reason`, the model), then a synthetic user message (tool-result content, null `idempotency_key`). `src/modules/chat/repository/chat.repository.ts` (`insertIterationPair`).
  - Both are stamped `clock_timestamp()`, so the assistant message sorts strictly before its tool result. `src/modules/chat/repository/chat.repository.ts` (`insertIterationPair`).
- After the stream closes, the terminal assistant message is recorded with content, `stop_reason`, model, `tokens_in`, `tokens_out` (0 when unknown) and `latency_ms` (from stream start to close). Tool calls still pending are attached to it. `src/modules/chat/routes/conversations.routes.ts` (step (16)); `src/modules/chat/repository/chat.repository.ts` (`insertAssistantMessage`).
- The terminal `stop_reason` is set as follows. `src/modules/chat/routes/conversations.routes.ts` (`resolveAssistantStopReason`).
  - A `done` frame gives its own `stop_reason` (default `end_turn`). `src/modules/chat/routes/conversations.routes.ts` (`resolveAssistantStopReason`).
  - An `error` frame gives its synthetic reason, `provider_error` or `internal_error` (default `internal_error`). `src/modules/chat/routes/conversations.routes.ts` (`resolveAssistantStopReason`).
  - A stream that ends with neither gives `internal_error`. `src/modules/chat/routes/conversations.routes.ts` (`resolveAssistantStopReason`).
- A failure to record a tool call, an iteration pair or the terminal assistant message does not interrupt or change the stream. The failure is only logged. `src/modules/chat/routes/conversations.routes.ts` (the `catch` blocks around `insertToolCall`, `insertIterationPair`, `insertAssistantMessage`).
- The caller closing the connection aborts the in-flight turn. `src/modules/chat/routes/conversations.routes.ts` (`onSocketClose`).
- After a live turn, title distillation and rolling-summary refresh are scheduled in the background. A replay schedules neither. `src/modules/chat/routes/conversations.routes.ts` (`scheduleDistillation`).
- The model context passed to the turn is built from the stored conversation with a recent window of `CHAT_RECENT_WINDOW` turns and the owner's time zone `OWNER_TZ`. `src/modules/chat/routes/conversations.routes.ts` (`buildModelContext` call).

### Messages and turns (stored)
- A real user turn is a message with role `user` and a non-null `idempotency_key`. A user message with a null `idempotency_key` is a synthetic tool-result message. `src/modules/chat/repository/chat.repository.ts` (`countUserTurns`, `listRecentRealTurns` — `role = 'user' AND idempotency_key IS NOT NULL`).
- A terminal assistant message has a non-null `stop_reason`. An intermediate assistant tool-use message has a null one. `src/modules/chat/repository/chat.repository.ts` (`findAssistantSuccessor`, `getFirstUserAndAssistant` — `stop_reason IS NOT NULL`).
- The recent window for the model context holds every message, scaffolding included, from the K-th most recent real user turn onward, ascending. With fewer than K real turns it holds the whole conversation. With K ≤ 0 it is empty. `src/modules/chat/repository/chat.repository.ts` (`listRecentRealTurns`).
- The number of real turns older than the recent window is counted against the same K-th-from-last boundary. It is 0 when there are K or fewer real turns. `src/modules/chat/repository/chat.repository.ts` (`countRealTurnsOlderThanRecentWindow`).
- The summary overlap slice is built as follows. `src/modules/chat/repository/chat.repository.ts` (`listOlderMessagesForSummaryBounded`).
  - It takes the at most `overlap_m` most recent messages older than the recent-window boundary. `src/modules/chat/repository/chat.repository.ts` (`listOlderMessagesForSummaryBounded`).
  - It then starts at the oldest real user turn among them, in ascending order. `src/modules/chat/repository/chat.repository.ts` (`listOlderMessagesForSummaryBounded`).
  - It is empty when K ≤ 0, when `overlap_m` ≤ 0, or when no real turn lies in that tail. `src/modules/chat/repository/chat.repository.ts` (`listOlderMessagesForSummaryBounded`).
- The rolling summary replaces `summary_rolling` on the conversation. `src/modules/chat/repository/chat.repository.ts` (`updateSummaryRolling`).
- A distilled title is written only while the conversation's `title` is null, and never overwrites one. `src/modules/chat/repository/chat.repository.ts` (`setTitleIfNull` — `AND title IS NULL`).
- The title inputs are the first real user turn and the first terminal assistant message, each by `created_at` ascending, then `id` ascending. `src/modules/chat/repository/chat.repository.ts` (`getFirstUserAndAssistant`).
- `countUserTurns` counts real user turns only. `src/modules/chat/repository/chat.repository.ts` (`countUserTurns`).
- A tool call's `message_id` may be null. It is set afterwards for a batch of tool calls in one update. `src/modules/chat/repository/chat.repository.ts` (`ToolCallRow.message_id`, `attachToolCallsToMessage`).
- A tool call records `tool_name`, `arguments`, `result` (nullable), `is_error`, `error_message` (nullable) and `duration_ms`. `src/modules/chat/repository/chat.repository.ts` (`ToolCallRow`, `insertToolCall`).

## Answers
- every operation except sendMessage — kill switch on (`CHAT_ENABLED === false`), checked first → 503 `BUSINESS_CHAT_DISABLED`. `src/modules/chat/routes/conversations.routes.ts` (`sendKillSwitch` → `mapChatError(new ChatDisabledError())`).
- sendMessage — kill switch on, checked after header, `:id` and body validation → 503 `BUSINESS_CHAT_DISABLED`. `src/modules/chat/routes/conversations.routes.ts` (step (3)).
- every conversation-scoped operation — `:id` not a UUID → 422 `VALIDATION_INVALID_FORMAT` (message "Request payload failed validation.", details `[{ path, message }]`). `src/modules/chat/routes/conversations.routes.ts` (`ConversationIdParam.parse`).
- getConversation, updateConversation, deleteConversation, listMessages, getConversationUsage, getConversationGraph, saveConversationGraph, cancelTurn, sendMessage — no conversation with that id → 404 `RESOURCE_NOT_FOUND` (message "conversation not found", details `{ id }`). `src/modules/chat/routes/conversations.routes.ts` (`sendNotFound`).
- createConversation — `title` empty, over 200 characters, null or not a string, or the body not an object → 422 `VALIDATION_INVALID_FORMAT` (details `[{ path, message }]`). `src/modules/chat/routes/conversations.routes.ts` (`CreateConversationRequest.parse`).
- listConversations — `limit` not an integer between 1 and 100, or `include_archived` other than a boolean or `"true"`/`"false"` → 422 `VALIDATION_INVALID_FORMAT` (details `[{ path, message }]`). `src/modules/chat/routes/conversations.routes.ts` (`ListConversationsQuery.parse`).
- listConversations — `cursor` does not decode to `{ created_at, id }` → 422 `VALIDATION_INVALID_FORMAT` (message = the cursor error's message, details `{ param: "cursor" }`). `src/modules/chat/routes/conversations.routes.ts` (`InvalidCursorError` branch).
- listConversations — `cursor` decodes but its `created_at` is not a timestamp or its `id` not a UUID → 500 `SYSTEM_INTERNAL_ERROR` ("Internal server error."). `src/modules/chat/repository/chat.repository.ts` (`$n::timestamptz, $m::uuid` casts); `src/modules/chat/routes/conversations.routes.ts` (no catch).
- updateConversation — body absent, null or `{}` → 422 `VALIDATION_REQUIRED_FIELD` (message "at least one of title or archived_at must be present", details `{ body: "PATCH /conversations/:id" }`). `src/modules/chat/routes/conversations.routes.ts` (BR-36 step 1 branch).
- updateConversation — non-empty body with neither `title` nor `archived_at` → 422 `VALIDATION_INVALID_FORMAT` (details carry the message "VALIDATION_REQUIRED_FIELD: at least one of title or archived_at must be present"). `src/modules/chat/routes/chat.schemas.ts` (`UpdateConversationRequest.refine`).
- updateConversation — `title` empty or over 200 characters, or `archived_at` not a datetime and not null → 422 `VALIDATION_INVALID_FORMAT` (details `[{ path, message }]`). `src/modules/chat/routes/conversations.routes.ts` (`UpdateConversationRequest.parse`).
- listMessages — `limit` not an integer between 1 and 200, or `before` not a datetime → 422 `VALIDATION_INVALID_FORMAT` (details `[{ path, message }]`). `src/modules/chat/routes/conversations.routes.ts` (`ListMessagesQuery.parse`).
- saveConversationGraph — snapshot fails validation (unknown `version`, `nodes`/`links` over 2000 entries or an entry without a string `id`, bad `positions`, bad `user_pinned`, v2 without a valid `layout_algorithm`) → 422 `VALIDATION_INVALID_FORMAT` (message "invalid graph view snapshot", details = Zod `flatten()`). `src/modules/chat/routes/conversations.routes.ts` (`SaveGraphViewRequest.safeParse`).
- cancelTurn — conversation archived → 409 `BUSINESS_CONVERSATION_ARCHIVED`. `src/modules/chat/routes/conversations.routes.ts` (`mapChatError(new ConversationArchivedError())`).
- cancelTurn — no turn in flight for the conversation → 404 `RESOURCE_NOT_FOUND` (message "no in-flight turn for this conversation", details `{ id }`). `src/modules/chat/routes/conversations.routes.ts` (`controller === undefined`).
- sendMessage — `Idempotency-Key` header missing or empty → 422 `VALIDATION_REQUIRED_FIELD` (message "Idempotency-Key header is required", details `{ header: "Idempotency-Key" }`). `src/modules/chat/routes/conversations.routes.ts` (step (1)).
- sendMessage — `Idempotency-Key` not a UUID → 422 `VALIDATION_INVALID_FORMAT` (message "Idempotency-Key must be a valid UUID", details `{ header: "Idempotency-Key", received }`). `src/modules/chat/routes/conversations.routes.ts` (step (1)).
- sendMessage — `content` empty ("content must be a non-empty string"), longer than `MAX_CONTENT_LENGTH` ("content must be at most N characters"), or `model` empty → 422 `VALIDATION_INVALID_FORMAT` (details `[{ path, message }]`). `src/modules/chat/routes/conversations.routes.ts` (`sendMessageSchema.parse`).
- sendMessage — conversation archived → 409 `BUSINESS_CONVERSATION_ARCHIVED`. `src/modules/chat/routes/conversations.routes.ts` (step (5)).
- sendMessage — a turn is already in flight on the conversation → 409 `BUSINESS_TURN_IN_PROGRESS`. `src/modules/chat/routes/conversations.routes.ts` (step (6)).
- sendMessage — `Idempotency-Key` already used in the conversation with different content or model → 409 `BUSINESS_IDEMPOTENCY_MISMATCH`. `src/modules/chat/routes/conversations.routes.ts` (step (7), concurrent branch).
- sendMessage — a concurrent request with the same key won the insert and its turn has no answer yet → 409 `BUSINESS_TURN_IN_PROGRESS`. `src/modules/chat/routes/conversations.routes.ts` (concurrent branch).
- sendMessage — chat tool catalog not fully resolved → 404 `RESOURCE_NOT_FOUND` (message "chat surface is not available on this deployment", no details). `src/modules/chat/routes/conversations.routes.ts` (step (8)).
- sendMessage — catalog resolved but the chat service reports disabled → 503 `BUSINESS_CHAT_DISABLED`. `src/modules/chat/routes/conversations.routes.ts` (step (8) `chatService === undefined`).
- sendMessage — provider unavailable when the turn starts → 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. `src/modules/chat/routes/conversations.routes.ts` (step (12) `ChatProviderUnavailableError`).
- sendMessage — uncaught failure after streaming started → in-stream `error` frame `SYSTEM_INTERNAL_ERROR` ("chat encountered an internal error"), with the HTTP status already 200. `src/modules/chat/routes/conversations.routes.ts` (drain `catch`).
- every operation — database unreachable or statement timed out (not caught by the route) → 503 `SYSTEM_SERVICE_UNAVAILABLE` ("A backing service is temporarily unavailable."). `src/modules/chat/routes/conversations.routes.ts` (no catch around `withReadOnly`/`withTransaction`).
- every operation — any other uncaught failure → 500 `SYSTEM_INTERNAL_ERROR` ("Internal server error."). `src/modules/chat/routes/conversations.routes.ts` (rethrow paths, `throw err`).

## Vocabularies
- Message role: `user`, `assistant`. `src/modules/chat/routes/chat.schemas.ts` (`ChatRoleSchema`); `src/modules/chat/repository/chat.repository.ts` (`ChatMessageRole`).
- Stored assistant stop reason: `end_turn`, `max_tokens`, `stop_sequence`, `max_iterations`, `turn_timeout`, `cancelled`, `provider_error`, `internal_error`. `src/modules/chat/repository/chat.repository.ts` (`AssistantStopReason`).
- Stop reason on a `done` frame: `end_turn`, `max_tokens`, `stop_sequence`, `max_iterations`, `turn_timeout`, `cancelled`. `src/modules/chat/routes/conversations.routes.ts` (`mapStoredStopReason`).
- Synthetic stop reason of a turn that ended in an `error` frame: `provider_error`, `internal_error`. `src/modules/chat/routes/conversations.routes.ts` (`errorSyntheticStop`, `resolveAssistantStopReason`).
- Stream event name: `llm_start`, `text_delta`, `tool_start`, `tool_result`, `graph_delta`, `done`, `error`. `src/modules/chat/routes/conversations.routes.ts` (`projectSseFrame`).
- Graph view snapshot version: `1`, `2`. `src/modules/chat/routes/chat.schemas.ts` (`GraphViewSnapshotV1`, `GraphViewSnapshotV2`).
- Graph layout algorithm: `force`, `tree`, `radial`. `src/modules/chat/routes/chat.schemas.ts` (`GraphViewSnapshotV2.layout_algorithm`).
- `include_archived` string form: `"true"`, `"false"`. `src/modules/chat/routes/chat.schemas.ts` (`ListConversationsQuery.include_archived`).
- Error codes answered by this surface: `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, `BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`, `BUSINESS_IDEMPOTENCY_MISMATCH`, `RESOURCE_NOT_FOUND`, `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `SYSTEM_INTERNAL_ERROR`. `src/modules/chat/routes/conversations.routes.ts` (`registerChatRoutes`).

## Upstream artifacts
- The `chat_conversation` table, columns `id, title, summary_rolling, archived_at, created_at, updated_at`, whose DDL lives outside the area. `src/modules/chat/repository/chat.repository.ts` (`CONVERSATION_COLS`).
- The `chat_message` table, columns `id, conversation_id, role, content (jsonb), stop_reason, idempotency_key, model, tokens_in, tokens_out, latency_ms, created_at`. `src/modules/chat/repository/chat.repository.ts` (`MESSAGE_COLS`).
- The `chat_tool_call` table, columns `id, conversation_id, message_id, tool_name, arguments (jsonb), result (jsonb), is_error, error_message, duration_ms, created_at`. `src/modules/chat/repository/chat.repository.ts` (`TOOL_CALL_COLS`).
- The `chat_graph_view` table, columns `conversation_id, snapshot (jsonb), updated_at`, unique on `conversation_id`. `src/modules/chat/repository/chat.repository.ts` (`GRAPH_VIEW_COLS`, `ON CONFLICT (conversation_id)`).
- PostgreSQL's unique-violation code `23505` signals a reused `Idempotency-Key` on insert. `src/modules/chat/routes/conversations.routes.ts` (`isUniqueViolation`); `src/modules/chat/repository/chat.repository.ts` (`insertUserMessage`).
- Message `content` holds provider-shaped content blocks. Text blocks are `{ type: "text", text }`, and tool-use and tool-result blocks come from the model provider. `src/modules/chat/routes/conversations.routes.ts` (`extractTextFromContent`, `persistedContentBlock`); `src/modules/chat/repository/chat.repository.ts` (`MessageRow.content`).
- The chat turn needs the `query` toolset tools named in `CHAT_TOOL_NAMES`, plus `ingest` toolset `CHAT_INGEST_TOOL_NAMES` when `CHAT_INGEST_ENABLED` is true, all registered by other modules. `src/modules/chat/routes/conversations.routes.ts` (`computeMissingToolNames`, `emitChatBootLog`, `buildChatToolCatalog`).
- The configuration values `CHAT_ENABLED`, `MAX_CONTENT_LENGTH`, `CHAT_MODEL`, `CHAT_RECENT_WINDOW`, `OWNER_TZ`, `CHAT_PROMPT_VERSION`, `CHAT_INGEST_ENABLED`, `CHAT_UTILITY_MODEL`, `CHAT_SUMMARY_ENABLED`, `CHAT_TITLE_ENABLED`, `CHAT_SUMMARY_OVERLAP_M` and `CHAT_SUMMARY_PROMPT_VERSION` come from the env loader. `src/modules/chat/routes/conversations.routes.ts` (`deps.env.*`).
- The knowledge-graph catalog snapshot supplies each graph link's `is_temporal` for `graph_delta`. Without it, no `graph_delta` frame is sent. `src/modules/chat/routes/conversations.routes.ts` (`deps.catalog`, `projectGraphDelta`).

## Outside the domain
- The module's public re-export surface (routes registrar, schemas, types, `CHAT_TOOL_NAMES`): wiring. `src/modules/chat/index.ts`.
- The v1 carry-over `ChatMessageSchema` and `buildChatTurnRequestSchema` (messages 1..N, first role `user`) are unused by any route: dead surface. `src/modules/chat/routes/chat.schemas.ts`.
- The mount prefix, Fastify scope registration, lazy caching of the chat service, prompt module and utility client, and `EMPTY_KG_CATALOG_SNAPSHOT`: wiring. `src/modules/chat/routes/conversations.routes.ts`.
- The log events `chat.boot`, `chat.turn`, `chat.recent_window_resolved`, `chat.deprecated_env`, `chat.owner_tz_resolved`, `chat.catalog_unresolved` and the `*_persist_failure` / `*_unhandled` / `sse_write_failed` / `raw_end_failed` events, plus the `chat_turn_total` counter: logging. `src/modules/chat/routes/conversations.routes.ts`.
- The SSE transport headers `Cache-Control`, `Connection`, `X-Accel-Buffering` and the copied CORS headers: transport. `src/modules/chat/routes/conversations.routes.ts`.
- Fetching `limit + 1` rows to detect a further page, index-walk shapes, the column-projection constants and the `withTransaction`/`withReadOnly` boundaries: implementation. `src/modules/chat/repository/chat.repository.ts`.
- `listRecentMessages` and `listOlderMessagesForSummary` are row-count windows kept alongside the turn-based ones and not called from this area: implementation. `src/modules/chat/repository/chat.repository.ts`.
- The `chatRepository` object and the `ChatRepository` interface: dependency-injection shape. `src/modules/chat/repository/chat.repository.ts`.

## Observed and not decided here
- A PATCH with neither `title` nor `archived_at` gets two different answers. An empty body answers 422 `VALIDATION_REQUIRED_FIELD` (`src/modules/chat/routes/conversations.routes.ts`, BR-36 step 1 branch). A non-empty body lacking both, such as one with only unknown keys, answers 422 `VALIDATION_INVALID_FORMAT` through the schema refine (`src/modules/chat/routes/chat.schemas.ts`, `UpdateConversationRequest.refine`).
- Message pagination points two ways. The page is the oldest `limit` display messages, ascending (`src/modules/chat/repository/chat.repository.ts`, `listMessagesPaginated` — `ORDER BY created_at ASC ... LIMIT`), so `hasMore` means newer messages exist. But `next_before` is the page's oldest `created_at` and `before` selects strictly older messages (`src/modules/chat/routes/conversations.routes.ts`, `nextBefore`), so following it from the first page returns nothing.
- Archived conversations are treated differently across operations. sendMessage and cancelTurn refuse with 409 `BUSINESS_CONVERSATION_ARCHIVED` (`src/modules/chat/routes/conversations.routes.ts`, steps (5) and cancel). saveConversationGraph, a write, accepts an archived conversation (`src/modules/chat/routes/conversations.routes.ts`, `scoped.put("/:id/graph")`).
- The kill switch has different precedence. On every other operation it comes before any validation (`src/modules/chat/routes/conversations.routes.ts`, `killSwitchTripped` first). On sendMessage a bad `Idempotency-Key`, `:id` or body answers 422 even while chat is disabled (`src/modules/chat/routes/conversations.routes.ts`, steps (1)–(3)).
- "Messages" counts different things. Usage `messages` counts every row, including intermediate tool-use and synthetic tool-result messages (`src/modules/chat/repository/chat.repository.ts`, `getConversationUsage`). The message listing shows only real user turns and terminal answers (`src/modules/chat/repository/chat.repository.ts`, `listMessagesPaginated` — `displayFilter`).
- A failed turn looks different on replay. Live, it ends with an `error` frame (`src/modules/chat/routes/conversations.routes.ts`, `projectSseFrame` `error`) and is stored as `provider_error`/`internal_error`. Replayed under the same key, it streams `done` with `stop_reason: "end_turn"` (`src/modules/chat/routes/conversations.routes.ts`, `mapStoredStopReason`).
- Two cursor faults get different answers. A cursor that is not `{ created_at, id }` answers 422 `VALIDATION_INVALID_FORMAT` with `details.param = "cursor"` (`src/modules/chat/routes/conversations.routes.ts`, `InvalidCursorError` branch). A cursor with that shape but a non-timestamp `created_at` or non-UUID `id` reaches the database cast and answers 500 `SYSTEM_INTERNAL_ERROR` (`src/modules/chat/repository/chat.repository.ts`, `listConversations`).
