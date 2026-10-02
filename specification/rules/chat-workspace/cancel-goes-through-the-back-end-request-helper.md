---
type: invariant
statement: "The cancel request MUST go through the back end request helper and so be cut off after thirty seconds, refresh the token once on a 401 and redirect to sign-in when it cannot."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.
