---
type: invariant
statement: "A failed decision MUST be read in this order: a failure with no envelope, an authentication code, a code meaning the item is gone, a field code, a status of 500 or above and any other code."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.
