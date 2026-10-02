---
type: invariant
statement: "A read or write MUST count as a single conversation's when its key has at least two elements, the first being conversations and the second a non-empty string other than list, and a write without a key MUST NOT."
constrains:
- domain/application-shell/failure-router
---

## Description

None.
