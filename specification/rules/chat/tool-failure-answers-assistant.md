---
type: invariant
statement: A failed tool call hands the assistant VALIDATION_INVALID_FORMAT ("unknown tool name") for a tool outside its toolset, SYSTEM_SERVICE_UNAVAILABLE ("tool timeout") for a timeout and SYSTEM_INTERNAL_ERROR with the thrown message for a throw.
constrains:
- domain/chat/turn
---

## Description

None.
