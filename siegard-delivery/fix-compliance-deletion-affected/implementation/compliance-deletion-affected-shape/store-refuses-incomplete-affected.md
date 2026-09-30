---
target: database
title: Store-level shape check on compliance_deletion.affected
summary: New migration 0007 makes the store refuse any compliance_deletion row whose affected value does not carry chunks, fragments, links and attributes as integers, and drops the '{}' default that let an empty value through.
task: sha256:b98a238f498e2a02b421535795911246c93d672aaa71dca6081b2da2c9cb87cc
files:
- path: 0007_compliance_deletion_affected_shape.sql
  effect: Drops the '{}' default on compliance_deletion.affected. Adds CHECK constraint compliance_deletion_affected_ck, NOT VALID, requiring the keys chunks, fragments, links and attributes to exist and each be a JSON integer. Sets a column comment stating the shape. Not run against any database; it awaits the owner's approval.
criteria:
- criterion: Recording a compliance deletion whose affected value lacks the chunks count is refused by the store.
  met: true
  how: A missing key makes (affected -> 'chunks')::text NULL. The COALESCE turns that into false, so the CHECK fails. The COALESCE matters because a bare NULL would pass a CHECK.
- criterion: Recording a compliance deletion whose affected value lacks the fragments count is refused by the store.
  met: true
  how: The same term for 'fragments', with the same COALESCE to false on a missing key.
- criterion: Recording a compliance deletion whose affected value lacks the links count is refused by the store.
  met: true
  how: The same term for 'links', with the same COALESCE to false on a missing key.
- criterion: Recording a compliance deletion whose affected value lacks the attributes count is refused by the store.
  met: true
  how: The same term for 'attributes', with the same COALESCE to false on a missing key.
- criterion: Recording a compliance deletion whose affected value carries a count that is not an integer is refused by the store.
  met: true
  how: Each count's JSON text must match ^-?[0-9]+$. A string ("5" renders as '"5"'), a fraction (1.5, 1.0), a null, a boolean, an object and an array all fail. A non-object affected value fails as well, because -> returns NULL on it.
- criterion: Recording a compliance deletion that states no affected value is refused by the store.
  met: true
  how: The '{}' default is dropped, so an omitted value now violates NOT NULL. An explicit '{}' or null is refused by the CHECK or by NOT NULL. Keeping the default would have filled in a value the CHECK refuses anyway.
- criterion: Recording a compliance deletion whose affected value carries the four integer counts is accepted by the store.
  met: true
  how: An object with the four keys as JSON integers satisfies all four terms. Extra keys are not refused. I wrote no test and ran nothing, so this is reasoned from the expression and not observed.
nodes:
- node: domain/knowledge-base/compliance-deletion
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  how: Its affected attribute is required and typed affected-counts. The store now refuses a row that lacks the value, through NOT NULL without a default and the CHECK.
- node: domain/knowledge-base/affected-counts
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  how: The value object's four required integer attributes are the four keys the CHECK requires, each as an integer.
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  how: Governed the work without reaching the store. Whether a count equals the number of items actually marked deleted is decided by the deletion's execution in the service layer, and no DDL check can see it. The migration enforces only the shape the criteria test.
inferences:
- inferred: 'Rows already stored whose affected value lacks the four-count shape are kept as they are. The constraint is added NOT VALID: it binds every later insert and update, it does not inspect or rewrite old rows, and a migration run does not fail because of them. I invented no backfill counts. The owner can run ALTER TABLE ... VALIDATE CONSTRAINT after reviewing or correcting those rows.'
  from: 'The task''s ADVISORY note, which leaves this seam to the migration act. The rule that counts are what was marked deleted means a backfilled count would be a fact nothing states. One side effect: an UPDATE touching an old row must leave it conforming, because NOT VALID constraints are still checked on update.'
- inferred: The '{}' default on affected is dropped.
  from: Criterion 6 and the constraint itself. The default is a value the CHECK refuses, so it could only turn an omitted value into a less clear constraint violation. The column stays NOT NULL.
