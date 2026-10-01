---
type: invariant
statement: The older messages a refold reads are at most the configured overlap of messages, 40 where none is configured, just before the recent window, starting at an owner-written message.
constrains:
- domain/chat/conversation
- domain/chat/message
---

## Description

None.
