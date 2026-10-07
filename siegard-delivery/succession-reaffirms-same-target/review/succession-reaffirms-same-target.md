---
target: backend
title: Review of the succession-reaffirms-same-target delivery
summary: What the coverage, conformance and standard passes found over the source and tests of the one corrective task that makes a succession proposal repeating the held target or value re-affirm it.
reviewed:
- src/modules/ingestion/service/graph-consolidation.service.ts
- src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
- src/__tests__/unit/ingestion/graph-consolidation.spec.ts
tasks:
- task/succession-reaffirms-same-target/reaffirm-same-target-succession
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/succession-reaffirms-same-target passed; there was no failure to read
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
coverage:
- criterion: A link proposal with change hint succession whose target is the target of the current link of its source and link type that does not allow multiple current links is answered as a re-affirmation of that link.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a proposal with change hint succession and the held target as consolidated, carrying the identity of the held link
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
- criterion: An attribute proposal with change hint succession whose value is the value of the current attribute of its node and attribute key that does not allow multiple current values is answered as a re-affirmation of that attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a proposal with change hint succession and the held value as consolidated, carrying the identity of the held attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
- criterion: A link proposal with change hint succession whose target is the target of a current link of its source and link type that allows multiple current links is answered as a re-affirmation of that link.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: 're-affirms the held link: consolidated with its identity, no new link, provenance added to it, when change_hint=''succession'' repeats its target on a multi-current link type'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
- criterion: An attribute proposal with change hint succession whose value is the value of a current attribute of its node and attribute key that allows multiple current values is answered as a re-affirmation of that attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers the proposal as consolidated, carrying the identity of the held attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
- criterion: A link proposal with change hint succession that re-affirms the current link records no new link.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new link
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: 're-affirms the held link: consolidated with its identity, no new link, provenance added to it, when change_hint=''succession'' repeats its target on a multi-current link type'
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute records no new attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
- criterion: A link proposal with change hint succession that re-affirms the current link leaves that link in the status it holds.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves that link in the status it holds
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  why: 'Every test bearing on this seeds the held link in status active. The criterion covers whatever status the link holds, but nothing re-affirms a current link held as uncertain or disputed. Code that changed the status only for a held link that is not active (for example, raising an uncertain link to active on a confident re-affirmation) would pass every test in the set. Separately, the matrix test ("adds the provenance ... changes nothing else ...") requires that no column of the held row is written at all (assigned: []). That is more than this task''s criteria state, which name only the status and the validity start, and it would break if a legitimate write to some other column landed on the row. That is a fact for a reader to route, not a coverage gap.'
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute leaves that attribute in the status it holds.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves that attribute in the status it holds
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  why: 'Every held attribute in the set (deadline and tag) is seeded in status active. Nothing re-affirms a current attribute held as uncertain or disputed, so a change of status made only for a held attribute that is not active goes unexercised. The matrix test''s assigned: [] goes beyond this task''s criteria in the same way as described for the link.'
- criterion: A link proposal with change hint succession that re-affirms the current link adds its provenance to that link.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds its provenance to that link
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: holds one provenance for each fragment it cites and none again for a fragment the link already holds
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in every branch of the consolidation order
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: 're-affirms the held link: consolidated with its identity, no new link, provenance added to it, when change_hint=''succession'' repeats its target on a multi-current link type'
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute adds its provenance to that attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds its provenance to that attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: holds one provenance for each fragment it cites and none again for a fragment the attribute already holds
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in every branch of the consolidation order
- criterion: The current link keeps the validity start it holds when a link proposal with change hint succession and a different validity start re-affirms it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the validity start the link holds when the proposal states another
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  why: '"leaves the validity start the link holds when the proposal states another" asserts only that no update assigns valid_from. On its own it would pass a regression that superseded the held link and recorded a new link carrying the proposal''s start, because the supersession update assigns no valid_from. The criterion is held whole only because the scenario test and the matrix test also assert the consolidated outcome on the held link''s identity and no new link.'
- criterion: The current attribute keeps the validity start it holds when an attribute proposal with change hint succession and a different validity start re-affirms it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the validity start the attribute holds when the proposal states another
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  why: 'The single-assertion test checks only that no update assigns valid_from, so it would pass a regression that superseded the held attribute and recorded a new one carrying the proposal''s start. Only the matrix test pins the whole fact: for succession with another start it also asserts the consolidated outcome on the held identity and no inserted attribute. No attribute counterpart of the link scenario test exists.'
- criterion: A link proposal with change hint correction and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint correction and the held target as a re-affirmation
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: supersedes the held link, leaves its validity end and records a new link naming it, when its change hint is correction
  why: '"supersedes the held link, leaves its validity end and records a new link naming it ..." asserts more than this criterion does. It pins what the correction is answered as (the held link set to superseded, its validity end left unassigned, one new link superseding it), and none of that is stated by this task. It bears on the criterion because it would fail if the proposal were consolidated, but it will change whenever the correction branch''s shape changes.'
