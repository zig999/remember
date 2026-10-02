---
contract_version: siegard-reconcile/8
title: Review of the drift-corrections initiative
summary: The three tasks of the drift-corrections initiative (task/calendar-date/refuse-impossible-date,
  task/expansion-decay/score-from-reached-node, task/v4-basis/prompt-no-received) wrote these files and
  their tests under the initiative drift-corrections, as their implementation and proof records state.
target: backend
files:
- path: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  change: 'written by the delivery of task/calendar-date/refuse-impossible-date: proves the refusal of
    2024-02-30 on a date key, that no node attribute is recorded, the HTTP 200 answer, and the acceptance
    of 2024-02-29.'
- path: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  change: 'written by the delivery of task/v4-basis/prompt-no-received: proves the version 4 directive
    resolves a relative date against the document date then the reception date and names no basis received.'
- path: src/__tests__/unit/ingestion/structural.spec.ts
  change: 'written by the delivery of task/calendar-date/refuse-impossible-date: proves at the helper
    level that days naming no existing day are refused and the boundaries inside the calendar are accepted.'
- path: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  change: 'written by the delivery of task/expansion-decay/score-from-reached-node: proves the decayed
    score at hops 1 to 3, the hop numbering of expanded links, and the item shape.'
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: 'written by the delivery of task/v4-basis/prompt-no-received: the version 4 directive no longer
    tells the model to state the basis received on the reception fallback; two doc comments were removed.'
- path: src/modules/ingestion/validation/structural.ts
  change: 'written by the delivery of task/calendar-date/refuse-impossible-date: the date branch of parseAttributeValue
    refuses a value naming no existing day with VALIDATION_INVALID_FORMAT carrying the value and its value
    type; the file''s comments were removed.'
- path: src/modules/query-retrieval/service/search.service.ts
  change: 'written by the delivery of task/expansion-decay/score-from-reached-node: an expanded link scores
    0.5 raised to its hop times the score of the matched node it was reached from, carries that hop, and
    is listed once by its best path; the file''s comments were removed.'
nodes:
- node: contracts/knowledge-base/ingestion
  conforms: false
  how: 'src/modules/ingestion/validation/structural.ts, parseAttributeValue, the number branch''s finiteness
    refusal (lines 51-57) and the bool branch (lines 60-69): throw new ValidationFailure("VALIDATION_INVALID_FORMAT",
    "value is not a finite number.", { value: v }); and throw new ValidationFailure("VALIDATION_INVALID_FORMAT",
    "value does not parse as a bool (expected ''true'' or ''false'').", { value: v }); The date branches
    and the number-shape branch carry { value: v, value_type: args.value_type }. The contract''s propose-attribute
    refusal for rules/knowledge-base/attribute-value-parses reads: "error code VALIDATION_INVALID_FORMAT
    naming the value and its value type, HTTP 200 carrying `{ ok: false, error }` over REST". — The refusal
    for an attribute value that does not read as its key''s value type names the value type in four of
    its six branches. A bool value refused, or a number refused as non-finite, comes back naming only
    the value. A caller or curator reading the details cannot rely on the value type being there, although
    the contract promises it. The next reader trusts the contract and does not find the gap.'
  observed_at:
  - src/modules/ingestion/validation/structural.ts
- node: domain/knowledge-base/page
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at the `limit` and `offset` fields\
    \ of the SearchServiceInput interface, and the slice that applies them — `readonly limit: number;\n\
    \  readonly offset: number;` and `const sliced = filtered.slice(input.offset, input.offset + input.limit);`"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/search-item
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at the IntermediateItem interface,\
    \ line 57, and toSearchItem, line 478 — `readonly kind: \"node\" | \"link\" | \"fragment\";\n  readonly\
    \ layer: SearchLayer;\n  score: number;\n  readonly hop: number;\n  summary: string;\n  flags: AssertionFlag[];\n\
    \  provenance: SearchProvenanceEntry[];`"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Three assertions would close it. (1) A search whose matched item has confidence in the
    uncertain band should answer that item with flags holding only assertion-flag values, including the
    expected one. (2) For every item of each kind, each provenance entry should name an information fragment
    that exists in the world and supports that item. (3) A matched node for which no supporting fragment
    exists, against the expected result that no item is answered with an empty provenance.
