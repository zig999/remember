---
type: invariant
statement: "Before a send goes out the owner's message MUST be appended at the end of the conversation's cached messages with role user, one text block, an optimistic identifier built from the idempotency key and the browser's time, and a one-item list when none was cached."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.
