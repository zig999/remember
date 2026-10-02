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

## TC.4 — adoção
- Staging: `staged adopt-fe-ingest: 16 file(s) to judge over 0 node(s); staged as an adoption — 71 candidate node(s) from the ledger, 112 pair(s) over 16 file(s) (32 at most on one file), each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 24 file(s) the trace binds nothing to, 16 of them judged over the candidates alone`.
- Packs (bytes): `_request.ts` 7 922; `_transforms.ts` 25 177; `useIngestGraphAssembly.ts` 7 390; `useIngestRawInformation.ts` 5 408; `useIngestRunStatus.ts` 6 269; `useRetryLlmRun.ts` 5 381; `useRunLlmExtraction.ts` 5 812; `IngestDropzone.tsx` 6 192; `IngestPanel.tsx` 10 010; `IngestPanel.types.ts` 1 306; `IngestSummary.tsx` 5 517; `_IngestErrorBand.tsx` 4 087; `_IngestNoopNotice.tsx` 4 090; `IngestWorkspace.tsx` 2 944; `_utils.ts` 9 504; `useIngestOrchestration.ts` 41 686.
- Juízes: 16 (um por arquivo com fatos), em dois lotes de 8; nenhum retorno recusado pelo fold (com o prompt "no code fence", nenhum veio cercado).
- Fold: `69 node(s) cleared, 2 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed`. Bind: 69 bindings; não escritos: `contracts/ingest-workspace/ingest-screen`, `domain/knowledge-base/source-type`.

## TC.5 — medição
- cleared 69; `contradicts` 2; `unstated` 9; `restates` 37 (em 14 arquivos); `unheld` 0.
- `contradicts`: (1) `contracts/ingest-workspace/ingest-screen` — `classifyError` aplica "Erro desconhecido." só quando o valor lançado não é um `Error`; um `Error` com mensagem vazia passa com mensagem vazia; (2) `domain/knowledge-base/source-type` — o frontend usa `ata`, `artigo`, `transcricao`, `outro` e o nó do backend `meeting-minutes`, `article`, `transcript`, `other`: os dois nós se contradizem na grafia; decisão do dono sobre qual vale.
- `unstated` (9; classificação): `SYSTEM_*` com `httpStatus` 0 e `details.cause` (`_request.ts`) — queda da análise; `storage_ref` opcional no tipo de pedido (`_transforms.ts`) — queda da análise (o survey o citou, a análise o pôs como "outside"); `staleTime` de cinco minutos e `refetchOnWindowFocus` da travessia — survey os pôs em "Outside the domain" (cache) e o juiz os leu como fato; guarda `lastAppliedRef` (não refaz a montagem do mesmo conjunto) — gap de survey; `sourceTool: "ingest_assembly"` — gap de survey; `retry: 2` da leitura da execução — survey "Outside" (cache), juiz leu como fato; textos da área de arquivo (`ZONE_LABEL`, `HELPER_TEXT`, prompt visível) — P1: o survey os tratou como superfície; `INGEST_MODEL` `claude-opus-4-8` e `INGEST_PROMPT_VERSION` `v3` (`useIngestOrchestration.ts`) — análise os pôs "outside" ("defaults this implementation chose"), o juiz os leu como fatos que o backend contrasta com `default-extraction-model`.
- `--untraced frontend`: `377 tracked file(s) under frontend: 18 bound, 359 no binding names` / `12 holds-nothing` / `118 uncertified` / `229 unsurveyed`.
- `--check frontend`: sem drift novo (os 2 `proof` são do backend). `--owed`: 4 findings sem fechar (2 do auth, 2 do ingest).
- Tokens: surveyors 154 128 + 123 896; juízes 36 762 + 38 195 + 38 792 + 43 458 + 38 473 + 36 636 + 55 397 + 36 196 + 35 565 + 49 525 + 48 518 + 54 469 + 47 607 + 42 111 + 47 543 + 73 874 = 722 121 (média 45 133 por arquivo julgado).

## Lições
1. O prompt "NO code fence" eliminou o strip de cerca (16 de 16 sem cerca).
2. O mesmo desencontro de P1 do piloto: cache/retry/labels que o survey põe em "Outside" voltam como `unstated` do juiz. A regra prática do juiz é "texto ou número que o código fixa e nenhum nó guarda é `unstated`". Decisão do dono sobre P1 continua pendente e passa a custar 4 `unstated` por contexto.
3. O survey pôs `INGEST_MODEL`/`INGEST_PROMPT_VERSION` como "Outside" e a análise acompanhou; o juiz discordou. Para os próximos contextos, a análise deve manter como fato o que o backend também decide (modelo, versão de prompt).
4. Um contexto frontend precisa de nós consumidos (`direction: consumed`) com `upstream` publicado no backend; deu certo (`bff-ingestion` → `contracts/knowledge-base/ingestion`) e evitou duplicar campos.
