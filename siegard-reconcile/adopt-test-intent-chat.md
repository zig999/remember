---
contract_version: siegard-reconcile/8
title: Adopt chat source against the test-intent candidates
summary: The chat prompt, route, service and directed-ingestion source is adopted as it stands and did
  not change; the candidates are the 46 rules/chat nodes the test-intent analysis wrote or amended, whose
  facts the tests exercise.
target: backend
files:
- path: src/modules/chat/prompts/chat-summary/index.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/chat-summary/v2.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/index.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/v1.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/v2.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/v3.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/v4.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/repository/chat.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/routes/chat.schemas.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/routes/conversations.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/args-summary.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/chat-agent.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/context-builder.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/conversation.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/datetime-block.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/distillation.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/graph-normalizer.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/output-guard.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/tool-catalog.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/truncate-tool-result.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/turn-registry.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/directed-ingest.handler.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/directed-ingestion.service.ts
  change: adopted as it stands; unchanged
nodes:
- node: rules/chat/chat-prompt-affected-nodes-first
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at BLOCK_4C_POST_INGESTION_PLAYBOOK, step 2 and 2.a (lines
    108-114). The depth=2 value is an addition, reported as a finding. — "2. Quando `status === \"completed\"`,
    ANTES de qualquer outra ferramenta,", "leia o campo `result.affected_nodes`" and "use os ids", "diretamente
    em `get_node(id)` e/ou `traverse(start_node_id=id,"

    src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION, PLAYBOOK POS-INGESTAO item 1
    and 1.a, lines 154-159 — "1. Use `result.run.affected_nodes` como PRIMEIRA via de consulta" ... "a.
    Quando `affected_nodes` estiver presente e nao-vazio, use os ids", "diretamente em `get_node(id)`
    e/ou `traverse(start_node_id=id,", "depth=2)`."'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-discovery-listings
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at BLOCK_4B_SEARCH_DISCIPLINE, directive 3 (lines 91-95)
    — "use `list_node_types`, `list_link_types`", "e `list_attribute_keys` como primitivas de descoberta."

    src/modules/chat/prompts/v4.ts: held at BLOCK_4B_SEARCH_DISCIPLINE item 3, lines 90-94 — "use `list_node_types`,
    `list_link_types`", "e `list_attribute_keys` como primitivas de descoberta."'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-fallback-lists-by-node-type
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at BLOCK_4C_POST_INGESTION_PLAYBOOK, step 2.b (lines 117-121).
    It also offers a single-name search, reported as a finding. — "`list_nodes(node_type=<tipo plausivel>)`
    ESCOLHIDO no bloco de", "ontologia. NUNCA uma busca multi-nome concatenada (bloco 4B"

    src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION, PLAYBOOK POS-INGESTAO item 1.b,
    lines 160-165 — "b. Quando `affected_nodes` estiver ausente ou vazio", "`list_nodes(node_type=<tipo",
    "plausivel>)` ESCOLHIDO no bloco de ontologia. NUNCA uma busca", "multi-nome concatenada (bloco 4B
    directive 1)."'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-list-by-node-type
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at BLOCK_4B_SEARCH_DISCIPLINE, directive 2 (lines 86-90)
    — "2. `list_nodes` DEVE ser chamada COM um filtro `node_type` quando voce", "precisa enumerar uma
    categoria"

    src/modules/chat/prompts/v4.ts: held at BLOCK_4B_SEARCH_DISCIPLINE item 2, lines 85-87 — "2. `list_nodes`
    DEVE ser chamada COM um filtro `node_type` quando voce", "precisa enumerar uma categoria"'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-search-is-lexical-and
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at BLOCK_4B_SEARCH_DISCIPLINE, directive 1 (line 81) — "1.
    A ferramenta `search` e LEXICA E TEM SEMANTICA `AND` sobre o texto"

    src/modules/chat/prompts/v4.ts: held at BLOCK_4B_SEARCH_DISCIPLINE item 1, line 80 — "1. A ferramenta
    `search` e LEXICA E TEM SEMANTICA `AND` sobre o texto"'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-search-one-name
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at BLOCK_4B_SEARCH_DISCIPLINE, directive 1 (lines 82-85)
    — "Buscar UM NOME ESPECIFICO POR CHAMADA.", "NUNCA concatene varios nomes proprios numa unica chamada
    `search`"

    src/modules/chat/prompts/v4.ts: held at BLOCK_4B_SEARCH_DISCIPLINE item 1, lines 81-83 — "Buscar UM
    NOME ESPECIFICO POR CHAMADA.", "NUNCA concatene varios nomes proprios numa unica chamada `search`"'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-unfiltered-listing-is-not-ingested
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at BLOCK_4C_POST_INGESTION_PLAYBOOK, step 4 (lines 125-126),
    and BLOCK_4B_SEARCH_DISCIPLINE, directive 2 — "4. NUNCA apresente a primeira linha de um `list_nodes`
    sem filtro como", "resposta para \"o que foi ingerido\""

    src/modules/chat/prompts/v4.ts: held at BLOCK_4B_SEARCH_DISCIPLINE item 2, lines 86-89, and BLOCK_4C_DIRECTED_INGESTION
    PLAYBOOK POS-INGESTAO item 3, lines 169-172 — "NUNCA use", "`list_nodes` SEM `node_type` para responder
    \"o que foi ingerido\""; "3. NUNCA apresente a primeira linha de um `list_nodes` sem filtro como",
    "resposta para \"o que foi ingerido\""'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-v1-cites-sources
  conforms: true
  how: 'src/modules/chat/prompts/v1.ts: held at principles 3 and 4 of the array returned by system(),
    lines 64-70 — "3. NUNCA invente identificadores (uuids), nomes ou aliases. Se voce" and "4. CITE A
    FONTE. Toda afirmacao factual deve apontar para o fragmento", "   ou o chunk que a sustenta — use
    as ferramentas `get_provenance_*`"'
  encoded_at:
  - src/modules/chat/prompts/v1.ts
- node: rules/chat/chat-prompt-v2-ingestion-returns-running
  conforms: true
  how: 'src/modules/chat/prompts/v2.ts: held at the strings of directive 2 in v2Additions, lines 72-75
    — "2. A ferramenta retorna IMEDIATAMENTE com `status: \"running\"`; a", "   extracao roda em segundo
    plano. Apos chamar `start_async_ingestion`,", "   INFORME ao dono que a ingestao foi iniciada E ofereca
    consultar o", "   status mais tarde via `get_ingestion_status`."'
  encoded_at:
  - src/modules/chat/prompts/v2.ts
- node: rules/chat/chat-prompt-v2-no-content-echo
  conforms: true
  how: 'src/modules/chat/prompts/v2.ts: held at the closing strings of v2Additions, lines 80-82 — "Ao
    chamar `start_async_ingestion`, NAO repita o argumento `content` na", "sua resposta em linguagem natural
    — `content` e grande e e gravado",'
  encoded_at:
  - src/modules/chat/prompts/v2.ts
- node: rules/chat/chat-prompt-v2-no-status-polling
  conforms: true
  how: 'src/modules/chat/prompts/v2.ts: held at the strings of directive 3 in v2Additions, lines 76-78
    — "3. NAO faca polling de `get_ingestion_status` dentro do mesmo turno", "   (sem auto-poll). Reporte
    o status UMA UNICA VEZ, somente quando o", "   dono pedir explicitamente.",'
  encoded_at:
  - src/modules/chat/prompts/v2.ts
- node: rules/chat/chat-prompt-v4-asks-start-date
  conforms: true
  how: 'src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION item 3, lines 119-127 — "voce
    DEVE perguntar a data ao", "dono ANTES de chamar `ingest_directed`. NAO chame `ingest_directed`",
    "sem `valid_from` confiando no fallback `received`"'
  encoded_at:
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-v4-closed-values
  conforms: true
  how: 'src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION item 4, lines 131-135 — "use",
    "EXATAMENTE um dos valores listados, verbatim — NUNCA traduza (ex.:", "`in_progress` NAO existe; use
    `em andamento`) nem invente variantes;"'
  encoded_at:
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-v4-directed-ingestion-writes
  conforms: true
  how: 'src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION opening, line 100 — "`ingest_directed`
    e a UNICA ferramenta de escrita disponivel no chat."'
  encoded_at:
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-v4-one-ingestion-per-command
  conforms: true
  how: 'src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION item 5, lines 136-140 — "5.
    UMA UNICA CHAMADA POR COMANDO.", "NAO faca auto-loop — NAO chame `ingest_directed` repetidamente para",
    "tentar consertar itens rejeitados."'
  encoded_at:
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-v4-pins-known-entity
  conforms: true
  how: 'src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION item 2, lines 113-118 — "passe
    o `id` retornado no campo OPCIONAL `node_id` do item em", "`nodes[]` — isso e um PIN: bypassa a resolucao
    fuzzy e amarra o item", "ao no conhecido."'
  encoded_at:
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-v4-records-only-declared
  conforms: true
  how: 'src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION item 4, lines 128-131 — "4.
    ATRIBUTOS. Grave APENAS atributos que o dono declarou. NAO infira", "`status`, categorias ou qualquer
    valor de estado que o dono nao disse —", "se um atributo parecer util mas nao foi dito, PERGUNTE antes
    de gravar"'
  encoded_at:
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-v4-reports-each-item
  conforms: true
  how: 'src/modules/chat/prompts/v4.ts: held at BLOCK_4C_DIRECTED_INGESTION item 5, lines 140-145 — "Apos
    a resposta, RELATE ao dono,", "item por item, o que aconteceu: quais foram `accepted`, quais foram",
    "`consolidated`"'
  encoded_at:
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/graph-delta-absent-for-catalog-history-provenance
  conforms: true
  how: "src/modules/chat/service/graph-normalizer.ts: held at the `GRAPH_TOOL_NAMES` set (lines 103-114)\
    \ and the guard at the top of `normalizeToolResult`, line 585 — if (!GRAPH_TOOL_NAMES.has(toolName))\
    \ {\n  return Promise.resolve(null);\n}"
  encoded_at:
  - src/modules/chat/service/graph-normalizer.ts
