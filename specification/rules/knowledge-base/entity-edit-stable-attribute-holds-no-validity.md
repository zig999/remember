---
type: policy
statement: "An attribute an entity edit records for a key that is not temporal holds no validity start, no validity end and no validity-start basis."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-key
- domain/knowledge-base/node-attribute
- domain/knowledge-base/valid-from-basis
consistency: eventual
---

## Description

Governs the validity held by the attribute an entity edit records for a key that is not temporal, whatever the edit's effect. What a change to such a key may state is governed by rules/knowledge-base/stable-key-change-states-no-validity, and the start and basis recorded for a temporal key by rules/knowledge-base/entity-edit-start-defaults-to-today and rules/knowledge-base/entity-edit-stated-start-is-stated.
