---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/chat/api/use-create-conversation.ts
  - src/features/chat/api/use-delete-conversation.ts
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/use-list-messages.ts
  - src/features/chat/api/use-update-conversation.ts
  - src/features/chat/state/chat-turn.ts
  - src/features/chat/types.ts
read_outside_area:
  - "src/features/chat/api/_transforms.ts — read to see how each answer becomes a conversation, a listing page, a message and a usage (archived_at and created_at become dates, the usage field messages becomes messageCount, next_cursor and next_before are kept as they arrive); not surveyed here"
  - "src/features/chat/api/keys.ts — read to see which cache entries each key names (all is the conversations prefix over every entry below it; list carries only the include-archived filter; detail, messages and usage sit under the conversation id); not surveyed here"
  - "src/features/chat/api/_request.ts — read for authHeader and httpVoid; httpVoid sends the delete without going through the BFF request helper, and maps its failures to SYSTEM_ABORTED, SYSTEM_NETWORK, SYSTEM_UPSTREAM or SYSTEM_UNKNOWN with its own pt-BR messages; those refusals are facts of that file and are not listed here"
  - "src/lib/http.ts — read to confirm that the BFF request helper applies a 30-second cutoff and one silent token refresh on a 401, which the delete path does not go through"
---

## Facts
### Creating a conversation
- Creating a conversation sends `POST /api/v1/conversations` with a JSON body, the owner's access token as a bearer `Authorization` header, and `Content-Type: application/json`. `src/features/chat/api/use-create-conversation.ts` (`useCreateConversation` `mutationFn`).
- The body carries only an optional `title`. When the caller passes nothing, the body is `{}`. `src/features/chat/api/use-create-conversation.ts` (`CreateConversationVariables`, `vars ?? {}`).
- The screen sends the title as given and never checks its length or content before sending. `src/features/chat/api/use-create-conversation.ts` (`mutationFn`).
- The answer is read as a conversation through the conversation transform. `src/features/chat/api/use-create-conversation.ts` (`toConversation(wire)`).
- After a successful create, every conversation-scoped cache entry is marked stale and refreshed: the listings for both archive filters, each conversation's details, its messages and its usage. `src/features/chat/api/use-create-conversation.ts` (`onSuccess`, `invalidateQueries({ queryKey: conversationKeys.all })`).
- The create operation does not navigate to the new conversation. It only hands the conversation back to its caller. `src/features/chat/api/use-create-conversation.ts` (`useCreateConversation`).

### Deleting a conversation
- Deleting a conversation sends `DELETE /api/v1/conversations/{id}` with the URL-encoded conversation id, the bearer `Authorization` header and no body. `src/features/chat/api/use-delete-conversation.ts` (`useDeleteConversation` `mutationFn`).
- The delete goes through a separate no-body request helper, not the BFF request helper that every other request in this area uses. `src/features/chat/api/use-delete-conversation.ts` (`httpVoid` import from `./_request`).
- A successful delete gives the caller nothing back. `src/features/chat/api/use-delete-conversation.ts` (`UseMutationResult<void, …>`).
- After a successful delete, the cached details, messages and usage of the deleted conversation are removed outright, and then every conversation-scoped cache entry is marked stale and refreshed. `src/features/chat/api/use-delete-conversation.ts` (`onSuccess`, `removeQueries` on `detail(id)`, `messages(id)`, `usage(id)`, then `invalidateQueries(conversationKeys.all)`).
- The delete operation does not navigate. `src/features/chat/api/use-delete-conversation.ts` (`useDeleteConversation`).

### Updating a conversation (rename, archive, un-archive)
- Updating a conversation sends `PATCH /api/v1/conversations/{id}` with the URL-encoded id, a JSON body, the bearer `Authorization` header and `Content-Type: application/json`. `src/features/chat/api/use-update-conversation.ts` (`useUpdateConversation` `mutationFn`).
- The body carries `title` only when the caller supplies one. A `null` title is sent as `null`. `src/features/chat/api/use-update-conversation.ts` (`if (title !== undefined) body["title"] = title`).
- The body carries `archived_at` only when the caller supplies it. A timestamp string archives the conversation and `null` un-archives it. `src/features/chat/api/use-update-conversation.ts` (`if (archivedAt !== undefined) body["archived_at"] = archivedAt`, `UpdateConversationVariables.archivedAt: string | null`).
- When the caller supplies neither field, the screen still sends the request with an empty body `{}`. It refuses nothing itself. `src/features/chat/api/use-update-conversation.ts` (`const body: Record<string, unknown> = {}`).
- The answer is read as a conversation through the conversation transform. `src/features/chat/api/use-update-conversation.ts` (`toConversation(wire)`).
- After a successful update, the updated conversation's details are marked stale, and then every conversation-scoped cache entry is marked stale and refreshed. `src/features/chat/api/use-update-conversation.ts` (`onSuccess`, `invalidateQueries` on `detail(data.id)` then `conversationKeys.all`).

