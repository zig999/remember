---
subject: rules/knowledge-base/alias-admitted-only-from-source
given:
- a raw information whose content says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto"
- an LLM run over it holds no knowledge node of that name
when:
- a node proposal names "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq"
then:
- the knowledge node is created with the canonical alias "Conselho Nacional de Desenvolvimento Científico"
- it also holds the alias "CNPq"
involves:
- rules/knowledge-base/new-node-aliases
---

## Description

None.
