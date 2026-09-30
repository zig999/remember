---
target: database
title: Store-level proof of the compliance_deletion.affected shape
summary: Three self-contained psql scripts that apply 0007 inside a rolled-back transaction and show the store accepts an affected value only when it carries the four integer counts, refuses an omitted value, and (per the rule node) refuses a negative count.
implementation: sha256:1cee70cd0aa89026859f0bceaf709564fdee6bae61949e3d30d111437c1a0148
tests:
- file: tests/compliance_deletion_affected_counts.sql
  name: affected-counts matrix (four integer counts accepted; each count required; each count an integer)
  proves: Criteria 1-4 ("Recording a compliance deletion whose affected value lacks the chunks / fragments / links / attributes count is refused by the store"), criterion 5 ("... carries a count that is not an integer is refused by the store") and criterion 7 ("... carries the four integer counts is accepted by the store"). One accept case, then for each of the four keys one missing-key case and six non-integer cases (string "5", fraction 1.5, JSON null, boolean, object, array). A failure names the criterion and the key or value.
  fails_when: The store accepts an affected value lacking any one of chunks, fragments, links or attributes; or accepts a non-integer (string, fraction, null, boolean, object, array) for any one of the four keys; or refuses a value carrying the four integer counts (3, 2, 1, 0). A check that guards only some of the keys fails it. So does a check that treats a missing key as passing, which is what a bare NULL in a CHECK does.
  demonstrates: domain/knowledge-base/affected-counts
- file: tests/compliance_deletion_affected_absent.sql
  name: a compliance deletion that states no affected value is refused
  proves: 'Criterion 6 ("Recording a compliance deletion that states no affected value is refused by the store"), in two forms: the affected column omitted from the insert, and an explicit NULL.'
  fails_when: An insert that omits affected, or gives it NULL, is accepted. For example the store fills in an empty or default value and records it, or the NOT NULL is lost.
- file: tests/compliance_deletion_affected_non_negative.sql
  name: a negative count is refused
  proves: 'UNDERDETERMINED entry 2: rules/knowledge-base/compliance-deletion-counts-what-it-marked defines each count as a number of items marked deleted, so a count cannot be negative. The test inserts -1 into each of the four counts in turn, with a control that four zeros are accepted, so the refusal is owed to the sign.'
  fails_when: 'The store accepts an affected value such as chunks -1, fragments 0, links 0, attributes 0, for any one of the four keys. This is exactly the check the entry names: four keys required as integers, nothing on sign. It also fails if zero is refused, because the control then shows the -1 refusal is not about the sign.'
not_applicable:
- edge_case: an affected value that is not a JSON object (array, scalar, top-level null)
  why: Such a value lacks all four keys, so it falls in the missing-key class of criteria 1-4, which the matrix already represents. No criterion or node treats a non-object separately.
- edge_case: an update of an existing compliance_deletion row
  why: Every criterion speaks of recording a compliance deletion, meaning an insert. No node states the behavior of a later update.
- edge_case: a duplicate compliance deletion for the same raw information
  why: Uniqueness is not claimed by any criterion or node. The table has an index on raw_information_id, not a unique constraint.
- edge_case: concurrent inserts, a failing or slow dependency, an empty collection
  why: The task is a single-statement shape check. It has no dependency, collection or cross-row state, and no obligation states concurrent behavior.
- edge_case: a very large integer count
  why: No criterion or node sets an upper bound. Large integers fall in the same class as the representative integers already tried.