- criterion: A link proposal with change hint none, a target other than the target of the current link of its source and link type that does not allow multiple current links, and no fragment that signals succession is answered as a dispute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: is answered as a dispute when no cited fragment signals succession
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: marks the current link disputed and records the new link from A to C in status disputed, superseding nothing
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: marks that assertion disputed and records a new assertion in status disputed that supersedes nothing, for a link and for an attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: is the one of its node and type, or the one of its node, type and target or value where the type allows multiple current assertions, and no other
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: flags both old and new row as disputed and surfaces conflicting_link_id
  why: '"flags both old and new row as disputed and surfaces conflicting_link_id" makes no assertion on conflicting_link_id. Its name claims more than its assertions establish, though its outcome assertion does bear on this criterion.'
unpaired:
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds a second cited fragment once and the already-held one not again when the held attribute is re-cited
  asserts: A proposal with change hint none, the held value and another start, citing a fragment the held deadline attribute already holds plus a new one, leaves exactly those two fragments on the held attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds a second cited fragment once and the already-held one not again when the held link is re-cited
  asserts: A proposal with change hint none, the held target and another start, citing a fragment the held link already holds plus a new one, leaves exactly those two fragments on the held link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal to the held attribute
  asserts: A proposal with change hint none, the held value and another start adds its fragment to the held deadline attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal to the held link
  asserts: A proposal with change hint none, the held target and another start adds its fragment to the held link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-target proposal with change hint none and another start as consolidated on the held link
  asserts: A link proposal with change hint none, the held target and another start (also differing in confidence, validity end and basis) returns outcome consolidated with the held link's id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-value proposal with another start as consolidated on an attribute key that allows multiple current values
  asserts: An attribute proposal with change hint none repeating a held tag value with another start returns outcome consolidated with the held attribute's id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-value proposal with change hint none and another start as consolidated on the held attribute
  asserts: A deadline proposal with change hint none, the held value and another start returns outcome consolidated with the held attribute's id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint correction and the held value as a re-affirmation
  asserts: An attribute proposal with change hint correction and the held deadline value does not return outcome consolidated. This is the attribute counterpart of criterion 13, which names only links.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint none and another value as a re-affirmation
  asserts: A deadline proposal with change hint none and a value other than the held one does not return outcome consolidated.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the confidence, the validity end and the basis of the validity start the attribute holds
  asserts: A succession re-affirmation of the held deadline that states a different confidence, validity end and basis assigns none of confidence, valid_to or valid_from_source on node_attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the confidence, the validity end and the basis of the validity start the link holds
  asserts: A succession re-affirmation of the held link that states a different confidence, validity end and basis assigns none of confidence, valid_to or valid_from_source on knowledge_link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the held attribute row unwritten, so its validity start, basis, confidence, status and end stay
  asserts: A deadline proposal with change hint none, the held value and another start issues no update to node_attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the held link row unwritten, so its validity start, basis, confidence, status and end stay
  asserts: A link proposal with change hint none, the held target and another start issues no update to knowledge_link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: meets a held link or attribute as current only while it has neither a validity end nor a supersession time
  asserts: A same-target or same-value proposal with change hint none is consolidated only when the held link or attribute has both valid_to and superseded_at null. A held row with either set is not consolidated.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept'
  asserts: A link proposal with change hint none, the held target and a later start returns consolidated with the held id, adds its fragment to the held link, and issues no insert or update on knowledge_link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept'
  asserts: A deadline proposal with change hint none, the held value and a later start returns consolidated with the held id, adds its fragment, and issues no insert or update on node_attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new attribute when the proposal re-affirms the held attribute with another start
  asserts: A deadline proposal with change hint none, the held value and another start inserts no node_attribute row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new link when the proposal re-affirms the held link with another start
  asserts: A link proposal with change hint none, the held target and another start inserts no knowledge_link row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: a SECOND 23505 (still racing) surfaces as ValidationFailure(SYSTEM_INTERNAL_ERROR)
  asserts: When every knowledge_link insert raises a unique violation, proposeLinkService throws a ValidationFailure with code SYSTEM_INTERNAL_ERROR after exactly two insert attempts.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: accepted (new) — no vigent row
  asserts: An attribute proposal with no held attribute returns accepted and inserts one node_attribute row and one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "accepted (new)" inserts >= 1 provenance row
  asserts: A link proposal with no held link returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "consolidated" inserts >= 1 provenance row
  asserts: A link proposal with change hint none and the held target returns an ok envelope and inserts at least one provenance row. The outcome is not asserted.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "correction (outcome=accepted)" inserts >= 1 provenance row
  asserts: A link proposal with change hint correction and another target returns an ok envelope and inserts at least one provenance row. The outcome is not asserted.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "disputed" inserts >= 1 provenance row
  asserts: A link proposal with change hint none, another target and neutral fragment text returns an ok envelope and inserts at least one provenance row. It never asserts that the outcome is a dispute, so it does not bear on criterion 14.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "superseded_previous" inserts >= 1 provenance row
  asserts: A link proposal with another target and succession-signalling fragment text returns an ok envelope and inserts at least one provenance row. The outcome is not asserted.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: calling proposeLinkService twice with identical args returns accepted then consolidated (no dup-guard hit)
  asserts: With no held link, the proposal is accepted with one insert. With a held link of the same target and start, the same proposal (change hint none) is consolidated with no insert and one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: catches 23505 on first INSERT, retries the lookup-and-decide, settles deterministically on the second attempt
  asserts: A unique violation on the first knowledge_link insert produces two savepoints, one rollback to savepoint and exactly one persisted insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: closes vigent and inserts a new chained row when functional + different target + textual succession signal
  asserts: A link proposal with change hint none, another target and succession-signalling text returns superseded_previous naming the held link. It issues one knowledge_link update whose SQL contains valid_to, superseded_at, 'superseded' and "ELSE superseded_at", plus one insert chained to the held link with the new target and one provenance row. Several of these are assertions on SQL text, not on behaviour.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: closes vigent with status='superseded' (transaction axis only) and inserts a chained new row; outcome=accepted
  asserts: A link proposal with change hint correction and another target returns accepted naming the held link as superseded. It issues one update whose SQL lacks valid_to and contains superseded_at and 'superseded', plus one insert chained to the held link and one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: consolidated — same (node, key, value, valid_from)
  asserts: A deadline proposal with change hint none and the held value and start returns consolidated with the held id, inserts no node_attribute and one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: consolidates a multi-current link when second document has a different valid_from (received fallback)
  asserts: A participates_in proposal with change hint none, the held target and another start returns consolidated with the held id, with no insert, one provenance row on the held link and no update.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: correction — change_hint='correction' + errata text, outcome=accepted, valid_to untouched
  asserts: A deadline proposal with change hint correction and another value returns accepted naming the held attribute as superseded. It issues one update whose SQL lacks valid_to and contains 'superseded', plus one insert chained to the held attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: detects 'deixou de' / 'passou a' / 'novo' / 'replaced' / 'substituiu'
  asserts: The internal helper hasSuccessionSignal (reached through __testing__) returns true for four marker phrases and false for neutral text. It binds an internal function, not consolidation behaviour.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: disputed — divergent value, same overlapping period, no signal
  asserts: A deadline proposal with change hint none, another value and neutral text returns disputed. It issues one update whose SQL contains 'disputed' and one insert in status disputed superseding nothing.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: dup-guard 23505 race on attribute INSERT — retried once, then succeeds
  asserts: A unique violation on the first node_attribute insert produces two savepoints, one rollback and exactly one persisted insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: exports consolidateLink and consolidateAttribute
  asserts: Both exports have typeof function. Nothing about behaviour can make this fail.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: functional link with the same target and a different valid_from consolidates on the held link
  asserts: A leads proposal with change hint none, the held target and another start returns consolidated with the held id and inserts no knowledge_link row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: inserts a new knowledge_link row and one provenance row when no vigent exists
  asserts: With no held link, the proposal returns accepted and inserts one knowledge_link row (supersedes_link_id null, status active at confidence 0.9) and one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: inserts with status='uncertain' when 0.40 <= confidence < 0.75
  asserts: With no held link, a proposal at confidence 0.5 returns accepted and inserts a row in status uncertain.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: intra-day succession closes on the transaction axis only — guards the degenerate [D,D) interval (§5.1 date granularity)
  asserts: A same-day succession signalled by text returns superseded_previous with one knowledge_link update. The update's SQL contains CASE, "valid_from >=", "THEN valid_to", superseded_at and "THEN now()", and binds the close date as the second parameter. These are assertions on SQL text.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: is case-insensitive
  asserts: The internal helper hasSuccessionSignal returns true for upper- and mixed-case marker phrases.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: promotes the cited fragment proposed -> accepted when provenance is created (§6.6)
  asserts: An accepted new link issues exactly one information_fragment update. Its SQL contains "status = 'accepted'" and "status = 'proposed'" and it is bound to the cited fragment id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: recognizes change_hint='succession' as a succession signal even without textual marker
  asserts: A link proposal with change hint succession, another target and neutral text returns superseded_previous with one update and one insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: returns outcome=consolidated and does NOT insert a new row when (source, link_type, target, valid_from) match the vigent row
  asserts: A link proposal with change hint none and the held target and start returns consolidated with the held id, with no insert, one provenance row on the held link and no update.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: superseded_previous — different value on a functional key with succession signal
  asserts: A deadline proposal with change hint none, another value and succession-signalling text returns superseded_previous naming the held attribute. It issues one node_attribute update whose SQL contains valid_to and one insert chained to the held attribute.
