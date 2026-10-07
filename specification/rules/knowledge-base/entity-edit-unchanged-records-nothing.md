---
type: policy
statement: "A set change whose value equals the value of the attribute it names, or, naming none, of an attribute of a key that allows multiple current values whose status is active or uncertain, is reported with the effect unchanged and records nothing."
constrains:
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-key
- domain/knowledge-base/edit-effect
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.
