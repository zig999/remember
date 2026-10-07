---
title: Review states the effect of each change
summary: Each changed field in the review states whether its change will be recorded as a first value, an addition, a succession, a correction or a removal.
rationale: I cut the effects apart from the review's listing because they change when the knowledge base's classification of edit effects changes.
sources:
- intake/scope.md
objective: The review states for each changed field the effect its change will have.
criteria:
- The review states one effect for each changed field.
- Each stated effect is a first value, an addition, a succession, a correction or a removal.
- A field of a temporal key that started from a current attribute and was changed to a non-empty value other than the one it started with is stated as a succession.
- A field of a key that is not temporal that started from a current attribute and was changed to a non-empty value other than the one it started with is stated as a correction.
- A field given a value for a key of which the node holds no attribute with a live status, active, uncertain or disputed, is stated as a first value.
- A field added to a multi-valued key of which the node holds an attribute with a live status, with a value no active or uncertain attribute of that key holds, is stated as an addition.
- A field emptied after starting with a value is stated as a removal.
- A field removed after starting with a value is stated as a removal.
depends_on:
- task/review-and-save/review-of-changes
- task/entity-form/multi-valued-fields
implements:
- rules/entity-workspace/review-states-the-effect-of-each-change
- rules/entity-workspace/review-names-each-effect-in-its-wording
- rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded
- rules/knowledge-base/entity-edit-first-value
- rules/knowledge-base/entity-edit-addition
- rules/knowledge-base/entity-edit-succession
- rules/knowledge-base/entity-edit-correction
- rules/knowledge-base/entity-edit-removal
- domain/knowledge-base/edit-effect
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
---
## What it is
The effect each change will have, shown to the owner before saving.

## Notes
The impact-set rule names the five effects without saying when each applies. The case criteria are read from rules/knowledge-base/entity-edit-first-value, entity-edit-addition, entity-edit-succession, entity-edit-correction and entity-edit-removal, which lie outside the impact set.
UNDERDETERMINED, from the specification — No criterion says which state of the node the review judges against, which the rule decided is the node as the form loaded it, whatever the other changes of the same edit. Passes: a review that judges each field against the node as the earlier fields would leave it and states the second of two added fields as an addition.
UNDERDETERMINED, from the specification — The criteria give no text for the effects, while the wording rule fixes Primeiro valor, Adição, Sucessão, Correção and Remoção, each with no ending punctuation. Passes: a review that labels the effects First value or Substituição, or with an ending period.
REMAINDER, from the specification — The recording clauses of the five knowledge-base effect rules belong to the backend act of applying an entity edit.
ADVISORY, from the specification — A key's temporality, whether it allows several current values, and the live statuses are stated by domain/knowledge-base/attribute-key and domain/knowledge-base/live-assertion-status, outside the candidates.
ADVISORY, from the specification — The effect the review predicts and the change the save sends must come from the same field-to-change mapping, which the edit-payload task owns.
Decision, beyond the covers — stand: domain/knowledge-base/attribute-key is not claimed by the epic, because its is_temporal and allows_multiple_current flags reach the review through the catalog read that the knowledge-base-client epic implements.
Decision, beyond the covers — stand: domain/knowledge-base/live-assertion-status is not claimed by the epic, because its live statuses are stated by the knowledge-base rules that this task implements, and the node is read only through them.
