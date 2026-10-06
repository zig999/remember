---
type: policy
statement: A node read logs a warning for each attribute of the node that is not deleted and has no provenance.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.
