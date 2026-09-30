---
type: policy
statement: Retrying an LLM run rejects every orphaned information fragment of that run.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
consistency: eventual
---

## Description

None.
