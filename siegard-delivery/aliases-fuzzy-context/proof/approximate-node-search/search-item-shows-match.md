---
target: backend
implementation: sha256:9753b39ef9244b2b5d06b12825916b612f9b10e4749267282faf2d52b1f2b9a6
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/approximate-node-search-search-item-shows-match-suite
title: Proof that a hop-0 knowledge node search item shows how it matched
summary: Service-level and transport-level tests that exact and approximate hop-0 node items carry match and similarity as the specification states, that link and fragment items carry neither, and that flags stay free of match values.
tests:
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: a search for the correct name of two knowledge nodes > answers the knowledge nodes Petrobras and Petrobrás Distribuidora for petrobras as two node items, each carrying the match exact'
  proves: A search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", each with an accepted information fragment mentioning it, returns both knowledge nodes. In that search both returned knowledge node items carry the match exact. (This also gives the exact-match evidence for "An exactly matched hop-0 knowledge node item carries the match exact.")
  fails_when: either node is missing from the answer, or either node item carries a match other than exact (absent or approximate) when the exact route returned it
  demonstrates: scenarios/knowledge-base/correct-name-matches-exactly
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: the match and similarity of a hop-0 knowledge node item > answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score'
  proves: 'A knowledge node search item at hop 0 carries whether the node layer matched it exactly or approximately, and the similarity of an approximate match. Also the criteria: an exact hop-0 item carries the match exact; an approximate one carries the match approximate and its similarity; an exact item carries no similarity. Also the UNDERDETERMINED entry on approximate-match-similarity: the stubbed approximate row has similarity 0.8 and score 0.72 (0.9 times 0.8), and the item must carry 0.8.'
  fails_when: an exact item lacks the match exact or carries a similarity; an approximate item lacks the match approximate; an approximate item carries no similarity; or it carries the layer-weighted score (0.72), or any value other than the similarity the approximate route returned
  demonstrates: rules/knowledge-base/node-item-shows-match
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: the match and similarity of a node matched both exactly and approximately > answers a knowledge node matched both exactly and approximately with the match exact'
  proves: A knowledge node matched both exactly and approximately carries the match exact.
  fails_when: a node that both node-layer routes qualify is tagged approximate, or is answered without a match
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: the match and similarity of a node matched both exactly and approximately > answers a knowledge node matched both exactly and approximately with no similarity, though one of its aliases is similar enough for an approximate match'
  proves: A knowledge node search item that the node layer matched exactly carries no similarity, even when one of the node's aliases has a word similarity to the query text that would be enough for an approximate match. Also the criterion "An exactly matched knowledge node item carries no similarity."
  fails_when: the exact item of a node whose alias also qualifies approximately carries a similarity, for example the approximate route's similarity is overlaid on the exact item
  demonstrates: rules/knowledge-base/exact-node-item-carries-no-similarity
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: the flags of an approximately matched knowledge node > answers an approximately matched node with no flag describing its match'
  proves: The flags of an approximately matched knowledge node item hold no value describing its match.
  fails_when: the flags of an approximately matched node item contain any value, such as approximate, instead of staying empty for an active node
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService: the items that are neither a knowledge node > answers every knowledge link reached by expansion, from an exactly or an approximately matched node, and every information fragment with no match and no similarity'
  proves: A search item for a knowledge link or an information fragment carries no node match and no similarity. Also the criterion "A knowledge link item reached by expansion carries no match." and the UNDERDETERMINED entry on link-and-fragment-items-carry-no-match (no match on fragment items, no similarity on link items reached from an approximately matched node).
  fails_when: any expanded link item, from an approximately or an exactly matched node, or any fragment item carries a match or a similarity; or the link or fragment items are absent from the answer
  demonstrates: rules/knowledge-base/link-and-fragment-items-carry-no-match
- file: src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
  name: searchNodeAliasApproximateLayer SQL contract > selects the similarity as the highest word similarity of the node's aliases to the normalized query, with no layer weight applied
  proves: The similarity of an approximately matched node is the highest word similarity of its aliases to the query text, with no layer weight applied (rules/knowledge-base/approximate-match-similarity; the UNDERDETERMINED entry naming the weighted strength or a whole-query trigram similarity as accepted values). It pins the emitted SQL because every test here runs against a fake pool.
  fails_when: the similarity column is the weighted score expression, a whole-query trigram similarity, or anything other than max(word_similarity(alias_norm, norm(query))) as similarity
