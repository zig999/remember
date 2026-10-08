---
title: Provenance upsert infers the partial unique index
summary: The four INSERT INTO provenance ... ON CONFLICT clauses in the curation repository now repeat their partial unique index's predicate, so recording an already-held fragment as provenance leaves one entry and no longer raises an error.
target: backend
task: sha256:781ec11ffe256386eaf08b5ef4185f47e7be377d1b21eb99f1380f027c5040f7
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/provenance-conflict-predicate-record-provenance-once-per-fragment-build
files:
- path: src/modules/curation/repository/curation.repository.ts
  effect: 'copyProvenance and appendProvenanceFragment, in both their link and attribute branches, now state the predicate of the partial unique index in their ON CONFLICT target: WHERE link_id IS NOT NULL on the link clauses and WHERE attribute_id IS NOT NULL on the attribute clauses. The statements are therefore matched to provenance_link_fragment_uq and provenance_attr_fragment_uq, and a fragment the item already holds as provenance is skipped by DO NOTHING instead of failing the operation. Nothing else in the file changed.'
criteria:
- criterion: An entity edit that records a new attribute records the fragment of the edit's operator note as the provenance of that attribute.
  met: true
  how: 'recordNewAttribute in src/modules/curation/service/entity-edit-new-attribute.ts (line 83) already calls appendProvenanceFragment with the operator note''s fragmentId, and I did not change that file. The only change is the repository statement it runs: its ON CONFLICT target now carries WHERE attribute_id IS NOT NULL, so the insert is accepted and the provenance row is written. I did not run it, since I have no shell. The result is read from the statement and from the index definition in migrations/0001_init.sql lines 484-485.'
- criterion: Recording a fragment as the provenance of an attribute that already holds it as provenance leaves one provenance entry for that attribute and that fragment.
  met: true
  how: The attribute branches of appendProvenanceFragment and copyProvenance use ON CONFLICT (attribute_id, fragment_id) WHERE attribute_id IS NOT NULL DO NOTHING, which is exactly provenance_attr_fragment_uq (UNIQUE (attribute_id, fragment_id) WHERE attribute_id IS NOT NULL). A repeated fragment hits the conflict and inserts no second row. The operation does not raise an error, and the count returned is 0 for the skipped row.
- criterion: Recording a fragment as the provenance of a link that already holds it as provenance leaves one provenance entry for that link and that fragment.
  met: true
  how: The link branches of appendProvenanceFragment and copyProvenance use ON CONFLICT (link_id, fragment_id) WHERE link_id IS NOT NULL DO NOTHING, matching provenance_link_fragment_uq (UNIQUE (link_id, fragment_id) WHERE link_id IS NOT NULL).
- criterion: A corrected attribute takes the provenance entries of the attribute it supersedes.
  met: true
  how: entity-edit-correction.ts line 36 and item.service.ts line 314 call copyProvenance(client, 'attribute', predecessor, successor). Its INSERT ... SELECT now has an ON CONFLICT target that matches the partial index, so the copy completes and skips any fragment the successor already holds. For example, when the edit's own fragment was written before the copy and is also one of the predecessor's, the copy skips it and no error stops the correction.
- criterion: A corrected link takes the provenance entries of the link it supersedes.
  met: true
  how: item.service.ts line 314 calls copyProvenance with item_kind 'link'. The link branch of its INSERT ... SELECT now has the matching predicate and skips fragments the successor link already holds.
