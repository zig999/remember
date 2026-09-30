---
subject: rules/knowledge-base/held-content-records-nothing
given:
- a raw information ingested with one model and its LLM run
when:
- the same content is ingested naming another model
then:
- no raw information, raw chunk or LLM run is recorded
- the answer names the held raw information and the LLM run it already has
involves:
- contracts/knowledge-base/ingestion
---

## Description

None.
