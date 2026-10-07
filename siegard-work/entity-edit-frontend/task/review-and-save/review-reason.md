---
title: Review requires a trimmed reason
summary: The review's reason field, which holds the save back until the trimmed reason has 1 to 1000 characters.
rationale: I cut the reason apart from the review's listing because it answers to its own rule. Sending the reason trimmed sits with the edit payload, which is where the reason is sent.
sources:
- intake/scope.md
objective: The review offers the save only while its reason holds between 1 and 1000 characters once trimmed.
criteria:
- The review holds a field for the reason.
- The save is not offered while the trimmed reason holds no character.
- The save is not offered while the trimmed reason holds more than 1000 characters.
- A trimmed reason of 1 to 1000 characters does not withhold the save.
depends_on:
- task/review-and-save/review-of-changes
implements:
- rules/entity-workspace/review-requires-a-trimmed-reason
- domain/entity-workspace/entity-edit-session
- contracts/entity-workspace/entity-screen
---
## What it is
The reason gate of the review.

## Notes
It follows the reason-field pattern in src/features/curation/components/CorrectionForm/CorrectionForm.tsx.
UNDERDETERMINED, from the specification — The criteria count the reason in characters, while the rule counts between 1 and 1000 UTF-16 code units once trimmed. Passes: a review that counts Unicode code points and offers the save for a reason of 1000 code points outside the Basic Multilingual Plane.
REMAINDER, from the specification — The clause that the reason is sent trimmed belongs to the edit-payload task, whose criterion The reason is sent trimmed answers it.
ADVISORY, from the specification — The contract's refusal answer words only the empty side of the reason limit, and the implementer must not invent a message for the over-length case.
