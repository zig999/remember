---
subject: rules/knowledge-base/exact-alias-resolves
given:
- an active knowledge node holds the canonical alias "Conselho Nacional de Desenvolvimento Científico" and the alias "CNPq"
when:
- a later document's node proposal of the same node type names "CNPq"
then:
- the proposal resolves as matched-existing to that knowledge node
involves:
- rules/knowledge-base/alias-admitted-only-from-source
---

## Description

None.
