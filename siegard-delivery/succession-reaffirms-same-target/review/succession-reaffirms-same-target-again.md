---
target: backend
title: Second review of the succession-reaffirms-same-target delivery
summary: What the coverage, conformance and standard passes found after the proof-only re-delivery that closed the testable remainders of the first review.
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
  missing: run/succession-reaffirms-same-target-again passed; there was no failure to read
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
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: 're-affirms the held link: consolidated with its identity, no new link, provenance added to it, when change_hint=''succession'' repeats its target on a multi-current link type'
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute records no new attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
- criterion: A link proposal with change hint succession that re-affirms the current link leaves that link in the status it holds.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves that link in the status it holds
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  why: 'Covered. Over-assertion finding: the matrix test "adds the provenance of the proposal and changes nothing else about the assertion, …" requires `assigned: []`, meaning no column of the held link is written at all. This criterion names only the status (and criterion 11 only the validity start). The test would break if a sibling task legitimately wrote another column on re-affirmation, such as confidence, even though this criterion still held.'
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute leaves that attribute in the status it holds.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves that attribute in the status it holds
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  why: 'Covered. Same over-assertion as for the link: the matrix test''s `assigned: []` claims that no column of the held attribute is written. This criterion names only the status.'
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
  why: 'Covered. The proposal starts 2024-06-01 (2030-06-01 in the matrix) and the held link starts 2024-01-01, so the starts really do differ. The matrix test''s `assigned: []` carries the over-assertion named under criterion 7.'
- criterion: The current attribute keeps the validity start it holds when an attribute proposal with change hint succession and a different validity start re-affirms it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the validity start the attribute holds when the proposal states another
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  why: 'Covered. The proposal starts 2026-03-01 (2030-06-01 in the matrix) and the held attribute starts 2026-01-01. The matrix test''s `assigned: []` carries the over-assertion named under criterion 7.'
- criterion: A link proposal with change hint correction and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint correction and the held target as a re-affirmation
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: supersedes the held link, leaves its validity end and records a new link naming it, when its change hint is correction
  why: 'Covered. Over-assertion finding: "supersedes the held link, leaves its validity end and records a new link naming it, …" checks how the correction branch works: the held link''s status becomes superseded, its validity end is not assigned, and the new link''s supersedes_link_id names the held link. This criterion only says the proposal is not answered as a re-affirmation. A legitimate change to the correction mechanics would break that test while this criterion still held.'
- criterion: A link proposal with change hint none, a target other than the target of the current link of its source and link type that does not allow multiple current links, and no fragment that signals succession is answered as a dispute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: is answered as a dispute when no cited fragment signals succession
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: is the one of its node and type, or the one of its node, type and target or value where the type allows multiple current assertions, and no other
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: marks the current link disputed and records the new link from A to C in status disputed, superseding nothing
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: marks that assertion disputed and records a new assertion in status disputed that supersedes nothing, for a link and for an attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: flags both old and new row as disputed and surfaces conflicting_link_id
  why: 'Covered. "is answered as a dispute when no cited fragment signals succession" asserts the outcome `disputed` directly. The two "marks … disputed …" tests never check the outcome. They bind to how a dispute is written instead: the held row is marked disputed, a new row is recorded as disputed, and that row supersedes nothing (plus its source and target in the first). That is more than this criterion establishes, so they bear on it only through the shape of a dispute.'
