---
target: backend
task: sha256:dc594e7b0f98e0b05a6798d7bbdfaac50f14ed1ee65e53c42ea05cfa50c5aea9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/approximate-node-search-rank-approximate-reach-last-build
title: Rank approximate reach last
summary: The search service now sorts merged items by whether they were reached only through approximately matched nodes before it sorts by score, recording time and identifier.
files:
- path: src/modules/query-retrieval/service/search.service.ts
  effect: 'Every merged search item now carries an approximateOnly flag. An approximately matched node has it set. A link reached by expansion has it set exactly when no exactly matched node reached it. A fragment never has it set. A new compareItems comparator replaces the inline sort and puts the flagged items after all the others. Within each group it keeps the existing order: score descending, recording time descending, identifier ascending. Expansion now tracks whether each link was reached from an exactly matched start node. This survives best-path selection, which still keeps the highest-scoring path.'
criteria:
- criterion: An approximately matched knowledge node ranks after an exactly matched knowledge node whose score is lower.
  met: true
  how: searchKnowledgeService builds a node item with approximateOnly = (n.match === "approximate"). compareItems compares that flag before score, so the approximate node comes after the exact node whatever their scores.
- criterion: A knowledge link reached only through approximately matched knowledge nodes ranks after every item not reached only through them.
  met: true
  how: collectExpandedLinks passes each start node's exact flag into keepBestPath as reachedExactly. toExpandedLinkItem sets approximateOnly = !reachedExactly, so a link reached only from approximate starts lands in the trailing group, which compareItems places after the other group.
- criterion: A knowledge link reached from both an exactly matched and an approximately matched knowledge node ranks among the items not reached only through approximate matches.
  met: true
  how: keepBestPath combines the flag with `current.reachedExactly || candidate.reachedExactly` when it merges two paths to one link. The link keeps the better path's score and hop but is marked as reached exactly, so approximateOnly is false.
- criterion: Within each group, items order by score descending.
  met: true
  how: compareItems orders by `b.score - a.score` once both items have the same approximateOnly value.
- criterion: Within each group, items of equal score order by recording time descending, with a knowledge node counting as never recorded.
  met: true
  how: compareItems orders by `b.recordedAtTs - a.recordedAtTs` on equal score. Node items keep recordedAtTs 0, so in this descending order they come after links and fragments of equal score, as the rule's decision log states.
- criterion: Within each group, items of equal score and recording time order by identifier ascending.
  met: true
  how: The last key of compareItems is the unchanged identifier ascending comparison.
nodes:
- node: rules/knowledge-base/search-ranking
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: compareItems is the rule's ordering. Its first key is whether the item was reached only through approximately matched nodes. Then come score descending, recording time descending and identifier ascending. A node's recordedAtTs of 0 and a fragment's created_at follow the two decisions in search-ranking.log.md. I took the statement and the log, not the task's criteria alone, as the authority on the trailing group. So an approximately matched node also ranks after links and fragments that were not reached only through approximate matches, which the task's notes say the criteria do not force.
- node: domain/knowledge-base/search-item
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: The item's attributes and the wire shape are unchanged. approximateOnly exists only on the internal IntermediateItem and is never copied by toSearchItem, so the response has no new field. match and similarity pass through as they did.
- node: domain/knowledge-base/node-match
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: The enumeration was already encoded by the earlier approximate-node-match task as the NodeMatch type on each node hit. This task only reads it, using match === "approximate" as the sole trigger for the trailing group on node items and for the exact flag on expansion start nodes.
inferences:
- inferred: An information fragment item is never in the trailing group (approximateOnly is always false). Among fragments, equal scores order by created_at, then identifier.
  from: The fragment layer is a separate query, and nothing in the node layer, expansion or the fragment code reaches a fragment through a node match. The log decision on fragment recording time is encoded as the existing created_at behavior. This answers the task's advisory note.
- inferred: A link reached through both kinds of node keeps the score and hop of its best path across all start nodes, even when that best path starts at an approximate node. Only the group flag takes the exact route into account.
  from: The inventory convention that expansion keeps the best path per link, and criterion 3, which fixes the group of a mixed-reach link but says nothing about which score it carries.
preserved:
- Group-internal order is still score descending, then recordedAtTs descending, then identifier ascending, exactly as the old inline sort had it.
- A node is still given recordedAtTs 0, and a fragment still orders by f.created_at.
- Expansion still starts from every matched node with provenance, still scores a link as TRAVERSAL_DECAY^hop times the start score, and still keeps the best path per link.
- The REST and MCP search response shape is unchanged. toSearchItem and matchFields were not touched.
- Nodes with no provenance are still dropped, and uncertain items are still filtered the same way.
deferred:
- what: searchKnowledgeService is longer than the thirty lines MNT-01 allows. It was already over before this task and is five lines shorter now.
  why: Splitting the per-layer item building into helpers reaches beyond the ranking objective.
---

## What it is

The search service now sorts merged items by whether they were reached only through approximately matched nodes before it sorts by score, recording time and identifier.

## Notes

The trailing group follows the rule's statement and its decision log rather than the criteria alone, so an approximately matched node also ranks after links and fragments not reached only through approximate matches.