- node: domain/knowledge-base/search-query
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at the SearchServiceInput interface,\
    \ line 44 — `readonly query: string;\n  readonly layers?: readonly string[];\n  readonly asOf?: string;\n\
    \  readonly inEffectOnly: boolean;\n  readonly includeUncertain: boolean;\n  readonly expand: boolean;\n\
    \  readonly expandDepth: number;\n  readonly expandLinkTypes?: readonly string[];`"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/attribute-value-in-allowed-values
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at assertValueInDomain, lines 73-86 — if
    (domain.has(value)) { return; } ... throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "attribute
    value not in closed domain", { value, allowed_values });'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/attribute-value-parses
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at parseAttributeValue, lines 16-71, with
    DATE_SHAPE and namesExistingDay — const DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/; ... if (!/^-?\d+(?:\.\d+)?$/.test(v))
    ... if (!Number.isFinite(n)) ... if (v !== "true" && v !== "false") ... case "text": return;'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/expansion-decay
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at collectExpandedLinks, the score
    passed to keepBestPath, line 329 — `score: Math.pow(TRAVERSAL_DECAY, link.hop) * startScore,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: one matched node scored s, a link whose target is that node, and a further link
    walked the same way beyond it. Expected result: the first link scores 0.5 times s at hop 1, and the
    second scores 0.25 times s at hop 2.'
- node: rules/knowledge-base/expansion-hop
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at collectExpandedLinks, the hop taken
    from the traversal''s link, line 328 — `hop: link.hop,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v4.ts: held at the string array RECEIVED_AT_ANCHOR_DIRECTIVE
    (lines 15-31), appended to the v3 system prompt by system() at line 34. It is text sent to the model.
    — "  deictics), resolve it AGAINST `document_date` if it is present (basis", "  `\"document\"`). If
    `document_date` is `(unknown)`, fall back to the date", "  portion of `received_at` (the `YYYY-MM-DD`
    prefix of the ISO-8601 string)." and "return `${systemV3(catalog)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`;".
    The prompt asks for resolution against the document date when the source has one and otherwise against
    the date of reception, and the file declares `PROMPT_VERSION = "v4"`. It agrees with the node.'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Two assertions would close it. First, call `selectPromptModule("v4").user` with metadata
    whose `document_date` is a real date, for example 2026-05-10. Expect the metadata block to contain
    `- document_date: 2026-05-10`, next to the existing assertion for the null case. Second, take `selectPromptModule("v4").system(snapshot)`,
    the module a v4 extraction is given. Expect it to contain a directive whose subject is a relative
    date in the chunk, resolved against `document_date` when present and otherwise against the date portion
    of `received_at`.'
- node: rules/knowledge-base/node-type-in-catalog
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at assertKnownType, node_type arm, lines
    102-120. The catalog lookup that supplies `found` is in the caller; the refusal is held here. — args.kind
    === "node_type" ? "BUSINESS_UNKNOWN_NODE_TYPE"'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/search-total-before-pagination
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at searchKnowledgeService, lines 252\
    \ and 253 — `const total = filtered.length;\n  const sliced = filtered.slice(input.offset, input.offset\
    \ + input.limit);`"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/unknown-link-type-refused
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at resolveLinkTypeIds, called only\
    \ when the query expands, lines 100 and 425 — `const row = catalog.linkTypeByName.get(name);\n  if\
    \ (row === undefined) {\n    throw new UnknownLinkTypeError(name);\n  }`"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: scenarios/knowledge-base/impossible-calendar-date-refused
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at parseAttributeValue date case calling
    namesExistingDay, lines 24-41 — if (!namesExistingDay(Number(match[1]), Number(match[2]), Number(match[3])))
    { throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "value is not a calendar-valid date.",
    { value: v, value_type: args.value_type }); }'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
unstated:
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  where: the test "v4 keeps relative-date words verbatim in pt", lines 99-105
  evidence: expect(s).toContain('"hoje"'); expect(s).toContain('"ontem"'); expect(s).toContain('"amanhã"');
  cost: The test fixes three Portuguese day words that the v4 extraction prompt must carry, and no node
    says so. Under extraction-relative-date-falls-back-to-reception the prompt only has to ask the model
    to resolve a relative date against the document date or the reception date. A reader who looks for
    which relative-date words the prompt must name finds nothing in the specification, and the suite is
    the only place the list is decided.
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  where: the test 'v4.user() surfaces received_at and an unknown document_date in the metadata block',
    lines 111-128
  evidence: 'expect(metaBlock?.text).toContain("- received_at: 2026-06-26T12:00:00Z"); expect(metaBlock?.text).toContain("-
    document_date: (unknown)");'
  cost: 'The test fixes the layout of the metadata block in the user message ("- received_at: <value>"),
    and the literal "(unknown)" that stands for a missing document date. The prompt regex at line 42,
    which anchors on "if `document_date` is `(unknown)`", depends on the same literal. No node holds the
    block''s layout or the "(unknown)" marker, so the marker and the way the model is shown the two anchor
    dates are decided only in the suite.'