unpaired:
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds a second cited fragment once and the already-held one not again when the held attribute is re-cited
  asserts: With change hint none and another start, re-citing a fragment the held attribute already has, plus a new one, leaves exactly one provenance per fragment on the held attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds a second cited fragment once and the already-held one not again when the held link is re-cited
  asserts: With change hint none and another start, re-citing a fragment the held link already has, plus a new one, leaves exactly one provenance per fragment on the held link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal to the held attribute
  asserts: A same-value proposal with change hint none and another start adds its cited fragment as provenance on the held attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal to the held link
  asserts: A same-target proposal with change hint none and another start adds its cited fragment as provenance on the held link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-target proposal with change hint none and another start as consolidated on the held link
  asserts: A same-target proposal with change hint none, another start and another validity end, basis, confidence and status returns outcome consolidated with the held link's id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-value proposal with another start as consolidated on an attribute key that allows multiple current values
  asserts: On a multi-current attribute key, a same-value proposal with change hint none and another start returns outcome consolidated with the held attribute's id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-value proposal with change hint none and another start as consolidated on the held attribute
  asserts: On a single-current attribute key, a same-value proposal with change hint none and another start returns outcome consolidated with the held attribute's id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint correction and the held value as a re-affirmation
  asserts: On a single-current attribute key, an attribute proposal with change hint correction and the held value does not return outcome consolidated. This is the attribute counterpart of criterion 13, which this task states for links only.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint none and another value as a re-affirmation
  asserts: An attribute proposal with change hint none and a value other than the held one does not return outcome consolidated.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the confidence, the validity end and the basis of the validity start the attribute holds
  asserts: A succession re-affirmation of the held attribute that states another confidence, validity end and basis assigns none of the columns confidence, valid_to or valid_from_source. It asserts nothing about status or validity start.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the confidence, the validity end and the basis of the validity start the link holds
  asserts: A succession re-affirmation of the held link that states another confidence, validity end and basis assigns none of the columns confidence, valid_to or valid_from_source. It asserts nothing about status or validity start.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the held attribute row unwritten, so its validity start, basis, confidence, status and end stay
  asserts: A same-value proposal with change hint none and other fields issues no UPDATE to node_attribute.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the held link row unwritten, so its validity start, basis, confidence, status and end stay
  asserts: A same-target proposal with change hint none and other fields issues no UPDATE to knowledge_link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: meets a held link or attribute as current only while it has neither a validity end nor a supersession time
  asserts: With change hint none, a same-target or same-value proposal returns consolidated only when the held row has neither valid_to nor superseded_at set. All four combinations are checked, for links and for attributes.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept'
  asserts: With change hint none, a same-target proposal with a later start returns consolidated with the held link's id, adds its fragment to the held link, and inserts or updates no knowledge_link row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept'
  asserts: With change hint none, a same-value proposal with a later start returns consolidated with the held attribute's id, adds its fragment to the held attribute, and inserts or updates no node_attribute row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new attribute when the proposal re-affirms the held attribute with another start
  asserts: A same-value proposal with change hint none and another start inserts no node_attribute row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new link when the proposal re-affirms the held link with another start
  asserts: A same-target proposal with change hint none and another start inserts no knowledge_link row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: a SECOND 23505 (still racing) surfaces as ValidationFailure(SYSTEM_INTERNAL_ERROR)
  asserts: When every knowledge_link INSERT raises unique violation 23505, proposeLinkService throws a ValidationFailure with code SYSTEM_INTERNAL_ERROR after exactly two insert attempts.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: accepted (new) — no vigent row
  asserts: With no current attribute, an attribute proposal returns accepted and inserts one node_attribute row and one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "accepted (new)" inserts >= 1 provenance row
  asserts: With no current link, a link proposal returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "consolidated" inserts >= 1 provenance row
  asserts: A same-target link proposal with change hint none returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "correction (outcome=accepted)" inserts >= 1 provenance row
  asserts: A link proposal with change hint correction and another target returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "disputed" inserts >= 1 provenance row
  asserts: A link proposal with change hint none, another target and neutral text returns an ok envelope and inserts at least one provenance row. It does not assert the outcome, so it does not bear on criterion 14.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "superseded_previous" inserts >= 1 provenance row
  asserts: A link proposal with another target and succession text returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: calling proposeLinkService twice with identical args returns accepted then consolidated (no dup-guard hit)
  asserts: With no current link the proposal returns accepted and inserts one link. With an identical current link it returns consolidated, inserts no link and inserts one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: catches 23505 on first INSERT, retries the lookup-and-decide, settles deterministically on the second attempt
  asserts: A 23505 on the first knowledge_link INSERT leads to two savepoints, one rollback, and one persisted link insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: closes vigent and inserts a new chained row when functional + different target + textual succession signal
  asserts: A single-current link proposal with change hint none, another target and succession text returns superseded_previous naming the held link. It issues one knowledge_link UPDATE whose SQL contains valid_to, superseded_at, 'superseded' and "ELSE superseded_at", and inserts one link whose supersedes_link_id is the held link and whose target is the proposed one, plus one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: closes vigent with status='superseded' (transaction axis only) and inserts a chained new row; outcome=accepted
  asserts: A link proposal with change hint correction and another target returns accepted naming the held link as superseded. It issues one UPDATE whose SQL has no valid_to but has superseded_at and 'superseded', and inserts one link superseding the held one, plus one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: consolidated — same (node, key, value, valid_from)
  asserts: An attribute proposal identical in value and start to the current attribute, with change hint none, returns consolidated with the held attribute's id, inserts no attribute and inserts one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: consolidates a multi-current link when second document has a different valid_from (received fallback)
  asserts: On a multi-current link type, a same-target proposal with change hint none and another start returns consolidated with the held link's id. It inserts no link, inserts one provenance row on the held link, and issues no UPDATE.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: correction — change_hint='correction' + errata text, outcome=accepted, valid_to untouched
  asserts: An attribute proposal with change hint correction and another value returns accepted naming the held attribute as superseded. It issues one UPDATE whose SQL has no valid_to and contains 'superseded', and inserts one attribute superseding the held one.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: detects 'deixou de' / 'passou a' / 'novo' / 'replaced' / 'substituiu'
  asserts: The internal hasSuccessionSignal helper returns true for four marker phrases and false for neutral text.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: disputed — divergent value, same overlapping period, no signal
  asserts: A single-current attribute proposal with change hint none, another value and neutral text returns disputed. It issues one UPDATE containing 'disputed' and inserts one attribute with status disputed and a null supersedes_attribute_id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: dup-guard 23505 race on attribute INSERT — retried once, then succeeds
  asserts: A 23505 on the first node_attribute INSERT leads to two savepoints, one rollback, and one persisted attribute insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: exports consolidateLink and consolidateAttribute
  asserts: consolidateLink and consolidateAttribute are functions. It checks only that the exports exist, so it fails only if one is removed.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: functional link with the same target and a different valid_from consolidates on the held link
  asserts: A single-current link proposal with change hint none, the held target and another start returns consolidated with the held link's id and inserts no link.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: inserts a new knowledge_link row and one provenance row when no vigent exists
  asserts: With no current link, a proposal returns accepted and inserts one link and one provenance row. The new link has a null supersedes_link_id and status active at confidence 0.9.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: inserts with status='uncertain' when 0.40 <= confidence < 0.75
  asserts: With no current link, a proposal at confidence 0.5 returns accepted and inserts a link with status uncertain.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: intra-day succession closes on the transaction axis only — guards the degenerate [D,D) interval (§5.1 date granularity)
  asserts: A succession by text to another target on the held link's own start date returns superseded_previous. It issues one knowledge_link UPDATE whose SQL contains CASE, "valid_from >=", "THEN valid_to", superseded_at and "THEN now()", with the close date bound as the second parameter.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: is case-insensitive
  asserts: The internal hasSuccessionSignal helper returns true for upper-case and mixed-case marker phrases.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: promotes the cited fragment proposed -> accepted when provenance is created (§6.6)
  asserts: With no current link, an accepted proposal issues one information_fragment UPDATE. Its SQL contains status = 'accepted' and status = 'proposed', and it is bound to the cited fragment id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: recognizes change_hint='succession' as a succession signal even without textual marker
  asserts: A single-current link proposal with change hint succession, another target and neutral text returns superseded_previous, with one UPDATE and one link insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: returns outcome=consolidated and does NOT insert a new row when (source, link_type, target, valid_from) match the vigent row
  asserts: A link proposal identical in target and start to the current link, with change hint none, returns consolidated with the held link's id. It inserts no link, inserts one provenance row on the held link, and issues no UPDATE.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: superseded_previous — different value on a functional key with succession signal
  asserts: A single-current attribute proposal with change hint none, another value and succession text returns superseded_previous naming the held attribute. It issues one node_attribute UPDATE containing valid_to and inserts one attribute superseding the held one.