### Reading one conversation
- A conversation's details are read with `GET /api/v1/conversations/{id}`, using the URL-encoded id and the bearer `Authorization` header. `src/features/chat/api/use-get-conversation.ts` (`useGetConversation` `queryFn`).
- The details are requested only when the conversation id is a non-empty string. Otherwise nothing is sent. `src/features/chat/api/use-get-conversation.ts` (`enabled: typeof id === "string" && id.length > 0`).
- A conversation's details stay fresh for 30 seconds. `src/features/chat/api/use-get-conversation.ts` (`STALE_MS = 30_000`).
- The details are read again when the window regains focus. `src/features/chat/api/use-get-conversation.ts` (`refetchOnWindowFocus: true`).

### Listing conversations
- The conversation listing is read with `GET /api/v1/conversations` and the bearer `Authorization` header. `src/features/chat/api/use-list-conversations.ts` (`useListConversations` `queryFn`).
- The query string carries `limit` only when the caller gives one, `cursor` only when the caller gives one, and `include_archived=true` only when archived conversations are asked for. With none of these, no query string is sent. `src/features/chat/api/use-list-conversations.ts` (`buildQueryString`).
- The screen fixes no page size for the listing. When no `limit` is given, the BFF's default applies. `src/features/chat/api/use-list-conversations.ts` (`ListConversationsParams.limit?`, `buildQueryString`).
- By default the listing excludes archived conversations. `src/features/chat/api/use-list-conversations.ts` (`params.includeArchived ?? false`).
- A listing is cached once per archive filter. The cursor and the page size are not part of what identifies it, so a different page under the same filter takes the same cache entry. `src/features/chat/api/use-list-conversations.ts` (`queryKey: conversationKeys.list({ includeArchived })`).
- The answer is read as listed conversations plus a next cursor. `src/features/chat/api/use-list-conversations.ts` (`toConversationList(wire)`, `ConversationListResult`).
- The listing stays fresh for 30 seconds and is read again when the window regains focus. `src/features/chat/api/use-list-conversations.ts` (`STALE_MS = 30_000`, `refetchOnWindowFocus: true`).

### Listing messages
- A conversation's messages are read with `GET /api/v1/conversations/{id}/messages`, using the URL-encoded id and the bearer `Authorization` header. `src/features/chat/api/use-list-messages.ts` (`useListMessages` `queryFn`).
- The query string carries `limit` only when the caller gives one and `before` (a cutoff timestamp) only when the caller gives one. With neither, no query string is sent. `src/features/chat/api/use-list-messages.ts` (`buildQueryString`, `ListMessagesParams`).
- The screen fixes no page size for messages. When no `limit` is given, the BFF's default applies. `src/features/chat/api/use-list-messages.ts` (`ListMessagesParams.limit?`).
- A conversation's messages are cached once per conversation. The `limit` and `before` values are not part of what identifies the entry. `src/features/chat/api/use-list-messages.ts` (`queryKey: conversationKeys.messages(conversationId …)`).
- Messages are requested only when the conversation id is a non-empty string. `src/features/chat/api/use-list-messages.ts` (`enabled`).
- Messages are stale as soon as they are read and are not read again when the window regains focus. `src/features/chat/api/use-list-messages.ts` (`staleTime: 0`, `refetchOnWindowFocus: false`).
- The answer is read as messages plus a `before` cursor for the next older page. `src/features/chat/api/use-list-messages.ts` (`toMessageList(wire)`, `MessageListResult`).

### Reading conversation usage
- A conversation's usage is read with `GET /api/v1/conversations/{id}/usage`, using the URL-encoded id and the bearer `Authorization` header. `src/features/chat/api/use-get-conversation-usage.ts` (`useGetConversationUsage` `queryFn`).
- Usage is requested only when the conversation id is a non-empty string. `src/features/chat/api/use-get-conversation-usage.ts` (`enabled`).
- Usage stays fresh for 30 seconds and is not read again when the window regains focus. `src/features/chat/api/use-get-conversation-usage.ts` (`STALE_MS = 30_000`, `refetchOnWindowFocus: false`).
- The usage answer is read through the usage transform. `src/features/chat/api/use-get-conversation-usage.ts` (`toUsageData(wire)`).

