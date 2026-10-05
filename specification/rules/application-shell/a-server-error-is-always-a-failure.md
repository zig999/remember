---
type: invariant
statement: "An answer with status 500 or more MUST be a failure with the body's own string code and message when it has them, the whole body as details, and SYSTEM_UPSTREAM and the message made of \"Algo deu errado\" and \"Tente novamente\", each ending in a full stop, otherwise."
constrains:
- domain/application-shell/request-helper
---

## Description

None.
