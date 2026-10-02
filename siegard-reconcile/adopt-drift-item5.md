---
contract_version: siegard-reconcile/8
title: Drift item 5 - chat nodes changed after their bind, and the tool-call recorder
summary: The chat source named here is adopted as it stands and did not change. The candidate is tool-call-recorded,
  whose fact is held where the tool call is written. The owner states the behavior is correct.
target: backend
files:
- path: src/modules/chat/prompts/v1.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/v3.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/prompts/v4.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/repository/chat.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/routes/conversations.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/chat-agent.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/context-builder.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/conversation.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/chat/service/distillation.service.ts
  change: adopted as it stands; unchanged
nodes:
- node: rules/chat/tool-call-recorded
  conforms: false
  how: src/modules/chat/service/chat-agent.service.ts is bound to this node and no longer holds its fact
  observed_at:
  - src/modules/chat/service/chat-agent.service.ts
- node: rules/chat/chat-prompt-carries-marker
  conforms: true
  how: "src/modules/chat/prompts/v1.ts: held at the constant CHAT_PROMPT_MARKER_V1 at line 28, and its\
    \ placement as the first element of the array returned by system(), line 45 — export const CHAT_PROMPT_MARKER_V1\
    \ = \"__REMEMBER_CHAT_SYS_MARKER_V1__\" as const; ... return [ CHAT_PROMPT_MARKER_V1, \"\", \"Voce\
    \ e um assistente de consulta ao grafo de conhecimento Remember.\",\nsrc/modules/chat/prompts/v3.ts:\
    \ held at system(), lines 203-212. The v3 prompt is built with the v2 body as its first element, and\
    \ the file re-exports the marker constant from v1 at line 55. The marker text itself is declared in\
    \ v1.ts, not here. — return [\n  v2Body,\n  block4A,\n  BLOCK_4B_SEARCH_DISCIPLINE,\n  BLOCK_4C_POST_INGESTION_PLAYBOOK,\n\
    ].join(\"\\n\"); and `export { CHAT_PROMPT_MARKER_V1 } from \"./v1.js\";`. Whether v2's output starts\
    \ with the marker cannot be seen from this file.\nsrc/modules/chat/prompts/v4.ts: held at the `export\
    \ { CHAT_PROMPT_MARKER_V1 } from \"./v1.js\"` re-export (line 41) and the `system()` join (lines 177-182),\
    \ where the v1 body carrying the marker comes first. The literal itself is declared in v1.ts. — return\
    \ [\n  v1Body,\n  block4A,\n  BLOCK_4B_SEARCH_DISCIPLINE,\n  BLOCK_4C_DIRECTED_INGESTION,\n].join(\"\
    \\n\");"
  encoded_at:
  - src/modules/chat/prompts/v1.ts
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-presents-catalog
  conforms: false
  how: 'src/modules/chat/prompts/v3.ts, renderOntologyBlock, lines 144-184: the loops over catalog.nodeTypeByName,
    catalog.linkTypeByName and catalog.attributeKeyById, and the rule-pair list built from catalog.linkTypeRules.
    The comment block at lines 22-31 states the choice.: for (const nodeType of catalog.nodeTypeByName.values())
    { ... for (const linkType of catalog.linkTypeByName.values()) { ... for (const attr of catalog.attributeKeyById.values())
    { Only the closed values are sorted: `[...domain].sort().join(" | ")`. The header comment says: "The
    dynamic ontology block iterates the catalog Maps in INSERTION ORDER ... Sorting alphabetically would
    be safer in principle, but would also be a deviation from the existing graph-normalizer''s iteration
    discipline". — The node says the catalog is presented in ascending order. The prompt lists node types,
    link types, attribute keys and each link type''s node-type pairs in the order the SQL rows came back.
    The assistant therefore sees an order that depends on database row order, not the order the business
    decided. Anyone reading the node would expect sorted output and would not find the deliberate exception,
    which is recorded only in a source comment.'
  observed_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/conversation-request-check-order
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/chat/routes/conversations.routes.ts,
    and src/modules/chat/service/conversation.service.ts read `nowhere` — The file never checks the disabled
    chat or the request format. getConversation holds only the existence step, `if (row === null) throw
    new ConversationNotFoundError(id);`. getConversationUsage holds the same step, `if (exists === null)
    throw new ConversationNotFoundError(id);`. Its sole cursor check is `decodeCursor`, which throws InvalidCursorError.
    The file sequences no other check against these, so the order of the three checks is not held here.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/chat/routes/conversations.routes.ts
  - src/modules/chat/service/conversation.service.ts
- node: rules/chat/rolling-summary-overlap
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/chat/repository/chat.repository.ts,
    and src/modules/chat/service/distillation.service.ts read `nowhere` — This file forwards the value
    without stating the cap, the 40 default or the anchor: `repo.listOlderMessagesForSummaryBounded(client,
    conversationId, env.CHAT_RECENT_WINDOW, env.CHAT_SUMMARY_OVERLAP_M)`. The `CHAT_SUMMARY_OVERLAP_M:
    number` member of `DistillationEnv` only types a field passed along. The rule itself is code in chat.repository.ts
    (`LIMIT $3`, `anchor_start ... role = ''user'' AND idempotency_key IS NOT NULL`) and env.ts (`.default(40)`).
    Here it appears only in comments. — a binding asserts the file answers for the node, so the pair that
    stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/chat/repository/chat.repository.ts
  - src/modules/chat/service/distillation.service.ts
unstated:
- file: src/modules/chat/prompts/v1.ts
  where: the closing FERRAMENTAS section of the array returned by system(), lines 77-79
  evidence: '"Use as ferramentas SOMENTE quando elas adicionarem informacao que voce", "ainda nao tem.
    Cada chamada e auditada e tem orcamento de tempo."'
  cost: The prompt tells the model to call tools only when they add information it does not already have.
    No node holds that instruction. It shapes how often the assistant queries the graph, but it lives
    only in the prompt copy.
- file: src/modules/chat/prompts/v1.ts
  where: the numbered principle 3 in the array returned by system(), lines 57-60
  evidence: '"3. NUNCA invente identificadores (uuids), nomes ou aliases. Se voce", "   precisa de um
    id, RESOLVA o nome chamando `search` ou `list_nodes`", "   antes de chamar qualquer ferramenta que
    exige id (`get_node`,", "   `traverse`, `get_history_*`, `get_provenance_*`)."'
  cost: The prompt text is emitted to the model. Besides "never invent identifiers", it tells the model
    to resolve a name through `search` or `list_nodes` before any tool that takes an id, and it lists
    which tools those are. Only the first part appears in a node. The resolve-first procedure and the
    tool list live only in this file, so a reader looking in the specification will not find them.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, step 1 (lines 93-95), the prompt text sent to the model.
  evidence: '"1. Chame `get_ingestion_status` UMA UNICA VEZ para confirmar que a", "   ingestao alcancou
    `status: \"completed\"`. Se ainda estiver em", "   `running`, informe e PARE — nao tente descrever
    o que foi ingerido.",'
  cost: The nodes found cover only the v2 rule, which tells the assistant to report the status once and
    not ask again within the turn. They do not hold the v3 rule that a run still `running` must be reported
    and the assistant must stop without describing what was ingested. That behavior of the v3 prompt is
    not in the specification.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, step 3 (lines 110-112), the prompt text sent to the model.
  evidence: '"3. Cite a fonte: o campo `raw_information_id` retornado por", "   `get_ingestion_status`
    identifica o documento ingerido — mencione-o", "   ao dono.",'
  cost: The v3 prompt tells the assistant to name the ingested document's raw information identity to
    the owner. The only node for this is rules/chat/chat-prompt-v4-cites-ingested-document, and its statement
    is limited to v4. A reader checking what v3 tells the assistant will not find this instruction in
    the specification.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, step 4 (lines 113-116), the prompt text sent to the model.
  evidence: '"4. NUNCA apresente a primeira linha de um `list_nodes` sem filtro como", "   resposta para
    \"o que foi ingerido\" — essa linha pode pertencer a", "   um documento completamente nao relacionado.
    Em caso de duvida,", "   recuse a resposta e replaneje pelos passos 2.a / 2.b.",'
  cost: The "never present the first row of an unfiltered listing as what was ingested" part is held by
    rules/chat/chat-prompt-unfiltered-listing-is-not-ingested. The added instruction to refuse the answer
    and re-plan through the lookup steps when in doubt is held by no node. It is a behavior the assistant
    is told to follow that exists only in this prompt text.
- file: src/modules/chat/routes/conversations.routes.ts
  where: emitChatBootLog, lines 1222-1297 (the chat.boot, chat.recent_window_resolved, chat.deprecated_env
    and chat.owner_tz_resolved log records)
  evidence: 'deps.logger.info({ event: "chat.boot", chat_ingest_enabled: ingestFlagOn, tool_count: toolCount
    }, "chat module routes registered"); and  if (process.env.CHAT_SUMMARY_AFTER_TURNS !== undefined)
    { deps.logger.info({ event: "chat.deprecated_env", name: "CHAT_SUMMARY_AFTER_TURNS", reason: "retired_as_gate_v2_9"
    }, "chat deprecated env var detected (BR-33 v2.9 — retired as gate)")'
  cost: The event names, the fields, the rule that tool_count is 0 when the query portion is incomplete,
    and the deprecation of CHAT_SUMMARY_AFTER_TURNS all live only in this function. A person who greps
    the specification for the boot signal or the deprecated variable finds nothing, and so cannot tell
    whether the records are decided or incidental. The specification does give logged events a node elsewhere,
    for example constraints/curation-write-failure-logged.
- file: src/modules/chat/routes/conversations.routes.ts
  where: emitTurnLog, lines 1558-1586 (the chat.turn record and its chat_turn_total counter)
  evidence: 'const aborted = args.stopReason === "cancelled" || args.stopReason === "turn_timeout"; ...
    event: "chat.turn", actor: "owner" as const, ... counter: { name: "chat_turn_total", labels: { stop_reason:
    args.stopReason }, value: 1 }'
  cost: This function alone holds the record's name and fields, the counter name and its label, and the
    rule that a turn counts as aborted exactly when its stop reason is cancelled or turn_timeout. No node
    holds any of it, so the next reader looks for it in the specification and does not find it.
restates:
- file: src/modules/chat/prompts/v1.ts
  where: the doc comment above CHAT_PROMPT_MARKER_V1, lines 17-23
  evidence: '"Opaque system-prompt marker token (BR-20). Planted at the head of the system prompt body
    so the output guard can detect leakage."'
  cost: The same fact as the node, that the marker begins every prompt version, is written a second time
    as prose. The prose says nothing the code does not. When the node moves, the comment is not reached
    and keeps stating the old fact next to code that has changed.
  node: rules/chat/chat-prompt-carries-marker
- file: src/modules/chat/prompts/v4.ts
  where: header comment line 8 and the re-export docblock at lines 37-40, above line 41
  evidence: '"// Marker token is REUSED VERBATIM from v1 (BR-20 stable across versions)." and " * Re-export
    of v1''s marker token. BR-20 keeps the marker STABLE across prompt * versions so the output guard
    never needs a per-version code path."'
  cost: The marker rule is stated a second time as prose in this file, alongside the node. When the node
    moves, the comment keeps saying the old thing, and a reader may take it for where the rule was decided.
    The code that holds it is the `v1Body` placed first in system() here, and the literal in v1.ts.
  node: rules/chat/chat-prompt-carries-marker
- file: src/modules/chat/prompts/v4.ts
  where: header comment lines 5-6 and 12-14, and the system() docblock at lines 154-159
  evidence: '"//   - Block 4A ONTOLOGY — PRESERVED VERBATIM from v3 (deterministic catalog //     rendering
    — same byte-stability + cache-control invariant)." and "//   - Block 4A iterates the catalog Maps
    in INSERTION ORDER — same contract //     as v3 (delegates to v3''s `renderOntologyBlock`)."'
  cost: The fact that the prompt presents the catalog in a fixed order is restated as prose here. If the
    node or v3.ts changes it, this comment goes stale without any check reaching it. The rendering code
    lives in src/modules/chat/prompts/v3.ts as `renderOntologyBlock`, so the comment is a second home
    outside behavior.
  node: rules/chat/chat-prompt-presents-catalog
- file: src/modules/chat/repository/chat.repository.ts
  where: the header BR map, lines 20-21 (BR-32), and the comment above attachToolCallsToMessage, lines
    938-940
  evidence: '"//   BR-32  per-tool-call audit row + post-stream patch via //          attachToolCallsToMessage"
    and "// Single UPDATE patches all rows whose id is in the supplied array (BR-29 // step 8). Caller
    already knows the inserted ids from the in-loop // `insertToolCall` calls."'
  cost: The fact that every tool result is recorded as a tool call and then named to its assistant message
    has a second home in comments. A reader who edits the comment, or who trusts it as the rule, can drift
    from rules/chat/tool-call-recorded without the node binding to this prose. No running system emits
    these comments.
  node: rules/chat/tool-call-recorded
- file: src/modules/chat/repository/chat.repository.ts
  where: the header BR map, lines 32-33 (BR-33), and the comment above listOlderMessagesForSummaryBounded,
    lines 796-800
  evidence: '"//   - The M-row tail of older rows contains zero anchors -> return [] (the //     slice
    would have to start mid-turn; shrinking forward leaves nothing)."'
  cost: The rule that the older slice is capped at the overlap and starts at an owner-written message
    is restated in prose beside the SQL that enforces it. Edits to the node or to the SQL can leave the
    comment describing a different slice. No running system emits this comment.
  node: rules/chat/rolling-summary-overlap
