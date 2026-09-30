---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/knowledge-graph/dto/attribute.dto.ts
  - src/modules/knowledge-graph/dto/catalog.dto.ts
  - src/modules/knowledge-graph/dto/enums.dto.ts
  - src/modules/knowledge-graph/dto/history.dto.ts
  - src/modules/knowledge-graph/dto/link.dto.ts
  - src/modules/knowledge-graph/dto/node.dto.ts
  - src/modules/knowledge-graph/dto/provenance.dto.ts
  - src/modules/knowledge-graph/dto/queries.dto.ts
  - src/modules/knowledge-graph/dto/traversal.dto.ts
  - src/modules/knowledge-graph/index.ts
  - src/modules/knowledge-graph/mcp/error-envelope.ts
  - src/modules/knowledge-graph/mcp/query-toolset.ts
  - src/modules/knowledge-graph/mcp/query-transport.ts
  - src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
read_outside_area:
  - src/modules/knowledge-graph/service/errors.ts — read for the code, message and detail fields of each knowledge-graph sentinel the mapper classifies
  - src/modules/query-retrieval/service/errors.ts — read for the codes and detail fields of the query-retrieval sentinels the mapper classifies, and the allowed search layers
  - src/shared/error-mapping.ts — read for the 503 and 500 terminal envelopes, the database-unavailable detection and the MCP isError rendering the mapper composes with
  - src/middleware/error-handler.ts — read to learn what REST answers when a route lets a validation failure or an unmapped error propagate
  - src/mcp/sdk-http-transport.ts — read to learn how the query transport answers a tool name it does not expose, and how it renders an envelope
  - src/modules/knowledge-graph/traversal/config.ts — read for the depth bounds, the default depth and the per-hop decay the DTOs and index import
  - src/modules/knowledge-graph/service (grep only, not read whole) — searched to confirm which sentinels the knowledge-graph services throw from each operation
---

## Facts

### Every read, on both transports
- Every operation in this area runs its read inside a read-only database transaction, on REST and on MCP alike. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`withReadOnly`); `src/modules/knowledge-graph/mcp/query-toolset.ts` (`makeHandler`).
- REST and MCP call the same service function for each operation. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`registerKnowledgeGraphRoutes`); `src/modules/knowledge-graph/mcp/query-toolset.ts` (`registerQueryToolset`).
- A REST success answers HTTP 200 with the body `{ ok: true, result }`, where `result` is what the service returned. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`reply.status(200).send`).
- An MCP success answers `{ ok: true, result }`, where `result` is what the service returned. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`makeHandler`).
- A failure is `{ ok: false, error: { code, message, details } }`. `details` may be missing. `src/modules/knowledge-graph/mcp/error-envelope.ts` (`mapErrorToHttpResponse`).
- On MCP a failure is the same envelope with no HTTP status. `src/modules/knowledge-graph/mcp/error-envelope.ts` (`mapErrorToEnvelope`).
- On MCP every thrown value becomes a failure envelope, so a tool call never ends without an answer. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`makeHandler` catch).
- An unclassified failure never passes its own message to the caller. `src/modules/knowledge-graph/mcp/error-envelope.ts` (`internalError` branch).
- A validation refusal lists each problem as `{ path, message }`, with `path` written as dot-joined segments. `src/modules/knowledge-graph/mcp/error-envelope.ts` (`ZodError` branch).

### Parameter formats shared by the reads
- The identifiers `node_id`, `link_id` and `attribute_id` must be in UUID format. `src/modules/knowledge-graph/dto/queries.dto.ts` (`NodeIdParamSchema`, `LinkIdParamSchema`, `AttributeIdParamSchema`).
- A boolean parameter accepts a JSON boolean or exactly the strings `"true"` or `"false"`. Any other spelling is refused. `src/modules/knowledge-graph/dto/queries.dto.ts` (`BooleanQuery`).
- An integer parameter accepts a number or a numeric string. A string that is not a finite integer is refused with the message "must be an integer". `src/modules/knowledge-graph/dto/queries.dto.ts` (`IntegerQuery`).
- An empty or blank string given as an integer parameter is read as 0. `src/modules/knowledge-graph/dto/queries.dto.ts` (`IntegerQuery`, `Number(v)`).
- A reference date `as_of` must match `YYYY-MM-DD` and is otherwise refused with the message "must be YYYY-MM-DD". Only the pattern is checked, not whether the calendar date exists. `src/modules/knowledge-graph/dto/queries.dto.ts` (`IsoDateOnly`).
- The REST query parameters of listing link types, listing attribute keys, listing nodes, reading a node and traversing are closed sets. An unknown parameter is refused. `src/modules/knowledge-graph/dto/queries.dto.ts` (`.strict()` on each query schema).
- Every MCP tool input is a closed object. An unknown property is refused. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`.strict()` on each input schema).
- A MCP tool input merges the REST path identifier and the query parameters into one object. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`GetNodeInputSchema`, `TraverseInputSchema`).

