---
contract_version: siegard-reconcile/8
title: Adopt the five rules decided from the review of drift-corrections
summary: The source is adopted as it stands and did not change; the five candidate rules were written
  by /analyse (commit 20a62fd) from the conformance findings of the review of drift-corrections.
target: backend
files:
- path: src/modules/ingestion/prompts/extraction.v1.ts
  change: unchanged; adopted against the rule for how the user message shows the reception time and the
    document date.
- path: src/modules/ingestion/prompts/extraction.v3.ts
  change: unchanged; adopted against the rule naming the relative-date words.
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: unchanged; adopted against the rule naming the relative-date words.
- path: src/modules/query-retrieval/service/search.service.ts
  change: unchanged; adopted against the three search rules the specification gained.
nodes:
- node: rules/knowledge-base/expanded-link-layer-is-node
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the object returned by toExpandedLinkItem,
    line 390, where the link item''s layer is set to "node" — `key: `link:${link.id}`, kind: "link", layer:
    "node", id: link.id,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/extraction-prompt-names-relative-date-words
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v4.ts: held at RECEIVED_AT_ANCHOR_DIRECTIVE, lines 22-23,
    appended to the v4 system prompt by system() at line 34 — "- When you encounter a relative date in
    the chunk text (`\"hoje\"`, `\"ontem\"`,", "  `\"amanhã\"`, `\"semana que vem\"`, ..." and "return
    `${systemV3(catalog)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`;"'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
- node: rules/knowledge-base/extraction-user-prompt-shows-anchor-dates
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v1.ts: held at the metaBlock built in user(), lines 224-232
    — "`- received_at: ${meta.received_at}`,", "meta.document_date !== null ? `- document_date: ${meta.document_date}`
    : \"- document_date: (unknown)\","'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/matched-item-hop-zero
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the two items.push calls in searchKnowledgeService,
    one for fragment hits (line 184) and one for node hits (line 220), each setting hop to 0 — `key: `fragment:${f.id}`,
    kind: "fragment", layer: "fragment", id: f.id, score: f.score, hop: 0,` and `key: `node:${n.node_id}`,
    kind: "node", layer: "node", id: n.node_id, score: n.score, hop: 0,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/matched-node-requires-provenance
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the node-hit loop in searchKnowledgeService,
    line 207, which skips a node with no provenance rows before it is pushed as an item — `if (provenance.length
    === 0) continue;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
