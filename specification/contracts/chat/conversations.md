---
type: api
direction: published
operations:
- create-conversation
- list-conversations
- read-conversation
- update-conversation
- delete-conversation
- send-message
- list-messages
- read-conversation-usage
- read-graph-view
- save-graph-view
- cancel-turn
answers:
- operation: create-conversation
  accepted: 'HTTP 201 with `{ ok: true, result }` carrying the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }`, the body optional and unknown keys ignored'
  refusals:
  - &id001
    when: The chat is disabled.
    answer: HTTP 503, error code BUSINESS_CHAT_DISABLED with message "chat surface is disabled by CHAT_ENABLED=false" and no details, answered before anything else is checked
  - rule: rules/chat/conversation-title-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: The title is null or not a string, or the body is not an object.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - &id002
    when: The store is unreachable or a statement times out.
    answer: HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."
  - &id003
    when: The operation fails for any other cause.
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause
- operation: list-conversations
  accepted: 'HTTP 200 with `{ ok: true, result: { items, next_cursor } }`, each item the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }`, and `next_cursor` an opaque cursor after the last item when more conversations follow and null otherwise'
  refusals:
  - *id001
  - rule: rules/chat/conversation-listing-limit
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: '`include_archived` is neither a boolean nor "true" or "false".'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: The cursor does not decode to a creation time and an identity written as text.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with a message naming why the cursor is invalid and `details: { param: "cursor" }`'
  - *id002
  - *id003
- operation: read-conversation
  accepted: 'HTTP 200 with `{ ok: true, result }` carrying the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }`, archived or not'
  refusals:
  - *id001
  - &id004
    when: The conversation identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - &id005
    when: No conversation is held at the identity.
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "conversation not found" and `details: { id }`'
  - *id002
  - *id003
- operation: update-conversation
  accepted: 'HTTP 200 with `{ ok: true, result }` carrying the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }` as updated'
  refusals:
  - *id001
  - *id004
  - when: The body is empty.
    answer: 'HTTP 422, error code VALIDATION_REQUIRED_FIELD with message "at least one of title or archived_at must be present" and `details: { body: "PATCH /conversations/:id" }`'
  - rule: rules/chat/conversation-update-names-a-field
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - rule: rules/chat/conversation-title-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: The archiving time is neither an ISO-8601 datetime nor null.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - *id005
  - *id002
  - *id003
- operation: delete-conversation
  accepted: HTTP 204 with no body, the conversation removed with its messages, tool calls and graph view
  refusals:
  - *id001
  - *id004
  - *id005
  - *id002
  - *id003
