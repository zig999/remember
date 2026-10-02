---
target: backend
title: Proof for expanded links scoring from the matched node they were reached from
summary: Tests that a search expanded to depth 3 scores each expanded link 0.5 raised to its hop times the score of the matched node it was reached from, numbers its hop by path length, and answers every item with the search-item attributes.
implementation: sha256:e59a17634a6d2e76210d4b1b65d7863b4a2e14e4f9ae126e9a44f75ac3fc62bb
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/expansion-decay-score-from-reached-node-suite
tests:
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: decayed score of an expanded link > scores a link reached at hop 1 from a matched node at 0.5 times the matched node''s score'
  proves: A link reached at hop 1 from a matched node of score s has the decayed score 0.5 times s.
  fails_when: a link touching the matched node (matched node 0.8, link at hop 1) is given any score other than 0.4, for example the hop-only score 0.5 of traverseNodes, the matched node's own score, or 0
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: decayed score of an expanded link > scores a link reached at hop 2 from a matched node, neither endpoint being matched, at 0.25 times the matched node''s score'
  proves: A link reached at hop 2 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.25 times s.
  fails_when: a hop-2 link whose endpoints are both unmatched is given any score other than 0.2 (matched node 0.8), for example 0 because the score is read from a link endpoint that happens to be a matched node, or 0.5 from the hop-only decay
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: decayed score of an expanded link > scores a link reached at hop 3 from a matched node, neither endpoint being matched, at 0.125 times the matched node''s score'
  proves: A link reached at hop 3 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.125 times s.
  fails_when: a hop-3 link whose endpoints are both unmatched is given any score other than 0.1 (matched node 0.8), for example 0 or the hop-only 0.125
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: decayed score of an expanded link > scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is'
  proves: 'rules/knowledge-base/expansion-decay: with two matched nodes of different scores (0.8 and 0.4), each with its own chain of three links reached by exactly one path, every link scores 0.5^hop times the score of the matched node that chain starts from.'
  fails_when: any expanded link at hop 1, 2 or 3 scores other than 0.5^hop times the score of the matched node it was reached from, for example a score taken from the highest or the first matched node for every link, a link endpoint's score, or a hop-only score
  demonstrates: rules/knowledge-base/expansion-decay
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: the item''s hop > numbers an expanded link by the links on its path from the matched node, so a link touching the matched node is hop 1 in either direction'
  proves: 'UNDERDETERMINED entry: the search item carries the hop, and a link touching the matched node is hop 1 (not 0), and deeper links number 2 and 3; rules/knowledge-base/expansion-hop.'
  fails_when: an expanded link item numbers a link touching the matched node as hop 0, leaves the hop off the item, or numbers any link on the path other than by the count of links from the matched node up to and including it
  demonstrates: rules/knowledge-base/expansion-hop
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: the search item''s shape > answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment'
  proves: 'domain/knowledge-base/search-item: an answer of a search is a node, a link or a fragment, carrying kind (one of node, link, fragment), layer (one of fragment, node, chunk), a numeric score, a numeric hop, a summary, flags, and provenance with at least one supporting fragment.'
  fails_when: any of the three kinds of item lacks one of kind, layer, score, hop, summary, flags or provenance, carries a kind or layer outside its enumeration, or has an empty provenance; or a kind of item (node, link, fragment) stops being returned
  demonstrates: domain/knowledge-base/search-item
not_applicable:
- edge_case: no matched node, or expansion over a matched node with no links (empty collection)
  why: no criterion or node of this task states what an empty expansion returns; the existing search-service tests already cover zero results and expand=false, and a second test would add the same evidence twice
- edge_case: depth below 1 or above 3 (boundary of the depth range)
  why: rules/knowledge-base/expansion-depth-bounds is not claimed by this task (Notes, Decision beyond the covers); hop 3 is the deepest hop the criteria state and is tested
- edge_case: absent or empty query input
  why: refused at the validation boundary and by the existing BR-05 test; no criterion of this task reaches it
- edge_case: a duplicate, one link reached by several expansion paths
  why: rules/knowledge-base/expansion-link-once is not claimed; the Notes state the criteria are per-path scores and fixtures use a single path
- edge_case: a dependency (the store) failing or answering slowly during expansion
  why: no criterion or node of this task states a behavior for a failing store
- edge_case: two searches at once
  why: the expansion holds no state across calls, and no obligation of this task states concurrent behavior
untested:
- 'the choice of which path to keep and list once when a link is reached from several matched nodes (highest decayed score, lowest hop on a tie): an inference about behavior the implementation recorded, and rules/knowledge-base/expansion-link-once, which would decide it, is not implemented by this task'
- 'expansion_hop_count in the query_retrieval_search_ok log line now counting distinct expanded links across all starts: an inference about behavior that no criterion or node states'
- 'that expansion starts only from node hits that surfaced with provenance, and that node hits dropped for lacking provenance are not expanded from: preserved behavior the implementation records, which no criterion or node of this task states; rules/knowledge-base/expansion-starts-from-matched-nodes is not claimed'
- 'that expanded links with no provenance, no metadata row, or uncertain status are dropped: preserved behavior no criterion or node of this task states'
- 'the arrangement of the expansion (one traversal per matched node, helper functions) is not pinned: it is arrangement, and a test over it would bind the shape of the code'
divergences:
- cites: TST-04
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  departure: the file sits beside the existing src/__tests__/unit/query-retrieval/search-service.spec.ts under the module's directory rather than mirroring the unit's path src/modules/query-retrieval/service/search.service.ts.
  why: every spec of this module sits in that flat directory and mirroring the unit's full path for one file would split the module's tests across two layouts; a separate file was chosen over editing the existing one, which carries comments the framework removes whenever a file is delivered whole
- cites: TYP-02
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  departure: the pg PoolClient stand-in is produced by an `as unknown as PoolClient` assertion with no narrowing guard.
  why: a stand-in for the store boundary implements only the query and release members the service reaches, and the existing tests of this module build the client the same way; a guard would have to construct a full PoolClient
---

## What it is

Tests that a search expanded to depth 3 scores each expanded link 0.5 raised to its hop times the score of the matched node it was reached from, numbers its hop by path length, and answers every item with the search-item attributes.

## Notes

None.
