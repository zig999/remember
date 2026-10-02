---
type: invariant
statement: "Before a send goes out the turn state MUST be cleared of the earlier turn's text, tool chips and error status, and the new key and abort handle stored."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.
