---
contract_version: siegard-reconcile/9
title: 'Provenance upserts repeat their partial-index predicate: review reconciliation'
summary: The files were written by the delivery of task/provenance-conflict-predicate/record-provenance-once-per-fragment
  under the initiative provenance-conflict-predicate, a corrective increment over the four provenance
  upserts of the curation repository.
target: backend
files:
- path: src/__tests__/unit/curation/curation-repository-provenance.spec.ts
  change: 'Written by the delivery of task/provenance-conflict-predicate/record-provenance-once-per-fragment:
    a table-driven test of the SQL text of the four provenance statements.'
- path: src/modules/curation/repository/curation.repository.ts
  change: 'copyProvenance and appendProvenanceFragment, in both their link and attribute branches, now
    state the predicate of the partial unique index in their ON CONFLICT target: WHERE link_id IS NOT
    NULL on the link clauses and WHERE attribute_id IS NOT NULL on the attribute clauses. The statements
    are therefore matched to provenance_link_fragment_uq and provenance_attr_fragment_uq, and a fragment
    the item already holds as provenance is skipped by DO NOTHING instead of failing the operation. Nothing
    else in the file changed.'
nodes:
- node: domain/knowledge-base/assertion-status
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere` — The file imports the type and declares no enumeration of its own: `import type { AssertionStatus,
    ItemKind, NodeStatus, ValidFromSource } from "../dto/enums.dto.js";` Status values appear only as
    SQL literals in guards, for example `AND status IN (''active'', ''uncertain'', ''disputed'')`.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/curation-action
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the CurationActionInsertArgs interface
    (line 655), with insertCurationAction (line 663) writing it — export interface CurationActionInsertArgs
    { readonly action: string; readonly target_kind: "node" | "link" | "attribute"; readonly target_id:
    string; readonly payload: Record<string, unknown>; readonly reason: string | null; }'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/curation-target-kind
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at in part, the inline union on CurationActionInsertArgs.target_kind
    (line 657), which names node, link and attribute and omits fragment and raw-information — readonly
    target_kind: "node" | "link" | "attribute";'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ItemLockedRow (line 141) and
    DisputedLinkRow (line 730) row types, with the knowledge_link column lists they select — export interface
    DisputedLinkRow { readonly id: string; readonly source_node_id: string; readonly target_node_id: string;
    readonly link_type_id: string; ... readonly valid_from: string | null; readonly valid_to: string |
    null; readonly valid_from_source: ... readonly confidence: string; readonly status: AssertionStatus;
    readonly recorded_at: Date; }'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the NewAttributeArgs (line 475),
    DisputedAttributeRow (line 780) and ItemLockedRow (line 141) row types — export interface NewAttributeArgs
    { readonly nodeId: string; readonly attributeKeyId: string; readonly valueType: "date" | "number"
    | "text" | "bool"; readonly value: string; readonly validFrom: string | null; readonly validTo: string
    | null; readonly validFromSource: ValidFromSource | null; readonly status: AssertionStatus; readonly
    confidence: number; ... readonly supersedesAttributeId: string | null; }'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/provenance
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere` — The file declares no provenance shape. It only inserts rows into a table: `INSERT INTO
    provenance (link_id, fragment_id, created_at)`.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/value-type
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the inline union on ItemLockedRow.value_type
    (line 148), CorrectionMutationArgs-free NewAttributeArgs.valueType (line 478) — readonly valueType:
    "date" | "number" | "text" | "bool";'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/accept-rate
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at ACCEPT_ACTIONS (line 830) and
    the accept-rate branch of aggregateCurationMetrics (lines 855-865) — const ACCEPT_ACTIONS = ["resolve_entity_match",
    "merge_nodes", "resolve_dispute", "confirm_item", "correct_item"] as const; ... let acceptRate = 0;
    if (totalActions > 0) { ... acceptRate = accepted / totalActions; }'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/adjust-periods-outcome
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at adjustItemPeriod (line 328) —
    SET valid_from = $2::date, valid_to = $3::date, status = ''active'' WHERE id = $1 AND status = ''disputed'''
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/alias-unique-per-node
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ON CONFLICT clause of copyAliases
    (line 91), which honours the one-alias-per-normalized-form constraint — ON CONFLICT (node_id, alias_norm)
    DO NOTHING'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the attribute branches of copyProvenance
    (line 591) and appendProvenanceFragment (line 617), which honour the constraint — ON CONFLICT (attribute_id,
    fragment_id) WHERE attribute_id IS NOT NULL DO NOTHING'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/confirmation-activates
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at confirmItem (line 221) — UPDATE
    node_attribute SET status = ''active'' WHERE id = $1 AND status = ''uncertain'' RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/confirmation-keeps-assertion-values
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at confirmItem (line 221), whose
    UPDATE sets only status — UPDATE knowledge_link SET status = ''active'' WHERE id = $1 AND status =
    ''uncertain'' RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/confirmation-requires-uncertain
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the status guard in confirmItem
    (line 221), which updates nothing and returns 0 for an item that is not uncertain — WHERE id = $1
    AND status = ''uncertain'''
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/corrected-item-provenance
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at copyProvenance (line 568) and
    appendProvenanceFragment (line 598) — INSERT INTO provenance (attribute_id, fragment_id, created_at)
    SELECT $2, fragment_id, now() FROM provenance WHERE attribute_id = $1 ... ; and INSERT INTO provenance
    (attribute_id, fragment_id, created_at) VALUES ($1, $2, now())'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/corrected-item-values
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at insertCorrectedRow (line 397)
    — COALESCE($3::date, valid_from), COALESCE($4::date, valid_to), ''active''::assertion_status, confidence,
    COALESCE($5::valid_from_source, valid_from_source), NULL, $1::uuid, now()'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/correction-supersedes-item
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at supersedePredecessor (line 368),
    which sets status superseded and leaves valid_to alone, and the supersedes columns written by insertCorrectedRow
    (line 397) — SET status = ''superseded'', superseded_at = now() WHERE id = $1 AND status IN (''active'',
    ''uncertain'', ''disputed''); and in the insert, `''active''::assertion_status` and `$1::uuid` into
    `supersedes_link_id`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-addition
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere` — The file never decides between addition, first value and succession. It gets `supersedesAttributeId:
    string | null` and `status: AssertionStatus` as ready arguments in NewAttributeArgs, and `loadAttributeIdsOfKeyForUpdate`
    filters by caller-supplied `statuses`.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-adds-no-second-current-value
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere` — The file holds no refusal and no allows-multiple-current check on a set change. `loadAttributeIdsOfKeyForUpdate`
    only returns ids: `AND status = ANY($3::assertion_status[]) FOR UPDATE`.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-first-value
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere` — The file decides no first-value case. `insertNewAttribute` writes whatever `supersedesAttributeId:
    string | null` it is given into `supersedes_attribute_id`.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-note
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at in part, acceptInformationFragment
    (line 640), which turns the note''s fragment from proposed to accepted. The raw information and chunk
    are not recorded in this file. — UPDATE information_fragment SET status = ''accepted'' WHERE id =
    $1 AND status = ''proposed'' RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-provenance
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at copyProvenance (line 568), for
    the superseded attribute''s provenances, and appendProvenanceFragment (line 598), for the edit''s
    fragment — INSERT INTO provenance (attribute_id, fragment_id, created_at) SELECT $2, fragment_id,
    now() FROM provenance WHERE attribute_id = $1'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-removal
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at rejectAttributeAtEdit (line 552)
    — UPDATE node_attribute SET status = ''deleted'', superseded_at = $2::timestamptz WHERE id = $1 AND
    status IN (''active'', ''uncertain'', ''disputed'') RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-succession
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere` — The file decides no succession. `supersedeAttributeAtEdit` marks `status = ''superseded''`
    on an attribute id it is handed, and `insertNewAttribute` takes `supersedesAttributeId` from its caller.
    Whether the key is temporal and whether the value differs are not checked here.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-edit-supersession-time
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/repository/curation.repository.ts read
    `nowhere` — The file decides no supersession time. `supersedeAttributeAtEdit` writes whatever the
    caller passes: `valid_to = COALESCE($2::date, valid_to), superseded_at = $3::timestamptz` with `readonly
    supersededAt: Date | null;`. The rule that it stays unset only when the edit gives a validity end
    is not stated here.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-match-queue-entry
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at listEntityMatchQueue (line 696)
    — FROM knowledge_node kn JOIN node_type nt ON nt.id = kn.node_type_id LEFT JOIN entity_match_review
    em ON em.node_id = kn.id ... WHERE kn.status = ''needs_review'' ORDER BY kn.created_at ASC, kn.id
    ASC, em.similarity DESC NULLS LAST'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/entity-match-resolution-clears-reviews
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at deleteEntityMatchReviewByNode
    (line 130) — DELETE FROM entity_match_review WHERE node_id = $1 RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/keep-separate-activates-node
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at updateNodeStatusKeepSeparate (line
    34) — UPDATE knowledge_node SET status = ''active'' WHERE id = $1 AND status = ''needs_review'' RETURNING
    id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/link-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the link branches of copyProvenance
    (line 580) and appendProvenanceFragment (line 608), which honour the constraint — ON CONFLICT (link_id,
    fragment_id) WHERE link_id IS NOT NULL DO NOTHING'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-compresses-paths
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at pathCompressMergedInto (line 66)
    — UPDATE knowledge_node SET merged_into_node_id = $2 WHERE merged_into_node_id = $1 RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-copies-aliases
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at copyAliases (line 81) — INSERT
    INTO node_alias (node_id, alias, kind, created_by_run_id, created_at) SELECT $2, alias, ''alias'',
    created_by_run_id, created_at FROM node_alias WHERE node_id = $1 ON CONFLICT (node_id, alias_norm)
    DO NOTHING'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-marks-absorbed-merged
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at updateNodeMerged (line 49) — UPDATE
    knowledge_node SET status = ''merged'', merged_into_node_id = $2 WHERE id = $1 AND status IN (''active'',
    ''needs_review'') RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-repoints-assertions
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at repointLinks (line 98) and repointAttributes
    (line 115), neither of which filters on status — UPDATE knowledge_link SET source_node_id = CASE WHEN
    source_node_id = $1 THEN $2 ELSE source_node_id END, target_node_id = CASE WHEN target_node_id = $1
    THEN $2 ELSE target_node_id END WHERE source_node_id = $1 OR target_node_id = $1; and UPDATE node_attribute
    SET node_id = $2 WHERE node_id = $1'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-assertion-counts
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the uncertain and disputed count
    queries in aggregateCurationMetrics (lines 891-905) — (SELECT count(*) FROM knowledge_link_resolved
    WHERE effective_status = ''uncertain'') + (SELECT count(*) FROM node_attribute_resolved WHERE effective_status
    = ''uncertain'')'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-disputed-queue-count
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the disputedQueueRes query in
    aggregateCurationMetrics (line 907) — SELECT DISTINCT ''link'' AS k, source_node_id, target_node_id,
    link_type_id FROM knowledge_link WHERE status = ''disputed'' UNION ALL SELECT DISTINCT ''attribute'',
    node_id, attribute_key_id, NULL::uuid FROM node_attribute WHERE status = ''disputed'''
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-review-counts
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the needsReviewRes query and entityMatchQueueCount
    in aggregateCurationMetrics (lines 883-889) — const needsReviewCount = Number(needsReviewRes.rows[0]?.total
    ?? 0); const entityMatchQueueCount = needsReviewCount;'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/prefer-one-outcome
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at resolveDisputeWinner (line 275)
    and resolveDisputeLosers (line 300), neither of which touches validity — UPDATE knowledge_link SET
    status = ''active'' WHERE id = $1 AND status = ''disputed''; and UPDATE knowledge_link SET status
    = ''deleted'', superseded_at = now() WHERE id = ANY($1::uuid[]) AND status = ''disputed'''
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/reject-rate-by-code
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the rejectsRes query and its loop
    in aggregateCurationMetrics (lines 867-881) — WHERE action = ''reject_item'' AND payload ? ''error_code''
    GROUP BY 1 ... rejectRateByCode[row.code] = Number(row.total) / totalActions;'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/rejection-and-correction-require-live-item
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the status guards of rejectItem
    (line 246) and supersedePredecessor (line 368) — WHERE id = $1 AND status IN (''active'', ''uncertain'',
    ''disputed'')'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/rejection-deletes
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at rejectItem (line 246) — UPDATE
    node_attribute SET status = ''deleted'', superseded_at = now() WHERE id = $1 AND status IN (''active'',
    ''uncertain'', ''disputed'') RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/review-queue-order
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ORDER BY clauses of listEntityMatchQueue
    (line 714), listDisputedLinks (line 766) and listDisputedAttributes (line 814). The placement of entity-match
    entries before link disputes and those before attribute disputes lies with whatever calls the three
    lists. Grouping items into disputes also lies with the caller. — ORDER BY kn.created_at ASC, kn.id
    ASC, em.similarity DESC NULLS LAST; ORDER BY kl.recorded_at ASC, kl.id ASC; ORDER BY na.recorded_at
    ASC, na.id ASC'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/review-queue-page-windows-entries
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the separate LIMIT $1 OFFSET $2
    of listEntityMatchQueue (line 715), listDisputedLinks (line 767) and listDisputedAttributes (line
    815) — LIMIT $1 OFFSET $2'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/review-queue-total-before-pagination
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at countEntityMatchQueue (line 721),
    countDisputedLinks (line 773) and countDisputedAttributes (line 821), three unpaged counts. Adding
    them and counting each dispute once lies with the caller. — SELECT count(*)::text AS total FROM knowledge_node
    WHERE status = ''needs_review''; SELECT count(*)::text AS total FROM knowledge_link WHERE status =
    ''disputed''; SELECT count(*)::text AS total FROM node_attribute WHERE status = ''disputed'''
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: scenarios/knowledge-base/emptying-one-email-rejects-only-that-email
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at rejectAttributeAtEdit (line 552),
    which marks deleted only the attribute id it is given — UPDATE node_attribute SET status = ''deleted'',
    superseded_at = $2::timestamptz WHERE id = $1 AND status IN (''active'', ''uncertain'', ''disputed'')
    RETURNING id'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
unbound:
- src/__tests__/unit/curation/curation-repository-provenance.spec.ts
notes: 'Judged by 2 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/provenance-conflict-predicate.returns/.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) rules/knowledge-base/attribute-provenance-once-per-fragment, rules/knowledge-base/link-provenance-once-per-fragment,
  rules/knowledge-base/entity-edit-provenance, rules/knowledge-base/corrected-item-provenance, domain/knowledge-base/provenance,
  domain/knowledge-base/node-attribute, domain/knowledge-base/knowledge-link, domain/knowledge-base/entity-edit,
  domain/knowledge-base/information-fragment, domain/knowledge-base/assertion-correction were read on
  every file and answered for, and bound from nowhere here — a binding this record writes is one the trace
  already held.

  A finding in src/modules/curation/repository/curation.repository.ts names domain/knowledge-base/valid-from-basis,
  which no file of this set is bound to: the inline literal unions typing valid_from_source in ItemLockedRow
  (line 154), CorrectionMutationArgs (line 365), DisputedLinkRow (line 739) and DisputedAttributeRow (line
  788): readonly valid_from_source: "stated" | "document" | "received" | null; (the same file also imports
  the vocabulary as a type, `ValidFromSource` from "../dto/enums.dto.js", and uses it in `readonly validFromSource:
  ValidFromSource | null;` at NewAttributeArgs) — The vocabulary of what justifies a validity start is
  written out four times in this file beside the imported type that already names it. The node domain/knowledge-base/valid-from-basis
  is not bound to this file. If the node gains or renames a value, `--check` never reaches these declarations,
  and the next reader cannot tell which spelling was decided.. It blocks nothing here; it is owed a route
  of its own.

  Candidates: 1 opened across 1 of 2 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/provenance-conflict-predicate.returns/`, which are the evidence behind every entry above.
