---
contract_version: siegard-reconcile/8
title: Review of the proof-compliance-counts initiative
summary: The test written by the delivery of task/compliance-deletion-counts-proof/counts-match-marked
  and the two standing compliance-audit files it proves, under initiative proof-compliance-counts, as
  its implementation and proof records state them.
target: backend
files:
- path: src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
  change: written by the delivery of task/compliance-deletion-counts-proof/counts-match-marked
- path: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  change: stands unchanged; the delivery of task/compliance-deletion-counts-proof/counts-match-marked
    proves it and writes no source
- path: src/modules/compliance-audit/service/compliance-audit.service.ts
  change: stands unchanged; the delivery of task/compliance-deletion-counts-proof/counts-match-marked
    proves it and writes no source
nodes:
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the `return res.rowCount
    ?? 0;` of tombstoneRawChunksOfRaw, tombstoneCascadedFragments, tombstoneCascadedLinks and tombstoneCascadedAttributes
    (lines 102, 136, 171, 206), carried into the `affected` column by the `jsonb_build_object(''chunks'',
    $3::int, ''fragments'', $4::int, ''links'', $5::int, ''attributes'', $6::int)` of insertComplianceDeletion
    (lines 235-249) — `UPDATE raw_chunk SET status = ''deleted'', superseded_at = now() WHERE raw_information_id
    = $1 AND superseded_at IS NULL RETURNING id` followed by `return res.rowCount ?? 0;`. The fragment,
    link and attribute updates have the same shape, each with `RETURNING f.id`, `kl.id` or `na.id` and
    `return res.rowCount ?? 0;`. insertComplianceDeletion then writes `args.affected.chunks, args.affected.fragments,
    args.affected.links, args.affected.attributes` into the `affected` object.

    src/modules/compliance-audit/service/compliance-audit.service.ts: held at complianceDelete(), lines
    152-171: the four cascade calls and the `affected` object handed to insertComplianceDeletion and insertCurationAction.
    — const chunks = await tombstoneRawChunksOfRaw(client, body.raw_information_id);

    const fragments = await tombstoneCascadedFragments(client, body.raw_information_id);

    const links = await tombstoneCascadedLinks(client, body.raw_information_id);

    const attributes = await tombstoneCascadedAttributes(client, body.raw_information_id);


    const affected = { chunks, fragments, links, attributes };

    The service stores exactly the counts the four tombstone calls return, with no arithmetic or substitution.
    Which rows are marked, and how they are counted, is done by the repository functions. The repository
    is not in this file set.'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
  - src/modules/compliance-audit/service/compliance-audit.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input: a compliance deletion whose target marks a different number of raw chunks
    than information fragments, for example two live chunks behind one fragment. One expected result:
    the recorded chunks count equals the chunks whose status turned to deleted, and the recorded fragments
    count equals the fragments whose status turned to deleted. Each is asserted on its own.'
restates:
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: the doc comments of tombstoneRawChunksOfRaw (line 85), tombstoneCascadedFragments (line 109),
    tombstoneCascadedLinks (line 143) and tombstoneCascadedAttributes (line 178)
  evidence: '" * Tombstone every raw_chunk anchored to the deleted raw. RETURNING.id count\n * feeds `affected.chunks`
    (BR-16)."

    " * RETURNING.id count feeds `affected.fragments` (BR-16)."

    " * RETURNING.id count feeds `affected.links` (BR-16)."

    " * RETURNING.id count feeds `affected.attributes` (BR-16)."'
  cost: Four comments say, outside any behavior, that each affected count is the number of rows the cascade
    marked deleted. The code already holds this fact in the `return res.rowCount ?? 0;` of each function
    and in the `jsonb_build_object` of insertComplianceDeletion. If the node moves, these comments stay
    as a second statement of it. Nothing checks them against the node, and the "BR-16" citation points
    at a back-spec identifier the specification root does not carry.
  node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
