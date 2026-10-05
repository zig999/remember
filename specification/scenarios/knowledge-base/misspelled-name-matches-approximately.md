---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge node "Petrobras", with an accepted information fragment mentioning it
when:
- the owner searches for "Petrobrass"
then:
- the knowledge node "Petrobras" is returned as a search item at hop 0
- the item carries the match approximate and its similarity
involves:
- rules/knowledge-base/node-item-shows-match
---

## Description

None.
