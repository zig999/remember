---
type: policy
statement: "A set change that names an attribute with a live status, a validity end and no supersession time and states a value other than its own supersedes it and is recorded as a new active attribute that names it as the one it supersedes, with the effect correction, whatever its key."
constrains:
- domain/knowledge-base/attribute-change
- domain/knowledge-base/edit-effect
- domain/knowledge-base/node-attribute
- domain/knowledge-base/live-assertion-status
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

Covers a new value set on an attribute whose period has already ended. This rule does not decide the new attribute's validity. That validity is the change's own: rules/knowledge-base/entity-edit-start-defaults-to-today covers a temporal key, and rules/knowledge-base/stable-key-change-states-no-validity covers a key that is not temporal.
