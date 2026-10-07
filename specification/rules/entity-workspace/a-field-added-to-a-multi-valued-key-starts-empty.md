---
type: invariant
statement: "A field the owner adds to a key that allows multiple current values MUST start empty and from no current attribute, whatever values the node already holds of that key."
constrains:
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
---

## Description

What a field the owner adds to a multi-valued key starts from: no value, and no current attribute of the node. It does not decide which fields a multi-valued key shows when the form opens, or that the owner may add and remove them, which rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields decides. It does not decide what a field shown for a current attribute starts with, which rules/entity-workspace/fields-start-from-the-current-values decides. It does not decide when an added field counts as a changed field, which rules/entity-workspace/a-field-is-changed-only-by-its-value and rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed decide.
