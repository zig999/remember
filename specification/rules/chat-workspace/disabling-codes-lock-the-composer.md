---
type: invariant
statement: "A send that ended with BUSINESS_CHAT_DISABLED or BUSINESS_CHAT_PROVIDER_UNAVAILABLE MUST disable the text field and the send button and show an inline notice."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.