- node: rules/chat/graph-delta-directed-empty
  conforms: true
  how: "src/modules/chat/service/graph-normalizer.ts: held at `normalizeIngestDirected`, lines 464-482\
    \ and 551 — const rawAffected =\n  run !== undefined && Array.isArray(run.affected_nodes)\n    ? run.affected_nodes\n\
    \    : [];\n... return { source_tool: \"ingest_directed\", nodes, links };"
  encoded_at:
  - src/modules/chat/service/graph-normalizer.ts
- node: rules/chat/graph-delta-directed-links-bare
  conforms: true
  how: "src/modules/chat/service/graph-normalizer.ts: held at the `out` link literal in `normalizeIngestDirected`,\
    \ lines 537-547 — const out: GraphLinkWire = {\n  id: entry.link_id,\n  source_node_id,\n  target_node_id,\n\
    \  link_type,\n  ...(linkTypeRow !== undefined ? { link_type_label: linkTypeRow.label } : {}),\n \
    \ is_temporal,\n};"
  encoded_at:
  - src/modules/chat/service/graph-normalizer.ts
- node: rules/chat/graph-delta-link-label
  conforms: true
  how: 'src/modules/chat/service/graph-normalizer.ts: held at `pickLinkWire`, line 224, and `normalizeIngestDirected`,
    line 542 — ...(linkTypeRow !== undefined ? { link_type_label: linkTypeRow.label } : {}),'
  encoded_at:
  - src/modules/chat/service/graph-normalizer.ts
- node: rules/chat/graph-delta-requires-catalog-snapshot
  conforms: true
  how: 'src/modules/chat/routes/conversations.routes.ts: held at The guard on the graph_delta projection
    in the sendMessage drain loop, line 974. The tool_result frame is written before it, so without the
    snapshot the tool result is streamed alone. — `tryWrite(reply, wireFrame, deps.logger);` followed
    by `if (evt.type === "tool_result" && evt.ok && deps.catalog !== undefined) { const graphDelta = await
    projectGraphDelta(`'
  encoded_at:
  - src/modules/chat/routes/conversations.routes.ts
- node: rules/chat/graph-delta-search-drops-vanished-node
  conforms: true
  how: "src/modules/chat/service/graph-normalizer.ts: held at `normalizeSearch`, lines 375-378 — for (const\
    \ id of ids) {\n  const node = byId.get(id);\n  if (node !== undefined) nodes.push(node);"
  encoded_at:
  - src/modules/chat/service/graph-normalizer.ts
- node: rules/chat/graph-delta-unreadable-result
  conforms: true
  how: "src/modules/chat/service/graph-normalizer.ts: held at the `isRecord` guards of `normalizeTraverse`,\
    \ `normalizeGetNode`, `normalizeListNodes` and `normalizeSearch` (lines 251, 282, 303, 343), and line\
    \ 460 of `normalizeIngestDirected` — if (!isRecord(result)) {\n  return { source_tool: \"traverse\"\
    , nodes: [], links: [] };\n} ... export function normalizeIngestDirected( ...\n  if (!isRecord(result))\
    \ return null;"
  encoded_at:
  - src/modules/chat/service/graph-normalizer.ts
- node: rules/chat/message-content-length
  conforms: true
  how: "src/modules/chat/routes/chat.schemas.ts: held at buildSendMessageRequestSchema, the content bound\
    \ at lines 66-82. The 32 768 default is held in config/env.ts, not in this file. — content: z\n  .string()\n\
    \  .min(1, \"content must be a non-empty string\")\n  .max(\n    opts.maxContentLength,\n    `content\
    \ must be at most ${opts.maxContentLength} characters`\n  ),"
  encoded_at:
  - src/modules/chat/routes/chat.schemas.ts
- node: rules/chat/model-context-owner-time-opening
  conforms: true
  how: 'src/modules/chat/service/datetime-block.ts: held at the ISO_PREFIX constant at line 20, emitted
    by renderDatetimeBlockB at line 37 — const ISO_PREFIX = "Data/hora atual do dono: " as const; ...
    return `${ISO_PREFIX}${iso} (${tz})`;'
  encoded_at:
  - src/modules/chat/service/datetime-block.ts
- node: rules/chat/model-context-window
  conforms: true
  how: 'src/modules/chat/repository/chat.repository.ts: held at listRecentRealTurns (lines 674-715): the
    boundary CTE takes the created_at of the K-th most recent owner-written message, and the outer query
    returns every message of the conversation from that moment on. The default of 6 is not in this file;
    the caller passes turn_count. — "WITH boundary AS ( SELECT created_at AS at FROM chat_message WHERE
    conversation_id = $1 AND role = ''user'' AND idempotency_key IS NOT NULL ORDER BY created_at DESC,
    id DESC LIMIT 1 OFFSET $2 ) ... WHERE conversation_id = $1 AND created_at >= COALESCE( (SELECT at
    FROM boundary), (SELECT at FROM fallback) ) ORDER BY created_at ASC, id ASC"'
  encoded_at:
  - src/modules/chat/repository/chat.repository.ts
- node: rules/chat/summary-prompt-v2-empty-previous
  conforms: true
  how: 'src/modules/chat/prompts/chat-summary/v2.ts: held at renderPrev, line 181, used by buildUserTurn
    at line 205 — if (summary_prev === null) return "(vazio)";'
  encoded_at:
  - src/modules/chat/prompts/chat-summary/v2.ts
- node: rules/chat/summary-prompt-v2-persona
  conforms: true
  how: 'src/modules/chat/prompts/chat-summary/v2.ts: held at the `system` literal, lines 41-67 (persona
    and language in lines 42-46, ceiling in rule 2, line 58) — "Voce e o Sintetizador da conversa do Remember.
    Receba o RESUMO ANTERIOR", "pt-BR que PRESERVE os fatos salientes do resumo anterior e FOLDE os fatos",
    "2. Maximo ~8 frases (soft cap; o BFF rejeita saidas > 2000 caracteres).",'
  encoded_at:
  - src/modules/chat/prompts/chat-summary/v2.ts
- node: rules/chat/tool-failure-continues-turn
  conforms: true
  how: 'src/modules/chat/service/chat-agent.service.ts: held at the tool loop, lines 414-431 (unknown
    tool becomes an error envelope; the handler is raced against ctx.env.TOOL_TIMEOUT_MS), and raceToolHandler.
    The 15 000 ms default is not in this file. — toolEnvelope = await raceToolHandler( tool.handler, block.input,
    ctx.env.TOOL_TIMEOUT_MS, invocationContext ); then toolResultBlocks.push({ type: "tool_result", ...,
    is_error: !toolEnvelope.ok }); and `continue;`'
  encoded_at:
  - src/modules/chat/service/chat-agent.service.ts
- node: rules/chat/tool-result-truncated
  conforms: true
  how: "src/modules/chat/service/chat-agent.service.ts: held at the call at lines 451-455 cuts every tool\
    \ result before the assistant sees it. The cut and its length marker are in truncate-tool-result.ts,\
    \ and the 8000 default is not in this file. — const truncated = truncateToolResult( bodyJson, ctx.env.TOOL_RESULT_MAX_CHARS\
    \ ); ... content: truncated.value,\nsrc/modules/chat/service/truncate-tool-result.ts: held at The\
    \ body of truncateToolResult(), the truncation branch (lines 55-64). It keeps the first `maxChars`\
    \ code points and appends a marker carrying the full length. The 8000 default is not held in this\
    \ file. It is held in backend/src/config/env.ts. — const head = codepoints.slice(0, maxChars).join(\"\
    \"); return {\n  value: `${head}\\n[truncated: ${total} chars]`,\n  truncated: true,\n  totalChars:\
    \ total,\n};"
  encoded_at:
  - src/modules/chat/service/chat-agent.service.ts
  - src/modules/chat/service/truncate-tool-result.ts
- node: rules/chat/tool-start-attribute-history-summary
  conforms: true
  how: 'src/modules/chat/service/args-summary.ts: held at the "get_history_attribute_key" case of formatByTool,
    lines 112-117 — return `node_id=${nodeId} key=${key}`;'
  encoded_at:
  - src/modules/chat/service/args-summary.ts
- node: rules/chat/tool-start-listing-summary
  conforms: true
  how: "src/modules/chat/service/args-summary.ts: held at the \"list_nodes\" case, lines 119-124, and\
    \ the catalog listing cases, lines 126-129 — return `node_type=${nodeType} limit=${limit}`; case \"\
    list_node_types\": case \"list_link_types\": case \"list_attribute_keys\":\n  return \"\";"
  encoded_at:
  - src/modules/chat/service/args-summary.ts
