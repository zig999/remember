---
contract_version: siegard-reconcile/8
title: Certification of the compliance deletion counts rule against the routes integration test
summary: The source did not change; the owner offers src/__tests__/integration/compliance-audit/routes.spec.ts,
  run by the registry's step test, as the proof of rules/knowledge-base/compliance-deletion-counts-what-it-marked,
  and this reconciliation reads the two files bound to the rule against their nodes while the auditor
  judges the proof.
target: backend
files:
- path: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  change: Unchanged; marks the raw information's chunks, fragments, links and attributes deleted, returning
    each count, and inserts the deletion record.
- path: src/modules/compliance-audit/service/compliance-audit.service.ts
  change: Unchanged; runs a compliance deletion, gathering the counts the cascade marked into affected
    and recording the deletion.
nodes:
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at The four count-returning
    UPDATE ... RETURNING functions (tombstoneRawChunksOfRaw, tombstoneCascadedFragments, tombstoneCascadedLinks,
    tombstoneCascadedAttributes). Each returns `res.rowCount ?? 0`, the number of rows that statement
    marked. The counts are persisted under the keys chunks, fragments, links and attributes by insertComplianceDeletion.
    — "UPDATE raw_chunk SET status = ''deleted'', superseded_at = now() WHERE raw_information_id = $1
    AND superseded_at IS NULL RETURNING id" ... "return res.rowCount ?? 0;" (and the same shape for information_fragment,
    knowledge_link and node_attribute); "jsonb_build_object(''chunks'', $3::int, ''fragments'', $4::int,
    ''links'', $5::int, ''attributes'', $6::int)" fed by args.affected.chunks, .fragments, .links, .attributes.

    src/modules/compliance-audit/service/compliance-audit.service.ts: held at complianceDelete(), lines
    152-171. The four counts returned by the cascade tombstone calls are gathered into `affected`, and
    that object is what insertComplianceDeletion persists as the deletion''s counts. — const chunks =
    await tombstoneRawChunksOfRaw(client, body.raw_information_id); const fragments = await tombstoneCascadedFragments(client,
    body.raw_information_id); const links = await tombstoneCascadedLinks(client, body.raw_information_id);
    const attributes = await tombstoneCascadedAttributes(client, body.raw_information_id); const affected
    = { chunks, fragments, links, attributes }; const deletion = await insertComplianceDeletion(client,
    { raw_information_id: body.raw_information_id, reason: body.reason, affected });'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
  - src/modules/compliance-audit/service/compliance-audit.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result: a compliance deletion of a raw whose rows that
    depend only on it are 1 chunk, 1 fragment, 2 links and 3 attributes, plus one attribute with provenance
    in a second active raw and one chunk of the target raw that is already superseded. It should answer
    affected {chunks 1, fragments 1, links 2, attributes 3}, and those numbers should match the rows whose
    status the deletion turned to deleted.'
restates:
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: The doc comments above tombstoneRawChunksOfRaw (lines 84-88), tombstoneCascadedFragments (lines
    105-111), tombstoneCascadedLinks (lines 139-144) and tombstoneCascadedAttributes (lines 174-179).
  evidence: '"RETURNING.id count feeds `affected.chunks` (BR-16)." / "RETURNING.id count feeds `affected.fragments`
    (BR-16)." / "RETURNING.id count feeds `affected.links` (BR-16)." / "RETURNING.id count feeds `affected.attributes`
    (BR-16)."'
  cost: Four comments say what the node holds, that each affected count is the number of rows the cascade
    marked deleted, and the code already does it with `return res.rowCount ?? 0;` and the `jsonb_build_object('chunks',
    $3::int, ...)` insert. A reader sees a second statement of the counting rule beside the code. When
    the node moves, nothing reaches these comments, and they go on describing the old rule.
  node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
pairs_omitted:
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion-filter
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action-filter
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-status
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-filters-match-exactly
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-listing-order
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-listing-total-before-pagination
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-listing-window-half-open
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-flags-metadata
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-keeps-content-hash
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-propagates
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-action-time-is-recording-time
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/deletion-execution-time-is-recording-time
  file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/compliance-audit
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-check-order
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-records-curation-action
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/deleted-source-deletion-records-nothing
  file: src/modules/compliance-audit/service/compliance-audit.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 2 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/certify-counts-what-it-marked.returns/.

  Certification of rules/knowledge-base/compliance-deletion-counts-what-it-marked did not hold: the auditor
  answered `partial` — The full-cascade test pairs the reported counts with the rows marked deleted. It
  marks 3 chunks, 1 fragment, 1 link and 1 attribute, and expects affected {chunks 3, fragments 1, links
  1, attributes 1}. The BR-06 test checks that a fragment left unmarked is not counted (fragments 0).
  The BR-07 test checks that a link left unmarked is not counted (links 0) while a fragment is marked.
  Three parts of the fact go unexercised. First, the attribute count is never told apart from the other
  counts. In every scenario it equals the link count (1/1, 0/0, 0/0) and the fragment count. BR-07 never
  checks fragments or attributes, so a deletion that reported its marked links, or its marked fragments,
  as its attribute count passes every test. Second, nothing in the set has an attribute that hangs off
  the deleted raw but survives, so "attributes it marked" is never separated from "attributes it touched".
  Third, every chunk of the raw is still unmarked when the deletion starts. So "chunks it marked" is never
  separated from "chunks the raw owns": no test has a chunk that is already superseded and must not be
  counted. Note also that every marking these tests see is done by an in-memory fake that copies the repository''s
  SQL. The tests check that the counts match what that fake marked, not what the real statements mark
  against Postgres.. The node is decided by reading, and a certification standing on it from an earlier
  reconciliation is released by the bind. The remainder is testable: One input against one expected result:
  a compliance deletion of a raw whose rows that depend only on it are 1 chunk, 1 fragment, 2 links and
  3 attributes, plus one attribute with provenance in a second active raw and one chunk of the target
  raw that is already superseded. It should answer affected {chunks 1, fragments 1, links 2, attributes
  3}, and those numbers should match the rows whose status the deletion turned to deleted..

  A finding in src/modules/compliance-audit/service/compliance-audit.service.ts names rules/knowledge-base/compliance-deletion-redacts-content,
  which no file of this set is bound to: line 57, the exported constant REDACTED_LITERAL, with its docstring
  on lines 51-56: export const REDACTED_LITERAL = "[REDACTED]" as const; — The node rules/knowledge-base/compliance-deletion-redacts-content
  holds the redaction literal. The literal is also declared here as a value of its own, and re-exported
  from modules/compliance-audit/index.ts. Nothing in this file uses it. The repository that does the redaction
  writes its own copy in SQL (`SET content = ''[REDACTED]''`). The service constant is read only by a
  unit test that pins its bytes. If the node''s literal changes, the repository and the test pin move
  independently of this constant, and this constant stays as a second place that looks like where the
  decision lives. The node''s `--check` does not reach this file, because this file is bound to the counts
  node and not to the redaction node.. It blocks nothing here; it is owed a route of its own.

  Candidates: 1 opened across 1 of 2 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 1 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/certify-counts-what-it-marked.returns/`, which are the evidence behind every entry above.
