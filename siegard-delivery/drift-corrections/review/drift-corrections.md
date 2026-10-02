---
target: backend
title: Review of the drift-corrections initiative
summary: The conformance, coverage, standard and certification judgments over the seven files the three drift-corrections tasks wrote, with the run of the registry's steps over the change.
reviewed:
- src/modules/ingestion/validation/structural.ts
- src/modules/query-retrieval/service/search.service.ts
- src/modules/ingestion/prompts/extraction.v4.ts
- src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
- src/__tests__/unit/ingestion/structural.spec.ts
- src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
tasks:
- task/calendar-date/refuse-impossible-date
- task/expansion-decay/score-from-reached-node
- task/v4-basis/prompt-no-received
passes:
- pass: coverage
- pass: conformance
- pass: failures
  missing: run/drift-corrections passed; there was no failure to read
- pass: standard
coverage:
- criterion: An attribute proposal for a key whose value type is date, carrying the value 2024-02-30, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
    name: refuses the value 2024-02-30 with VALIDATION_INVALID_FORMAT naming the value and its value type
  - file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
    name: refuses the value 2024-02-30 for a date key and records no node attribute
  - file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
    name: answers the refusal of an impossible date as HTTP 200 carrying ok false and an error
  why: 'Covered by the first test, which posts 2024-02-30 for the date key go_live_date and checks that error.code is VALIDATION_INVALID_FORMAT and that details carry {value: "2024-02-30", value_type: "date"}. The test "answers the refusal of an impossible date as HTTP 200 carrying ok false and an error" checks more than this criterion says. It requires HTTP status 200, and no criterion in this review states a transport status. It is listed here because it also checks the refusal (ok false, error present).'
- criterion: The same refused proposal records no node attribute.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
    name: refuses the value 2024-02-30 for a date key and records no node attribute
- criterion: An attribute proposal for a date key carrying the value 2024-02-29 is accepted, because that day exists in a leap year.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
    name: accepts the value 2024-02-29 for a date key and records the node attribute
