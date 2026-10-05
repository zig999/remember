---
target: backend
implementation: sha256:b6b1ea6d52438b2fda8a838bd732d174a3639e07ca675532f43ecaeff616fe9a
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/prove-aliases-fuzzy-context-2
title: Proof for ranking approximate reach last
summary: Tests over the search service, with the store stood in for, prove that items reached only through approximately matched nodes rank last and that each group orders by score, recording time and identifier, with the order decided for the three underdetermined entries, and that inside the trailing group links of equal score order by recording time then identifier with an equal-score knowledge node last.
tests:
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: ranks an approximately matched knowledge node after an exactly matched one whose score is lower
  proves: An approximately matched knowledge node ranks after an exactly matched knowledge node whose score is lower.
  fails_when: the approximate node, scored 0.9, ranks ahead of the exact node, scored 0.3; for example when the first sort key is score only, or when the trailing group is not applied to node items
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: ranks an approximately matched knowledge node after an information fragment and a knowledge link that were not reached only through approximate matches
  proves: 'UNDERDETERMINED entry 1: an approximately matched knowledge node ranks after the knowledge links and information fragments not reached only through approximate matches, not only after exactly matched nodes.'
  fails_when: an ordering puts every exact node ahead of every approximate node but interleaves the approximate node, scored 0.8, by score ahead of the fragment, scored 0.5, or the exact-reached link, scored 0.2
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: ranks a knowledge link reached only through an approximately matched node after every item not reached only through approximate matches
  proves: A knowledge link reached only through approximately matched knowledge nodes ranks after every item not reached only through them.
  fails_when: the link reached only from the approximate node, at score 0.45, ranks ahead of the fragment, the exact node or the exact-reached link, because the links are not flagged as approximate-only or the flag is not compared before score
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: ranks a knowledge link reached from both an exactly and an approximately matched node among the items not reached only through approximate matches
  proves: A knowledge link reached from both an exactly matched and an approximately matched knowledge node ranks among the items not reached only through approximate matches.
  fails_when: a link reached from both kinds of node ranks after the approximate node it is also reached from, because the flag is taken from the best-scoring path (the approximate one) or from the last start node reached, instead of the link counting as reached exactly
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: orders by score descending (it.each over the group not reached only through approximate matches, and the group reached only through them)
  proves: Within each group, items order by score descending.
  fails_when: within either group the lower-scored item (identifier a-low) comes before the higher-scored one (identifier b-high), as in an order by identifier or by input order
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: orders items of equal score by recording time descending, a fragment counting as recorded at its creation time
  proves: 'Within each group, items of equal score order by recording time descending; and UNDERDETERMINED entry 3: an information fragment item counts as recorded at its creation time.'
  fails_when: equal-score items are ordered by recording time ascending or by identifier; or the fragment is treated as never recorded, so it falls after the older link instead of between the two links
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: orders a knowledge node, counting as never recorded, after a knowledge link and an information fragment of equal score
  proves: 'UNDERDETERMINED entry 2: with a knowledge node counting as never recorded, a node of equal score ranks after every knowledge link and information fragment.'
  fails_when: the ordering is by recording time descending with items that have no recording time placed first (a descending sort with nulls first), so the node with identifier a-node ranks ahead of the fragment and the link; or the node is ordered by identifier among them
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: orders items of equal score and equal recording time by identifier ascending
  proves: Within each group, items of equal score and recording time order by identifier ascending.
  fails_when: two links of equal score and recording time come out in input order or in identifier descending order
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
  proves: 'rules/knowledge-base/search-ranking: one result set of twelve items where every clause of the statement decides at least one adjacent pair of the expected order.'
  fails_when: any clause stops holding. That means the trailing group is not last, score is not descending, equal scores are not ordered by recording time descending, the fragment is not at its creation time, the node does not rank after links and fragments of equal score, equal time does not fall to identifier ascending, or a link reached from both kinds of node is moved into the trailing group
  demonstrates: rules/knowledge-base/search-ranking
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: answers a node reached by the lexical parse of the query with the match exact and a node reached by the trigram similarity of an alias with the match approximate
  proves: 'domain/knowledge-base/node-match: the two values of the enumeration, exact and approximate, are what the node layer answers for the two routes that reach a knowledge node.'
  fails_when: a node reached by the lexical route is not answered with the match exact, the node reached by the trigram route is not answered with approximate, or the item carries a value outside those two
  demonstrates: domain/knowledge-base/node-match
- file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  name: answers a node, a link and a fragment item with no attribute the search item does not declare
  proves: 'domain/knowledge-base/search-item: the ranking adds no attribute to the item. approximateOnly stays internal, and only the declared attributes plus the identifier and provenance reach the response.'
  fails_when: the group flag, or any other internal field, is copied onto the response item of a node, a link or a fragment
- file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
  name: orders links of equal score by recording time descending, then by identifier ascending, and a knowledge node of that score last as never recorded
  proves: 'rules/knowledge-base/search-ranking, the remainder the certification named: in one search whose items are all reached only through approximately matched nodes, two links of equal score with different recording times (January, March) and a third link sharing the March time, plus an approximately matched knowledge node of that same score, order as the later-recorded links first, the two links of equal recording time by identifier ascending (b-link-late, z-link-late), then the earlier link (k-link-old), and the knowledge node (a-node) last as never recorded. This closes within the trailing group what the twelve-item test decides for the group not reached only through approximate matches. It is claimed beside the whole-order test above, which decides the leading group and the remaining clauses.'
  fails_when: inside the trailing group equal-score links order by recording time ascending or by identifier alone (k-link-old would come before the March links, or z-link-late before b-link-late); links recorded at the same time are not ordered by identifier ascending; or the approximately matched knowledge node is placed ahead of the links of its score, as a descending sort with nulls first or an ordering of it by identifier (a-node sorts first) would do
  demonstrates: rules/knowledge-base/search-ranking
