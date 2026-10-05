---
subject: domain/knowledge-base/document-context
given:
- a raw information of 3 chunks under prompt version v5
- the knowledge base holds nothing read from it
when:
- the preliminary reading yields a document context listing two entities
then:
- no proposal is made
- the knowledge base holds no knowledge node, information fragment, knowledge link or node attribute read from it until its first chunk is read
involves:
- rules/knowledge-base/document-context-read-first
---

## Description

None.
