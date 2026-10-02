---
target: backend
title: Proof of the decayed score of a link reached through its target end
summary: A matched node's score decays by 0.5 per hop along a path walked from target end to source end, and along a path that switches walking direction.
implementation: sha256:315328674deece237ce75b6aba5e596c6dc3226559733b31678aa7a866f3934b
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/proof-owed-expansion-decay-target-end-suite
tests:
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: decayed score of a link reached through its target end > scores a link whose target is the matched node at 0.5 times its score at hop 1, and the link beyond it walked the same way at 0.25 times at hop 2'
  proves: 'Input: one matched node scored s, a link whose target is that node, and a further link walked the same way beyond it. Expected result: the first link scores 0.5 times s at hop 1, and the second scores 0.25 times s at hop 2. (matched node scored 0.8; node-b to node-a scores 0.4, node-c to node-b scores 0.2)'
  fails_when: a link reached from its target end is left out of the expansion, or scores anything but 0.5 times the matched node's score at hop 1, or the next link walked the same way scores anything but 0.25 times it at hop 2 (for instance the decay or the matched score is not carried along an incoming walk).
  demonstrates: rules/knowledge-base/expansion-decay
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: decayed score of a link reached through its target end > scores the link after a change of walking direction at 0.25 times the matched node''s score at hop 2: an outgoing link followed by an incoming one'
  proves: 'The UNDERDETERMINED entry: the rule states the score with no condition on direction, so a link reached at hop 2 after switching from walking source to target into walking target to source scores 0.25 times the matched node''s score.'
  fails_when: on a path that switches direction from outgoing to incoming, the link after the switch is scored from the score of the node at the switch point, or its hop count restarts, or the link is left out, so that link-s2 does not score 0.2 from a matched node scored 0.8.
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService expansion: decayed score of a link reached through its target end > scores the link after a change of walking direction at 0.25 times the matched node''s score at hop 2: an incoming link followed by an outgoing one'
  proves: 'The UNDERDETERMINED entry in the opposite switching order: after walking a link from its target end, a link then walked from its source end scores 0.25 times the matched node''s score at hop 2.'
  fails_when: on a path that switches direction from incoming to outgoing, the link after the switch is scored from the score of the node at the switch point, or its hop count restarts, or the link is left out, so that link-s2 does not score 0.2 from a matched node scored 0.8.
not_applicable:
- edge_case: absent or empty input to the scoring
  why: The criterion and the node state the score of a link that was reached; no obligation here covers a search that matches no node or reaches no link, and expansion over an empty set is not stated by either.
- edge_case: a boundary at the ends of the expansion depth range (1 and 3)
  why: The criterion fixes hops 1 and 2 on the target-end path; hop 3 and the depth range's own boundaries belong to other obligations, and the existing tests in the same file already hold hops 1 to 3 on the source-end walk.
- edge_case: a dependency that fails or answers slowly, and concurrent searches
  why: Neither the criterion nor the node says anything about store failure or concurrency; the store is the stand-in boundary and its failure is not an obligation of this task.
- edge_case: a link reachable from two matched nodes, or by two paths
  why: Which path's score wins is not what the criterion or the node states (the node says a link scores from the matched node it was reached from, without choosing among several); the implementation's keepBestPath choice is an inference no node decides.
untested:
- 'The choice between several paths when one link is reached from more than one matched node or at more than one hop (the implementation keeps the higher score, then the lower hop): the node states the score of a link reached at hop h from one matched node and does not decide which of two reachings stands. Recorded as unproven; no node decides it and no test pins it.'
- 'The node''s fact for hops above 2 along a target-end or a direction-switching path: the criterion fixes hops 1 and 2, and the tests written here stay within what the criterion and the UNDERDETERMINED entry state.'
---

## What it is

A matched node's score decays by 0.5 per hop along a path walked from target end to source end, and along a path that switches walking direction.

## Notes

None.
