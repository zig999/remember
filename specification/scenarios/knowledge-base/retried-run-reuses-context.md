---
subject: rules/knowledge-base/document-context-read-first
given:
- an LLM run under prompt version v5 that failed after producing its document context
when:
- the run is retried and its extraction runs again
then:
- no second preliminary reading is made
- each chunk is shown with the document context the run already held
---

## Description

None.
