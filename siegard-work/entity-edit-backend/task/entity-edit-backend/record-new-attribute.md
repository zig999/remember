---
title: Record a first value or an addition
summary: A first value or an addition is recorded as a new active attribute at confidence 1.0 under the edit's run, pointing at the edit's fragment and holding the validity start its rules state.
rationale: Planning cut the recording of a new attribute away from the writes that supersede or reject one. Succession and correction build on it, and it can be shown working with no predecessor.
sources:
- intake/scope.md
objective: A first value or an addition of an edit is recorded as a new attribute in the state the entity-edit rules state.
criteria:
- The new attribute's status is active.
- The new attribute's confidence is 1.0.
- The new attribute is recorded under the edit's LLM run.
- The new attribute holds a provenance pointing at the edit's information fragment.
- A set change to a temporal key that states no validity start is recorded with today as its validity start.
- A set change to a temporal key that states no validity start is recorded with the basis received.
- A set change that states a validity start is recorded with that start.
- A set change that states a validity start is recorded with the basis stated.
- A first value supersedes no attribute.
- An addition leaves every other attribute of its key as it was.
depends_on:
- task/entity-edit-backend/record-operator-note
implements:
- rules/knowledge-base/entity-edit-new-attribute-state
- rules/knowledge-base/entity-edit-first-value
- rules/knowledge-base/entity-edit-addition
- rules/knowledge-base/entity-edit-provenance
- rules/knowledge-base/entity-edit-start-defaults-to-today
- rules/knowledge-base/entity-edit-stated-start-is-stated
- rules/knowledge-base/entity-edit-stated-end-is-held
- rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity
- rules/knowledge-base/unrecorded-temporality-is-not-temporal
- domain/knowledge-base/node-attribute
- domain/knowledge-base/attribute-change
---
## What it is
A first value or an addition is recorded as a new active attribute at confidence 1.0 under the edit's run, pointing at the edit's fragment and holding the validity start its rules state.

## Notes
UNDERDETERMINED, from the specification — Criterion 9 says only 'today'. rules/knowledge-base/entity-edit-start-defaults-to-today states that today is 'the UTC calendar date of the moment of the edit'. As written, the criterion lets the date be read in any time zone. Implementation that meets every criterion and that the specification refuses: An implementation that records the unstated validity start as the calendar date in the server's local time zone, for example America/Sao_Paulo. Close to midnight UTC, this records the day before the UTC calendar date of the moment of the edit. The criterion still passes because that date is 'today' locally.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — No criterion covers the validity end of the new attribute. rules/knowledge-base/entity-edit-stated-end-is-held says the new attribute holds the validity end the set change states, and holds none when the change states none. No sibling skeleton covers this clause either. record-succession only covers the end given to the superseded attribute. Implementation that meets every criterion and that the specification refuses: An implementation that records a first value or an addition to a temporal key with no validity end even though the set change stated one. It could also copy some other date into the end. Either way, every criterion passes.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — Criteria 9 and 10 only cover temporal keys, and criteria 11 and 12 only cover a stated start. No criterion covers what a new attribute of a key that is not temporal holds. rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity says it holds no validity start, no validity end and no validity-start basis. rules/knowledge-base/unrecorded-temporality-is-not-temporal says a key with no recorded temporality counts as not temporal. Implementation that meets every criterion and that the specification refuses: An implementation that gives every new attribute without a stated start today's date and the basis received, whatever its key's temporality. A stable key's first value, such as a cnpj, then holds a validity start and a basis, and every criterion still passes.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/entity-edit-new-attribute-state says 'every new attribute' an entity edit records is active at confidence 1.0 under the edit's run. This task only covers first values and additions. Neither record-succession nor record-correction has a criterion on the status, confidence or run of the new attribute it records. Belongs to: record-succession and record-correction, for the new attribute each of those effects records.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/entity-edit-provenance has a clause for corrections: 'when it is a correction, every provenance of the attribute it supersedes'. Its fragment clause also applies to the new attribute of a succession. This task answers the fragment clause only for first values and additions. record-correction answers both clauses for corrections. No criterion in record-succession answers the fragment clause for a succession's new attribute. Belongs to: record-correction, for the clause on the superseded attribute's provenance. record-succession, for the fragment provenance of a succession's new attribute.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/entity-edit-first-value and rules/knowledge-base/entity-edit-addition each state two things: the condition that makes a change a first value or an addition, and the effect it carries ('with the effect first-value' / 'with the effect addition'). The condition covers live attributes of the key, a key allowing multiple current values, and a value no active or uncertain attribute holds. Neither the condition nor the effect is a criterion of this task. Belongs to: assign-change-effect
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
