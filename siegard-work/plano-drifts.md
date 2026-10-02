# Plano para tratar os 191 achados de drift (backend) — com decisões tomadas

Fonte: `trace.py --check backend` (191 achados: 16 moved, 1 proof, 174 code em 59 arquivos). Regra do dono aplicada: o código é a verdade e o nó muda; exceções declaradas e justificadas.

Autorização do dono: as opções recomendadas abaixo estão escolhidas. Execução: um item por vez, `--check` ao fim de cada um, commit por item.

## Item 1 — Nós de forma `domain/knowledge-base/*` (87 pares code)
Decisão: para cada nó, o vínculo passa a apontar só para o arquivo que declara a forma, por `trace.py --bind --replace` (um nó por invocação, recibo lido).
Casa de cada nó (lida dos retornos dos juízes):
- llm-run, run-status, run-summary, validation-outcome, ingest-tool, tool-call → `ingestion/dto/llm-run.dto.ts` (+ `ingestion/repository/ingestion.repository.ts` para llm-run).
- raw-information, raw-chunk → ver item 2.
- valid-from-basis → `curation/dto/enums.dto.ts`.
- change-hint, proposal → `ingestion/dto/propose-link.dto.ts`.
- prompt-version → `ingestion/prompts/index.ts`.
- page, search-query, search-layer → `query-retrieval/dto/search.dto.ts` (page também em `fragment.dto.ts`).
- information-fragment → `query-retrieval/dto/fragment.dto.ts`.
- node-status → `curation/dto/enums.dto.ts` e `knowledge-graph/repository/graph.repository.ts` (a grafia `needs_review` do código prevalece; o nó muda no item 4).
- alias-kind, knowledge-node, node-alias → `knowledge-graph/repository/graph.repository.ts`.
- entity-match-review, node-resolution, provenance, dispute-resolution → sem arquivo declarante no conjunto: os pares nos arquivos repassadores são soltos e o nó fica sem vínculo naquele arquivo.

## Item 2 — raw-information e raw-chunk (pares `moved` e `code`)
Decisão: vincular a união dos arquivos que declaram partes (`ingest-raw-information.dto.ts`, `ingestion.repository.ts`), em vez de dividir o nó. Em seguida `/reconcile` sobre esses arquivos para refazer o digest.

## Item 3 — Regras de repasse (pares `code` restantes)
Decisão: mesma troca de vínculo do item 1, por nó, para o arquivo que mantém o fato. Ligações adicionais pedidas pelos juízes, todas adotadas:
- page-limit-bounds → `knowledge-graph/dto/queries.dto.ts`, `query-retrieval/dto/fragment.dto.ts`.
- search-query-length, search-layer-outside-set-refused → `query-retrieval/dto/search.dto.ts`.
- search-layer-candidate-cap, chunk-match-never-surfaces, search-ranking → `query-retrieval/service/search.service.ts`.
- default-extraction-model → `ingestion/mcp/ingest-document.handler.ts`.
- request-body-ceiling → `ingestion/routes/ingestion.routes.ts`.
- source-type → `ingestion/chunker/v1.ts`, `knowledge-graph/service/formatters.ts`.
- required-start-fallback → `ingestion/validation/temporal.ts`.
- attribute-value-parses → `ingestion/validation/structural.ts`.

## Item 4 — Divergências código × nó
Decisão por caso (o nó muda para seguir o código, salvo as duas exceções):
- dispute-resolution-single-scope: o nó passa a exigir o mesmo alvo para ligações do mesmo tipo.
- prefer-one-requires-winner e adjust-periods-one-per-item: a mensagem do contrato passa a ser a do código, sem o parêntese.
- directed-defaults: o nó passa a admitir `change_hint` informado pelo chamador.
- directed-later-reference-wins: o nó passa a dizer que só um item posterior aceito substitui a referência.
- unused-resolution-fields-ignored: o nó passa a dizer que campos não usados ainda são validados quanto ao formato.
- ambiguous-candidates-need-review: o nó passa a declarar o teto de 10 candidatos.
- caller-never-states-received / extraction-relative-date-falls-back-to-reception: o nó passa a admitir a base `received` no fallback do prompt v4.
- domain/knowledge-base/node-status: o valor passa a ser `needs_review`.
- EXCEÇÕES (correção de código, via `/plan-work` corretivo, porque o comportamento é acidente do ambiente e não decisão): data impossível aceita por `Date.parse` (scenario `impossible-calendar-date-refused` fica como está) e score 0 de ligações expandidas além do salto 1 (`expansion-decay` fica como está).
Mecanismo: um `/analyse` com os achados de `comment-route-backend.md` como material; depois `/reconcile` sobre os arquivos.

## Item 5 — Nós de chat alterados depois do vínculo (10 code + 3 moved)
Decisão: `/reconcile` ordinário sobre prompts v1/v3/v4, context-builder, distillation e conversations.routes. `tool-call-recorded` passa a ser vinculado a `chat/repository/chat.repository.ts` e `chat/routes/conversations.routes.ts` (onde a gravação ocorre), e solto de `chat-agent.service.ts`.

## Item 6 — Resíduo de curadoria, auditoria e proof
Decisão: `/reconcile` sobre `curation/mcp/error-envelope.ts`, `mcp/sdk-http-transport.ts`, `query-retrieval/service/errors.ts`, `curation/service/queue.service.ts` e o repositório de auditoria; o `proof` de `review-queue-total-before-pagination` com `--certify` do teste como está hoje.

## Ordem de execução
5 e 6 → 4 → 2 → 1 → 3. Critério de término por item: `--check` não lista mais os pares do item. Commit por item.
