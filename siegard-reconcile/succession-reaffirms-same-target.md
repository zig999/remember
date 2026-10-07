---
contract_version: siegard-reconcile/8
title: Review of succession-reaffirms-same-target
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
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the throw at the second
    dup-guard collision in consolidateLink (line 301) and in consolidateAttribute (line 485). These are
    the only parts of this contract the file carries. — throw new ValidationFailure("SYSTEM_INTERNAL_ERROR",
    "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting
    row.", { scope: "knowledge_link" }). The attribute twin carries { scope: "node_attribute" }. The code,
    message and scope match the contract''s two race refusals. The consolidated and superseded_previous
    outcomes the proposals report come from the returns of consolidateLinkOnce and consolidateAttributeOnce.'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: domain/knowledge-base/change-hint
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the change_hint field of
    ConsolidateLinkArgs (line 49) and of ConsolidateAttributeArgs (line 63) — readonly change_hint: "none"
    | "succession" | "correction";'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the valid_from_basis field
    of ConsolidateLinkArgs (line 48) and of ConsolidateAttributeArgs (line 62) — readonly valid_from_basis:
    "stated" | "document" | "received" | null;'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at insertAttributeProvenance
    (lines 130-142) — INSERT INTO provenance (attribute_id, fragment_id) SELECT $1, f FROM unnest($2::uuid[])
    AS f ON CONFLICT DO NOTHING'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/conflict-disputes
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `if (functional)` dispute
    branch of consolidateLinkOnce (lines 393-410) and of consolidateAttributeOnce (lines 577-594) — SET
    status = ''disputed''::assertion_status WHERE id = $1, followed by insertLinkRow(client, args, runCtx,
    { status: "disputed", supersedes_link_id: null })'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input: a held current link of a type allowing one current link and, separately,
    a held current attribute of such a key, each met by a proposal with change hint none, no fragment
    signalling succession, and another target or value. Expected result: the status-disputed update is
    addressed to the held assertion''s own identity (HELD_LINK_ID or HELD_ATTRIBUTE_ID), or reading that
    held row back shows it in status disputed. This goes alongside the existing checks on the newly recorded
    assertion.'
- node: rules/knowledge-base/consolidation-precedence
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the order of branches inside
    `if (vigent !== null)` in consolidateLinkOnce (lines 341-411) and consolidateAttributeOnce (lines
    525-595). The order is re-affirmation, correction, succession, dispute, then new assertion after the
    block. — `if (sameTarget && args.change_hint !== "correction")` comes first, then `if (args.change_hint
    === "correction")`, then `if (functional && !sameTarget && (args.change_hint === "succession" || hasSuccessionSignal(fragmentTexts)))`,
    then `if (functional)`, then the final insertLinkRow with supersedes_link_id: null'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Two inputs, each against one expected result. First: a held current assertion of a type
    that allows one current assertion, and a proposal with change hint "none" that repeats its target
    or value and cites a fragment whose text signals succession. Expected: consolidated on the held assertion''s
    identity, with no supersession and no new row. Second: a proposal with change hint "correction" against
    a type that allows several current assertions, and again against a node with nothing current. Expected:
    the correction outcome rather than "accepted" as a new assertion. The second expectation depends on
    what correction''s condition is, and that is stated outside this node.'
- node: rules/knowledge-base/consolidation-race-decided-again
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the attempt loop with savepoints
    in consolidateLink (lines 279-308) and consolidateAttribute (lines 463-492) — for (let attempt = 1;
    attempt <= 2; attempt += 1) { ... await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`); ... }
    where the catch rethrows only when !isDupGuardViolation(err, "knowledge_link_current_dup_guard").
    Any other outcome of the first attempt rolls back and decides again, once.'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/consolidation-race-refuses-second-collision
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `if (attempt === 2)`
    throw in consolidateLink (line 300) and consolidateAttribute (line 484) — if (attempt === 2) { throw
    new ValidationFailure("SYSTEM_INTERNAL_ERROR", "graph consolidation: dup-guard constraint hit on retry;
    ...'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/consolidation-records-provenance
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at insertLinkProvenance (lines
    116-128) and insertAttributeProvenance (lines 130-142). Each outcome branch calls one of them with
    args.fragment_ids on the assertion it lands on. — INSERT INTO provenance (link_id, fragment_id) SELECT
    $1, f FROM unnest($2::uuid[]) AS f ON CONFLICT DO NOTHING'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: rules/knowledge-base/correction-replaces
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `args.change_hint ===
    "correction"` branch in consolidateLinkOnce (lines 349-367) and consolidateAttributeOnce (lines 533-551)
    — SET superseded_at = now(), status = ''superseded''::assertion_status WHERE id = $1 (valid_to is
    not touched), then insertLinkRow(..., { status: args.status_for_new_row, supersedes_link_id: vigent.id
    })'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/current-assertion
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the WHERE clauses of the
    four lockVigent* queries (lines 184-270) — AND valid_to IS NULL AND superseded_at IS NULL FOR UPDATE'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/link-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at insertLinkProvenance (lines
    116-128) — INSERT INTO provenance (link_id, fragment_id) SELECT $1, f FROM unnest($2::uuid[]) AS f
    ON CONFLICT DO NOTHING'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/new-assertion
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the tail of consolidateLinkOnce
    (lines 413-418) and of consolidateAttributeOnce (lines 597-602) — const newRow = await insertLinkRow(client,
    args, runCtx, { status: args.status_for_new_row, supersedes_link_id: null }); ... return { outcome:
    "accepted", link_id: newRow.id };'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/proposal-meets-current-assertion
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `functional` selection
    of the vigent row in consolidateLinkOnce (lines 323-339) and consolidateAttributeOnce (lines 507-523)
    — if (functional) { vigent = await lockVigentLinkBySourceAndType(client, args.source_node_id, linkTypeInfo.id);
    } else { vigent = await lockVigentLinkByTriple(client, args.source_node_id, linkTypeInfo.id, args.target_node_id);
    }'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: rules/knowledge-base/provenance-accepts-proposed-fragment
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at promoteFragmentsToAccepted
    (lines 144-156) — UPDATE information_fragment SET status = ''accepted'' WHERE id = ANY($1::uuid[])
    AND status = ''proposed'''
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/reaffirmation-consolidates
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the first branch inside
    `if (vigent !== null)` in consolidateLinkOnce (lines 344-347) and consolidateAttributeOnce (lines
    528-531) — if (sameTarget && args.change_hint !== "correction") { await insertLinkProvenance(client,
    vigent.id, args.fragment_ids); return { outcome: "consolidated", link_id: vigent.id }; }. No valid_from
    comparison is made and nothing on the assertion is changed.'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: rules/knowledge-base/succession-before-previous-start
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the CASE expressions of
    closeVigentForSuccession (lines 167-181) — valid_to = CASE WHEN valid_from IS NOT NULL AND valid_from
    >= ${closeExpr} THEN valid_to ELSE ${closeExpr} END, superseded_at = CASE WHEN valid_from IS NOT NULL
    AND valid_from >= ${closeExpr} THEN now() ELSE superseded_at END'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/succession-closes-previous
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the succession branch in
    consolidateLinkOnce (lines 369-391) and consolidateAttributeOnce (lines 553-575) — functional && !sameTarget
    && (args.change_hint === "succession" || hasSuccessionSignal(fragmentTexts)), then closeVigentForSuccession(...)
    and insertLinkRow(..., { supersedes_link_id: vigent.id })'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/succession-closing-date
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at closeVigentForSuccession
    (lines 158-182), called with args.valid_from — const closeExpr = closeDate !== null ? "$2::date" :
    "now()::date";'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/succession-signal
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at SUCCESSION_MARKERS (lines
    11-21) and hasSuccessionSignal (lines 23-33) — "deixou de", "passou a", "novo", "nova", "substituiu",
    "substituido", "substituido por", "succeeded", "replaced" tested with f.toLowerCase() and lower.includes(m)'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: scenarios/knowledge-base/different-target-without-signal-is-disputed
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the dispute branch of consolidateLinkOnce
    (lines 393-410), reached when a functional type meets a different target with hint none and no succession
    signal — SET status = ''disputed''::assertion_status WHERE id = $1, then insertLinkRow(..., { status:
    "disputed", supersedes_link_id: null })'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Hold a current A-to-B link of a type that allows one current link. Submit an A-to-C proposal
    with change hint none and only neutral fragment texts. The expected result has two parts. The status
    update that assigns disputed names the held link's id. The one recorded new row has source_node_id
    A and target_node_id C.
- node: scenarios/knowledge-base/same-target-other-start-re-affirms
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the re-affirmation branch
    of consolidateLinkOnce (lines 344-347). The proposal''s valid_from is never read there. — if (sameTarget
    && args.change_hint !== "correction") { await insertLinkProvenance(client, vigent.id, args.fragment_ids);
    return { outcome: "consolidated", link_id: vigent.id }; }'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: scenarios/knowledge-base/same-target-succession-re-affirms
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the re-affirmation branch
    of consolidateLinkOnce (lines 344-347). It precedes the succession and dispute branches, so the link
    is neither marked disputed nor given a new row. — if (sameTarget && args.change_hint !== "correction")
    { ... return { outcome: "consolidated", link_id: vigent.id }; }'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: scenarios/knowledge-base/same-target-succession-re-affirms-multi-current
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at lockVigentLinkByTriple selection
    (lines 332-339) followed by the re-affirmation branch (lines 344-347) — vigent = await lockVigentLinkByTriple(client,
    args.source_node_id, linkTypeInfo.id, args.target_node_id); ... if (sameTarget && args.change_hint
    !== "correction") { ... return { outcome: "consolidated", link_id: vigent.id }; }'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation.spec.ts
- node: scenarios/knowledge-base/same-value-other-start-re-affirms
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the re-affirmation branch
    of consolidateAttributeOnce (lines 528-531). The proposal''s valid_from is never read there. — if
    (sameValue && args.change_hint !== "correction") { await insertAttributeProvenance(client, vigent.id,
    args.fragment_ids); return { outcome: "consolidated", attribute_id: vigent.id }; }'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
unstated:
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: the test "closes vigent and inserts a new chained row when functional + different target + textual
    succession signal", lines 766-771
  evidence: expect(state.updates[0]!.sql).toContain("ELSE superseded_at"); with the preceding comment
    "succession closes the VALIDITY axis only — the close must guard superseded_at conditionally (intra-day
    fallback), never set it unconditionally."
  cost: A succession that closes an assertion at the new start leaves its supersession time empty. The
    test pins that, and the only place it is stated is this assertion. The nearest nodes say that a succession
    "closes that assertion as superseded", that a correction "supersedes it, leaving its validity end
    as it was", and that as-of reads show only assertions "without a supersession time". None of them
    says whether an ordinary succession stamps a supersession time. The next reader will look in the specification,
    find no answer, and may take the stamp to belong to every supersession.
unbound:
- src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- src/__tests__/unit/ingestion/graph-consolidation.spec.ts
- src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/succession-reaffirms-same-target.returns/.

  Certification of rules/knowledge-base/conflict-disputes did not hold: the auditor answered `partial`
  — The tests cover a dispute on a link of a type allowing one current link and on an attribute of a key
  allowing one current value. For each they check three things: the new assertion is recorded in status
  disputed, it supersedes nothing (the only recorded row has a null supersedes column), and some update
  on the same table sets status disputed. The precedence and meeting tests also show that a type allowing
  multiple current assertions does not become a dispute. One part goes unexercised: "marks that assertion
  disputed", meaning the assertion that was met. `assignedStatuses` collects the status from every update
  written to the table and never checks which row an update addresses. An implementation that wrote its
  disputed status to some row other than the held one would pass every named test, and so would one that
  wrote it to an identity that does not exist. In that case the assertion that was met stays active, so
  the fact has stopped holding, but nothing fails. As the pack directs, I did not open the world fixture,
  so this reading comes from the spec file alone.. The node is decided by reading, and a certification
  standing on it from an earlier reconciliation is released by the bind. The remainder is testable: One
  input: a held current link of a type allowing one current link and, separately, a held current attribute
  of such a key, each met by a proposal with change hint none, no fragment signalling succession, and
  another target or value. Expected result: the status-disputed update is addressed to the held assertion''s
  own identity (HELD_LINK_ID or HELD_ATTRIBUTE_ID), or reading that held row back shows it in status disputed.
  This goes alongside the existing checks on the newly recorded assertion..

  Certification of rules/knowledge-base/consolidation-precedence did not hold: the auditor answered `partial`
  — The PRECEDENCE table checks each proposal against the outcome it lands on and the status written to
  the held row, for links and attributes. It covers these pairs: re-affirmation wins over succession,
  but only when the succession comes from the change hint "succession" with neutral fragment texts. Re-affirmation
  wins over a new assertion on types that allow several current assertions. Correction wins over succession
  and over dispute. Succession wins over dispute, whether it comes from the signal or from the hint. Dispute
  wins over a new assertion. A new assertion is taken when nothing is current. Two parts of the order
  go untested. First, nothing in the set proposes the held target or value with change hint "none" while
  citing a fragment whose text signals succession (SUCCESSION_TEXTS is only paired with a different target
  or value). So re-affirmation winning over succession by signal is never tested. Second, correction is
  only tested against a held assertion of a type that allows one current assertion. Nothing tests correction
  against a type that allows several current assertions, or against a node with nothing current, so correction
  winning over new assertion is never tested. Separately, the proof treats a correction-hinted proposal
  that repeats the held target or value as a correction, not a re-affirmation (the two "does not answer
  ... correction ... as a re-affirmation" tests and the correction supersession test). That fits this
  node''s order only if the re-affirmation condition leaves out the change hint "correction". This node
  does not state the conditions, and the pack does not hold them. That reading is the test''s, not this
  node''s, and is not settled here.. The node is decided by reading, and a certification standing on it
  from an earlier reconciliation is released by the bind. The remainder is testable: Two inputs, each
  against one expected result. First: a held current assertion of a type that allows one current assertion,
  and a proposal with change hint "none" that repeats its target or value and cites a fragment whose text
  signals succession. Expected: consolidated on the held assertion''s identity, with no supersession and
  no new row. Second: a proposal with change hint "correction" against a type that allows several current
  assertions, and again against a node with nothing current. Expected: the correction outcome rather than
  "accepted" as a new assertion. The second expectation depends on what correction''s condition is, and
  that is stated outside this node..

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

  Certified rules/knowledge-base/proposal-meets-current-assertion as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (is the one of its node and type, or the one of its node, type and target or value where the type allows
  multiple current assertions, and no other); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (marks that assertion disputed and records a new assertion in status disputed that supersedes nothing,
  for a link and for an attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a same-value proposal with another start as consolidated on an attribute key that allows multiple
  current values) would fail if the fact stopped holding.

  Certified rules/knowledge-base/reaffirmation-consolidates as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every
  multiplicity and whatever validity start the proposal states); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a same-target proposal with change hint none and another start as consolidated on the held
  link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (records no new link when
  the proposal re-affirms the held link with another start); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal to the held link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the held link row unwritten, so its validity start, basis, confidence, status and end stay);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (answers a proposal with change
  hint succession and the held target as consolidated, carrying the identity of the held link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (does not answer a proposal with change hint correction and the held target as a re-affirmation); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a same-value proposal with change hint none and another start as consolidated on the held attribute);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (records no new attribute when
  the proposal re-affirms the held attribute with another start); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal to the held attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the held attribute row unwritten, so its validity start, basis, confidence, status and end stay);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (answers a same-value proposal
  with another start as consolidated on an attribute key that allows multiple current values); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (does not answer a proposal with change hint none and another value as a re-affirmation); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a proposal with change hint succession and the held value as consolidated, carrying the identity
  of the held attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (does
  not answer a proposal with change hint correction and the held value as a re-affirmation); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance
  added, no new link, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance
  added, no new attribute, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (records no new link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (leaves
  that link in the status it holds); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds its provenance to that link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the validity start the link holds when the proposal states another); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the confidence, the validity end and the basis of the validity start the link holds); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (records no new attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (leaves
  that attribute in the status it holds); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds its provenance to that attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the validity start the attribute holds when the proposal states another); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the confidence, the validity end and the basis of the validity start the attribute holds); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers the proposal as consolidated, carrying the identity of the held attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (takes a proposal as the first of re-affirmation, correction, succession, dispute and new assertion
  whose condition it meets); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (is
  the one of its node and type, or the one of its node, type and target or value where the type allows
  multiple current assertions, and no other); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms the link of a type allowing one current link: provenance added, no new link, not marked
  disputed, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in
  every branch of the consolidation order); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (meets a held link or attribute as current only while it has neither a validity end nor a supersession
  time) would fail if the fact stopped holding.

  Certification of scenarios/knowledge-base/different-target-without-signal-is-disputed did not hold:
  the auditor answered `partial` — The setup matches the scenario''s given and when. The link type allows
  one current link. The held link runs from A to B. The proposal is for A to C, with change hint none,
  and its cited fragment texts are neutral, so none signals succession. The scenario test checks three
  things: that disputed is the only status written on knowledge_link, that exactly one new link is recorded,
  in status disputed, with target C, and that the new link has a null supersedes_link_id. Two parts of
  the fact are only half pinned. First, "the current link is marked disputed" is checked as some update
  on knowledge_link that assigns status disputed. No assertion ties that update to the held link''s identity,
  so code that wrote disputed onto some row other than the held A-to-B link would still pass. Second,
  "a new link from A to C" is checked on the target only. Nothing reads the recorded row''s source_node_id,
  so a new link recorded from some node other than A would still pass. The precedence and meeting tests
  confirm the outcome is disputed and that disputed is the status written to the table. They inherit both
  gaps, because they read only the outcome and the statuses that were written.. The node is decided by
  reading, and a certification standing on it from an earlier reconciliation is released by the bind.
  The remainder is testable: Hold a current A-to-B link of a type that allows one current link. Submit
  an A-to-C proposal with change hint none and only neutral fragment texts. The expected result has two
  parts. The status update that assigns disputed names the held link''s id. The one recorded new row has
  source_node_id A and target_node_id C..

  Certified scenarios/knowledge-base/same-target-succession-re-affirms as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms the link of a type allowing one current link: provenance added, no new link, not marked
  disputed, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a proposal with change hint succession and the held target as consolidated, carrying the identity
  of the held link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (records no
  new link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (leaves that link
  in the status it holds); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (adds
  its provenance to that link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the validity start the link holds when the proposal states another); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal and changes nothing else about the assertion, for every kind, every
  multiplicity and whatever validity start the proposal states); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
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

  Candidates: 7 opened across 2 of 4 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/succession-reaffirms-same-target.returns/`, which are the evidence behind every entry above.
