---
title: A closed key offers only its allowed values
summary: A field of a key the catalog closes offers only its allowed values, by label and in catalog order.
rationale: I cut closed keys apart from value types because they change when a key's allowed values change.
sources:
- intake/scope.md
objective: A field of a key that has allowed values offers only those values, by their labels and in their order.
criteria:
- A field of a key with allowed values offers only those values.
- The allowed values are shown by their labels.
- The allowed values are shown in the order the catalog gives them.
depends_on:
- task/entity-form/field-groups
implements:
- rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
- contracts/entity-workspace/bff-entity-reads
---
## What it is
The choice of value for keys whose values the catalog closes.

## Notes
The retrieval contract does not state whether each allowed value carries a label and a sort order; the wire facts record this as an open contradiction on the backend side.
UNDERDETERMINED, from the specification — No criterion says what an allowed value that has no label shows, though the rule decided it is shown by its own value. Passes: a field that shows a label-less allowed value as an empty option or leaves it out.
ADVISORY, from the specification — bff-entity-reads orders only the items of list-attribute-keys, and a key's allowed values keep the order the catalog delivers, which the form must not re-sort.
