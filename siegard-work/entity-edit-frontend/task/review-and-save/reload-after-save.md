---
title: A saved edit reloads the node
summary: After the knowledge base accepts the edit, the node is read again and the form starts over from the values now current.
rationale: I cut the reload apart from the send because it answers to its own rule and changes when what follows an accepted edit changes.
sources:
- intake/scope.md
objective: After an accepted edit the form starts again from the values the node now holds.
criteria:
- An accepted edit causes the knowledge node to be read again.
- After an accepted edit every field starts from the node's value now current.
depends_on:
- task/review-and-save/undo-window
- task/entity-form/entity-page
implements:
- rules/entity-workspace/a-saved-edit-reloads-the-entity
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
- contracts/entity-workspace/bff-entity-reads
---
## What it is
The return to a fresh form after a saved edit.

## Notes
UNDERDETERMINED, from the specification — Neither criterion says that each field's item_id and started_with are taken from the attribute now current after an accepted edit. Passes: a reload that shows the current values but keeps each field's item_id from before the save, so the next edit names a superseded attribute and is refused as a conflict.
UNDERDETERMINED, from the specification — Neither criterion says the rest of the session starts over, with the review closed and the reason cleared. Passes: a reload that resets the fields but keeps the reason and leaves the review open.
ADVISORY, from the specification — A failed reload after the save is answered by the show-entity-form refusals and the read-node refusals, and no criterion here addresses it.
