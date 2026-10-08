---
target: backend
title: Record a succession
summary: recordSuccession supersedes the named attribute, gives it a validity end or a supersession time as its rule states, and records the new attribute naming it as the one it supersedes.
task: sha256:3c5e448466a0f4a1d32d05f5e811f28a3bde6f09cbbadf6afaf97f7faefb09f5
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-succession-build
files:
- path: src/modules/curation/service/entity-edit-succession.ts
  effect: New. recordSuccession(client, input) takes the usual new-attribute input plus the locked predecessor row. It reads the new attribute's validity start from validityOf. It closes the predecessor with the new start as its validity end, unless the predecessor holds a start and the new start is not later than it. Where it gives no end, it sets the supersession time to the edit moment. Where it gives an end, it leaves the supersession time unset. It then records the new attribute through recordNewAttribute, naming the predecessor as the one it supersedes. It returns the new attribute's id. It raises InvariantError if the key is not temporal or the predecessor was not live.
- path: src/modules/curation/service/entity-edit-new-attribute.ts
  effect: NewAttributeInput gains an optional supersedes id, which recordNewAttribute passes to the insert as supersedesAttributeId (null when absent, so a first value or an addition behaves as before). validityOf and RecordedValidity are now exported so the succession derives the same start the new attribute is recorded with.
- path: src/modules/curation/repository/curation.repository.ts
  effect: insertNewAttribute writes supersedes_attribute_id (NewAttributeArgs gains supersedesAttributeId). New supersedeAttributeAtEdit sets status superseded, sets valid_to to the given date when one is given and otherwise keeps it, and sets superseded_at to the supplied moment or to null. It only touches a row in status active, uncertain or disputed and returns the number of rows updated. It reads no clock.
criteria:
- criterion: The named attribute's status becomes superseded.
  met: true
  how: supersedeAttributeAtEdit in curation.repository.ts sets status = 'superseded'. recordSuccession calls it on predecessor.id before recording the new attribute.
- criterion: A succession that gives the superseded attribute no validity end gives it the moment of the supersession as its supersession time.
  met: true
  how: In recordSuccession, when validityEndGivenTo returns null, supersededAt is input.editedAt. The repository writes it to superseded_at.
- criterion: A succession that gives the superseded attribute a validity end leaves its supersession time unset.
  met: true
  how: In recordSuccession, when validityEndGivenTo returns a date, supersededAt is null. The repository writes null to superseded_at.
- criterion: The new attribute names the superseded attribute as the one it supersedes.
  met: true
  how: recordSuccession passes supersedes = predecessor.id to recordNewAttribute, which passes it to insertNewAttribute. The INSERT writes it to supersedes_attribute_id.
- criterion: The superseded attribute's validity end is the new attribute's validity start when that start falls later than the superseded attribute's start.
  met: true
  how: validityEndGivenTo returns newStart when newStart > predecessor.valid_from. This is an ISO date string comparison. newStart comes from validityOf, so it is the start the new attribute is recorded with.
- criterion: The superseded attribute is given no validity end when the new start falls on its start.
  met: true
  how: validityEndGivenTo returns null when newStart equals predecessor.valid_from, because the strict comparison is false. The repository COALESCE then leaves valid_to unchanged, and the predecessor gets the moment of the supersession as its supersession time.
- criterion: The superseded attribute is given no validity end when the new start falls earlier than its start.
  met: true
  how: validityEndGivenTo returns null when newStart < predecessor.valid_from. This is the same path as the previous criterion.
- criterion: A superseded attribute that holds no validity start is given the new attribute's validity start as its validity end.
  met: true
  how: validityEndGivenTo returns newStart when predecessor.valid_from === null.
- criterion: A superseded attribute that holds no validity start is left with its supersession time unset.
  met: true
  how: A predecessor with no start is always given an end, so supersededAt is null in recordSuccession.
- criterion: A project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start, gives a new deadline whose validity start is 2026-10-07.
  met: true
  how: validityOf, reached through recordNewAttribute, gives a temporal key with no stated start utcCalendarDateOf(editedAt), which is 2026-10-07.
- criterion: In that same edit the new deadline's validity-start basis is received.
  met: true
  how: validityOf sets valid_from_source to received when the change states no start.
- criterion: In that same edit the earlier deadline is given the validity end 2026-10-07.
  met: true
  how: The predecessor starts 2026-03-01 and 2026-10-07 is later, so validityEndGivenTo returns 2026-10-07 and the repository sets valid_to to it.
- criterion: In that same edit the earlier deadline's supersession time is left unset.
  met: true
  how: The predecessor is given an end, so supersededAt is null.
- criterion: A project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01, leaves the earlier status with no validity end.
  met: true
  how: 2026-09-01 is earlier than 2026-10-01, so validityEndGivenTo returns null and valid_to stays null.
- criterion: In that same edit the new status's validity start is 2026-09-01.
  met: true
  how: validityOf records the stated valid_from unchanged.
- criterion: In that same edit the new status's validity-start basis is stated.
  met: true
  how: validityOf sets valid_from_source to stated when the change states a start.
- criterion: In that same edit the earlier status is given the moment of the supersession as its supersession time.
  met: true
  how: No end is given, so supersededAt is input.editedAt.
nodes:
- node: rules/knowledge-base/entity-edit-succession
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
  - src/modules/curation/repository/curation.repository.ts
  how: recordSuccession supersedes the named attribute and records a new active attribute that names it through supersedes_attribute_id. The effect label succession is assigned by decideChangeEffect, which already exists, and is outside this task.
- node: rules/knowledge-base/entity-edit-succession-closes-the-previous
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
  how: validityEndGivenTo gives the end at the new start, and withholds it only when the predecessor holds a start and the new start is on or before it.
