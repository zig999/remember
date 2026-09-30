---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/knowledge-graph/service/attribute.service.ts
  - src/modules/knowledge-graph/service/catalog.service.ts
  - src/modules/knowledge-graph/service/errors.ts
  - src/modules/knowledge-graph/service/formatters.ts
  - src/modules/knowledge-graph/service/history.service.ts
  - src/modules/knowledge-graph/service/link.service.ts
  - src/modules/knowledge-graph/service/node.service.ts
  - src/modules/knowledge-graph/service/norm.ts
  - src/modules/knowledge-graph/service/traversal.service.ts
  - src/modules/knowledge-graph/traversal/config.ts
read_outside_area:
  - "src/shared/invariant-error.ts, opened to see what the formatters throw on an out-of-vocabulary stored value (a bare Error subclass with no status or code)"
  - "src/modules/knowledge-graph/routes/knowledge-graph.routes.ts, searched to see which service errors the route layer passes to the shared mapper and which it rethrows"
---

## Facts

### Catalog — node types listing
- The node-type listing returns `total` and `items`. `total` is the number of items returned, and the listing is not paginated. `src/modules/knowledge-graph/service/catalog.service.ts` (`listNodeTypesService`).
- Each node-type item carries `id`, `name`, `description` and `version`. `src/modules/knowledge-graph/service/catalog.service.ts` (`listNodeTypesService`).

### Catalog — link types listing
- The link-type listing returns `total` and `items`. `total` is the number of link types returned, and the listing is not paginated. `src/modules/knowledge-graph/service/catalog.service.ts` (`listLinkTypesService`).
- Each link-type item carries `id`, `name`, `label`, `description`, `inverse_name`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `requires_valid_to_on_change` and `version`. `src/modules/knowledge-graph/service/catalog.service.ts` (`listLinkTypesService`).
- When `include_rules` is true, each link-type item also carries `rules`: the link-type rules of that link type, or an empty list when it has none. When `include_rules` is false, the `rules` key is absent. `src/modules/knowledge-graph/service/catalog.service.ts` (`listLinkTypesService`, `rulesByLinkType === null`).
- Each link-type rule carries `id`, `source_node_type`, `target_node_type`, `valid_from` and `valid_to`. Each date is rendered as `YYYY-MM-DD` from its UTC components, or `null` when absent. `src/modules/knowledge-graph/service/catalog.service.ts` (`LinkTypeRuleResponse` mapping, `formatDate`).

### Catalog — attribute keys listing
- The attribute-key listing accepts an optional `node_type` filter, given as a node-type name. `src/modules/knowledge-graph/service/catalog.service.ts` (`listAttributeKeysService`, `options.node_type`).
- An unknown `node_type` filter is refused before any stored row is read. The name is looked up in the loaded catalog. `src/modules/knowledge-graph/service/catalog.service.ts` (`catalog.nodeTypeByName.get`, `throw new UnknownNodeTypeError`).
- The `node_type` filter narrows both the attribute keys and their allowed values to that node type. `src/modules/knowledge-graph/service/catalog.service.ts` (`listAttributeKeys`, `listAttributeValidValues` with `node_type_id`).
- The listing returns `total` (the number of keys returned) and `items`. It is not paginated. `src/modules/knowledge-graph/service/catalog.service.ts` (`listAttributeKeysService`).
- Each attribute-key item carries `id`, `node_type`, `key`, `value_type`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `description` and `version`. `src/modules/knowledge-graph/service/catalog.service.ts` (`listAttributeKeysService`, `base`).
- An attribute key with at least one allowed value carries `valid_values`: its allowed values sorted ascending by default string order. A key with no allowed value has no `valid_values` key. `src/modules/knowledge-graph/service/catalog.service.ts` (`valuesByKeyId`, `[...values].sort()`).

