---
target: backend
title: Proof for deciding each accepted change's effect
summary: Unit tests over the pure decideChangeEffect decision and the edit-effect, assertion-status, live-status and change-kind enumerations, covering all thirteen criteria and the UNDERDETERMINED ended-attribute note.
implementation: sha256:313a141363e922167aa30cfe67a84b4be3bfda43653a2e4874a72c6617e32baf
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-assign-change-effect-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives first-value to a set change naming no attribute when the key holds no attribute
  proves: A set change naming no attribute, to a key of which the node holds no live attribute, gets the effect first-value. This is the empty-collection class.
  fails_when: decideChangeEffect returns anything but first-value for an unnamed set over an empty attribute list
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives first-value to a set change naming no attribute when the key holds only superseded and deleted attributes
  proves: 'The ''no live attribute'' boundary of criterion 1: superseded and deleted attributes do not count as held.'
  fails_when: the decision stops filtering by live status and treats a superseded or deleted attribute as one the key holds
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives addition to a set change naming no attribute whose value no live attribute holds, on a multi-current key holding a live attribute
  proves: A set change naming no attribute, whose value no active or uncertain attribute of its key holds, to a key that allows multiple current values of which the node holds a live attribute, gets the effect addition.
  fails_when: an unnamed new value on a multi-current key with a live attribute gets any effect other than addition
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives addition when the only holder of the stated value is a deleted attribute and another attribute is live
  proves: 'Criterion 2: only an active or uncertain attribute holding the value makes the change unchanged, so a deleted holder does not.'
  fails_when: the value-holder test stops restricting itself to active and uncertain live attributes, so a deleted holder gives unchanged
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives addition when only a disputed attribute of a multi-current key holds the stated value
  proves: A set change naming no attribute, whose value only a disputed attribute of its key holds, to a key that allows multiple current values, gets the effect addition.
  fails_when: a disputed holder is counted as a value holder and the change gets unchanged
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives unchanged when an active attribute of a multi-current key holds the stated value and no attribute is named
  proves: A set change naming no attribute, whose value an active attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
  fails_when: an active holder of the stated value gives addition, or any effect other than unchanged
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives unchanged when an uncertain attribute of a multi-current key holds the stated value and no attribute is named
  proves: A set change naming no attribute, whose value an uncertain attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
  fails_when: an uncertain holder of the stated value gives addition, or any effect other than unchanged
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives succession to a set change naming a current attribute of a temporal key with another value
  proves: A set change naming a current attribute of a temporal key with another value gets the effect succession.
  fails_when: a current named attribute of a temporal key gets correction or any effect other than succession
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives succession to a set change naming a current attribute of a temporal key that allows multiple current values with another value
  proves: A set change naming a current attribute of a temporal key that allows multiple current values with another value gets the effect succession.
  fails_when: allows_multiple_current changes the effect of a named current attribute of a temporal key away from succession
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives correction to a set change naming a current attribute of a key that is not temporal with another value
  proves: A set change naming a current attribute of a key that is not temporal with another value gets the effect correction.
  fails_when: a current named attribute of a non-temporal key gets succession or any effect other than correction
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives correction to a set change naming an active attribute of a temporal key with a validity end and no supersession time and another value
  proves: A set change naming an active attribute of a temporal key that holds a validity end and no supersession time, with another value, gets the effect correction.
  fails_when: an ended active attribute of a temporal key gets succession because the ended-attribute case is tested after, or instead of, the temporality case
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives correction to a set change naming an uncertain attribute of a temporal key with a validity end and no supersession time and another value
  proves: 'The UNDERDETERMINED note: an ended-attribute correction depends on a live status, not only active, so an uncertain ended attribute of a temporal key gets correction rather than succession.'
  fails_when: the ended-attribute correction is narrowed to the active status, so an uncertain ended attribute of a temporal key falls through to the temporality test and gets succession
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives correction to a set change naming an active attribute of a key that is not temporal with a validity end and no supersession time and another value
  proves: 'The UNDERDETERMINED note: an ended-attribute correction applies whatever its key, so an ended attribute of a non-temporal key gets correction as an ended attribute.'
  fails_when: the ended-attribute correction is narrowed to temporal keys, so an ended attribute of a non-temporal key gets no ended-attribute treatment and gets any effect other than correction
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives unchanged to a set change whose value is character for character the value of the attribute it names
  proves: A set change whose value is, character for character, the value of the attribute it names gets the effect unchanged.
  fails_when: a named attribute whose own value is stated gets any effect other than unchanged
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives unchanged to a set change stating the own value of a named attribute that has a validity end
  proves: 'Criterion 8 as stated, with no restriction to current attributes: an ended named attribute with its own value is unchanged, not corrected.'
  fails_when: the ended-attribute correction is tested before the own-value comparison, so an ended attribute stated with its own value gets correction
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives correction when the value differs from the named attribute's own only in letter case on a key that is not temporal
  proves: A set change naming a current attribute of a key that is not temporal, with a value that differs from that attribute's own only in letter case, gets the effect correction.
  fails_when: the value comparison folds case, so a case-only difference gets unchanged
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives unchanged to a set change naming an attribute with its own value and another validity start
  proves: A set change naming an attribute with that attribute's own value and another validity start gets the effect unchanged.
  fails_when: the stated validity start takes part in the decision, so an own value with another validity start gets succession or correction
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: gives removal to a remove change naming one of several live attributes of the key
  proves: A remove change gets the effect removal, whichever other attributes of the key are held.
  fails_when: a remove change gets any effect other than removal, or the effect depends on the other attributes held
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: holds exactly the six edit effects
  proves: domain/knowledge-base/edit-effect declares exactly first-value, addition, succession, correction, removal and unchanged.
  fails_when: EditEffectSchema gains, loses or renames one of the six values
  demonstrates: domain/knowledge-base/edit-effect
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: holds exactly the five assertion statuses
  proves: domain/knowledge-base/assertion-status declares exactly active, uncertain, disputed, superseded and deleted.
  fails_when: AssertionStatusSchema gains, loses or renames one of the five values
  demonstrates: domain/knowledge-base/assertion-status
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: holds exactly active, uncertain and disputed as the live statuses
  proves: domain/knowledge-base/live-assertion-status declares exactly active, uncertain and disputed, and the decision reuses that single definition.
  fails_when: LIVE_STATUSES gains or loses a status, for example drops disputed or admits superseded
  demonstrates: domain/knowledge-base/live-assertion-status
