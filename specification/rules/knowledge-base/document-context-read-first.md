---
type: invariant
statement: Under prompt version v5 and later, an extraction whose raw information holds more than one chunk and at most 100000 characters reads that whole content once, before its first chunk, to produce the run's document context when the run holds none.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context
---

## Description

None.
