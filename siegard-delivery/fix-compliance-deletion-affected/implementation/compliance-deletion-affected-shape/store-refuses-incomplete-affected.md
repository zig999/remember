---
target: database
title: Store-level shape check on compliance_deletion.affected
summary: Migration 0007 makes the store refuse any compliance_deletion row whose affected value does not carry chunks, fragments, links and attributes as non-negative integers, and drops the '{}' default that let an empty value through.
task: sha256:98d5ab4dc8cda1b772b95cef8a14282291ab1d0a97c18a7f10e8c73ce1e004f1
standard:
  at: ../standards/database-migrations.yaml
  pin: sha256:d71367eb95f2dcb81a8a72c1d2486975ca8d5b56466ec0280090f9da8a4fcf26
run: run/compliance-deletion-affected-shape-store-refuses-incomplete-affected-build
files:
- path: 0007_compliance_deletion_affected_shape.sql
  effect: Drops the '{}' default on compliance_deletion.affected. Adds CHECK constraint compliance_deletion_affected_ck, declared NOT VALID, requiring the keys chunks, fragments, links and attributes to exist and each be a non-negative JSON integer (text matching ^[0-9]+$). It holds no comments and no COMMENT ON COLUMN statement. It is already applied to production; this delivery did not edit it.
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
  how: The pattern allows no leading minus sign, so any negative count renders as text starting with '-' and fails the match, which fails the CHECK.
- criterion: Recording a compliance deletion that states no affected value is refused by the store.
  met: true
  how: The '{}' default is dropped, so an omitted value violates NOT NULL. An explicit '{}' or null is refused by the CHECK or by NOT NULL.
- criterion: Recording a compliance deletion whose affected value carries the four counts as non-negative integers is accepted by the store.
  met: true
  how: An object with the four keys as JSON integers of zero or more satisfies all four terms. Extra keys are not refused. I ran nothing and wrote no test, so this is reasoned from the expression. The tests under tests/ belong to another judge.
nodes:
- node: domain/knowledge-base/compliance-deletion
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  how: Its affected attribute is required and typed affected-counts. The store refuses a row that lacks the value, through NOT NULL without a default and the CHECK.
- node: domain/knowledge-base/affected-counts
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  how: The value object's four required integer attributes are the four keys the CHECK requires, each as an integer.
- node: rules/knowledge-base/affected-counts-non-negative
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
  how: Each count must be zero or more. The pattern ^[0-9]+$ has no sign, so a negative count fails the CHECK and a zero passes it.
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  how: Governed the work without a fact of its own reaching the file. Its non-negative consequence is held by the CHECK and is bound through affected-counts-non-negative. That each count equals the number actually marked deleted belongs to the backend's compliance deletion and cannot be seen by a DDL check.
inferences:
- inferred: 0007 needs no edit for this delivery. The migration as applied already satisfies all eight criteria and the added non-negative rule.
  from: The coordinator's message, and my reading of the file's current content. The constraint pattern has no sign, so the new node is already encoded.
- inferred: Keys beyond the four are accepted; the constraint does not refuse an extra key.
  from: The task's ADVISORY note on affected-counts leaves this open, and no criterion asks for a refusal. Refusing more would go beyond the criteria.
- inferred: The non-negative form is the regular expression ^[0-9]+$ on the JSON text of each count. It accepts 0, and leading-zero text cannot occur because jsonb normalises numbers.
  from: The 0001 convention of CHECK constraints. One pattern covers integer-ness and sign together; it is a form decision and not a business fact.
- inferred: The constraint was declared NOT VALID so as to leave rows already stored untouched, and no backfill was invented.
  from: The earlier task notes left that seam to the migration act. The task now records that production held no compliance_deletion row when 0007 was applied and validated, so the choice cost nothing in practice.
- inferred: The constraint is named compliance_deletion_affected_ck, and the migration took number 0007.
  from: The <table>_<what>_ck naming in 0001_init.sql, and 0006_original_input.sql being the latest structural migration at the time.
divergences:
- from: The 0006_original_input.sql header convention (an additive/reversible note and frozen decisions as a leading comment block)
  departure: 0007 has no header comment block and no comments, and the COMMENT ON COLUMN that stood in my first delivery has since been removed by the comment route.
  why: 'The framework rule that source carries no comments applies to every source file. The rollback would be two statements: ALTER TABLE compliance_deletion DROP CONSTRAINT compliance_deletion_affected_ck; then ALTER TABLE compliance_deletion ALTER COLUMN affected SET DEFAULT ''{}''::jsonb. Both would need the owner''s approval.'
preserved:
- 0001_init.sql is unedited.
- compliance_deletion keeps its columns, its NOT NULL on affected, its index compliance_deletion_raw_idx and its foreign key to raw_information.
- Migration 0007 is unedited by this delivery, and the setup run passed.
- The truncate scripts under ops/ are unaffected, since they reference the table only by name.
deferred:
- what: Requiring that each count equal what the deletion actually marked deleted (rules/knowledge-base/compliance-deletion-counts-what-it-marked).
  why: The task names it as a remainder owned by the backend's compliance deletion (task/compliance-deletion-counts-proof/counts-match-marked); the store cannot see it.
- what: Refusing keys beyond the four.
  why: No criterion covers it and the task's ADVISORY note leaves it to a reviewer. Tightening it would be a new migration.
---

## What it is

Migration `0007_compliance_deletion_affected_shape.sql` makes the store refuse a `compliance_deletion` row unless its `affected` value carries `chunks`, `fragments`, `links` and `attributes`, each a non-negative JSON integer. The four keys are the four attributes of `domain/knowledge-base/affected-counts`, and the zero-or-more bound is `rules/knowledge-base/affected-counts-non-negative`.

The file has two statements: it drops the `'{}'` default on `affected`, and it adds the CHECK `compliance_deletion_affected_ck`. The constraint was declared `NOT VALID`. The task now records that it was validated in production, which held no rows. The file holds no comments.

## Notes

- **This delivery wrote no source.** 0007 was already applied and already refuses a negative count, so I changed nothing. I ran nothing; the setup run the coordinator cites passed.
- **Standard.** `standards/database-migrations.yaml` (MIG-01 to MIG-06) was read in full. MIG-01 asks for a test script in `tests/` that rolls back. Three scripts exist there already (`compliance_deletion_affected_counts.sql`, `compliance_deletion_affected_absent.sql`, `compliance_deletion_affected_non_negative.sql`), and I wrote none of them. MIG-02 to MIG-06 reach `tests/`, which I did not touch. MIG-03 asks that `tests/applied.txt` stay current; I did not edit it, and it is the caller's to maintain.
- **Count equality.** A wrong but non-negative count, including all zeros, still passes the store. The task names this as a remainder owned by the backend.
- **Extra keys.** They are accepted, which the task leaves open.
- **Path.** `/home/siegfriedneto/projects/eternal/migrations/0007_compliance_deletion_affected_shape.sql`.
