---
target: backend
title: Record a first value or an addition as a new attribute
summary: A new entity-edit service helper inserts the new active attribute at confidence 1.0 under the edit's run, with its validity as the rules state it and a provenance pointing at the edit's fragment.
task: sha256:92b35d7acb64283958ab8be21f9622a71490e2ba5cbab49f0d0b5732b0bcebe9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-new-attribute-build
files:
- path: src/modules/curation/service/entity-edit-new-attribute.ts
  effect: recordNewAttribute(client, input) inserts one node_attribute for a set change and appends a provenance row to the edit's fragment. The attribute is active, at confidence 1.0, created by the edit's LLM run, supersedes no attribute and touches no other attribute. For a temporal key it records the stated validity start with basis stated, or the UTC calendar date of the edit moment with basis received when none is stated, and records the stated validity end or none. For a key that is not temporal it records no validity start, end or basis. It returns the new attribute's id.
- path: src/modules/curation/repository/curation.repository.ts
  effect: Adds insertNewAttribute, a parameterized INSERT into node_attribute that sets no supersedes_attribute_id and returns the new id. It also imports the ValidFromSource type. Every existing function is unchanged.
- path: src/modules/curation/service/attribute-change-validity.ts
  effect: utcCalendarDateOf is now exported so the new-attribute helper reuses the one UTC-date derivation instead of copying it. Its behavior is unchanged.
criteria:
- criterion: The new attribute's status is active.
  met: true
  how: recordNewAttribute passes ENTITY_EDIT_ATTRIBUTE_STATUS ("active") as the status to insertNewAttribute, which casts it to assertion_status in the INSERT.
- criterion: The new attribute's confidence is 1.0.
  met: true
  how: recordNewAttribute passes ENTITY_EDIT_ATTRIBUTE_CONFIDENCE (1.0), and insertNewAttribute writes it to the confidence column.
- criterion: The new attribute is recorded under the edit's LLM run.
  met: true
  how: created_by_run_id is set from note.llmRunId, the run recordOperatorNote returned (OperatorNoteRecord.llmRunId).
- criterion: The new attribute holds a provenance pointing at the edit's information fragment.
  met: true
  how: recordNewAttribute calls the existing appendProvenanceFragment(client, "attribute", attributeId, note.fragmentId), which inserts the provenance row for the new attribute and the note's fragment.
- criterion: A set change to a temporal key that states no validity start is recorded with today as its validity start.
  met: true
  how: validityOf, for a temporal key with change.valid_from undefined, sets validFrom to utcCalendarDateOf(editedAt). That is the UTC calendar date of the edit moment, which the caller passes in. The helper reads no clock and uses no local time zone.
- criterion: A set change to a temporal key that states no validity start is recorded with the basis received.
  met: true
  how: validityOf returns validFromSource "received" (DEFAULTED_START_BASIS) on that branch.
- criterion: A set change that states a validity start is recorded with that start.
  met: true
  how: validityOf returns change.valid_from unchanged as validFrom when it is stated on a temporal key.
- criterion: A set change that states a validity start is recorded with the basis stated.
  met: true
  how: validityOf returns validFromSource "stated" (STATED_START_BASIS) when change.valid_from is present.
- criterion: A first value supersedes no attribute.
  met: true
  how: insertNewAttribute does not set supersedes_attribute_id, so it is NULL. recordNewAttribute issues no UPDATE, so no existing row is superseded.
- criterion: An addition leaves every other attribute of its key as it was.
  met: true
  how: The helper's only writes are one INSERT into node_attribute and one INSERT into provenance for the new row. It updates, supersedes and locks no other attribute.
nodes:
- node: rules/knowledge-base/entity-edit-new-attribute-state
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: ENTITY_EDIT_ATTRIBUTE_STATUS, ENTITY_EDIT_ATTRIBUTE_CONFIDENCE and createdByRunId = the edit's run are the state of every attribute recordNewAttribute writes. It is called here for first values and additions only. Succession and correction will call it for their new attributes.
- node: rules/knowledge-base/entity-edit-first-value
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  - src/modules/curation/repository/curation.repository.ts
  how: 'The recording half is encoded: a new active attribute that names no attribute it supersedes (insertNewAttribute leaves supersedes_attribute_id NULL). The condition and the effect label first-value are decided by decideChangeEffect, delivered earlier under assign-change-effect, and are not touched here.'
- node: rules/knowledge-base/entity-edit-addition
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  - src/modules/curation/repository/curation.repository.ts
  how: 'The recording half is encoded: a new active attribute beside the others, with the helper closing or changing none. The condition and the effect label addition belong to decideChangeEffect and are not touched here.'
- node: rules/knowledge-base/entity-edit-provenance
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: The new attribute gets provenance of the edit's fragment through appendProvenanceFragment. The correction clause (copying the superseded attribute's provenance) is not reached, because this task records no correction.
- node: rules/knowledge-base/entity-edit-start-defaults-to-today
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  - src/modules/curation/service/attribute-change-validity.ts
  how: For a temporal key with no stated start, validityOf records utcCalendarDateOf(editedAt) with basis received. The UTC derivation is the one in attribute-change-validity.ts, now exported.
