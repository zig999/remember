---
type: invariant
statement: A message resent under an idempotency key whose turn has ended streams the recorded answer again without calling the model or recording anything.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.
