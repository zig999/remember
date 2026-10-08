---
target: backend
title: Proof for recording a removal
summary: Unit tests over a fake pg client that executes the removal's UPDATE statement hold that the named attribute becomes deleted with the edit moment as its supersession time, and that its sibling email and an attribute of another key are not touched.
implementation: sha256:9f59563df06f591069cae76729f6c24e922700752ced330a9b5a4633649fe758
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-removal-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
  name: the status of the attribute a removal names becomes deleted
  proves: The named attribute's status becomes deleted.
  fails_when: recordRemoval leaves the named attribute's status as it was, writes any value other than deleted (superseded, for one), or does not reach the row by its id.
- file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
  name: the supersession time of the attribute a removal names is the moment of the edit
  proves: The named attribute's supersession time is the moment of the edit.
  fails_when: The stamped supersession time is anything but the editedAt moment the caller passed, including the database clock (now()), or it is left null.
- file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
  name: a person's two active email attributes, one of them removed leaves the other email active
  proves: Removing one of a person's two active email attributes leaves the other email active.
  fails_when: The removal's UPDATE matches the sibling email, for example by losing its id restriction or by matching on the attribute key, and changes its status.
- file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
  name: a person's two active email attributes, one of them removed gives the other email no supersession time
  proves: 'The UNDERDETERMINED entry''s first implementation is refused: a remove change reaches only the attribute it names, so the sibling email is not given a supersession time, which would stop it counting as current while its status still reads active.'
  fails_when: The removal stamps superseded_at on the sibling email while leaving its status active.
- file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
  name: a person's two active email attributes, one of them removed leaves an attribute of another key on the same node exactly as it was
  proves: 'The UNDERDETERMINED entry''s second implementation is refused: a remove change reaches only the attribute it names, so an attribute of another key on the same node is left as it was.'
  fails_when: The removal writes any column of an attribute of another key on the same node, such as its status or supersession time, for example by an UPDATE keyed by node instead of by attribute id.
not_applicable:
- edge_case: absent or empty attribute id
  why: recordRemoval takes the attribute id already resolved by the delivered validation. No criterion or node states a refusal for it here, and the standard's rule on absent input (EDG-01) puts that refusal at the route boundary, which this task does not ship.
- edge_case: removing an attribute twice, or removing an attribute that is already deleted or superseded
  why: Only the implementation's recorded InvariantError guard covers it, and that guard is an inference about behavior that no criterion or node states. It is listed under untested and not pinned.
- edge_case: two edits against one attribute at once
  why: Serialization is the orchestrating edit flow's row lock, which this task does not ship. No criterion or node of this task states concurrent behavior, so a test would assert a guarantee nobody made.
- edge_case: a failing or slow database
  why: A driver error propagates out of recordRemoval unchanged and no criterion or node gives it any other requirement. A test would pin only the absence of a catch.
- edge_case: an empty collection, or a duplicate where uniqueness is claimed
  why: The removal returns no collection and states no uniqueness. The only multiplicity in the obligations is the sibling email, which the criterion 3 and UNDERDETERMINED tests cover.
- edge_case: boundaries of a stated range
  why: No criterion or node of this task states a range or a threshold. The removal has one input class, an attribute that is live.
untested:
- 'rules/knowledge-base/entity-edit-removal: its stored-state clauses are exercised by the criterion tests, but the statement''s last clause, ''with the effect removal'', is reached by no criterion of this task and no code of it. Reporting the effect belongs to the task that reports each applied change (the REMAINDER entry of the task''s Notes). No finite test of this task decides the fact whole, so the node carries no demonstrates.'
- 'scenarios/knowledge-base/emptying-one-email-rejects-only-that-email: the first two then-lines are exercised by the criterion tests, and the third, ''the change is reported with the effect removal'', is outside this task, in the task that reports applied changes. A test over the first two alone would demonstrate the node in part, so none is claimed.'
- 'domain/knowledge-base/node-attribute: the node declares an aggregate''s shape and responsibility, and no finite test decides it whole. The task writes only two fields of it (status and superseded_at), and the tests assert those fields as criteria. Value, validity and provenance staying as they were is the implementation''s inference, not an obligation, and is not pinned.'
- 'domain/knowledge-base/assertion-status: the node enumerates five values. The removal writes only deleted, which the criterion 1 test covers. Membership of the other four values is no behavior of this task, so no finite test of the task decides the enumeration whole.'
- 'domain/knowledge-base/attribute-change and domain/knowledge-base/attribute-change-kind: the implementation record states these are honored and not encoded. recordRemoval receives the resolved attribute id and the edit moment, and the dispatch by kind belongs to the orchestrating edit task. No behavior of this task decides either node, so no test claims them.'
- 'Inference about behavior, recorded as unproven: rejectAttributeAtEdit applies only to a row whose status is active, uncertain or disputed. The guard set is the same as rejectItem''s, and no node or criterion decides it.'
- 'Inference about behavior, recorded as unproven: recordRemoval throws InvariantError when the update did not match exactly one live row. No criterion or node states this refusal, so no test pins it.'
- 'Inference about behavior, recorded as unproven: valid_to is not written by a removal. Only status and superseded_at are written, and no node states whether a removal ends validity.'
- 'Inference about arrangement, never tested: that rejectAttributeAtEdit is a new repository function and rejectItem is left unchanged.'
- 'Deferred by the implementation and so owed by other tasks: reporting the removal''s effect and removed id in the accepted answer and the curation action payload, and calling recordRemoval from the orchestrating edit flow.'
- 'What only a real database decides: the fake pg client executes the UPDATE statement''s SET and WHERE text (parameters, quoted literals, id equality, status IN list) and nothing else. Real PostgreSQL behavior is unproven: timestamptz casting, column constraints, triggers and the real rowCount. The shared Neon database was deliberately not touched.'
---
## What it is
Unit tests over a fake pg client that executes the removal's UPDATE statement hold that the named attribute becomes deleted with the edit moment as its supersession time, and that its sibling email and an attribute of another key are not touched.

## Notes
None.
