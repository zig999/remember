---
type: invariant
statement: "A set change to a temporal key that states a validity end and no validity start MUST state that end after today."
constrains:
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-key
---

## Description

Covers a set change that states a validity end and leaves its start to the default. A change that states both a start and an end is held by rules/knowledge-base/validity-start-before-end. The default start itself is set by rules/knowledge-base/entity-edit-start-defaults-to-today.
