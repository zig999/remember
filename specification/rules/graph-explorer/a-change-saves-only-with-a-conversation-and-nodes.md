---
type: invariant
statement: "On a graph change a save MUST require an active conversation, then at least one node, then skip the first change after a restore, so a change that leaves the pane empty does not use up the skip."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.
