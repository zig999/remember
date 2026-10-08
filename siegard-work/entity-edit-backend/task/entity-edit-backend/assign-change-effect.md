---
title: Decide each accepted change's effect
summary: Each change that passed the checks is assigned the effect its rules state, from the node's live attributes of its key.
rationale: Planning cut the effect decision away from the writes. The decision changes with the rules that choose an effect, the writes change with how each effect is stored, and the decision can be shown working on given attributes without the store.
sources:
- intake/scope.md
objective: Each accepted change of an edit is given the one effect its rules state.
criteria:
- A set change naming no attribute, to a key of which the node holds no live attribute, gets the effect first-value.
- A set change naming no attribute, whose value no active or uncertain attribute of its key holds, to a key that allows multiple current values of which the node holds a live attribute, gets the effect addition.
- A set change naming no attribute, whose value only a disputed attribute of its key holds, to a key that allows multiple current values, gets the effect addition.
- A set change naming a current attribute of a temporal key with another value gets the effect succession.
- A set change naming a current attribute of a temporal key that allows multiple current values with another value gets the effect succession.
- A set change naming a current attribute of a key that is not temporal with another value gets the effect correction.
- A set change naming an active attribute of a temporal key that holds a validity end and no supersession time, with another value, gets the effect correction.
- A set change whose value is, character for character, the value of the attribute it names gets the effect unchanged.
- A set change naming a current attribute of a key that is not temporal, with a value that differs from that attribute's own only in letter case, gets the effect correction.
- A set change naming an attribute with that attribute's own value and another validity start gets the effect unchanged.
- A set change naming no attribute, whose value an active attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
- A set change naming no attribute, whose value an uncertain attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
- A remove change gets the effect removal.
implements:
- domain/knowledge-base/edit-effect
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-change-kind
- domain/knowledge-base/attribute-key
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
- domain/knowledge-base/live-assertion-status
- rules/knowledge-base/entity-edit-first-value
- rules/knowledge-base/entity-edit-addition
- rules/knowledge-base/entity-edit-succession
- rules/knowledge-base/entity-edit-correction
- rules/knowledge-base/entity-edit-ended-attribute-correction
- rules/knowledge-base/entity-edit-unchanged-records-nothing
- rules/knowledge-base/entity-edit-removal
- rules/knowledge-base/current-assertion
- rules/knowledge-base/unrecorded-temporality-is-not-temporal
- scenarios/knowledge-base/stable-key-edit-is-a-correction
- scenarios/knowledge-base/emptying-one-email-rejects-only-that-email
---
## What it is
Each change that passed the checks is assigned the effect its rules state, from the node's live attributes of its key.

## Notes
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-ended-attribute-correction says a set change gets the effect correction when it names an attribute with a live status, a validity end and no supersession time and states another value, "whatever its key". The only criterion for this case is narrower: 'A set change naming an active attribute of a temporal key that holds a validity end and no supersession time, with another value, gets the effect correction.' No criterion covers an uncertain attribute with a validity end and no supersession time. No criterion covers such an attribute of a key that is not temporal either. Criteria 8 and 9 do not reach these cases, because they need the named attribute to be current, and an attribute with a validity end is not current under rules/knowledge-base/current-assertion. Implementation that meets every criterion and that the specification refuses: An implementation that gives correction to an ended attribute only when its status is active and its key is temporal. Otherwise it falls through to a key-temporality test. A change naming an uncertain attribute of a temporal key, with a validity end and no supersession time, then gets succession. A change naming an ended attribute of a key that is not temporal gets no ended-attribute treatment. Every criterion still passes.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — Some clauses of the candidate rules say how each effect is written to the store, and no criterion of this task reaches them. They are: rules/knowledge-base/entity-edit-first-value 'is recorded as a new active attribute that names no attribute as the one it supersedes'; rules/knowledge-base/entity-edit-addition 'is recorded as a new active attribute beside the others ... and closes none'; rules/knowledge-base/entity-edit-succession, rules/knowledge-base/entity-edit-correction and rules/knowledge-base/entity-edit-ended-attribute-correction 'supersedes it and is recorded as a new active attribute that names it as the one it supersedes'; rules/knowledge-base/entity-edit-unchanged-records-nothing 'records nothing'; rules/knowledge-base/entity-edit-removal 'rejects the attribute it names, marking it deleted and giving it the moment of the edit as its supersession time'. This task's criteria answer only the effect clause of each rule. Belongs to: The act that writes each accepted change to the edited node's attributes once its effect is decided. That act records the new attribute and supersedes or rejects the named one. It records nothing for unchanged.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Criteria 6, 7, 15 and 16 turn on whether a key allows multiple current values. domain/knowledge-base/attribute-key declares allows_multiple_current as an optional boolean. No candidate says how to read a key that does not record it. rules/knowledge-base/unrecorded-temporality-is-not-temporal settles this only for temporality. The fact that fixes which keys allow multiple values is rules/knowledge-base/multi-current-attribute-keys ('exactly email and phone of Person'), and it is outside the candidates. If the executor must rely on it, the epic's claim grew.
Decision, beyond the covers — stand: rules/knowledge-base/multi-current-attribute-keys, specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Seam with the checks task. rules/knowledge-base/entity-edit-unchanged-records-nothing gives the effect unchanged to a change that names an attribute with a live status and states its own value. domain/knowledge-base/live-assertion-status counts disputed as live. rules/knowledge-base/entity-edit-leaves-disputes-to-curation forbids changing a disputed attribute, and its log entry decides that 'an edit that names one' is refused as disputed. This task's criterion 12 applies only to changes that already passed the checks. So whether a change naming a disputed attribute with that attribute's own value ever reaches this task is decided by the checks, not here.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
