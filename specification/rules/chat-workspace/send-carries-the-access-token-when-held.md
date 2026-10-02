---
type: invariant
statement: "A send MUST carry the owner's access token as a bearer, read once when the send starts, and no Authorization header when none is held, the request being sent all the same."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.
