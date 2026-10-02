---
type: invariant
statement: "Every read and write failure MUST go to the central routing and a failure that is not an envelope failure MUST be reported and shown as a danger toast with the standard failure message."
constrains:
- domain/application-shell/failure-router
---

## Description

None.
