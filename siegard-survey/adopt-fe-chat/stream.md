---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/chat/api/useSendMessage.ts
  - src/features/chat/api/chat-stream.ts
  - src/features/chat/api/use-cancel-turn.ts
  - src/features/chat/api/_request.ts
  - src/features/chat/api/_transforms.ts
  - src/features/chat/api/keys.ts
  - src/features/chat/api/index.ts
read_outside_area:
  - "src/lib/http.ts — opened to see which transport the cancel request goes through (the BFF request helper) and to confirm the send stream does not go through it"
  - "src/features/chat/state/chat-turn.ts — opened to read the chat status values and the turn-state actions the send calls; no fact attributed to it"
---

## Facts

### Sending a message (send-message)
- The screen sends a message as `POST {VITE_BFF_URL}/api/v1/conversations/{conversationId}/messages`. The conversation identifier is URL-encoded. `src/features/chat/api/useSendMessage.ts` (`mutationFn`, `joinUrl`, `encodeURIComponent`).
- The request body is JSON `{ content }`. `model` is added only when the caller names a model, and is omitted otherwise. `src/features/chat/api/useSendMessage.ts` (`body`).
- The content is sent exactly as the caller gives it. This area does not trim it, check its length or reject an empty one. `src/features/chat/api/useSendMessage.ts` (`body.content = vars.content`).
- The request carries `Content-Type: application/json` and `Accept: text/event-stream`. `src/features/chat/api/chat-stream.ts` (`streamChat`, `headers`).
- The request carries an `Idempotency-Key` header. `src/features/chat/api/useSendMessage.ts` (`headers["Idempotency-Key"]`).
- The request carries `Authorization: Bearer <token>` only when the owner's access token is held. With no token held, the header is left out and the request is still sent. `src/features/chat/api/useSendMessage.ts` (`if (token !== null)`).
- The access token is read once, when the send starts, from the owner's held session state. `src/features/chat/api/useSendMessage.ts` (`useAuthStore.getState().accessToken`).
- Every send generates a new random UUID as its idempotency key. Two sends of the same text always carry different keys, so this area never resends a turn under an earlier key. `src/features/chat/api/useSendMessage.ts` (`newIdempotencyKey`, `crypto.randomUUID()`).
- This area never resends a turn by itself. Each stream is opened once, and nothing loops back to a new request when it fails. `src/features/chat/api/useSendMessage.ts` (`mutationFn`), `src/features/chat/api/chat-stream.ts` (`streamChat`).
- The send stream calls `fetch` directly, not the BFF request helper. It has no client cutoff of its own: it ends only when the server closes it, it fails, or the owner aborts it. `src/features/chat/api/chat-stream.ts` (`streamChat`, `fetch(url, init)` with only the caller's signal).
- The send stream has no refresh on a 401 and no redirect to `/sign-in?reason=session_expired`. A 401 before the stream opens is handled like any other refusal: one error frame (see Answers). `src/features/chat/api/chat-stream.ts` (`extractPreStreamError`).
- Before the request goes out, the turn state is cleared. This removes the earlier turn's streamed text, its tool chips and an `error` chat status, which returns to `idle`. The new idempotency key and abort handle are stored and the streaming flag is set. `src/features/chat/api/useSendMessage.ts` (`resetTurn`, `setIdempotencyKey`, `setAbortController`, `setStreaming(true)`).
- Before the request goes out, the owner's message is appended at the end of the conversation's message cache. It has role `user`, one text block holding the content, identifier `optimistic-<idempotency key>`, the idempotency key, a null stop reason, a null model, null token counts, a null latency, and the browser's current time as its creation time. `src/features/chat/api/useSendMessage.ts` (`buildOptimisticUserMessage`, `setQueryData`).
- When no message cache exists yet for the conversation, the owner's message becomes a one-item list with no next cursor. `src/features/chat/api/useSendMessage.ts` (`prev === undefined`).
- When the turn ends in a refusal, the owner's message is not removed explicitly. It stays until the message re-read after the stream replaces the cache. `src/features/chat/api/useSendMessage.ts` (no rollback; `invalidateQueries` after the loop).
- When the stream ends for any reason (a done frame, an error frame, an abort, or the server closing it without a final frame), the streaming flag is cleared and the abort handle is released. `src/features/chat/api/useSendMessage.ts` (`finally`).
- After the stream ends, the conversation's messages and its usage are both read again. `src/features/chat/api/useSendMessage.ts` (`invalidateQueries` on `messages(id)` and `usage(id)`).
- The streamed text and the tool chips are not cleared when the turn ends. They stay until the next send clears them. `src/features/chat/api/useSendMessage.ts` (`finally` clears only the streaming flag and the abort handle).
- A send resolves, without failing, with four values: the stop reason from the done frame, the code and message from the error frame, and the idempotency key it used. `src/features/chat/api/useSendMessage.ts` (`SendMessageResult`, `return`).
- A refused or failed send still resolves, with the error code and message set and the stop reason null. `src/features/chat/api/useSendMessage.ts` (`mutationFn`), `src/features/chat/api/chat-stream.ts` (`streamChat` yields an error frame and never throws on a failed answer).
- A turn that ends with no done or error frame (aborted, or closed by the server) resolves with the stop reason, the error code and the error message all null. `src/features/chat/api/useSendMessage.ts` (`stopReason`, `errorCode`, `errorMessage` start null).
- The screen keeps reading after a done or error frame until the server closes the stream. A frame that arrives later is still applied. `src/features/chat/api/useSendMessage.ts` (`for await`, no break on a terminal frame).
- When two done frames or two error frames arrive, the last one sets the result. `src/features/chat/api/useSendMessage.ts` (`stopReason = frame.stop_reason`, `errorCode = frame.code`).

### Reading the turn stream
- The answer body is read as a byte stream and decoded as UTF-8. `src/features/chat/api/chat-stream.ts` (`getReader`, `TextDecoder("utf-8")`).
- Frames are separated by a blank line (`\n\n`). Each complete frame is applied as soon as it arrives. `src/features/chat/api/chat-stream.ts` (`buffer.indexOf("\n\n")`).
- A frame left at the end of the stream without a closing blank line is still read. `src/features/chat/api/chat-stream.ts` (`tail`).
- Each line of a frame is read as `field: value`. A carriage return at the end of the line is dropped, and so is one space after the colon. `src/features/chat/api/chat-stream.ts` (`parseSSEFrame`).
- A line starting with `:` is a keep-alive and is ignored. A line with no colon is ignored. `src/features/chat/api/chat-stream.ts` (`parseSSEFrame`).
- The `event` line names the frame, and the `data` line carries its JSON. Several `data` lines are joined with a newline, and the last `event` line wins. `src/features/chat/api/chat-stream.ts` (`parseSSEFrame`).
- A frame is skipped silently when it lacks an event or data line, when its data is not JSON, when its data is not an object, when its event name is unknown, or when a field its event requires is missing or has the wrong type. `src/features/chat/api/chat-stream.ts` (`parseSSEFrame` returns `null`; `if (frame !== null) yield frame`).
- An `llm_start` frame needs no field. `src/features/chat/api/chat-stream.ts` (`case "llm_start"`).
- A `text_delta` frame needs `delta` as a string. `src/features/chat/api/chat-stream.ts` (`case "text_delta"`).
- A `tool_start` frame needs `tool` and `args_summary` as strings. `src/features/chat/api/chat-stream.ts` (`case "tool_start"`).
- A `tool_result` frame needs `ok` as a boolean. `src/features/chat/api/chat-stream.ts` (`case "tool_result"`).
- A `done` frame needs `stop_reason` as a string. `src/features/chat/api/chat-stream.ts` (`case "done"`).
- An `error` frame needs `code` and `message` as strings. `src/features/chat/api/chat-stream.ts` (`case "error"`).
- A `graph_delta` frame needs `source_tool` as a string and `nodes` and `links` as arrays. The individual nodes and links are not checked at this point. `src/features/chat/api/chat-stream.ts` (`case "graph_delta"`).

### What the screen does on each turn event
- On `llm_start`, the chat status becomes `thinking`. `src/features/chat/api/useSendMessage.ts` (`dispatchFrame`, `case "llm_start"`).
- On `text_delta`, the delta is appended to the streamed answer and the chat status becomes `streaming`. This happens on every delta, including one that arrives before any `llm_start`. `src/features/chat/api/useSendMessage.ts` (`dispatchFrame`, `case "text_delta"`).
- On `tool_start`, a tool chip is added with the tool's name, its argument summary and a pending outcome, and the chat status becomes `tool_running`. `src/features/chat/api/useSendMessage.ts` (`dispatchFrame`, `case "tool_start"`).
- On `tool_start` for a graph tool, the graph pane's status also becomes `loading`. Any other tool leaves the graph pane's status as it was. `src/features/chat/api/useSendMessage.ts` (`isGraphTool`, `setStatus("loading")`).
- A tool counts as a graph tool only when its name exactly matches one of the graph tools (see Vocabularies). A prefix or partial match does not count. `src/features/chat/api/useSendMessage.ts` (`GRAPH_TOOLS.has`).
- On `tool_result`, the most recently added tool chip takes the frame's `ok` outcome and the chat status becomes `streaming`. `src/features/chat/api/useSendMessage.ts` (`dispatchFrame`, `case "tool_result"`).
- On `graph_delta`, the frame is converted to a graph slice. A slice with no nodes leaves the graph pane as it was. `src/features/chat/api/useSendMessage.ts` (`mapWireToGraphDelta`, `delta.nodes.length > 0`).
- The first `graph_delta` with nodes in a turn replaces the graph the pane held before. Every later `graph_delta` with nodes in the same turn is added onto it. `src/features/chat/api/useSendMessage.ts` (`graphReplacedThisTurn`, `replaceNodes`, `addNodes`).
- A `graph_delta` with no nodes does not count as the turn's replacement: a later one with nodes in the same turn still replaces the graph. `src/features/chat/api/useSendMessage.ts` (`graphReplacedThisTurn` is set only inside `delta.nodes.length > 0`).
- On `done`, the graph pane settles the turn as done, the chat status becomes `idle`, and the frame's stop reason becomes the send's result. `src/features/chat/api/useSendMessage.ts` (`dispatchFrame`, `case "done"`, `settleTurn("done")`).
- On `error`, the graph pane settles the turn as failed, the chat status becomes `error`, and the frame's code and message become the send's result. `src/features/chat/api/useSendMessage.ts` (`dispatchFrame`, `case "error"`, `settleTurn("error")`).
- The `error` chat status stays after the turn ends. Only the next send clears it. `src/features/chat/api/useSendMessage.ts` (no status change in `finally`; `resetTurn` at the next send).
- When a turn ends with no done or error frame, the send leaves the chat status where the last frame put it. `src/features/chat/api/useSendMessage.ts` (`finally` sets only the streaming flag and the abort handle).

### Stopping a turn
- While the stream is open, the turn state holds the turn's abort handle so another part of the screen can stop the turn. `src/features/chat/api/useSendMessage.ts` (`setAbortController(controller)`, `signal: controller.signal`).
- Aborting the handle before the answer arrives, or while the stream is being read, ends the reading quietly with no error frame. The conversation's messages and usage are still read again afterwards. `src/features/chat/api/chat-stream.ts` (`isAbort` → `return`), `src/features/chat/api/useSendMessage.ts` (`invalidateQueries` after `finally`).
- Cancelling a turn is a separate request: `POST /api/v1/conversations/{conversationId}/cancel` with the conversation identifier URL-encoded and no body. `src/features/chat/api/use-cancel-turn.ts` (`useCancelTurn`, `http`).
- The cancel request goes through the BFF request helper, which brings that helper's thirty-second cutoff, its single refresh on a 401 and its redirect to `/sign-in?reason=session_expired`. `src/features/chat/api/use-cancel-turn.ts` (`http<CancelWire>`).
- The cancel request carries `Authorization: Bearer <token>` only when the owner's access token is held. The token is read when the cancel is issued. `src/features/chat/api/use-cancel-turn.ts` (`authHeader()`), `src/features/chat/api/_request.ts` (`authHeader`).
- The cancel targets the conversation the cancel hook was created for. Issuing it takes no conversation argument. `src/features/chat/api/use-cancel-turn.ts` (`useCancelTurn(conversationId)`, `mutationFn: async ()`).
- A successful cancel answers `{ cancelled: true }`, and the conversation's usage is then read again. Its messages are not read again by the cancel. `src/features/chat/api/use-cancel-turn.ts` (`onSuccess`), `src/features/chat/api/_transforms.ts` (`CancelWire`).
- This area neither aborts the stream nor cancels the turn when the other happens. Each one is a separate action. `src/features/chat/api/useSendMessage.ts` (no call to cancel), `src/features/chat/api/use-cancel-turn.ts` (no abort).

### Request without an answer body
- The no-body request helper sends to `{VITE_BFF_URL}{path}` with the caller's request settings and treats only HTTP 204 as success. Any other status, 200 included, is a failure. `src/features/chat/api/_request.ts` (`httpVoid`, `response.status === 204`).
- The no-body request helper has no client cutoff and no refresh on a 401. `src/features/chat/api/_request.ts` (`httpVoid`, `fetch(url, init)`).
- Which operation uses the no-body request helper is not visible in this area. `src/features/chat/api/_request.ts` (`httpVoid`).

### Reading conversation answers
- A conversation is read as its identifier, its title (which may be null), its archived time (a date, or null), and its creation time (a date). The rolling summary and the update time are not kept. `src/features/chat/api/_transforms.ts` (`toConversation`).
- A conversation listing is read as its items and its `next_cursor`, kept as the next cursor. `src/features/chat/api/_transforms.ts` (`toConversationList`).
- A message is read as its identifier, its conversation, its role, its content blocks, its stop reason (or null), its idempotency key (or null), its model, its tokens in and out, its latency, and its creation time as a date. `src/features/chat/api/_transforms.ts` (`toChatMessage`).
- A message listing is read as its items and its `next_before`, kept unchanged as the cursor for older messages. `src/features/chat/api/_transforms.ts` (`toMessageList`).
- Conversation usage is read as the message count (from `messages`), `tokens_in`, `tokens_out` and `tool_calls`. `src/features/chat/api/_transforms.ts` (`toUsageData`).
- Timestamps are turned into dates without any check. A timestamp that cannot be parsed becomes an invalid date, and the read does not fail. `src/features/chat/api/_transforms.ts` (`new Date(...)`).

### Conversation cache entries
- Conversation data is cached under `conversations`. The listing is `["conversations","list",{ includeArchived }]`, so the archived filter is part of the cache entry. A conversation is `["conversations", id]`, its messages `["conversations", id, "messages"]` and its usage `["conversations", id, "usage"]`. `src/features/chat/api/keys.ts` (`conversationKeys`).

## Answers
- send-message — the request cannot be sent and was not aborted → error frame `SYSTEM_NETWORK` ("Falha de rede ao contactar o servidor."). `src/features/chat/api/chat-stream.ts` (`streamChat`, `fetch` catch).
- send-message — the owner aborts before the answer arrives → no frame. The stream ends quietly. `src/features/chat/api/chat-stream.ts` (`streamChat`, `isAbort` → `return`).
- send-message — the answer has no body, whatever its status (checked before the status) → error frame `SYSTEM_INVALID_RESPONSE` ("Resposta do servidor sem corpo."). `src/features/chat/api/chat-stream.ts` (`response.body === null`).
- send-message — a non-2xx answer whose body is the failure envelope → error frame with the envelope's own `code` and `message`. A missing or non-string field falls back on its own to the fallback for the status. `src/features/chat/api/chat-stream.ts` (`extractPreStreamError`).
- send-message — a non-2xx answer of status 500 or above with no readable envelope → error frame `SYSTEM_UPSTREAM` ("Algo deu errado. Tente novamente."). `src/features/chat/api/chat-stream.ts` (`extractPreStreamError`, `fallback`).
- send-message — a non-2xx answer below 500 with no readable envelope → error frame `SYSTEM_UNKNOWN` ("Erro desconhecido do servidor."). `src/features/chat/api/chat-stream.ts` (`extractPreStreamError`, `fallback`).
- send-message — a 401 before the stream opens → the same error frame as any other non-2xx answer, with no token refresh and no redirect. `src/features/chat/api/chat-stream.ts` (`!response.ok` → `extractPreStreamError`).
- send-message — reading the stream fails and was not aborted → error frame `SYSTEM_NETWORK` ("Falha de rede durante o streaming."). The stream ends. `src/features/chat/api/chat-stream.ts` (`reader.read` catch).
- send-message — the owner aborts while the stream is being read → no frame. The stream ends quietly. `src/features/chat/api/chat-stream.ts` (`reader.read` catch, `isAbort`).
- send-message — the server sends an `error` frame → the send resolves with that frame's `code` and `message`, and the chat status is `error`. `src/features/chat/api/useSendMessage.ts` (`frame.type === "error"`, `dispatchFrame`).
- send-message — an error frame of any of these kinds → the send resolves and does not fail. `src/features/chat/api/useSendMessage.ts` (`mutationFn` returns `SendMessageResult`).
- cancel-turn — any refusal or transport failure → the BFF request helper's failure for that case, unchanged. This area adds no handling of its own. `src/features/chat/api/use-cancel-turn.ts` (`http`, no `onError`).
- no-body request — the request is aborted → failure `SYSTEM_ABORTED` with HTTP status 0 ("Requisição cancelada.", details `cause`). `src/features/chat/api/_request.ts` (`httpVoid`, `isAbort`).
- no-body request — the request cannot be sent → failure `SYSTEM_NETWORK` with HTTP status 0 ("Falha de rede ao contactar o servidor.", details `cause`). `src/features/chat/api/_request.ts` (`httpVoid`).
- no-body request — any status other than 204, with a failure envelope → failure carrying the answer's status and the envelope's `code`, `message` and `details`. `src/features/chat/api/_request.ts` (`httpVoid`, `errObj`).
- no-body request — any status other than 204 at 500 or above, with no envelope → failure `SYSTEM_UPSTREAM` with the answer's status ("Algo deu errado. Tente novamente."). `src/features/chat/api/_request.ts` (`httpVoid`).
- no-body request — any status other than 204 below 500, with no envelope (200 included) → failure `SYSTEM_UNKNOWN` with the answer's status ("Erro desconhecido do servidor."). `src/features/chat/api/_request.ts` (`httpVoid`).

## Vocabularies
- Turn event kinds the screen reads: `llm_start`, `text_delta`, `tool_start`, `tool_result`, `done`, `error`, `graph_delta`. `src/features/chat/api/chat-stream.ts` (`ChatSSEFrame`, `parseSSEFrame`).
- Chat status values the send sets: `thinking`, `streaming`, `tool_running`, `idle`, `error`. `src/features/chat/api/useSendMessage.ts` (`dispatchFrame`).
- Graph tools, whose start puts the graph pane into `loading`: `traverse`, `get_node`, `list_nodes`, `search`, `ingest_directed`. `src/features/chat/api/useSendMessage.ts` (`GRAPH_TOOLS`).
- Ways the graph pane settles a turn: `done`, `error`. `src/features/chat/api/useSendMessage.ts` (`settleTurn`).
- Failure codes the screen makes up itself when the BFF supplies none: `SYSTEM_NETWORK`, `SYSTEM_INVALID_RESPONSE`, `SYSTEM_UPSTREAM`, `SYSTEM_UNKNOWN`, `SYSTEM_ABORTED`. `src/features/chat/api/chat-stream.ts` (`streamChat`, `extractPreStreamError`), `src/features/chat/api/_request.ts` (`httpVoid`).

## Upstream artifacts
- The BFF's send-message endpoint answers with a stream of `event: <name>` / `data: <json>` frames. Their fields are `delta`, `tool`, `args_summary`, `ok`, `stop_reason`, `code`, `message`, `source_tool`, `nodes` and `links`. `src/features/chat/api/chat-stream.ts` (`parseSSEFrame`).
- The BFF's failure envelope is `{ error: { code, message, details } }`. `src/features/chat/api/chat-stream.ts` (`extractPreStreamError`), `src/features/chat/api/_request.ts` (`httpVoid`).
- The BFF's cancel endpoint answers `{ cancelled: true }`. `src/features/chat/api/_transforms.ts` (`CancelWire`).
- The BFF's conversation fields are `id`, `title`, `archived_at`, `summary_rolling`, `created_at` and `updated_at`. The listing has `items` and `next_cursor`. `src/features/chat/api/_transforms.ts` (`ConversationWire`, `ConversationListWire`).
- The BFF's message fields are `id`, `conversation_id`, `role`, `content`, `stop_reason`, `idempotency_key`, `model`, `tokens_in`, `tokens_out`, `latency_ms` and `created_at`. The listing has `items` and `next_before`. `src/features/chat/api/_transforms.ts` (`ChatMessageWire`, `MessageListWire`).
- The BFF's usage fields are `messages`, `tokens_in`, `tokens_out` and `tool_calls`. `src/features/chat/api/_transforms.ts` (`UsageWire`).
- The graph pane belongs to the graph feature. The send uses its conversion of a graph slice and its actions to replace, add, set the status and settle a turn. `src/features/chat/api/useSendMessage.ts` (`mapWireToGraphDelta`, `useGraphStore`).
- The owner's access token belongs to owner access. The send and the cancel read it from the held session state. `src/features/chat/api/useSendMessage.ts` (`useAuthStore`), `src/features/chat/api/_request.ts` (`authHeader`).
- The BFF base address comes from the environment as `VITE_BFF_URL`. `src/features/chat/api/useSendMessage.ts` (`getEnv`), `src/features/chat/api/_request.ts` (`getEnv`).
- The BFF request helper carries the cancel request. `src/features/chat/api/use-cancel-turn.ts` (`http`).

## Outside the domain
- The barrel of public exports, including frame types it leaves out. Wiring. `src/features/chat/api/index.ts`.
- Keeping the send function stable across renders and the `useMutation` setup. Framework. `src/features/chat/api/useSendMessage.ts`.
- Trimming slashes when joining the base address and the path. Plumbing. `src/features/chat/api/useSendMessage.ts`, `src/features/chat/api/_request.ts`.
- Releasing the reader lock, managing the decoder buffer, and turning snake_case fields into camelCase frame fields. Plumbing. `src/features/chat/api/chat-stream.ts`.
- The cache key factory's literal typing. Framework. `src/features/chat/api/keys.ts`.
- Comments that cite spec and task identifiers, which were ignored. Text. `src/features/chat/api/useSendMessage.ts`, `src/features/chat/api/chat-stream.ts`, `src/features/chat/api/use-cancel-turn.ts`, `src/features/chat/api/_request.ts`, `src/features/chat/api/keys.ts`.

## Observed and not decided here
- The message cache page is shaped two ways. The send writes it as `{ items, nextCursor }` and creates `{ items: [optimistic], nextCursor: null }` when none exists (`src/features/chat/api/useSendMessage.ts`, `MessagesCachePage`). The message listing reads it as `{ items, nextBefore }` (`src/features/chat/api/_transforms.ts`, `MessageListResult`, `toMessageList`).
- The send and the cancel handle an expired session differently. The send stream calls `fetch` directly, so a 401 becomes one error frame with no refresh, no cutoff and no redirect (`src/features/chat/api/chat-stream.ts`, `streamChat`). The cancel goes through the BFF request helper, so it gets the thirty-second cutoff, one refresh on a 401 and the redirect to `/sign-in?reason=session_expired` (`src/features/chat/api/use-cancel-turn.ts`, `http`).