unstated:
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), lines 123-127 (rule 4, ORDER)
  evidence: '"4. ORDER, per chunk: (a) `propose_fragment` for each atomic claim; (b)", "   `propose_node`
    for every entity mentioned — propose freely, the backend", "   resolves and dedups (the same entity
    is matched, never duplicated); (c)", "   `propose_link` / `propose_attribute`, citing node ids from
    (b) and", "   fragment ids from (a). A link requires BOTH nodes to exist first."'
  cost: The order in which the model is told to propose, and the instruction to propose a node for every
    entity mentioned, are held nowhere in the specification. Only this prompt records them.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), lines 128-131 (rule 5, LITERAL vs ENTITY)
  evidence: '"5. LITERAL vs ENTITY: a literal value of an entity that matches a catalog", "   AttributeKey
    → `propose_attribute`; an entity matching a NodeType →", "   `propose_node` (+ `propose_link` if a
    relation is stated). A date, number", "   or string value is NEVER a node."'
  cost: This decides whether a stated fact becomes a node, a link or an attribute. The specification holds
    none of it, so the line between an entity and a literal lives only in this prompt.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), lines 133-135 (rule 7, second sentence)
  evidence: '"   `uncertain` (kept, flagged); < 0.40 → dropped. Lower it for hedged", "   claims (\"should
    be\", \"maybe\", \"I think\")."'
  cost: The thresholds in this rule are held by nodes (active at 0.75 and above, uncertain from 0.40,
    none recorded below 0.40). The instruction to lower confidence for hedged claims, and the hedge words,
    are not. They steer which assertions become active, uncertain or dropped, and no node records them.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), lines 136-138 (rule 8)
  evidence: '"8. Extract only what the chunk ASSERTS. Do not invent relations the text", "   does not
    state (people merely mentioned together are not necessarily", "   related). If nothing is extractable,
    `end_turn` and call no tools."'
  cost: What counts as extractable, and the instruction to propose nothing when nothing is stated, sit
    only in the prompt. Whoever reads the specification to learn what the extraction refuses to infer
    will not find it.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), lines 140-143 (the first bullet under "## Dates")
  evidence: '"- `valid_from` is the date the fact STARTS holding — not the same as a date", "  that is
    the value itself (a `deadline` value is the deadline date; its", "  `valid_from` is when that deadline
    became the plan)."'
  cost: The specification holds this reading of a validity start for an event's event_date, from v2 on.
    For a Project's deadline under v1 it holds nothing. The prompt makes the choice, and the stored validity
    start of every deadline extracted under v1 depends on it.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), lines 149-155 (the change_hint section)
  evidence: '"- `succession`: the chunk says the fact CHANGED (\"moved to…\", \"now reports", "  to…\",
    \"postponed to…\").", "- `correction`: the chunk fixes a previously wrong value (\"correcting: it",
    "  was…\"). Use only with explicit textual evidence; otherwise `none`."'
  cost: The phrases that tell the model a fact changed, and the instruction to use correction only with
    explicit textual evidence, are held by no node. A node holds how a proposal with the hint is handled,
    and a node holds the errata-evidence check on a correction. Neither holds what the model is told to
    recognize.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), the string array, line 121-122 (rule 3, ATOMICITY)
  evidence: '"3. ATOMICITY: one subject–predicate–object assertion = one fragment. Split", "   compound
    sentences (\"Ana and Bruno joined X\") into one fragment per fact."'
  cost: This is an instruction the prompt gives the model that decides how many fragments, and so how
    many provenance anchors, a chunk yields. No node holds it, so a reader looking in the specification
    for what the extraction is asked to do about compound sentences finds nothing.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the worked example in system(), lines 191-192
  evidence: '"  // a document/event is its own node; `concerns` (aboutness, no valid_from) links it to
    the topic,", "  // `delivered_to` records the recipient. Do NOT leave \"a proposta\" as a bare fragment."'
  cost: The instruction that a document or event becomes its own node, linked by concerns and delivered_to,
    is held by no node. The catalog fact that concerns is not temporal is held, but the modeling instruction
    is not.
- file: src/modules/ingestion/prompts/extraction.v4.ts
  where: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 22-24, the list of relative-date expressions
  evidence: '"- When you encounter a relative date in the chunk text (`\"hoje\"`, `\"ontem\"`,", "  `\"amanhã\"`,
    `\"semana que vem\"`, `\"esta semana\"`, similar pt-BR temporal", "  deictics), resolve it AGAINST
    `document_date` if it is present (basis"'
  cost: The directive tells the model that "semana que vem", "esta semana" and "similar pt-BR temporal
    deictics" are also relative dates to resolve. The node holds only "hoje", "ontem" and "amanhã". A
    reader who looks in the specification for which expressions v4 resolves will not find these, and the
    prompt text is the only place that widens the set.
- file: src/modules/ingestion/prompts/extraction.v4.ts
  where: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 24-25, the basis the model is asked to give when it resolves
    against document_date
  evidence: '"  deictics), resolve it AGAINST `document_date` if it is present (basis", "  `\"document\"`).
    If `document_date` is `(unknown)`, fall back to the date",'
  cost: The prompt asks the model to give the basis "document" for a relative date resolved against the
    document date. The v4 anchor rule leaves the basis out, and valid-from-basis only enumerates stated,
    document and received. No node says which basis a relative date resolved this way carries. That mapping
    lives only in the prompt text.
restates:
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the header comment, lines 22-24, and the `prevTail` doc comment on UserPromptArgs, line 211
  evidence: '"`prev_tail` carries the last ≤ `PREV_TAIL_CHARS` (200) characters of the // previous chunk
    to provide minimal cross-chunk continuity" and "/** Last ≤ 200 chars of the previous chunk (continuity);
    empty on chunk_index = 0. */"'
  cost: The 200-character window is stated here in prose a second time. The code that cuts it is `PREV_TAIL_CHARS
    = 200` and `chunk.text.slice(-PREV_TAIL_CHARS)` in backend/src/modules/ingestion/service/extraction.service.ts.
    If the window changes, this comment keeps saying 200 and nothing flags it.
  node: rules/knowledge-base/extraction-reads-chunks-in-order
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: 'header comment, lines 12-14: the outro fallback with lowered confidence'
  evidence: // USE it — pick the best-fitting catalog value, fall back to `outro` only // when none fits
    (and then lower confidence so curation sees the gap), and
  cost: 'This is prose, and no running system emits it. It restates rules/knowledge-base/extraction-event-type-fallback:
    outro only when no other value fits, then confidence at most 0.74. Code in this file already holds
    the fact, in EVENT_CLASSIFICATION_DIRECTIVE ("- Use `outro` ONLY when NO domain value fits — and,
    in that case, LOWER the", "  confidence (≤ 0.74)"). The comment is a second home outside behavior.'
  node: rules/knowledge-base/extraction-event-type-fallback
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: 'header comment, lines 14-15: relative dates resolved against document_date'
  evidence: // resolve relative dates ("hoje"/"ontem"/…) against `document_date`
  cost: 'This is prose, and no running system emits it. It restates rules/knowledge-base/extraction-relative-date-needs-document-date.
    That rule holds under v3 alone, and v4 supersedes it. A reader who finds the sentence here cannot
    tell that v4 changes it. Code in this file holds the fact in the directive ("resolve against `document_date`:
    `event_date` (the VALUE) gets the computed", "the date (the backend records `received`)").'
  node: rules/knowledge-base/extraction-relative-date-needs-document-date
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: 'header comment, lines 27-28: the idempotency key includes prompt_version'
  evidence: // actually ran (registry in `./index.ts`), and `idempotency_key` (hash.ts) // includes prompt_version,
    so a re-ingest under v3 yields a new, distinct run.
  cost: This is prose, and no running system emits it. It states part of rules/knowledge-base/idempotency-key,
    that the key is derived from the prompt version. It also draws a consequence about re-ingest. The
    comment's claim that "a re-ingest under v3 yields a new, distinct run" is contradicted by rules/knowledge-base/idempotency-key
    and the decision that held content answers noop_existing under another prompt version. The specification
    already settles that outcome in the ingestion nodes. Code holds the key's derivation in backend/src/modules/ingestion/hash.ts,
    which the comment names.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: 'header comment, lines 5-8: the sentence about v2 teaching the model to date events'
  evidence: '// The gap v3 closes: v2 taught the model to DATE events (`event_date`), but // never to
    CLASSIFY them (`event_type`)'
  cost: 'This is prose, and no running system emits it. It says what rules/knowledge-base/extraction-dates-events
    holds: from v2 on, an extraction asks the model to propose event_date. A reader of this comment finds
    a second statement of the fact beside the node. The two can drift when the node moves, and --check
    does not reach the comment.'
  node: rules/knowledge-base/extraction-dates-events
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: 'header comment, lines 8-12: the original closed event_type domain and the values the migration
    added'
  evidence: // `event_type` domain {reunião, go-live, workshop, outro} landed on `outro` // with a lowered
    confidence (→ `uncertain`). Migration // `0003_event_type_taxonomy.sql` widened that closed domain
    (cobrança, // decisão, escalonamento, bloqueio, marco);
  cost: This is prose, and no running system emits it. It enumerates values of event_type that rules/knowledge-base/allowed-event-types
    already holds. The code holds the same values in the migration seed migrations/seeds/0003_event_type_taxonomy.sql,
    which the comment names. A reader of this file gets a second, partial list of the domain. If the domain
    changes, the list here goes stale and no check finds it.
  node: rules/knowledge-base/allowed-event-types
adopted: true
pairs_omitted:
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-prompt-lists-closed-values
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-prompt-values-ascending
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-prompt-values-verbatim
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-stated-basis-needs-written-start
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-turn-token-ceiling
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/extraction-dates-events
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-event-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-event-type-fallback
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-relative-date-needs-document-date
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/go-live-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-lexical-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/item-kind
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-item
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-match-never-surfaces
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expanded-link-requires-provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-as-of-view
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-decay
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/expansion-follows-both-directions
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-hop
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-in-effect-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-starts-from-matched-nodes
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/item-flags
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-types-ignored-without-expansion
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/non-expanding-search-walks-no-graph
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-layer-candidate-cap
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-ranking
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-total-before-pagination
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/temporal-filters-apply-to-expansion-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/uncertain-items-excluded-on-request
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/unknown-link-type-refused
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-review-findings.returns/.

  Staged as an adoption of source no delivery wrote: 5 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 7 opened across 1 of 4 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 10 fact(s) the source states that no node holds, over 2 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.

  Restates: 6 place(s) where text in the source restates a node''s fact the code holds, over 2 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-review-findings.returns/`, which are the evidence behind every entry above.
