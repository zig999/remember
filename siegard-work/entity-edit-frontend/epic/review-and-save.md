---
title: Review, reason, undo window and save of an entity edit
summary: The path from a changed form to a sent edit, covering the review of each change and its effect, the reason, the five-second undo, the payload, the reload and the save's failures.
rationale: The scope lists review, reason, delayed send and conflict as the second half of the screen and does not say how to cut it. I grouped them because they all change when the owner's path from typed values to a recorded edit changes.
sources:
- intake/scope.md
covers:
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- domain/knowledge-base/edit-effect
- domain/knowledge-base/attribute-change
- contracts/entity-workspace/entity-screen
- contracts/entity-workspace/bff-entity-edit
- rules/entity-workspace/review-needs-a-changed-field
- rules/entity-workspace/review-lists-each-changed-field-once
- rules/entity-workspace/review-states-the-effect-of-each-change
- rules/entity-workspace/review-requires-a-trimmed-reason
- rules/entity-workspace/validity-start-precedes-the-end
- rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
- rules/entity-workspace/save-sends-one-change-per-changed-field
- rules/entity-workspace/saving-waits-for-undo
- rules/entity-workspace/a-saved-edit-reloads-the-entity
- rules/entity-workspace/a-conflict-keeps-the-typed-values
- scenarios/entity-workspace/a-conflict-keeps-what-the-owner-typed
- scenarios/entity-workspace/an-unstated-start-is-sent-empty
- scenarios/entity-workspace/undo-within-five-seconds-sends-nothing
- rules/knowledge-base/entity-edit-first-value
- rules/knowledge-base/entity-edit-addition
- rules/knowledge-base/entity-edit-succession
- rules/knowledge-base/entity-edit-correction
- rules/knowledge-base/entity-edit-removal
- rules/entity-workspace/a-field-is-changed-only-by-its-value
- rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
- rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
- rules/entity-workspace/a-save-failure-is-classified-by-its-code
- contracts/entity-workspace/bff-entity-reads
- rules/entity-workspace/a-failed-save-reads-its-wording
- rules/entity-workspace/a-change-writes-an-empty-member-as-null
- rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded
- rules/entity-workspace/the-listing-and-page-states-read-their-wording
- rules/entity-workspace/review-names-each-effect-in-its-wording
---
## What it is
The review lists each changed field with its previous and new value, its validity and its effect, and asks for a reason.
Confirming it starts a five-second undo window, after which the edit carrying one change per changed field is sent.
An accepted edit reloads the node, and a refused or unsent edit keeps every typed value.

## Notes
The five effect rules of the knowledge base are covered because the review states their effects, and they were outside the impact set the decomposer read.
