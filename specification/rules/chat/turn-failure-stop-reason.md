---
type: invariant
statement: A turn that fails ends as provider-error when the model provider failed and as internal-error for any other cause, including a turn that ends with neither done nor error.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.
