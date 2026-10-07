---
target: backend
implementation: sha256:d1bec28bfbcb813f338aead7d33498841a029003bb918ec0539cce5389f719fd
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/reaffirm-with-other-start-reaffirm-other-start-proposal-suite
title: Proof of re-affirmation with another validity start in the graph consolidation
summary: Behavioral tests over consolidateLink and consolidateAttribute, run against a fake store that evaluates the lock query's equality and IS NULL conditions and enforces the provenance unique indexes. They prove the re-affirmation criteria, the four underdetermined entries, two scenarios, the provenance rule across every branch, and the current-assertion rule.
tests:
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: answers a same-target proposal with change hint none and another start as consolidated on the held link
  proves: 'Criterion 1: a link proposal with change hint none whose target is the target of the current link of a type that does not allow multiple current links, and that states a different validity start, is answered as a re-affirmation of that link. The proposal also differs from the held link in basis, confidence, status and validity end, so the outcome does not depend on those matching.'
  fails_when: The outcome is anything but consolidated, or the answered link is not the held one. This happens if the link branch compares validity starts again, or lands the proposal on a new row.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: records no new link when the proposal re-affirms the held link with another start
  proves: 'Criterion 3: a link proposal that re-affirms the current link with a different validity start records no new link.'
  fails_when: An INSERT into knowledge_link is issued during a re-affirmation with another start.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: adds the provenance of the proposal to the held link
  proves: 'Criterion 5: a link proposal that re-affirms the current link with a different validity start adds its provenance to that link.'
  fails_when: The cited fragment is not recorded as provenance on the held link, or is recorded on another row.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves the held link row unwritten, so its validity start, basis, confidence, status and end stay
  proves: 'Criterion 7: the current link keeps the validity start it holds when a link proposal with a different validity start re-affirms it. Also entry 3: the basis, confidence, status and validity end of the held link are not overwritten from the proposal. The proposal carries a different basis, confidence, status and end for exactly this reason. One shared test is kept because the cause is the same absence of any write and the store boundary cannot tell the columns apart.'
  fails_when: Any UPDATE on knowledge_link is issued during the re-affirmation, for example rewriting valid_from, valid_from_source, confidence or status, or closing the row.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: does not answer a proposal with change hint succession and the held target as a re-affirmation
  proves: 'Criterion 9: a link proposal with change hint succession and the target of the current link of a type that does not allow multiple current links is not answered as a re-affirmation. Only the negative is asserted; what such a proposal becomes belongs to the dispute and succession rules this task does not implement.'
  fails_when: The link branch re-affirms on the same target whatever the change hint, so the outcome is consolidated.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: does not answer a proposal with change hint correction and the held target as a re-affirmation
  proves: 'Entry 2, link side: a link proposal with change hint correction and the same target is not a re-affirmation, because the consolidation order puts correction after re-affirmation and the hint none is the re-affirmation condition.'
  fails_when: The link branch re-affirms any same-target proposal whatever its change hint, so the outcome is consolidated.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: adds a second cited fragment once and the already-held one not again when the held link is re-cited
  proves: 'Entry 4, second clause: a re-affirming proposal that cites a fragment the link already holds adds no second provenance for it, and still adds the new one. The fake store refuses a duplicate (link, fragment) insert that carries no conflict clause, as the unique index of the migration does.'
  fails_when: The held link ends with the already-held fragment twice, or the cited-but-new fragment is missing. The call also fails if the re-affirmation inserts provenance in a way the unique index refuses.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: answers a same-value proposal with change hint none and another start as consolidated on the held attribute
  proves: 'Criterion 2: an attribute proposal with change hint none whose value is the value of the current attribute of a key that does not allow multiple current values, and that states a different validity start, is answered as a re-affirmation of that attribute.'
  fails_when: The outcome is anything but consolidated, or the answered attribute is not the held one. This happens if the attribute branch compares validity starts again.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: records no new attribute when the proposal re-affirms the held attribute with another start
  proves: 'Criterion 4: an attribute proposal that re-affirms the current attribute with a different validity start records no new attribute.'
  fails_when: An INSERT into node_attribute is issued during a re-affirmation with another start.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: adds the provenance of the proposal to the held attribute
  proves: 'Criterion 6: an attribute proposal that re-affirms the current attribute with a different validity start adds its provenance to that attribute.'
  fails_when: The cited fragment is not recorded as provenance on the held attribute.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: leaves the held attribute row unwritten, so its validity start, basis, confidence, status and end stay
  proves: 'Criterion 8: the current attribute keeps the validity start it holds when an attribute proposal with a different validity start re-affirms it. Also entry 3 on the attribute side: basis, confidence, status and validity end are not overwritten.'
  fails_when: Any UPDATE on node_attribute is issued during the re-affirmation.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: answers a same-value proposal with another start as consolidated on an attribute key that allows multiple current values
  proves: 'Entry 1: the multi-valued attribute case met by value is re-affirmed whatever the proposal''s validity start, not only for keys that do not allow multiple current values.'
  fails_when: A key that allows multiple current values still requires the same validity start, so the proposal lands as a new attribute with outcome accepted instead of consolidated on the held one.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: does not answer a proposal with change hint none and another value as a re-affirmation
  proves: 'Criterion 10: an attribute proposal with change hint none and a value other than the current value of a key that does not allow multiple current values is not answered as a re-affirmation.'
  fails_when: The attribute branch drops the value condition and consolidates a different-value proposal onto the held attribute.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: does not answer a proposal with change hint succession and the held value as a re-affirmation
  proves: 'Entry 2, attribute side: an attribute proposal with the same value and change hint succession is not a re-affirmation.'
  fails_when: The attribute branch re-affirms any same-value proposal whatever its change hint, so the outcome is consolidated.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: does not answer a proposal with change hint correction and the held value as a re-affirmation
  proves: 'Entry 2, attribute side: an attribute proposal with the same value and change hint correction is not a re-affirmation.'
  fails_when: The attribute branch re-affirms any same-value proposal whatever its change hint, so the outcome is consolidated.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: adds a second cited fragment once and the already-held one not again when the held attribute is re-cited
  proves: 'Entry 4, second clause, attribute side: a re-affirming proposal that cites a fragment the attribute already holds adds no second provenance for it, and still adds the new one.'
  fails_when: The held attribute ends with the already-held fragment twice, the cited-but-new fragment is missing, or the insert is refused by the unique index.
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: 're-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance added, no new link, validity start kept'
  proves: 'The scenario same-target-other-start-re-affirms with its own data: the proposal re-affirms the link, its provenance is added, no new link is recorded, and the link stays valid from 2024-01-01 (no write reaches the held row). The scenario is a single input against four expected effects, so all four are asserted in this one test.'
  fails_when: The outcome is not consolidated on the held link, or provenance is missing from it, or any INSERT or UPDATE reaches knowledge_link.
  demonstrates: scenarios/knowledge-base/same-target-other-start-re-affirms
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: 're-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance added, no new attribute, validity start kept'
  proves: 'The scenario same-value-other-start-re-affirms with its own data: the proposal re-affirms the attribute, its provenance is added, no new attribute is recorded, and the attribute stays valid from 2026-01-01.'
  fails_when: The outcome is not consolidated on the held attribute, or provenance is missing from it, or any INSERT or UPDATE reaches node_attribute.
  demonstrates: scenarios/knowledge-base/same-value-other-start-re-affirms
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in every branch of the consolidation order
  proves: 'The rule consolidation-records-provenance over its finite set: link and attribute, each landing as a new assertion, a re-affirmation, a correction, a succession and a dispute, each citing two fragments. The assertion the answer names holds exactly those two fragments once each. Also entry 4, first clause: a re-affirmation citing several fragments adds one provenance per fragment, not one for the first.'
  fails_when: In any of the ten cases the landed assertion lacks a cited fragment or holds one twice. For example a re-affirmation records only the first fragment, or a branch records provenance on the superseded row instead of the successor.
  demonstrates: rules/knowledge-base/consolidation-records-provenance
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  name: meets a held link or attribute as current only while it has neither a validity end nor a supersession time
  proves: 'The rule current-assertion over its full truth table, for links and for attributes: a held row with no validity end and no supersession time is re-affirmed, and a row with a validity end, a supersession time, or both is not met and the proposal lands as a new assertion.'
  fails_when: A held row is treated as current when it has a validity end or a supersession time. Equally, a row with neither is treated as not current.
  demonstrates: rules/knowledge-base/current-assertion
