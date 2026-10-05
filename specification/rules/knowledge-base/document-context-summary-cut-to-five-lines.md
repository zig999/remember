---
type: invariant
statement: A preliminary reading whose summary runs past 5 lines yields a document context whose summary is that summary's first 5 lines.
constrains:
- domain/knowledge-base/document-context
---

## Description

This rule covers what the extraction keeps of a preliminary reading's summary when the summary is longer than the limit that rules/knowledge-base/document-context-summary-lines sets. It does not decide which document context status the run records. rules/knowledge-base/document-context-status-recorded decides that.
