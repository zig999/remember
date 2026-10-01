---
title: Migrations directory and its test harness territory
summary: The area the database test harness scope lands in, the migrations tree with SQL migrations 0001 to 0007, three test scripts for 0007, and no package.json, runner or marker yet.
rationale: The survey walked only migrations/ and the standard the scope names, because the harness files (package.json, tests/run.mjs, tests/applied.txt) land inside migrations/ and nothing else is reachable from them.
sources:
- intake/scope.md
area:
- .
modules:
- name: migrations-root
  path: migrations
  role: touched
- name: migration-tests
  path: migrations/tests
  role: touched
- name: migration-0007
  path: migrations/0007_compliance_deletion_affected_shape.sql
  role: depends-on
- name: migration-seeds
  path: migrations/seeds
  role: adjacent
- name: schema-backup
  path: migrations/backup
  role: adjacent
- name: destructive-ops
  path: migrations/ops
  role: adjacent
- name: database-migrations-standard
  path: standards/database-migrations.yaml
  role: depends-on
conventions:
- statement: Each test script starts with \set ON_ERROR_STOP on, wraps its work in BEGIN ... ROLLBACK, and loads the migration under test with a relative \ir.
  seen_at: migrations/tests/compliance_deletion_affected_counts.sql
- statement: Test scripts create fixtures inside the transaction and assert through DO blocks that RAISE EXCEPTION with a message naming the criterion violated.
  seen_at: migrations/tests/compliance_deletion_affected_counts.sql
- statement: Test scripts are named for the behaviour they prove, not for the migration number.
  seen_at: migrations/tests/compliance_deletion_affected_absent.sql
- statement: Migrations are plain SQL named NNNN_description.sql at the migrations root, with no wrapping transaction and no comments.
  seen_at: migrations/0007_compliance_deletion_affected_shape.sql
- statement: Shell tooling here reads DATABASE_URL from backend/.env and refuses to run when it is absent.
  seen_at: migrations/backup/dump-schema.sh
- statement: node_modules/ and .env files are gitignored, so migrations/node_modules will not be committed but package-lock.json must be.
  seen_at: .gitignore
must_not_duplicate:
- what: The migration under test is loaded by the test scripts via \ir, so the runner must not re-implement migration application inside a test; it applies only migrations above the marker beforehand.
  at: migrations/tests/compliance_deletion_affected_counts.sql
- what: The rules MIG-01 to MIG-06 and the commands (npm ci, node tests/run.mjs) are already stated in the standard; the runner implements them rather than restating or changing them.
  at: standards/database-migrations.yaml
- what: The DATABASE_URL lookup from backend/.env, if the runner needs a connection string beyond what neonctl returns.
  at: migrations/backup/dump-schema.sh
risks:
- risk: Each 0007 test script runs \ir of 0007 inside its own transaction. With the marker at 0007 the runner will not apply 0007 to the branch, but the branch copied from production already holds 0007, so the \ir re-applies ADD CONSTRAINT compliance_deletion_affected_ck and fails as already existing. The three existing scripts may fail on the first run unless 0007 is absent from the branch or the scripts change.
  consumers:
  - migrations/tests/compliance_deletion_affected_counts.sql
  - migrations/tests/compliance_deletion_affected_absent.sql
  - migrations/tests/compliance_deletion_affected_non_negative.sql
- risk: The scripts use \ir with a path relative to the script and the psql meta-commands \set and \ir, which pg does not execute. The runner must interpret them itself, resolving \ir relative to the including file, or the scripts run differently from how they were written.
  consumers:
  - migrations/tests/run.mjs
  - standards/database-migrations.yaml rule MIG-06
- risk: Migration numbering is ambiguous. Root files run 0001 and 0004 to 0007 with no 0002 or 0003, while seeds/ holds 0001 to 0003 under its own numbering, so the runner must take only root-level migration files when comparing against the marker.
  consumers:
  - migrations/tests/run.mjs
  - migrations/tests/applied.txt
- risk: A runner or neonctl invocation that resolves the wrong branch or project could write to production, which the owner's approval rule and MIG-02 forbid.
  consumers:
  - Neon production branch of project spring-wind-69847430
  - standards/database-migrations.yaml rule MIG-02
- risk: A failed test must still delete the ephemeral branch, or branches and stale production data accumulate.
  consumers:
  - Neon project spring-wind-69847430
  - standards/database-migrations.yaml rule MIG-04
- risk: Migration 0007 adds its CHECK as NOT VALID, so the tests prove only that new writes are refused, not that existing rows conform.
  consumers:
  - migrations/tests/compliance_deletion_affected_counts.sql
---

## What it is
The migrations tree holds SQL migrations 0001 and 0004 to 0007 at its root, catalogue seeds in seeds/, a schema snapshot in backup/, destructive scripts in ops/, and three test scripts for 0007 in tests/.
The tree has no package.json, no package-lock.json, no tests/run.mjs and no tests/applied.txt, which the database-migrations standard presupposes.
The scope builds those four files so that npm ci and node tests/run.mjs can run the suite on an ephemeral Neon branch.

## Notes
The survey walked migrations/ and read standards/database-migrations.yaml, which sits outside the target root and is recorded as a dependency only.
The backup README states the Neon server runs PostgreSQL 18.x, while CLAUDE.md says PostgreSQL 17.
The standard's commands run from migrations/ because its presupposed paths are relative to it.
