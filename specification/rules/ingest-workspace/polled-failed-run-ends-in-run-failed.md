---
type: invariant
statement: "A polled run that failed MUST stop the polling and move the screen to the error phase with the code RUN_FAILED."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
- domain/ingest-workspace/ingest-failure
---

## Description

None.