- file: src/__tests__/unit/ingestion/structural.spec.ts
  where: line 153, in the test "throws VALIDATION_INVALID_FORMAT with {value, allowed_values} on miss"
    (describe "assertValueInDomain (BR-30)")
  evidence: expect(vf.message).toBe("attribute value not in closed domain");
  cost: The test fixes the exact text a caller is told when an attribute value is outside its key's allowed
    values. No node holds that text. The ingestion contract answers this refusal only as "error code VALIDATION_INVALID_FORMAT
    naming the value and the allowed values in sorted order", with no message. The same contract does
    state messages verbatim for other refusals, for example "ingest_document arguments failed validation.".
    A reader looking in the specification for what the system says here finds nothing, and will take this
    test as the decision. The test also fixes the detail names `value` and `allowed_values`, which no
    node names either.
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: the it block "answers a node, a link and a fragment each as an item with kind, layer, score,
    hop, summary, flags and at least one supporting fragment", lines 351-381
  evidence: "for (const item of body.items) {\n  expect(item).toEqual(\n    expect.objectContaining({\n\
    \      kind: expect.stringMatching(/^(node|link|fragment)$/),\n      layer: expect.stringMatching(/^(fragment|node|chunk)$/),\n\
    \      score: expect.any(Number),\n      hop: expect.any(Number),\n      summary: expect.any(String),\n\
    \      flags: expect.any(Array),\n      provenance: expect.any(Array),\n    })\n  );"
  cost: 'The test makes layer, hop, summary and flags mandatory on every item, nodes and fragments included.
    Node domain/knowledge-base/search-item declares only kind and score as `required: true`, and says
    nothing about which kinds of item carry a hop. A reader looking for what a node item''s hop is, or
    whether it exists, finds the specification silent and the test the only place that decides it. If
    the answer is the other way round, this assertion fails, and nothing points back to a decision.'
- file: src/modules/query-retrieval/service/search.service.ts
  where: the fragment and node item construction in searchKnowledgeService, lines 184 and 220
  evidence: "`layer: \"fragment\",\n  id: f.id,\n  score: f.score,\n  hop: 0,` and, for the node item,\
    \ `layer: \"node\",\n  id: n.node_id,\n  score: n.score,\n  hop: 0,`"
  cost: A matched fragment or node is reported at hop 0 while a link beside it is at hop 1. This value
    is visible on every search item, and no node says it. The search-item node lists `hop` as an integer
    attribute without saying what an item that expansion did not reach carries. The expansion-hop node
    only sets the hop of an expanded link. A reader looking for what a matched item's hop is will find
    nothing in the specification, and the next reader will take the code's 0 as the decision.
- file: src/modules/query-retrieval/service/search.service.ts
  where: the node-hit loop in searchKnowledgeService, line 207
  evidence: '`if (provenance.length === 0) continue;`'
  cost: A knowledge node whose alias matched the query is silently dropped from the results when it has
    no provenance. The specification has this refusal only for expanded links (rules/knowledge-base/expansion-link-without-provenance,
    the statement "A knowledge link expansion reaches surfaces as a search item only when it holds provenance").
    The search-item node says only that an item has 1..* provenance fragments. A matched node can vanish
    from search and from the total, and no node says that this happens or why.
- file: src/modules/query-retrieval/service/search.service.ts
  where: toExpandedLinkItem, the returned item, line 390
  evidence: "`key: `link:${link.id}`,\n  kind: \"link\",\n  layer: \"node\",`"
  cost: Every expanded link is reported with layer `node`, although the search-layer enumeration names
    the layers a search reads and a link is not read from the node layer. A client that groups or filters
    results by layer gets links mixed into the node layer, and no node says that is intended.
