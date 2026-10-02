# adopt-fe-ingest — frontend, contexto ingest

Início: 2026-10-02T10:18:32-03:00

## TC.1
- version 5.2.0; árvore limpa; spec sound; `--untraced frontend` antes: `377 tracked file(s) under frontend: 4 bound, 373 no binding names`.
- Correção de layout: o feature `ingest` só tem `api/`, `components/`, `index.ts` e `.gitkeep` (o runbook previa `hooks/`, `state/`, `types.ts`); linhas do runbook para `ingest` e `chat` corrigidas.

## TC.2 — survey
- Áreas: `boundary` = `src/features/ingest/api/` (9 arquivos); `ui` = `components/` + `index.ts` (15 arquivos); 7 testes deixados de fora.
- 2 surveyors em paralelo, sem recusa. `trace.py --survey`:
  - boundary.md: `68 fact line(s) over 9 file(s) — Facts 44, Answers 11, Vocabularies 6, Upstream artifacts 7`; sem fato: `api/index.ts`, `api/keys.ts`.
  - ui.md: `75 fact line(s) over 15 file(s) — Facts 45, Answers 15, Vocabularies 7, Upstream artifacts 8`; sem fato: 6 arquivos de barrel/types.
- Tokens: surveyor boundary 154 128, surveyor ui 123 896.
- `Observed and not decided here`: (a) o BFF devolve sucesso em duas formas (corpo direto nos pedidos de ingestão, `{ok,result}` na travessia); (b) token renovado usado só nos pedidos de ingestão, não na travessia; (c) picker oferece `.txt`/`text/plain`, drop aceita qualquer `text/*`; (d) o aviso "O grafo abaixo mostra os nós extraídos" diz mais que o código; (e) `SYSTEM_INTERNAL_ERROR` e `SYSTEM_UPSTREAM` são "retryable" no painel mas vão a polling silencioso na extração; (f) sem resumo no caminho já-ingerido, logo sem ação "ingerir outro".

## TC.3 — análise
- P1 aplicada provisionalmente. Nós novos: contexto `domain/ingest-workspace`, 3 elementos, 55 regras, 4 cenários, contratos `ingest-screen` (published), `bff-ingestion` (consumed, upstream `contracts/knowledge-base/ingestion`), `bff-traversal` (consumed, upstream `contracts/knowledge-base/retrieval`). Nenhum nó duplicado: fatos do backend foram ligados a nós existentes (`source-type`, `run-status`, `run-summary`, `node-status`, `assertion-flag`, `contracts/knowledge-base/ingestion`).
- 4 decisões em log. `trace.py --ledger`: `ledger sound: 143 fact line(s) over 2 material file(s) — 124 landed in 71 node(s), 19 left out with a reason`.
