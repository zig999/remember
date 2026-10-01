---
type: invariant
statement: A node listing that names a name prefix holds only knowledge nodes one of whose aliases, compared as a name, matches the prefix compared as a name followed by any text, a percent sign in the prefix standing for any text and an underscore for any one character.
constrains:
- domain/knowledge-base/node-filter
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.
