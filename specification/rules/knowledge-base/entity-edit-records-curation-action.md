---
type: policy
statement: "An accepted entity edit records one curation action of kind edit-entity on target kind node at the edited node's identity, with its reason as the reason and as the payload an object whose `applied` field lists one `{ attribute_key, effect, item_id, predecessor_id }` per applied change in the order given, each effect written with an underscore for each hyphen and `item_id` and `predecessor_id` null where the effect has none."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/applied-change
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
consistency: eventual
---

## Description

None.