### Knowledge node — listing
- The node listing accepts `node_type` (a node-type name), `name_prefix`, `status`, `limit` and `offset`. `src/modules/knowledge-graph/service/node.service.ts` (`ListNodesInput`).
- An unknown `node_type` is refused before any stored row is read. The name is looked up in the loaded catalog. `src/modules/knowledge-graph/service/node.service.ts` (`listNodesService`, `catalog.nodeTypeByName.get`).
- When `status` is omitted, the listing filters on node status `active`. `src/modules/knowledge-graph/service/node.service.ts` (`input.status ?? "active"`).
- `name_prefix` is put through the name normalization before it is used as a prefix filter. `src/modules/knowledge-graph/service/node.service.ts` (`norm(input.name_prefix)`).
- The listing answers `total` (from the repository count), the `limit` and `offset` the caller sent, and `items` as node summaries. `src/modules/knowledge-graph/service/node.service.ts` (`listNodesService` return).

### Knowledge node — detail
- A knowledge node that does not exist is refused as not found. `src/modules/knowledge-graph/service/node.service.ts` (`getNodeByIdService`, `node === null`).
- A deleted knowledge node is refused as deleted. The absence check runs first, then the deletion check. `src/modules/knowledge-graph/service/node.service.ts` (`getNodeByIdService`, `node.status === "deleted"`).
- A merged knowledge node is answered normally, carrying `merged_into_node_id`. Nothing redirects to the survivor. `src/modules/knowledge-graph/service/node.service.ts` (`getNodeByIdService`).
- The detail answers `node` (a node summary), `aliases` (the node's aliases) and `attributes` (node attributes, each carrying its own provenance). `src/modules/knowledge-graph/service/node.service.ts` (`getNodeByIdService` return).
- The node's attributes are selected by the caller's `asOf`, `inEffectOnly` and `includeUncertain`. `src/modules/knowledge-graph/service/node.service.ts` (`GetNodeByIdInput`, `listAttributesByNodeId`).
- A non-deleted attribute with no provenance is still answered, with an empty `provenance` list. The caller gets no error. `src/modules/knowledge-graph/service/node.service.ts` (`warnIfEmptyProvenance`, `?? []`).

### Node attribute — detail
- A node attribute that does not exist is refused as not found, naming `NodeAttribute`. `src/modules/knowledge-graph/service/attribute.service.ts` (`getAttributeByIdService`).
- A deleted node attribute is answered normally, with no refusal. `src/modules/knowledge-graph/service/attribute.service.ts` (`getAttributeByIdService`).
- A non-deleted node attribute with no provenance is answered with an empty `provenance` list. `src/modules/knowledge-graph/service/attribute.service.ts` (`provenance.length === 0`).

### Knowledge link — detail
- A knowledge link that does not exist is refused as not found, naming `KnowledgeLink`. `src/modules/knowledge-graph/service/link.service.ts` (`getLinkByIdService`).
- A deleted knowledge link is answered normally, with no refusal. `src/modules/knowledge-graph/service/link.service.ts` (`getLinkByIdService`).
- A non-deleted knowledge link with no provenance is answered with an empty `provenance` list. `src/modules/knowledge-graph/service/link.service.ts` (`link.status !== "deleted" && provenance.length === 0`).

### Lineage history
- Link history answers `{ versions }`: every version in the link's lineage chain as a link detail, each carrying its own provenance. `src/modules/knowledge-graph/service/history.service.ts` (`getLinkHistoryService`, `assembleLinkHistory`).
- Link history for a link that does not exist is refused as not found, naming `KnowledgeLink`. `src/modules/knowledge-graph/service/history.service.ts` (`walkLinkHistory` returns `null`).
- Attribute history anchored on one attribute answers `{ versions }` as attribute details, each carrying its own provenance. `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeHistoryService`, `assembleAttributeHistory`).
- Attribute history for an attribute that does not exist is refused as not found, naming `NodeAttribute`. `src/modules/knowledge-graph/service/history.service.ts` (`walkAttributeHistory` returns `null`).
- Attribute-key history for a node and a key checks in this order: the node exists, the node is not deleted, then the key is registered for the node's node type. `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeKeyHistoryService`).
- A merged node is not refused by attribute-key history. `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeKeyHistoryService`).
- The key is resolved against the node's own node type. `src/modules/knowledge-graph/service/history.service.ts` (`attributeKeyCacheKey(node.node_type_id, input.key)`).
- A registered key with no attributes on the node answers `{ versions: [] }`, not a refusal. `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeKeyHistoryService`, `listAttributeHistoryByNodeKey`).
- A non-deleted version with no provenance is answered with an empty `provenance` list. `src/modules/knowledge-graph/service/history.service.ts` (`assembleLinkHistory`, `assembleAttributeHistory`).

