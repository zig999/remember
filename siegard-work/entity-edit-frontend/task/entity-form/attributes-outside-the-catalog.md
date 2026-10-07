---
title: Attributes whose key is outside the catalog show without a field
summary: The node's attributes whose key the catalog no longer holds for its type are shown read-only.
rationale: I cut this rule apart from disputed keys because it changes with the catalog's evolution, not with curation.
sources:
- intake/scope.md
objective: An attribute of the node whose key the catalog no longer holds for its type is shown with its value and without a field.
criteria:
- An attribute whose key the catalog does not hold for the node's type shows its value.
- An attribute whose key the catalog does not hold for the node's type shows no field.
depends_on:
- task/entity-form/entity-page
implements:
- rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field
- domain/entity-workspace/entity-edit-session
---
## What it is
The read-only rendering of attributes that fall outside the node type's catalog.

## Notes
ADVISORY, from the specification — The accepted answer of show-entity-form in contracts/entity-workspace/entity-screen does not mention the read-only values this rule requires, so the screen's published answer and the rule do not yet describe the same form.
ADVISORY, from the specification — The criteria say the catalog does not hold the key, where the rule says it no longer holds it, and the two cover the same attributes.
ADVISORY, from the specification — Telling which keys the catalog holds needs the list-attribute-keys and read-node reads of contracts/entity-workspace/bff-entity-reads, which another task of the epic implements.
