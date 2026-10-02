# Material: unstated and contradicting facts found by the review of drift-corrections

Source: siegard-delivery/drift-corrections/review/drift-corrections.md, conformance pass. Rule of the owner: the code is the truth and the node changes, unless the fact is stack, operation or performance, or code that nothing uses.

## Finding 1: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
Where: the test "v4 keeps relative-date words verbatim in pt", lines 99-105
Evidence:
expect(s).toContain('"hoje"'); expect(s).toContain('"ontem"'); expect(s).toContain('"amanhã"');
Cost: The test fixes three Portuguese day words that the v4 extraction prompt must carry, and no node says so. Under extraction-relative-date-falls-back-to-reception the prompt only has to ask the model to resolve a relative date against the document date or the reception date. A reader who looks for which relative-date words the prompt must name finds nothing in the specification, and the suite is the only place the list is decided.

## Finding 2: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
Where: the test 'v4.user() surfaces received_at and an unknown document_date in the metadata block', lines 111-128
Evidence:
expect(metaBlock?.text).toContain("- received_at: 2026-06-26T12:00:00Z"); expect(metaBlock?.text).toContain("- document_date: (unknown)");
Cost: The test fixes the layout of the metadata block in the user message ("- received_at: <value>"), and the literal "(unknown)" that stands for a missing document date. The prompt regex at line 42, which anchors on "if `document_date` is `(unknown)`", depends on the same literal. No node holds the block's layout or the "(unknown)" marker, so the marker and the way the model is shown the two anchor dates are decided only in the suite.

## Finding 3: src/__tests__/unit/ingestion/structural.spec.ts
Where: line 153, in the test "throws VALIDATION_INVALID_FORMAT with {value, allowed_values} on miss" (describe "assertValueInDomain (BR-30)")
Evidence:
expect(vf.message).toBe("attribute value not in closed domain");
Cost: The test fixes the exact text a caller is told when an attribute value is outside its key's allowed values. No node holds that text. The ingestion contract answers this refusal only as "error code VALIDATION_INVALID_FORMAT naming the value and the allowed values in sorted order", with no message. The same contract does state messages verbatim for other refusals, for example "ingest_document arguments failed validation.". A reader looking in the specification for what the system says here finds nothing, and will take this test as the decision. The test also fixes the detail names `value` and `allowed_values`, which no node names either.

## Finding 4: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
Where: the it block "answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment", lines 351-381
Evidence:
for (const item of body.items) {
  expect(item).toEqual(
    expect.objectContaining({
      kind: expect.stringMatching(/^(node|link|fragment)$/),
      layer: expect.stringMatching(/^(fragment|node|chunk)$/),
      score: expect.any(Number),
      hop: expect.any(Number),
      summary: expect.any(String),
      flags: expect.any(Array),
      provenance: expect.any(Array),
    })
  );
Cost: The test makes layer, hop, summary and flags mandatory on every item, nodes and fragments included. Node domain/knowledge-base/search-item declares only kind and score as `required: true`, and says nothing about which kinds of item carry a hop. A reader looking for what a node item's hop is, or whether it exists, finds the specification silent and the test the only place that decides it. If the answer is the other way round, this assertion fails, and nothing points back to a decision.

## Finding 5: src/modules/ingestion/validation/structural.ts
Where: parseAttributeValue, the number branch's finiteness refusal (lines 51-57) and the bool branch (lines 60-69)
Evidence:
throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "value is not a finite number.", { value: v }); and throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "value does not parse as a bool (expected 'true' or 'false').", { value: v }); The date branches and the number-shape branch carry { value: v, value_type: args.value_type }. The contract's propose-attribute refusal for rules/knowledge-base/attribute-value-parses reads: "error code VALIDATION_INVALID_FORMAT naming the value and its value type, HTTP 200 carrying `{ ok: false, error }` over REST".
Cost: The refusal for an attribute value that does not read as its key's value type names the value type in four of its six branches. A bool value refused, or a number refused as non-finite, comes back naming only the value. A caller or curator reading the details cannot rely on the value type being there, although the contract promises it. The next reader trusts the contract and does not find the gap.

## Finding 6: src/modules/query-retrieval/service/search.service.ts
Where: the fragment and node item construction in searchKnowledgeService, lines 184 and 220
Evidence:
`layer: "fragment",
  id: f.id,
  score: f.score,
  hop: 0,` and, for the node item, `layer: "node",
  id: n.node_id,
  score: n.score,
  hop: 0,`
Cost: A matched fragment or node is reported at hop 0 while a link beside it is at hop 1. This value is visible on every search item, and no node says it. The search-item node lists `hop` as an integer attribute without saying what an item that expansion did not reach carries. The expansion-hop node only sets the hop of an expanded link. A reader looking for what a matched item's hop is will find nothing in the specification, and the next reader will take the code's 0 as the decision.

## Finding 7: src/modules/query-retrieval/service/search.service.ts
Where: the node-hit loop in searchKnowledgeService, line 207
Evidence:
`if (provenance.length === 0) continue;`
Cost: A knowledge node whose alias matched the query is silently dropped from the results when it has no provenance. The specification has this refusal only for expanded links (rules/knowledge-base/expansion-link-without-provenance, the statement "A knowledge link expansion reaches surfaces as a search item only when it holds provenance"). The search-item node says only that an item has 1..* provenance fragments. A matched node can vanish from search and from the total, and no node says that this happens or why.

## Finding 8: src/modules/query-retrieval/service/search.service.ts
Where: toExpandedLinkItem, the returned item, line 390
Evidence:
`key: `link:${link.id}`,
  kind: "link",
  layer: "node",`
Cost: Every expanded link is reported with layer `node`, although the search-layer enumeration names the layers a search reads and a link is not read from the node layer. A client that groups or filters results by layer gets links mixed into the node layer, and no node says that is intended.
