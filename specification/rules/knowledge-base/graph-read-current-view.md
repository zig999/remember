---
type: policy
statement: A node read or traversal that names no as-of date shows only current knowledge links and node attributes.
constrains:
- domain/knowledge-base/node-view
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.
