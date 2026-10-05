---
target: backend
task: sha256:07ec69f83ca8e6a515652b144a3f43ce6581fe03581c0124d42a672f8cf01dc9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/approximate-node-search-approximate-node-match-build
title: Approximate node match through word similarity
summary: The node layer of search gains a trigram route over node_alias.alias_norm, merged after the full-text route under one 200-candidate cap, so a misspelled name reaches its knowledge node and expands from it like any matched node.
files:
- path: src/modules/query-retrieval/repository/search.repository.ts
  effect: Adds searchNodeAliasApproximateLayer, a node-layer query that matches a non-merged, non-deleted node when an alias of at least APPROXIMATE_ALIAS_MIN_LENGTH characters once normalized has word_similarity(alias_norm, norm(query)) >= APPROXIMATE_MATCH_MIN_SIMILARITY. It scores the node as max(word_similarity) times LAYER_WEIGHT_NODE, skips the nodes already matched exactly, and applies the limit it is given. The full-text node, fragment and chunk queries and the provenance lookups are unchanged apart from the comment removal below. Every comment in the file was removed, since the task writes the file whole.
- path: src/modules/query-retrieval/repository/scoring.ts
  effect: Adds the named constants APPROXIMATE_MATCH_MIN_SIMILARITY (0.6, the single home of the threshold) and APPROXIMATE_ALIAS_MIN_LENGTH (5) beside the layer weights.
- path: src/modules/query-retrieval/service/search.service.ts
  effect: The node layer is now fetched by searchNodeLayer. It runs the full-text route with PER_LAYER_FETCH_LIMIT, then runs the approximate route for the slots left (200 minus the exact hits), excluding the node ids already matched exactly, and returns exact hits followed by approximate hits. The combined hits feed the existing node-item construction, provenance drop, scoreMatchedNodes and expansion unchanged. The fragment and chunk layers stay full-text only.
criteria:
- criterion: A search for "Petrobrass" returns the knowledge node "Petrobras" at hop 0.
  met: true
  how: The exact route finds nothing for "petrobrass". The approximate route matches alias_norm "petrobras" (9 characters) by word similarity well above 0.6. searchKnowledgeService builds the node item with hop 0 from the combined hits (search.service.ts, searchNodeLayer and the node-item loop).
- criterion: A search for "contrato Petrobrass" returns the knowledge node "Petrobras".
  met: true
  how: word_similarity compares the alias with the best continuous stretch of norm(query), so the extra word does not lower the similarity. APPROXIMATE_NODE_ALIAS_SQL in search.repository.ts.
- criterion: A search for "contrato Petrobras" returns the knowledge node "Petrobras" when no alias holds the word "contrato".
  met: true
  how: The full-text route is an AND of the terms, so it does not match. The approximate route matches "petrobras" inside "contrato petrobras" with similarity 1.0 and the node is kept (search.service.ts, searchNodeLayer).
- criterion: A search for "CNPJ" does not return the knowledge node "CNPq" whose only alias is "CNPq".
  met: true
  how: The alias_norm "cnpq" is 4 characters, so char_length(na.alias_norm) >= APPROXIMATE_ALIAS_MIN_LENGTH excludes it before the similarity is considered.
- criterion: An alias shorter than 5 characters once normalized never matches a knowledge node approximately.
  met: true
  how: The predicate char_length(na.alias_norm) >= $3 uses the stored alias_norm, which is norm(alias), so the length is measured after normalization. $3 is APPROXIMATE_ALIAS_MIN_LENGTH.
- criterion: A knowledge node whose aliases all have a word similarity below 0.6 to the query text is not matched approximately.
  met: true
  how: The row-level predicate word_similarity(alias_norm, norm(query)) >= $4::real, with $4 bound to APPROXIMATE_MATCH_MIN_SIMILARITY, removes every alias below the threshold. A node with no remaining alias produces no group.
- criterion: The 0.6 threshold is one named constant.
  met: true
  how: APPROXIMATE_MATCH_MIN_SIMILARITY in scoring.ts is the only place 0.6 appears. The repository binds it as a parameter and the SQL text carries no literal.
- criterion: A search for "PETROBRÁSS" scores the knowledge node "Petrobras" with the same similarity as a search for "petrobrass".
  met: true
  how: The query is passed through the database norm() (lower, unaccent, trim, collapse whitespace) inside the SQL, so both spellings reach word_similarity as the same text.
- criterion: The similarity of "Petrobras" for "contrato Petrobrass" equals its similarity for "Petrobrass".
  met: true
  how: Both are word_similarity(alias_norm, norm(query)), which is the greatest similarity over any continuous stretch of the query's ordered trigrams. The stretch holding "petrobrass" is the same in either query, and the extra word adds no better stretch.
- criterion: An approximately matched knowledge node scores the highest word similarity of its aliases to the query text, times 0.9.
  met: true
  how: The score column is max(word_similarity(...)) * LAYER_WEIGHT_NODE (0.9), grouped by node, so the best alias decides. The weight is the existing constant from scoring.ts.