- file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
  name: 'query-retrieval search answer: the match of a knowledge node matched approximately > shows the match approximate and its similarity on the node item of the REST search answer'
  proves: 'The UNDERDETERMINED entry on contracts/knowledge-base/retrieval: the search answer published over REST shows, on each knowledge node matched directly, whether it matched exactly or approximately and the similarity of an approximate match.'
  fails_when: GET /api/v1/search leaves match or similarity out of the node item, for example a response schema or serializer strips them, or they carry other values
- file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
  name: 'query-retrieval search answer: the match of a knowledge node matched approximately > shows the match approximate and its similarity on the node item of the MCP search answer'
  proves: 'The UNDERDETERMINED entry on contracts/knowledge-base/retrieval, over the MCP transport: the search tool''s answer shows match and similarity on the node item.'
  fails_when: the MCP search tool's payload leaves match or similarity out of the node item, or they carry other values
files:
- path: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  effect: The harness's stubbed approximate-route rows now carry the similarity column the real query returns (new approximateHitRow replaces nodeHitRow for approximate matches); the existing approximate-node expansion test is unchanged in what it asserts. The test listed under `tests` is added to this file.
not_applicable:
- edge_case: absent, blank, over-long or unparseable query text
  why: Refused at the validation boundary and by the parse gate under other nodes' rules (search-query-not-blank, search-query-length, search-query-must-parse) and already tested; this task's fields are not built on that path.
- edge_case: pagination (limit and offset) and ordering
  why: Slicing and ordering never alter an item's fields; no criterion or node of this task reaches them.
- edge_case: a node whose status is needs_review, or a link or fragment with uncertain status or low confidence
  why: computeFlags is unchanged and takes only status and confidence; no criterion ties flags to the node's match beyond the approximate-node case tested.
- edge_case: the node layer not requested, or no node hits
  why: No node items are built, so there is no match or similarity to assert; nothing this task states applies.
- edge_case: the 200-candidate cap across both routes
  why: Behavior unchanged by this task and already tested in the existing approximate-node spec.
- edge_case: store unavailable, slow or answering in an unexpected shape
  why: This task adds no new store access or failure path; the added column rides the existing query.
- edge_case: two searches at once
  why: The search is a read of independent state; no criterion or node states concurrent behavior.
untested:
- 'domain/knowledge-base/search-item: the node is a value object (typed attributes, required flags, a 1..*) provenance relationship); no runtime test decides every typing and cardinality, and a test of the match and similarity attributes alone would approximate part of it as the whole.'
- 'domain/knowledge-base/node-match: a closed two-value enumeration; tests show the two values occur but cannot show no third value can occur.'
- 'domain/knowledge-base/assertion-flag: a closed three-value enumeration, unchanged by this task; the flags test shows only that no match value enters an approximate node''s flags.'
- 'rules/knowledge-base/node-layer-approximate-match: the 5-character alias floor and the 0.6 word-similarity threshold are evaluated by the database''s SQL, which no fake-pool test can decide, and they belong to the approximate-node-match task (REMAINDER note). Only the clause "when it does not match it exactly" has evidence here, in the both-routes tests.'
- 'rules/knowledge-base/node-layer-matches-through-aliases: whether the lexical parse of the query text matches an alias is decided by PostgreSQL full text and cannot be decided against a fake pool; the tests tag what the exact route returns.'
- 'rules/knowledge-base/approximate-match-similarity: that the stored value is the highest word similarity over the node''s aliases is computed by the database. The tests prove the service passes the row''s similarity through unweighted and that the SQL selects max(word_similarity(...)) as similarity, not the computed value against real aliases.'
- 'contracts/knowledge-base/retrieval: the contract spans sixteen operations; the tests cover only the search answer''s match and similarity over REST and MCP.'
- 'scenarios/knowledge-base/correct-name-matches-exactly: the scenario test stubs the exact route''s answer. That the database''s lexical parse of "petrobras" actually matches the alias "Petrobrás Distribuidora" (accent folding) is not proven.'
- 'Inference about behavior: items without a match or similarity omit the key rather than send null. The node only declares both optional and no node decides null versus omission, so the tests treat absent and null alike and assert neither.'
- 'Inference about behavior: the similarity is kept as the real value word_similarity returns, with no cast. How a PostgreSQL real arrives through the driver (digit noise on the wire) is not proven against a database; the node says only decimal.'
- The scenario misspelled-name-matches-approximately ("Petrobrass" over "Petrobras") is not in this task's implements; its approximate-match and similarity clause is evidenced here only through stubs, and the approximate match itself is not decided here.
---

## What it is

Service-level and transport-level tests that exact and approximate hop-0 node items carry match and similarity as the specification states, that link and fragment items carry neither, and that flags stay free of match values.

## Notes

One test pins the emitted SQL of the approximate route because every test here runs against a fake pool; the database-computed values themselves are unproven.
