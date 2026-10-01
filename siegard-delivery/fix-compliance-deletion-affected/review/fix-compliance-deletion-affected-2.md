---
target: database
title: Second review of the compliance_deletion.affected shape delivery
summary: What the coverage, conformance, standard and certification passes found over migration 0007 and its three proofs after the re-delivery that bound the non-negative rule.
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
- pass: failures
  missing: run/fix-compliance-deletion-affected-2 passed; there was no failure to read
standard:
  at: ../standards/database-migrations.yaml
  pin: sha256:d71367eb95f2dcb81a8a72c1d2486975ca8d5b56466ec0280090f9da8a4fcf26
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
    name: a negative count is refused, zero is accepted
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
    name: a negative count is refused, zero is accepted
unpaired: []
run: run/fix-compliance-deletion-affected-2
reconciliation: siegard-reconcile/fix-compliance-deletion-affected-2.md
---

## What it is

The second review of the 0007 delivery, after the re-delivery that bound rules/knowledge-base/affected-counts-non-negative to the migration.
The captured run, run/fix-compliance-deletion-affected-2, installed with npm ci and ran the suite on an ephemeral Neon branch, with all three scripts reported PASS.
All eight criteria are covered, no test is unpaired, and no pass recorded a finding.

## Notes

The certification of rules/knowledge-base/affected-counts-non-negative came back covered by tests/compliance_deletion_affected_non_negative.sql.
The certification of domain/knowledge-base/affected-counts came back partial with a testable remainder: no test runs a compliance deletion and compares the recorded counts with what it marked deleted, which the proof increment proof-compliance-counts owes in the backend.
The coverage pass noted that whether a whole-valued fraction such as 1.0 counts as an integer is left open by criterion 5 and exercised by no test.
The standard pass looked past the NOT VALID clause and the scripts relying on the applied schema, which no rule in scope names.
This framework does not review security, performance, or the migration's behaviour on rows already stored.
