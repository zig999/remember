---
target: database
title: Store-level shape check on compliance_deletion.affected
summary: Migration 0007 makes the store refuse any compliance_deletion row whose affected value does not carry chunks, fragments, links and attributes as non-negative integers, and drops the '{}' default that let an empty value through.
task: sha256:b260ba3d8bdb19a20276c05ddaf8805f6b7b24e7ff94e1966e8ab4b0b8fa241a
files:
- path: 0007_compliance_deletion_affected_shape.sql
  effect: Drops the '{}' default on compliance_deletion.affected. Adds CHECK constraint compliance_deletion_affected_ck, NOT VALID, requiring the keys chunks, fragments, links and attributes to exist and each be a non-negative JSON integer (text matching ^[0-9]+$). Sets a column comment stating the shape. Not run against any database; it awaits the owner's approval. Revised in place from the first delivery, which accepted negative integers.
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
  how: Each count's JSON text must match ^[0-9]+$. A string ("5" renders as '"5"'), a fraction (1.5, 1.0), a null, a boolean, an object and an array all fail. A non-object affected value fails as well, because -> returns NULL on it.
- criterion: Recording a compliance deletion whose affected value carries a negative count is refused by the store.
  met: true
  how: The pattern no longer allows a leading minus sign, so any negative count renders as text starting with '-' and fails the match, which fails the CHECK.
- criterion: Recording a compliance deletion that states no affected value is refused by the store.
  met: true
  how: The '{}' default is dropped, so an omitted value now violates NOT NULL. An explicit '{}' or null is refused by the CHECK or by NOT NULL.
- criterion: Recording a compliance deletion whose affected value carries the four counts as non-negative integers is accepted by the store.
  met: true
  how: An object with the four keys as JSON integers of zero or more satisfies all four terms. Extra keys are not refused. I wrote no test and ran nothing, so this is reasoned from the expression and not observed.
nodes:
- node: domain/knowledge-base/compliance-deletion
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  how: Its affected attribute is required and typed affected-counts. The store now refuses a row that lacks the value, through NOT NULL without a default and the CHECK.
- node: domain/knowledge-base/affected-counts
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  how: The value object's four required integer attributes are the four keys the CHECK requires, each as an integer. The non-negative bound comes from the task's criteria and from the count semantics of the rule below; the node itself declares only integer.
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  how: Governed the work without reaching the store beyond the sign. A count is a number of items marked deleted and so is never negative, which the CHECK now holds. Whether a count equals the number actually marked deleted is decided by the deletion's execution in the service layer, and no DDL check can see it.
inferences:
- inferred: 0007 is edited in place. No 0008 is added to tighten the constraint.
  from: The caller states 0007 is committed in the tree but has never been applied to any database. The project rule that existing migration files are never edited protects the history of applied migrations, and nothing has been applied. A 0008 would leave a deployed sequence that adds a constraint and immediately replaces it, and would leave 0007's first form, which accepts negatives, as a file to apply. If 0007 turns out to have been applied anywhere, in place would be wrong, since that database would keep the looser constraint, and the change should be a 0008 that drops and re-adds compliance_deletion_affected_ck.
- inferred: 'Rows already stored whose affected value lacks the required shape, including any with a negative count, are kept as they are. The constraint is added NOT VALID: it binds every later insert and update, it does not inspect or rewrite old rows, and a migration run does not fail because of them. I invented no backfill counts. The owner can run ALTER TABLE ... VALIDATE CONSTRAINT after reviewing or correcting those rows.'
  from: 'The earlier task notes left this seam to the migration act. The rule that counts are what was marked deleted means a backfilled count would be a fact nothing states. One side effect: an UPDATE touching an old row must leave it conforming, because NOT VALID constraints are still checked on update.'
- inferred: The '{}' default on affected is dropped.
  from: Criterion 7 and the constraint itself. The default is a value the CHECK refuses, so it could only turn an omitted value into a less clear constraint violation. The column stays NOT NULL.
- inferred: Keys beyond the four are accepted; the constraint does not refuse an extra key.
  from: The task's ADVISORY note leaves this open for a reviewer, and no criterion asks for a refusal. The store is told to require the four counts and nothing less; refusing more would go beyond the criteria. A reviewer who wants exactness can tighten it with a key-count check.