- file: src/modules/chat/routes/conversations.routes.ts
  where: the comment above the empty-body check in PATCH /:id, lines 379-394
  evidence: '// BR-36 step 1: empty body -> 422 VALIDATION_REQUIRED_FIELD.'
  cost: The comment restates the update-conversation refusal, which the node already holds and the code
    already implements at the next statement. It is a second home outside behavior and carries a back-spec
    rule number the specification does not use.
  node: contracts/chat/conversations
- file: src/modules/chat/routes/conversations.routes.ts
  where: the comment at the recovery branch of sendMessage, lines 692-694
  evidence: // Recovery path — the original turn died before persisting the // assistant row. Reuse the
    existing user row, skip insert (would // collide on UNIQUE PARTIAL), and run the loop.
  cost: 'The comment restates idempotent-recovery: run the turn again on the recorded message without
    recording a second one. The code holds it through `if (existingUserRow === null)` guarding insertUserMessage,
    so the comment is a second home outside behavior.'
  node: rules/chat/idempotent-recovery
- file: src/modules/chat/routes/conversations.routes.ts
  where: the comment opening the sendMessage handler, lines 583-586
  evidence: // ---- (1) Idempotency-Key header — checked FIRST per spec (BR-26 has //          precedence
    over conversation lookup). Missing -> 422 //          VALIDATION_REQUIRED_FIELD; non-UUID -> 422 //          VALIDATION_INVALID_FORMAT.
  cost: The comment restates the order of checks on a sent message, which rules/chat/send-message-check-order
    holds, and the two header refusals, which the contract holds. The code holds both in the same handler,
    so the comment is a second home that can drift from the node.
  node: rules/chat/send-message-check-order
