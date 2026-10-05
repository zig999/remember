---
target: backend
task: sha256:262dfc73d3a0f1087f3f43f88e09b8f8df955ad88550839138da932e7033822a
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/approximate-node-search-search-item-shows-match-build
title: Search item shows how a node matched
summary: Each hop-0 knowledge node search item now carries match (exact or approximate), and an approximate one also carries the node's highest unweighted word similarity; link and fragment items carry neither, and computeFlags is unchanged.
files:
- path: src/modules/query-retrieval/repository/search.repository.ts
  effect: 'The approximate node-alias query now also returns `similarity`, the highest word_similarity of the node''s aliases to norm(query), with no layer weight. A new row type ApproximateNodeAliasHitRow (NodeAliasHitRow plus similarity: number) is what searchNodeAliasApproximateLayer returns. The exact node-alias query and its row type are unchanged.'
- path: src/modules/query-retrieval/dto/response.dto.ts
  effect: Adds the NodeMatch type ("exact" | "approximate") and optional `match` and `similarity` fields on SearchItem. AssertionFlag is unchanged. Every comment in the file was removed (the comment rule applied to a file this task writes); exports and behavior are otherwise identical.
- path: src/modules/query-retrieval/service/search.service.ts
  effect: searchNodeLayer now returns NodeLayerHit rows tagged "exact" (exact route) or "approximate" (trigram route, with its similarity). The hop-0 node IntermediateItem carries match and similarity from the hit. toSearchItem spreads matchFields(item), which emits match and similarity only when the item has them. Link items (including expanded ones) and fragment items never set them, so their wire objects have neither key. computeFlags, scoring, ranking and expansion are untouched.
criteria:
- criterion: An exactly matched hop-0 knowledge node item carries the match exact.
  met: true
  how: searchNodeLayer maps every row from searchNodeAliasLayer through toExactHit (match "exact"). The node item copies it in the hop-0 loop and toSearchItem emits it through matchFields.
- criterion: An approximately matched hop-0 knowledge node item carries the match approximate.
  met: true
  how: Rows from searchNodeAliasApproximateLayer go through toApproximateHit (match "approximate"). The node item copies it and toSearchItem emits it.
- criterion: An approximately matched hop-0 knowledge node item carries its similarity.
  met: true
  how: APPROXIMATE_NODE_ALIAS_SQL selects max(word_similarity(na.alias_norm, norm($1))) AS similarity. toApproximateHit keeps it by spreading the row, and matchFields emits it. Its value is the unweighted maximum, not the 0.9-weighted score, as approximate-match-similarity requires.
- criterion: An exactly matched knowledge node item carries no similarity.
  met: true
  how: Exact rows have no similarity column and toExactHit adds none. matchFields returns only { match } when similarity is undefined, so the key is absent from the item.
- criterion: A search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", each with an accepted information fragment mentioning it, returns both knowledge nodes.
  met: true
  how: Both nodes are returned by the exact full-text route (simple_unaccent_v1 over aliases), unchanged by this task. The provenance filter (listProvenanceForNodes) is untouched, so each node with an accepted mentioning fragment stays in the result. Behavior depends on the stored aliases and the DB, which nothing here could run.
- criterion: In a search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", both returned knowledge node items carry the match exact.
  met: true
  how: Both nodes are found by the exact route, which tags exact. The approximate route excludes them through excludedNodeIds, so neither can be re-tagged approximate.
- criterion: A knowledge node matched both exactly and approximately carries the match exact.
  met: true
  how: searchNodeLayer passes the exact hits' node ids as excludedNodeIds to the approximate query (kn.id <> ALL($5)), so a node found both ways appears once, from the exact route, tagged exact and with no similarity.
- criterion: The flags of an approximately matched knowledge node item hold no value describing its match.
  met: true
  how: computeFlags is unchanged and takes only status and confidence. AssertionFlag is still uncertain, disputed, low_confidence. Match mode lives in its own field.
- criterion: A knowledge link item reached by expansion carries no match.
  met: true
  how: toExpandedLinkItem builds the link IntermediateItem without match or similarity, so matchFields returns {} and the link's wire object has neither key, even when the link was reached from an approximately matched node.
nodes:
- node: domain/knowledge-base/search-item
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/service/search.service.ts
  how: SearchItem gains the optional `match` (node-match) and `similarity` (decimal) attributes the node declares. toSearchItem builds them onto the wire object.
- node: domain/knowledge-base/node-match
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  how: NodeMatch is the enumeration "exact" | "approximate", the two values the node defines.
- node: domain/knowledge-base/assertion-flag
  how: Honored, not changed. AssertionFlag keeps its three values and computeFlags produces only those, so no match value enters flags.
- node: rules/knowledge-base/node-item-shows-match
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  - src/modules/query-retrieval/repository/search.repository.ts
  how: Every hop-0 node item gets match from the route that found it, and an approximate one also gets the similarity selected by the approximate SQL.
