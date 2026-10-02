---
type: invariant
statement: "A submission that passes both checks MUST clear the validation message and the earlier failure before the phase moves to sending."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-failure
---

## Description

None.
