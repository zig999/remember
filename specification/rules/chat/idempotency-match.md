---
type: invariant
statement: A resent message matches the message recorded under its idempotency key only when its text and model equal the recorded ones.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.
