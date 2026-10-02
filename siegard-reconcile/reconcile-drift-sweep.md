---
contract_version: siegard-reconcile/8
title: Drift sweep - files still stale after the bindings were corrected
summary: The files named here did not change; their remaining drift came from bindings restamped under
  another node. The owner states the behavior is correct.
target: backend
files:
- path: src/app.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/compliance-audit/dto/curation-action.dto.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/curation/service/item.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/repository/llm-run.repository.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/service/affected-nodes.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/service/entity-resolution.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/service/ingestion.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/knowledge-graph/repository/graph.repository.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/knowledge-graph/service/formatters.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/knowledge-graph/service/node.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/knowledge-graph/service/norm.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/query-retrieval/dto/search.dto.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/query-retrieval/service/errors.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/query-retrieval/service/search.service.ts
  change: unchanged; read against the nodes as they now stand
nodes:
- node: constraints/mcp-endpoint-serves-only-its-toolset
  conforms: false
  how: 'no named file holds this fact now: src/app.ts read `nowhere` — The file passes only the endpoint''s
    whitelist: `toolNames: [...CURATION_TOOL_NAMES, "compliance_delete"],` to `registerCurationMcpTransport`.
    It states no NOT_FOUND answer and no "Tool ''<name>'' is not available on this endpoint." message.
    The answer is emitted in `src/mcp/sdk-http-transport.ts`, which is outside this file set.'
  observed_at:
  - src/app.ts
- node: contracts/knowledge-base/retrieval
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at The four error classes. InvalidSearchQueryError,
    InvalidSearchLayerError, FragmentNotAcceptedError and RawInformationDeletedError carry the refusals''
    code and HTTP status. EmptyProvenanceError carries the empty-provenance refusal''s code and status.
    All five are in this file. — BUSINESS_INVALID_SEARCH_QUERY with statusCode 422; BUSINESS_INVALID_SEARCH_LAYER
    with statusCode 422; BUSINESS_FRAGMENT_NOT_ACCEPTED with statusCode 404; BUSINESS_RAW_INFORMATION_DELETED
    with statusCode 410 and a `deletedAt` field; SYSTEM_INTERNAL_ERROR with statusCode 500. Each matches
    the contract''s answers (422, 422, 404, 410 naming the deletion, 500). The "query exceeds 1000 characters"
    message agrees with rules/knowledge-base/search-query-length.'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/entity-match-review
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — The file only inserts rows, `INSERT INTO entity_match_review (node_id, candidate_node_id,
    similarity) VALUES ($1, $2, $3)`, and declares no shape for the element. The only local shape is `interface
    TrigramCandidate { node_id; sim }`, which is a query row and not the review.'
  observed_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/knowledge-node
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/repository/llm-run.repository.ts read
    `nowhere` — The file never declares the shape of knowledge-node. It only reads one column of it: `SELECT
    node_type_id FROM knowledge_node WHERE id = $1 LIMIT 1` in findNodeTypeIdByNodeId. Neither canonical_name,
    status, the aliases nor the merged-into reference is declared here.; src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — The file only writes rows, `INSERT INTO knowledge_node (node_type_id, canonical_name,
    status) VALUES ($1, $2, ''needs_review'')`, and declares no knowledge-node shape. `ResolveOrCreateNodeResult`
    carries only `node_id` and `resolution`.'
  observed_at:
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/node-alias
  conforms: false
  how: 'no named file holds this fact now: src/modules/knowledge-graph/service/formatters.ts read `nowhere`
    — toNodeAlias only maps a row onto the response, with `id: row.id, alias: row.alias, kind: row.kind,
    created_at: formatTimestamptz(row.created_at) ?? new Date(0).toISOString()`. It passes the element''s
    fields along and does not declare its shape. The shape is the imported types NodeAliasRow and NodeAliasResponse,
    declared in other files.'
  observed_at:
  - src/modules/knowledge-graph/service/formatters.ts
