---
type: invariant
statement: A turn calls the model at most the configured number of times, 8 where none is configured, and ends as max-iterations when it would call it once more.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.
