---
target: database
title: Review of the migrations test harness
summary: What the coverage, conformance and standard passes found over the migrations suite substrate and the three 0007 scripts, with a green captured run.
reviewed:
- package.json
- package-lock.json
- tests/run.mjs
- tests/applied.txt
- tests/compliance_deletion_affected_counts.sql
- tests/compliance_deletion_affected_absent.sql
- tests/compliance_deletion_affected_non_negative.sql
tasks:
- task/migration-test-harness/suite-substrate
- task/migration-test-harness/tests-assume-applied-schema
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/database-test-harness passed; there was no failure to read
standard:
  at: ../standards/database-migrations.yaml
  pin: sha256:d71367eb95f2dcb81a8a72c1d2486975ca8d5b56466ec0280090f9da8a4fcf26
coverage:
- criterion: package.json declares pg as a dependency.
  state: uncovered
  why: None of the three scripts reads migrations/package.json. They run SQL against the store, so no test would fail if pg were removed from the declared dependencies.
- criterion: package.json declares neonctl as a dependency.
  state: uncovered
  why: None of the three scripts reads migrations/package.json. No test would fail if neonctl were dropped from the declared dependencies.
- criterion: npm ci run in migrations/ exits with code 0.
  state: uncovered
  why: Nothing in the set runs npm ci or checks its exit code. The SQL scripts run after installation and have no view of it.
- criterion: tests/applied.txt holds 0007 as the last migration production holds.
  state: uncovered
  why: 'Nothing reads tests/applied.txt or asks production which migration it holds last. The scripts only need 0007 to be present on the branch they run on. Say the marker were wrong (0006) and production lacked 0007: the runner would apply 0007 and the scripts would still pass. So neither half of the criterion (what the file holds, and that it matches production) is tied to any test.'
- criterion: The runner creates its branch through neonctl in project spring-wind-69847430 with production as the parent branch.
  state: uncovered
  why: None of the scripts can see how its database was created, in which project, or from which parent. Any database where 0007 stands would let all three pass, so a branch made from another parent, in another project, or without neonctl goes undetected.
- criterion: No pg connection the runner opens is to the production branch.
  state: uncovered
  why: Nothing checks which branch a connection points at. Each script wraps its writes in BEGIN/ROLLBACK, so all three would pass just the same if run against production. That is exactly the refusal this criterion states, and nothing exercises it.
- criterion: No neonctl command the runner issues acts on the production branch other than naming it as the parent of the branch it creates.
  state: uncovered
  why: Nothing in the set watches which neonctl commands the runner issues. A command that reset, changed or deleted production would not make any script fail.
- criterion: The runner deletes the branch it created at the end of a run in which every test script passed.
  state: uncovered
  why: No test checks whether the branch still exists after a run. The proof record notes that after one run the branch list held only production. That is a single observation written down, not a test that would fail if deletion stopped.
- criterion: The runner deletes the branch it created at the end of a run in which a test script failed.
  state: uncovered
  why: Nothing in the set makes a script fail and then checks that the branch was deleted. The failing-script half of cleanup is unexercised.
- criterion: The runner deletes the branch it created at the end of a run in which applying a migration failed.
  state: uncovered
  why: Nothing in the set makes a migration fail to apply, and no migration above the marker 0007 exists at the migrations root to apply at all. Cleanup after a failed apply is unexercised.
- criterion: Only NNNN_*.sql files at the migrations root are taken as migrations, and no file under a subdirectory is applied as one.
  state: uncovered
  why: No test puts a numbered file above the marker, at the root or in a subdirectory, and checks what gets applied. The numbered files in subdirectories (seeds/0001_seed.sql, seeds/0002_ontology_status_task.sql, seeds/0003_event_type_taxonomy.sql) are all at or below the marker 0007. Applying them by mistake would never be attempted, let alone caught.
- criterion: Every root-level migration whose number is greater than the marker in tests/applied.txt is applied to the branch before the first test script runs.
  state: uncovered
  why: There is no root-level migration numbered above the marker 0007, so the apply step does nothing in every run of this set. The scripts only need 0007, which the branch gets from its parent. No test would fail if migrations above the marker were skipped or applied after the scripts ran.
- criterion: No migration whose number is at or below the marker is applied to the branch.
  state: uncovered
  why: No test checks which migrations were applied. If the runner re-applied one at or below the marker, any breakage would show up as a failed apply step, not as a failed test script. A re-application that succeeded quietly would not be noticed at all.
- criterion: Migrations above the marker are applied in ascending numeric order.
  state: uncovered
  why: Nothing in the set offers two or more migrations above the marker, so application order is never exercised.
