---
title: Re-affirm a proposal that meets a current assertion with the same target or value and states another validity start
summary: A link or attribute proposal with change hint none that repeats the target or value of the current assertion is taken as a re-affirmation whatever validity start it states.
objective: A link or attribute proposal with change hint none that meets a current assertion of a type that does not allow multiple current assertions with the same target or value, and states a different validity start, is a re-affirmation of that assertion.
criteria:
- A link proposal with change hint none whose target is the target of the current link of its source and link type that does not allow multiple current links, and that states a different validity start, is answered as a re-affirmation of that link.
- An attribute proposal with change hint none whose value is the value of the current attribute of its node and attribute key that does not allow multiple current values, and that states a different validity start, is answered as a re-affirmation of that attribute.
- A link proposal that re-affirms the current link with a different validity start records no new link.
- An attribute proposal that re-affirms the current attribute with a different validity start records no new attribute.
- A link proposal that re-affirms the current link with a different validity start adds its provenance to that link.
- An attribute proposal that re-affirms the current attribute with a different validity start adds its provenance to that attribute.
- The current link keeps the validity start it holds when a link proposal with a different validity start re-affirms it.
- The current attribute keeps the validity start it holds when an attribute proposal with a different validity start re-affirms it.
- A link proposal with change hint succession and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation.
- An attribute proposal with change hint none and a value other than the value of the current attribute of its node and attribute key that does not allow multiple current values is not answered as a re-affirmation.
sources:
- intake/scope.md
implements:
- rules/knowledge-base/reaffirmation-consolidates
- rules/knowledge-base/proposal-meets-current-assertion
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/current-assertion
- rules/knowledge-base/consolidation-records-provenance
- rules/knowledge-base/link-provenance-once-per-fragment
- rules/knowledge-base/attribute-provenance-once-per-fragment
- scenarios/knowledge-base/same-target-other-start-re-affirms
- scenarios/knowledge-base/same-value-other-start-re-affirms
- contracts/knowledge-base/ingestion
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/change-hint
- domain/knowledge-base/provenance
---

## What it is
The consolidation of a link or attribute proposal takes a repeated target or value with change hint none as a re-affirmation whatever validity start it states.
It adds provenance, records no new assertion and leaves the validity start the assertion holds.

## Notes
UNDERDETERMINED, from the specification — the rule on re-affirmation does not limit itself to types that do not allow multiple current assertions, while the objective and every criterion of this task do, so the multi-valued attribute case met by value reaches no criterion.
Passes: an implementation that re-affirms a proposal with a different validity start only for link types and attribute keys that do not allow multiple current assertions, and still requires the same validity start for an attribute key that allows multiple current values, meets every criterion and the rule refuses it.
UNDERDETERMINED, from the specification — criterion 9 tests the change hint only for a link with change hint succession, no criterion tests it on the attribute side or tests change hint correction on either side, and criterion 10 tests only the value condition for attributes.
Passes: an implementation that re-affirms any attribute proposal with the same value whatever its change hint, and any link proposal with change hint correction and the same target, meets every criterion and the consolidation order refuses it.
Decision, beyond the covers — stand: rules/knowledge-base/correction-replaces is the neighbor that takes a correction and this task does not implement it.
UNDERDETERMINED, from the specification — the rule ends with changing nothing else about the assertion, criteria 7 and 8 hold only the validity start, and the link and attribute also carry the basis of the validity start, the confidence, the status and the validity end, none of which a criterion keeps unchanged.
Passes: an implementation that keeps the validity start of a re-affirmed link or attribute but overwrites its basis with the proposal's, or raises its confidence or status from the proposal's confidence, meets every criterion and the rule refuses it.
UNDERDETERMINED, from the specification — the rule on provenance records one provenance on the assertion for each fragment the proposal cites and allows at most one per fragment, while criteria 5 and 6 say only that the proposal adds its provenance, which fixes neither how many records are added nor what happens to a fragment already held.
Passes: an implementation that adds a single provenance for the first cited fragment of a re-affirming proposal citing several fragments, or that adds a second provenance for a fragment the assertion already holds, meets every criterion and the provenance rules refuse it.
REMAINDER, from the specification — the consolidation order also orders correction, succession, dispute and new assertion, whose clauses reach no criterion beyond the negative checks in criteria 9 and 10.
Belongs: the tasks that implement rules/knowledge-base/correction-replaces, rules/knowledge-base/succession-closes-previous, rules/knowledge-base/conflict-disputes and rules/knowledge-base/new-assertion.
Decision, beyond the covers — stand: rules/knowledge-base/succession-closes-previous is delivered code this task leaves as it stands.
Decision, beyond the covers — stand: rules/knowledge-base/conflict-disputes is delivered code this task leaves as it stands, and the scope names the dispute of a different value or target as unchanged.
Decision, beyond the covers — stand: rules/knowledge-base/new-assertion is delivered code this task leaves as it stands.
ADVISORY, from the specification — criteria 1 and 2 hold only for a proposal that passes validation at or above the confidence floor, since the contract answers a proposal below the floor with outcome rejected.
ADVISORY, from the specification — criterion 9 repeats the first then-line of scenarios/knowledge-base/same-target-succession-is-disputed, whose subject is a rule this task does not implement.
Decision, beyond the covers — stand: scenarios/knowledge-base/same-target-succession-is-disputed belongs to the task that implements the dispute rule.
ADVISORY, from the specification — a link proposal that omits the change hint carries none by rules/knowledge-base/omitted-change-hint-is-none, so it re-affirms as criterion 1 describes, and no criterion covers the omission.
Decision, beyond the covers — stand: rules/knowledge-base/omitted-change-hint-is-none is a neighbor this task does not implement.
The wrong behavior was found by reading and was not reproduced.
