---
type: invariant
statement: "A field added to a key that allows multiple current values MUST NOT count as a changed field while its value equals the value of an active or uncertain attribute of that key."
constrains:
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
---

## Description

When a field the owner added to a multi-valued key is a changed field. It does not decide what the review lists or what the save sends for a changed field, which rules/entity-workspace/review-lists-each-changed-field-once, rules/entity-workspace/review-states-the-effect-of-each-change and rules/entity-workspace/save-sends-one-change-per-changed-field decide. It does not decide what the knowledge base records for a set change that names no attribute and states a value its key already holds, which rules/knowledge-base/entity-edit-unchanged-records-nothing decides.
