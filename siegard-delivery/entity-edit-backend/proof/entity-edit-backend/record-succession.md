---
target: backend
title: Proof for recording a succession
summary: Eleven unit tests over a fake pg client show that recordSuccession supersedes the named attribute, ends its validity or sets its supersession time as the rules state, records the new attribute naming it, and holds the four UNDERDETERMINED exclusions.
implementation: sha256:2dab6e788f1e7e1f287d77ab40f740cdac8d1deedb9fc980c005effba8217fde
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-succession-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: the status of the attribute a succession supersedes is superseded whether or not the succession gives it a validity end
  proves: 'The named attribute''s status becomes superseded. It is shown in both classes of the end rule: the deadline example, where an end is given, and a new start on the predecessor''s start, where none is.'
  fails_when: the predecessor keeps status active, or becomes superseded only on one of the two paths, the one that gives an end or the one that gives none.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: the new attribute a succession records and the attribute it supersedes names that attribute as the one it supersedes
  proves: The new attribute names the superseded attribute as the one it supersedes.
  fails_when: the recorded attribute's supersedes_attribute_id is null or names any id other than the predecessor's.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: the validity end of the attribute a succession supersedes is the new start, and none when the predecessor holds a start the new start does not pass
  proves: A table with one representative per class and each boundary. A predecessor with no start gets the new start as its end. A new start one day after the predecessor's start gives that start as the end. A new start on the predecessor's start gives no end. A new start one day before it gives no end. The test covers the criteria on the end being the later new start, no end on or before the start, and a start-less predecessor getting the new start.
  fails_when: the end is taken from anywhere but the new start, is withheld for a later start, is given for a start on or before the predecessor's, or is withheld from a predecessor with no start.
  demonstrates: rules/knowledge-base/entity-edit-succession-closes-the-previous
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: the supersession time of the attribute a succession supersedes is the moment of the supersession only where the succession gives it no validity end
  proves: A superseded attribute that is given no end gets the moment of the supersession as its supersession time (new start on the predecessor's start, and the status example of 2026-10-01 set with a stated 2026-09-01). One that is given an end, or that holds no start, keeps its supersession time unset. The clock is frozen at the edit moment, so the test fixes neither the edit moment nor a clock reading as the moment of the supersession.
  fails_when: the supersession time is set where an end is given, left unset where none is given, set where the predecessor holds no start, or set to anything but the moment of the supersession.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: a project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start gives the new deadline the start 2026-10-07 with the basis received, and the earlier deadline the validity end 2026-10-07 and no supersession time
  proves: 'The deadline example: the new deadline''s validity start is 2026-10-07, its basis is received, the earlier deadline''s validity end is 2026-10-07 and its supersession time is left unset. A keyed diff names which of the four fields failed.'
  fails_when: the new start is not today's UTC date, the basis is not received, the earlier deadline gets a different end or none, or its supersession time is set.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: a project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01 supersedes the earlier status with no validity end and records the new status starting 2026-09-01 with the basis stated
  proves: 'The backdated scenario whole: the earlier status is superseded and given no validity end, and the new status starts 2026-09-01 with the basis stated. The test covers the criteria on the earlier status having no end, and the new status''s start and its basis.'
  fails_when: the earlier status is not superseded or is given an end, or the new status starts on any other date or is recorded with a basis other than stated.
  demonstrates: scenarios/knowledge-base/backdated-start-supersedes-without-an-end
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: the state of the new attribute a succession records is active at confidence 1.0 under the LLM run of the edit's note
  proves: 'UNDERDETERMINED entry 1: the attribute a succession records is active, at confidence 1.0, under the run the edit opened.'
  fails_when: the succession records the new attribute as uncertain, at confidence 0.8, or under no run or another run.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: the provenance of the new attribute a succession records holds the edit's information fragment
  proves: 'UNDERDETERMINED entry 2: the attribute a succession records holds a provenance pointing at the edit''s information fragment.'
  fails_when: the succession records the new attribute with no provenance, or with provenance on another attribute or another fragment.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: the validity end of the new attribute a succession records is the end the change states, or none when it states none
  proves: 'UNDERDETERMINED entry 3: with a change that states a validity end of 2027-01-31 the new attribute holds that end, and with a change that states none the new attribute holds none.'
  fails_when: the new attribute is recorded with no end where the change states one, or is given an end where the change states none, for example the end of the superseded attribute.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: a succession with no stated start, made in a server zone behind UTC at a moment whose UTC date differs from the zone's date gives the new attribute the UTC calendar date of the edit as its start
  proves: 'UNDERDETERMINED entry 4, new-attribute half: an edit made at 2026-10-07T23:30-03:00 under TZ America/Sao_Paulo gets the start 2026-10-08, the UTC calendar date.'
  fails_when: today is read in the server's local time zone, so the start is 2026-10-07.
- file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  name: a succession with no stated start, made in a server zone behind UTC at a moment whose UTC date differs from the zone's date gives the superseded attribute that same UTC calendar date as its validity end
  proves: 'UNDERDETERMINED entry 4, predecessor half: the superseded deadline''s validity end is 2026-10-08, the same UTC date as the new start.'
  fails_when: the superseded attribute's end is derived from the server's local date, or from a date other than the new attribute's start.
not_applicable:
- edge_case: absent or empty input (no change value, no predecessor)
  why: The input is a typed object built by the caller after validation at the boundary. No criterion or node states a refusal for it here, and the one refusal a missing value raises sits in recordNewAttribute, which another task owns.
- edge_case: two operations against one subject at once
  why: The predecessor row is locked by the caller, and the transaction is caller-owned. This task states no concurrency behavior, and a fake client can decide none.
- edge_case: a dependency that fails or answers slowly
  why: No criterion or node states how the succession answers a store failure. The driver error propagates, and a test would assert a guarantee nobody made.
- edge_case: a duplicate where uniqueness is claimed
  why: The current-duplicate guard and the functional uniqueness of a current attribute belong to the database and the caller's locking. No criterion of this task states them.
untested:
- 'rules/knowledge-base/entity-edit-succession is not demonstrated: its fact also carries the effect succession, which recordSuccession does not assign. That clause belongs to assign-change-effect and apply-entity-edit, so no finite test here decides the fact whole. The supersede, active and names-the-predecessor clauses are exercised by the tests above.'
- 'rules/knowledge-base/entity-edit-supersession-time is not demonstrated: it also governs the attribute a correction supersedes, which belongs to record-correction. Only the succession side is tested here.'
- rules/knowledge-base/entity-edit-start-defaults-to-today, entity-edit-stated-start-is-stated, entity-edit-new-attribute-state, entity-edit-provenance and entity-edit-stated-end-is-held are exercised through the succession path only. Each states a fact over every new attribute an edit records, including a first value, an addition and a correction, so a test here would cover the fact in part and the node is not claimed. The first-value and addition paths belong to record-new-attribute, and the correction path to record-correction.
- 'scenarios/knowledge-base/temporal-edit-without-a-date-starts-today is not demonstrated: its third then-line, the change reported with the effect succession, belongs to assign-change-effect and apply-entity-edit. The first two then-lines are exercised by the deadline example test.'
- domain/knowledge-base/node-attribute, assertion-status and attribute-change are definitions of structure and vocabulary. No finite test decides them whole, and the tests above only read and write columns and values they declare.
- 'Inference about behavior, not pinned: recordSuccession raises InvariantError when the key is not temporal, and when the predecessor row was not updated (not live). No node or criterion decides the refusal, so no test exists. The route that gives the fact a home is a node.'
- 'Inference about behavior, not pinned: the predecessor is updated before the new attribute is inserted. No test observes the order.'
- 'Behavior no node decides: whether a predecessor that already holds a validity end keeps it when the succession gives no end, and whether it is overwritten when the succession gives one. The implementation keeps the first and overwrites in the second, and no test pins either.'
- Whether the moment of the supersession is the edit's editedAt or a clock reading is undecided by the criteria. The tests freeze the clock at the edit moment so that neither reading is pinned.
- 'What only a real database decides, and no test here reaches: the text of the UPDATE in supersedeAttributeAtEdit (COALESCE on valid_to, the status guard, the timestamptz cast), the supersedes_attribute_id column and its foreign key on INSERT, and the rollback of a partial succession. The fake client reproduces those semantics from the statement''s parameters, so a wrong SQL text would not fail these tests.'
- The existing entity-edit-new-attribute.spec.ts was read and not edited. Its fake parses the INSERT column list and the VALUES tokens, and the added $11 supersedes_attribute_id column maps to the null its first-value case expects, so it should stay green. This was concluded by reading, not by a run.
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  departure: The file sits at src/__tests__/unit/curation/entity-edit-succession.spec.ts, beside the sibling specs of the same module, and not under a path that mirrors the unit's full source path (modules/curation/service/).
  why: Every existing entity-edit spec sits in src/__tests__/unit/curation/. Mirroring the full path for one file would split the module's suite across two layouts.
---
## What it is
Eleven unit tests over a fake pg client show that recordSuccession supersedes the named attribute, ends its validity or sets its supersession time as the rules state, records the new attribute naming it, and holds the four UNDERDETERMINED exclusions.

## Notes
None.