nodes:
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: The invariant is kept by the existing unique index provenance_attr_fragment_uq. The attribute ON CONFLICT clauses in copyProvenance and appendProvenanceFragment now name that index's predicate, so a repeated fragment is skipped and no second entry is written.
- node: rules/knowledge-base/link-provenance-once-per-fragment
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: The invariant is kept by provenance_link_fragment_uq. The link ON CONFLICT clauses in both functions now name its predicate and skip a repeated fragment.
- node: rules/knowledge-base/entity-edit-provenance
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: The new attribute of an entity edit gets the edit's fragment through appendProvenanceFragment, and a correction's new attribute gets the predecessor's provenance through copyProvenance. This delivery corrects the statements both calls run, so the policy is no longer blocked by the error raised on a repeated fragment. The callers in the service layer were not changed.
- node: rules/knowledge-base/corrected-item-provenance
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: copyProvenance gives the new item every provenance of the superseded item, and appendProvenanceFragment adds the cited fragment where item.service.ts cites one. Both now complete when a fragment is already held. The clause about the cited fragment was not otherwise reached (see deferred).
- node: domain/knowledge-base/provenance
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  how: 'The provenance row keeps its shape: link_id or attribute_id, fragment_id, created_at. Only the target of the upsert changed.'
- node: domain/knowledge-base/node-attribute
  how: 'The work only honors it: an attribute is the provenance owner in the attribute branches of the upsert. The entity''s shape was not touched and no file declaring it was changed.'
- node: domain/knowledge-base/knowledge-link
  how: 'The work only honors it: a link is the provenance owner in the link branches. Its shape was not touched.'
- node: domain/knowledge-base/entity-edit
  how: The work did not touch the entity edit's flow. The edit's callers, which are recordNewAttribute and the correction in entity-edit-correction.ts, run the corrected statements unchanged.
- node: domain/knowledge-base/information-fragment
  how: The fragment is only referenced by fragment_id in the upsert. Its status and lifecycle were not reached by this delivery.
- node: domain/knowledge-base/assertion-correction
  how: The correction path in item.service.ts and entity-edit-correction.ts was not changed. It benefits because the copy and the cited-fragment append no longer fail on a fragment the successor already holds.
inferences:
- inferred: Postgres infers a partial unique index for ON CONFLICT only when the conflict target repeats the index predicate, so adding WHERE link_id IS NOT NULL and WHERE attribute_id IS NOT NULL to the four clauses is what makes the upsert match provenance_link_fragment_uq and provenance_attr_fragment_uq.
  from: the index definitions in migrations/0001_init.sql lines 482-485 and the decision recorded in the delegation, which bounds the work to repeating the predicate.
- inferred: A repeated fragment is treated as a skip, not a refusal, so the operation recording it again succeeds. The matter is left to this reading because no criterion asks for an error or a success.
  from: the task's objective ('without refusing to record a fragment it already holds') and the existing DO NOTHING in all four clauses.
preserved:
- copyProvenance and appendProvenanceFragment keep their signatures and still return the number of rows inserted, 0 when the fragment was already held.
- A new provenance row is still written with created_at = now() for a fragment the item does not yet hold.
- The unique indexes in migrations/0001_init.sql are untouched, and no migration or schema change was made.
- The service callers (entity-edit-new-attribute.ts, entity-edit-correction.ts, item.service.ts) and every other file are untouched.
- The ON CONFLICT (node_id, alias_norm) DO NOTHING statement at line 91 of the same file keeps working unchanged.
deferred:
- what: The second clause of rules/knowledge-base/corrected-item-provenance, the cited information fragment, has no criterion of its own. The task's notes mark this as UNDERDETERMINED.
  why: The task's objective and criteria do not reach it, and no code was changed for it.
- what: The unit test doubles (src/__tests__/unit/curation/edit-entity-world.ts and reaffirm-consolidation-world.ts) match statements by regular expression and by the text 'ON CONFLICT'. I did not read them for the new WHERE clause in the conflict target.
  why: I was told to write no tests and no fixtures, and a stand-in outside the files named for this correction is not mine to change. The caller's run will show whether any of them needs adjusting.
---
## What it is
The four provenance upserts of the curation repository now repeat the predicate of the partial unique index they depend on.

## Notes
This was a corrective increment over backend/src/modules/curation/repository/curation.repository.ts and changes four lines.
The implementer had no shell and ran nothing; the build run above was captured afterwards by the delivery.
The implementer's return spelled one index name wrongly in a file effect; the delivery corrected the spelling to provenance_link_fragment_uq before writing the record.