- node: rules/chat/tool-start-read-summary
  conforms: true
  how: "src/modules/chat/service/args-summary.ts: held at the get_node, get_history_link, get_history_attribute\
    \ and get_provenance_* cases, lines 89-93, 105-110 and 131-137 — case \"get_provenance_link\": case\
    \ \"get_provenance_attribute\": case \"get_provenance_fragment\": {\n  const id = readString(obj,\
    \ \"id\");\n  if (id === undefined) return fallbackSummary(obj);\n  return `id=${id}`;"
  encoded_at:
  - src/modules/chat/service/args-summary.ts
- node: rules/chat/tool-start-search-summary
  conforms: true
  how: 'src/modules/chat/service/args-summary.ts: held at the "search" case of formatByTool, lines 74-87
    — const parts: string[] = [`query="${truncateCodepoints(query, SEARCH_QUERY_MAX_CHARS)}"`]; ... parts.push(`layers=${layers.join(",")}`);
    ... parts.push(`expand_depth=${expandDepth}`);'
  encoded_at:
  - src/modules/chat/service/args-summary.ts
- node: rules/chat/tool-start-summary-fallback
  conforms: true
  how: 'src/modules/chat/service/args-summary.ts: held at fallbackSummary() lines 165-170, the missing-argument
    guards in each case, and the `default:` branch, lines 158-161 — return `${Object.keys(input as Record<string,
    unknown>).length} keys`;'
  encoded_at:
  - src/modules/chat/service/args-summary.ts
- node: rules/chat/tool-start-traversal-summary
  conforms: true
  how: "src/modules/chat/service/args-summary.ts: held at the \"traverse\" case, lines 95-103 — if (depth\
    \ !== undefined) {\n  return `id=${id} depth=${depth}`;\n} return `id=${id}`;"
  encoded_at:
  - src/modules/chat/service/args-summary.ts
