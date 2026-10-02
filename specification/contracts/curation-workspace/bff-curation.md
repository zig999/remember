---
type: api
direction: consumed
upstream: contracts/knowledge-base/curation
operations:
- send-curation-request
- list-review-queue
- read-curation-metrics
- resolve-entity-match
- merge-nodes
- resolve-dispute
- confirm-item
- reject-item
- correct-item
answers:
- operation: send-curation-request
  accepted: "the 2xx JSON body of the answer is the answer itself and is never unwrapped from { ok, result }, and a 204 answer gives no value"
  refusals:
  - rule: "rules/curation-workspace/curation-request-times-out-after-thirty-seconds"
    answer: "a failure SYSTEM_TIMEOUT reading \"Tempo limite excedido na requisição.\""
  - when: "The request is cancelled by its caller before an answer."
    answer: "a failure SYSTEM_ABORTED reading \"Requisição cancelada.\""
  - when: "The request gets no answer for any other cause."
    answer: "a failure SYSTEM_NETWORK reading \"Falha de rede ao contactar o servidor.\""
  - rule: "rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in"
    answer: "HTTP 401 with the failure AUTH_SESSION_EXPIRED reading \"Sua sessão expirou. Faça login novamente.\""
  - when: "The answer is 2xx and its body is not JSON."
    answer: "that status with the failure SYSTEM_INVALID_RESPONSE reading \"Resposta do servidor não é JSON válido.\""
  - when: "The answer is not 2xx and its body carries an error object with a string code."
    answer: "that status with the code, the details and, when it is a string, the message of the error object, otherwise a message for the status"
  - when: "The answer has status 500 or above and its body carries no readable error code."
    answer: "that status with the failure SYSTEM_UPSTREAM reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 2xx, is below status 500 and its body carries no readable error code, a second 401 included."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
- operation: list-review-queue
  accepted: "GET /api/v1/curation/queue with kind, limit and offset sent only when given, read as total, limit, offset and items, an entity-match entry with its node id, node type, canonical name, candidates (candidate node id, canonical name and similarity) and creation time, and any other entry as a dispute with its item kind, scope (source node id, target node id, link type, node id and attribute key), sides (item id, value, target node id, valid-from, valid-to, valid-from basis, confidence and status) and creation time"
- operation: read-curation-metrics
  accepted: "GET /api/v1/curation/metrics read as accept_rate, reject_rate_by_code, needs_review_count, uncertain_count, disputed_count, entity_match_queue_count, disputed_queue_count and computed_at"
- operation: resolve-entity-match
  accepted: "POST /api/v1/curation/entity-matches/{node_id}/resolve with the node id path-encoded and a JSON body of decision, an optional target_node_id and an optional reason, read as node_id, decision, resulting_status, an optional target_node_id, action_id and optional counts links_repointed, attributes_repointed, aliases_copied and path_compressed_nodes"
- operation: merge-nodes
  accepted: "POST /api/v1/curation/nodes/merge with a JSON body of survivor_id, absorbed_id and reason, read as survivor_id, absorbed_id, the four counts and action_id"
- operation: resolve-dispute
  accepted: "POST /api/v1/curation/disputes/resolve with a JSON body of item_kind, item_ids, decision, an optional winner_id, an optional reason and optional periods, read as item_kind, decision, action_id and items each with item_id, resulting_status and optional valid_from and valid_to"
- operation: confirm-item
  accepted: "POST /api/v1/curation/items/confirm with a JSON body of item_kind, item_id and an optional reason, read as item_kind, item_id, resulting_status and action_id"
- operation: reject-item
  accepted: "POST /api/v1/curation/items/reject with a JSON body of item_kind, item_id and a required reason, read as item_kind, item_id, resulting_status and action_id"
- operation: correct-item
  accepted: "POST /api/v1/curation/items/correct with a JSON body of item_kind, item_id, a required reason and the corrected values value, target_node_id, valid_from, valid_to, valid_from_source and valid_from_fragment_id, all optional, read as item_kind, predecessor_id, new_item_id and action_id"
---

## Description

The requests the curation screen makes to the back end and how it reads the answers.
The upstream publishes what each answer carries, and this contract states only how the screen sends and reads it.
