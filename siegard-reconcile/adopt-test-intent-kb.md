---
contract_version: siegard-reconcile/8
title: Adopt backend sources against the 12 knowledge-base test-intent candidates
summary: The backend sources named are adopted as they stand and did not change; the candidates are the
  12 knowledge-base rule and contract nodes the test-intent analysis wrote or amended, whose facts the
  tests exercise.
target: backend
files:
- path: src/middleware/auth.ts
  change: adopted as it stands; unchanged
- path: src/middleware/error-handler.ts
  change: adopted as it stands; unchanged
- path: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/compliance-audit/dto/curation-action.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/compliance-audit/mcp/compliance-toolset.ts
  change: adopted as it stands; unchanged
- path: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/compliance-audit/service/compliance-audit.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/compliance-audit/service/errors.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/dto/dispute.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/dto/entity-match.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/dto/enums.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/dto/item.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/dto/queue.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/mcp/curation-toolset.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/mcp/curation-transport.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/mcp/error-envelope.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/repository/curation.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/routes/curation.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/service/dispute.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/service/entity-match.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/service/item.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/curation/service/merge.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/catalog/catalog.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/chunker/config.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/chunker/v1.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/dto/index.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/dto/llm-run.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/dto/propose-link.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/hash.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/handler-base.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/ingest-document.handler.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/ingest-toolset.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/mcp-schemas.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/propose-fragment.handler.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/mcp/transport.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/prompts/extraction.v1.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/prompts/extraction.v2.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/prompts/extraction.v3.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/prompts/index.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/repository/ingestion.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/repository/llm-run.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/routes/ingestion.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/affected-nodes.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/directed-ingestion.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/entity-resolution.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/extraction.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/graph-consolidation.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/ingestion.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/llm-run.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/propose-attribute.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/propose-fragment.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/service/propose-link.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/validation/confidence.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/validation/errors.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/validation/graph-rules.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/validation/structural.ts
  change: adopted as it stands; unchanged
- path: src/modules/ingestion/validation/temporal.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/dto/queries.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/mcp/query-toolset.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/repository/catalog.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/repository/graph.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/repository/temporal-filter.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/service/catalog.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/service/formatters.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/service/history.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/service/node.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/service/norm.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/service/traversal.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/knowledge-graph/traversal/config.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/dto/fragment.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/dto/search.dto.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/mcp/query-toolset.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/repository/scoring.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/repository/search.repository.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/service/accepted-fragments.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/service/errors.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/service/search.service.ts
  change: adopted as it stands; unchanged
- path: src/shared/error-mapping.ts
  change: adopted as it stands; unchanged
- path: src/shared/health.ts
  change: adopted as it stands; unchanged
nodes:
- node: contracts/knowledge-base/retrieval
  conforms: false
  how: "src/middleware/error-handler.ts, branch 3 of classify(), the isFastifyValidationError case, lines\
    \ 110-123: message: err.message ?? \"Request payload failed validation.\",\ndetails: err.validation,\
    \ — The retrieval contract answers a malformed or unknown parameter with VALIDATION_INVALID_FORMAT,\
    \ the message \"Request payload failed validation.\", and each failing field listed with its path\
    \ and message. A retrieval request rejected by Fastify's own schema validation gets the framework\
    \ message and the raw validation array instead, so the retrieval answer differs depending on which\
    \ validator ran.\nsrc/modules/knowledge-graph/routes/knowledge-graph.routes.ts, The handlers of GET\
    \ /node-types (line 81), /links/:link_id (line 186), /attributes/:attribute_id (line 205), /links/:link_id/history\
    \ (line 271), /attributes/:attribute_id/history (line 290) and /nodes/:node_id/attributes/:key/history\
    \ (line 311). None of them parses `request.query`.: app.get(\"/node-types\", async (_req, reply) =>\n\
    \  withReadOnly(deps.pool, async (client) => {\n    const body = await listNodeTypesService(client);\n\
    ... const params = LinkIdParamSchema.parse(request.params); try {\n  return await withReadOnly(deps.pool,\
    \ async (client) => {\n    const body = await getLinkByIdService(\nThe contract's refusal for list-node-types,\
    \ read-link, read-attribute, read-link-history, read-attribute-history and read-attribute-key-history\
    \ reads: \"A parameter is malformed or unknown: ... or a parameter the operation does not define.\"\
    \ -> \"HTTP 422, error code VALIDATION_INVALID_FORMAT\". The routes that do parse a query (`ListLinkTypesQuerySchema.parse(request.query\
    \ ?? {})` and the others) use `.strict()` schemas from `dto/queries.dto.ts`. — Over REST, a request\
    \ to these six operations that carries an undefined query parameter is answered as accepted, where\
    \ the node says HTTP 422 VALIDATION_INVALID_FORMAT. A caller who misspells a parameter gets no refusal\
    \ and a result that ignores it. The MCP counterpart (`ListNodeTypesInputSchema = z.object({}).strict()`)\
    \ does refuse, so the two transports of one operation disagree.\nsrc/modules/query-retrieval/routes/query-retrieval.routes.ts,\
    \ the /search handler, line 60 (the parse sits before the try block), with handleSearchError / isMappableSearchError,\
    \ lines 200-221: const query = SearchQuerySchema.parse(request.query ?? {}); ... err instanceof InvalidSearchQueryError\
    \ || err instanceof InvalidSearchLayerError || err instanceof UnknownLinkTypeError — The contract\
    \ answers a blank, over-long or unparseable search query with HTTP 422 BUSINESS_INVALID_SEARCH_QUERY,\
    \ and an expansion depth outside the bounds with HTTP 422 BUSINESS_INVALID_TRAVERSE_DEPTH. Here the\
    \ query schema is parsed outside the try block, and the mappable set has no depth error. In search.dto.ts\
    \ the schema rejects those inputs (min 1, max 1000, empty after trim, `expand_depth` min(1).max(3)).\
    \ middleware/error-handler.ts maps every ZodError to 422 VALIDATION_INVALID_FORMAT with the message\
    \ \"Request payload failed validation.\". A REST caller therefore gets a code the contract does not\
    \ give for these refusals, and a client that branches on the contract's codes never sees them.\nsrc/modules/query-retrieval/routes/query-retrieval.routes.ts,\
    \ the /search handler line 60 and the /fragments/accepted handler line 168, where the query is parsed\
    \ with no mapping of limit or offset refusals: const query = SearchQuerySchema.parse(request.query\
    \ ?? {}); ... // ZodError -> 422 VALIDATION_INVALID_FORMAT via the global handler. const query = ListAcceptedFragmentsQuerySchema.parse(request.query\
    \ ?? {}); — For search and for the accepted-fragment listing the contract answers a page limit or\
    \ offset out of bounds with HTTP 422 VALIDATION_OUT_OF_RANGE. These routes hand the ZodError to the\
    \ global handler, which answers VALIDATION_INVALID_FORMAT. The code a client receives differs from\
    \ the one the contract publishes."
  observed_at:
  - src/middleware/error-handler.ts
  - src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
- node: rules/knowledge-base/accepted-fragment-listing-refuses-unknown-parameter
  conforms: true
  how: 'src/modules/query-retrieval/dto/fragment.dto.ts: held at the `.strict()` call on the ListAcceptedFragmentsQuerySchema
    object, line 38 — z.object({ llm_run_id: ..., raw_information_id: ..., limit: ..., offset: ... }).strict()'
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
- node: rules/knowledge-base/affected-nodes-omit-absent
  conforms: false
  how: "src/modules/ingestion/service/llm-run.service.ts, getLlmRunById, lines 104-119 (the completed-run\
    \ branch that reads the cache before deriving): const cached = getCachedAffectedNodes(llmRunId); if\
    \ (cached !== undefined) {\n  affectedNodes = cached;\n} else {\n  try {\n    const derived = await\
    \ deriveAffectedNodes(client, llmRunId);\n    setCachedAffectedNodes(llmRunId, derived); — A cache\
    \ hit returns the stored list as it was when it was first derived, with no re-check that each node\
    \ is still held. The cache in affected-nodes.ts is a process-scoped LRU, and the only deletes I saw\
    \ were LRU eviction and the test-only clear. A node deleted after that first read can therefore still\
    \ appear in the run's affected nodes. The rule says such a node is left out, and only a cache miss\
    \ applies it. Whether a read shows the node then depends on whether the process has the run cached."
  observed_at:
  - src/modules/ingestion/service/llm-run.service.ts
