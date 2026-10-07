---
title: Succession proposals that repeat the current target or value re-affirm
summary: Tests that fail if a link or attribute proposal with change hint succession and the target or value of a current assertion stops being answered as a re-affirmation, or if the correction, dispute, precedence or provenance behavior around it changes.
target: backend
implementation: sha256:7e19f778b6b6930b55c52cfc8a7683fe979521b1dc226759926cf45c679c8f9d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/succession-reaffirms-same-target-reaffirm-same-target-succession-suite-2
tests:
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: answers a proposal with change hint succession and the held target as consolidated, carrying the identity of the held link
  proves: 'Criterion 1, quoted: A link proposal with change hint succession whose target is the target of the current link of its source and link type that does not allow multiple current links is answered as a re-affirmation of that link. Also the UNDERDETERMINED entry on the outcome consolidated carrying the re-affirmed identity (link side). Rewritten whole from the test that asserted the old behavior.'
  fails_when: The proposal is answered with any outcome other than consolidated (dispute, new assertion, superseded_previous or a refusal), or consolidated carries the identity of a new link or an empty identity instead of the held link's.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: answers a proposal with change hint succession and the held value as consolidated, carrying the identity of the held attribute
  proves: 'Criterion 2, quoted: An attribute proposal with change hint succession whose value is the value of the current attribute of its node and attribute key that does not allow multiple current values is answered as a re-affirmation of that attribute. Also the UNDERDETERMINED entry on outcome and identity (attribute side). Rewritten whole from the test that asserted the old behavior.'
  fails_when: The proposal is answered with any outcome other than consolidated, or consolidated carries a new or empty attribute identity instead of the held attribute's.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: answers the proposal as consolidated, carrying the identity of the held attribute
  proves: 'Criterion 4, quoted: An attribute proposal with change hint succession whose value is the value of a current attribute of its node and attribute key that allows multiple current values is answered as a re-affirmation of that attribute.'
  fails_when: A succession proposal repeating the held value on a key that allows multiple current values falls through to the new-assertion insert, or is answered with any outcome other than consolidated on the held attribute.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: records no new link
  proves: 'Criterion 5, quoted: A link proposal with change hint succession that re-affirms the current link records no new link.'
  fails_when: A same-target succession proposal inserts a knowledge_link row, whether as a new link, a superseding link or a disputed link.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: records no new attribute
  proves: 'Criterion 6, quoted: An attribute proposal with change hint succession that re-affirms the current attribute records no new attribute.'
  fails_when: A same-value succession proposal inserts a node_attribute row.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves that link in the status it holds
  proves: 'Criterion 7, quoted: A link proposal with change hint succession that re-affirms the current link leaves that link in the status it holds.'
  fails_when: A statement assigns the held link a status (disputed, superseded or any other) while re-affirming it.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves that attribute in the status it holds
  proves: 'Criterion 8, quoted: An attribute proposal with change hint succession that re-affirms the current attribute leaves that attribute in the status it holds.'
  fails_when: A statement assigns the held attribute a status while re-affirming it.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: adds its provenance to that link
  proves: 'Criterion 9, quoted: A link proposal with change hint succession that re-affirms the current link adds its provenance to that link.'
  fails_when: The fragment the proposal cites is not recorded as provenance on the held link, or is recorded on another link.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: adds its provenance to that attribute
  proves: 'Criterion 10, quoted: An attribute proposal with change hint succession that re-affirms the current attribute adds its provenance to that attribute.'
  fails_when: The fragment the proposal cites is not recorded as provenance on the held attribute, or is recorded on another attribute.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves the validity start the link holds when the proposal states another
  proves: 'Criterion 11, quoted: The current link keeps the validity start it holds when a link proposal with change hint succession and a different validity start re-affirms it.'
  fails_when: A statement assigns valid_from on the held link while a succession proposal with another validity start re-affirms it.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves the validity start the attribute holds when the proposal states another
  proves: 'Criterion 12, quoted: The current attribute keeps the validity start it holds when an attribute proposal with change hint succession and a different validity start re-affirms it.'
  fails_when: A statement assigns valid_from on the held attribute while a succession proposal with another validity start re-affirms it.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves the confidence, the validity end and the basis of the validity start the link holds
  proves: 'The UNDERDETERMINED entry on changing nothing else about the assertion (link): a re-affirming succession proposal that states another confidence, a validity end and another basis does not overwrite the held link''s confidence, validity end or basis.'
  fails_when: A statement assigns confidence, valid_to or valid_from_source on the held link from the succession proposal's own values while status, validity start and record count stay untouched.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves the confidence, the validity end and the basis of the validity start the attribute holds
  proves: 'The UNDERDETERMINED entry on changing nothing else about the assertion (attribute): a re-affirming succession proposal that states another confidence, a validity end and another basis does not overwrite the held attribute''s confidence, validity end or basis.'
  fails_when: A statement assigns confidence, valid_to or valid_from_source on the held attribute from the succession proposal's own values while status, validity start and record count stay untouched.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: holds one provenance for each fragment it cites and none again for a fragment the link already holds
  proves: 'The UNDERDETERMINED entry on provenance once per fragment (link): a re-affirming succession proposal citing two fragments, one already held, leaves exactly one provenance for each on the held link. This is the boundary of several cited fragments with one already held, which the single-fragment test of criterion 9 does not reach.'
  fails_when: Only the first cited fragment is recorded, the second is never added, or a second provenance (or a unique violation) is produced for the fragment the link already holds.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: holds one provenance for each fragment it cites and none again for a fragment the attribute already holds
  proves: 'The UNDERDETERMINED entry on provenance once per fragment (attribute): a re-affirming succession proposal citing two fragments, one already held, leaves exactly one provenance for each on the held attribute.'
  fails_when: Only the first cited fragment is recorded, the second is never added, or a second provenance (or a unique violation) is produced for the fragment the attribute already holds.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: supersedes the held link, leaves its validity end and records a new link naming it, when its change hint is correction
  proves: 'Criterion 13, quoted: A link proposal with change hint correction and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation, and the UNDERDETERMINED entry on the same-target correction: the held link is superseded with its validity end untouched and a new link is recorded naming it as the one it supersedes.'
  fails_when: A same-target correction is answered as a re-affirmation, a dispute, a new assertion that supersedes nothing or a refusal, or it supersedes the held link by assigning its validity end.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: is answered as a dispute when no cited fragment signals succession
  proves: 'Criterion 14, quoted: A link proposal with change hint none, a target other than the target of the current link of its source and link type that does not allow multiple current links, and no fragment that signals succession is answered as a dispute.'
  fails_when: A different-target proposal with change hint none and no succession signal is answered with any outcome other than disputed (re-affirmation, succession, new assertion).
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: 're-affirms the link of a type allowing one current link: provenance added, no new link, not marked disputed, validity start kept'
  proves: 'The scenario given a link type with one current link, a current link A to B valid from 2024-01-01, a proposal A to B with change hint succession valid from 2024-06-01: the proposal re-affirms the link, its provenance is added, no new link is recorded, the link is not marked disputed and stays valid from 2024-01-01.'
  fails_when: 'Any then-line stops holding: the outcome is not consolidated on the held link, the fragment is not added, a link is inserted, the held link is assigned a status, or its valid_from is assigned.'
  demonstrates: scenarios/knowledge-base/same-target-succession-re-affirms
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  name: 're-affirms the held link: consolidated with its identity, no new link, provenance added to it, when change_hint=''succession'' repeats its target on a multi-current link type'
  proves: 'Criterion 3, quoted: A link proposal with change hint succession whose target is the target of a current link of its source and link type that allows multiple current links is answered as a re-affirmation of that link, and the scenario of that case: the proposal re-affirms the link, its provenance is added to the link, no new link is recorded. Rewritten whole from the test that asserted the old behavior.'
  fails_when: The multi-current succession proposal is answered with any outcome other than consolidated on the held link, inserts a link, or adds its provenance to anything other than the held link.
  demonstrates: scenarios/knowledge-base/same-target-succession-re-affirms-multi-current
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: marks the current link disputed and records the new link from A to C in status disputed, superseding nothing
  proves: 'The scenario given a link type with one current link and a current link A to B, a proposal A to C with change hint none citing no fragment that signals succession: the status update that assigns disputed is addressed to the identity of the held A to B link (the store stand-in now records which row each update addresses), and the one new link recorded runs from A to C, in status disputed, superseding nothing. Also the UNDERDETERMINED entry on the three effects of the dispute (link). Closes the first remainder of the review: the held link''s identity and the new link''s source node.'
  fails_when: The disputed status is written to a row other than the held link or to an identity that does not exist, the held link keeps its status or gets another one, the new link is recorded in another status, from a node other than A or toward a node other than C, or the new link names the held link as superseded.
  demonstrates: scenarios/knowledge-base/different-target-without-signal-is-disputed
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: marks that assertion disputed and records a new assertion in status disputed that supersedes nothing, for a link and for an attribute
  proves: 'The fact of the rule on conflict: a proposal for a type that does not allow multiple current assertions that meets a current assertion as a dispute marks that assertion disputed, the status update being addressed to the held assertion''s own identity (HELD_LINK_ID, HELD_ATTRIBUTE_ID), and records a new assertion in status disputed that supersedes nothing, for both kinds of assertion the rule constrains. Closes the first remainder of the review.'
  fails_when: For a link or an attribute, the disputed status is written to a row other than the one the proposal met or to an identity that does not exist, the current assertion is not marked disputed, the new assertion is recorded in another status, or the new assertion supersedes the current one.
  demonstrates: rules/knowledge-base/conflict-disputes
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity and whatever validity start the proposal states
  proves: 'The fact of the rule on re-affirmation, over every pairing of the hints it names (none, succession), the kinds it constrains (link, attribute), the two multiplicities and three classes of validity start (the held start, another start, none): each is answered consolidated on the held assertion, with its provenance added, no new assertion and no statement assigning any column of it.'
  fails_when: In any pairing, the proposal is not answered consolidated on the held assertion, its provenance is not added, an assertion is inserted, or any column of the held assertion is assigned.
  demonstrates: rules/knowledge-base/reaffirmation-consolidates
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets
  proves: 'The fact of the rule on consolidation precedence, over every pair of adjacent branches whose conditions a single proposal can meet at once, for links and attributes, each row now compared on the outcome, whether the answer carries the held identity, the statuses assigned to the held assertion and the number of assertions recorded: re-affirmation before succession by hint and before succession by signal (change hint none repeating the held target or value and citing a fragment that signals succession is consolidated on the held identity, with no supersession and no new row), re-affirmation before new assertion, correction before succession and before dispute, correction before new assertion on a type allowing multiple current assertions that meets its current assertion (the held assertion is superseded and one assertion is recorded, as the rule on correction states), succession (by signal and by hint) before dispute, dispute before new assertion, and new assertion when nothing is current. Closes the first input of the second remainder of the review and the part of its second input that the rule on correction decides.'
  fails_when: 'A proposal meeting two conditions lands on the later branch: for example a same-target succession, by hint or by a fragment signalling succession on change hint none, is taken as a succession or a dispute or records a new row, a correction carrying a succession signal is taken as a succession, a correction on a type allowing multiple current assertions is taken as a new assertion that leaves the held assertion unsuperseded, or a signal is ignored in favor of a dispute.'
  demonstrates: rules/knowledge-base/consolidation-precedence
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: is the one of its node and type, or the one of its node, type and target or value where the type allows multiple current assertions, and no other
  proves: The fact of the rule on which assertion a proposal meets, over links and attributes, both multiplicities, and the held assertion being the same in target or value, another in target or value, of another node, or of another type or key.
  fails_when: A functional type does not meet the held assertion of its node and type whatever its target or value, a multi-current type meets one of another target or value, or any type meets an assertion of another node or another type or key.
  demonstrates: rules/knowledge-base/proposal-meets-current-assertion
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in every branch of the consolidation order
  proves: 'The fact of the rule on consolidation provenance: every branch a taken proposal can land on, for links and attributes, records one provenance for each cited fragment on the assertion it lands on. Extended with the re-affirmation by succession for both kinds, the landing this task adds.'
  fails_when: Any landing, including a same-target succession that now re-affirms, leaves a cited fragment without a provenance on the assertion the proposal lands on.
  demonstrates: rules/knowledge-base/consolidation-records-provenance