- node: domain/knowledge-base/node-resolution
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/service/affected-nodes.ts read `nowhere`
    — This file declares no type, schema or enumeration of the resolution. The values appear in the `isContributingOutcome`
    switch (`case "created_new": case "matched_existing": case "needs_review":`) as an allow-list on link
    and attribute outcomes. In `affectedIdsFromEnvelope`, `propose_node` is read only through `node_id`.
    The enumeration is declared in dto/propose-node.dto.ts.; src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — The file returns the values as literals, `return { node_id: nodeId, resolution: "matched_existing"
    }`, `"needs_review"` and `"created_new"`. The enumeration''s shape is declared in `ProposeNodeResolution`,
    which is imported from ../dto/propose-node.dto.js.'
  observed_at:
  - src/modules/ingestion/service/affected-nodes.ts
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/provenance
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/search.service.ts read
    `nowhere` — toProvenanceEntry only maps a repository row to the response entry: `fragment_id: row.fragment_id,
    fragment_text: row.fragment_text, ... received_at: row.received_at.toISOString()`. The file declares
    no shape for the provenance record and carries no recorded_at. Its shape sits in dto/response.dto.ts
    and the repository.'
  observed_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/search-layer
  conforms: false
  how: 'src/modules/query-retrieval/service/errors.ts, InvalidSearchLayerError, the `allowed` field, line
    28: public readonly allowed = ["fragment", "node", "chunk"] as const; — The enumeration of search
    layers is declared a second time in a file that domain/knowledge-base/search-layer is not bound to.
    That node is bound to src/modules/query-retrieval/dto/search.dto.ts and src/modules/query-retrieval/service/search.service.ts.
    The dto already declares it as `ALLOWED_LAYERS = ["fragment", "node", "chunk"] as const`. If the node
    adds or removes a layer, a check on the bound files never reaches this list. The refusal would then
    name layers that no longer match what the node decided, and nobody could tell which list was meant.'
  observed_at:
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/attribute-value-parses
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the try block in correctItemService that
    calls parseAttributeValue with the corrected value and the attribute key''s value_type, and maps a
    validation failure to BUSINESS_INVALID_ATTRIBUTE_VALUE. The formats themselves (date, number, bool,
    text) are not declared in this file. The parser sits in ../../ingestion/validation/structural.js,
    which this file imports. — parseAttributeValue({ value: body.corrected.value, value_type: attrKey.value_type,
    }); ... throw new BusinessError("BUSINESS_INVALID_ATTRIBUTE_VALUE", "corrected.value does not parse
    against attribute_key.value_type", { value_type: attrKey.value_type, value: body.corrected.value });
    The curation contract''s refusal for this rule reads "error code BUSINESS_INVALID_ATTRIBUTE_VALUE
    naming the value type and the value, HTTP 422 over REST", which matches the code and the details it
    carries.'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/content-hash-unique
  conforms: true
  how: "src/modules/ingestion/service/ingestion.service.ts: held at The catch branch of the insertRawInformation\
    \ try block in ingestRawInformation (lines 117-122). It treats a unique violation on the content-hash\
    \ constraint as an already-held raw information. The constraint itself is declared in the repository\
    \ and the schema, not in this file. — if (isUniqueViolation(err, RAW_INFORMATION_CONTENT_HASH_CONSTRAINT))\
    \ {\n      return await noopExisting(client, contentHash, idempotencyKey);\n    }"
  encoded_at:
  - src/modules/ingestion/service/ingestion.service.ts
- node: rules/knowledge-base/idempotency-key-unique
  conforms: true
  how: "src/modules/ingestion/service/ingestion.service.ts: held at The catch branch of the insertLlmRun\
    \ try block (lines 152-165), which refuses a key collision on a freshly inserted raw information.\
    \ The run lookup by key in noopExisting (lines 205-212) relies on the same uniqueness. The constraint\
    \ itself is declared in the repository and the schema, not in this file. — if (isUniqueViolation(err,\
    \ LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT)) {\n      throw new InvariantError(\n        `llm_run idempotency_key\
    \ collision on a freshly inserted raw_information (${rawInformationRow.id}); ` +\nand `const run =\
    \ await findLlmRunByIdempotencyKey(client, idempotencyKey);`"
  encoded_at:
  - src/modules/ingestion/service/ingestion.service.ts
- node: rules/knowledge-base/name-normalization
  conforms: true
  how: "src/modules/knowledge-graph/service/node.service.ts: held at listNodesService, lines 64-65, which\
    \ applies the single project normalisation function to the listing's name prefix. The lower-casing,\
    \ accent removal, trimming and whitespace collapsing are declared in norm.ts, not in this file. —\
    \ const name_prefix_norm =\n    input.name_prefix !== undefined ? norm(input.name_prefix) : undefined;\n\
    src/modules/knowledge-graph/service/norm.ts: held at norm(), line 14, composing collapseSpaces (line\
    \ 4) and stripDiacritics (line 9) — return collapseSpaces(stripDiacritics(input.trim())).toLowerCase();\
    \ with collapseSpaces doing s.replace(/\\s+/g, \" \") and stripDiacritics doing s.normalize(\"NFD\"\
    ).replace(/[̀-ͯ]/g, \"\")"
  encoded_at:
  - src/modules/knowledge-graph/service/node.service.ts
  - src/modules/knowledge-graph/service/norm.ts
- node: rules/knowledge-base/node-listing-name-prefix
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listNodes(), the aliasJoin\
    \ construct (lines 91-96), together with the countSql and dataSql that apply it through baseFrom —\
    \ aliasJoin = `JOIN node_alias na ON na.node_id = kn.id\n                   AND na.alias_norm LIKE\
    \ $${params.length} || '%'`;\nThe bound parameter is the already-normalised prefix. The comparison\
    \ is against the normalised alias column, so a node is kept only when one of its aliases matches the\
    \ normalised prefix followed by any text. The prefix is not escaped, so `%` and `_` act as LIKE wildcards\
    \ for any text and any one character.\nsrc/modules/knowledge-graph/service/node.service.ts: held at\
    \ listNodesService, lines 64-73, which normalises the prefix and forwards it to the repository as\
    \ name_prefix_norm. The matching against aliases, with the trailing \"any text\" and the percent and\
    \ underscore wildcards, is carried out in graph.repository.ts and not in this file. — const repoResult\
    \ = await repoListNodes(client, {\n    node_type_id: nodeTypeId,\n    name_prefix_norm,\n    status,\n\
    \    limit: input.limit,\n    offset: input.offset,\n  });\n  (the repository's na.alias_norm LIKE\
    \ $N || '%' is the matching)"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at the `limit` field of ListComplianceDeletionsQuerySchema,
    line 74 — limit: z.coerce.number().int().min(1).max(100).default(50)

    src/modules/compliance-audit/dto/curation-action.dto.ts: held at ListCurationActionsQuerySchema, the
    `limit` field, line 33 — limit: z.coerce.number().int().min(1).max(100).default(50),'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/dto/curation-action.dto.ts
restates:
- file: src/app.ts
  where: the JSDoc of buildApp, `bodyLimit` bullet, lines 82-83, and the comment above BODY_LIMIT_BYTES,
    lines 90-91
  evidence: '"- `bodyLimit`: 11 MiB (`ingestion.back.md §1` requires 10 MiB content + envelope overhead).
    Domain routes can override per-route if needed." and "// 11 MiB — headroom for `ingest_document` one-shot
    payloads (a full document plus envelope), above the largest expected single-document ingest." The
    code holds the same figure: `const BODY_LIMIT_BYTES = 11 * 1024 * 1024;` and `bodyLimit: BODY_LIMIT_BYTES,`'
  cost: The 11 MiB ceiling is stated in two comments as well as in the constant. A reader looking for
    where it was decided finds a back-spec citation and a rationale in prose, not the node that holds
    it. If the node moves, the prose stays behind.
  node: constraints/request-body-ceiling
- file: src/app.ts
  where: the comment above the `fastifyCors` registration, lines 104-112
  evidence: '"// CORS — registered FIRST so its `onRequest` hook runs before the `/api/v1` // auth preHandler.
    That ordering is what makes preflight work: a browser // OPTIONS request is answered (and `Access-Control-Allow-Origin`
    set) by the // plugin before the JWT check would otherwise reject it." The code holds the behaviour:
    `await app.register(fastifyCors, {` runs before `scoped.addHook("preHandler", auth.preHandler);`'
  cost: The preflight-without-authentication rule is restated in prose beside the code that implements
    it. The next reader takes the comment for the rule's home and does not look in the specification.
  node: constraints/preflight-needs-no-authentication
