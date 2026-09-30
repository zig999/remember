---
type: invariant
statement: A sent message is checked for a disabled chat, then its idempotency key, conversation identity and content, then an absent conversation, an archived conversation, a turn in flight, a reused idempotency key and an unavailable toolset, and is refused at the first check it fails.
constrains:
- domain/chat/turn
- domain/chat/conversation
---

## Description

None.
