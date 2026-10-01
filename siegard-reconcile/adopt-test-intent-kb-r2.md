---
contract_version: siegard-reconcile/8
title: Adopt knowledge-base source against the test-intent candidates
summary: The knowledge-base source of eighty-three files (middleware, compliance-audit, curation, ingestion,
  knowledge-graph, query-retrieval and shared) is adopted as it stands and did not change; the candidates
  are the 25 knowledge-base rules and contracts the test-intent analysis wrote or amended, aligned to
  the code afterwards.
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
- path: src/modules/query-retrieval/service/errors.ts
  change: adopted as it stands; unchanged
- path: src/modules/query-retrieval/service/search.service.ts
  change: adopted as it stands; unchanged
- path: src/shared/error-mapping.ts
  change: adopted as it stands; unchanged
- path: src/shared/health.ts
  change: adopted as it stands; unchanged
nodes:
- node: contracts/knowledge-base/access
  conforms: false
  how: "src/middleware/error-handler.ts, classify(), branch 3 \"Fastify validation\", lines 108-123: message:\
    \ err.message ?? \"Request payload failed validation.\",\ndetails: err.validation, — The node says\
    \ a request that fails the validation of its operation is answered with the fixed message \"Request\
    \ payload failed validation.\" and `details` a bare list of `{ path, message }`. This branch forwards\
    \ Fastify's own message and the raw validation array. When a request is refused by a route schema,\
    \ the client gets a different message and a different details shape from the one the specification\
    \ decided. The ZodError branch of the same file does return the specified shape, so the same refusal\
    \ has two shapes depending on which validator caught it.\nsrc/middleware/error-handler.ts, codeFromHttpStatus(),\
    \ `case 422`, lines 183-184: case 422:\n  return \"VALIDATION_INVALID_FORMAT\"; — The node says a\
    \ framework refusal with a status below 500 other than 401, 403 and 409 is answered with that status\
    \ and error code SYSTEM_INTERNAL_ERROR. A 422 that reaches this branch is not a Zod or Fastify validation\
    \ failure, because those are caught by branches 2 and 3. Here it is given VALIDATION_INVALID_FORMAT,\
    \ where the specification gives SYSTEM_INTERNAL_ERROR. The client therefore sees a validation code\
    \ for a refusal the specification does not call a validation failure.\nsrc/modules/compliance-audit/routes/compliance-audit.routes.ts,\
    \ the `details` of every validation envelope in handleZodError (lines 206, 235, 255, 264) and the\
    \ zodIssuesAsDetails helper (lines 269-274): details: { issues: zodIssuesAsDetails(err) } — The access\
    \ contract says a request that fails validation answers with \"`details` a bare list of `{ path, message\
    \ }`, each path joined by \".\"\". These routes send the list wrapped in an object under `issues`.\
    \ A client written to the access contract reads `details` as a list and gets an object. The shape\
    \ is decided in the specification, so the next reader would not look in this file for a different\
    \ one."
  observed_at:
  - src/middleware/error-handler.ts
  - src/modules/compliance-audit/routes/compliance-audit.routes.ts
- node: contracts/knowledge-base/ingestion
  conforms: false
  how: "src/modules/ingestion/mcp/mcp-schemas.ts, GetIngestionStatusSummarySchema, AffectedNodeOutputSchema\
    \ and GetIngestionStatusOutputSchema, lines 206-249: export const GetIngestionStatusOutputSchema =\
    \ z.object({ id: z.string().uuid(), model: z.string(), prompt_version: z.string(), started_at: ...,\
    \ finished_at: ..., status: z.enum([\"running\", \"completed\", \"failed\"]), attempts: z.number().int().positive(),\
    \ input_raw_information_id: z.string().uuid(), idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),\
    \ summary: GetIngestionStatusSummarySchema, affected_nodes: z.array(AffectedNodeOutputSchema).optional()\
    \ }); the docblock says \"It mirrors `LlmRunResponseSchema` (`dto/llm-run.dto.ts`)\" — The shape the\
    \ read-llm-run operation answers (identity, model, prompt version, times, status, attempts, raw information,\
    \ idempotency key, summary, affected nodes) is already declared in dto/llm-run.dto.ts as LlmRunResponseSchema,\
    \ LlmRunSummarySchema and AffectedNodeSchema. This file declares it a second time, field for field.\
    \ Nothing in src reads these schemas except a unit test, so the copy is a second authority that no\
    \ transport follows. When the run shape moves, the copy stays behind, and the test asserts against\
    \ the stale copy instead of the shape the transport emits.\nsrc/modules/ingestion/mcp/mcp-schemas.ts,\
    \ the `describe` of `node_id` in IngestDirectedNodeItemSchema, line 348: Rejected (VALIDATION_INVALID_FORMAT)\
    \ if the id does not point to an active node. — This text is advertised to the calling model on tools/list.\
    \ The contract splits the two refusals. A pinned identity that names no knowledge node is reported\
    \ with RESOURCE_NOT_FOUND, and one that names a node that is not active with VALIDATION_INVALID_FORMAT.\
    \ The description gives VALIDATION_INVALID_FORMAT for both, so a caller that branches on the code\
    \ the description promises will mishandle a pin to an unknown node.\nsrc/modules/ingestion/mcp/propose-fragment.handler.ts,\
    \ buildProposeFragmentHandler, the Zod-failure branch (lines 36-48), the ValidationFailure thrown\
    \ at lines 42-46: throw new ValidationFailure(\n  \"VALIDATION_INVALID_FORMAT\",\n  \"Input failed\
    \ Zod parse.\",\n  { issues: parsed.error.issues.map((i) => ({ path: i.path.join(\".\"), message:\
    \ i.message })) }\n); — The contract says a malformed propose-fragment proposal over MCP is refused\
    \ with the message \"MCP tool args failed Zod parse.\" This branch tells the caller \"Input failed\
    \ Zod parse.\" instead. Any reader or client matching on the contract's message would not find it\
    \ from this entry point. A grep outside the file set, used only to attribute the fact, shows the factory\
    \ is called only from tests. The production MCP path is in ingest-toolset.ts, which uses the contract's\
    \ wording. So the divergence sits in a path the running system does not currently use, but it is still\
    \ code that states the refusal differently from the node.\nsrc/modules/ingestion/service/directed-ingestion.service.ts,\
    \ Step 1, the Zod-failure return (lines 309-322): code: \"VALIDATION_INVALID_FORMAT\", message: \"\
    Input failed Zod parse.\", details: {\n  issues: parsed.error.issues.map((i) => ({ — The contract\
    \ answers every directed validation refusal with message \"ingest_directed arguments failed validation.\"\
    \ listing each failing field with its path and message. This path tells the caller a different message\
    \ and nests the list under details.issues. A caller or test that reads the message the contract states\
    \ does not find it here. This file cannot show whether the tool handler validates first and so makes\
    \ this path unreachable."
  observed_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/mcp/propose-fragment.handler.ts
  - src/modules/ingestion/service/directed-ingestion.service.ts
- node: contracts/knowledge-base/retrieval
  conforms: false
  how: 'src/modules/query-retrieval/service/errors.ts, class InvalidSearchQueryError, lines 1-22 (the
    reason union, the code field and the message ternary): public readonly code = "BUSINESS_INVALID_SEARCH_QUERY"
    as const; public readonly reason: "empty_after_trim" | "empty_after_parse" | "too_long"; ... : "query
    exceeds 1000 characters" — The retrieval contract gives a blank query (search-query-not-blank) and
    an over-length query (search-query-length) the answer HTTP 422 with VALIDATION_INVALID_FORMAT. It
    gives BUSINESS_INVALID_SEARCH_QUERY only to a query whose parse yields no term (search-query-must-parse).
    This class pairs BUSINESS_INVALID_SEARCH_QUERY with the reasons empty_after_trim and too_long. If
    any caller raises it with those reasons, a blank or over-long query is answered with a different error
    code than the contract states. A client branching on the code then follows the wrong path. The shape
    also makes this file the place where the 1000-character limit appears, in the message text. The next
    reader looks for that limit in the search-query-length rule. I did not open the callers, because they
    are outside the file set, so whether the pairing is reachable is unverified.'
  observed_at:
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/accepted-fragment-listing-refuses-unknown-parameter
  conforms: true
  how: 'src/modules/query-retrieval/dto/fragment.dto.ts: held at the `.strict()` call on the object schema,
    line 38 — .strict()'
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
- node: rules/knowledge-base/affected-nodes-of-a-run
  conforms: true
  how: 'src/modules/ingestion/service/affected-nodes.ts: held at affectedIdsFromEnvelope (propose_node
    id, link source and target ids, attribute node id), isContributingOutcome (the seven-outcome switch),
    createAffectedNodeCollector (once, first-reached order) — case "created_new": case "matched_existing":
    case "needs_review": case "accepted": case "consolidated": case "superseded_previous": case "disputed":
    return true; and if (!seen.has(id)) { seen.set(id, true); }'
  encoded_at:
  - src/modules/ingestion/service/affected-nodes.ts
- node: rules/knowledge-base/affected-nodes-omit-absent
  conforms: true
  how: 'src/modules/ingestion/service/affected-nodes.ts: held at resolveAffectedNodes, step 3 loop — let
    row = byId.get(id); if (row === undefined) continue;'
  encoded_at:
  - src/modules/ingestion/service/affected-nodes.ts
