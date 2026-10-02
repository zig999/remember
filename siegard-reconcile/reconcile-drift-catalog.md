---
contract_version: siegard-reconcile/8
title: Drift catalog - chat-prompt-presents-catalog after the node followed the code
summary: The two prompt files did not change; the node was aligned with the code. The owner states the
  behavior is correct.
target: backend
files:
- path: src/modules/chat/prompts/v3.ts
  change: unchanged; read against the node as it now stands
- path: src/modules/chat/prompts/v4.ts
  change: unchanged; read against the node as it now stands
nodes:
- node: rules/chat/chat-prompt-presents-catalog
  conforms: true
  how: "src/modules/chat/prompts/v3.ts: held at renderOntologyBlock, lines 141-187: the NodeTypes loop\
    \ over catalog.nodeTypeByName.values(), the LinkTypes loop with rule pairs, and the AttributeKeys\
    \ loop with sorted closed values — \"for (const nodeType of catalog.nodeTypeByName.values()) {\" ;\
    \ \"const pairSuffix = pairs.length > 0 ? ` [${pairs.join(\\\"; \\\")}]` : \\\"\\\";\" ; \"for (const\
    \ attr of catalog.attributeKeyById.values()) {\" ; \"` [dominio fechado: ${[...domain].sort().join(\\\
    \" | \\\")}]`\"\nsrc/modules/chat/prompts/v4.ts: held at the `system()` function, lines 172-183. The\
    \ delegating call `renderOntologyBlock(catalog)` puts the catalog block into the v4 prompt, and the\
    \ block is returned in the join. The node's ordering and closed-value details are carried out in v3.ts's\
    \ `renderOntologyBlock`, not in this file. — const block4A = renderOntologyBlock(catalog); return\
    \ [\n  v1Body,\n  block4A,\n  BLOCK_4B_SEARCH_DISCIPLINE,\n  BLOCK_4C_DIRECTED_INGESTION,\n].join(\"\
    \\n\");"
  encoded_at:
  - src/modules/chat/prompts/v3.ts
  - src/modules/chat/prompts/v4.ts
unstated:
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, step 1, lines 93-95; this is text the system sends to the model
  evidence: '"1. Chame `get_ingestion_status` UMA UNICA VEZ para confirmar que a", "   ingestao alcancou
    `status: \"completed\"`. Se ainda estiver em", "   `running`, informe e PARE — nao tente descrever
    o que foi ingerido."'
  cost: The prompt tells the assistant to check the status exactly once when the owner asks for the result,
    and to stop and report when the run is still running. The status-once node (chat-prompt-v2-no-status-polling)
    is scoped to v2 and to the turn that started the ingestion. No node holds the v3 rule, so it lives
    only in this prompt.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, step 3, lines 110-112; this is text the system sends to the
    model
  evidence: '"3. Cite a fonte: o campo `raw_information_id` retornado por", "   `get_ingestion_status`
    identifica o documento ingerido — mencione-o", "   ao dono."'
  cost: The v3 prompt instructs the assistant to name the ingested document's raw information identity
    to the owner. The only node on this behavior is rules/chat/chat-prompt-v4-cites-ingested-document,
    which is scoped to v4 and to directed ingestion. A reader who looks in the specification for what
    v3 tells the assistant does not find the rule.
- file: src/modules/chat/prompts/v3.ts
  where: BLOCK_4C_POST_INGESTION_PLAYBOOK, step 4, lines 113-116; this is text the system sends to the
    model
  evidence: '"Em caso de duvida,", "   recuse a resposta e replaneje pelos passos 2.a / 2.b."'
  cost: The prompt tells the assistant to refuse its answer and replan by steps 2.a and 2.b when in doubt.
    The nodes found for the prompt's unfiltered- listing and fallback rules state the prohibition and
    the fallback, but not this refusal-and-replan instruction. It lives only in the prompt.
restates:
- file: src/modules/chat/prompts/v3.ts
  where: the header comment, lines 25-27, and the renderOntologyBlock docstring, lines 133-136
  evidence: '"The dynamic ontology block iterates the catalog Maps in INSERTION ORDER (which `loadCatalog`
    populates from the SQL row order" and "The iteration order is the catalog Map insertion order (set
    by `loadCatalog`''s SQL row order"'
  cost: Prose states a second time the catalog-order rule that rules/chat/chat-prompt-presents-catalog
    holds. The renderer's `for ... of catalog.nodeTypeByName.values()` loops hold the fact in code. When
    the node moves, the comment stays behind as a competing statement of what was decided.
  node: rules/chat/chat-prompt-presents-catalog
- file: src/modules/chat/prompts/v4.ts
  where: header comment, lines 12-14 (the cache-control invariant paragraph)
  evidence: //   - Block 4A iterates the catalog Maps in INSERTION ORDER — same contract //     as v3
    (delegates to v3's `renderOntologyBlock`).
  cost: The catalog-order fact is stated in prose here although this file iterates nothing. The iteration
    is in v3.ts, `for (const nodeType of catalog.nodeTypeByName.values())`, and the ascending sort of
    closed values is there too, `[...domain].sort().join(" | ")`. A reader of v4.ts gets a second statement
    of the ordering rule that no running system emits. If v3.ts changes the order, nothing reminds this
    comment, and it goes stale.
  node: rules/chat/chat-prompt-presents-catalog
pairs_omitted:
- node: rules/chat/chat-prompt-affected-nodes-first
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/chat-prompt-carries-marker
  file: src/modules/chat/prompts/v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: rules/chat/chat-prompt-carries-marker
  file: src/modules/chat/prompts/v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
notes: 'Judged by 2 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-drift-catalog.returns/.

  Candidates: 0 opened across 0 of 2 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 3 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 2 place(s) where text in the source restates a node''s fact the code holds, over 2 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-drift-catalog.returns/`, which are the evidence behind every entry above.
