---
type: policy
statement: "The save MUST send one change per changed field, a set change carrying the value, the validity and the attribute the field started from, or a remove change where the owner emptied or removed a field that started with a value."
constrains:
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- domain/knowledge-base/attribute-change
consistency: eventual
---

## Description

None.
