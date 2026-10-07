---
type: policy
statement: "A set change that names no attribute MUST NOT be made to a key that does not allow multiple current values while the edited node holds an attribute of that key with a live status."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-key
- domain/knowledge-base/node-attribute
- domain/knowledge-base/live-assertion-status
consistency: eventual
---

## Description

None.