- file: src/modules/chat/routes/conversations.routes.ts
  where: the doc comment of handleIdempotentReplay, lines 1109-1115
  evidence: '* UC-07 — emit `llm_start{1}` + `text_delta(<full stored text>)` + `done` * frames and close
    the stream. No Anthropic call; no new rows.'
  cost: 'The comment restates idempotent-replay: stream the recorded answer again without calling the
    model or recording anything. The function body holds it, since it writes frames and never calls chatService
    or an insert, so the comment is a second home outside behavior.'
  node: rules/chat/idempotent-replay
- file: src/modules/chat/routes/conversations.routes.ts
  where: the doc comment of userRowMatches, lines 1449-1454
  evidence: '* Comparison rules (BR-27 — "(content, model) comparison" paragraph): *   - `content`: unwrap
    the single-text-block jsonb shape and compare strings. *   - `model`: literal column value, treating
    NULL == NULL.'
  cost: 'The comment restates idempotency-match: a resent message matches only when its text and model
    equal the recorded ones. The function body holds it, since `storedText !== incomingContent` and `storedModel
    === incomingModel` decide the result, so the comment is a second home outside behavior.'
  node: rules/chat/idempotency-match
- file: src/modules/chat/service/distillation.service.ts
  where: the JSDoc on `CHAT_SUMMARY_OVERLAP_M` in `DistillationEnv` (lines 108-114), and step 2 of the
    `maybeRefreshSummary` docstring (lines 154-159)
  evidence: '"BR-33 v2.9 step 2 — hard cap on the number of `chat_message` rows the fold pulls into the
    `bounded_overlap_slice` per refresh. Cut on REAL-turn boundaries by the repository slicer (`listOlderMessagesForSummaryBounded`).
    Default 40 in `env.ts`." and "The repository cuts the start on a REAL-turn anchor; the slice is Anthropic-valid
    by construction."'
  cost: 'The cap, the default of 40 and the owner-message start anchor are stated in prose in this file.
    The code that holds them is elsewhere: `LIMIT $3` and the `anchor_start` CTE in `backend/src/modules/chat/repository/chat.repository.ts`,
    and `CHAT_SUMMARY_OVERLAP_M: z.coerce.number().int().min(1).default(40)` in `backend/src/config/env.ts`.
    The comment is a second home for a fact the node already holds. When the default or the anchor rule
    moves, this prose can stay behind and say the old value.'
  node: rules/chat/rolling-summary-overlap
