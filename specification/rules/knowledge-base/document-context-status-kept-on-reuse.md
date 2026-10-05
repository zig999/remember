---
type: invariant
statement: Under prompt version v5 and later, an extraction that makes no preliminary reading because its run already holds a document context leaves the run's document context status as it was.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
---

## Description

Governs the document context status of a run whose extraction reuses the document context the run already holds.
It does not decide the status an extraction records when it makes a preliminary reading or cannot make one; rules/knowledge-base/document-context-status-recorded decides that.
