---
type: invariant
statement: "A failed refresh MUST clear the stored token, replace the page with the sign-in address and the reason session_expired and give the caller AUTH_SESSION_EXPIRED."
constrains:
- domain/application-shell/request-helper
---

## Description

None.
