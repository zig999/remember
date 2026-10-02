# adopt-fe-graph — frontend, contexto graph

Início: 2026-10-02T13:58:45.000Z

## TC.1–TC.2 — survey
- 3 áreas: `boundary` (14 arquivos, 105 linhas de fato), `logic` (10, 85), `ui` (29 arquivos listados; ver `--survey`). Sem recusas, sem cerca.
- Tokens dos surveyors: 111 271 (boundary) + 123 869 (logic) + 145 160 (ui).
- Observed: nó removido/errors com título e corpo divergentes no painel; RESOURCE_NOT_FOUND sem retry no nó e com retry na origem; adicionar delta mantém links órfãos e substituir os descarta; confiança ausente mostra nada (inline) ou 0% (relações/fragmentos); estado do link vem de campos diferentes no painel e no canvas.

## TC.3 — análise
- Contexto novo `domain/graph-explorer`: 9 elementos, 119 regras, 4 cenários, contratos `graph-screen` (published), `bff-node-reads` (consumed, upstream `contracts/knowledge-base/retrieval`), `bff-graph-view` (consumed, upstream `contracts/chat/conversations`). Fatos do delta, do snapshot e dos vocabulários ligados a nós existentes (`domain/chat/*`, `domain/knowledge-base/*`, regras de `chat-workspace`).
- 4 decisões em log. `trace.py --ledger`: `ledger sound: 298 fact line(s) over 3 material file(s) — 297 landed in 195 node(s), 1 left out with a reason`.
- Chaves de cache `graphView` declaradas e não lidas: deixadas fora com motivo.
