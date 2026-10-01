---
target: database
title: Store-level proof of the compliance_deletion.affected shape
summary: Three self-contained rolled-back SQL scripts, run by the registry's suite on an ephemeral Neon branch where 0007 stands, show the store accepts an affected value only when it carries the four counts as non-negative integers, refuses a negative count, and refuses an omitted value.
implementation: sha256:1e04344062390d9932a5072041ed974e0fcad3a769a12399a9ac953a3ab6f194
standard:
  at: ../standards/database-migrations.yaml
  pin: sha256:d71367eb95f2dcb81a8a72c1d2486975ca8d5b56466ec0280090f9da8a4fcf26
run: run/compliance-deletion-affected-shape-store-refuses-incomplete-affected-suite
tests:
- file: tests/compliance_deletion_affected_counts.sql
  name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
  proves: Criterion 1 "Recording a compliance deletion whose affected value lacks the chunks count is refused by the store.", criterion 2 "Recording a compliance deletion whose affected value lacks the fragments count is refused by the store.", criterion 3 "Recording a compliance deletion whose affected value lacks the links count is refused by the store.", criterion 4 "Recording a compliance deletion whose affected value lacks the attributes count is refused by the store.", criterion 5 "Recording a compliance deletion whose affected value carries a count that is not an integer is refused by the store." and criterion 8 "Recording a compliance deletion whose affected value carries the four counts as non-negative integers is accepted by the store." One accept case (chunks 3, fragments 2, links 1, attributes 0). Then, for each of the four keys, one missing-key case and six non-integer cases (string "5", fraction 1.5, JSON null, boolean, object, array). A failure message names the criterion and the key or value.
  fails_when: The store accepts an affected value lacking any one of chunks, fragments, links or attributes. Or it accepts a non-integer (string, fraction, null, boolean, object, array) for any one of the four keys. Or it refuses a value carrying the four counts as non-negative integers (3, 2, 1, 0). A check that guards only some of the keys fails it. So does a check that lets a missing key through, which is what a bare NULL in a CHECK does.
  demonstrates: domain/knowledge-base/affected-counts
- file: tests/compliance_deletion_affected_non_negative.sql
  name: a negative count is refused, zero is accepted
  proves: Criterion 6 "Recording a compliance deletion whose affected value carries a negative count is refused by the store." and the fact of rules/knowledge-base/affected-counts-non-negative, "Each of a compliance deletion's affected counts is zero or more." The script first shows that four zero counts are accepted, so the sign is the only thing the next cases vary. It then inserts -1 into each of the four counts in turn and requires the refusal. Zero accepted and -1 refused is the boundary where the rule turns, held for each of the four counts the rule names.
  fails_when: The store accepts an affected value with -1 in any one of chunks, fragments, links or attributes, for example a pattern that allows a leading minus sign (the first form of 0007) or a sign check on only some of the keys. It also fails if four zeros are refused, because the rule says zero is allowed and the refusal of -1 would then prove nothing about the sign.
  demonstrates: rules/knowledge-base/affected-counts-non-negative
- file: tests/compliance_deletion_affected_absent.sql
  name: a compliance deletion that states no affected value is refused
  proves: 'Criterion 7 "Recording a compliance deletion that states no affected value is refused by the store.", in two forms: the affected column omitted from the insert, and an explicit NULL.'
  fails_when: An insert that omits affected, or gives it NULL, is accepted. For example the store fills in a value and records it, or the NOT NULL is lost.
not_applicable:
- edge_case: an affected value that is not a JSON object (array, scalar, top-level null)
  why: Such a value lacks all four keys, so it falls in the missing-key class of criteria 1-4, which the matrix already represents. No criterion or node treats a non-object separately.
- edge_case: an update of an existing compliance_deletion row
  why: Every criterion speaks of recording a compliance deletion, meaning an insert. No node states the behavior of a later update.
- edge_case: a duplicate compliance deletion for the same raw information
  why: Uniqueness is not claimed by any criterion or node. The table has an index on raw_information_id, not a unique constraint.
- edge_case: concurrent inserts, a failing or slow dependency, an empty collection
  why: The task is a single-statement shape check. It has no dependency, collection or cross-row state, and no obligation states concurrent behavior.
- edge_case: a very large integer count, or a second negative value such as -5
  why: No criterion or node sets an upper bound, and any negative integer falls in the class the -1 case already represents. Two values in one class prove the same thing.