- node: rules/chat/turn-model-call-limit
  conforms: true
  how: 'src/modules/chat/service/chat-agent.service.ts: held at lines 209-221, the check at the top of
    the loop. The 8 default is not in this file. — iteration += 1; if (iteration > ctx.env.MAX_ITERATIONS)
    { yield* terminate( ctx, "max_iterations", ...'
  encoded_at:
  - src/modules/chat/service/chat-agent.service.ts
- node: rules/chat/turn-model-default
  conforms: true
  how: 'src/modules/chat/routes/conversations.routes.ts: held at The `resolvedModel` expression in the
    sendMessage handler, step (2), lines 625-628. A turn that names no model takes `deps.env.CHAT_MODEL`.
    The `claude-opus-4-8` default is declared in src/config/env.ts, not in this file. — `const resolvedModel
    = body.model !== undefined && body.model.length > 0 ? body.model : deps.env.CHAT_MODEL;`'
  encoded_at:
  - src/modules/chat/routes/conversations.routes.ts
- node: rules/chat/turn-time-limit
  conforms: true
  how: 'src/modules/chat/service/chat-agent.service.ts: held at lines 151-155 (timer) and 223-236 and
    320-333 (turn_timeout on abort). The 90 000 ms default is not in this file. — const turnTimer = setTimeout(()
    => { turnController.abort(TURN_TIMEOUT_REASON); }, turnTimeoutMs); and stopReason = reason === TURN_TIMEOUT_REASON
    ? "turn_timeout" : "cancelled";'
  encoded_at:
  - src/modules/chat/service/chat-agent.service.ts
- node: rules/chat/tool-call-recorded
  conforms: false
  how: 'no named file holds this fact now: src/modules/chat/service/chat-agent.service.ts read `nowhere`
    — The file yields events and persists nothing: `yield { type: "iteration_end", iteration, assistant_content:
    iterationBlocks.slice(), tool_results: toolResultBlocks.slice(), } as const;` Nothing here writes
    a tool call row or names an assistant message.'
  observed_at:
  - src/modules/chat/service/chat-agent.service.ts
unstated:
- file: src/modules/chat/prompts/chat-summary/v2.ts
  where: the `messagesBlock` branch of buildUserTurn, lines 198-201
  evidence: "new_messages.length === 0\n      ? \"(nenhuma)\""
  cost: The text sent to the model for an empty slice of new messages is "(nenhuma)", decided only here.
    The specification fixes the placeholder "(vazio)" for a missing previous summary and says nothing
    of an empty slice, so the next reader of the rule sees only half of the placeholder convention.
- file: src/modules/chat/prompts/chat-summary/v2.ts
  where: the `system` literal, REGRAS 3 and 6, lines 59 to 66
  evidence: '"3. Prosa pt-BR concisa, paragrafos curtos. Sem cabecalhos. Sem bullets.", "6. Responda APENAS
    com o novo resumo. Sem preambulos, sem despedidas, sem", "   comentarios sobre o trecho recebido.",'
  cost: The summary's required shape (prose in short paragraphs, no headings, no bullets, and nothing
    but the summary in the reply) is decided only in this prompt text. The persona node holds only the
    language, the persona and the eight-sentence ceiling, so a change to the summary's shape would be
    made in code the specification never mentions.
- file: src/modules/chat/prompts/chat-summary/v2.ts
  where: the `system` literal, the bullet "pontos em aberto", line 51
  evidence: '"- pontos em aberto — marcar explicitamente como ''pendente: ...'';",'
  cost: 'The rule that unresolved questions are kept in the summary under a literal "pendente: " marker
    is applied only here. The specification''s refold rule says the previous summary''s salient facts
    are kept and the older messages'' folded in, and it says nothing about open points. The next reader
    looks for it in the specification, does not find it, and cannot tell whether the marker was a business
    decision.'
- file: src/modules/chat/prompts/chat-summary/v2.ts
  where: the constant TOOL_ARGS_INLINE_MAX and its use in summariseToolUseArgs, lines 97 and 111-112
  evidence: const TOOL_ARGS_INLINE_MAX = 200; ... return serialised.slice(0, TOOL_ARGS_INLINE_MAX) + "...<truncated>";
  cost: The slice of messages sent to the model is rendered here with a tool call's arguments cut at 200
    characters and the "[role] body" line format, and no node holds either. The threshold decides what
    the refold can keep of a tool call, and the next reader looks for it in the specification and does
    not find it. rules/chat/tool-result-truncated governs only a tool result's length for the assistant,
    not this rendering.
- file: src/modules/chat/prompts/v1.ts
  where: principle 3 in the array returned by system(), lines 64-67
  evidence: '"3. NUNCA invente identificadores (uuids), nomes ou aliases. Se voce", "   precisa de um
    id, RESOLVA o nome chamando `search` ou `list_nodes`", "   antes de chamar qualquer ferramenta que
    exige id (`get_node`,",'
  cost: The prompt makes the assistant resolve a name through `search` or `list_nodes` before calling
    any id-taking tool. The v1 node holds only "never invent identifiers". It does not hold this procedure,
    the two tools it names, or the extension to never inventing names or aliases. The behavior the assistant
    follows lives only in prompt text, where a reader of the specification will not look.
- file: src/modules/chat/prompts/v1.ts
  where: principle 5 in the array returned by system(), lines 71-74
  evidence: '"5. RESPEITE OS EIXOS TEMPORAIS. O grafo distingue eixo de validade", "   (`valid_from`/`valid_to`)
    do eixo de transacao (`recorded_at`/", "   `superseded_at`). Quando o usuario perguntar sobre uma
    data, use", "   `get_history_*` para responder com precisao.",'
  cost: This instruction makes the assistant use the history reads for any date question. No node in the
    pack or elsewhere in the projection holds it. A grep of the projection for the temporal-axes instruction
    found only the catalog rules. The behavior is observable by the owner and has no node to change.
- file: src/modules/chat/prompts/v1.ts
  where: principle 8 and the FERRAMENTAS section of system(), lines 81-86
  evidence: '"8. Seja conciso. Prefira respostas curtas e diretas; agrupe varios", "Use as ferramentas
    SOMENTE quando elas adicionarem informacao que voce", "ainda nao tem. Cada chamada e auditada e tem
    orcamento de tempo.",'
  cost: Conciseness and calling a tool only when it adds information are instructions the assistant follows,
    and no node holds them. They cannot be changed or tested through the specification.
- file: src/modules/chat/prompts/v1.ts
  where: the constant CHAT_PROMPT_MARKER_V1, line 35
  evidence: export const CHAT_PROMPT_MARKER_V1 = "__REMEMBER_CHAT_SYS_MARKER_V1__" as const;
  cost: The marker's literal value is a code constant that the output guard scrubs deltas against. The
    node says only that every prompt version begins with "the one system-prompt marker". It does not give
    the value. It also does not say whether there is one marker or one per version, which the file's own
    comment claims ("FROZEN per prompt-module version", "the union of all known markers"). Whoever changes
    the marker will look for its value in the specification and find only the code.
- file: src/modules/chat/prompts/v2.ts
  where: v2Additions, directive 1 (lines 66-71), the text sent to the model as part of the system prompt
  evidence: '"1. CHAME `start_async_ingestion` SOMENTE quando o dono pedir", "   EXPLICITAMENTE para ingerir
    um documento — sinais tipicos sao", "   frases como \"ingerir\", \"salvar este documento\", \"registrar",
    "   este texto\".'
  cost: The prompt makes explicit owner request the only trigger for asynchronous ingestion, and lists
    the phrases that count as a request. No node holds that rule for start_async_ingestion. rules/chat/assistant-writes-only-on-owner-request
    covers directed ingestion only, and rules/chat/chat-prompt-v2-ingestion-returns-running, chat-prompt-v2-no-status-polling
    and chat-prompt-v2-no-content-echo do not state it. The trigger rule and its example phrases therefore
    live only in this prompt string. A reader who looks in the specification for when the assistant may
    start an asynchronous ingestion finds nothing.
- file: src/modules/chat/prompts/v2.ts
  where: v2Additions, introduction (lines 61-64), the text sent to the model as part of the system prompt
  evidence: '"estiverem disponiveis no catalogo, observe os limites abaixo. Se elas", "nao aparecerem
    no catalogo, ignore esta secao — significa que a", "capacidade de ingestao via chat esta desligada
    nesta instalacao.",'
  cost: The prompt tells the model that absence of the two ingestion tools from its catalog means chat
    ingestion is switched off in this installation, and that the section is then to be ignored. No node
    holds this. The enablement nodes (chat-enabled-by-default, directed-ingestion-disabled-by-default)
    speak of the chat and of directed ingestion, not of asynchronous ingestion. The conditional behavior
    therefore exists only in this string.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, line 2.a (lines 112-114), the depth argument of traverse
  evidence: '"diretamente em `get_node(id)` e/ou `traverse(start_node_id=id,", "depth=2)`. Descreva APENAS
    o que essas chamadas retornaram."'
  cost: The node says only to read each node and traverse from it directly. The prompt fixes the traversal
    depth at 2 and restricts the answer to what those calls returned. Both are values the assistant obeys,
    and no node states them. A change to the depth would be made here, where the next reader of the specification
    will not look.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, line 2.b (lines 112-121), the fallback when affected_nodes
    is absent or empty
  evidence: '"recue para UM", "`search` por nome proprio mencionado pelo dono, OU", "`list_nodes(node_type=<tipo
    plausivel>)` ESCOLHIDO no bloco de", "ontologia."'
  cost: The node says that when a completed run lists no affected nodes the assistant looks the nodes
    up by node type. The emitted playbook adds a second fallback, a single-name `search` per name the
    owner mentioned. That choice between two fallbacks is made only in this prompt text. The next reader
    looks for it in the node, finds only the node-type lookup, and cannot tell whether the single-name
    search was decided.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, step 1 (lines 105-107), the instruction for a run still running
  evidence: '"1. Chame `get_ingestion_status` UMA UNICA VEZ para confirmar que a", "ingestao alcancou
    `status: \"completed\"`. Se ainda estiver em", "`running`, informe e PARE — nao tente descrever o
    que foi ingerido."'
  cost: 'This tells the assistant what to do when the owner asks for the result while the run has not
    completed: report and stop, and do not describe what was ingested. The candidate v2 nodes cover returning
    while running, no polling within the starting turn, and following up by asking the status. None covers
    this behavior, so it lives only in the prompt text.'
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, steps 3 and 4 (lines 122-128)
  evidence: '"3. Cite a fonte: o campo `raw_information_id` retornado por", "   `get_ingestion_status`
    identifica o documento ingerido — mencione-o", "   ao dono." and "Em caso de duvida,", "   recuse
    a resposta e replaneje pelos passos 2.a / 2.b."'
  cost: Two directives are stated only in the prompt. The assistant must mention `raw_information_id`
    to the owner, and in case of doubt it must refuse the answer and replan. The candidate chat-prompt-v1-cites-sources
    says only to cite the source. The specific field to cite and the refuse-and-replan instruction are
    decisions no node holds.
- file: src/modules/chat/prompts/v4.ts
  where: BLOCK_4C_DIRECTED_INGESTION, opening paragraph, lines 100-104
  evidence: '"Frases de gatilho tipicas: \"crie\",", "\"registre\", \"linke\", \"ingerir esta informacao\".
    Se nao houver", "pedido explicito, NAO chame esta ferramenta — apenas responda em texto."'
  cost: The prompt the assistant is sent names four specific phrases as what an explicit owner request
    to record looks like. No node holds that list. The node that governs the gate says only "when the
    owner's own message asks it to record knowledge". The list therefore lives only in this string, and
    the next reader will look for it in the specification and not find it.
- file: src/modules/chat/routes/chat.schemas.ts
  where: buildChatTurnRequestSchema and the ChatTurnRequest type, lines 12-41 (with ChatMessageSchema
    and ChatRoleSchema, lines 3-10)
  evidence: "messages: z\n  .array(ChatMessageSchema)\n  .min(1, \"messages must contain at least 1 entry\"\
    )\n  .max(opts.maxHistoryMessages, `messages must contain at most ${opts.maxHistoryMessages} entries`),\n\
    ...\n.refine((v) => v.messages[0]?.role === \"user\", {\n  message: \"first message must have role=user\"\
    ,"
  cost: 'The file states a request shape that no node holds: a turn request carrying a list of role/content
    messages, at least one and at most a configured number, the first of them from the user. The specification''s
    send-message operation takes a single content and an optional model. A grep of backend/src finds no
    use of buildChatTurnRequestSchema or ChatTurnRequest outside this file, and modules/chat/index.ts
    re-exports only ChatMessageSchema and ChatRoleSchema from this group. The rule therefore lives only
    here. The next reader looks for it in the specification and does not find it, and the first-message
    role refusal reads like a decision the business made.'
- file: src/modules/chat/service/args-summary.ts
  where: the "get_ingestion_status" case, lines 152-156
  evidence: const llmRunId = readString(obj, "llm_run_id"); if (llmRunId === undefined) return fallbackSummary(obj);
    return `llm_run_id=${llmRunId}`;
  cost: The summary of an ingestion status read, showing the run identity, appears in no node. The tool-start-read-summary
    node covers identity-alone summaries only for node reads, history reads and provenance reads, so this
    format is held only by the code.
- file: src/modules/chat/service/args-summary.ts
  where: the "start_async_ingestion" case, lines 142-150
  evidence: const contentLen = [...content].length; return `source_type=${sourceType} content_len=${contentLen}`;
  cost: The summary of a directed ingestion start, showing source_type and the content length in code
    points, is a domain fact that appears only here. tool-start-summary-bounded says only that the content
    is never carried. The next reader looks in the specification for what the owner sees for an ingestion
    start and finds nothing.
- file: src/modules/chat/service/chat-agent.service.ts
  where: line 53, MAX_TOKENS_PER_ITERATION, used at line 255 in the stream request
  evidence: 'const MAX_TOKENS_PER_ITERATION = 4096; ... max_tokens: MAX_TOKENS_PER_ITERATION,'
  cost: This number caps how long each assistant answer can be, and a longer answer is cut off and ends
    the turn as max-tokens. It is not configurable and no node states it. The next reader will look for
    the cap in the specification, find nothing, and take the code's 4096 as the business decision. The
    turn rules in the set (turn-model-call-limit and turn-time-limit) each state their number and say
    it is configurable.
- file: src/modules/chat/service/chat-agent.service.ts
  where: synthesiseInternalErrorEnvelope, lines 672-680, reached from the rejection handler at line 650
  evidence: 'code: "SYSTEM_INTERNAL_ERROR", message: errMessage(err) ?? "tool handler threw",'
  cost: A tool that throws hands the assistant, and the owner via error_message, the raw exception message,
    or the fixed text "tool handler threw" when there is none. No node states this. The conversations
    contract fixes the stream-level internal-error message but not this one. The disclosure rule for a
    thrown tool failure lives only in code.
- file: src/modules/chat/service/chat-agent.service.ts
  where: the unknown-tool branch (lines 416-423) and the timeout envelope in raceToolHandler (lines 633-640)
  evidence: 'error: { code: "VALIDATION_INVALID_FORMAT", message: "unknown tool name", } and error: {
    code: "SYSTEM_SERVICE_UNAVAILABLE", message: "tool timeout", }'
  cost: The code and wording of the failure handed to the assistant live only here. The node says that
    failure is handed over and the turn continues, but it does not say what the assistant is told. The
    same text is also returned to the owner in the tool_result error_message. I found no node or contract
    that states these two messages. The next reader will not find them in the specification.
- file: src/modules/chat/service/datetime-block.ts
  where: 'renderDatetimeBlockB, line 37: the template that appends the zone identifier in parentheses'
  evidence: return `${ISO_PREFIX}${iso} (${tz})`;
  cost: The text sent to the assistant ends with the owner's zone identifier in parentheses. The nodes
    that govern this statement fix only its opening words, and the ISO-8601 time with offset in the owner's
    zone. Nothing says the zone id is stated, in parentheses, after the time. The shape is decided here,
    so the next reader looks in the specification and does not find it.
- file: src/modules/chat/service/distillation.service.ts
  where: const SUMMARY_MAX_TOKENS = 600, line 146, passed as max_tokens in the anthropic.messages.create
    call of maybeRefreshSummary (line 277)
  evidence: 'const SUMMARY_MAX_TOKENS = 600; ... max_tokens: SUMMARY_MAX_TOKENS,'
  cost: 'This is a numeric ceiling on the model output of a rolling-summary refold. No node holds it.
    The nearest node, rules/chat/rolling-summary-length, bounds the trimmed summary in characters (1 to
    2000) and says nothing about tokens. The figure is easy to mistake for an implementation detail. A
    change to it changes which summaries come back cut short and then pass or fail the length rule. The
    next reader looks in the specification for the ceiling and finds nothing. The docstring of maybeRefreshSummary
    also says max_tokens: 512, which differs from this value.'
