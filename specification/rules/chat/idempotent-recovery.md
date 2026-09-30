---
type: invariant
statement: A message resent under an idempotency key whose turn neither ended nor is in flight runs the turn again on the recorded message without recording a second one.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.
