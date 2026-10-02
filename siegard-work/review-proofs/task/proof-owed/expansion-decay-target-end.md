---
title: A link reached through its target end scores from the matched node
summary: An expanded link walked from its target end to its source end scores 0.5 raised to its hop times the score of the matched node, like one walked the other way.
sources:
- intake/scope.md
objective: Every expanded link scores 0.5 raised to its hop times the score of the matched node it was reached from, whichever way it was walked.
criteria:
- 'Input: one matched node scored s, a link whose target is that node, and a further link walked the same way beyond it. Expected result: the first link scores 0.5 times s at hop 1, and the second scores 0.25 times s at hop 2.'
implements:
- rules/knowledge-base/expansion-decay
stands:
- src/modules/query-retrieval/service/search.service.ts
---

## What it is

A proof of a delivered fact, owed by the record siegard-reconcile/drift-corrections.md.

## Notes

UNDERDETERMINED, from the specification — The criterion only checks a path whose every link is walked from its target end to its source end, while rules/knowledge-base/expansion-decay states the score with no condition on direction; an implementation that carries the matched node's score and the 0.5-per-hop decay only along paths whose links are all walked the same way, and on a path that switches direction scores the link after the switch from the score of the node at the switch point, or restarts the hop count, or leaves the link out, meets the criterion and the rule refuses it.
ADVISORY, from the specification — No decision log exists beside rules/knowledge-base/expansion-decay; the task claims no replacement of one rule by another, and the node's statement is all there is to implement against.
