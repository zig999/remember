---
type: api
direction: consumed
upstream: contracts/chat/conversations
operations:
- send-message
- cancel-turn
- create-conversation
- list-conversations
- read-conversation
- update-conversation
- delete-conversation
- list-messages
- read-conversation-usage
answers:
- operation: send-message
  accepted: "POST /api/v1/conversations/{id}/messages with the id URL-encoded, the JSON body { content } with model only when the caller names one, Content-Type application/json, Accept text/event-stream and an Idempotency-Key header, answered by a stream of event and data frames read as llm_start, text_delta (delta), tool_start (tool, args_summary), tool_result (ok), done (stop_reason), error (code, message) and graph_delta (source_tool, nodes, links)"
  refusals:
  - when: "The request cannot be sent and was not aborted."
    answer: "an error frame SYSTEM_NETWORK reading \"Falha de rede ao contactar o servidor.\""
  - when: "The owner aborts before the answer arrives or while the stream is read."
    answer: "no frame, the stream ending quietly"
  - when: "The answer has no body, whatever its status."
    answer: "an error frame SYSTEM_INVALID_RESPONSE reading \"Resposta do servidor sem corpo.\""
  - when: "The answer is not 2xx and its body is the failure envelope."
    answer: "an error frame with the envelope's own code and message, a missing or non-string field falling back to the fallback for the status"
  - when: "The answer has status 500 or above and no readable envelope."
    answer: "an error frame SYSTEM_UPSTREAM reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 2xx, is below status 500 and has no readable envelope, a 401 included."
    answer: "an error frame SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
  - when: "Reading the stream fails and was not aborted."
    answer: "an error frame SYSTEM_NETWORK reading \"Falha de rede durante o streaming.\" and the stream ending"
- operation: cancel-turn
  accepted: "POST /api/v1/conversations/{id}/cancel with no body, answered { cancelled: true }"
- operation: create-conversation
  accepted: "POST /api/v1/conversations with the JSON body { title } or {}, answered with a conversation read as id, title, archived_at and created_at, the rolling summary and the update time not kept"
- operation: list-conversations
  accepted: "GET /api/v1/conversations with limit, cursor and include_archived sent only when given, answered with items and next_cursor"
- operation: read-conversation
  accepted: "GET /api/v1/conversations/{id} with the id URL-encoded, answered with a conversation"
- operation: update-conversation
  accepted: "PATCH /api/v1/conversations/{id} with the JSON body of title and archived_at as supplied, answered with a conversation"
- operation: delete-conversation
  accepted: "DELETE /api/v1/conversations/{id} with no body, where only HTTP 204 is a success"
  refusals:
  - when: "The request is aborted."
    answer: "a failure SYSTEM_ABORTED with HTTP status 0 reading \"Requisição cancelada.\""
  - when: "The request cannot be sent."
    answer: "a failure SYSTEM_NETWORK with HTTP status 0 reading \"Falha de rede ao contactar o servidor.\""
  - when: "The answer is not 204 and its body is the failure envelope."
    answer: "a failure carrying the answer's status and the envelope's code, message and details"
  - when: "The answer is not 204, has status 500 or above and no envelope."
    answer: "a failure SYSTEM_UPSTREAM with the answer's status reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 204, is below status 500 and has no envelope, a 200 included."
    answer: "a failure SYSTEM_UNKNOWN with the answer's status reading \"Erro desconhecido do servidor.\""
- operation: list-messages
  accepted: "GET /api/v1/conversations/{id}/messages with limit and before sent only when given, answered with items, each read as id, conversation_id, role, content blocks, stop_reason, idempotency_key, model, tokens_in, tokens_out, latency_ms and created_at, and next_before"
- operation: read-conversation-usage
  accepted: "GET /api/v1/conversations/{id}/usage answered with messages (kept as the message count), tokens_in, tokens_out and tool_calls"
---

## Description

The requests the chat screen makes to the back end and how it reads the answers.
The upstream publishes what each answer carries, and this contract states only how the screen sends and reads it.
