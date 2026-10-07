---
title: Re-affirm a succession proposal that meets a current assertion with the same target or value
summary: A link or attribute proposal with change hint succession that repeats the target or value of the current assertion is taken as a re-affirmation, for every type.
objective: A link or attribute proposal with change hint succession that meets a current assertion with the same target or value is a re-affirmation of that assertion, whether or not its type allows multiple current assertions.
criteria:
- A link proposal with change hint succession whose target is the target of the current link of its source and link type that does not allow multiple current links is answered as a re-affirmation of that link.
- An attribute proposal with change hint succession whose value is the value of the current attribute of its node and attribute key that does not allow multiple current values is answered as a re-affirmation of that attribute.
- A link proposal with change hint succession whose target is the target of a current link of its source and link type that allows multiple current links is answered as a re-affirmation of that link.
- An attribute proposal with change hint succession whose value is the value of a current attribute of its node and attribute key that allows multiple current values is answered as a re-affirmation of that attribute.
- A link proposal with change hint succession that re-affirms the current link records no new link.
- An attribute proposal with change hint succession that re-affirms the current attribute records no new attribute.
- A link proposal with change hint succession that re-affirms the current link leaves that link in the status it holds.
- An attribute proposal with change hint succession that re-affirms the current attribute leaves that attribute in the status it holds.
- A link proposal with change hint succession that re-affirms the current link adds its provenance to that link.
- An attribute proposal with change hint succession that re-affirms the current attribute adds its provenance to that attribute.
- The current link keeps the validity start it holds when a link proposal with change hint succession and a different validity start re-affirms it.
- The current attribute keeps the validity start it holds when an attribute proposal with change hint succession and a different validity start re-affirms it.
- A link proposal with change hint correction and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation.
- A link proposal with change hint none, a target other than the target of the current link of its source and link type that does not allow multiple current links, and no fragment that signals succession is answered as a dispute.
sources:
- intake/scope.md
implements:
- rules/knowledge-base/reaffirmation-consolidates
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/proposal-meets-current-assertion
- rules/knowledge-base/consolidation-records-provenance
- rules/knowledge-base/conflict-disputes
- contracts/knowledge-base/ingestion
- scenarios/knowledge-base/same-target-succession-re-affirms
- scenarios/knowledge-base/same-target-succession-re-affirms-multi-current
- scenarios/knowledge-base/different-target-without-signal-is-disputed
---

## What it is
The consolidation of a link or attribute proposal takes a succession hint with a repeated target or value as a re-affirmation.
It adds provenance, records no new assertion and leaves the validity start the assertion holds.

## Notes
UNDERDETERMINED, from the specification — the criteria say only that a proposal is answered as a re-affirmation, while the contract's propose-link and propose-attribute answers fix the outcome consolidated carrying the identity of the link or attribute re-affirmed, and no criterion names either.
Passes: an implementation that answers a same-target or same-value succession proposal with an outcome other than consolidated, or answers consolidated but carries the proposal's own or an empty identity, records nothing new and adds provenance, so every criterion holds and the contract refuses it.
UNDERDETERMINED, from the specification — the rule ends with changing nothing else about the assertion, criteria 5 to 12 hold only that no new assertion is recorded, that the status is kept and that the validity start is kept, and the link and attribute also carry the confidence, the validity end, the basis of the validity start and the run, none of which a criterion keeps unchanged.
Passes: an implementation that overwrites the current assertion's confidence, validity end or basis with the succession proposal's own values while status, validity start and record count stay untouched meets every criterion and the rule refuses it.
UNDERDETERMINED, from the specification — the rule on provenance records one provenance for each fragment the proposal cites and allows at most one per fragment on an assertion, while criteria 9 and 10 say only that the proposal adds its provenance.
Passes: an implementation that adds a single provenance for the first cited fragment of a re-affirming proposal citing several fragments, or adds a second provenance for a fragment the assertion already holds, meets every criterion and the provenance rules refuse it.
UNDERDETERMINED, from the specification — criterion 13 says only what a same-target correction is not, and the consolidation order puts a correction next, where the rule on correction supersedes the current link and records a new one that names it as superseded.
Passes: an implementation that answers a same-target correction on a type that does not allow multiple current links as a dispute, as a new assertion or as a refusal meets criterion 13 and the rule on correction refuses each of them.
UNDERDETERMINED, from the specification — criterion 14 says only that the proposal is answered as a dispute, while the rule and the scenario of the dispute state three effects: the current link is marked disputed, a new link is recorded in status disputed, and that new link supersedes nothing.
Passes: an implementation that answers disputed but leaves the current link's status unchanged, records the new link in another status or has the new link supersede the current one meets criterion 14 and the rule refuses it.
REMAINDER, from the specification — the clause of the rule on re-affirmation for change hint none with another validity start reaches no criterion of this task, and neither do the succession and new-assertion branches of the consolidation order.
Belongs: the delivered task reaffirm-other-start-proposal of the initiative reaffirm-with-other-start, and the tasks that implement rules/knowledge-base/succession-closes-previous and rules/knowledge-base/new-assertion.
ADVISORY, from the specification — the attribute criteria, 2, 4, 6, 8, 10 and 12, have no scenario among the candidates, because both succession scenarios are about links, so they rest on the rule on re-affirmation alone.
ADVISORY, from the specification — the rule on a race decided again re-decides a proposal whose recording meets an assertion a concurrent proposal committed first, and under the rule on re-affirmation that second decision now lands on re-affirmation for a same-target succession, which no criterion covers.
The wrong behavior was found by a rehearsal against the real schema and not by a delivered test.
Decision, beyond the covers — stand: rules/knowledge-base/succession-closes-previous is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: rules/knowledge-base/new-assertion is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: rules/knowledge-base/correction-replaces is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: rules/knowledge-base/link-provenance-once-per-fragment is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: rules/knowledge-base/attribute-provenance-once-per-fragment is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: rules/knowledge-base/consolidation-race-decided-again is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: scenarios/knowledge-base/same-target-other-start-re-affirms is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: scenarios/knowledge-base/same-value-other-start-re-affirms is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: domain/knowledge-base/knowledge-link is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: domain/knowledge-base/node-attribute is a neighbor this task does not implement and delivered code or the specification already holds it.
Decision, beyond the covers — stand: rules/knowledge-base/correction-requires-errata-evidence is a neighbor this task does not implement and delivered code or the specification already holds it.
