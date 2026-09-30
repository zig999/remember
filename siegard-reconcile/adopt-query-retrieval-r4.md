---
contract_version: siegard-reconcile/8
title: Second adoption of the query-retrieval files the comment route touched (context query-retrieval)
summary: The five query-retrieval files named here had every comment removed by the comment route, in
  commit 8ab81f9, with no code and no emitted text changed; the human states the source is otherwise adopted
  as it stands. The 21 nodes the re-fold left unbound are the candidates, and these files' standing bindings
  drifted by that removal and are judged again with them.
target: backend
files:
- path: src/modules/query-retrieval/index.ts
  change: Behaves as before — its comments were removed by the comment route and no code changed; adopted
    as it stands.
- path: src/modules/query-retrieval/repository/scoring.ts
  change: Behaves as before — its comments were removed by the comment route and no constant changed;
    adopted as it stands.
- path: src/modules/query-retrieval/service/accepted-fragments.service.ts
  change: Behaves as before — its comments were removed by the comment route and no code or log line changed;
    adopted as it stands.
- path: src/modules/query-retrieval/service/errors.ts
  change: Behaves as before — its comments were removed by the comment route and no code or error message
    changed; adopted as it stands.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Behaves as before — its comments were removed by the comment route and no code or log line changed;
    adopted as it stands.