### Listing node types (`GET /node-types`, tool `list_node_types`)
- The REST operation reads no query parameters. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`app.get("/node-types")`).
- The MCP tool accepts only an empty object. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`ListNodeTypesInputSchema`).
- The answer is `{ total, items }`. Each node type has `id` (UUID), `name`, `description` and `version` (integer, at least 1). `total` is a non-negative integer. `src/modules/knowledge-graph/dto/catalog.dto.ts` (`NodeTypeListResponseSchema`, `NodeTypeResponseSchema`).

### Listing link types (`GET /link-types`, tool `list_link_types`)
- `include_rules` is an optional boolean that defaults to false. `src/modules/knowledge-graph/dto/queries.dto.ts` (`ListLinkTypesQuerySchema`).
- The answer is `{ total, items }`. Each link type has `id`, `name`, `label`, `description`, `inverse_name`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `requires_valid_to_on_change`, `version` (integer, at least 1), and optionally `rules`. `src/modules/knowledge-graph/dto/catalog.dto.ts` (`LinkTypeResponseSchema`).
- Each link-type rule has `id`, `source_node_type` and `target_node_type` (node-type names), plus `valid_from` and `valid_to` as `YYYY-MM-DD` or null. `src/modules/knowledge-graph/dto/catalog.dto.ts` (`LinkTypeRuleResponseSchema`).

### Listing attribute keys (`GET /attribute-keys`, tool `list_attribute_keys`)
- `node_type` is an optional filter of 1 to 200 characters. `src/modules/knowledge-graph/dto/queries.dto.ts` (`ListAttributeKeysQuerySchema`).
- The operation receives the catalog snapshot, and a node-type filter the catalog does not hold is refused. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/attribute-keys` catch of `UnknownNodeTypeError`); `src/modules/knowledge-graph/mcp/query-toolset.ts` (`list_attribute_keys`).
- The answer is `{ total, items }`. Each attribute key has `id`, `node_type`, `key`, `value_type`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `description`, `version` (integer, at least 1), and optionally `valid_values` (a list of strings). `src/modules/knowledge-graph/dto/catalog.dto.ts` (`AttributeKeyResponseSchema`).

### Listing nodes (`GET /nodes`, tool `list_nodes`)
- The optional filters are `node_type` (1 to 200 characters), `name_prefix` (1 to 200 characters) and `status` (a node status). `src/modules/knowledge-graph/dto/queries.dto.ts` (`ListNodesQuerySchema`).
- `limit` is an integer from 1 to 100 that defaults to 20. `src/modules/knowledge-graph/dto/queries.dto.ts` (`ListNodesQuerySchema.limit`).
- `offset` is an integer of at least 0 that defaults to 0. `src/modules/knowledge-graph/dto/queries.dto.ts` (`ListNodesQuerySchema.offset`).
- A node-type filter the catalog does not hold is refused. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/nodes` catch of `UnknownNodeTypeError`).
- The answer is `{ total, limit, offset, items }`, with each item a node summary. `src/modules/knowledge-graph/dto/node.dto.ts` (`NodeListResponseSchema`).
- A node summary has `id`, `node_type` (the type name), `canonical_name`, `status`, and `merged_into_node_id` (UUID or null). `src/modules/knowledge-graph/dto/node.dto.ts` (`NodeSummaryResponseSchema`).

