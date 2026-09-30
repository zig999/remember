---
type: policy
statement: A node read or traversal that asks for in-effect-only items and names no as-of date shows only knowledge links and node attributes in effect.
constrains:
- domain/knowledge-base/node-view
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.
