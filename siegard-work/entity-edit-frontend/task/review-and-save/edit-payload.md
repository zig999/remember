---
title: The save sends one change per changed field under the trimmed reason
summary: The edit the save sends carries the trimmed reason and one set or remove change for each changed field.
rationale: I cut the payload apart from the undo window because it changes when the mapping of fields to changes changes. The trimmed reason is here because this is where the reason is sent.
sources:
- intake/scope.md
- intake/wire-facts.md
objective: The edit the save sends carries the trimmed reason and exactly one change for each changed field.
criteria:
- The edit carries one change for each changed field.
- An unchanged field contributes no change.
- A changed field holding a non-empty value is sent as a set change.
- A set change carries the field's value.
- A set change carries the validity the field states.
- A set change carries the identity of the attribute the field started from.
- A set change of a field that started from no attribute carries no attribute identity.
- A field the owner emptied after it started with a value is sent as a remove change.
- A field the owner removed after it started with a value is sent as a remove change.
- A remove change carries the identity of the attribute the field started from.
- A validity start the owner did not state is sent empty.
- The reason is sent trimmed.
- Each change carries its field's attribute key as attribute_key.
- The body is the JSON object { reason, changes }.
- Each change in the body carries attribute_key, kind, value, item_id, valid_from and valid_to.
depends_on:
- task/review-and-save/undo-window
- task/entity-form/multi-valued-fields
- task/entity-form/validity-fields
implements:
- rules/entity-workspace/save-sends-one-change-per-changed-field
- rules/entity-workspace/a-change-writes-an-empty-member-as-null
- rules/entity-workspace/review-requires-a-trimmed-reason
- rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
- scenarios/entity-workspace/an-unstated-start-is-sent-empty
- rules/entity-workspace/a-field-is-changed-only-by-its-value
- rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
- contracts/entity-workspace/bff-entity-edit
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- domain/knowledge-base/attribute-change
---
## What it is
The mapping from the reviewed form to the body of the one edit.

## Notes
The wire facts leave open whether an empty value, item or validity travels as null or is left out.
UNDERDETERMINED, from the specification — No criterion reaches the JSON-null clause of the empty-member rule or the null value and validity of a remove change. Passes: a save that writes an unstated validity start as an empty string, writes an empty item_id for a field that started from no attribute, and sends a remove change carrying the value and validity the field started with.
UNDERDETERMINED, from the specification — The criteria never fix what makes a field changed, which two rules decide, and no criterion tests either. Passes: a save that counts a validity-only edit, or an added field repeating a held value, as changed and sends a set change for it.
REMAINDER, from the specification — The clause that the reason is between 1 and 1000 UTF-16 code units belongs to the review-reason task.
REMAINDER, from the specification — The clause that an unstated start shows as today belongs to the review and form tasks that show the validity.
ADVISORY, from the specification — The wire values of kind, set and remove, are held by domain/knowledge-base/attribute-change-kind, outside the candidates.
ADVISORY, from the specification — No node states the order of the changes in the changes array.
Decision, beyond the covers — stand: domain/knowledge-base/attribute-change-kind is not claimed by the epic, because its values set and remove are the kind values the contract bff-entity-edit already states for the body, and no task of this epic implements the enumeration.
