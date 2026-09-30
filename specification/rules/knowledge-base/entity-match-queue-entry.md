---
type: policy
statement: The entity-match queue holds one entry per knowledge node in status needs-review, listing each of its entity match reviews as a candidate, most similar first.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/entity-match-review
consistency: eventual
---

## Description

None.
