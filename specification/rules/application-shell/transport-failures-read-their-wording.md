---
type: invariant
statement: "The helper's own failures MUST read \"Tempo limite excedido na requisição.\" for a timeout, \"Requisição cancelada.\" for an abort, \"Falha de rede ao contactar o servidor.\" for a network failure, \"Resposta do servidor não é JSON válido.\" for an invalid answer and \"Erro desconhecido do servidor.\" for an unknown one."
constrains:
- domain/application-shell/request-helper
---

## Description

None.