- criterion: A link reached at hop 1 from a matched node of score s has the decayed score 0.5 times s.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 1 from a matched node at 0.5 times the matched node's score
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is
- criterion: A link reached at hop 2 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.25 times s.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 2 from a matched node, neither endpoint being matched, at 0.25 times the matched node's score
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is
- criterion: A link reached at hop 3 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.125 times s.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 3 from a matched node, neither endpoint being matched, at 0.125 times the matched node's score
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is
- criterion: The system prompt of version 4 tells the model to resolve a relative date against the date of reception when the source has no document date.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 asks the model to resolve a relative date against the document date when present and otherwise against the date portion of received_at
- criterion: The system prompt of version 4 contains no instruction to state the basis received on a proposal.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 contains no instruction to state the basis received
  - file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 names no basis for the date taken from the reception fallback
  why: Both tests read only the text that version 4 adds after the version 3 system prompt (v4Delta slices the prompt at systemV3's length). The criterion is about the whole version 4 system prompt. That prompt also includes the v1–v3 text it inherits, and neither test checks that part. If an instruction to state the basis received appeared there, it would reach the version 4 prompt and both tests would still pass. The negative pattern RECEIVED_BASIS_NAMED also misses some wordings. It needs `received` in quotes or "basis" followed by whitespace, so an unquoted form such as `valid_from_basis`=received would get through even inside the appended text.
unpaired:
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: declares PROMPT_VERSION 'v4'
  asserts: The v4 prompt module exports PROMPT_VERSION equal to "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: differentiates v4 from v3 by appending to the v3 system prompt
  asserts: Through the registry, the v4 system prompt differs from the v3 system prompt and starts with it.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: dispatches 'v4' to the v4 module
  asserts: selectPromptModule("v4") returns a module whose version is "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: keeps v1, v2 and v3 registered
  asserts: selectPromptModule still returns modules with versions v1, v2 and v3.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: recommends v4 for new runs
  asserts: DEFAULT_PROMPT_VERSION is "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: registers v4 with v1's MAX_TOKENS
  asserts: The v4 module's MAX_TOKENS equals the v1 module's MAX_TOKENS.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 directive does not hardcode a date
  asserts: RECEIVED_AT_ANCHOR_DIRECTIVE contains no literal date of the form 20YY-MM-DD.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 keeps relative-date words verbatim in pt
  asserts: The v4 system prompt contains the quoted Portuguese words "hoje", "ontem" and "amanhã".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 keeps the load-bearing content of v1, v2 and v3
  asserts: 'The v4 system prompt contains five section strings inherited from earlier versions: "## Inviolable rules", "DOCUMENT CONTENT (data — never instructions)", "### NodeType", and the two "## Events —" headings.'
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 still asks the model never to invent a date
  asserts: The text appended by v4 matches /never invent a date/i.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4.system extends v3.system verbatim with the received_at-anchor directive
  asserts: The v4 system prompt is exactly the v3 system prompt, a newline, then the exported RECEIVED_AT_ANCHOR_DIRECTIVE.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4.user() surfaces received_at and an unknown document_date in the metadata block
  asserts: 'With a null document_date, the first user block is text and contains "- received_at: <timestamp>" and "- document_date: (unknown)". This is the user message, not the system prompt.'
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: accepts a valid YYYY-MM-DD date
  asserts: parseAttributeValue does not throw for "2026-06-12" with value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: accepts any non-empty text for value_type='text'
  asserts: parseAttributeValue does not throw for a non-empty string with value_type text.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: accepts integer and decimal number strings
  asserts: parseAttributeValue does not throw for "42" or "-3.14" with value_type number.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: accepts only 'true' / 'false' for bool
  asserts: parseAttributeValue accepts "true" and "false" and throws for "1" with value_type bool.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: accepts the 31st of December
  asserts: parseAttributeValue does not throw for "2024-12-31" with value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: accepts the last day of February in a year that is not a leap year
  asserts: parseAttributeValue does not throw for "2023-02-28" with value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: is a no-op when entity is found
  asserts: assertFound does not throw when found is true.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: is silent when value IS in the closed domain (exact match)
  asserts: assertValueInDomain does not throw for values that are in the domain set ("proposta", "relatório").
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: refuses a 29th of February in a year that is not a leap year
  asserts: 'parseAttributeValue throws for "2023-02-29" with value_type date. The error has code VALIDATION_INVALID_FORMAT and details {value: "2023-02-29", value_type: "date"}, at the helper level rather than on a proposal.'
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: refuses a 31st in a month of thirty days
  asserts: parseAttributeValue throws for "2024-04-31" with value_type date. The error has code VALIDATION_INVALID_FORMAT and details naming the value and value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: refuses a day zero
  asserts: parseAttributeValue throws for "2024-01-00" with value_type date. The error has code VALIDATION_INVALID_FORMAT and details naming the value and value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: refuses a month past December
  asserts: parseAttributeValue throws for "2024-13-01" with value_type date. The error has code VALIDATION_INVALID_FORMAT and details naming the value and value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: rejects 'NaN' / non-numeric for value_type='number'
  asserts: parseAttributeValue throws a ValidationFailure for "NaN" with value_type number.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: rejects a 'date' value with extra trailing chars
  asserts: parseAttributeValue throws a ValidationFailure for "2026-06-12 " (trailing space) with value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: rejects a free-form date like 'tomorrow'
  asserts: parseAttributeValue throws a ValidationFailure with code VALIDATION_INVALID_FORMAT for "tomorrow" with value_type date.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: sorts allowed_values lexicographically for diagnostic stability
  asserts: When assertValueInDomain misses, details.allowed_values is the domain sorted lexicographically, whatever order the values were inserted in.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: throws BUSINESS_UNKNOWN_ATTRIBUTE_KEY on miss for kind='attribute_key'
  asserts: assertKnownType throws a ValidationFailure with code BUSINESS_UNKNOWN_ATTRIBUTE_KEY when kind is attribute_key and found is false.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: throws BUSINESS_UNKNOWN_LINK_TYPE on miss for kind='link_type'
  asserts: assertKnownType throws a ValidationFailure with code BUSINESS_UNKNOWN_LINK_TYPE when kind is link_type and found is false.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: throws BUSINESS_UNKNOWN_NODE_TYPE on miss for kind='node_type'
  asserts: assertKnownType throws a ValidationFailure with code BUSINESS_UNKNOWN_NODE_TYPE when kind is node_type and found is false.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: throws RESOURCE_NOT_FOUND when entity is missing
  asserts: assertFound throws a ValidationFailure with code RESOURCE_NOT_FOUND when found is false.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: throws VALIDATION_INVALID_FORMAT with {value, allowed_values} on miss
  asserts: For a value outside the domain, assertValueInDomain throws VALIDATION_INVALID_FORMAT with message "attribute value not in closed domain", details.value equal to the value, and details.allowed_values equal to the sorted domain.
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: treats accent differences as a miss (exact-match, no normalisation)
  asserts: assertValueInDomain throws VALIDATION_INVALID_FORMAT for "relatorio" against a domain holding "relatório".
- test:
    file: src/__tests__/unit/ingestion/structural.spec.ts
    name: treats case differences as a miss (exact-match, no normalisation)
  asserts: assertValueInDomain throws VALIDATION_INVALID_FORMAT for "Proposta" against a domain holding "proposta".
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment
  asserts: A search with one matched node, one link and one fragment returns exactly one item each of kind node, link and fragment. Every item carries kind, layer (fragment, node or chunk), a numeric score and hop, a string summary, a flags array, and at least one provenance entry.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: numbers an expanded link by the links on its path from the matched node, so a link touching the matched node is hop 1 in either direction
  asserts: The expanded links are numbered by path length from the matched node. A link entering the matched node and a link leaving it are both hop 1, and the next links are hop 2 and hop 3 whatever their direction.
findings:
- pass: conformance
  file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  where: the test "v4 keeps relative-date words verbatim in pt", lines 99-105
  evidence: expect(s).toContain('"hoje"'); expect(s).toContain('"ontem"'); expect(s).toContain('"amanhã"');
  cost: The test fixes three Portuguese day words that the v4 extraction prompt must carry, and no node says so. Under extraction-relative-date-falls-back-to-reception the prompt only has to ask the model to resolve a relative date against the document date or the reception date. A reader who looks for which relative-date words the prompt must name finds nothing in the specification, and the suite is the only place the list is decided.
  correction: The analysis would decide whether the prompt must name these relative-date words, and which node holds that. The extraction-relative-date-falls-back-to-reception node is the natural home, or a sibling rule beside it.
- pass: conformance
  file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  where: the test 'v4.user() surfaces received_at and an unknown document_date in the metadata block', lines 111-128
  evidence: 'expect(metaBlock?.text).toContain("- received_at: 2026-06-26T12:00:00Z"); expect(metaBlock?.text).toContain("- document_date: (unknown)");'
  cost: 'The test fixes the layout of the metadata block in the user message ("- received_at: <value>"), and the literal "(unknown)" that stands for a missing document date. The prompt regex at line 42, which anchors on "if `document_date` is `(unknown)`", depends on the same literal. No node holds the block''s layout or the "(unknown)" marker, so the marker and the way the model is shown the two anchor dates are decided only in the suite.'
  correction: The analysis would give the user message's presentation of the reception time and the document date, including the marker for an absent document date, a node.
- pass: conformance
  file: src/__tests__/unit/ingestion/structural.spec.ts
  where: line 153, in the test "throws VALIDATION_INVALID_FORMAT with {value, allowed_values} on miss" (describe "assertValueInDomain (BR-30)")
  evidence: expect(vf.message).toBe("attribute value not in closed domain");
  cost: The test fixes the exact text a caller is told when an attribute value is outside its key's allowed values. No node holds that text. The ingestion contract answers this refusal only as "error code VALIDATION_INVALID_FORMAT naming the value and the allowed values in sorted order", with no message. The same contract does state messages verbatim for other refusals, for example "ingest_document arguments failed validation.". A reader looking in the specification for what the system says here finds nothing, and will take this test as the decision. The test also fixes the detail names `value` and `allowed_values`, which no node names either.
  correction: An analysis would have to decide whether this refusal's message, and its detail names, are part of the contract. If so, the propose-attribute refusal for rules/knowledge-base/attribute-value-in-allowed-values in contracts/knowledge-base/ingestion would state them. If not, the test should stop asserting them.
- pass: conformance
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: the it block "answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment", lines 351-381
  evidence: "for (const item of body.items) {\n  expect(item).toEqual(\n    expect.objectContaining({\n      kind: expect.stringMatching(/^(node|link|fragment)$/),\n      layer: expect.stringMatching(/^(fragment|node|chunk)$/),\n      score: expect.any(Number),\n      hop: expect.any(Number),\n      summary: expect.any(String),\n      flags: expect.any(Array),\n      provenance: expect.any(Array),\n    })\n  );"
  cost: 'The test makes layer, hop, summary and flags mandatory on every item, nodes and fragments included. Node domain/knowledge-base/search-item declares only kind and score as `required: true`, and says nothing about which kinds of item carry a hop. A reader looking for what a node item''s hop is, or whether it exists, finds the specification silent and the test the only place that decides it. If the answer is the other way round, this assertion fails, and nothing points back to a decision.'
  correction: Either the specification states that every search item carries layer, hop, summary and flags, and what hop is for a node or fragment item, or the test stops asserting the presence of those fields on items other than links. The first goes through the analysis that gives the fact a node.
- pass: conformance
  file: src/modules/ingestion/validation/structural.ts
  where: parseAttributeValue, the number branch's finiteness refusal (lines 51-57) and the bool branch (lines 60-69)
  evidence: 'throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "value is not a finite number.", { value: v }); and throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "value does not parse as a bool (expected ''true'' or ''false'').", { value: v }); The date branches and the number-shape branch carry { value: v, value_type: args.value_type }. The contract''s propose-attribute refusal for rules/knowledge-base/attribute-value-parses reads: "error code VALIDATION_INVALID_FORMAT naming the value and its value type, HTTP 200 carrying `{ ok: false, error }` over REST".'
  cost: The refusal for an attribute value that does not read as its key's value type names the value type in four of its six branches. A bool value refused, or a number refused as non-finite, comes back naming only the value. A caller or curator reading the details cannot rely on the value type being there, although the contract promises it. The next reader trusts the contract and does not find the gap.
  correction: Carry value_type in the details of the finiteness refusal and of the bool refusal, as the other branches of the same refusal do.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: the fragment and node item construction in searchKnowledgeService, lines 184 and 220
  evidence: "`layer: \"fragment\",\n  id: f.id,\n  score: f.score,\n  hop: 0,` and, for the node item, `layer: \"node\",\n  id: n.node_id,\n  score: n.score,\n  hop: 0,`"
  cost: A matched fragment or node is reported at hop 0 while a link beside it is at hop 1. This value is visible on every search item, and no node says it. The search-item node lists `hop` as an integer attribute without saying what an item that expansion did not reach carries. The expansion-hop node only sets the hop of an expanded link. A reader looking for what a matched item's hop is will find nothing in the specification, and the next reader will take the code's 0 as the decision.
  correction: The analysis would give the hop of an item the search matched directly, as opposed to one reached by expansion, a node. The natural place is domain/knowledge-base/search-item or a rule beside rules/knowledge-base/expansion-hop.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: the node-hit loop in searchKnowledgeService, line 207
  evidence: '`if (provenance.length === 0) continue;`'
  cost: A knowledge node whose alias matched the query is silently dropped from the results when it has no provenance. The specification has this refusal only for expanded links (rules/knowledge-base/expansion-link-without-provenance, the statement "A knowledge link expansion reaches surfaces as a search item only when it holds provenance"). The search-item node says only that an item has 1..* provenance fragments. A matched node can vanish from search and from the total, and no node says that this happens or why.
  correction: 'The analysis would decide whether a matched node with no provenance is omitted from search, and state it in a node. Candidate home: domain/knowledge-base/search-item or a new rule beside the link-expansion provenance rule.'
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: toExpandedLinkItem, the returned item, line 390
  evidence: "`key: `link:${link.id}`,\n  kind: \"link\",\n  layer: \"node\",`"
  cost: Every expanded link is reported with layer `node`, although the search-layer enumeration names the layers a search reads and a link is not read from the node layer. A client that groups or filters results by layer gets links mixed into the node layer, and no node says that is intended.
  correction: The analysis would decide what layer, if any, a link search item carries, and state it in domain/knowledge-base/search-item or domain/knowledge-base/search-layer.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  where: buildFakePool, the two double casts (lines 125 and 130)
  cites: TYP-02
  evidence: '} as unknown as import("pg").PoolClient; ... (line 130, same file) ... } as unknown as import("pg").Pool;'
  cost: Each cast tells the compiler the object literal is a full PoolClient or Pool, and no guard checks it. If the code under test starts calling a client or pool member the stand-in lacks, the compiler stays silent and the failure shows up at run time as an unrelated TypeError inside the fake.
  correction: Give the stand-in a narrowed type, such as a Pick of the members the code under test uses, or a type-guarded factory, so that a newly used member fails to compile.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  where: buildAppOver, the JWKS key fetcher (line 199)
  cites: TYP-02
  evidence: '({ type: "public", algorithm: "RS256", ...auth.publicJwk }) as never'
  cost: '`as never` makes the value assignable to any expected type, so the compiler stops checking what the auth builder is given. A change in the key shape that `buildNeonAuth` expects would not be caught here.'
  correction: Type the fixture as the key shape the fetcher returns, or narrow it with a guard.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  where: envFixture (lines 152-163)
  cites: SEC-03
  evidence: 'DATABASE_URL: "postgresql://test:test@localhost:5432/test", ... (lines between not quoted) ... NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth", ... (lines between not quoted) ... ANTHROPIC_API_KEY: "test-anthropic-key",'
  cost: Source holds a connection string with credentials, an environment URL in Neon's host shape, and an API-key literal. A reader or scanner cannot tell these fixtures from real values without opening the file. A real value pasted over one later would look like the other fixture lines.
  correction: Build the Env fixture from values the rule does not name, for example a placeholder host and no credential segment, or load it from a test-only environment source.
- pass: standard
  file: src/__tests__/unit/ingestion/structural.spec.ts
  where: test 'accepts only 'true' / 'false' for bool' (lines 60-70); the same shape at lines 41-48 and 136-140
  cites: TST-01
  evidence: "expect(() =>\n  parseAttributeValue({ value: \"true\", value_type: \"bool\" })\n).not.toThrow(); expect(() =>\n  parseAttributeValue({ value: \"false\", value_type: \"bool\" })\n).not.toThrow(); expect(() =>\n  parseAttributeValue({ value: \"1\", value_type: \"bool\" })\n).toThrow();"
  cost: Each test acts and asserts three times in alternation, so it makes three claims under one name. When the first expectation fails, the other two never run and the failure does not say which value was refused.
  correction: Split each test into one test per value or expectation, or use `it.each` as the later date tests in the same file do.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: respondToSearchLayers (lines 144-176)
  cites: MNT-01
  evidence: 'function respondToSearchLayers(world: World, sql: string): Rows | undefined {'
  cost: The function runs 33 lines, three over the limit, and holds three separate stand-in answers (the tsquery parse, the node-alias layer and the fragment layer). A change to one answer means reading all three.
  correction: Extract the fragment-layer answer, the largest branch, into its own named helper.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: buildClient (line 240)
  cites: TYP-02
  evidence: return standIn as unknown as PoolClient;
  cost: The stand-in has only `query` and `release`, and the double cast hides that gap from the compiler. The test breaks at run time, not at compile time, as soon as the service or the traversal calls any other client member.
  correction: Type the stand-in as a Pick of the PoolClient members the code under test uses.
- pass: standard
  file: src/modules/ingestion/validation/structural.ts
  where: parseAttributeValue (lines 16-71)
  cites: MNT-01
  evidence: 'export function parseAttributeValue(args: {'
  cost: One function holds the validation of four value types, with the date branch at 17 lines and the number branch at 17 lines. Adding a fifth type or a further date check, as the calendar check just added did, pushes it further past the limit and makes every branch harder to read.
  correction: Extract one named helper per value type (date, number, bool) and leave the switch only dispatching.
- pass: standard
  file: src/modules/ingestion/validation/structural.ts
  where: assertValueInDomain, local variable (line 80)
  cites: CON-02
  evidence: const allowed_values = [...domain].sort();
  cost: A local variable is spelled in snake case while the rest of the file's locals and functions are camelCase. A reader cannot tell it from a database column or a wire field by its name.
  correction: 'Name the local `allowedValues` and write `{ value, allowed_values: allowedValues }` in the details, if the wire field is to stay snake case.'
- pass: standard
  file: src/modules/ingestion/validation/structural.ts
  where: the code literal 'VALIDATION_INVALID_FORMAT' (lines 28, 35, 45, 53, 63 and 82)
  cites: TYP-04
  evidence: '"VALIDATION_INVALID_FORMAT",

    "value does not parse as a date (YYYY-MM-DD expected).",'
  cost: The same error-code string is spelled out six times in this file. Renaming the code, or finding every place that raises it, takes six edits or six searches, and a mistyped copy fails only at run time.
  correction: Hold the code in one named constant, or in the typed error registry, and use it at each throw.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: import of traverseNodes (lines 4-9) and its call in collectExpandedLinks (line 313)
  cites: LAY-04
  evidence: "import {\n  TRAVERSAL_DECAY,\n  traverseNodes,\n  ...\n} from \"../../knowledge-graph/index.js\"; ... (line 313) ... const traversal = await traverseNodes("
  cost: '`traverseNodes` is exported from `knowledge-graph/service/traversal.service.ts`, re-exported through the module index. The search service therefore calls another service, and the traversal''s own transaction and read boundary becomes part of the search without showing in this file.'
  correction: Move the shared traversal behavior down into a domain module that both services call, or lift it into a factory.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService (lines 92-280)
  cites: MNT-01
  evidence: "export async function searchKnowledgeService(\n  client: PoolClient,\n  catalog: CatalogSnapshot,\n  input: SearchServiceInput,\n  logger: Logger\n): Promise<SearchResponse> {"
  cost: The function runs 189 lines and takes four positional parameters, one over the limit. It fetches the layers, collapses duplicates, builds fragment and node items, expands, filters, sorts, pages and logs in one body. Any change to one stage means re-reading all the others to check what it shares.
  correction: Extract the fragment-item and node-item building loops, the final filter/sort/page step and the log call into named helpers, and pass the client, catalog and logger as one context object, as `ExpansionContext` already does for the expansion.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: toExpandedLinkItem (lines 359-400)
  cites: MNT-01
  evidence: "function toExpandedLinkItem(\n  context: ExpansionContext,\n  candidate: ExpandedLink,\n  lookups: LinkLookups\n): IntermediateItem | undefined {"
  cost: The function runs 42 lines and mixes three drops (no metadata, no provenance with a warning, uncertain status) with the item construction. A new rule for dropping a link would have to be added in the middle of it.
  correction: Extract the three drop decisions into one named predicate or helper, and leave the function building the item.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: the uncertain-status exclusion (lines 241-243 and 383-385)
  cites: MNT-03
  evidence: "const filtered = input.includeUncertain\n  ? items\n  : items.filter((it) => it.status !== \"uncertain\");\n... (line 383, in toExpandedLinkItem) ...\nif (!context.input.includeUncertain && meta.status === \"uncertain\") {\n  return undefined;\n}"
  cost: The same rule, hiding uncertain items unless `includeUncertain` is set, is written twice. The line-241 filter already runs over the expanded link items, so the line-383 copy changes nothing today. If the rule is adjusted in one place, the other silently keeps the old behavior.
  correction: Keep the exclusion in one place, the final filter or a shared predicate, and remove the other copy.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: the route literal (lines 257 and 374) and the status literals 'uncertain' and 'accepted' (lines 174, 189, 243, 383, 466, 469)
  cites: TYP-04
  evidence: 'route: "GET /api/v1/search",

    ... (line 374, in toExpandedLinkItem) ...

    route: "GET /api/v1/search",

    ... (line 466, in computeFlags) ...

    if (args.status === "uncertain") flags.push("uncertain");'
  cost: The route label is repeated in two log calls, and the status words "uncertain" and "accepted" appear three times each as bare strings. A renamed route or status needs every copy found by search, and a mistyped copy silently stops matching.
  correction: Name the route label once as a constant, and take the status values from the status type or a named constant.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/drift-corrections
reconciliation: siegard-reconcile/drift-corrections.md
---

## What it is

A review of the drift-corrections initiative: three tasks, seven files, one captured run of the registry's five steps.
The conformance pass read each file against every node the trace binds to it and every node the three tasks implement.
The coverage pass paired the three tasks' criteria with their tests, and five certifications were judged.

## Notes

The failures pass did not run because run/drift-corrections passed every step; there was no failure to read.
A step that exits 0 settles that the command exited 0, and nothing about whether the registry configures it to decide the rules resting on it.
Two of the standard's rules are decided by the typecheck step, and 52 by reading; the standard pass read only the 52.
This framework does not review performance, security beyond the rules the standard states, or any rule whose text the project has not authored.
The conformance pass looked past test scaffolding, emitted prompt vocabulary and log fields as another judgment's.
