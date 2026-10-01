---
title: Migrations suite substrate
summary: The manifest, lockfile, suite runner and production marker that let the migrations target be installed and its suite run.
rationale: No specification node holds a manifest, a lockfile, a suite runner or a migration marker, and none should, because the specification is what the business decided and how this project is built is not; so this task implements nothing. It is one task rather than one per artifact because the four files are one decision about how the migrations target is built and tested. It sits under the epic whose covers lists the impact set's first node. Taking only the NNNN_*.sql files at the migrations root as migrations is my reading, from the inventory's convention for migration files and its numbering risk around seeds/, not something the scope stated. Its criteria can be shown with any passing and any failing test script, so it stands apart from the rewrite of the 0007 scripts.
sources:
- intake/scope.md
objective: From migrations/, npm ci installs the target and node tests/run.mjs runs every test script on an ephemeral Neon branch created from production.
criteria:
- package.json declares pg as a dependency.
- package.json declares neonctl as a dependency.
- npm ci run in migrations/ exits with code 0.
- tests/applied.txt holds 0007 as the last migration production holds.
- The runner creates its branch through neonctl in project spring-wind-69847430 with production as the parent branch.
- No pg connection the runner opens is to the production branch.
- No neonctl command the runner issues acts on the production branch other than naming it as the parent of the branch it creates.
- The runner deletes the branch it created at the end of a run in which every test script passed.
- The runner deletes the branch it created at the end of a run in which a test script failed.
- The runner deletes the branch it created at the end of a run in which applying a migration failed.
- Only NNNN_*.sql files at the migrations root are taken as migrations, and no file under a subdirectory is applied as one.
- Every root-level migration whose number is greater than the marker in tests/applied.txt is applied to the branch before the first test script runs.
- No migration whose number is at or below the marker is applied to the branch.
- Migrations above the marker are applied in ascending numeric order.
- Every tests/*.sql script is run against the branch through pg.
- An \ir line runs the referenced file resolved relative to the directory of the file that contains it.
- In a script that sets ON_ERROR_STOP on, no statement after the first failing statement runs.
- The runner exits with a non-zero code when any test script fails.
- The runner exits with code 0 when every test script passes.
produces:
- package.json
- tests/run.mjs
- tests/applied.txt
---

## What it is
The four files the database-migrations standard presupposes and the target does not hold.
With them, the standard's install step (npm ci) and suite step (node tests/run.mjs) can run from migrations/.

## Notes

package-lock.json is included because npm ci refuses to run without a lockfile beside package.json, and .gitignore does not exclude it.
The DATABASE_URL lookup from backend/.env already stands in migrations/backup/dump-schema.sh, in case the runner needs a connection beyond what neonctl returns.
The standard's commands run from migrations/, so every path here is relative to it.
ADVISORY, from the specification — Neither candidate governs this task; domain/knowledge-base/affected-counts and domain/knowledge-base/compliance-deletion say nothing about a manifest, a lockfile, a suite runner, Neon branches or a production marker, and what governs every criterion is the project standard standards/database-migrations.yaml (MIG-02 to MIG-06 and its presupposes and dependencies), which is not a specification node.
ADVISORY, from the specification — The criteria that no migration at or below the marker is applied and that the runner exits 0 when every script passes cannot both hold over the three 0007 scripts until task/migration-test-harness/tests-assume-applied-schema removes their \ir of 0007; the owner settled this in intake/tests-do-not-apply.md and no node states it either way.
ADVISORY, from the specification — The Neon project spring-wind-69847430 and 0007 as the last migration production holds come from intake/scope.md only; they are operational facts about the deployment, not business facts.
