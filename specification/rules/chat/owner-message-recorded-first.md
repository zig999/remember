---
type: invariant
statement: A turn records the owner's message verbatim, with its idempotency key and model, before the assistant answers, and keeps it when the provider then refuses.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.
