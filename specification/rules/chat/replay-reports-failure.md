---
type: invariant
statement: A replay of a turn that ended as provider-error or internal-error ends in an error event as the live turn did, never in done.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
- domain/chat/turn-event-kind
---

## Description

None.
