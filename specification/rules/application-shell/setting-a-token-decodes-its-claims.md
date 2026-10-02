---
type: invariant
statement: "Setting the token MUST decode its sub, exp, name and email claims without checking the signature, keeping each only when it has the expected type and none when the token does not have three dot-separated parts."
constrains:
- domain/application-shell/owner-session
---

## Description

None.
