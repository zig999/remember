---
target: backend
title: Review of the reaffirm-with-other-start delivery
summary: What the coverage, conformance and standard passes found over the consolidation service, its new spec and store stand-in, and the existing spec one test of which was rewritten.
reviewed:
- src/modules/ingestion/service/graph-consolidation.service.ts
- src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
- src/__tests__/unit/ingestion/graph-consolidation.spec.ts
tasks:
- task/reaffirm-with-other-start/reaffirm-other-start-proposal
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/reaffirm-with-other-start passed; there was no failure to read
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
coverage:
- criterion: A link proposal with change hint none whose target is the target of the current link of its source and link type that does not allow multiple current links, and that states a different validity start, is answered as a re-affirmation of that link.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-target proposal with change hint none and another start as consolidated on the held link
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: meets a held link or attribute as current only while it has neither a validity end nor a supersession time
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: functional link with the same target and a different valid_from consolidates on the held link
  why: Two tests check this only in passing. The current-assertion test checks it in its one current-row case while it tests the currency rule. The rewritten test in graph-consolidation.spec.ts goes through proposeLinkService. The first two tests above check it directly, so nothing is left unexercised.
- criterion: An attribute proposal with change hint none whose value is the value of the current attribute of its node and attribute key that does not allow multiple current values, and that states a different validity start, is answered as a re-affirmation of that attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-value proposal with change hint none and another start as consolidated on the held attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: meets a held link or attribute as current only while it has neither a validity end nor a supersession time
- criterion: A link proposal that re-affirms the current link with a different validity start records no new link.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new link when the proposal re-affirms the held link with another start
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: functional link with the same target and a different valid_from consolidates on the held link
- criterion: An attribute proposal that re-affirms the current attribute with a different validity start records no new attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records no new attribute when the proposal re-affirms the held attribute with another start
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept'
- criterion: A link proposal that re-affirms the current link with a different validity start adds its provenance to that link.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal to the held link
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds a second cited fragment once and the already-held one not again when the held link is re-cited
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in every branch of the consolidation order
  why: The provenance-landing test reads provenance from whichever link the answer names, not from the held link. On its own it would still pass if a re-affirmation recorded its provenance on a newly inserted row, so its bearing is incidental. The first three tests read provenance from the held link's own id.
- criterion: An attribute proposal that re-affirms the current attribute with a different validity start adds its provenance to that attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds the provenance of the proposal to the held attribute
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: adds a second cited fragment once and the already-held one not again when the held attribute is re-cited
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept'
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in every branch of the consolidation order
  why: The provenance-landing test reads provenance from whichever attribute the answer names, not from the held attribute. On its own it would still pass if provenance landed on a newly inserted row, so its bearing is incidental. The first three tests read provenance from the held attribute's id.
- criterion: The current link keeps the validity start it holds when a link proposal with a different validity start re-affirms it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the held link row unwritten, so its validity start, basis, confidence, status and end stay
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept'
  why: 'No test reads the start back from the row. The tests prove it is kept by showing that no UPDATE reaches knowledge_link. The store stand-in records writes without applying them, and it throws on any statement it does not recognise. So a change to the start through any other statement would also fail. Finding, over-assertion: both tests require that no UPDATE of any kind reaches knowledge_link during the re-affirmation. That goes beyond this criterion, which names only the validity start. Both tests would fail if a sibling task rewrote another column of the held link on re-affirmation, such as its confidence or status, even though the start stays as it is. The proof record attributes the extra part to its "entry 3", which is not among the criteria supplied for this review.'
- criterion: The current attribute keeps the validity start it holds when an attribute proposal with a different validity start re-affirms it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: leaves the held attribute row unwritten, so its validity start, basis, confidence, status and end stay
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: 're-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept'
  why: 'No test reads the start back from the row. The tests prove it is kept by showing that no UPDATE reaches node_attribute, and the store stand-in throws on any statement it does not recognise. Finding, over-assertion: both tests require that no UPDATE of any kind reaches node_attribute. That goes beyond this criterion, which names only the validity start. They would fail if a sibling task rewrote another column of the held attribute, such as its confidence or status, on re-affirmation while the start stays as it is. The proof record attributes the extra part to its "entry 3", which is not among the criteria supplied.'
