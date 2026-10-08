---
type: invariant
statement: "An attribute change's value, item, validity start or validity end sent as null MUST count as not stated."
constrains:
- domain/knowledge-base/attribute-change
---

## Description

This rule governs how a null value, item, validity start or validity end in a change is read. It does not govern whether a change must or may state each of them. That belongs to rules/knowledge-base/entity-edit-value-matches-the-kind, rules/knowledge-base/entity-edit-removal-names-an-attribute and rules/knowledge-base/stable-key-change-states-no-validity.