findings:
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  where: the CORRECTED expectation (line 889), used by the precedence rows "correction before succession", "correction before dispute" and "correction before new assertion on a type allowing multiple current assertions" — node contracts/knowledge-base/ingestion, kind unstated
  evidence: 'const CORRECTED: Taken = { outcome: "accepted", on_held: false, held_statuses: ["superseded"], new_assertions: 1, };'
  cost: 'The test fixes which outcome word a correction proposal gets: "accepted", the same word as a new assertion, and not "superseded_previous". The ingestion contract lists the outcomes (consolidated; accepted; superseded_previous with the superseded identity; disputed). rules/knowledge-base/correction-replaces says what a correction does (supersedes the assertion, keeps its validity end, records a new assertion naming it) and says nothing about its outcome word. No node says which branch answers with which word. The mapping now lives only in this test and in the service, so a reader looking in the specification for the outcome of a correction finds nothing.'
  correction: The analysis that owns the propose-link and propose-attribute answers would need to state which outcome a correction, a succession and a new assertion each carry. Nothing in this file changes.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the comment above the first consolidated test (lines 528-529), the "Bug / Fix" comment block (lines 605-620) and the attribute test title at line 1045 — node rules/knowledge-base/reaffirmation-consolidates, kind restates
  evidence: '// BR-27 step (a): vigent row exists; same target; same valid_from; // change_hint=''none'' -> no new row, only provenance. ... "Fix: for multi-current types, recognize re-affirmation by `sameTarget && change_hint === ''none''` WITHOUT requiring `sameValidFrom`." ... it("consolidated — same (node, key, value, valid_from)"'
  cost: The comments and the title say a re-affirmation depends on the same validity start, or only on same target with hint none for multi-current types. The node says it holds "whatever validity start it states" for hint none or succession. The test code at lines 626-661, 663-693 and 695-724 already holds the node's rule, so the prose is a second, narrower statement of it. A reader who finds the comment first will take the same-start condition as the rule and look for it in the code instead of in the specification.
  correction: Remove the comments at lines 528-529 and 605-625. The test names and assertions already carry the behavior. The node binds the fact, and the code that holds it is the tests at 626-724 plus the consolidation service the candidate index binds.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the comment above the disputed link test (lines 867-868) — node rules/knowledge-base/conflict-disputes, kind restates
  evidence: '// BR-27 step (d): functional vigent row exists; different target; overlapping // period; no signal -> mark BOTH disputed.'
  cost: The comment restates the dispute rule and adds an "overlapping period" condition the node does not hold. The node only requires a type that does not allow multiple current assertions and a proposal that meets the current assertion as a dispute. The assertions at lines 894-901 hold the outcome (old row disputed, new row disputed, supersedes nothing). A reader who trusts the comment will believe the specification makes overlap a condition of a dispute.
  correction: Remove the comment. The assertions already hold the dispute outcome, and the node binds it.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the comment inside the first consolidated test (line 553) and the comment on the multi-current test (line 656) — node rules/knowledge-base/consolidation-records-provenance, kind restates
  evidence: // Provenance MUST still be inserted (BR-18) — re-affirmation accumulates. ... // Provenance accumulated on the vigent link (BR-18).
  cost: The comments restate that a taken proposal records provenance on the assertion it lands on. The assertions at lines 554-555 and 657-658 already hold that, so the sentence has two homes. When the node moves, the file stays unbound by the prose and nothing would flag the comment.
  correction: Remove the comments. The assertions on state.inserts.provenance and its target_id hold the fact.
