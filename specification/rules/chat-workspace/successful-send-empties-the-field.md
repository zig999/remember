---
type: invariant
statement: "A successful send MUST empty the text field, and a failed one MUST keep the typed text."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.
