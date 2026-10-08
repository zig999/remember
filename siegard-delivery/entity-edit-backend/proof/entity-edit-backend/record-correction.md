---
target: backend
title: Proof for recording a correction
summary: Unit tests over an in-memory pg client show that recordCorrection supersedes the named attribute at the edit moment and records an active new attribute that names it and holds the other value. Its provenance is the edit's fragment plus every provenance of the superseded attribute, checked against a store that evaluates the copy's selection.
implementation: sha256:af2045d7b44bceac1b026154913b0ba3ea3b05e8ef279ff475ff4b215436c159
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-correction-suite-2
tests:
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: the status of the attribute a correction supersedes becomes superseded
  proves: The named attribute's status becomes superseded.
  fails_when: recordCorrection leaves the named attribute live, or marks it with any status other than superseded.
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: the supersession time of the attribute a correction supersedes is the moment of the supersession when the attribute holds no validity end
  proves: The named attribute's supersession time is the moment of the supersession.
  fails_when: The superseded attribute's superseded_at is left unset, is read from the clock, or is any instant other than the edit moment passed in.
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: the supersession time of the attribute a correction supersedes is the moment of the supersession when the attribute already holds a validity end
  proves: A correction of an attribute that already holds a validity end gives it the moment of the supersession as its supersession time.
  fails_when: An attribute holding a validity end and no supersession time is left with its supersession time unset, as a succession leaves it, or is stamped with anything but the edit moment.
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: the new attribute a correction records names the superseded attribute as the one it supersedes
  proves: The new attribute names the superseded attribute as the one it supersedes.
  fails_when: The new attribute's supersedes_attribute_id is left empty or names an attribute other than the predecessor.
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: an organization's active cnpj with no validity, corrected to another cnpj keeps no validity end once superseded
  proves: An organization's active cnpj with no validity, corrected to another cnpj, keeps no validity end once superseded.
  fails_when: The supersession gives the earlier cnpj a validity end, for example today's date or the edit date, as a succession would.
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: an organization's active cnpj with no validity, corrected to another cnpj is replaced in that edit by a new attribute holding the other cnpj
  proves: In that same edit the new attribute holds the other cnpj.
  fails_when: The new attribute holds the earlier cnpj, holds no value, or is not recorded.
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: the provenance of the new attribute an entity edit records holds the edit's information fragment, and for a correction every provenance of the superseded attribute and no other
  proves: 'Criteria "The new attribute holds every provenance of the superseded attribute" and "The new attribute holds a provenance pointing at the edit''s information fragment", and the remainder of rules/knowledge-base/entity-edit-provenance in both assertions the auditor named. An edit that sets an attribute the node does not yet hold gives the new attribute a provenance holding the edit''s fragment. A correction of an attribute holding two provenance rows gives the new attribute both of them and the edit''s own, and none belonging to an unrelated attribute. The store evaluates the copy statement as written: the insert''s target columns, the select list, and the WHERE column and its bound parameter. It does not copy every row whatever the statement says.'
  fails_when: A first value's new attribute omits the edit's fragment. A correction's new attribute omits the edit's fragment, omits either provenance of the superseded attribute, copies a provenance that belongs to an unrelated attribute (the copy's selection is not bounded to the superseded attribute), or copies the provenance in the wrong direction so that the new attribute does not hold what the predecessor held.
  demonstrates: rules/knowledge-base/entity-edit-provenance
- file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  name: the state of the new attribute a correction records is active even when the superseded attribute was uncertain and held a validity end
  proves: The UNDERDETERMINED note, that the new attribute is recorded as active. An uncertain predecessor holding a validity end must not pass its status on.
  fails_when: The implementation copies the superseded attribute's status onto the new attribute, so that an uncertain predecessor yields an uncertain new attribute.
not_applicable:
- edge_case: A correction of an attribute that already holds a validity end, as a criterion on whether that end is preserved
  why: No criterion or node states that a correction preserves a validity end already held. Criterion 5 covers only the case of no validity, so preservation is not asserted.
- edge_case: An empty or absent value in the change
  why: recordNewAttribute refuses a set change with no value, and that refusal belongs to the task that records a new attribute. No criterion of this task reaches it.
- edge_case: A predecessor with no provenance
  why: No criterion or node states what a correction of such an attribute holds beyond the edit's fragment. The provenance test already holds that fragment.
- edge_case: A predecessor and a new attribute that would hold the same fragment (a duplicate provenance row)
  why: No criterion or node of this task states how a fragment already held is treated. The edit's fragment is a fresh fragment of the edit, never one the predecessor held, so the uniqueness of a provenance row is not reached by an obligation here.
- edge_case: Two corrections of one attribute at once
  why: Concurrency is guarded by the caller's lock and transaction, and no criterion or node of this task states concurrent behaviour.
- edge_case: A dependency that fails or answers slowly
  why: recordCorrection runs in the caller's transaction and handles no driver failure itself. No criterion states a behaviour for it.
untested:
- 'rules/knowledge-base/entity-edit-correction: the rule''s fact holds a trigger (a current attribute of a key that is not temporal, with a value other than its own) and the effect correction in the edit''s applied list. recordCorrection reads neither the key nor the effect, so no finite test over this task decides the fact whole. The task''s own Notes assign that decision to the task that sorts set changes into effects.'
- 'rules/knowledge-base/entity-edit-ended-attribute-correction: the same trigger and effect clauses (a live status, a validity end and no supersession time, whatever the key) belong to the effect-sorting task. A test here would decide only the supersede-and-record part.'
- 'rules/knowledge-base/entity-edit-supersession-time: the rule''s second clause, ''leaves its supersession time unset only when the edit itself gives that attribute a validity end'', concerns a succession. A correction never gives a validity end, so no test here decides the clause. The task''s Notes record it as a remainder for the succession task.'
- 'scenarios/knowledge-base/stable-key-edit-is-a-correction: the first two thens are covered by the cnpj tests, but the third, ''the change is reported with the effect correction'', belongs to the effect-sorting task. A test here would assert part of the scenario as the whole, so none is claimed.'
- 'domain/knowledge-base/node-attribute: a declared shape (value, status, recorded_at, provenance, validity, supersedes) spanning several tasks. No finite test of this task decides it whole.'
- 'domain/knowledge-base/assertion-status: an enumeration of status values that no finite test of this task decides. The tests exercise only the two values this task writes, superseded and active.'
- 'rules/knowledge-base/entity-edit-provenance, beyond the two assertions the remainder named: the fact speaks of every entity edit''s new attribute, and the test reaches the first-value path and the correction path. A succession''s new attribute takes the edit''s fragment through the same recordNewAttribute call, but that path is the succession task''s and no test here exercises it.'
- 'Inference about behaviour, recorded as unproven and not pinned: a predecessor that is no longer live is refused with an InvariantError before the new attribute is inserted. No node or criterion decides this refusal, so a test would make the suite its only home.'
- 'Inference about behaviour, recorded as unproven: the supersession moment is the edit moment passed in as editedAt. The advisory note says no node distinguishes the moment of supersession from the moment of the edit, so the tests assert only the passed instant that the criterion names.'
- The statements the tests' in-memory client stands in for are interpreted by a small evaluator in the spec, not by PostgreSQL. The real UPDATE with COALESCE($2::date, valid_to), the ON CONFLICT clause of the provenance insert, the database's own evaluation of the copy's SELECT, and transaction rollback are decided only by a real database. The Neon database is shared with another session and was not touched.
- The new attribute's validity (the change's own) is left to neighbour nodes by the task's advisory note, and no criterion here sets it, so none is tested.
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  departure: The file sits at src/__tests__/unit/curation/entity-edit-correction.spec.ts rather than mirroring the unit's full path under a unit/modules/curation/service subtree.
  why: Every sibling spec for the entity-edit services (entity-edit-succession.spec.ts, entity-edit-new-attribute.spec.ts and others) sits in src/__tests__/unit/curation/. Mirroring the full path for one file would split the suite across two layouts.