- file: src/modules/ingestion/service/affected-nodes.ts
  where: the CONTRACT block of the header comment, lines 19-25
  evidence: //   `affected_nodes` is attached to a `LlmRunResponse` ONLY when the run's //   status ===
    'completed'.
  cost: The rule that a run lists its affected nodes only when completed is restated as prose in a file
    that does not enforce it. The check is made in llm-run.service.ts, so a change to the node would not
    reach this comment.
  node: rules/knowledge-base/affected-nodes-only-when-completed
- file: src/modules/ingestion/service/affected-nodes.ts
  where: the comment inside affectedIdsFromEnvelope, lines 105-108
  evidence: // `propose_node` does not carry an `outcome` field — it carries `resolution`. // For node
    it is always contributing on ok:true (resolution is one of // matched_existing / created_new / needs_review
    — all three contribute).
  cost: The three resolutions of a node proposal are listed a second time in prose here. The enumeration
    is declared in another file, so a change to the node would not reach this comment and a reader would
    see two lists.
  node: domain/knowledge-base/node-resolution
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the docstring of resolveOrCreateNode, lines 65-90
  evidence: '* 2. Tries exact `alias_norm = norm(name)` match against active nodes of *      `nodeTypeId`.
    Hit → reuse; resolution = `matched_existing`. ... *      - Ambiguous → INSERT a new node with `status
    = ''needs_review''`, one *        `entity_match_review` row per candidate with `sim >= MATCH_FLOOR`,
    *        resolution = `needs_review`. *      - Novel → INSERT a new node with `status = ''active''`,
    *        resolution = `created_new`.'
  cost: The docstring is a second home for the exact-alias, ambiguous-candidate and no-candidate rules
    outside behavior. Code in this same file already holds them (the exact-match query, decideFromCandidates,
    the INSERTs). When a rule moves, `--check` does not reach this prose, so it can silently go stale.
  node: rules/knowledge-base/ambiguous-candidates-need-review
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the comment above the INSERT try/catch in ingestRawInformation (lines 101-104)
  evidence: // Attempt the INSERT; catch UNIQUE violation on content_hash and switch to // the no-op path.
    Any other 23505 (e.g. on idempotency_key alone, which // would mean a state inconsistency since content_hash
    is the primary anchor) // is logged and re-raised as 500 by the global error handler.
  cost: The comment restates that content hashes are unique and that a duplicate takes the no-op path.
    The catch branch beneath it, `if (isUniqueViolation(err, RAW_INFORMATION_CONTENT_HASH_CONSTRAINT))
    { return await noopExisting(...) }`, holds that behavior already. A second statement of the fact in
    prose would not follow the node if the node moved.
  node: rules/knowledge-base/content-hash-unique
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the comment inside the insertLlmRun catch block (lines 153-157)
  evidence: // Possible only if a concurrent caller raced us with the same // (content_hash, model, prompt_version)
    tuple and inserted the run // between our `insertRawInformation` and `insertLlmRun` — extremely //
    unlikely because we hold the row lock from the first INSERT in the // same transaction. Surface as
    500 (the global handler maps it).
  cost: The comment explains when an idempotency-key collision can occur, which is a second statement
    of "no two LLM runs hold the same idempotency key". The code holds the fact too, in `if (isUniqueViolation(err,
    LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT)) { throw new InvariantError(...) }`. Prose about which tuple forms
    the key would not follow the node if the key's composition changed.
  node: rules/knowledge-base/idempotency-key-unique
