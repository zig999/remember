---
type: invariant
statement: "A text_delta frame MUST append its delta to the streamed answer and make the chat status streaming, even when no llm_start came first."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.
