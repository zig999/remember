# adopt-fe-curation — frontend, contexto curation

Início: 2026-10-02T10:56:XX-03:00 (ver /tmp; registrado no telemetry)

## TC.1
- version 5.2.0; árvore limpa; spec sound; `--untraced frontend` antes: `377 tracked file(s) under frontend: 18 bound, 359 no binding names`.
- Layout real do feature: `api/` (5), `hooks/` (3), `lib/` (1), `state/` (1), `types.ts`, `components/` (40). Dividido em 6 áreas por tamanho: `boundary`, `logic`, `decision-panel`, `correction-provenance`, `widgets`, `page-queue`.

## TC.2 — survey
- 6 surveyors em paralelo; 6 retornos sem cerca (prompt "NO code fence").
- `trace.py --survey`: boundary 92 fact lines (Facts 72, Answers 10, Vocab 4, Upstream 6); logic 121 (70/12/19/20); decision-panel 85 (61/10/7/7); correction-provenance 65 (40/15/5/5); page-queue 68 (47/7/8/6); widgets 56 (40/6/6/4). Total 487.
- Tokens dos surveyors: 109 455 + 99 403 + 109 018 + 89 636 + 111 345 + 86 770 = 605 627.
- Prompts incluíram a lição do ingest: números fixados pelo código que mudam o que o dono observa, e textos de orientação, entram como fato.

## TC.3 — análise
- P1 aplicada provisionalmente. Nós novos: contexto `domain/curation-workspace`; 10 elementos; 211 regras; 9 cenários; contratos `curation-screen` (published), `bff-curation` (consumed, upstream `contracts/knowledge-base/curation`), `bff-curation-reads` (consumed, upstream `contracts/knowledge-base/retrieval`). Fatos de formato de dados que o backend já publica foram ligados a nós existentes (`review-queue-kind`, `item-kind`, `entity-match-decision`, `dispute-decision`, `valid-from-basis`, `assertion-flag`, `node-status`, `assertion-status`, `effective-status`, `value-type`, `alias-kind`, `curation-metrics`, `entity-match-review`, `dispute-scope`).
- 5 decisões em log. `trace.py --ledger`: `ledger sound: 487 fact line(s) over 6 material file(s) — 462 landed in 233 node(s), 25 left out with a reason`.
- Cache: identidade de chave de cache ficou `outside` (7 linhas); frescor, polling e retry entraram como regras.
