---
type: api
direction: published
operations:
- show-graph
- show-node-detail
- show-relationships
- show-origin
answers:
- operation: show-graph
  accepted: "the region named \"Grafo de conhecimento\" holding the canvas with the nodes revealed so far, the layout picker named \"Algoritmo de layout do grafo\" and the reorganize control named \"Reorganizar o layout do grafo\""
  refusals:
  - rule: "rules/graph-explorer/empty-status-without-nodes-shows-only-the-empty-state"
    answer: "\"A memória aparecerá aqui conforme você conversa.\" with no canvas"
  - when: "The graph is being fetched."
    answer: "the overlay \"Carregando grafo\" reading \"Buscando na memória…\" over the canvas"
  - when: "The graph failed and the pane has an error message."
    answer: "the overlay \"Erro do grafo\" over the canvas reading that message, with no action"
  - when: "The graph failed and the pane has no error message."
    answer: "the overlay \"Erro do grafo\" over the canvas reading \"Não foi possível carregar o grafo agora.\", with no action"
- operation: show-node-detail
  accepted: "the complementary region \"Detalhes do nó: <label>\" with the close button \"Fechar detalhes do nó\", the node's name, type and state badge, its aliases and its attributes, and the action \"Curar\" where the node needs curation"
  refusals:
  - when: "The node detail is loading."
    answer: "the text \"Carregando detalhes…\" with a spinner"
  - rule: "rules/graph-explorer/a-node-failure-is-classified-by-its-code"
    answer: "an alert reading \"Nó não encontrado.\" for RESOURCE_NOT_FOUND, \"Este nó foi removido por conformidade.\" for BUSINESS_NODE_DELETED and \"Não foi possível carregar os detalhes. Tente novamente.\" with the action \"Tentar novamente\" for any other failure"
  - when: "The node has no aliases."
    answer: "\"Nenhum alias adicional.\""
  - when: "The node has no attributes."
    answer: "\"Nenhum atributo registrado.\""
- operation: show-relationships
  accepted: "the section named \"Relações\" with one row per link showing its direction arrow, link type, neighbour, confidence and status badge"
  refusals:
  - when: "The relationships are loading."
    answer: "\"Carregando relações…\""
  - when: "The node has no links."
    answer: "\"Nenhuma relação encontrada.\""
  - rule: "rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry"
    answer: "an alert \"Não foi possível carregar as relações.\" with the action \"Tentar novamente\""
- operation: show-origin
  accepted: "the fragments with their confidence, status and text, each chunk with its index, offsets, excerpt and source, and the original text of the operator in a disclosure"
  refusals:
  - when: "The origin is loading."
    answer: "\"Carregando origem…\""
  - when: "The origin read finds no fragments or the item is not found."
    answer: "\"Origem não encontrada.\" with the action \"Tentar novamente\" when it was a failure"
  - when: "The origin read fails with BUSINESS_RAW_INFORMATION_DELETED."
    answer: "an alert \"Documento original removido por conformidade.\" with no retry"
  - when: "The origin read fails with any other code."
    answer: "an alert \"Não foi possível carregar a origem.\" with the action \"Tentar novamente\""
  - rule: "rules/graph-explorer/a-redacted-original-input-is-never-shown"
    answer: "\"Texto original redigido.\" in place of the original text"
---

## Description

What the owner reads and can do in the graph pane and in a node's detail.
The chat screen that hosts the pane belongs to the chat workspace.