- inferred: Counts are required to be integers only. Negative integers and extra keys are accepted.
  from: Criteria 5 and 7 state "integer" and "four integer counts" with no sign or exclusivity condition. Both task notes flag the sign as underdetermined. The value object declares four attributes and no prohibition on others.
- inferred: The constraint is named compliance_deletion_affected_ck.
  from: The <table>_<what>_ck naming used in 0001_init.sql, for example raw_chunk_offsets_ck and knowledge_link_basis_ck.
- inferred: The migration takes number 0007.
  from: The latest existing structural migration is 0006_original_input.sql.
divergences:
- from: The 0006_original_input.sql header convention (an additive/reversible note and frozen decisions as a leading comment block)
  departure: 0007 has no header comment block and no comments. Its decisions, the rollback and the approval-pending status are in this record.
  why: 'The framework rule that source carries no comments applies to every source file I write, and I took it to cover the header. The project''s COMMENT ON COLUMN is DDL and is kept. The rollback is two statements: ALTER TABLE compliance_deletion DROP CONSTRAINT compliance_deletion_affected_ck; then ALTER TABLE compliance_deletion ALTER COLUMN affected SET DEFAULT ''{}''::jsonb;'
preserved:
- 0001_init.sql is unedited; the change is a new file.
- compliance_deletion keeps its columns, its NOT NULL on affected, its index compliance_deletion_raw_idx and its foreign key to raw_information.
- Existing compliance_deletion rows are neither read, rewritten nor validated by the migration.
- The truncate scripts under ops/ are unaffected, since they reference the table only by name.
deferred:
- what: Rejecting negative counts, and requiring that each count equal what the deletion actually marked deleted (rules/knowledge-base/compliance-deletion-counts-what-it-marked).
  why: The criteria test shape only. Equality to the number of items marked belongs to the deletion's execution in the service layer, and the sign rule would go beyond what criterion 7 accepts. Both are for the specification to decide.
- what: Validating the constraint against rows already stored (VALIDATE CONSTRAINT), and any correction of legacy rows that fail it.
  why: Correcting old rows would invent counts. It is the owner's decision after inspecting the data, and it sits outside this task's shape-only scope.
---

## What it is

Migration `0007_compliance_deletion_affected_shape.sql` makes the store refuse a `compliance_deletion` row unless its `affected` value carries `chunks`, `fragments`, `links` and `attributes`, each a JSON integer. The four required keys are the four attributes of `domain/knowledge-base/affected-counts`.

The migration does two things:
- It drops the `'{}'` default on `affected`, so an omitted value fails NOT VALID-free at `NOT NULL`.
- It adds the CHECK `compliance_deletion_affected_ck`, declared `NOT VALID`. Each count must match `^-?[0-9]+$` on its JSON text, and the COALESCE turns a missing key into a refusal.

I wrote the file only. Nothing was executed, and the owner must approve the SQL before it runs. There is no standard for this target, so no build or suite ran either.

## Notes

- **Rows already stored.** `NOT VALID` keeps them untouched, and I backfilled nothing. The constraint binds all later inserts and updates, and an UPDATE to an old row must leave it conforming. The owner can run `VALIDATE CONSTRAINT` once those rows have been reviewed or corrected. This is an inference; the alternative that invents counts was refused. If the owner wants legacy rows validated, that is a decision about data and not a change to this file.
- **Criterion 7 is reasoned, not observed.** The Notes entry in the task is correct: a wrong count, including zeros, passes the store. The same goes for negative integers and extra keys.
- **Verification to expect.** After approval, the judge should try:
  - INSERTs omitting each of the four keys;
  - a value that is a string, a fraction (1.0, 1.5) or null;
  - `'{}'`, an explicit null and an omitted column;
  - a complete four-integer object.
- **Comments.** There is no header block, unlike 0006 (see divergences). The rollback statements are in that divergence entry.
- **Path.** The file is `/home/siegfriedneto/projects/eternal/migrations/0007_compliance_deletion_affected_shape.sql`.