- node: rules/knowledge-base/audit-listing-accepts-open-window
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ListComplianceDeletionsQuerySchema,
    lines 80-98: both window bounds are optional, and the ordering check runs only when both are present.
    — executed_from: z.string().datetime({ offset: true }).optional(), executed_to: z.string().datetime({
    offset: true }).optional(), ... if (value.executed_from && value.executed_to) {

    src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at listComplianceDeletions,
    lines 317-328. Each window bound is added only when present, so either bound can be given alone. —
    if (f.executed_from) { where.push(`executed_at >= $${i++}`); ... } if (f.executed_to) { where.push(`executed_at
    < $${i++}`); ... }'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/chunking-deterministic
  conforms: true
  how: 'src/modules/ingestion/chunker/v1.ts: held at chunkV1, lines 62-131, and the helpers it calls.
    It is a pure function of (content, sourceType): `Array.from(content)`, fixed boundary rules, and a
    segmenter with a fixed "pt" locale. It uses no clock, no randomness and no external state. — "export
    function chunkV1(content: string, sourceType: SourceType): RawChunkInput[] {" and "const segmenter
    = new Intl.Segmenter("pt", { granularity: "sentence" });"'
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
- node: rules/knowledge-base/concurrent-proposals-resolve-in-turn
  conforms: true
  how: "src/modules/ingestion/service/entity-resolution.service.ts: held at resolveOrCreateNode, lines\
    \ 119-128, the advisory lock taken before the first node_alias read — await client.query(\n    `SELECT\
    \ pg_advisory_xact_lock(hashtextextended($1::text, 0))`,\n    [lockKey]\n  );\nThe key is built from\
    \ `node_type_id || E'\\\\x1F' || norm($2::text)`. The lock is taken before the exact-match SELECT\
    \ on node_alias (line 131) and the trigram candidate query (line 156)."
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: rules/knowledge-base/confirmation-keeps-assertion-values
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at confirmItem (lines 198-221) —
    `UPDATE knowledge_link SET status = ''active'' WHERE id = $1 AND status = ''uncertain''` and `UPDATE
    node_attribute SET status = ''active'' WHERE id = $1 AND status = ''uncertain''`. Only status is set;
    confidence, valid_from, valid_to and superseded_at are left untouched.'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/extraction-prompt-lists-closed-values
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v1.ts: held at the valuesSuffix expression inside the
    attribute-key loop of system(), lines 105-115 — `const domain = domainOf(catalog, ak.id); const valuesSuffix
    = domain !== null ? `, values: [${[...domain].sort().map((v) => JSON.stringify(v)).join(",")}]` :
    "";` The values are appended beside the key, and the suffix is the empty string for an open key.'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/extraction-prompt-values-ascending
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v1.ts: held at the `.sort()` call on the spread domain
    inside valuesSuffix in system(), line 109 — `${[...domain].sort().map((v) => JSON.stringify(v)).join(",")}`
    Default string order, applied whatever order the Set holds.'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/extraction-prompt-values-verbatim
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v1.ts: held at the `.map((v) => JSON.stringify(v))` step
    in valuesSuffix in system(), line 110 — `.sort().map((v) => JSON.stringify(v)).join(",")` The values
    come straight from `domainOf(catalog, ak.id)` and are not altered, so accents are kept as validation
    compares them.'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/non-expanding-search-walks-no-graph
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at The guard at line 271, `if (input.expand\
    \ && nodeHits.length > 0)`, around the only call to traverseNodes. Link-type resolution is also skipped\
    \ when `expand` is false (lines 106-108). — if (input.expand && nodeHits.length > 0) {\nconst traversal\
    \ = await traverseNodes(\nconst linkTypeIds = input.expand\n  ? resolveLinkTypeIds(catalog, input.expandLinkTypes)\n\
    \  : undefined;"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/reaffirmation-consolidates
  conforms: false
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts, the re-affirmation condition in
    consolidateAttributeOnce, lines 776-784, and the closing comment at lines 852-854: "if (\n      sameValue
    &&\n      sameValidFrom &&\n      args.change_hint === \"none\"\n    ) {" and "different valid_from\n    //
    on a multi-valued attribute is coexistence)." — The node (statement, final decision in its log) requires
    the same validity start to re-affirm only for a type that does not allow multiple current assertions.
    The attribute branch requires `sameValidFrom` for multi-current attribute keys as well. A multi-current
    attribute re-stated with change hint none and a different validity start therefore falls through to
    (e) and inserts a new row, where the node says it re-affirms and records no new assertion. The link
    branch applies `(!functional || sameValidFrom)`, so links and attributes decide differently for the
    same case. The comment calls this "coexistence", a rule no node holds and the node''s log reads against.'
  observed_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: domain/knowledge-base/raw-chunk
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/chunker/v1.ts, src/modules/ingestion/dto/ingest-raw-information.dto.ts,
    src/modules/ingestion/repository/ingestion.repository.ts, and src/modules/ingestion/repository/llm-run.repository.ts
    read `nowhere` — The file only reads raw_chunk columns inside queries, for example `FROM raw_chunk
    WHERE id = ANY($1::uuid[]) AND raw_information_id = $2`. It declares no shape for the element.; src/modules/ingestion/service/ingestion.service.ts
    read `nowhere` — The file declares no chunk shape. It passes chunk inputs to insertRawChunks and reads
    chunk fields only to build a response: "id: c.id, chunk_index: c.chunk_index, offset_start: c.offset_start,
    offset_end: c.offset_end". The shape is declared elsewhere.; src/modules/query-retrieval/service/accepted-fragments.service.ts
    read `nowhere` — The file declares no shape for the chunk. It only forwards one field of a row declared
    elsewhere: `chunk_index: row.chunk_index`.; src/modules/query-retrieval/service/provenance.service.ts
    read `nowhere` — The file declares no shape for the element. groupChain() only copies row fields into
    an imported ProvenanceChunk: `chunk_index: c.chunk_index, offset_start: c.offset_start, offset_end:
    c.offset_end, excerpt: c.excerpt, locator: c.locator`. — a binding asserts the file answers for the
    node, so the pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/chunker/v1.ts
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/repository/ingestion.repository.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/raw-information
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/dto/ingest-raw-information.dto.ts,
    src/modules/ingestion/mcp/mcp-schemas.ts, src/modules/ingestion/repository/ingestion.repository.ts,
    and src/modules/ingestion/prompts/extraction.v1.ts read `nowhere` — `export interface DocumentMetadata
    { readonly source_type: string; readonly received_at: string; readonly document_date: string | null;
    readonly title: string | null; }` only carries four fields of the raw information into the prompt.
    It is not the declared shape of the element.; src/modules/ingestion/repository/llm-run.repository.ts
    read `nowhere` — The file declares RecentIngestionRow, a projection of some raw_information columns
    (`raw_information_id`, `source_type`, `raw_status`, `received_at`, `content_preview`) and not the
    element''s shape. It declares no type for raw_information itself.; src/modules/ingestion/service/ingestion.service.ts
    read `nowhere` — The file declares no raw-information shape. It only forwards values to insertRawInformation:
    "source_type: input.source_type, content: input.content, content_hash: contentHash, metadata: input.metadata,
    original_input: input.original_input ?? null".; src/modules/query-retrieval/service/accepted-fragments.service.ts
    read `nowhere` — The file declares no shape for the raw information. It only passes values along from
    the row: `raw_information_id: row.raw_information_id`, `received_at: row.received_at.toISOString()`,
    `document_title: row.document_title`.; src/modules/query-retrieval/service/provenance.service.ts read
    `nowhere` — The file declares no shape for the element. groupChain() only copies row fields into the
    nested object: `raw_information: { id: c.raw_information_id, source_type: toSourceType(c.source_type),
    received_at: c.received_at.toISOString(), metadata: c.metadata, original_input: c.original_input ??
    null }`. — a binding asserts the file answers for the node, so the pair that stopped holding it is
    released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/repository/ingestion.repository.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/curation-reason-not-blank
  conforms: false
  how: 'src/modules/curation/dto/enums.dto.ts, lines 50-56, ReasonRequiredSchema and ReasonOptionalSchema:
    export const ReasonRequiredSchema = z.string().trim().min(1); — The not-blank rule for a curation
    reason is implemented here, a second time beside the other file the rule is bound to (src/modules/curation/mcp/error-envelope.ts
    per the candidate index). This file is not bound to the rule. If the rule changes, this schema is
    missed, and nobody can tell which implementation was decided.'
  observed_at:
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/dispute-resolution-distinct-items
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/mcp/error-envelope.ts read `nowhere` —
    The file holds no check on item_ids count or duplicates. It maps only the winner, periods and temporal
    custom codes and the generic fallback `code: "VALIDATION_INVALID_FORMAT"`.'
  observed_at:
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/review-queue-total-before-pagination
  conforms: false
  how: 'src/modules/curation/repository/curation.repository.ts, countDisputedLinks (lines 642-647) and
    countDisputedAttributes (lines 690-697): `SELECT count(*)::text AS total FROM knowledge_link WHERE
    status = ''disputed''` and `SELECT count(*)::text AS total FROM node_attribute WHERE status = ''disputed''`
    — Each count returns one per disputed item. The disputed queue lists one entry per dispute scope,
    and a scope can hold several items. The total therefore exceeds the number of entries the queue holds
    whenever a dispute has more than one item. The decision log beside the node names this as the material
    it replaced. A reader of the queue total gets a count of items, not of entries.'
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
unstated:
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: the registerTool call, lines 139-143
  evidence: "deps.mcp.registerTool(\"curation\", {\n    name: \"compliance_delete\",\n    description:\n\
    \      \"Tombstone a RawInformation under LGPD or owner request. Idempotent.\","
  cost: The tool's name, its placement in the curation toolset and its description are what an MCP client
    sees. The compliance-audit contract says only "over MCP" and names no tool, toolset or description.
    The name and placement therefore live only in this file, and a reader looking in the specification
    for how a client reaches compliance deletion over MCP finds nothing.
- file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: lines 301-318 (rowToDto) and 338-347 (coerceNonNegativeInt)
  evidence: '"defensively coerce missing keys to 0 so the response always satisfies the Zod contract on
    the read path even if a legacy row carries a partial blob." chunks: coerceNonNegativeInt(a.chunks),
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) { return Math.trunc(v); } ... return 0;'
  cost: A stored count that is absent, negative, non-numeric or fractional is reported to the owner as
    0 or a truncated integer, so an audit record can state "0 fragments deleted" for a deletion whose
    count was never recorded. The nodes say only that each count is zero or more. The substitution rule
    lives only in this converter, and the next reader will look for it in the specification and not find
    it.
- file: src/modules/curation/mcp/error-envelope.ts
  where: ZOD_CUSTOM_CODE_PRIORITY (lines 22-31) and its use in mapZodError (lines 70-79)
  evidence: "const ZOD_CUSTOM_CODE_PRIORITY: readonly string[] = [\n  \"BUSINESS_TARGET_NODE_REQUIRED\"\
    ,\n  \"BUSINESS_REASON_REQUIRED\",\n  \"BUSINESS_SELF_MERGE_FORBIDDEN\",\n  \"BUSINESS_DISPUTE_WINNER_REQUIRED\"\
    ,\n  \"BUSINESS_DISPUTE_PERIODS_REQUIRED\",\n  \"BUSINESS_TEMPORAL_INCOHERENT\",\n  \"BUSINESS_CORRECTION_NO_CHANGES\"\
    ,\n  \"BUSINESS_DATE_UNJUSTIFIED\",\n]; ... for (const code of ZOD_CUSTOM_CODE_PRIORITY) { if (seen.has(code))\
    \ { ... return mapped(status, \"warn\", {"
  cost: This list decides which refusal code and message a person sees when a curation request fails on
    several grounds at once, and no node states that precedence. The contract lists its refusals per operation,
    but it nowhere says which wins when several apply. For correct-item the contract lists BUSINESS_CORRECTION_NO_CHANGES,
    then BUSINESS_DATE_UNJUSTIFIED, then BUSINESS_TEMPORAL_INCOHERENT. This list puts BUSINESS_TEMPORAL_INCOHERENT
    first. For merge-nodes the contract lists the self-merge refusal first. This list puts BUSINESS_REASON_REQUIRED
    first. The next reader looks in the specification for which refusal wins and finds nothing. The code
    is then the only place the decision lives.
- file: src/modules/ingestion/chunker/config.ts
  where: the CHUNK_TARGET declaration, line 19, and the doc comment above it, lines 12-18
  evidence: 'export const CHUNK_TARGET: readonly [number, number] = [1500, 2000] as const;'
  cost: The lower bound 1500 is a size threshold for chunking that no node holds. The nodes state only
    the 4000 block limit and the 2000 closing size (long-block-sentence-chunks, short-block-one-chunk).
    The next reader will look for the 1500 in the specification, find nothing, and read this file as the
    decision. v1.ts uses only CHUNK_TARGET[1], so the 1500 is declared here and applied nowhere.
- file: src/modules/ingestion/chunker/v1.ts
  where: scanLines, lines 289-307, which feeds splitEmail (the blank-line test) and splitTurns
  evidence: '"if (codePoints[i] === "\n") {" together with "const isBlank = line.endExclusive === line.start;"'
  cost: The code treats only "\n" as a line terminator and only a zero-length line as blank. A line holding
    just "\r", as in CRLF email, is therefore not blank. Such an email never closes its header block and
    so becomes one block. A CRLF speaker line keeps its "\r" in the line. No node says what a line or
    a blank line is. The next reader will look in the specification for it and not find it.
- file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: mapReadError, the ZodError branch, lines 402-413. It serves get_ingestion_status and list_recent_ingestions.
  evidence: 'code: "VALIDATION_INVALID_FORMAT", message: "Request payload failed validation.", details:
    err.issues.map((i) => ({'
  cost: The ingestion contract states VALIDATION_INVALID_FORMAT with the failing fields for list-recent-ingestions
    and read-llm-run, but not this message. The message is told to the caller and exists only here. The
    contract's silence leaves a reader unable to tell whether this wording was decided or just happened.
- file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: the ingest_document handler's Zod-failure branch, lines 255-267
  evidence: 'code: "VALIDATION_INVALID_FORMAT", message: "ingest_document arguments failed validation.",'
  cost: The ingestion contract gives the refusal's code and the failing-field listing for ingest-document
    but no message. The message is told to the MCP caller, and it lives only in this handler. The contract
    names the equivalent directed wording ("ingest_directed arguments failed validation."), so a reader
    checking the contract for this one finds nothing.
- file: src/modules/ingestion/mcp/transport.ts
  where: the mountMcpEndpoint call in registerIngestMcpTransport, lines 42-46
  evidence: 'path: "/mcp/ingest", serverName: "remember-bff-ingest", serverVersion: "0.1.0",'
  cost: The address the ingestion toolset is served at, and the name and version it announces to MCP clients,
    are fixed here and in no specification node. A search of the specification for "mcp/ingest" and "remember-bff-ingest"
    found nothing. A reader who needs to know where a client reaches ingestion over MCP will look in the
    specification and find only the statement that REST and MCP answer alike, with no route. The route
    lives only in this file.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: rule 3 of the "Inviolable rules" in the string array returned by system(), lines 141-142
  evidence: '"3. ATOMICITY: one subject–predicate–object assertion = one fragment. Split", "   compound
    sentences (\"Ana and Bruno joined X\") into one fragment per fact."'
  cost: This rule on how fragments are cut is sent to the model on every extraction. It reaches the model
    as an instruction, and no node states it. The specification caps a fragment's text at 1000 characters
    but holds no rule about splitting claims. A reader looking in the specification for why fragments
    are single facts finds nothing, and the only home of the rule is this prompt string.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: rule 5 of the "Inviolable rules" in the string array returned by system(), lines 148-151
  evidence: '"5. LITERAL vs ENTITY: a literal value of an entity that matches a catalog", "   AttributeKey
    → `propose_attribute`; an entity matching a NodeType →", "   `propose_node` (+ `propose_link` if a
    relation is stated). A date, number", "   or string value is NEVER a node."'
  cost: This is a classification rule for what becomes a node and what becomes an attribute. It decides
    which extracted facts reach the graph as entities, and it is stated only in the prompt text. The specification's
    extraction nodes cover dates, closed values and the token ceiling, but none holds this rule. The next
    reader of node-versus-attribute behavior looks in the specification and does not find it.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the comment lines inside the "Worked example" block of system(), lines 211-216
  evidence: '"  // a document/event is its own node; `concerns` (aboutness, no valid_from) links it to
    the topic,", "  // `delivered_to` records the recipient. Do NOT leave \"a proposal\" as a bare fragment.",
    "  propose_link {source_node_id:D, link_type:\"concerns\", target_node_id:Z,", "  propose_link {source_node_id:D,
    link_type:\"delivered_to\", target_node_id:L,"'
  cost: The prompt tells the model that a document or event becomes its own node, linked to its topic
    by `concerns` and to its recipient by `delivered_to`. That modeling convention is stated only in the
    prompt. The catalog nodes say which link types are temporal, but none says a document or event must
    become a node of its own. Anyone changing extraction behavior has to find this in the code and not
    in the specification.
- file: src/modules/ingestion/prompts/extraction.v2.ts
  where: The header comment, lines 1-15, and the last bullet of EVENT_DATING_DIRECTIVE, lines 50-51.
  evidence: '"- Rescheduling an event is `change_hint:\"succession\"` on `event_date` — the" "  same mechanics
    as any functional attribute (the old date becomes history)."'
  cost: This prompt text tells the model to mark a rescheduled event as a succession on event_date. No
    node holds that instruction. The nodes that hold the event directive (extraction-dates-events, extraction-event-date-is-the-value)
    cover proposing event_date and end_date and giving the validity start. They say nothing on rescheduling.
    Succession-closes-previous holds what the system does once a succession arrives, not what the model
    is asked to send. The next reader will look in the specification for how rescheduling reaches the
    model and find only this prompt.
- file: src/modules/ingestion/routes/ingestion.routes.ts
  where: lines 125-126, POST_INGEST_BODY_LIMIT, used as the bodyLimit of POST /raw-information at line
    144
  evidence: 'const POST_INGEST_BODY_LIMIT = 11 * 1024 * 1024; app.post("/raw-information", { bodyLimit:
    POST_INGEST_BODY_LIMIT }, ...'
  cost: A request-size ceiling of 11 MiB is applied to ingest-raw-information, and no node holds it. The
    comment cites "ingestion.back.md §1", which is not a node. The nodes rules/knowledge-base/content-length
    and rules/knowledge-base/original-input-length each cap one field at 10,485,760 UTF-16 code units.
    A request with both fields near their caps, or with multi-byte content, would be refused by this ceiling,
    with a status the contract does not list. Anyone reading the contract for what the endpoint accepts
    would not find this cap.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Step 5, the catch around resolveAffectedNodes (lines 767-787)
  evidence: "} catch (err) {\n    deps.logger.warn(\n...\n    // resolvedAffected stays []; the run is\
    \ still completed.\n  }"
  cost: If resolving the affected nodes fails as a whole, the response carries an empty `affected_nodes`
    list as though the run touched nothing. The only node close to this, rules/knowledge-base/affected-nodes-omit-absent,
    covers a node that is no longer held being left out. It does not cover the whole resolution failing.
    The caller cannot tell "touched nothing" from "resolution failed", and the specification does not
    say which the owner is meant to see.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: 'closeRunCompletedSafe (lines 1006-1034), together with the hard-coded `status: "completed"`
    in the result at line 817'
  evidence: "} catch (err) {\n    try {\n      await client.query(\"ROLLBACK\");\n    } catch {\n    \
    \  /* swallow */\n    }\n    logger.warn(\n... status: \"completed\","
  cost: 'If closing the run fails, the error is only logged. The response still says `status: "completed"`
    while the stored run may still be open. The rule rules/knowledge-base/directed-run-completes says
    a directed ingestion completes its run whatever its items'' statuses. It is silent on a failed close,
    so the code is where this decision lives, and the next reader will look for it in the specification.'
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe (lines 1041-1091), whose result feeds the `run` block of the returned envelope
    at lines 813-823
  evidence: "const fallback = {\n    started_at: new Date(0).toISOString(),\n    finished_at: new Date(0).toISOString(),\n\
    \    attempts: 1,\n  };\n... finished_at:\n    row.finished_at === null\n      ? new Date(0).toISOString()\n\
    \      : row.finished_at.toISOString(),"
  cost: When the closed run row cannot be read, or has no finish time, the caller gets a completed run
    stamped 1970-01-01T00:00:00.000Z with attempts 1, and nothing marks the values as invented. No node
    holds this substitution. The contract's ingest-directed answer promises "the completed run" and names
    no placeholder. A reader of the specification would take these timestamps to be real, and only this
    file says they may not be.
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the constant TRIGRAM_CANDIDATE_LIMIT (lines 43-47) and its use in the candidate query (`LIMIT
    ${TRIGRAM_CANDIDATE_LIMIT}`, line 165)
  evidence: const TRIGRAM_CANDIDATE_LIMIT = 10; ... ORDER BY MAX(similarity(na.alias_norm, norm($1::text)))
    DESC LIMIT ${TRIGRAM_CANDIDATE_LIMIT}
  cost: The code caps the candidates a proposal is compared against at 10, and no node states the cap.
    The ambiguous-candidates rule says a review is recorded for "each such node" at similarity 0.55 or
    more. The cap leaves the 11th and later candidates out of the strong-unique check and out of the review
    rows. The decision lives only here, where the next reader will not look for it. I searched the whole
    projection for the figure and found no node holding it.
- file: src/modules/ingestion/service/extraction.service.ts
  where: dispatchToolUse, default branch of the switch (lines 282-293)
  evidence: "default:\n  return {\n    ok: false,\n    error: {\n      code: \"VALIDATION_INVALID_FORMAT\"\
    ,\n      message: `Unknown tool '${toolName}'.`,\n      details: { tool_name: toolName },\n    },\n\
    \  };"
  cost: How an extraction answers the model when it names a tool outside the four proposals (the code
    VALIDATION_INVALID_FORMAT, the message text, the details) is decided only here. The specification
    holds the Zod-failure message and the chat toolset rule, but no rule for an unknown tool inside an
    extraction. The next reader will look for it in the specification and find nothing.
- file: src/modules/ingestion/service/extraction.service.ts
  where: runChunkLoop, MAX_TURNS_PER_CHUNK and the exit after the loop (lines 625-627 and 749-755)
  evidence: "const MAX_TURNS_PER_CHUNK = 64;\n...\ninput.logger.warn(\n  { llm_run_id: input.llmRunId,\
    \ turns: MAX_TURNS_PER_CHUNK },\n  \"extraction_chunk_turn_cap_reached\"\n);\nreturn { kind: \"completed\"\
    \ };"
  cost: A chunk that has not ended its conversation after 64 turns is treated as read successfully. The
    run can then complete as `completed` with that chunk only partly extracted. The specification gives
    the per-turn token ceiling, the bounded call time, the three-in-a-row failure and the refusal skip,
    but no turn limit per chunk and no rule that reaching one counts as completion. The limit and its
    outcome live only in this file, where someone reading the specification will not look.
- file: src/modules/ingestion/service/llm-run.service.ts
  where: getLlmRunById, lines 113-117 (catch around deriveAffectedNodes)
  evidence: "} catch {\n  // Best-effort — omit the field on a transient read failure; the\n  // caller\
    \ can re-derive on the next poll.\n  affectedNodes = undefined;\n}"
  cost: 'A completed run whose affected-nodes read fails is answered as a success with the field absent.
    The caller cannot tell that from a run that has none. Absence also means something else here: for
    a run that is not completed it means "not yet available". The degradation is decided only in this
    catch block, so the next reader looks for it in the specification and does not find it. The read-llm-run
    contract states only that affected nodes are included when the run is completed. It says nothing on
    a failed read, which other reads answer with SYSTEM_SERVICE_UNAVAILABLE or SYSTEM_INTERNAL_ERROR.'
- file: src/modules/knowledge-graph/mcp/query-toolset.ts
  where: 'QUERY_TOOL_NAMES (lines 161-171) and the nine registerTool calls with name: "..." in registerQueryToolset
    (lines 268-412)'
  evidence: 'export const QUERY_TOOL_NAMES: readonly QueryToolName[] = [ "get_node", "traverse", "get_history_link",
    "get_history_attribute", "get_history_attribute_key", "list_nodes", "list_node_types", "list_link_types",
    "list_attribute_keys", ];'
  cost: The specification's retrieval contract names these reads as read-node, read-link-history, read-attribute-history,
    list-node-types and so on. The names an LLM caller must use (get_node, get_history_link, ...) exist
    only in this array and the registerTool calls. A caller or reviewer who looks in the specification
    for the tool vocabulary will not find it. A rename here would change what callers see and no node
    would register the change.
- file: src/modules/knowledge-graph/service/history.service.ts
  where: assembleLinkHistory, lines 150-155, and assembleAttributeHistory, lines 174-179 (the same branch
    in both)
  evidence: "if (row.status !== \"deleted\" && provenance.length === 0) {\n  logger.warn(\n    { route,\
    \ link_id: row.id, status: row.status },\n    \"knowledge_graph_empty_provenance\"\n  );\n}"
  cost: The code decides that a non-deleted version with no provenance is worth an alarm, and that a deleted
    one is not. That rule is also the only place the log event name knowledge_graph_empty_provenance is
    defined. No node holds either. The nearest node, rules/knowledge-base/graph-read-shows-empty-provenance,
    only says such a read shows an empty provenance list. A later reader who looks in the specification
    for what the history reads do with a provenance-less version will find no mention of the alarm.
- file: src/modules/knowledge-graph/service/node.service.ts
  where: warnIfEmptyProvenance, lines 141-162, called from getNodeByIdService at line 127
  evidence: 'logger.warn({ route: ctx.route, node_id: ctx.nodeId, attribute_id: r.id, status: r.status
    }, "knowledge_graph_empty_provenance")'
  cost: The service emits a WARN log whenever a node read meets a non-deleted attribute with no provenance.
    The specification states only that such an attribute is shown with an empty provenance list. It does
    not say the anomaly is logged, at what level, or under what event name. The next reader who looks
    in the specification for what an empty provenance chain does on a node read will not find this behavior.
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: the `.strict()` closing SearchQuerySchema, line 74
  evidence: "export const SearchQuerySchema = z\n  .object({ ... })\n  .strict();"
  cost: A search request that names a query parameter the operation does not define is refused here. The
    specification states that refusal for the accepted-fragment listing, the graph reads and the catalog
    listings. The `search` operation's refusals in the retrieval contract do not list it. The rule lives
    only in this code, and a reader of the contract would expect such a request to succeed.
- file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  where: 'route registrations: "/search", "/provenance/links/:link_id", "/provenance/attributes/:attribute_id",
    "/provenance/fragments/:fragment_id", "/fragments/accepted" (lines 59, 90, 112, 136, 164)'
  evidence: app.get("/provenance/links/:link_id", ... app.get("/fragments/accepted", ...
  cost: The contract names the operations (search, read-link-provenance, list-accepted-fragments and so
    on) but not the addresses they are served at. The paths exist only in this file's route table, so
    a reader of the specification cannot learn where the owner's read surface lives, and a change of address
    would not be a change to any node.
- file: src/modules/query-retrieval/service/search.service.ts
  where: line 56, the PER_LAYER_FETCH_LIMIT constant, used at lines 129-147 for the fragment, node and
    chunk layer queries
  evidence: const PER_LAYER_FETCH_LIMIT = 200;
  cost: Each layer contributes at most 200 candidates, and `total` is computed as `filtered.length` over
    those candidates. A search with more matches than that reports a smaller total than the real one and
    cannot page past the cap. The cap is not in any node I opened (the search-total-before-pagination
    node says the total counts every search item), so a reader checking the specification will not find
    it.
- file: src/shared/error-mapping.ts
  where: line 139, the BUSINESS_CHAT_INGEST_DISABLED entry of the codeToHttpStatus registry
  evidence: 'BUSINESS_CHAT_INGEST_DISABLED: 503,'
  cost: The refusal code and its 503 status for disabled directed ingestion through the chat exist only
    in this registry. contracts/chat/conversations holds BUSINESS_CHAT_DISABLED (503) and rules/chat/directed-ingestion-disabled-by-default
    states only that directed ingestion is disabled by default. No node holds the code or the status.
    The next reader will look for the refusal in the specification and will not find it.
- file: src/shared/error-mapping.ts
  where: line 96, the RESOURCE_ALREADY_EXISTS entry of the codeToHttpStatus registry
  evidence: 'RESOURCE_ALREADY_EXISTS: 409,'
  cost: The code and its 409 status live only in this registry. The specification names RESOURCE_CONFLICT
    (409) and AUTH_FORBIDDEN as framework answers, and names no RESOURCE_ALREADY_EXISTS anywhere. A reader
    looking in the specification for what the system answers on a duplicate will not find it, and the
    registry becomes the place that decision lives.
restates:
- file: src/middleware/auth.ts
  where: comments above the localOperatorToken constant (lines 110-113) and above the bypass branch (lines
    132-136)
  evidence: '// DEV-ONLY local operator bypass (see config/env.ts LOCAL_OPERATOR_TOKEN).

    // Resolved once at build time: enabled only when running in development AND a

    // token is configured. In any other mode this is `null` and the bypass branch

    // below is dead — production never trusts a static bearer.

    ...

    // DEV-ONLY bypass: a bearer equal (constant-time) to the configured local

    // operator token is accepted as the owner WITHOUT JWKS verification'
  cost: The development-only, constant-time rule is stated again in prose beside the code that implements
    it (env.NODE_ENV === "development" and constantTimeEqual). The next reader can take the comment, not
    the constraint, as where the rule was decided.
  node: constraints/local-operator-token-development-only
- file: src/middleware/auth.ts
  where: header comment, lines 9-12 ("Error mapping (registered in docs/specs/_global/error-codes.md)")
  evidence: '// Error mapping (registered in docs/specs/_global/error-codes.md):

    //   - Missing/malformed `Authorization` header     -> 401 AUTH_UNAUTHORIZED

    //   - Token expired (exp <= now)                   -> 401 AUTH_TOKEN_EXPIRED

    //   - Bad signature / wrong issuer / not a JWT     -> 401 AUTH_TOKEN_INVALID'
  cost: The authentication refusals are written a second time in prose, and the prose cites a document
    outside the specification (docs/specs/_global/error-codes.md) as their registry. A reader who trusts
    the comment looks there rather than in the access contract. The comment also lists "wrong issuer",
    which the code does not check, because the file's own comment says issuer hardening is off.
  node: contracts/knowledge-base/access
- file: src/middleware/error-handler.ts
  where: the comment inside branch 5, lines 140-142
  evidence: '// Never leak an internal message on a 5xx path (the file contract):

    // 4xx messages are client-actionable and framework-generated, but a

    // 5xx message may carry internal detail — use a generic string.'
  cost: The comment restates the access contract's rule that a framework failure of 500 or above answers
    "Internal server error." while a refusal below 500 keeps the framework's message. The ternary on the
    next line already holds that rule, so the comment is a second statement of it outside behavior. It
    cites "the file contract", which is not a specification node.
  node: contracts/knowledge-base/access
- file: src/middleware/error-handler.ts
  where: the header comment, lines 11-19 ("Error mapping (registered in docs/specs/_global/error-codes.md)"
    through "logged server-side via pino.")
  evidence: '//   - AuthError                    -> 401 (code from AuthError.code)

    //   - ZodError                     -> 422 VALIDATION_INVALID_FORMAT

    //   - pg error: ECONNREFUSED / ETIMEDOUT / 57P03 / 57014 -> 503 SYSTEM_SERVICE_UNAVAILABLE

    //   - Any other unhandled error    -> 500 SYSTEM_INTERNAL_ERROR'
  cost: The comment lists the status and code mapping that the access contract holds, and the branches
    of classify() already implement it. It names docs/specs/_global/error-codes.md as the registry, so
    a reader looks there instead of in the specification. It also omits the Fastify validation branch
    and the framework-status branch, so it will drift from the code.
  node: contracts/knowledge-base/access
- file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  where: the docstring above ListComplianceDeletionsQuerySchema, lines 74-79
  evidence: When both bounds are supplied, the parser rejects `from >= to` with `VALIDATION_OUT_OF_RANGE`.
  cost: The start-before-end requirement on the time window is restated in prose, with a back-spec id
    (BR-09) as its authority. When the node moves, this comment will not be reached by `--check` and will
    go on stating the old rule.
  node: rules/knowledge-base/audit-window-ordered
- file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  where: the docstring above ReasonSchema, lines 12-19
  evidence: '/** `reason` — non-empty after trim, ≤ 1000 chars (BR-01). ... Implementation note: `z.string().trim().min(1).max(1000)`
    runs `trim()` then checks the length AFTER the trim.'
  cost: The 1 to 1000 character bound on a compliance deletion's reason is stated in prose beside the
    code that enforces it. A change to the node would leave this comment stating the old bound, and it
    cites a back-spec rule id (BR-01) as the authority instead of the node.
  node: rules/knowledge-base/compliance-deletion-reason-length
- file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: the doc comment above CurationActionNameSchema, line 11
  evidence: /** 7 curation-tool names of §14.4 (BR-10). */
  cost: The comment states the closed set of seven curation action kinds. The enum right below it holds
    that set as code, and the specification holds it in the node domain/knowledge-base/curation-action-kind.
    The comment is a second home for the fact. It cites a section and a rule number from an earlier document,
    so a reader is sent there instead of to the node. Nothing keeps it in step with the node.
  node: domain/knowledge-base/curation-action-kind
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: the docstring above mapZodErrorToEnvelope, lines 57-72
  evidence: "\" *   3. `reason` length / trim violation (`too_small` / `too_big` on the `reason` path)\
    \ -> `VALIDATION_OUT_OF_RANGE`.\n *   4. Everything else -> `VALIDATION_INVALID_FORMAT`.\""
  cost: The docstring restates the contract's validation refusals for compliance-delete (required field,
    reason length, invalid format), which the function body also carries. Prose and code can drift apart
    unnoticed, and the prose is a second home for the table.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: the header comment, lines 1-22 (the BR-15 error list and the envelope description)
  evidence: '"//   - raw_information_id resolves to no row -> RESOURCE_NOT_FOUND //   - UC-01 alt 4c legacy
    orphan -> SYSTEM_INTERNAL_ERROR //   - Any unhandled exception -> SYSTEM_INTERNAL_ERROR"'
  cost: The comment states which error code each compliance_delete refusal answers, a fact the compliance-audit
    contract holds and this file's code also holds in its renderErrorEnvelope calls and its generic handler.
    A reader sees two homes for the same refusal table, and when the contract moves the comment is not
    reached by any check.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: the docstring above listComplianceDeletions, lines 306-309
  evidence: '* BR-09: `executed_from` inclusive, `executed_to` exclusive (semi-open).'
  cost: The window-bound rule is stated in prose while the code holds it (`executed_at >= $` and `executed_at
    < $`). The prose is a second home for the rule, and no check reaches it when the node changes.
  node: rules/knowledge-base/audit-listing-window-half-open
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: the docstring above listCurationActions, lines 426-429
  evidence: '* BR-09 semi-open range, BR-10 enum already enforced at API layer.'
  cost: The window rule is restated in prose while the code holds it (`created_at >= $` and `created_at
    < $`). A reader of this comment is sent to a back-spec rule number instead of the node.
  node: rules/knowledge-base/audit-listing-window-half-open
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: the docstring above tombstoneRawInformation, lines 45-61
  evidence: '* The `[REDACTED]` literal is hardcoded — never read from config (constraint "[REDACTED]
    literal is hardcoded in the service"). ... `original_input` is redacted in the SAME UPDATE statement
    using a CASE expression so null stays null ... and non-null is rewritten to the 10-character literal
    `[REDACTED]`.'
  cost: The redaction literal and the original-input rule are written a second time in prose. The UPDATE
    holds them in code (`content = '[REDACTED]'` and `original_input = CASE WHEN original_input IS NULL
    THEN NULL ELSE '[REDACTED]' END`). If the node moves, this comment keeps saying the old rule beside
    code that no longer matches it.
  node: rules/knowledge-base/compliance-deletion-redacts-content
- file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  where: the Priority 3 comment, lines 239-241
  evidence: // Priority 3 — `reason` length / trim violations. We can detect those by // the path being
    "reason" and the issue being `too_small` (empty after // trim) or `too_big` (> 1000 chars). Both map
    to OUT_OF_RANGE.
  cost: The 1 to 1000 character bound on a deletion's reason is stated in prose beside a handler that
    does not enforce it. The bound is enforced in `ReasonSchema = z.string().trim().min(1).max(1000)`
    in compliance-delete.dto.ts. A reader looking for the limit could take this comment for its home.
  node: rules/knowledge-base/compliance-deletion-reason-length
- file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  where: the docstring above VALIDATION_STATUS and handleZodError, lines 182-189, and the Priority 1 comment,
    line 197
  evidence: '* Translate ZodError into our standard envelope. Two special-case mappings: *  - issue.message
    === ''VALIDATION_OUT_OF_RANGE'' (from `superRefine` for *    semi-open range guards) -> error.code:
    VALIDATION_OUT_OF_RANGE.'
  cost: 'The rule that a time window must have its start strictly before its end is restated in prose.
    The code holds it in two places: the superRefine in compliance-delete.dto.ts and curation-action.dto.ts,
    and this handler''s branch that answers 422 VALIDATION_OUT_OF_RANGE. A reader would take the docstring
    for the rule''s home, and it would go stale unnoticed.'
  node: rules/knowledge-base/audit-window-ordered
- file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  where: the header comment, lines 7-13 (endpoint list)
  evidence: '// Endpoints implemented (BR-13 — append-only; only POST is the destructive // `compliance_delete`;
    everything else is GET): //   - POST /api/v1/compliance/deletions                     (UC-01) //   -
    GET  /api/v1/compliance/deletions                     (UC-02)'
  cost: The list of operations the owner's compliance and audit surface offers is written a second time
    in prose. A reader finds it here and takes it for the place the surface is decided. When the contract's
    operations change, this list goes stale with no tool to flag it.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: the comment at lines 173-174, above insertCurationAction at lines 175-181
  evidence: // BR-08 — write CurationAction row (action='compliance_delete', // target_kind='raw_information',
    target_id=<the raw>).
  cost: The comment restates, in prose, the kind, target kind and target of the curation action that the
    node holds. The insertCurationAction call at lines 175-181 carries the same values as code. A second
    statement of the fact outside behavior can drift from the node and from the call it describes. The
    same applies to the BR-nn and UC-nn labels in the other comments of this file.
  node: rules/knowledge-base/compliance-deletion-records-curation-action
- file: src/modules/compliance-audit/service/errors.ts
  where: the doc comments on ResourceNotFoundError (line 34) and InternalFailure (lines 54-59)
  evidence: '/** 404 — RESOURCE_NOT_FOUND. UC-01 alt 4a / UC-03 / UC-05. */ ... 500 — UC-01 alt `4c` legacy
    inconsistency: `raw_information.status = ''deleted''` exists with no `compliance_deletion` row. BR-17
    mandates an operational alarm (already emitted at the service layer) and a generic 500 to the client.'
  cost: The contract refuses "The raw information is already deleted and no compliance deletion of it
    is on record" with SYSTEM_INTERNAL_ERROR and "Unexpected internal error." The doc comment restates
    that trigger as prose. The running code holds the same fact in `public readonly code = "SYSTEM_INTERNAL_ERROR"
    as const;` and `super("Unexpected internal error.", details);`. The prose is a second home outside
    behavior and will not follow the contract if it changes.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/service/errors.ts
  where: the header comment, lines 1-16 (the mapping of the three error families to status and code)
  evidence: '// Three families: //   - ResourceNotFoundError -> 404 / RESOURCE_NOT_FOUND //   - ValidationFailure     ->
    422 / VALIDATION_*  (code set by the caller) //   - InternalFailure       -> 500 / SYSTEM_INTERNAL_ERROR
    (BR-17 legacy-orphan alarm)'
  cost: The status and code of each refusal appear in the header prose and again in the classes below
    (`statusCode = 404`, `code = "RESOURCE_NOT_FOUND" as const`). A reader checking what the compliance-audit
    surface answers sees two statements of it in one file and has to work out which is the decision. The
    contract that holds these answers is not among the nodes this file is bound to, so a change to the
    contract does not reach this prose.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/curation/dto/dispute.dto.ts
  where: the docstring of ResolveDisputeBodySchema, lines 21-26, the `adjust_periods` lines
  evidence: '`decision = adjust_periods` -> periods[] required with one entry per item_id;'
  cost: The one-period-per-item rule is stated again in prose, while this file's superRefine already enforces
    it with the BUSINESS_DISPUTE_PERIODS_REQUIRED checks on length, membership and duplicates. A later
    change to the node leaves this sentence stale.
  node: rules/knowledge-base/adjust-periods-one-per-item
- file: src/modules/curation/dto/dispute.dto.ts
  where: the docstring of ResolveDisputeBodySchema, lines 21-26, the `prefer_one` line
  evidence: '`decision = prefer_one`  -> winner_id required, member of item_ids, reason required'
  cost: The docstring restates the winner rule as prose. The rule is held by code in this same file, in
    the superRefine branch that adds BUSINESS_DISPUTE_WINNER_REQUIRED. The prose is a second home that
    can drift from the node, and it is never read by `--check`.
  node: rules/knowledge-base/prefer-one-requires-winner
- file: src/modules/curation/dto/dispute.dto.ts
  where: the docstring of ResolveDisputeBodySchema, lines 21-26, the `reason` clause on the prefer_one
    line
  evidence: reason required
  cost: The reason requirement for prefer-one is repeated in prose. The code holds it too, as the BUSINESS_REASON_REQUIRED
    issue in the prefer_one branch of the superRefine. The prose is a second statement of the node's fact
    and nothing reads it.
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/dto/dispute.dto.ts
  where: the inline comment above the period-ordering check, line 113
  evidence: '// Semi-open invariant: valid_from < valid_to when both supplied.'
  cost: The comment states the start-before-end rule. The code below it enforces the rule with `p.valid_from
    >= p.valid_to` and BUSINESS_TEMPORAL_INCOHERENT. The comment is a second home for the fact, outside
    any behavior.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/curation/dto/dispute.dto.ts
  where: the inline comment above the uniqueness check, line 41
  evidence: // Item_ids unique
  cost: The comment states the distinct-items rule. The code beneath it holds the rule through the Set
    size comparison that raises VALIDATION_INVALID_FORMAT. The comment is prose that will not follow the
    node if the rule moves.
  node: rules/knowledge-base/dispute-resolution-distinct-items
- file: src/modules/curation/dto/entity-match.dto.ts
  where: the comments at lines 17-23 (docstring of ResolveEntityMatchBodySchema), line 40 (inside the
    superRefine), and line 62 (above MergeNodesBodySchema)
  evidence: '"ResolveEntityMatchRequest — BR-11 (reason mandatory on merge_into), BR-23 (self-merge forbidden
    at request shape)." and "// Surfaced as BUSINESS_TARGET_NODE_REQUIRED downstream." and "/** MergeNodesRequest
    — BR-11 (reason required), BR-23 (self-merge forbidden). */"'
  cost: 'These comments state, in prose, that a reason is mandatory on merge_into and that a self-merge
    is forbidden. Code in this file already enforces both, at `message: "BUSINESS_REASON_REQUIRED"` and
    `message: "BUSINESS_SELF_MERGE_FORBIDDEN"`. The node contracts/knowledge-base/curation holds these
    refusals and cites no BR-11 or BR-23 numbering. A reader who finds the "BR-nn" labels here may take
    the comment, not the node, for the authority. The labels also go stale on their own when the node
    changes.'
  node: contracts/knowledge-base/curation
- file: src/modules/curation/dto/item.dto.ts
  where: the comment inside CorrectItemBodySchema.superRefine, line 112
  evidence: // Semi-open invariant on the new pair when both supplied.
  cost: The rule that a validity start falls strictly before the end is restated in prose beside the `c.valid_from
    >= c.valid_to` check that enforces it. It is a second statement of a fact the node holds.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/curation/dto/item.dto.ts
  where: the comment inside CorrectItemBodySchema.superRefine, line 53
  evidence: '// BR-18: at least one of value/target_node_id/valid_from/valid_to.'
  cost: The at-least-one-change rule is restated in a comment citing a back-spec code, BR-18. The node
    and the `someProvided` check hold it, so a reader of the comment has a second statement to reconcile
    with the node.
  node: rules/knowledge-base/correction-changes-something
- file: src/modules/curation/dto/item.dto.ts
  where: the comment inside CorrectItemBodySchema.superRefine, line 67
  evidence: '// Cross-field: value only on attribute, target_node_id only on link.'
  cost: The rule that a correction cannot change a link's value or an attribute's target node is restated
    in prose beside the two branches that enforce it. A second statement of the rule sits where the next
    reader will not look for it.
  node: rules/knowledge-base/correction-fits-assertion-kind
- file: src/modules/curation/dto/item.dto.ts
  where: the comment inside CorrectItemBodySchema.superRefine, line 87
  evidence: // valid_from change requires valid_from_source.
  cost: The rule that a stated validity start must state its basis is restated in a comment. The branch
    that raises BUSINESS_DATE_UNJUSTIFIED holds it, and the node also holds it.
  node: rules/knowledge-base/stated-start-requires-basis
- file: src/modules/curation/dto/item.dto.ts
  where: the docstring above RejectItemBodySchema, line 21
  evidence: /** reject_item — reason mandatory (destructive, BR-11). */
  cost: 'The reason-required rule is restated in prose beside the schema that enforces it (reason: ReasonRequiredSchema),
    citing a back-spec rule code, BR-11, instead of the node. When the node moves, this comment is the
    second place a reader finds the old rule, and nothing keeps it in step.'
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment block above the GET /metrics handler, lines 125-136
  evidence: '// Wraps the shared mapper with a graceful-degradation override: ANY residual // 500 outcome
    is re-mapped to 503 SYSTEM_SERVICE_UNAVAILABLE so the front // spec MetricsStrip (R1) can fall back
    to per-kind totals from /queue.'
  cost: 'The metrics-unavailable answer is also written in prose beside the code that holds it (`const
    degradedStatus = statusCode === 500 ? 503 : statusCode;` and the SYSTEM_SERVICE_UNAVAILABLE envelope
    in this file). Two homes now state it, so a change to the contract''s refusal could leave the comment
    saying the old answer.'
  node: contracts/knowledge-base/curation
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment inside the GET /metrics success path, lines 145-149
  evidence: // Bare success body — consistent with every other curation REST // endpoint (queue/confirm/reject/...).
    The SPA's httpCuration returns // the raw 2xx JSON, so an `{ ok, result }` wrapper here would surface
  cost: The no-envelope success shape is restated as prose next to `return reply.status(200).send(result);`,
    which holds it. A second home for the contract's accepted answer ("HTTP 200 carrying, with no envelope")
    can drift from it.
  node: contracts/knowledge-base/curation
- file: src/modules/curation/service/merge.service.ts
  where: the comment at line 120
  evidence: '// BR-06: matching node_type.'
  cost: The same-node-type rule is cited by a back-spec number (BR-06) the specification does not use.
  node: rules/knowledge-base/merge-requires-same-node-type
- file: src/modules/curation/service/merge.service.ts
  where: the comment at line 81
  evidence: '// BR-12: 410 for tombstones; explicit before 409/422 status checks.'
  cost: The refusal of a deleted node is cited by a back-spec number (BR-12). The prose adds a second
    statement of the rule next to the two `status === "deleted"` guards.
  node: rules/knowledge-base/curation-refuses-deleted-node
- file: src/modules/curation/service/merge.service.ts
  where: the comment at line 95
  evidence: // Survivor must be active.
  cost: This sentence says the same as the node's statement in prose. The guard beneath it already refuses.
  node: rules/knowledge-base/merge-survivor-active
- file: src/modules/curation/service/merge.service.ts
  where: the comment before the self-merge guard, lines 54-55
  evidence: // Defence in depth (BR-23). Route layer rejects but the service must not // trust upstream.
  cost: The comment cites the rule by a back-spec number (BR-23) and claims what the route layer does.
    Nothing in this file shows that claim, so a reader may take it as a statement of the rule.
  node: rules/knowledge-base/node-never-merged-into-itself
- file: src/modules/curation/service/merge.service.ts
  where: the file header comment, line 10
  evidence: //   6. Alias copy (BR-08).
  cost: The alias-copy rule is cited by a back-spec number (BR-08) the specification does not use. The
    prose leaves the reader unsure which of the two is current.
  node: rules/knowledge-base/merge-copies-aliases
- file: src/modules/curation/service/merge.service.ts
  where: the file header comment, line 11
  evidence: //   7. Repoint links / attributes (BR-09).
  cost: The repointing rule is cited by a back-spec number (BR-09) the specification does not use. The
    prose is a second statement of what the node holds.
  node: rules/knowledge-base/merge-repoints-assertions
- file: src/modules/curation/service/merge.service.ts
  where: the file header comment, line 8, and the comment at lines 129-130
  evidence: '//   4. UPDATE absorbed node: status=''merged'', merged_into_node_id=survivor.'
  cost: The merged status and the survivor pointer are described a second time in prose. The code calls
    updateNodeMerged, so the prose carries no fact of its own and only invites a reader to trust it over
    the node.
  node: rules/knowledge-base/merge-marks-absorbed-merged
- file: src/modules/curation/service/merge.service.ts
  where: the file header comment, line 9
  evidence: //   5. Path compression (BR-07).
  cost: The path-compression rule is cited by a back-spec number (BR-07) the specification does not use,
    so a reader is sent to a place that does not hold it.
  node: rules/knowledge-base/merge-compresses-paths
- file: src/modules/curation/service/merge.service.ts
  where: the file header comment, lines 4-7, and the comment at line 81
  evidence: '// Steps inside the open transaction (BR-13 layered validation): //   1. SELECT ... FOR UPDATE
    on both rows (BR-26). //   2. Inspect status: 404 if missing, 410 if deleted, 409/422 mismatch. //   3.
    Enforce node_type match (BR-06). ... // BR-12: 410 for tombstones; explicit before 409/422 status
    checks.'
  cost: The order in which a merge refuses is written a second time in prose beside the code that applies
    it. When the node changes the order, a reader of this header sees a sequence nothing reads and nothing
    keeps in step.
  node: rules/knowledge-base/merge-check-order
- file: src/modules/ingestion/catalog/catalog.ts
  where: the doc comment above isLinkRuleActive, lines 265-270
  evidence: '* validity window includes today (semi-open `[valid_from, valid_to)`; nulls * mean unbounded
    — §5.1).'
  cost: The in-effect window of a link type rule is written a second time in prose beside the code that
    applies it. The node does not bind a comment, so when the window changes, the prose goes on stating
    the old window and a reader trusts it over the node.
  node: rules/knowledge-base/link-type-rule-in-effect
- file: src/modules/ingestion/chunker/config.ts
  where: the doc comment on CHUNK_HARD_MAX, line 21, and the file header comment, lines 1-7
  evidence: /** Hard ceiling on a single chunk. A block above this size is sentence-split. */
  cost: The comment restates the rule that a block of more than 4000 code points is cut at sentence boundaries.
    The code holds that rule in v1.ts (`if (blockSize <= CHUNK_HARD_MAX)` emits one chunk, else the block
    is split by sentences), so the pair conforms. The prose is a second home for the node's fact outside
    behavior. The comment also calls the 4000 a "ceiling on a single chunk", but the node long-sentence-own-chunk
    lets a single sentence exceed it.
  node: rules/knowledge-base/long-block-sentence-chunks
- file: src/modules/ingestion/chunker/v1.ts
  where: the RawChunkInput docblock, lines 42-46
  evidence: '"`chunk_index` is the 0-based position within the document."'
  cost: The indexing rule is restated in prose. The code holds it where `buildChunk(..., chunks.length)`
    assigns each index in emission order.
  node: rules/knowledge-base/chunk-index-follows-content
- file: src/modules/ingestion/chunker/v1.ts
  where: the algorithm comment at lines 7-18 and the sentence-split docblock at lines 353-367
  evidence: '"2. For each block, try to keep it as one chunk if its size is at most `CHUNK_HARD_MAX` code
    points. If the block exceeds `CHUNK_HARD_MAX`, fall back to sentence-level split via `Intl.Segmenter(''pt'',
    {granularity: ''sentence''})` (BR-07)."'
  cost: 'The 4000/2000 sentence-split rule is also written as prose in this file. The code holds it too,
    through `if (tentativeSize > CHUNK_TARGET[1])` and `new Intl.Segmenter("pt", { granularity: "sentence"
    })`. A reader can take the comment for the decision and miss the node.'
  node: rules/knowledge-base/long-block-sentence-chunks
- file: src/modules/ingestion/chunker/v1.ts
  where: the edge-case comment, lines 121-126
  evidence: '"Edge case: input was non-empty but consisted entirely of hard-boundary separators (e.g.
    a file made of nothing but form-feed characters). We still emit one chunk covering the raw content"'
  cost: The single-chunk fallback is narrated in a comment. The code holds it in `if (chunks.length ===
    0 && totalCodePoints > 0) { chunks.push(buildChunk(codePoints, 0, totalCodePoints, 0)); }`.
  node: rules/knowledge-base/contentless-blocks-single-chunk
- file: src/modules/ingestion/chunker/v1.ts
  where: the header comment, lines 20-24
  evidence: '"All offsets are 0-based, semi-open, counted in Unicode code points of the ORIGINAL content
    (BR-05)."'
  cost: The offset unit is stated in prose beside the code that implements it (`const codePoints = Array.from(content);`,
    with offsets taken from that array's indexes). The comment is a second home for a fact the node holds.
  node: rules/knowledge-base/chunk-offsets-count-code-points
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docblock, the `ata`, `artigo` and `outro` entry, lines 155-158
  evidence: '"- `ata`, `artigo`, `outro`:        no hard boundary — single block."'
  cost: 'The undivided-source rule is restated in prose. The code holds it in `return [{ start: 0, endExclusive:
    total }];` for those three cases.'
  node: rules/knowledge-base/undivided-sources
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docblock, the `chat` and `transcricao` entry, lines 150-154
  evidence: '"A line that starts with `[ \t]*[A-Za-z0-9_]+[ \t]*:[ \t]` (e.g. `João:`, `[12:00] Maria:`)
    opens a new block."'
  cost: The comment gives a speaker pattern that differs from the regex the code runs (`SPEAKER_LINE_REGEX`
    at line 351). A reader who trusts the comment learns the wrong rule. The code holds the turn boundary
    in `splitTurns`.
  node: rules/knowledge-base/turn-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docblock, the `email` entry, lines 148-149
  evidence: '"- `email`:        first blank line (header/body separator) plus every transition into /
    out of a `>` quotation block."'
  cost: The email boundary rule is restated in prose. The code holds it in `splitEmail`.
  node: rules/knowledge-base/email-quote-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docblock, the `pdf` entry, lines 146-147
  evidence: '"- `pdf`:          form-feed (`\f`, U+000C). PDF extractors typically insert `\f` between
    pages."'
  cost: 'The pdf boundary is restated in prose. The code holds it in `case "pdf": return splitOnCharBoundary(codePoints,
    "\f");`.'
  node: rules/knowledge-base/pdf-blocks-at-form-feeds
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitEmail docblock, lines 213-216
  evidence: '"Split an email: first blank line closes the headers, every transition into or out of a quotation
    block (`^>+ `) closes a chunk."'
  cost: The header-block rule is restated in prose, in a form that does not match the code. The code uses
    `isQuotedLine`, which looks for a `>` after leading spaces or tabs, not the `^>+ ` pattern the comment
    shows. The code holds the header end in `if (!headersClosed && isBlank)`.
  node: rules/knowledge-base/email-header-block
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitTurns docblock (lines 261-266) and the SPEAKER_LINE_REGEX docblock (lines 341-350)
  evidence: '"A speaker line is one whose trimmed start matches `[A-Za-z0-9_]+:` followed by white space
    (e.g. `João: Bom dia`). Bracketed timestamps like `[12:00] João:` are also accepted."'
  cost: The speaker-line definition is written twice in prose. The wording differs between the two comments
    and from the regex that holds it (`SPEAKER_LINE_REGEX`). One comment says ASCII only, which the regex
    contradicts with `À-ÿ`.
  node: rules/knowledge-base/speaker-line
- file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  where: the JSDoc above IngestRawInformationRequestSchema, the `content` bullet (lines 16-18), against
    the `content` field (lines 27-30)
  evidence: "\" * - `content`: minLength 1 (empty document is meaningless), maxLength 10 MiB\n *    in\
    \ code points — the Fastify `bodyLimit` of 11 MiB on the route is a\n *    coarser pre-filter; this\
    \ Zod check is the precise contract from A5.\""
  cost: The limit is held by the code (`.min(1, ...)` and `.max(10 * 1024 * 1024, ...)`), and rules/knowledge-base/content-length
    holds it too. The comment is a second home for it and gives the wrong unit. The node counts UTF-16
    code units, and the comment says code points. A reader who trusts the comment will misread what a
    10 MiB document is. It also sends them to "A5" instead of to the node.
  node: rules/knowledge-base/content-length
- file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  where: the JSDoc above `original_input` (lines 35-39), against the `original_input` field (lines 40-44)
  evidence: '"Never factored into `content_hash`. Capped at 10 MiB to match `content`."'
  cost: The cap is held by the code (`.max(10 * 1024 * 1024, "original_input must not exceed 10 MiB")`),
    and rules/knowledge-base/original-input-length holds it too. The comment repeats it and ties it to
    `content` by analogy. If the node moves, the comment keeps stating the old cap and nothing flags it.
  node: rules/knowledge-base/original-input-length
- file: src/modules/ingestion/dto/propose-link.dto.ts
  where: the docstring above ValidFromBasisSchema, lines 5-15
  evidence: '"Only `stated` and `document` are accepted at the API boundary. The third value, `received`,
    is a backend-only fallback that the temporal validator applies internally when neither `stated` nor
    `document` can justify the date — it is never sent by an LLM or any external caller, so it MUST NOT
    appear in this input enum."'
  cost: The rule that a caller never states the basis received is written in prose beside the enum. The
    enum is the only thing that enforces it. A reader who opens the docstring finds a second statement
    of the rule. When the node moves, nothing points at this comment, so it can drift unnoticed.
  node: rules/knowledge-base/caller-never-states-received
- file: src/modules/ingestion/hash.ts
  where: the docstring above composeIdempotencyKey, lines 20-27
  evidence: '`idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`, concatenated
    WITHOUT a separator. The order is exactly as defined in §8 of v7 and as documented in `ingestion.back.md`
    BR-08.'
  cost: The operand order and the no-separator rule are stated again in prose that points to documents
    other than the node. A change to the node would not reach this docstring, so a reader could take the
    docstring or v7 §8 for the authority. The code on lines 34-39 already holds the fact.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/hash.ts
  where: the docstring above sha256Hex, lines 10-15
  evidence: '`sha256(content)` -- 64 char lowercase hex string. Used as `raw_information.content_hash`
    (BR-01); the DB CHECK constraint on the column enforces the same regex.'
  cost: The content-hash definition (SHA-256, UTF-8, 64 lowercase hex characters) is written a second
    time as prose. If the node moves, this docstring keeps saying the old form, and the next reader may
    take it as the authority. The code on line 17 already holds the fact.
  node: rules/knowledge-base/content-hash-is-sha256
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the docstring of assertRunIsRunning, lines 91-102
  evidence: "\"id does not match any LLMRun row -> `RESOURCE_NOT_FOUND`\n   - id matches a row whose `status\
    \ !== 'running'` -> `BUSINESS_RUN_NOT_RUNNING`\""
  cost: The rule that a proposal is taken only within a running run is also written as prose. The code
    in the same file holds it, so the prose is a second home that nobody reads when the rule changes.
  node: rules/knowledge-base/proposal-requires-running-run
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the docstring of deriveValidationOutcome, lines 55-65
  evidence: "\"Rule: when `result.outcome === 'rejected'` (the BELOW_CONFIDENCE_FLOOR\n branch returns\
    \ this), the audit row is `'rejected'` per BR-17. Every other\n `ok:true` envelope is `'accepted'`.\""
  cost: The mapping from a proposal's outcome to the tool call's validation outcome is stated twice in
    this file, once in the switch and once in prose. When the node moves, the prose keeps saying the old
    mapping beside code that no longer matches it, and the prose is not bound to the node.
  node: rules/knowledge-base/tool-call-validation-outcome
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the header comment, lines 1-14, and the docstring of runIngestHandler, lines 125-131
  evidence: "\"4. On `ValidationFailure`: ROLLBACK the business TX, then open a SEPARATE\n //      short\
    \ TX to write the audit `tool_call` row (BR-23).\"\nand \"BR-23: even when the business transaction\
    \ rolls back, the audit row is\n * written via a SEPARATE short transaction (`insertToolCallStandalone`).\""
  cost: The rule that every proposal is audited, and that a refused or failed one records only its tool
    call, is also narrated in comments that cite BR numbers. A reader looking for what is audited finds
    the comments before the node. The code in runIngestHandler already holds the rule.
  node: rules/knowledge-base/every-proposal-audited
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: the docstring above `DEFAULT_INGEST_MODEL`, lines 41-49
  evidence: Hard-coded fallback extraction model used only when the caller omits `model` AND no `ingestModel`
    is wired (e.g. a bare test harness). Production threads `env.INGEST_MODEL` through `deps.ingestModel`.
    Cost-optimized to Sonnet 4.6 —
  cost: The default-model rule is described in a docstring while `input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL`
    and the constant `"claude-sonnet-4-6"` hold it in code. The docstring adds a second account of the
    rule, along with a cost rationale and a note about an earlier model that no node records. When the
    rule changes, the docstring is not updated by anything.
  node: rules/knowledge-base/default-extraction-model
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: the file-header comment, lines 18-21 (Idempotency paragraph)
  evidence: '// Idempotency (BR-08): if the same content was already ingested, // `ingestRawInformation`
    returns `noop_existing`; we DO NOT re-run extraction // (the existing run is completed, or running,
    and re-running would either no-op // or 409). The tool reports `already_ingested` with the existing
    ids — never an // error.'
  cost: The held-content answer is stated in prose in this file as well as in the ingestion contract.
    The branch `if (outcome === "noop_existing")` carries the behavior, so the prose is a second home.
    A reader who finds the comment first takes it for the decision, and the contract never reaches it
    when the answer moves.
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: comment at line 276, in the `ingest_directed` block
  evidence: '"`ref` strings are local to the call (1..120 chars, must be non-empty)."'
  cost: A second statement of the reference bounds sits in prose beside the code that holds them (`IngestDirectedRefSchema
    = z.string().min(1).max(120)`). It adds a number someone has to keep in step when the rule moves.
    The comment route removes it.
  node: rules/knowledge-base/directed-reference-length
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: comment at lines 281-283, in the `ingest_directed` block
  evidence: '"`valid_from_basis` is restricted to the public `''stated'' | ''document''` enum (the `''received''`
    fallback is server-internal, never accepted from callers — BR-16)."'
  cost: The rule that a caller never states the received basis is repeated in prose. The code that holds
    it is `z.enum(["stated", "document"])` in `IngestDirectedValidFromBasisSchema`. The comment gives
    a reader a second place to look.
  node: rules/knowledge-base/caller-never-states-received
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: docstring at line 299 above IngestDirectedIsoDateSchema
  evidence: '"/** ISO date `YYYY-MM-DD`. Mirrors the service-side regex (`directed-ingestion.service.ts`).
    */"'
  cost: The validity-start shape is stated in prose and by the regex `/^\d{4}-\d{2}-\d{2}$/` that follows.
    The docstring also says a second regex exists in the service, so the shape is held in two code places
    and a third in prose.
  node: rules/knowledge-base/directed-validity-start-shape
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the comment block above the attribute-key loop inside system(), lines 87-99
  evidence: '"sorted with default `Array.prototype.sort()` (locale-default, deterministic — same ordering
    used by `assertValueInDomain`''s `allowed_values` diagnostic, keeping prompt and rejection envelope
    in sync). Open-domain keys (no rows in `attribute_valid_value`, `domainOf` returns `null`) print unchanged"'
  cost: The comment restates the ascending-order and closed-keys-only rules in prose, in a second place
    beside the code that already holds them (`[...domain].sort()` and the `domain !== null` branch). It
    also calls the default sort "locale-default", but the default sort compares by UTF-16 code unit and
    is not locale-aware. A reader who trusts the comment would look for locale behavior the code does
    not have.
  node: rules/knowledge-base/extraction-prompt-values-ascending
- file: src/modules/ingestion/prompts/extraction.v2.ts
  where: The header comment, lines 1-9, and the docstring of EVENT_DATING_DIRECTIVE, lines 32-37.
  evidence: '"// v2 = v1 + an explicit Event-dating directive. The \"go-live veio sem data\"" "// gap
    was a PROMPT gap: v1 never told the model to propose `event_date` when it" "// creates an Event"'
  cost: The comment restates, as prose, that v2 asks the model to propose event_date for an Event. The
    directive itself holds this fact in this file (lines 41-44, the `## Events` bullets), and the node
    holds it too. The prose is a second home that must be kept in step with both.
  node: rules/knowledge-base/extraction-dates-events
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: header comment, lines 13-14 (pick the best-fitting value, fall back to outro, lower confidence)
  evidence: '// USE it — pick the best-fitting catalog value, fall back to `outro` only

    // when none fits (and then lower confidence so curation sees the gap), and'
  cost: The outro fallback rule is stated in prose here, in addition to the code. The code is the EVENT_CLASSIFICATION_DIRECTIVE
    text at lines 60-62, which carries the same rule with the 0.74 ceiling. If the rule moves in the node,
    a reader may take either the comment or the directive as the decision.
  node: rules/knowledge-base/extraction-event-type-fallback
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: header comment, lines 14-15 (resolve relative dates against document_date)
  evidence: // and resolve relative dates ("hoje"/"ontem"/…) against `document_date`.
  cost: The anchor for relative dates is stated in prose here, in addition to the code. The code is the
    directive text at lines 63-66, which also states the omission when document_date is unknown. The comment
    can drift from the node, and a reader may look in the comment instead of the node.
  node: rules/knowledge-base/extraction-relative-date-needs-document-date
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: header comment, lines 8-12 (the paragraph on the original and widened event_type domain)
  evidence: '// `event_type` domain {reunião, go-live, workshop, outro} landed on `outro`

    // with a lowered confidence (→ `uncertain`). Migration

    // `0003_event_type_taxonomy.sql` widened that closed domain (cobrança,

    // decisão, escalonamento, bloqueio, marco)'
  cost: A comment in this file lists the allowed event_type values. The node rules/knowledge-base/allowed-event-types
    holds the same list, and the seed named in the comment carries it. If the catalog changes again, the
    comment keeps the old list and a reader may take it for the current domain. Nothing running reads
    it.
  node: rules/knowledge-base/allowed-event-types
- file: src/modules/ingestion/prompts/extraction.v4.ts
  where: the header comment (lines 1-25) and the docstring above RECEIVED_AT_ANCHOR_DIRECTIVE (lines 42-49)
  evidence: '"v4 teaches the model to use it as the FALLBACK anchor: resolve against `document_date` when
    present, against `received_at` otherwise." and "Carries the `received_at` fallback rule: when `document_date`
    is absent, the relative-date anchor is `received_at`"'
  cost: The relative-date fallback is stated in prose and also held by the directive the file emits, so
    the fact has a second home outside behavior. A reader who looks in the comment for what v4 decides
    finds a copy that nothing keeps in step with the node.
  node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
- file: src/modules/ingestion/prompts/index.ts
  where: the file-header comment (lines 10-15) and the docblock above selectPromptModule (lines 83-87)
  evidence: '"// An unknown version is a configuration error, NOT a silent fallback: BR-26 // step 2 mandates
    "load the extraction.${prompt_version} module; fail with 500 // SYSTEM_INTERNAL_ERROR if the module
    is missing"." and "Throws `UnknownPromptVersionError` for an unregistered version (BR-26 step 2 —
    fail loud, never silently substitute a different prompt than the run declares)."'
  cost: 'The comments restate the rule that an extraction''s prompt version must be one the system holds,
    and they cite "BR-26", a back-spec rule number, as if it were the authority. Code already holds the
    fact in this file: `if (module === undefined) { throw new UnknownPromptVersionError(promptVersion);
    }`. The citation can drift from the node, and the next reader will look in the comment instead of
    in rules/knowledge-base/prompt-version-known. The comments also name a 500 SYSTEM_INTERNAL_ERROR outcome
    that this file does not produce. I did not check whether code in another file maps the error to that
    code.'
  node: rules/knowledge-base/prompt-version-known
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring above aggregateToolCallOutcomes, lines 111-118, and the comment at lines 148-149
  evidence: '*   - `orphaned_fragments`, the count of this run''s `proposed` fragments with *     no provenance
    row (uncited → unsearchable; recall-gap signal). Defined *     identically to the retry orphan-cleanup
    in `retryLlmRunRow` (BR-10).'
  cost: The prose states the orphan count in the summary and the definition of an orphan. The SELECT count(*)
    query in this function holds both. A second statement outside behavior can drift from the node without
    anything noticing.
  node: rules/knowledge-base/summary-counts-orphaned-fragments
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring above findRecentIngestions, lines 59-63
  evidence: '* Most recent ingestions, newest first. Read-only; the caller wraps this in a * `BEGIN READ
    ONLY` transaction. `limit` is validated (1..50) at the toolset * boundary before it reaches here.'
  cost: The 1..50 bound is a second home outside behavior. The code that enforces it is ListRecentIngestionsMcpInputSchema
    in src/modules/ingestion/mcp/mcp-schemas.ts (`.min(1).max(50)`), and this file's query forwards `limit`
    unchecked. If the node changes the bound, this comment goes stale and misleads the next reader about
    what this function accepts.
  node: rules/knowledge-base/recent-ingestions-limit-bounds
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring above retryLlmRunRow (lines 165-171) and the inline comment before the second UPDATE
    (lines 188-189)
  evidence: '* In the same transaction, orphan `proposed` fragments of this run are * flipped to `rejected`.
    // Orphan-fragment cleanup (BR-10): proposed fragments of THIS run that have // no provenance row
    are flipped to `rejected`.'
  cost: The prose restates the retry cleanup rule while the UPDATE ... SET status = 'rejected' in this
    same function holds it. A second statement of the rule sits outside behavior, so a reader may take
    it for the place the rule lives and not look at the node.
  node: rules/knowledge-base/retry-rejects-orphaned-fragments
- file: src/modules/ingestion/routes/ingestion.routes.ts
  where: lines 24-44, the file's header comment (TC-13 specifics)
  evidence: '"Perform a run-state pre-check inside the open transaction that distinguishes 404 (`RESOURCE_NOT_FOUND`,
    llm_run row absent) from 409 (`BUSINESS_RUN_NOT_RUNNING`, row present but `status != ''running''`)."
    and "Return HTTP 200 for any reachable handler. The `ok: true/false` flag on the body is the outcome
    indicator — a layered-validation rejection (ValidationFailure) is a *business result*, not a transport
    error"'
  cost: 'The header says the contract''s refusal answers (404 for an unknown run, 409 BUSINESS_RUN_NOT_RUNNING
    for a run that is not running, HTTP 200 carrying `{ ok: false, error }` for a layered-validation rejection)
    a second time as prose. The code in this file already holds them, in handleProposeMirror and its error
    mapping. When the contract changes, the comment is not reached and says what was once decided.'
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/routes/ingestion.routes.ts
  where: lines 484-497, the docstring of handleProposeMirror
  evidence: '"loads the `llm_run` row first to distinguish 404 (unknown id) vs 409 (status != ''running'')"
    and "`RunNotRunningError`    -> HTTP 409 with `BUSINESS_RUN_NOT_RUNNING` envelope." and "`ValidationFailure`     ->
    HTTP 200 with `{ ok: false, error: ... }` envelope (BR-28 envelope semantics)"'
  cost: 'The docstring restates the proposal-requires-running-run refusal and the HTTP 200 `{ ok: false,
    error }` envelope. The same function holds both in code (`if (run.status !== "running") { throw new
    RunNotRunningError(...) }` and `reply.status(409)`), so the prose is a second home outside behavior.'
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/service/affected-nodes.ts
  where: Header comment, lines 19-25 (the CONTRACT paragraph)
  evidence: // `affected_nodes` is attached to a `LlmRunResponse` ONLY when the run's // status === 'completed'.
    Empty array is a valid completed-run payload
  cost: 'The completed-only rule is said a second time in prose. The code that holds it is in llm-run.service.ts,
    where the "BR-33 — attach `affected_nodes` ONLY when the run is `completed`" branch returns `{ ...base,
    affected_nodes: [...affectedNodes] }`. This file never attaches the field. If the node moves, this
    comment keeps saying the old rule, and a reader of this file takes it for where the rule lives.'
  node: rules/knowledge-base/affected-nodes-only-when-completed
- file: src/modules/ingestion/service/affected-nodes.ts
  where: resolveAffectedNodes docstring, lines 225-228
  evidence: '*   - Rows whose `knowledge_node.status = ''merged_into''` are resolved *     transparently
    to the surviving node via `merged_into_node_id`.'
  cost: A comment restates the merge-following rule. The code of step 3 in this same function holds it
    (`row = survivor;`). The prose is a second home for the fact outside behavior.
  node: rules/knowledge-base/affected-nodes-follow-merges
- file: src/modules/ingestion/service/affected-nodes.ts
  where: resolveAffectedNodes docstring, lines 229-231
  evidence: '*   - Ids the lookup does not find at all (e.g. a node compliance-deleted *     between the
    tool call and run-completion) are skipped silently'
  cost: A comment restates the omit-absent rule. The code in this file (`if (row === undefined) continue;`)
    holds it. The prose is a second home for the fact outside behavior.
  node: rules/knowledge-base/affected-nodes-omit-absent
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the docstring of MATCH_FLOOR, lines 34-41
  evidence: "* Trigram-similarity floor below which a candidate is ignored entirely.\n * Candidates with\
    \ `sim < MATCH_FLOOR` do not feed the decision and do not\n * produce `entity_match_review` rows.\
    \ BR-25 / A12."
  cost: The floor rule (0.55, and no review rows below it) is restated in prose. `MATCH_FLOOR = 0.55`,
    the `aboveFloor` filter and the review-row loop already hold it.
  node: rules/knowledge-base/ambiguous-candidates-need-review
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the docstring of MATCH_STRONG, lines 26-32
  evidence: "/**\n * Trigram-similarity ceiling above which a SINGLE candidate is taken as a\n * strong\
    \ match (reuse the existing node). BR-25 / A12."
  cost: The strong-match rule is restated in prose beside the constant `MATCH_STRONG = 0.85` that holds
    it. A reader can take the docstring as a second authority for the threshold.
  node: rules/knowledge-base/strong-candidate-resolves
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the docstring of decideFromCandidates, lines 249-262
  evidence: '*   - Strong unique: exactly ONE candidate with `sim >= MATCH_STRONG` AND no *     other
    candidate has `sim >= MATCH_FLOOR`. *   - Ambiguous: any candidate has `sim ∈ [MATCH_FLOOR, MATCH_STRONG)`
    OR two *     or more candidates have `sim >= MATCH_STRONG`. *   - Novel: every candidate has `sim
    < MATCH_FLOOR` (empty set included).'
  cost: The three-way resolution rules are restated in prose above the branches (`strong.length === 1
    && aboveFloor.length === 1`, the `novel` return, the `ambiguous` return) that hold them. Prose and
    code can drift apart, and the prose then reads as a decision.
  node: rules/knowledge-base/strong-candidate-resolves
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the file-header comment, lines 10-14 ("Why the lock comes first (BR-20)")
  evidence: '// Why the lock comes first (BR-20): two concurrent `propose_node` calls for // the same
    `(node_type, norm(name))` must NOT race on the resolve-or-create // branch. Acquiring the advisory
    lock before the first SELECT serialises both // the candidate scan AND the subsequent INSERT inside
    the same transaction;'
  cost: The serialisation of concurrent proposals of one name under one node type is stated a second time
    in prose. The lock call in resolveOrCreateNode (pg_advisory_xact_lock, lines 125-128) already holds
    it. When the node moves, this comment stays behind and reads as a current statement of the rule.
  node: rules/knowledge-base/concurrent-proposals-resolve-in-turn
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the comment block above `const reaffirmation` in consolidateLinkOnce, lines 530-548
  evidence: '"For MULTI-CURRENT types (`functional === false`): `valid_from` equality is NOT required.
    ... For FUNCTIONAL types (`functional === true`): also require `sameValidFrom`."'
  cost: 'The comment states, in prose, the node''s rule on when a proposal re-affirms (change hint none,
    same validity start only for a type that does not allow multiple current assertions). The code below
    it already holds that rule: `sameTarget && args.change_hint === "none" && (!functional || sameValidFrom)`.
    A second statement of the rule outside the node can drift from the node. The attribute branch already
    has, and the comment does not mention that difference.'
  node: rules/knowledge-base/reaffirmation-consolidates
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the doc comment above ingestRawInformation, step 2 (lines 80-81), against the composeIdempotencyKey
    call at lines 104-109
  evidence: '"2. Compute `idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`."
    The code beside it is: const idempotencyKey = composeIdempotencyKey({ content_hash: contentHash, prompt_version:
    input.prompt_version, model: input.model, chunking_version: CHUNKING_VERSION });'
  cost: The key's composition is written a second time in prose. If the node changes, this comment keeps
    stating the old composition, and a reader who trusts it will believe the old rule is the current one.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/service/propose-attribute.service.ts
  where: lines 131-134, the comment above the source-metadata query
  evidence: // `received_at` is the LAST link of the date-justification chain (v7 §6.5 / §13c / A14) //
    and is consumed by `validateTemporal` as the fallback for // `requires_valid_from = true` rows that
    carry no stated/document date.
  cost: 'The comment restates the rule that a proposal needing a validity start falls back to the document
    date and then the reception date. Code holds it too: `received_at: receivedAt` is passed into `validateTemporal`.
    The comment is prose outside behavior and can diverge from the node without anything noticing.'
  node: rules/knowledge-base/required-start-available
- file: src/modules/ingestion/service/propose-attribute.service.ts
  where: lines 85-92, the comment above the closed-domain gate
  evidence: // Closed-domain gate (BR-30). ... `assertValueInDomain` rejects out-of-domain literals //
    with `VALIDATION_INVALID_FORMAT` carrying `{ value, allowed_values }`. // Exact match (no normalisation)
    per spec §1 / BR-30 v1 semantics.
  cost: 'The comment restates a rule the node holds: a value must be one of the allowed values exactly
    as written. Code holds it too, in the call `assertValueInDomain(args.value, domain)` in this file.
    The comment is a second home for the rule outside behavior. If the node moves, the comment keeps saying
    the old rule and no check reaches it.'
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/service/propose-fragment.service.ts
  where: the comment block inside the mismatch branch of proposeFragmentService, lines 50-55
  evidence: '"//  - chunk_id resolves to no row -> RESOURCE_NOT_FOUND (UC-08 alt 2b)."'
  cost: The comment states in prose that a cited chunk must exist, which is a second home for rules/knowledge-base/fragment-chunks-exist.
    The `throw new ValidationFailure("RESOURCE_NOT_FOUND", ...)` below it already holds the fact, so the
    comment adds nothing. It cites a "UC-08 alt 2b" that no node carries, and it will go stale without
    anyone noticing if the node moves.
  node: rules/knowledge-base/fragment-chunks-exist
- file: src/modules/ingestion/service/propose-fragment.service.ts
  where: the comment block inside the mismatch branch of proposeFragmentService, lines 50-55
  evidence: '"//  - chunk_id belongs to a different source -> VALIDATION_INVALID_FORMAT //    (cross-table
    FK mismatch, alt 2c)."'
  cost: 'The comment states in prose that a cited chunk must belong to the run''s raw information, which
    is a second home for rules/knowledge-base/fragment-chunks-in-run-source. The code already holds it,
    in the `expected_raw_information_id: runCtx.rawInformationId` argument to countChunksInSource and
    in the VALIDATION_INVALID_FORMAT throw. The comment adds an "alt 2c" citation that no node carries.'
  node: rules/knowledge-base/fragment-chunks-in-run-source
- file: src/modules/ingestion/service/propose-link.service.ts
  where: Header docstring, line 13 and lines 17-20 (confidence floor), restated again by the Layer 4 comment
    at lines 169-171.
  evidence: '// 4. Confidence    — < 0.40 -> ok:true outcome=rejected (BELOW_CONFIDENCE_FLOOR). // On
    confidence < 0.40 the service returns `{ ok: true, result: { outcome: // ''rejected'', reason: ''BELOW_CONFIDENCE_FLOOR''
    } }`. The caller maps this to // `validation_outcome = ''rejected''` on the `tool_call` row (BR-17).'
  cost: The 0.40 floor is quoted as a number in prose. The decision itself is the `route.kind === "below_floor"`
    branch, which returns before any write. The numeric value is not stated in this file's code; it comes
    from the imported routeConfidence, which I did not open because it is outside the file set. If the
    floor changes, the comment keeps saying 0.40 while the node and the code move.
  node: rules/knowledge-base/below-confidence-floor-records-nothing
- file: src/modules/ingestion/service/propose-link.service.ts
  where: Header docstring, lines 6-15 (the five-layer list), restated again by the "---- Layer N" section
    comments at lines 66, 127, 138, 167 and 180.
  evidence: '// Layered validation (BR-13) in the documented order. Each layer is a // sequential `await`,
    so layer N+1 only runs when layer N has not thrown: //   1. Structural    — cross-table refs (nodes
    exist, fragments exist, //                      link_type known). //   2. Graph rules   — active link_type_rule
    for the triple (BR-15). //   3. Temporal      — semi-open invariant, change_hint signal, date basis.
    //   4. Confidence    — < 0.40 -> ok:true outcome=rejected (BELOW_CONFIDENCE_FLOOR). //   5. Anti-halluc.  —
    every cited fragment anchors a chunk of the run''s //                      source (BR-18).'
  cost: The order in which a link proposal is checked is written a second time in prose. The running code
    already holds it as the sequence of awaits (assertKnownType, assertFound, the fragment query, validateGraphRule,
    validateTemporal, routeConfidence, countFragmentsAnchoredToSource). The comment can drift from that
    sequence without anything noticing. A reader who trusts it will not look in rules/knowledge-base/link-proposal-check-order.
  node: rules/knowledge-base/link-proposal-check-order
- file: src/modules/ingestion/validation/confidence.ts
  where: header comment, lines 3-5 (the 0.75 and 0.40 to 0.75 routing table)
  evidence: //   confidence >= 0.75            -> assertion status = 'active' //   0.40 <= confidence
    < 0.75     -> assertion status = 'uncertain'
  cost: The same thresholds are written in prose beside the constants that enforce them (CONFIDENCE_UNCERTAIN_UPPER
    = 0.75, CONFIDENCE_FLOOR = 0.4). The comment is a second home for a number the node already holds.
    If the node's thresholds move, the comment goes stale without anything flagging it, and a reader may
    take it for the decision.
  node: rules/knowledge-base/new-assertion-status-from-confidence
- file: src/modules/ingestion/validation/confidence.ts
  where: header comment, lines 6-7 (the below-0.40 branch)
  evidence: //   confidence < 0.40             -> link/attribute NOT created; //                                    supporting
    fragments stay `proposed`, //                                    surfaced with `low_confidence` flag.
  cost: The comment states the below-floor outcome in prose, next to code that carries only the classification
    (the "below_floor" route). The no-record rule is therefore written in two places, and a reader can
    take the comment for its home. The rest of the sentence, about fragments and flags, describes behavior
    this file does not implement.
  node: rules/knowledge-base/below-confidence-floor-records-nothing
- file: src/modules/ingestion/validation/errors.ts
  where: header comment, lines 27-29 (the paragraph on the extra BUSINESS_RUN_NOT_RUNNING code)
  evidence: // The extra `BUSINESS_RUN_NOT_RUNNING` code is emitted by the MCP handler // guard when the
    ambient `llm_run_id` points to a row whose `status` is not // `'running'` (BR-21 / catalog Ingestion
    section).
  cost: 'The comment states that a proposal is refused unless its run is running, which is a fact a node
    holds. The code already holds it: handler-base.ts line 117 emits "BUSINESS_RUN_NOT_RUNNING", and llm-run.service.ts
    defines RunNotRunningError with that code. The comment is a second home for the rule outside behavior.
    A reader who trusts it would not know it can go stale, for example if the node is later reworded to
    say "ambient".'
  node: rules/knowledge-base/proposal-requires-running-run
- file: src/modules/ingestion/validation/structural.ts
  where: the comments inside parseAttributeValue, lines 22-25, 37 and 57
  evidence: '"Rejects "tomorrow" for `date`, "abc" for `number`, etc." and "// Strict ISO YYYY-MM-DD;
    not free-form." and "// Strict: must be a finite numeric literal (no NaN, no Infinity)."'
  cost: The value-parsing rule has a second home in prose. If the node's expression changes, the comments
    keep saying the old rule beside code that no longer matches. A reader may take them for the decision.
    The code in this file (the regexes at lines 38 and 58, the `Date.parse` check, the `true`/`false`
    comparison) already holds the fact.
  node: rules/knowledge-base/attribute-value-parses
- file: src/modules/ingestion/validation/structural.ts
  where: the docstring of assertValueInDomain, lines 88-108, and the comment at lines 116-118
  evidence: '"exact-match string equality, no normalisation, no case-folding, no trim (v1 semantics, §1
    / BR-30)." and "// `[...domain].sort()` is locale-default lexicographic, which matches the prompt
    builder''s enumeration order"'
  cost: 'The closed-domain rule (exact match, sorted allowed values) is restated as prose. It also carries
    a claim that is not the code''s behavior: `Array.prototype.sort()` with no comparator orders by UTF-16
    code unit, not by locale. A reader who trusts the comment learns a different ordering than the one
    the code applies. The code (`domain.has(value)` and `[...domain].sort()`) already holds the fact.'
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/validation/structural.ts
  where: the file header comment, lines 1-18, and the docstring of assertKnownType, lines 146-149
  evidence: '"node_type, link_type, attribute_key all live in the seeded catalog." and "* `propose_attribute`:
    key.node_type_id == node.node_type_id;" and "Assert a catalog membership; raise the kind-specific
    `BUSINESS_UNKNOWN_*` code on miss"'
  cost: The rule that an attribute key must be held for its node's type, and the refusal codes for unknown
    types, are restated in a header whose contents no running system emits. This file only raises the
    error for a `found` flag the caller computes, so the header reads as if the file decided the rule.
    If the node moves, the header stays and misleads.
  node: rules/knowledge-base/attribute-key-for-node-type
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment lines 10-13 and the ERRATA_MARKERS docstring lines 61-66
  evidence: '// - correction signal: `change_hint = ''correction''` requires textual errata //   evidence
    in at least one cited fragment.'
  cost: The comment and the docstring restate the rule and its marker list, and the code holds both in
    `ERRATA_MARKERS` and `hasErrataSignal` in this file. The pair conforms. The prose is a second home
    for the marker list.
  node: rules/knowledge-base/correction-requires-errata-evidence
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment lines 4-5 and the throw at lines 107-114
  evidence: '// - semi-open invariant: `valid_from < valid_to` when both are provided //   (BR-16 / §13.3
    / §5.2).'
  cost: The comment restates a rule that rules/knowledge-base/validity-start-before-end holds and that
    the code at `input.valid_from >= input.valid_to` enforces in this file. The pair conforms. The prose
    is a second home that can drift from the node.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment lines 6-9 and the comment at lines 128-135, beside the throw at lines 136-142
  evidence: '// - date justification chain (A14 / §6.5): when `requires_valid_from = true` // ... the
    caller must declare a non-null `valid_from_basis`.'
  cost: The comment restates the rule that a stated validity start needs a basis. The code at `input.valid_from
    !== null && input.valid_from_basis === null` enforces it in this file. The pair conforms. The prose
    is a second home that can drift from the node.
  node: rules/knowledge-base/stated-start-requires-basis
- file: src/modules/knowledge-graph/dto/queries.dto.ts
  where: the doc comment above TraverseDepthCoercer, lines 130-136
  evidence: '* Out-of-range `depth` is detected here AND re-asserted in the service layer * (defence in
    depth, BR-05 of back spec). Zod failure surfaces as Zod parse * error (422 VALIDATION_INVALID_FORMAT
    through the global handler); the * service-layer assertion produces BUSINESS_INVALID_TRAVERSE_DEPTH'
  cost: The depth-bounds rule and its refusal code are described in prose that cites a back spec rather
    than the specification node. The prose also says the range is detected in this file, but TraverseDepthCoercer
    only checks that the value is a finite number. The bounds are held in ../traversal/config.js (TRAVERSAL_DEPTH_MIN,
    TRAVERSAL_DEPTH_MAX), which this file re-exports as TRAVERSAL_DEPTH_BOUNDS. A reader trusting the
    comment would look for a range check here that does not exist.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/dto/queries.dto.ts
  where: the doc comment above TraverseDirectionSchema, lines 114-117
  evidence: '* Direction enum mirrors `openapi.yaml` traverseNode `direction` parameter. * Default in
    this schema is `both` (matches OpenAPI).'
  cost: The traversal default of following links from either end is stated a second time in prose, and
    the prose names openapi.yaml as its authority, so the next reader checks that file instead of the
    specification node. The code in this file already holds the default, so nothing needs to change except
    the removal of the prose.
  node: rules/knowledge-base/traversal-defaults
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: the header comment, lines 13-17 (mode 1, "current view"), above the lines array in applyTemporalFilter
  evidence: '//   1. asOf undefined            -> "current view" (query (a), BR-07):

    //        AND <alias>.valid_to IS NULL

    //        AND <alias>.superseded_at IS NULL'
  cost: The current-view rule is written out a second time in prose beside the code that holds it. When
    the node moves, the comment keeps stating the old rule, and the next reader may take it for the decided
    one.
  node: rules/knowledge-base/graph-read-current-view
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: the header comment, lines 16-17 and 24-25 (the in-effect clause and the `inEffectOnly` note)
  evidence: '//        [AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= current_date)]

    //          (the bracketed clause is added when `inEffectOnly = true`)

    // Note: the `inEffectOnly` flag is meaningful only in mode 1 — when'
  cost: The in-effect-only rule (no as-of date, validity start no later than today) is stated in prose
    as well as in the `inEffectOnly` branch. The comment would keep saying the old rule after the node
    changed.
  node: rules/knowledge-base/graph-read-in-effect-only
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: the header comment, lines 19-22 (mode 2, "valid-time travel")
  evidence: '//   2. asOf provided             -> "valid-time travel" (query (b), BR-08):

    //        AND <alias>.superseded_at IS NULL

    //        AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= $asOf)

    //        AND (<alias>.valid_to   IS NULL OR <alias>.valid_to   >  $asOf)'
  cost: The as-of window rule (validity start on or before the date, validity end after it) is restated
    in prose while the same predicate is in the `sql` array below it. A change to the node leaves two
    statements of the window that can disagree.
  node: rules/knowledge-base/graph-read-as-of-view
- file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  where: header comment, lines 3-5 (the enforcement of owner authentication on this module's routes)
  evidence: // Mounted under `/api/v1/*` by the bootstrap (`app.ts`). The parent scope // already enforces
    Neon Auth JWT (BR-01); individual handlers do NOT // re-check the token.
  cost: The refusal of a request without valid owner authentication is described a second time in prose
    in a routes file that does not carry it. The next reader may take this comment for the place where
    authentication is decided, and it will not move when the node does. Code holds the fact in another
    file, `scoped.addHook("preHandler", auth.preHandler);` in `src/app.ts` (line 136), so the pair conforms
    and only the prose is owed removal.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/catalog.service.ts
  where: the comment block above the valid-values query in listAttributeKeysService, lines 110-112
  evidence: // BR-30 — attach closed-domain values so REST/MCP clients see the allowed // set up-front
    (parity with the chat ontology block). Group per key id; // keys with no rows stay OPEN (no `valid_values`).
  cost: 'The comment restates the retrieval contract''s rule that `valid_values` appears only for a key
    the catalog closes. The code holds that rule in the same function, in `values !== undefined && values.length
    > 0 ? { ...base, valid_values: [...values].sort() } : base`. The sentence is a second place describing
    the rule. If the rule changes, the comment will go on describing the old one, and a reader may take
    it for the decision.'
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/formatters.ts
  where: the docstring above deriveFlags(), lines 99-104
  evidence: '"Derive the display flags surfaced in `LinkDetail.flags` and `AttributeDetail.flags`. Today
    this mirrors the storage `status` for `uncertain` / `disputed`; `low_confidence` is reserved for a
    future threshold-based flag."'
  cost: The docstring is prose that no running system emits. It restates the flag rule that deriveFlags()
    already implements, and it adds that low_confidence is "reserved for a future threshold-based flag".
    The node says a graph read "never flags it low-confidence". A reader who finds the docstring before
    the node may treat a future low_confidence flag on graph reads as planned. The node says the opposite.
  node: rules/knowledge-base/graph-item-flags
- file: src/modules/knowledge-graph/service/history.service.ts
  where: the comment above the catalog lookup in getAttributeKeyHistoryService, lines 105-108
  evidence: // BR-20 — resolve `(node_type_id, key)` via the catalog cache. The // attribute_key id is
    required to scope the history listing; a miss // surfaces as 404 (BUSINESS_UNKNOWN_ATTRIBUTE_KEY)
    because the segment // is part of the URL hierarchy, not a free query parameter.
  cost: Prose restates the read-attribute-key-history refusal "HTTP 404, error code BUSINESS_UNKNOWN_ATTRIBUTE_KEY
    naming the node type and key". The code holds it through `throw new UnknownAttributeKeyError(node.node_type,
    input.key)`. The comment also gives a rationale and a back-spec rule number that no node carries.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/history.service.ts
  where: the comment above the final return of getAttributeKeyHistoryService, lines 121-123
  evidence: '// Note: an empty result is a valid response — the caller queried a key // that exists in
    the catalog but has no attributes recorded yet on this // node. Return `{ versions: [] }` rather than
    404.'
  cost: Prose restates the retrieval contract's answer for read-attribute-key-history, "an empty list
    when the knowledge node holds none for the key". The code already behaves this way, because empty
    rows pass through assembleAttributeHistory to `{ versions }`. The sentence is a second home outside
    behavior.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/history.service.ts
  where: the comment above the node lookup in getAttributeKeyHistoryService, line 96
  evidence: // BR-11 — resolve the node first; 404 if absent, 410 if tombstoned.
  cost: Prose restates the node-absent (404) and node-deleted (410) refusals of read-attribute-key-history.
    The throws of ResourceNotFoundError and NodeDeletedError in the next lines hold them. The comment
    also cites a back-spec rule number, so the fact has a second named home.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the comment at line 101 above the deleted check in getNodeByIdService
  evidence: // BR-11 — deleted -> 410 (row exists but tombstoned).
  cost: The comment restates the refusal of a node read for a deleted node, and the HTTP 410 mapping with
    it. It is a second home for a fact the code and the node already hold.
  node: rules/knowledge-base/deleted-node-read-refused
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the comment at line 105 after the deleted check in getNodeByIdService
  evidence: // Merged nodes return 200 with the merged_into pointer; caller follows.
  cost: The comment states that a merged node is answered as itself. The code holds this by having no
    branch for status "merged". The comment is a second home, and it adds that the caller follows the
    pointer, which the node does not say.
  node: rules/knowledge-base/merged-node-read-as-itself
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the comment at line 52 above the node_type lookup in listNodesService
  evidence: // BR-03 — resolve node_type name to id via cache.
  cost: The comment restates, as a BR number, the refusal of a node type the catalog does not hold. A
    second home outside behavior will drift when the node moves.
  node: rules/knowledge-base/node-type-filter-in-catalog
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the comment at line 62 above the status default in listNodesService
  evidence: // BR-15 — default to active when caller omits status.
  cost: The comment restates the node's default-to-active rule, which the code holds in the same file.
    The comment is a second home that nothing reads.
  node: rules/knowledge-base/node-listing-by-status
- file: src/modules/knowledge-graph/service/norm.ts
  where: The header comment block, lines 1-14, and the docblocks on collapseSpaces, stripDiacritics and
    norm, lines 16, 21 and 26.
  evidence: // norm(x) = lower(unaccent(collapseSpaces(trim(x)))) // This is the SINGLE normalization
    policy of the system (CLAUDE.md // "Conventions").
  cost: The comment states the name-normalization policy in prose a second time. The executable form is
    the norm() function in this file, which trims, strips diacritics, collapses whitespace and lower-cases.
    A reader who changes the rule in the node, or changes this function, will also find a separate prose
    statement of the policy that nothing keeps in step with either. The comment also points the reader
    to CLAUDE.md as the authority, when the node rules/knowledge-base/name-normalization is.
  node: rules/knowledge-base/name-normalization
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: comment at lines 259-261, inside the hop loop
  evidence: '// Dedup links by underlying knowledge_link.id (BR-22). Keep the

    // SMALLEST hop number seen so far (BFS guarantees the first sight is

    // the minimum hop), so we only insert on first encounter.'
  cost: The show-each-link-once-at-first-hop rule is restated in prose above `if (linksById.has(row.id))
    continue;`, which already holds it. The comment is a second home for the rule.
  node: rules/knowledge-base/traversal-link-once
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, line 11
  evidence: //   - Score = `TRAVERSAL_DECAY ** hop` (BR-14).
  cost: The scoring rule is stated in prose beside the code that applies it, `const score = Math.pow(TRAVERSAL_DECAY,
    hop);`, with the 0.5 value in ../traversal/config.ts. The comment is a second home for the rule that
    nothing reads.
  node: rules/knowledge-base/traversal-link-score
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, lines 7-8, and the doc comment of traverseNodeService, line 72
  evidence: '//   - `depth ∈ [1, 3]`; out-of-range -> `InvalidTraverseDepthError`

    //     (BR-05).

    ...

    *   - InvalidTraverseDepthError (BR-05) — depth outside [1, 3].'
  cost: The depth bound is written as prose twice more in this file. The code holds it in assertDepth,
    using TRAVERSAL_DEPTH_MIN and TRAVERSAL_DEPTH_MAX from ../traversal/config.js. The next reader finds
    a third copy of the 1..3 bound that nothing reads, and it can drift from the node.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/traversal/config.ts
  where: The doc comment on TRAVERSAL_DEPTH_DEFAULT (line 26)
  evidence: /** Default depth when the caller does not specify one. */ export const TRAVERSAL_DEPTH_DEFAULT
    = 1 as const;
  cost: The default-depth rule is stated in prose beside the constant. The node says a traversal that
    omits an option "goes one hop deep". The comment is a second statement of that default that nothing
    keeps in step with the node.
  node: rules/knowledge-base/traversal-defaults