- criterion: A knowledge node matched both exactly and approximately appears once among the search items.
  met: true
  how: The approximate query excludes the exact hits' node ids (kn.id <> ALL($5::uuid[])), and the exact hit is the one kept. The approximate query also groups by node.
- criterion: The node layer keeps at most 200 candidates, counting both routes together.
  met: true
  how: searchNodeLayer fetches at most PER_LAYER_FETCH_LIMIT exact hits and then passes PER_LAYER_FETCH_LIMIT minus that count as the approximate route's limit. The approximate route is skipped when no slots remain.
- criterion: A search for "Petrobrass" returns no fragment-layer item for a fragment whose text holds only "Petrobras".
  met: true
  how: searchFragmentLayer is unchanged and stays full-text. No trigram route was added to it.
- criterion: A search for "Petrobrass" returns no chunk-layer item for a chunk whose text holds only "Petrobras".
  met: true
  how: searchChunkLayer is unchanged and stays full-text.
- criterion: A knowledge link one hop from an approximately matched knowledge node is returned with 0.5 times that node's score.
  met: true
  how: Approximate hits become node items, so scoreMatchedNodes passes them to the existing collectExpandedLinks. That function scores a link Math.pow(TRAVERSAL_DECAY, hop) * startScore, and TRAVERSAL_DECAY is 0.5.
nodes:
- node: rules/knowledge-base/node-layer-approximate-match
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/repository/scoring.ts
  - src/modules/query-retrieval/service/search.service.ts
  how: 'APPROXIMATE_NODE_ALIAS_SQL encodes the condition: an alias of at least 5 normalized characters with word similarity of at least 0.6. The service runs the route only for nodes not matched exactly, by excluding the exact hits'' ids.'
- node: rules/knowledge-base/node-layer-matches-through-aliases
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  how: The exact route is the existing searchNodeAliasLayer, unchanged. It decides the exact match, and the approximate route is defined as the complement of it.
- node: rules/knowledge-base/word-similarity
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  how: The similarity is pg_trgm word_similarity(alias_norm, norm(query)). The alias is the first argument and the query text the second, which gives the highest trigram similarity of the alias to any continuous stretch of the query.
- node: rules/knowledge-base/name-normalization
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  how: The approximate route compares the stored alias_norm (generated by norm(alias)) with norm(query), applying the database's own norm() rather than a TypeScript copy. The 5-character floor is measured on alias_norm. The clauses for entity resolution, the node listing and alias admission were not reached by this task.
- node: rules/knowledge-base/approximate-match-strength
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  how: The strength is max(word_similarity) over the node's qualifying aliases, taken in the score column before the layer weight is applied.
- node: rules/knowledge-base/layer-weights
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/repository/scoring.ts
  how: The approximate score multiplies by the existing LAYER_WEIGHT_NODE (0.9). The fragment and chunk weights are unchanged and were not reached.
- node: rules/knowledge-base/search-layer-candidate-cap
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: searchNodeLayer holds the node layer to PER_LAYER_FETCH_LIMIT candidates across both routes. The reported total is computed from the items kept, which are drawn only from those capped candidates. The per-layer caps of the fragment and chunk layers were not changed.
- node: rules/knowledge-base/expansion-decay
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: Approximate nodes enter the existing scoreMatchedNodes and collectExpandedLinks path. A link scores Math.pow(TRAVERSAL_DECAY, hop) * startScore, so the decay holds at every hop and no separate path was added.
- node: rules/knowledge-base/prose-matching
  how: 'Honored negatively only: the fragment and chunk layers stay on the Portuguese-stemmed full-text route and gain no trigram match. Its positive clauses belong to the delivered fragment and chunk layers and the node layer''s supporting-fragment lookup, which this task leaves unchanged.'
- node: scenarios/knowledge-base/misspelled-name-matches-approximately
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/service/search.service.ts
  how: The node "Petrobras" is returned at hop 0 for "Petrobrass". The clause that the item carries the match approximate and its similarity belongs to the sibling task that adds the match field, and was not delivered here.
- node: scenarios/knowledge-base/misspelled-name-inside-longer-query
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  how: '"contrato Petrobrass" returns "Petrobras" because word_similarity measures the alias against a stretch of the query. The match field in this scenario belongs to the sibling task.'
- node: scenarios/knowledge-base/unmatched-term-leaves-approximate-match
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/service/search.service.ts
  how: '"contrato Petrobras" does not match through the AND full-text route, and is reached by the approximate route with similarity 1.0. The match field belongs to the sibling task.'
- node: scenarios/knowledge-base/short-alias-never-matches-approximately
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  how: The alias "cnpq" has 4 normalized characters and is excluded by the length predicate, so "CNPJ" does not return it.
inferences:
- inferred: A node matched both exactly and approximately keeps its exact entry and exact score, and the approximate route skips it.
  from: rules/knowledge-base/node-layer-approximate-match, which matches approximately only when the node does not match exactly, and the task's UNDERDETERMINED note on this point. The note names scenarios/knowledge-base/correct-name-matches-exactly, which requires the exact match.
