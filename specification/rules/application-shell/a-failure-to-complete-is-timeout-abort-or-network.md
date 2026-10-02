---
type: invariant
statement: "A request that fails to complete MUST be a timeout when it timed out, an abort when the caller aborted and a network failure otherwise, each with status 0."
constrains:
- domain/application-shell/request-helper
---

## Description

None.
