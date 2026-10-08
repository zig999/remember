---
title: Proof that each provenance upsert repeats the predicate of its partial unique index
summary: One table-driven test sends each of the four provenance statements of the curation repository to a recording stand-in client and asserts that its ON CONFLICT clause carries the arbiter columns, the index predicate and DO NOTHING.
target: backend
implementation: sha256:6090f2b7c1baf33176feb1a66caed429b09498b3b595dccdb16afef1048846e4
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/provenance-conflict-predicate-record-provenance-once-per-fragment-suite
tests:
- file: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
  name: 'the provenance statement a repository function sends for an item that may already hold the fragment > copyProvenance / appendProvenanceFragment > names the arbiter columns and the predicate of the partial unique index of a $kind, and skips the conflicting row (cases: link and attribute, under each of the two functions, four statements in all)'
  proves: 'Criteria 2 and 3, as the person decided to prove them. Recording a fragment as the provenance of an attribute or a link that already holds it must leave one entry and must not fail the operation. That holds only if each statement names the arbiter columns and repeats the predicate of provenance_attr_fragment_uq (WHERE attribute_id IS NOT NULL) or provenance_link_fragment_uq (WHERE link_id IS NOT NULL), because the planner refuses the statement otherwise. It also needs DO NOTHING to skip the repeated fragment. The same four statements carry criterion 1 (the operator note''s fragment recorded for a new attribute) and criteria 4 and 5 (a corrected attribute or link takes the superseded provenance): a refused statement is the HTTP 500 of the reproduction.'
  fails_when: Any one of the four statements (copyProvenance link, copyProvenance attribute, appendProvenanceFragment link, appendProvenanceFragment attribute) loses the WHERE predicate from its ON CONFLICT target, carries a predicate other than the one of its index, names arbiter columns other than the index's, or replaces DO NOTHING with another action. The failing case names the function and the kind.
not_applicable:
- edge_case: A fragment the item already holds, observed as a stored row count
  why: Whether a repeated fragment leaves one row is decided by the PostgreSQL planner and the unique index. The in-memory stand-ins match statements by regular expression and cannot observe it, so a row-count test would assert the stand-in's own logic. The person's decision bounds the proof to the statement text.
- edge_case: A correction or append against an item that holds no provenance, or a predecessor with none to copy
  why: No criterion or node of this task states the empty case. The statement is the same text for it, so a second representative would prove the same thing the statement test already fails over.
- edge_case: Two operations recording the same fragment against one item at once
  why: No criterion or node of this task states concurrent behavior. The unique index is what serialises it, and the statement test already protects the inference of that index.
- edge_case: A stand-in under src/__tests__ that stops matching because of the new predicate
  why: 'I read the stand-ins that reach these statements: edit-entity-world.ts, entity-edit-correction.spec.ts, entity-edit-new-attribute.spec.ts and integration/curation/routes.spec.ts. Their patterns are either not anchored at the end of the statement or are substring checks. The new WHERE in the conflict target changes none of them, so none was edited. reaffirm-consolidation-world.ts serves the ingestion statements, which this change does not touch.'
untested:
- 'rules/knowledge-base/attribute-provenance-once-per-fragment, rules/knowledge-base/link-provenance-once-per-fragment and domain/knowledge-base/provenance: the invariant is that an attribute or link holds at most one provenance per fragment, kept by a database unique index. No finite test over repository statement text decides it whole. The statement test shows the upsert is shaped to match the index, not that the store never holds two entries, so no `demonstrates` is claimed.'
- 'domain/knowledge-base/node-attribute, domain/knowledge-base/knowledge-link, domain/knowledge-base/entity-edit, domain/knowledge-base/information-fragment and domain/knowledge-base/assertion-correction: the task only honours these entities. Their facts span many behaviors this task does not change, and no finite test of this task decides one of them whole.'
- 'rules/knowledge-base/entity-edit-provenance and rules/knowledge-base/corrected-item-provenance: each is a policy over a whole flow, the edit''s fragment plus the carried-over provenance, or the carried-over provenance plus the cited fragment. The new test reaches only the statement each flow ends in. The flows'' behavior stays with the existing suites (entity-edit-new-attribute.spec.ts, entity-edit-correction.spec.ts, and the UC-10 case of integration/curation/routes.spec.ts), which this delivery did not change and which run against stand-ins that cannot observe the planner.'
- 'Criteria 1, 4 and 5 as flows: no new behavioral test was written. They are already asserted by the existing suites named above, and a test written now over the same flows would be the same evidence twice.'
- 'UNDERDETERMINED entry 1 (the operation recording an already-held fragment must succeed): the entry names an implementation where the unique constraint raises and the operation rolls back. No stand-in in the tree models the planner or the index, so no unit test can fail over it. The test I wrote excludes the planner refusal only by checking the statement text, and the success of the operation itself stays unproven.'
- 'UNDERDETERMINED entry 2 (the cited errata fragment in rules/knowledge-base/corrected-item-provenance): it names an implementation where a correction citing an errata fragment gives the new item the superseded provenance but not the cited one. That behavior sits in item.service.ts, which this task did not change, and the statement test does not reach it. I wrote no test for the entry. The implementation record also defers it.'
- 'UNDERDETERMINED entry 3 (a succession''s new attribute holds the superseded provenance as well as the edit''s fragment): it names an implementation where a succession copies the superseded provenance. That behavior lives in entity-edit-succession.ts and recordNewAttribute, outside this repository-statement proof. Exercising it needs the service flow over a stand-in, so it is left unproven here.'
- 'The implementation''s inference that a repeated fragment is a skip and not a refusal: no node decides which of the two the system does, and the criteria carry only ''one entry remains''. The statement test pins DO NOTHING as part of the conflict clause, which fixes the choice in the suite without a node holding it. The choice should be decided into a node.'
- 'The ADVISORY notes on whether carried-over provenance keeps the original recorded_at or takes the time of the correction, and whether ''takes'' moves or copies the entries: no criterion decides either, so neither is tested.'
---
## What it is
One test over the SQL text of the four provenance statements, which fails if any of them loses the predicate of its partial unique index.

## Notes
The suite ran green on its first attempt (run/provenance-conflict-predicate-record-provenance-once-per-fragment-suite).
The test author had no shell and ran nothing; the run above was captured afterwards by the delivery.
The test reads the statement text and cannot observe the PostgreSQL planner; whether a repeated fragment leaves one stored row stays proven by the index definition and by the EXPLAIN made in this session, which no record holds.
