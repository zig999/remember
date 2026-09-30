---
contract_version: siegard-reconcile/8
title: Re-read after naming the validity-start basis valid_from_source
summary: The source did not change; the owner decided on 2026-09-30 that the basis attribute of a knowledge
  link, a node attribute and corrected values is named valid_from_source, as the code already names it,
  and the nodes were changed to say so. This reconciliation asks whether each bound node now holds what
  the file carries.
target: backend
files:
- path: src/modules/curation/dto/item.dto.ts
  change: Unchanged; read again against the nodes that now name the validity-start basis valid_from_source.
- path: src/modules/curation/repository/curation.repository.ts
  change: Unchanged; read again against the nodes that now name the validity-start basis valid_from_source.
- path: src/modules/knowledge-graph/dto/attribute.dto.ts
  change: Unchanged; read again against the nodes that now name the validity-start basis valid_from_source.
- path: src/modules/knowledge-graph/dto/link.dto.ts
  change: Unchanged; read again against the nodes that now name the validity-start basis valid_from_source.
- path: src/modules/query-retrieval/repository/provenance.repository.ts
  change: Unchanged; read again against the nodes that now name the validity-start basis valid_from_source.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Unchanged; read again against the nodes that now name the validity-start basis valid_from_source.
nodes:
- node: domain/knowledge-base/corrected-values
  conforms: true
  how: "src/modules/curation/dto/item.dto.ts: held at CorrectedValuesSchema, lines 30-37, and the CorrectedValues\
    \ type it infers, line 38 — export const CorrectedValuesSchema = z.object({\n  value: z.string().min(1).optional().nullable(),\n\
    \  target_node_id: UuidSchema.optional().nullable(),\n  valid_from: IsoDateSchema.optional().nullable(),\n\
    \  valid_to: IsoDateSchema.optional().nullable(),\n  valid_from_source: ValidFromSourceSchema.optional().nullable(),\n\
    \  valid_from_fragment_id: UuidSchema.optional().nullable(),\n});"
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
- node: domain/knowledge-base/knowledge-link
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/repository/curation.repository.ts,
    src/modules/knowledge-graph/dto/link.dto.ts, and src/modules/query-retrieval/repository/provenance.repository.ts
    read `nowhere` — The file declares no shape for knowledge_link. It only checks existence, through
    `SELECT EXISTS(SELECT 1 FROM knowledge_link WHERE id = $1) AS exists`. It also anchors the chain on
    `p.link_id` in `chainByLink`. Its row types (FragmentStatusRow, ProvenanceChainRow, TombstoneRow)
    describe fragments, chunks, raw information and compliance deletions, not the link''s own attributes.;
    src/modules/query-retrieval/service/provenance.service.ts read `nowhere` — The file declares no shape
    for a knowledge link. It only checks that a link exists and hands its id to the repository: `const
    exists = await linkExists(client, linkId); if (!exists) throw new ResourceNotFoundError("KnowledgeLink",
    linkId); const rows = await chainByLink(client, linkId);`. The node''s attributes (status, valid_from,
    valid_to, valid_from_source, confidence, superseded_at, provenance) are declared in neither this file
    nor in anything it reads beyond `ProvenanceChainRow`, which is imported from the repository file.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/knowledge-graph/dto/link.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/curation/repository/curation.repository.ts,
    src/modules/knowledge-graph/dto/attribute.dto.ts, and src/modules/query-retrieval/repository/provenance.repository.ts
    read `nowhere` — The file declares no shape for node_attribute. It only checks existence, through
    `SELECT EXISTS(SELECT 1 FROM node_attribute WHERE id = $1) AS exists`. It also anchors the chain on
    `p.attribute_id` in `chainByAttribute`. No declaration lists the attribute''s own attributes.; src/modules/query-retrieval/service/provenance.service.ts
    read `nowhere` — The file declares no shape for a node attribute. It only checks that an attribute
    exists and hands its id to the repository: `const exists = await attributeExists(client, attributeId);
    if (!exists) throw new ResourceNotFoundError("NodeAttribute", attributeId); const rows = await chainByAttribute(client,
    attributeId);`. The node''s attributes (value, status, valid_from, valid_to, valid_from_source, confidence,
    superseded_at, provenance) are not declared here. — a binding asserts the file answers for the node,
    so the pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/knowledge-graph/dto/attribute.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
restates:
- file: src/modules/curation/dto/item.dto.ts
  where: the comment above the final valid_from >= valid_to check, line 112
  evidence: // Semi-open invariant on the new pair when both supplied.
  cost: The start-before-end rule for a correction is restated in prose beside the comparison that enforces
    it, so the fact has a second home outside behavior.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/curation/dto/item.dto.ts
  where: the comment above the reason field in RejectItemBodySchema, line 21
  evidence: /** reject_item — reason mandatory (destructive, BR-11). */
  cost: The reason-required rule is stated in prose here with a back-spec id (BR-11), while ReasonRequiredSchema
    in ./enums.dto.js is what enforces it. A reader can take the comment for the rule's home, and if the
    node moves the comment goes stale without anything flagging it.
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/dto/item.dto.ts
  where: the comment above the someProvided check in CorrectItemBodySchema.superRefine, line 53
  evidence: '// BR-18: at least one of value/target_node_id/valid_from/valid_to.'
  cost: The rule "a correction must change at least one of the four" is restated in prose with a back-spec
    id, next to the code that enforces it. The two homes can drift apart without anything noticing.
  node: rules/knowledge-base/correction-changes-something
