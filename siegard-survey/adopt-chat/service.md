---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/chat/service/args-summary.ts
  - src/modules/chat/service/chat-agent.service.ts
  - src/modules/chat/service/context-builder.ts
  - src/modules/chat/service/conversation.service.ts
  - src/modules/chat/service/datetime-block.ts
  - src/modules/chat/service/distillation.service.ts
  - src/modules/chat/service/errors.ts
  - src/modules/chat/service/graph-normalizer.ts
  - src/modules/chat/service/message-sequence.ts
  - src/modules/chat/service/output-guard.ts
  - src/modules/chat/service/tool-catalog.ts
  - src/modules/chat/service/truncate-tool-result.ts
  - src/modules/chat/service/turn-registry.ts
  - src/modules/chat/service/types.ts
---

## Facts

### Chat tool catalog
- The chat catalog always holds 13 read-only tools from the `query` toolset, in this order: `get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types`, `list_attribute_keys`, `search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`. `src/modules/chat/service/tool-catalog.ts` (`CHAT_TOOL_NAMES`, `CHAT_QUERY_TOOLSET`).
- When `CHAT_INGEST_ENABLED === true`, the catalog also holds `ingest_directed` from the `ingest` toolset, added after the 13 query tools. If the flag is absent or not `true`, the tool is left out. `src/modules/chat/service/tool-catalog.ts` (`CHAT_INGEST_TOOL_NAMES`, `CHAT_INGEST_TOOLSET`, `buildChatToolCatalog`).
- If any of the 13 query tools is missing from the MCP registry, the catalog resolves to `undefined` (no chat catalog at all). That result sticks for the process for the same flag value. `src/modules/chat/service/tool-catalog.ts` (`buildChatToolCatalog`, `CACHED = undefined`).
- If `ingest_directed` is asked for but missing from the registry, the catalog falls back to the 13 query tools. The ingestion portion is all-or-nothing. `src/modules/chat/service/tool-catalog.ts` (`buildChatToolCatalog`, `missingIngest`).
- The resolved catalog is frozen and memoized, and is resolved again only when `CHAT_INGEST_ENABLED` differs from the value it was built under. `src/modules/chat/service/tool-catalog.ts` (`CACHED_FOR_INGEST_FLAG`, `Object.freeze`).
- Each catalog tool is offered to the model with its `name`, its `description` and an `input_schema` derived from its Zod input schema, in catalog order. `src/modules/chat/service/chat-agent.service.ts` (`buildToolDescriptors`).
- A tool whose schema cannot be derived is offered with the permissive schema `{ type: "object", additionalProperties: true }`. This covers four cases: the conversion throws, the root is not an object, the root `type` is not `"object"`, or the schema has `$defs`/`definitions`. `src/modules/chat/service/chat-agent.service.ts` (`toolInputSchemaFromZod`, `PERMISSIVE_INPUT_SCHEMA`).

