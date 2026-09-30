---
type: policy
statement: A graph read flags a knowledge link or node attribute uncertain when its status is uncertain and disputed when its status is disputed, and never flags it low-confidence.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-flag
consistency: eventual
---

## Description

None.
