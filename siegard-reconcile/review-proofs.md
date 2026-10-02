---
contract_version: siegard-reconcile/8
title: Review of the review-proofs initiative
summary: The three proof tasks of the review-proofs initiative (task/proof-owed/expansion-decay-target-end,
  task/proof-owed/search-item-flags-provenance, task/proof-owed/v4-module-directive) wrote tests over
  implementations that already stand, as their records state.
target: backend
files:
- path: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  change: 'written by the delivery of task/proof-owed/v4-module-directive: tests of the user message anchor
    dates over every registered version and of the relative-date directive of the v4 module the registry
    hands out.'
- path: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  change: 'written by the delivery of task/proof-owed/expansion-decay-target-end and task/proof-owed/search-item-flags-provenance:
    tests of the decayed score of target-end and direction-switching links, and of the flags, the provenance
    entries and the non-empty provenance of a search item.'
- path: src/modules/ingestion/prompts/extraction.v1.ts
  change: written by no task of review-proofs; the implementation stands there and the proof of task/proof-owed/v4-module-directive
    reads it.
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: written by no task of review-proofs; the implementation stands there and the proof of task/proof-owed/v4-module-directive
    reads it.
- path: src/modules/query-retrieval/service/search.service.ts
  change: written by no task of review-proofs; the implementation stands there and the proofs of the three
    tasks read it.
nodes:
- node: domain/knowledge-base/page
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `limit` and `offset` fields
    of `SearchServiceInput` and the slice in `searchKnowledgeService`, line 253 — `readonly limit: number;
    readonly offset: number;` and `const sliced = filtered.slice(input.offset, input.offset + input.limit);`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/search-item
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `IntermediateItem` (lines 57-70),
    `computeFlags` (line 460) and `toSearchItem` (line 478), which map to kind, layer, score, hop, summary,
    flags and provenance. The `SearchItem` type is declared in response.dto.ts, outside this file. Findings
    above concern the `low_confidence` spelling and the expansion seeds, not the shape. — `return { kind:
    it.kind, layer: it.layer, id: it.id, score: it.score, hop: it.hop, summary: it.summary, flags: it.flags,
    provenance: it.provenance, };`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: "These checks would close it:\n- For a world with a matched node, an expanded link and\
    \ a matched\n  fragment, assert each item's layer equals the search-layer value\n  expected for that\
    \ item.\n- For a world with links in the disputed and low-confidence conditions\n  alongside the uncertain\
    \ one, assert each item's flags equal exactly the\n  assertion-flag values its condition calls for,\
    \ including an item with\n  more than one flag and an item with none.\n- Assert that Number.isInteger(hop)\
    \ holds for the node and fragment items."