### Chat turn (the agentic loop, `runTurn`)
- A turn takes `system`, `messages`, `model`, `abortSignal`, an optional `current_user_turn` and an optional `invocation_pointer` `{ conversation_id, message_id }`. `src/modules/chat/service/types.ts` (`ChatRunInput`).
- The chat agent service refuses to be built when `env.CHAT_ENABLED === false`. `src/modules/chat/service/chat-agent.service.ts` (`createChatAgentService`).
- The model client is built once, on the first `runTurn`, from `ANTHROPIC_API_KEY`, and shared by later turns. `src/modules/chat/service/chat-agent.service.ts` (`getClient`, `cachedClient`).
- The chat prompt module is chosen when the service is built, from `CHAT_PROMPT_VERSION`. `src/modules/chat/service/chat-agent.service.ts` (`selectChatPromptModule(env.CHAT_PROMPT_VERSION)`).
- A turn is bounded by the wall-clock `TURN_TIMEOUT_MS`. When it expires, the turn ends with `done` and `stop_reason` `turn_timeout`. `src/modules/chat/service/chat-agent.service.ts` (`turnTimer`, `TURN_TIMEOUT_REASON`).
- A client cancel (the `abortSignal` fires, or has already fired when the turn starts) ends the turn with `done` and `stop_reason` `cancelled`. `src/modules/chat/service/chat-agent.service.ts` (`externalAbortListener`, `runTurnGenerator`).
- A turn allows at most `MAX_ITERATIONS` model calls. Opening one more ends the turn with `done` and `stop_reason` `max_iterations`. `src/modules/chat/service/chat-agent.service.ts` (`iteration > ctx.env.MAX_ITERATIONS`).
- Before each model call, the iteration ceiling is checked first and the abort second. Only then is `llm_start { iteration }` emitted, so a turn that has hit the ceiling and was also cancelled ends with `max_iterations`. `src/modules/chat/service/chat-agent.service.ts` (`runTurnGenerator` while-loop order).
- Every model call sends the turn's `model`, `system`, the current history, the catalog tools, and `tool_choice` `{ type: "auto", disable_parallel_tool_use: true }`. `src/modules/chat/service/chat-agent.service.ts` (`ctx.client.messages.stream`).
- A `system` given as a string is sent as one text block. A `system` given as a block array is sent as is. `src/modules/chat/service/chat-agent.service.ts` (`systemParam`).
- Each non-empty text delta that passes the output guard is emitted as `text_delta { delta }` and added to the assistant content as a `{ type: "text", text }` block. Empty deltas are dropped. `src/modules/chat/service/chat-agent.service.ts` (`stream.on("text")`, `iterationBlocks.push`).
- A stream error is read as a cancel or timeout when the error's name is `AbortError` or `APIUserAbortError`, or when the turn was aborted. The abort reason decides between `turn_timeout` and `cancelled`. `src/modules/chat/service/chat-agent.service.ts` (`isAbortError`, `streamErrored` branch).
- `tokens_in` and `tokens_out` are summed over all model calls of the turn from `usage.input_tokens` and `usage.output_tokens`. A missing count adds 0. `src/modules/chat/service/chat-agent.service.ts` (`ctx.accumulator.addTokens`).
- The `model` reported on `done` is the model named by the last model response. Before any response it is the requested `model`. `src/modules/chat/service/chat-agent.service.ts` (`lastModel`).
- A model response with `stop_reason` `tool_use`, or with any `tool_use` block, leads to tool dispatch. Otherwise the turn ends. `src/modules/chat/service/chat-agent.service.ts` (`stop === "tool_use" || toolUseBlocks.length > 0`).
- For each tool use, the loop emits `tool_start { tool, args_summary }`, records the tool name in `tools_called`, calls the tool, then emits `tool_result`. `src/modules/chat/service/chat-agent.service.ts` (`runTurnGenerator` tool loop).
- `tool_result` carries `tool`, `ok`, `arguments` (the raw tool input), `result` (the envelope's `result` when `ok`, else `null`), `is_error` (`!ok`), `error_message` (the envelope's `error.message`, or `null`) and `duration_ms`. `src/modules/chat/service/chat-agent.service.ts` (`yield { type: "tool_result" ... }`); `src/modules/chat/service/types.ts` (`ChatEvent`).
- A failed tool call does not end the turn. Its failure envelope goes back to the model and the loop continues. `src/modules/chat/service/chat-agent.service.ts` (`raceToolHandler`, `continue`).
- Each tool call is bounded by `TOOL_TIMEOUT_MS`. The tool's work is not cancelled when the bound fires. `src/modules/chat/service/chat-agent.service.ts` (`raceToolHandler`).
- A tool that returns a value without a boolean `ok` is read as success: `{ ok: true, result: <value> }`. `src/modules/chat/service/chat-agent.service.ts` (`coerceEnvelope`).
- Every tool receives an invocation context. It holds `source_excerpt` (the verbatim `current_user_turn`) and `pointer` (the `invocation_pointer`). An absent value leaves its key out, and when both are absent no context is passed. `src/modules/chat/service/chat-agent.service.ts` (`invocationContext`, `raceToolHandler`).
- The tool envelope goes back to the model as JSON, truncated to `TOOL_RESULT_MAX_CHARS`. It travels in a `tool_result` block that carries the tool use's `tool_use_id` and `is_error: !ok`, and all the results of one iteration go back as a single `user` message. `src/modules/chat/service/chat-agent.service.ts` (`truncateToolResult`, `toolResultBlocks`, `inLoopHistory.push`).
- After an iteration that used tools, the loop emits `iteration_end { iteration, assistant_content, tool_results }`. Here `assistant_content` is that iteration's guarded text blocks plus its `tool_use` blocks. The loop then clears the assistant content and opens the next iteration. `src/modules/chat/service/chat-agent.service.ts` (`yield { type: "iteration_end" ... }`, `iterationBlocks.length = 0`).
- A model `stop_reason` of `end_turn`, `max_tokens` or `stop_sequence` ends the turn with that `stop_reason`. Any other value, including null, ends it with `end_turn`. `src/modules/chat/service/chat-agent.service.ts` (`mapStopReason`).
- `done` carries `stop_reason`, `model`, `tokens_in`, `tokens_out` and `content` (the final iteration's accumulated blocks). `src/modules/chat/service/chat-agent.service.ts` (`terminate`); `src/modules/chat/service/types.ts` (`ChatEvent`).
- `error` carries `code`, `message`, `content` (only the text blocks of the failing iteration, with `tool_use` blocks removed), `tokens_in`, `tokens_out` and `synthetic_stop_reason`. `src/modules/chat/service/chat-agent.service.ts` (`terminateError`).
- Every turn ends with exactly one terminal event, `done` or `error`. `src/modules/chat/service/chat-agent.service.ts` (`terminate`, `terminateError`, `return` after each).
- The per-turn stats are `tokens_in`, `tokens_out`, `iterations`, `tools_called` and `stop_reason`. `stop_reason` starts as `end_turn` and takes the terminal reason, including `provider_error` or `internal_error`. `src/modules/chat/service/chat-agent.service.ts` (`createStatsAccumulator`); `src/modules/chat/service/types.ts` (`ChatRunStats`).
- The turn loop never emits `graph_delta`. `graph_delta { source_tool, nodes, links }` is a member of the chat event union. `src/modules/chat/service/types.ts` (`ChatEvent`); `src/modules/chat/service/chat-agent.service.ts` (`runTurnGenerator`).

### Tool-start argument summary
- The `args_summary` of a `tool_start` is at most 200 Unicode code points. A longer summary is cut with no marker. `src/modules/chat/service/args-summary.ts` (`ARGS_SUMMARY_MAX_CHARS`, `clampToMax`).
- For `search`, the summary is `query="<first 60 code points of query>"`. It adds ` layers=<comma-joined layers>` when `layers` is a non-empty string array, and ` expand_depth=<n>` when `expand_depth` is a finite number. `src/modules/chat/service/args-summary.ts` (`formatByTool` case `search`, `SEARCH_QUERY_MAX_CHARS`).
- For `get_node`, `get_history_link`, `get_history_attribute`, `get_provenance_link`, `get_provenance_attribute` and `get_provenance_fragment`, the summary is `id=<id>`. `src/modules/chat/service/args-summary.ts` (`formatByTool`).
- For `traverse`, the summary is `id=<id>`, with ` depth=<n>` added when `depth` is a finite number. `src/modules/chat/service/args-summary.ts` (`formatByTool` case `traverse`).
- For `get_history_attribute_key`, the summary is `node_id=<node_id> key=<key>`, and both fields are required. `src/modules/chat/service/args-summary.ts` (`formatByTool`).
- For `list_nodes`, the summary is `node_type=<node_type> limit=<limit>`, and both fields are required. `src/modules/chat/service/args-summary.ts` (`formatByTool`).
- For `list_node_types`, `list_link_types` and `list_attribute_keys`, the summary is the empty string. `src/modules/chat/service/args-summary.ts` (`formatByTool`).
- For `start_async_ingestion`, the summary is `source_type=<source_type> content_len=<code-point length of content>`. It never includes the content. `src/modules/chat/service/args-summary.ts` (`formatByTool` case `start_async_ingestion`).
- For `get_ingestion_status`, the summary is `llm_run_id=<llm_run_id>`. `src/modules/chat/service/args-summary.ts` (`formatByTool`).
- For an unknown tool name, or when a required field is missing or mistyped, the summary is `<n> keys`, counting the input's top-level keys. For input that is not an object (null, an array, a primitive) it is `0 keys`. `src/modules/chat/service/args-summary.ts` (`fallbackSummary`).

### Output guard
- A text delta that contains the chat system-prompt marker is dropped: it is not emitted and not kept in the assistant content. `src/modules/chat/service/output-guard.ts` (`inspectDelta`, `CHAT_PROMPT_MARKER_V1`); `src/modules/chat/service/chat-agent.service.ts` (`decision.drop`).

### Tool-result truncation
- A tool result longer than the limit keeps its first `maxChars` Unicode code points and gets the marker `\n[truncated: <total> chars]`. `<total>` is the full length before truncation, and the marker is appended outside the limit. `src/modules/chat/service/truncate-tool-result.ts` (`truncateToolResult`).
- A tool result within the limit goes back unchanged, with no marker. `src/modules/chat/service/truncate-tool-result.ts` (`truncateToolResult`).

### Model context for a turn
- The turn's `system` is two text blocks. The first is the prompt module's text. The second is the owner's current date and time, `Data/hora atual do dono: <ISO-8601 with offset> (<tz-id>)`. `src/modules/chat/service/context-builder.ts` (`buildModelContext`, `blockA`, `blockB`); `src/modules/chat/service/datetime-block.ts` (`renderDatetimeBlockB`, `ISO_PREFIX`).
- The history holds the messages of the last `recentLimit` real turns of the conversation, read under a read-only transaction, each message's `role` and `content` kept verbatim. `src/modules/chat/service/context-builder.ts` (`repo.listRecentRealTurns`, `windowMessages`).
- When the conversation has a `summary_rolling`, a `user` message whose text is `[contexto da conversa anterior, sintetizado]\n\n` followed by the summary goes before the recent window. `src/modules/chat/service/context-builder.ts` (`SUMMARY_ROLLING_PREFIX`).
- The recent window is cleaned by the message-sequence sanitizer before it is appended. The rolling-summary message is not sanitized. `src/modules/chat/service/context-builder.ts` (`sanitizeAnthropicSequence(windowMessages)`).
- The owner's date and time are shown as `YYYY-MM-DDTHH:mm:ss±HH:MM`: wall-clock time in the given IANA zone, 24-hour clock, with an hour of `24` written as `00`. `src/modules/chat/service/datetime-block.ts` (`formatIsoWithOffset`).
- The zone offset is `+00:00` for `GMT` or `UTC`. For `GMT±H[:MM]` it is `±HH:MM`, zero-padded, with minutes defaulting to `00`. Any other shape gives `+00:00`. `src/modules/chat/service/datetime-block.ts` (`normalizeShortOffset`).

### Message-sequence sanitizer
- Every message whose `content` is not a non-empty array of blocks is dropped, whatever its role. `src/modules/chat/service/message-sequence.ts` (`sanitizeAnthropicSequence`, `hasBlocks`).
- Leading `assistant` messages, and leading `user` messages that hold a `tool_result` block, are dropped until the sequence starts on a plain user message. `src/modules/chat/service/message-sequence.ts` (`sanitizeAnthropicSequence` front trim).
- Trailing `assistant` messages that hold a `tool_use` block are dropped. `src/modules/chat/service/message-sequence.ts` (`sanitizeAnthropicSequence` back trim).
- The sanitizer never reorders or rewrites a message. It only drops. `src/modules/chat/service/message-sequence.ts` (`sanitizeAnthropicSequence`).

### Conversation operations
- Creating a conversation takes `title` (a string or `null`), inserts the conversation in a transaction, and returns the stored row. `src/modules/chat/service/conversation.service.ts` (`createConversation`, `CreateConversationInput`).
- Listing conversations takes `limit`, `cursor` (or `null` for the first page) and `includeArchived`, and returns `items` and `nextCursor`. `src/modules/chat/service/conversation.service.ts` (`listConversations`, `ListConversationsInput`, `ListConversationsResult`).
- The listing's cursor is decoded before any read. `src/modules/chat/service/conversation.service.ts` (`listConversations`).
- `nextCursor` is built from the `created_at` and `id` of the page's last conversation when more pages exist, and is `null` otherwise. `src/modules/chat/service/conversation.service.ts` (`listConversations`, `page.hasMore`).
- A conversation cursor is the base64url encoding of the JSON `{ "created_at": <string>, "id": <string> }`. `src/modules/chat/service/conversation.service.ts` (`encodeCursor`, `decodeCursor`).
- Reading one conversation returns the stored row. `src/modules/chat/service/conversation.service.ts` (`getConversation`).
- Updating a conversation takes an optional `title` and an optional `archived_at`. For each, an absent key means no change and `null` means clear. For `title`, a string sets it. For `archived_at`, `null` un-archives. `src/modules/chat/service/conversation.service.ts` (`updateConversation`, `UpdateConversationInput`).
- Deleting a conversation is one delete in a transaction, and succeeds when a row was removed. `src/modules/chat/service/conversation.service.ts` (`deleteConversation`).
- Conversation usage first checks that the conversation exists, then aggregates its usage, both inside one read-only transaction. `src/modules/chat/service/conversation.service.ts` (`getConversationUsage`).

### Rolling summary refresh
- The rolling-summary refresh never raises to its caller. Every failure is absorbed, and the stored `summary_rolling` stays as it was. `src/modules/chat/service/distillation.service.ts` (`maybeRefreshSummary` try/catch).
- The refresh checks in this order: `CHAT_SUMMARY_ENABLED` false → stop; no real turn older than the `CHAT_RECENT_WINDOW` recent window → stop; empty older slice → stop. `src/modules/chat/service/distillation.service.ts` (`maybeRefreshSummary`).
- The refresh does not read `CHAT_SUMMARY_AFTER_TURNS`. `src/modules/chat/service/distillation.service.ts` (`maybeRefreshSummary`, `DistillationEnv`).
- The older slice is bounded by `CHAT_RECENT_WINDOW` and `CHAT_SUMMARY_OVERLAP_M`. The refresh does not sanitize it. `src/modules/chat/service/distillation.service.ts` (`repo.listOlderMessagesForSummaryBounded`).
- The new summary is produced by `CHAT_UTILITY_MODEL`, non-streaming. It uses the summary prompt module chosen by `CHAT_SUMMARY_PROMPT_VERSION`, which receives the previous `summary_rolling` (`null` if none) and the older slice. `src/modules/chat/service/distillation.service.ts` (`selectChatSummaryPromptModule`, `mod.buildUserTurn(summary_prev, newMessages)`, `anthropic.messages.create`).
- The summary text is all the text blocks of the response joined, then trimmed. An empty result writes nothing. `src/modules/chat/service/distillation.service.ts` (`extractText`, `summary_new === ""`).
- A new summary longer than 2000 characters is refused, and `summary_rolling` is left unchanged. `src/modules/chat/service/distillation.service.ts` (`SUMMARY_MAX_CHARS`).
- An accepted summary replaces `summary_rolling`, in a transaction. `src/modules/chat/service/distillation.service.ts` (`repo.updateSummaryRolling`).

### Title distillation
- Title distillation never raises to its caller. `src/modules/chat/service/distillation.service.ts` (`maybeDistillTitle` try/catch).
- Title distillation checks in this order: `CHAT_TITLE_ENABLED` false → stop; conversation absent → stop; conversation already has a `title` → stop; no first user message or no first assistant message → stop; nothing left after sanitizing that pair → stop. `src/modules/chat/service/distillation.service.ts` (`maybeDistillTitle`).
- The title is produced by `CHAT_UTILITY_MODEL`, non-streaming, from the conversation's first user message and first assistant message, with the title prompt module. `src/modules/chat/service/distillation.service.ts` (`repo.getFirstUserAndAssistant`, `selectTitlePromptModule`).
- A candidate title that is empty after trimming, or longer than 80 characters, is silently dropped. `src/modules/chat/service/distillation.service.ts` (`TITLE_MAX_LENGTH`).
- An accepted title is written only if the conversation still has no title, in a transaction. `src/modules/chat/service/distillation.service.ts` (`repo.setTitleIfNull`).

### Graph delta (graph projection of a tool result)
- Five tools produce a graph delta: `traverse`, `get_node`, `list_nodes`, `search` and `ingest_directed`. For any other tool the projection is `null` (no delta), which is not the same as an empty delta. `src/modules/chat/service/graph-normalizer.ts` (`GRAPH_TOOL_NAMES`, `normalizeToolResult`).
- A graph delta carries `source_tool`, `nodes` and `links`. `src/modules/chat/service/graph-normalizer.ts` (`GraphDeltaWire`).
- A node of a graph delta carries `id`, `node_type`, `canonical_name` and `status`. A node with a missing or mistyped field, or with an unknown status, is dropped. `src/modules/chat/service/graph-normalizer.ts` (`GraphNodeWire`, `pickNodeWire`).
- A link of a graph delta carries `id`, `source_node_id`, `target_node_id`, `link_type` and `is_temporal`, plus optional `link_type_label`, `is_in_effect`, `status` and `flags`. `src/modules/chat/service/graph-normalizer.ts` (`GraphLinkWire`).
- A link's `is_temporal` comes from the link-type catalog and is `false` when the link type is not in the catalog. `link_type_label` is the catalog `label` and is left out when the link type is not in the catalog. `src/modules/chat/service/graph-normalizer.ts` (`pickLinkWire`, `catalog.linkTypeByName`).
- On a `traverse` link, `is_in_effect` is passed through when it is a boolean, `status` when it is a string, and `flags` when it is an array of known assertion flags. Otherwise each is left out. `src/modules/chat/service/graph-normalizer.ts` (`pickLinkWire`).
- A `traverse` delta projects the result's `nodes` and `links`. `src/modules/chat/service/graph-normalizer.ts` (`normalizeTraverse`).
- A `get_node` delta projects only the result's `node`, with no links. Aliases and attributes are left out. `src/modules/chat/service/graph-normalizer.ts` (`normalizeGetNode`).
- A `list_nodes` delta projects the result's `items` as nodes, with no links. `total`, `limit` and `offset` are left out. `src/modules/chat/service/graph-normalizer.ts` (`normalizeListNodes`).
- A `search` delta takes only items whose `kind` is `"node"`. It de-duplicates their `id`s in first-appearance order and looks the nodes up in one read, then emits them in search order. An id that is not found is dropped. The delta has no links. `src/modules/chat/service/graph-normalizer.ts` (`normalizeSearch`, `findNodesByIds`).
- The nodes of an `ingest_directed` delta are the result's `run.affected_nodes` (`id`, `canonical_name`, `node_type`), all with `status` `active`. `src/modules/chat/service/graph-normalizer.ts` (`normalizeIngestDirected`).
- The links of an `ingest_directed` delta come from `report[]` entries that meet four conditions: `kind` is `"link"`, `status` is among the accepted directed statuses, `link_id` is a string, and `ref` has the form `<source_ref>-><link_type>-><target_ref>`, split at the first and the last `->`, with no empty part. `src/modules/chat/service/graph-normalizer.ts` (`normalizeIngestDirected`, `ACCEPTED_DIRECTED_STATUSES`).
- The endpoints of an `ingest_directed` link are found through the `ref` → `node_id` of accepted `kind: "node"` report entries. A link with an unresolved endpoint is dropped. The link's `id` is its `link_id`, and it carries no `is_in_effect`, `status` or `flags`. `src/modules/chat/service/graph-normalizer.ts` (`nodeIdByRef`, `normalizeIngestDirected`).

### In-flight turn registry
- In-flight turns are held per conversation id, one abort controller per conversation, in the process only. `src/modules/chat/service/turn-registry.ts` (`registry: Map<string, AbortController>`).
- Registering a conversation replaces any controller already held for it. Looking it up returns the controller, or `undefined` when no turn is in flight. Releasing it removes the entry and does nothing when there is none. `src/modules/chat/service/turn-registry.ts` (`register`, `get`, `release`).

## Answers
- Chat agent service construction — `CHAT_ENABLED === false` → 503 `BUSINESS_CHAT_DISABLED` (message "chat surface is disabled by CHAT_ENABLED=false"). `src/modules/chat/service/chat-agent.service.ts` (`createChatAgentService`); `src/modules/chat/service/errors.ts` (`ChatDisabledError`).
- `runTurn`, before the stream opens — the model client factory throws → 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (message "chat provider is temporarily unavailable"). `src/modules/chat/service/chat-agent.service.ts` (`getClient`); `src/modules/chat/service/errors.ts` (`ChatProviderUnavailableError`).
- `runTurn`, in the stream — the model stream fails with an error that is not an abort, while the turn is not aborted → SSE `error` event `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (message "chat provider is temporarily unavailable", `synthetic_stop_reason` `provider_error`). `src/modules/chat/service/chat-agent.service.ts` (`terminateError`).
- `runTurn`, in the stream — the model stream ends with no final message → SSE `error` event `SYSTEM_INTERNAL_ERROR` (message "chat stream produced no final message", `synthetic_stop_reason` `internal_error`). `src/modules/chat/service/chat-agent.service.ts` (`finalMessage === undefined`).
- `runTurn`, in the stream — any uncaught exception in the loop → SSE `error` event `SYSTEM_INTERNAL_ERROR` (message "chat encountered an internal error", `synthetic_stop_reason` `internal_error`). `src/modules/chat/service/chat-agent.service.ts` (`catch (err)`).
- `runTurn` — turn wall-clock `TURN_TIMEOUT_MS` expires → `done` with `stop_reason` `turn_timeout`. `src/modules/chat/service/chat-agent.service.ts` (`TURN_TIMEOUT_REASON`).
- `runTurn` — client cancel → `done` with `stop_reason` `cancelled`. `src/modules/chat/service/chat-agent.service.ts` (`externalAbortListener`).
- `runTurn` — `MAX_ITERATIONS` reached and another model call is due → `done` with `stop_reason` `max_iterations`. `src/modules/chat/service/chat-agent.service.ts` (`iteration > ctx.env.MAX_ITERATIONS`).
- Tool dispatch in a turn — the model names a tool not in the catalog → the tool envelope `{ ok: false, error: { code: "VALIDATION_INVALID_FORMAT", message: "unknown tool name" } }` goes back to the model, and the turn continues. `src/modules/chat/service/chat-agent.service.ts` (`tool === undefined`).
- Tool dispatch in a turn — the tool exceeds `TOOL_TIMEOUT_MS` → the tool envelope `{ ok: false, error: { code: "SYSTEM_SERVICE_UNAVAILABLE", message: "tool timeout" } }`, and the turn continues. `src/modules/chat/service/chat-agent.service.ts` (`raceToolHandler`).
- Tool dispatch in a turn — the tool throws → the tool envelope `{ ok: false, error: { code: "SYSTEM_INTERNAL_ERROR", message: <error message> or "tool handler threw" } }`, and the turn continues. `src/modules/chat/service/chat-agent.service.ts` (`synthesiseInternalErrorEnvelope`).
- List conversations — the cursor is not valid JSON once decoded → 422 `VALIDATION_INVALID_FORMAT` (`param` `cursor`, message "invalid cursor: not valid JSON"). `src/modules/chat/service/conversation.service.ts` (`decodeCursor`, `InvalidCursorError`).
- List conversations — the decoded cursor is not an object with string `created_at` and string `id` → 422 `VALIDATION_INVALID_FORMAT` (`param` `cursor`, message "invalid cursor: expected shape { created_at, id }"). `src/modules/chat/service/conversation.service.ts` (`decodeCursor`).
- List conversations — base64url decoding throws → 422 `VALIDATION_INVALID_FORMAT` (`param` `cursor`, message "invalid cursor: not valid base64url"). `src/modules/chat/service/conversation.service.ts` (`decodeCursor`).
- Get conversation — no conversation with that id → 404 `RESOURCE_NOT_FOUND` (message "conversation <id> not found", `conversationId`). `src/modules/chat/service/conversation.service.ts` (`getConversation`); `src/modules/chat/service/errors.ts` (`ConversationNotFoundError`).
- Update conversation — no conversation with that id → 404 `RESOURCE_NOT_FOUND` (message "conversation <id> not found"). `src/modules/chat/service/conversation.service.ts` (`updateConversation`).
- Delete conversation — no row deleted → 404 `RESOURCE_NOT_FOUND` (message "conversation <id> not found"). `src/modules/chat/service/conversation.service.ts` (`deleteConversation`).
- Conversation usage — no conversation with that id, checked before the aggregation → 404 `RESOURCE_NOT_FOUND` (message "conversation <id> not found"). `src/modules/chat/service/conversation.service.ts` (`getConversationUsage`).
- Chat error defined here but raised by a caller outside this area — the conversation is archived → 409 `BUSINESS_CONVERSATION_ARCHIVED` (message "conversation is archived; un-archive via PATCH /conversations/:id { archived_at: null }"). `src/modules/chat/service/errors.ts` (`ConversationArchivedError`).
- Chat error defined here but raised by a caller outside this area — a turn is already in flight → 409 `BUSINESS_TURN_IN_PROGRESS` (message "another turn is currently in progress on this conversation"). `src/modules/chat/service/errors.ts` (`TurnInProgressError`).
- Chat error defined here but raised by a caller outside this area — an idempotency key is reused with different content or model → 409 `BUSINESS_IDEMPOTENCY_MISMATCH` (message "Idempotency-Key matches an existing request with different content or model"). `src/modules/chat/service/errors.ts` (`IdempotencyMismatchError`).
- Any chat error → an envelope of `code` and `message` only (no `details`), with the error's status. `src/modules/chat/service/errors.ts` (`mapChatError`).
- Graph projection — `search` without a database client → a rejected promise with the message "normalizeToolResult: search requires a PoolClient to hydrate items". `src/modules/chat/service/graph-normalizer.ts` (`normalizeToolResult`).
- Rolling summary refresh — the summary prompt version is unknown, the model call fails, a read or the write fails, or the output is over 2000 characters → nothing is returned to the caller, and `summary_rolling` is unchanged. `src/modules/chat/service/distillation.service.ts` (`maybeRefreshSummary`).
- Title distillation — any failure, or an empty or over-80-character candidate → nothing is returned to the caller, and the title stays unset. `src/modules/chat/service/distillation.service.ts` (`maybeDistillTitle`).

## Vocabularies
- Chat event type: `llm_start`, `text_delta`, `tool_start`, `tool_result`, `done`, `error`, `iteration_end`, `graph_delta`. `src/modules/chat/service/types.ts` (`ChatEvent`).
- Terminal stop reason on `done`: `end_turn`, `max_tokens`, `stop_sequence`, `max_iterations`, `turn_timeout`, `cancelled`. `src/modules/chat/service/types.ts` (`DoneStopReason`).
- Synthetic stop reason on `error`: `provider_error`, `internal_error`. `src/modules/chat/service/types.ts` (`ErrorSyntheticStopReason`).
- Turn stats stop reason: every terminal stop reason plus `provider_error` and `internal_error`. `src/modules/chat/service/types.ts` (`ChatRunStats`).
- Chat query tools: `get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types`, `list_attribute_keys`, `search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`. `src/modules/chat/service/tool-catalog.ts` (`CHAT_TOOL_NAMES`).
- Chat ingestion tools: `ingest_directed`. `src/modules/chat/service/tool-catalog.ts` (`CHAT_INGEST_TOOL_NAMES`).
- Toolsets the chat catalog draws from: `query`, `ingest`. `src/modules/chat/service/tool-catalog.ts` (`CHAT_QUERY_TOOLSET`, `CHAT_INGEST_TOOLSET`).
- Graph-producing tools: `traverse`, `get_node`, `list_nodes`, `search`, `ingest_directed`. `src/modules/chat/service/graph-normalizer.ts` (`GRAPH_TOOL_NAMES`).
- Node status on a graph delta: `active`, `needs_review`, `merged`, `deleted`. `src/modules/chat/service/graph-normalizer.ts` (`GraphNodeWire`, `isNodeStatus`).
- Assertion flags on a graph-delta link: `uncertain`, `disputed`, `low_confidence`. `src/modules/chat/service/graph-normalizer.ts` (`ASSERTION_FLAGS`).
- Directed item statuses that count as persisted for a graph delta: `accepted`, `consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`. `src/modules/chat/service/graph-normalizer.ts` (`ACCEPTED_DIRECTED_STATUSES`).
- Chat error codes: `BUSINESS_CHAT_DISABLED` (503), `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (503), `RESOURCE_NOT_FOUND` (404), `BUSINESS_CONVERSATION_ARCHIVED` (409), `BUSINESS_TURN_IN_PROGRESS` (409), `BUSINESS_IDEMPOTENCY_MISMATCH` (409). `src/modules/chat/service/errors.ts` (`ChatError`).
- Codes the turn loop sends in its own failure envelopes and events: `VALIDATION_INVALID_FORMAT`, `SYSTEM_SERVICE_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. `src/modules/chat/service/chat-agent.service.ts` (`raceToolHandler`, `terminateError`).
- Message roles read and written by the sanitizer and the context: `user`, `assistant`. `src/modules/chat/service/message-sequence.ts` (`sanitizeAnthropicSequence`); `src/modules/chat/service/context-builder.ts` (`buildModelContext`).
- Invocation context keys: `source_excerpt`, `pointer` (`conversation_id`, `message_id`). `src/modules/chat/service/chat-agent.service.ts` (`invocationContext`); `src/modules/chat/service/types.ts` (`ChatRunInput`).

## Upstream artifacts
- The model provider's streaming Messages API. The chat code reads its `text`, `error`, `abort` and `end` events and a final message with `model`, `stop_reason` (`end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, others), `usage.input_tokens`, `usage.output_tokens` and `content` blocks of type `text` and `tool_use` (`id`, `name`, `input`). Abort errors are named `AbortError` or `APIUserAbortError`. `src/modules/chat/service/chat-agent.service.ts` (`ChatMessageStream`, `mapStopReason`, `isAbortError`).
- The model provider's non-streaming `messages.create` with `stream: false`, which returns `content` blocks of type `text`. `src/modules/chat/service/distillation.service.ts` (`AnthropicUtilityLike`, `extractText`).
- The MCP tool registry: `getTool(toolset, name)` returns a tool with `handler`, `inputSchema` and `description`. `src/modules/chat/service/tool-catalog.ts` (`buildChatToolCatalog`); `src/modules/chat/service/chat-agent.service.ts` (`buildToolDescriptors`).
- The tool envelope `{ ok, result }` / `{ ok, error: { code, message, details? } }` that the query and ingest tool handlers return. `src/modules/chat/service/chat-agent.service.ts` (`ToolEnvelope`, `coerceEnvelope`).
- Tool result shapes the graph projection reads: `traverse` `{ nodes, links }`; `get_node` `{ node }`; `list_nodes` `{ items }`; `search` `{ items: [{ kind, id }] }`; `ingest_directed` `{ run: { affected_nodes: [{ id, canonical_name, node_type }] }, report: [{ ref, kind, status, node_id, link_id }] }`. `src/modules/chat/service/graph-normalizer.ts` (`normalizeTraverse`, `normalizeGetNode`, `normalizeListNodes`, `normalizeSearch`, `normalizeIngestDirected`).
- The knowledge-graph link-type catalog snapshot, `linkTypeByName` with `is_temporal` and `label`. `src/modules/chat/service/graph-normalizer.ts` (`CatalogSnapshot`).
- The knowledge-graph node lookup `findNodesByIds`, whose rows carry `id`, `node_type`, `canonical_name` and `status`. `src/modules/chat/service/graph-normalizer.ts` (`normalizeSearch`).
- The chat repository calls this area makes: `insertConversation`, `listConversations` (returns `items`, `hasMore`), `getConversationById`, `updateConversation`, `deleteConversation` (returns a row count), `getConversationUsage`, `listRecentRealTurns`, `countRealTurnsOlderThanRecentWindow`, `listOlderMessagesForSummaryBounded`, `updateSummaryRolling`, `getFirstUserAndAssistant`, `setTitleIfNull`. The conversation fields read are `id`, `title`, `summary_rolling` and `created_at`; the message fields read are `role` and `content`. `src/modules/chat/service/conversation.service.ts`, `src/modules/chat/service/context-builder.ts`, `src/modules/chat/service/distillation.service.ts` (`repo.*`).
- Chat prompt modules: `selectChatPromptModule`, `CHAT_PROMPT_MARKER_V1`, `selectChatSummaryPromptModule` (with `system` and `buildUserTurn`) and `selectTitlePromptModule`. `src/modules/chat/service/chat-agent.service.ts`, `src/modules/chat/service/output-guard.ts`, `src/modules/chat/service/distillation.service.ts` (imports).
- Environment keys this area reads: `CHAT_ENABLED`, `ANTHROPIC_API_KEY`, `CHAT_PROMPT_VERSION`, `TURN_TIMEOUT_MS`, `MAX_ITERATIONS`, `TOOL_TIMEOUT_MS`, `TOOL_RESULT_MAX_CHARS`, `CHAT_INGEST_ENABLED`, `CHAT_UTILITY_MODEL`, `CHAT_RECENT_WINDOW`, `CHAT_SUMMARY_AFTER_TURNS` (declared, not read), `CHAT_SUMMARY_ENABLED`, `CHAT_TITLE_ENABLED`, `CHAT_SUMMARY_OVERLAP_M`, `CHAT_SUMMARY_PROMPT_VERSION`. `src/modules/chat/service/chat-agent.service.ts`, `src/modules/chat/service/tool-catalog.ts`, `src/modules/chat/service/distillation.service.ts` (`DistillationEnv`).

