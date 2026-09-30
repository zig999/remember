---
type: policy
statement: Ingesting a document records it and extracts it through its new LLM run, and extracts nothing when its content is already held.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
consistency: eventual
---

## Description

None.
