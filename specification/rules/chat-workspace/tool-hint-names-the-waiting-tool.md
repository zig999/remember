---
type: invariant
statement: "While a tool call runs the hint MUST name the most recent tool call still waiting for its result, or none when none is waiting."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
- domain/chat-workspace/tool-chip
---

## Description

None.
