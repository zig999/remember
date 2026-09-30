---
type: policy
statement: A node read or traversal that names an as-of date shows only knowledge links and node attributes without a supersession time whose validity has no start or starts on or before that date and has no end or ends after it.
constrains:
- domain/knowledge-base/node-view
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.