### Reading a node (`GET /nodes/:node_id`, tool `get_node`)
- It takes `node_id` (UUID) and the optional `as_of` (date). `in_effect_only` defaults to false and `include_uncertain` defaults to true. `src/modules/knowledge-graph/dto/queries.dto.ts` (`GetNodeByIdQuerySchema`); `src/modules/knowledge-graph/mcp/query-toolset.ts` (`GetNodeInputSchema`).
- On REST the path identifier is checked before the query parameters. When both are invalid, only the identifier's problems are reported. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/nodes/:node_id`, `NodeIdParamSchema.parse` then `GetNodeByIdQuerySchema.parse`).
- On MCP the identifier and the options are checked in one parse, and every problem is reported together. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`makeHandler`, `schema.parse`).
- The answer is `{ node, aliases, attributes }`: a node summary, the node aliases, and attribute details. `src/modules/knowledge-graph/dto/node.dto.ts` (`NodeDetailResponseSchema`).
- A node alias has `id`, `alias`, `kind` (an alias kind) and `created_at` (a datetime with offset). `src/modules/knowledge-graph/dto/node.dto.ts` (`NodeAliasResponseSchema`).

### Reading a link (`GET /links/:link_id`, REST only)
- It takes `link_id` (UUID) and answers a link detail. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/links/:link_id`).
- A link detail has `id`, `source_node_id`, `target_node_id`, `link_type` (name), `link_inverse_name`, `valid_from` and `valid_to` (`YYYY-MM-DD`, null or missing), `recorded_at` (a datetime with offset), `superseded_at` (a datetime with offset, null or missing), `status` (an assertion status), `effective_status`, `is_current`, `is_in_effect`, `confidence` (0 to 1), `valid_from_source` (a valid-from basis, null or missing), `flags` (assertion flags, defaulting to an empty list), `supersedes_link_id` (UUID, null or missing) and `provenance`. `src/modules/knowledge-graph/dto/link.dto.ts` (`LinkDetailResponseSchema`).

### Reading an attribute (`GET /attributes/:attribute_id`, REST only)
- It takes `attribute_id` (UUID) and answers an attribute detail. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/attributes/:attribute_id`).
- An attribute detail has `id`, `node_id`, `attribute_key` (key name), `value_type`, `value` (text), `valid_from` and `valid_to` (`YYYY-MM-DD`, null or missing), `recorded_at`, `superseded_at`, `status`, `effective_status`, `is_current`, `is_in_effect`, `confidence` (0 to 1), `valid_from_source`, `flags` (defaulting to an empty list), `supersedes_attribute_id` and `provenance`. `src/modules/knowledge-graph/dto/attribute.dto.ts` (`AttributeDetailResponseSchema`).

### Provenance entries in a link or attribute
- A provenance entry always has `fragment_id` (UUID) and `fragment_text`. It may also have `confidence` (0 to 1), `raw_information_id`, `source_type`, `received_at` (a datetime with offset) and `excerpt`. `src/modules/knowledge-graph/dto/provenance.dto.ts` (`ProvenanceEntryResponseSchema`).