---
## What it is
Unit tests over an in-memory pg client show that recordCorrection supersedes the named attribute at the edit moment and records an active new attribute that names it, holds the other value, and holds the edit's fragment plus every provenance of the superseded attribute. The client's copy statement is evaluated as written, so a copy that is not bounded to the superseded attribute fails.

## Notes
This is the proof-only re-delivery for the remainder on rules/knowledge-base/entity-edit-provenance. The implementation is untouched. In src/__tests__/unit/curation/entity-edit-correction.spec.ts, the in-memory client's provenance copy now parses the INSERT ... SELECT and evaluates its target columns, select list, WHERE column and bound parameter. Before, it hard-coded the copy as "rows of the first parameter to the second parameter". A provenance row of an unrelated attribute is seeded in every scenario, so a copy that ignored its WHERE clause would add the stranger's fragment and fail the test. The earlier provenance test asserted a subset (arrayContaining) and is replaced by the test named above, which also covers a first value, where the new attribute holds exactly the edit's fragment. That assertion calls recordNewAttribute, whose own proof is the new-attribute task's. It sits here because the auditor named this file for the remainder, and it is the only way one test can hold the node's fact on both of its paths.

The remainder this proof closes was left by the review whose reconciliation record is siegard-reconcile/entity-edit-backend.md (rules/knowledge-base/entity-edit-provenance, remainder testable). The earlier proof was written against the same implementation record and its suite run is run/entity-edit-backend-record-correction-suite; this rewrite reruns the suite as run/entity-edit-backend-record-correction-suite-2, which passed.