files:
- path: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  effect: The store stand-in keeps, for each insert and update it records, the column values it assigned (bound parameters and literals resolved by column), and now also, for each update, the identity of the row its WHERE id clause addresses (null for an insert), so tests can observe which row a status update was written to. Nothing it answered before changed and the existing tests read only table, kind and values.
- path: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  effect: The test 'does NOT consolidate when change_hint=succession even on a multi-current link' is rewritten whole as the test of criterion 3 and its scenario, because it asserted the behavior the task corrects. A small helper that summarizes a link landing is added; the comment block that described the old behavior goes with the replaced test. Not touched in this re-delivery.
not_applicable:
- edge_case: A proposal citing no fragment, or an empty list of fragments, on a re-affirmation
  why: The rule that a link or attribute cites a fragment is refused at the propose boundary before consolidation, and no criterion or node of this task states what consolidation does with an empty list.
- edge_case: A held assertion that is no longer current (closed validity end or superseded) met by a same-target succession
  why: Currency is decided by the lookup and does not depend on the change hint, so the existing currency test (hint none) holds the boundary the succession proposal shares; no criterion of this task alters it.
- edge_case: A succession proposal with another target or value on a type that allows multiple current assertions, or on one that does not
  why: Those outcomes (new assertion, closing the previous assertion) belong to the neighbor rules new-assertion and succession-closes-previous, which this task does not implement; only their order against re-affirmation is read, by the precedence test.
