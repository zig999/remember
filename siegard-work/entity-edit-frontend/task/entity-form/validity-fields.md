---
title: A changed field offers exactly the validity its key admits
summary: A changed field of a temporal key offers a validity start and an optional end, a changed field of a stable key offers neither, and an unstated start shows as today.
rationale: I cut validity input apart from the field groups because it changes with the key's temporal nature. The start-before-end check sits in the review epic, because the contract places its refusal on the review.
sources:
- intake/scope.md
objective: A changed field offers a validity start and an optional end exactly when its key is temporal, and an unstated start shows as today.
criteria:
- A changed field of a temporal key offers a validity start.
- A changed field of a temporal key offers a validity end.
- The validity end of a changed field of a temporal key may be left empty.
- A changed field of a key that is not temporal offers no validity start.
- A changed field of a key that is not temporal offers no validity end.
- A validity start the owner has not stated shows as today.
depends_on:
- task/entity-form/field-groups
implements:
- rules/entity-workspace/a-changed-temporal-field-offers-its-validity
- rules/entity-workspace/a-changed-stable-field-offers-no-validity
- rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
- rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
- domain/entity-workspace/attribute-field
---
## What it is
The validity inputs of a changed field.

## Notes
The other half of rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty, sending the start empty, is the edit payload's.
UNDERDETERMINED, from the specification — The clause that an unstated validity start is sent empty reaches no criterion here. Passes: a form that writes today's date into valid_from when the owner leaves the start unstated and sends that date with the change.
UNDERDETERMINED, from the specification — No criterion fixes which calendar date today means, which the rule decided as the browser clock's date in the owner's local time zone. Passes: a form that formats the browser clock in UTC, which in the evening in Brazil shows tomorrow's date.
ADVISORY, from the specification — Whether a key is temporal is the is_temporal attribute of domain/knowledge-base/attribute-key, reaching the screen through the list-attribute-keys read of contracts/entity-workspace/bff-entity-reads.
ADVISORY, from the specification — The validity inputs follow whatever the form already treats as a changed field, defined by the review tasks, and are not computed again.
Decision, beyond the covers — stand: domain/knowledge-base/attribute-key is not claimed by the epic, because its is_temporal flag reaches the form through the list-attribute-keys read that the knowledge-base-client epic implements.
