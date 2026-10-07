---
title: One field group per catalog key, starting from current values
summary: The form's groups, one for each attribute key the catalog holds for the node's type, in catalog order, each field starting from the node's current value.
rationale: Drawing the groups from the catalog and seeding them from the node are one outcome, because the starting value is read per group. I cut multi-valued keys, value types, closed keys and validity apart because each answers to its own rule.
sources:
- intake/scope.md
objective: The form of an active node holds one group per catalog key of its type, in catalog order, each field starting from the node's current value for that key.
criteria:
- The form holds one group of fields for each attribute key the catalog holds for the node's type.
- The groups follow the order in which the catalog lists the keys.
- A field of a key for which the node holds a current attribute starts with that attribute's value.
- A field of a key for which the node holds no current attribute starts empty.
- Each field shows as its help text the description the catalog holds for its key.
depends_on:
- task/entity-form/entity-page
implements:
- rules/entity-workspace/the-form-has-a-field-group-per-catalog-key
- rules/entity-workspace/fields-start-from-the-current-values
- rules/entity-workspace/a-field-shows-its-key-description-as-help-text
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
- contracts/entity-workspace/bff-entity-reads
---
## What it is
The skeleton of the form and its starting values.

## Notes
The entity-screen contract names "help text" without naming its source. The attribute key's description is the only text the catalog read carries for a key, so the help-text criterion is this plan's reading.
It follows the form pattern in src/features/curation/components/CorrectionForm/CorrectionForm.tsx.
UNDERDETERMINED, from the specification — No criterion excludes an editable field for a key holding a disputed attribute, which the disputed-keys task owns. Passes: a form that shows an editable field prefilled with a disputed attribute's value inside the key's group.
UNDERDETERMINED, from the specification — No criterion says what happens to an attribute whose key the catalog no longer holds, which the attributes-outside-the-catalog task owns. Passes: a form that adds an editable field for each such attribute.
UNDERDETERMINED, from the specification — The criteria speak of one attribute per key, while a multi-valued key shows one field per current attribute under the multi-valued-fields task. Passes: a form that shows one field per key prefilled with only one of two current attributes.
ADVISORY, from the specification — The catalog order is the one bff-entity-reads states, by node type name and then by key, and the form never re-sorts it.
ADVISORY, from the specification — The active-node condition is owned by the entity-page task, and the node's name, type and status and the closed keys' allowed values belong to sibling tasks.
