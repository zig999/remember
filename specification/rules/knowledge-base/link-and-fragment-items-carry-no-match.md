---
type: invariant
statement: A search item for a knowledge link or an information fragment carries no node match and no similarity.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
---

## Description

This rule says which search items do not carry a node match or a similarity. These are link items, including links a search's expansion reaches, and fragment items, including fragments the chunk layer surfaces.
It does not say what a knowledge node item carries. rules/knowledge-base/node-item-shows-match covers that.
It does not set the score or the rank of an item that the search reached through an approximately matched knowledge node. rules/knowledge-base/approximate-match-strength and rules/knowledge-base/search-ranking cover those.
