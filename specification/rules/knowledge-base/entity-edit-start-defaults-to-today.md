---
type: policy
statement: "A set change to a temporal key that states no validity start is recorded with today, the UTC calendar date of the moment of the edit, as its start and the basis received."
constrains:
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-key
- domain/knowledge-base/valid-from-basis
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.
