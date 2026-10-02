---
type: policy
statement: A node proposal resolved by neither an exact alias nor a single strong candidate, with at least one active knowledge node of its node type at a similarity of 0.55 or more, creates a knowledge node in status needs-review and records an entity match review pairing it with each of the ten such nodes most similar to it and its similarity.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/entity-match-review
- domain/knowledge-base/node-resolution
- domain/knowledge-base/node-status
consistency: eventual
---

## Description

None.
