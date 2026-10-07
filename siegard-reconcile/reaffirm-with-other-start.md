---
contract_version: siegard-reconcile/8
title: Review of the reaffirm-with-other-start delivery
summary: 'The one task of the initiative reaffirm-with-other-start, task/reaffirm-with-other-start/reaffirm-other-start-proposal,
  wrote these files: the consolidation service with its re-affirmation conditions, a new spec with its
  store stand-in, and a rewrite of one existing test, as its implementation and proof records state.'
target: backend
files:
- path: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  change: written by the delivery of task/reaffirm-with-other-start/reaffirm-other-start-proposal as a
    test of its proof
- path: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  change: 'Adjusted existing test, not weakened. The test ''functional link with different valid_from
    does NOT auto-consolidate (still requires sameValidFrom)'' asserted the old behavior this task corrects:
    a same-target, change-hint-none link proposal with another start on a type that does not allow multiple
    current links was a dispute with a new row inserted. It is rewritten to assert the corrected behavior:
    outcome consolidated on the held link and no new row. Its title changed to match. The two comment
    passages stating that functional types still require the same validity start were removed, because
    they describe the old behavior. No other test in the file changed.'
- path: src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
  change: 'Shared fake store for the new spec. It stands in for the pg client at the store boundary only.
    A FOR UPDATE select returns the held rows that satisfy the query''s equality and IS NULL conditions.
    Writes to knowledge_link and node_attribute are recorded by table and kind. Provenance inserts enforce
    one row per (target, fragment): a duplicate without a conflict clause raises the 23505 unique violation,
    and one with it is skipped. Any statement it does not know throws.'
- path: src/modules/ingestion/service/graph-consolidation.service.ts
  change: 'The link branch re-affirms when the target is the current link''s target and the change hint
    is none. The attribute branch re-affirms when the value is the current attribute''s value and the
    change hint is none. Neither compares validity starts, and a re-affirmation adds provenance only,
    so no new row is recorded and the held validity start, basis, confidence, status and validity end
    are not touched. The correction, succession, dispute and new-assertion branches are unchanged. The
    file was rewritten whole under the no-comments rule: the header, the JSDoc blocks and the inline comments
    are gone. The empty `if (!functional)` block that held only a comment in the link branch became `if
    (functional)` around the dispute path, with the same behavior.'
