---
type: invariant
statement: A knowledge node search item that the node layer matched exactly carries no similarity, even when one of the node's aliases has a word similarity to the query text that would be enough for an approximate match.
constrains:
- domain/knowledge-base/search-item
---

## Description

Governs whether an exactly matched knowledge node search item carries a similarity. It does not decide which match a node that meets both ways takes (rules/knowledge-base/node-layer-approximate-match), nor what an approximately matched item carries (rules/knowledge-base/node-item-shows-match).
