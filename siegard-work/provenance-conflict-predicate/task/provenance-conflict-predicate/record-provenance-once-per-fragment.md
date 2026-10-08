---
title: Record the provenance of a recorded attribute or link once per fragment
summary: An entity edit that records a new attribute records its provenance from the edit's operator note, and a provenance recorded twice for the same fragment leaves one entry.
rationale: 'A corrective increment: the behavior was observed after the backend was delivered and answers to no criterion of the delivered tasks.'
sources:
- intake/scope.md
objective: The knowledge base records the provenance of attributes and links without refusing to record a fragment it already holds as provenance.
criteria:
- An entity edit that records a new attribute records the fragment of the edit's operator note as the provenance of that attribute.
- Recording a fragment as the provenance of an attribute that already holds it as provenance leaves one provenance entry for that attribute and that fragment.
- Recording a fragment as the provenance of a link that already holds it as provenance leaves one provenance entry for that link and that fragment.
- A corrected attribute takes the provenance entries of the attribute it supersedes.
- A corrected link takes the provenance entries of the link it supersedes.
implements:
- rules/knowledge-base/attribute-provenance-once-per-fragment
- rules/knowledge-base/link-provenance-once-per-fragment
- rules/knowledge-base/entity-edit-provenance
- rules/knowledge-base/corrected-item-provenance
- domain/knowledge-base/provenance
- domain/knowledge-base/node-attribute
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/entity-edit
- domain/knowledge-base/information-fragment
- domain/knowledge-base/assertion-correction
---
## What it is
The knowledge base records the provenance of an attribute or a link, and records the same fragment twice as one entry.

## Notes
UNDERDETERMINED, from the specification — Criteria 2 and 3 only ask that one provenance entry remains; they do not ask that the operation recording the fragment again succeeds, and the objective's 'without refusing' is carried by no criterion. Passes: an implementation where the unique constraint on provenance raises an error, so the correction or consolidation recording an already-held fragment fails and rolls back, leaving one entry while the operation is refused.
UNDERDETERMINED, from the specification — rules/knowledge-base/corrected-item-provenance has a second clause, the cited information fragment, that no criterion reaches. Passes: a correction citing an errata fragment whose new item holds the superseded provenance but none to the cited fragment.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-provenance gives the new attribute the superseded attribute's provenance only when it is a correction, and criterion 4 says nothing about what a succession's new attribute holds. Passes: a succession whose new attribute holds the superseded provenance as well as the edit's own fragment.
ADVISORY, from the specification — Criterion 1 says the fragment of the edit's operator note while rules/knowledge-base/entity-edit-provenance says the entity edit's information fragment; the operator-note identity comes from rules/knowledge-base/entity-edit-note-source, which is outside the candidates.
ADVISORY, from the specification — In criteria 4 and 5, takes the provenance entries of could be read as moving the entries off the superseded item; the nodes say the new item holds every provenance of the superseded item.
ADVISORY, from the specification — No candidate says what recorded_at a carried-over provenance takes, the original time or the time of the correction, which decides the order of the new item's provenance list.
REMAINDER, from the specification — The clauses of rules/knowledge-base/entity-edit-first-value, rules/knowledge-base/entity-edit-addition, rules/knowledge-base/entity-edit-succession, rules/knowledge-base/entity-edit-correction and scenarios/knowledge-base/stable-key-edit-is-a-correction are about how a set change is recorded and what effect it reports; belongs to the entity-edit recording task.
REMAINDER, from the specification — rules/knowledge-base/consolidation-records-provenance is reached only through its collision with the once-per-fragment rules; belongs to the consolidation task.
REMAINDER, from the specification — rules/knowledge-base/provenance-accepts-proposed-fragment and rules/knowledge-base/orphaned-fragment govern the fragment's status when provenance cites it; belongs to the information-fragment status lifecycle task.
REMAINDER, from the specification — rules/knowledge-base/provenance-in-recording-order, rules/knowledge-base/graph-provenance-order, rules/knowledge-base/graph-provenance-one-entry-per-chunk, rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt, rules/knowledge-base/graph-provenance-hides-compliance-deleted, rules/knowledge-base/graph-read-shows-empty-provenance and rules/knowledge-base/node-read-warns-attribute-without-provenance govern how provenance is read and shown; belong to the graph-read and node-read provenance presentation task.
REMAINDER, from the specification — rules/knowledge-base/empty-provenance-chain-refused, rules/knowledge-base/provenance-refused-after-compliance-deletion and rules/knowledge-base/compliance-refusal-takes-precedence govern refusals of a provenance read; belong to the provenance-read refusal task.
Decision, beyond the covers — stand: rules/knowledge-base/entity-edit-note-source is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/entity-edit-first-value is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/entity-edit-addition is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/entity-edit-succession is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/entity-edit-correction is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: scenarios/knowledge-base/stable-key-edit-is-a-correction is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/consolidation-records-provenance is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/provenance-accepts-proposed-fragment is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/orphaned-fragment is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/provenance-in-recording-order is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/graph-provenance-order is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/graph-provenance-one-entry-per-chunk is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/graph-provenance-hides-compliance-deleted is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/graph-read-shows-empty-provenance is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/node-read-warns-attribute-without-provenance is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/empty-provenance-chain-refused is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/provenance-refused-after-compliance-deletion is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
Decision, beyond the covers — stand: rules/knowledge-base/compliance-refusal-takes-precedence is not claimed, because it governs a neighboring behavior the criteria do not reach and the task only reads it.