- operation: send-message
  accepted: 'HTTP 200 as a server-sent event stream (`text/event-stream; charset=utf-8`), each frame `event: <name>` then `data: <json>`: `llm_start { iteration }`, `text_delta { delta }`, `tool_start { tool, args_summary }`, `tool_result { tool, ok }`, `graph_delta { source_tool, nodes, links }` with each node `{ id, node_type, canonical_name, status }` and each link `{ id, source_node_id, target_node_id, link_type, is_temporal }` plus `link_type_label`, `is_in_effect`, `status` and `flags` where known, and exactly one closing `done { stop_reason, model, tokens_in, tokens_out }` or `error { code, message }`, the stop reason as `end_turn`, `max_tokens`, `stop_sequence`, `max_iterations`, `turn_timeout` or `cancelled`, tool arguments, tool results and content blocks never sent; a replay streams `llm_start { iteration: 1 }`, the recorded text as one `text_delta` when it is not empty, and `done` with the recorded stop reason, model (`""` when none) and tokens (0 when none), or, for a turn recorded as provider-error or internal-error, the `error` frame that turn closed with'
  refusals:
  - when: The chat is disabled.
    answer: HTTP 503, error code BUSINESS_CHAT_DISABLED with message "chat surface is disabled by CHAT_ENABLED=false" and no details
  - when: The Idempotency-Key header is missing or empty.
    answer: 'HTTP 422, error code VALIDATION_REQUIRED_FIELD with message "Idempotency-Key header is required" and `details: { header: "Idempotency-Key" }`'
  - when: The Idempotency-Key header is not a well-formed identifier.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Idempotency-Key must be a valid UUID" and `details: { header: "Idempotency-Key", received }`'
  - *id004
  - when: The content is empty or longer than the configured maximum, or the model is empty.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`, the messages "content must be a non-empty string" and "content must be at most N characters"
  - *id005
  - &id006
    rule: rules/chat/archived-conversation-takes-no-turn
    answer: 'HTTP 409, error code BUSINESS_CONVERSATION_ARCHIVED with message "conversation is archived; un-archive via PATCH /conversations/:id { archived_at: null }" and no details'
  - rule: rules/chat/one-turn-in-flight
    answer: HTTP 409, error code BUSINESS_TURN_IN_PROGRESS with message "another turn is currently in progress on this conversation" and no details, also when a concurrent request under the same key recorded the message first and its turn has not ended
  - rule: rules/chat/idempotency-match
    answer: HTTP 409, error code BUSINESS_IDEMPOTENCY_MISMATCH with message "Idempotency-Key matches an existing request with different content or model" and no details
  - rule: rules/chat/chat-toolset-requires-every-query-tool
    answer: HTTP 404, error code RESOURCE_NOT_FOUND with message "chat surface is not available on this deployment" and no details
  - when: The model provider cannot be reached when the turn starts.
    answer: HTTP 503, error code BUSINESS_CHAT_PROVIDER_UNAVAILABLE with message "chat provider is temporarily unavailable" and no details
  - when: The model provider fails while the turn streams.
    answer: 'an `error` frame `{ code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE", message: "chat provider is temporarily unavailable" }` in the HTTP 200 stream'
  - when: The model stream ends with no final message.
    answer: 'an `error` frame `{ code: "SYSTEM_INTERNAL_ERROR", message: "chat stream produced no final message" }` in the HTTP 200 stream'
  - when: The turn fails for any other cause after streaming started.
    answer: 'an `error` frame `{ code: "SYSTEM_INTERNAL_ERROR", message: "chat encountered an internal error" }` in the HTTP 200 stream'
  - *id002
  - *id003
- operation: list-messages
  accepted: 'HTTP 200 with `{ ok: true, result: { items, next_before } }`, each item `{ id, conversation_id, role, content, stop_reason, idempotency_key, model, tokens_in, tokens_out, latency_ms, created_at }` with `content` a list of content blocks, and `next_before` the creation time of the oldest item when older messages remain and null otherwise'
  refusals:
  - *id001
  - *id004
  - rule: rules/chat/message-listing-limit
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: '`before` is not an ISO-8601 datetime.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - *id005
  - *id002
  - *id003
- operation: read-conversation-usage
  accepted: 'HTTP 200 with `{ ok: true, result: { messages, tokens_in, tokens_out, tool_calls } }`, zeros for a conversation with no messages'
  refusals:
  - *id001
  - *id004
  - *id005
  - *id002
  - *id003
- operation: read-graph-view
  accepted: 'HTTP 200 with `{ ok: true, result }` carrying the saved snapshot, or null when none was saved'
  refusals:
  - *id001
  - *id004
  - *id005
  - *id002
  - *id003
- operation: save-graph-view
  accepted: 'HTTP 200 with `{ ok: true, result: { updated_at } }`; the snapshot is `{ version, nodes, links, positions, user_pinned }`, version 1 or 2, `nodes` and `links` lists of objects each with a string `id` and kept whole, `positions` an object from node identity to `{ x, y }`, `user_pinned` a list of strings, and for version 2 `layout_algorithm` one of `force`, `tree` or `radial`, unknown top-level keys dropped'
  refusals:
  - *id001
  - *id004
  - rule: rules/chat/graph-view-snapshot-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "invalid graph view snapshot" and `details` the flattened validation issues
  - when: The snapshot names an unknown version, or its positions, pinned nodes or version-2 layout are malformed.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "invalid graph view snapshot" and `details` the flattened validation issues, answered before the conversation is looked up
  - *id005
  - *id002
  - *id003
- operation: cancel-turn
  accepted: 'HTTP 202 with `{ ok: true, result: { cancelled: true } }`'
  refusals:
  - *id001
  - *id004
  - *id005
  - *id006
  - rule: rules/chat/cancel-requires-turn-in-flight
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "no in-flight turn for this conversation" and `details: { id }`'
  - *id002
  - *id003
---

## Description

The owner's conversation surface: creating, listing, reading, updating and deleting conversations, sending a message and streaming the assistant's answer, listing messages, reading usage, reading and saving the graph view, and cancelling a turn.
It is carried by REST alone.
