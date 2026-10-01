---
target: database
title: Proof that the three 0007 scripts run on the applied schema
summary: The three existing compliance_deletion_affected scripts, which the suite runs on a branch where 0007 already stands, are offered as their own proof of the three run-without-error criteria. They also decide the affected-counts node.
implementation: sha256:908b38b8f039eb53c755a5f4020bc5c4ff70976cb6179a8abfc439860d7f5d2f
standard:
  at: ../standards/database-migrations.yaml
  pin: sha256:d71367eb95f2dcb81a8a72c1d2486975ca8d5b56466ec0280090f9da8a4fcf26
run: run/migration-test-harness-tests-assume-applied-schema-suite
tests:
- file: tests/compliance_deletion_affected_counts.sql
  name: compliance_deletion_affected_counts.sql
  proves: Criterion 3, that the script completes without error on a database where migration 0007 stands. Its own assertions also hold that an affected value with all four counts is accepted, that an affected value lacking any one of chunks, fragments, links or attributes is refused, and that a string, a decimal, null, a boolean, an object or an array in place of any one count is refused.
  fails_when: The script aborts on the applied schema, or the store accepts an affected value missing any of the four counts, or accepts a non-integer value for any of them. It also fails if the control with four valid counts is refused, which would make every refusal meaningless.
  demonstrates: domain/knowledge-base/affected-counts
- file: tests/compliance_deletion_affected_absent.sql
  name: compliance_deletion_affected_absent.sql
  proves: Criterion 4, that the script completes without error on a database where migration 0007 stands. Its own assertions also hold that a compliance deletion inserted without the affected column, or with an explicit null affected, is refused.
  fails_when: The script aborts on the applied schema, or the store accepts a compliance_deletion row with affected omitted or null.
- file: tests/compliance_deletion_affected_non_negative.sql
  name: compliance_deletion_affected_non_negative.sql
  proves: Criterion 5, that the script completes without error on a database where migration 0007 stands. Its own assertions also hold that four zero counts are accepted and that -1 in any one of the four counts is refused. That refusal is the advisory reading of "how many", which the node implies without declaring it, so no node is claimed.
  fails_when: The script aborts on the applied schema, or the store accepts a negative value for any of the four counts. It also fails if the all-zero control is refused, which would make the -1 refusals prove nothing.
not_applicable:
- edge_case: A new test file for this task
  why: The three scripts are the implementation and are already the tests of the facts they check. Each is run by the suite and ends in ROLLBACK, in line with MIG-01. Another script over the same assertions would be the same evidence twice (SPEC-004 R5).
- edge_case: Absent or empty input, boundaries, duplicates, concurrency and a failing or slow dependency
  why: The task's criteria concern the form of three scripts and whether they run on an applied schema. They state no input range, collection, uniqueness or concurrent behavior. The input-shape classes of affected belong to the scripts' own assertions, which are unchanged.
- edge_case: Running the scripts on a database where 0007 does not stand
  why: Criteria 3 to 5 are stated only for a database where 0007 stands, and the runner supplies 0007 by applying migrations above the marker. A test of the other case would assert a guarantee the criteria do not make.
untested:
- Criterion 1, that none of the three scripts contains an \ir line. This is a property of the files' text, not of anything a script run against the store observes. The suite runs scripts over pg and reads no other script's source. A test of it would restate the edit, so it is left to the diff and to the review's reading.
- Criterion 2, that each script keeps every statement it held apart from the removed \ir line. It is a comparison with the previous text of the files, which no test in the suite can hold. The implementation record's edit-by-edit account is the only evidence of it.
- The node domain/knowledge-base/compliance-deletion as a whole. Its fact also requires executed_at and reason on every record and a reference to exactly one raw information, and it states a responsibility, that a deleted source's knowledge is not presented as still traceable. The scripts check only that affected is required, and the rest is not decided by any finite test of this task. A test claiming the node would assert part of it as the whole (SPEC-004 R12).
- The non-negativity of the four counts, which domain/knowledge-base/affected-counts implies only through the meaning of "how many" and does not declare. compliance_deletion_affected_non_negative.sql refuses -1, but the node declares no such bound, so that refusal is not claimed as a demonstration of it.
- The fixture's raw_information with content_hash repeat('a', 64) fails on a database that already holds a row with that hash. The task's notes record that no node states the uniqueness of content_hash and that criterion 2 leaves the fixture unchanged. This behavior is recorded as unproven.
- The NOT VALID form of the CHECK that migration 0007 adds. The scripts prove only that new writes are refused, not that existing rows conform, and the task records this as a known limit.
- Criteria 3 to 5 as recorded in the implementation record are read from the scripts, not from a run, because the implementer had no shell. Only the suite step, `node tests/run.mjs`, run on the ephemeral branch, decides them.
---

## What it is

The three compliance_deletion_affected scripts, run by the registry's suite step on an ephemeral Neon branch where 0007 already stands, offered as their own proof.
compliance_deletion_affected_counts.sql is offered as the proof of domain/knowledge-base/affected-counts.

## Notes

The suite passed on its first run, run/migration-test-harness-tests-assume-applied-schema-suite, with all three scripts reported PASS.
After the run, the project's branch list held only production, so the ephemeral branch was deleted.
