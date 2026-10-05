---
type: invariant
statement: The similarity a search item carries for a knowledge node the node layer matched approximately is the highest word similarity of that node's aliases to the query text, with no layer weight applied.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
---

## Description

This rule sets the value of a search item's similarity for an approximately matched knowledge node. It does not set the item's score, which approximate-match-strength and layer-weights govern. It does not set which items carry a similarity, which node-item-shows-match governs.