### Response shapes
- A node summary carries `id`, `node_type`, `canonical_name`, `status` and `merged_into_node_id`. `src/modules/knowledge-graph/service/formatters.ts` (`toNodeSummary`).
- A node alias carries `id`, `alias`, `kind` and `created_at`. `src/modules/knowledge-graph/service/formatters.ts` (`toNodeAlias`).
- An attribute detail carries `id`, `node_id`, `attribute_key`, `value_type`, `value`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `effective_status`, `is_current`, `is_in_effect`, `confidence`, `valid_from_source`, `flags`, `supersedes_attribute_id` and `provenance`. `src/modules/knowledge-graph/service/formatters.ts` (`toAttributeDetail`).
- A link detail carries `id`, `source_node_id`, `target_node_id`, `link_type`, `link_inverse_name`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `effective_status`, `is_current`, `is_in_effect`, `confidence`, `valid_from_source`, `flags`, `supersedes_link_id` and `provenance`. `src/modules/knowledge-graph/service/formatters.ts` (`toLinkDetail`).
- A provenance entry carries `fragment_id`, `fragment_text`, `confidence` (the fragment's confidence), `raw_information_id`, `source_type`, `received_at` and `excerpt`. `src/modules/knowledge-graph/service/formatters.ts` (`toProvenanceEntry`).
- Provenance entries are grouped per link or attribute and keep the order in which they were read. `src/modules/knowledge-graph/service/formatters.ts` (`groupProvenance`).
- Validity dates (`valid_from`, `valid_to`) are rendered as `YYYY-MM-DD` from UTC components, or `null`. A stored string starting with `YYYY-MM-DD` is cut to that prefix. Any other string is passed through unchanged. `src/modules/knowledge-graph/service/formatters.ts` (`formatDateOnly`).
- Timestamps are rendered as ISO 8601 in UTC. A value that is already a string is passed through unchanged. `src/modules/knowledge-graph/service/formatters.ts` (`formatTimestamptz`).
- A missing `recorded_at`, `created_at` or `received_at` is answered as `1970-01-01T00:00:00.000Z`. A missing `superseded_at` is answered as `null`. `src/modules/knowledge-graph/service/formatters.ts` (`?? new Date(0).toISOString()`).
- `confidence` is answered as a number. `src/modules/knowledge-graph/service/formatters.ts` (`toNumber`).
- The assertion flags follow the assertion status. Status `uncertain` gives `["uncertain"]`, status `disputed` gives `["disputed"]`, and any other status gives `[]`. No flag is derived from confidence. `src/modules/knowledge-graph/service/formatters.ts` (`deriveFlags`).
- A stored assertion status, effective status or source type outside its closed vocabulary makes the read fail instead of being answered. `src/modules/knowledge-graph/service/formatters.ts` (`toAssertionStatus`, `toEffectiveStatus`, `toSourceType`).

### Name normalization
- The name normalization trims the input, decomposes it (NFD) and removes combining marks U+0300 to U+036F. It then collapses every whitespace run to one space and lowercases, in that order. `src/modules/knowledge-graph/service/norm.ts` (`norm`, `stripDiacritics`, `collapseSpaces`).

### Graph expansion (traversal)
- The depth must be an integer from 1 to 3 inclusive. `src/modules/knowledge-graph/traversal/config.ts` (`TRAVERSAL_DEPTH_MIN`, `TRAVERSAL_DEPTH_MAX`); `src/modules/knowledge-graph/service/traversal.service.ts` (`assertDepth`).
- The default depth is 1. `src/modules/knowledge-graph/traversal/config.ts` (`TRAVERSAL_DEPTH_DEFAULT`).
- A link reached at hop h scores `0.5 ** h`. `src/modules/knowledge-graph/traversal/config.ts` (`TRAVERSAL_DECAY`); `src/modules/knowledge-graph/service/traversal.service.ts` (`Math.pow(TRAVERSAL_DECAY, hop)`).
- Traversal checks in this order: the depth, then each named link type in the order given (the first unknown one is refused), then that the starting node exists, then that it is not deleted. `src/modules/knowledge-graph/service/traversal.service.ts` (`traverseNodeService`).
- An empty or absent `link_types` list places no restriction on link types. `src/modules/knowledge-graph/service/traversal.service.ts` (`resolveLinkTypeIds`, `names.length === 0`).
- Traversal accepts direction `out`, `in` or `both`. `both` fetches the outbound links, then the inbound links, at each hop. `src/modules/knowledge-graph/service/traversal.service.ts` (`TraverseInput.direction`, `traverseNodes`).
- A merged starting node is replaced by its survivor when the survivor exists and is not deleted. `starting_node_id` in the answer is the node actually used. `src/modules/knowledge-graph/service/traversal.service.ts` (`startingResolved`).
- The validity view (`asOf`) and `inEffectOnly` are applied to every hop's link fetch. `src/modules/knowledge-graph/service/traversal.service.ts` (`fetchTraversalHop` arguments).
- Expansion stops before the requested depth when a hop has no node to expand or yields no link. `src/modules/knowledge-graph/service/traversal.service.ts` (`frontier.length === 0`, `hopLinks.length === 0`).
- Each link appears once, carrying the hop at which it was first reached and that hop's score. `src/modules/knowledge-graph/service/traversal.service.ts` (`linksById.has(row.id)`).
- A merged link endpoint is replaced in the link's `source_node_id` / `target_node_id` by the node it was merged into. The replacement happens whatever that node's status is. `src/modules/knowledge-graph/service/traversal.service.ts` (`buildMergedSubstitution`, `substitutedRow`).
- A link whose two endpoints become the same node only through that replacement is dropped. A link that was a self-loop as stored is kept. `src/modules/knowledge-graph/service/traversal.service.ts` (`isSubstitutionInducedSelfLoop`).
- A reached node is expanded at the next hop only if it has not been visited, was found, and is neither deleted nor merged. `src/modules/knowledge-graph/service/traversal.service.ts` (`nextFrontier`).
- `nodes` lists every visited node that was found, except merged nodes. This includes the starting node and deleted nodes reached as link endpoints. `src/modules/knowledge-graph/service/traversal.service.ts` (`finalNodes`).
- `nodes` are ordered by first visit, starting nodes first. `links` are ordered by first encounter, and within a hop outbound links come before inbound ones. `src/modules/knowledge-graph/service/traversal.service.ts` (`visitedNodeIds`, `linksById` insertion order).
- Each traversal link carries every link-detail field, plus `hop`, `score` and its own provenance. `src/modules/knowledge-graph/service/traversal.service.ts` (`linksById.set`, `finalLinks`).
- The traversal answer is `starting_node_id`, `nodes` (node summaries) and `links`. `src/modules/knowledge-graph/service/traversal.service.ts` (`traverseNodeService` return).
- The multi-start expansion entry point also refuses an out-of-range depth. It takes link types that are already resolved and does not refuse deleted or merged starting nodes. `src/modules/knowledge-graph/service/traversal.service.ts` (`traverseNodes`, `assertDepth`).

## Answers
- get node, attribute-key history, traverse — the knowledge node (for traversal, the starting node) does not exist → 404 `RESOURCE_NOT_FOUND` (entity `KnowledgeNode`, the id; message `KnowledgeNode <id> not found.`). `src/modules/knowledge-graph/service/errors.ts` (`ResourceNotFoundError`); `src/modules/knowledge-graph/service/node.service.ts` (`getNodeByIdService`); `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeKeyHistoryService`); `src/modules/knowledge-graph/service/traversal.service.ts` (`traverseNodeService`).
- get node, attribute-key history, traverse — the knowledge node (for traversal, the starting node) is deleted → 410 `BUSINESS_NODE_DELETED` (the node id; message `KnowledgeNode <id> is marked as deleted.`). `src/modules/knowledge-graph/service/errors.ts` (`NodeDeletedError`); `src/modules/knowledge-graph/service/node.service.ts` (`getNodeByIdService`); `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeKeyHistoryService`); `src/modules/knowledge-graph/service/traversal.service.ts` (`traverseNodeService`).
- get link, link history — the knowledge link does not exist → 404 `RESOURCE_NOT_FOUND` (entity `KnowledgeLink`, the id). `src/modules/knowledge-graph/service/errors.ts` (`ResourceNotFoundError`); `src/modules/knowledge-graph/service/link.service.ts` (`getLinkByIdService`); `src/modules/knowledge-graph/service/history.service.ts` (`getLinkHistoryService`).
- get attribute, attribute history — the node attribute does not exist → 404 `RESOURCE_NOT_FOUND` (entity `NodeAttribute`, the id). `src/modules/knowledge-graph/service/errors.ts` (`ResourceNotFoundError`); `src/modules/knowledge-graph/service/attribute.service.ts` (`getAttributeByIdService`); `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeHistoryService`).
- list nodes, list attribute keys — `node_type` is not in the catalog → 422 `BUSINESS_UNKNOWN_NODE_TYPE` (the node-type name; message `node_type '<name>' is not registered in the catalog.`). `src/modules/knowledge-graph/service/errors.ts` (`UnknownNodeTypeError`); `src/modules/knowledge-graph/service/node.service.ts` (`listNodesService`); `src/modules/knowledge-graph/service/catalog.service.ts` (`listAttributeKeysService`).
- traverse — a `link_types` element is not in the catalog → 422 `BUSINESS_UNKNOWN_LINK_TYPE` (the link-type name; message `link_type '<name>' is not registered in the catalog.`). `src/modules/knowledge-graph/service/errors.ts` (`UnknownLinkTypeError`); `src/modules/knowledge-graph/service/traversal.service.ts` (`resolveLinkTypeIds`).
- traverse, multi-start expansion — the depth is not an integer or lies outside 1 to 3 → 422 `BUSINESS_INVALID_TRAVERSE_DEPTH` (`depth` as given, `max` 3; message `depth must be between 1 and 3 (got <depth>).`). `src/modules/knowledge-graph/service/errors.ts` (`InvalidTraverseDepthError`); `src/modules/knowledge-graph/service/traversal.service.ts` (`assertDepth`).
- attribute-key history — the key is not registered for the node's node type → 404 `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` (the node-type name, the key; message `AttributeKey '<key>' is not registered for NodeType '<type>'.`). `src/modules/knowledge-graph/service/errors.ts` (`UnknownAttributeKeyError`); `src/modules/knowledge-graph/service/history.service.ts` (`getAttributeKeyHistoryService`).
- every read that shapes links, attributes or provenance — a stored assertion status, effective status or source type is outside its vocabulary → an `InvariantError` is thrown (message `Unexpected assertion_status from DB: <s>`, or the same for `effective_status` or `source_type`), and this area sets no status or code for it. `src/modules/knowledge-graph/service/formatters.ts` (`toAssertionStatus`, `toEffectiveStatus`, `toSourceType`).

