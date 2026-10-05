---
subject: rules/knowledge-base/alias-admitted-only-from-source
given:
- a raw information whose content refers to a company only as "a estatal"
when:
- a node proposal in an LLM run over it names the alias "Petrobras"
then:
- the node proposal is taken and its resolution answered
- the alias "Petrobras" is not recorded on the knowledge node
- the answer lists "Petrobras" as not admitted, with the reason ALIAS_NOT_IN_SOURCE
involves:
- contracts/knowledge-base/ingestion
---

## Description

None.
