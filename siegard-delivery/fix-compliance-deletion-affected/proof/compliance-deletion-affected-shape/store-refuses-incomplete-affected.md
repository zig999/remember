---
target: database
title: Store-level proof of the compliance_deletion.affected shape
summary: Three self-contained psql scripts that apply 0007 inside a rolled-back transaction and show the store accepts an affected value only when it carries the four counts as non-negative integers, refuses a negative count, and refuses an omitted value.
implementation: sha256:80fe094e236b498866ce2e4248c8634c452c17db389e5f05ce5befd4a64e4cd6
tests:
- file: tests/compliance_deletion_affected_counts.sql
  name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
  proves: Criterion 1 "Recording a compliance deletion whose affected value lacks the chunks count is refused by the store.", criterion 2 "Recording a compliance deletion whose affected value lacks the fragments count is refused by the store.", criterion 3 "Recording a compliance deletion whose affected value lacks the links count is refused by the store.", criterion 4 "Recording a compliance deletion whose affected value lacks the attributes count is refused by the store.", criterion 5 "Recording a compliance deletion whose affected value carries a count that is not an integer is refused by the store." and criterion 8 "Recording a compliance deletion whose affected value carries the four counts as non-negative integers is accepted by the store." One accept case (chunks 3, fragments 2, links 1, attributes 0). Then, for each of the four keys, one missing-key case and six non-integer cases (string "5", fraction 1.5, JSON null, boolean, object, array). A failure message names the criterion and the key or value.
  fails_when: The store accepts an affected value lacking any one of chunks, fragments, links or attributes. Or it accepts a non-integer (string, fraction, null, boolean, object, array) for any one of the four keys. Or it refuses a value carrying the four counts as non-negative integers (3, 2, 1, 0). A check that guards only some of the keys fails it. So does a check that lets a missing key through, which is what a bare NULL in a CHECK does.
  demonstrates: domain/knowledge-base/affected-counts
- file: tests/compliance_deletion_affected_non_negative.sql
  name: a negative count is refused
  proves: Criterion 6 "Recording a compliance deletion whose affected value carries a negative count is refused by the store." The test inserts -1 into each of the four counts in turn. A control first shows that four zero counts are accepted, so the refusal is owed to the sign and not to a check that refuses everything. Zero accepted and -1 refused is the boundary.
  fails_when: The store accepts an affected value with -1 in any one of chunks, fragments, links or attributes, for example a pattern that allows a leading minus sign (the first form of 0007) or a sign check on only some of the keys. It also fails if four zeros are refused, because the refusal of -1 would then prove nothing about the sign.
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
- 'domain/knowledge-base/compliance-deletion: the node''s fact is an aggregate root that keeps a deleted source''s knowledge from being presented as still traceable. That is behavior of the deletion''s execution and presentation in the service layer, and no finite store test decides it. A test over affected alone would assert part of it as the whole. Only the affected part is covered, by the test that demonstrates affected-counts.'
- 'rules/knowledge-base/compliance-deletion-counts-what-it-marked: each count equals the number of chunks, fragments, links and attributes the deletion actually marked deleted. The store cannot see the marking, so no finite store test decides it. The sign clause (a count is never negative) is tested under criterion 6, but that is part of the rule and not the whole, so no test names the rule. A store test that inserts counts and compares them to counts the test chose would be vacuous, because the test would be its own oracle.'
- 'UNDERDETERMINED entry (a store constraint that accepts any four non-negative integers, for example a deletion recorded with 0, 0, 0, 0 when it marked 3 raw chunks and 5 fragments deleted): nothing in this task excludes it. The entry itself says the equality clause belongs to the operation that computes the counts, and that operation is the deletion''s execution in the service layer, which this task neither ships nor changes. It names no implementation a store test can fail over. Excluding it would need a test over the execution in the task that owns it. A store script that simulated the marking would prove the simulation.'
- 'Inference (behavior): keys beyond the four are accepted. The task''s ADVISORY note leaves this open for a reviewer, and no criterion or node decides it. The value object declares four attributes and says nothing on exclusivity, so no test either accepts or refuses an extra key.'
- 'Inference (behavior): a fractional value that is numerically whole, such as 1.0, is refused as a non-integer, because the check reads the JSON text. No node says whether 1.0 is an integer. It is not pinned and not exercised.'
- 'Inference (behavior): rows already stored that lack the required shape are kept and the constraint is added NOT VALID. No node decides this. The scripts run against a scratch database with no legacy rows, and the update behavior of a NOT VALID constraint on old rows is not tested.'
- 'Inference (behavior): the ''{}'' default is dropped. Criterion 7 is tested through its outcome, a refusal by NOT NULL or by the CHECK. The scripts do not distinguish which of the two refused, so they do not pin the drop.'
- 'Inferences about arrangement (the constraint name compliance_deletion_affected_ck, the migration number 0007, editing 0007 in place and not adding 0008, NOT VALID, the ^[0-9]+$ pattern, the absence of a header comment, the rollback statements): not tested, since a test would pin the shape and not the behavior. The tests catch check_violation and not_null_violation without naming the constraint.'
---

