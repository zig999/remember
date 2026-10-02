---
type: invariant
statement: "A turn's state MUST start with empty streamed text, no tool chips, no abort handle, no idempotency key, streaming off and the chat status idle."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.
