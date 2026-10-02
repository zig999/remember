---
type: invariant
statement: "A read MUST stay fresh for 5 minutes by default, MUST NOT be repeated when the window regains focus and MAY override the freshness with 0 milliseconds."
constrains:
- domain/application-shell/failure-router
---

## Description

None.
