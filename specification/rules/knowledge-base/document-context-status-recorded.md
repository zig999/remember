---
type: invariant
statement: Under prompt version v5 and later, an extraction records its run's document context status as single-chunk when the raw information holds one chunk whatever its length, too-long when it holds more than one chunk and its content exceeds 100000 UTF-16 code units, failed when the preliminary reading fails and produced when it yields a document context.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
---

## Description

None.
