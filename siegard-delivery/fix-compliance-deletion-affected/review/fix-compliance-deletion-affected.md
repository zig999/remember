---
target: database
title: Review of the compliance_deletion.affected shape delivery
summary: What the coverage and conformance passes found over migration 0007 and its three SQL proofs; the standard and failures passes did not run.
reviewed:
- 0007_compliance_deletion_affected_shape.sql
- tests/compliance_deletion_affected_counts.sql
- tests/compliance_deletion_affected_absent.sql
- tests/compliance_deletion_affected_non_negative.sql
tasks:
- task/compliance-deletion-affected-shape/store-refuses-incomplete-affected
passes:
- pass: coverage
- pass: conformance
- pass: standard
  missing: 'the project file declares no standard for the database target (standard database: null), so the project has authored none'
- pass: failures
  missing: no registry declares commands for the database target and the caller named neither steps nor a captured run, so nothing was run and nothing was diagnosed
coverage:
- criterion: Recording a compliance deletion whose affected value lacks the chunks count is refused by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_counts.sql
    name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
- criterion: Recording a compliance deletion whose affected value lacks the fragments count is refused by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_counts.sql
    name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
- criterion: Recording a compliance deletion whose affected value lacks the links count is refused by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_counts.sql
    name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
- criterion: Recording a compliance deletion whose affected value lacks the attributes count is refused by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_counts.sql
    name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
- criterion: Recording a compliance deletion whose affected value carries a count that is not an integer is refused by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_counts.sql
    name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
- criterion: Recording a compliance deletion whose affected value carries a negative count is refused by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_non_negative.sql
    name: a negative count is refused
- criterion: Recording a compliance deletion that states no affected value is refused by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_absent.sql
    name: a compliance deletion that states no affected value is refused
- criterion: Recording a compliance deletion whose affected value carries the four counts as non-negative integers is accepted by the store.
  state: covered
  tests:
  - file: tests/compliance_deletion_affected_counts.sql
    name: affected-counts matrix (four non-negative integer counts accepted; each count required; each count an integer)
  - file: tests/compliance_deletion_affected_non_negative.sql
    name: a negative count is refused
unpaired: []
findings:
- pass: conformance
  file: 0007_compliance_deletion_affected_shape.sql
  where: lines 11-12, the COMMENT ON COLUMN statement on compliance_deletion.affected
  evidence: "COMMENT ON COLUMN compliance_deletion.affected IS\n  'Contagens do alcance do apagamento: objeto com chunks, fragments, links e attributes, cada um inteiro nao negativo. Sem default.';"
  cost: The column's shape (the four counts, each a non-negative integer, no default) is written a second time as catalog prose, beside the CHECK in this file that enforces it and beside domain/knowledge-base/affected-counts, which holds it. If the node gains or renames a count, the CHECK and the comment can disagree, and nothing reads the comment to notice. The next reader of the table description would take it for the shape's home.
  correction: Remove the COMMENT ON COLUMN statement. The CHECK constraint in this file already holds the shape and the node holds the fact. This is a finding against prose, not behavior. No running system emits the catalog comment as a tool description, error message or log line.
reconciliation: siegard-reconcile/fix-compliance-deletion-affected.md
---

## What it is

The review of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected over migration 0007 and its three SQL proofs.
The coverage pass found all eight criteria covered and no unpaired test.
The conformance pass cleared domain/knowledge-base/compliance-deletion and domain/knowledge-base/affected-counts on 0007 and found one restatement, the column comment.

## Notes

The standard and failures passes did not run: the database target declares no standard and no commands.
No certification was staged: the proof claims domain/knowledge-base/affected-counts as demonstrated, and the staging refused to compose a certification because no registry declares a suite step for this target.
The three proof scripts were run by hand on a Neon test branch through a temporary runner outside this framework, all passing; that run is not captured under run/ and this record does not rest on it.
rules/knowledge-base/compliance-deletion-counts-what-it-marked is demonstrated by no test; the proof says the store cannot see what a deletion marked, so equality of the counts belongs to the deletion's execution in the service layer.
The coverage auditor noted that a zero-fraction number such as 1.0 is not exercised under criterion 5, and that the four-zero acceptance in the negative-count script is only a control for criterion 8.
The conformance judges looked past the NOT VALID clause and the regex form as implementation choices, and past the test scripts' criterion-numbered messages as plan references.
This framework does not review security, performance, or the migration's behavior on rows already stored.
