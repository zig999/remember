---
type: invariant
statement: "A field whose value equals the value it started with MUST NOT count as a changed field, whatever validity it holds."
constrains:
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
---

## Description

What makes a field of the entity form a changed field. It does not decide what the knowledge base records for a set change whose value equals the value already held, which rules/knowledge-base/entity-edit-unchanged-records-nothing decides.