- pass: conformance
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the SUCCESSION_MARKERS declaration (lines 11-21) and hasSuccessionSignal (lines 23-33), which consolidateLinkOnce and consolidateAttributeOnce call — node rules/knowledge-base/succession-signal, kind contradicts
  evidence: const SUCCESSION_MARKERS = [ "deixou de", "passou a", "novo", "nova", "substituiu", "substituido", "substituido por", "succeeded", "replaced", ] as const; ... if (lower.includes(m)) return true;
  cost: 'The specification already holds this vocabulary in rules/knowledge-base/succession-signal: "An information fragment signals succession when its text contains, in any letter case, deixou de, passou a, novo, nova, substituiu, substituido, substituido por, succeeded or replaced." The word list is declared here as well, in a file that node is not in the delegated set for. The marker list is also exported through `__testing__`, so a test can pin the code''s copy. If the node''s list changes, `--check` never reaches this file and the code keeps deciding succession from the old words. Nobody can tell which list the business decided. The lists agree today, word for word.'
  correction: Bind rules/knowledge-base/succession-signal to this file, so a change to the node reaches the declaration that implements it. Code cannot read the specification, so the bind is what closes this, not a rewrite of the list.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  where: the file's path
  cites: TST-04
  evidence: path src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts, importing "../../../modules/ingestion/service/graph-consolidation.service.js"
  cost: The unit under test is src/modules/ingestion/service/graph-consolidation.service.ts. The test path drops modules/ and service/ and is a second file beside graph-consolidation.spec.ts for the same unit. Someone looking for the tests of that service from its path finds one of the two, or neither.
  correction: Place the tests under the mirrored path (unit/modules/ingestion/service/, named for graph-consolidation.service), or fold them into the one spec that mirrors the unit.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  where: HELD_LINK (line 75) and HELD_ATTRIBUTE (line 85) against SUBJECTS heldStart (lines 732, 743, 754, 770)
  cites: TYP-04
  evidence: 'valid_from: "2024-01-01",  ...  heldStart: "2024-01-01",  ...  valid_from: "2026-01-01",  ... heldStart: "2026-01-01",'
  cost: The validity start of the held row is written twice for the link rows and three times for the attribute rows. If one is changed, the "the held start" start class in the re-affirmation matrix no longer matches the row it is meant to equal. The matrix then tests a different case than its name says.
  correction: Name the held start once per kind (for example HELD_LINK_START and HELD_ATTRIBUTE_START) and use the name in both the held rows and the subjects.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  where: tests at lines 868-873, 1024-1029, 1065-1070, 1258-1263 and 1311-1316 (the matrix tests that assert on an empty list)
  cites: TST-01
  evidence: 'const missed = await reaffirmationsMissed();

    expect(missed).toEqual([]);'
  cost: The arrangement (subjects, held rows, proposals) and the act sit in module-level tables and loop helpers, not in the test. The test body shows only a helper name and an expected empty list. A reader of a failing run gets a string such as "link, one current, hint none, no start" and has to open the helper and the tables to learn what was set up and what was expected.
  correction: Keep the cases in the tables, but have each case be its own visible arrange/act/assert (for example it.each over the table rows). Alternatively make the test body state its setup and expected observation where the claim is made.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the file's path
  cites: TST-04
  evidence: path src/__tests__/unit/ingestion/graph-consolidation.spec.ts, importing "../../../modules/ingestion/service/graph-consolidation.service.js"
  cost: The path omits modules/ and service/ and the .service part of the unit's name, so the test cannot be located from the file it covers by mirroring its path. It sits beside a second spec for the same unit.
  correction: Move it to the mirrored path under unit/, with the unit's name, and decide there which of the two specs for this service is the one that mirrors it.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: line 47, the module-level constant runCtx
  cites: CON-02
  evidence: 'const runCtx = { llmRunId: RUN_ID, rawInformationId: RAW_INFO_ID };'
  cost: The module-level constants around it (RUN_ID, SOURCE_NODE, FRAGMENT_ID and so on) are screaming snake case. This one is camelCase, so a reader can no longer tell from the name that it is a shared fixed value rather than a local variable.
  correction: Rename it to RUN_CONTEXT, as the sibling reaffirmation spec already names the same value.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: class FakeUniqueViolationError (lines 166-174)
  cites: MNT-03
  evidence: "class FakeUniqueViolationError extends Error {\n  public readonly code = \"23505\";\n  public readonly constraint: string;\n  constructor(constraint: string) {\n    super(`duplicate key value violates unique constraint \"${constraint}\"`);"
  cost: reaffirm-consolidation-world.ts already holds the same stand-in for a unique violation, as UniqueViolation. The two copies of the driver-error shape can drift apart. A change to what the service reads from a violation (for example the constraint field) would then be tested against only one of them.
  correction: Export one unique-violation stand-in from the world helper and import it here.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: function buildClient (lines 176-397), including its query closure (lines 200-392)
  cites: MNT-01
  evidence: "function buildClient(cfg: MockConfig = {}) {\n  ...\n  const client = {\n    query: async (...args: unknown[]) => {"
  cost: 'One function of about 220 lines holds the whole fake store: savepoint control, eleven statement matchers and the race simulation. A reader cannot tell what the fake answers to a given statement without reading all of it. New matchers get added to the end of the chain, since the function is too large to split.'
  correction: Split it into one named helper per statement family (control statements, graph-row lookups, writes, provenance), as reaffirm-consolidation-world.ts already does.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 223 (params[0] as string[]), 317, 379, 394 (as unknown as import("pg").PoolClient) and 992-994 (client.query as unknown as ..., client as unknown as ...)
  cites: TYP-02
  evidence: '} as unknown as import("pg").PoolClient;

    const realQuery = client.query as unknown as (...args: unknown[]) => Promise<unknown>;'
  cost: The fake client is claimed to be a PoolClient, and its query function is claimed to have another type, with no check that narrows either claim. If the service starts calling a PoolClient method the fake lacks, the compiler does not say so and the test fails at run time with a TypeError.
  correction: Type the fake against the part of PoolClient the service uses (a Pick of query and release), so the assertion is not needed. Alternatively narrow the string[] and unknown[] parameters with a guard.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: baseLinkArgs (line 411) and baseAttrArgs (line 432)
  cites: DTO-04
  evidence: "const baseLinkArgs = (overrides: Partial<{\n  source_node_id: string;\n  target_node_id: string;\n  link_type: string;\n  confidence: number;\n  ...\n  change_hint: \"none\" | \"succession\" | \"correction\";\n}> = {}) => ({"
  cost: The shape of the propose-link and propose-attribute input is written out again inside the test. If the production schema changes (a new field, another change_hint value), the test keeps compiling against a shape production no longer accepts.
  correction: Type the overrides from the DTO's inferred type or schema in the dto directory, instead of a hand-written Partial.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the now option of every proposeLinkService and proposeAttributeService call (first at line 466, about twenty-five repetitions)
  cites: TYP-04
  evidence: '{ catalog, now: () => new Date("2026-06-12T12:00:00Z") }'
  cost: The same fixed clock is spelled out about twenty-five times. Changing the fixed date means changing every occurrence, and a missed one leaves one test on a different clock from its neighbours.
  correction: Define one named constant or helper for the fixed clock (for example FIXED_NOW or a deps() builder) and use it at every call.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: test at line 562, "calling proposeLinkService twice with identical args returns accepted then consolidated (no dup-guard hit)"
  cites: TST-01
  evidence: "expect(state.inserts.knowledge_link.length).toBe(1); } // Second call: vigent row now exists with identical scope. {\n  const { client, state } = buildClient({"
  cost: The test asserts, then arranges and acts again, then asserts again. It is two tests in one body. A failure in the second block does not say whether the first call's setup still held, and the test name carries two expectations.
  correction: Split it into one test for the first call (accepted, one insert) and one for the second call (consolidated, no insert).
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the it callbacks at lines 626 (about 36 lines), 733 (about 48), 782 (about 48) and 914 (about 41)
  cites: MNT-01
  evidence: it("closes vigent and inserts a new chained row when functional + different target + textual succession signal", async () => {
  cost: Each of these callbacks sets up, acts and then makes ten or more assertions with comments between them. A failing run points at the test name rather than at the one claim that broke.
  correction: Split by claim (the close statement, the chained insert, the provenance), or extract the repeated assertions into named helpers.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: test names at lines 1030, 1045, 1070, 1105, 1135 and 1171 (the tests of "consolidateAttribute — five decision branches")
  cites: TST-02
  evidence: it("accepted (new) — no vigent row", ...  it("consolidated — same (node, key, value, valid_from)", ... it("disputed — divergent value, same overlapping period, no signal", ...
  cost: The names are labels of a branch, not sentences of what the service does. In a run listing, "disputed — divergent value..." does not say what is expected (a dispute is recorded and the held attribute is flagged). The link-side tests name the behavior as a sentence and these do not.
  correction: Rename each as the behavior it expects, for example "records a new disputed attribute and flags the held one when a different value arrives on a key allowing one current value".
- pass: standard
  file: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  where: buildWorld, line 205
  cites: TYP-02
  evidence: '} as unknown as PoolClient;'
  cost: A two-method object is claimed to be a whole PoolClient with no narrowing. If the service starts to use another PoolClient member, the compiler stays silent and the test fails with a TypeError at run time instead of at compile time.
  correction: Type the stand-in as Pick<PoolClient, "query" | "release">. Have the service's functions accept that narrower type, or place the single cast in one named adapter function.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: closeVigentForSuccession (line 158), lockVigentLinkByTriple (205), lockVigentAttributeByTriple (249), insertLinkRow (421), insertAttributeRow (605)
  cites: MNT-01
  evidence: "async function closeVigentForSuccession(\n  client: PoolClient,\n  table: \"knowledge_link\" | \"node_attribute\",\n  vigentId: string,\n  closeDate: string | null\n): Promise<void> {"
  cost: Each takes four positional parameters, and the two lock-by-triple functions take three strings in a row that a call can transpose without the compiler noticing (for example sourceNodeId, linkTypeId and targetNodeId).
  correction: Pass an object (a named parameter type) for the ids and the table.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink (lines 272-314) and consolidateAttribute (lines 456-498), each about 43 lines with five positional parameters
  cites: MNT-01
  evidence: "export async function consolidateLink(\n  client: PoolClient,\n  args: ConsolidateLinkArgs,\n  linkTypeInfo: LinkTypeRow,\n  fragmentTexts: readonly string[],\n  runCtx: RunContext\n): Promise<ConsolidateLinkResult> {"
  cost: Both are exported entry points that exceed both limits (thirty lines, three parameters). Every caller must get a five-position argument order right, and the retry logic is mixed in with the call.
  correction: Move the retry loop into a shared helper. Take one context object for the catalog row, texts and run context.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: lines 279, 300, 463 and 484 (the retry bound) and the repeated error text at 301-313 and 485-497
  cites: TYP-04
  evidence: "for (let attempt = 1; attempt <= 2; attempt += 1) { ... if (attempt === 2) {\n  throw new ValidationFailure(\n    \"SYSTEM_INTERNAL_ERROR\","
  cost: The retry bound is spelled as 2 in four places, and "SYSTEM_INTERNAL_ERROR" and the dup-guard message are spelled out four times. Changing the number of attempts means editing four spots, and missing one leaves the loop bound and the "last attempt" check disagreeing, so the loop either never throws the typed error or throws on the first attempt.
  correction: Name the bound (for example MAX_CONSOLIDATION_ATTEMPTS) and use it in both the loop and the last-attempt check. Name the error code and message once.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: closeVigentForSuccession, line 167 (and SAVEPOINT statements at lines 281 and 465)
  cites: STK-05
  evidence: "`UPDATE ${table}\n        SET valid_to = CASE\n                         WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}\n... await client.query(`SAVEPOINT ${savepoint}`);"
  cost: 'Values are concatenated into SQL text: the table name, the close expression (chosen between "$2::date" and "now()::date") and the savepoint name. All come from a closed TypeScript union or from program literals today, so no request input reaches them. But that holds only while the type checker enforces the union. At run time the template renders any string it is handed, and a reader grepping for the statement will not find it as one piece of SQL.'
  correction: Keep one statement per table (written out in full), with the date as a bound parameter and the CASE deciding on null in SQL. For the savepoint name, keep the name a program literal. A fixed set of names would make that visible.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: catch blocks at lines 292-307 (consolidateLink) and 476-491 (consolidateAttribute)
  cites: COR-01
  evidence: "if (attempt === 2) {\n  throw new ValidationFailure(\n    \"SYSTEM_INTERNAL_ERROR\",\n    \"graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.\",\n    { scope: \"knowledge_link\" }\n  );\n}"
  cost: When the second dup-guard violation is turned into a typed failure, the original 23505 error (constraint, detail, the statement's context) is not carried as the cause. Whoever investigates a SYSTEM_INTERNAL_ERROR from concurrent ingestion has only this message and the scope. The other branch (`throw err` after the rollback) rethrows the driver error unwrapped.
  correction: Pass the caught error as the cause of the ValidationFailure on the final attempt, and wrap the rethrow in the non-dup-guard branch the same way.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: 'the SYSTEM_INTERNAL_ERROR failures at lines 301-305, 309-313, 485-489 and 493-497, with the details argument { scope: "knowledge_link" } or { scope: "node_attribute" }'
  cites: SEC-04
  evidence: '"consolidateLinkWithRetry: unreachable loop exit." ... "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row." ... { scope: "node_attribute" }'
  cost: The message and details name an internal function, a guard constraint and a table. This project renders the message and details of a typed failure into the response envelope, but the mapping lives outside the reviewed set and I did not read it. If they pass through, a caller learns the store's shape from a concurrency failure. The first message also names a function (consolidateLinkWithRetry) that does not exist in this file.
  correction: Keep the internal wording in the log and carry a generic message and no table name in the failure that reaches the client. The error mapping would show whether the details are actually rendered.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink (lines 272-314) against consolidateAttribute (lines 456-498), and the lock, provenance and insert helper pairs
  cites: MNT-03
  evidence: const savepoint = `gc_link_${attempt}`; await client.query(`SAVEPOINT ${savepoint}`); ... const savepoint = `gc_attr_${attempt}`; await client.query(`SAVEPOINT ${savepoint}`);
  cost: The savepoint-and-retry loop is copied whole, with only the savepoint prefix, the guard name and the scope changed. The two already differ in a stray function name in the "unreachable" message. A fix to one (the retry count, the rollback order, the cause) has to be made by hand in the other.
  correction: Extract one function that runs a callback under a savepoint with a retry on the named guard. The link and attribute entry points then only pass the callback, the guard and the scope.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce (lines 316-419) against consolidateAttributeOnce (lines 500-603), and the lock and provenance helper pairs
  cites: MNT-03
  evidence: if (sameTarget && args.change_hint !== "correction") { ... if (sameValue && args.change_hint !== "correction") {
  cost: The decision ladder (re-affirm, correct, succeed, dispute, new) is written twice, once for links and once for attributes. Changing the precedence, as the reaffirmation work just did, must be made identically in both. The reaffirmation spec has to run a matrix over every kind to catch the day they diverge.
  correction: Express the ladder once over a small description of the held row (identity, same-or-not, functional or not). The link and attribute variants then supply only their SQL and result shape.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce (lines 316-419, about 104 lines, 5 parameters) and consolidateAttributeOnce (lines 500-603, about 104 lines, 5 parameters)
  cites: MNT-01
  evidence: "async function consolidateLinkOnce(\n  client: PoolClient,\n  args: ConsolidateLinkArgs,\n  linkTypeInfo: LinkTypeRow,\n  fragmentTexts: readonly string[],\n  runCtx: RunContext\n): Promise<ConsolidateLinkResult> {"
  cost: Each is more than three times the thirty-line limit and holds five branches of a precedence order. A new branch will be added to the middle of a function nobody can hold in their head. Reordering the branches (which changes outcomes) is a diff of the whole body.
  correction: Extract one named helper per branch (reaffirm, correct, succeed, dispute, insert new) and have the function only choose among them.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: __testing__, line 641
  cites: CON-02
  evidence: "export const __testing__ = {\n  hasSuccessionSignal,\n  SUCCESSION_MARKERS,\n};"
  cost: An exported constant is named in lowercase between double underscores, not in screaming snake case. It does not read as a constant next to SUCCESSION_MARKERS. Its own test reaches the function it re-exports through this object although hasSuccessionSignal is already exported by name.
  correction: Rename it to a screaming snake case name, or remove it, since the function is already exported and SUCCESSION_MARKERS can be exported directly.
reconciliation: siegard-reconcile/succession-reaffirms-same-target-again.md
run: run/succession-reaffirms-same-target-again
---
## What it is
Three passes read the four files the task wrote, a captured run of the registry's five steps passed over the whole tree, and the conformance pass folded into the reconciliation record named above.
The failures pass did not run because the run passed.

## Notes
This review follows the proof-only re-delivery of the task that closed the three testable remainders of the first review, siegard-reconcile/succession-reaffirms-same-target.md.
Six of the eight certifications came back covered, so the conflict-disputes, consolidation-precedence and different-target-without-signal-is-disputed remainders are closed by tests.
The certifications of rules/knowledge-base/reaffirmation-consolidates and rules/knowledge-base/proposal-meets-current-assertion came back partial with testable remainders: a re-affirming proposal stating a start earlier than the held one and another confidence, validity end, basis or status on a type allowing several current assertions, and two current assertions under one multi-valued type.
Fourteen node-file pairs the first review had cleared at these bytes were omitted from the staging, so the conformance judge over graph-consolidation.service.ts read eleven nodes and not twenty-five; its one finding names rules/knowledge-base/succession-signal as unbound to the file although the trace binds it there since the first review.
The conformance judge over the reaffirmation spec found that the outcome word a correction answers with is held by no node.
Standard findings over graph-consolidation.service.ts and graph-consolidation.spec.ts concern code this change did not touch; the review read the whole files.