- file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
  name: holds exactly set and remove as the change kinds
  proves: domain/knowledge-base/attribute-change-kind declares exactly set and remove.
  fails_when: AttributeChangeKindSchema gains, loses or renames one of the two values
  demonstrates: domain/knowledge-base/attribute-change-kind
not_applicable:
- edge_case: absent or empty input to the decision (an unnamed set over an empty attribute list)
  why: the empty-list case is a criterion 1 class and is tested. A set change with no value and a missing change cannot reach the decision, because the body schema refuses them at the boundary (EDG-01).
- edge_case: a duplicate where uniqueness is claimed
  why: no criterion or node claims uniqueness in this decision. Whether a second value of a single-current key is refused belongs to the checks task.
- edge_case: a dependency that fails or answers slowly
  why: decideChangeEffect is pure and reads no store, clock or client, so it has no dependency to fail.
- edge_case: two operations against one subject at once
  why: concurrency is the lock of the writing act, which is deferred. A pure function has no shared state to race on.
- edge_case: a named attribute that carries a supersession time, or one that is not live, or a second value for a single-current key
  why: no criterion or node assigns an effect to these cases, and the checks task refuses them first. They are recorded under untested as an implementation inference.
- edge_case: validity end versus start boundaries of the change (valid_to, valid_from > valid_to)
  why: the effect does not read the change's validity. Criterion 10 covers the one stated validity case, and validity ordering is the checks task's.
untested:
- 'domain/knowledge-base/attribute-change: a value object whose fact is its field shape and the responsibility of carrying one field of the entity form. The decision reads the fields but does not decide the shape, and the existing edit-entity.dto.spec.ts covers its schema under the DTO task. No test here claims it.'
- 'domain/knowledge-base/attribute-key: an aggregate root whose fact is the catalog shape of an attribute key. This task only reads is_temporal and allows_multiple_current from a given row, which criteria 4 to 7 exercise as inputs. No finite test of this task decides the node whole.'
- 'domain/knowledge-base/node-attribute: an aggregate root whose fact is the stored shape of an attribute and what it holds. The decision reads value, status, valid_to and superseded_at from given rows, and no test of this task decides the node''s fact whole.'
- 'rules/knowledge-base/entity-edit-first-value, entity-edit-addition, entity-edit-succession, entity-edit-correction, entity-edit-ended-attribute-correction, entity-edit-unchanged-records-nothing, entity-edit-removal: each rule''s statement also holds a recording clause (a new active attribute naming the superseded one, nothing recorded for unchanged, the attribute marked deleted with a supersession time). The task''s REMAINDER note assigns those clauses to the writing act, and no test of a pure effect decision decides them. The effect clause of each is tested through the criteria and is not claimed as the node''s whole fact.'
- 'rules/knowledge-base/current-assertion: it governs node attributes and knowledge links, and a test here could only observe it indirectly, as succession versus correction on a named attribute. The knowledge-link half is outside this task, so no finite test here decides the fact whole.'
- 'rules/knowledge-base/unrecorded-temporality-is-not-temporal: the implementation adds no default of its own and reads a boolean from the catalog row, which the implementation record gives as the catalog snapshot''s concern. A test would need a row with is_temporal missing, forced through a type cast, and would pin that choice, so none is written.'
- 'scenarios/knowledge-base/stable-key-edit-is-a-correction: the scenario''s thens include superseding the earlier attribute without a validity end and recording a new active attribute that names it. Those belong to the deferred writing act, and the effect correction alone is covered by the criterion 6 test, so the scenario is not claimed whole.'
- 'scenarios/knowledge-base/emptying-one-email-rejects-only-that-email: the scenario''s thens mark only the named email deleted and leave the other active. That is a store write belonging to the deferred writing act. The removal effect alone is tested, so the scenario is not claimed whole.'
- 'Inference about behavior, not pinned by a test: a set change naming no attribute, to a single-current key that already holds a live attribute, throws InvariantError. So does a change naming an attribute that is not live, or one that carries a supersession time while its value changes. No node assigns an effect or a refusal to these states in this decision, because the checks task refuses them earlier.'
- 'Inference about behavior, not pinned by a test: a disputed attribute counts as live for the named branches (an own-value change naming a disputed attribute would give unchanged, and another value would be decided by its validity end). No node decides whether such a change reaches this decision, and the task''s ADVISORY note says the checks decide it.'
- 'Inference about behavior, not pinned by a test: allows_multiple_current is read from the catalog row with no special case for the keys named by rules/knowledge-base/multi-current-attribute-keys. That node is outside what the task implements, so no node of this task decides how an unrecorded multiplicity is read.'
- 'Inference about arrangement, given no test: EditEffectSchema sits in the edit-entity DTO and LIVE_STATUSES is exported from entity-edit-attributes.ts. A test over placement would pin the arrangement.'
---
## What it is
Unit tests over the pure decideChangeEffect decision and the edit-effect, assertion-status, live-status and change-kind enumerations, covering all thirteen criteria and the UNDERDETERMINED ended-attribute note.

## Notes
None.
