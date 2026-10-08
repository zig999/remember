---
target: backend
title: Record a correction
summary: recordCorrection supersedes the named attribute at the edit moment, records a new attribute that names it as the one it supersedes, and gives the new attribute the predecessor's provenance plus the edit's fragment.
task: sha256:9a2820671173b4ab0eff55ab7af430b260cd9e6dd86dc02c34db324f9f624f13
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-correction-build
files:
- path: src/modules/curation/service/entity-edit-correction.ts
  effect: Adds recordCorrection(client, input). It supersedes the predecessor with supersedeAttributeAtEdit, passing validTo null and supersededAt equal to the edit moment, so its validity end is never touched. It then records the new attribute through recordNewAttribute with supersedes set to the predecessor's id, and copies the predecessor's provenance onto it with copyProvenance. It returns the new attribute's id. It refuses with an InvariantError when the predecessor was not live, before the new attribute is inserted. It runs in the caller's transaction and reads no clock.
criteria:
- criterion: The named attribute's status becomes superseded.
  met: true
  how: recordCorrection calls supersedeAttributeAtEdit in curation.repository.ts, whose UPDATE sets status = 'superseded' on the named attribute.
- criterion: The named attribute's supersession time is the moment of the supersession.
  met: true
  how: 'recordCorrection passes supersededAt: input.editedAt, and supersedeAttributeAtEdit writes it to superseded_at. The moment is an argument, not a clock read.'
- criterion: A correction of an attribute that already holds a validity end gives it the moment of the supersession as its supersession time.
  met: true
  how: The same call passes validTo null, and the UPDATE's COALESCE($2::date, valid_to) keeps the existing validity end. superseded_at is set to the edit moment unconditionally, so an attribute that held a validity end and no supersession time leaves with both.
- criterion: The new attribute names the superseded attribute as the one it supersedes.
  met: true
  how: 'recordNewAttribute is called with supersedes: predecessor.id, which insertNewAttribute writes to supersedes_attribute_id.'
- criterion: An organization's active cnpj with no validity, corrected to another cnpj, keeps no validity end once superseded.
  met: true
  how: validTo is passed as null and COALESCE keeps the predecessor's null valid_to, so the superseded cnpj has no validity end.
- criterion: In that same edit the new attribute holds the other cnpj.
  met: true
  how: recordNewAttribute inserts change.value as the new attribute's value on the predecessor's node and key, which come from the edit's target.
- criterion: The new attribute holds every provenance of the superseded attribute.
  met: true
  how: copyProvenance(client, "attribute", predecessor.id, attributeId) inserts a provenance row on the new attribute for each fragment of the predecessor.
- criterion: The new attribute holds a provenance pointing at the edit's information fragment.
  met: true
  how: recordNewAttribute calls appendProvenanceFragment with note.fragmentId on the new attribute, so the edit's fragment is held alongside the copied ones.
nodes:
- node: rules/knowledge-base/entity-edit-correction
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  how: 'The supersede-then-record step of a correction: the named attribute is superseded and a new active attribute is recorded naming it as the one it supersedes. The new attribute''s status is the one recordNewAttribute assigns (active, confidence 1.0), never the predecessor''s. Deciding which set change is a correction and reporting the effect are decideChangeEffect''s and the edit-entity answer''s, not this task''s.'
- node: rules/knowledge-base/entity-edit-ended-attribute-correction
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  how: recordCorrection serves this trigger as it serves the stable-key one, because it never reads the key or the predecessor's validity. The predecessor's validity end is preserved. The new attribute's validity is left to recordNewAttribute and validityOf, as the rule's description says.
- node: rules/knowledge-base/entity-edit-supersession-time
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  how: The superseded attribute's superseded_at is the edit moment. The rule's clause about leaving it unset when the edit gives a validity end concerns succession, and a correction gives none, so it is not reached here.
- node: rules/knowledge-base/entity-edit-provenance
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  how: The new attribute holds the edit's fragment (appended by recordNewAttribute) and every provenance of the superseded attribute (copied by copyProvenance).
- node: scenarios/knowledge-base/stable-key-edit-is-a-correction
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  how: 'The first two thens are answered: the earlier cnpj is superseded and keeps no validity end, and a new active attribute holds the other cnpj and names the earlier one. The third then, reporting the effect correction, belongs to the effect-sorting task and is not reached.'
- node: domain/knowledge-base/node-attribute
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  how: 'Uses the shape already declared: status, superseded_at, valid_to, provenance and the supersedes relationship. No attribute is added.'
- node: domain/knowledge-base/assertion-status
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  how: The superseded attribute takes superseded, and the new one takes active from ENTITY_EDIT_ATTRIBUTE_STATUS in entity-edit-new-attribute.ts. No clock-dependent status is stored.
inferences:
- inferred: The new attribute is recorded as active at confidence 1.0 regardless of the predecessor's status, so an uncertain predecessor is not copied onto it.
  from: entity-edit-correction and entity-edit-ended-attribute-correction both say a correction is recorded as a new active attribute, and entity-edit-new-attribute-state says an edit records every new attribute as active at 1.0. This is the UNDERDETERMINED option the notes say the specification refuses, and it is avoided.
- inferred: The supersession moment is the edit moment passed in as editedAt, the same instant the new attribute's validity default and the succession path use.
  from: The advisory note says no node distinguishes the moment of supersession from the moment of the edit. entity-edit-succession.ts passes input.editedAt as supersededAt in the same way, and the edit runs in a single transaction.
- inferred: A predecessor that is no longer live is refused with an InvariantError and not corrected.
  from: The same guard in recordSuccession, and supersedeAttributeAtEdit's WHERE status IN ('active','uncertain','disputed') returning a count of 0.
- inferred: The existing supersedePredecessor and insertCorrectedRow are not reused. They stamp now(), insert with recorded_at = now() and a null created_by_run_id, and copy the predecessor's values by COALESCE. The edit needs the edit moment, the edit's LLM run and the edit's own value and validity.
  from: curation.repository.ts as read, against entity-edit-supersession-time and the recordNewAttribute contract. copyProvenance is reused as it stands.
preserved:
- supersedePredecessor, insertCorrectedRow and copyProvenance in curation.repository.ts keep their signatures and behavior for correct_item, and the repository file is not edited.
- recordNewAttribute, recordSuccession and supersedeAttributeAtEdit are called unchanged.
- No schema, migration or seed is touched.
deferred:
- what: Deciding that a set change is a correction (the trigger clauses of the two rules and of the scenario) and reporting it with the effect correction in the edit's applied list.
  why: The task's notes assign it to the task that sorts set changes into effects. decideChangeEffect already returns correction, and recordCorrection is not wired to it here.
---
## What it is
recordCorrection supersedes the named attribute at the edit moment, records a new attribute that names it as the one it supersedes, and gives the new attribute the predecessor's provenance plus the edit's fragment.

## Notes
Inferred: The new attribute is recorded as active at confidence 1.0 regardless of the predecessor's status, so an uncertain predecessor is not copied onto it.
Inferred: The supersession moment is the edit moment passed in as editedAt, the same instant the new attribute's validity default and the succession path use.
Inferred: A predecessor that is no longer live is refused with an InvariantError and not corrected.
Inferred: The existing supersedePredecessor and insertCorrectedRow are not reused. They stamp now(), insert with recorded_at = now() and a null created_by_run_id, and copy the predecessor's values by COALESCE. The edit needs the edit moment, the edit's LLM run and the edit's own value and validity.
Deferred: Deciding that a set change is a correction (the trigger clauses of the two rules and of the scenario) and reporting it with the effect correction in the edit's applied list.