untested:
- 'domain/knowledge-base/compliance-deletion: the node''s fact is an aggregate root that keeps a deleted source''s knowledge from being presented as still traceable. That is behavior of the deletion''s execution and presentation in the backend, and no finite store test decides it. A test over affected alone would assert part of it as the whole. Only the affected part is covered, by the tests that demonstrate affected-counts and affected-counts-non-negative.'
- 'rules/knowledge-base/compliance-deletion-counts-what-it-marked: each count equals the number of chunks, fragments, links and attributes the deletion actually marked deleted. The store cannot see the marking, so no finite store test decides it. The task names this as a remainder owned by the backend''s compliance deletion (task/compliance-deletion-counts-proof/counts-match-marked), and a store script that simulated the marking would prove the simulation. The non-negative consequence of the rule is held by affected-counts-non-negative, which has its own test.'
- 'Inference (behavior): keys beyond the four are accepted. The task''s ADVISORY note says no criterion decides what happens to an affected value with an extra member, and the value object declares four attributes and says nothing on exclusivity. No test either accepts or refuses an extra key.'
- 'Inference (behavior): a fractional value that is numerically whole, such as 1.0, is refused as a non-integer, because the check reads the JSON text. No node says whether 1.0 is an integer. It is not pinned and not exercised.'
- 'Inference (behavior): the constraint is NOT VALID, so rows already stored that lack the required shape are kept. The task records that production held no compliance_deletion row when 0007 was applied and validated, and no node decides the seam. The scripts insert only fresh rows inside a rolled-back transaction, so the behavior of the constraint on old rows is not tested.'
- 'Inference (behavior): the ''{}'' default is dropped. Criterion 7 is tested through its outcome, a refusal by NOT NULL or by the CHECK. The scripts do not distinguish which of the two refused, so they do not pin the drop.'
- 'Inferences about arrangement (the constraint name compliance_deletion_affected_ck, the migration number 0007, NOT VALID, the ^[0-9]+$ pattern, the absence of comments in 0007): not tested, since a test would pin the shape and not the behavior. The tests catch check_violation and not_null_violation without naming the constraint.'
---

## What it is

Three SQL scripts under `/home/siegfriedneto/projects/eternal/migrations/tests/` prove the store shape of `compliance_deletion.affected` that migration `0007_compliance_deletion_affected_shape.sql` sets up, against the task's eight criteria and the nodes it implements. No test file was written or changed in this re-delivery. The three scripts that stand are the ones from the earlier delivery, and the `\ir` line that another delivery (database-test-harness) removed from them leaves every assertion as it was.

Each script is self-contained: it opens a transaction, inserts one fixture `raw_information` row, runs its cases in a PL/pgSQL `DO` block, and ends with `ROLLBACK`. They assume the schema already holds 0007, which the registry's suite (`node tests/run.mjs`) guarantees by running them on an ephemeral Neon branch created from production, where 0007 stands and `tests/applied.txt` reads `0007`.

- `compliance_deletion_affected_counts.sql` covers criteria 1-5 and 8 as one matrix and is offered as the proof of `domain/knowledge-base/affected-counts`.
- `compliance_deletion_affected_non_negative.sql` covers criterion 6 and is offered as the proof of `rules/knowledge-base/affected-counts-non-negative`.
- `compliance_deletion_affected_absent.sql` covers criterion 7.

A refusal is asserted as a `check_violation` or `not_null_violation` only. A foreign-key or unique failure from a broken fixture raises instead of passing as a refusal. The matrix and non-negative scripts each carry an acceptance control, so a store that refuses everything cannot pass them.

## Notes

- **Nothing was written.** The task now carries no UNDERDETERMINED entry. Its criteria, the four nodes and the implementation record all still match what the three scripts assert. Making the proof whole again meant re-reading each script against that, not editing any.
- **New demonstration.** `rules/knowledge-base/affected-counts-non-negative` states one fact, that each count is zero or more. The non-negative script decides it at the boundary for each of the four counts: zero accepted, -1 refused. Integers beyond that boundary are the same class, so I claim it whole. `affected-counts` stays on the matrix, whose fact is the four required integer attributes. Sign is not part of that node's fact, so the matrix has no negative case.
- **Not claimed.** `compliance-deletion` and `compliance-deletion-counts-what-it-marked` carry no `demonstrates`, for the reasons under `untested`.
- **Standard.** I read `/home/siegfriedneto/projects/eternal/standards/database-migrations.yaml`. MIG-01 (a test script in `tests/` inside BEGIN … ROLLBACK) is the only rule that reaches my files, and the three scripts follow it, so there is no divergence to disclose. MIG-02 to MIG-06 reach `tests/run.mjs` and `tests/applied.txt`, which I did not touch. The `standard.pin` is carried from the implementation record, which pins the same file. I could not compute the hash myself, so the caller should check it against `sha256sum` of the standard.
- **How to run.** The registry's step is `node tests/run.mjs` from the migrations root, on its ephemeral branch. By hand against a scratch database that already holds `0001_init.sql` through `0007`, run `psql -d <scratch> -f <script>` from the tests directory. Each script sets `ON_ERROR_STOP`, so a failing case exits non-zero and prints the case in the exception message. A script that completes without error passes. None of these writes durably. A run against production is not covered by this proof and needs the owner's approval.
- **Run record.** I ran nothing. If the project owes a captured run of the suite for this proof, it is the caller's to attach.
