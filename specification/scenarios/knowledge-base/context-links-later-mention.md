---
subject: rules/knowledge-base/document-context-read-first
given:
- a raw information of 3 chunks under prompt version v5
- chunk 1 says "o Diretor Financeiro, João Silva" and chunk 3 says "o Diretor aprovou o orçamento"
- the document context lists João Silva as a person the document also calls "o Diretor"
when:
- while reading chunk 3 the model proposes a node named "João Silva" and a fragment for the approval
then:
- the node proposal resolves to the knowledge node created while reading chunk 1
- the fragment is anchored to chunk 3
involves:
- rules/knowledge-base/extraction-reads-chunks-in-order
- rules/knowledge-base/extraction-anchors-to-read-chunk
---

## Description

None.