- file: src/modules/chat/service/distillation.service.ts
  where: const TITLE_MAX_TOKENS = 64, line 147, passed as max_tokens in the anthropic.messages.create
    call of maybeDistillTitle (line 404)
  evidence: 'const TITLE_MAX_TOKENS = 64; ... max_tokens: TITLE_MAX_TOKENS,'
  cost: This is a numeric ceiling on the model output of title distillation. No node holds it. rules/chat/distilled-title-length
    bounds the trimmed title in characters (1 to 80) and says nothing about tokens. A change to it changes
    which titles are cut short and then dropped by the length check. The next reader looks in the specification
    for the ceiling and finds nothing.
- file: src/modules/chat/service/graph-normalizer.ts
  where: '`normalizeIngestDirected`, link loop, lines 507-517'
  evidence: '// Compound ref: "<source_ref>-><link_type>-><target_ref>". Parse via // FIRST/LAST ''->''
    to survive link_type slugs that themselves contain const first = entry.ref.indexOf("->"); const last
    = entry.ref.lastIndexOf("->");'
  cost: The code reads a link item's `ref` as the string `source->link_type->target` and takes the link's
    ends and type from it. No node in the specification holds this ref format. `directed-item` holds `ref`
    only as a string, and `directed-item-reference-length` holds only a length of 1 to 120. The format
    is produced in the ingestion module. The next reader looks in the specification for how a link item
    is named, finds nothing, and the parse here becomes the only record of it.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: closeRunCompletedSafe (lines 1006-1034) and the affected-nodes resolution catch block in step
    5 (lines 767-787)
  evidence: 'logger.warn(... event: "directed_ingestion_close_failed" ...) after `/* swallow */`; and
    `// resolvedAffected stays []; the run is still completed.`'
  cost: 'A failed close of the run row is swallowed and logged only. The result still says `status: "completed"`,
    so the run row can stay running while the response claims completion. A failed affected-nodes resolution
    yields an empty `affected_nodes` list, which the chat treats as «a completed run lists no affected
    nodes». The specification holds that a directed ingestion completes its run whatever its items'' statuses,
    but not these degraded paths. The next reader will find them only in this code.'
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe, the `fallback` constant and its two uses (lines 1050-1054, 1067 and 1087),
    which feed `run.started_at`, `run.finished_at` and `run.attempts` in the returned result (lines 818-820)
  evidence: "const fallback = {\n    started_at: new Date(0).toISOString(),\n    finished_at: new Date(0).toISOString(),\n\
    \    attempts: 1,\n  };"
  cost: When the closed run row is missing or cannot be read, the result reports a completed run that
    started and finished at 1970-01-01T00:00:00.000Z with one attempt. A caller cannot tell these placeholders
    from real times. The specification only says a run holds a finish time exactly when its status is
    not running. A reader looking for what a directed result reports when its run cannot be read will
    not find this rule in the specification. The same applies to `finished_at` on a row whose finish time
    is null.
restates:
- file: src/modules/chat/prompts/chat-summary/index.ts
  where: the header comment (lines 14-19) and the docstrings of UnknownChatSummaryPromptVersionError and
    selectChatSummaryPromptModule (lines 69-73, 86-90)
  evidence: '"an unknown `CHAT_SUMMARY_PROMPT_VERSION` is a configuration error, NEVER a silent fallback."
    and "Resolve a chat-summary prompt module by version string. Throws `UnknownChatSummaryPromptVersionError`
    for an unregistered version (BR-46 — fail loud, never silently substitute a different prompt)."'
  cost: The rule that a summary prompt version must be one the system holds is stated in prose as well
    as in code. A reader can take the comment for a second authority, and it will not follow the node
    if the node changes.
  node: rules/chat/summary-prompt-version-known
- file: src/modules/chat/prompts/chat-summary/index.ts
  where: the header comment (lines 21-23) and the docstring above DEFAULT_CHAT_SUMMARY_PROMPT_VERSION
    (lines 56-61)
  evidence: '"`v2` is the incremental fold (BR-46, default — selected by BR-33 v2.9)." and "Recommended
    default for NEW deployments — used when env is unset. v2.9 makes `v2` the default (incremental fold)."'
  cost: The default summary prompt version is stated in prose as well as in code. When the node's default
    moves, the comments keep saying v2 and nothing flags them. The comment's "BR-33 v2.9" citation also
    sends the next reader to a back-spec rule instead of the node that holds the fact.
  node: rules/chat/default-summary-prompt-version
- file: src/modules/chat/prompts/index.ts
  where: the comment above const V4 (line 70)
  evidence: ASK-the-Owner-for-missing-date directive,
  cost: The comment restates that the assistant asks the owner for a missing start date. The comment is
    not the home of that rule, but a reader may treat it as one.
  node: rules/chat/chat-prompt-v4-asks-start-date
- file: src/modules/chat/prompts/index.ts
  where: the comment above const V4 (line 70)
  evidence: REPORT inline per-item result,
  cost: The comment restates that the assistant reports the status of each item of a directed ingestion.
    It has no authority over the prompt, and it will not change if the node does.
  node: rules/chat/chat-prompt-v4-reports-each-item
- file: src/modules/chat/prompts/index.ts
  where: the comment above const V4 (lines 65-71)
  evidence: // Preserves block 4A (ontology) and block 4B (search discipline) verbatim // from v3 and
    REPLACES block 4C with the directed-ingestion playbook (when // to use `ingest_directed`, payload
    skeleton with refs + `node_id` pin,
  cost: The comment says in prose that directed ingestion is the assistant's way to write. The prompt
    text that holds this is in v4.ts. A reader who edits the playbook may take this comment as the statement
    of the rule, and it will not change when the node does.
  node: rules/chat/chat-prompt-v4-directed-ingestion-writes
- file: src/modules/chat/prompts/index.ts
  where: the comment above const V4 (lines 66-70)
  evidence: payload skeleton with refs + `node_id` pin,
  cost: The comment restates that the node identity pins the entity a directed ingestion re-affirms. A
    second statement outside behavior can drift from the v4 prompt text unnoticed.
  node: rules/chat/chat-prompt-v4-pins-known-entity
- file: src/modules/chat/prompts/index.ts
  where: the comment above const V4 (lines 70-71)
  evidence: no auto-loop). Marker re-used verbatim from v1 (BR-20 stable across
  cost: The comment restates the one-ingestion-per-command rule. Code holds the same fact in v4.ts, where
    the prompt tells the assistant "NAO faca auto-loop — NAO chame `ingest_directed` repetidamente".
  node: rules/chat/chat-prompt-v4-one-ingestion-per-command
- file: src/modules/chat/prompts/v3.ts
  where: the file header comment, lines 13-17 (Block 4B)
  evidence: '"`search` is lexical AND (one specific name per call, never concatenate", "multiple proper
    nouns); `list_nodes` MUST carry a `node_type` filter", "when used as category enumeration; `list_node_types`
    /", "`list_link_types` / `list_attribute_keys` are the discovery primitives."'
  cost: 'This is prose that no running system emits, and it restates facts the nodes hold: search-one-name,
    search-is-lexical-and, list-by-node-type and discovery-listings. BLOCK_4B_SEARCH_DISCIPLINE in this
    file holds those facts as emitted text. The comment is a second home for them. If a node moves, the
    comment keeps saying the old fact and nothing flags it.'
  node: rules/chat/chat-prompt-search-one-name
- file: src/modules/chat/prompts/v3.ts
  where: the file header comment, lines 18-24 (Block 4C)
  evidence: '"The model", "MUST consult `result.affected_nodes` FIRST (TC-5 propagation, BR-43 /", "BR-45
    amendments) and do direct `get_node` / `traverse` lookups; the", "`search` / `list_nodes(node_type=...)`
    path is the fallback when", "`affected_nodes` is empty or absent; an unfiltered `list_nodes(limit:30)`",
    "used as \"what was ingested\" is forbidden."'
  cost: This is prose that restates the facts held by affected-nodes-first, fallback-lists-by-node-type
    and unfiltered-listing-is-not-ingested. BLOCK_4C_POST_INGESTION_PLAYBOOK holds them as emitted text.
    The comment also names `limit:30`, a value that appears in no node and in no emitted text.
  node: rules/chat/chat-prompt-affected-nodes-first
- file: src/modules/chat/prompts/v4.ts
  where: header comment, lines 11-13 (item 1 of the block 4C summary)
  evidence: '"(1) `ingest_directed` is the SINGLE write-bearing entry from chat,"'
  cost: A comment says the fact the node holds, and the prompt string BLOCK_4C_DIRECTED_INGESTION already
    holds it as code. The comment is a second home outside behavior, and it will drift from the node unnoticed.
  node: rules/chat/chat-prompt-v4-directed-ingestion-writes
- file: src/modules/chat/prompts/v4.ts
  where: header comment, lines 15-17 (item 2 of the block 4C summary)
  evidence: '"MAY use the `node_id` pin on a node item to re-affirm a known entity it just retrieved via
    `query`;"'
  cost: A comment says the pin rule, and the prompt string already holds it as code (item 2 of block 4C).
    The comment is a second home that `--check` never reaches.
  node: rules/chat/chat-prompt-v4-pins-known-entity
- file: src/modules/chat/prompts/v4.ts
  where: header comment, lines 18-20 (item 3 of the block 4C summary)
  evidence: '"the model MUST ASK the Owner — never silently fall back to the `received` basis;"'
  cost: A comment says the ask-the-start-date rule, and the prompt string already holds it as code (item
    3 of block 4C). The comment is a second home outside behavior.
  node: rules/chat/chat-prompt-v4-asks-start-date
