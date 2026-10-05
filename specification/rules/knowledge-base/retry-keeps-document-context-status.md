---
type: invariant
statement: Retrying an LLM run leaves its document context status unchanged.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
---

## Description

The retry itself neither sets nor clears the run's document context status.
What an extraction under the retried run records is governed by rules/knowledge-base/document-context-status-recorded.
