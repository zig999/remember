---
type: invariant
statement: "A request that is not an ingestion request MUST be cut off after 30000 milliseconds with a timeout reading Request timed out after 30s."
constrains:
- domain/application-shell/request-helper
---

## Description

None.
