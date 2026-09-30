---
type: invariant
statement: The history given to the assistant leaves out messages without content, leading assistant messages and tool results, and trailing tool requests, and keeps every other message unchanged and in order.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.
