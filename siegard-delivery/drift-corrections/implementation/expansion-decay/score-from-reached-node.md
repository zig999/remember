---
target: backend
title: Expanded links score from the matched node they were reached from
summary: Search expansion now traverses from each matched node separately, so every expanded link scores 0.5 raised to its hop times the score of the matched node it was reached from, and a link reached from several matched nodes is listed once.
task: sha256:6d04b46f37b55237fdbe5097d1a865a0da55e291e3daf85363f6817bf394622e
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/expansion-decay-score-from-reached-node-build
files:
- path: src/modules/query-retrieval/service/search.service.ts
  effect: 'Expanded links no longer take their score from whichever link endpoint happens to be a matched node, which gave 0 beyond hop 1. The service now calls traverseNodes once per matched node that surfaced as a node item, with that node as the only starting id. Each link of that traversal scores TRAVERSAL_DECAY raised to the link''s hop times that matched node''s score, and the item carries that hop. The best path across starts is kept for each link id: highest decayed score, lowest hop on a tie. Each link is then listed once. Provenance and metadata for the surviving links are still read in one batched lookup each. The expansion block was moved out of searchKnowledgeService into helper functions (scoreMatchedNodes, collectExpandedLinks, keepBestPath, isBetterPath, buildExpandedLinkItems, toExpandedLinkItem). The file was delivered whole under the comment rule, so every comment and JSDoc block it held is gone.'
criteria:
- criterion: A link reached at hop 1 from a matched node of score s has the decayed score 0.5 times s.
  met: true
  how: collectExpandedLinks in src/modules/query-retrieval/service/search.service.ts runs traverseNodes with the matched node as the sole starting id. A link touching that node comes back at hop 1, and the score is Math.pow(TRAVERSAL_DECAY, link.hop) * startScore. TRAVERSAL_DECAY is 0.5, so the score is 0.5 times s.
- criterion: A link reached at hop 2 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.25 times s.
  met: true
  how: The score no longer depends on the link's endpoints being matched nodes. It comes from the start node of the traversal that reached the link. A hop-2 link scores Math.pow(0.5, 2) * startScore, which is 0.25 times s.
- criterion: A link reached at hop 3 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.125 times s.
  met: true
  how: The same computation in collectExpandedLinks at hop 3 gives Math.pow(0.5, 3) * startScore, which is 0.125 times s. Depth 3 is within the traversal bound.
nodes:
- node: rules/knowledge-base/expansion-decay
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: The decayed score is TRAVERSAL_DECAY to the power hop times the score of the matched node that was the traversal's start. The start is known exactly because each matched node is traversed on its own.
- node: rules/knowledge-base/expansion-hop
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: The item's hop is the hop traverseNodes numbers for the link in a traversal started at one matched node. That is the count of links on the path up to and including the link, so a link touching the matched node is hop 1. The service copies it onto the item (hop in ExpandedLink and toExpandedLinkItem) and does not renumber it.
- node: domain/knowledge-base/search-item
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
  how: A link item carries its score and its hop. Score is the decayed score above and hop is the path hop. toSearchItem maps both onto the response unchanged. The src/modules/query-retrieval/dto/response.dto.ts shape did not change.
inferences:
- inferred: Per-start traversal is the way to know which matched node a link was reached from. The batched traverseNodes call did not carry that, so I called it once per matched node. The knowledge-graph module and its public contract stay untouched.
  from: The traverseNodes result carries only hop and a hop-only score per link and no origin. The comment in src/modules/knowledge-graph/index.ts marks the signature as a stable cross-domain contract.
- inferred: Where one matched node reaches a link by several paths, the traversal's first sight is the lowest hop, which gives the highest decayed score from that node. The cross-start comparison in keepBestPath therefore uses the hop and score that traverseNodes returns.
  from: Breadth-first order in src/modules/knowledge-graph/service/traversal.service.ts, which records a link at the hop where it is first seen and skips it afterwards.
- inferred: expansion_hop_count in the search log line is now the number of distinct expanded links across all starts, which is the size of the deduplicated map.
  from: The previous value was the length of the traversal's link list. With one batched traversal that list was already distinct, so the meaning is unchanged.
divergences:
- cites: MNT-01
  file: src/modules/query-retrieval/service/search.service.ts
  departure: searchKnowledgeService is still far above thirty lines. The expansion block I rewrote was extracted into helpers, each within thirty lines and three parameters. The rest of the function (layer fan-out, dedup, fragment and node item building, ranking, logging) is left as it was.
  why: Splitting the remainder reaches past the task's objective, which is the expanded link's score. The rule is decided by a reading and by the lint rule max-lines-per-function, which is at warn level in eslint.config.js.
preserved:
- expand=false issues no traversal SQL and no expansion work.
- The expansion runs only when nodeHits is non-empty. Starts are the node items that surfaced with provenance, and node hits dropped for lacking provenance are not expanded from.
- A link whose metadata row is missing is dropped. A link with empty provenance is dropped and logs query_retrieval_search_empty_link_provenance.
- Uncertain links are excluded unless includeUncertain is set. Flags are computed as before.
- The final sort stays score descending, then recordedAtTs descending, then id ascending. Pagination keeps total as the pre-pagination length. The query_retrieval_search_ok log line carries the same fields.
- Layer validation, link-type resolution, empty-parse refusal, chunk and fragment dedup counting and fragment and node item construction are unchanged.
- The exported searchKnowledgeService and SearchServiceInput signatures are unchanged, and no knowledge-graph file was edited.
deferred:
- what: searchKnowledgeService in src/modules/query-retrieval/service/search.service.ts exceeds the thirty-line function limit (MNT-01) in the part this task did not rewrite.
  why: Splitting layer fan-out, item building and ranking is a refactor outside the expanded-link scoring objective.
- what: The traversal contract could return the originating matched node per link, which would let search expand in one call instead of one per matched node.
  why: It changes the knowledge-graph traverseNodes contract, which the task does not reach and the module marks as a coordinated cross-domain change. The cost is one traversal per matched node, up to PER_LAYER_FETCH_LIMIT of them, each run sequentially on the one connection.
---

## What it is

Search expansion now traverses from each matched node separately, so every expanded link scores 0.5 raised to its hop times the score of the matched node it was reached from, and a link reached from several matched nodes is listed once.

## Notes

None.