### What the screen holds of a conversation, a message and usage
- A conversation, as the screen holds it, has an id, a title that may be null, an archive moment that is null while the conversation is active, and a creation moment, both moments held as dates. `src/features/chat/types.ts` (`Conversation`).
- A message, as the screen holds it, has an id, its conversation's id, a role, a list of content blocks, a stop reason or null, an idempotency key or null, a model or null, tokens in, tokens out and latency (each a number or null), and a creation moment held as a date. `src/features/chat/types.ts` (`ChatMessage`).
- A message's content block has an open `type` string, an optional `text`, and may carry any other field. `src/features/chat/types.ts` (`ChatContentBlock`).
- A tool call as the turn shows it has a tool name, a summary of its arguments, and an outcome that is pending (null), succeeded (true) or failed (false). `src/features/chat/types.ts` (`ToolCallData`).
- Conversation usage, as the screen holds it, has a message count, tokens in, tokens out and a tool-call count. `src/features/chat/types.ts` (`UsageData`).
- The active conversation, as the screen composes it, has an id, a title or null, an archived flag, the archive moment or null, its messages, and its usage or null while usage has not arrived. `src/features/chat/types.ts` (`ActiveConversation`).

### Turn state on the screen
- A turn's state starts with empty streamed text, no tool calls, no cancellation handle, no idempotency key, streaming off, and chat status `idle`. `src/features/chat/state/chat-turn.ts` (`initialState`).
- Resetting the turn restores every field of the turn state to its starting value at once. `src/features/chat/state/chat-turn.ts` (`reset`).
- Each streamed text piece is added to the end of the turn's accumulated text. `src/features/chat/state/chat-turn.ts` (`appendText`).
- Each tool call that starts is added to the end of the turn's list of tool calls. `src/features/chat/state/chat-turn.ts` (`addToolChip`).
- A tool call's outcome always settles the most recently added tool call. When the turn has no tool call, an outcome changes nothing. `src/features/chat/state/chat-turn.ts` (`updateLastToolChip`).
- The turn holds one cancellation handle for the request in flight, so that a control elsewhere on the screen can stop the turn. `src/features/chat/state/chat-turn.ts` (`abortController`, `setAbortController`).
- The turn holds the idempotency key of the current send attempt. `src/features/chat/state/chat-turn.ts` (`idempotencyKey`, `setIdempotencyKey`).
- The turn holds a streaming on/off flag that is set separately from the chat status. Nothing in the state ties the two together. `src/features/chat/state/chat-turn.ts` (`isStreaming`/`setStreaming`, `chatStatus`/`setChatStatus`).
- The turn state accepts any chat status from any chat status. It enforces no transitions itself. `src/features/chat/state/chat-turn.ts` (`setChatStatus: (chatStatus) => set({ chatStatus })`).
- Turn state lives only in memory for the session and is never persisted. `src/features/chat/state/chat-turn.ts` (`create<ChatTurnState>` without a persistence middleware).

## Answers
- create conversation — the request fails → the operation fails with the error the BFF request helper raised. The area maps no code and shows no text of its own. `src/features/chat/api/use-create-conversation.ts` (`useMutation` with no `onError`).
- update conversation — the request fails → the operation fails with the error the BFF request helper raised. The area maps no code and shows no text of its own. `src/features/chat/api/use-update-conversation.ts` (`useMutation` with no `onError`).
- update conversation — neither `title` nor `archived_at` is supplied → the screen refuses nothing and sends `{}`. Any refusal is the BFF's answer. `src/features/chat/api/use-update-conversation.ts` (`mutationFn` body construction).
- delete conversation — the request fails → the operation fails with the error the no-body request helper raised. The area maps no code and shows no text of its own. `src/features/chat/api/use-delete-conversation.ts` (`useMutation` with no `onError`, `httpVoid`).
- read one conversation, list conversations, list messages, read usage — the request fails → the read fails with the error the BFF request helper raised. The area maps no code and shows no text of its own. `src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-list-conversations.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-get-conversation-usage.ts` (`useQuery` with no error handling).
- read one conversation, list messages, read usage — no conversation id → nothing is sent and the read stays idle. This is not a refusal. `src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-get-conversation-usage.ts` (`enabled`).

## Vocabularies
- Chat status of a turn on the screen: `idle`, `thinking`, `streaming`, `tool_running`, `error`. `src/features/chat/state/chat-turn.ts` (`ChatStatus`).
- Message role: `user`, `assistant`. `src/features/chat/types.ts` (`ChatMessageRole`).
- Assistant stop reason: `end_turn`, `max_tokens`, `stop_sequence`, `max_iterations`, `turn_timeout`, `cancelled`, `provider_error`, `internal_error`. `src/features/chat/types.ts` (`ChatStopReason`).
- Tool call outcome on the screen: `null` (pending), `true`, `false`. `src/features/chat/types.ts` (`ToolCallData.ok`).

