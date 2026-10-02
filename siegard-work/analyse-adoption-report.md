# Relatório do /analyse sobre `siegard-work/adoption-findings.md` (commit 442e5e2)

Regra do dono: o código é a verdade e o nó muda; o que for stack, operação ou desempenho, ou o que o código
não usa, fica de fora com o motivo.

## Escritos (27 nós novos)

rules/chat: summary-prompt-v2-tool-arguments-bounded, summary-prompt-v2-empty-slice,
summary-prompt-v2-marks-open-points, distilled-title-shape, chat-prompt-respects-temporal-axes,
chat-prompt-asks-for-concise-answers, chat-prompt-v4-cites-ingested-document,
chat-prompt-v4-names-trigger-phrases, graph-delta-failure-keeps-stream, graph-delta-search-lists-node-once,
rolling-summary-token-ceiling, distilled-title-token-ceiling, turn-model-call-token-ceiling,
tool-failure-answers-assistant.

rules/knowledge-base: directed-link-report-reference, chunker-lines-end-at-newline, omitted-change-hint-is-none,
document-ingestion-records-no-storage-reference, extraction-reschedule-is-succession,
extraction-chunk-turn-limit, extraction-unknown-tool-refused, extraction-malformed-arguments-refused,
extraction-turn-without-proposals-ends-chunk, search-excerpt-is-chunk-excerpt, search-layer-candidate-cap.

constraints: request-body-ceiling, mcp-transport-failure-answers-empty-500.

## Alterados (12)

rules/chat: chat-prompt-carries-marker (valor), chat-prompt-affected-nodes-first (profundidade 2 e "descrever só o que as
chamadas retornaram"), chat-prompt-presents-catalog (ordem ascendente), model-context-owner-time (identificador da zona),
rolling-summary-overlap (40 por padrão).
constraints: expected-refusals-not-logged-as-errors (exceção: falha ao construir o provedor), logs-redact-text-fields
(níveis cobertos e cabeçalho authorization), mcp-endpoint-serves-only-its-toolset (mensagem).
contracts: access (recusa do schema do framework, 422 do framework, health 200/503), compliance-audit (`details {issues}`
e a ferramenta MCP `compliance_delete`), ingestion (mensagem de ingest-document, run sem nós afetados, run concluído
mesmo se o fechamento falhar, forma da referência de link, leitura sem nós afetados), retrieval (recusa de parâmetro não
definido na busca).

## Já mantido por um nó existente (nada a escrever)

- Ordem das recusas da curadoria: rules/knowledge-base/curation-request-check-order.
- Ordem confiança × ancoragem na proposta de link: rules/knowledge-base/link-proposal-check-order.
- Nomes das ferramentas de consulta do LLM: constraints/llm-toolset-omits-graph-point-reads (a lista de operações).
- contracts/chat/conversations (replay de turno com falha): já alinhado no commit 9efc4f3.

## Ficou de fora, com o motivo

Stack/operação/desempenho: porta padrão, tamanhos do pool e timeout de statement, TTL e cooldown do JWKS e local do JWKS,
origens e métodos CORS padrão, caminhos de rota (/queue, /metrics, /mcp/curation, `_self`), eventos e métricas de log
(`chat_turn_total`, `request_failed`, `curation_metrics_degraded`, `chat.deprecated_env`,
`chat.tool_catalog_partial_resolution`, `knowledge_graph_empty_provenance`).

Código sem uso: `buildChatTurnRequestSchema` e `MAX_HISTORY_MESSAGES`, `CHUNK_TARGET[0]`, `READING_TAIL`,
`GetIngestionStatusOutputSchema`, o handler de propose-fragment com a mensagem "Input failed Zod parse." (só testes),
`CHAT_SUMMARY_AFTER_TURNS`.

Ferramentas aposentadas ou ausentes do catálogo do chat: diretivas v2/v3 sobre `start_async_ingestion` e
`get_ingestion_status`; casos de `args-summary` para essas duas.

Proteções de estado impossível: contagens negativas lidas como 0, carimbos ausentes lidos como época 1970.

Já dito pela própria spec: validade final de item direcionado (o log de directed-validity-start-shape diz que a
ferramenta remove qualquer outro campo antes do serviço).

Desacordo entre dois pedaços de código, em que o nó segue o comportamento: descrição de `node_id` do ingest_directed
(diz VALIDATION_INVALID_FORMAT para pin inexistente; o serviço e o contrato dizem RESOURCE_NOT_FOUND); prompt de
extração.v1 (diz que omitir o início grava `received` sempre; temporal.ts só grava sem data do documento). Não mudei nó;
é defeito de texto emitido.

Sem fonte de verdade clara: variantes `empty_after_trim` / `too_long` de InvalidSearchQueryError (inalcançáveis pelo
DTO, segundo o juiz, não verificado); caminho de Zod do serviço direcionado (inalcançável pelo handler, não verificado);
entradas RESOURCE_ALREADY_EXISTS/409 e BUSINESS_CHAT_INGEST_DISABLED/503 do registro de erros (nenhum produtor visto).

Vinculação, não especificação: domain/knowledge-base/raw-chunk e raw-information (o fato está espalhado e nenhum arquivo o
mantém por inteiro), curation-reason-not-blank e dispute-resolution-distinct-items (error-envelope.ts só mapeia a
mensagem), rules/chat/tool-call-recorded (chat-agent.service.ts só emite os dados).

## Tensões e itens de observação

1. O transporte `mcp-stdio.ts` serve ferramentas de consulta e ingestão sem autenticação alguma, o que contradiz
   constraints/every-operation-requires-owner-authentication. Não alterei esse nó (o material não o cita). Decisão do dono.
2. rules/knowledge-base/search-excerpt-is-chunk-excerpt repete a definição de graph-provenance-excerpt-is-chunk-excerpt
   (mesmo corte). Podem virar um elemento "chunk excerpt" referenciado pelos dois.
3. A recusa "route schema do framework" em contracts/knowledge-base/access assume HTTP 422 e VALIDATION_INVALID_FORMAT; o
   juiz só mostrou a mensagem e o `details` (a assunção está no log).
4. As degradações silenciosas do ingest_directed (lista de nós afetados vazia, run reportado como concluído mesmo se o
   fechamento falhar) foram registradas como o código as faz; o dono pode preferir recusar nesses casos.
5. directed-defaults diz que o item direcionado tem change hint none, mas o serviço aceita e repassa um `change_hint`
   opcional. O achado estava nos retornos e não no material; não toquei.

## O que este incremento pode ter deixado em desacordo com o código

Cada decisão segue o que um juiz leu; a análise não leu o código. Pode haver divergência onde o juiz leu errado. Só uma
reconciliação confirma.

## Candidatos para a reconciliação (nós escritos ou alterados, nunca vinculados)

Os 27 novos e os 12 alterados listados acima.
