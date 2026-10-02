---
contract_version: siegard-reconcile/8
title: Drift item 5b - chat prompt files after the marker and catalog nodes moved
summary: The chat prompt files named here did not change after the nodes moved; the owner states the behavior
  is correct.
target: backend
files:
- path: src/config/env.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/chat/prompts/v1.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/chat/prompts/v3.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/chat/prompts/v4.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/chat/repository/chat.repository.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/chat/routes/conversations.routes.ts
  change: unchanged; read against the nodes as they now stand
nodes:
- node: rules/chat/chat-prompt-carries-marker
  conforms: true
  how: "src/modules/chat/prompts/v1.ts: held at the constant CHAT_PROMPT_MARKER_V1 (line 28) and its use\
    \ as the first element of the array joined and returned by system() (line 45) — export const CHAT_PROMPT_MARKER_V1\
    \ = \"__REMEMBER_CHAT_SYS_MARKER_V1__\" as const; ... return [ CHAT_PROMPT_MARKER_V1, \"\", \"Voce\
    \ e um assistente de consulta ao grafo de conhecimento Remember.\", ...\nsrc/modules/chat/prompts/v3.ts:\
    \ held at system(), the returned array, line 206-211. v2Body is its first element. The marker literal\
    \ is not declared in this file; it comes from v1 through the re-export on line 55. — const v2Body\
    \ = v2System(catalog);\n...\nreturn [\n  v2Body,\n  block4A,\n  BLOCK_4B_SEARCH_DISCIPLINE,\n  BLOCK_4C_POST_INGESTION_PLAYBOOK,\n\
    ].join(\"\\n\");\n...\nexport { CHAT_PROMPT_MARKER_V1 } from \"./v1.js\";\nsrc/modules/chat/prompts/v4.ts:\
    \ held at `system()` in v4.ts (line 172), where the returned array starts with the v1 body, and the\
    \ marker re-export at line 41. The marker text itself is not declared in this file. — \"const v1Body\
    \ = v1System();\" then \"return [ v1Body, block4A, BLOCK_4B_SEARCH_DISCIPLINE, BLOCK_4C_DIRECTED_INGESTION,\
    \ ].join(\\\"\\\\n\\\");\" and \"export { CHAT_PROMPT_MARKER_V1 } from \\\"./v1.js\\\";\""
  encoded_at:
  - src/modules/chat/prompts/v1.ts
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
- node: rules/chat/chat-prompt-presents-catalog
  conforms: true
  how: 'src/modules/chat/prompts/v3.ts: held at renderOntologyBlock(), lines 141-187. It renders node
    types, link types with their rule pairs, and attribute keys with a sorted closed-value domain. system()
    appends it as block 4A. — for (const nodeType of catalog.nodeTypeByName.values()) {

    const pair = `${source.name} -> ${target.name}`;

    const pairSuffix = pairs.length > 0 ? ` [${pairs.join("; ")}]` : "";

    ? ` [dominio fechado: ${[...domain].sort().join(" | ")}]`

    src/modules/chat/prompts/v4.ts: held at `system()` in v4.ts, the call that renders block 4A from the
    catalog. The ordering and rendering are held in `renderOntologyBlock` in the v3 file, not in this
    file. — "import { renderOntologyBlock } from \"./v3.js\";" and "const block4A = renderOntologyBlock(catalog);"'
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
unstated:
- file: src/modules/chat/prompts/v1.ts
  where: principle 3 of the string returned by system(), lines 57-60
  evidence: '"Se voce precisa de um id, RESOLVA o nome chamando `search` ou `list_nodes` antes de chamar
    qualquer ferramenta que exige id (`get_node`, `traverse`, `get_history_*`, `get_provenance_*`)."'
  cost: The node rules/chat/chat-prompt-v1-cites-sources holds only that the v1 prompt tells the assistant
    never to invent identifiers. The instruction to resolve a name through search or list_nodes first,
    and the list of tools that need an id, are held by no node. The prompt copy is the only place they
    are decided.
- file: src/modules/chat/prompts/v1.ts
  where: the FERRAMENTAS section of the string returned by system(), lines 77-79
  evidence: '"Use as ferramentas SOMENTE quando elas adicionarem informacao que voce", "ainda nao tem.
    Cada chamada e auditada e tem orcamento de tempo."'
  cost: The prompt tells the model to call tools only when they add information it lacks. No node holds
    that instruction (a search of the full-text projection found none). The behavior lives only in the
    prompt copy, so a reader looking in the specification for how the assistant is told to economise on
    tool calls finds nothing.
restates:
- file: src/modules/chat/prompts/v1.ts
  where: the doc comment above CHAT_PROMPT_MARKER_V1 (lines 17-27) and the file header comment (lines
    1-12)
  evidence: '"Opaque system-prompt marker token (BR-20). Planted at the head of the system prompt body
    so the output guard can detect leakage."'
  cost: The prose says in a second place that the marker opens the prompt. The code already does this,
    as the first element of the array returned by system(). If the rule moves, a reader can take the comment
    for the decision and miss the node.
  node: rules/chat/chat-prompt-carries-marker
- file: src/modules/chat/prompts/v4.ts
  where: The header comment (lines 5-6 and 12-14) and the JSDoc on `system()` (lines 156-158), which describe
    how the ontology block is rendered
  evidence: '"//   - Block 4A iterates the catalog Maps in INSERTION ORDER — same contract" and "ontology-aware
    blocks: 4A (rendered from `catalog`, delegated to v3''s `renderOntologyBlock` for byte parity)"'
  cost: This is prose about how the catalog is presented, and the node states it differently. The comment
    says insertion order. rules/chat/chat-prompt-presents-catalog says "in ascending order", and its decision
    log says "The ontology block sorts the values." Nothing running emits the comment. The code that holds
    the fact is `const block4A = renderOntologyBlock(catalog);`, which calls the function in v3.ts. A
    reader who trusts the comment learns an ordering the node does not state.
  node: rules/chat/chat-prompt-presents-catalog
- file: src/modules/chat/prompts/v4.ts
  where: The header comment (lines 8 and 27-28) and the JSDoc on `system()` (lines 154-156), which speak
    of the marker token and of the v1 body
  evidence: '"// Marker token is REUSED VERBATIM from v1 (BR-20 stable across versions)." and "(persona,
    language pt-BR, citation policy, output-stripping discipline, marker token — all preserved per BR-18
    v4)"'
  cost: 'The fact that every prompt version begins with the one system-prompt marker is stated a second
    time in prose that no running system emits. The code holds it twice over: `const v1Body = v1System();`
    is the first element of the joined array, and `export { CHAT_PROMPT_MARKER_V1 } from "./v1.js";` re-exports
    the token. A reader who finds the comment may take it as the place the rule lives, and the comment
    will not move when the node does.'
  node: rules/chat/chat-prompt-carries-marker
pairs_omitted:
- node: constraints/anthropic-key-required
  file: src/config/env.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/local-operator-token-minimum-length
  file: src/config/env.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/local-operator-token-needs-explicit-development
  file: src/config/env.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/owner-time-zone-must-be-known
  file: src/config/env.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/rolling-summary-overlap
  file: src/config/env.ts
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
- node: rules/chat/rolling-summary-overlap
  file: src/modules/chat/repository/chat.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: rules/chat/conversation-request-check-order
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: rules/chat/turn-model-default
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/turn-model-stop-reason
  file: src/modules/chat/routes/conversations.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-drift-item5b.returns/.

  Candidates: 2 opened across 1 of 3 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 2 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 3 place(s) where text in the source restates a node''s fact the code holds, over 2 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-drift-item5b.returns/`, which are the evidence behind every entry above.
