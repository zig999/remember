---
type: invariant
statement: "A set change that names an attribute whose status is active or uncertain and that carries a supersession time MUST NOT state a value other than that attribute's own."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
---

## Description

Covers a set change that states a new value for an active or uncertain attribute that already carries a supersession time. This rule does not cover the following cases. A set change that states the attribute's own value is rules/knowledge-base/entity-edit-unchanged-records-nothing's. An attribute whose status is disputed is rules/knowledge-base/entity-edit-leaves-disputes-to-curation's. An attribute whose status is not a live status is rules/knowledge-base/entity-edit-names-a-live-attribute's. A live attribute with a validity end and no supersession time is rules/knowledge-base/entity-edit-ended-attribute-correction's.
