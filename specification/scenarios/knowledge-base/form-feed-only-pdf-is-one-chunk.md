---
subject: rules/knowledge-base/contentless-blocks-single-chunk
given:
- a pdf whose content is only form feeds
when:
- it is ingested
then:
- its blocks hold nothing
- one raw chunk with index 0 spans the whole content
involves:
- rules/knowledge-base/pdf-blocks-at-form-feeds
---

## Description

None.
