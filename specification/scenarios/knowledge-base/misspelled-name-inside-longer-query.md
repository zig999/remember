---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge node "Petrobras", with an accepted information fragment mentioning it
when:
- the owner searches for "contrato Petrobrass"
then:
- the knowledge node "Petrobras" is returned with the match approximate
involves:
- rules/knowledge-base/word-similarity
---

## Description

None.
