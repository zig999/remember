---
contract_version: siegard-reconcile/8
title: Review again of succession-reaffirms-same-target
summary: The initiative succession-reaffirms-same-target delivered the task reaffirm-same-target-succession,
  which makes a link or attribute proposal with change hint succession and the target or value of a current
  assertion re-affirm it, as its implementation record states.
target: backend
files:
- path: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  change: written by the delivery of task/succession-reaffirms-same-target/reaffirm-same-target-succession
- path: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  change: written by the delivery of task/succession-reaffirms-same-target/reaffirm-same-target-succession
- path: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  change: written by the delivery of task/succession-reaffirms-same-target/reaffirm-same-target-succession
- path: src/modules/ingestion/service/graph-consolidation.service.ts
  change: In consolidateLinkOnce and consolidateAttributeOnce, the re-affirmation branch now fires for
    same target or same value with any change hint other than correction, so none and succession both
    land there; written by the delivery of task/succession-reaffirms-same-target/reaffirm-same-target-succession.
nodes:
- node: contracts/knowledge-base/ingestion
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the two ValidationFailure
    throws on the second dup-guard collision in consolidateLink (lines 300-306) and consolidateAttribute
    (lines 484-490) — throw new ValidationFailure("SYSTEM_INTERNAL_ERROR", "graph consolidation: dup-guard
    constraint hit on retry; a concurrent transaction committed a conflicting row.", { scope: "knowledge_link"
    }) and the same with { scope: "node_attribute" }. The consolidated, accepted, superseded_previous
    and disputed outcomes are returned by consolidateLinkOnce and consolidateAttributeOnce.'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: domain/knowledge-base/change-hint
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the change_hint field of
    ConsolidateLinkArgs (line 49) and ConsolidateAttributeArgs (line 63) — readonly change_hint: "none"
    | "succession" | "correction";'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the valid_from_basis field
    of ConsolidateLinkArgs (line 48) and ConsolidateAttributeArgs (line 62) — readonly valid_from_basis:
    "stated" | "document" | "received" | null;'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/conflict-disputes
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `if (functional)` dispute
    branch in consolidateLinkOnce (lines 393-410) and consolidateAttributeOnce (lines 577-594) — SET status
    = ''disputed''::assertion_status WHERE id = $1 ... insertLinkRow(client, args, runCtx, { status: "disputed",
    supersedes_link_id: null, }) ... outcome: "disputed"'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: rules/knowledge-base/consolidation-precedence
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the order of the branches
    in consolidateLinkOnce (lines 341-418) and consolidateAttributeOnce (lines 525-602): same target or
    value without correction, then correction, then functional succession, then functional dispute, then
    a new row — if (sameTarget && args.change_hint !== "correction") { ... outcome: "consolidated" ...
    } if (args.change_hint === "correction") { ... } if (functional && !sameTarget && (args.change_hint
    === "succession" || hasSuccessionSignal(fragmentTexts))) { ... } if (functional) { ... disputed ...
    } followed by the new-row insert returning outcome: "accepted"'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: rules/knowledge-base/consolidation-records-provenance
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at insertLinkProvenance (lines
    116-128) and insertAttributeProvenance (lines 130-142), called on every taken branch — INSERT INTO
    provenance (link_id, fragment_id) SELECT $1, f FROM unnest($2::uuid[]) AS f ON CONFLICT DO NOTHING'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: rules/knowledge-base/proposal-meets-current-assertion
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the vigent lookup in consolidateLinkOnce
    (lines 323-339) and consolidateAttributeOnce (lines 507-523) — if (functional) { vigent = await lockVigentLinkBySourceAndType(client,
    args.source_node_id, linkTypeInfo.id); } else { vigent = await lockVigentLinkByTriple(client, args.source_node_id,
    linkTypeInfo.id, args.target_node_id); } and the matching lockVigentAttributeByNodeAndKey / lockVigentAttributeByTriple
    branches'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Seed two current assertions under one node and one multi-valued link type or attribute
    key: targets B and C for a link, or values alpha and beta for an attribute. Propose the second target
    or value with change hint none. The expected result is consolidated, carrying the identity of that
    second assertion, with no new assertion recorded. Also seed one current assertion with value alpha
    on a multi-valued key and propose value beta with change hint correction. The expected result is that
    the held alpha assertion is not superseded.'
