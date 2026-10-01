# Owner decision, 2026-10-01 — the runner applies, the tests do not

Asked how to resolve the runner applying the migrations above tests/applied.txt while the existing test scripts load their own migration with \ir (which fails on a branch copied from production, where 0007 already stands), the owner chose: the runner applies; the tests do not.
Test scripts stop loading the migration with \ir and assume the schema already applied — by the runner for a pending migration, or by production for one already applied.
The three 0007 scripts (tests/compliance_deletion_affected_counts.sql, _absent.sql, _non_negative.sql) are rewritten without the \ir line, so 0007 stays tested on every run.