adopted: true
pairs_omitted:
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
- node: rules/chat/chat-prompt-v1-cites-sources
  file: src/modules/chat/prompts/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-affected-nodes-first
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-discovery-listings
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-fallback-lists-by-node-type
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-list-by-node-type
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-search-is-lexical-and
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-search-one-name
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-unfiltered-listing-is-not-ingested
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
- node: rules/chat/chat-prompt-affected-nodes-first
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-discovery-listings
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-fallback-lists-by-node-type
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-list-by-node-type
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-search-is-lexical-and
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-search-one-name
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-unfiltered-listing-is-not-ingested
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v4-asks-start-date
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v4-closed-values
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v4-directed-ingestion-writes
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v4-one-ingestion-per-command
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v4-pins-known-entity
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v4-records-only-declared
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-v4-reports-each-item
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
- node: rules/chat/message-listing-pages-backwards
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/chat/message-listing-shows-exchanges
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/model-context-window
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
- node: rules/chat/rolling-summary-refresh
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/title-distillation
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-ending-message
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/answers-carry-allowed-origin
  file: src/modules/chat/routes/conversations.routes.ts
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
- node: rules/chat/conversation-update-names-a-field
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/distillation-follows-live-turn
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/graph-delta-requires-catalog-snapshot
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
- node: rules/chat/message-listing-pages-backwards
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
- node: rules/chat/replay-reports-failure
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/chat/send-message-check-order
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/chat/turn-cancel
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-failure-stop-reason
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-default
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-stop-reason
  file: src/modules/chat/routes/conversations.routes.ts
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
- node: rules/chat/tool-failure-continues-turn
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-invocation-carries-turn
  file: src/modules/chat/service/chat-agent.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-result-truncated
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
- node: rules/chat/turn-model-call-limit
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
- node: rules/chat/turn-time-limit
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
- node: rules/chat/conversation-update-partial
  file: src/modules/chat/service/conversation.service.ts
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
- node: rules/chat/rolling-summary-refresh
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/title-distillation
  file: src/modules/chat/service/distillation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 9 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-drift-item5.returns/.

  Staged as an adoption of source no delivery wrote: 1 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 16 opened across 4 of 9 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 7 fact(s) the source states that no node holds, over 3 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 11 place(s) where text in the source restates a node''s fact the code holds, over 5 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-drift-item5.returns/`, which are the evidence behind every entry above.
