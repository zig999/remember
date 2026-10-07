---
type: invariant
statement: "The review MUST name the effect of each changed field with the text the description writes for that effect, for a first value, an addition, a succession, a correction and a removal alike."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

The first value reads "Primeiro valor", the addition reads "Adição", the succession reads "Sucessão", the correction reads "Correção" and the removal reads "Remoção", each written exactly as here and with no ending punctuation.
This rule gives no text to the effect unchanged.
rules/entity-workspace/review-states-the-effect-of-each-change decides that the review states an effect for each changed field.
rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded decides which node state each effect is judged against, and the rules entity-edit-first-value, entity-edit-addition, entity-edit-succession, entity-edit-correction and entity-edit-removal under rules/knowledge-base/ decide which effect a change takes.
