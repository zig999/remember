---
type: policy
statement: "The review MUST judge the effect of each changed field against the knowledge node as the form loaded it, without regard to the other changes of the same edit."
constrains:
- domain/entity-workspace/entity-edit-session
- domain/knowledge-base/edit-effect
consistency: eventual
---

## Description

This rule covers the node state that the review judges each field's effect against when the edit carries several changes: the node as the form loaded it, and not as the changes before it in the edit would leave it.
It does not decide which effect a change takes from that state. The rules entity-edit-first-value, entity-edit-addition, entity-edit-succession, entity-edit-correction and entity-edit-removal under rules/knowledge-base/ decide that.
It does not decide what the knowledge base records for a change within an edit that carries several, which rules/knowledge-base/entity-edit-adds-no-second-current-value and rules/knowledge-base/entity-edit-unchanged-records-nothing decide.
It does not decide which fields count as changed, which rules/entity-workspace/a-field-is-changed-only-by-its-value and rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed decide.
