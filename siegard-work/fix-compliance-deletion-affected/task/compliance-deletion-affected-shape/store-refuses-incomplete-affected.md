---
title: The store refuses a compliance deletion whose affected counts are incomplete
summary: A new migration makes compliance_deletion.affected hold the four counts of a compliance deletion's reach, and nothing less.
sources:
- intake/scope.md
objective: A compliance deletion is recorded only when its affected value carries the four counts it marked deleted.
criteria:
- Recording a compliance deletion whose affected value lacks the chunks count is refused by the store.
- Recording a compliance deletion whose affected value lacks the fragments count is refused by the store.
- Recording a compliance deletion whose affected value lacks the links count is refused by the store.
- Recording a compliance deletion whose affected value lacks the attributes count is refused by the store.
- Recording a compliance deletion whose affected value carries a count that is not an integer is refused by the store.
- Recording a compliance deletion that states no affected value is refused by the store.
- Recording a compliance deletion whose affected value carries the four integer counts is accepted by the store.
implements:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/affected-counts
- rules/knowledge-base/compliance-deletion-counts-what-it-marked
---

## What it is

A corrective task over migrations/0001_init.sql: a new versioned migration hardens compliance_deletion.affected, presented to the owner for approval before it runs against any database.

## Notes

UNDERDETERMINED, from the specification — The objective says "the four counts it marked deleted"; rules/knowledge-base/compliance-deletion-counts-what-it-marked requires each count to equal the number of raw chunks, information fragments, knowledge links and node attributes the deletion actually marked deleted, while criteria 1-7 test only the shape of the affected value, so a wrong count recorded by the deletion's execution still passes. Passes: a migration whose check accepts any affected value carrying chunks, fragments, links and attributes as integers while the compliance deletion records counts that differ from what it marked deleted (for example all zeros after marking chunks and fragments deleted).
UNDERDETERMINED, from the specification — rules/knowledge-base/compliance-deletion-counts-what-it-marked defines each count as a number of items marked deleted, so no count can be negative, yet criterion 5 refuses only non-integer counts and criterion 7 accepts any four integer counts. Passes: a store check that requires the four keys to be integers and accepts an affected value such as chunks -1, fragments 0, links 0, attributes 0.
ADVISORY, from the specification — The decision log retires the earlier string type of compliance-deletion's affected attribute and names domain/knowledge-base/affected-counts as its type, which is why both nodes are implemented here and the value object's four required integer attributes back criteria 1-7.
ADVISORY, from the specification — The criteria do not say what happens to compliance_deletion rows already stored whose affected value lacks the four-count shape; such rows would make a new constraint fail to apply or would need to be kept as they are, a seam of the migration act rather than a fact of the nodes.
REMAINDER, from the specification — The clauses of rules/knowledge-base/compliance-deletion-tombstones reach no criterion of this task; they belong to the compliance deletion's execution in the service layer.
Decision, beyond the covers — stand: rules/knowledge-base/compliance-deletion-tombstones is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and this node governs the deletion's execution, not that shape.
REMAINDER, from the specification — The clause of rules/knowledge-base/compliance-deletion-propagates reaches no criterion of this task; it belongs to the compliance deletion's execution in the service layer.
Decision, beyond the covers — stand: rules/knowledge-base/compliance-deletion-propagates is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and this node governs the deletion's execution, not that shape.
REMAINDER, from the specification — The clauses of rules/knowledge-base/compliance-deletion-records-curation-action reach no criterion of this task; they belong to the compliance deletion's audit recording in the service layer.
Decision, beyond the covers — stand: rules/knowledge-base/compliance-deletion-records-curation-action is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and this node governs the deletion's execution, not that shape.
REMAINDER, from the specification — The clause of rules/knowledge-base/deletion-execution-time-is-recording-time reaches no criterion of this task; it belongs to the compliance deletion's recording, in the service layer or the executed_at default.
Decision, beyond the covers — stand: rules/knowledge-base/deletion-execution-time-is-recording-time is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and this node governs the deletion's execution, not that shape.
REMAINDER, from the specification — The clause of rules/knowledge-base/deleted-source-deletion-records-nothing reaches no criterion of this task; it belongs to the compliance deletion's outcome handling in the service layer.
Decision, beyond the covers — stand: rules/knowledge-base/deleted-source-deletion-records-nothing is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and this node governs the deletion's execution, not that shape.
REMAINDER, from the specification — The clauses of rules/knowledge-base/compliance-deletion-check-order reach no criterion of this task; they belong to the compliance deletion's request validation in the service layer.
Decision, beyond the covers — stand: rules/knowledge-base/compliance-deletion-check-order is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and this node governs the deletion's execution, not that shape.
ADVISORY, from the specification — constraints/compliance-deletion-is-atomic is a neighbour: a store refusal of a malformed affected value inside the deletion's transaction rolls back its tombstones, which fits the constraint, and no criterion here implements it.
Decision, beyond the covers — stand: constraints/compliance-deletion-is-atomic is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and this node governs the deletion's execution, not that shape.
ADVISORY, from the specification — domain/knowledge-base/raw-information was a candidate but does not govern the shape of compliance_deletion.affected, and is left out of implements.
Decision, beyond the covers — stand: domain/knowledge-base/raw-information is not claimed; the owner's correction is the store shape of compliance_deletion.affected alone, and the raw information's shape is untouched by it.
