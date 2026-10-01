---
type: invariant
statement: A replay of a turn that ended as provider-error or internal-error ends in a done event with stop reason end-turn.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
- domain/chat/turn-event-kind
---

## Description

None.