- node: rules/knowledge-base/entity-edit-stated-start-is-stated
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: A stated validity start is recorded as stated, with the basis "stated".
- node: rules/knowledge-base/entity-edit-stated-end-is-held
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: validityOf records change.valid_to as the new attribute's valid_to, and null when the change states none. It does not touch the validity end of any superseded attribute.
- node: rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: For a key where is_temporal is false, validityOf returns NO_VALIDITY, so valid_from, valid_to and valid_from_source are all null. The change's own values are ignored for such a key. They are already refused earlier by checkChangeValidity.
- node: rules/knowledge-base/unrecorded-temporality-is-not-temporal
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: The temporal branch is taken only when attributeKey.is_temporal is truthy, so a key with no recorded temporality takes the no-validity branch.
- node: domain/knowledge-base/node-attribute
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: 'insertNewAttribute (NewAttributeArgs) writes the shape of a literal value about a node: value, status, confidence, valid_from, valid_to, valid_from_source, created_by_run_id and an empty supersedes. Provenance is the rows appended for it. The columns already exist, so no schema was touched.'
- node: domain/knowledge-base/attribute-change
  encoded_at:
  - src/modules/curation/service/entity-edit-new-attribute.ts
  how: recordNewAttribute reads a set change's value, valid_from and valid_to as the DTO delivered earlier shapes them. attribute_key and item_id are not read here, because the caller resolves the key and has already decided that no attribute is named.
inferences:
- inferred: recordNewAttribute never decides the effect and does not check whether the change is a first value or an addition. The caller invokes it only for those two effects.
  from: The task's REMAINDER note assigns the first-value and addition condition and effect to assign-change-effect, which delivered decideChangeEffect. This task's criteria cover only what the recorded attribute holds.
- inferred: The new attribute's value is stored as the change states it, with no canonicalisation. The value type comes from the attribute key's catalog row.
  from: The ingestion insertAttributeRow stores args.value as given, and checkChangeAgainstCatalog already validated the value against the key's type and domain before recording.
- inferred: recorded_at is left to the column default (now()) and is not passed from the edit moment.
  from: insertAttributeRow in graph-consolidation.service.ts and insertCorrectedRow rely on the column default or now(). No node ties recorded_at to the edit's moment.
- inferred: The new status and confidence constants are declared in the new helper's own file instead of reusing OPERATOR_NOTE_CONFIDENCE.
  from: entity-edit-note-confidence says the note's confidence and entity-edit-new-attribute-state says the attributes' confidence are two separate rules, so sharing one constant would couple them.
- inferred: The helper takes a ValidFromSource basis of "stated" for any stated start on a temporal key. The change carries no basis field of its own.
  from: entity-edit-stated-start-is-stated says the basis is "stated", and AttributeChange (the DTO delivered earlier) has no valid_from_source field.
preserved:
- insertCorrectedRow, copyProvenance, appendProvenanceFragment and every other existing function of curation.repository.ts keep their SQL and behavior. Only a function and an import were added.
- checkChangeValidity keeps its behavior. utcCalendarDateOf was exported and its body is unchanged.
- recordOperatorNote and OperatorNoteRecord are used as delivered, with no change.
- No migration or DDL was written. The existing node_attribute columns and CHECK constraints (basis required when valid_from is set, valid_from < valid_to) are honored by the inserted values.
deferred:
- what: No entry point calls recordNewAttribute yet. Orchestrating the edit, which means running the checks, deciding the effect, calling recordOperatorNote and then this helper for first-value and addition changes, is outside this task.
  why: The task's objective is the recording of a new attribute. Wiring it into the edit's transaction belongs to a later task of the epic.
- what: The new attributes of a succession or a correction (state, run, fragment provenance, copied provenance, supersedes) are not recorded. Neither is the end given to a superseded attribute.
  why: The task's notes assign them to record-succession and record-correction.
- what: The spec fixes no time zone or clock source for the caller's editedAt beyond "the moment of the edit". The helper derives the UTC date from whatever Date it receives.
  why: The caller is responsible for the edit moment, as the task's guidance states. This task reads no clock.
---
## What it is
A new entity-edit service helper inserts the new active attribute at confidence 1.0 under the edit's run, with its validity as the rules state it and a provenance pointing at the edit's fragment.

## Notes
Inferred: recordNewAttribute never decides the effect and does not check whether the change is a first value or an addition. The caller invokes it only for those two effects.
Inferred: The new attribute's value is stored as the change states it, with no canonicalisation. The value type comes from the attribute key's catalog row.
Inferred: recorded_at is left to the column default (now()) and is not passed from the edit moment.
Inferred: The new status and confidence constants are declared in the new helper's own file instead of reusing OPERATOR_NOTE_CONFIDENCE.
Inferred: The helper takes a ValidFromSource basis of "stated" for any stated start on a temporal key. The change carries no basis field of its own.
Deferred: No entry point calls recordNewAttribute yet. Orchestrating the edit, which means running the checks, deciding the effect, calling recordOperatorNote and then this helper for first-value and addition changes, is outside this task.
Deferred: The new attributes of a succession or a correction (state, run, fragment provenance, copied provenance, supersedes) are not recorded. Neither is the end given to a superseded attribute.
Deferred: The spec fixes no time zone or clock source for the caller's editedAt beyond "the moment of the edit". The helper derives the UTC date from whatever Date it receives.