- file: src/modules/knowledge-graph/repository/graph.repository.ts
  where: the ListNodesFilter.name_prefix_norm doc comment (line 54) and the listNodes docstring (lines
    67-74)
  evidence: /** Already-normalised prefix (`norm(name_prefix)`); compared via LIKE. */ and "List nodes
    filtered by status, optional NodeType, optional name-prefix lookup (via `node_alias.alias_norm`)."
  cost: 'The comments restate how the name-prefix match works: the prefix is normalised, then compared
    against the normalised alias. A second home for the fact sits outside behavior, so a reader can take
    the comment for where the matching is decided. The code holds the fact in the aliasJoin construct
    in this file.'
  node: rules/knowledge-base/node-listing-name-prefix
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the file's header comment, lines 1-7
  evidence: // normalisation of the name_prefix (norm()), the merged / deleted policy
  cost: Prose that no running system emits says a second time that the listing normalises the prefix with
    norm(). The code holds that fact at the call on line 65 and in norm.ts, so the comment gives a reader
    a second place to look for it. When the node moves, nothing updates this prose.
  node: rules/knowledge-base/name-normalization
- file: src/modules/knowledge-graph/service/norm.ts
  where: the JSDoc blocks above collapseSpaces (line 2), stripDiacritics (line 7) and norm (line 12)
  evidence: /** Collapse internal whitespace runs to a single SPACE. */ ... /** NFD + strip combining
    marks U+0300..U+036F. */ ... /** Apply the project-wide normalization policy. */
  cost: 'The docstrings say in prose what the node holds: whitespace collapsing, accent removal, and the
    project-wide policy. A reader who finds the rule here may treat the comment as the rule, and it then
    has a second home outside the specification that nothing keeps in step. The code holds the fact in
    this same file, so the pair conforms and only the prose is owed removal.'
  node: rules/knowledge-base/name-normalization