- file: src/modules/knowledge-graph/traversal/config.ts
  where: The doc comments on TRAVERSAL_DEPTH_MIN and TRAVERSAL_DEPTH_MAX (lines 20 and 23)
  evidence: /** Lower bound on the depth parameter (BR-05 of `knowledge-graph.back.md`). */ /** Upper
    bound on the depth parameter (BR-05). */
  cost: The depth bounds are described in prose that cites a back-spec rule rather than the node. A reader
    who follows the citation is sent to a document that is not the authority. The node moving does not
    reach this comment.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/traversal/config.ts
  where: The header comment (lines 1-15) and the doc comment on TRAVERSAL_DECAY (line 17)
  evidence: '/** Per-hop score multiplier: `score(hop) = TRAVERSAL_DECAY ** hop`. */ export const TRAVERSAL_DECAY
    = 0.5 as const;'
  cost: The scoring rule is written in prose a second time beside the constant. The node says "A knowledge
    link a traversal reaches at hop h scores 0.5 raised to the power h". When the node moves, `--check`
    does not reach this comment, so it can quietly go on stating the old formula. The code that holds
    the value, the constant, is not affected.
  node: rules/knowledge-base/traversal-link-score
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: the docstring above ListAcceptedFragmentsQuerySchema, line 26 (`limit` is `[1..100]`)
  evidence: '* - `limit` is `[1..100]`, default `20`; `offset >= 0`, default `0` —'
  cost: The limit bounds are written in prose while `.min(1).max(100)` on line 33 already enforces them.
    If the bound moves in the node, the comment keeps stating 100.
  node: rules/knowledge-base/page-limit-bounds
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: the docstring above ListAcceptedFragmentsQuerySchema, line 26 (`offset >= 0`)
  evidence: '* - `limit` is `[1..100]`, default `20`; `offset >= 0`, default `0` —'
  cost: The offset minimum is written in prose while `z.number().int().min(0)` on line 36 already enforces
    it. The comment can drift from the node unnoticed.
  node: rules/knowledge-base/page-offset-non-negative
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: the docstring above ListAcceptedFragmentsQuerySchema, line 26 (the defaults `20` and `0`)
  evidence: '* - `limit` is `[1..100]`, default `20`; `offset >= 0`, default `0` —'
  cost: The page defaults are written in prose while `.default(20)` and `.default(0)` on lines 35-36 already
    hold them. If the node's default changes, the comment goes stale.
  node: rules/knowledge-base/page-defaults
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: the docstring above ListAcceptedFragmentsQuerySchema, lines 20-24 (the llm_run_id / raw_information_id
    bullet)
  evidence: '* - `llm_run_id` / `raw_information_id` are independently optional but at *   least one MUST
    be supplied; otherwise the `.refine` raises a'
  cost: The one-of-two-filters requirement is written in prose while the .refine on lines 39-45 already
    enforces it. The prose is a second home for a fact the node holds. If the node changes, the comment
    is not reached and keeps stating the old rule.
  node: rules/knowledge-base/listing-requires-a-filter
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: the comment above LayersArray, lines 20-25
  evidence: "non-enum elements raise\n * a ZodError that the service translates to BUSINESS_INVALID_SEARCH_LAYER."
  cost: The refusal code for a layer outside the set is stated in a comment in the DTO file, though the
    DTO does not produce it. The node does not bind this file, and the comment will not follow if the
    node changes.
  node: rules/knowledge-base/search-layer-outside-set-refused
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: the comment above QueryString, lines 37-47
  evidence: "`query` validation per BR-04 of the back spec:\n *   - min 1 char (raw)\n *   - max 1000\
    \ chars (raw)\n(code: `.max(1000, { message: \"query exceeds 1000 characters\" })`)"
  cost: 'The 1000-character ceiling is stated twice in this file: in the comment and in `.max(1000, ...)`.
    The comment cites a back-spec rule by number instead of the node. A reader checking the limit is sent
    to a source outside the specification.'
  node: rules/knowledge-base/search-query-length
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: the same comment above QueryString, lines 37-47
  evidence: 'btrim non-empty after transform (rejects whitespace-only input) (code: `.transform((s) =>
    s.trim()).refine((s) => s.length > 0, {`)'
  cost: The blank-after-trim refusal is restated in prose beside the code that implements it, with a back-spec
    rule number as its cited authority.
  node: rules/knowledge-base/search-query-not-blank
- file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  where: the comment block above the /fragments/accepted handler, lines 158-163
  evidence: // filtered by `llm_run_id` and/or `raw_information_id` (at least // one required). Tombstoned
    sources are silently omitted.
  cost: The comment restates a rule a node already holds, and the code holds it in another file. fragment.dto.ts
    carries `.refine((v) => v.llm_run_id !== undefined || v.raw_information_id !== undefined`. A second
    home in prose means a reader may take the comment, not the node, as where the rule lives. The pair
    conforms, so what is owed is the prose's removal.
  node: rules/knowledge-base/listing-requires-a-filter
- file: src/modules/query-retrieval/service/search.service.ts
  where: line 381, the comment above the sort at lines 384-389
  evidence: '// (i) Rank (BR-15): score DESC, recordedAtTs DESC, id ASC.'
  cost: 'The comment restates the ranking order. The comparator holds it, with a node counting as never
    recorded through `recordedAtTs: 0`. The prose is a second home for the order.'
  node: rules/knowledge-base/search-ranking
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 178-184, the BR-10 comment block above the items list
  evidence: // list never carries a chunk row"), we DROP all chunk hits unconditionally
  cost: The comment restates that a chunk-layer match never surfaces. The code already holds that, because
    `chunkHits` is never pushed into `items`. The comment is a second home for the fact and only needs
    removing.
  node: rules/knowledge-base/chunk-match-never-surfaces
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 241-243, the comment above the node-hit provenance check
  evidence: '// hit without ANY accepted-fragment trace is dropped — we never

    //      // surface a node without a provenance chain.'
  cost: The comment restates that a matched node surfaces only when an accepted fragment mentions it.
    The branch `if (provenance.length === 0) continue;` holds it, so the prose duplicates a node's fact
    outside behavior.
  node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 293-295, the comment above the expanded-link score computation
  evidence: // Score = TRAVERSAL_DECAY ** hop * <source node score>.
  cost: The comment restates the expansion decay rule. The code `Math.pow(TRAVERSAL_DECAY, hop) * sourceScore`
    holds it, with the constant imported from the knowledge-graph module. The prose is a second home for
    the formula.
  node: rules/knowledge-base/expansion-decay
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 331-332, the comment in the empty-provenance branch of the expanded links
  evidence: '// BR-13 / OpenAPI: links without provenance are an alarm but

    //             // we MUST NOT emit a `provenance: []` row. Log warn and drop.'
  cost: The comment restates that an expanded link surfaces only when it holds provenance. The `provenance.length
    === 0` branch with `continue` holds it, so the prose adds a second home.
  node: rules/knowledge-base/expanded-link-requires-provenance
- file: src/shared/health.ts
  where: the docstring above collectHealth, lines 18-23
  evidence: 'Never throws — a DB failure surfaces as `{ ok: false, database: "unreachable" }` so callers
    always get a usable report'
  cost: The never-fails rule is stated in prose here as well as held in the code. The try/catch returning
    the unreachable report already holds it, in this file. A reader can take the comment as the place
    the rule lives, and if the node moves the comment goes stale without anyone being told.
  node: rules/knowledge-base/health-probe-never-fails
unbound:
- src/modules/curation/mcp/curation-transport.ts
adopted: true
pairs_omitted:
- node: constraints/every-operation-requires-owner-authentication
  file: src/middleware/auth.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/local-operator-token-development-only
  file: src/middleware/auth.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/internal-failure-withholds-cause
  file: src/middleware/error-handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/unreachable-store-answers-unavailable
  file: src/middleware/error-handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/compliance-audit
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/affected-counts
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion-filter
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion-outcome
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-page-defaults
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-window-ordered
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-reason-length
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-reason-trimmed
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-limit-bounds
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/compliance-audit
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action-filter
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action-kind
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-target-kind
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-page-defaults
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-window-ordered
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-action-reason-length
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-limit-bounds
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/compliance-deletion-is-atomic
  file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/llm-toolset-omits-audit-reads
  file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/compliance-audit
  file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-filter-checks-order
  file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
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
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
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
- node: constraints/compliance-deletion-is-atomic
  file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/compliance-audit
  file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/audit-filter-checks-order
  file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-deletion-check-order
  file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
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
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
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
- node: contracts/knowledge-base/compliance-audit
  file: src/modules/compliance-audit/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/dispute-resolution
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjust-periods-one-per-item
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-reason-required
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-request-check-order
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-distinct-items
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prefer-one-requires-winner
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/unused-resolution-fields-ignored
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/validity-start-before-end
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/entity-match-resolution
  file: src/modules/curation/dto/entity-match.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-merge
  file: src/modules/curation/dto/entity-match.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-reason-not-blank
  file: src/modules/curation/dto/entity-match.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-reason-required
  file: src/modules/curation/dto/entity-match.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-into-requires-target
  file: src/modules/curation/dto/entity-match.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-never-merged-into-itself
  file: src/modules/curation/dto/entity-match.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-kind
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-status
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/dispute-decision
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/entity-match-decision
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-status
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/review-queue-kind
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-reason-not-blank
  file: src/modules/curation/dto/enums.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-correction
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-review
  file: src/modules/curation/dto/item.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/corrected-values
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
- node: domain/knowledge-base/review-queue-filter
  file: src/modules/curation/dto/queue.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-defaults
  file: src/modules/curation/dto/queue.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-limit-bounds
  file: src/modules/curation/dto/queue.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/curation/dto/queue.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-transports-answer-alike
  file: src/modules/curation/mcp/curation-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/llm-toolset-omits-curation-metrics
  file: src/modules/curation/mcp/curation-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-transports-answer-alike
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjust-periods-one-per-item
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/corrected-stated-start-cites-fragment
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-changes-something
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-reason-required
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-request-check-order
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-into-requires-target
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-never-merged-into-itself
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prefer-one-requires-winner
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/stated-start-requires-basis
  file: src/modules/curation/mcp/error-envelope.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/validity-start-before-end
  file: src/modules/curation/mcp/error-envelope.ts
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
- node: domain/knowledge-base/knowledge-link
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/node-attribute
  file: src/modules/curation/repository/curation.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: constraints/curation-transports-answer-alike
  file: src/modules/curation/routes/curation.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-request-checked-first
  file: src/modules/curation/routes/curation.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-is-atomic
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/dispute-decision
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjust-periods-outcome
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjusted-periods-single-open
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-check-order
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-records-curation-action
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-requires-disputed-items
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-single-scope
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/keep-disputed-changes-nothing
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prefer-one-outcome
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prefer-one-requires-winner
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-curation-records-nothing
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-is-atomic
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/entity-match-decision
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-refuses-deleted-node
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-check-order
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-clears-reviews
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-records-curation-action
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-requires-pending-review
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/keep-separate-activates-node
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-into-requires-target
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-merge-absorbs-active-node
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-merge-records-curation-action
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-never-merged-into-itself
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-curation-records-nothing
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/unused-resolution-fields-ignored
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-is-atomic
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/assertion-review-check-order
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/assertion-review-records-curation-action
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-value-in-allowed-values
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-value-parses
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/confirmation-activates
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/confirmation-requires-uncertain
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/corrected-item-provenance
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/corrected-item-values
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-check-order
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-fragment-accepted
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-records-curation-action
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-supersedes-item
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-curation-records-nothing
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/rejection-and-correction-require-live-item
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/rejection-deletes
  file: src/modules/curation/service/item.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/merge-counts
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-refuses-deleted-node
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-requires-pending-review
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-check-order
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-compresses-paths
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-counts-what-it-changed
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-marks-absorbed-merged
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-requires-same-node-type
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-survivor-active
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-merge-absorbs-active-node
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-never-merged-into-itself
  file: src/modules/curation/service/merge.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/attribute-key
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/link-type
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/link-type-rule
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-type
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/link-permitted-by-type-rule
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-rule-in-effect
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunking-version
  file: src/modules/ingestion/chunker/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/long-block-sentence-chunks
  file: src/modules/ingestion/chunker/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/long-sentence-own-chunk
  file: src/modules/ingestion/chunker/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/short-block-one-chunk
  file: src/modules/ingestion/chunker/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-excerpt-is-verbatim
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-index-follows-content
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunking-version
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunks-never-cross-blocks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/contentless-blocks-single-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/email-header-block
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/email-quote-blocks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/long-block-sentence-chunks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/long-sentence-own-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/pdf-blocks-at-form-feeds
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/short-block-one-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/turn-blocks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/undivided-sources
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/email-without-blank-line-is-one-block
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/form-feed-only-pdf-is-one-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-kind
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-full-confidence
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-ingestion-run
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-pinned-node
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-requires-fragment-and-node
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/document-ingestion-extracts-new-content
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/held-content-records-nothing
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-permitted-by-type-rule
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-in-catalog
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-limit-bounds
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-limit-default
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-order
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/content-hash-is-sha256
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/content-length
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/original-input-length
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-summary
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/summary-counts-orphaned-fragments
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/summary-counts-tool-calls
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/tool-call-page-defaults
  file: src/modules/ingestion/dto/llm-run.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/content-hash-is-sha256
  file: src/modules/ingestion/hash.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key
  file: src/modules/ingestion/hash.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/mcp/handler-base.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-requires-running-run
  file: src/modules/ingestion/mcp/handler-base.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-run-checks-first
  file: src/modules/ingestion/mcp/handler-base.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
  file: src/modules/ingestion/mcp/handler-base.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/default-prompt-version
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/document-ingestion-extracts-new-content
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/held-content-records-nothing
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-run-checks-first
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-summary
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/content-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-shape
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-reference-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-requires-fragment-and-node
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-label-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-validity-start-shape
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-name-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-limit-bounds
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-limit-default
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-requires-running-run
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-run-checks-first
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/ingestion-transports-answer-alike
  file: src/modules/ingestion/mcp/transport.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-value-in-allowed-values
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/below-confidence-floor-records-nothing
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-anchors-to-read-chunk
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-stated-basis-needs-written-start
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-turn-token-ceiling
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/new-assertion-status-from-confidence
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/stated-start-requires-basis
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/extraction.v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/extraction-dates-events
  file: src/modules/ingestion/prompts/extraction.v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-event-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/go-live-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v2.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/extraction-dates-events
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-event-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-event-type-fallback
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-relative-date-needs-document-date
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/go-live-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/default-prompt-version
  file: src/modules/ingestion/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prompt-version-known
  file: src/modules/ingestion/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/repository/ingestion.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/repository/ingestion.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-listing-order
  file: src/modules/ingestion/repository/ingestion.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/knowledge-node
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-summary
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/cited-fragments-anchored
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/closing-stamps-finish-time
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-chunks-in-run-source
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/llm-run-lifecycle
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/orphaned-fragment
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestion-latest-run
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-order
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/retry-counts-attempts
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/retry-rejects-orphaned-fragments
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/summary-counts-orphaned-fragments
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/summary-counts-tool-calls
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/tool-call-listing-order
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/tool-call-total-before-pagination
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/ingestion-transports-answer-alike
  file: src/modules/ingestion/routes/ingestion.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-requires-running-run
  file: src/modules/ingestion/routes/ingestion.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-run-checks-first
  file: src/modules/ingestion/routes/ingestion.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/service/affected-nodes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/node-resolution
  file: src/modules/ingestion/service/affected-nodes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: src/modules/ingestion/service/affected-nodes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/affected-nodes-of-a-run
  file: src/modules/ingestion/service/affected-nodes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-kind
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-status
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-as-text
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-shape
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-chat-pointer-whole
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-defaults
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/directed-dependency-failed
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-dispatch-order
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-fragments-anchor-first-chunk
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-full-confidence
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-ingestion-run
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-item-status
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-later-reference-wins
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-pinned-node
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-reference-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-requires-fragment-and-node
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-run-completes
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-content
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-label-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-metadata
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-turn-is-original-input
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-validity-start-shape
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-name-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/alias-kind
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/entity-match-review
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/knowledge-node
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/node-resolution
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/candidate-similarity
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/exact-alias-resolves
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/matched-node-gains-only-aliases
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/name-normalization
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/new-node-aliases
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/no-candidate-creates-active-node
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/strong-candidate-resolves
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/affected-nodes-only-when-completed
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-anchors-to-read-chunk
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-closes-its-run
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-fails-on-repeated-system-errors
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-requires-running-run
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/model-refusal-skips-chunk
  file: src/modules/ingestion/service/extraction.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/conflict-disputes
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/consolidation-precedence
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/consolidation-race-decided-again
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/consolidation-race-refuses-second-collision
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/consolidation-records-provenance
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-replaces
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/current-assertion
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/new-assertion
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-meets-current-assertion
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/provenance-accepts-proposed-fragment
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/succession-before-previous-start
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/succession-closes-previous
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/succession-closing-date
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/succession-signal
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/same-target-succession-is-disputed
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/content-hash-is-sha256
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/content-hash-unique
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-turn-is-original-input
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/held-content-records-nothing
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/idempotency-key
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key-unique
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/ingestion-records-chunks-and-run
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/service/llm-run.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/service/llm-run.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/service/llm-run.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/affected-nodes-only-when-completed
  file: src/modules/ingestion/service/llm-run.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/llm-run-lifecycle
  file: src/modules/ingestion/service/llm-run.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/tool-call-total-before-pagination
  file: src/modules/ingestion/service/llm-run.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-proposal-check-order
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-value-in-allowed-values
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/below-confidence-floor-records-nothing
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-anchored
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-exist
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-in-run
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-requires-errata-evidence
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/new-assertion-status-from-confidence
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/required-start-available
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/stated-start-requires-basis
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/validity-start-before-end
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/information-fragment
  file: src/modules/ingestion/service/propose-fragment.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/fragment-chunks-exist
  file: src/modules/ingestion/service/propose-fragment.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-chunks-in-run-source
  file: src/modules/ingestion/service/propose-fragment.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-missing-chunk-first
  file: src/modules/ingestion/service/propose-fragment.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/ingestion-transports-answer-alike
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/below-confidence-floor-records-nothing
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-anchored
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-exist
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-in-run
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-proposal-check-order
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/new-assertion-status-from-confidence
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/validation/confidence.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/below-confidence-floor-records-nothing
  file: src/modules/ingestion/validation/confidence.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/new-assertion-status-from-confidence
  file: src/modules/ingestion/validation/confidence.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-requires-running-run
  file: src/modules/ingestion/validation/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-permitted-by-type-rule
  file: src/modules/ingestion/validation/graph-rules.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-value-in-allowed-values
  file: src/modules/ingestion/validation/structural.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/validation/structural.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-in-catalog
  file: src/modules/ingestion/validation/structural.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-requires-errata-evidence
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/date-check-order
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/required-start-available
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/stated-start-requires-basis
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/validity-start-before-end
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/node-filter
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-view
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/traversal-direction
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/traversal-request
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-rules-on-request
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-view-defaults
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-defaults
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-defaults
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/llm-toolset-omits-graph-point-reads
  file: src/modules/knowledge-graph/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-read-only
  file: src/modules/knowledge-graph/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/modules/knowledge-graph/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/value-type
  file: src/modules/knowledge-graph/repository/catalog.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/allowed-values-in-string-order
  file: src/modules/knowledge-graph/repository/catalog.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-listing-by-node-type
  file: src/modules/knowledge-graph/repository/catalog.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-listing-order
  file: src/modules/knowledge-graph/repository/catalog.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-listing-order
  file: src/modules/knowledge-graph/repository/catalog.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-rules-on-request
  file: src/modules/knowledge-graph/repository/catalog.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-listing-order
  file: src/modules/knowledge-graph/repository/catalog.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/alias-kind
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-status
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-status
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/value-type
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-history
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-provenance-one-entry-per-chunk
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-provenance-order
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/history-order
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/lineage-history
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-listing-by-status
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-listing-one-entry-per-node
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-listing-order
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-listing-total-before-pagination
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-read-alias-order
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-read-attribute-order
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-read-excludes-uncertain-on-request
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/point-reads-answer-any-status
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-direction
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-skips-deleted-links
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/current-assertion
  file: src/modules/knowledge-graph/repository/temporal-filter.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-read-as-of-view
  file: src/modules/knowledge-graph/repository/temporal-filter.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-read-current-view
  file: src/modules/knowledge-graph/repository/temporal-filter.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-read-in-effect-only
  file: src/modules/knowledge-graph/repository/temporal-filter.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/in-effect-assertion
  file: src/modules/knowledge-graph/repository/temporal-filter.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-read-only
  file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-filter-in-catalog
  file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/allowed-values-in-string-order
  file: src/modules/knowledge-graph/service/catalog.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-listing-by-node-type
  file: src/modules/knowledge-graph/service/catalog.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-rules-on-request
  file: src/modules/knowledge-graph/service/catalog.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-filter-in-catalog
  file: src/modules/knowledge-graph/service/catalog.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-status
  file: src/modules/knowledge-graph/service/formatters.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/effective-status
  file: src/modules/knowledge-graph/service/formatters.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-alias
  file: src/modules/knowledge-graph/service/formatters.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-item-flags
  file: src/modules/knowledge-graph/service/formatters.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-history
  file: src/modules/knowledge-graph/service/history.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-history-check-order
  file: src/modules/knowledge-graph/service/history.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-history-requires-registered-key
  file: src/modules/knowledge-graph/service/history.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-read-shows-empty-provenance
  file: src/modules/knowledge-graph/service/history.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merged-node-read-as-itself
  file: src/modules/knowledge-graph/service/history.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-filter
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-view
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/deleted-node-read-refused
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-read-shows-empty-provenance
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merged-node-read-as-itself
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/name-normalization
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-listing-by-status
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-filter-in-catalog
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/name-normalization
  file: src/modules/knowledge-graph/service/norm.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/traversal-direction
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-depth-bounds
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-check-order
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-defaults
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-direction
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-drops-merge-self-loops
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-link-once
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-link-score
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-lists-reached-nodes
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-merged-start
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-order
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-substitutes-merged-ends
  file: src/modules/knowledge-graph/service/traversal.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-depth-bounds
  file: src/modules/knowledge-graph/traversal/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-defaults
  file: src/modules/knowledge-graph/traversal/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-link-score
  file: src/modules/knowledge-graph/traversal/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/accepted-fragment-filter
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/listing-requires-a-filter
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-defaults
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/expansion-depth-bounds
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-defaults
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-limit-bounds
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-query-not-blank
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-read-only
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/layer-weights
  file: src/modules/query-retrieval/repository/scoring.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-lexical-only
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-status
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/alias-matching
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-layer-matches-current-chunks
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-offsets-count-code-points
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-layer-matches-accepted-only
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/layer-weights
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-layer-matches-through-aliases
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-layer-skips-merged-and-deleted
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prose-matching
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/provenance-in-recording-order
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-read-only
  file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/unknown-link-type-refused
  file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/accepted-fragment-filter
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: rules/knowledge-base/listing-total-before-pagination
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/listing-for-unknown-source-is-empty
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/empty-provenance-chain-refused
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-layer-outside-set-refused
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-length
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-must-parse
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-not-blank
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/errors.ts
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
- node: constraints/retrieval-is-lexical-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/item-kind
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-item
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-match-cites-its-fragment
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expanded-link-requires-provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-as-of-view
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-follows-both-directions
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-in-effect-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-starts-from-matched-nodes
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/item-flags
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-types-ignored-without-expansion
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-total-before-pagination
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/temporal-filters-apply-to-expansion-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/uncertain-items-excluded-on-request
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/unknown-link-type-refused
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-transports-answer-alike
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/failures-answer-one-envelope
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/ingestion-transports-answer-alike
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/internal-failure-withholds-cause
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/mcp-failure-is-tool-error
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/unreachable-store-answers-unavailable
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/database-status
  file: src/shared/health.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/health-report
  file: src/shared/health.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/health-checked-at-probe-start
  file: src/shared/health.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/health-probe-never-fails
  file: src/shared/health.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 85 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/adopt-test-intent-kb.returns/.\nStaged as an adoption of source no delivery\
  \ wrote: 12 candidate node(s) were read on every file, and each cleared one is bound to the files whose\
  \ judgment holds its fact.\nA finding in src/middleware/auth.ts names contracts/knowledge-base/access,\
  \ which no file of this set is bound to: the catch around jwtVerify (lines 146-151) and the fallback\
  \ return of mapJoseError (lines 215-217): try {\n  const verified = await jwtVerify(token, jwks);\n\
  \  payload = verified.payload;\n} catch (err) {\n  throw mapJoseError(err);\n}\n...\n// Unknown — surface\
  \ as invalid (defensive). We do not leak the underlying\n// message to the client; the global error\
  \ handler logs it server-side.\nreturn new AuthError(\"AUTH_TOKEN_INVALID\", \"Invalid authentication\
  \ token.\"); — The access contract answers a key set that cannot be fetched with HTTP 503 SYSTEM_SERVICE_UNAVAILABLE\
  \ (its decision log records this as decided). Here every error that is not one of the listed jose classes,\
  \ a failed JWKS fetch included, becomes HTTP 401 AUTH_TOKEN_INVALID. When the auth provider is unreachable,\
  \ the owner is told their valid token is invalid instead of being told the service is unavailable..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/middleware/error-handler.ts\
  \ names contracts/knowledge-base/access, which no file of this set is bound to: branch 3 of classify(),\
  \ the isFastifyValidationError case, lines 110-123: message: err.message ?? \"Request payload failed\
  \ validation.\",\ndetails: err.validation, — The access contract fixes one answer for every validation\
  \ failure: the message \"Request payload failed validation.\" and `details` a bare list of `{ path,\
  \ message }`. This branch sends the framework's own message and its raw validation array instead. A\
  \ caller gets a different message and a different `details` shape depending on which validator rejected\
  \ the request, and the log decision \"Every validation failure answers ...\" is not met.. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/middleware/error-handler.ts names contracts/knowledge-base/access,\
  \ which no file of this set is bound to: branch 5 of classify(), the isFastifyHttpError case, lines\
  \ 132-148, for status 503: const isServerError = err.statusCode >= 500;\n...\ncode: codeFromHttpStatus(err.statusCode),\n\
  message: isServerError ? \"Internal server error.\" : err.message,\n...\ncase 503:\n  return \"SYSTEM_SERVICE_UNAVAILABLE\"\
  ; — The access contract answers a framework 503 with SYSTEM_SERVICE_UNAVAILABLE and the message \"A\
  \ backing service is temporarily unavailable.\", since one code carries one message. The code sends\
  \ SYSTEM_SERVICE_UNAVAILABLE with \"Internal server error.\", so a 503 reads as an internal failure\
  \ and the same code carries two messages depending on the path that produced it.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/compliance-audit/service/compliance-audit.service.ts\
  \ names rules/knowledge-base/compliance-deletion-redacts-content, which no file of this set is bound\
  \ to: line 57, the exported constant REDACTED_LITERAL (re-exported at line 19 of src/modules/compliance-audit/index.ts):\
  \ export const REDACTED_LITERAL = \"[REDACTED]\" as const; (the repository that performs the redaction\
  \ does not read it; it spells the literal again: \"SET content        = '[REDACTED]', original_input\
  \ = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]' END\" in src/modules/compliance-audit/repository/compliance-audit.repository.ts,\
  \ lines 68-69) — The redaction literal exists as code in two places, and nothing in this file's own\
  \ flow uses the one declared here. A change to the node's literal can be made in one place and not the\
  \ other, and nobody can tell which spelling was the decision. The constant looks like the authority\
  \ (it is exported and carries a docstring), but the SQL that actually redacts does not read it.. It\
  \ blocks nothing here; it is owed a route of its own.\nA finding in src/modules/curation/dto/dispute.dto.ts\
  \ names domain/knowledge-base/adjusted-period, which no file of this set is bound to: the AdjustedPeriodSchema\
  \ declaration, line 15: valid_from: IsoDateSchema.nullable(), valid_to: IsoDateSchema.nullable().optional(),\
  \ — The adjusted-period node lists valid_from and valid_to alike as optional dates, with only item_id\
  \ required. This schema makes valid_from a mandatory key that may be null, and lets only valid_to be\
  \ left out. A caller who gives only item_id and valid_to is refused here, which the node does not say.\
  \ The next reader looks in the specification for why the two bounds differ and finds nothing.. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/modules/curation/dto/enums.dto.ts names\
  \ domain/knowledge-base/assertion-kind, which no file of this set is bound to: line 7, ItemKindSchema\
  \ (exported as ItemKind): export const ItemKindSchema = z.enum([\"link\", \"attribute\"]); — The vocabulary\
  \ of curation item kinds is declared here, and the node that holds it is bound to no file in the trace.\
  \ When the node moves, the check never reaches this file. The identifier ItemKind also names a different\
  \ node, item-kind, whose values are node, link and fragment. A reader who looks up ItemKind in the specification\
  \ finds the wrong vocabulary.. It blocks nothing here; it is owed a route of its own.\nA finding in\
  \ src/modules/curation/dto/enums.dto.ts names domain/knowledge-base/review-queue-kind, which no file\
  \ of this set is bound to: line 10, ReviewQueueKindSchema (exported as ReviewQueueKind): export const\
  \ ReviewQueueKindSchema = z.enum([\"entity_match\", \"disputed\"]); — The two review queues are enumerated\
  \ here, and the node holding them (values entity-match, disputed) has no bind to this file. A change\
  \ to the node does not reach this declaration.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/curation/dto/enums.dto.ts names domain/knowledge-base/entity-match-decision,\
  \ which no file of this set is bound to: line 13, EntityMatchDecisionSchema (exported as EntityMatchDecision):\
  \ export const EntityMatchDecisionSchema = z.enum([\"merge_into\", \"keep_separate\"]); — The entity-match\
  \ decision set lives here, and its node (values merge-into, keep-separate) is not bound to this file.\
  \ The wire spelling merge_into is the one the curation contract uses.. It blocks nothing here; it is\
  \ owed a route of its own.\nA finding in src/modules/curation/dto/enums.dto.ts names domain/knowledge-base/dispute-decision,\
  \ which no file of this set is bound to: lines 16-21, DisputeDecisionSchema (exported as DisputeDecision):\
  \ export const DisputeDecisionSchema = z.enum([\n  \"prefer_one\",\n  \"adjust_periods\",\n  \"keep_disputed\"\
  ,\n]); — The dispute decision set is declared here, and its node (values prefer-one, adjust-periods,\
  \ keep-disputed) is not bound to this file. Of the three, the contract curation.md names only prefer_one\
  \ and adjust_periods. keep_disputed appears in the specification only as the node's value keep-disputed..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/curation/dto/enums.dto.ts\
  \ names domain/knowledge-base/node-status, which no file of this set is bound to: lines 23-28, NodeStatusSchema\
  \ (exported as NodeStatus): export const NodeStatusSchema = z.enum([\n  \"active\",\n  \"needs_review\"\
  ,\n  \"merged\",\n  \"deleted\",\n]); — The node status vocabulary is declared here without a bind from\
  \ its node (values active, needs-review, merged, deleted). When the node moves, this file is not reached..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/curation/dto/enums.dto.ts\
  \ names domain/knowledge-base/assertion-status, which no file of this set is bound to: lines 31-37,\
  \ AssertionStatusSchema (exported as AssertionStatus): export const AssertionStatusSchema = z.enum([\n\
  \  \"active\",\n  \"uncertain\",\n  \"disputed\",\n  \"superseded\",\n  \"deleted\",\n]); — The status\
  \ vocabulary for links and attributes is declared here without a bind from its node. The values agree\
  \ with the node today, but a change to the node would not reach this file.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/modules/curation/dto/enums.dto.ts names domain/knowledge-base/valid-from-basis,\
  \ which no file of this set is bound to: line 40, ValidFromSourceSchema (exported as ValidFromSource):\
  \ export const ValidFromSourceSchema = z.enum([\"stated\", \"document\", \"received\"]); — The vocabulary\
  \ justifying a validity start is declared here, and its node (stated, document, received) is not bound\
  \ to this file.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/curation/mcp/curation-toolset.ts\
  \ names rules/knowledge-base/merge-copies-aliases, which no file of this set is bound to: CurationToolDescriptions.merge_nodes,\
  \ lines 171-175 (the description served over tools/list): \"Merge two `active` KnowledgeNodes directly\
  \ (no review queue). `absorbed_id` \" + \"is set to `status=merged` with `merged_into_node_id=survivor_id`;\
  \ every \" + \"link / attribute / alias is repointed to the survivor in the same \" + \"transaction\
  \ (BR-04, BR-07). `reason` is mandatory.\" — This text is what the LLM client is told over tools/list.\
  \ It says aliases are repointed to the survivor. The rule says the survivor receives a copy of each\
  \ alias whose normalized form it does not hold, and the absorbed node keeps its own aliases. A client\
  \ reasoning from the description expects the absorbed node to lose its aliases, and it does not.. It\
  \ blocks nothing here; it is owed a route of its own.\nA finding in src/modules/curation/repository/curation.repository.ts\
  \ names rules/knowledge-base/review-queue-page-windows-entries, which no file of this set is bound to:\
  \ listEntityMatchQueue (lines 565-588), listDisputedLinks (lines 614-640) and listDisputedAttributes\
  \ (lines 663-688): listEntityMatchQueue joins `LEFT JOIN entity_match_review em ON em.node_id = kn.id`,\
  \ then `ORDER BY kn.created_at ASC, kn.id ASC, em.similarity DESC NULLS LAST LIMIT $1 OFFSET $2`. listDisputedLinks\
  \ and listDisputedAttributes each end with `ORDER BY kl.recorded_at ASC, kl.id ASC LIMIT $1 OFFSET $2`\
  \ or the `na` equivalent, over individual disputed rows. — The page limit and offset are applied to\
  \ candidate rows (one per entity match review) and to individual disputed items. They are not applied\
  \ to whole queue entries. A page can split one node's candidates across pages, or split one dispute's\
  \ items. The limit then does not bound the entries returned. The decision log beside the rule says this\
  \ is the material it replaced.. It blocks nothing here; it is owed a route of its own.\nA finding in\
  \ src/modules/curation/repository/curation.repository.ts names rules/knowledge-base/metrics-disputed-queue-count,\
  \ which no file of this set is bound to: the disputedQueueRes query in aggregateCurationMetrics (lines\
  \ 776-787): `SELECT DISTINCT 'link' AS k, source_node_id, target_node_id, link_type_id FROM knowledge_link\
  \ WHERE status = 'disputed' UNION ALL SELECT DISTINCT 'attribute', node_id, attribute_key_id, NULL::uuid\
  \ FROM node_attribute WHERE status = 'disputed'` — The metric counts distinct source, target and link\
  \ type groups. The node says it is the number of entries the disputed queue holds, one per dispute scope.\
  \ The decision log beside the node names this source-target-link-type grouping as the divergence. The\
  \ count can differ from the queue whenever one dispute holds links to different targets. The owner reads\
  \ it as how many disputes await a decision.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/curation/service/dispute.service.ts names contracts/knowledge-base/curation,\
  \ which no file of this set is bound to: resolveDisputeService, prefer_one branch, the BusinessError\
  \ thrown when winner_id is absent (lines 118-123): throw new BusinessError(\n    \"BUSINESS_DISPUTE_WINNER_REQUIRED\"\
  ,\n    \"decision=prefer_one requires winner_id\"\n  ); — The contract curation answers this refusal\
  \ with the message \"decision=prefer_one requires winner_id (member of item_ids)\". This file emits\
  \ the message without \"(member of item_ids)\". A client or test that reads the message gets different\
  \ words depending on whether the request was refused here or at the body check. Nothing in this file\
  \ checks that winner_id is a member of item_ids.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/curation/service/dispute.service.ts names contracts/knowledge-base/curation,\
  \ which no file of this set is bound to: resolveDisputeService, adjust_periods branch, the BusinessError\
  \ thrown when periods are absent or empty (lines 201-206): throw new BusinessError(\n    \"BUSINESS_DISPUTE_PERIODS_REQUIRED\"\
  ,\n    \"decision=adjust_periods requires periods[]\"\n  ); — The contract curation answers this refusal\
  \ with the message \"decision=adjust_periods requires periods[] (one entry per item_id)\". This file\
  \ emits the message without \"(one entry per item_id)\". The same refusal therefore reads differently\
  \ depending on where it is raised. This file only tests for an empty list, so the one-entry-per-item\
  \ expectation is not visible here.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/ingestion/chunker/config.ts names rules/knowledge-base/extraction-reads-chunks-in-order,\
  \ which no file of this set is bound to: the READING_TAIL declaration, line 30, and its doc comment,\
  \ lines 24-29: export const READING_TAIL = 200 as const; — The 200-character tail is a fact the node\
  \ extraction-reads-chunks-in-order already holds (\"the last 200 characters of the chunk before it\"\
  ). It is declared a second time here, and nothing imports this constant. The code that applies it is\
  \ PREV_TAIL_CHARS = 200 in src/modules/ingestion/service/extraction.service.ts, used as chunk.text.slice(-PREV_TAIL_CHARS).\
  \ The comment says the overlap is \"computed at read time by the future retrieval layer\", which differs\
  \ from the node, where an extraction shows the tail to the model. If the node's 200 moves, this constant\
  \ stays at 200 and nothing signals it, and --check does not reach it through the node.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/ingestion/chunker/v1.ts names rules/knowledge-base/speaker-line,\
  \ which no file of this set is bound to: SPEAKER_LINE_REGEX, line 351: \"const SPEAKER_LINE_REGEX =\
  \ /^\\s*(?:[[(]\\d{1,2}:\\d{2}(?::\\d{2})?[\\])][\\s\\t]+)?[A-Za-zÀ-ÿ0-9_]+(?:\\s[A-Za-zÀ-ÿ0-9_]+)?:\\\
  s/;\" Node: \"an optional time stamp written [h:mm], [hh:mm], (hh:mm) or (hh:mm:ss) followed by whitespace,\
  \ starts with one or two words of letters, digits or underscores\" — The regex takes any opening bracket\
  \ with any closing bracket and optional seconds. It therefore accepts [hh:mm:ss], (h:mm) and mismatched\
  \ forms such as [12:00) as time stamps, none of which the node lists. Its letter class is Latin-1 only\
  \ (À-ÿ, which includes × and ÷) and excludes other letters. A line the node does not call a speaker\
  \ line therefore opens a new block and splits a chat or transcript chunk where the specification says\
  \ none is cut.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/mcp/ingest-toolset.ts\
  \ names contracts/knowledge-base/ingestion, which no file of this set is bound to: runZodFailureAudit,\
  \ the ValidationFailure thrown inside run, lines 465-468. Through runIngestHandler it becomes the envelope\
  \ message of all four propose_* tools on a failed parse.: throw new ValidationFailure(\n  \"VALIDATION_INVALID_FORMAT\"\
  ,\n  \"MCP tool args failed Zod parse.\", — The contract says that over MCP a proposal refused for its\
  \ shape answers the message \"Input failed Zod parse.\" for all four proposals. handler-base.ts copies\
  \ this failure's message verbatim into the envelope (`message: validationFailure.message`). The MCP\
  \ caller therefore gets a different message from the one decided, and callers that match on the decided\
  \ wording will miss it.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/mcp/mcp-schemas.ts\
  \ names constraints/ingest-toolset-offers-no-async-ingestion, which no file of this set is bound to:\
  \ lines 81-123, the StartAsyncIngestionMcpInputSchema declaration and its docstring: `export const StartAsyncIngestionMcpInputSchema\
  \ = z.object({` with \"`start_async_ingestion` (BR-32) — shape-identical to `ingest_document` for caller\
  \ symmetry. The only difference is the new-run return semantics (immediate vs. awaited)\" and the content\
  \ description \"runs structured extraction in the BACKGROUND, and persists the knowledge graph with\
  \ provenance.\" — The specification says the ingest toolset offers no tool that starts an ingestion\
  \ and returns before it completes. This file still declares the input shape and the advertised description\
  \ of such a tool. If a registrar lists it, `tools/list` announces a tool the business has retired. A\
  \ reader looking in the specification for what the toolset offers would not find it.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/ingestion/mcp/mcp-schemas.ts names\
  \ domain/knowledge-base/run-summary, which no file of this set is bound to: line 215, GetIngestionStatusSummarySchema\
  \ (the per-outcome counters): `const GetIngestionStatusSummarySchema = z.object({ accepted: z.number().int().nonnegative(),\
  \ consolidated: ..., superseded_previous: ..., needs_review: ..., uncertain: ..., disputed: ..., rejected:\
  \ ..., error: ..., orphaned_fragments: z.number().int().nonnegative(), });` preceded by \"Per-outcome\
  \ counters — mirror of `LlmRunSummarySchema` (BR-12).\" — The nine counters of an LLM run's summary\
  \ are declared in this file as well as where the run's response shape lives. A change to the run-summary\
  \ node has to reach both, and `--check` reaches only the files the node is bound to. If the two drift,\
  \ nobody can tell which counter set was decided.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/ingestion/mcp/mcp-schemas.ts names domain/knowledge-base/llm-run, which\
  \ no file of this set is bound to: line 234, GetIngestionStatusOutputSchema: `export const GetIngestionStatusOutputSchema\
  \ = z.object({ id: ..., model: z.string(), prompt_version: z.string(), started_at: ..., finished_at:\
  \ ....nullable(), status: z.enum([\"running\", \"completed\", \"failed\"]), attempts: z.number().int().positive(),\
  \ input_raw_information_id: ..., idempotency_key: z.string().regex(/^[0-9a-f]{64}$/), summary: GetIngestionStatusSummarySchema,\
  \ affected_nodes: ... })` preceded by \"It mirrors `LlmRunResponseSchema` (`dto/llm-run.dto.ts`)\".\
  \ — The attributes of an LLM run, its status values and the idempotency-key format are declared a second\
  \ time in this file, which the run node is not bound to. The day the run changes, the schema in `dto/llm-run.dto.ts`\
  \ moves with it and this one is not reached.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/ingestion/mcp/mcp-schemas.ts names contracts/knowledge-base/ingestion, which\
  \ no file of this set is bound to: the `describe` text of `node_id` in IngestDirectedNodeItemSchema,\
  \ lines 343-349: \"Rejected (VALIDATION_INVALID_FORMAT) if the id does not point to an active node.\"\
  \ — This text is advertised to the client calling the tool. The contract answers a pinned identity that\
  \ names no knowledge node with RESOURCE_NOT_FOUND, and a pinned node that is not active with VALIDATION_INVALID_FORMAT.\
  \ The description gives one code for both, so a client reading it expects the wrong code for an unknown\
  \ id.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/prompts/extraction.v4.ts\
  \ names rules/knowledge-base/caller-never-states-received, which no file of this set is bound to: RECEIVED_AT_ANCHOR_DIRECTIVE,\
  \ lines 59-62 (the instruction sent to the model in every v4 system prompt): \"`\\\"amanhã\\\"`, `\\\
  \"semana que vem\\\"`, `\\\"esta semana\\\"`, similar pt-BR temporal deictics), resolve it AGAINST `document_date`\
  \ if it is present (basis `\\\"document\\\"`). If `document_date` is `(unknown)`, fall back to the date\
  \ portion of `received_at` (the `YYYY-MM-DD` prefix of the ISO-8601 string) — use basis `\\\"received\\\
  \"`.\" — The prompt tells the model to put the basis received on proposals, while the node says \"A\
  \ proposal MUST NOT state the basis received.\" The two instructions cannot both hold. The node's decision\
  \ log records this conflict as known and not settled. Until someone settles it, the code carries the\
  \ opposite rule from the one the specification states, and a reader who checks the specification would\
  \ not expect the model to be asked for this.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/ingestion/service/affected-nodes.ts names rules/knowledge-base/affected-nodes-of-a-run,\
  \ which no file of this set is bound to: isContributingOutcome, lines 87-99 (the switch), as used by\
  \ affectedIdsFromEnvelope at line 131 for propose_link and propose_attribute: case \"created_new\":\n\
  \    case \"matched_existing\":\n    case \"needs_review\":\n    case \"accepted\":\n    case \"consolidated\"\
  :\n    case \"superseded_previous\":\n    case \"disputed\":\n      return true; — The node limits the\
  \ link and attribute proposals that contribute to those that were accepted, consolidated, superseded\
  \ a previous assertion or were disputed. This allow-list also admits created_new, matched_existing and\
  \ needs_review for those two tools, so an envelope with such an outcome would add its nodes to a run's\
  \ affected nodes. The graph-consolidation service emits only the four outcomes the node names for links\
  \ and attributes, so the extra three are unreachable today. The list the code applies is nonetheless\
  \ wider than the one the business decided. The comment at lines 79-86 defends the union as what \"the\
  \ spec says\", which the node does not say.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/ingestion/service/llm-run.service.ts names contracts/knowledge-base/ingestion,\
  \ which no file of this set is bound to: retryLlmRun, lines 209-215 (re-read after the UPDATE returned\
  \ null): const currentStatus = refreshed?.status ?? \"running\"; if (currentStatus === \"failed\") {\n\
  \  // Should not happen — log internally and surface as 409 conservatively.\n  throw new RunNotRetryableError(llmRunId,\
  \ \"running\");\n} — The refusal is built with status 'running' for a run the re-read just showed as\
  \ 'failed'. The error message and its currentStatus field are emitted text, and they name a status the\
  \ run does not have. The contract says this refusal names the run's status, and llm-run-lifecycle makes\
  \ failed the one status from which retry is allowed. A caller reading \"is in status 'running'\" is\
  \ told something false about the run.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/ingestion/service/propose-attribute.service.ts names rules/knowledge-base/attribute-key-for-node-type,\
  \ which no file of this set is bound to: lines 71-80, the guard after the attribute_key lookup: if (resolvedKey.node_type_id\
  \ !== nodeTypeId) {\n  throw new ValidationFailure(\n    \"VALIDATION_INVALID_FORMAT\",\n    \"attribute_key.node_type_id\
  \ does not match the node's node_type_id.\",\n    { node_id: args.node_id, key: args.key }\n  );\n}\
  \ — The specification refuses an attribute key not held for the node's type with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.\
  \ This guard refuses the same condition with VALIDATION_INVALID_FORMAT and its own message. The catalog\
  \ lookup above it is already scoped to (node_type_id, key), so the guard is unreachable today. If the\
  \ catalog scope ever relaxes, callers would see a code and a message that no node holds, and the next\
  \ reader would not find them in the specification.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/ingestion/validation/temporal.ts names rules/knowledge-base/required-start-fallback,\
  \ which no file of this set is bound to: validateTemporal, the document_date branch inside `if (input.requires_valid_from\
  \ && input.valid_from === null)`, lines 145-158: if (input.document_date !== null) { ... return { valid_from:\
  \ input.valid_from, valid_from_basis: input.valid_from_basis, }; } — The node says a proposal that requires\
  \ a validity start and states none takes the document date with basis document. Here the layer returns\
  \ valid_from null and basis null, and the proposal passes with no start and no basis. The next reader\
  \ goes to the node, sees a document-dated source filling the start, and does not learn that the code\
  \ leaves it empty. A required start can reach the consolidator as null whenever the source has a document\
  \ date, but is filled whenever only a reception date exists. The comment at lines 148-153 says this\
  \ keeps the previous version's behavior, which is a decision recorded only in the code.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/knowledge-graph/repository/graph.repository.ts\
  \ names rules/knowledge-base/node-listing-name-prefix, which no file of this set is bound to: listNodes,\
  \ the optional alias join, lines 98-102: aliasJoin = `JOIN node_alias na ON na.node_id = kn.id\n   \
  \                AND na.alias_norm LIKE $${params.length} || '%'`; — The prefix goes into LIKE as a\
  \ pattern, with no escaping and no ESCAPE clause. A percent sign or an underscore the owner types matches\
  \ as a wildcard instead of as itself. The only caller I found, service/node.service.ts, applies norm()\
  \ and nothing else (`norm(input.name_prefix)`). A listing can therefore return nodes whose aliases do\
  \ not start with the typed prefix. The specification reads the prefix literally, and the next reader\
  \ will look there for that rule.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/knowledge-graph/repository/graph.repository.ts names rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt,\
  \ which no file of this set is bound to: listProvenanceByTargets, the excerpt column, lines 322-323:\
  \ substring(rc.\"text\" FROM rc.offset_start + 1\n                          FOR rc.offset_end - rc.offset_start)\
  \ AS excerpt — The node says a graph read's provenance entry shows the whole text of the raw chunk it\
  \ cites. The query instead cuts a substring of the chunk's text using the chunk's own source offsets.\
  \ A chunk that does not start at offset 0 of its source gets a shifted or empty excerpt, and the provenance\
  \ entry loses the text it exists to show. The decision log beside the node records this same slicing\
  \ as the unstated material the rule replaced.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/knowledge-graph/repository/graph.repository.ts names rules/knowledge-base/graph-provenance-hides-compliance-deleted,\
  \ which no file of this set is bound to: listProvenanceByTargets, the FROM and WHERE clauses, lines\
  \ 324-330: JOIN raw_information ri    ON ri.id = rc.raw_information_id\n          WHERE ${targetCol}\
  \ = ANY($1::uuid[]) — The provenance query joins raw_information and applies no condition on whether\
  \ that raw information was deleted for compliance. A grep of the knowledge-graph module's non-test source\
  \ found no compliance filter anywhere else in it. A compliance-deleted source's trace is therefore still\
  \ presented by link and attribute reads. The compliance deletion exists to prevent exactly that.. It\
  \ blocks nothing here; it is owed a route of its own.\nA finding in src/modules/knowledge-graph/service/traversal.service.ts\
  \ names rules/knowledge-base/traversal-lists-reached-nodes, which no file of this set is bound to: traverseNodeService,\
  \ lines 99-111, together with the finalNodes loop in traverseNodes, lines 326-332: if (\n  starting.status\
  \ === \"merged\" &&\n  starting.merged_into_node_id !== null\n) {\n  const survivor = await findNodeById(client,\
  \ starting.merged_into_node_id);\n  if (survivor !== null && survivor.status !== \"deleted\") {\n  \
  \  startingResolved = survivor;\n  }\n}\n...\nstarting_node_id: startingResolved.id,\n...\nif (row.status\
  \ === \"merged\") continue;\nfinalNodes.push(row); — When a merged starting node's survivor is missing\
  \ or deleted, startingResolved stays the merged node. The response names it in starting_node_id, but\
  \ the finalNodes loop drops every merged row, so it is absent from nodes. A reader who looks up starting_node_id\
  \ in nodes finds nothing. The node's decision log records this exact case as decided: the traversal\
  \ always lists its starting node.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/knowledge-graph/service/traversal.service.ts names rules/knowledge-base/traversal-expands-live-nodes,\
  \ which no file of this set is bound to: traverseNodes, line 180: the frontier is seeded without a status\
  \ check: let frontier: readonly string[] = input.startingNodeIds; — The frontier takes the starting\
  \ ids as given, and the first hop fetches links from them. When traverseNodeService leaves a merged\
  \ starting node in place (survivor missing or deleted), that merged node is expanded. A deleted starting\
  \ id passed directly to traverseNodes, the internal entry point, would be expanded in the same way.\
  \ Only nodes reached after the first hop are filtered with `if (row.status === \"deleted\") continue;`\
  \ and `if (row.status === \"merged\") continue;`.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/query-retrieval/service/errors.ts names domain/knowledge-base/search-layer,\
  \ which no file of this set is bound to: InvalidSearchLayerError, the `allowed` field (line 28): public\
  \ readonly allowed = [\"fragment\", \"node\", \"chunk\"] as const; — The three search layers are declared\
  \ a second time here. The same list is already declared as `export const ALLOWED_LAYERS = [\"fragment\"\
  , \"node\", \"chunk\"] as const;` in backend/src/modules/query-retrieval/dto/search.dto.ts line 101.\
  \ The node domain/knowledge-base/search-layer holds the enumeration, but this file is not bound to it.\
  \ If the layers change, the node and the DTO will be updated and this copy can stay behind. Then the\
  \ refusal would name layers that no longer match the set the search accepts, and nobody could say which\
  \ list was decided.. It blocks nothing here; it is owed a route of its own.\nCandidates: 255 opened\
  \ across 67 of 85 delegation(s); each return lists its own under `candidates_opened`.\nUnstated: 28\
  \ fact(s) the source states that no node holds, over 21 file(s), listed under `unstated`. They block\
  \ no binding here and no rebind closes them — the route is the analysis that gives each fact a node.\n\
  Restates: 137 place(s) where text in the source restates a node's fact the code holds, over 56 file(s),\
  \ listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,\
  \ and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-test-intent-kb.returns/`, which are the evidence behind every entry above.
