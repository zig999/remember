---
type: policy
statement: A graph read orders a knowledge link's or node attribute's provenance entries by the time each provenance was recorded and then by fragment identity.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.