nodes:
- node: contracts/knowledge-base/retrieval
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the accepted answer\
    \ of list-accepted-fragments, at the item mapping (lines 43-56) and the returned page (lines 74-79).\
    \ The refusals are not held in this file. — source: {\n      raw_information_id: row.raw_information_id,\n\
    \      chunk_index: row.chunk_index,\n      source_type: toSourceType(row.source_type),\n      received_at:\
    \ row.received_at.toISOString(),\n      document_title: row.document_title,\n    },\nsrc/modules/query-retrieval/service/errors.ts:\
    \ held at Five error classes, which carry the status and code of the search-query, search-layer, fragment-not-accepted,\
    \ raw-information-deleted and empty-provenance refusals. The other refusals the contract lists (authentication,\
    \ unknown link type, traverse depth, validation format and range) are not in this file. — statusCode\
    \ = 422 / \"BUSINESS_INVALID_SEARCH_LAYER\"; statusCode = 404 / \"BUSINESS_FRAGMENT_NOT_ACCEPTED\"\
    ; statusCode = 410 / \"BUSINESS_RAW_INFORMATION_DELETED\"; statusCode = 500 / \"SYSTEM_INTERNAL_ERROR\"\
    \nsrc/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByLinkService, getProvenanceByAttributeService\
    \ and getProvenanceByFragmentService, which carry the three provenance reads' accepted shape and domain\
    \ refusals. The search and list-accepted-fragments operations are not in this file. — throw new ResourceNotFoundError(\"\
    InformationFragment\", fragmentId);\nthrow new FragmentNotAcceptedError(fragmentId, fragment.status);\n\
    throw new RawInformationDeletedError(\nthrow new EmptyProvenanceError(anchorKind, anchorId);\nraw_information:\
    \ {\n  id: c.raw_information_id,\n  source_type: toSourceType(c.source_type),\n  received_at: c.received_at.toISOString(),\n\
    \  metadata: c.metadata,\n  original_input: c.original_input ?? null,\n},"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/fragment-status
  conforms: true
  how: "src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByFragmentService(),\
    \ the comparison against the accepted status — if (fragment.status !== \"accepted\") {\n  throw new\
    \ FragmentNotAcceptedError(fragmentId, fragment.status);\n}"
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/raw-chunk
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the chunk_index carried
    into source.chunk_index at line 51. The other raw-chunk attributes are not touched here. — chunk_index:
    row.chunk_index,

    src/modules/query-retrieval/service/provenance.service.ts: held at groupChain(), the ProvenanceChunk
    mapping of each chunk row — id: c.raw_chunk_id,

    chunk_index: c.chunk_index,

    offset_start: c.offset_start,

    offset_end: c.offset_end,

    excerpt: c.excerpt,

    locator: c.locator,'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/raw-information
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the source block at\
    \ lines 49-55, which carries the raw information identity, reception time and title — raw_information_id:\
    \ row.raw_information_id,\n...\nreceived_at: row.received_at.toISOString(),\n      document_title:\
    \ row.document_title,\nsrc/modules/query-retrieval/service/provenance.service.ts: held at groupChain(),\
    \ the raw_information object carried by each provenance chunk — raw_information: {\n  id: c.raw_information_id,\n\
    \  source_type: toSourceType(c.source_type),\n  received_at: c.received_at.toISOString(),\n  metadata:\
    \ c.metadata,\n  original_input: c.original_input ?? null,\n},"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/compliance-refusal-takes-precedence
  conforms: true
  how: "src/modules/query-retrieval/service/provenance.service.ts: held at Order of checks. The fragment\
    \ read refuses a non-accepted fragment first, then finalise() refuses on the tombstone before the\
    \ empty-chain check. — if (fragment.status !== \"accepted\") {\n  throw new FragmentNotAcceptedError(fragmentId,\
    \ fragment.status);\n}\n...\nif (tombstone !== null) {\n...\n  throw new RawInformationDeletedError(\n\
    ...\nif (rows.length === 0) {\n...\n  throw new EmptyProvenanceError(anchorKind, anchorId);"
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/empty-provenance-chain-refused
  conforms: true
  how: "src/modules/query-retrieval/service/errors.ts: held at EmptyProvenanceError, statusCode 500 and\
    \ code SYSTEM_INTERNAL_ERROR (lines 67-81) — public readonly statusCode = 500; public readonly code\
    \ = \"SYSTEM_INTERNAL_ERROR\" as const;\nsrc/modules/query-retrieval/service/provenance.service.ts:\
    \ held at finalise(), the empty-chain branch — if (rows.length === 0) {\n...\n  throw new EmptyProvenanceError(anchorKind,\
    \ anchorId);\n}"
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at RawInformationDeletedError, statusCode
    410 and code BUSINESS_RAW_INFORMATION_DELETED, carrying rawInformationId and deletedAt (lines 51-65)
    — public readonly statusCode = 410; public readonly code = "BUSINESS_RAW_INFORMATION_DELETED" as const;

    src/modules/query-retrieval/service/provenance.service.ts: held at finalise(), the tombstone lookup
    over every raw information id in the chain — const rawIds = Array.from(new Set(rows.map((r) => r.raw_information_id)));

    const tombstone = await findTombstone(client, rawIds);

    if (tombstone !== null) {'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  conforms: true
  how: "src/modules/query-retrieval/service/errors.ts: held at FragmentNotAcceptedError, statusCode 404\
    \ and code BUSINESS_FRAGMENT_NOT_ACCEPTED (lines 37-49) — public readonly statusCode = 404; public\
    \ readonly code = \"BUSINESS_FRAGMENT_NOT_ACCEPTED\" as const;\nsrc/modules/query-retrieval/service/provenance.service.ts:\
    \ held at getProvenanceByFragmentService(), the status guard before the chain is read — if (fragment.status\
    \ !== \"accepted\") {\n  throw new FragmentNotAcceptedError(fragmentId, fragment.status);\n}"
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/search-layer-outside-set-refused
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchLayerError, statusCode 422,
    code BUSINESS_INVALID_SEARCH_LAYER, and the `invalid` and `allowed` fields (lines 24-35) — public
    readonly code = "BUSINESS_INVALID_SEARCH_LAYER" as const; public readonly invalid: string; public
    readonly allowed = ["fragment", "node", "chunk"] as const;'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-query-length
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason "too_long"
    (lines 4-9). The limit is not enforced in this file. The value 1000 appears only in the message text,
    which is reported as a finding. — reason: "empty_after_trim" | "empty_after_parse" | "too_long"; ...
    : "query exceeds 1000 characters"'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-query-must-parse
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason "empty_after_parse"
    (lines 4, 12-13) — reason === "empty_after_parse" ? "query parsed by websearch_to_tsquery is empty"'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/accepted-fragment-filter
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at ListAcceptedFragmentsInput\
    \ (lines 15-20) and the filter arguments passed at lines 27-28 and 30-40 — readonly llm_run_id?: string;\n\
    \  readonly raw_information_id?: string;\n...\nconst llmRunId = input.llm_run_id ?? null;\n  const\
    \ rawInformationId = input.raw_information_id ?? null;"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "src/modules/query-retrieval/service/provenance.service.ts: held at finalise(), the tombstone branch\
    \ that throws RawInformationDeletedError with the deletion's raw information and time — const tombstone\
    \ = await findTombstone(client, rawIds);\nif (tombstone !== null) {\n...\n  throw new RawInformationDeletedError(\n\
    \    tombstone.raw_information_id,\n    tombstone.performed_at\n  );"
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/information-fragment
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the row-to-item mapping\
    \ at lines 43-56, which carries text, confidence, llm_run_id and created_at — text: row.fragment_text,\n\
    \    confidence: Number(row.fragment_confidence),\n    llm_run_id: row.fragment_llm_run_id,\n    created_at:\
    \ row.fragment_created_at.toISOString(),\nsrc/modules/query-retrieval/service/provenance.service.ts:\
    \ held at groupChain(), the ProvenanceFragment built from each fragment row — fragments.push({\n \
    \ id: fragment.fragment_id,\n  text: fragment.fragment_text,\n  confidence: Number(fragment.fragment_confidence),\n\
    \  status: fragment.fragment_status,\n  chunks: provChunks,\n});"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByLinkService(),
    the existence check and the chain read anchored on a link — const exists = await linkExists(client,
    linkId);

    if (!exists) throw new ResourceNotFoundError("KnowledgeLink", linkId);

    const rows = await chainByLink(client, linkId);'
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByAttributeService(),
    the existence check and the chain read anchored on an attribute — const exists = await attributeExists(client,
    attributeId);

    if (!exists) throw new ResourceNotFoundError("NodeAttribute", attributeId);

    const rows = await chainByAttribute(client, attributeId);'
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/page
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the limit and offset\
    \ fields of the input (lines 18-19), which are passed on and echoed in the result (lines 74-79) —\
    \ readonly limit: number;\n  readonly offset: number;\n...\nlimit: input.limit,\n    offset: input.offset,"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: domain/knowledge-base/provenance
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at finalise() and groupChain(),
    which turn the provenance chain rows into fragments with their chunks — const fragments = groupChain(rows);

    ...

    return { fragments };'
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/search-layer
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchLayerError, the `allowed`
    field (line 28) — public readonly allowed = ["fragment", "node", "chunk"] as const;'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/source-type
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/accepted-fragments.service.ts
    read `nowhere` — The enumeration''s value set is not declared in this file. The file only calls `source_type:
    toSourceType(row.source_type)`, and the function is imported from ../dto/response.dto.js.; src/modules/query-retrieval/service/provenance.service.ts
    read `nowhere` — The file only calls `source_type: toSourceType(c.source_type)`, imported from ../dto/response.dto.js.
    It declares no source-type vocabulary itself.'
  observed_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/layer-weights
  conforms: true
  how: 'src/modules/query-retrieval/repository/scoring.ts: held at the three exported constants, lines
    1, 3 and 5 — export const LAYER_WEIGHT_FRAGMENT = 1.0 as const;

    export const LAYER_WEIGHT_NODE = 0.9 as const;

    export const LAYER_WEIGHT_CHUNK = 0.6 as const;'
  encoded_at:
  - src/modules/query-retrieval/repository/scoring.ts
- node: rules/knowledge-base/listing-total-before-pagination
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at line 30, where the\
    \ total is counted by a call that receives no limit or offset, separately from the page select at\
    \ lines 34-40 — const total = await countAcceptedFragments(client, llmRunId, rawInformationId);\n\
    ...\nrows = await selectAcceptedFragments(\n      client,\n      llmRunId,\n      rawInformationId,\n\
    \      input.limit,\n      input.offset\n    );"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: rules/knowledge-base/search-query-not-blank
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason "empty_after_trim"
    with statusCode 422 and code BUSINESS_INVALID_SEARCH_QUERY (lines 2-4, 14-15) — public readonly code
    = "BUSINESS_INVALID_SEARCH_QUERY" as const; ... reason === "empty_after_trim" ? "query is empty after
    trim"'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: scenarios/knowledge-base/listing-for-unknown-source-is-empty
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at lines 30-41 and 74-79.\
    \ A zero count skips the select and returns total 0 with no items, with no refusal branch. — let rows:\
    \ readonly AcceptedFragmentRow[] = [];\n  if (total > 0) {\n...\nreturn {\n    total,\n    limit:\
    \ input.limit,\n    offset: input.offset,\n    items,\n  };"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: scenarios/knowledge-base/stop-words-only-query
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason "empty_after_parse",
    the refusal a query with no search term meets (lines 4, 12-13) — reason === "empty_after_parse" ?
    "query parsed by websearch_to_tsquery is empty"'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
restates:
- file: src/modules/query-retrieval/service/errors.ts
  where: InvalidSearchQueryError constructor, the message chosen for reason "too_long" (line 16)
  evidence: '"query exceeds 1000 characters"'
  cost: The 1000-character limit appears in this file as a literal inside message text. If the limit in
    the node moves, this string keeps saying 1000, and the owner sees a refusal that names a limit the
    specification no longer holds. The file states no other value for the limit, so a reader who finds
    it here has no sign that the node is where it was decided.
  node: rules/knowledge-base/search-query-length
unbound:
- src/modules/query-retrieval/index.ts
adopted: true
unheld:
- node: constraints/llm-toolset-omits-fragment-listing
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/assertion-flag
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/chunk-match-never-surfaces
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/expansion-decay
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/expansion-depth-bounds
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/listing-excludes-compliance-deleted
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/listing-order
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/page-limit-bounds
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/search-excludes-compliance-deleted-sources
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/search-ranking
  how: 'read on 5 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 5 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-query-retrieval-r4.returns/.

  Staged as an adoption of source no delivery wrote: 21 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 0 opened across 0 of 5 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 1 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-query-retrieval-r4.returns/`, which are the evidence behind every entry above.