## Outside the domain
- Prompt caching with `cache_control: { type: "ephemeral" }` on the first system block, or on the single block when `system` is a string; the date-time block carries none (cost wiring). `src/modules/chat/service/chat-agent.service.ts`, `src/modules/chat/service/context-builder.ts`.
- Per-call `max_tokens` caps of 4096 (turn), 600 (summary) and 64 (title) (performance caps). `src/modules/chat/service/chat-agent.service.ts`, `src/modules/chat/service/distillation.service.ts`.
- Zod → JSON Schema conversion with `target: "draft-7"` and `$schema` removed (framework wiring). `src/modules/chat/service/chat-agent.service.ts`.
- Log events: `chat.provider_factory_failed`, `chat.provider_stream_error`, `chat.iteration_usage`, `chat.loop_internal_error`, `chat.tool_schema_invalid_root`, `chat.tool_schema_non_object_root`, `chat.tool_schema_has_defs`, `chat.tool_schema_conversion_failed` (logging). `src/modules/chat/service/chat-agent.service.ts`.
- Log event `chat.output_guard_drop` with `marker_version` `v1` (logging). `src/modules/chat/service/output-guard.ts`.
- Log events `chat.summary_refresh_overflow`, `chat.summary_refresh_fold`, `chat.summary_refresh_failure` (with `phase` `fetch_slice`/`model_call`/`persist`), `chat.title_distillation_success`, `chat.title_distillation_failure` (logging). `src/modules/chat/service/distillation.service.ts`.
- Log event `chat.tool_catalog_partial_resolution` (logging). `src/modules/chat/service/tool-catalog.ts`.
- Log levels per chat error in `mapChatError`: `warn`, and `error` for provider unavailable (logging). `src/modules/chat/service/errors.ts`.
- The stats accumulator and the `lastStats` accessor (observability). `src/modules/chat/service/chat-agent.service.ts`.
- The reuse of the ingestion `AnthropicFactory` / `defaultAnthropicFactory` seam, and the `now` injection (wiring). `src/modules/chat/service/chat-agent.service.ts`, `src/modules/chat/service/types.ts`.
- The `withReadOnly`/`withTransaction` helpers from curation (transaction wiring). `src/modules/chat/service/conversation.service.ts`, `src/modules/chat/service/context-builder.ts`, `src/modules/chat/service/distillation.service.ts`.
- The Intl formatter choices (`en-CA`, `shortOffset`, `hourCycle: "h23"`) (implementation). `src/modules/chat/service/datetime-block.ts`.
- Catalog memoization and freezing (implementation). `src/modules/chat/service/tool-catalog.ts`.
- Test-only helpers `__resetChatToolCatalogForTests`, `size` and `clearForTests` (tests). `src/modules/chat/service/tool-catalog.ts`, `src/modules/chat/service/turn-registry.ts`.

