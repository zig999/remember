---
title: 0007 test scripts rely on the applied schema
summary: The three compliance_deletion affected scripts, rewritten without the line that loads migration 0007.
rationale: The owner decision states the change; cutting it apart from the suite runner is my cut, because the scripts change for a different reason (who applies the migration) and can be shown with psql on any database where 0007 already stands.
sources:
- intake/tests-do-not-apply.md
- intake/scope.md
objective: The three 0007 test scripts pass on a database where migration 0007 already stands, without loading the migration themselves.
criteria:
- None of compliance_deletion_affected_counts.sql, compliance_deletion_affected_absent.sql and compliance_deletion_affected_non_negative.sql contains an \ir line.
- Apart from the removed \ir line, each of the three scripts keeps every statement it held.
- tests/compliance_deletion_affected_counts.sql completes without error on a database where migration 0007 stands.
- tests/compliance_deletion_affected_absent.sql completes without error on a database where migration 0007 stands.
- tests/compliance_deletion_affected_non_negative.sql completes without error on a database where migration 0007 stands.
implements:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/affected-counts
---

## What it is
The test scripts for migration 0007, cut back so the schema they test is applied by the runner or already held by production, not by the scripts.

## Notes

On a branch copied from production, where 0007 already stands, the \ir line re-adds compliance_deletion_affected_ck and fails because the constraint already exists.
Migration 0007 adds its CHECK as NOT VALID, so these scripts prove only that new writes are refused, not that existing rows conform.
ADVISORY, from the specification — Every script inserts a fixture raw_information with content_hash repeat('a', 64), so on a database already holding a raw_information with that hash the fixture hits the uniqueness guard and the script fails; criterion 2 keeps every statement, so no criterion can change the fixture, and no candidate node states the uniqueness of content_hash.
ADVISORY, from the specification — compliance_deletion_affected_non_negative.sql keeps its refusal of -1, which domain/knowledge-base/affected-counts implies through the meaning of how many rather than declaring in a field.
The planning's dependency on task/migration-test-harness/suite-substrate was removed after that task delivered the presupposed artifacts: a substrate task writes no proof, and --outstanding holds a dependent until a proof holds its dependency up.