- file: src/modules/chat/prompts/v4.ts
  where: header comment, lines 21-23 (item 4 of the block 4C summary)
  evidence: '"the model MUST REPORT the per-item result inline (`accepted` / `consolidated` / `needs_review`
    / `rejected` / `dependency_failed`);"'
  cost: A comment says the report-each-item rule, and the prompt string already holds it as code (item
    5 of block 4C). The comment is a second home outside behavior.
  node: rules/chat/chat-prompt-v4-reports-each-item
- file: src/modules/chat/prompts/v4.ts
  where: header comment, lines 24-27 (item 5 of the block 4C summary)
  evidence: '"(5) NO auto-loop — each command is a single `ingest_directed` call followed by the natural-language
    answer;"'
  cost: A comment says the one-call-per-command rule, and the prompt string already holds it as code (item
    5 of block 4C). The comment is a second home outside behavior.
  node: rules/chat/chat-prompt-v4-one-ingestion-per-command
- file: src/modules/chat/repository/chat.repository.ts
  where: the comment above the listRecentRealTurns member of the ChatRepository interface (lines 206-213)
    and the comment above the function listRecentRealTurns (lines 656-673, with the inline comment at
    lines 681-687)
  evidence: '"// BR-31 v2.9: turn-based recent window. Returns every chat_message row that // belongs
    to one of the last `turn_count` REAL turns (a real turn is anchored // by a `role=''user'' AND idempotency_key
    IS NOT NULL` row), in chronological // ASC order ... When fewer than `turn_count` // real turns exist,
    all rows from the available turns are returned (no error, // no padding)."'
  cost: The recent-window rule is written out in prose in the interface and again above the function,
    while the WITH boundary / fallback query holds it as code. The prose is a second home that has to
    be kept in step with rules/chat/model-context-window by hand. The next reader may take the comment,
    not the node, as the place the window was decided.
  node: rules/chat/model-context-window
- file: src/modules/chat/routes/conversations.routes.ts
  where: Comment in emitChatBootLog, lines 1271-1274 (CHAT_RECENT_WINDOW).
  evidence: '`// BR-31 v2.9: CHAT_RECENT_WINDOW changed UNIT (rows -> turns) and DEFAULT (10 -> 6) in
    chat-context-fidelity TC-01.`'
  cost: 'The default of 6 is restated in prose here, and the code that holds it is `CHAT_RECENT_WINDOW:
    z.coerce.number().int().min(1).default(6)` in src/config/env.ts. A reader who finds the number here
    has a second place to maintain when the node moves.'
  node: rules/chat/model-context-window
- file: src/modules/chat/routes/conversations.routes.ts
  where: Comment in emitChatBootLog, lines 1305-1308 (OWNER_TZ).
  evidence: '`// because `OWNER_TZ` carries a fail-closed default (`America/Sao_Paulo`) —`'
  cost: 'The zone is restated in prose here, and the code that holds it is `OWNER_TZ: z.string().min(1).default("America/Sao_Paulo")`
    in src/config/env.ts. The comment is a second home for the default.'
  node: rules/chat/owner-time-zone-default
- file: src/modules/chat/service/args-summary.ts
  where: header comment line 15 and the comment at line 43
  evidence: '"- search:                        query="<first 60 chars of query>" (+ optional layers=...
    expand_depth=<n>)"'
  cost: The search format and the 60-character figure appear in prose as well as in code, so a change
    to the node leaves a stale second statement beside the code.
  node: rules/chat/tool-start-search-summary
- file: src/modules/chat/service/args-summary.ts
  where: header comment line 16
  evidence: '"- get_node, traverse:            id=<uuid> (+ depth=<n> for traverse)"'
  cost: The traversal format is restated in prose, and a change to the node would leave the comment contradicting
    the code.
  node: rules/chat/tool-start-traversal-summary
- file: src/modules/chat/service/args-summary.ts
  where: header comment line 18
  evidence: '"- get_history_attribute_key:     node_id=<uuid> key=<key>"'
  cost: The attribute-key history format is restated in prose beside the case that holds it.
  node: rules/chat/tool-start-attribute-history-summary
- file: src/modules/chat/service/args-summary.ts
  where: header comment lines 16-17 and 22
  evidence: '"- get_node, traverse:            id=<uuid> (+ depth=<n> for traverse)" and "- get_provenance_*:              id=<uuid>"'
  cost: The identity-alone format for reads, history reads and provenance reads is restated in prose beside
    the cases that hold it.
  node: rules/chat/tool-start-read-summary
- file: src/modules/chat/service/args-summary.ts
  where: header comment lines 19-21
  evidence: "\"- list_nodes:                    node_type=<name> limit=<n> - list_node_types/link_types/\n\
    \  attribute_keys:                \"\"  (no args)\""
  cost: The listing formats, including the empty catalog-listing summary, are said in prose as well as
    in code.
  node: rules/chat/tool-start-listing-summary
- file: src/modules/chat/service/args-summary.ts
  where: header comment lines 34-38 and the comment at line 159
  evidence: '"Fallback when the input shape is unexpected: `<n keys>` — the dispatcher counts top-level
    keys and emits that string (e.g. `"3 keys"`). The fallback also fires for an unknown tool name"'
  cost: The fallback rule is stated again in prose, and the prose misattributes the counting to the dispatcher
    when fallbackSummary() in this file does it.
  node: rules/chat/tool-start-summary-fallback
- file: src/modules/chat/service/args-summary.ts
  where: header comment, lines 11-12 and 26-32, plus the doc comments at lines 40 and 53
  evidence: '"2. Bounded length — `<= 200` code points (matches the openapi.yaml ToolStartEvent.args_summary
    `maxLength: 200` schema, line 489)." and "the `args_summary` for `start_async_ingestion` MUST NEVER
    include the raw `content` payload"'
  cost: The 200 cap and the ban on carrying ingestion content are said twice, once as prose here and once
    in clampToMax / the start_async_ingestion branch. When the node moves, this prose keeps saying the
    old figure and the next reader cannot tell which was decided.
  node: rules/chat/tool-start-summary-bounded
- file: src/modules/chat/service/context-builder.ts
  where: step 2 of the doc comment on buildModelContext, lines 129-131
  evidence: 'pt-BR string of the exact shape `"Data/hora atual do dono: <ISO-8601 with offset> (<tz-id>)"`.'
  cost: 'The opening words of the owner date-and-time statement are written a second time in prose. Code
    holds them in backend/src/modules/chat/service/datetime-block.ts (`const ISO_PREFIX = "Data/hora atual
    do dono: " as const;`). This file never states them in code.'
  node: rules/chat/model-context-owner-time-opening
- file: src/modules/chat/service/context-builder.ts
  where: the doc comment on `ownerTz` in BuildModelContextInput, line 88
  evidence: '`env.OWNER_TZ` (default `"America/Sao_Paulo"`). `loadEnv` validates the'
  cost: 'The owner time zone default is written a second time in prose. Code holds it in backend/src/config/env.ts
    (`OWNER_TZ: z.string().min(1).default("America/Sao_Paulo")`). A change to the node leaves this comment
    stale.'
  node: rules/chat/owner-time-zone-default
- file: src/modules/chat/service/context-builder.ts
  where: the doc comment on `recentLimit` in BuildModelContextInput, line 95
  evidence: row-based; typically `env.CHAT_RECENT_WINDOW`, default 6). A real turn is
  cost: 'The default window of 6 is written a second time in prose. Code holds it in backend/src/config/env.ts
    (`CHAT_RECENT_WINDOW: z.coerce.number().int().min(1).default(6)`). If the node moves, this comment
    goes on saying 6 and nothing checks it.'
  node: rules/chat/model-context-window
- file: src/modules/chat/service/datetime-block.ts
  where: the header comment (lines 1-7) and the docstring of renderDatetimeBlockB (lines 22-34)
  evidence: '// `"Data/hora atual do dono: <ISO-8601 with offset> (<tz-id>)"` and * @returns    The exact-shape
    string per BR-47 step 2 example.'
  cost: 'The opening words are held twice: in the code (the ISO_PREFIX constant) and in the header comment
    and docstring. When the node changes, the comment still names the old wording. The comment also points
    readers to a BR-47 step list instead of the specification node.'
  node: rules/chat/model-context-owner-time-opening
- file: src/modules/chat/service/graph-normalizer.ts
  where: '`GraphLinkWire.link_type_label` docstring, lines 81-88'
  evidence: '* Optional pt-BR display label of the LinkType, projected server-side from * the catalog
    row (`link_type.label`). Additive in v2.4.0 — OMITTED when * the slug is not present in the catalog
    snapshot (open-ontology fallback);'
  cost: 'The docstring repeats the rule that a link carries its catalog label and none when the catalog
    lacks the link type. The code holds it in `...(linkTypeRow !== undefined ? { link_type_label: linkTypeRow.label
    } : {})`. Comments at lines 215-218 and 533-534 repeat it again.'
  node: rules/chat/graph-delta-link-label
