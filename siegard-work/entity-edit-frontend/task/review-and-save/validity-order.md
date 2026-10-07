---
title: Validity start precedes the end
summary: Where a changed field states both a validity start and end, a start not strictly earlier than the end puts a message on the end field and withholds the save.
rationale: I placed this check in the review epic, apart from the validity inputs, because the contract states its refusal on the review as a message and no save.
sources:
- intake/scope.md
objective: A changed field stating both a validity start and end whose start is not strictly earlier than the end shows a message on the end field and withholds the save.
criteria:
- A start that is not strictly earlier than the end shows a message on the validity end field.
- A start that is not strictly earlier than the end withholds the save.
- A start strictly earlier than the end does not raise this message.
- A field that states no validity end does not raise this message.
depends_on:
- task/entity-form/validity-fields
- task/review-and-save/review-reason
implements:
- rules/entity-workspace/validity-start-precedes-the-end
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
---
## What it is
The validity-order check that holds back a save.

## Notes
UNDERDETERMINED, from the specification — The criteria ask only for a message on the validity end field, and contracts/entity-workspace/entity-screen fixes the text as "O início deve ser anterior ao fim." Passes: an implementation that shows any other text on the end field and withholds the save.
UNDERDETERMINED, from the specification — The rule applies only when the owner gives both a validity start and a validity end, and no criterion covers a field with an end and a start the owner left unstated, which shows as today. Passes: an implementation that compares the start shown as today with an end of today or earlier and shows the message.