- file: src/modules/curation/dto/item.dto.ts
  where: the comment above the two item_kind cross-checks, line 67
  evidence: '// Cross-field: value only on attribute, target_node_id only on link.'
  cost: The rule that a correction may not change a link's value or an attribute's target node is restated
    in prose beside the branches that enforce it, so the fact has a second home outside behavior.
  node: rules/knowledge-base/correction-fits-assertion-kind
- file: src/modules/curation/dto/item.dto.ts
  where: the comment above the valid_from block, line 87
  evidence: // valid_from change requires valid_from_source.
  cost: The rule that a stated validity start needs a basis is restated in prose beside the branch that
    enforces it, so the fact has a second home outside behavior.
  node: rules/knowledge-base/stated-start-requires-basis
pairs_omitted:
- node: domain/knowledge-base/assertion-correction
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-review
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/corrected-stated-start-cites-fragment
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-changes-something
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-fits-assertion-kind
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-reason-required
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/stated-start-requires-basis
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/validity-start-before-end
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-target-kind
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/value-type
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/accept-rate
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjust-periods-outcome
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/alias-unique-per-node
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/confirmation-activates
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/confirmation-requires-uncertain
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/corrected-item-provenance
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/corrected-item-values
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-supersedes-item
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-queue-entry
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-clears-reviews
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/keep-separate-activates-node
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-provenance-once-per-fragment
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-compresses-paths
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-copies-aliases
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-marks-absorbed-merged
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-repoints-assertions
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/metrics-assertion-counts
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/metrics-review-counts
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prefer-one-outcome
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/reject-rate-by-code
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/rejection-and-correction-require-live-item
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/rejection-deletes
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/review-queue-order
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/review-queue-total-before-pagination
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/source-type
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-offsets-count-code-points
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/provenance-in-recording-order
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/retrieval
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/fragment-status
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-chunk
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/compliance-refusal-takes-precedence
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/empty-provenance-chain-refused
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 6 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/vfs-rename-backend.returns/.\nA finding in src/modules/curation/repository/curation.repository.ts\
  \ names domain/knowledge-base/valid-from-basis, which no file of this set is bound to: The `valid_from_source`\
  \ literal union, declared four times: `ItemLockedRow` (line 195), `CorrectionMutationArgs.correctedValidFromSource`\
  \ (line 398), `DisputedLinkRow` (line 684) and `DisputedAttributeRow` (line 733).: readonly valid_from_source:\
  \ \"stated\" | \"document\" | \"received\" | null; readonly correctedValidFromSource?: \"stated\" |\
  \ \"document\" | \"received\" | null; — The closed vocabulary for what justifies a validity start (stated,\
  \ document, received) is node `domain/knowledge-base/valid-from-basis`, an enumeration. It is not bound\
  \ to this file, so this file keeps its own copy of the vocabulary four times over. If the node adds,\
  \ renames or removes a value, `--check` never reaches this file. The next reader cannot tell whether\
  \ the node or the union in this file was the decision.. It blocks nothing here; it is owed a route of\
  \ its own.\nA finding in src/modules/query-retrieval/repository/provenance.repository.ts names rules/knowledge-base/chunk-excerpt-is-verbatim,\
  \ which no file of this set is bound to: runChainSql, the `excerpt` column in both SQL variants (lines\
  \ 141-142 and 165-166): substring(rc.\"text\" FROM rc.offset_start + 1\n                   FOR rc.offset_end\
  \ - rc.offset_start) AS excerpt — The migration declares `raw_chunk.\"text\"` as the chunk's own text,\
  \ and `offset_start` and `offset_end` as positions in the source. The query therefore offsets the chunk's\
  \ own text a second time. For any chunk that does not start at offset 0, the provenance excerpt is shifted\
  \ or empty. That is the text the provenance read exists to show. The rule lives only in this SQL expression,\
  \ so the next reader looks for it in the specification and finds a rule that says the opposite.. It\
  \ blocks nothing here; it is owed a route of its own.\nCandidates: 1 opened across 1 of 6 delegation(s);\
  \ each return lists its own under `candidates_opened`.\nRestates: 5 place(s) where text in the source\
  \ restates a node's fact the code holds, over 1 file(s), listed under `restates`. The pair conforms,\
  \ so none blocks a binding — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/vfs-rename-backend.returns/`, which are the evidence behind every entry above.
