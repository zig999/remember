---
type: invariant
statement: "A read MUST be retried once after any failure before the failure is routed and a write MUST NEVER be retried."
constrains:
- domain/application-shell/failure-router
---

## Description

None.
