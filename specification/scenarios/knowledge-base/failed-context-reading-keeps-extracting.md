---
subject: rules/knowledge-base/failed-preliminary-reading-continues
given:
- a raw information of 3 chunks under prompt version v5
when:
- the preliminary reading answers a provider error
then:
- the 3 chunks are read
- the run completes
- the run records the document context status failed and holds no document context
involves:
- rules/knowledge-base/document-context-status-recorded
---

## Description

None.