- file: src/modules/chat/service/graph-normalizer.ts
  where: '`normalizeIngestDirected` docstring item 4, lines 437-442, and comment at lines 544-546'
  evidence: '*   4. **Omitted fields** — `is_in_effect`, `status` (assertion_status), *      and `flags`
    are OMITTED from every link on the directed path.'
  cost: The docstring and the in-code comment both state that directed links carry no effectiveness, status
    or flags. The code holds this by building `out` with only `id`, `source_node_id`, `target_node_id`,
    `link_type`, `link_type_label` and `is_temporal`. The prose is a duplicate that goes stale if the
    node changes.
  node: rules/chat/graph-delta-directed-links-bare
- file: src/modules/chat/service/graph-normalizer.ts
  where: '`normalizeIngestDirected` docstring, lines 410-412'
  evidence: If `run.affected_nodes` is absent, `nodes = []` and the *      frame still emits (an empty
    `{nodes:[], links:[]}` delta is *      contractual — BR-41 v2.11).
  cost: 'The docstring says again that a directed ingestion which affected nothing still gets an empty
    delta. The code holds it with the `rawAffected` default of `[]` and the final `return { source_tool:
    "ingest_directed", nodes, links };`. The comment is a second home that can drift from the node.'
  node: rules/chat/graph-delta-directed-empty
- file: src/modules/chat/service/graph-normalizer.ts
  where: '`normalizeSearch`, comment at lines 379-381'
  evidence: // If `byId.get(id)` is undefined, the node was deleted between the // search and the hydration
    (rare race) — we just drop it. The front-end // never knew about it; no need to surface a placeholder.
  cost: The comment states again that a found node no longer held is left out of the delta. The code already
    does this with `if (node !== undefined) nodes.push(node);`, so the comment is a second home for the
    fact.
  node: rules/chat/graph-delta-search-drops-vanished-node
- file: src/modules/chat/service/graph-normalizer.ts
  where: file header lines 39-42 and the `ingest_directed` docstring, lines 444-448 (comments on unreadable
    results)
  evidence: // every tool call. A guard miss returns an empty delta (`{nodes:[], links:[]}`) // rather
    than throwing, so a broken tool result never crashes the SSE stream. and *   5. **Envelope guard**
    — if `result` is not a well-formed object return *      `null` (the other arms return an empty delta
    on this branch, but *      BR-41 v2.11 says return `null` for the ingest_directed path
  cost: The rule that an unreadable result gives an empty delta, except for directed ingestion which gives
    none, is written again as prose. The code holds it in the `isRecord` guards of each arm and in `if
    (!isRecord(result)) return null;`. A change to the node would leave these comments saying the old
    rule.
  node: rules/chat/graph-delta-unreadable-result
- file: src/modules/chat/service/graph-normalizer.ts
  where: file header, lines 13-17 (comment on tools that return null)
  evidence: // Every other tool (`list_node_types`, `list_link_types`, `list_attribute_keys`, // `get_history_*`,
    `get_provenance_*`) returns `null` from the dispatcher — a // quiet no-op, NOT an empty delta.
  cost: The comment says again that catalog listings, history reads and provenance reads get no graph
    delta. The dispatcher already holds this in code, and it is a second copy that goes stale when the
    node moves.
  node: rules/chat/graph-delta-absent-for-catalog-history-provenance
- file: src/modules/chat/service/output-guard.ts
  where: Header comment, property 1, lines 11-16.
  evidence: '"the canary token planted at the head of the prompt. This keeps the guard prompt-copy-agnostic"'
  cost: The fact that every prompt version begins with the one marker is restated as prose in a file this
    node does not govern. The code that holds it is the `CHAT_PROMPT_MARKER_V1` constant in prompts/v1.ts.
    The comment would not follow if the node changed.
  node: rules/chat/chat-prompt-carries-marker
- file: src/modules/chat/service/output-guard.ts
  where: The header comment, lines 1-26, and the JSDoc on MARKER_VERSION and inspectDelta, lines 32-57.
  evidence: '"the delta is dropped — not yielded, not aggregated into the assistant turn that will be
    fed back on the next iteration."'
  cost: 'The rule that marker-bearing assistant text is neither streamed nor kept is written here in prose
    as well as held by the code. The comment sits in a file that no node binds. When the node moves, nothing
    reaches this prose, so a reader can take it for the decided rule. The code that holds the fact is
    `if (decision.drop) return;` in src/modules/chat/service/chat-agent.service.ts line 279, together
    with `drop: true` in this file.'
  node: rules/chat/assistant-text-withholds-system-prompt
- file: src/modules/chat/service/tool-catalog.ts
  where: the header comment (lines 1-31) and the doc comments on CHAT_TOOL_NAMES (lines 37-38), CHAT_INGEST_TOOL_NAMES
    (lines 57-62), ResolvedChatToolCatalog (lines 70-76) and buildChatToolCatalog (lines 99-121)
  evidence: '"The 13 read-only `query`-toolset tools the chat agentic loop is always allowed to call (BR-05
    v2.4 step 1)." and "The `ingest`-toolset tool added to the chat catalog when `env.CHAT_INGEST_ENABLED
    === true` (BR-05 v2.8 step 2 / BR-44 v2.8)." and "`undefined` when at least ONE of the 13 query names
    is missing in the registry (route is not mounted — BR-05)."'
  cost: 'These comments say again, in prose, what constraints/chat-toolset holds: which tools the assistant
    has, and that directed ingestion is offered only where chat ingestion is enabled and available. The
    running code holds the same fact in this file, in the CHAT_TOOL_NAMES array and in the `if (ingestFlag)`
    branch. When the node moves, nothing reaches the comments, so the next reader finds a second statement
    of the toolset, quoting retired back-spec rule ids (BR-05, BR-44), that can disagree with the node
    unnoticed.'
  node: constraints/chat-toolset
- file: src/modules/chat/service/truncate-tool-result.ts
  where: The header comment, line 5 (the comment block before the TruncateOutput interface).
  evidence: //   - The ceiling is `env.TOOL_RESULT_MAX_CHARS` (default 8000), advertised
  cost: 'The 8000-character default is stated here in prose as well as in the node. The code that holds
    it is the zod default `TOOL_RESULT_MAX_CHARS: z.coerce.number().int().min(1).default(8000)` in backend/src/config/env.ts.
    If the node or that default changes, this comment keeps the old number and gives the next reader a
    second, unbound home for the fact.'
  node: rules/chat/tool-result-truncated
- file: src/modules/chat/service/turn-registry.ts
  where: the header comment (lines 1-30) and the docstrings of get() and release() (lines 48-56, 61-65)
  evidence: '"chat.back.md v2.0.0 §1.1 / BR-28: \"At most ONE in-flight turn per conversation is enforced
    by an in-process registry (`Map<conversation_id, AbortController>`), keyed by conversation id\"" and
    "the turn is still running -> 409 BUSINESS_TURN_IN_PROGRESS" and "`cancelTurn` (BR-38: absent -> 404
    RESOURCE_NOT_FOUND)"'
  cost: 'The comments restate the rules "a conversation has at most one turn in flight" and "cancelling
    needs a turn in flight" in prose, with the refusal codes beside them. If the node moves, nothing reaches
    these lines, and the next reader finds a second statement of the rule that cites a back-spec (BR-28,
    BR-38) in place of the specification node. The code that holds the first rule here is the module-scoped
    `const registry: Map<string, AbortController> = new Map();` keyed by conversation id. The guard that
    returns 409 and the 404 on cancel sit in callers the comments name (sendMessage, cancelTurn). I did
    not read those callers because they are outside the file set.'
  node: rules/chat/one-turn-in-flight
adopted: true
unheld:
- node: rules/chat/chat-enabled-by-default
  how: 'read on 23 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/chat/directed-ingestion-disabled-by-default
  how: 'read on 23 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/chat/distillation-enabled-by-default
  how: 'read on 23 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/chat/owner-time-zone-default
  how: 'read on 23 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/chat/utility-model-default
  how: 'read on 23 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