unbound:
- src/__tests__/integration/compliance-audit/counts-match-marked.spec.ts
pairs_omitted:
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: domain/knowledge-base/compliance-deletion-filter
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: domain/knowledge-base/curation-action
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: domain/knowledge-base/curation-action-filter
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: domain/knowledge-base/node-status
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/audit-filters-match-exactly
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/audit-listing-order
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/audit-listing-total-before-pagination
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/audit-listing-window-half-open
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/compliance-deletion-flags-metadata
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/compliance-deletion-keeps-content-hash
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/compliance-deletion-propagates
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/curation-action-time-is-recording-time
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/deletion-execution-time-is-recording-time
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: contracts/knowledge-base/compliance-audit
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/compliance-deletion-check-order
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/compliance-deletion-records-curation-action
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
- node: rules/knowledge-base/deleted-source-deletion-records-nothing
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: 'cleared by a judgment at these bytes: a reconciliation''s judgment read this pair over the
    file''s content and the node''s text as both stand, and no finding stands open against it'
notes: 'Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/proof-compliance-counts.returns/.

  Certification of rules/knowledge-base/compliance-deletion-counts-what-it-marked did not hold: the auditor
  answered `partial` — The test runs one deletion and checks two things against the same constant, chunks
  1, fragments 1, links 2, attributes 3: the counts recorded in the compliance deletion, and the rows
  whose status turned to deleted. Recorded counts that matched no marked rows would fail it. So would
  a count that included the shared attribute, or the chunk that was already superseded. Links (2) and
  attributes (3) differ from every other count, so if either landed in the wrong category the test would
  fail.

  Raw chunks and information fragments do not differ. The fixture marks exactly one of each, so a recorded
  chunks count that was really the number of fragments marked, or the other way round, would still produce
  {1, 1, 2, 3}. The test would pass even though the fact no longer held for those two categories. Each
  count being the number of rows marked in its own category is exercised for links and attributes only,
  not for chunks and fragments.

  Over-assertion: the "marked" side is also compared to EXPECTED_AFFECTED. That pins which rows a deletion
  marks, namely that the already superseded chunk and the attribute shared with another raw source are
  left out. That is a fact about how far a deletion reaches, not about counts matching what was marked.
  Change that scope and the test fails, even if the recorded counts still equal what was marked.. The
  node is decided by reading, and a certification standing on it from an earlier reconciliation is released
  by the bind. The remainder is testable: One input: a compliance deletion whose target marks a different
  number of raw chunks than information fragments, for example two live chunks behind one fragment. One
  expected result: the recorded chunks count equals the chunks whose status turned to deleted, and the
  recorded fragments count equals the fragments whose status turned to deleted. Each is asserted on its
  own..

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) rules/knowledge-base/compliance-deletion-counts-what-it-marked were read on every file
  and answered for, and bound from nowhere here — a binding this record writes is one the trace already
  held.

  A finding in src/modules/compliance-audit/service/compliance-audit.service.ts names rules/knowledge-base/compliance-deletion-redacts-content,
  which no file of this set is bound to: line 57, the exported constant REDACTED_LITERAL: export const
  REDACTED_LITERAL = "[REDACTED]" as const; — The rule that a compliance deletion replaces content and
  original input with the literal [REDACTED] is declared a second time here, in a file the node is not
  bound to. Nothing the service runs reads this constant. The redaction that executes is the SQL in compliance-audit.repository.ts
  (`SET content = ''[REDACTED]''`), and the only importers of the constant are the re-export in compliance-audit/index.ts
  and a unit test. If the node''s literal changes, the constant and its test keep passing against the
  old value while the repository does something else, so nobody can tell which one was decided.. It blocks
  nothing here; it is owed a route of its own.

  Candidates: 2 opened across 2 of 3 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 1 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/proof-compliance-counts.returns/`, which are the evidence behind every entry above.
