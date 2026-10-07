---
title: Review lists each changed field once
summary: The review, offered only once a field differs from its starting value, lists each changed field with its previous and new values and its validity.
rationale: I cut the review's listing apart from its effects and its reason because each answers to its own rule and changes independently.
sources:
- intake/scope.md
objective: Once a field differs from its starting value, the owner can open a review that lists each changed field once, with its previous value beside its new value and the validity it states.
criteria:
- The form does not offer the review while every field holds the value it started with.
- While a field's value differs from the value it started with, the review is not withheld for want of a changed field.
- The review lists each changed field once.
- The review does not list a field whose value equals the value it started with.
- The review does not list a field whose value equals the value it started with even when its validity differs from the validity it started with.
- Each listed field shows the value it started with beside the value it now holds.
- Each listed field of a temporal key shows the validity start it holds.
- Each listed field of a temporal key that holds a validity end shows that validity end.
- A validity start the owner has not stated shows as today in the review.
depends_on:
- task/entity-form/field-groups
- task/entity-form/validity-fields
implements:
- contracts/entity-workspace/entity-screen
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- rules/entity-workspace/review-needs-a-changed-field
- rules/entity-workspace/review-lists-each-changed-field-once
- rules/entity-workspace/a-field-is-changed-only-by-its-value
- rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
- rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
- rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
---
## What it is
The review step between typing and saving.

## Notes
UNDERDETERMINED, from the specification — No criterion tests that a field added to a multi-valued key whose value an active or uncertain attribute already holds is not a changed field. Passes: a review that treats such an added field as changed and lists it with an empty previous value.
UNDERDETERMINED, from the specification — No criterion says which calendar's today an unstated start shows as. Passes: a review that shows the current UTC calendar date, which near midnight is the day before or after the owner's local date.
REMAINDER, from the specification — The clause that an unstated start is sent empty belongs to the edit-payload task.
ADVISORY, from the specification — The review's effect, reason field and refusals belong to the review-effects, review-reason and validity-order tasks.