## Vocabularies
- Assertion status: `active`, `uncertain`, `disputed`, `superseded`, `deleted`. `src/modules/knowledge-graph/service/formatters.ts` (`ASSERTION_STATUS`).
- Effective status: `active`, `uncertain`, `disputed`, `superseded`, `deleted`, `inactive`. `src/modules/knowledge-graph/service/formatters.ts` (`EFFECTIVE_STATUS`).
- Source type: `pdf`, `email`, `ata`, `chat`, `artigo`, `transcricao`, `outro`. `src/modules/knowledge-graph/service/formatters.ts` (`SOURCE_TYPE`).
- Assertion flags this area derives: `uncertain`, `disputed`. `src/modules/knowledge-graph/service/formatters.ts` (`deriveFlags`).
- Traversal direction: `out`, `in`, `both`. `src/modules/knowledge-graph/service/traversal.service.ts` (`TraverseInput.direction`).
- Node statuses this area branches on: `active`, `deleted`, `merged` (the closing type is defined outside the area). `src/modules/knowledge-graph/service/node.service.ts` (`"active"`, `"deleted"`); `src/modules/knowledge-graph/service/traversal.service.ts` (`"merged"`, `"deleted"`).
- Provenance target kinds: `link`, `attribute`. `src/modules/knowledge-graph/service/history.service.ts` (`listProvenanceByTargets(client, "link" | "attribute", …)`).