untested:
- 'domain/knowledge-base/compliance-deletion: the node''s fact is an aggregate root that keeps a deleted source''s knowledge from being presented as still traceable. That is behavior of the deletion''s execution and presentation in the service layer, and no finite store test decides it. A test over affected alone would assert part of it as the whole. Only the affected part is covered, by the test that demonstrates affected-counts.'
- 'rules/knowledge-base/compliance-deletion-counts-what-it-marked: each count equals the number of chunks, fragments, links and attributes the deletion actually marked deleted. The store cannot see the marking, so no DDL check decides it. A store test that inserts counts and compares them to counts the test chose would be vacuous, because the test would be its own oracle.'
- 'UNDERDETERMINED entry 1 (a migration that accepts any four integers while the deletion records counts that differ from what it marked, for example all zeros after marking chunks and fragments deleted): nothing in this task excludes it. The marking and the recording are the deletion''s execution in the service layer, which this task neither ships nor changes. A test here would have to simulate the deletion, and that would prove the simulation. The fact needs a test over the execution in the owning task, and a test on the store cannot stand in for it.'
- 'Inference (behavior): a fractional value that is numerically whole, such as 1.0, is refused as a non-integer, because the check reads the JSON text. No node says whether 1.0 is an integer. It is not pinned and not exercised.'
- 'Inference (behavior): extra keys in affected beside the four counts are accepted. The value object declares four attributes and says nothing on exclusivity, so no test either accepts or refuses an extra key.'
- 'Inference (behavior): rows already stored that lack the four-count shape are kept and the constraint is added NOT VALID. No node decides this. The scripts run against a scratch database with no legacy rows, and the update behavior of a NOT VALID constraint on old rows is not tested.'
- 'Inference (behavior): the ''{}'' default is dropped. Criterion 6 is tested through its outcome, a refusal by NOT NULL or by the CHECK. The scripts do not distinguish which of the two refused, so they do not pin the drop.'
- 'Inferences about arrangement (the constraint name compliance_deletion_affected_ck, the migration number 0007, NOT VALID, the absence of a header comment, the rollback statements): not tested, since a test would pin the shape and not the behavior. The tests catch check_violation and not_null_violation without naming the constraint.'
contested:
- what: The implementation accepts negative counts (recorded as an inference from criteria 5 and 7). The negative-count test states what rules/knowledge-base/compliance-deletion-counts-what-it-marked requires, and it fails against migration 0007 as written.
  why: The rule defines each count as a number of items marked deleted, so it cannot be negative. Criterion 7 ("the four integer counts") and criterion 5 ("not an integer") say only integer, so the criteria and the rule node disagree on sign. Each is tested as stated. Criterion 7's test uses only non-negative integers, so it does not contradict the rule. Only the negative-count test expects the store to refuse -1, and only that one is red against the current migration. The resolution (add a non-negative term to the CHECK, or amend the rule or criterion) is not made here.
---

## What it is

Three psql scripts under `/home/siegfriedneto/projects/eternal/migrations/tests/` prove the store shape of `compliance_deletion.affected` that migration `0007_compliance_deletion_affected_shape.sql` sets up. Each is self-contained: it opens a transaction, applies 0007 with `\ir`, inserts one fixture `raw_information` row, runs its cases in a PL/pgSQL `DO` block, and ends with `ROLLBACK`. Nothing is changed durably, and no script depends on another.

- `compliance_deletion_affected_counts.sql` covers criteria 1-5 and 7 as one matrix and is offered as the proof of `domain/knowledge-base/affected-counts`.
- `compliance_deletion_affected_absent.sql` covers criterion 6.
- `compliance_deletion_affected_non_negative.sql` covers UNDERDETERMINED entry 2 (negative counts).

A refusal is asserted as a `check_violation` or `not_null_violation` only. A foreign-key or unique failure from a broken fixture raises instead of passing as a refusal. Each matrix and negative script also carries an acceptance control, so a store that refuses everything cannot pass them.

## Notes

- **How to run by hand.** Use a scratch database with `0001_init.sql` through `0006_original_input.sql` applied (the seeds are not needed) and `0007` not applied. From `/home/siegfriedneto/projects/eternal/migrations/tests/`, run `psql -d <scratch> -f <script>`. Each script sets `ON_ERROR_STOP`, so a failing case exits non-zero and prints the case in the exception message. A script that completes without error passes. Point it at a real database only with the owner's approval. The `ROLLBACK` protects it, but the protocol asks for approval first.
- **Expected state against the current 0007.** The counts and absent scripts should pass. The non-negative script should fail, reading "a negative chunks count was accepted". That is the contested point above, and I did not change the implementation.
- **Why `affected-counts` is demonstrated by the matrix.** Its fact is four required integer attributes. A test over every key that is missing, every key with a non-integer, and a complete accepted value decides it whole. The criterion cases share that test on purpose. Each failure message names the criterion and the key, so a failure still names the obligation violated. The matrix takes no sign cases, because the node says integer and sign belongs to the rule node.
- **What I did not claim.** `compliance-deletion` and `compliance-deletion-counts-what-it-marked` carry no `demonstrates`, for the reasons under `untested`. The negative-count test exercises only the sign clause of the rule, so it does not demonstrate the rule.
- **Non-integer representatives.** The string "5", fraction 1.5, JSON null, boolean, object and array are six distinct JSON types that the check must refuse. They are applied to all four keys, because the check has one term per key and a missing integer term on one key is a real defect. The value 1.0 is left out (see `untested`).
- **Checked here.** I wrote the scripts and ran nothing, and I checked no line counts because the target declares no standard. The enum value for the fixture is `(enum_range(NULL::source_type))[1]`, so no enum literal is assumed.
