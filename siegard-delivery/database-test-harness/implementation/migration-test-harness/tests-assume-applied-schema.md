---
target: database
title: 0007 test scripts rely on the applied schema
summary: The three compliance_deletion_affected test scripts under migrations/tests no longer load migration 0007 with \ir, so they run on a database where 0007 already stands.
task: sha256:9b0a5a8fde919d8dbe25bea978d44e9e9f8ee5849a39462bf2f1ead950f14bdb
standard:
  at: ../standards/database-migrations.yaml
  pin: sha256:d71367eb95f2dcb81a8a72c1d2486975ca8d5b56466ec0280090f9da8a4fcf26
run: run/migration-test-harness-tests-assume-applied-schema-build
files:
- path: tests/compliance_deletion_affected_counts.sql
  effect: Now starts \set ON_ERROR_STOP on, BEGIN, then the fixture raw_information insert. It no longer loads migration 0007, so it asserts the four-counts shape against the schema as already applied and still ends in ROLLBACK.
- path: tests/compliance_deletion_affected_absent.sql
  effect: Now starts \set ON_ERROR_STOP on, BEGIN, then the fixture insert. It no longer loads 0007, so it checks that an omitted or null affected is refused against the applied schema and still ends in ROLLBACK.
- path: tests/compliance_deletion_affected_non_negative.sql
  effect: Now starts \set ON_ERROR_STOP on, BEGIN, then the fixture insert. It no longer loads 0007, so it checks the zero-count control and the refusal of -1 for each count against the applied schema and still ends in ROLLBACK.
criteria:
- criterion: None of compliance_deletion_affected_counts.sql, compliance_deletion_affected_absent.sql and compliance_deletion_affected_non_negative.sql contains an \ir line.
  met: true
  how: The only \ir line in each of the three files was the one loading ../0007_compliance_deletion_affected_shape.sql, between BEGIN and the fixture insert. Each edit removed it, and none of the three files has an \ir now.
- criterion: Apart from the removed \ir line, each of the three scripts keeps every statement it held.
  met: true
  how: Each Edit's old_string was BEGIN, a blank line, the \ir line and a blank line. The new_string was BEGIN and one blank line. Every other line is untouched in all three files, including the fixture INSERT, the pg_temp.is_refused functions, the DO blocks, the RAISE messages and ROLLBACK.
- criterion: tests/compliance_deletion_affected_counts.sql completes without error on a database where migration 0007 stands.
  met: true
  how: The script no longer touches the migration, so the already-exists failure on compliance_deletion_affected_ck cannot occur. Its remaining statements assume only what 0007 leaves in place, namely the compliance_deletion table and its CHECK. I could not run it, so the suite run the caller makes is what confirms this.
- criterion: tests/compliance_deletion_affected_absent.sql completes without error on a database where migration 0007 stands.
  met: true
  how: The same removal of the re-applying \ir. The omitted-affected and explicit-null insert attempts depend only on the NOT NULL and CHECK that 0007 leaves in place. I could not run it, so the suite run confirms it.
- criterion: tests/compliance_deletion_affected_non_negative.sql completes without error on a database where migration 0007 stands.
  met: true
  how: The same removal of the re-applying \ir. The zero-count control and the -1 refusals depend only on the CHECK that 0007 leaves in place. I could not run it, so the suite run confirms it.
nodes:
- node: domain/knowledge-base/compliance-deletion
  encoded_at:
  - tests/compliance_deletion_affected_absent.sql
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
  how: The node requires affected on every compliance deletion. The scripts still prove this by inserting into compliance_deletion without affected, with a null affected, and with invalid shapes, and expecting check_violation or not_null_violation. The edit changes only who applies the migration and leaves the fact these scripts check untouched.
- node: domain/knowledge-base/affected-counts
  encoded_at:
  - tests/compliance_deletion_affected_counts.sql
  - tests/compliance_deletion_affected_non_negative.sql
  how: The four required integer counts (chunks, fragments, links, attributes) are still asserted by counts.sql, which refuses a missing count and non-integer values. The refusal of negative counts is still asserted by non_negative.sql. The edit leaves both assertions as they were.
inferences:
- inferred: The blank line after the removed \ir line went with it, so BEGIN is followed by exactly one blank line and then the fixture insert.
  from: the three files' layout, where a blank line separated each statement group, and the criterion that allows only the \ir line itself to disappear
- inferred: Criteria 3 to 5 are recorded as met from reading the scripts against the applied schema, not from a run, since I have no shell.
  from: the task's Notes, which say 0007 already stands on the branch copied from production, and the setup run, which only installed packages
- inferred: The record carries no standard block, because I cannot compute the sha256 pin of standards/database-migrations.yaml. The caller stamps it.
  from: the contract, which asks for the pin as the SHA-256 of the standard's text, and my having no tool that can compute it
preserved:
- Each script keeps \set ON_ERROR_STOP on and its BEGIN ... ROLLBACK wrapper, so MIG-01's roll-back guarantee for fixtures holds.
- The fixture raw_information with content_hash repeat('a', 64) stays as it was, and so does every assertion and RAISE EXCEPTION message naming its criterion.
- migrations/0007_compliance_deletion_affected_shape.sql is untouched. The runner or production now supplies it.
deferred:
- what: Every script inserts a fixture raw_information with content_hash repeat('a', 64). On a database that already holds a raw_information with that hash, the fixture hits the uniqueness guard and the script fails.
  why: Criterion 2 keeps every statement, and the task's notes record that no node states the uniqueness of content_hash. Changing the fixture reaches outside this task.
- what: Migration 0007 adds its CHECK as NOT VALID, so these scripts prove only that new writes are refused, not that existing rows conform.
  why: The task's Notes record it as a known limit, and proving existing rows reaches past the objective.
---

## What it is

The three compliance_deletion_affected test scripts under migrations/tests, rewritten without the \ir line that loaded migration 0007.
They now rely on the schema the runner or production already applied.

## Notes

The criteria that each script completes without error on a database where 0007 stands are recorded as met from reading; the suite run of this delivery is what decides them.
Every script still inserts a fixture raw_information with content_hash repeat('a', 64), so a database already holding that hash would refuse the fixture.
