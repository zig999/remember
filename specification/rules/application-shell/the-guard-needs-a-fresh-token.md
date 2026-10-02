---
type: invariant
statement: "The guard MUST let the owner through only while the access token is fresh and otherwise send the owner to the sign-in address with the reason session_expired, carrying no destination."
constrains:
- domain/application-shell/application-shell
---

## Description

None.