- node: domain/knowledge-base/search-query
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `SearchServiceInput`, lines 44-55
    — `readonly query: string; readonly layers?: readonly string[]; readonly asOf?: string; readonly inEffectOnly:
    boolean; readonly includeUncertain: boolean; readonly expand: boolean; readonly expandDepth: number;
    readonly expandLinkTypes?: readonly string[];`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-decay
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `collectExpandedLinks`, line 329.
    The constant `TRAVERSAL_DECAY` is declared in knowledge-graph/traversal/config.ts as `0.5`, and this
    file imports it. — `score: Math.pow(TRAVERSAL_DECAY, link.hop) * startScore,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v4.ts: held at RECEIVED_AT_ANCHOR_DIRECTIVE, lines 15-31,
    composed into the v4 system prompt by system() at line 34 — "  deictics), resolve it AGAINST `document_date`
    if it is present (basis", "  `\"document\"`). If `document_date` is `(unknown)`, fall back to the
    date", "  portion of `received_at` (the `YYYY-MM-DD` prefix of the ISO-8601 string).", and `return
    `${systemV3(catalog)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`;`'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result. Input: an extraction run with prompt version
    v4, over a chunk with a relative date, with the model client stubbed so it captures the request. Expected:
    the system prompt in the captured request contains the instruction to resolve the relative date against
    `document_date` when present and otherwise against the date portion of `received_at`. The same run
    on a source with no document date should show `document_date: (unknown)` in the user message it sends.'
- node: rules/knowledge-base/extraction-user-prompt-shows-anchor-dates
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v1.ts: held at `user()`, the `metaBlock` construction,
    lines 224-232. — "`- received_at: ${meta.received_at}`, meta.document_date !== null ? `- document_date:
    ${meta.document_date}` : \"- document_date: (unknown)\","'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Give each registered prompt version''s user() (v1, v2 and v3, and v4 as selectPromptModule
    returns it) a source whose document_date is null and a known received_at. The expected result is a
    user message containing "- received_at: <that time>" next to "- document_date: (unknown)".'
- node: rules/knowledge-base/search-total-before-pagination
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `searchKnowledgeService`, lines
    252-253, where the total is taken before the slice — `const total = filtered.length; const sliced
    = filtered.slice(input.offset, input.offset + input.limit);`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/unknown-link-type-refused
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `resolveLinkTypeIds`, lines 418-432,
    called only when `input.expand` is set — `const row = catalog.linkTypeByName.get(name); if (row ===
    undefined) { throw new UnknownLinkTypeError(name); }`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
unstated:
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: 'The catalog section of the SYSTEM prompt built by `system()`: the `nodeTypes` and `linkTypes`
    maps and sorts, lines 67-77, and the emitted "## Catalog (read-only)" lines, 157-169.'
  evidence: '".map((lt) => ({ name: lt.name, temporal: lt.is_temporal, allowsMultipleCurrent: lt.allows_multiple_current,
    requiresValidFrom: lt.requires_valid_from, })).sort((a, b) => a.name.localeCompare(b.name))" and "`
    [temporal=${lt.temporal}, multi_current=${lt.allowsMultipleCurrent}, requires_valid_from=${lt.requiresValidFrom}]`"
    and "`  - ${nt.name}${nt.description ? ` — ${nt.description}` : ""}`"'
  cost: What the extraction prompt tells the model about the catalog is a decision no node holds. That
    covers which attributes of each link type are shown, node types shown with their descriptions, attribute
    keys shown with value type and a temporal marker, and every list sorted by name. Only the closed-values
    listing (extraction-prompt-lists-closed-values, extraction-prompt-values-ascending and extraction-prompt-values-verbatim)
    is held. The chat prompts do have a node for this (rules/chat/chat-prompt-presents-catalog), so a
    reader who looks in the specification for the extraction counterpart finds nothing and only the code
    answers.
- file: src/modules/ingestion/prompts/extraction.v4.ts
  where: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 22-23, the examples of relative-date words in the prompt
    text
  evidence: '"  `\"amanhã\"`, `\"semana que vem\"`, `\"esta semana\"`, similar pt-BR temporal",'
  cost: The prompt tells the model that "semana que vem" and "esta semana" are relative dates to resolve,
    and no node says so. The specification names only "hoje", "ontem" and "amanhã". Someone changing which
    words count as relative dates would look in the specification, find three words, and miss that the
    prompt carries two more.
- file: src/modules/ingestion/prompts/extraction.v4.ts
  where: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 24-25 and 29-30, the basis the prompt asks for on a relative
    date resolved against the document date and on an absolute date
  evidence: '"  deictics), resolve it AGAINST `document_date` if it is present (basis", "  `\"document\"`).
    If `document_date` is `(unknown)`, fall back to the date", ... "- The rule applies ONLY to relative
    dates. Absolute dates stated in the chunk", "  text remain `\"stated\"`; never invent a date.",'
  cost: The prompt tells the model which basis to give a relative date ("document") and an absolute date
    ("stated"). The node for the anchor fallback leaves the basis out, and its log records that it was
    withdrawn deliberately. The only node that names basis document is the go-live scenario, and that
    covers an event_date proposal. This basis rule therefore lives only in the prompt text. A reader checking
    what the model is asked to state for a relative date will not find it in the specification.
