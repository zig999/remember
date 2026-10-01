# Scope — database test harness (owner, 2026-10-01)

Build what standards/database-migrations.yaml presupposes and the tree lacks:
- migrations/package.json (with pg and neonctl), and its package-lock.json;
- migrations/tests/run.mjs — the suite runner the standard's MIG-02, MIG-04, MIG-05 and MIG-06 describe: it creates an ephemeral Neon branch from production via neonctl (project spring-wind-69847430), applies the migrations numbered above the marker in tests/applied.txt, runs each tests/*.sql with pg (honouring \set ON_ERROR_STOP and \ir), exits non-zero when any script fails, and deletes the branch at the end even when a test fails; no command touches the branch production;
- migrations/tests/applied.txt — the marker of the last migration production holds; production holds 0007 today.

Run the install with npm ci and the suite through bin/run.py, then review.