nodes:
- node: domain/knowledge-base/change-hint
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `change_hint` union
    type in ConsolidateLinkArgs (line 49) and ConsolidateAttributeArgs (line 63) — readonly change_hint:
    "none" | "succession" | "correction";'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the `valid_from_basis` union
    type in ConsolidateLinkArgs (line 48) and ConsolidateAttributeArgs (line 62) — readonly valid_from_basis:
    "stated" | "document" | "received" | null;'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at insertAttributeProvenance,\
    \ line 130 onwards — INSERT INTO provenance (attribute_id, fragment_id)\n       SELECT $1, f FROM\
    \ unnest($2::uuid[]) AS f\n       ON CONFLICT DO NOTHING"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/conflict-disputes
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the `if (functional)` dispute\
    \ branches of consolidateLinkOnce (lines 393-410) and consolidateAttributeOnce (lines 577-594) — SET\
    \ status = 'disputed'::assertion_status\n ... status: \"disputed\",\n        supersedes_link_id: null,"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/consolidation-precedence
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the order of the branches\
    \ in consolidateLinkOnce (344, 349, 369, 393, 413) and consolidateAttributeOnce — if (sameTarget &&\
    \ args.change_hint === \"none\") {\n ... if (args.change_hint === \"correction\") {\n ... if (\n \
    \     functional &&\n      !sameTarget &&\n ... if (functional) {"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/consolidation-race-decided-again
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the two-attempt loop in\
    \ consolidateLink (line 279) and consolidateAttribute (line 463) — for (let attempt = 1; attempt <=\
    \ 2; attempt += 1) {\n    const savepoint = `gc_link_${attempt}`;\n    await client.query(`SAVEPOINT\
    \ ${savepoint}`);"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/consolidation-race-refuses-second-collision
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the `attempt === 2` throws\
    \ in consolidateLink (lines 300-306) and consolidateAttribute (lines 484-490) — if (attempt === 2)\
    \ {\n      throw new ValidationFailure(\n        \"SYSTEM_INTERNAL_ERROR\",\n        \"graph consolidation:\
    \ dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.\",\n  \
    \      { scope: \"knowledge_link\" }"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/consolidation-records-provenance
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at insertLinkProvenance and\
    \ insertAttributeProvenance, called on every taken path — INSERT INTO provenance (link_id, fragment_id)\n\
    \       SELECT $1, f FROM unnest($2::uuid[]) AS f\n       ON CONFLICT DO NOTHING"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: rules/knowledge-base/correction-replaces
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the correction branch of\
    \ consolidateLinkOnce (lines 349-367) and consolidateAttributeOnce (lines 533-551) — SET superseded_at\
    \ = now(),\n            status        = 'superseded'::assertion_status\n      WHERE id = $1\n ...\
    \ supersedes_link_id: vigent.id,"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/current-assertion
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the WHERE clauses of the\
    \ four lockVigent* queries (lines 184-270) — AND valid_to       IS NULL\n        AND superseded_at\
    \  IS NULL"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Seed a held link and a held attribute in each of the four combinations (no validity end
    and no supersession time; only an end; only a supersession time; both). Read each one back through
    the resolved read the query side serves. Expect it reported current only for the combination with
    neither field.
- node: rules/knowledge-base/link-provenance-once-per-fragment
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at insertLinkProvenance, lines\
    \ 116-128 — INSERT INTO provenance (link_id, fragment_id)\n       SELECT $1, f FROM unnest($2::uuid[])\
    \ AS f\n       ON CONFLICT DO NOTHING"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/new-assertion
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the fall-through insert\
    \ after the `vigent !== null` block (lines 413-418) and after line 595 for attributes — const newRow\
    \ = await insertLinkRow(client, args, runCtx, {\n    status: args.status_for_new_row,\n    supersedes_link_id:\
    \ null,\n  });"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/proposal-meets-current-assertion
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the vigent lookup selection\
    \ in consolidateLinkOnce (lines 325-339) and consolidateAttributeOnce (lines 509-523) — const functional\
    \ = !linkTypeInfo.allows_multiple_current;\n ... vigent = await lockVigentLinkBySourceAndType(\n ...\
    \ vigent = await lockVigentLinkByTriple("
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/provenance-accepts-proposed-fragment
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at promoteFragmentsToAccepted,\
    \ lines 144-156 — UPDATE information_fragment\n        SET status = 'accepted'\n      WHERE id = ANY($1::uuid[])\n\
    \        AND status = 'proposed'"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/reaffirmation-consolidates
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the first branch of consolidateLinkOnce\
    \ (lines 344-347) and consolidateAttributeOnce (lines 528-531) — if (sameTarget && args.change_hint\
    \ === \"none\") {\n      await insertLinkProvenance(client, vigent.id, args.fragment_ids);\n     \
    \ return { outcome: \"consolidated\", link_id: vigent.id };"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/succession-before-previous-start
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at closeVigentForSuccession,\
    \ lines 158-182 — WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}\n                   \
    \    THEN valid_to\n                     ELSE ${closeExpr}"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/succession-closes-previous
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the succession branch of\
    \ consolidateLinkOnce (lines 369-391) and consolidateAttributeOnce (lines 553-575) — functional &&\n\
    \      !sameTarget &&\n      (args.change_hint === \"succession\" ||\n        hasSuccessionSignal(fragmentTexts))"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/succession-closing-date
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at closeVigentForSuccession,
    line 164, with `args.valid_from` passed as closeDate — const closeExpr = closeDate !== null ? "$2::date"
    : "now()::date";'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/succession-signal
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at SUCCESSION_MARKERS and hasSuccessionSignal,\
    \ lines 11-33 — const lower = f.toLowerCase();\n    for (const m of SUCCESSION_MARKERS) {\n      if\
    \ (lower.includes(m)) return true;"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: scenarios/knowledge-base/same-target-other-start-re-affirms
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the re-affirmation branch
    of consolidateLinkOnce (lines 344-347), which tests only target and change hint and never the validity
    start — if (sameTarget && args.change_hint === "none") {'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- node: scenarios/knowledge-base/same-target-succession-is-disputed
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the branches of consolidateLinkOnce\
    \ for a same-target proposal with change hint succession. The succession branch requires `!sameTarget`,\
    \ so the proposal falls to the functional dispute branch at lines 393-410. — functional &&\n     \
    \ !sameTarget &&\n ... if (functional) {\n        await client.query(\n          `UPDATE knowledge_link\n\
    \              SET status = 'disputed'::assertion_status"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: scenarios/knowledge-base/same-value-other-start-re-affirms
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at the re-affirmation branch
    of consolidateAttributeOnce (lines 528-531), which tests only value and change hint and never the
    validity start — if (sameValue && args.change_hint === "none") {'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
unstated:
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce, the correction branch (lines 349-367), and consolidateAttributeOnce, its
    mirror (lines 533-551)
  evidence: "return {\n        outcome: \"accepted\",\n        link_id: newRow.id,\n        superseded_link_id:\
    \ vigent.id,\n      };"
  cost: The code decides that a correction reports the outcome `accepted` and not `superseded_previous`.
    It also decides that the outcome carries the superseded identity. No node holds either choice. The
    contract lists the outcomes as "consolidated, accepted, superseded_previous with the superseded link's
    identity, or disputed", and correction-replaces says nothing about an outcome. A reader looking in
    the specification for what a corrected link reports finds nothing, so the answer lives only in this
    file. The curation and run-summary counts that depend on the outcome follow it.
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLinkOnce, the fall-through after the `if (vigent !== null)` block (lines 413-418),
    and consolidateAttributeOnce, its mirror (lines 597-602)
  evidence: "const newRow = await insertLinkRow(client, args, runCtx, {\n    status: args.status_for_new_row,\n\
    \    supersedes_link_id: null,\n  });"
  cost: For a type that allows multiple current assertions, a proposal that meets the current assertion
    at the same triple with change hint succession (neither none nor correction) matches no branch. It
    is recorded as a new assertion, and `new-assertion` says a new assertion is recorded only when the
    proposal meets no current assertion. The dispute rule covers only types that do not allow multiple,
    and re-affirmation requires change hint none. No node says what this case does, so the code settles
    it silently. In practice the duplicate guard probably turns it into the second-collision refusal,
    but no node says that either.
restates:
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: line 464, the comment above the status assertion in "inserts a new knowledge_link row and one
    provenance row when no vigent exists"
  evidence: // active status because confidence >= 0.75 (BR-17).
  cost: The 0.75 floor is stated a second time in test prose. If the node's threshold moves, this comment
    goes stale and nothing flags it, because it is prose and no bind reaches it.
  node: rules/knowledge-base/new-assertion-status-from-confidence
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 469-474 and 485-487, the comments in "promotes the cited fragment proposed -> accepted
    when provenance is created (§6.6)"
  evidence: §6.6 requires the fragment to flip to 'accepted' exactly when its Provenance row is created
    on consolidation.
  cost: A second statement of when a fragment moves from proposed to accepted sits in the test beside
    the assertions. A reader looking for that rule finds this prose instead of the node.
  node: rules/knowledge-base/provenance-accepts-proposed-fragment
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 516-517, the comment above "returns outcome=consolidated and does NOT insert a new row
    when (source, link_type, target, valid_from) match the vigent row"
  evidence: '// BR-27 step (a): vigent row exists; same target; same valid_from; // change_hint=''none''
    -> no new row, only provenance.'
  cost: The comment states the re-affirmation condition with a same-validity-start requirement. The node
    says re-affirmation holds "whatever validity start it states". The test at line 696 does not require
    a same start either. A reader of the comment learns the older, narrower rule.
  node: rules/knowledge-base/reaffirmation-consolidates
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 541 and 544, the comments in the re-affirmation test, and line 645 in the multi-current
    test
  evidence: // Provenance MUST still be inserted (BR-18) — re-affirmation accumulates.
  cost: The rule that a re-affirmation records provenance on the existing assertion is restated in prose.
    The assertions on `state.inserts.provenance` already carry it.
  node: rules/knowledge-base/consolidation-records-provenance
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 593-608, the block comment above describe "multi-current link re-affirmation with divergent
    valid_from (§18 bug fix)"
  evidence: 'Fix: for multi-current types, recognize re-affirmation by `sameTarget && change_hint ===
    ''none''` WITHOUT requiring `sameValidFrom`.'
  cost: The comment limits the "any validity start" re-affirmation to multi-current types. The node applies
    it to every type, and the test at line 696 exercises it on a functional type. A reader of the comment
    gets a narrower rule than the one decided, and the comment records a bug history that belongs in a
    decision log.
  node: rules/knowledge-base/reaffirmation-consolidates
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 651-655, the comment above "does NOT consolidate when change_hint='succession' even on
    a multi-current link"
  evidence: (succession does not apply to multi-current types per §6.5)
  cost: The scope of succession, only types that do not allow multiple current assertions, is stated in
    test prose. The rule lives in the node and the consolidator.
  node: rules/knowledge-base/succession-closes-previous
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 767-772, the comment in "closes vigent and inserts a new chained row when functional +
    different target + textual succession signal"
  evidence: '// Emenda v7.3: succession closes the VALIDITY axis only — the close must // guard superseded_at
    conditionally (intra-day fallback), never set it // unconditionally.'
  cost: How a succession closes the previous assertion is restated in prose that cites an amendment of
    the old source document, not a node. If the node is changed, nothing reaches this comment.
  node: rules/knowledge-base/succession-closes-previous
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 784-788 and 824-827, the comments in "intra-day succession closes on the transaction axis
    only"
  evidence: '// the strict `valid_from < valid_to` CHECK. The succession close must guard // this: emit
    valid_to only when valid_from < closeDate, else leave it.'
  cost: The rule for a closing date on or before the previous start is restated in prose, in terms of
    a database CHECK. The node states it in domain terms.
  node: rules/knowledge-base/succession-before-previous-start
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 913-914 and 943-944, the comments in the correction test, and line 1162 in the attribute
    mirror
  evidence: // The vigent row's UPDATE must NOT touch valid_to (§6.5-B "transaction // axis only").
  cost: A correction leaving the previous assertion's validity end as it was is restated in prose citing
    the old source document. The node holds it.
  node: rules/knowledge-base/correction-replaces
- file: src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  where: lines 959 and 988, the describe-level and test-title comments on the dup-guard race
  evidence: // Dup-guard 23505 race recovery (BR-27 step "SQLSTATE 23505 -> retry once")
  cost: The decide-again-once rule for a concurrent collision is restated in prose and cites a step number
    from the old source document.
  node: rules/knowledge-base/consolidation-race-decided-again
unbound:
- src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
- src/__tests__/unit/ingestion/graph-consolidation.spec.ts
- src/__tests__/unit/ingestion/reaffirm-consolidation-world.ts
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reaffirm-with-other-start.returns/.

  Certified rules/knowledge-base/consolidation-records-provenance as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (records, on the assertion a taken proposal lands on, one provenance for each fragment it cites, in
  every branch of the consolidation order); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal to the held link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal to the held attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds a second cited fragment once and the already-held one not again when the held link is re-cited);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (adds a second cited fragment
  once and the already-held one not again when the held attribute is re-cited); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance
  added, no new link, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance
  added, no new attribute, validity start kept) would fail if the fact stopped holding.

  Certification of rules/knowledge-base/current-assertion did not hold: the auditor answered `partial`
  — This test runs all four combinations of validity end and supersession time (each present or absent),
  for both a held knowledge link and a held node attribute. It treats a held row as current exactly when
  a change-hint-none proposal with the same target or value consolidates on it. So the test fails if consolidation
  ignores either field, or treats a row with neither field as not current. That covers the fact only as
  the consolidation path reads it. The node states currency as a property of every knowledge link and
  node attribute, with no consumer named. Nothing in the proof reads a held link or attribute back through
  any other reader of currency, such as the resolved read of a link or attribute, so the fact holding
  on that side goes unexercised. Separately, the test sees currency only through the in-memory world it
  imports from reaffirm-consolidation-world.js. That file is not part of the offered proof and was not
  opened, so this answer does not settle whether the currency decision is made by the service under test
  or by the fake''s own row selection.. The node is decided by reading, and a certification standing on
  it from an earlier reconciliation is released by the bind. The remainder is testable: Seed a held link
  and a held attribute in each of the four combinations (no validity end and no supersession time; only
  an end; only a supersession time; both). Read each one back through the resolved read the query side
  serves. Expect it reported current only for the combination with neither field..

  Certified scenarios/knowledge-base/same-target-other-start-re-affirms as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms a link from A to B valid from 2024-01-01 by a proposal valid from 2024-06-01: provenance
  added, no new link, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a same-target proposal with change hint none and another start as consolidated on the held
  link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (records no new link when
  the proposal re-affirms the held link with another start); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal to the held link); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the held link row unwritten, so its validity start, basis, confidence, status and end stay)
  would fail if the fact stopped holding.

  Certified scenarios/knowledge-base/same-value-other-start-re-affirms as decided by step `test`: src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (re-affirms an attribute holding V valid from 2026-01-01 by a proposal of V valid from 2026-03-01: provenance
  added, no new attribute, validity start kept); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (answers a same-value proposal with change hint none and another start as consolidated on the held attribute);
  src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts (records no new attribute when
  the proposal re-affirms the held attribute with another start); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (adds the provenance of the proposal to the held attribute); src/__tests__/unit/ingestion/graph-consolidation-reaffirmation.spec.ts
  (leaves the held attribute row unwritten, so its validity start, basis, confidence, status and end stay)
  would fail if the fact stopped holding.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) rules/knowledge-base/reaffirmation-consolidates, rules/knowledge-base/proposal-meets-current-assertion,
  rules/knowledge-base/consolidation-precedence, rules/knowledge-base/current-assertion, rules/knowledge-base/consolidation-records-provenance,
  rules/knowledge-base/link-provenance-once-per-fragment, rules/knowledge-base/attribute-provenance-once-per-fragment,
  scenarios/knowledge-base/same-target-other-start-re-affirms, scenarios/knowledge-base/same-value-other-start-re-affirms,
  contracts/knowledge-base/ingestion, domain/knowledge-base/proposal, domain/knowledge-base/knowledge-link,
  domain/knowledge-base/node-attribute, domain/knowledge-base/change-hint, domain/knowledge-base/provenance
  were read on every file and answered for, and bound from nowhere here — a binding this record writes
  is one the trace already held.

  Candidates: 8 opened across 1 of 4 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 2 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 10 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reaffirm-with-other-start.returns/`, which are the evidence behind every entry above.