- node: rules/knowledge-base/reaffirmation-consolidates
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the first branch inside
    `if (vigent !== null)` in consolidateLinkOnce (lines 344-347) and consolidateAttributeOnce (lines
    528-531) — if (sameTarget && args.change_hint !== "correction") { await insertLinkProvenance(client,
    vigent.id, args.fragment_ids); return { outcome: "consolidated", link_id: vigent.id }; } — valid_from
    is not read and the existing row is not updated'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Two assertions over the existing world would close it. First, a current link and a current
    attribute, each of a one-current and a multiple-current type, are met by a same-target or same-value
    proposal with change hint none and then succession, stating a start earlier than the held one. Expected
    for each: outcome consolidated on the held identity, the proposal''s fragment added as provenance,
    no insert and no column assigned on the held row. Second, the same multiple-current subjects are met
    by a same-target or same-value proposal with another confidence, a validity end, the basis "received"
    and the status "uncertain", under each of the two hints. Expected for each: consolidated on the held
    identity, with no column assigned on the held row.'
- node: scenarios/knowledge-base/different-target-without-signal-is-disputed
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `if (functional)` dispute
    branch after the succession branch in consolidateLinkOnce (lines 393-410) — reached only when the
    hint is not correction, the target differs, and neither change_hint === "succession" nor hasSuccessionSignal(fragmentTexts)
    holds; it runs UPDATE knowledge_link SET status = ''disputed''::assertion_status, then insertLinkRow(...
    status: "disputed", supersedes_link_id: null)'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: scenarios/knowledge-base/same-target-succession-re-affirms
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the same-target branch of
    consolidateLinkOnce (lines 342-347), taken before the succession branch — if (sameTarget && args.change_hint
    !== "correction") { await insertLinkProvenance(client, vigent.id, args.fragment_ids); return { outcome:
    "consolidated", link_id: vigent.id }; } — no insert, no status change, and valid_from is left alone'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: scenarios/knowledge-base/same-target-succession-re-affirms-multi-current
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the triple lookup and the
    same-target branch of consolidateLinkOnce (lines 332-347) — vigent = await lockVigentLinkByTriple(client,
    args.source_node_id, linkTypeInfo.id, args.target_node_id); followed by the same-target branch returning
    outcome: "consolidated" with the existing link_id'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation.spec.ts
unstated:
- file: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  where: the CORRECTED expectation (line 889), used by the precedence rows "correction before succession",
    "correction before dispute" and "correction before new assertion on a type allowing multiple current
    assertions"
  evidence: 'const CORRECTED: Taken = { outcome: "accepted", on_held: false, held_statuses: ["superseded"],
    new_assertions: 1, };'
  cost: 'The test fixes which outcome word a correction proposal gets: "accepted", the same word as a
    new assertion, and not "superseded_previous". The ingestion contract lists the outcomes (consolidated;
    accepted; superseded_previous with the superseded identity; disputed). rules/knowledge-base/correction-replaces
    says what a correction does (supersedes the assertion, keeps its validity end, records a new assertion
    naming it) and says nothing about its outcome word. No node says which branch answers with which word.
    The mapping now lives only in this test and in the service, so a reader looking in the specification
    for the outcome of a correction finds nothing.'