- criterion: A link proposal with change hint succession and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint succession and the held target as a re-affirmation
  why: The criterion does not limit the validity start. The one test submits a succession proposal whose start (2024-06-01) differs from the held link's (2024-01-01). Nothing in the set submits a succession proposal with the same target and the held link's own start. The test would therefore still pass if an implementation re-affirmed a same-target, same-start proposal whatever its change hint.
- criterion: An attribute proposal with change hint none and a value other than the value of the current attribute of its node and attribute key that does not allow multiple current values is not answered as a re-affirmation.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint none and another value as a re-affirmation
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: disputed — divergent value, same overlapping period, no signal
  - file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: superseded_previous — different value on a functional key with succession signal
  why: 'The two graph-consolidation.spec.ts tests check this only in passing: each asserts a specific outcome (disputed, superseded_previous) for a change-hint-none proposal with a different value. The first test checks it directly.'
unpaired:
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: answers a same-value proposal with another start as consolidated on an attribute key that allows multiple current values
  asserts: On an attribute key that allows multiple current values, a same-value proposal with another validity start is answered consolidated, on the held attribute's id. Criterion 2 covers only keys that do not allow multiple current values. The proof record ties this test to its "entry 1", which is not among the supplied criteria.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint correction and the held target as a re-affirmation
  asserts: A link proposal with change hint correction and the held link's target, on a type that does not allow multiple current links, gets an outcome other than consolidated. No supplied criterion covers the correction hint. The proof record ties this test to its "entry 2".
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint correction and the held value as a re-affirmation
  asserts: An attribute proposal with change hint correction and the held value, on a key that does not allow multiple current values, gets an outcome other than consolidated. No supplied criterion covers the correction hint for attributes.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
    name: does not answer a proposal with change hint succession and the held value as a re-affirmation
  asserts: An attribute proposal with change hint succession and the held value gets an outcome other than consolidated. Criterion 9 states this for links only, and no supplied criterion states the attribute counterpart.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: a SECOND 23505 (still racing) surfaces as ValidationFailure(SYSTEM_INTERNAL_ERROR)
  asserts: When every INSERT into knowledge_link raises 23505, proposeLinkService throws a ValidationFailure with code SYSTEM_INTERNAL_ERROR after exactly two insert attempts.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: accepted (new) — no vigent row
  asserts: An attribute proposal with no held attribute is answered accepted, with one node_attribute insert and one provenance insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "accepted (new)" inserts >= 1 provenance row
  asserts: A new link proposal returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "consolidated" inserts >= 1 provenance row
  asserts: A same-target, same-start link proposal returns an ok envelope and inserts at least one provenance row. The proposal's start equals the held link's, so this is not the different-start case the criteria state.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "correction (outcome=accepted)" inserts >= 1 provenance row
  asserts: A correction link proposal with a different target returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "disputed" inserts >= 1 provenance row
  asserts: A link proposal with a different target and no succession or correction signal returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: branch "superseded_previous" inserts >= 1 provenance row
  asserts: A link proposal with a different target and a textual succession signal returns an ok envelope and inserts at least one provenance row.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: calling proposeLinkService twice with identical args returns accepted then consolidated (no dup-guard hit)
  asserts: A link proposal with nothing held is answered accepted with one insert. The same proposal against a held link with the same target and start is answered consolidated, with no knowledge_link insert and one provenance insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: catches 23505 on first INSERT, retries the lookup-and-decide, settles deterministically on the second attempt
  asserts: When the first knowledge_link insert raises 23505, the service returns ok. It issues two savepoints and one rollback to savepoint, and it records one persisted insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: closes vigent and inserts a new chained row when functional + different target + textual succession signal
  asserts: On a link type that does not allow multiple current links, a different target plus a textual succession signal is answered superseded_previous, naming the held link. One knowledge_link UPDATE is issued, and its SQL contains valid_to, superseded_at, 'superseded' and "ELSE superseded_at". One chained insert to the new target follows, plus one provenance insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: closes vigent with status='superseded' (transaction axis only) and inserts a chained new row; outcome=accepted
  asserts: A link proposal with change hint correction, a different target and errata text is answered accepted, naming the held link as superseded. A single UPDATE is issued whose SQL lacks valid_to and contains superseded_at and 'superseded'. One chained insert follows, plus one provenance insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: consolidated — same (node, key, value, valid_from)
  asserts: An attribute proposal with the held value and the held start is answered consolidated on the held attribute, with no node_attribute insert and one provenance insert. Its start equals the held one, so it is not the different-start case the criteria state.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: consolidates a multi-current link when second document has a different valid_from (received fallback)
  asserts: On a link type that allows multiple current links, a same-target, change-hint-none proposal with a different start is answered consolidated on the held link. There is no insert, one provenance insert onto the held link, and no UPDATE. The criteria cover only types that do not allow multiple current links.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: correction — change_hint='correction' + errata text, outcome=accepted, valid_to untouched
  asserts: An attribute correction with a different value is answered accepted, naming the held attribute as superseded. One UPDATE is issued whose SQL lacks valid_to and contains 'superseded', followed by one chained insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: detects 'deixou de' / 'passou a' / 'novo' / 'replaced' / 'substituiu'
  asserts: The internal helper hasSuccessionSignal returns true for texts containing the listed markers and false for neutral text.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: does NOT consolidate when change_hint='succession' even on a multi-current link
  asserts: On a link type that allows multiple current links, a same-target proposal with change hint succession either gets a non-consolidated outcome or throws. If the envelope comes back not ok and nothing was thrown, the else branch fails, so the test can fail. Criterion 9 covers only types that do not allow multiple current links.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: dup-guard 23505 race on attribute INSERT — retried once, then succeeds
  asserts: When the first node_attribute insert raises 23505, the service returns ok, with two savepoints, one rollback and one persisted insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: exports consolidateLink and consolidateAttribute
  asserts: The module exports consolidateLink and consolidateAttribute as functions, and nothing more.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: flags both old and new row as disputed and surfaces conflicting_link_id
  asserts: A link proposal with a different target and no signal is answered disputed. One UPDATE containing 'disputed' is issued, then one insert with status disputed and a null supersedes_link_id, then one provenance insert. Despite its name, the test does not assert conflicting_link_id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: inserts a new knowledge_link row and one provenance row when no vigent exists
  asserts: A link proposal with nothing held is answered accepted, with one insert (status active, null supersedes_link_id) and one provenance insert.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: inserts with status='uncertain' when 0.40 <= confidence < 0.75
  asserts: A new link proposal with confidence 0.5 is answered accepted and inserted with status uncertain.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: intra-day succession closes on the transaction axis only — guards the degenerate [D,D) interval (§5.1 date granularity)
  asserts: A same-day succession to a different target is answered superseded_previous with a single knowledge_link UPDATE. Its SQL contains CASE, "valid_from >=", "THEN valid_to", superseded_at and "THEN now()", and its second binding is 2026-06-01. These checks bind the SQL text rather than the behavior.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: is case-insensitive
  asserts: The internal helper hasSuccessionSignal returns true for upper-case and mixed-case markers.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: promotes the cited fragment proposed -> accepted when provenance is created (§6.6)
  asserts: A new link proposal issues one information_fragment UPDATE. Its SQL contains status = 'accepted' and status = 'proposed', and it is bound to the cited fragment id.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: recognizes change_hint='succession' as a succession signal even without textual marker
  asserts: A different-target link proposal with change hint succession and neutral text gives one UPDATE and one insert. When the envelope is ok, the outcome is superseded_previous.