- edge_case: Confidence thresholds and the below-floor refusal for a re-affirming proposal
  why: Thresholds are decided in the propose services before consolidation; consolidation never reads confidence on the re-affirmation path, and no criterion of this task reaches it.
- edge_case: The store or a dependency failing while the provenance is inserted
  why: No criterion or node of this task states the answer to a failing store on this path.
- edge_case: A dispute proposal on a type allowing multiple current assertions
  why: The rule on conflict constrains only types that do not allow multiple current assertions; for the others the proposal with another target or value meets no current assertion, which the meeting test and the new-assertion row of the precedence test already hold.
untested:
- 'contracts/knowledge-base/ingestion: the contract spans fourteen operations (intake, reads, extraction, retries, one-shot and directed ingestion, the four proposals) and their refusals over REST and MCP; no finite test over the consolidation service decides it whole. This proof exercises only the consolidated-with-identity clause of propose-link and propose-attribute, at consolidation level, and one propose-link envelope for a multi-current link; the clause is not decided through the REST or MCP rendering.'
- 'The second input of the remainder on rules/knowledge-base/consolidation-precedence, for a proposal with change hint correction against a node with nothing current, and against a type allowing multiple current assertions whose held assertion has another target or value: no test is written. The rule on correction (rules/knowledge-base/correction-replaces) states what a correction does only where it meets a current assertion, and says nothing about the outcome where it meets none. Where it does meet one on a type allowing multiple current assertions (the same target or value), the rule decides the outcome and the precedence test holds it. For a correction meeting nothing current, the only node that states an outcome is rules/knowledge-base/new-assertion, which this task does not implement and which records a new assertion that supersedes nothing, the opposite of the remainder''s expectation of a correction outcome rather than accepted as a new assertion; a test for either reading would pin an outcome no node the task implements decides. The code today answers accepted with nothing superseded. Which of the two the specification intends is for the specification to say.'
- 'The clause of the rule on re-affirmation and the neighbor scenarios for change hint none with another validity start (the REMAINDER entry): it reaches no criterion of this task and names no implementation, so no test is owed here; the existing tests of the delivered task reaffirm-other-start-proposal hold it.'
- 'The behavior of a race decided again (the ADVISORY entry): a concurrent proposal that commits first and a second decision that now lands on re-affirmation for a same-target succession. No criterion states it, the stand-in has no concurrency, and the rule belongs to the neighbor task; it is a fact to report, not a test to write.'
- 'The failure as it was found, a dup-guard error against the real schema: the stand-in does not enforce the partial unique index, so the reproduction is held only as its cause (a same-target succession proposal that inserts or disputes instead of re-affirming); no real-schema test is available to this proof.'
- The attribute criteria 2, 4, 6, 8, 10 and 12 have no scenario of their own (the ADVISORY entry); they are held by their criterion tests and by the rule-level re-affirmation test, not by a scenario.
- 'The two behaviors the implementation chose (the negation of correction as the re-affirmation condition, and idempotent provenance resting on the insert''s conflict handling) are not pinned: the first is arrangement and gets no test; the second is exercised only through the observable boundary of one provenance per cited fragment.'
- Whether a row's validity start, status, confidence, validity end and basis are kept is observed through the statements the stand-in records (no statement assigns them), not through a stored row, because the stand-in holds no row state; an implementation that changed them by a statement shape the parser does not read as an assignment would not be seen. Likewise the identity a status update addresses is read from a WHERE id clause bound to a placeholder; an update addressing the row by another clause shape would read as an unresolved identity and fail the dispute tests, never pass them.
divergences:
- from: the framework rule that source carries no comments
  departure: graph-consolidation.spec.ts still holds the comments of its other tests, including a header over the multi-current re-affirmation block that mentions the old condition for change hint none; only the comment block of the rewritten test was removed.
  why: The file is several hundred lines of prose written by earlier deliveries and the task rewrites one test; sweeping the file is not part of this delegation, and the header comment states a historical bug that is still true.