findings:
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the test "closes vigent and inserts a new chained row when functional + different target + textual succession signal", lines 766-771 — node rules/knowledge-base/succession-closes-previous, kind unstated
  evidence: expect(state.updates[0]!.sql).toContain("ELSE superseded_at"); with the preceding comment "succession closes the VALIDITY axis only — the close must guard superseded_at conditionally (intra-day fallback), never set it unconditionally."
  cost: A succession that closes an assertion at the new start leaves its supersession time empty. The test pins that, and the only place it is stated is this assertion. The nearest nodes say that a succession "closes that assertion as superseded", that a correction "supersedes it, leaving its validity end as it was", and that as-of reads show only assertions "without a supersession time". None of them says whether an ordinary succession stamps a supersession time. The next reader will look in the specification, find no answer, and may take the stamp to belong to every supersession.
  correction: The analysis gives rules/knowledge-base/succession-closes-previous, or a sibling node, the statement of what a succession stamps. That means a validity end and no supersession time, except under succession-before-previous-start, where no validity end can be given.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  where: the file's own path
  cites: TST-04
  evidence: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts, which covers src/modules/ingestion/service/graph-consolidation.service.ts
  cost: The unit under test is at modules/ingestion/service/graph-consolidation.service.ts. Its tests sit one directory up, at unit/ingestion/, with a different file name. A reader who starts from the service has to search for its tests. Two spec files now cover the one service, so the pairing between service and test cannot be read from the path.
  correction: Place the tests at the path that mirrors the service under unit/, using the service's file name with the .spec.ts suffix, so one location answers "where are the tests for this file".
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  where: lines 731, 740, 753 and 769 (the SUBJECTS entries), against lines 75 and 83 (HELD_LINK and HELD_ATTRIBUTE)
  cites: TYP-04
  evidence: 'line 75: valid_from: "2024-01-01", line 83: valid_from: "2026-01-01", line 731: heldStart: "2024-01-01", line 740: heldStart: "2024-01-01", line 753: heldStart: "2026-01-01", line 769: heldStart: "2026-01-01",'
  cost: The validity start of each held fixture is spelled once on the held row and again on the SUBJECTS entry that describes it. The held-start branch of the re-affirmation matrix (startOf returns subject.heldStart) is only meaningful while the two copies agree. Changing the fixture without the entry makes that matrix case propose a start the held row does not have, and nothing fails to say so.
  correction: Name the held starts once (for example HELD_LINK_START and HELD_ATTRIBUTE_START), and use those names both in the held rows and in the SUBJECTS entries.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the file's own path
  cites: TST-04
  evidence: src/__tests__/unit/ingestion/graph-consolidation.spec.ts, which covers src/modules/ingestion/service/graph-consolidation.service.ts
  cost: The path drops the service/ segment and the .service part of the unit's name, so the test cannot be found by mirroring the unit's path. A second spec file for the same unit sits beside it, so the next person adding a consolidation test has to choose between two files with nothing in the paths to guide them.
  correction: Move the tests to the mirrored path for graph-consolidation.service.ts under unit/ and decide in one place where the second spec file belongs.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: line 47, the run-context constant
  cites: CON-02
  evidence: 'const runCtx = { llmRunId: RUN_ID, rawInformationId: RAW_INFO_ID };'
  cost: Every other fixed value in this block (RUN_ID, SOURCE_NODE, FRAGMENT_ID, ...) is screaming snake. This one is camelCase, so a reader cannot tell from its name that it is a fixed fixture and not a per-test value. The sibling spec writes the same constant as RUN_CONTEXT.
  correction: Rename it RUN_CONTEXT, as the sibling spec does.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: buildCatalog, lines 50-111
  cites: MNT-01
  evidence: "function buildCatalog(): CatalogSnapshot {\n  return buildSnapshot({\n    nodeTypes: [\n(the function runs to line 111, about 62 lines)"
  cost: A single function holds two node types, two link types, their rules and two attribute keys. A change to one catalog row means reading the whole literal to find it, and the function is twice the size a reader is meant to hold at once.
  correction: Split the catalog into named constants (node types, link types, rules, attribute keys) that buildCatalog assembles.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: buildClient, lines 176-397
  cites: MNT-01
  evidence: 'function buildClient(cfg: MockConfig = {}) { (the function runs to the closing brace at line 397, about 220 lines, with one query callback branching on a dozen statement shapes)'
  cost: The whole fake store is one function, so a failing test sends the reader through 220 lines to find which statement shape is answered wrongly. Adding a statement shape means adding another branch to an already unreadable chain. The sibling file reaffirm-consolidation-world.ts shows the same fake split into small named functions.
  correction: Split the fake into one named helper per statement family (savepoint control, vigent selects, graph-row writes, provenance), as the sibling world file does.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: line 394 (the PoolClient assertion), line 992 (the query reassignment) and the "!" indexing throughout, for example line 475
  cites: TYP-02
  evidence: 'line 394: } as unknown as import("pg").PoolClient;

    line 992: const realQuery = client.query as unknown as (...args: unknown[]) => Promise<unknown>;

    line 475: expect(state.inserts.knowledge_link[0]!.supersedes_link_id).toBeNull();'
  cost: 'The compiler stops checking these claims: that the fake is a PoolClient, that query has the shape the test replaces, and that an element exists at index 0. If an insert never happens, the line fails with a TypeError on undefined and not with an assertion naming the missing row.'
  correction: Narrow where a guard is possible (assert the length before indexing). Confine the one unavoidable PoolClient cast to a single typed fake factory shared by the specs.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the now option in each proposeLinkService and proposeAttributeService call, for example lines 466, 492, 514, 545, 571, 591, 1038 and 1276, about 25 occurrences
  cites: TYP-04
  evidence: '{ catalog, now: () => new Date("2026-06-12T12:00:00Z") }'
  cost: One instant is spelled out in about 25 places. A different "today" means editing every one, and a missed one leaves a test running at another date. The reader also cannot tell which tests depend on that date and which just copied the line.
  correction: Name the instant once (for example FIXED_NOW) and pass a shared clock to the services.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the "calling proposeLinkService twice with identical args returns accepted then consolidated" test, lines 562-601
  cites: TST-01
  evidence: "// First call: no vigent.\n{\n  const { client, state } = buildClient({ vigentLink: null });\n  const e1 = await proposeLinkService(\n  ...\n  expect(e1.ok).toBe(true);\n  ...\n}\n// Second call: vigent row now exists with identical scope.\n{\n  const { client, state } = buildClient({"
  cost: The test arranges, acts and asserts, then arranges, acts and asserts again inside bare blocks. A reader cannot tell which of the two sequences is the claim, and a failure in the first block hides whether the second would have held.
  correction: Split it into two tests, one per call, each with its own arrange, act and assert. Or build both worlds first, run both calls, then assert once.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the it callbacks at lines 626-661, 733-780, 782-829, 914-954 and 986-1023 (36 to 48 lines each)
  cites: MNT-01
  evidence: it("closes vigent and inserts a new chained row when functional + different target + textual succession signal", async () => { (the callback runs from line 733 to line 780, 48 lines, with about 20 assertions)
  cost: Each callback bundles many independent claims about SQL text, counts and chaining. A failure shows only the first failing expectation, and the callback's name says only the first claim.
  correction: Extract the SQL-contract assertions into named helpers, or split the callbacks by the claim they make.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the attribute-branch test names at lines 1030, 1045, 1070, 1105, 1135 and 1171, in the describe "consolidateAttribute — five decision branches"
  cites: TST-02
  evidence: 'it("accepted (new) — no vigent row", ...

    it("consolidated — same (node, key, value, valid_from)", ...

    it("superseded_previous — different value on a functional key with succession signal", ...

    it("disputed — divergent value, same overlapping period, no signal", ...

    it("dup-guard 23505 race on attribute INSERT — retried once, then succeeds", ...'
  cost: These names label a branch and leave out the expectation. In a run's output the reader sees "consolidated — same (node, key, value, valid_from)" and still has to open the test to learn what is expected to happen (no insert, provenance added to the held row). The link-branch names in the same file are written as sentences.
  correction: Rename each as the behavior expected, for example "consolidates onto the held attribute and inserts no new row when the node, key and value match".
- pass: standard
  file: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  where: UniqueViolation, lines 57-65
  cites: MNT-03
  evidence: "class UniqueViolation extends Error {\n  readonly code = UNIQUE_VIOLATION;\n  readonly constraint: string;\n  constructor(constraint: string) {\n    super(`duplicate key value violates unique constraint \"${constraint}\"`);"
  cost: graph-consolidation.spec.ts already defines FakeUniqueViolationError (lines 166-174) with the same code, constraint and message. The two copies make the same claim about what the driver raises. If the real driver shape needs updating, one fake is changed and the other keeps passing against the old shape.
  correction: Keep one driver-error fake in a shared test-support module and import it from both specs.
- pass: standard
  file: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  where: buildWorld, line 199
  cites: TYP-02
  evidence: '} as unknown as PoolClient;'
  cost: The compiler is told the object literal is a full PoolClient, and nothing narrows it. If the service starts calling another PoolClient member, the fake fails at runtime inside the service call instead of at the point of the fake.
  correction: Type the fake against the one member the service uses (for example Pick<PoolClient, "query">). Keep the single widening cast in one place with a named narrowing type.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: isDupGuardViolation line 111 and the retry loops at lines 279, 300, 463 and 484
  cites: TYP-04
  evidence: 'line 111: e.code === "23505" &&

    line 279: for (let attempt = 1; attempt <= 2; attempt += 1) {

    line 300: if (attempt === 2) {

    line 463: for (let attempt = 1; attempt <= 2; attempt += 1) {

    line 484: if (attempt === 2) {'
  cost: The attempt limit is written as a bare 2 in four places, across two loops and two exit tests. Changing it means finding all four, and missing one makes the loop run a different number of times than the exit test expects. The SQLSTATE 23505 is also a bare string with no name saying it is "unique violation".
  correction: Name MAX_CONSOLIDATION_ATTEMPTS and UNIQUE_VIOLATION_SQLSTATE and use them in both loops and in isDupGuardViolation.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: closeVigentForSuccession (line 158), lockVigentLinkByTriple (line 205), lockVigentAttributeByTriple (line 249), insertLinkRow (line 421), insertAttributeRow (line 605)
  cites: MNT-01
  evidence: "async function closeVigentForSuccession(\n  client: PoolClient,\n  table: \"knowledge_link\" | \"node_attribute\",\n  vigentId: string,\n  closeDate: string | null\n): Promise<void> {\n(the other four functions also take four positional parameters, for example\nlockVigentLinkByTriple(client, sourceNodeId, linkTypeId, targetNodeId))"
  cost: 'Four positional parameters of the same shape (three strings in a row on the lock helpers) can be swapped at a call site without the compiler noticing, and the SQL then selects the wrong row. The lock-by-triple pair is the clearest case: source, type and target are all strings.'
  correction: Pass an object for the parameters beyond client and one more, for example a { sourceNodeId, linkTypeId, targetNodeId } key.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink (lines 272-314) and consolidateAttribute (lines 456-498)
  cites: MNT-01
  evidence: "export async function consolidateLink(\n  client: PoolClient,\n  args: ConsolidateLinkArgs,\n  linkTypeInfo: LinkTypeRow,\n  fragmentTexts: readonly string[],\n  runCtx: RunContext\n): Promise<ConsolidateLinkResult> {\n(43 lines; consolidateAttribute has the same five parameters and 43 lines)"
  cost: These are the two public entry points. Five positional parameters on a public signature mean every caller must remember the order of two similar-typed pairs (linkTypeInfo and runCtx, fragmentTexts), and the function bodies exceed thirty lines for what is one retry loop.
  correction: Pass the run context, catalog row and fragment texts as one object. Move the retry loop into a named helper so each entry point stays short.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the retry loops of consolidateLink (lines 279-313) and consolidateAttribute (lines 463-497), and the mirrored consolidateLinkOnce (316-419) and consolidateAttributeOnce (500-603)
  cites: MNT-03
  evidence: 'line 279: for (let attempt = 1; attempt <= 2; attempt += 1) {

    line 280:   const savepoint = `gc_link_${attempt}`;

    line 463: for (let attempt = 1; attempt <= 2; attempt += 1) {

    line 464:   const savepoint = `gc_attr_${attempt}`;'
  cost: 'The savepoint, rollback, release and retry logic is written twice, differing only in the savepoint prefix, the constraint name and the scope. A fix to the retry path (for example to the rollback order) has to be made in both. The two copies of the decision ladder (Once functions) also have to be fixed in step: the re-affirmation precedence is stated in both and is only correct while they match.'
  correction: Extract one retry helper that takes the attempt body, the constraint name and the scope. Share the decision ladder between link and attribute through a small adapter for the differing columns.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: lines 301-304, 309-312, 485-488 and 493-496, the ValidationFailure raised from the retry paths
  cites: SEC-04
  evidence: "throw new ValidationFailure(\n  \"SYSTEM_INTERNAL_ERROR\",\n  \"graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.\",\n  { scope: \"knowledge_link\" }\n);\n...\n\"consolidateLinkWithRetry: unreachable loop exit.\","
  cost: The message and details name the store's guard constraint, the table and an internal function (one that does not exist under that name). The project's error envelope carries message and details to the caller. If it renders them verbatim, a client learns the shape of the store from a concurrency failure. I did not read the error mapping, which is outside the file set, so whether it renders them verbatim is not confirmed here.
  correction: Keep the constraint and table in a log line and give the client-facing message a generic concurrency wording.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce line 453 and consolidateAttributeOnce (insertAttributeRow) line 638
  cites: TYP-02
  evidence: 'line 453: return res.rows[0]!;

    line 638: return res.rows[0]!;'
  cost: The non-null assertion claims the INSERT returned a row and has no guard. If an insert returns no row, the caller reads .id of undefined and fails with a TypeError, which is far from the failed insert and carries nothing about which statement produced it.
  correction: Check the row is present and raise a typed error naming the insert when it is not.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the exported __testing__ object, line 641
  cites: CON-02
  evidence: "export const __testing__ = {\n  hasSuccessionSignal,\n  SUCCESSION_MARKERS,\n};"
  cost: It is an exported constant in neither screaming snake nor camelCase, so a reader cannot place it in the naming scheme. It also exports hasSuccessionSignal, which is already exported by name two hundred lines earlier, so there are two ways to reach one function.
  correction: Import hasSuccessionSignal directly in the spec. Remove the __testing__ export, or rename it if it has to stay.
reconciliation: siegard-reconcile/succession-reaffirms-same-target.md
run: run/succession-reaffirms-same-target
---

## What it is
Three passes read the four files the task wrote, a captured run of the registry's five steps passed over the whole tree, and the conformance pass folded into the reconciliation record named above.
The failures pass did not run because the run passed.

## Notes
Two of the eight certifications came back partial over the dispute: the test fixtures check that some update assigns the disputed status and not which row it addresses, and the recorded row's source node is unread; both carry a testable remainder.
The certification of the consolidation order came back partial with a testable remainder: a same-target none-hint proposal citing a succession-signalling fragment, and a correction against a type allowing several current assertions, have no test.
Coverage found the status-kept criteria partial because every held fixture is active; a held uncertain or disputed assertion is never re-affirmed in a test.
The conformance finding over graph-consolidation.spec.ts concerns a succession-closing fact this change did not write; the review read the whole file.
Standard findings over graph-consolidation.service.ts and graph-consolidation.spec.ts concern code this change did not touch; the review read the whole files.
The run output of the registry's five steps is the evidence that the change built and its suite passed.
The reconciliation fold saw the conformance returns' text with markup escapes in the transport and saved them unescaped.