- criterion: Every tests/*.sql script is run against the branch through pg.
  state: uncovered
  why: No test checks that it was itself run, or that the others were. If the runner skipped one of the three scripts, or ran it some other way than through pg, no test would fail. Only the runner's own report would show it.
- criterion: An \ir line runs the referenced file resolved relative to the directory of the file that contains it.
  state: uncovered
  why: None of the three scripts contains an \ir line (that was the point of the sibling task's edit), so \ir resolution is never exercised. That covers resolving relative to the containing file's directory and nesting.
- criterion: In a script that sets ON_ERROR_STOP on, no statement after the first failing statement runs.
  state: uncovered
  why: All three scripts set ON_ERROR_STOP on, but none checks that later statements are skipped after a failure. Each one's only statement after its DO block is ROLLBACK, which ends the same way whether or not it runs after a failed statement. No script fails on purpose and then shows that a later statement did not run.
- criterion: The runner exits with a non-zero code when any test script fails.
  state: uncovered
  why: Nothing in the set makes a script fail and then checks the runner's exit code. Each script raises on a broken assertion, but whether the runner then exits non-zero is checked by no test.
- criterion: The runner exits with code 0 when every test script passes.
  state: uncovered
  why: No test checks the runner's exit code. The captured green run is one outcome, not a test that would fail if the runner exited non-zero after all scripts passed.
- criterion: None of compliance_deletion_affected_counts.sql, compliance_deletion_affected_absent.sql and compliance_deletion_affected_non_negative.sql contains an \ir line.
  state: uncovered
  why: I read all three files and none contains an \ir line today. But nothing in the set reads script text, so no test would fail if an \ir line came back. The proof record lists this criterion as untested and leaves it to the diff.
- criterion: Apart from the removed \ir line, each of the three scripts keeps every statement it held.
  state: uncovered
  why: Checking this means comparing each script with its earlier text, and no test in the set holds the earlier text. If a statement were removed, for example one of the refusal checks in the counts script, the script would still complete and nothing would fail. The proof record lists this criterion as untested.
- criterion: tests/compliance_deletion_affected_counts.sql completes without error on a database where migration 0007 stands.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_counts.sql
    name: compliance_deletion_affected_counts.sql
- criterion: tests/compliance_deletion_affected_absent.sql completes without error on a database where migration 0007 stands.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_absent.sql
    name: compliance_deletion_affected_absent.sql
- criterion: tests/compliance_deletion_affected_non_negative.sql completes without error on a database where migration 0007 stands.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_non_negative.sql
    name: compliance_deletion_affected_non_negative.sql
unpaired: []
findings:
- pass: conformance
  file: tests/compliance_deletion_affected_non_negative.sql
  where: the DO block, lines 28-32 (the FOREACH loop over the four count keys) and the failure message on line 30
  evidence: 'IF NOT pg_temp.is_refused(jsonb_set(zeros, ARRAY[k], ''-1''::jsonb)) THEN RAISE EXCEPTION ''criterion 6: an affected value with a negative % count was accepted'', k;'
  cost: 'The test makes "a negative count is refused" a requirement of the schema. The nodes only say each count is an integer ("type: integer", "required: true"), and "How many ... marked deleted". Nothing in them, and no other node I found, says a count below zero is refused. The refusal therefore exists only in this test, and in whatever schema constraint the test forces. A later reader checking what a compliance deletion''s affected value may hold will read the specification, find only "integer", and miss the rule.'
  correction: Analysis would need to state in domain/knowledge-base/affected-counts, or in a rule constraining it, that each count is zero or more and that a value with a negative count is refused. The test would then have a node to answer to. The zero-accepted control on line 24 depends on the same unstated rule.
run: run/database-test-harness
reconciliation: siegard-reconcile/database-test-harness.md
---

## What it is

The review of the migrations test harness: the suite substrate and the three 0007 scripts relying on the applied schema.
The captured run, run/database-test-harness, installed with npm ci and ran the suite on an ephemeral Neon branch, with all three scripts reported PASS.
The coverage pass found three criteria covered and twenty-one uncovered; the conformance pass found one unstated fact; the standard pass found no departure.

## Notes

The certification of domain/knowledge-base/affected-counts came back partial, with a testable remainder: no proof runs a compliance deletion and compares the recorded counts with what it marked deleted.
The conformance pass cleared neither node: compliance-deletion and affected-counts were read nowhere in some of the test scripts the delivery of task/migration-test-harness/tests-assume-applied-schema bound them to.
The twenty-one uncovered criteria are the runner's behaviour and the scripts' text, which no test in the set exercises; the green run is one observation, not a test of the runner.
The standard pass looked past the hard-coded Neon project id, role and database name in tests/run.mjs, which no rule in scope names.
This framework does not review security, performance, or whether production actually holds what tests/applied.txt asserts.
