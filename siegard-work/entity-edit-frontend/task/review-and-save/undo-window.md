---
title: The edit is sent only after five seconds without undo
summary: Confirming the review shows a recorded notice with a five-second undo, and sends the edit only once the window passes without an undo.
rationale: I cut the timing of the send apart from its payload because the undo window and the change mapping answer to different rules and change independently.
sources:
- intake/scope.md
objective: A confirmed edit is sent only after five seconds without an undo, and an undo sends nothing and leaves the form as it was.
criteria:
- Confirming the review shows a notice that the edit is recorded.
- The notice offers an undo.
- The undo is offered for five seconds.
- No edit is sent before five seconds have passed.
- The edit is sent once five seconds pass without an undo.
- An undo within the five seconds sends no edit.
- An undo within the five seconds leaves the form holding the owner's typed values.
depends_on:
- task/knowledge-base-client/edit-request
- task/review-and-save/review-reason
implements:
- rules/entity-workspace/saving-waits-for-undo
- scenarios/entity-workspace/undo-within-five-seconds-sends-nothing
- domain/entity-workspace/entity-edit-session
- contracts/entity-workspace/entity-screen
- rules/entity-workspace/the-listing-and-page-states-read-their-wording
---
## What it is
The delayed send that makes undo possible without a second edit.

## Notes
It reuses the UndoToast and the five-second window constant at src/features/curation/components/UndoToast/UndoToast.tsx; the orchestration in src/features/curation/hooks/useDecisionDispatch.tsx is the model.
No node states what happens when the owner leaves the page during the five seconds. Curation sends on unmount, and the inventory flags this as a decision still to make.
UNDERDETERMINED, from the specification — The criteria name neither the notice text "Edição registrada." nor the undo label "Desfazer" that the wording rule fixes. Passes: a notice reading Alterações salvas! with an undo action labelled Voltar.
UNDERDETERMINED, from the specification — The rule says an undo leaves the form as it was, and the criterion checks only the typed values, not the reason typed in the review or the state of the review. Passes: an undo that keeps every field value but clears the reason or drops the owner back to a blank review.
REMAINDER, from the specification — The clauses of the wording rule for the listing and page alerts, loading indications and try-again labels belong to the listing and page tasks.
ADVISORY, from the specification — The reload and the refusals of save-edit belong to the tasks implementing the reload, conflict and failure rules.
ADVISORY, from the specification — No node says what happens to an edit still waiting for its undo window if the owner leaves the page, whether it is sent or dropped, and the criteria do not depend on it.