---
## What it is
Tests over consolidateLink and consolidateAttribute, run against the store stand-in, prove that a succession proposal repeating the current target or value is answered consolidated on the held assertion, and prove the neighboring rules the change must not move.
This re-delivery rewrites the record whole and closes the remainders the review left: the dispute tests now read which row the disputed status was written to and the source node of the new link, and the precedence test now takes a same-target proposal with change hint none citing a succession signal, and a correction against a type allowing multiple current assertions, comparing the identity, the statuses and the number of assertions recorded for every row.
Two existing tests that asserted the old behavior were rewritten whole in the earlier delivery and are named under files.

## Notes
The remainders come from the review record siegard-reconcile/succession-reaffirms-same-target.md, which left three: the dispute rule, the precedence rule and the scenario of a different target without a signal.
The second input of the precedence remainder is closed only where the rule on correction decides it; the rest is named under untested with why.
No suite was run by the author of the tests, who has no shell; the run, the implementation pin and the standard pin are the caller's to stamp.
The author recorded no disagreement with the implementation.
This is the proof-only re-delivery of the task, named by the deliver-scope invocation; the implementation record was not touched and its files held current by trace.py --check --all before anything was written.
The first suite run of the task passed; the one under this record is run/succession-reaffirms-same-target-reaffirm-same-target-succession-suite-2, which passed over the tree with the rewritten tests.