restates:
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the comment above the disputed link test (lines 867-868)
  evidence: '// BR-27 step (d): functional vigent row exists; different target; overlapping // period;
    no signal -> mark BOTH disputed.'
  cost: The comment restates the dispute rule and adds an "overlapping period" condition the node does
    not hold. The node only requires a type that does not allow multiple current assertions and a proposal
    that meets the current assertion as a dispute. The assertions at lines 894-901 hold the outcome (old
    row disputed, new row disputed, supersedes nothing). A reader who trusts the comment will believe
    the specification makes overlap a condition of a dispute.
  node: rules/knowledge-base/conflict-disputes
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the comment above the first consolidated test (lines 528-529), the "Bug / Fix" comment block
    (lines 605-620) and the attribute test title at line 1045
  evidence: '// BR-27 step (a): vigent row exists; same target; same valid_from; // change_hint=''none''
    -> no new row, only provenance. ... "Fix: for multi-current types, recognize re-affirmation by `sameTarget
    && change_hint === ''none''` WITHOUT requiring `sameValidFrom`." ... it("consolidated — same (node,
    key, value, valid_from)"'
  cost: The comments and the title say a re-affirmation depends on the same validity start, or only on
    same target with hint none for multi-current types. The node says it holds "whatever validity start
    it states" for hint none or succession. The test code at lines 626-661, 663-693 and 695-724 already
    holds the node's rule, so the prose is a second, narrower statement of it. A reader who finds the
    comment first will take the same-start condition as the rule and look for it in the code instead of
    in the specification.
  node: rules/knowledge-base/reaffirmation-consolidates
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the comment inside the first consolidated test (line 553) and the comment on the multi-current
    test (line 656)
  evidence: // Provenance MUST still be inserted (BR-18) — re-affirmation accumulates. ... // Provenance
    accumulated on the vigent link (BR-18).
  cost: The comments restate that a taken proposal records provenance on the assertion it lands on. The
    assertions at lines 554-555 and 657-658 already hold that, so the sentence has two homes. When the
    node moves, the file stays unbound by the prose and nothing would flag the comment.
  node: rules/knowledge-base/consolidation-records-provenance
unbound:
- src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- src/__tests__/unit/ingestion/graph-consolidation.spec.ts
- src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
pairs_omitted:
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/consolidation-race-decided-again
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/consolidation-race-refuses-second-collision
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/correction-replaces
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/current-assertion
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/link-provenance-once-per-fragment
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/new-assertion
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/provenance-accepts-proposed-fragment
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/succession-before-previous-start
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/succession-closes-previous
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/succession-closing-date
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/succession-signal
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: scenarios/knowledge-base/same-target-other-start-re-affirms
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: scenarios/knowledge-base/same-value-other-start-re-affirms
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/succession-reaffirms-same-target-again.returns/.

  Certified rules/knowledge-base/conflict-disputes as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (marks that assertion disputed and records a new assertion in status disputed that supersedes nothing,
  for a link and for an attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (marks the current link disputed and records the new link from A to C in status disputed, superseding
  nothing); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (takes a proposal as
  the first of re-affirmation, correction, succession, dispute and new assertion whose condition it meets);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (is the one of its node and type,
  or the one of its node, type and target or value where the type allows multiple current assertions,
  and no other); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (is answered as
  a dispute when no cited fragment signals succession) would fail if the fact stopped holding.

  Certified rules/knowledge-base/consolidation-precedence as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion
  whose condition it meets); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (adds
  the provenance of the proposal and changes nothing else about the assertion, for every kind, every multiplicity
  and whatever validity start the proposal states); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (supersedes the held link, leaves its validity end and records a new link naming it, when its change
  hint is correction); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (is answered
  as a dispute when no cited fragment signals succession) would fail if the fact stopped holding.

  Certified rules/knowledge-base/consolidation-records-provenance as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in
  every branch of the consolidation order); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds a second cited fragment once and the already-held one not again when the held link is re-cited);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (adds a second cited fragment
  once and the already-held one not again when the held attribute is re-cited); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (holds one provenance for each fragment it cites and none again for a fragment the link already holds);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (holds one provenance for each
  fragment it cites and none again for a fragment the attribute already holds); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every
  multiplicity and whatever validity start the proposal states) would fail if the fact stopped holding.

  Certification of rules/knowledge-base/proposal-meets-current-assertion did not hold: the auditor answered
  `partial` — The half for types that allow one current assertion is exercised whole. The meetings table
  seeds a held link or attribute that differs from the proposal in its node, its type or key, or its target
  or value. A proposal for another target or value is taken as a dispute on the held assertion. A proposal
  for another node or another type is taken as a new assertion. So leaving node or type out of the matching
  key, or adding target or value to it, would fail the table.

  The half for types that allow multiple current assertions is exercised only against a world that holds
  one current assertion, and only with change hint none. Its fact is that target or value is part of what
  is matched. If the code matched on node and type alone, the hint-none proposals in the table would land
  the same way: same value consolidates, and another value is a new assertion because no dispute applies
  to such a type. Two kinds of input would tell the two apart, and nothing in the file uses either: (1)
  a world that holds two current assertions under one node and one multi-valued type, with a proposal
  that repeats the second; (2) a correction or succession that names another target or value on a multi-valued
  type. The correction precedence row uses the same value only, and the succession rows cover one-current
  types only. So on a multi-valued type, the claim that a proposal meets the assertion with its own target
  or value, and not some other current one, goes unexercised.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: Seed
  two current assertions under one node and one multi-valued link type or attribute key: targets B and
  C for a link, or values alpha and beta for an attribute. Propose the second target or value with change
  hint none. The expected result is consolidated, carrying the identity of that second assertion, with
  no new assertion recorded. Also seed one current assertion with value alpha on a multi-valued key and
  propose value beta with change hint correction. The expected result is that the held alpha assertion
  is not superseded..

  Certification of rules/knowledge-base/reaffirmation-consolidates did not hold: the auditor answered
  `partial` — The set exercises re-affirmation with change hint none and with change hint succession,
  for links and attributes, for types allowing one and allowing several current assertions. It checks
  the consolidated outcome on the held assertion, the added provenance, that no new assertion is recorded
  and that the held row is left unwritten. It also checks that only a current assertion is met and that
  correction falls outside the rule. Two stated parts go unexercised. (1) "Whatever validity start it
  states": every stated start in the set is the held start, no start, or a start later than the held one
  (2024-06-01 and 2030-06-01 against 2024-01-01; 2026-03-01 and 2030-06-01 against 2026-01-01). Nothing
  proposes a start earlier than the held start. Code that backdated the held assertion, or left re-affirmation,
  when the stated start precedes the held one would pass every test. (2) "Changing nothing else about
  the assertion" when the proposal states other fields: a proposal with another confidence, a validity
  end, the basis "received" and the status "uncertain" is checked for an unwritten row only on the one-current
  link type (leads) and the one-current attribute key (deadline). The cross-product test, which spans
  both multiplicities, sends only validity end null, basis "stated" and status "active". The one multiple-current
  test that sends the other fields ("answers a same-value proposal with another start as consolidated
  on an attribute key that allows multiple current values") checks only the outcome and identity, not
  that the row stays unwritten. No multiple-current link is sent those fields at all. So code that wrote
  a stated validity end, confidence or basis onto a multiple-current assertion it re-affirms would pass.
  This reading uses the test file alone. The behaviour of the world helper (reaffirm-consolidation-world.js)
  is taken as its call sites show it, since the pack does not offer that file as proof.. The node is decided
  by reading, and a certification standing on it from an earlier reconciliation is released by the bind.
  The remainder is testable: Two assertions over the existing world would close it. First, a current link
  and a current attribute, each of a one-current and a multiple-current type, are met by a same-target
  or same-value proposal with change hint none and then succession, stating a start earlier than the held
  one. Expected for each: outcome consolidated on the held identity, the proposal''s fragment added as
  provenance, no insert and no column assigned on the held row. Second, the same multiple-current subjects
  are met by a same-target or same-value proposal with another confidence, a validity end, the basis "received"
  and the status "uncertain", under each of the two hints. Expected for each: consolidated on the held
  identity, with no column assigned on the held row..

  Certified scenarios/knowledge-base/different-target-without-signal-is-disputed as decided by step `test`:
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (marks the current link disputed
  and records the new link from A to C in status disputed, superseding nothing); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (marks that assertion disputed and records a new assertion in status disputed that supersedes nothing,
  for a link and for an attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (is answered as a dispute when no cited fragment signals succession); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion
  whose condition it meets) would fail if the fact stopped holding.

  Certified scenarios/knowledge-base/same-target-succession-re-affirms as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms the link of a type allowing one current link: provenance added, no new link, not marked
  disputed, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a proposal with change hint succession and the held target as consolidated, carrying the identity
  of the held link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (records no
  new link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (leaves that link
  in the status it holds); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (adds
  its provenance to that link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the validity start the link holds when the proposal states another); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion
  whose condition it meets) would fail if the fact stopped holding.

  Certified scenarios/knowledge-base/same-target-succession-re-affirms-multi-current as decided by step
  `test`: src/__tests__/unit/ingestion/graph-consolidation.spec.ts (re-affirms the held link: consolidated
  with its identity, no new link, provenance added to it, when change_hint=''succession'' repeats its
  target on a multi-current link type) would fail if the fact stopped holding.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) rules/knowledge-base/reaffirmation-consolidates, rules/knowledge-base/consolidation-precedence,
  rules/knowledge-base/proposal-meets-current-assertion, rules/knowledge-base/consolidation-records-provenance,
  rules/knowledge-base/conflict-disputes, contracts/knowledge-base/ingestion, scenarios/knowledge-base/same-target-succession-re-affirms,
  scenarios/knowledge-base/same-target-succession-re-affirms-multi-current, scenarios/knowledge-base/different-target-without-signal-is-disputed
  were read on every file and answered for, and bound from nowhere here — a binding this record writes
  is one the trace already held.

  A finding in src/modules/ingestion/service/graph-consolidation.service.ts names rules/knowledge-base/succession-signal,
  which no file of this set is bound to: the SUCCESSION_MARKERS declaration (lines 11-21) and hasSuccessionSignal
  (lines 23-33), which consolidateLinkOnce and consolidateAttributeOnce call: const SUCCESSION_MARKERS
  = [ "deixou de", "passou a", "novo", "nova", "substituiu", "substituido", "substituido por", "succeeded",
  "replaced", ] as const; ... if (lower.includes(m)) return true; — The specification already holds this
  vocabulary in rules/knowledge-base/succession-signal: "An information fragment signals succession when
  its text contains, in any letter case, deixou de, passou a, novo, nova, substituiu, substituido, substituido
  por, succeeded or replaced." The word list is declared here as well, in a file that node is not in the
  delegated set for. The marker list is also exported through `__testing__`, so a test can pin the code''s
  copy. If the node''s list changes, `--check` never reaches this file and the code keeps deciding succession
  from the old words. Nobody can tell which list the business decided. The lists agree today, word for
  word.. It blocks nothing here; it is owed a route of its own.

  Candidates: 1 opened across 1 of 4 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 3 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/succession-reaffirms-same-target-again.returns/`, which are the evidence behind every entry above.
