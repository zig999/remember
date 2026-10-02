---
title: An expanded link scores from the matched node it was reached from
summary: At every hop an expanded link scores 0.5 raised to the hop times the score of the matched node it was reached from.
sources:
- intake/scope.md
objective: A search expanded to depth 3 gives a link reached at hop h from a matched node of score s the decayed score 0.5 raised to h times s.
criteria:
- A link reached at hop 1 from a matched node of score s has the decayed score 0.5 times s.
- A link reached at hop 2 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.25 times s.
- A link reached at hop 3 from a matched node of score s, neither endpoint of that link being a matched node, has the decayed score 0.125 times s.
implements:
- rules/knowledge-base/expansion-decay
- rules/knowledge-base/expansion-hop
- domain/knowledge-base/search-item
---

## What it is

A test-first correction of the decayed score assigned to expanded links.

## Notes

UNDERDETERMINED, from the specification — No criterion checks the search item's hop; an implementation scoring as required but numbering a link touching the matched node as hop 0, or leaving the hop off the item, meets every criterion and rules/knowledge-base/expansion-hop refuses it.
REMAINDER, from the specification — A link reached by several expansion paths (rules/knowledge-base/expansion-link-once) reaches no criterion; the criteria are per-path decayed scores and a test needs a graph where the link is reached by exactly one path.
Decision, beyond the covers — stand: rules/knowledge-base/expansion-link-once is not claimed; this task implements the per-path decayed score and its fixtures use a single path.
REMAINDER, from the specification — Starting the expansion from matched nodes (rules/knowledge-base/expansion-starts-from-matched-nodes) and the depth bound (rules/knowledge-base/expansion-depth-bounds) reach no criterion here.
Decision, beyond the covers — stand: rules/knowledge-base/expansion-starts-from-matched-nodes is not claimed; the criteria take it as a premise.
Decision, beyond the covers — stand: rules/knowledge-base/expansion-depth-bounds is not claimed; the objective's depth 3 is within the bound and the bound is not tested here.
