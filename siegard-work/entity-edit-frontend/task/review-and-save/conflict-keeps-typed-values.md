---
title: A conflict keeps what the owner typed
summary: A conflict answer to the edit leaves every typed value in the form and tells the owner the node changed since the form was opened.
rationale: I cut the conflict apart from the other save failures because it alone answers to a rule and a scenario of its own.
sources:
- intake/scope.md
objective: A conflict answer leaves every typed value in the form and tells the owner the node changed since the form was opened.
criteria:
- A conflict answer leaves every typed value in the form.
- A conflict answer shows an alert saying the node changed since the form was opened.
depends_on:
- task/review-and-save/undo-window
implements:
- rules/entity-workspace/a-conflict-keeps-the-typed-values
- scenarios/entity-workspace/a-conflict-keeps-what-the-owner-typed
- rules/entity-workspace/a-failed-save-reads-its-wording
- contracts/entity-workspace/entity-screen
- contracts/entity-workspace/bff-entity-edit
- domain/entity-workspace/entity-edit-session
---
## What it is
The form's answer to an edit the knowledge base refuses as a conflict.

## Notes
The inventory flags that the global MutationCache onError turns every BUSINESS_* code into a warning toast, which would be shown on top of the conflict alert.
UNDERDETERMINED, from the specification — The criterion does not give the conflict alert's exact text "Este nó mudou desde que você abriu o formulário." nor exclude the failure's own message. Passes: an alert reading O nó foi alterado por outra operação., or one that adds the server's BUSINESS_ENTITY_EDIT_CONFLICT message after the conflict sentence.
REMAINDER, from the specification — The clause of the wording rule for an edit that could not be sent belongs to the other-save-failures task.
ADVISORY, from the specification — The conflict is told apart from other refusals by the code BUSINESS_ENTITY_EDIT_CONFLICT, as bff-entity-edit states.