## Upstream artifacts
- Link and attribute rows arrive from the graph repository with `effective_status`, `is_current` and `is_in_effect` already computed. This area passes them through and never derives them. `src/modules/knowledge-graph/service/formatters.ts` (`toAttributeDetail`, `toLinkDetail`).
- Lineage chains, node listings with their `total`, the attribute selection by `asOf` / `inEffectOnly` / `includeUncertain`, and each hop's link fetch are all decided by the graph repository, which is outside the area. `src/modules/knowledge-graph/service/history.service.ts` (`walkLinkHistory`, `walkAttributeHistory`, `listAttributeHistoryByNodeKey`); `src/modules/knowledge-graph/service/node.service.ts` (`repoListNodes`, `listAttributesByNodeId`); `src/modules/knowledge-graph/service/traversal.service.ts` (`fetchTraversalHop`).
- Filter names are resolved against the loaded catalog snapshot (`nodeTypeByName`, `linkTypeByName`, `attributeKeyByNodeTypeAndKey`), which the catalog module owns. `src/modules/knowledge-graph/service/catalog.service.ts` (`CatalogSnapshot`); `src/modules/knowledge-graph/service/history.service.ts` (`attributeKeyCacheKey`); `src/modules/knowledge-graph/service/traversal.service.ts` (`resolveLinkTypeIds`).
- Catalog listings (node types, link types, link-type rules, attribute keys, allowed values) are read from the catalog repository's stored rows. `src/modules/knowledge-graph/service/catalog.service.ts` (`listNodeTypes`, `listLinkTypes`, `listLinkTypeRules`, `listAttributeKeys`, `listAttributeValidValues`).

