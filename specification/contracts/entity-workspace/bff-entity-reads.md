---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- list-node-types
- list-nodes
- read-node
- list-attribute-keys
answers:
- operation: list-node-types
  accepted: "GET /api/v1/node-types with no query parameter"
  refusals:
  - when: "The answer is not 2xx, or is 2xx with a JSON body whose ok is not true, and its body carries a readable error code."
    answer: "that status with the code, message and details read from the body { ok: false, error: { code, message, details } }"
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
  - when: "The answer is below status 500, is not 2xx or is 2xx with a JSON body whose ok is not true, and its body carries no readable error code, a second 401 included."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
- operation: list-nodes
  accepted: "GET /api/v1/nodes"
  refusals:
  - when: "The answer is not 2xx, or is 2xx with a JSON body whose ok is not true, and its body carries a readable error code."
    answer: "that status with the code, message and details read from the body { ok: false, error: { code, message, details } }"
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
  - when: "The answer is below status 500, is not 2xx or is 2xx with a JSON body whose ok is not true, and its body carries no readable error code, a second 401 included."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
- operation: read-node
  accepted: "GET /api/v1/nodes/{node_id} with the node id URL-encoded in the path and no query parameter"
  refusals:
  - when: "The answer is not 2xx, or is 2xx with a JSON body whose ok is not true, and its body carries a readable error code."
    answer: "that status with the code, message and details read from the body { ok: false, error: { code, message, details } }"
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
  - when: "The answer is below status 500, is not 2xx or is 2xx with a JSON body whose ok is not true, and its body carries no readable error code, a second 401 included."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
- operation: list-attribute-keys
  accepted: "GET /api/v1/attribute-keys with the node type named by its name in the node_type query parameter, read through the { ok, result } envelope as total and items, the items ordered by node type name and then by key"
  refusals:
  - when: "The answer is not 2xx, or is 2xx with a JSON body whose ok is not true, and its body carries a readable error code."
    answer: "that status with the code, message and details read from the body { ok: false, error: { code, message, details } }"
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
  - when: "The answer is below status 500, is not 2xx or is 2xx with a JSON body whose ok is not true, and its body carries no readable error code, a second 401 included."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
---

## Description

The reads the entity workspace makes of the knowledge base: the node types, the nodes, one node with its attributes and the catalog's attribute keys with their closed values.
