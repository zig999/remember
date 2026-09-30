---
type: policy
statement: A traversal lists knowledge nodes in the order it first reached them with its starting node first, and knowledge links in the order it first reached them with outgoing links before incoming ones within a hop.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/knowledge-link
consistency: eventual
---

## Description

None.
