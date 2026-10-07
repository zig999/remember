---
type: invariant
statement: A node proposal whose name equals an alias of more than one active knowledge node of its node type resolves as matched-existing to the one whose matching alias was created earliest, an alias with no recorded creation time counting as created after every alias that has one, and equal creation times going to the lowest knowledge node identity.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/node-resolution
---

## Description

Which knowledge node a node proposal resolves to when its name equals an alias held by several active knowledge nodes of its node type.
Whether a proposal resolves by exact alias at all is decided by rules/knowledge-base/exact-alias-resolves.
