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
- node: constraints/llm-toolset-omits-fragment-listing
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file is\
    \ a service function and registers no tool surface. — export async function listAcceptedFragmentsService(\n\
    \  client: PoolClient,\n  input: ListAcceptedFragmentsInput,\n  logger: Logger\n): Promise<AcceptedFragmentList>\
    \ {\nsrc/modules/query-retrieval/service/errors.ts: held at nowhere. The file declares errors only\
    \ and says nothing about which tools the language model's query surface exposes. — The file holds\
    \ five error classes (InvalidSearchQueryError, InvalidSearchLayerError, FragmentNotAcceptedError,\
    \ RawInformationDeletedError, EmptyProvenanceError) and no toolset declaration."
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: contracts/knowledge-base/retrieval
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at Only the accepted answer\
    \ of list-accepted-fragments, in the item mapping (lines 43-56) and the result envelope body (lines\
    \ 74-79). No refusal of the contract is held in this file: there is no filter-required check, no identifier-format\
    \ check and no limit or offset bound. — source: {\n  raw_information_id: row.raw_information_id,\n\
    \  chunk_index: row.chunk_index,\n  source_type: toSourceType(row.source_type),\n  received_at: row.received_at.toISOString(),\n\
    \  document_title: row.document_title,\n},\nsrc/modules/query-retrieval/service/errors.ts: held at\
    \ The five error classes, which carry each refusal's status and code. The authentication, VALIDATION_*\
    \ and RESOURCE_NOT_FOUND refusals, BUSINESS_UNKNOWN_LINK_TYPE and BUSINESS_INVALID_TRAVERSE_DEPTH\
    \ sit outside this file. — `statusCode = 422` / `\"BUSINESS_INVALID_SEARCH_QUERY\"`, `422` / `\"BUSINESS_INVALID_SEARCH_LAYER\"\
    `, `404` / `\"BUSINESS_FRAGMENT_NOT_ACCEPTED\"`, `410` / `\"BUSINESS_RAW_INFORMATION_DELETED\"`, `500`\
    \ / `\"SYSTEM_INTERNAL_ERROR\"`\nsrc/modules/query-retrieval/service/provenance.service.ts: held at\
    \ The three provenance read services, lines 27-66, and finalise(), lines 68-122. They cover the not-found,\
    \ not-accepted, deleted and empty-chain refusals and the accepted shape. The search and listing operations\
    \ are not in this file. — throw new ResourceNotFoundError(\"KnowledgeLink\", linkId); ... throw new\
    \ FragmentNotAcceptedError(fragmentId, fragment.status); ... throw new RawInformationDeletedError(...);\
    \ ... throw new EmptyProvenanceError(anchorKind, anchorId);"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/assertion-flag
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file has
    no search item and no assertion flag. — const items: AcceptedFragmentItem[] = rows.map((row) => ({

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file does not touch assertion
    flags. — No `uncertain`, `disputed` or `low-confidence` value appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/fragment-status
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The service
    never reads or writes a fragment status. Any accepted-status filtering is delegated to the repository,
    which is outside this file. — const total = await countAcceptedFragments(client, llmRunId, rawInformationId);

    src/modules/query-retrieval/service/errors.ts: held at FragmentNotAcceptedError carries a `status`
    string and names the `accepted` value in its message. It does not declare the enumeration. — `public
    readonly status: string;` and `InformationFragment ${fragmentId} is not in ''accepted'' status.`

    src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByFragmentService()
    line 60. The accepted member is used as a comparison. The status vocabulary is not redeclared in this
    file. — if (fragment.status !== "accepted") {'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/raw-chunk
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at The chunk_index field
    of the source block (line 51) is the only chunk fact the file carries. — chunk_index: row.chunk_index,

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file does not touch chunk attributes.
    — No chunk_index, offset, excerpt or locator appears in the file.

    src/modules/query-retrieval/service/provenance.service.ts: held at groupChain() lines 144-150. Each
    chunk is projected with its index, offsets, excerpt and locator. — chunk_index: c.chunk_index, offset_start:
    c.offset_start, offset_end: c.offset_end, excerpt: c.excerpt, locator: c.locator,'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/raw-information
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at The source block (lines
    49-55) carries the raw information''s identity, reception time and title. Its source type is carried
    as described under source-type. — raw_information_id: row.raw_information_id,

    received_at: row.received_at.toISOString(),

    document_title: row.document_title,

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file only carries the identity
    of a deleted raw information. — `public readonly rawInformationId: string;`

    src/modules/query-retrieval/service/provenance.service.ts: held at groupChain() lines 151-157. The
    raw information is projected with its source type, reception time, metadata and original input. —
    raw_information: { id: c.raw_information_id, source_type: toSourceType(c.source_type), received_at:
    c.received_at.toISOString(), metadata: c.metadata, original_input: c.original_input ?? null, },'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/chunk-match-never-surfaces
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file does
    no search. — const items: AcceptedFragmentItem[] = rows.map((row) => ({

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file has no search-item surfacing
    behavior. — No construct in the file relates to search items or layers being surfaced.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/compliance-refusal-takes-precedence
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file has
    no provenance read. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file declares the refusal class
    but not the order of refusals. — `export class RawInformationDeletedError extends Error` has no precedence
    logic.

    src/modules/query-retrieval/service/provenance.service.ts: held at Ordering in finalise(). The tombstone
    check at lines 76-92 comes before the empty-chain check at line 94. In the fragment read, the not-accepted
    refusal at lines 60-62 comes before the chain is read. — if (tombstone !== null) { ... throw new RawInformationDeletedError(
    ... } if (rows.length === 0) { ... throw new EmptyProvenanceError(anchorKind, anchorId);'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/empty-provenance-chain-refused
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file has
    no provenance read. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at EmptyProvenanceError, the refusal with status
    500 and code SYSTEM_INTERNAL_ERROR — `public readonly statusCode = 500;` and `public readonly code
    = "SYSTEM_INTERNAL_ERROR" as const;`

    src/modules/query-retrieval/service/provenance.service.ts: held at finalise(), lines 94-105. An empty
    chain is logged and refused. — if (rows.length === 0) { ... throw new EmptyProvenanceError(anchorKind,
    anchorId); }'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/expansion-decay
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file has
    no graph expansion or scoring. — const items: AcceptedFragmentItem[] = rows.map((row) => ({

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file does not score anything.
    — No score or hop computation appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/expansion-depth-bounds
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file has
    no expansion depth. — export interface ListAcceptedFragmentsInput {

    src/modules/query-retrieval/service/errors.ts: held at nowhere. BUSINESS_INVALID_TRAVERSE_DEPTH is
    not declared in this file. — No depth error class or bound appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/listing-excludes-compliance-deleted
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere in this file.
    The exclusion, if held, is in the repository queries that this service only calls, and the service
    itself applies no filter. — const total = await countAcceptedFragments(client, llmRunId, rawInformationId);

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file does not touch listing. —
    No listing construct appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/listing-order
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere in this file.
    The service passes rows through in the order the repository select returned them and sorts nothing.
    — const items: AcceptedFragmentItem[] = rows.map((row) => ({

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file does not touch listing order.
    — No ordering construct appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. limit is a
    plain number with no range check in this file. — readonly limit: number;

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The VALIDATION_OUT_OF_RANGE refusal
    is not declared in this file. — No page-limit error class appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file has
    no provenance read. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at RawInformationDeletedError, the refusal with
    status 410 and code BUSINESS_RAW_INFORMATION_DELETED, carrying the deletion time — `public readonly
    statusCode = 410;`, `public readonly code = "BUSINESS_RAW_INFORMATION_DELETED" as const;` and `public
    readonly deletedAt: Date;`

    src/modules/query-retrieval/service/provenance.service.ts: held at finalise(), lines 75-92. Every
    raw information id in the chain is checked, and a tombstone refuses the read. — const rawIds = Array.from(new
    Set(rows.map((r) => r.raw_information_id))); const tombstone = await findTombstone(client, rawIds);
    if (tombstone !== null) {'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file has
    no provenance read. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at FragmentNotAcceptedError, the refusal with
    status 404 and code BUSINESS_FRAGMENT_NOT_ACCEPTED — `public readonly statusCode = 404;` and `public
    readonly code = "BUSINESS_FRAGMENT_NOT_ACCEPTED" as const;`

    src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByFragmentService(),
    lines 60-62. — if (fragment.status !== "accepted") { throw new FragmentNotAcceptedError(fragmentId,
    fragment.status); }'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/search-excludes-compliance-deleted-sources
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file does
    no search. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file does not touch search filtering.
    — No search or filtering construct appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-layer-outside-set-refused
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file does
    no search. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at InvalidSearchLayerError, the refusal with status
    422 and code BUSINESS_INVALID_SEARCH_LAYER, naming the offending value and the allowed layers — `public
    readonly code = "BUSINESS_INVALID_SEARCH_LAYER" as const;` and `public readonly invalid: string;`'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-query-length
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file does
    no search. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason `too_long`,
    with code BUSINESS_INVALID_SEARCH_QUERY and status 422. The length check itself is not in this file.
    — `reason: "empty_after_trim" | "empty_after_parse" | "too_long"`'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-query-must-parse
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file does
    no search. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason `empty_after_parse`,
    with code BUSINESS_INVALID_SEARCH_QUERY and status 422 — `"empty_after_parse"` in the `reason` union
    and `public readonly statusCode = 422;`'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-ranking
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at nowhere. The file does
    no ranking. — export async function listAcceptedFragmentsService(

    src/modules/query-retrieval/service/errors.ts: held at nowhere. The file does not rank. — No ranking
    or ordering construct appears in the file.'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/accepted-fragment-filter
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at ListAcceptedFragmentsInput
    (lines 15-20) and the null-defaulting of both filters in listAcceptedFragmentsService (lines 27-28),
    passed together to the count and the select. — readonly llm_run_id?: string;

    readonly raw_information_id?: string;

    const llmRunId = input.llm_run_id ?? null;

    const rawInformationId = input.raw_information_id ?? null;'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at finalise(), lines 76-92. The
    tombstone lookup and the refusal that names the deletion. — const tombstone = await findTombstone(client,
    rawIds); if (tombstone !== null) { ... throw new RawInformationDeletedError( tombstone.raw_information_id,
    tombstone.performed_at );'
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/information-fragment
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at The row-to-item mapping
    at lines 43-56, which carries the fragment''s text, confidence, LLM run and creation time. — text:
    row.fragment_text,

    confidence: Number(row.fragment_confidence),

    llm_run_id: row.fragment_llm_run_id,

    created_at: row.fragment_created_at.toISOString(),

    src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByFragmentService()
    lines 56-62, and groupChain() lines 159-165. The fragment is looked up by identity and read only by
    status. Each fragment is returned with its text, confidence and status. — const fragment = await findFragmentStatus(client,
    fragmentId); ... fragments.push({ id: fragment.fragment_id, text: fragment.fragment_text, confidence:
    Number(fragment.fragment_confidence), status: fragment.fragment_status, chunks: provChunks });'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByLinkService(),
    lines 32-36. A missing link is refused, and the provenance chain is read by link. — const exists =
    await linkExists(client, linkId); if (!exists) throw new ResourceNotFoundError("KnowledgeLink", linkId);
    const rows = await chainByLink(client, linkId);'
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByAttributeService(),
    lines 44-48. A missing attribute is refused, and the provenance chain is read by attribute. — const
    exists = await attributeExists(client, attributeId); if (!exists) throw new ResourceNotFoundError("NodeAttribute",
    attributeId); const rows = await chainByAttribute(client, attributeId);'
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/page
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at The limit and offset\
    \ inputs (lines 18-19), passed to the select and echoed in the returned window (lines 74-79). — readonly\
    \ limit: number;\nreadonly offset: number;\nreturn {\n  total,\n  limit: input.limit,\n  offset: input.offset,\n\
    \  items,\n};"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: domain/knowledge-base/provenance
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at finalise() and groupChain(),
    lines 75-122 and 124-168. The chain rows are grouped into fragments with their raw chunks and returned
    as the read. — const fragments = groupChain(rows); ... return { fragments };'
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/search-layer
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchLayerError, the `allowed`
    field, line 28 — `public readonly allowed = ["fragment", "node", "chunk"] as const;`'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/source-type
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at The source_type field
    of the source block, converted with toSourceType (line 52). — source_type: toSourceType(row.source_type),

    src/modules/query-retrieval/service/provenance.service.ts: held at groupChain() line 153. The stored
    source type is mapped through toSourceType. The vocabulary itself is declared in the dto, which is
    outside this file set. — source_type: toSourceType(c.source_type),'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/layer-weights
  conforms: true
  how: 'src/modules/query-retrieval/repository/scoring.ts: held at the three exported constants, lines
    1, 3 and 5. — export const LAYER_WEIGHT_FRAGMENT = 1.0 as const;

    export const LAYER_WEIGHT_NODE = 0.9 as const;

    export const LAYER_WEIGHT_CHUNK = 0.6 as const;'
  encoded_at:
  - src/modules/query-retrieval/repository/scoring.ts
- node: rules/knowledge-base/listing-total-before-pagination
  conforms: true
  how: "src/modules/query-retrieval/service/accepted-fragments.service.ts: held at Line 30, the total\
    \ is obtained from countAcceptedFragments, a call that takes no limit or offset. The page is applied\
    \ only in the separate selectAcceptedFragments call, lines 34-40. — const total = await countAcceptedFragments(client,\
    \ llmRunId, rawInformationId);\nrows = await selectAcceptedFragments(\n  client,\n  llmRunId,\n  rawInformationId,\n\
    \  input.limit,\n  input.offset\n);"
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: rules/knowledge-base/search-query-not-blank
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason `empty_after_trim`,
    with code BUSINESS_INVALID_SEARCH_QUERY and status 422. The class carries the refusal, not the trim
    check. — `public readonly code = "BUSINESS_INVALID_SEARCH_QUERY" as const;` and `reason: "empty_after_trim"
    | "empty_after_parse" | "too_long"`'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: scenarios/knowledge-base/listing-for-unknown-source-is-empty
  conforms: true
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts: held at Lines 32-41 and 74-79.
    The rows start empty and the select runs only when total is above 0, so a source with no fragments
    returns total 0 and no items. The function returns normally, so the listing is accepted. — let rows:
    readonly AcceptedFragmentRow[] = [];

    if (total > 0) {'
  encoded_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: scenarios/knowledge-base/stop-words-only-query
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at InvalidSearchQueryError, reason `empty_after_parse`,
    which is the refusal a stop-words-only query meets — `reason === "empty_after_parse" ? "query parsed
    by websearch_to_tsquery is empty"` with `statusCode = 422`'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
unstated:
- file: src/modules/query-retrieval/service/errors.ts
  where: EmptyProvenanceError constructor, the message passed to super(), line 75
  evidence: '`provenance chain is empty for ${anchorKind} ${anchorId} (legacy-data inconsistency).`'
  cost: The message tells whoever reads the failure that an empty provenance chain comes from legacy data.
    The specification only says such a read is refused with SYSTEM_INTERNAL_ERROR. It never says where
    an empty chain comes from. The code therefore holds a claim about cause that looks like a business
    decision. A later reader would look for it in the specification and not find it.
restates:
- file: src/modules/query-retrieval/service/errors.ts
  where: InvalidSearchQueryError constructor, the `too_long` branch of the message, line 16
  evidence: '`"query exceeds 1000 characters"`'
  cost: The 1000-character limit is written into a message string in this file. The node holds it and
    this file is not bound to that fact. If the node's limit moves, this text keeps saying 1000 and nothing
    reaches it. The message is prose about a value held elsewhere. The check that enforces it is not in
    this file, so I did not judge that part.
  node: rules/knowledge-base/search-query-length
unbound:
- src/modules/query-retrieval/index.ts
adopted: true
notes: 'Judged by 5 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-query-retrieval-r3.returns/.

  Staged as an adoption of source no delivery wrote: 21 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 0 opened across 0 of 5 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 1 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-query-retrieval-r3.returns/`, which are the evidence behind every entry above.
