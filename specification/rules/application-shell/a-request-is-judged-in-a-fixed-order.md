---
type: invariant
statement: "A request MUST be judged in this order, its failure to complete, a 401 on the first attempt, a status of 500 or more, a body that is not JSON and then the envelope's ok."
constrains:
- domain/application-shell/request-helper
---

## Description

None.
