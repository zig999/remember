---
type: policy
statement: When rolling summaries are enabled and a conversation has owner-written messages older than the recent window, a live turn refolds its rolling summary from the previous summary and the older messages.
constrains:
- domain/chat/conversation
- domain/chat/summary-prompt-version
consistency: eventual
---

## Description

None.