files:
- path: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  effect: 'Shared fake store for the new spec. It stands in for the pg client at the store boundary only. A FOR UPDATE select returns the held rows that satisfy the query''s equality and IS NULL conditions. Writes to knowledge_link and node_attribute are recorded by table and kind. Provenance inserts enforce one row per (target, fragment): a duplicate without a conflict clause raises the 23505 unique violation, and one with it is skipped. Any statement it does not know throws.'
- path: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  effect: 'Adjusted existing test, not weakened. The test ''functional link with different valid_from does NOT auto-consolidate (still requires sameValidFrom)'' asserted the old behavior this task corrects: a same-target, change-hint-none link proposal with another start on a type that does not allow multiple current links was a dispute with a new row inserted. It is rewritten to assert the corrected behavior: outcome consolidated on the held link and no new row. Its title changed to match. The two comment passages stating that functional types still require the same validity start were removed, because they describe the old behavior. No other test in the file changed.'
not_applicable:
- edge_case: A proposal citing no fragment
  why: Refused at the validation boundary by rules/knowledge-base/link-or-attribute-cites-a-fragment before consolidation. No criterion of this task reaches it.
- edge_case: A proposal below the confidence floor
  why: Answered rejected by the propose services before consolidation (the task's ADVISORY entry). The consolidation functions are never reached.
- edge_case: A proposal that omits the change hint
  why: Carries none by omitted-change-hint-is-none, a neighbor the task names and does not implement. The consolidation functions receive a resolved hint.
- edge_case: A proposal that omits the validity start
  why: The rule and the criteria speak of a proposal that states a start. How an absent start is resolved is the temporal layer's, not the consolidation's.
- edge_case: A proposal with the same validity start as the held assertion
  why: It was a re-affirmation before this task and the existing tests of graph-consolidation.spec.ts still cover it. It is the same class as another start, since the obligation treats every start alike.
- edge_case: A link type that allows multiple current links, re-affirmed with another start
  why: Already delivered behavior covered by the existing test 'consolidates a multi-current link when second document has a different valid_from', which this task neither changes nor adjusts.
- edge_case: Two concurrent proposals against one subject, and a store error during consolidation
  why: The dup-guard retry and its refusal are delivered behavior this task leaves as it stands (consolidation-race-refuses-second-collision belongs elsewhere). No criterion or node implemented here states a different answer.
- edge_case: No held assertion (empty scope)
  why: Not a re-affirmation case. The new-assertion branch is the neighbor's. It appears only as one landing case of the provenance test.
untested:
- 'rules/knowledge-base/reaffirmation-consolidates: its statement is universal over validity starts (''whatever validity start it states''), which no finite test enumerates. The criteria tests and the two scenarios prove one representative of that class for links, for attributes and for multi-valued attribute keys. A test claiming the node whole would assert part of it as the whole (SPEC-004 R12).'
- 'rules/knowledge-base/proposal-meets-current-assertion: the meeting is internal to the lock queries and is observable only through the outcome that follows it. For a different target or value that outcome is the dispute, succession and correction behavior of neighbor rules the task leaves standing. The criteria tests exercise the meeting by source and type (non-multi types) and by node, key and value (multi-valued key), and the existing multi-valued link test exercises it by triple, but no test decides the node''s statement whole.'
- 'rules/knowledge-base/consolidation-precedence: the full order includes correction, succession, dispute and new assertion, whose outcomes are other tasks'' (the task''s REMAINDER entry). The proof asserts only that a proposal with a hint other than none, or with another value, is not taken as a re-affirmation, which is the part of the order this task reaches. The whole order is not decided by any test written here.'
- 'rules/knowledge-base/link-provenance-once-per-fragment and rules/knowledge-base/attribute-provenance-once-per-fragment: these invariants hold over every link and attribute and are enforced by the unique indexes provenance_link_fragment_uq and provenance_attr_fragment_uq in migrations/0001_init.sql. The unit tests prove only that a re-affirmation re-citing a held fragment yields one provenance per fragment against a fake store that models those indexes. Nothing here runs against a real database, so the indexes themselves are not exercised.'
- 'domain/knowledge-base/change-hint: an enumeration of three values. The task''s tests exercise the effect of each value at consolidation (none re-affirms, succession and correction do not), but the set of accepted values is enforced at the DTO boundary, outside the files this task ships, so no test here decides the node whole.'
- 'domain/knowledge-base/proposal, domain/knowledge-base/knowledge-link, domain/knowledge-base/node-attribute, domain/knowledge-base/provenance: shape definitions (attributes and relationships) the implementation read without altering. No finite test over this task''s behavior decides their facts, and a column-by-column claim would pin the row shape.'
- 'contracts/knowledge-base/ingestion: a contract spanning fourteen operations and their refusals. Only the consolidated outcome of propose-link and propose-attribute is reached here, and the proposal service answering it is not exercised by the new tests, which drive the consolidation functions directly. A test of that slice would assert part of the contract as the whole.'
- The held row's columns are not read back. 'Keeps the validity start, basis, confidence, status and end' is proven by the absence of any UPDATE or INSERT reaching the row, since the fake store records writes and does not apply them. A write that rewrites a column to its own value would pass.
- The task's two other REMAINDER entries and its ADVISORY entries (confidence floor, the scenario same-target-succession-is-disputed, omitted change hint) are not UNDERDETERMINED entries and name no obligation of this task, so they carry no test. The dispute, succession, correction and new-assertion outcomes themselves stay with the tasks that implement those rules.
divergences:
- cites: TYP-02
  file: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  departure: The fake client is built as an object literal and asserted to PoolClient once, with `as unknown as PoolClient`, with no guard that narrows it.
  why: PoolClient cannot be satisfied by a stand-in that implements only query and release, and narrowing it at runtime has no meaning. The existing consolidation spec makes the same assertion for the same reason.
---

## What it is
Tests over consolidateLink and consolidateAttribute, run against a fake store, prove the re-affirmation criteria, the four underdetermined entries, the two scenarios, the provenance rule and the current-assertion rule.
One existing test that asserted the behavior this task corrects was rewritten whole and is named under files.

## Notes
No earlier suite run failed before this one passed.
The test author recorded no disagreement with the implementation.
The test author reported a stray file /tmp/proof-return-unused.txt created by mistake outside the target tree; it is not part of the delivery and it was moved out of the divergences, which hold departures only.