## Upstream artifacts
- The BFF's conversation endpoints that this area calls: `POST /api/v1/conversations`, `GET /api/v1/conversations`, `GET /api/v1/conversations/{id}`, `PATCH /api/v1/conversations/{id}`, `DELETE /api/v1/conversations/{id}`, `GET /api/v1/conversations/{id}/messages`, `GET /api/v1/conversations/{id}/usage`. `src/features/chat/api/use-create-conversation.ts`, `src/features/chat/api/use-list-conversations.ts`, `src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-update-conversation.ts`, `src/features/chat/api/use-delete-conversation.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-get-conversation-usage.ts` (request paths).
- Request names the BFF defines: the listing query `limit`, `cursor` and `include_archived`; the message query `limit` and `before`; the create body field `title`; the update body fields `title` and `archived_at`. `src/features/chat/api/use-list-conversations.ts` (`buildQueryString`), `src/features/chat/api/use-list-messages.ts` (`buildQueryString`), `src/features/chat/api/use-create-conversation.ts` (`CreateConversationVariables`), `src/features/chat/api/use-update-conversation.ts` (`body["title"]`, `body["archived_at"]`).
- Message fields kept as the BFF names them: `conversation_id`, `role`, `content`, `stop_reason`, `idempotency_key`, `model`, `tokens_in`, `tokens_out`, `latency_ms`. Usage fields kept as named: `tokens_in`, `tokens_out`, `tool_calls`. `src/features/chat/types.ts` (`ChatMessage`, `UsageData`).
- The owner's access token, read from the sign-in session at the moment of each request, is sent as the bearer `Authorization` header. `src/features/chat/api/use-create-conversation.ts`, `src/features/chat/api/use-delete-conversation.ts`, `src/features/chat/api/use-get-conversation-usage.ts`, `src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-list-conversations.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-update-conversation.ts` (`authHeader()`).

## Outside the domain
- The cache key placeholder `"__noop__"` used when there is no conversation id (wiring). `src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-get-conversation-usage.ts`.
- TanStack Query hook wiring: `useQuery`, `useMutation`, `useQueryClient` and the result types (framework). `src/features/chat/api/use-create-conversation.ts`, `src/features/chat/api/use-delete-conversation.ts`, `src/features/chat/api/use-get-conversation-usage.ts`, `src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-list-conversations.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-update-conversation.ts`.
- URL encoding of the conversation id with `encodeURIComponent` (transport). `src/features/chat/api/use-delete-conversation.ts`, `src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-get-conversation-usage.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-update-conversation.ts`.
- The Zustand store and its setter names (framework). `src/features/chat/state/chat-turn.ts`.
- The split between camelCase screen fields and snake_case wire fields (naming). `src/features/chat/types.ts`.
- Doc comments that cite specification sections, title bounds, page-size defaults and transition diagrams were read and set aside. The code beside them states none of it (text). `src/features/chat/api/use-create-conversation.ts`, `src/features/chat/api/use-list-conversations.ts`, `src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-update-conversation.ts`, `src/features/chat/state/chat-turn.ts`, `src/features/chat/types.ts`.

## Observed and not decided here
- Deleting a conversation goes through a separate request helper: "`await httpVoid(`/api/v1/conversations/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeader() })`" (`src/features/chat/api/use-delete-conversation.ts`). Every other conversation request goes through the BFF request helper: "`await http<ConversationWire>(...)`" (`src/features/chat/api/use-create-conversation.ts`, `src/features/chat/api/use-update-conversation.ts`, `src/features/chat/api/use-get-conversation.ts`), and likewise in `src/features/chat/api/use-list-conversations.ts`, `src/features/chat/api/use-list-messages.ts` and `src/features/chat/api/use-get-conversation-usage.ts`. So the delete does not get the 30-second cutoff or the one silent token refresh on a 401 that the BFF request helper applies, and its failures carry the other helper's codes and texts. This was read in files outside the area (see `read_outside_area`).
- Conversation details and the listing are read again on window focus, "`refetchOnWindowFocus: true`" (`src/features/chat/api/use-get-conversation.ts`, `src/features/chat/api/use-list-conversations.ts`). Messages and usage of the same conversation are not: "`refetchOnWindowFocus: false`" (`src/features/chat/api/use-list-messages.ts`, `src/features/chat/api/use-get-conversation-usage.ts`).