- file: src/modules/query-retrieval/service/search.service.ts
  where: 'searchKnowledgeService, lines 195-239: the node loop skips provenance-less nodes, and the expansion
    seeds are taken from the surviving node items'
  evidence: '`if (provenance.length === 0) continue;` ... `if (input.expand && nodeHits.length > 0) {`
    ... `const expanded = await collectExpandedLinks(context, scoreMatchedNodes(items));` where `scoreMatchedNodes`
    keeps every `it.kind === "node"` item. The `includeUncertain` filter runs only afterwards, at `const
    filtered = input.includeUncertain ? items : items.filter((it) => it.status !== "uncertain");`'
  cost: Two choices sit only in this code. A matched node without provenance never seeds an expansion.
    A matched node with status uncertain does seed one when the query excludes uncertain items, so links
    hang off a node the search itself hides. The specification says only that a search expands "from its
    matched knowledge nodes". A reader looking there finds neither choice, and a change to which nodes
    seed the expansion would be made in this function without anyone knowing a decision was involved.
restates:
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: The doc comment on `system()`, lines 61-64.
  evidence: '"The validation layer rejects anything outside this list with the corresponding `BUSINESS_UNKNOWN_{NODE_TYPE|LINK_TYPE|ATTRIBUTE_KEY}`
    code (BR-14)."'
  cost: The refusal codes are stated in prose here as well as in the refusal contracts and in code. A
    change to a code name leaves this comment unchanged and misleading.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: The doc comment on the `source_type` field of `DocumentMetadata`, line 45.
  evidence: '"/** §3.1 source_type enum value (pdf, email, ata, chat, artigo, transcricao, outro). */"'
  cost: The comment lists the enumeration a second time, in the material's old words. The node holds the
    values as pdf, email, meeting-minutes, chat, article, transcript and other, so a reader of the comment
    learns a vocabulary that differs from the node's. The field itself is typed `string`.
  node: domain/knowledge-base/source-type
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: The header comment, lines 22-24, and the doc comment on the `prevTail` field of `UserPromptArgs`,
    line 211.
  evidence: '"// `prev_tail` carries the last ≤ `PREV_TAIL_CHARS` (200) characters of the" and "/** Last
    ≤ 200 chars of the previous chunk (continuity); empty on chunk_index = 0. */"'
  cost: The 200-character tail is stated in two comments of this file as well as in the rule and in code.
    If the rule moves, no `--check` reaches this prose, and a reader can take the comment for the place
    the figure was decided.
  node: rules/knowledge-base/extraction-reads-chunks-in-order