## Observed and not decided here
- On a malformed tool result, graph projection answers two ways. `traverse`, `get_node`, `list_nodes` and `search` return an empty delta `{ source_tool, nodes: [], links: [] }` (`src/modules/chat/service/graph-normalizer.ts`, `normalizeTraverse`/`normalizeGetNode`/`normalizeListNodes`/`normalizeSearch`). `ingest_directed` returns `null`, which means no delta (`src/modules/chat/service/graph-normalizer.ts`, `normalizeIngestDirected`, `if (!isRecord(result)) return null`).
- The argument summary and the catalog disagree on ingestion tools. The summary formats `start_async_ingestion` (`source_type=… content_len=…`) and `get_ingestion_status` (`llm_run_id=…`) (`src/modules/chat/service/args-summary.ts`, `formatByTool`). The chat catalog offers only `ingest_directed` for ingestion (`src/modules/chat/service/tool-catalog.ts`, `CHAT_INGEST_TOOL_NAMES`), and the summary has no case for it, so it falls to `<n> keys` (`src/modules/chat/service/args-summary.ts`, `default` → `fallbackSummary`).
- "Characters" are counted two ways. The argument summary cap (200) and tool-result truncation (`TOOL_RESULT_MAX_CHARS`) count Unicode code points (`src/modules/chat/service/args-summary.ts`, `clampToMax`; `src/modules/chat/service/truncate-tool-result.ts`, `[...input]`). The rolling-summary cap (2000) and the title cap (80) use the string's `.length`, which counts UTF-16 code units (`src/modules/chat/service/distillation.service.ts`, `summary_new.length > SUMMARY_MAX_CHARS`, `candidate.length > TITLE_MAX_LENGTH`).