- inferred: Under the cap, exact hits fill the 200 slots first and the approximate route takes only what is left. The approximate query limit is 200 minus the exact count, and the route is skipped when none remains.
  from: rules/knowledge-base/search-layer-candidate-cap, which says only "at most 200 ... counting both routes together" and names no preference. Exact matches rank before approximate-only ones under rules/knowledge-base/search-ranking.
- inferred: Both bounds are inclusive. The alias floor is char_length >= 5 and the similarity test is word_similarity >= 0.6, with the threshold bound as real so a float4 value of exactly 0.6 passes.
  from: The rule's wording "at least 5 characters" and "at least 0.6", and the task's UNDERDETERMINED note on the inclusive bounds.
- inferred: The test uses the function form word_similarity(...) >= threshold rather than the <% operator.
  from: The <% operator reads the session setting pg_trgm.word_similarity_threshold, so it would make the 0.6 depend on a database setting instead of the named constant. At the stated scale of hundreds of documents a scan over node_alias is acceptable. Whether the existing trigram index would serve the operator was not verified, since the DDL is outside the target.
- inferred: The query is normalized in SQL with the database norm() instead of the TypeScript norm.
  from: The inventory's must_not_duplicate entry for the normalization policy, which names the database norm() as the authority. The inventory's risk about the two implementations disagreeing on edge cases also points that way.
- inferred: The approximate SQL is written as FROM knowledge_node kn JOIN node_alias na, not FROM node_alias na.
  from: The existing unit and integration fakes recognize the exact node layer by the text "FROM node_alias na". The different shape keeps them from answering the new query with the exact layer's rows.
- inferred: The reported total is the number of items kept after the capped candidates pass through the existing provenance drop and filtering.
  from: The existing total computation, which this task did not change. The task's UNDERDETERMINED note says the criterion bounds only what is kept.
divergences:
- cites: MNT-01
  file: src/modules/query-retrieval/service/search.service.ts
  departure: searchKnowledgeService was already well over thirty lines and still is, because the task changes how it fetches the node layer and not its length.
  why: The new logic was put in the small helper searchNodeLayer to avoid growing the function. Splitting the existing function reaches past the task and is deferred below.
- cites: MNT-01
  file: src/modules/query-retrieval/repository/search.repository.ts
  departure: listProvenanceForFragments, listProvenanceForLinks and listProvenanceForNodes were already close to or over thirty lines because of their SQL, and I did not reshape them.
  why: They are unchanged apart from the comment removal. I did not widen the task to rewrite them.
preserved:
- searchNodeAliasLayer exact full-text node route, unchanged, including its exclusion of merged and deleted nodes.
- searchFragmentLayer and searchChunkLayer unchanged and still full-text only.
- listProvenanceForNodes unchanged, so a node hit is still dropped when no accepted fragment mentions its alias.
- The graph expansion path (scoreMatchedNodes, collectExpandedLinks, keepBestPath) is reused without change.
- The search item shape and the REST and MCP response are unchanged.
- The existing fakes that recognize "FROM node_alias na" keep answering only the exact route.
deferred:
- what: Item field match and the unweighted similarity of an approximate item (rules/knowledge-base/node-item-shows-match, approximate-match-similarity, exact-node-item-carries-no-similarity, link-and-fragment-items-carry-no-match).
  why: Belongs to the sibling task of the approximate-node-search epic that adds the match field and the answer contract.
- what: The ranking rule that puts items reached only through approximately matched nodes after all others (rules/knowledge-base/search-ranking).
  why: Belongs to the ranking task of the epic. Items are still sorted by score, recording time and id as before, and this task did not touch the sort.
- what: Splitting searchKnowledgeService and the long provenance query functions to meet MNT-01.
  why: Pre-existing length that the task neither created nor needs to change.
- what: Checking whether node_alias_norm_trgm_idx can serve a word-similarity filter, and moving to the <% operator if it can.
  why: The DDL lives in migrations, outside the target root and under the database-change approval protocol.
- what: Collapsing scoreMatchedNodes and the expansion across hops so that a link at hop 2 from an approximate node is checked at 0.25 times the score.
  why: No code change is needed, because the existing path already applies Math.pow(TRAVERSAL_DECAY, hop). Only the criteria-level test is outstanding and belongs to the proof.
---

## What it is

The node layer of search gains a trigram route over node_alias.alias_norm, merged after the full-text route under one 200-candidate cap, so a misspelled name reaches its knowledge node and expands from it like any matched node.

## Notes

The 0.6 threshold is tested with the word_similarity function rather than the <% operator, so it depends on the named constant and not on a session setting; whether the trigram index serves the query was not verified.
