---
type: invariant
statement: "The access token MUST be held in memory and mirrored to the tab's session storage under the key remember.auth.token, read once when the application loads and kept in memory only when storage cannot be written."
constrains:
- domain/application-shell/owner-session
---

## Description

None.