- inferred: The non-negative form is the regular expression ^[0-9]+$ on the JSON text of each count, with no sign allowed. It accepts 0 and leading-zero text cannot occur, because jsonb normalises numbers.
  from: The 0001 convention of CHECK constraints and the existing shape of this constraint. One pattern covers integer-ness and sign together. It is a form decision and not a business fact.
- inferred: The constraint is named compliance_deletion_affected_ck.
  from: The <table>_<what>_ck naming used in 0001_init.sql, for example raw_chunk_offsets_ck and knowledge_link_basis_ck.
- inferred: The migration takes number 0007.
  from: The latest existing structural migration is 0006_original_input.sql.
divergences:
- from: The 0006_original_input.sql header convention (an additive/reversible note and frozen decisions as a leading comment block)
  departure: 0007 has no header comment block and no comments. Its decisions, the rollback and the approval-pending status are in this record.
  why: 'The framework rule that source carries no comments applies to every source file I write, and I took it to cover the header. The project''s COMMENT ON COLUMN is DDL and is kept. The rollback is two statements: ALTER TABLE compliance_deletion DROP CONSTRAINT compliance_deletion_affected_ck; then ALTER TABLE compliance_deletion ALTER COLUMN affected SET DEFAULT ''{}''::jsonb;'
preserved:
- 0001_init.sql is unedited; the change stays in 0007.
- compliance_deletion keeps its columns, its NOT NULL on affected, its index compliance_deletion_raw_idx and its foreign key to raw_information.
- Existing compliance_deletion rows are neither read, rewritten nor validated by the migration.
- The truncate scripts under ops/ are unaffected, since they reference the table only by name.
deferred:
- what: Requiring that each count equal what the deletion actually marked deleted (rules/knowledge-base/compliance-deletion-counts-what-it-marked).
  why: The criteria test shape and sign only. Equality to the number of items marked belongs to the deletion's execution in the service layer, and the store cannot see it.
- what: Refusing keys beyond the four, and validating the constraint against rows already stored (VALIDATE CONSTRAINT), with any correction of legacy rows that fail it.
  why: No criterion covers extra keys and the task leaves them to a reviewer. Correcting old rows would invent counts, which is the owner's decision after inspecting the data.
---

## What it is

Migration `0007_compliance_deletion_affected_shape.sql` makes the store refuse a `compliance_deletion` row unless its `affected` value carries `chunks`, `fragments`, `links` and `attributes`, each a non-negative JSON integer. The four required keys are the four attributes of `domain/knowledge-base/affected-counts`.

The migration does two things:
- It drops the `'{}'` default on `affected`, so an omitted value fails at `NOT NULL`.
- It adds the CHECK `compliance_deletion_affected_ck`, declared `NOT VALID`. Each count's JSON text must match `^[0-9]+$`, and a COALESCE turns a missing key into a refusal.

I wrote the file only. Nothing was executed, and the owner must approve the SQL before it runs. There is no standard for this target, so no build or suite ran either.

## Notes

- **Revision.** The first delivery accepted negative integers, with the pattern `^-?[0-9]+$`. The reworded task adds criterion 6 (negative count refused) and makes acceptance require non-negative integers. The only change to the constraint is the removal of `-?` from the pattern, plus `nao negativo` in the column comment.
- **In place versus 0008.** I edited 0007 in place, on the caller's statement that it has never been applied. If that statement is wrong for any database, a 0008 that drops and re-adds the constraint is the right form. See the first inference.
- **Rows already stored.** `NOT VALID` keeps them untouched, and I backfilled nothing. The constraint binds all later inserts and updates, and an UPDATE to an old row must leave it conforming. The owner can run `VALIDATE CONSTRAINT` once those rows have been reviewed or corrected.
- **Count equality.** A wrong but non-negative count, including all zeros, still passes the store. This matches the task's UNDERDETERMINED note and belongs to the deletion's execution in the service layer.
- **Criterion 8 is reasoned, not observed.** I wrote no test and ran nothing.
- **Verification to expect.** After approval, the judge should try:
  - INSERTs omitting each of the four keys;
  - a value that is a string, a fraction (1.0, 1.5) or null;
  - a count of -1;
  - `'{}'`, an explicit null and an omitted column;
  - a complete four-integer object, including one of all zeros.
- **Comments.** There is no header block, unlike 0006 (see divergences).
- **Path.** The file is `/home/siegfriedneto/projects/eternal/migrations/0007_compliance_deletion_affected_shape.sql`.
