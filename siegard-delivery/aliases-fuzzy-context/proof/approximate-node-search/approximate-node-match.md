---
target: backend
implementation: sha256:5d05c61f611d22deaa9cd7bc286b8c41bbea424199e35e06470085fa2b6065d6
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/approximate-node-search-approximate-node-match-suite
title: Proof for approximate node match through word similarity
summary: Unit tests over the search service, with a fake store standing in for PostgreSQL, prove that approximate hits become hop-0 node items, that a node matched both ways appears once with its exact score, that the node layer keeps at most 200 candidates across both routes, that the fragment and chunk layers gain no trigram route, and that links expand from an approximate match at 0.5 raised to the hop. The facts that only pg_trgm inside PostgreSQL decides (threshold, 5-character floor, normalization, strength) are listed as unproven, because the suite has no real database.
tests:
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: the node layer''s approximate route answers a knowledge node that only the approximate route reaches as a node item at hop 0'
  proves: '"A search for \"Petrobrass\" returns the knowledge node \"Petrobras\" at hop 0", and the same path for "contrato Petrobras", where the exact route misses and only the approximate route reaches the node. The node-layer hits of the approximate route enter the result as hop-0 node items.'
  fails_when: the service stops running the approximate route, or discards its hits when the exact route found nothing, or builds the item with a hop other than 0 or a kind other than node
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: a node matched by both node-layer routes answers a knowledge node matched both exactly and approximately once'
  proves: '"A knowledge node matched both exactly and approximately appears once among the search items."'
  fails_when: a node the exact route already matched is also returned by the approximate route and both entries reach the items, so the node appears twice
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: a node matched by both node-layer routes scores a knowledge node matched both exactly and approximately with its exact-match score'
  proves: UNDERDETERMINED entry on rules/knowledge-base/node-layer-approximate-match, which approximates only a node that does not match exactly. The single item of a node matched both ways keeps the exact match and its score.
  fails_when: the duplicate is removed by keeping the approximate entry, so the node carries its approximate score instead of its exact-match score
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: the node layer''s candidate cap across both routes keeps at most 200 node candidates when the exact and approximate routes together hold more'
  proves: '"The node layer keeps at most 200 candidates, counting both routes together." The store holds 150 exact and 100 approximate candidates.'
  fails_when: each route is capped at 200 on its own, so the node layer keeps more than 200 candidates, or the approximate route is given the whole limit regardless of how many exact hits already took
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: the node layer''s candidate cap across both routes reports a total that counts the 200 candidates kept, not the candidates both routes held'
  proves: UNDERDETERMINED entry on rules/knowledge-base/search-layer-candidate-cap, whose total "counts the candidates kept". The reported total is the count of the capped candidates.
  fails_when: the node layer is capped at 200 across both routes but the reported total is computed from the uncapped exact and approximate candidates
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: prose layers stay lexical answers no fragment-layer item for text that only a trigram match could reach'
  proves: '"A search for \"Petrobrass\" returns no fragment-layer item for a fragment whose text holds only \"Petrobras\"", and the negative clause of rules/knowledge-base/prose-matching. The fake store answers a fragment query that uses trigram similarity with that fragment and answers the full-text query with nothing.'
  fails_when: a trigram or similarity route is added to the fragment layer, so a fragment item appears for text reachable only by approximate match
- file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  name: 'searchKnowledgeService: prose layers stay lexical answers no chunk-layer item for text that only a trigram match could reach'
  proves: '"A search for \"Petrobrass\" returns no chunk-layer item for a chunk whose text holds only \"Petrobras\"". The fake store answers a chunk query that uses trigram similarity with that chunk and answers the full-text query with nothing.'
  fails_when: a trigram route is added to the chunk layer and the service turns its hit into an item with layer chunk
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: a knowledge node matched approximately expands from it like any matched node, scoring a link at hop h at 0.5 raised to h times the score of the matched node it was reached from, whether that node was matched exactly or approximately'
  proves: '"A knowledge link one hop from an approximately matched knowledge node is returned with 0.5 times that node''s score", with hops 2 and 3 at 0.25 and 0.125 (UNDERDETERMINED entry on rules/knowledge-base/expansion-decay). One exact and one approximate matched node each have a 3-hop chain, the depth cap of a search, and all six link scores are asserted.'
  fails_when: an approximately matched node does not enter expansion, or links reached from it take a single 0.5 factor whatever the hop, or the decay is not 0.5 raised to the hop for either kind of matched node
  demonstrates: rules/knowledge-base/expansion-decay
not_applicable:
- edge_case: absent or empty query text
  why: Refused by the existing empty-after-parse check before any node-layer route runs. That behavior is unchanged and covered by search-service.spec.ts, and no criterion or node of this task states it.
- edge_case: a matched node with no accepted fragment mentioning an alias
  why: The existing provenance drop is preserved unchanged. The only criterion that touches it is an ADVISORY note about the CNPq scenario's given, and no criterion states the drop.
- edge_case: zero approximate hits
  why: The zero-result path is already proven by search-service.spec.ts (BR-22), and the fake of every existing spec returns an empty approximate route.
- edge_case: the store failing or answering slowly in the new route
  why: No criterion or node of this task states how a store failure in the approximate route is answered, so there is nothing to assert.
