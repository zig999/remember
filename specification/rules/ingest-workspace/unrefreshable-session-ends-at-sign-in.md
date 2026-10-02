---
type: invariant
statement: "When no new access token can be obtained the application MUST clear the stored token and replace the address with /sign-in?reason=session_expired."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.