unbound:
- src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
- src/__tests__/unit/ingestion/structural.spec.ts
- src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
pairs_omitted:
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/validation/structural.ts
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
notes: 'Judged by 7 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/drift-corrections.returns/.

  Certification of domain/knowledge-base/search-item did not hold: the auditor answered `partial` — The
  shape test exercises these parts of the node. An item is a node, a link or a fragment, and all three
  kinds appear in one response. Kind and score are present on every item. Each item carries at least one
  provenance entry. The hop and decay tests add numeric scores and integer hops on link items, but they
  prove the decay and hop-numbering facts, not this node. They bear on it only incidentally.

  Three parts of the fact go unexercised. First, flags are typed assertion-flag, but the test asserts
  only that flags is an array. Every fixture carries confidence 0.9 or 0.92, so no item ever has a flag.
  An item whose flags held a value that is not an assertion-flag would pass.

  Second, the provenance association targets information-fragment, but only the provenance array''s length
  is asserted. Nothing checks that its entries are information fragments. An item whose provenance pointed
  at chunks or raw information would pass.

  Third, the 1..* lower bound is shown only in a world where the stand-in client returns a provenance
  row for every anchor it is asked about. No candidate in the set has no supporting fragment, so nothing
  shows that an item is never answered with empty provenance.

  Separately, the shape test asserts more than the node establishes. It requires layer, hop and summary
  on every item, but the node declares none of them required. Only kind and score are. The test therefore
  breaks the day an item legitimately omits one of them, for example a directly matched node or fragment
  with no hop.. The node is decided by reading, and a certification standing on it from an earlier reconciliation
  is released by the bind. The remainder is testable: Three assertions would close it. (1) A search whose
  matched item has confidence in the uncertain band should answer that item with flags holding only assertion-flag
  values, including the expected one. (2) For every item of each kind, each provenance entry should name
  an information fragment that exists in the world and supports that item. (3) A matched node for which
  no supporting fragment exists, against the expected result that no item is answered with an empty provenance..

  Certification of rules/knowledge-base/expansion-decay did not hold: the auditor answered `partial` —
  The decay is exercised at hops 1, 2 and 3, against a matched node scored 0.8 and against two matched
  nodes scored 0.8 and 0.4. The tests would fail if the factor were not 0.5, if the exponent were not
  the hop, or if a link took its score from a different matched node than the one it was reached from.
  But every link the tests score is reached by walking from its source end to its target end. A link reached
  from the matched node through its target end, like link-in in the test "numbers an expanded link by
  the links on its path from the matched node, so a link touching the matched node is hop 1 in either
  direction", has only its hop asserted, never its score. The shape test only asserts that such a score
  is a number. So a link reached against its direction could take any score, for example from its source
  endpoint, which is not matched, and every test in the set would still pass. The fact covers every knowledge
  link reached at hop h, whichever way it was walked.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: Input:
  one matched node scored s, a link whose target is that node, and a further link walked the same way
  beyond it. Expected result: the first link scores 0.5 times s at hop 1, and the second scores 0.25 times
  s at hop 2..

  Certified rules/knowledge-base/expansion-hop as decided by step `test`: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  (numbers an expanded link by the links on its path from the matched node, so a link touching the matched
  node is hop 1 in either direction) would fail if the fact stopped holding.

  Certification of rules/knowledge-base/extraction-relative-date-falls-back-to-reception did not hold:
  the auditor answered `partial` — The instruction itself is tested. The text that v4.system adds after
  the v3 prompt is pinned to a regex: resolve against `document_date` when it is present, and when `document_date`
  is `(unknown)` fall back to the date portion of `received_at`, with document date tried first. The user-message
  test covers the fallback path. When the source has no date, the model sees `received_at` and `document_date:
  (unknown)`. Three parts of the fact go unexercised. First, nothing checks the case where the source
  has a date. Nothing calls `user()` with a non-null `document_date` and asserts that the model is shown
  that date. If the metadata block always printed `(unknown)`, the instruction to resolve against the
  document date would have nothing to point at, and every test would still pass. Second, nothing checks
  that a v4 extraction actually sends this instruction. The directive test reads `system` imported directly
  from `extraction.v4`, not the module the registry hands an extraction for ''v4''. The registry tests
  check only that module''s `version` field and that its system prompt starts with v3''s and differs from
  it. A registry entry with any other appended text would pass them. Third, the regex begins at "resolve
  it against". It does not check that "it" is a relative date in the chunk, so the instruction''s subject
  is not pinned.. The node is decided by reading, and a certification standing on it from an earlier reconciliation
  is released by the bind. The remainder is testable: Two assertions would close it. First, call `selectPromptModule("v4").user`
  with metadata whose `document_date` is a real date, for example 2026-05-10. Expect the metadata block
  to contain `- document_date: 2026-05-10`, next to the existing assertion for the null case. Second,
  take `selectPromptModule("v4").system(snapshot)`, the module a v4 extraction is given. Expect it to
  contain a directive whose subject is a relative date in the chunk, resolved against `document_date`
  when present and otherwise against the date portion of `received_at`..

  Certified scenarios/knowledge-base/impossible-calendar-date-refused as decided by step `test`: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  (refuses the value 2024-02-30 for a date key and records no node attribute); src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  (refuses the value 2024-02-30 with VALIDATION_INVALID_FORMAT naming the value and its value type); src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  (answers the refusal of an impossible date as HTTP 200 carrying ok false and an error) would fail if
  the fact stopped holding.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) rules/knowledge-base/attribute-value-parses, scenarios/knowledge-base/impossible-calendar-date-refused,
  contracts/knowledge-base/ingestion, domain/knowledge-base/proposal, domain/knowledge-base/attribute-key,
  domain/knowledge-base/value-type, rules/knowledge-base/expansion-decay, rules/knowledge-base/expansion-hop,
  domain/knowledge-base/search-item, rules/knowledge-base/caller-never-states-received, rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  were read on every file and answered for, and bound from nowhere here — a binding this record writes
  is one the trace already held.

  Candidates: 9 opened across 3 of 7 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 7 fact(s) the source states that no node holds, over 4 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/drift-corrections.returns/`, which are the evidence behind every entry above.