unbound:
- src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
- src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
pairs_omitted:
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-prompt-lists-closed-values
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-prompt-values-ascending
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-prompt-values-verbatim
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-stated-basis-needs-written-start
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-turn-token-ceiling
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/extraction-prompt-names-relative-date-words
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: constraints/retrieval-is-lexical-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: domain/knowledge-base/item-kind
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/chunk-match-never-surfaces
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expanded-link-layer-is-node
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expanded-link-requires-provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expansion-as-of-view
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expansion-follows-both-directions
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expansion-hop
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expansion-in-effect-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/expansion-starts-from-matched-nodes
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/fragment-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/item-flags
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/link-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/link-types-ignored-without-expansion
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/matched-item-hop-zero
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/matched-node-requires-provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/node-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/non-expanding-search-walks-no-graph
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/search-layer-candidate-cap
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/search-ranking
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/temporal-filters-apply-to-expansion-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/uncertain-items-excluded-on-request
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  file: src/modules/query-retrieval/service/search.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
notes: "Judged by 5 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/review-proofs.returns/.\nCertification of domain/knowledge-base/search-item\
  \ did not hold: the auditor answered `partial` — Several parts of the item are exercised and would fail\
  \ if they broke: that kind is one of node, link or fragment, with all three answered; that the required\
  \ fields are present; that provenance has at least one entry and that each entry names only a fragment\
  \ that supports that item; that score is a decimal (0.05 and similar values are asserted exactly); and\
  \ that hop is an integer, but only on link items.\nThree parts go unexercised:\n- layer: it is checked\
  \ only against the pattern\n  /^(fragment|node|chunk)$/. Nothing ties that pattern to the values the\n\
  \  search-layer type enumerates, and the pack does not hold that type to\n  compare against. Nothing\
  \ asserts which layer a given item carries, so\n  an item answered on the wrong one of those three layers\
  \ passes.\n- flags: these are typed as many assertion-flag values. They are checked\n  as \"any Array\"\
  \ on every item, and one element value is checked in one\n  case only: [\"uncertain\"] on an uncertain-band\
  \ link. No item with any\n  other assertion flag, or with more than one flag, is in the set. A flag\n\
  \  value outside the assertion-flag vocabulary on a node or fragment item\n  would pass.\n- hop: on\
  \ node and fragment items it is checked only as \"any Number\", so\n  a non-integer hop on those kinds\
  \ would pass.\n\nSummary is checked only as \"any String\". That matches the node's bare string type,\
  \ but nothing ties it to what matched.\nThe test \"answers no item with an empty provenance\" also passes\
  \ when the search answers no items at all. It asserts the 1..* cardinality only against an item that\
  \ is present.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: These checks would close it:\n- For a world with\
  \ a matched node, an expanded link and a matched\n  fragment, assert each item's layer equals the search-layer\
  \ value\n  expected for that item.\n- For a world with links in the disputed and low-confidence conditions\n\
  \  alongside the uncertain one, assert each item's flags equal exactly the\n  assertion-flag values\
  \ its condition calls for, including an item with\n  more than one flag and an item with none.\n- Assert\
  \ that Number.isInteger(hop) holds for the node and fragment items..\nCertified rules/knowledge-base/expansion-decay\
  \ as decided by step `test`: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts (scores\
  \ a link reached at hop 1 from a matched node at 0.5 times the matched node's score); src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts\
  \ (scores a link reached at hop 2 from a matched node, neither endpoint being matched, at 0.25 times\
  \ the matched node's score); src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts (scores\
  \ a link reached at hop 3 from a matched node, neither endpoint being matched, at 0.125 times the matched\
  \ node's score); src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts (scores every expanded\
  \ link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched\
  \ node that is); src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts (scores a link\
  \ whose target is the matched node at 0.5 times its score at hop 1, and the link beyond it walked the\
  \ same way at 0.25 times at hop 2); src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts\
  \ (scores the link after a change of walking direction at 0.25 times the matched node's score at hop\
  \ 2: an outgoing link followed by an incoming one); src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts\
  \ (scores the link after a change of walking direction at 0.25 times the matched node's score at hop\
  \ 2: an incoming link followed by an outgoing one) would fail if the fact stopped holding.\nCertification\
  \ of rules/knowledge-base/extraction-relative-date-falls-back-to-reception did not hold: the auditor\
  \ answered `partial` — What the v4 prompt says is proven. Two tests check the text v4 adds to the system\
  \ prompt, both straight from the v4 module and from what selectPromptModule(\"v4\") returns: a relative\
  \ date in the chunk is resolved against `document_date` when it is present, and against the date portion\
  \ of `received_at` when `document_date` is `(unknown)`. The regular expression also requires the document\
  \ date to come first and the fallback to come after it. The user-message tests check that the model\
  \ is shown a real `document_date` when the source has one and `(unknown)` when it has none, so the condition\
  \ in the instruction depends on real input. The dispatch test checks that the registry maps \"v4\" to\
  \ the v4 module. What no test in the file does is run an extraction. Nothing takes a run whose prompt\
  \ version is v4 and checks the system prompt that run actually sends to the model. If the extraction\
  \ stopped picking its prompt module from the run's prompt version, for example by sending v3 or a fixed\
  \ module on a v4 run, the fact would stop holding and every named test would still pass. The \"under\
  \ prompt version v4, an extraction asks\" part of the fact is therefore unexercised. The two \"names\
  \ no basis\" tests check a different fact (that no basis is named for the fallback date) and are not\
  \ counted here.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: One input against one expected\
  \ result. Input: an extraction run with prompt version v4, over a chunk with a relative date, with the\
  \ model client stubbed so it captures the request. Expected: the system prompt in the captured request\
  \ contains the instruction to resolve the relative date against `document_date` when present and otherwise\
  \ against the date portion of `received_at`. The same run on a source with no document date should show\
  \ `document_date: (unknown)` in the user message it sends..\nCertification of rules/knowledge-base/extraction-user-prompt-shows-anchor-dates\
  \ did not hold: the auditor answered `partial` — The fact says the reception time is shown in every\
  \ extraction's user message, including when the source has no document date. For a source that has a\
  \ document date, every registered prompt version (v1 to v4, through selectPromptModule) is checked for\
  \ the reception time, the real document date, and no \"(unknown)\". For a source without a document\
  \ date, the reception time is checked only on v4's user() called directly. The registry's v4 module\
  \ and the v1, v2 and v3 modules are given a null document date, but the only thing checked is that \"\
  - document_date: (unknown)\" appears. So if a v1, v2 or v3 user message (or the v4 one reached through\
  \ the registry) dropped received_at when the source has no document date, no named test would fail,\
  \ and the fact would stop holding for an extraction run on that version.. The node is decided by reading,\
  \ and a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Give each registered prompt version's user() (v1, v2 and v3, and v4 as selectPromptModule\
  \ returns it) a source whose document_date is null and a known received_at. The expected result is a\
  \ user message containing \"- received_at: <that time>\" next to \"- document_date: (unknown)\"..\n\
  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,\
  \ and a pair was omitted only where a reconciliation's judgment had cleared it at these very bytes;\
  \ the plan's node(s) rules/knowledge-base/expansion-decay, domain/knowledge-base/search-item, rules/knowledge-base/extraction-relative-date-falls-back-to-reception,\
  \ rules/knowledge-base/extraction-user-prompt-shows-anchor-dates were read on every file and answered\
  \ for, and bound from nowhere here — a binding this record writes is one the trace already held.\nA\
  \ finding in src/modules/query-retrieval/service/search.service.ts names domain/knowledge-base/assertion-flag,\
  \ which no file of this set is bound to: computeFlags, line 473 (the value emitted for the low-confidence\
  \ flag): `flags.push(\"low_confidence\");`. The governing node domain/knowledge-base/assertion-flag\
  \ lists `values: - uncertain - disputed - low-confidence`, and rules/knowledge-base/item-flags says\
  \ \"low-confidence when it is an accepted information fragment whose confidence is below 0.4\". — The\
  \ flag value a search item carries is spelled `low_confidence`, and the enumeration the node holds spells\
  \ it `low-confidence`. Someone reading the specification to learn what a client receives gets a value\
  \ the system never emits. Other nodes (curation, ingestion) do spell `low_confidence`, so the specification\
  \ itself is not consistent about which spelling is the decided one.. It blocks nothing here; it is owed\
  \ a route of its own.\nCandidates: 0 opened across 0 of 5 delegation(s); each return lists its own under\
  \ `candidates_opened`.\nUnstated: 4 fact(s) the source states that no node holds, over 3 file(s), listed\
  \ under `unstated`. They block no binding here and no rebind closes them — the route is the analysis\
  \ that gives each fact a node.\nRestates: 3 place(s) where text in the source restates a node's fact\
  \ the code holds, over 1 file(s), listed under `restates`. The pair conforms, so none blocks a binding\
  \ — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/review-proofs.returns/`, which are the evidence behind every entry above.