- node: rules/knowledge-base/audit-listing-accepts-open-window
  conforms: true
  how: "src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ListComplianceDeletionsQuerySchema,\
    \ lines 80-98. Both `executed_from` and `executed_to` are `.optional()`, and the superRefine checks\
    \ ordering only when both are present. — executed_from: z.string().datetime({ offset: true }).optional(),\
    \ executed_to: z.string().datetime({ offset: true }).optional(), ... if (value.executed_from && value.executed_to)\
    \ {\nsrc/modules/compliance-audit/repository/compliance-audit.repository.ts: held at listComplianceDeletions,\
    \ lines 321-328: each bound is an independent optional branch — if (f.executed_from) {\n    where.push(`executed_at\
    \ >= $${i++}`);\nif (f.executed_to) {\n    where.push(`executed_at < $${i++}`);"
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/chunking-deterministic
  conforms: true
  how: 'src/modules/ingestion/chunker/v1.ts: held at chunkV1 as a whole (lines 62-131) and splitBySentences.
    Every step is a pure function of `(content, sourceType)`. — "export function chunkV1(content: string,
    sourceType: SourceType): RawChunkInput[]" with no clock, randomness or I/O; the sentence split is
    `new Intl.Segmenter("pt", { granularity: "sentence" })`.'
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
- node: rules/knowledge-base/concurrent-proposals-resolve-in-turn
  conforms: true
  how: 'src/modules/ingestion/service/entity-resolution.service.ts: held at the advisory-lock statements
    before the first node_alias read, lines 119-128 — await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1::text,
    0))`, [lockKey]); with lockKey built from `CAST($1::text AS text) || E''\\x1F'' || norm($2::text)`
    over the node type id and the name'
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: rules/knowledge-base/confirmation-keeps-assertion-values
  conforms: true
  how: "src/modules/curation/repository/curation.repository.ts: held at confirmItem, both branches (knowledge_link\
    \ and node_attribute). Each sets only status and leaves confidence, valid_from, valid_to and superseded_at\
    \ untouched. — `UPDATE knowledge_link\n    SET status = 'active'\n  WHERE id = $1 AND status = 'uncertain'\n\
    \  RETURNING id`"
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/extraction-prompt-lists-closed-values
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at `system()`, the `valuesSuffix` constant\
    \ built from `domainOf(catalog, ak.id)` (lines 105-115) — const domain = domainOf(catalog, ak.id);\
    \ const valuesSuffix =\n  domain !== null\n    ? `, values: [${[...domain].sort().map((v) => JSON.stringify(v)).join(\"\
    ,\")}]`\n    : \"\";\nlist.push(`${ak.key} (${ak.value_type}${ak.is_temporal ? \", temporal\" : \"\
    \"}${valuesSuffix})`)"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/extraction-prompt-values-ascending
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at `system()`, the `[...domain].sort()` call\
    \ in `valuesSuffix` (line 109) — ? `, values: [${[...domain]\n    .sort()\n    .map((v) => JSON.stringify(v))"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/extraction-prompt-values-verbatim
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v1.ts: held at `system()`, the `JSON.stringify(v)` mapping
    in `valuesSuffix` (line 110) — .map((v) => JSON.stringify(v)) .join(",") # JSON.stringify keeps non-ASCII
    letters (accents) as written; the catalog value is not normalised or unaccented before listing.'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listProvenanceByTargets, the\
    \ SQL projection of `excerpt` — substring(rc.\"text\" FROM rc.offset_start + 1\n                 \
    \         FOR rc.offset_end - rc.offset_start) AS excerpt"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/graph-provenance-hides-compliance-deleted
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listProvenanceByTargets, the\
    \ joins and WHERE clause, which apply no status predicate on raw_information — JOIN raw_information\
    \ ri    ON ri.id = rc.raw_information_id\n          WHERE ${targetCol} = ANY($1::uuid[])"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/metrics-disputed-queue-count
  conforms: true
  how: "src/modules/curation/repository/curation.repository.ts: held at The disputedQueueRes query in\
    \ aggregateCurationMetrics, which becomes disputed_queue_count. — `SELECT count(*)::text AS total\n\
    \       FROM (\n         SELECT DISTINCT 'link' AS k, source_node_id, target_node_id, link_type_id\n\
    \           FROM knowledge_link\n          WHERE status = 'disputed'\n         UNION ALL\n       \
    \  SELECT DISTINCT 'attribute', node_id, attribute_key_id, NULL::uuid\n           FROM node_attribute\n\
    \          WHERE status = 'disputed'\n       ) g`"
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/node-listing-name-prefix
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listNodes, the optional alias\
    \ join on name_prefix_norm — aliasJoin = `JOIN node_alias na ON na.node_id = kn.id\n             AND\
    \ na.alias_norm LIKE $${params.length} || '%'`;\nsrc/modules/knowledge-graph/service/node.service.ts:\
    \ held at Partial: the name-as-name comparison, in listNodesService at lines 66-67. The alias matching\
    \ with wildcards is outside the file. — `const name_prefix_norm = input.name_prefix !== undefined\
    \ ? norm(input.name_prefix) : undefined;` followed by `name_prefix_norm,` in the repoListNodes call.\
    \ The matching of aliases is done in the repository."
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: rules/knowledge-base/non-expanding-search-walks-no-graph
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at The guard at line 271 and the `traverseNodes`
    call inside it. `linkTypeIds` is also computed only under `input.expand`. — `if (input.expand && nodeHits.length
    > 0) {` ... `const traversal = await traverseNodes(` ... `const linkTypeIds = input.expand ? resolveLinkTypeIds(catalog,
    input.expandLinkTypes) : undefined;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/reaffirmation-consolidates
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the `reaffirmation` const\
    \ of consolidateLinkOnce and the branch (a) condition of consolidateAttributeOnce — const reaffirmation\
    \ =\n  sameTarget &&\n  args.change_hint === \"none\" &&\n  (!functional || sameValidFrom);\nand for\
    \ attributes\nif (\n  sameValue &&\n  sameValidFrom &&\n  args.change_hint === \"none\"\n) {\n  await\
    \ insertAttributeProvenance(client, vigent.id, args.fragment_ids);"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
- node: rules/knowledge-base/required-start-fallback
  conforms: false
  how: 'src/modules/ingestion/prompts/extraction.v1.ts, SYSTEM prompt text, "Dates" section, lines 164-167
    (emitted prompt text): "- Justify it with `valid_from_basis`: `stated` only when the start date is",
    "  written in the chunk (and supported by a cited fragment); `document` uses", "  the document date;
    otherwise omit `valid_from`/basis and the backend", "  records `received`. NEVER invent a date. Dates
    are ISO `YYYY-MM-DD`.", — The prompt tells the model that omitting the start makes the backend record
    `received`, without condition. The node says otherwise. A proposal that requires a start and states
    none keeps no start and no basis when its source has a document date. It takes the reception date
    with basis `received` only when the source has none. A model that omits the start on a dated document
    is told the wrong outcome. The prompt also does not limit this to link types and attribute keys that
    require a start.'
  observed_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/review-queue-page-windows-entries
  conforms: true
  how: "src/modules/curation/repository/curation.repository.ts: held at listEntityMatchQueue, listDisputedLinks\
    \ and listDisputedAttributes. Each applies the page's limit and offset on its own to its own rows.\
    \ The entity-match list is one row per needs-review node and candidate, because of the LEFT JOIN on\
    \ entity_match_review. — `LEFT JOIN entity_match_review em ON em.node_id = kn.id\n      WHERE kn.status\
    \ = 'needs_review'\n      ORDER BY kn.created_at ASC, kn.id ASC, em.similarity DESC NULLS LAST\n \
    \     LIMIT $1 OFFSET $2`"
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/review-queue-total-before-pagination
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at countEntityMatchQueue, countDisputedLinks
    and countDisputedAttributes. Each runs without LIMIT or OFFSET and counts each row once. The total
    is the sum of these three, and that sum is not in this file. — `SELECT count(*)::text AS total FROM
    knowledge_node WHERE status = ''needs_review''`

    `SELECT count(*)::text AS total FROM knowledge_link WHERE status = ''disputed''`

    `SELECT count(*)::text AS total FROM node_attribute WHERE status = ''disputed''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/speaker-line
  conforms: true
  how: 'src/modules/ingestion/chunker/v1.ts: held at the constant SPEAKER_LINE_REGEX (line 351), applied
    by isSpeakerLine (lines 330-339) — "const SPEAKER_LINE_REGEX = /^\s*(?:[[(]\d{1,2}:\d{2}(?::\d{2})?[\])][\s\t]+)?[A-Za-zÀ-ÿ0-9_]+(?:\s[A-Za-zÀ-ÿ0-9_]+)?:\s/;"'
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
- node: rules/knowledge-base/traversal-expands-live-nodes
  conforms: true
  how: 'src/modules/knowledge-graph/service/traversal.service.ts: held at the next-frontier loop at lines
    284-294 of traverseNodes() — if (row.status === "deleted") continue; if (row.status === "merged")
    continue; nextFrontier.push(substituted);'
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-lists-reached-nodes
  conforms: true
  how: 'src/modules/knowledge-graph/service/traversal.service.ts: held at the node seeding at lines 175-178
    and the finalNodes loop at lines 326-332 of traverseNodes() — for (const id of visitedNodeIds) { const
    row = nodesById.get(id); if (row === undefined) continue; if (row.status === "merged") continue; finalNodes.push(row);
    }'
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: constraints/retrieval-transports-answer-alike
  conforms: true
  how: 'src/modules/knowledge-graph/mcp/query-toolset.ts: held at makeHandler (lines 237-253) together
    with the strict input schemas (lines 77-110) — "const result = await withReadOnly(pool, (client) =>
    run(parsed, client)); return { ok: true, result }; } catch (err) { return mapErrorToEnvelope(err);"
    and "export const ListNodeTypesInputSchema = z.object({}).strict();". The service functions called
    are the ones the REST routes use, and the schemas refusing undefined parameters are `.strict()`.

    src/modules/knowledge-graph/routes/knowledge-graph.routes.ts: held at the route handlers of this file.
    They hand known service errors to the mapper shared with the MCP transport (handleReadError, handleTraversalError,
    handleAttributeKeyHistoryError, all calling mapErrorToHttpResponse). The REST-only leniency for the
    node-type listing, the link and attribute reads and the three history reads is held by those routes
    parsing no query. — app.get("/node-types", async (_req, reply) => ...) parses no query; app.get("/links/:link_id",
    ...) parses only `LinkIdParamSchema.parse(request.params)`; the history routes parse only params.
    The other retrieval routes parse a strict query schema, for example `ListLinkTypesQuerySchema.parse(request.query
    ?? {})`, and queries.dto.ts closes those with `.strict()`.

    src/modules/query-retrieval/mcp/query-toolset.ts: held at makeHandler (lines 184-200) and the four
    registerTool calls (lines 218-284), as the MCP half only. The failure path delegates to the shared
    mapper, and each tool calls a service function imported from ../service/. The REST half is outside
    this file. — return mapErrorToEnvelope(err); and, per tool, searchKnowledgeService(client, catalog,
    {...}, svcLogger) / getProvenanceByLinkService(client, input.link_id, svcLogger)

    src/modules/query-retrieval/routes/query-retrieval.routes.ts: held at handleSearchError and handleProvenanceError
    (lines 217-236), which delegate to the shared mapper instead of building the envelope themselves —
    const { statusCode, envelope } = mapErrorToHttpResponse(err); return reply.status(statusCode).send(envelope);

    src/shared/error-mapping.ts: held at codeToHttpStatus, line 82, and toMcpToolResult, line 221. One
    registry renders REST and the MCP form wraps the same envelope.error. — export const codeToHttpStatus:
    Record<string, number> = {   ...   content: [{ type: "text", text: JSON.stringify(envelope.error)
    }],'
  encoded_at:
  - src/modules/knowledge-graph/mcp/query-toolset.ts
  - src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  - src/modules/query-retrieval/mcp/query-toolset.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
  - src/shared/error-mapping.ts
- node: domain/knowledge-base/raw-chunk
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/chunker/v1.ts, src/modules/ingestion/dto/ingest-raw-information.dto.ts,
    src/modules/ingestion/repository/ingestion.repository.ts, and src/modules/ingestion/repository/llm-run.repository.ts
    read `nowhere` — The file declares no raw-chunk shape. It only counts chunks: `SELECT count(*)::text
    AS n FROM raw_chunk WHERE id = ANY($1::uuid[]) AND raw_information_id = $2`; src/modules/ingestion/service/ingestion.service.ts
    read `nowhere` — The file declares no chunk shape. It only forwards chunker output and reads `c.chunk_index`,
    `c.offset_start` and `c.offset_end` from rows typed in ../repository/ingestion.repository.js: `chunkRows.map((c)
    => ({ id: c.id, chunk_index: c.chunk_index, offset_start: c.offset_start, offset_end: c.offset_end
    }))`. — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/chunker/v1.ts
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/repository/ingestion.repository.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
- node: domain/knowledge-base/raw-information
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/dto/ingest-raw-information.dto.ts,
    src/modules/ingestion/mcp/mcp-schemas.ts, src/modules/ingestion/repository/ingestion.repository.ts,
    src/modules/ingestion/repository/llm-run.repository.ts, and src/modules/ingestion/prompts/extraction.v1.ts
    read `nowhere` — `export interface DocumentMetadata { readonly source_type: string; readonly received_at:
    string; readonly document_date: string | null; readonly title: string | null; }` is a read-only prompt
    input built by the orchestrator, not the raw information''s shape.; src/modules/ingestion/service/ingestion.service.ts
    read `nowhere` — The file declares no raw-information shape. It forwards values to `insertRawInformation(client,
    { source_type: input.source_type, content: input.content, content_hash: contentHash, metadata: input.metadata,
    original_input: input.original_input ?? null })`. The shape is declared in the repository and DTO
    files. — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/repository/ingestion.repository.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
- node: rules/knowledge-base/curation-reason-not-blank
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/mcp/error-envelope.ts read `nowhere` —
    The file only maps an already-raised issue to a code. It holds no trimming or length check on a reason:
    `case "BUSINESS_REASON_REQUIRED": return "reason is required for the requested operation";`.'
  observed_at:
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/dispute-resolution-distinct-items
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/mcp/error-envelope.ts read `nowhere` —
    No check on the number or uniqueness of item_ids. The only dispute branches are `case "BUSINESS_DISPUTE_WINNER_REQUIRED"`
    and `case "BUSINESS_DISPUTE_PERIODS_REQUIRED"`, which map messages for other rules.'
  observed_at:
  - src/modules/curation/mcp/error-envelope.ts
unstated:
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: Lines 139-143, the registerTool call
  evidence: "deps.mcp.registerTool(\"curation\", {\n    name: \"compliance_delete\",\n    description:\n\
    \      \"Tombstone a RawInformation under LGPD or owner request. Idempotent.\","
  cost: The tool name compliance_delete, its placement in the curation toolset, and the description text
    that says what the tool is for are surface facts that the model and the owner see. No node holds them.
    The compliance-audit contract names the operation "compliance-delete" and says only "over MCP". The
    next reader looks for the MCP tool's name and toolset in the specification and finds this file.
- file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: coerceNonNegativeInt (lines 338-347), used by rowToDto for each of the four affected counts
  evidence: "if (typeof v === \"number\" && Number.isFinite(v) && v >= 0) {\n    return Math.trunc(v);\n\
    \  }\n  ...\n  return 0;"
  cost: A stored count that is absent, negative or not a number is reported to the owner as 0, and a fractional
    one is truncated. No node states either rule. The specification only says the counts are zero or more.
    The audit record can therefore show "0 links deleted" for a row that holds no such figure, and the
    next reader will look in the specification for the reason and not find it.
- file: src/modules/curation/mcp/error-envelope.ts
  where: ZOD_CUSTOM_CODE_PRIORITY (lines 22-31) and the loop in mapZodError that returns the first listed
    code found among the issues (lines 70-79)
  evidence: "const ZOD_CUSTOM_CODE_PRIORITY: readonly string[] = [\n  \"BUSINESS_TARGET_NODE_REQUIRED\"\
    ,\n  \"BUSINESS_REASON_REQUIRED\",\n  \"BUSINESS_SELF_MERGE_FORBIDDEN\",\n  \"BUSINESS_DISPUTE_WINNER_REQUIRED\"\
    ,\n  \"BUSINESS_DISPUTE_PERIODS_REQUIRED\",\n  \"BUSINESS_TEMPORAL_INCOHERENT\",\n  \"BUSINESS_CORRECTION_NO_CHANGES\"\
    ,\n  \"BUSINESS_DATE_UNJUSTIFIED\",\n];\nfor (const code of ZOD_CUSTOM_CODE_PRIORITY) {\n  if (seen.has(code))\
    \ {"
  cost: When one curation request breaks several validation rules at once, this list alone decides which
    refusal code and message the caller receives. contracts/knowledge-base/curation names each refusal
    and its code but never says which one wins when more than one applies. The next reader will look for
    the order in the specification, will not find it, and will take this array as the business decision.
- file: src/modules/curation/routes/curation.routes.ts
  where: the route path literals of every registration (app.get "/queue" at line 116, app.get "/metrics"
    at line 137, app.post "/entity-matches/:node_id/resolve" at line 196, "/nodes/merge" at line 222,
    "/disputes/resolve" at line 248, "/items/confirm" at line 272, "/items/reject" at line 300, "/items/correct"
    at line 328) and the header comment "Mounted under `/api/v1/curation/*`"
  evidence: "app.post(\n  \"/entity-matches/:node_id/resolve\",\n  ...\napp.post(\n  \"/disputes/resolve\"\
    ,"
  cost: The method-and-path under which each of the eight curation operations is served exists only in
    this file. No node in the specification holds any route path (a search of the specification root for
    these paths finds none). The next reader looks in the curation contract for how an operation is reached
    and finds only the operation names.
- file: src/modules/ingestion/chunker/config.ts
  where: line 19, the lower bound CHUNK_TARGET[0]
  evidence: 'export const CHUNK_TARGET: readonly [number, number] = [1500, 2000] as const;'
  cost: The specification holds 2000 as the point past which a chunk closes (long-block-sentence-chunks)
    and holds no lower bound of 1500. The number lives only in this file, so the next reader looking for
    the chunk-size window in the specification will find only the upper edge. Nothing else in the tree
    reads CHUNK_TARGET[0]; only CHUNK_TARGET[1] is read, at v1.ts line 104.
- file: src/modules/ingestion/chunker/config.ts
  where: line 30, READING_TAIL
  evidence: export const READING_TAIL = 200 as const;
  cost: A 200 code-point reading-tail overlap is declared as a chunking constant and no node holds it.
    Nothing in the tree reads it, so it sits here looking like a decided value, and a later retrieval
    layer would inherit 200 from the file instead of from the specification.
- file: src/modules/ingestion/chunker/v1.ts
  where: 'lines 229 and 289-307: `const isBlank = line.endExclusive === line.start;` and scanLines'
  evidence: '"Line terminator is `\n`; the terminator is NOT included in the range (so blank lines have
    `start == endExclusive`)." with `if (codePoints[i] === "\n")` and `const isBlank = line.endExclusive
    === line.start;`'
  cost: The code decides what a line and a blank line are. A line ends only at `\n`, and a blank line
    has no characters at all. A line holding only spaces, or `\r` as in a CRLF email, is not blank. This
    decides where an email's header block ends and where its quote blocks start, and no node states it.
    The next reader looks for it in the email-header-block rule and does not find it. A CRLF email never
    closes its header block.
- file: src/modules/ingestion/dto/propose-link.dto.ts
  where: the `change_hint` field of ProposeLinkInputSchema, line 69
  evidence: 'change_hint: ChangeHintSchema.default("none").describe('
  cost: The code treats an omitted `change_hint` as `none`, so an omitted hint takes the re-affirmation
    path. No node states that default for propose-link. The enumeration node lists the values, and the
    re-affirmation rule speaks only of a hint that is none. A reader looking in the specification for
    what an omitted hint means will not find it.
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: The `body` object built at lines 114-121, the `storage_ref` and `metadata` members.
  evidence: 'storage_ref: null, metadata: input.metadata ?? {},'
  cost: A document ingestion always records no storage reference and records empty metadata when the caller
    gives none. Neither value is stated by the contract's ingest-document operation or by any node I found
    (grep of projections/full-text.md for "storage reference", "storage_ref" and "metadata"). Because
    it is not in the specification, the next reader will not find it there, and this file becomes the
    place that decision lives.
- file: src/modules/ingestion/prompts/extraction.v2.ts
  where: EVENT_DATING_DIRECTIVE, the third bullet (lines 50-51)
  evidence: '"- Rescheduling an event is `change_hint:\"succession\"` on `event_date` — the", "  same
    mechanics as any functional attribute (the old date becomes history).",'
  cost: This line is emitted to the model in every v2 extraction. It tells the model to mark a rescheduled
    event as a succession on event_date. The extraction rules (extraction-dates-events, extraction-event-date-is-the-value)
    say how event_date and its validity start are asked for. None of them says the model is asked to treat
    a rescheduling as a succession. A reader looking for what the model is told about moved events will
    not find it in the specification, and the prompt becomes the only place the decision lives.
- file: src/modules/ingestion/routes/ingestion.routes.ts
  where: POST_INGEST_BODY_LIMIT, line 126, passed as bodyLimit to app.post("/raw-information", ...) at
    line 144
  evidence: const POST_INGEST_BODY_LIMIT = 11 * 1024 * 1024;
  cost: A threshold decides whether the ingest request is accepted before any validation runs, and no
    node holds it. The only size limit the specification states is 10,485,760 UTF-16 code units for content
    (rules/knowledge-base/content-length) and for original input (rules/knowledge-base/original-input-length).
    The 11 MiB request-body ceiling lives only in this constant, so someone reading the specification
    cannot learn it. It is also easy to mistake for the content limit.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: IsoDateSchema (lines 99-102), used by valid_from and valid_to of DirectedAttributeItemSchema
    (lines 141-142) and DirectedLinkItemSchema (lines 152-153)
  evidence: 'const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "valid_from / valid_to must
    be ISO YYYY-MM-DD"); ... valid_to: IsoDateSchema.optional(),'
  cost: The service accepts, shape-checks and forwards a validity end for directed attributes and links,
    and emits a message naming it. The directed rules state only the validity start's shape, and the decision
    log beside directed-validity-start-shape records that only the validity start is stated. A reader
    looking in the specification for what a directed item may carry will not find the validity end, so
    the code is the only place it is decided.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Steps 4-5, the swallowed run close and the empty affected nodes on a failed resolution (lines
    764 and 776-787; closeRunCompletedSafe, lines 1006-1034)
  evidence: await closeRunCompletedSafe(deps.pool, llm_run_id, deps.logger); ... // resolvedAffected stays
    []; the run is still completed. ... /* swallow */
  cost: When the close transaction or the affected-nodes resolution fails, the response still says status
    "completed" with affected_nodes empty, and only a log line records the failure. The contract states
    a completed run with its affected nodes and names no answer for a run that did not close or whose
    nodes could not be read. This degradation is decided only in this file.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe fallback (lines 1050-1054) and the null finished_at branch (lines 1072-1074)
  evidence: 'const fallback = { started_at: new Date(0).toISOString(), finished_at: new Date(0).toISOString(),
    attempts: 1, };'
  cost: The run's start and finish times and its attempts are reported as the epoch (1970-01-01T00:00:00.000Z)
    and 1 when the closed run cannot be read. A caller receives these invented values as if they were
    the run's, and no node says so.
- file: src/modules/ingestion/service/extraction.service.ts
  where: MAX_TURNS_PER_CHUNK and its use, lines 620-627 and 749-755
  evidence: 'const MAX_TURNS_PER_CHUNK = 64; ... "extraction_chunk_turn_cap_reached" ); return { kind:
    "completed" };'
  cost: A chunk is declared read, and the run goes on to completion, once the model has taken 64 turns
    on it, whatever it has or has not proposed. This is a threshold that decides whether knowledge of
    a chunk can be silently left out. No node holds the number or the outcome, so the business decision
    lives only here.
- file: src/modules/ingestion/service/extraction.service.ts
  where: The default branch of dispatchToolUse, lines 282-293
  evidence: "default:\n      // P2.1 — unknown tool name is a structural-layer rejection\n      return\
    \ {\n        ok: false,\n        error: {\n          code: \"VALIDATION_INVALID_FORMAT\",\n      \
    \    message: `Unknown tool '${toolName}'.`,\n          details: { tool_name: toolName },\n      \
    \  },\n      };"
  cost: During extraction the model is told, in these words, that a tool name outside the four proposals
    is refused with VALIDATION_INVALID_FORMAT. No node holds that refusal or its message. The ingestion
    contract's refusals cover only the proposal operations, so this behavior is decided only here.
- file: src/modules/ingestion/service/extraction.service.ts
  where: The tool_use filtering in runChunkLoop, lines 668-686
  evidence: "if (toolUseBlocks.length === 0) {\n      // No tool_use AND not an end_turn / refusal / pause_turn\
    \ — treat as\n      // soft end_turn (the model has nothing more to say).\n      return { kind: \"\
    completed\" };\n    }"
  cost: A model turn that stops for any other reason and proposes nothing (for example max_tokens) counts
    as the chunk fully read, and `pause_turn` resumes the same chunk. No node says which stop reasons
    end a chunk. Knowledge truncated at the token ceiling would be dropped without any recorded outcome.
- file: src/modules/ingestion/service/extraction.service.ts
  where: zodErrorEnvelope, lines 297-317
  evidence: 'message: "Input failed Zod parse.",'
  cost: The in-process loop gives the model a shape-failure message that differs from the one the ingestion
    contract holds for the same refusal ("MCP tool args failed Zod parse." over MCP). The contract's log
    records that "Input failed Zod parse." was the rejected wording. A reader of the contract cannot tell
    that the extraction loop still speaks it.
- file: src/modules/ingestion/service/llm-run.service.ts
  where: getLlmRunById, lines 97-119 (the BR-33 comment block and the try/catch around deriveAffectedNodes)
  evidence: "\"} catch {\n        // Best-effort — omit the field on a transient read failure; the\n \
    \       // caller can re-derive on the next poll.\n        affectedNodes = undefined;\n      }\""
  cost: The code answers a completed run without its affected nodes whenever the derivation read fails,
    and the run is still returned as a successful read. No node states this degraded answer. The read-llm-run
    contract promises the affected nodes "when it is completed", and the rule affected-nodes-only-when-completed
    only limits when they are listed. A reader of the specification would expect a failed derivation to
    be refused. A caller cannot tell an omitted field from a run that has no affected nodes, because an
    empty list is also a valid completed-run payload.
- file: src/modules/ingestion/service/propose-link.service.ts
  where: Layer 4 (Confidence) returning before Layer 5 (Anti-hallucination), lines 167-194
  evidence: 'const route = routeConfidence(args.confidence); if (route.kind === "below_floor") { ... return
    { ok: true, result }; } // ---- Layer 5: Anti-hallucination ---- const anchored = await countFragmentsAnchoredToSource(client,
    {'
  cost: A below-floor proposal that cites fragments not drawn from the run's source gets outcome rejected
    with reason BELOW_CONFIDENCE_FLOOR, and the anchoring refusal (VALIDATION_INVALID_FORMAT naming the
    fragments) is never raised. The same proposal at or above the floor is refused. No node states which
    answer takes precedence when both apply. The order lives only in this file's sequence of awaits, so
    the next reader looks for it in the specification and does not find it.
- file: src/modules/knowledge-graph/mcp/query-toolset.ts
  where: QUERY_TOOL_NAMES (lines 161-171), the QueryToolInputJsonSchemas keys (lines 136-155) and the
    registerTool calls
  evidence: "\"export const QUERY_TOOL_NAMES: readonly QueryToolName[] = [\n  \\\"get_node\\\",\n  \\\"\
    traverse\\\",\n  \\\"get_history_link\\\",\n  \\\"get_history_attribute\\\",\n  \\\"get_history_attribute_key\\\
    \",\n  \\\"list_nodes\\\",\n  \\\"list_node_types\\\",\n  \\\"list_link_types\\\",\n  \\\"list_attribute_keys\\\
    \",\n];\""
  cost: These are the names an LLM caller uses for the read operations, and flattened input fields such
    as `node_id`, `link_id`, `attribute_id` and `key` come with them. The retrieval contract names its
    operations read-node, read-link-history, list-node-types and so on, and states no MCP tool name for
    them. The names live only in this file, so a reader looking in the specification will not find them.
    The set of nine also leaves out operations the contract lists, such as search, read-link, read-attribute
    and the provenance reads, and the specification does not say which operations MCP exposes.
- file: src/modules/knowledge-graph/service/formatters.ts
  where: the timestamp fallbacks in toNodeAlias (line 127), toAttributeDetail (line 144), toLinkDetail
    (line 171) and toProvenanceEntry (lines 193-194)
  evidence: formatTimestamptz(row.created_at) ?? new Date(0).toISOString() formatTimestamptz(row.recorded_at)
    ?? new Date(0).toISOString() formatTimestamptz(row.received_at) ?? new Date(0).toISOString()
  cost: When a creation, recording or reception time is absent, the code reports the Unix epoch (1970-01-01T00:00:00.000Z)
    as if it were that time. No node holds this value or says what a read returns for an absent time.
    The epoch would read as a real date and would not show that the data was missing.
- file: src/modules/knowledge-graph/service/history.service.ts
  where: assembleLinkHistory (lines 150-155) and assembleAttributeHistory (lines 174-179), the warning
    logged for a version with no provenance
  evidence: "if (row.status !== \"deleted\" && provenance.length === 0) {\n  logger.warn(\n    { route,\
    \ link_id: row.id, status: row.status },\n    \"knowledge_graph_empty_provenance\"\n  );\n} (the attribute\
    \ twin logs { route, attribute_id: row.id, status: row.status } under the same message)"
  cost: The code treats a non-deleted link or attribute version with an empty provenance list as an anomaly
    worth an alarm, and treats a deleted one as unremarkable. No node in the set or among the candidates
    states this. The nearest, rules/knowledge-base/graph-read-shows-empty-provenance, says only that a
    graph read answers such an item with an empty provenance list. A reader who looks in the specification
    for what an unsourced version means finds the answer in a log call.
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: '`.strict()` closing SearchQuerySchema, line 74'
  evidence: "export const SearchQuerySchema = z\n  .object({\n    query: QueryString,\n    ...\n  })\n\
    \  .strict();"
  cost: The code refuses a search that names any parameter the search does not define. The `search` operation
    in the retrieval contract lists no such refusal. Only the accepted-fragment listing (a rule), the
    catalog listings and the graph reads state one. The refusal therefore lives only in this schema, and
    the next reader looks for it in the specification and does not find it. The same schema is reused
    by the MCP query toolset, so it applies on both transports.
- file: src/modules/query-retrieval/repository/search.repository.ts
  where: the excerpt expression in searchChunkLayer (lines 177-178), repeated in listProvenanceForFragments
    (264-265), listProvenanceForLinks (301-302) and listProvenanceForNodes (360-361)
  evidence: "substring(rc.\"text\" FROM rc.offset_start + 1\n          FOR rc.offset_end - rc.offset_start)\
    \ AS excerpt"
  cost: A search result's chunk excerpt is cut from the chunk's own text starting at the chunk's start
    offset, for the chunk's length. No node states this cut for search. The only node that states it,
    graph-provenance-excerpt-is-chunk-excerpt, is scoped to "A graph read's provenance entry". Search
    is not a graph read, so the cut that decides what a search result shows lives only in this SQL, and
    the next reader will look for it in the specification and not find it.
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 53-56, the constant PER_LAYER_FETCH_LIMIT and its use in the three layer calls at lines
    128-148
  evidence: const PER_LAYER_FETCH_LIMIT = 200;  ... searchFragmentLayer(client, input.query, PER_LAYER_FETCH_LIMIT)
    ... searchNodeAliasLayer(client, input.query, PER_LAYER_FETCH_LIMIT) ... searchChunkLayer(client,
    input.query, PER_LAYER_FETCH_LIMIT)
  cost: The code keeps at most 200 hits per layer before ranking, and the search total is counted only
    over what survives that cut. No node states the number or the cap. search-total-before-pagination
    says the total counts "every search item", so for a broad query the total and the reachable results
    are smaller than that node reads, and the next reader looking in the specification will not find why.
- file: src/shared/error-mapping.ts
  where: the codeToHttpStatus entry BUSINESS_CHAT_INGEST_DISABLED, line 139
  evidence: 'BUSINESS_CHAT_INGEST_DISABLED: 503,'
  cost: The code and its HTTP 503 are stated here, but no node holds them. The chat contract holds BUSINESS_CHAT_DISABLED
    and BUSINESS_CHAT_PROVIDER_UNAVAILABLE, and a grep for CHAT_INGEST and INGEST_DISABLED across the
    specification finds nothing. The refusal and its status live only in this registry, where the next
    reader of the chat contract will not look.
- file: src/shared/error-mapping.ts
  where: the codeToHttpStatus entry RESOURCE_ALREADY_EXISTS, line 96
  evidence: 'RESOURCE_ALREADY_EXISTS: 409,'
  cost: The code and its HTTP 409 are published as a refusal answer, but no node in the specification
    names this code or any condition that produces it (grep of the whole specification root finds no match).
    The 409 lives only in this registry. The next reader will look in the specification for what answers
    409 and find only RESOURCE_CONFLICT.
restates:
- file: src/middleware/auth.ts
  where: 'the comments on the local operator bypass: lines 110-113, 132-136 and 182-186'
  evidence: '// DEV-ONLY local operator bypass (see config/env.ts LOCAL_OPERATOR_TOKEN). // Resolved once
    at build time: enabled only when running in development AND a // token is configured. In any other
    mode this is `null` and the bypass branch // below is dead — production never trusts a static bearer.'
  cost: The rule that the local operator token admits the owner only in development, compared in constant
    time, is stated again in prose. The rule already sits in a node and in this file's code (`env.NODE_ENV
    === "development"` and `constantTimeEqual`). A change to the node would leave these comments saying
    the old rule.
  node: constraints/local-operator-token-development-only
- file: src/middleware/auth.ts
  where: the header comment, lines 9-12 (the "Error mapping" list)
  evidence: '// Error mapping (registered in docs/specs/_global/error-codes.md): //   - Missing/malformed
    `Authorization` header     -> 401 AUTH_UNAUTHORIZED //   - Token expired (exp <= now)                   ->
    401 AUTH_TOKEN_EXPIRED //   - Bad signature / wrong issuer / not a JWT     -> 401 AUTH_TOKEN_INVALID'
  cost: The authenticate-owner refusals are listed a second time in prose outside behavior. The list omits
    the `sub`-claim refusal and names "wrong issuer", which the code does not check, so a reader who trusts
    it learns a different set of refusals than the node holds. The code holds the real mapping in this
    file (the `AuthError` constructions in `preHandler` and `mapJoseError`).
  node: contracts/knowledge-base/access
- file: src/middleware/error-handler.ts
  where: Header comment, lines 11-19 (the "Error mapping" list and the "MUST NOT leak internal messages"
    paragraph). The "BR-18 of knowledge-graph" comment at line 125 restates the same pg 503 mapping.
  evidence: '// Error mapping (registered in docs/specs/_global/error-codes.md):

    //   - AuthError                    -> 401 (code from AuthError.code)

    //   - ZodError                     -> 422 VALIDATION_INVALID_FORMAT

    //   - pg error: ECONNREFUSED / ETIMEDOUT / 57P03 / 57014 -> 503 SYSTEM_SERVICE_UNAVAILABLE

    //   - Any other unhandled error    -> 500 SYSTEM_INTERNAL_ERROR'
  cost: The status and code table is stated a second time in prose. It already lives in the branches of
    classify() and in the node. It cites docs/specs/_global/error-codes.md as its home, so a reader is
    sent to a document that is not the specification. When the node moves, this table still reads as current
    and no check reaches it.
  node: contracts/knowledge-base/access
- file: src/middleware/error-handler.ts
  where: classify(), branch 5 comment, lines 140-142
  evidence: '// Never leak an internal message on a 5xx path (the file contract):

    // 4xx messages are client-actionable and framework-generated, but a

    // 5xx message may carry internal detail — use a generic string.'
  cost: 'The 4xx/5xx message rule is stated in prose. The code on the next line holds it (`message: isServerError
    ? "Internal server error." : err.message`) and so does the node. A third statement, citing "the file
    contract", gives a reader a second place to look when the rule changes.'
  node: contracts/knowledge-base/access
- file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  where: the doc comment above ListComplianceDeletionsQuerySchema, lines 74-79
  evidence: Time-range filters honor BR-09 (`from` inclusive, `to` exclusive). When both bounds are supplied,
    the parser rejects `from >= to` with `VALIDATION_OUT_OF_RANGE`.
  cost: The window-ordering rule is restated in prose, citing a back-spec rule (BR-09) rather than the
    node. The superRefine below it, `Date.parse(value.executed_from) >= Date.parse(value.executed_to)`,
    holds the ordering check, so the comment can only drift from the node.
  node: rules/knowledge-base/audit-window-ordered
- file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  where: the doc comment above ReasonSchema, lines 12-19
  evidence: /** `reason` — non-empty after trim, ≤ 1000 chars (BR-01). ... `z.string().trim().min(1).max(1000)`
    runs `trim()` then checks the length AFTER the trim.
  cost: The reason's bounds are written a second time in prose, citing a back-spec rule (BR-01) rather
    than the node. The next reader can take the comment for where the bounds are decided. The code on
    line 20 carries them, so the comment can only drift from the node. It cannot be checked against it.
  node: rules/knowledge-base/compliance-deletion-reason-length
- file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: the docblock of ListCurationActionsQuerySchema, lines 33-37
  evidence: '"BR-09 semi-open time-range honored (`from` inclusive, `to` exclusive); BR-10 action enum
    validated here."'
  cost: The half-open window rule is restated as prose pointing at a BR number. The code that enforces
    it is the repository's `created_at >= $n` and `created_at < $n`, not this file, so a reader of this
    file sees a claim with no code behind it. The comment will go stale without any tool noticing.
  node: rules/knowledge-base/audit-listing-window-half-open
- file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: the header comment, lines 1-5, and the docblock of CurationActionNameSchema, line 11
  evidence: '"The `action` filter is validated at the API layer ONLY (BR-10) — the underlying DB column
    is plain `text` (schema line 454)." and "/** 7 curation-tool names of §14.4 (BR-10). */" above z.enum(["resolve_entity_match",
    "merge_nodes", "resolve_dispute", "confirm_item", "reject_item", "correct_item", "compliance_delete"])'
  cost: The closed set of seven action kinds is stated in prose that cites a business rule number and
    a section of a retired document, while the node holds the set. The next reader may take the comment
    as the place the set is decided. The comment's section and BR numbers will not follow the node when
    it moves. The enumeration itself is declared in this file by the z.enum, so the prose is a second
    home for the fact.
  node: domain/knowledge-base/curation-action-kind
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: Lines 1-22, the file header comment
  evidence: '// Per BR-15 (P2.1 canonical taxonomy — same codes on REST and MCP):

    //   - Zod parse failure -> VALIDATION_REQUIRED_FIELD | VALIDATION_INVALID_FORMAT

    //                         | VALIDATION_OUT_OF_RANGE (Zod-discriminated)

    //   - raw_information_id resolves to no row -> RESOURCE_NOT_FOUND

    //   - UC-01 alt 4c legacy orphan -> SYSTEM_INTERNAL_ERROR'
  cost: The header restates the compliance-delete refusal codes. The code in this file also holds them,
    in mapZodErrorToEnvelope and in the catch block's renderErrorEnvelope calls, and the node contracts/knowledge-base/compliance-audit
    states them. The comment is a third home that names BR and UC identifiers instead of the node. When
    the contract changes, this prose will still read as the authority and will be wrong.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: Lines 48-72, the docstrings above McpEnvelope and mapZodErrorToEnvelope
  evidence: '* principle of §14 ("business outcomes are not errors"): idempotent no-op is

    * a successful `ok: true` envelope with `outcome: noop_already_deleted`.

    ...

    *   3. `reason` length / trim violation (`too_small` / `too_big` on the `reason`

    *      path) -> `VALIDATION_OUT_OF_RANGE`.'
  cost: The docstrings restate the noop_already_deleted outcome and the rule that a reason must be non-empty
    after trim and at most 1000 characters. The compliance-audit contract and the rules/knowledge-base/compliance-deletion-reason-length
    rule that it cites hold both. The code here forwards the outcome from complianceDelete() and holds
    the code and message in renderErrorEnvelope("VALIDATION_OUT_OF_RANGE", ...). A reader who trusts the
    prose is looking at a copy of the rule.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of insertCurationAction, lines 370-373
  evidence: '* BR-08 — inserts the one CurationAction row per UC-01 `deleted` outcome.'
  cost: The docstring says that a deleting compliance deletion records one curation action. This file
    only inserts whatever row it is handed (`INSERT INTO curation_action (action, target_kind, target_id,
    payload, reason)`). The kind compliance-delete, the target and the payload are chosen in another file.
    The sentence therefore points at a service-side rule and not at anything this file holds.
  node: rules/knowledge-base/compliance-deletion-records-curation-action
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of tombstoneRawChunksOfRaw, lines 84-88
  evidence: '* Spec UC-01 step 6 cascades BOTH * `status = ''deleted''` and `superseded_at = now()`.'
  cost: The prose restates the tombstone rule (status deleted plus the deletion moment as supersession
    time). The UPDATE ... SET status = 'deleted', superseded_at = now() ... AND superseded_at IS NULL
    already holds it. The same sentence is repeated for fragments at lines 109-110. The copies would drift
    from the node if it moved.
  node: rules/knowledge-base/compliance-deletion-tombstones
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of tombstoneRawInformation, lines 46-50 ("content_hash is intentionally left untouched
    (BR-04).")
  evidence: '* content_hash is intentionally left untouched (BR-04).'
  cost: The docstring states the node's fact a second time, outside any behavior. The UPDATE's SET list
    already holds it, because it never names content_hash. The comment cites a back-spec rule number (BR-04),
    so the next reader may take that document, and not the node, as the place where the rule lives.
  node: rules/knowledge-base/compliance-deletion-keeps-content-hash
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of tombstoneRawInformation, lines 51-60 (the [REDACTED] literal and the BR-18 original_input
    CASE explanation)
  evidence: '* The `[REDACTED]` literal is hardcoded — never read from config * `original_input` is redacted
    in the SAME UPDATE statement using a * CASE expression so null stays null'
  cost: The docstring says a second time what the UPDATE does with `content = '[REDACTED]'` and `original_input
    = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]' END`. The prose also gives a reason
    (an "audit-honest distinction") that no node holds. A reader who finds it here may take it as the
    decided rule.
  node: rules/knowledge-base/compliance-deletion-redacts-content
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstrings of listComplianceDeletions (line 307, "newest-first") and listCurationActions (line
    427, "newest-first")
  evidence: '* UC-02 — list ComplianceDeletion rows newest-first with optional filters. * UC-04 — list
    CurationAction rows newest-first with optional filters.'
  cost: The ordering rule is also said in prose. The `ORDER BY executed_at DESC` and `ORDER BY created_at
    DESC` clauses already hold it, so the prose is a second home.
  node: rules/knowledge-base/audit-listing-order
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstrings of listComplianceDeletions (lines 306-309) and listCurationActions (lines 426-429)
  evidence: '* UC-02 — list ComplianceDeletion rows newest-first with optional filters. * BR-09: `executed_from`
    inclusive, `executed_to` exclusive (semi-open).'
  cost: The docstrings restate the window rule (at or after the start, strictly before the end) that `executed_at
    >= $n` / `executed_at < $n` and `created_at >= $n` / `created_at < $n` already hold. A second home
    in prose can drift from the node.
  node: rules/knowledge-base/audit-listing-window-half-open
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstrings of tombstoneCascadedFragments, tombstoneCascadedLinks and tombstoneCascadedAttributes,
    lines 105-107, 139-141 and 174-176
  evidence: '* BR-06 — tombstones every fragment whose `fragment_source` chain anchors * ONLY chunks of
    the deleted raw. Cross-source fragments survive.'
  cost: The cascade reach (only items resting on the deleted raw and on no other non-deleted raw) is said
    in prose three times beside the `NOT EXISTS (... ri.id <> $1 AND ri.status <> 'deleted')` clauses
    that hold it. The comments cite back-spec numbers (BR-06, BR-07), which points readers away from the
    node.
  node: rules/knowledge-base/compliance-deletion-propagates
- file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  where: the comment before the third branch of handleZodError, lines 239-241
  evidence: // Priority 3 — `reason` length / trim violations. We can detect those by // the path being
    "reason" and the issue being `too_small` (empty after // trim) or `too_big` (> 1000 chars). Both map
    to OUT_OF_RANGE.
  cost: The comment states the 1000-character limit and its mapping to VALIDATION_OUT_OF_RANGE. The contract
    holds this, and the limit is also enforced in dto/compliance-delete.dto.ts (`z.string().trim().min(1).max(1000)`).
    The number now sits in a third place, and a change to it would not reach this comment.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  where: the docstring above handleZodError, lines 182-189
  evidence: '* Translate ZodError into our standard envelope. Two special-case mappings: *  - issue.message
    === ''VALIDATION_OUT_OF_RANGE'' (from `superRefine` for *    semi-open range guards) -> error.code:
    VALIDATION_OUT_OF_RANGE. *  - empty / missing `reason` or `raw_information_id` -> the most specific
    *    code we can infer (VALIDATION_REQUIRED_FIELD vs VALIDATION_OUT_OF_RANGE). *  - anything else
    -> VALIDATION_INVALID_FORMAT.'
  cost: The docstring is a second home for the error-code mapping that the compliance-audit contract holds.
    The mapping is also in the code just below, so the two can drift apart. The next reader may take the
    docstring as the decided mapping and not the contract.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: the docstring of complianceDelete, lines 72-75 (discriminated union return)
  evidence: '* Discriminated union return: *   - { outcome: ''deleted'',              deletion } -> HTTP
    201 *   - { outcome: ''noop_already_deleted'', deletion } -> HTTP 200'
  cost: The outcome-to-status mapping of the compliance-delete contract is restated in prose. The mapping
    is chosen in the route, not here, so this comment can go stale without any check noticing.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: the file-header comment, lines 7-15 (Transaction policy (BR-02))
  evidence: // The CALLER (route or MCP handler) opens BEGIN / COMMIT / ROLLBACK and // hands the live
    `client` to `complianceDelete`. Every DB statement of // UC-01 runs on that same client; commit is
    reached only after BR-08 has // written BOTH audit rows.
  cost: The all-or-nothing rule for a compliance deletion is restated in prose in a file that does not
    open the transaction. If the node moves, nobody has to touch this comment, and it will keep describing
    the old rule.
  node: constraints/compliance-deletion-is-atomic
- file: src/modules/compliance-audit/service/errors.ts
  where: the docblock above InternalFailure, lines 54-59
  evidence: '* 500 — UC-01 alt `4c` legacy inconsistency: `raw_information.status =

    * ''deleted''` exists with no `compliance_deletion` row. BR-17 mandates an

    * operational alarm (already emitted at the service layer) and a generic

    * 500 to the client.'
  cost: 'The condition for this refusal (a raw information already deleted with no compliance deletion
    on record) and its generic 500 are stated in prose. Code holds the same fact in another file: compliance-audit.service.ts
    has `throw new InternalFailure("legacy_orphan_tombstone", {`, and this file holds the status, code
    and message `super("Unexpected internal error.", details)`. The contract contracts/knowledge-base/compliance-audit
    also states it. The docblock is a second home the next reader may trust over the contract, and it
    names a back-spec (UC-01, BR-17) instead of a node.'
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/service/errors.ts
  where: the header comment, lines 1-16 (the "Three families" list)
  evidence: '//   - ResourceNotFoundError -> 404 / RESOURCE_NOT_FOUND

    //   - ValidationFailure     -> 422 / VALIDATION_*  (code set by the caller)

    //   - InternalFailure       -> 500 / SYSTEM_INTERNAL_ERROR (BR-17 legacy-orphan alarm)'
  cost: The status and code of the compliance-audit refusals are written again in prose. The classes below
    already carry them (`statusCode = 404`, `code = "RESOURCE_NOT_FOUND" as const`, `statusCode = 422`,
    `statusCode = 500`, `code = "SYSTEM_INTERNAL_ERROR" as const`). The contract that holds them is contracts/knowledge-base/compliance-audit,
    which is outside this file's node pack. When that contract moves, this list keeps saying the old mapping,
    and the trace does not reach prose.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/curation/dto/dispute.dto.ts
  where: the comment before the period-ordering check, line 113
  evidence: '"// Semi-open invariant: valid_from < valid_to when both supplied."'
  cost: The comment restates the start-before-end rule beside the `p.valid_from >= p.valid_to` check that
    enforces it. Prose and code can drift apart, and only the code is bound.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/curation/dto/dispute.dto.ts
  where: the comment before the uniqueness check in the superRefine, line 41
  evidence: '"// Item_ids unique"'
  cost: The comment restates the distinct-items rule next to the code that enforces it with `uniqueIds.size
    !== value.item_ids.length`. It is a second home for the rule outside behavior.
  node: rules/knowledge-base/dispute-resolution-distinct-items
- file: src/modules/curation/dto/dispute.dto.ts
  where: the docstring above ResolveDisputeBodySchema, lines 20-30 (the prefer_one winner line)
  evidence: '" *   - `decision = prefer_one`  -> winner_id required, member of item_ids, reason required"'
  cost: The docstring states a second copy of the winner rule. The superRefine below it already holds
    the rule as code, so the next reader has two places to check against the specification. When the node
    moves, this prose is not reached.
  node: rules/knowledge-base/prefer-one-requires-winner
- file: src/modules/curation/dto/dispute.dto.ts
  where: the same docstring, lines 20-30 (the adjust_periods line)
  evidence: '" *   - `decision = adjust_periods` -> periods[] required with one entry per item_id;"'
  cost: The docstring restates the one-period-per-item rule that the `periods.length !== value.item_ids.length`
    branch already enforces. It is prose that no one will update when the node moves.
  node: rules/knowledge-base/adjust-periods-one-per-item
- file: src/modules/curation/dto/dispute.dto.ts
  where: the same docstring, lines 20-30 (the prefer_one reason clause)
  evidence: '" *   - `decision = prefer_one`  -> winner_id required, member of item_ids, reason required"'
  cost: The docstring restates the reason requirement for prefer_one, which the superRefine already enforces
    with `BUSINESS_REASON_REQUIRED`. The prose is a second, unread copy of the rule.
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/dto/entity-match.dto.ts
  where: the doc comments above ResolveEntityMatchBodySchema (lines 17-19) and above MergeNodesBodySchema
    (line 62)
  evidence: '" * ResolveEntityMatchRequest — BR-11 (reason mandatory on merge_into), * BR-23 (self-merge
    forbidden at request shape)." and "/** MergeNodesRequest — BR-11 (reason required), BR-23 (self-merge
    forbidden). */"'
  cost: The self-merge rule is stated in prose here and in code in two places. MergeNodesBodySchema.superRefine
    in this file raises "BUSINESS_SELF_MERGE_FORBIDDEN" when survivor_id equals absorbed_id. src/modules/curation/service/entity-match.service.ts
    also raises BUSINESS_SELF_MERGE_FORBIDDEN, and that is the only place the resolve path can check it,
    because its node_id travels in the path and not in the body. The resolve comment says "at request
    shape", which this file does not do for the resolve body. A reader trusting the comment would look
    for the check in the wrong place.
  node: rules/knowledge-base/node-never-merged-into-itself
- file: src/modules/curation/dto/entity-match.dto.ts
  where: the same doc comments (lines 17-18 and line 62), the BR-11 clauses
  evidence: '"BR-11 (reason mandatory on merge_into)" and "BR-11 (reason required)"'
  cost: 'The reason requirement is restated in prose beside the code that holds it. In this file, the
    superRefine branch for merge_into adds the issue "BUSINESS_REASON_REQUIRED", and MergeNodesBodySchema
    uses `reason: ReasonRequiredSchema`. The comment cites the project''s internal BR-11 label, not the
    node, so the next reader is pointed away from the specification.'
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/dto/enums.dto.ts
  where: the comment above ReasonRequiredSchema, line 49
  evidence: /** Reason — trim + min(1) ensures whitespace-only strings are rejected. */
  cost: The comment states the rule that a curation reason holds at least one character after trimming.
    The same file holds that rule in code, `z.string().trim().min(1)`. A reader sees the rule twice, and
    the comment will not follow the node if the node changes.
  node: rules/knowledge-base/curation-reason-not-blank
- file: src/modules/curation/dto/item.dto.ts
  where: line 112, the comment above the valid_from >= valid_to check
  evidence: // Semi-open invariant on the new pair when both supplied.
  cost: The comment names, in prose, the rule that a correction giving both dates must put the start strictly
    before the end. The `c.valid_from >= c.valid_to` branch holds it too. The node rules/knowledge-base/validity-start-before-end
    is where it was decided.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/curation/dto/item.dto.ts
  where: line 21, the comment above RejectItemBodySchema
  evidence: /** reject_item — reason mandatory (destructive, BR-11). */
  cost: 'The comment states, as prose, the fact that a rejection must state a reason. A reader can take
    the comment for the place the rule lives, when it lives in rules/knowledge-base/curation-reason-required
    and in the code line `reason: ReasonRequiredSchema`. The "BR-11" citation points to a back-spec numbering,
    not to a node, so it can drift from the node unnoticed.'
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/dto/item.dto.ts
  where: line 53, the comment above the someProvided check in CorrectItemBodySchema.superRefine
  evidence: '// BR-18: at least one of value/target_node_id/valid_from/valid_to.'
  cost: The comment states in prose the rule that a correction must change at least one field, while the
    `someProvided` branch holds it too. The node rules/knowledge-base/correction-changes-something is
    where the business decided it, and the BR-18 label is a second, unbound naming of the same rule.
  node: rules/knowledge-base/correction-changes-something
- file: src/modules/curation/dto/item.dto.ts
  where: line 67, the comment above the two item_kind cross-field checks
  evidence: '// Cross-field: value only on attribute, target_node_id only on link.'
  cost: The comment restates the rule that a correction must not change a link's value or an attribute's
    target node. The two `ctx.addIssue` branches that follow already enforce it. The node rules/knowledge-base/correction-fits-assertion-kind
    is the home of the rule, so the comment is a second copy that can be read as authority.
  node: rules/knowledge-base/correction-fits-assertion-kind
- file: src/modules/curation/dto/item.dto.ts
  where: line 87, the comment above the valid_from / valid_from_source checks
  evidence: // valid_from change requires valid_from_source.
  cost: The comment restates the rule that a correction stating a validity start must state its basis.
    The `c.valid_from_source === undefined || ... === null` branch holds the same rule in code. A reader
    who trusts the comment may look here, not in rules/knowledge-base/stated-start-requires-basis, when
    the rule changes.
  node: rules/knowledge-base/stated-start-requires-basis
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment above the /metrics success reply, lines 145-149
  evidence: '"Bare success body — consistent with every other curation REST endpoint (queue/confirm/reject/...).
    The SPA''s httpCuration returns the raw 2xx JSON, so an `{ ok, result }` wrapper here would surface
    as all-undefined fields client-side"'
  cost: The comment restates the contract's "HTTP 200 carrying, with no envelope" for the metrics and
    the other curation answers. The code holds it (`return reply.status(200).send(result)`), so the pair
    conforms. The comment is prose outside the running system.
  node: contracts/knowledge-base/curation
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment block above the /metrics route (lines 126-135) and the comment inside its catch (lines
    152-153, 166-168)
  evidence: '"ANY residual 500 outcome is re-mapped to 503 SYSTEM_SERVICE_UNAVAILABLE so the front spec
    MetricsStrip (R1) can fall back to per-kind totals from /queue. 401 auth failures and 2xx responses
    are NEVER degraded."'
  cost: 'The comment restates the read-curation-metrics refusal (503 SYSTEM_SERVICE_UNAVAILABLE where
    the metrics cannot be read), and adds a rationale and a 401/2xx exclusion that no node states. The
    code holds the 500-to-503 re-map (`statusCode === 500 ? 503 : statusCode`), so the pair conforms.
    The prose is a second home that a reader may take for the decision.'
  node: contracts/knowledge-base/curation
- file: src/modules/curation/routes/curation.routes.ts
  where: the doc comment above sendError, lines 72-79
  evidence: '"Unknown-error 500s are NOT re-thrown to the global handler here: the shared mapper already
    produces the canonical SYSTEM_INTERNAL_ERROR / SYSTEM_SERVICE_UNAVAILABLE envelopes byte-identical
    to what the global handler would emit"'
  cost: 'The comment is a second home for the access contract''s answers to a failed request: 500 SYSTEM_INTERNAL_ERROR
    for any other cause, 503 SYSTEM_SERVICE_UNAVAILABLE for an unreachable store. A reader who wants to
    know what the owner is told goes to this comment, not to curation/mcp/error-envelope.ts where mapErrorToHttpResponse
    produces it, and the comment does not move when the node does.'
  node: contracts/knowledge-base/access
- file: src/modules/curation/service/dispute.service.ts
  where: line 208, the comment above the scopeAllowsMultipleCurrent call
  evidence: '// BR-16: functional-scope predicate — at most one row may end with // valid_to = NULL when
    the scope''s `allows_multiple_current = false`.'
  cost: The comment restates rules/knowledge-base/adjusted-periods-single-open under a back-spec number.
    The code below holds the same rule (`if (!allowsMultipleCurrent) { ... if (openCount > 1) { throw
    new BusinessError("BUSINESS_TEMPORAL_INCOHERENT", ...`). The comment is a second home for the rule,
    and its number does not resolve in the specification.
  node: rules/knowledge-base/adjusted-periods-single-open
- file: src/modules/curation/service/dispute.service.ts
  where: line 67, the comment above the loop that checks every locked row's status
  evidence: '// BR-22: every row must be `disputed`.'
  cost: The comment cites "BR-22", an identifier from a back-spec that is not in the specification tree.
    It restates what rules/knowledge-base/dispute-resolution-requires-disputed-items holds, which the
    loop below it already enforces (`if (row.status !== "disputed") { throw new ConflictError("BUSINESS_ITEM_NOT_DISPUTED",
    ...`). The next reader is sent to a rule number that does not resolve, and the comment is a second
    home for the rule.
  node: rules/knowledge-base/dispute-resolution-requires-disputed-items
- file: src/modules/curation/service/dispute.service.ts
  where: line 78 (the inline comment before assertSameScope) and line 285 (the docstring above assertSameScope)
  evidence: '// BR-14: all items must share the same conflict scope. /** BR-14: all items must share the
    same conflict scope. */'
  cost: 'Both comments restate rules/knowledge-base/dispute-resolution-single-scope under a back-spec
    number. The function body holds the rule (`"Items do not share the same conflict scope"`, `{ scope_mismatch:
    true }`). A reader who looks up "BR-14" finds nothing in the specification.'
  node: rules/knowledge-base/dispute-resolution-single-scope
- file: src/modules/curation/service/entity-match.service.ts
  where: line 45, the comment above the self-merge guard in resolveEntityMatchService
  evidence: // BR-23 defence in depth on resolveEntityMatch (target == self).
  cost: The comment says again that a node is never merged into itself, using a back-spec rule number
    (BR-23) that is not a specification identity. The code below it holds the rule (`body.target_node_id
    === nodeId` throwing BUSINESS_SELF_MERGE_FORBIDDEN). A reader who follows the comment goes to a document
    the specification does not bind, and the prose stays behind when the node moves.
  node: rules/knowledge-base/node-never-merged-into-itself
- file: src/modules/curation/service/entity-match.service.ts
  where: line 60, the comment inside the keep_separate branch, above loadNodesForUpdate
  evidence: '// BR-26: lock node and assert needs_review.'
  cost: The comment restates the rule that an entity-match resolution must resolve a node in needs-review,
    and cites a back-spec number (BR-26) in place of the node. The code holds the rule (`if (node.status
    !== "needs_review") { throw new ConflictError("BUSINESS_REVIEW_NOT_PENDING", ...`). The comment is
    a second home for the fact outside behavior.
  node: rules/knowledge-base/entity-match-resolution-requires-pending-review
- file: src/modules/curation/service/entity-match.service.ts
  where: line 90, the comment above the keep_separate deleteEntityMatchReviewByNode call
  evidence: '// BR-10: drop review-context rows.'
  cost: The comment restates the rule that an accepted resolution removes every entity match review of
    its node, citing a back-spec number (BR-10). The code holds it (`await deleteEntityMatchReviewByNode(client,
    nodeId);`, called in both branches). The prose duplicates the node's fact and points to a rule id
    the specification does not use.
  node: rules/knowledge-base/entity-match-resolution-clears-reviews
- file: src/modules/curation/service/item.service.ts
  where: the comment above the errata fragment append in correctItemService, lines 341-342
  evidence: // 4. Append the errata fragment if supplied (BR-19).
  cost: The comment cites a back-spec id (BR-19) for the rule that a correction's new item carries the
    cited fragment's provenance. A node holds that rule and the code at lines 342-352 enforces it, so
    the citation is a second reference to it outside behavior.
  node: rules/knowledge-base/corrected-item-provenance
- file: src/modules/curation/service/item.service.ts
  where: the comment above the valid_from_fragment_id check in correctItemService, lines 212-213
  evidence: '// BR-17: when `valid_from_fragment_id` is supplied, the fragment must // exist AND its status
    must be `accepted`.'
  cost: The comment states, under a back-spec id (BR-17), a fact that a node already holds and that the
    branch at lines 214-229 already enforces. A reader can take the comment for the place where the rule
    lives, and it will not move when the node does.
  node: rules/knowledge-base/correction-fragment-accepted
- file: src/modules/curation/service/item.service.ts
  where: the comment block above the attribute value validation in correctItemService, lines 231-241,
    with the continuations at 249-251, 259-263, 271, 288-289 and 296-297
  evidence: '// BR-23 (TC-04): when correcting an attribute AND `corrected.value` is // supplied, run
    two legs against the predecessor''s `attribute_key` // BEFORE any DB write: ... curation re-raises
    as `BUSINESS_INVALID_ATTRIBUTE_VALUE` (HTTP 422)'
  cost: The comment restates, in prose, the type leg, the closed-domain leg and the BUSINESS_INVALID_ATTRIBUTE_VALUE
    / HTTP 422 mapping. The curation contract holds those, and the code at lines 242-312 enforces them.
    It is a second home for the rule, outside behavior, and it will drift from the contract.
  node: contracts/knowledge-base/curation
- file: src/modules/curation/service/merge.service.ts
  where: the header comment, lines 1-11 ("Steps inside the open transaction (BR-13 layered validation)"),
    and the inline comments at lines 63, 81 and 95
  evidence: '"//   1. SELECT ... FOR UPDATE on both rows (BR-26). //   2. Inspect status: 404 if missing,
    410 if deleted, 409/422 mismatch. //   3. Enforce node_type match (BR-06)." and "// BR-12: 410 for
    tombstones; explicit before 409/422 status checks."'
  cost: 'The check order is written a second time in prose, under back-spec rule numbers (BR-06, BR-12,
    BR-13, BR-26) that are not specification node identities. The code in performMerge already holds that
    order: self-merge, absent survivor, absent absorbed, deleted survivor, deleted absorbed, survivor
    not active, absorbed status, node type. If the node moves, a reader of this file sees the old order
    described as current, and the prose is not bound to the node.'
  node: rules/knowledge-base/merge-check-order
- file: src/modules/ingestion/chunker/config.ts
  where: the doc comment above CHUNK_HARD_MAX, line 21
  evidence: /** Hard ceiling on a single chunk. A block above this size is sentence-split. */
  cost: Prose restating the long-block rule next to the number, so the cut-over exists as prose in a second
    place. The running behavior is in v1.ts (line 80, `if (blockSize <= CHUNK_HARD_MAX)`). The comment
    adds a second home that can drift from the node.
  node: rules/knowledge-base/long-block-sentence-chunks
- file: src/modules/ingestion/chunker/config.ts
  where: the header comment, lines 6-7
  evidence: '// Units: Unicode code points (BR-05) — we measure block size by code-point // count, not
    by UTF-16 units or bytes.'
  cost: Prose restating the code-point counting rule that a node holds, while the counting is done in
    v1.ts. This second home outside behavior can drift from the node.
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 11-12 and line 80, the header comment and the "Whole block fits" comment
  evidence: '"try to keep it as one chunk if its size is at most `CHUNK_HARD_MAX` code points." and "//
    Whole block fits — emit as a single chunk."'
  cost: The short-block rule is restated in prose beside the branch `if (blockSize <= CHUNK_HARD_MAX)`.
    The comment adds a second home for the 4000-code-point fact outside behavior.
  node: rules/knowledge-base/short-block-one-chunk
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 121-126, the comment above the `chunks.length === 0 && totalCodePoints > 0` fallback
  evidence: '"Edge case: input was non-empty but consisted entirely of hard-boundary separators (e.g.
    a file made of nothing but form-feed characters). We still emit one chunk covering the raw content"'
  cost: The contentless-blocks rule is restated in prose beside the branch that holds it. The comment
    is a second home.
  node: rules/knowledge-base/contentless-blocks-single-chunk
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 13-18 (header comment), 87 and 99-103 (inline comments) and 353-367 (splitBySentences doc
    comment)
  evidence: '"fall back to sentence-level split via `Intl.Segmenter(''pt'', {granularity: ''sentence''})`
    (BR-07)." and "close the buffer when adding the next sentence would push it above `CHUNK_TARGET[1]`"
    and "a single 5000-char sentence will become one chunk; this is BR-07''s documented limit"'
  cost: The sentence-cut rule and the long-sentence limit are written again in prose. The prose ("5000-char")
    already names a size that matches no node; the next reader may take it for the rule.
  node: rules/knowledge-base/long-block-sentence-chunks
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 139-142 and 144-147, the splitByHardBoundaries doc comment (pdf)
  evidence: '"- `pdf`:          form-feed (`\f`, U+000C). PDF extractors typically insert `\f` between
    pages."'
  cost: The pdf block rule is restated in prose. The code holds it (`splitOnCharBoundary(codePoints, "\f")`),
    so the comment is a second home.
  node: rules/knowledge-base/pdf-blocks-at-form-feeds
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 148-149 and 213-216, the email doc comments (header block)
  evidence: '"- `email`:        first blank line (header/body separator)" and "Split an email: first blank
    line closes the headers"'
  cost: The email header rule is restated in prose. splitEmail holds it, so the comment is a second home.
  node: rules/knowledge-base/email-header-block
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 148-149 and 213-216, the email doc comments (quotation blocks)
  evidence: '"plus every transition into / out of a `>` quotation block." and "every transition into or
    out of a quotation block (`^>+ `) closes a chunk."'
  cost: The quotation rule is restated in prose, and the pattern shown (`^>+ `) differs from the code.
    The code treats a line as quoted when its first character after spaces or tabs is `>`, with no trailing
    space needed (isQuotedLine). The comment is a second home and it disagrees with the code.
  node: rules/knowledge-base/email-quote-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 150-154 and 261-266, the chat/transcript doc comments (turn blocks)
  evidence: '"A line that starts with `[ \t]*[A-Za-z0-9_]+[ \t]*:[ \t]` (e.g. `João:`, `[12:00] Maria:`)
    opens a new block. We never fuse two consecutive speakers into one chunk." and "Split chat / transcript:
    a new "speaker line" opens a new block."'
  cost: The turn-block rule is restated in prose. splitTurns holds it, so the comment is a second home.
  node: rules/knowledge-base/turn-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 150-154, 261-266 and 341-350, the speaker-line comments
  evidence: "\"Accepts:\n   - `Name:` followed by white space (Name = ASCII identifier characters\n  \
    \    plus single embedded spaces — we keep it strict to avoid false\n      positives on prose like\
    \ \"Importante: ...\").\""
  cost: The speaker-line definition is written in prose in three places. The code holds it in SPEAKER_LINE_REGEX,
    which accepts `À-ÿ` and an optional `(`/`)` time stamp. The comments say "ASCII identifier characters"
    and `[ \t]*[A-Za-z0-9_]+[ \t]*:[ \t]`. The comments disagree with the code, so a reader who trusts
    them gets the wrong rule.
  node: rules/knowledge-base/speaker-line
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 20-24, the header comment on offsets
  evidence: '"All offsets are 0-based, semi-open, counted in Unicode code points of the ORIGINAL content
    (BR-05)."'
  cost: The offset unit is restated in prose. The code in this file holds it (`Array.from(content)` and
    buildChunk's offset_start/offset_end), so the comment is a second home.
  node: rules/knowledge-base/chunk-offsets-count-code-points
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 42-46, the RawChunkInput doc comment
  evidence: '"`chunk_index` is the 0-based position within the document."'
  cost: The indexing rule is restated in prose. The code holds it (`chunks.length` passed to buildChunk),
    so the comment is a second home.
  node: rules/knowledge-base/chunk-index-follows-content
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 7-19, the header comment (Algorithm steps 1 and 2)
  evidence: '"1. Split the content into "blocks" along the hard boundaries that apply to `sourceType`
    (BR-06)." and "2. For each block, try to keep it as one chunk if its size is at most `CHUNK_HARD_MAX`
    code points."'
  cost: The block-then-chunk rule is written in prose in the file as well as held by the code (splitByHardBoundaries
    and the loop in chunkV1). A reader of the comment sees a second statement of the rule, and it will
    keep saying the old rule if the node moves.
  node: rules/knowledge-base/chunks-never-cross-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: lines 99-103, the inline comment above `if (tentativeSize > CHUNK_TARGET[1])`
  evidence: '"If the buffer itself is already empty and the first sentence is larger than CHUNK_HARD_MAX,
    emit it standalone — we have no finer atom to split on"'
  cost: The comment restates the long-sentence rule with a different threshold (CHUNK_HARD_MAX, 4000).
    The node says a sentence of more than 2000 code points is a chunk on its own, which is what the code
    does. The comment misleads the reader about where the line is.
  node: rules/knowledge-base/long-sentence-own-chunk
- file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  where: the JSDoc above the `original_input` field (lines 35-39)
  evidence: "Never\n   * factored into `content_hash`. Capped at 10 MiB to match `content`."
  cost: The cap on original_input is restated in prose while the same schema enforces it with `.max(10
    * 1024 * 1024, "original_input must not exceed 10 MiB")`. A change to the node would leave this sentence
    and the error message stale together.
  node: rules/knowledge-base/original-input-length
- file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  where: the JSDoc of IngestRawInformationRequestSchema, the `content` bullet (lines 16-18)
  evidence: "- `content`: minLength 1 (empty document is meaningless), maxLength 10 MiB\n   in code points\
    \ — the Fastify `bodyLimit` of 11 MiB on the route is a\n   coarser pre-filter; this Zod check is\
    \ the precise contract from A5."
  cost: The bounds of content are restated in prose as "10 MiB in code points". The node counts UTF-16
    code units, and the `z.string().min(1)...max(10 * 1024 * 1024)` on `content` also counts UTF-16 code
    units. A reader who trusts the comment will believe the limit is in code points, and a reader who
    looks in the specification finds a different unit. The 11 MiB `bodyLimit` it cites is a fact the specification
    does not hold and this file does not hold in code either.
  node: rules/knowledge-base/content-length
- file: src/modules/ingestion/dto/llm-run.dto.ts
  where: the doc comment on LlmRunResponseSchema, lines 80-90
  evidence: '`affected_nodes` (BR-33, v1.3.0) is OPTIONAL — attached ONLY when `status === ''completed''`.'
  cost: The rule that affected nodes are listed only for a completed run is restated as prose in a file
    that only declares the key as `.optional()`. The code that enforces it is in src/modules/ingestion/service/llm-run.service.ts
    (`if (row.status === "completed") {`). A reader of the DTO takes the comment for where the rule lives,
    and a change to the node leaves it behind.
  node: rules/knowledge-base/affected-nodes-only-when-completed
- file: src/modules/ingestion/dto/llm-run.dto.ts
  where: the doc comment on orphaned_fragments inside LlmRunSummarySchema, lines 51-59
  evidence: Fragments proposed by this run that carry NO provenance row — i.e. the LLM extracted them
    but never cited them in any consolidated link/attribute. Such fragments stay `status='proposed'` and
    are excluded from the partial FTS index (`WHERE status='accepted'`)
  cost: The definition of an orphaned fragment is written a second time in prose beside a field that only
    declares a count. The code that computes it is in src/modules/ingestion/repository/llm-run.repository.ts
    (`summary.orphaned_fragments = orphan.rows[0]?.n ?? 0;`). If the node's definition moves, this comment
    keeps saying the old one and nothing flags it.
  node: rules/knowledge-base/orphaned-fragment
- file: src/modules/ingestion/dto/propose-link.dto.ts
  where: the doc comment above ValidFromBasisSchema, lines 5-15 (the sentences on the `received` basis)
  evidence: '"Only `stated` and `document` are accepted at the API boundary. The third value, `received`,
    is a backend-only fallback ... it is never sent by an LLM or any external caller, so it MUST NOT appear
    in this input enum."'
  cost: The rule that a caller never states `received` is written a second time in prose. The enum on
    line 16 already carries it, and the node does not bind a comment. If the node moves, the comment keeps
    saying the old rule and nothing flags it.
  node: rules/knowledge-base/caller-never-states-received
- file: src/modules/ingestion/dto/propose-link.dto.ts
  where: the doc comment above ValidFromBasisSchema, lines 5-15 (the sentences on the temporal validator's
    fallback)
  evidence: '"The third value, `received`, is a backend-only fallback that the temporal validator applies
    internally when neither `stated` nor `document` can justify the date"'
  cost: The fallback rule (take the reception date with basis `received`) is described a second time in
    a file that does not implement it. The comment sits in a DTO but speaks for the validator, and it
    can drift from the validator without anyone noticing.
  node: rules/knowledge-base/required-start-fallback
- file: src/modules/ingestion/hash.ts
  where: the docstring above composeIdempotencyKey, lines 20-27
  evidence: '`idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`, concatenated
    WITHOUT a separator. The order is exactly as defined in §8 of v7 and as documented in `ingestion.back.md`
    BR-08.'
  cost: The docstring restates the idempotency-key composition (operands, order, no separator) and points
    to a v7 section and a back-spec rule instead of the specification node. The code in the same function
    also holds it, so the prose is a second home. If the node changes, this prose keeps asserting the
    old order.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/hash.ts
  where: the docstring above sha256Hex, lines 10-15
  evidence: /** `sha256(content)` -- 64 char lowercase hex string. Used as `raw_information.content_hash`
    (BR-01); the DB CHECK constraint on the column enforces the same regex. */
  cost: The docstring states a second copy of the content-hash rule next to the code that implements it.
    The copy cites a back-spec rule number, "BR-01", where the specification holds the rule as a node.
    When the node moves, nothing reaches this prose, so a reader can't tell which copy was decided.
  node: rules/knowledge-base/content-hash-is-sha256
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the docstring of deriveValidationOutcome, lines 55-65
  evidence: 'Rule: when `result.outcome === ''rejected''` (the BELOW_CONFIDENCE_FLOOR branch returns this),
    the audit row is `''rejected''` per BR-17. Every other `ok:true` envelope is `''accepted''`.'
  cost: The mapping from a proposal's outcome to the tool call's validation outcome is stated in prose
    beside the switch that implements it. It also says "every other ok:true envelope is accepted", which
    the switch immediately below contradicts. A reader of the docstring would be misled about the rule.
  node: rules/knowledge-base/tool-call-validation-outcome
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the docstring of runIngestHandler, lines 125-131
  evidence: 'BR-23: even when the business transaction rolls back, the audit row is written via a SEPARATE
    short transaction (`insertToolCallStandalone`).'
  cost: The audit-on-rollback rule is cited by a back-spec code (BR-23) in prose, although the code in
    this file holds it. The citation invites the next reader to treat the comment as the authority.
  node: rules/knowledge-base/every-proposal-audited
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the header comment, lines 1-14 (steps 3 to 5 of the handler shape)
  evidence: '// 4. On `ValidationFailure`: ROLLBACK the business TX, then open a SEPARATE //    short
    TX to write the audit `tool_call` row (BR-23). // 5. On uncaught error: ROLLBACK, write `tool_call`
    with `error`, surface //    `SYSTEM_INTERNAL_ERROR` envelope.'
  cost: The audit rule is stated in prose here while runIngestHandler and safeWriteAuditOnRollback already
    hold it. A reader who finds the comment first takes it for the place the rule lives. If the node moves,
    the comment keeps saying the old thing and no check reaches it.
  node: rules/knowledge-base/every-proposal-audited
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: Lines 18-22, the header comment on idempotency, and lines 159-163, the comment inside the noop_existing
    branch.
  evidence: '"Idempotency (BR-08): if the same content was already ingested, `ingestRawInformation` returns
    `noop_existing`; we DO NOT re-run extraction (the existing run is completed, or running, and re-running
    would either no-op or 409). The tool reports `already_ingested` with the existing ids — never an error."
    and "a non-`completed` run means the prior extraction did not finish and recovery requires re-running
    that LLMRun (no retry tool is exposed over MCP yet — see BR-30)."'
  cost: 'Two comments restate the already_ingested outcome and the unfinished-run recovery. Code holds
    both: the `outcome === "noop_existing"` branch returns `outcome: "already_ingested"` with the existing
    ids and the status-dependent message, and the contract holds the same fact. A reader can take the
    comment as a second home for the rule. It also cites a back-spec rule number (BR-30) that no node
    carries.'
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: Lines 41-48, the doc comment on DEFAULT_INGEST_MODEL, and lines 68-70, the doc comment on `ingestModel`.
  evidence: '"Hard-coded fallback extraction model used only when the caller omits `model` AND no `ingestModel`
    is wired ... Override per call (the `model` arg) or via the INGEST_MODEL env (no recompile)."'
  cost: 'The comment restates the fallback order for the extraction model. Code holds that order in this
    file as `model: input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL`, and the node holds it too.
    A second statement of a default value in prose will drift silently when the model changes.'
  node: rules/knowledge-base/default-extraction-model
- file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: The file-header comment (lines 18-23, "A Zod failure ... also goes through `runIngestHandler`
    so the rejected `tool_call` audit row is written") and the comment block above `extractLlmRunIdFromRaw`
    (lines 431-441).
  evidence: '"A Zod failure (missing/invalid `llm_run_id` or malformed business DTO) also goes through
    `runIngestHandler` so the rejected `tool_call` audit row is written (BR-23 updated). When no `llm_run_id`
    is parseable from the raw input, the audit-row insert cannot resolve its FK; the shell''s `safeWriteAuditOnRollback`
    logs and swallows that" and "a `tool_call` row with `validation_outcome=''rejected''` is written under
    the same shell"'
  cost: 'The prose restates, as a business rule, that a refused proposal is recorded as a tool call and
    that a failed recording is swallowed. The rule is held by rules/knowledge-base/every-proposal-audited.
    A second statement of it in a header comment gives a reader two places to look for the rule. If the
    node moves, `--check` does not reach this file''s prose. The behavior itself is carried by code: `runZodFailureAudit`
    calls `runIngestHandler({ deps: { pool, logger, llm_run_id: llmRunId }, tool_name: toolName, input:
    rawInput as never, run: async () => { throw new ValidationFailure(...) } })`. The swallow-on-failure
    clause sits in handler-base.js, which is outside this file set.'
  node: rules/knowledge-base/every-proposal-audited
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: comment on `confidence` in the ingest_directed section, lines 276-280
  evidence: '//   - `confidence` is DELIBERATELY ABSENT from every item — the server forces //     `confidence
    = 1.0` on every dispatched `propose_*` (BR-34 step 4 + the //     contract: a directed payload is
    a stated fact by construction; callers //     cannot lower confidence here).'
  cost: 'This is a second home, in prose, for the rule that a directed ingestion proposes everything at
    confidence 1.0. Code holds the rule in service/directed-ingestion.service.ts (`confidence: 1.0`, lines
    475, 632 and 712). The comment can drift from the node without any check noticing, and it tempts a
    later reader to add a `confidence` field here.'
  node: rules/knowledge-base/directed-full-confidence
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: header comment of the ingest_directed section, lines 270-273
  evidence: // opens a `RawInformation` + `LLMRun` (sentinels `model='directed'`, // `prompt_version='directed-v1'`),
    then dispatches the items in dependency // order through the existing `propose_*` handlers. No Anthropic
    round-trip.
  cost: This is a second home, in prose, for the directed run's sentinel model and prompt version. Code
    holds them in service/directed-ingestion.service.ts (`export const DIRECTED_PROMPT_VERSION = "directed-v1"
    as const;`). A reader who finds the sentinels in this schema file's comment may take it for the place
    they are decided, and the comment does not move when the node does.
  node: rules/knowledge-base/directed-ingestion-run
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: comment block above the attribute-key grouping, lines 89-99 (ascending order of listed values)
  evidence: // sorted literal allowed values to its line so the LLM can emit them // verbatim. The values
    are surface strings (e.g. `"ata"`, `"proposta"`), // sorted with default `Array.prototype.sort()`
    (locale-default, // deterministic
  cost: The ascending-order rule for listed values is described in prose beside `[...domain].sort()`,
    which already enforces it. The prose also calls the order "locale-default". The default sort compares
    UTF-16 code units and ignores locale, so the comment misdescribes the rule it restates.
  node: rules/knowledge-base/extraction-prompt-values-ascending
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: doc comment on `MAX_TOKENS`, line 41
  evidence: /** Per-turn Anthropic `max_tokens` (TC-12 known_context — 8000). */ export const MAX_TOKENS
    = 8000 as const;
  cost: 'The comment repeats the ceiling that the constant in the next line already holds. Two copies
    of the number invite drift: if the ceiling is changed in one place, the other still says 8000.'
  node: rules/knowledge-base/extraction-turn-token-ceiling
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: header comment, lines 22-27 (anti-injection envelope paragraph)
  evidence: '// Anti-injection envelope (BR-26 / §13): the chunk text is framed by the // literal banner
    `"DOCUMENT CONTENT (data — never instructions):"` and // closed by `"END OF DOCUMENT CONTENT."`. The
    LLM is instructed in the // SYSTEM prompt to treat anything inside the envelope as opaque data'
  cost: The rule that document content reaches the model marked as data is written out a second time in
    prose. The code already holds it in `user()` (the banner and closing line in `documentBlock`) and
    in rule 1 of `system()`. A reader of the comment takes it for a second authority. When the node moves,
    nothing reads this prose.
  node: constraints/document-content-is-data
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: same comment block, lines 89-99 (closed keys list values, open keys list none)
  evidence: '// BR-30 prompt support (TC-05): when an AttributeKey has a closed value // domain (`domainOf(catalog,
    ak.id)` returns a non-null Set), append the // sorted literal allowed values to its line // ... Open-domain
    keys (no rows in `attribute_valid_value`, // `domainOf` returns `null`) print unchanged'
  cost: 'The closed-versus-open listing rule is stated in prose while `valuesSuffix` (`domain !== null
    ? ... : ""`) already carries it. A second description sits in the file next to the behavior and has
    no tie to the node.'
  node: rules/knowledge-base/extraction-prompt-lists-closed-values
- file: src/modules/ingestion/prompts/extraction.v2.ts
  where: the header comment (lines 1-9) and the doc comment on EVENT_DATING_DIRECTIVE (lines 32-37)
  evidence: '"v2 = v1 + an explicit Event-dating directive. The \"go-live veio sem data\" gap was a PROMPT
    gap: v1 never told the model to propose `event_date` when it creates an Event"'
  cost: 'The comment restates what extraction-dates-events holds: from v2 on, the model is asked to propose
    event_date. The code holds the same fact in EVENT_DATING_DIRECTIVE, in this file, so the pair conforms.
    The comment is a second home outside behavior, and it will drift from the node the first time the
    node moves.'
  node: rules/knowledge-base/extraction-dates-events
- file: src/modules/ingestion/prompts/extraction.v4.ts
  where: The header comment (lines 1-25) and the docstring above RECEIVED_AT_ANCHOR_DIRECTIVE (lines 42-49).
  evidence: '"v4 teaches the model to use it as the FALLBACK anchor: resolve against `document_date` when
    present, against `received_at` otherwise." and "Carries the `received_at` fallback rule: when `document_date`
    is absent, the relative-date anchor is `received_at`"'
  cost: The v4 anchor rule is written out in prose, with a citation of "BR-26 step 5a v1.4.2". The same
    rule is held by the running directive in this file, so a reader has two places to look. When the node
    moves, the prose does not, and `--check` does not reach it.
  node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
- file: src/modules/ingestion/prompts/index.ts
  where: doc comment above DEFAULT_PROMPT_VERSION, line 62
  evidence: '/** Recommended version for NEW runs — callers SHOULD send this at intake. */ export const
    DEFAULT_PROMPT_VERSION: string = v4.PROMPT_VERSION;'
  cost: The comment states in prose which version new runs take. The constant holds that version, and
    the comment describes a "SHOULD send" practice that no node holds. If the default moves, the comment
    is one more place that says the old value.
  node: rules/knowledge-base/default-prompt-version
- file: src/modules/ingestion/prompts/index.ts
  where: header comment, lines 10-15, and the doc comment above UnknownPromptVersionError, line 72
  evidence: '// An unknown version is a configuration error, NOT a silent fallback: BR-26 // step 2 mandates
    "load the extraction.${prompt_version} module; fail with 500 // SYSTEM_INTERNAL_ERROR if the module
    is missing". `selectPromptModule` throws // `UnknownPromptVersionError`'
  cost: The refusal of an unknown prompt version is stated twice here, in prose and in the throw at selectPromptModule.
    The prose also states the HTTP status and error code. A reader who changes the node will not know
    that these comments say it again, and they will keep saying the old rule.
  node: rules/knowledge-base/prompt-version-known
- file: src/modules/ingestion/repository/ingestion.repository.ts
  where: the doc comments of insertRawChunks (line 153) and findChunksByRawInformationId (lines 182-183)
  evidence: '* Find every `raw_chunk` of the given `raw_information_id`, ordered by * `chunk_index` ascending.
    Used by GET .../chunks.'
  cost: The comment states the chunk listing order a second time as prose. The running code already holds
    it in this file as `ORDER BY chunk_index ASC` and `result.rows.sort((a, b) => a.chunk_index - b.chunk_index)`.
    The pair conforms. What is owed is the removal of the prose, so that the only home of the order is
    the code and the node.
  node: rules/knowledge-base/chunk-listing-order
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of RecentIngestionRow, lines 38-44
  evidence: '`content_preview` is the first 80 code points of the raw text — enough for an operator to
    recognise a document after a client timeout without shipping the whole content back.'
  cost: The 80-character preview is stated in prose a second time, next to the `left(ri.content, 80)`
    that holds it. The prose says "code points" and the node says "characters", so a reader who trusts
    the comment and a reader who trusts the node can come away with different sizes.
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of aggregateToolCallOutcomes, lines 111-114
  evidence: "Returns a fully-formed `LlmRunSummary` — every field\n * present, missing buckets default\
    \ to 0 (BR-12). Two parts:\n *   - the 8 outcome buckets, grouped from `tool_call.validation_outcome`;"
  cost: The zero-for-absent-outcome rule is stated in prose beside the code that implements it (the zero-initialised
    `summary` object). A change to the node leaves this prose and its "BR-12" citation pointing at an
    older statement.
  node: rules/knowledge-base/summary-counts-tool-calls
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of aggregateToolCallOutcomes, lines 115-117, and the comment at lines 148-149
  evidence: "`orphaned_fragments`, the count of this run's `proposed` fragments with\n *     no provenance\
    \ row (uncited → unsearchable; recall-gap signal). Defined\n *     identically to the retry orphan-cleanup\
    \ in `retryLlmRunRow` (BR-10)."
  cost: The definition of an orphaned fragment and the summary's count of them are written out in prose
    again. The "unsearchable; recall-gap signal" rationale is prose that no node holds.
  node: rules/knowledge-base/summary-counts-orphaned-fragments
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of countFragmentsAnchoredToSource, lines 320-326
  evidence: "BR-18 anti-hallucination check. For every fragment in `fragment_ids`, the\n * fragment must\
    \ exist AND have at least one `fragment_source` row pointing to\n * a `raw_chunk` of `expected_raw_information_id`."
  cost: The anchoring rule is restated in prose and attributed to a back-spec "BR-18" rather than to its
    node. Whoever edits the node will not reach this paragraph.
  node: rules/knowledge-base/cited-fragments-anchored
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of findRecentIngestions, lines 59-63
  evidence: "`limit` is validated (1..50) at the toolset\n * boundary before it reaches here."
  cost: The 1..50 bound is restated in prose in a file that does not enforce it. The code that does is
    in mcp/mcp-schemas.ts, so the next reader may look for the limit check here and not find it.
  node: rules/knowledge-base/recent-ingestions-limit-bounds
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of findToolCallsByRun, line 237
  evidence: /** Page of `tool_call` rows ordered by `created_at` ascending. */
  cost: The listing order is stated in prose. The code orders by `created_at ASC, id ASC`, so the prose
    is also incomplete next to the node, which names the identifier tiebreak.
  node: rules/knowledge-base/tool-call-listing-order
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of retryLlmRunRow, lines 165-171, and the comment at lines 188-189
  evidence: "In the same transaction, orphan `proposed` fragments of this run are\n *    flipped to `rejected`."
  cost: The retry rule that rejects orphaned fragments is restated in prose above the UPDATE that performs
    it, so it exists in a second place that the node does not govern.
  node: rules/knowledge-base/retry-rejects-orphaned-fragments
- file: src/modules/ingestion/routes/ingestion.routes.ts
  where: the file header comment (lines 1-44), the propose-* mirrors comment block (lines 409-428) and
    the docblock of handleProposeMirror (lines 484-497)
  evidence: '"//   4. Return HTTP 200 for any reachable handler. The `ok: true/false` flag on the body
    is the outcome indicator — a layered-validation rejection (ValidationFailure) is a *business result*,
    not a transport error, and surfaces as `{ ok: false, error: { code, message, details } }` with HTTP
    200."; " *   - `ResourceNotFoundError` -> HTTP 404 with `RESOURCE_NOT_FOUND` envelope. *   - `RunNotRunningError`    ->
    HTTP 409 with `BUSINESS_RUN_NOT_RUNNING` envelope."'
  cost: 'The answers of propose-fragment, propose-node, propose-link and propose-attribute (404 for an
    unknown run, 409 for a run that is not running, HTTP 200 carrying { ok: false, error } for a layered-validation
    rejection) are told a second time in prose. The code in this same file already holds them, in handleProposeMirror.
    When the contract moves, the comments stay behind and tell the next reader an answer the specification
    no longer gives.'
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/service/affected-nodes.ts
  where: the doc comment of resolveAffectedNodes (lines 225-228)
  evidence: '"Rows whose `knowledge_node.status = ''merged_into''` are resolved transparently to the surviving
    node via `merged_into_node_id`."'
  cost: The merge-following rule is stated again in prose. The node that holds it is outside this file's
    pack, so a reader of that node does not see this comment, and a later change to the node leaves this
    one stale.
  node: rules/knowledge-base/affected-nodes-follow-merges
- file: src/modules/ingestion/service/affected-nodes.ts
  where: the doc comment of resolveAffectedNodes (lines 229-231)
  evidence: '"Ids the lookup does not find at all (e.g. a node compliance-deleted between the tool call
    and run-completion) are skipped silently"'
  cost: The omission of absent nodes is stated again in prose, and the comment adds a compliance-deletion
    cause that no node states. A reader can take that cause for part of the rule.
  node: rules/knowledge-base/affected-nodes-omit-absent
- file: src/modules/ingestion/service/affected-nodes.ts
  where: the header comment (lines 27-30) and the comment above isContributingOutcome (lines 72-86)
  evidence: '"`rejected` and `error` validation outcomes do NOT contribute (they did not touch the graph).
    De-dup is by `node_id`; first-write-wins on the entry. Iteration order on the final list is insertion
    order" and "Closed list per BR-33 / BR-27. propose_node: created_new | matched_existing | needs_review
    ... propose_link: accepted | consolidated | superseded_previous | disputed"'
  cost: The outcome set, the one-listing-per-node rule and the first-reached order are written a second
    time in prose. If the node's outcome list moves, these comments still cite BR-33 and BR-27 and keep
    saying the old list, and a reader can take them for the decided rule.
  node: rules/knowledge-base/affected-nodes-of-a-run
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Comment above anchorChunkId (lines 449-455)
  evidence: // All fragments are anchored to the first chunk of the synthesised content. ... const anchorChunkId
    = chunks[0]!.id;
  cost: The comment restates directed-fragments-anchor-first-chunk, which the next line of code holds.
    It is prose that can drift from the node.
  node: rules/knowledge-base/directed-fragments-anchor-first-chunk
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Header comment (lines 1-37), the sentinels and the no-language-model statement
  evidence: // the sentinels `model='directed'` / `prompt_version='directed-v1'`, ... // NEVER calls Anthropic
    — the directed path is `model = 'directed'`,
  cost: The prose says again what directed-ingestion-run holds and what DIRECTED_MODEL / DIRECTED_PROMPT_VERSION
    (lines 84 and 87) declare in this file. It is a second home outside behavior that will go stale with
    the node, and no check reaches it.
  node: rules/knowledge-base/directed-ingestion-run
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the comment above the review-row loop, lines 196-199
  evidence: '// One entity_match_review row PER ambiguous candidate (every candidate // with sim >= MATCH_FLOOR,
    NOT just the strong ones — BR-25 / TC // constraint: "entity_match_review inserts one row per candidate
    where // sim >= MATCH_FLOOR").'
  cost: The review-pairing rule is restated as prose, and it also quotes a constraint from a back spec
    outside the specification. The code holds the fact at the INSERT INTO entity_match_review loop. A
    reader who trusts the comment will not look at the node, which the code in fact departs from (the
    first finding).
  node: rules/knowledge-base/ambiguous-candidates-need-review
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the docstrings of MATCH_STRONG and MATCH_FLOOR (lines 26-41) and of decideFromCandidates (lines
    249-262)
  evidence: '* Encodes the A12 decision table verbatim: *   - Strong unique: exactly ONE candidate with
    `sim >= MATCH_STRONG` AND no *     other candidate has `sim >= MATCH_FLOOR`. The code holds the same
    decision at `export const MATCH_STRONG = 0.85;`, `export const MATCH_FLOOR = 0.55;` and `if (strong.length
    === 1 && aboveFloor.length === 1) {`.'
  cost: The strong-match rule and its two thresholds are stated again in prose beside the code that holds
    them, a second home for a fact the node holds. If the node's thresholds change, the docstrings keep
    the old table. The prose owes its removal.
  node: rules/knowledge-base/strong-candidate-resolves
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the header comment, lines 10-14 ("Why the lock comes first (BR-20) ...")
  evidence: '// Why the lock comes first (BR-20): two concurrent `propose_node` calls for // the same
    `(node_type, norm(name))` must NOT race on the resolve-or-create // branch. Acquiring the advisory
    lock before the first SELECT serialises both // the candidate scan AND the subsequent INSERT inside
    the same transaction;'
  cost: 'The comment says again, as prose, what the node holds, and the code holds it too at `SELECT pg_advisory_xact_lock(hashtextextended($1::text,
    0))` (lines 125-128). Two homes for the serialisation rule: if the node moves, a reader trusting this
    comment keeps the old rule. The prose owes its removal.'
  node: rules/knowledge-base/concurrent-proposals-resolve-in-turn
- file: src/modules/ingestion/service/extraction.service.ts
  where: The comment above ANTHROPIC_REQUEST_TIMEOUT_MS, lines 190-199
  evidence: so a 5-minute ceiling is generous headroom while halving the // worst-case stall before the
    turn is aborted-and-retried. `maxRetries` is // pinned explicitly (matches the SDK default)
  cost: The five-minute wait and the retry count are written both in prose and in `ANTHROPIC_REQUEST_TIMEOUT_MS
    = 5 * 60 * 1000` and `ANTHROPIC_MAX_RETRIES = 2`. The comment also invites "per-deployment tuning",
    which would make a bound the specification fixed look configurable.
  node: constraints/extraction-model-call-bounded
- file: src/modules/ingestion/service/extraction.service.ts
  where: The header comment "Error paths", line 21
  evidence: //   - run not 'running' at entry           -> RunNotRunnableError (409)
  cost: The header says again a rule that a node holds and that the code applies in `if (run.status !==
    "running") { throw new RunNotRunnableError(llmRunId, run.status); }`. When the node moves, this prose
    still says the old rule and nothing flags it.
  node: rules/knowledge-base/extraction-requires-running-run
- file: src/modules/ingestion/service/extraction.service.ts
  where: The header comment "Error paths", line 23, and the docstring of runLlmExtraction, line 404
  evidence: //   - >=3 consecutive 'error' outcomes      -> ExtractionFatalError (500)
  cost: The failure threshold is written in prose beside `export const FATAL_ERROR_BURST = 3 as const;`.
    A reader who changes one will not know the other must follow.
  node: rules/knowledge-base/extraction-fails-on-repeated-system-errors
- file: src/modules/ingestion/service/extraction.service.ts
  where: The same comment above ANTHROPIC_REQUEST_TIMEOUT_MS, lines 190-199
  evidence: A single extraction turn emits at most `MAX_TOKENS` (8000) output // tokens plus adaptive
    thinking
  cost: The 8000-token ceiling is written in a comment of a file that does not hold it. The value is set
    in prompts/extraction.v1.ts (`export const MAX_TOKENS = 8000 as const;`), so a change there leaves
    this prose wrong.
  node: rules/knowledge-base/extraction-turn-token-ceiling
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the comment on branch (a) in consolidateLinkOnce, lines 530-548
  evidence: '//     For MULTI-CURRENT types (`functional === false`): `valid_from`

    //     equality is NOT required.'
  cost: The node's condition (same target, change hint none, same validity start except for a link of
    a multi-current type) is restated in prose and cites v7 §18. The `reaffirmation` const holds the condition,
    so a reader may stop at the prose.
  node: rules/knowledge-base/reaffirmation-consolidates
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the comment on branch (b) in consolidateLinkOnce, lines 558-561
  evidence: '// (b) Correction — change_hint=''correction'' AND errata signal already

    //     verified by validateTemporal. Same period preserved on the old

    //     row (valid_to UNCHANGED) per §6.5-B; only mark superseded_at /'
  cost: The correction rule is restated in prose. The UPDATE that sets only `superseded_at` and `status`,
    and the insert with supersedes_link_id, hold the rule.
  node: rules/knowledge-base/correction-replaces
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the comment on branch (d) in consolidateLinkOnce, lines 616-618 and 631-632
  evidence: '// (d) Dispute — functional vigent row exists with overlapping

    //     period, different value, no succession / correction signal.'
  cost: The dispute rule is restated in prose. The `UPDATE ... SET status = 'disputed'` and the insert
    with status "disputed" and no supersedes link hold the rule, and the attribute branch repeats them.
  node: rules/knowledge-base/conflict-disputes
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the docstring on SUCCESSION_MARKERS, line 82
  evidence: /** A textual succession marker — case-insensitive substring on any fragment. */
  cost: The docstring restates that the match ignores letter case. The nine-marker list and the lowercasing
    sit in the code below it, so a reader may stop at the prose.
  node: rules/knowledge-base/succession-signal
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the docstring on closeVigentForSuccession, lines 266-278
  evidence: '* `valid_to = closeDate` (the new version''s `valid_from`, or `today` when the

    * new row has none) and LEAVE `superseded_at = NULL`.'
  cost: The closing date is described a second time in prose. The SQL CASE in closeVigentForSuccession
    holds it.
  node: rules/knowledge-base/succession-closing-date
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the docstring on consolidateLink, lines 420-435
  evidence: '* `ValidationFailure(''SYSTEM_INTERNAL_ERROR'')` per BR-25 / BR-27.'
  cost: The docstring describes the retry-once rule and its refusal in prose. The `attempt <= 2` loop
    and the ValidationFailure thrown on attempt 2 hold the rule, and consolidateAttribute repeats the
    same code.
  node: rules/knowledge-base/consolidation-race-refuses-second-collision
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the docstring on insertLinkProvenance and the docstring on promoteFragmentsToAccepted, lines
    207-214 and 243-251
  evidence: '* Creating a Provenance row is the §6.6 trigger that promotes each cited

    * fragment `proposed -> accepted`, so each inserter follows the write with

    * `promoteFragmentsToAccepted` in the same transaction.'
  cost: The promotion rule is stated a second time in prose, beside the UPDATE with `AND status = 'proposed'`
    that holds it. A reader may take the prose for the rule.
  node: rules/knowledge-base/provenance-accepts-proposed-fragment
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the header comment, lines 4-32 (the list of branches of the decision)
  evidence: '// Responsibility: given a fully-validated `propose_link` / `propose_attribute`

    // call (5-layer validation already passed), look up the vigent row(s) under

    // `SELECT ... FOR UPDATE` (A11) and decide between the five branches of

    // §6.5:'
  cost: The order of the five outcomes is described a second time in prose. A reader who finds it here
    may take it for the decision. The decision is the order of the branches in consolidateLinkOnce and
    consolidateAttributeOnce.
  node: rules/knowledge-base/consolidation-precedence
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the intra-day collapse paragraph of the docstring on closeVigentForSuccession, lines 279-288
  evidence: '* EXCEPTION — intra-day collapse: validity is day-granular (`date`, §5.1) and

    * `valid_from < valid_to` is strict (CHECK + temporal.ts). When the vigent row''s

    * own `valid_from` is on/after `closeDate` (a same-effective-date succession),'
  cost: The exception is stated a second time in prose. The `WHEN valid_from IS NOT NULL AND valid_from
    >= ${closeExpr}` branches of the SQL hold it.
  node: rules/knowledge-base/succession-before-previous-start
- file: src/modules/ingestion/service/ingestion.service.ts
  where: line 80, step 1 of the docstring of ingestRawInformation
  evidence: '* 1. Compute `content_hash = sha256(content)`.'
  cost: The docstring states the content-hash definition a second time, outside behavior. The first copy
    is rules/knowledge-base/content-hash-is-sha256, and the code that computes it is `sha256Hex(input.content)`
    in ../hash.js. If the digest definition moves, this prose keeps saying the old one.
  node: rules/knowledge-base/content-hash-is-sha256
- file: src/modules/ingestion/service/ingestion.service.ts
  where: line 81, step 2 of the docstring of ingestRawInformation
  evidence: '* 2. Compute `idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`.'
  cost: The docstring restates the composition and order of the idempotency key. The code calls `composeIdempotencyKey({
    content_hash, prompt_version, model, chunking_version })` from ../hash.js, so the code holds the fact.
    A reader of this prose could take it for the place the key is defined, when the node is rules/knowledge-base/idempotency-key.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/service/ingestion.service.ts
  where: lines 87-93, the "Idempotent no-op path" paragraph of the docstring of ingestRawInformation
  evidence: '* Return 200 with `outcome = "noop_existing"` and empty `chunks` array.'
  cost: 'The prose restates the intake contract''s noop_existing answer (HTTP 200, no chunks, the held
    run). The code in noopExisting holds it too (`status: 200`, `outcome: "noop_existing"`, `chunks: []`).
    When the contract moves, this prose is a second description that nothing reads.'
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/service/llm-run.service.ts
  where: getLlmRunById, comment at lines 97-102 ("BR-33 — attach `affected_nodes` ONLY when the run is
    `completed`...")
  evidence: "\"// BR-33 — attach `affected_nodes` ONLY when the run is `completed`. The\n  // field is\
    \ the snapshot of the run at completion; a `running` or `failed`\n  // run does not surface a partial\
    \ list.\""
  cost: The comment is prose that restates a rule a node holds. The same file holds the rule in code at
    `if (row.status === "completed") {`, so the pair conforms. The prose is a second home that can drift
    from the node and that `--check` does not follow. The comment at lines 254-256 is a similar second
    home; it restates the omission of the key and the preservation of an empty list.
  node: rules/knowledge-base/affected-nodes-only-when-completed
- file: src/modules/ingestion/service/propose-attribute.service.ts
  where: lines 131-134, the comment above the source metadata query
  evidence: // is the LAST link of the date-justification chain (v7 §6.5 / §13c / A14) // and is consumed
    by `validateTemporal` as the fallback for // `requires_valid_from = true` rows that carry no stated/document
    date.
  cost: 'The prose restates the received-date fallback, which the required-start-fallback node holds.
    The code holds it in validateTemporal in src/modules/ingestion/validation/temporal.ts (`valid_from_basis:
    "received"`). The comment is a second home for the fact, and it would go stale unnoticed if the node
    moved.'
  node: rules/knowledge-base/required-start-fallback
- file: src/modules/ingestion/service/propose-attribute.service.ts
  where: lines 85-92, the comment block above the closed-domain gate
  evidence: // key is closed and `assertValueInDomain` rejects out-of-domain literals // with `VALIDATION_INVALID_FORMAT`
    carrying `{ value, allowed_values }`. // Exact match (no normalisation) per spec §1 / BR-30 v1 semantics.
  cost: 'The prose restates the allowed-values rule (exact match, the refusal code, the details it carries),
    and a second copy of a rule can drift from the node. The code holds the rule: the `domainOf` branch
    here, and `assertValueInDomain` in src/modules/ingestion/validation/structural.ts, which sorts and
    returns `{ value, allowed_values }`.'
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/service/propose-fragment.service.ts
  where: the comment inside the mismatch branch of proposeFragmentService, lines 50-55 (the line citing
    RESOURCE_NOT_FOUND)
  evidence: '// "chunk_id resolves to no row -> RESOURCE_NOT_FOUND (UC-08 alt 2b)." The code beneath it
    holds the same fact: throw new ValidationFailure("RESOURCE_NOT_FOUND", "One or more chunk_ids do not
    resolve to an existing raw_chunk row.", { chunk_ids: args.chunk_ids })'
  cost: The comment states, in prose, that a cited chunk which does not exist is refused with RESOURCE_NOT_FOUND.
    That is a second home for a fact the node holds. The code in this file already holds the fact, so
    the pair conforms. A reader who changes the rule may edit the comment and think they have changed
    the rule.
  node: rules/knowledge-base/fragment-chunks-exist
- file: src/modules/ingestion/service/propose-fragment.service.ts
  where: the comment inside the mismatch branch of proposeFragmentService, lines 50-55 (the line citing
    VALIDATION_INVALID_FORMAT)
  evidence: '// "chunk_id belongs to a different source -> VALIDATION_INVALID_FORMAT (cross-table FK mismatch,
    alt 2c)." The code beneath it holds the same fact: throw new ValidationFailure("VALIDATION_INVALID_FORMAT",
    "One or more chunk_ids are not part of this run''s source.", { chunk_ids: args.chunk_ids, expected_raw_information_id:
    runCtx.rawInformationId })'
  cost: The comment states, in prose, that a cited chunk from another source is refused with VALIDATION_INVALID_FORMAT.
    That is a second home for a fact the node holds. The code in this file already holds the fact, so
    the pair conforms. A reader who changes the rule may edit the comment and think they have changed
    the rule.
  node: rules/knowledge-base/fragment-chunks-in-run-source
- file: src/modules/ingestion/service/propose-link.service.ts
  where: Layer 3 comment (lines 139-142) and the consolidator-args comment (lines 206-208)
  evidence: // is the LAST link of the date-justification chain (v7 §6.5 / §13c / A14) // and is consumed
    by `validateTemporal` as the fallback for // `requires_valid_from = true` rows that carry no stated/document
    date.
  cost: 'The fallback rule for a required validity start is restated in prose here. The code that holds
    it is src/modules/ingestion/validation/temporal.ts (`valid_from: receivedDate, valid_from_basis: "received"`).
    The prose speaks of a "chain" stated, document, received. The node says a source with a document date
    keeps no start and no basis, and the code does that. A reader of the comment would expect the document
    date to be used.'
  node: rules/knowledge-base/required-start-fallback
- file: src/modules/ingestion/service/propose-link.service.ts
  where: header comment, layer 4 line (line 13) and the paragraph at lines 17-19
  evidence: //   4. Confidence    — < 0.40 -> ok:true outcome=rejected (BELOW_CONFIDENCE_FLOOR).
  cost: The 0.40 floor is restated in prose in a file the node is not bound to for it. The running code
    holds it in src/modules/ingestion/validation/confidence.ts (`CONFIDENCE_FLOOR = 0.4`, `routeConfidence`),
    so if the node's number moves, this comment keeps saying the old one.
  node: rules/knowledge-base/below-confidence-floor-records-nothing
- file: src/modules/ingestion/validation/confidence.ts
  where: the header comment, lines 1-5 (the active and uncertain buckets)
  evidence: // Confidence routing (BR-17 of `ingestion.back.md`, A13 of v7). //   confidence >= 0.75            ->
    assertion status = 'active' //   0.40 <= confidence < 0.75     -> assertion status = 'uncertain'
  cost: The two thresholds and the status each one maps to are written a second time in prose. The code
    holds the same fact in this file, in CONFIDENCE_UNCERTAIN_UPPER, CONFIDENCE_FLOOR and routeConfidence.
    A change to the node moves neither the comment nor anything that checks it, so a reader may take the
    comment as the decided value.
  node: rules/knowledge-base/new-assertion-status-from-confidence
- file: src/modules/ingestion/validation/confidence.ts
  where: the header comment, lines 6-12 (the below-floor bucket), and the doc comment on routeConfidence
    at line 23
  evidence: //   confidence < 0.40             -> link/attribute NOT created; // The third branch is NOT
    a 5-layer validation failure — it is a business // result.
  cost: The rule that a proposal below 0.40 records nothing is restated in prose. The code holds it in
    this file as the `below_floor` return of routeConfidence. The comment also describes what the handler
    does with that result, which belongs to another file and to the contract, so it can drift from both
    without anything noticing.
  node: rules/knowledge-base/below-confidence-floor-records-nothing
- file: src/modules/ingestion/validation/errors.ts
  where: the header comment, lines 27-29 (the paragraph on BUSINESS_RUN_NOT_RUNNING)
  evidence: // The extra `BUSINESS_RUN_NOT_RUNNING` code is emitted by the MCP handler // guard when the
    ambient `llm_run_id` points to a row whose `status` is not // `'running'` (BR-21 / catalog Ingestion
    section).
  cost: The comment says again, in prose, that a proposal is refused unless its run is running. The rule
    is already a node, and running code holds it elsewhere. A reader who finds the sentence here may take
    this file for the rule's home, and it also still says the run id is "ambient", which no longer matches
    the run-id-as-argument wording in mcp-schemas.ts. When the node moves, nothing ties this prose to
    it.
  node: rules/knowledge-base/proposal-requires-running-run
- file: src/modules/ingestion/validation/structural.ts
  where: the docstring of assertValueInDomain, lines 88-108, and the comment at lines 116-118
  evidence: '"exact-match string equality, no normalisation, no case-folding, no trim (v1 semantics, §1
    / BR-30)."'
  cost: The "exactly as written" semantics and the sorted listing of allowed values are described in prose
    beside the code that applies them (`domain.has(value)` and `[...domain].sort()`). The docstring also
    points to a delivery record ("spec_divergences") and a prompt builder outside the node's reach.
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/validation/structural.ts
  where: 'the docstring of parseAttributeValue, lines 22-26, and the inline comments "// Strict ISO YYYY-MM-DD;
    not free-form." and "// Strict: must be a finite numeric literal (no NaN, no Infinity)."'
  evidence: '"Parse a `value` string against its declared `value_type`. ... Rejects \"tomorrow\" for `date`,
    \"abc\" for `number`, etc."'
  cost: The per-type value formats are stated in prose and again in the regexes below it (/^\d{4}-\d{2}-\d{2}$/,
    /^-?\d+(?:\.\d+)?$/, v !== "true" && v !== "false"). The comment will not follow the node.
  node: rules/knowledge-base/attribute-value-parses
- file: src/modules/ingestion/validation/structural.ts
  where: the header comment, lines 7-8 (Type-catalog membership), and the docstring of assertKnownType,
    lines 146-149
  evidence: '"//   - Type-catalog membership (BUSINESS_UNKNOWN_{NODE_TYPE|LINK_TYPE|ATTRIBUTE_KEY}): //       node_type,
    link_type, attribute_key all live in the seeded catalog."'
  cost: Prose says a node's fact (a node proposal names a node type the catalog holds) while assertKnownType
    throws BUSINESS_UNKNOWN_NODE_TYPE for it. A reader may take the comment as the home of the rule and
    look no further, and the comment will not follow the node if the node moves.
  node: rules/knowledge-base/node-type-in-catalog
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment lines 11-13, the doc comment at lines 61-65 and the inline comment at line 117
  evidence: '"//   - correction signal: `change_hint = ''correction''` requires textual errata //     evidence
    in at least one cited fragment." and "* Errata-signal heuristic — `''correction''` requires textual
    evidence of an * errata in at least one cited fragment (case-insensitive substring of any * of the
    Portuguese/English markers used in the domain glossary)." The code that holds the fact is "const ERRATA_MARKERS
    = [\"errata\", \"errado\", \"correção\", \"corrigir\", \"correction\", \"correcao\"] as const;" and
    "if (!hasErrataSignal(input.fragment_texts)) { throw new ValidationFailure(\"BUSINESS_TEMPORAL_INCOHERENT\",
    ..."'
  cost: The correction-evidence rule appears again in prose, with a pointer to a "domain glossary" as
    the origin of the marker list. The node and the code hold that list, so the pointer sends a reader
    to the wrong place.
  node: rules/knowledge-base/correction-requires-errata-evidence
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment lines 15-22, the doc comment at lines 49-55 and the inline comments at lines 159,
    167 and 175-176
  evidence: '"// Fallback chain for `requires_valid_from = true` (v7 §6.5 / §13c / A14): //   stated ->
    document -> received. When `valid_from` is not supplied and //   `document_date` is absent BUT `received_at`
    is available, the layer //   resolves `valid_from := received_at` (date portion) with //   `valid_from_source
    := ''received''`." The code that holds the fact is "const receivedDate = toIsoDate(input.received_at);
    if (receivedDate !== null) { return { valid_from: receivedDate, valid_from_basis: \"received\", };
    }" The comment names `valid_from_source`, but the field in the code is `valid_from_basis`.'
  cost: The fallback rule exists as prose citing retired sections (§6.5, §13c, A14). The prose also names
    a field, `valid_from_source`, that does not exist in the code, so a reader comparing it with the node
    gets a vocabulary the node does not use.
  node: rules/knowledge-base/required-start-fallback
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment lines 19-20 and the comments at lines 128-135 and 167
  evidence: '"//   rejection only fires when ALL THREE links of the chain are absent." and "// ALL three
    links absent — only now is the row BUSINESS_DATE_UNJUSTIFIED." The code that holds the fact is "throw
    new ValidationFailure(\"BUSINESS_DATE_UNJUSTIFIED\", \"link_type / attribute_key requires_valid_from
    = true but no date is available ..."'
  cost: The refusal condition (no stated start, no document date and no reception date) is restated in
    prose. The node that governs it is a different one, so a change to that node leaves this prose untouched.
  node: rules/knowledge-base/required-start-available
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment lines 6-10 and the comment block at lines 128-135
  evidence: '"//   - date justification chain (A14 / §6.5): when `requires_valid_from = true` //     for
    the link_type or attribute_key, AND `valid_from` is supplied, the //     caller must declare a non-null
    `valid_from_basis`." The code that holds the fact is "if (input.valid_from !== null && input.valid_from_basis
    === null) { throw new ValidationFailure(\"BUSINESS_DATE_UNJUSTIFIED\", ..."'
  cost: The comment states the basis rule as conditional on `requires_valid_from = true`, but the code
    throws whenever a start is stated without a basis. A reader trusting the prose takes the wrong rule,
    and the node is not where they look.
  node: rules/knowledge-base/stated-start-requires-basis
- file: src/modules/ingestion/validation/temporal.ts
  where: header comment, lines 4-5, and the inline comment at line 106
  evidence: '"//   - semi-open invariant: `valid_from < valid_to` when both are provided //     (BR-16
    / §13.3 / §5.2)." The code that holds the fact is "if (input.valid_from >= input.valid_to) { throw
    new ValidationFailure(\"BUSINESS_TEMPORAL_INCOHERENT\", ..."'
  cost: The start-before-end rule is written a second time as prose citing retired document sections (BR-16,
    §13.3). When the node moves, nobody is led to this comment, and it goes on saying the old rule beside
    code that no longer matches it.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/knowledge-graph/dto/queries.dto.ts
  where: the doc comment on TraverseDepthCoercer, lines 130-136
  evidence: '* Out-of-range `depth` is detected here AND re-asserted in the service layer * (defence in
    depth, BR-05 of back spec). Zod failure surfaces as Zod parse * error (422 VALIDATION_INVALID_FORMAT
    through the global handler); the * service-layer assertion produces BUSINESS_INVALID_TRAVERSE_DEPTH
    so the'
  cost: The comment states the depth bounds rule and the two refusal codes outside behavior. The bounds
    are enforced by `assertDepth` in backend/src/modules/knowledge-graph/service/traversal.service.ts
    (`depth > TRAVERSAL_DEPTH_MAX` then `throw new InvalidTraverseDepthError(depth, TRAVERSAL_DEPTH_MAX)`).
    The coercer below the comment checks no range, only that the value is a number, so the claim that
    out-of-range depth is "detected here" is not what the code does. A reader would conclude a Zod range
    check exists.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/dto/queries.dto.ts
  where: the doc comment on TraverseDirectionSchema, lines 114-117
  evidence: '* Direction enum mirrors `openapi.yaml` traverseNode `direction` parameter. * Default in
    this schema is `both` (matches OpenAPI).'
  cost: 'The comment states the traversal direction default a second time, outside behavior. This file
    also holds the default in code (`direction: TraverseDirectionSchema.optional().default("both")`).
    If the node''s default changes, the comment claims a different authority (OpenAPI) than the one that
    decided it.'
  node: rules/knowledge-base/traversal-defaults
- file: src/modules/knowledge-graph/dto/queries.dto.ts
  where: the header comment, lines 1-6
  evidence: // Zod is applied at the route boundary (CLAUDE.md "DTO Pattern" / BR-02 / // BR-19). Out-of-range
    values produce ZodError -> 422 // `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE` through
    the // global error handler.
  cost: 'The comment states the refusal code for a request that fails validation, and it names two codes.
    The specification holds only VALIDATION_INVALID_FORMAT for these operations. The ZodError mapping
    in backend/src/middleware/error-handler.ts (`if (err instanceof ZodError)` ... `code: "VALIDATION_INVALID_FORMAT"`)
    emits only that one. A reader who trusts the comment looks for a VALIDATION_OUT_OF_RANGE path on these
    routes and finds none.'
  node: contracts/knowledge-base/access
- file: src/modules/knowledge-graph/mcp/query-toolset.ts
  where: header comment, lines 1-2 and 10-12
  evidence: '"// MCP `query` toolset registration — nine read-only tools mirroring the REST // surface
    1:1 (knowledge-graph.back.md BR-23, BR-25)." and "so REST and MCP surface byte-identical error codes
    for the same thrown sentinel."'
  cost: The same-answer rule between the two transports is described here as prose, citing a back-spec
    rule by number. A reader chasing the rule is sent to a document outside the specification nodes. A
    change to the node does not reach this prose, so the comment can drift without anything flagging it.
  node: constraints/retrieval-transports-answer-alike
- file: src/modules/knowledge-graph/mcp/query-toolset.ts
  where: header comment, lines 4-6
  evidence: '"opens its own short // `BEGIN READ ONLY` transaction (BR-23 rule 4)"'
  cost: The read-only-transaction rule is restated as prose with a back-spec citation. The node is the
    specification's statement of it, and this comment is a second place that names the fact.
  node: constraints/retrieval-is-read-only
- file: src/modules/knowledge-graph/mcp/query-toolset.ts
  where: section comment above the per-tool input schemas, lines 69-74
  evidence: '"Each schema is `.strict()` — // any unknown property surfaces as `VALIDATION_INVALID_FORMAT`."'
  cost: This prose restates the retrieval contract's refusal of undefined parameters. The contract lets
    only MCP refuse them for some operations, so a reader who trusts the comment cannot tell which operations
    the refusal covers. The comment also says "each schema", but list_nodes, list_link_types and list_attribute_keys
    reuse the REST query schemas unchanged.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/repository/catalog.repository.ts
  where: the docstring above listAttributeValidValues, lines 157-161
  evidence: '"Keys with no rows here have an OPEN domain and get no `valid_values`."'
  cost: The docstring is a second home outside behavior for the retrieval contract's list-attribute-keys
    statement that `valid_values` appears "only for a key the catalog closes". The code that holds it
    is in another file, so a reader of this repository finds a rule that nothing here applies.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/repository/graph.repository.ts
  where: the comment inside fetchTraversalHop above the SQL, lines 411-413
  evidence: Excluded the `status = 'deleted'` rows explicitly here — a tombstoned link is never part of
    the traversal envelope (UC-06 alt 3a).
  cost: The deleted-link exclusion is restated in prose beside the `AND kl.status <> 'deleted'` predicate
    that holds it. If the rule changes, the comment keeps asserting the old one.
  node: rules/knowledge-base/traversal-skips-deleted-links
- file: src/modules/knowledge-graph/repository/graph.repository.ts
  where: the doc comment of listNodes, lines 71-75 ("Prefix lookup mechanics")
  evidence: We pass the already-normalized prefix as `$X` and compare with `alias_norm LIKE $X || '%'`.
    The btree index on `alias_norm` supports left-anchored LIKE under the default collation.
  cost: The prefix-match rule is described a second time in prose beside the query that holds it. If the
    node moves, this comment keeps stating the old rule and nothing flags it.
  node: rules/knowledge-base/node-listing-name-prefix
- file: src/modules/knowledge-graph/repository/graph.repository.ts
  where: the doc comment of listProvenanceByTargets, lines 297-299 ("BR-16 excerpt computation")
  evidence: 'BR-16 excerpt computation: `substring(raw_chunk.text from offset_start + 1 for offset_end
    - offset_start)` — 1-based `substring`, 0-based `[offset_start, offset_end)` offsets'
  cost: The excerpt rule is stated a second time in prose. The `substring(rc."text" FROM rc.offset_start
    + 1 FOR rc.offset_end - rc.offset_start)` expression in the same function holds it, so the comment
    is a second home outside behavior.
  node: rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
- file: src/modules/knowledge-graph/repository/graph.repository.ts
  where: the doc comment of walkLinkHistory, lines 431-446
  evidence: Walk the complete lineage chain anchored at `anchorId`. Issues one recursive CTE that follows
    BOTH directions (up via `supersedes_*_id`, down via reverse pointer). Returns each row at most once,
    ordered ASC by `recorded_at` then `id` for deterministic output.
  cost: The history's membership and ordering are restated in prose beside the recursive CTE that holds
    them. A change to the node would leave this comment asserting the old shape.
  node: rules/knowledge-base/lineage-history
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: header comment lines 16-17 and 24-25, and the docstring of `inEffectOnly` at line 33 (the in-effect
    clause)
  evidence: //        [AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= current_date)] //          (the
    bracketed clause is added when `inEffectOnly = true`) /** When true (and `asOf` undefined), restrict
    to rows in effect today. */
  cost: The prose restates when an item is in effect (current, and a validity start that is absent or
    not after today). The code holds it in the `opts.inEffectOnly` branch (`valid_from <= current_date`),
    so the definition appears in two places and only the code is run.
  node: rules/knowledge-base/in-effect-assertion
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: header comment, lines 13-15 ("Modes" item 1, the current view)
  evidence: '//   1. asOf undefined            -> "current view" (query (a), BR-07): //        AND <alias>.valid_to
    IS NULL //        AND <alias>.superseded_at IS NULL'
  cost: The comment states a second time the rule that a read with no as-of date shows only current items.
    The code in this file already holds it (`AND ${alias}.valid_to IS NULL`, `AND ${alias}.superseded_at
    IS NULL`), and the node holds it too. If the rule changes, this prose keeps saying the old one and
    nothing flags it.
  node: rules/knowledge-base/graph-read-current-view
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: header comment, lines 19-22 ("Modes" item 2, valid-time travel)
  evidence: '//   2. asOf provided             -> "valid-time travel" (query (b), BR-08): //        AND
    <alias>.superseded_at IS NULL //        AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= $asOf)
    //        AND (<alias>.valid_to   IS NULL OR <alias>.valid_to   >  $asOf)'
  cost: 'The comment states a second time the as-of view: no supersession time, a validity start that
    is absent or on or before the date, and a validity end that is absent or after it. The code holds
    the same fact in the "Query (b) — valid-time travel" branch, and the node holds it too. The comment
    can drift from both.'
  node: rules/knowledge-base/graph-read-as-of-view
- file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  where: the docblock above isMappableServiceError, lines 335-352 (global-handler paragraph)
  evidence: // (`backend/src/middleware/error-handler.ts`), which logs them via pino and // applies its
    own pg-unavailable / 500 mapping.
  cost: The route-request refusals (store unreachable gives 503, any other cause gives 500) are restated
    in prose. The code that holds them is the middleware, which is a different file. A reader of this
    file could take the prose for where the rule lives.
  node: contracts/knowledge-base/access
- file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  where: the docblock above isMappableServiceError, lines 347-351 (MCP paragraph)
  evidence: // the shared mapper's "anything else → SYSTEM_INTERNAL_ERROR" branch is the // terminal branch
    on that path).
  cost: How an MCP read fails for any other cause (SYSTEM_INTERNAL_ERROR) is stated in prose in a REST
    route file. The code that holds it is the terminal branch of the mapper in mcp/error-envelope.ts.
    A reader here could take this comment for the home of the MCP-side rule.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  where: the opening comment block, lines 3-5
  evidence: // already enforces Neon Auth JWT (BR-01); individual handlers do NOT // re-check the token.
  cost: The owner-authentication fact is a second home in prose. The next reader may look here, or in
    the node, for what authenticates a request. The code that holds it is the scope hook, and it is elsewhere.
  node: contracts/knowledge-base/access
- file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  where: the opening comment block, lines 7-20 (the endpoint list)
  evidence: //   - GET /api/v1/nodes/{node_id}/traverse                    (UC-06) //   - GET /api/v1/links/{link_id}/history                     (UC-09)
    //   - GET /api/v1/nodes/{node_id}/attributes/{key}/history    (UC-11)
  cost: The retrieval operations are listed in prose a second time, next to the `app.get(...)` registrations
    that hold them. The list is tied to delivery labels (TC-04, TC-05, UC-xx), so it goes stale as the
    route set moves.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/catalog.service.ts
  where: the comment above the node-type check in listAttributeKeysService, line 102
  evidence: // BR-03 — fail fast before SQL.
  cost: The comment is prose that restates the refusal of an unknown node type. The code holds that refusal
    in this file (`throw new UnknownNodeTypeError(options.node_type)`), and errors.ts holds its code (`BUSINESS_UNKNOWN_NODE_TYPE`).
    A reader looking for where the rule lives is sent to a BR-number outside the specification.
  node: rules/knowledge-base/node-type-filter-in-catalog
- file: src/modules/knowledge-graph/service/catalog.service.ts
  where: the comment above the valid-values query in listAttributeKeysService, lines 110-112
  evidence: // BR-30 — attach closed-domain values so REST/MCP clients see the allowed // set up-front
    (parity with the chat ontology block). Group per key id; // keys with no rows stay OPEN (no `valid_values`).
  cost: 'The comment restates, as prose, that `valid_values` appears only for a key the catalog closes.
    The code holds that fact in this same file (`values !== undefined && values.length > 0 ? { ...base,
    valid_values: [...values].sort() } : base`). The comment is a second home for the fact, citing a BR-number
    that is not a node.'
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/formatters.ts
  where: the docstring above deriveFlags, lines 99-104
  evidence: '" * Derive the display flags surfaced in `LinkDetail.flags` and `AttributeDetail.flags`.
    Today this mirrors the storage `status` for `uncertain` / `disputed`; `low_confidence` is reserved
    for a future threshold-based flag."'
  cost: The flag rule (uncertain when the status is uncertain, disputed when it is disputed, never low-confidence)
    is stated in prose beside the code that holds it. The prose also calls low_confidence "reserved for
    a future threshold-based flag", which the node does not say; it says the graph read never flags low-confidence.
    A reader who trusts the comment may take the flag as a planned feature rather than a decided exclusion.
  node: rules/knowledge-base/graph-item-flags
- file: src/modules/knowledge-graph/service/node.service.ts
  where: line 101, comment above the `node.status === "deleted"` branch in getNodeByIdService
  evidence: // BR-11 — deleted -> 410 (row exists but tombstoned).
  cost: The comment restates the refusal of a read of a deleted node, including its HTTP status, in prose.
    The branch that throws NodeDeletedError holds the fact, and the status is stated in the contract.
    If the contract moves, the comment will still claim 410.
  node: rules/knowledge-base/deleted-node-read-refused
- file: src/modules/knowledge-graph/service/node.service.ts
  where: line 126, comment above the warnIfEmptyProvenance call in getNodeByIdService
  evidence: // BR-17 — empty provenance on non-deleted item -> WARN (no client error).
  cost: The comment restates in prose that an attribute with no provenance is not refused to the client.
    The code holds this by returning `provenanceByAttrId.get(r.id) ?? []`, so the comment is a second
    home for the policy.
  node: rules/knowledge-base/graph-read-shows-empty-provenance
- file: src/modules/knowledge-graph/service/node.service.ts
  where: 'line 62, comment above `const status: NodeStatus = input.status ?? "active";` in listNodesService'
  evidence: // BR-15 — default to active when caller omits status.
  cost: The comment restates in prose, under a back-spec rule number, a fact the specification holds.
    A reader who changes the default in the node will go looking for BR-15 here, and the comment will
    not move with it.
  node: rules/knowledge-base/node-listing-by-status
- file: src/modules/knowledge-graph/service/node.service.ts
  where: line 65, comment above `name_prefix_norm` in listNodesService
  evidence: // BR-01 of `.spec.md` — apply norm() before the LIKE prefix lookup.
  cost: The comment restates how a node listing compares the name prefix "as a name". The code already
    holds this by calling `norm(input.name_prefix)`, so the comment is a second home for the rule.
  node: rules/knowledge-base/node-listing-name-prefix
- file: src/modules/knowledge-graph/service/norm.ts
  where: the header comment, lines 1-14, above collapseSpaces
  evidence: '// Application-side mirror of the DB `norm()` function: // //   norm(x) = lower(unaccent(collapseSpaces(trim(x))))
    // // This is the SINGLE normalization policy of the system (CLAUDE.md // "Conventions").'
  cost: The comment states the name-normalization policy (lower-case, remove accents, trim, collapse inner
    whitespace) in prose, a second home beside the code. The code in this file already holds it, in norm()
    at lines 27-29. When the node moves, nobody is told to revisit the comment, and the comment's formula,
    which orders the steps differently from the code, can be read as the decided rule.
  node: rules/knowledge-base/name-normalization
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: JSDoc of traverseNodeService, lines 77-78, above the merged starting-node resolution at lines
    99-111
  evidence: '* On a `merged` starting node, the result substitutes the survivor as * the starting node
    id (BR-13) — the response includes the survivor in `nodes`.'
  cost: The merged-start rule is restated in a docstring. The branch `starting.status === "merged" &&
    starting.merged_into_node_id !== null` with the survivor `!== "deleted"` check holds it. The docstring
    omits the held-and-not-deleted condition, so it can mislead a reader.
  node: rules/knowledge-base/traversal-merged-start
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: comment at lines 250-254, above isSubstitutionInducedSelfLoop
  evidence: // Skip self-edges that emerged purely because of merged substitution // (both endpoints collapsed
    to the same survivor)
  cost: The rule for dropping links collapsed by merge substitution is written again in prose. `sourceId
    === targetId && row.source_node_id !== row.target_node_id` holds it. The comment would stay stale
    if the node changed.
  node: rules/knowledge-base/traversal-drops-merge-self-loops
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: comment at lines 259-261, above the linksById.has check
  evidence: // Dedup links by underlying knowledge_link.id (BR-22). Keep the // SMALLEST hop number seen
    so far (BFS guarantees the first sight is // the minimum hop), so we only insert on first encounter.
  cost: The show-each-link-once-at-its-first-hop rule is restated in prose. `if (linksById.has(row.id))
    continue;` holds it. The comment would stay stale if the node changed.
  node: rules/knowledge-base/traversal-link-once
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment line 14, and the comments at lines 280-283 and 292 in the next-frontier loop
  evidence: //     (BR-13). Merged nodes themselves are NEVER expanded. ... if (row.status === "merged")
    continue; // defensive — survivor is the one we follow
  cost: Prose states the expansion exclusion that the `deleted` and `merged` `continue` checks in the
    nextFrontier loop already enforce. The prose is a second home that nothing reads, so it can drift
    from the node unnoticed.
  node: rules/knowledge-base/traversal-expands-live-nodes
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment line 15, and the comments at lines 171-174 and 320-325 around the node accumulation
    and the final node list
  evidence: //   - The starting node is included in the result `nodes` list.
  cost: Prose repeats which nodes a traversal lists. The seeding with findNodesByIds and the `visitedNodeIds`
    loop that skips only merged rows hold the fact. The comment at lines 320-325 also gives a rationale
    ("Deleted nodes were never enqueued...") that no node holds. A reader trusting it would not look at
    the code.
  node: rules/knowledge-base/traversal-lists-reached-nodes
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment lines 12-14, and the comment at lines 232-236 above buildMergedSubstitution()
  evidence: //   - Merged endpoints are substituted to their survivor BEFORE being //     added to the
    response or enqueued for further expansion //     (BR-13).
  cost: The merged-end substitution rule is written in prose in two places. Code holds it in buildMergedSubstitution()
    and in the `substitution.get(row.source_node_id) ?? row.source_node_id` lines. A change to the node
    would leave both comments describing the old behavior.
  node: rules/knowledge-base/traversal-substitutes-merged-ends
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, line 11, above the scoring at line 245
  evidence: //   - Score = `TRAVERSAL_DECAY ** hop` (BR-14).
  cost: The scoring formula is stated again in prose. The formula is held by `const score = Math.pow(TRAVERSAL_DECAY,
    hop);`, and its base by the constant in ../traversal/config.js. If the node changes, the comment stays
    behind.
  node: rules/knowledge-base/traversal-link-score
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, line 7-8, above assertDepth() at line 341
  evidence: //   - `depth ∈ [1, 3]`; out-of-range -> `InvalidTraverseDepthError` //     (BR-05).
  cost: The depth bounds are written a second time in prose. The bounds are enforced by assertDepth()
    and the TRAVERSAL_DEPTH_MIN and TRAVERSAL_DEPTH_MAX constants imported from ../traversal/config.js.
    If the node moves, the comment keeps the old range and nothing flags it.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, line 9-10, above the direction branches at lines 190-209
  evidence: //   - `direction = both` decomposes into two independent BFS halves //     (outbound + inbound)
    merged by `link.id` after dedup (BR-22).
  cost: Prose repeats how a traversal follows links by direction. The same rule is implemented by the
    `input.direction === "out" || ... "both"` branches. A change to the node would leave the comment stale
    and no check would reach it.
  node: rules/knowledge-base/traversal-direction
- file: src/modules/knowledge-graph/traversal/config.ts
  where: the docstring above TRAVERSAL_DEPTH_DEFAULT (line 26)
  evidence: '`/** Default depth when the caller does not specify one. */` above `export const TRAVERSAL_DEPTH_DEFAULT
    = 1 as const;`'
  cost: Prose restates that an omitted depth takes a default, a fact the node traversal-defaults holds
    ("goes one hop deep"). The code holds the value 1 in this file, so only the prose is owed removal.
  node: rules/knowledge-base/traversal-defaults
- file: src/modules/knowledge-graph/traversal/config.ts
  where: the docstrings above TRAVERSAL_DEPTH_MIN and TRAVERSAL_DEPTH_MAX (lines 20 and 23)
  evidence: '`/** Lower bound on the depth parameter (BR-05 of `knowledge-graph.back.md`). */` and `/**
    Upper bound on the depth parameter (BR-05). */`, above `export const TRAVERSAL_DEPTH_MIN = 1 as const;`
    and `export const TRAVERSAL_DEPTH_MAX = 3 as const;`'
  cost: The depth bounds are restated as prose citing a back-spec rule, so the next reader follows the
    citation instead of the specification node expansion-depth-bounds. The constants hold the bounds in
    code in this file, so the pair conforms and the prose is owed removal.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/traversal/config.ts
  where: the file header comment (lines 1-15) and the docstring above TRAVERSAL_DECAY (line 17)
  evidence: '`// `TRAVERSAL_DECAY` (BR-14 of `knowledge-graph.back.md`, ADR A16) is the // single source
    of truth for the per-hop score decay applied by the BFS // traversal engine.` and `/** Per-hop score
    multiplier: `score(hop) = TRAVERSAL_DECAY ** hop`. */` above `export const TRAVERSAL_DECAY = 0.5 as
    const;`'
  cost: Prose that no running system emits restates the per-hop decay rule and names itself the "single
    source of truth", while the node expansion-decay holds that fact. A reader who trusts the comment
    looks here, and not in the specification, for where the decay was decided. The code holds the value
    (`0.5`) in this same file, so the pair conforms and only the prose is owed removal.
  node: rules/knowledge-base/expansion-decay
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: JSDoc of ListAcceptedFragmentsQuerySchema, line 26 (offset bound)
  evidence: '`offset >= 0`'
  cost: The non-negative offset rule is stated in prose beside `z.number().int().min(0)` at line 36, as
    a second home that the node's own changes do not reach.
  node: rules/knowledge-base/page-offset-non-negative
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: JSDoc of ListAcceptedFragmentsQuerySchema, lines 20-24 (the llm_run_id / raw_information_id bullet)
  evidence: '* - `llm_run_id` / `raw_information_id` are independently optional but at *   least one MUST
    be supplied; otherwise the `.refine` raises a *   `VALIDATION_INVALID_FORMAT` with the `requires_one_of`
    detail'
  cost: The requirement that a listing name a run, a raw information or both is written in prose as well
    as in the `.refine` at lines 39-45. A change to the node would leave this comment stating the old
    rule, and no tool reaches it.
  node: rules/knowledge-base/listing-requires-a-filter
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: JSDoc of ListAcceptedFragmentsQuerySchema, lines 26-27 (defaults)
  evidence: default `20`; `offset >= 0`, default `0`
  cost: The default limit of 20 and default offset of 0 are written in prose beside `.default(20)` and
    `.default(0)`. The node decides them, and a comment copy would go stale without notice.
  node: rules/knowledge-base/page-defaults
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: JSDoc of ListAcceptedFragmentsQuerySchema, lines 26-27 (limit bound)
  evidence: '* - `limit` is `[1..100]`, default `20`; `offset >= 0`, default `0` —'
  cost: The 1 to 100 bound on a page's limit is stated again in prose beside `.min(1).max(100)` at line
    33. The bound lives in the node, and a second copy in a comment will not follow it when it moves.
  node: rules/knowledge-base/page-limit-bounds
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: the docstring above QueryString, lines 37-47
  evidence: "* `query` validation per BR-04 of the back spec:\n *   - min 1 char (raw)\n *   - max 1000\
    \ chars (raw)\n *   - btrim non-empty after transform (rejects whitespace-only input)"
  cost: The docstring is a second home outside behavior for the 1000-character cap and the non-blank rule.
    Both are already held by the code below it, `.max(1000, ...)` and `.refine((s) => s.length > 0, ...)`.
    A reader can take the prose for the place the limit is decided.
  node: rules/knowledge-base/search-query-length
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: the header comment, lines 12-14
  evidence: The failure branch is built by the shared `mapErrorToEnvelope` from TC-01 (BR-24) so REST
    and MCP surface byte-identical error codes for the same thrown sentinel.
  cost: The two-transport parity rule is restated as a claim in a comment. The code that realizes it is
    `return mapErrorToEnvelope(err);` here, with the shared mapper and the service functions in other
    files. A reader may take the comment, not the constraint node, as where the parity was decided.
  node: constraints/retrieval-transports-answer-alike
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: the header comment, lines 9-11 (repeated in the makeHandler docstring, lines 179-180)
  evidence: 'success -> { ok: true,  result: <service return value> } / failure -> { ok: false, error:
    { code, message, details? } }'
  cost: 'The accepted answer of search and the three provenance reads is stated a second time in prose
    outside behavior. The code that holds it is `return { ok: true, result };` in makeHandler, and the
    failure shape is built in knowledge-graph/mcp/error-envelope.ts. When the contract moves, this comment
    is not reached and keeps describing the old answer.'
  node: contracts/knowledge-base/retrieval
- file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  where: the comment above the GET /fragments/accepted route, lines 157-163
  evidence: Lists `information_fragment` rows with `status = 'accepted'` filtered by `llm_run_id` and/or
    `raw_information_id` (at least one required).
  cost: The rule that an accepted-fragment listing must name a run, a raw information or both is written
    a second time in prose in the route file. The enforcing code is elsewhere (ListAcceptedFragmentsQuerySchema
    refine in dto/fragment.dto.ts), so a reader of this route sees a claim and no enforcement.
  node: rules/knowledge-base/listing-requires-a-filter
- file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  where: the comment block above the error mappers, lines 186-198
  evidence: 'BR-24 (knowledge-graph.back.md / query-retrieval.back.md): both REST and MCP transports surface
    IDENTICAL error codes / messages for any thrown service error. The classification core lives in `backend/src/modules/knowledge-graph/mcp/error-envelope.ts`'
  cost: The fact that the two transports answer alike is stated in prose here as well as in the node,
    and the comment cites a back-spec rule number (BR-24) rather than the node. A reader who trusts the
    comment has a second place that claims to say what the transports owe each other. The comment goes
    stale silently if the node moves.
  node: constraints/retrieval-transports-answer-alike
- file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  where: the file header comment, lines 3-5
  evidence: The parent scope // already enforces Neon Auth JWT (BR-01); individual handlers do NOT //
    re-check the token.
  cost: The owner-authentication behavior is described in prose in a file that does not hold it. The description
    cites BR-01 and not a node. It says the same thing as the access contract's authenticate-owner operation.
  node: contracts/knowledge-base/access
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 178-184, the comment block after the dedup loop
  evidence: '// BR-10: a chunk hit not anchored by ANY fragment in the result set is // dropped (we never
    surface raw-chunk text without the fragment lens). // We retain chunk hits only if explicitly requested
    and no fragment // anchored them. Per the spec ("collapse predates ranking; the final // list never
    carries a chunk row"), we DROP all chunk hits unconditionally'
  cost: 'The prose restates "A chunk-layer match never surfaces as a search item". The code holds the
    fact, because no chunk hit is ever pushed to `items`, so the pair conforms. The comment also contradicts
    itself: it says chunk hits are retained when explicitly requested, then says all are dropped. A reader
    could take that as a second, unwritten rule.'
  node: rules/knowledge-base/chunk-match-never-surfaces
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 293-295, the comment above the link score
  evidence: // For each link returned by the traversal, surface a `link` SearchItem. // Score = TRAVERSAL_DECAY
    ** hop * <source node score>. // We look up the source-node score by searching the items array.
  cost: 'The prose restates the hop-decay scoring rule, which the code also holds at line 322 (`Math.pow(TRAVERSAL_DECAY,
    hop) * sourceScore`). It is a second home outside behavior: if the rule moves, the comment still states
    the old formula.'
  node: rules/knowledge-base/expansion-decay
- file: src/modules/query-retrieval/service/search.service.ts
  where: lines 381-382, the comment above the sort
  evidence: '// (i) Rank (BR-15): score DESC, recordedAtTs DESC, id ASC.'
  cost: The prose restates the ranking order, which the sort comparator at lines 384-389 holds in this
    file. A second statement of the order outside behavior drifts silently when the node moves.
  node: rules/knowledge-base/search-ranking
- file: src/shared/error-mapping.ts
  where: the comment above codeToHttpStatus, lines 73-81
  evidence: '"every domain sentinel MUST publish its code here so REST + MCP surface byte-identical codes
    on the same business condition (P2.1 parity contract)."'
  cost: 'The comment states the node''s fact, that both transports answer a refusal with the same error
    code. Code in this file already holds it: codeToHttpStatus is the one registry, and toMcpToolResult
    serializes the same envelope.error.code. The comment is a second home outside behavior. A reader can
    mistake it for where the parity was decided, and it will go stale if the node moves.'
  node: constraints/retrieval-transports-answer-alike
- file: src/shared/error-mapping.ts
  where: the doc comment on internalError, line 194
  evidence: /** 500 — generic internal error. NEVER leaks `err.message` to the client. */
  cost: The comment restates the access contract's answer for a request that fails for any other cause,
    "error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause". The
    function body already holds it by returning a fixed message. The comment is a second home outside
    behavior and goes stale if the node changes.
  node: contracts/knowledge-base/access
- file: src/shared/health.ts
  where: the docstring above collectHealth, lines 18-23
  evidence: 'Never throws — a DB failure surfaces as `{ ok: false, database: "unreachable" }` so callers
    always get a usable report (the BFF answering at all proves it is running; the `database` field reports
    the dependency separately).'
  cost: The docstring states the read-health answer a second time (ok false and database "unreachable"
    when the store does not answer) in prose no running system emits. The catch branch in this same file
    already holds that answer. Prose that restates a node's fact can drift from the node unnoticed, and
    the next reader may treat it as the place the rule was decided.
  node: contracts/knowledge-base/access
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
notes: "Judged by 83 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/adopt-test-intent-kb-r2.returns/.\nStaged as an adoption of source no delivery\
  \ wrote: 25 candidate node(s) were read on every file, and each cleared one is bound to the files whose\
  \ judgment holds its fact.\nA finding in src/modules/compliance-audit/service/compliance-audit.service.ts\
  \ names rules/knowledge-base/compliance-deletion-redacts-content, which no file of this set is bound\
  \ to: the docstring above REDACTED_LITERAL, lines 51-57, and the constant itself: export const REDACTED_LITERAL\
  \ = \"[REDACTED]\" as const; — The literal that a compliance deletion writes over content is declared\
  \ a second time here. The actual redaction is the SQL in compliance-audit.repository.ts, `SET content\
  \ = '[REDACTED]'`, with `original_input = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]'\
  \ END`. That SQL does not read this constant. The constant is only re-exported by index.ts and pinned\
  \ by a test. If the node's literal changes, the repository and this constant can diverge silently, and\
  \ the test pins the copy that nothing at runtime uses.. It blocks nothing here; it is owed a route of\
  \ its own.\nA finding in src/modules/curation/mcp/curation-toolset.ts names rules/knowledge-base/merge-copies-aliases,\
  \ which no file of this set is bound to: CurationToolDescriptions.merge_nodes, lines 171-175. This is\
  \ the description served over tools/list, so it is emitted text.: \"every \" + \"link / attribute /\
  \ alias is repointed to the survivor in the same \" + \"transaction (BR-04, BR-07). `reason` is mandatory.\"\
  \ — The text the curation tool tells an LLM caller says the absorbed node's aliases are repointed to\
  \ the survivor. The rule says the survivor receives a copy of each alias whose normalized form it does\
  \ not hold, and the absorbed node keeps its own aliases. A caller that plans from the description expects\
  \ the absorbed node to be left without aliases, and the next reader of this text does not learn that\
  \ the node held something different.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/curation/service/dispute.service.ts names contracts/knowledge-base/curation, which\
  \ no file of this set is bound to: lines 119-122 (prefer_one without a winner) and lines 202-205 (adjust_periods\
  \ without periods), the messages of the two BusinessError throws: throw new BusinessError(\"BUSINESS_DISPUTE_WINNER_REQUIRED\"\
  , \"decision=prefer_one requires winner_id\"); throw new BusinessError(\"BUSINESS_DISPUTE_PERIODS_REQUIRED\"\
  , \"decision=adjust_periods requires periods[]\"); The contract answers with the messages \"decision=prefer_one\
  \ requires winner_id (member of item_ids)\" and \"decision=adjust_periods requires periods[] (one entry\
  \ per item_id)\". — When either branch is reached, the owner's client receives a message without the\
  \ parenthetical the contract states. A client or test that matches the contract's message text does\
  \ not match what this file emits. The contract stays the authority, so the wording is not decided in\
  \ the code.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/chunker/v1.ts\
  \ names domain/knowledge-base/source-type, which no file of this set is bound to: lines 32-40, the exported\
  \ type SourceType: \"export type SourceType =\n  | \"pdf\"\n  | \"email\"\n  | \"ata\"\n  | \"chat\"\
  \n  | \"artigo\"\n  | \"transcricao\"\n  | \"outro\";\" (its doc comment: \"mirrors the PostgreSQL `source_type`\
  \ enum.\") — The source-type vocabulary is declared a second time in a file the source-type node does\
  \ not bind. src/modules/ingestion/dto/source-type.ts also carries these values. If the node's values\
  \ change, the check never reaches this union, and the exhaustiveness switch in splitByHardBoundaries\
  \ follows this copy.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/mcp/mcp-schemas.ts\
  \ names constraints/ingest-toolset-offers-no-async-ingestion, which no file of this set is bound to:\
  \ StartAsyncIngestionMcpInputSchema and its type, lines 81-123: export const StartAsyncIngestionMcpInputSchema\
  \ = z.object({ ... \"The full plain text of the document to ingest. Paste the raw content; the server\
  \ chunks it, runs structured extraction in the BACKGROUND, and persists the knowledge graph with provenance.\
  \ No base64/binary.\" ... — and the docblock \"`start_async_ingestion` (BR-32) — shape-identical to\
  \ `ingest_document` for caller symmetry. The only difference is the new-run return semantics (immediate\
  \ vs. awaited)\" — The specification says the ingest toolset offers no tool that starts an ingestion\
  \ and returns before it completes, and the retirement is recorded in its decision log. This file still\
  \ declares and exports the input contract of exactly such a tool, with a description promising background\
  \ extraction. The schema is not registered or imported anywhere in backend/src except a test. A later\
  \ reader of the schema file will take the async tool as decided and may register it, which breaches\
  \ the constraint without anything failing.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/ingestion/prompts/extraction.v4.ts names rules/knowledge-base/caller-never-states-received,\
  \ which no file of this set is bound to: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 60-62: the instruction\
  \ on the basis to give a date resolved from `received_at`.: \"  `\\\"document\\\"`). If `document_date`\
  \ is `(unknown)`, fall back to the date\", \"  portion of `received_at` (the `YYYY-MM-DD` prefix of\
  \ the ISO-8601 string) —\", \"  use basis `\\\"received\\\"`.\", — The prompt sent to the model tells\
  \ it to state the basis `received`. The node says \"A proposal MUST NOT state the basis received.\"\
  \ A model that follows the prompt produces a proposal the rule forbids. The decision log of the anchor\
  \ rule records this as an open, unsettled contradiction, so the prompt is the only place the instruction\
  \ lives.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/repository/ingestion.repository.ts\
  \ names domain/knowledge-base/run-status, which no file of this set is bound to: LlmRunRow, the status\
  \ member (line 72): readonly status: \"running\" | \"completed\" | \"failed\"; — The three run states\
  \ are declared here as a type-level union. The node that holds that vocabulary is domain/knowledge-base/run-status,\
  \ and this file is bound to neither it nor domain/knowledge-base/llm-run. If the enumeration changes,\
  \ `--check` never reaches this file. The next reader then finds two declarations of the run states and\
  \ cannot tell which one the business decided.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/ingestion/service/directed-ingestion.service.ts names rules/knowledge-base/fragment-text-length,\
  \ which no file of this set is bound to: DirectedFragmentItemSchema (line 108), enforcing the fragment\
  \ text length at the directed input boundary: export const DirectedFragmentItemSchema = z.object({ ref:\
  \ DirectedRefSchema, text: z.string().min(1).max(1000), }); — The 1 to 1000 limit on a fragment's text\
  \ is held by fragment-text-length for an information fragment. Here it is implemented a second time\
  \ in a directed-only schema, and the ingest-directed contract lists no refusal for it. If the node moves,\
  \ nothing moves this copy, and a directed call is refused before dispatch with a message the contract\
  \ does not name for this cause.. It blocks nothing here; it is owed a route of its own.\nA finding in\
  \ src/modules/ingestion/service/directed-ingestion.service.ts names rules/knowledge-base/node-name-length,\
  \ which no file of this set is bound to: DirectedNodeItemSchema (lines 111-117), the name and aliases\
  \ length limits: name: z.string().min(1).max(500), node_id: z.string().uuid().optional(), aliases: z.array(z.string().min(1).max(500)).optional(),\
  \ — The 1 to 500 limit on a node's name and each alias is held by node-name-length for a node proposal.\
  \ This is a second implementation in a directed-only schema, and the ingest-directed contract lists\
  \ no refusal for it. The two copies can diverge unseen, and a directed call is refused with a cause\
  \ the contract does not name.. It blocks nothing here; it is owed a route of its own.\nA finding in\
  \ src/modules/ingestion/service/directed-ingestion.service.ts names rules/knowledge-base/directed-defaults,\
  \ which no file of this set is bound to: DirectedAttributeItemSchema line 144 and DirectedLinkItemSchema\
  \ line 155, forwarded at lines 637 and 717: change_hint: ChangeHintSchema.optional(),  ...  change_hint:\
  \ item.change_hint ?? \"none\", — The node says a directed attribute or link is proposed with change\
  \ hint none. The service lets the caller state any change hint and forwards it, so a directed supersession\
  \ can be requested through this code. The decision log beside directed-defaults records that the directed\
  \ tool carries no change hint, so the capability exists only here and the next reader of the node will\
  \ not know it.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/service/entity-resolution.service.ts\
  \ names rules/knowledge-base/ambiguous-candidates-need-review, which no file of this set is bound to:\
  \ the candidate query of step 2 (line 165, `LIMIT ${TRIGRAM_CANDIDATE_LIMIT}`, with the constant at\
  \ line 47), and the review-row loop over `decision.candidates` (lines 200-207): const TRIGRAM_CANDIDATE_LIMIT\
  \ = 10; ... ORDER BY MAX(similarity(na.alias_norm, norm($1::text))) DESC LIMIT ${TRIGRAM_CANDIDATE_LIMIT}`,\
  \ ... for (const cand of decision.candidates) { await client.query(`INSERT INTO entity_match_review\
  \ (node_id, candidate_node_id, similarity) The node says: \"creates a knowledge node in status needs-review\
  \ and records an entity match review pairing it with each such node and its similarity\" (each active\
  \ node of the type at a similarity of 0.55 or more). — When more than ten active nodes of the type reach\
  \ 0.55, the code records reviews for only the ten most similar, while the node says every such node\
  \ is paired. The ten-candidate cap is a value that exists only in this file. The next reader looks in\
  \ the specification for which nodes get a review row and finds \"each such node\", so the owner's entity-match\
  \ queue silently omits the lower-ranked candidates.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/ingestion/service/propose-attribute.service.ts names rules/knowledge-base/attribute-key-for-node-type,\
  \ which no file of this set is bound to: lines 71-80, the cross-table guard after the attribute key\
  \ lookup: if (resolvedKey.node_type_id !== nodeTypeId) {\n  throw new ValidationFailure(\n    \"VALIDATION_INVALID_FORMAT\"\
  ,\n    \"attribute_key.node_type_id does not match the node's node_type_id.\",\n    { node_id: args.node_id,\
  \ key: args.key }\n  );\n} — The guard is a second implementation of the refusal for a key that does\
  \ not belong to the node's type, and it answers with a different code and message. The specification\
  \ answers that case with BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key. The comment above the guard\
  \ says it is unreachable today. If the catalog cache scope is ever relaxed, as that comment contemplates,\
  \ the owner would get VALIDATION_INVALID_FORMAT with a message no node states, and anyone reading the\
  \ specification would not expect it.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/query-retrieval/dto/search.dto.ts names rules/knowledge-base/search-layer-outside-set-refused,\
  \ which no file of this set is bound to: LayersArray, lines 26-28 (the `layers` field of SearchQuerySchema):\
  \ const LayersArray = z\n  .union([z.string().min(1), z.array(z.string().min(1))])\n  .transform((v)\
  \ => (Array.isArray(v) ? v : [v])); — An empty layer name (`?layers=`) is not a search layer, and the\
  \ node says such a query is refused with BUSINESS_INVALID_SEARCH_LAYER, naming the allowed layers. Here\
  \ `.min(1)` stops it at the schema first, so it is refused as VALIDATION_INVALID_FORMAT. The code answers\
  \ one input differently from the contract, and the comment above the schema says the opposite (\"non-enum\
  \ elements raise a ZodError that the service translates to BUSINESS_INVALID_SEARCH_LAYER\").. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/modules/query-retrieval/repository/search.repository.ts\
  \ names rules/knowledge-base/search-ranking, which no file of this set is bound to: searchNodeAliasLayer,\
  \ the ORDER BY of the node-layer SQL (line 130): ORDER BY score DESC, kn.canonical_name ASC, kn.id ASC\
  \ LIMIT $4 (the node says: \"Search items are ranked by score descending, then by recording time descending\
  \ with a knowledge node counting as never recorded, then by identifier ascending.\") — The node layer\
  \ breaks score ties by canonical name, a step the ranking node does not have. When the layer's LIMIT\
  \ cuts the candidates, tied nodes survive in name order, not in identifier order. A reader who checks\
  \ the ranking against search-ranking will not find the name tie-break, because it lives only in this\
  \ SQL. Whether the service later re-sorts the survivors is outside this file.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/modules/query-retrieval/repository/search.repository.ts\
  \ names rules/knowledge-base/search-excludes-compliance-deleted-sources, which no file of this set is\
  \ bound to: the provenance lookups listProvenanceForFragments (lines 269-274), listProvenanceForLinks\
  \ (306-312) and listProvenanceForNodes (365-373): JOIN fragment_source fs ON fs.fragment_id = f.id JOIN\
  \ raw_chunk rc       ON rc.id = fs.raw_chunk_id JOIN raw_information ri ON ri.id = rc.raw_information_id\
  \ WHERE f.id = ANY($1::uuid[]) (no rc.superseded_at predicate and no raw_information status predicate\
  \ in any of the three, while searchChunkLayer applies \"AND rc.superseded_at IS NULL\"; the node says:\
  \ \"Search shows no information fragment whose raw information was deleted for compliance, neither as\
  \ a search item nor as the support of one.\") — In this file the supporting provenance rows of a search\
  \ item are read without the compliance exclusion the chunk layer applies. The link and node lookups\
  \ also have no fragment status filter. A chunk excerpt or fragment text from raw information deleted\
  \ for compliance can come back as the support of a search item unless another file filters it. The file's\
  \ own comment says deleted content \"must never come back through retrieval\", yet only one of its four\
  \ queries enforces that.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/query-retrieval/service/search.service.ts\
  \ names rules/knowledge-base/expansion-decay, which no file of this set is bound to: lines 316-322,\
  \ resolution of `sourceScore` for a link reached by expansion: // The hop's source node id is one of\
  \ the endpoints — pick whichever // is in our scoring map; fall back to the highest source score. const\
  \ sourceScore =\n  nodeScoreById.get(link.source_node_id) ??\n  nodeScoreById.get(link.target_node_id)\
  \ ??\n  0;\nconst score = Math.pow(TRAVERSAL_DECAY, hop) * sourceScore; — expansion-decay says a link\
  \ reached at hop h scores 0.5^h times the score of the matched node it was reached from. This code takes\
  \ the score of whichever endpoint is itself a matched node (the map holds only node hits). A link reached\
  \ at hop 2 or 3, whose endpoints are not matched nodes, scores 0 instead of 0.5^h times its originating\
  \ match's score. The fallback is 0, not the \"highest source score\" the comment promises. Such links\
  \ rank last, and which endpoint wins is decided here and not by the node. This was read from this file\
  \ alone; the shape of `traversal.links` was not opened.. It blocks nothing here; it is owed a route\
  \ of its own.\nCandidates: 326 opened across 66 of 83 delegation(s); each return lists its own under\
  \ `candidates_opened`.\nUnstated: 28 fact(s) the source states that no node holds, over 21 file(s),\
  \ listed under `unstated`. They block no binding here and no rebind closes them — the route is the analysis\
  \ that gives each fact a node.\nRestates: 192 place(s) where text in the source restates a node's fact\
  \ the code holds, over 68 file(s), listed under `restates`. The pair conforms, so none blocks a binding\
  \ — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-test-intent-kb-r2.returns/`, which are the evidence behind every entry above.