- edge_case: two searches at once
  why: Search is read-only, and no criterion or node states a concurrency guarantee.
- edge_case: a merged or deleted node reached by an alias
  why: The approximate query excludes them, as the exact route does, but no criterion or node of this task states it. It is an implementation choice, not an obligation.
untested:
- Criteria decided by pg_trgm word_similarity inside PostgreSQL, which no test of this suite can decide. "Petrobrass" and "contrato Petrobrass" reaching "Petrobras"; "CNPJ" not returning "CNPq"; an alias under 5 normalized characters never matching; a node below 0.6 not matching; "PETROBRÁSS" scoring as "petrobrass"; the similarity of "contrato Petrobrass" equal to that of "Petrobrass"; and the score being the highest alias similarity times 0.9. Every test in this backend runs against a fake PoolClient and there is no real-Postgres harness. A fake that computed trigram similarity would be business logic standing in for the store (TST-03). A test over the SQL text or the bound parameters would pin the arrangement and fail an equivalent rewrite (SPEC-004 R3). A test writing to a database is barred by the project's database-change approval rule. A harness over an ephemeral Neon branch would close all of these.
- UNDERDETERMINED entry on the inclusive bounds (an alias of exactly 5 characters, a similarity of exactly 0.6). It names an implementation that uses a strict > or a 6-character floor, and only a database run can exclude it. No test written here fails over it.
- UNDERDETERMINED entry on trimming and collapsing whitespace before the 5-character floor and the similarity are measured. It names an implementation that measures them on untrimmed text, and only a database run with an alias stored with surrounding or doubled spaces can exclude it. No test written here fails over it.
- Nodes rules/knowledge-base/node-layer-approximate-match, node-layer-matches-through-aliases, word-similarity, name-normalization and approximate-match-strength. Each is decided only by PostgreSQL executing the query, so no finite test in this suite decides it whole. None carries a demonstrates.
- Node rules/knowledge-base/layer-weights. The node-layer 0.9 of the approximate score is applied in SQL and goes unproven for the reason above. The weights as constants are covered by the existing scoring.spec.ts, and the fragment and chunk weights are not reached by this task.
- Node rules/knowledge-base/search-layer-candidate-cap, proven here only for the node layer. The fragment-layer cap is not exercised by this task. The chunk-layer cap cannot be observed, because chunk hits never become items. The node is therefore not claimed whole.
- Node rules/knowledge-base/prose-matching. The tests guard its negative clause (no trigram route on fragments or chunks) only. Its positive clauses belong to the delivered fragment and chunk layers and to the lookup of supporting fragments, per the task's remainder entries.
- The four scenarios (misspelled-name-matches-approximately, misspelled-name-inside-longer-query, unmatched-term-leaves-approximate-match, short-alias-never-matches-approximately). Each turns on the database's similarity decision, and the first three also state a match field that belongs to a sibling task. They are partially echoed by the hop-0 test and not claimed.
- The chunk-layer criterion holds by construction today, because the service builds no item from a chunk hit. The chunk case of the lexical-layers test is a regression guard, not evidence that the absence of a chunk trigram route is what keeps the item away.
- '"The 0.6 threshold is one named constant." The task''s ADVISORY note says it constrains the form of the source and is checked by reading, not by behavior.'
- Implementation inferences about behavior that no node decides and no test pins. Exact hits fill the 200 slots before the approximate route takes the remainder. The reported total is the count of items kept after the provenance drop. Both bounds are inclusive. A test over "exact first" would make the suite the only home of a fact the specification does not hold. The word_similarity function form instead of the <% operator, the database norm() on the query, and the shape of the approximate SQL are arrangement inferences with no behavior to test.
- The REMAINDER entries on name-normalization (entity resolution, node listing and alias admission), on the fragment and chunk caps and weights, on search-ranking, and on the node item's match and similarity fields. They belong to other tasks, and the task's notes name no implementation to exclude.
divergences:
- cites: TST-04
  file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  departure: The file sits at src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts and does not mirror the unit's path (modules/query-retrieval/service/search.service.ts) under the unit subtree.
  why: The existing specs for this same unit (search-service.spec.ts, search-service-expansion.spec.ts) sit flat in the same directory. A mirrored subtree for one file would split the unit's tests across two layouts.
- cites: TYP-02
  file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  departure: The fake client is asserted into PoolClient with `as unknown as PoolClient` and no narrowing guard.
  why: A stand-in for the store cannot be narrowed to a driver type it does not implement. The existing specs for this unit make the same assertion, and a full PoolClient implementation would be far larger than the behavior it fakes.
---

## What it is

Unit tests over the search service, with a fake store standing in for PostgreSQL, prove that approximate hits become hop-0 node items, that a node matched both ways appears once with its exact score, that the node layer keeps at most 200 candidates across both routes, that the fragment and chunk layers gain no trigram route, and that links expand from an approximate match at 0.5 raised to the hop. The facts that only pg_trgm inside PostgreSQL decides (threshold, 5-character floor, normalization, strength) are listed as unproven, because the suite has no real database.

## Notes

The criteria decided by pg_trgm inside PostgreSQL (threshold, 5-character floor, normalization, strength) are unproven: the suite has no real-database harness, and a harness over an ephemeral Neon branch would close them.
