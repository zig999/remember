---
contract_version: siegard-reconcile/8
title: Reconciliation of the two query-retrieval services after the comment route
summary: The owner removed source comments from the two query-retrieval services in commit 8ab81f9 by
  the comment route, with behavior unchanged, and states the source is correct; this reconciliation asks
  whether the nodes bound to each file still hold what it carries.
target: backend
files:
- path: src/modules/query-retrieval/service/accepted-fragments.service.ts
  change: Lists accepted fragments for a run or a raw information as a page, as before; only its prose
    was removed.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Reads the provenance chain of a link, an attribute or an accepted fragment and refuses a compliance-deleted
    source or an empty chain, as before; only its prose was removed.
nodes:
- node: contracts/knowledge-base/retrieval
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at The list-accepted-fragments\
    \ accepted answer is assembled in listAcceptedFragmentsService: the items mapping (lines 43-56) and\
    \ the returned page (lines 74-79). The refusals for this operation (owner authentication, required\
    \ filter, malformed identifiers, page bounds) are not in this file. — const items: AcceptedFragmentItem[]\
    \ = rows.map((row) => ({\n    fragment_id: row.fragment_id,\n    text: row.fragment_text,\n    confidence:\
    \ Number(row.fragment_confidence),\n    llm_run_id: row.fragment_llm_run_id,\n    created_at: row.fragment_created_at.toISOString(),\n\
    \    source: {\n      raw_information_id: row.raw_information_id,\n      chunk_index: row.chunk_index,\n\
    \      source_type: toSourceType(row.source_type),\n      received_at: row.received_at.toISOString(),\n\
    \      document_title: row.document_title,\n    },\n  }));\n...\nreturn {\n    total,\n    limit:\
    \ input.limit,\n    offset: input.offset,\n    items,\n  };\nsrc/modules/query-retrieval/service/provenance.service.ts:\
    \ held at The three provenance operations in this file. getProvenanceByLinkService and getProvenanceByAttributeService\
    \ raise ResourceNotFoundError when the link or attribute is absent. getProvenanceByFragmentService\
    \ raises ResourceNotFoundError when no fragment is held and FragmentNotAcceptedError when its status\
    \ is not accepted. finalise() raises RawInformationDeletedError when a tombstone is found and EmptyProvenanceError\
    \ when the chain has no rows. groupChain() builds the fragment and chunk shape the contract lists.\
    \ The error codes and HTTP statuses are not declared in this file. They sit with the error classes\
    \ imported from ./errors.js and ../../knowledge-graph/service/errors.js. — if (!exists) throw new\
    \ ResourceNotFoundError(\"KnowledgeLink\", linkId);\nif (fragment.status !== \"accepted\") {\n  throw\
    \ new FragmentNotAcceptedError(fragmentId, fragment.status);\n}\nif (tombstone !== null) { ... throw\
    \ new RawInformationDeletedError(\n  tombstone.raw_information_id,\n  tombstone.performed_at\n);\n\
    if (rows.length === 0) { ... throw new EmptyProvenanceError(anchorKind, anchorId);\nraw_information:\
    \ { id: c.raw_information_id, source_type: toSourceType(c.source_type), received_at: c.received_at.toISOString(),\
    \ metadata: c.metadata, original_input: c.original_input ?? null }"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/accepted-fragment-filter
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at The ListAcceptedFragmentsInput\
    \ interface (lines 15-20) declares the filter's shape: an optional LLM run, an optional raw information,\
    \ and the page as limit and offset. — export interface ListAcceptedFragmentsInput {\n  readonly llm_run_id?:\
    \ string;\n  readonly raw_information_id?: string;\n  readonly limit: number;\n  readonly offset:\
    \ number;\n}"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: domain/knowledge-base/compliance-deletion
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/provenance.service.ts read
    `nowhere` — The shape is not declared in this file. The file only reads a row returned by findTombstone
    and passes tombstone.raw_information_id and tombstone.performed_at to RawInformationDeletedError.'
  observed_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/knowledge-link
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/provenance.service.ts read
    `nowhere` — The shape is not declared in this file. The file only checks existence with linkExists(client,
    linkId) and reads the chain with chainByLink.'
  observed_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/provenance.service.ts read
    `nowhere` — The shape is not declared in this file. The file only checks existence with attributeExists(client,
    attributeId) and reads the chain with chainByAttribute.'
  observed_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/source-type
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/accepted-fragments.service.ts
    read `nowhere` — This file only passes the value along: `source_type: toSourceType(row.source_type)`.
    The imported `toSourceType` comes from ../dto/response.dto.js. The enumeration of the seven values
    is not declared in this file.; src/modules/query-retrieval/service/provenance.service.ts read `nowhere`
    — The enumeration is not declared in this file. It only forwards the value through toSourceType(c.source_type),
    imported from ../dto/response.dto.js.'
  observed_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
pairs_omitted:
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-chunk
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/listing-total-before-pagination
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/listing-for-unknown-source-is-empty
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
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
notes: 'Judged by 2 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/comment-route-qr-8ab81f9.returns/.

  Candidates: 0 opened across 0 of 2 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/comment-route-qr-8ab81f9.returns/`, which are the evidence behind every entry above.