### Traversing from a node (`GET /nodes/:node_id/traverse`, tool `traverse`)
- It takes `node_id` (UUID). `direction` is one of `out`, `in` or `both` and defaults to `both`. `depth` defaults to 1. `as_of` is optional. `in_effect_only` defaults to false. `src/modules/knowledge-graph/dto/queries.dto.ts` (`TraverseQuerySchema`).
- `link_types` may be one name or a repeated parameter and is always read as a list. An empty name in it is refused. `src/modules/knowledge-graph/dto/queries.dto.ts` (`LinkTypesArray`).
- At the validation layer `depth` accepts any finite number or numeric string. A string that is not numeric is refused with "must be an integer". `src/modules/knowledge-graph/dto/queries.dto.ts` (`TraverseDepthCoercer`).
- A `depth` outside 1 to 3 gets past the schema and is refused afterwards by the service. `src/modules/knowledge-graph/dto/queries.dto.ts` (`TRAVERSAL_DEPTH_BOUNDS`); `src/modules/knowledge-graph/mcp/error-envelope.ts` (`InvalidTraverseDepthError` branch).
- On REST the path identifier is checked first, then the query parameters, then (in the service) the depth range, whether the link types are known, and whether the starting node exists. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/nodes/:node_id/traverse`).
- The operation receives the catalog snapshot. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`traverseNodeService(client, deps.catalog, …)`).
- The answer is `{ starting_node_id, nodes, links }`. `nodes` holds node summaries. Each link is a link detail plus `hop` (integer, 1 to 3) and `score` (0 to 1). `src/modules/knowledge-graph/dto/traversal.dto.ts` (`TraversalResultResponseSchema`, `TraversalLinkResponseSchema`).
- The module publishes the traversal depth bounds (1 to 3), the default depth (1) and a per-hop decay of 0.5 as its traversal contract. `src/modules/knowledge-graph/index.ts` (`TRAVERSAL_DECAY`, `TRAVERSAL_DEPTH_*` re-export).

### Link history (`GET /links/:link_id/history`, tool `get_history_link`)
- It takes `link_id` (UUID) and answers `{ versions }`, where each version is a full link detail. `src/modules/knowledge-graph/dto/history.dto.ts` (`LinkHistoryResponseSchema`); `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/links/:link_id/history`).

### Attribute history (`GET /attributes/:attribute_id/history`, tool `get_history_attribute`)
- It takes `attribute_id` (UUID) and answers `{ versions }`, where each version is a full attribute detail. `src/modules/knowledge-graph/dto/history.dto.ts` (`AttributeHistoryResponseSchema`); `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/attributes/:attribute_id/history`).

### History of one node's attribute key (`GET /nodes/:node_id/attributes/:key/history`, tool `get_history_attribute_key`)
- It takes `node_id` (UUID) and `key` (1 to 200 characters). `src/modules/knowledge-graph/dto/queries.dto.ts` (`NodeIdKeyParamSchema`).
- The operation receives the catalog snapshot. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`get_history_attribute_key`).

### The MCP `query` toolset
- The toolset registers nine tools under the `query` key: `get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types` and `list_attribute_keys`. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`QUERY_TOOL_NAMES`).
- The query endpoint exposes only the tool names it was given that are registered under `query`. `src/modules/knowledge-graph/mcp/query-transport.ts` (`getTools`).
- Each tool advertises a description and an input JSON Schema derived from the same schema that validates it at run time. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`QueryToolInputJsonSchemas`).

## Answers
- Any REST operation in this area — a path or query parameter fails validation (format, bound, closed value, unknown parameter, non-integer) → 422 `VALIDATION_INVALID_FORMAT` (message "Request payload failed validation.", details a list of `{ path, message }`). `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`*.parse` outside the `try`).
- Any MCP tool of the `query` toolset — the input fails validation → isError `VALIDATION_INVALID_FORMAT` (message "Request payload failed validation.", details a list of `{ path, message }`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`ZodError` branch).
- Listing attribute keys — `node_type` is not in the catalog → 422 `BUSINESS_UNKNOWN_NODE_TYPE` (details `{ node_type }`). `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/attribute-keys` catch); `src/modules/knowledge-graph/mcp/error-envelope.ts` (`UnknownNodeTypeError` branch).
- Listing nodes — `node_type` is not in the catalog → 422 `BUSINESS_UNKNOWN_NODE_TYPE` (details `{ node_type }`). `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`/nodes` catch); `src/modules/knowledge-graph/mcp/error-envelope.ts` (`UnknownNodeTypeError` branch).
- Reading a node, traversing, attribute-key history — the node does not exist → 404 `RESOURCE_NOT_FOUND` (details `{ entity, id }`; on REST also the route's `node_id`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`ResourceNotFoundError` branch); `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`handleReadError`, `handleTraversalError`, `handleAttributeKeyHistoryError`).
- Reading a node, traversing, attribute-key history — the node is deleted → 410 `BUSINESS_NODE_DELETED` (details `{ node_id }`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`NodeDeletedError` branch).
- Reading a link, link history — the link does not exist → 404 `RESOURCE_NOT_FOUND` (details `{ entity, id }`; on REST also `link_id`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`ResourceNotFoundError` branch); `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`handleReadError`).
- Reading an attribute, attribute history — the attribute does not exist → 404 `RESOURCE_NOT_FOUND` (details `{ entity, id }`; on REST also `attribute_id`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`ResourceNotFoundError` branch); `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`handleReadError`).
- Traversing — a name in `link_types` is not in the catalog → 422 `BUSINESS_UNKNOWN_LINK_TYPE` (details `{ link_type }`; on REST also `node_id`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`UnknownLinkTypeError` branch).
- Traversing — `depth` is outside 1 to 3 → 422 `BUSINESS_INVALID_TRAVERSE_DEPTH` (details `{ depth, max }`; on REST also `node_id`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`InvalidTraverseDepthError` branch).
- Attribute-key history — the node's type has no such key → 404 `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` (details `{ node_type, key }`; on REST also `node_id` and `key`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`UnknownAttributeKeyError` branch).
- Any operation in this area — the database is unreachable, the connection fails or a statement times out → 503 `SYSTEM_SERVICE_UNAVAILABLE` (message "A backing service is temporarily unavailable."). On REST the route rethrows it to the global handler. `src/modules/knowledge-graph/mcp/error-envelope.ts` (`isPgUnavailable` branch); `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`isMappableServiceError` rethrow).
- Any operation in this area — any other failure → 500 `SYSTEM_INTERNAL_ERROR` (message "Internal server error.", no details). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`internalError` branch).
- Any MCP tool — any failure → a tool result with `isError: true` whose text content is the JSON of `{ code, message, details }`. `src/modules/knowledge-graph/mcp/query-transport.ts` (`mountMcpEndpoint`).
- MCP query endpoint — a tool name that is not exposed → isError `NOT_FOUND` ("Tool '<name>' is not available on this endpoint."). `src/modules/knowledge-graph/mcp/query-transport.ts` (`mountMcpEndpoint`).
- A query-retrieval read mapped here — the search query is invalid → 422 `BUSINESS_INVALID_SEARCH_QUERY` (details as raised). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`InvalidSearchQueryError` branch).
- A query-retrieval read mapped here — a search layer is outside the allowed set → 422 `BUSINESS_INVALID_SEARCH_LAYER` (details `{ invalid, allowed }`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`InvalidSearchLayerError` branch).
- A query-retrieval read mapped here — the fragment is not accepted → 404 `BUSINESS_FRAGMENT_NOT_ACCEPTED` (details `{ fragment_id, status }`). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`FragmentNotAcceptedError` branch).
- A query-retrieval read mapped here — the underlying raw information was removed by a compliance deletion → 410 `BUSINESS_RAW_INFORMATION_DELETED` (details `{ raw_information_id, deleted_at }` as an ISO timestamp). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`RawInformationDeletedError` branch).
- A query-retrieval read mapped here — the provenance chain is empty → 500 `SYSTEM_INTERNAL_ERROR` (message "Internal server error.", no details). `src/modules/knowledge-graph/mcp/error-envelope.ts` (`EmptyProvenanceError` branch).

## Vocabularies
- Node status: `active`, `needs_review`, `merged`, `deleted`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`NodeStatusSchema`).
- Assertion status: `active`, `uncertain`, `disputed`, `superseded`, `deleted`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`AssertionStatusSchema`).
- Effective status: `active`, `uncertain`, `disputed`, `superseded`, `deleted`, `inactive`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`EffectiveStatusSchema`).
- Assertion flag: `uncertain`, `disputed`, `low_confidence`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`AssertionFlagSchema`).
- Valid-from basis: `stated`, `document`, `received`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`ValidFromSourceSchema`).
- Value type: `date`, `number`, `text`, `bool`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`AttributeValueTypeSchema`).
- Alias kind: `canonical`, `alias`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`AliasKindSchema`).
- Source type: `pdf`, `email`, `ata`, `chat`, `artigo`, `transcricao`, `outro`. `src/modules/knowledge-graph/dto/enums.dto.ts` (`SourceTypeSchema`).
- Traversal direction: `out`, `in`, `both`. `src/modules/knowledge-graph/dto/queries.dto.ts` (`TraverseDirectionSchema`).
- Boolean parameter strings: `true`, `false`. `src/modules/knowledge-graph/dto/queries.dto.ts` (`BooleanQuery`).
- Query tool names: `get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types`, `list_attribute_keys`. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`QUERY_TOOL_NAMES`).
- Allowed search layers reported in a layer refusal: `fragment`, `node`, `chunk`. `src/modules/knowledge-graph/mcp/error-envelope.ts` (`InvalidSearchLayerError` branch, `err.allowed`).

## Upstream artifacts
- The catalog snapshot (node types, link types, link-type rules, attribute keys), built by the catalog module, is handed to listing nodes, listing attribute keys, traversing and attribute-key history. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`deps.catalog`); `src/modules/knowledge-graph/mcp/query-toolset.ts` (`QueryToolsetDeps.catalog`).
- The refusal classes of the query-retrieval module are classified by this module's mapper. `src/modules/knowledge-graph/mcp/error-envelope.ts` (imports from `query-retrieval/service/errors.js`).
- The 503 and 500 terminal envelopes and the database-unavailable detection come from the shared error-mapping module. `src/modules/knowledge-graph/mcp/error-envelope.ts` (`internalError`, `serviceUnavailableError`, `isPgUnavailable`).
- The shared MCP kernel renders every envelope as an MCP tool result. `src/modules/knowledge-graph/mcp/query-transport.ts` (`mountMcpEndpoint`).
- The shared in-process tool registry holds the `query` tools that this module registers and the transport reads. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`mcp.registerTool("query", …)`); `src/modules/knowledge-graph/mcp/query-transport.ts` (`deps.mcp.getTool`).
- The traversal service and its bounds and decay are exported for the query-retrieval module to use. `src/modules/knowledge-graph/index.ts` (`traverseNodes`, `TRAVERSAL_DECAY`).

## Outside the domain
- REST route paths and their mount under the API prefix are a transport choice. The fact lines name them only as handles. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts`.
- The MCP endpoint path `/mcp/query`, server name `remember-bff-query` and version `0.1.0` are transport identity. `src/modules/knowledge-graph/mcp/query-transport.ts`.
- The JSON Schema derivation option `unrepresentable: "any"` and pinning the schemas at module start are tooling. `src/modules/knowledge-graph/mcp/query-toolset.ts`.
- The wording of the tool descriptions is advertised text and is not taken as evidence of behavior. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`QueryToolDescriptions`).
- The log events `knowledge_graph_list_nodes_ok`, `knowledge_graph_traverse_ok` and `query_toolset_registered`, their fields, the child logger and the log levels are observability. `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts`; `src/modules/knowledge-graph/mcp/query-toolset.ts`; `src/modules/knowledge-graph/mcp/error-envelope.ts`.
- A second registration throwing on duplicate tools is wiring. `src/modules/knowledge-graph/mcp/query-toolset.ts` (`registerQueryToolset`).
- The module's public exports (`registerKnowledgeGraphRoutes`, `buildSnapshot`, `loadCatalog`, `attributeKeyCacheKey`, `applyTemporalFilter` and the type exports) are module wiring. `src/modules/knowledge-graph/index.ts`.
- Handler factory and helper names (`makeHandler`, `handleReadError`, `isMappableServiceError`, `withReadOnly`) are internal. `src/modules/knowledge-graph/mcp/query-toolset.ts`; `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts`.
- Response schemas are declared in the DTO files, but no route in the area passes its answer through them. The shapes above are the declared ones. `src/modules/knowledge-graph/dto/*.dto.ts`.