- test:
    file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
    name: returns outcome=consolidated and does NOT insert a new row when (source, link_type, target, valid_from) match the vigent row
  asserts: A link proposal matching the held link's target and start is answered consolidated on the held link, with no insert, one provenance insert onto the held link, and no UPDATE. Its start equals the held one, so it is not the different-start case the criteria state.
findings:
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: line 464, the comment above the status assertion in "inserts a new knowledge_link row and one provenance row when no vigent exists" — node rules/knowledge-base/new-assertion-status-from-confidence, kind restates
  evidence: // active status because confidence >= 0.75 (BR-17).
  cost: The 0.75 floor is stated a second time in test prose. If the node's threshold moves, this comment goes stale and nothing flags it, because it is prose and no bind reaches it.
  correction: Remove the comment. The status assertion beside it and the production consolidation code already hold the fact.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 469-474 and 485-487, the comments in "promotes the cited fragment proposed -> accepted when provenance is created (§6.6)" — node rules/knowledge-base/provenance-accepts-proposed-fragment, kind restates
  evidence: §6.6 requires the fragment to flip to 'accepted' exactly when its Provenance row is created on consolidation.
  cost: A second statement of when a fragment moves from proposed to accepted sits in the test beside the assertions. A reader looking for that rule finds this prose instead of the node.
  correction: Remove the comments. The assertions `expect(promotion.sql).toContain("status = 'proposed'")` and the consolidation service's UPDATE hold the fact.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 516-517, the comment above "returns outcome=consolidated and does NOT insert a new row when (source, link_type, target, valid_from) match the vigent row" — node rules/knowledge-base/reaffirmation-consolidates, kind restates
  evidence: '// BR-27 step (a): vigent row exists; same target; same valid_from; // change_hint=''none'' -> no new row, only provenance.'
  cost: The comment states the re-affirmation condition with a same-validity-start requirement. The node says re-affirmation holds "whatever validity start it states". The test at line 696 does not require a same start either. A reader of the comment learns the older, narrower rule.
  correction: Remove the comment. The production re-affirmation branch, in graph-consolidation.service.ts which this file imports, holds the fact, and the node holds it as stated.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 541 and 544, the comments in the re-affirmation test, and line 645 in the multi-current test — node rules/knowledge-base/consolidation-records-provenance, kind restates
  evidence: // Provenance MUST still be inserted (BR-18) — re-affirmation accumulates.
  cost: The rule that a re-affirmation records provenance on the existing assertion is restated in prose. The assertions on `state.inserts.provenance` already carry it.
  correction: Remove the comments.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 593-608, the block comment above describe "multi-current link re-affirmation with divergent valid_from (§18 bug fix)" — node rules/knowledge-base/reaffirmation-consolidates, kind restates
  evidence: 'Fix: for multi-current types, recognize re-affirmation by `sameTarget && change_hint === ''none''` WITHOUT requiring `sameValidFrom`.'
  cost: The comment limits the "any validity start" re-affirmation to multi-current types. The node applies it to every type, and the test at line 696 exercises it on a functional type. A reader of the comment gets a narrower rule than the one decided, and the comment records a bug history that belongs in a decision log.
  correction: Remove the comment block. The behavior is held by the production consolidator and by the node.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 651-655, the comment above "does NOT consolidate when change_hint='succession' even on a multi-current link" — node rules/knowledge-base/succession-closes-previous, kind restates
  evidence: (succession does not apply to multi-current types per §6.5)
  cost: The scope of succession, only types that do not allow multiple current assertions, is stated in test prose. The rule lives in the node and the consolidator.
  correction: Remove the comment.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 767-772, the comment in "closes vigent and inserts a new chained row when functional + different target + textual succession signal" — node rules/knowledge-base/succession-closes-previous, kind restates
  evidence: '// Emenda v7.3: succession closes the VALIDITY axis only — the close must // guard superseded_at conditionally (intra-day fallback), never set it // unconditionally.'
  cost: How a succession closes the previous assertion is restated in prose that cites an amendment of the old source document, not a node. If the node is changed, nothing reaches this comment.
  correction: Remove the comment. The assertions on the UPDATE's SQL and the production close hold the fact.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 784-788 and 824-827, the comments in "intra-day succession closes on the transaction axis only" — node rules/knowledge-base/succession-before-previous-start, kind restates
  evidence: '// the strict `valid_from < valid_to` CHECK. The succession close must guard // this: emit valid_to only when valid_from < closeDate, else leave it.'
  cost: The rule for a closing date on or before the previous start is restated in prose, in terms of a database CHECK. The node states it in domain terms.
  correction: Remove the comments.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 913-914 and 943-944, the comments in the correction test, and line 1162 in the attribute mirror — node rules/knowledge-base/correction-replaces, kind restates
  evidence: // The vigent row's UPDATE must NOT touch valid_to (§6.5-B "transaction // axis only").
  cost: A correction leaving the previous assertion's validity end as it was is restated in prose citing the old source document. The node holds it.
  correction: Remove the comments. The assertion `expect(state.updates[0]!.sql).not.toContain("valid_to")` holds the fact.