- file: src/modules/query-retrieval/service/search.service.ts
  where: the comment above `const chunksById`, lines 166 to 169
  evidence: '// Count chunk hits that a fragment in the result set anchors (BR-10). The // per-fragment
    collapse map is not needed: chunks are dropped from the final // list unconditionally (see the BR-10
    note below), so only the metric count // is consumed (logged as `dedup_collapsed_count`).'
  cost: The comment restates that a chunk match never becomes a search item. It also points to a "BR-10
    note below" that does not exist in the file, so it misleads a reader about where the rule sits.
  node: rules/knowledge-base/chunk-match-never-surfaces
- file: src/modules/query-retrieval/service/search.service.ts
  where: the comment above `const layers = resolveLayers(input.layers)`, lines 96 to 99
  evidence: // (a) Validate `layers[]` against the closed set (BR-04). Zod accepts //     any string;
    the service is the authoritative gate.
  cost: The comment restates the refusal of a layer outside the closed set. It also claims where the refusal
    is decided, so a reader looks for the rule in this comment instead of in the node.
  node: rules/knowledge-base/search-layer-outside-set-refused
- file: src/modules/query-retrieval/service/search.service.ts
  where: the comment above the `filtered` constant, lines 361 to 365
  evidence: // (h) include_uncertain filter on the in-memory list (node hits). //     Fragment partial
    GIN already filters status=accepted; uncertain //     applies to graph rows only.
  cost: The comment restates the exclusion of uncertain items on request. It also claims where the exclusion
    applies, which the code does not limit that way, so a reader is told a narrower rule than the one
    in force.
  node: rules/knowledge-base/uncertain-items-excluded-on-request
