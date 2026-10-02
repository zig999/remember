---
type: invariant
statement: "AUTH_UNAUTHORIZED, AUTH_TOKEN_EXPIRED and AUTH_TOKEN_INVALID MUST clear the stored token and send the owner to the sign-in address with the reason session_expired."
constrains:
- domain/application-shell/failure-router
---

## Description

None.