## Observed and not decided here
- The same refusal carries different `details` on each transport. REST adds the route's identifiers: `mapErrorToHttpResponse(err, details)` with `{ node_id }`, `{ link_id }`, `{ attribute_id }` or `{ node_id, key }` in `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts` (`handleReadError`, `handleTraversalError`, `handleAttributeKeyHistoryError`). MCP adds nothing: `mapErrorToEnvelope(err)` with no extra details in `src/modules/knowledge-graph/mcp/query-toolset.ts` (`makeHandler`).
- Unknown parameters on listing node types. REST `GET /node-types` parses no query and ignores anything it is sent (`app.get("/node-types")` in `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts`). MCP `list_node_types` refuses any property with `VALIDATION_INVALID_FORMAT` (`z.object({}).strict()` in `src/modules/knowledge-graph/mcp/query-toolset.ts`, `ListNodeTypesInputSchema`).
- Point reads of a link and of an attribute exist on REST only. REST has `GET /links/:link_id` and `GET /attributes/:attribute_id` in `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts`. The MCP `query` toolset has no tool for either (`QUERY_TOOL_NAMES` in `src/modules/knowledge-graph/mcp/query-toolset.ts`).
- Integer parameters are checked differently. `limit` and `offset` refuse a non-integer with "must be an integer" (`IntegerQuery`, `Number.isInteger` in `src/modules/knowledge-graph/dto/queries.dto.ts`). `depth`, under the same message, checks only that the number is finite, so a value like `2.5` passes validation (`TraverseDepthCoercer`, `Number.isFinite` in `src/modules/knowledge-graph/dto/queries.dto.ts`). Meanwhile each traversal link's `hop` is declared an integer (`TraversalLinkResponseSchema` in `src/modules/knowledge-graph/dto/traversal.dto.ts`).
