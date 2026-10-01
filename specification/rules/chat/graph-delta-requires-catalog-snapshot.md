---
type: invariant
statement: A tool result is followed by a graph delta only while the catalog snapshot is held; without it the tool result is streamed alone.
constrains:
- domain/chat/turn
- domain/chat/graph-delta
- domain/chat/turn-event-kind
---

## Description

None.
