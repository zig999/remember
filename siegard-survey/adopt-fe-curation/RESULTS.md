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

## TC.4 — adoção (2026-10-02)
- Staging: `staged adopt-fe-curation: 44 file(s) to judge over 0 node(s); staged as an adoption — 232 candidate node(s) from the ledger, 346 pair(s) over 44 file(s) (41 at most on one file), each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 52 file(s) the trace binds nothing to, 44 of them judged over the candidates alone`.
- Packs maiores (bytes): `DecisionPanel.tsx` 38 014; `correction-schema.ts` 24 194; `CurationDrawer.tsx` 23 502; `CurationPage.tsx` 23 336; `useDecisionDispatch.tsx` 22 936; `ComparePane.tsx` 20 192; `CorrectionForm.tsx` 19 808; `MetricsStrip.tsx` 19 212.
- Juízes: 44 (um por arquivo com fatos), em 3 lotes (16/16/12) com instruções compartilhadas em arquivo; nenhum retorno recusado (0 cercas).
- Fold: `219 node(s) cleared, 12 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed`. Bind: 219 bindings.

## TC.5 — medição
- cleared 219; `contradicts` 12 nós; `unstated` 26; `restates` ver record (`siegard-reconcile/adopt-fe-curation.md`); `unheld` 0 (o fold avisou de 1 candidato que nenhum arquivo do conjunto sustenta).
- `contradicts` (12 nós, cada um com a evidência no record): (1) `bff-curation-reads` — `OkEnvelope`/`unwrapOk` duplicam o envelope de `lib/http.ts`, só chamados por teste; (2) `curation-screen` — o nó descreve a barra de lote, mas a página não a monta; (3) `batch-kind` — `entity_match` no código, `entity-match` no nó; (4) `queue-tab` — `entity_match`/`disputed` no código, `entities`/`disputes` no nó; (5) `effective-status` — o tipo do frontend não tem `inactive`; (6) `review-queue-kind` — duas declarações do mesmo vocabulário, e a grafia com sublinhado; (7) `item-age-reads-in-minutes-hours-and-days` — o juiz de `DecisionPanel.helpers.ts` pediu o bind do arquivo (classificação duvidosa: o código concorda); (8) `panel-takes-no-confirm-reject-or-adjust` — o contrato de props aceita `onConfirm`/`onReject`; (9) `queue-entries-are-identified-by-node-or-first-side` — dispute sem lados vira `null` no código; (10) `queue-is-read-again-on-every-read-poll-and-focus` — duas cópias vivas da política (`useCurationQueue` e `useListReviewQueue`); (11) `queue-read-asks-the-first-page-of-twenty` — o literal 20 repetido em `curation.hooks.ts`; (12) `reason-field-always-shows-as-required` — `ReasonField` torna `required` opcional.
- `unstated` (26): a maioria são nomes acessíveis (`aria-label`) e rótulos que o survey tratou como superfície segundo P1 (BatchBar, CorrectionForm, CurationPage, DisputeSideCard, DecisionBar, EvidenceChip, PeriodTimeline, ReasonField, MetricsStrip, ProvenanceTrail, QueueList, QueueTabs, UndoToast, CurationDrawer, ComparePane, CandidateCard, DecisionPanel); o resto: foco inicial do formulário de correção, `badge` de lado de disputa, `itemKindOf` que mapeia entity_match a "link", mover/contar ao receber recusa "item sumiu" (`useDecisionDispatch`), caption/rótulos de `DateJustification`, vocabulário `link|attribute` da correção.
- `--untraced frontend`: `377 tracked file(s) under frontend: 59 bound, 318 no binding names` / `23 holds-nothing` / `118 uncertified` / `177 unsurveyed`. `--check frontend`: sem drift novo (2 `proof` do backend). `--owed`: 18 findings sem fechar.
- Tokens: surveyors 605 627; juízes 44 arquivos, ~2,1 milhões de tokens (soma dos `subagent_tokens`), média ~47 mil por arquivo.

## Lições
1. P1 continua o maior gerador de `unstated`: 20 dos 26 são `aria-label`/rótulos. A decisão do dono sobre P1 é agora a mais barata de tomar (aceitar o resíduo ou dar um nó às strings de acessibilidade).
2. Duplicações no código aparecem como `contradicts` (duas cópias da política da fila; `ReviewQueueKind` declarada em dois arquivos; `OkEnvelope` duplicado): são achados de qualidade que o sistema de nós expõe sem querer, e a rota é `/analyse` ou `/plan-work`, não o rebind.
3. A instrução compartilhada em arquivo (`/tmp/judge-instructions.md`) reduziu cada prompt de juiz a 4 linhas e eliminou cercas.
4. Um juiz marcou como `contradicts` um nó cujo código concorda ("a bind is missing"): o juiz confundiu atribuição de arquivo com contradição; o fold bloqueou o nó e o relatório deve dizer isso à parte.