pairs_omitted:
- node: domain/chat/summary-prompt-version
  file: src/modules/chat/prompts/chat-summary/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/default-summary-prompt-version
  file: src/modules/chat/prompts/chat-summary/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/summary-prompt-version-known
  file: src/modules/chat/prompts/chat-summary/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/chat-prompt-version
  file: src/modules/chat/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-version-known
  file: src/modules/chat/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/default-chat-prompt-version
  file: src/modules/chat/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distilled-title-length
  file: src/modules/chat/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/chat-content-is-data
  file: src/modules/chat/prompts/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-answers-in-portuguese
  file: src/modules/chat/prompts/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-states-uncertainty
  file: src/modules/chat/prompts/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-withholds-internals
  file: src/modules/chat/prompts/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-carries-marker
  file: src/modules/chat/prompts/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-carries-marker
  file: src/modules/chat/prompts/v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-carries-marker
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-presents-catalog
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/chat-content-is-data
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-writes-only-on-owner-request
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-carries-marker
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-presents-catalog
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/assistant-stop-reason
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/conversation
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/conversation-usage
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/message
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/message-listing
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/message-role
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/tool-call
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-answer-recorded
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-listing-excludes-archived
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-listing-order
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-update-partial
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-usage-counts
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distilled-title-never-overwrites
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-view-replaced-on-save
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/iteration-recorded
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/message-listing-shows-exchanges
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/owner-message-recorded-first
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/owner-written-message
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/rolling-summary-overlap
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/rolling-summary-refresh
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/title-distillation
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-call-recorded
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-ending-message
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/conversation-listing
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/graph-layout
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/graph-view
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/message-listing
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/message-role
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/turn
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-listing-excludes-archived
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-listing-limit
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-title-length
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-update-names-a-field
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-view-snapshot-bounds
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/message-listing-limit
  file: src/modules/chat/routes/chat.schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/archived-conversation-takes-no-turn
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-answer-recorded
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/cancel-requires-turn-in-flight
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-toolset-requires-every-query-tool
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-archived
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-request-check-order
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-update-names-a-field
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distillation-follows-live-turn
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/idempotency-match
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/idempotent-recovery
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/idempotent-replay
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/one-turn-in-flight
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/owner-message-recorded-first
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/recording-failure-keeps-stream
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-call-recorded
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-cancel
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-failure-stop-reason
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-stop-reason
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-start-summary-bounded
  file: src/modules/chat/service/args-summary.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-text-withholds-system-prompt
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/iteration-recorded
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-invocation-carries-turn
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-cancel
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-ends-once
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-failure-stop-reason
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-limit-before-cancel
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-stop-reason
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-one-tool-at-a-time
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-reports-last-model
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-tokens-summed
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/chat-reads-are-consistent
  file: src/modules/chat/service/context-builder.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/model-context-owner-time
  file: src/modules/chat/service/context-builder.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/model-context-rolling-summary
  file: src/modules/chat/service/context-builder.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/chat-reads-are-consistent
  file: src/modules/chat/service/conversation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/conversation-listing
  file: src/modules/chat/service/conversation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-listing-order
  file: src/modules/chat/service/conversation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-request-check-order
  file: src/modules/chat/service/conversation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/conversation-update-partial
  file: src/modules/chat/service/conversation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/model-context-owner-time
  file: src/modules/chat/service/datetime-block.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distillation-failure-changes-nothing
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distilled-title-length
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distilled-title-never-overwrites
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/rolling-summary-length
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/rolling-summary-overlap
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/rolling-summary-refresh
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/title-distillation
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/graph-delta
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/graph-delta-link
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/graph-delta-node
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-delta-content
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-delta-directed-links
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-delta-directed-nodes-active
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-delta-drops-incomplete
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-delta-link-temporal
  file: src/modules/chat/service/graph-normalizer.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/assistant-text-withholds-system-prompt
  file: src/modules/chat/service/output-guard.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-toolset-requires-every-query-tool
  file: src/modules/chat/service/tool-catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/one-turn-in-flight
  file: src/modules/chat/service/turn-registry.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-chat-pointer-whole
  file: src/modules/ingestion/mcp/directed-ingest.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-turn-is-original-input
  file: src/modules/ingestion/mcp/directed-ingest.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-kind
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-status
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-as-text
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-shape
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-chat-pointer-whole
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-defaults
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/directed-dependency-failed
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-dispatch-order
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-fragments-anchor-first-chunk
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-full-confidence
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-ingestion-run
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-item-status
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-later-reference-wins
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-pinned-node
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-reference-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-requires-fragment-and-node
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-run-completes
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-content
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-label-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-metadata
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-turn-is-original-input
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-validity-start-shape
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-name-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 23 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/adopt-test-intent-chat.returns/.\nStaged as an adoption of source no delivery\
  \ wrote: 46 candidate node(s) were read on every file, and each cleared one is bound to the files whose\
  \ judgment holds its fact.\nA finding in src/modules/chat/repository/chat.repository.ts names rules/chat/message-listing-pages-backwards,\
  \ which no file of this set is bound to: listMessagesPaginated, lines 764-804: the query that selects\
  \ the page (ORDER BY created_at ASC ... LIMIT limit+1, then rows.slice(0, limit)). The route that consumes\
  \ the page computes next_before from page.items[0] (src/modules/chat/routes/conversations.routes.ts,\
  \ line 460).: \"WHERE conversation_id = $1${beforeClause}${displayFilter} ORDER BY created_at ASC, id\
  \ ASC LIMIT ${limitParam}\" followed by \"const items = hasMore ? rows.slice(0, limit) : rows;\". The\
  \ node says: \"A message listing's page is the most recent messages created before its given moment,\
  \ and the next page ends before the oldest of them.\" — The query returns the oldest `limit` messages\
  \ before the cursor, not the most recent ones. The node's own log records this same behavior as the\
  \ case the decision replaced: \"The material answers a message page with the oldest messages and a next-page\
  \ moment that selects messages older than that page, so following it from the first page finds nothing.\"\
  \ A conversation longer than one page therefore shows its oldest messages first, and following next_before\
  \ does not reach the rest of the history.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/chat/routes/chat.schemas.ts names contracts/chat/conversations, which no file\
  \ of this set is bound to: UpdateConversationRequest, the .refine at lines 53-59 (message carries the\
  \ code as a text prefix): .refine(\n  (body) => body.title !== undefined || body.archived_at !== undefined,\n\
  \  {\n    message:\n      \"VALIDATION_REQUIRED_FIELD: at least one of title or archived_at must be\
  \ present\",\n  }\n); — The contract says every update naming neither field answers HTTP 422 VALIDATION_REQUIRED_FIELD\
  \ with message \"at least one of title or archived_at must be present\". In the source, the refine only\
  \ fails Zod parsing. conversations.routes.ts calls UpdateConversationRequest.parse(request.body), and\
  \ middleware/error-handler.ts maps any ZodError to code VALIDATION_INVALID_FORMAT, message \"Request\
  \ payload failed validation.\", with the issues as details. The only path that returns VALIDATION_REQUIRED_FIELD\
  \ is the route's separate empty-body check. A body holding only other keys therefore answers VALIDATION_INVALID_FORMAT.\
  \ The code is written into the message text but never reaches the code field. That is the very split\
  \ the contract's decision log says was resolved, and a client branching on the code is told something\
  \ other than the node says.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/chat/routes/conversations.routes.ts\
  \ names rules/chat/send-message-check-order, which no file of this set is bound to: sendMessage handler,\
  \ steps (1) to (3): the Idempotency-Key header check and the body parse come before the kill-switch\
  \ check (lines 592-633).: `if (headerValue === undefined || headerValue === \"\") { return reply.code(422).send({\
  \ ... code: \"VALIDATION_REQUIRED_FIELD\", message: \"Idempotency-Key header is required\" ...` and\
  \ `const body = sendMessageSchema.parse(request.body ?? {});` both run before `// ---- (3) Kill-switch\
  \ (BR-14). if (killSwitchTripped(deps.env)) { return sendKillSwitch(reply); }`. The node reads: \"A\
  \ sent message is checked for a disabled chat, then its idempotency key, conversation identity and content,\
  \ then an absent conversation, ..., and is refused at the first check it fails.\" — A malformed message\
  \ sent while the chat is disabled is answered 422 for the missing or invalid key or content, and not\
  \ 503 BUSINESS_CHAT_DISABLED. Every other conversation operation in this file answers 503 first. The\
  \ node's decision log says why: \"A disabled surface answers that it is disabled whatever the request\
  \ holds.\". It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/chat/routes/conversations.routes.ts\
  \ names rules/chat/replay-reports-failure, which no file of this set is bound to: handleIdempotentReplay\
  \ (lines 1128-1155) and mapStoredStopReason (lines 1546-1562), the replay path of sendMessage.: `const\
  \ storedStop = mapStoredStopReason(assistantRow.stop_reason);` is followed by `frameJson(\"done\", {\
  \ stop_reason: storedStop, ...`. In mapStoredStopReason: `case \"provider_error\": case \"internal_error\"\
  : default: return \"end_turn\";`. The node reads: \"A replay of a turn that ended as provider-error\
  \ or internal-error ends in an error event as the live turn did, never in done.\" — A client that resends\
  \ under the same Idempotency-Key a turn that failed live gets a successful `done` with `end_turn` instead\
  \ of the `error` frame. The failure is reported to the owner as a normal answer. The rule's decision\
  \ log records that \"a replay exists to say again what the turn said.\". It blocks nothing here; it\
  \ is owed a route of its own.\nA finding in src/modules/chat/service/conversation.service.ts names contracts/chat/conversations,\
  \ which no file of this set is bound to: decodeCursor, lines 99-108 (the shape check on the decoded\
  \ cursor): typeof (parsed as { created_at?: unknown }).created_at !== \"string\" || typeof (parsed as\
  \ { id?: unknown }).id !== \"string\" — The contract answers a cursor that does not decode to a creation\
  \ time and a well-formed conversation identity with HTTP 422 VALIDATION_INVALID_FORMAT. Its log records\
  \ that the earlier material answered such cursors with an internal error instead. This decoder accepts\
  \ any pair of strings, so a cursor with a non-timestamp creation time or a non-identifier identity passes\
  \ it. That cursor then reaches the repository, and the 422 refusal is not produced here. I read only\
  \ this file, so I cannot see whether the route or the repository checks the two values elsewhere. If\
  \ neither does, a malformed cursor is the owner's error and is reported as a system fault.. It blocks\
  \ nothing here; it is owed a route of its own.\nCandidates: 72 opened across 19 of 23 delegation(s);\
  \ each return lists its own under `candidates_opened`.\nUnstated: 27 fact(s) the source states that\
  \ no node holds, over 12 file(s), listed under `unstated`. They block no binding here and no rebind\
  \ closes them — the route is the analysis that gives each fact a node.\nRestates: 39 place(s) where\
  \ text in the source restates a node's fact the code holds, over 14 file(s), listed under `restates`.\
  \ The pair conforms, so none blocks a binding — the route is removing the text, and reconciling the\
  \ file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-test-intent-chat.returns/`, which are the evidence behind every entry above.