- node: rules/knowledge-base/entity-edit-supersession-time
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
  - src/modules/curation/repository/curation.repository.ts
  how: The supersession time is the edit moment, passed in as an argument, when no end is given. It is unset when an end is given. The correction side of the rule is not reached here.
- node: rules/knowledge-base/entity-edit-start-defaults-to-today
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: The succession takes the new start from the existing validityOf, which defaults to the UTC calendar date of the edit moment with basis received. The predecessor's end is that same date.
- node: rules/knowledge-base/entity-edit-stated-start-is-stated
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: A stated start is recorded as given with basis stated, by the existing validityOf that the succession reuses.
- node: rules/knowledge-base/entity-edit-new-attribute-state
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  - src/modules/curation/service/entity-edit-succession.ts
  how: The succession records the new attribute through recordNewAttribute, so it is active at confidence 1.0 under the LLM run of the note. This task adds no code of its own for it.
- node: rules/knowledge-base/entity-edit-provenance
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: recordNewAttribute attaches the note's information fragment as provenance, and the succession goes through it. The correction clause of the rule is not reached.
- node: rules/knowledge-base/entity-edit-stated-end-is-held
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: validityOf records the end the change states, or none, for the new attribute. The succession passes the same change through unchanged. The superseded attribute's end is derived separately.
- node: scenarios/knowledge-base/temporal-edit-without-a-date-starts-today
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
  how: The new deadline starts 2026-10-07 with basis received, and the earlier deadline gets the end 2026-10-07 with its supersession time unset. The reported effect line belongs to assign-change-effect and apply-entity-edit.
- node: scenarios/knowledge-base/backdated-start-supersedes-without-an-end
  encoded_at:
  - src/modules/curation/service/entity-edit-succession.ts
  how: A start earlier than the predecessor's start gives the predecessor no end and the moment of the supersession as its supersession time. The new attribute starts 2026-09-01 with basis stated.
- node: domain/knowledge-base/node-attribute
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: 'The succession writes only existing columns of node_attribute: status, valid_to, superseded_at and supersedes_attribute_id. No schema change.'
- node: domain/knowledge-base/assertion-status
  how: The predecessor becomes superseded and the new attribute active, both values of the existing status vocabulary.
- node: domain/knowledge-base/attribute-change
  how: The succession reads the change's valid_from and valid_to through validityOf and adds no field to the change.
inferences:
- inferred: recordSuccession takes the already-locked predecessor row (ItemLockedRow) as an argument and does not reload it. It returns the new attribute's id.
  from: The inventory convention that a write service locks rows with loadItemsForUpdate and passes them on. checkNamedAttribute already loads and locks the named row, and decideChangeEffect already takes ItemLockedRow.
- inferred: The predecessor is updated first and the new attribute inserted second, in one caller-owned transaction.
  from: The new row needs the predecessor's id only, and the order does not trip the current-duplicate guard, because a succession always states a different value.
- inferred: The new attribute's validity start is read from validityOf, and a null start (a key that is not temporal) is refused with InvariantError rather than defaulted.
  from: decideChangeEffect assigns succession only to temporal keys, so a null start is a caller bug and not a business refusal. InvariantError is the convention for that case in the sibling helpers.
- inferred: A new repository function, supersedeAttributeAtEdit, was added instead of reusing supersedePredecessor.
  from: supersedePredecessor writes now() and cannot set valid_to. The task requires the edit moment as an argument and requires the end to be set.
- inferred: Validity starts are compared as ISO date strings.
  from: ItemLockedRow carries valid_from as text (valid_from::text), and the change DTO carries ISO date strings. The sibling attribute-change-validity.ts already compares dates this way.
preserved:
- recordNewAttribute for a first value or an addition still writes supersedes_attribute_id as null, with the same status, confidence, run, provenance and validity as before.
- validityOf behaves as before and is now exported only.
- supersedePredecessor, insertCorrectedRow and the existing correction functions in curation.repository.ts are untouched, so correct_item still uses now() and leaves valid_to unchanged.
- insertNewAttribute keeps the same column order and parameters 1 to 10, and appends supersedes_attribute_id as $11.
deferred:
- what: Wiring recordSuccession into the entity-edit apply flow and reporting the effect succession with the item_id and predecessor_id of the applied entry.
  why: Belongs to assign-change-effect and apply-entity-edit. This task delivers the recording step only.
- what: The existing spec entity-edit-new-attribute.spec.ts parses the INSERT column list. It sees the added supersedes_attribute_id column, and its first-value case still expects null.
  why: No test was written or changed here, since tests belong to another judge. A fake client in the succession tests must also answer the UPDATE that supersedeAttributeAtEdit issues, and must report rowCount 1.
---
## What it is
recordSuccession supersedes the named attribute, gives it a validity end or a supersession time as its rule states, and records the new attribute naming it as the one it supersedes.

## Notes
Inferred: recordSuccession takes the already-locked predecessor row (ItemLockedRow) as an argument and does not reload it. It returns the new attribute's id.
Inferred: The predecessor is updated first and the new attribute inserted second, in one caller-owned transaction.
Inferred: The new attribute's validity start is read from validityOf, and a null start (a key that is not temporal) is refused with InvariantError rather than defaulted.
Inferred: A new repository function, supersedeAttributeAtEdit, was added instead of reusing supersedePredecessor.
Inferred: Validity starts are compared as ISO date strings.
Deferred: Wiring recordSuccession into the entity-edit apply flow and reporting the effect succession with the item_id and predecessor_id of the applied entry.
Deferred: The existing spec entity-edit-new-attribute.spec.ts parses the INSERT column list. It sees the added supersedes_attribute_id column, and its first-value case still expects null.