- node: rules/knowledge-base/exact-node-item-carries-no-similarity
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: Exact hits never carry a similarity, and the similarity is never computed for them, so exact items omit the key even when an alias would have a high word similarity.
- node: rules/knowledge-base/approximate-match-similarity
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  how: '`similarity` is max(word_similarity(alias_norm, norm(query))) over the node''s aliases, selected beside, and independent of, the weighted score (that value times LAYER_WEIGHT_NODE).'
- node: rules/knowledge-base/link-and-fragment-items-carry-no-match
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: Only the hop-0 node push sets match and similarity. Fragment items and expanded link items are built without them and matchFields yields {} for them, so no key appears on their wire objects.
- node: rules/knowledge-base/node-layer-approximate-match
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: 'Only the clause "when it does not match it exactly" is answered here: the approximate route excludes node ids already found exactly, so a node meeting both ways is exact. The length floor (5) and the 0.6 threshold were implemented by the earlier approximate-node-match task and are not changed.'
- node: rules/knowledge-base/node-layer-matches-through-aliases
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: The exact route (full text over aliases) is the existing one. This task only tags its hits "exact", so a lexical match of any alias reads as exact.
- node: scenarios/knowledge-base/correct-name-matches-exactly
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: '"petrobras" matches both aliases lexically (accent folded by simple_unaccent_v1), so both nodes are returned by the exact route and tagged exact. The approximate route excludes them.'
- node: contracts/knowledge-base/retrieval
  how: The search answer shows match and similarity for hop-0 node items because the REST route and the MCP search tool return the service's SearchResponse unchanged. Neither a Fastify response schema nor an MCP output schema strips the fields, so no transport file was edited.
inferences:
- inferred: The selected column is named `similarity`, kept as the real value word_similarity returns (not cast to float, to avoid float4-to-float8 digit noise on the wire), and the wire key is the same name.
  from: The search-item node's attribute name `similarity` (decimal) and the existing snake_case column and wire naming in NodeAliasHitRow and SearchItem.
- inferred: Items that do not carry a match or similarity omit the key rather than sending null.
  from: domain/knowledge-base/search-item declares both as optional rather than required, and the earlier response DTO carries no null-valued optional fields.
- inferred: The match is tagged in the service, not in the repository.
  from: The inventory's convention that the service builds the wire object, and that node-match is a concern of the node layer's route choice, which searchNodeLayer already owns.
divergences:
- cites: DTO-02
  file: src/modules/query-retrieval/dto/response.dto.ts
  departure: NodeMatch and the two new SearchItem fields are plain TypeScript types and interface members, not a Zod object with an inferred type.
  why: The whole file is plain interfaces by the inventory's convention (response DTOs have no runtime parse). Converting the file to Zod would reach past this task. Disclosed so the review's finding is not news.
- cites: MNT-01
  file: src/modules/query-retrieval/service/search.service.ts
  departure: searchKnowledgeService, already longer than thirty lines before this task, grew by two lines (match and similarity on the node item).
  why: Splitting the function is a refactor of existing code outside this task. The helpers this task added (toExactHit, toApproximateHit, matchFields, searchNodeLayer) are each well under thirty lines.
preserved:
- computeFlags stays unchanged and produces only uncertain, disputed and low_confidence.
- Approximate-route scoring is unchanged (score = max word similarity times LAYER_WEIGHT_NODE), so it still ranks below the exact route's scores.
- The 200-row node-layer cap still applies to both routes combined.
- Node hits without accepted-fragment provenance are still dropped.
- Graph expansion (scoreMatchedNodes, collectExpandedLinks, keepBestPath) is untouched; link items keep their existing shape.
- Fragment and chunk layers, the search item order (score, recorded_at, id) and the REST and MCP routes are unchanged.
- The search item's existing fields kind, layer, id, score, hop, summary, flags and provenance keep their values and positions in the wire object.
deferred:
- what: The unit fixtures in src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts and search-service-expansion.spec.ts stub approximate-route rows with no `similarity` column.
  why: Tests are the proof author's, not this task's. With those fixtures approximate items carry match "approximate" and no similarity, so a test asserting the similarity needs the column in its stubbed rows.
- what: The scenario scenarios/knowledge-base/misspelled-name-matches-approximately ("Petrobrass" over "Petrobras", match approximate and its similarity) is not in this task's implements. The code here makes its then-clause for match and similarity hold.
  why: The caller decides which task carries it, per the task's ADVISORY note.
- what: The spec's alias length floor and 0.6 word-similarity threshold clauses of node-layer-approximate-match were not changed here.
  why: They belong to the approximate-node-match task, per the task's REMAINDER note.
---

## What it is

Each hop-0 knowledge node search item now carries match (exact or approximate), and an approximate one also carries the node's highest unweighted word similarity; link and fragment items carry neither, and computeFlags is unchanged.

## Notes

Items without a match or similarity omit the keys rather than sending null; the match is tagged in the service from the route that found the node.
