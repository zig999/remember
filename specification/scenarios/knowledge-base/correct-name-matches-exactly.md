---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", each with an accepted information fragment mentioning it
when:
- the owner searches for "petrobras"
then:
- both knowledge nodes are returned
- both items carry the match exact
involves:
- rules/knowledge-base/node-layer-matches-through-aliases
---

## Description

None.
