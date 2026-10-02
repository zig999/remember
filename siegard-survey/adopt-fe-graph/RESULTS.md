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

## TC.4 — adoção
- 39 juízes (um por arquivo com fatos; teto de 20 simultâneos: 7 relançados), 14 arquivos só de premissa; 0 retornos recusados pelo fold. `--fold`: `185 node(s) cleared, 6 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 4 candidate(s) no file of the set holds, listed under unheld`.
- `--bind-record`: 185 vínculos gravados; sem vínculo: domain/knowledge-base/assertion-status, domain/knowledge-base/effective-status, domain/knowledge-base/node-status, rules/graph-explorer/a-node-failure-reads-its-wording, rules/graph-explorer/an-empty-graph-has-no-positions, rules/graph-explorer/the-overlay-lets-the-pointer-through.

## TC.5 — medição
- Achados: contradicts 6, unstated 8, restates 168, unheld 4 (domain/chat/graph-view, domain/graph-explorer/confidence-state, rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail, rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation).
- Contradicts: grafias divergentes (needs_review × needs-review em node-status; assertion-status com proposed/accepted × nó; effective-status sem superseded/deleted), card do overlay reativa o ponteiro (pointer-events-auto), título do painel de falha sempre "Nó não encontrado.", layout-radial implementa a regra do grafo vazio sem estar ligado.
- `--check frontend`: 0 orphaned, 0 moved, 2 proof, 0 code. `--untraced`: 119 vinculados.
- Telemetria: siegard-telemetry/20261002T141219Z.json.

## Lições
- O teto de 20 delegações simultâneas recusa chamadas além dele; lançar em lotes de 20.
- Os 168 restates são docstrings de cabeçalho: rota do comentário.
