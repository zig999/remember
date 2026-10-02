---
type: invariant
statement: "A send MUST resolve, never fail, with the stop reason of a done frame, the code and message of an error frame and the idempotency key it used, a refused or failed send resolving with the code and message set and the stop reason empty."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.