- pass: conformance
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 959 and 988, the describe-level and test-title comments on the dup-guard race — node rules/knowledge-base/consolidation-race-decided-again, kind restates
  evidence: // Dup-guard 23505 race recovery (BR-27 step "SQLSTATE 23505 -> retry once")
  cost: The decide-again-once rule for a concurrent collision is restated in prose and cites a step number from the old source document.
  correction: Remove the comment. The `savepoints.length` and `insertAttempts` assertions hold the behavior.
- pass: conformance
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce, the correction branch (lines 349-367), and consolidateAttributeOnce, its mirror (lines 533-551) — node rules/knowledge-base/correction-replaces, kind unstated
  evidence: "return {\n        outcome: \"accepted\",\n        link_id: newRow.id,\n        superseded_link_id: vigent.id,\n      };"
  cost: The code decides that a correction reports the outcome `accepted` and not `superseded_previous`. It also decides that the outcome carries the superseded identity. No node holds either choice. The contract lists the outcomes as "consolidated, accepted, superseded_previous with the superseded link's identity, or disputed", and correction-replaces says nothing about an outcome. A reader looking in the specification for what a corrected link reports finds nothing, so the answer lives only in this file. The curation and run-summary counts that depend on the outcome follow it.
  correction: The analysis would have to give the outcome a correction reports a node, either in correction-replaces or in the propose-link and propose-attribute answers of the ingestion contract.
