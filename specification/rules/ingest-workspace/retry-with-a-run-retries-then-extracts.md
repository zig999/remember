---
type: invariant
statement: "A retry with a run identity held MUST clear the failure, retry the run and, when the retry is answered, start extraction on the same run again."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-failure
---

## Description

None.