not_applicable:
- edge_case: ties inside the trailing group on recording time and identifier
  why: Now represented by the new approximate-group test, which orders an equal-time pair of links by identifier inside the trailing group.
- edge_case: a link reached at hop 2 or 3 only through approximate nodes
  why: The group depends on which kind of start node reached the link, not on its hop. Hop and decay are other tasks' obligations, already tested in search-service-expansion.spec.ts.
- edge_case: an empty result set, or no node matched
  why: The ordering requires nothing of a set with no items. The empty-set refusal and the empty tsquery belong to the search tasks.
- edge_case: limit, offset and the includeUncertain filter
  why: No criterion or node of this task states how paging or the uncertain filter interact with the group. Slicing happens after the sort, and no node decides the interaction.
- edge_case: concurrent searches, or a store that fails or answers slowly
  why: Ordering is a pure function of the merged items. No criterion or node states a behavior for concurrency or dependency failure in it.
- edge_case: absent or invalid query, and an unknown layer
  why: Refused before the ordering is reached. Other tasks own those refusals.
untested:
- 'The ADVISORY entry of the task''s Notes: whether an information fragment item can be reached through a node-layer match, and so belong in the trailing group. The entry names no implementation the criteria let through, so no test is owed. The implementation chose that a fragment is never in the trailing group, and that choice is a behavior no node decides. No test pins it, and the tests contain no fragment reached through a node match.'
- The implementation's inference that a link reached from both kinds of node keeps the score and hop of its best path, even when that path starts at an approximate node. Criterion 3 fixes only the link's group. No node says which score the link carries, so no test asserts it. The tests that involve a mixed link assert only its position relative to items whose position does not depend on that score.
- 'domain/knowledge-base/search-item as a whole: the types and requiredness of its attributes, the provenance cardinality 1..* across every kind and layer, and the item-kind, search-layer and assertion-flag enumerations it references. No single finite test decides that fact, so the node is not claimed in `demonstrates`. The test written covers only that no undeclared attribute leaks onto the item. The node lists no id attribute, yet every item carries an id, which the tests assume.'
- That a grouping decision is made on the first key of the comparator, as opposed to a stable multi-pass sort. This is the shape of the code, not behavior, and no test binds it.
- 'Which nodes the database decides to match approximately, and with what score: the admission SQL, norm(), the trigram similarity threshold and the minimum alias length are evaluated by Postgres. Every test here stands in for the store and hands the service the hit rows it would have returned, and a test reimplementing those rules would assert the stand-in. That decision belongs to the approximate-node-match task, not to this ordering. The new test builds the equal score of a link and a node from the same expression the service uses (TRAVERSAL_DECAY to the first power times the start score), so it depends on that decay only through the shared constant and not on its value.'
divergences:
- cites: TST-04
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  departure: The file sits under src/__tests__/unit/query-retrieval/ beside the other search-service specs, and does not mirror the unit's full path (modules/query-retrieval/service/search.service.ts).
  why: Every existing spec of this service sits in that directory, and moving one file would split the suite across two layouts.
- cites: TYP-04
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  departure: Scores inside the scenario fixtures (0.3, 0.9, 0.5 and so on) are written inline, not as named constants. Times, the shared 0.25 tie score, the depth, the limit and the similarity are named.
  why: Each score is read once by one scenario, so naming each would hide the arrangement the ordering expectation depends on, and a shared name would suggest a value the scenarios do not share.
- cites: TST-04
  file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
  departure: The file sits under src/__tests__/unit/query-retrieval/ beside the other search-service specs, and does not mirror the unit's full path (modules/query-retrieval/service/search.service.ts).
  why: Every existing spec of this service sits in that directory, and moving one file would split the suite across two layouts. It is a separate file because this re-delivery could not edit the existing spec.
- cites: TYP-04
  file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
  departure: Row-shaped fixture values the ordering never reads (confidence 0.9, chunk offsets, the stand-in's literal ids and names) are written inline in the stand-in rows. The scores, the times, the depth, the limit and the similarity are named.
  why: The values are inert fixture content of the store's rows, and naming each would add constants no scenario varies. The same stand-in rows sit inline in the sibling spec.
- cites: MNT-03
  file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
  departure: The store stand-in (row builders and the SQL responder) is copied from search-service-ranking.spec.ts in reduced form instead of being imported.
  why: The helpers in the sibling spec are not exported, and this re-delivery could not edit that file or add a shared fixture. Importing the spec would run its tests a second time.
---

## What it is

Tests over the search service, with the store stood in for, prove that items reached only through approximately matched nodes rank last and that each group orders by score, recording time and identifier, with the order decided for the three underdetermined entries, and that inside the trailing group links of equal score order by recording time then identifier with an equal-score knowledge node last.

## Notes

Proof-only re-delivery for the testable remainders the review aliases-fuzzy-context left; green on run/prove-aliases-fuzzy-context-2.
