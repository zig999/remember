---
target: backend
title: Record a removal
summary: A remove change now rejects only the attribute it names, marking it deleted and stamping its supersession time with the moment of the edit.
task: sha256:f2c57988c0e7d4106d73c7bf37b2aa15b2d8c500e9d7476bd06521d908f343b3
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-removal-build
files:
- path: src/modules/curation/repository/curation.repository.ts
  effect: Adds rejectAttributeAtEdit and AttributeRejectionArgs. The function updates one node_attribute row by id, setting status to deleted and superseded_at to a supplied edit moment. The update only matches a row whose status is active, uncertain or disputed. It touches no other row and reads no clock. Existing functions, including rejectItem, are unchanged.
- path: src/modules/curation/service/entity-edit-removal.ts
  effect: Adds recordRemoval(client, { attributeId, editedAt }). It rejects the named attribute at the edit moment inside the caller's transaction. It throws InvariantError if the update did not match exactly one live row, the same guard recordCorrection and recordSuccession use. It touches no sibling attribute and no other key.
criteria:
- criterion: The named attribute's status becomes deleted.
  met: true
  how: rejectAttributeAtEdit in src/modules/curation/repository/curation.repository.ts sets status = 'deleted' on the row whose id is the named attribute. recordRemoval in src/modules/curation/service/entity-edit-removal.ts calls it and refuses to continue unless exactly one row was updated.
- criterion: The named attribute's supersession time is the moment of the edit.
  met: true
  how: The same UPDATE sets superseded_at = $2::timestamptz, bound to the editedAt Date that recordRemoval passes through unchanged. The function never calls now(), so the stamp is the edit moment the caller supplies and the same moment the edit's other writes use.
- criterion: Removing one of a person's two active email attributes leaves the other email active.
  met: true
  how: The UPDATE is keyed by WHERE id = $1 alone, so the sibling email row is never matched. Its status, superseded_at and valid_to are untouched. No other attribute of the node or of any other key is written.
nodes:
- node: rules/knowledge-base/entity-edit-removal
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-removal.ts
  how: The rule's stored-state clauses are encoded. The named attribute is marked deleted and given the edit moment as its supersession time. The clause "with the effect removal" is not encoded here. decideChangeEffect in the already-delivered entity-edit-effect.ts returns "removal" for a remove change, and the task's REMAINDER note assigns reporting that effect to the task that reports applied changes.
- node: scenarios/knowledge-base/emptying-one-email-rejects-only-that-email
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-removal.ts
  how: The first two then-lines hold. The named email is marked deleted, and the other email stays active because the UPDATE is scoped to a single id. The third then-line, that the change is reported with the effect removal, is not reached by this task. It belongs to the task that reports each applied change.
- node: domain/knowledge-base/node-attribute
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: The write sets only the status and superseded_at fields of the node_attribute row. The attribute's value, validity, provenance and supersedes link are left as they were.
- node: domain/knowledge-base/assertion-status
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: The removal writes the existing value deleted, and applies only to a row whose status is active, uncertain or disputed. No new status is introduced, and nothing derived such as inactive is stored.
- node: domain/knowledge-base/attribute-change
  how: Honored, not encoded. The change's attribute_key, item_id and kind are read by the already-delivered validation and effect code. recordRemoval takes the resolved attribute id and the edit moment, not the raw change, so no field of the value object is declared or reshaped here.
- node: domain/knowledge-base/attribute-change-kind
  how: Honored, not encoded. The kind value remove is what routes a change to recordRemoval. That dispatch belongs to the orchestrating edit task, and this task adds no enumeration.
inferences:
- inferred: A new repository function, rejectAttributeAtEdit, takes the edit moment as an argument, rather than rejectItem being reused or widened.
  from: rejectItem reads now() inside its SQL, and the task requires the supersession time to be the edit moment. Giving rejectItem a time parameter would change the signature of a path used by reject_item and dispute resolution. supersedeAttributeAtEdit already sets the pattern of an edit-moment sibling.
- inferred: The status guard of the new UPDATE is active, uncertain and disputed, the same set rejectItem accepts. The disputed refusal stays with the already-delivered checkChangeAgainstHeldAttributes, which runs before the write.
  from: rejectItem in curation.repository.ts, and assertDisputeLeftToCuration in entity-edit-attributes.ts.
- inferred: valid_to is not set by a removal. Only status and superseded_at are written.
  from: The rule's statement names only the deleted marking and the supersession time. The scenario says a remove change reaches only the attribute it names.
- inferred: recordRemoval returns nothing and throws InvariantError if the update did not match one row, rather than returning a count.
  from: recordCorrection and recordSuccession in the same directory use the same guard after supersedeAttributeAtEdit.
divergences:
- from: 'MNT-03 as a convention: rejectAttributeAtEdit repeats the shape of rejectItem''s attribute branch in src/modules/curation/repository/curation.repository.ts'
  departure: The new UPDATE repeats the SET status and WHERE status guard of rejectItem's node_attribute branch, differing only in the supplied time.
  why: rejectItem cannot supply a caller's edit moment without changing a signature other paths depend on, and no clock may be read here. The sibling supersedeAttributeAtEdit already follows this pattern.
preserved:
- rejectItem and its callers, including reject_item and dispute handling in item.service.ts, still write superseded_at = now() unchanged.
- supersedeAttributeAtEdit, recordCorrection, recordSuccession and recordNewAttribute are unchanged and keep their behavior.
- Every other attribute of the node, and every key other than the one named, is never written by a removal.
deferred:
- what: Reporting the removal's effect and the removed attribute's id in the accepted answer's applied entries and in the curation action payload.
  why: The task's REMAINDER note assigns this to the task that reports each applied change's effect.
- what: Calling recordRemoval from the orchestrating edit flow.
  why: The dispatch of a change by kind and the transaction around it are not this task's objective. recordRemoval is the unit the dispatch calls.
---
## What it is
A remove change now rejects only the attribute it names, marking it deleted and stamping its supersession time with the moment of the edit.

## Notes
Inferred: A new repository function, rejectAttributeAtEdit, takes the edit moment as an argument, rather than rejectItem being reused or widened.
Inferred: The status guard of the new UPDATE is active, uncertain and disputed, the same set rejectItem accepts. The disputed refusal stays with the already-delivered checkChangeAgainstHeldAttributes, which runs before the write.
Inferred: valid_to is not set by a removal. Only status and superseded_at are written.
Inferred: recordRemoval returns nothing and throws InvariantError if the update did not match one row, rather than returning a count.
Departure: The new UPDATE repeats the SET status and WHERE status guard of rejectItem's node_attribute branch, differing only in the supplied time.
Deferred: Reporting the removal's effect and the removed attribute's id in the accepted answer's applied entries and in the curation action payload.
Deferred: Calling recordRemoval from the orchestrating edit flow.