- pass: conformance
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce, the fall-through after the `if (vigent !== null)` block (lines 413-418), and consolidateAttributeOnce, its mirror (lines 597-602) — node rules/knowledge-base/new-assertion, kind unstated
  evidence: "const newRow = await insertLinkRow(client, args, runCtx, {\n    status: args.status_for_new_row,\n    supersedes_link_id: null,\n  });"
  cost: For a type that allows multiple current assertions, a proposal that meets the current assertion at the same triple with change hint succession (neither none nor correction) matches no branch. It is recorded as a new assertion, and `new-assertion` says a new assertion is recorded only when the proposal meets no current assertion. The dispute rule covers only types that do not allow multiple, and re-affirmation requires change hint none. No node says what this case does, so the code settles it silently. In practice the duplicate guard probably turns it into the second-collision refusal, but no node says that either.
  correction: The analysis would have to state what a proposal with change hint succession does when it meets a current assertion of the same target or value under a type that allows multiple current assertions.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: const runCtx (line 47)
  cites: CON-02
  evidence: 'const runCtx = { llmRunId: RUN_ID, rawInformationId: RAW_INFO_ID };'
  cost: This is a module-level constant, but it is camelCase while its neighbours (RUN_ID, RAW_INFO_ID, SOURCE_NODE) are screaming snake. A reader cannot tell from the name whether it is a constant or a value computed per test.
  correction: Rename it to RUN_CONTEXT, as the sibling reaffirmation spec already does.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: function buildCatalog (lines 50-111)
  cites: MNT-01
  evidence: "function buildCatalog(): CatalogSnapshot {\n  return buildSnapshot({\n    nodeTypes: ["
  cost: The function is about 60 lines of inline fixture literals. Changing one catalog entry means reading all of it, and the two link types and two attribute keys are written out by hand instead of from named helpers.
  correction: Extract a named builder per catalog section (node types, link types, rules, attribute keys), or build the entries through small helpers.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: function buildClient (lines 176-397), including its query closure
  cites: MNT-01
  evidence: "function buildClient(cfg: MockConfig = {}) {\n  ...\n  const client = {\n    query: async (...args: unknown[]) => {"
  cost: One function of about 220 lines holds savepoint control, fragment lookup, node-type lookup, both FOR UPDATE reads, both inserts and the provenance insert. Each new statement the consolidator issues adds another branch to it, and nobody can say from reading it which statements the stand-in answers. The "..." in the evidence marks omitted lines.
  correction: Split the stand-in into one named handler per statement family and have query dispatch to them.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: test 'closes vigent and inserts a new chained row when functional + different target + textual succession signal' (lines 734-781)
  cites: MNT-01
  evidence: it("closes vigent and inserts a new chained row when functional + different target + textual succession signal", async () => {
  cost: The test body runs about 48 lines and checks the outcome, the close UPDATE's SQL tokens, the chained insert and the provenance in one callback. When it fails, the test name does not say which of those claims broke.
  correction: Split it into one test per claim, with the shared arrange and act in a named helper.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: test 'calling proposeLinkService twice with identical args returns accepted then consolidated (no dup-guard hit)' (lines 550-589)
  cites: TST-01
  evidence: "expect(e1.ok).toBe(true);\n      if (e1.ok) expect(e1.result.outcome).toBe(\"accepted\");\n      expect(state.inserts.knowledge_link.length).toBe(1);\n    }\n    // Second call: vigent row now exists with identical scope.\n    {\n      const { client, state } = buildClient({"
  cost: The test arranges, acts and asserts for the first call, then arranges, acts and asserts again inside one body. A reader cannot tell which call a failing expectation belongs to, or what the single test claims.
  correction: Make it two tests, one per call, or arrange both worlds first, then act on both, then assert.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: casts of the stand-in client (line 394 and lines 993-995)
  cites: TYP-02
  evidence: '} as unknown as import("pg").PoolClient;'
  cost: 'The compiler stops checking that the stand-in has the surface the consolidator uses. If the consolidator starts calling another client method, the test fails at runtime with an undefined-method error instead of at compile time. The same assertion pattern, with an `as unknown as { query: typeof realQuery }` cast, appears again at lines 993-995.'
  correction: Give the stand-in a narrow structural type that is checked, or add a guard that confirms the members the consolidator needs before the cast.
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: attribute suite test names (lines 1031, 1046, 1071, 1106, 1136, 1172)
  cites: TST-02
  evidence: it("accepted (new) — no vigent row", async () => {
  cost: Names such as "accepted (new) — no vigent row", "consolidated — same (node, key, value, valid_from)" and "disputed — divergent value, same overlapping period, no signal" are labels, not sentences about the expected behavior. In a run's output they do not say what was expected, so a failure line tells the reader nothing about what broke.
  correction: Name each one for what it expects, for example "inserts a new attribute row and one provenance row when no vigent attribute exists".
- pass: standard
  file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: export const __testing__ is imported as gcInternals (line 24)
  cites: CON-02
  evidence: __testing__ as gcInternals,
  cost: This is an exported constant object whose name follows neither the screaming-snake rule for constants nor camelCase. The reader has to learn that the double-underscore name is a special seam. This finding is against the declaration in graph-consolidation.service.ts line 641; it is recorded here because that is where it is consumed.
  correction: Name the exported constant in screaming snake case, or expose hasSuccessionSignal directly (it is already exported) and drop the wrapper.
- pass: standard
  file: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  where: buildWorld, the client construction (lines 145-151)
  cites: TYP-02
  evidence: '} as unknown as PoolClient;'
  cost: The compiler no longer checks that the stand-in covers the client methods the consolidator calls. A new call to a method that is not provided fails at runtime, inside the stand-in's own error text, rather than at compile time.
  correction: Type the stand-in as a narrow interface with only query and release, and have the consolidator depend on that interface, or add a guard before the cast.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: isDupGuardViolation (lines 107-114)
  cites: TYP-02
  evidence: "const e = err as PgError;\n  return (\n    e instanceof Error &&\n    e.code === \"23505\" &&\n    e.constraint === guard\n  );"
  cost: The assertion to PgError comes first. The instanceof Error guard narrows only to Error, so `code` and `constraint` are read as typed without anything checking they exist on the thrown value.
  correction: Guard first (instanceof Error plus checks that code and constraint are strings), then read the members from the narrowed value.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: isDupGuardViolation, the SQLSTATE literal (line 111)
  cites: TYP-04
  evidence: e.code === "23505" &&
  cost: The Postgres unique-violation code is a meaningful value written inline. The test world keeps its own copy as UNIQUE_VIOLATION, so the two copies have to be kept in step by hand.
  correction: Declare a named constant for the unique-violation SQLSTATE and use it here.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: closeVigentForSuccession, and the other helpers with four positional parameters (lockVigentLinkByTriple, lockVigentAttributeByTriple, insertLinkRow, insertAttributeRow)
  cites: MNT-01
  evidence: "async function closeVigentForSuccession(\n  client: PoolClient,\n  table: \"knowledge_link\" | \"node_attribute\",\n  vigentId: string,\n  closeDate: string | null\n): Promise<void> {"
  cost: Four positional parameters, two of them strings of the same type (and in the triple-lock helpers three adjacent strings), mean a call site can swap identifiers without a compile error.
  correction: Take one object argument, or extract the table-specific parts into named helpers.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink (lines 272-314)
  cites: MNT-01
  evidence: "export async function consolidateLink(\n  client: PoolClient,\n  args: ConsolidateLinkArgs,\n  linkTypeInfo: LinkTypeRow,\n  fragmentTexts: readonly string[],\n  runCtx: RunContext\n): Promise<ConsolidateLinkResult> {"
  cost: The function takes five positional parameters and runs about 43 lines, so the retry control flow and the savepoint bookkeeping are read together with the arguments. A caller can swap the same-shaped arguments without a compile error.
  correction: Pass the consolidation inputs as one object, and move the savepoint attempt into a named helper.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink, the retry bound (line 279); the same literal appears in consolidateAttribute at line 463
  cites: TYP-04
  evidence: for (let attempt = 1; attempt <= 2; attempt += 1) {
  cost: The retry budget is the literal 2, checked again as `attempt === 2` in the catch. Changing the budget means finding all four places, and forgetting one makes the loop and the final-attempt check disagree.
  correction: Declare a named constant for the maximum number of consolidation attempts and use it in both the loop bound and the final-attempt check.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink and consolidateAttribute retry loops (lines 279-313 and 463-497)
  cites: MNT-03
  evidence: "await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);\n      await client.query(`RELEASE SAVEPOINT ${savepoint}`);\n      if (attempt === 2) {\n        throw new ValidationFailure(\n          \"SYSTEM_INTERNAL_ERROR\","
  cost: The savepoint-and-retry loop is written twice, differing only in the guard name, the savepoint prefix, the scope string and the inner call. A fix to the retry rule has to be made in both, and the unreachable-exit message even names a function, consolidateLinkWithRetry, that does not exist.
  correction: Extract one retry helper that takes the guard name, the savepoint prefix and the operation, and call it from both functions.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink, the retry exhaustion throw (lines 300-306)
  cites: COR-01
  evidence: "if (attempt === 2) {\n        throw new ValidationFailure(\n          \"SYSTEM_INTERNAL_ERROR\",\n          \"graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.\",\n          { scope: \"knowledge_link\" }\n        );"
  cost: The catch replaces the caught driver error with a new error and does not carry the original as its cause. The constraint violation that explains the failure is lost, and whoever reads the log cannot trace back from it.
  correction: Attach the caught err as the cause of the thrown error, or put it in the details the error already carries.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce (lines 316-419) and consolidateAttributeOnce (lines 500-603)
  cites: MNT-01
  evidence: "async function consolidateLinkOnce(\n  client: PoolClient,\n  args: ConsolidateLinkArgs,\n  linkTypeInfo: LinkTypeRow,\n  fragmentTexts: readonly string[],\n  runCtx: RunContext\n): Promise<ConsolidateLinkResult> {"
  cost: Each of the two functions runs about 104 lines with five positional parameters. They hold the lookup and the five consolidation branches, each with its own writes, in one body, so adding a branch means editing a function nobody can hold in their head. consolidateAttributeOnce has the same signature shape and the same length (lines 500-506).
  correction: Extract one named function per branch (re-affirm, correct, succeed, dispute, insert new) and pass an object instead of five positional parameters.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce and consolidateAttributeOnce branch bodies
  cites: MNT-03
  evidence: "if (sameTarget && args.change_hint === \"none\") {\n      await insertLinkProvenance(client, vigent.id, args.fragment_ids);\n      return { outcome: \"consolidated\", link_id: vigent.id };\n    }"
  cost: The five-branch decision order (re-affirm, correct, succeed, dispute, insert) is copied line for line between the link and attribute functions, with only the column names changed (see `if (sameValue && args.change_hint === "none")`). A change to the consolidation order has to be made twice, and the two copies diverge the day one is fixed.
  correction: Express the decision order once, over a shared description of the vigent row and the proposal, and let the link and attribute callers supply only their reads and writes.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateAttribute, the retry exhaustion throw (lines 484-490)
  cites: COR-01
  evidence: "if (attempt === 2) {\n        throw new ValidationFailure(\n          \"SYSTEM_INTERNAL_ERROR\",\n          \"graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.\",\n          { scope: \"node_attribute\" }\n        );"
  cost: The caught driver error is dropped when the new error is thrown. The original constraint name and detail never reach the log, so the failure cannot be traced back to the conflicting write.
  correction: Attach the caught err as the cause, or carry it in the error's details.
- pass: standard
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: export const __testing__ (lines 641-644)
  cites: CON-02
  evidence: "export const __testing__ = {\n  hasSuccessionSignal,\n  SUCCESSION_MARKERS,\n};"
  cost: This is an exported constant that follows neither the screaming-snake rule for constants nor camelCase. It also re-exports a name that is already exported (hasSuccessionSignal), so there are two public paths to the same function.
  correction: Name the constant in screaming snake case, or drop the wrapper and import the exports directly.
reconciliation: siegard-reconcile/reaffirm-with-other-start.md
run: run/reaffirm-with-other-start
---

## What it is
Three passes read the four files the task wrote or rewrote, a captured run of the registry's five steps passed over the whole tree, and the conformance pass folded into the reconciliation record named above.
The failures pass did not run because the run passed.

## Notes
The certification of rules/knowledge-base/current-assertion came back partial with a testable remainder that reads a held row back through the resolved read the query side serves, which no suite of this project exercises.
The test of the existing consolidation spec that asserted the old dispute behavior was rewritten whole by the test author and is named under the proof's files.
The existing consolidation spec carries comments that restate nodes; the test author removed only the two passages that stated the old same-start requirement, and the conformance pass lists the rest as restates.
The test author reported a stray file outside the target tree, and so did the implementer; neither is part of the delivery.
The two conformance findings over the consolidation service name behavior of correction and of a succession hint over a multi-valued type that no node states; both lie in code this change did not write.
