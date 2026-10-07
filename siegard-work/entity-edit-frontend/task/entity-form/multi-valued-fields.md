---
title: A multi-valued key is a list of fields
summary: A key that allows multiple current values shows one field per current attribute and lets the owner add and remove fields.
rationale: I cut this rule apart from the field groups because it alone adds and removes fields, and it changes when the catalog's multi-value semantics change.
sources:
- intake/scope.md
objective: A key that allows multiple current values shows one field for each current attribute the node holds of it, and the owner can add and remove fields.
criteria:
- A key that allows multiple current values shows one field for each current attribute the node holds of it.
- Each of those fields starts with the value of its own attribute.
- The owner can add a field to a key that allows multiple current values.
- The owner can remove a field from a key that allows multiple current values.
depends_on:
- task/entity-form/field-groups
implements:
- rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields
- rules/entity-workspace/fields-start-from-the-current-values
- rules/entity-workspace/a-field-added-to-a-multi-valued-key-starts-empty
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
---
## What it is
The list behaviour of the field group for a multi-valued key.

## Notes
For a multi-valued key of which the node holds no current attribute, "one field per current attribute" means none and "empty where the node holds none" means one empty field; no node resolves the two.
UNDERDETERMINED, from the specification — No criterion says that a field the owner adds starts empty and from no current attribute. Passes: an add action that fills the new field with a held value or ties it to a current attribute.
UNDERDETERMINED, from the specification — The criteria require only each field's starting value, not that each field stays tied to its own attribute with item_id and started_with. Passes: a list of plain strings with no item_id or started_with per field.
REMAINDER, from the specification — The clause that a field starts empty where the node holds none belongs to the field-groups task.
ADVISORY, from the specification — Which keys allow multiple current values is held by rules/knowledge-base/multi-current-attribute-keys and domain/knowledge-base/attribute-key, outside the candidates.
ADVISORY, from the specification — For a multi-valued key with no current attribute, the rules leave open showing zero fields or one empty field.
ADVISORY, from the specification — A multi-valued key holding a disputed attribute shows no field, so this task's list steps aside for it.
ADVISORY, from the specification — The rule that an added field with a held value is not a changed field belongs to the review tasks.
Decision, beyond the covers — stand: domain/knowledge-base/attribute-key is not claimed by the epic, because its allows_multiple_current flag reaches the form through the list-attribute-keys read that the knowledge-base-client epic implements.
Decision, beyond the covers — stand: rules/knowledge-base/multi-current-attribute-keys is not claimed by the epic, because it fixes which keys allow multiple current values, a backend fact that the form reads from the catalog and does not restate.
