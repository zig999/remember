---
type: policy
statement: "A new attribute recorded from an entity edit's set change holds as its validity end the validity end the change states, and holds no validity end when the change states none."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

This rule governs the validity end of the attribute that an entity edit records. It does not govern the validity end given to the attribute that the edit supersedes. That end belongs to rules/knowledge-base/entity-edit-succession-closes-the-previous.
