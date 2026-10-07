---
type: api
direction: consumed
upstream: contracts/knowledge-base/entity-editing
operations:
- edit-entity
answers:
- operation: edit-entity
  accepted: "POST /api/v1/nodes/{node_id}/edit with the node id URL-encoded in the path and a JSON body { reason, changes }, each change carrying attribute_key, kind, value, item_id, valid_from and valid_to, answered with the accepted answer the upstream publishes"
  refusals:
  - when: "The answer is not 2xx and its body carries a readable error code."
    answer: "that status with the code, message and details read from the body { ok: false, error: { code, message, details } }, a BUSINESS_ENTITY_EDIT_CONFLICT carrying details { attribute_key, item_id } with item_id null where the conflict names no item"
  - rule: "rules/application-shell/a-request-is-cut-off-after-thirty-seconds"
    answer: "a failure SYSTEM_TIMEOUT reading \"Tempo limite excedido na requisição.\""
  - when: "The request is cancelled by its caller before an answer."
    answer: "a failure SYSTEM_ABORTED reading \"Requisição cancelada.\""
  - when: "The request gets no answer for any other cause."
    answer: "a failure SYSTEM_NETWORK reading \"Falha de rede ao contactar o servidor.\""
  - rule: "rules/application-shell/a-failed-refresh-ends-the-session"
    answer: "HTTP 401 with the failure AUTH_SESSION_EXPIRED reading \"Sua sessão expirou. Faça login novamente.\""
  - when: "The answer is 2xx and its body is not JSON."
    answer: "that status with the failure SYSTEM_INVALID_RESPONSE reading \"Resposta do servidor não é JSON válido.\""
  - when: "The answer has status 500 or above and its body carries no readable error code."
    answer: "that status with the failure SYSTEM_UPSTREAM reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 2xx, is below status 500 and its body carries no readable error code, a second 401 included."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
---

## Description

The write the entity workspace makes of the knowledge base: one edit carrying every change the owner reviewed, under one reason.
The upstream publishes what each answer carries, and this contract states only how the screen sends the edit and reads the answer.