## Outside the domain
- The structured warning `knowledge_graph_empty_provenance`, with its route strings, is logging. `src/modules/knowledge-graph/service/node.service.ts`, `src/modules/knowledge-graph/service/link.service.ts`, `src/modules/knowledge-graph/service/attribute.service.ts`, `src/modules/knowledge-graph/service/history.service.ts`, `src/modules/knowledge-graph/service/traversal.service.ts`.
- Provenance fetched in one batch after all hops, `Promise.all` for aliases and attributes, and one batched node lookup per hop are performance choices. `src/modules/knowledge-graph/service/traversal.service.ts`, `src/modules/knowledge-graph/service/node.service.ts`.
- Catalog listings read stored rows while filter validation reads the cached snapshot. That is a caching choice. `src/modules/knowledge-graph/service/catalog.service.ts`.
- The `statusCode` / `code` fields on the error classes, which the route layer maps, are wiring (the codes themselves are listed under Answers). `src/modules/knowledge-graph/service/errors.ts`.
- The `traverseNodes` signature, which returns raw node rows to the retrieval module, is an internal contract. `src/modules/knowledge-graph/service/traversal.service.ts`.
- The duplicate date helper `formatDate` beside `formatDateOnly` is a helper. `src/modules/knowledge-graph/service/catalog.service.ts`.

## Observed and not decided here
- Deleted items are handled two ways. A deleted knowledge node is refused with 410 `BUSINESS_NODE_DELETED` (`src/modules/knowledge-graph/service/node.service.ts`, `getNodeByIdService`). A deleted knowledge link or node attribute is answered normally, with no refusal (`src/modules/knowledge-graph/service/link.service.ts`, `getLinkByIdService`; `src/modules/knowledge-graph/service/attribute.service.ts`, `getAttributeByIdService`).
- The starting node can go missing from `nodes`. The starting node is seeded into `nodes` (`src/modules/knowledge-graph/service/traversal.service.ts`, `seedRows`), but merged nodes are left out of `nodes` (`finalNodes`, `row.status === "merged"`). A merged starting node whose survivor is missing or deleted is kept as the start (`startingResolved`), so `starting_node_id` names a node the answer's `nodes` does not contain.
- Deleted nodes reached in traversal behave two ways. A deleted node reached as a link endpoint is never expanded (`src/modules/knowledge-graph/service/traversal.service.ts`, `nextFrontier`, `row.status === "deleted"`), yet it is listed in `nodes` (`finalNodes` excludes only `merged`).
- A node type can be listed yet refused. Node-type filters are refused against the cached catalog snapshot (`src/modules/knowledge-graph/service/catalog.service.ts`, `catalog.nodeTypeByName`; `src/modules/knowledge-graph/service/node.service.ts`, same). The catalog listings answer from stored rows (`listNodeTypes`, `listAttributeKeys`). So a node type present in stored rows but not in the snapshot is listed yet refused as a filter.
