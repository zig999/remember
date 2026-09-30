---
type: invariant
statement: A curation request failing several request checks is refused for the first it fails among a merge-into without a target node, a missing reason, a node merged into itself, a prefer-one without a winner, an adjust-periods without one period per item, a validity start not before its end, a correction changing nothing and an unjustified corrected start, and is refused for a failing format only when none of these fails.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-correction
---

## Description

None.
