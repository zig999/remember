---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge node "Petrobras", with an accepted information fragment mentioning it, and no alias holding the word "contrato"
when:
- the owner searches for "contrato Petrobras"
then:
- the knowledge node "Petrobras" is returned with the match approximate
involves:
- rules/knowledge-base/node-layer-matches-through-aliases
---

## Description

None.