- file: src/modules/query-retrieval/service/search.service.ts
  where: the comment inside the link loop, lines 320 to 321
  evidence: '// BR-13 / OpenAPI: links without provenance are an alarm but // we MUST NOT emit a `provenance:
    []` row. Log warn and drop.'
  cost: The comment restates that an expanded link surfaces only with provenance, and cites a back spec
    and an OpenAPI document as its authority.
  node: rules/knowledge-base/expanded-link-requires-provenance
- file: src/modules/query-retrieval/service/search.service.ts
  where: the comment inside the node-alias loop, lines 233 to 235
  evidence: '// BR-13 of back spec / OpenAPI: `provenance` minItems: 1. A node // hit without ANY accepted-fragment
    trace is dropped — we never // surface a node without a provenance chain.'
  cost: The comment restates when a matched node surfaces, citing a back spec and an OpenAPI minItems
    instead of the node, so the rule appears to be decided in a document the specification does not hold.
  node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
- file: src/modules/query-retrieval/service/search.service.ts
  where: the header comment, lines 1 to 14
  evidence: '// searchKnowledge service — composes the three-layer FTS pipeline: //   1. parse the tsquery
    (BR-05) — empty parse short-circuits to //      InvalidSearchQueryError. ... //   7. rank with deterministic
    tie-breakers (BR-15). //   8. paginate; return total = pre-pagination length.'
  cost: 'The header restates, as numbered prose, rules the specification already holds: the parse refusal,
    the ranking order and the total before pagination. The next reader may take it for the place the pipeline
    was decided, and when a node moves the comment stays as it was.'
- file: src/modules/query-retrieval/service/search.service.ts
  where: the trailing comment on the node item's recordedAtTs, line 250
  evidence: 'recordedAtTs: 0, // node has no recorded_at axis; tie-break falls through'
  cost: The comment restates how a knowledge node counts in the ranking, apart from the node that holds
    it.
  node: rules/knowledge-base/search-ranking
pairs_omitted:
- node: constraints/answers-carry-allowed-origin
  file: src/app.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/ingest-toolset-offers-no-async-ingestion
  file: src/app.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/preflight-needs-no-authentication
  file: src/app.ts
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
- node: rules/knowledge-base/audit-listing-accepts-open-window
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
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
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
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: domain/knowledge-base/information-fragment
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/tool-call
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
- node: rules/knowledge-base/affected-nodes-of-a-run
  file: src/modules/ingestion/service/affected-nodes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/affected-nodes-omit-absent
  file: src/modules/ingestion/service/affected-nodes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/ambiguous-candidates-need-review
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/candidate-similarity
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/concurrent-proposals-resolve-in-turn
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
- node: rules/knowledge-base/content-hash-is-sha256
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
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/ingestion-records-chunks-and-run
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/alias-kind
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/assertion-status
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/graph-provenance-hides-compliance-deleted
  file: src/modules/knowledge-graph/repository/graph.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: domain/knowledge-base/assertion-status
  file: src/modules/knowledge-graph/service/formatters.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/effective-status
  file: src/modules/knowledge-graph/service/formatters.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/source-type
  file: src/modules/knowledge-graph/service/formatters.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/graph-item-flags
  file: src/modules/knowledge-graph/service/formatters.ts
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
- node: rules/knowledge-base/node-listing-by-status
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-filter-in-catalog
  file: src/modules/knowledge-graph/service/node.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
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
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-layer-outside-set-refused
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-query-length
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-query-not-blank
  file: src/modules/query-retrieval/dto/search.dto.ts
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
- node: domain/knowledge-base/search-item
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-match-cites-its-fragment
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-match-never-surfaces
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
- node: rules/knowledge-base/non-expanding-search-walks-no-graph
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-layer-candidate-cap
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-ranking
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
notes: 'Judged by 15 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-drift-sweep.returns/.

  A finding in src/modules/compliance-audit/dto/curation-action.dto.ts names domain/knowledge-base/curation-action-kind,
  which no file of this set is bound to: CurationActionNameSchema, lines 5-13: export const CurationActionNameSchema
  = z.enum([ "resolve_entity_match", "merge_nodes", "resolve_dispute", "confirm_item", "reject_item",
  "correct_item", "compliance_delete", ]); — The seven curation action kinds are declared here as a second
  vocabulary, and the node is not bound to this file. If the node gains or drops a kind, `--check` never
  reaches this file, and nobody can tell which list was decided.. It blocks nothing here; it is owed a
  route of its own.

  A finding in src/modules/compliance-audit/dto/curation-action.dto.ts names domain/knowledge-base/curation-target-kind,
  which no file of this set is bound to: TargetKindSchema, lines 17-23: export const TargetKindSchema
  = z.enum([ "node", "link", "attribute", "fragment", "raw_information", ]); — The five target kinds are
  declared here as a second vocabulary, and the node is not bound to this file. A change to the node''s
  values never reaches this file through `--check`.. It blocks nothing here; it is owed a route of its
  own.

  A finding in src/modules/compliance-audit/dto/curation-action.dto.ts names rules/knowledge-base/audit-page-defaults,
  which no file of this set is bound to: ListCurationActionsQuerySchema, the `limit` and `offset` defaults,
  lines 33-34: limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).default(0),
  — The default page of 50 records and the default offset of 0 are applied here, and the node that holds
  them is not bound to this file. If the node moves, nothing reaches this file.. It blocks nothing here;
  it is owed a route of its own.

  A finding in src/modules/compliance-audit/dto/curation-action.dto.ts names rules/knowledge-base/page-offset-non-negative,
  which no file of this set is bound to: ListCurationActionsQuerySchema, the `offset` bound, line 34:
  offset: z.coerce.number().int().min(0).default(0), — The non-negative offset rule is enforced here,
  and the node that holds it is not bound to this file. A change to the node would not reach this file..
  It blocks nothing here; it is owed a route of its own.

  A finding in src/modules/compliance-audit/dto/curation-action.dto.ts names rules/knowledge-base/audit-window-ordered,
  which no file of this set is bound to: ListCurationActionsQuerySchema.superRefine, lines 36-46: if (Date.parse(value.created_from)
  >= Date.parse(value.created_to)) { ctx.addIssue({ code: "custom", path: ["created_to"], message: "VALIDATION_OUT_OF_RANGE",
  }); } — The rule that the window start must be strictly before the end is implemented here, and the
  node is not bound to this file. If the node changes, the check here goes stale unnoticed.. It blocks
  nothing here; it is owed a route of its own.

  A finding in src/modules/compliance-audit/dto/curation-action.dto.ts names rules/knowledge-base/curation-action-reason-length,
  which no file of this set is bound to: CurationActionSchema, the `reason` field, line 58: reason: z.string().max(1000).nullable(),
  — The 1000-character ceiling on a curation action''s reason is declared here, and the node is not bound
  to this file. If the node moves the ceiling, this file is not reached.. It blocks nothing here; it is
  owed a route of its own.

  A finding in src/modules/ingestion/service/entity-resolution.service.ts names rules/knowledge-base/ambiguous-candidates-need-review,
  which no file of this set is bound to: TRIGRAM_CANDIDATE_LIMIT (line 28) and the candidate query''s
  `LIMIT ${TRIGRAM_CANDIDATE_LIMIT}` (line 146), which feeds decideFromCandidates and the entity_match_review
  inserts (lines 177-184): const TRIGRAM_CANDIDATE_LIMIT = 10; ... GROUP BY na.node_id ORDER BY MAX(similarity(na.alias_norm,
  norm($1::text))) DESC LIMIT ${TRIGRAM_CANDIDATE_LIMIT} ... for (const cand of decision.candidates) {
  INSERT INTO entity_match_review ... — The ceiling of ten candidates is a domain value that no node holds.
  The rule states that the proposal is paired with "each such node" at a similarity of 0.55 or more. A
  proposal with more than ten active nodes at or above 0.55 gets reviews for only the ten most similar.
  The owner''s queue silently omits the rest, and the cap exists only in this file, so the next reader
  looks for it in the specification and does not find it.. It blocks nothing here; it is owed a route
  of its own.

  A finding in src/modules/knowledge-graph/service/formatters.ts names domain/knowledge-base/assertion-status,
  which no file of this set is bound to: the ASSERTION_STATUS constant, lines 26-32: const ASSERTION_STATUS:
  ReadonlySet<AssertionStatus> = new Set([ "active", "uncertain", "disputed", "superseded", "deleted",
  ]); — The five assertion-status values are declared a second time, as a runtime set in this file. The
  type that carries them is imported from ../dto/enums.dto.js. A change to the enumeration node reaches
  the DTO declaration, and this set can go on accepting or refusing the old values. The two would disagree
  with nothing flagging it, so nobody could tell which one the business decided.. It blocks nothing here;
  it is owed a route of its own.

  A finding in src/modules/knowledge-graph/service/formatters.ts names domain/knowledge-base/effective-status,
  which no file of this set is bound to: the EFFECTIVE_STATUS constant, lines 34-41: const EFFECTIVE_STATUS:
  ReadonlySet<EffectiveStatus> = new Set([ "active", "uncertain", "disputed", "superseded", "deleted",
  "inactive", ]); — The effective-status vocabulary is declared again here. It already appears in dto/enums.dto.ts,
  where line 40 also holds "inactive". When the node moves, this copy is not reached by the trace check,
  and a value could be accepted from the database here that the enumeration no longer holds.. It blocks
  nothing here; it is owed a route of its own.

  A finding in src/modules/knowledge-graph/service/formatters.ts names domain/knowledge-base/source-type,
  which no file of this set is bound to: the SOURCE_TYPE constant, lines 43-51: const SOURCE_TYPE: ReadonlySet<SourceType>
  = new Set([ "pdf", "email", "ata", "chat", "artigo", "transcricao", "outro", ]); — The source-type vocabulary
  is declared a second time here. It is also declared in dto/enums.dto.ts, where line 76 holds "transcricao".
  The node names the values as meeting-minutes, article, transcript and other, with `ata`, `artigo`, `transcricao`
  and `outro` as the material''s own words. A change to the node would not reach this copy, so what is
  a source type could differ between the DTO and the formatter.. It blocks nothing here; it is owed a
  route of its own.

  Candidates: 11 opened across 5 of 15 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 17 place(s) where text in the source restates a node''s fact the code holds, over 8 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-drift-sweep.returns/`, which are the evidence behind every entry above.
