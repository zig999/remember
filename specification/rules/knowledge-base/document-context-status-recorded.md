---
type: invariant
statement: Under prompt version v5 and later, an extraction records its run's document context status as single-chunk when the raw information holds one chunk, too-long when its content exceeds 100000 characters, failed when the preliminary reading fails and produced when it yields a document context.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
---

## Description

None.
