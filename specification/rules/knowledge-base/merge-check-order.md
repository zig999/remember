---
type: invariant
statement: A merge is checked for a node merged into itself, then for an absent survivor, an absent absorbed node, a deleted survivor, a deleted absorbed node, a survivor that is not active, an absorbed node not in the status its operation expects and nodes of different node types, and is refused at the first check it fails.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
---

## Description

None.