## What it is

Three psql scripts under `/home/siegfriedneto/projects/eternal/migrations/tests/` prove the store shape of `compliance_deletion.affected` that migration `0007_compliance_deletion_affected_shape.sql` sets up, against the task's eight criteria. Each script is self-contained: it opens a transaction, applies 0007 with `\ir`, inserts one fixture `raw_information` row, runs its cases in a PL/pgSQL `DO` block, and ends with `ROLLBACK`. Nothing is changed durably, and no script depends on another.

- `compliance_deletion_affected_counts.sql` covers criteria 1-5 and 8 as one matrix and is offered as the proof of `domain/knowledge-base/affected-counts`.
- `compliance_deletion_affected_non_negative.sql` covers criterion 6, the refusal of a negative count.
- `compliance_deletion_affected_absent.sql` covers criterion 7.

A refusal is asserted as a `check_violation` or `not_null_violation` only. A foreign-key or unique failure from a broken fixture raises instead of passing as a refusal. The matrix and negative scripts each carry an acceptance control, so a store that refuses everything cannot pass them.

## Notes

- **How to run by hand.** Use a scratch database with `0001_init.sql` through `0006_original_input.sql` applied (the seeds are not needed) and `0007` not applied. From `/home/siegfriedneto/projects/eternal/migrations/tests/`, run `psql -d <scratch> -f <script>`. Each script sets `ON_ERROR_STOP`, so a failing case exits non-zero and prints the case in the exception message. A script that completes without error passes. Point it at a real database only with the owner's approval. The `ROLLBACK` protects it, but the protocol asks for approval first.
- **Re-delivery.** The owner settled the earlier contested point, so the record carries no `contested`. The negative-count test is unchanged in what it asserts (-1 refused on each of the four keys, four zeros accepted). Criterion 6 now owns it, where before it cited the rule node. I renumbered the failure messages in the other two scripts to the task's new numbering (absent is criterion 7, acceptance is criterion 8), and no assertion was weakened. Read against the revised 0007 (`^[0-9]+$`), all three scripts should pass.
- **Why `affected-counts` is demonstrated by the matrix.** Its fact is four required integer attributes. A test over every key that is missing, every key with a non-integer, and a complete accepted value decides it whole. The criterion cases share that test on purpose. Each failure message names the criterion and the key, so a failure still names the obligation violated. The node declares only integer, so sign is a separate test under criterion 6 and does not enter the matrix.
- **What I did not claim.** `compliance-deletion` and `compliance-deletion-counts-what-it-marked` carry no `demonstrates`, for the reasons under `untested`. The negative-count test exercises only the sign clause of the rule, so it does not demonstrate the rule.
- **Non-integer representatives.** The string "5", fraction 1.5, JSON null, boolean, object and array are six distinct JSON types that the check must refuse. They are applied to all four keys, because the check has one term per key and a missing integer term on one key is a real defect. The value 1.0 is left out (see `untested`).
- **Checked here.** I wrote the scripts and ran nothing. I checked no line counts, because the target declares no standard. The fixture's enum value is `(enum_range(NULL::source_type))[1]`, so no enum literal is assumed.
