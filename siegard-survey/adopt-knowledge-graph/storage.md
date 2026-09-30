---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/knowledge-graph/catalog/catalog.ts
  - src/modules/knowledge-graph/repository/catalog.repository.ts
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/repository/temporal-filter.ts
read_outside_area:
  - src/shared/invariant-error.ts — to see what the temporal filter throws (a plain named Error subclass, with no status or code attached)
  - ../migrations/0001_init.sql — to see the declared order of the alias kind enum (`alias_kind`), and how `raw_chunk` text and offsets and `provenance` are shaped, to read the excerpt and provenance queries
---

## Facts
### Catalog snapshot
- The catalog snapshot loads every node type, with no filter, carrying `id`, `name`, `description` and `version`. `src/modules/knowledge-graph/catalog/catalog.ts` (`loadCatalog`, `NodeTypeRow`).
- The catalog snapshot loads every link type, with no filter, carrying `id`, `name`, `label`, `description`, `inverse_name`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `requires_valid_to_on_change` and `version`. `src/modules/knowledge-graph/catalog/catalog.ts` (`loadCatalog`, `LinkTypeRow`).
- The catalog snapshot loads every link type rule, with no filter on its window, carrying `id`, `link_type_id`, `source_node_type_id`, `target_node_type_id`, `valid_from` and `valid_to`. Both window bounds may be absent. `src/modules/knowledge-graph/catalog/catalog.ts` (`loadCatalog`, `LinkTypeRuleRow`).
- Link type rules are held as a plain list, not looked up by key. `src/modules/knowledge-graph/catalog/catalog.ts` (`CatalogSnapshot.linkTypeRules`).
- The catalog snapshot loads every attribute key, carrying `id`, `node_type_id`, `key`, `value_type`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `description` and `version`. `src/modules/knowledge-graph/catalog/catalog.ts` (`loadCatalog`, `AttributeKeyRow`).
- The catalog snapshot loads every allowed value as a pair of attribute key and `value`. `src/modules/knowledge-graph/catalog/catalog.ts` (`loadCatalog`, `AttributeValidValueRow`).
- Node types and link types can each be looked up by exact `name` and by `id`. `src/modules/knowledge-graph/catalog/catalog.ts` (`buildSnapshot`, `nodeTypeByName`, `nodeTypeById`, `linkTypeByName`, `linkTypeById`).
- An attribute key is looked up by the pair of its node type and its exact `key`, so the same key name can exist separately under different node types. It can also be looked up by `id`. `src/modules/knowledge-graph/catalog/catalog.ts` (`attributeKeyCacheKey`, `attributeKeyByNodeTypeAndKey`, `attributeKeyById`).
- Allowed values are grouped per attribute key into a set with no duplicates. An attribute key that has no allowed-value rows has no entry in the grouping. `src/modules/knowledge-graph/catalog/catalog.ts` (`buildSnapshot`, `attributeValidValuesByKeyId`).

### Catalog listing
- The node type listing answers `id`, `name`, `description` and `version` for every node type, ordered by `name` ascending. `src/modules/knowledge-graph/repository/catalog.repository.ts` (`listNodeTypes`).
- The link type listing answers `id`, `name`, `label`, `description`, `inverse_name`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `requires_valid_to_on_change` and `version`, ordered by `name` ascending. `src/modules/knowledge-graph/repository/catalog.repository.ts` (`listLinkTypes`).
- The link type rule listing answers `id`, `link_type_id`, `source_node_type` and `target_node_type` (both node type names, not ids), `valid_from` and `valid_to` for every rule, whatever its window. `src/modules/knowledge-graph/repository/catalog.repository.ts` (`listLinkTypeRules`, `LinkTypeRuleJoined`).
- The link type rule listing is ordered by link type id, then source node type name, then target node type name. `src/modules/knowledge-graph/repository/catalog.repository.ts` (`listLinkTypeRules`).
- The attribute key listing answers `id`, `node_type_id`, `node_type` (the name), `key`, `value_type`, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, `description` and `version`. `src/modules/knowledge-graph/repository/catalog.repository.ts` (`listAttributeKeys`, `AttributeKeyJoined`).
- The attribute key listing can be restricted to one node type. Restricted, it is ordered by `key` ascending. Unrestricted, it is ordered by node type name ascending, then `key` ascending. `src/modules/knowledge-graph/repository/catalog.repository.ts` (`listAttributeKeys`).
- The allowed-value listing answers `attribute_key_id` and `value`. It can be restricted to the attribute keys of one node type, and is ordered by attribute key id, then `value` ascending. `src/modules/knowledge-graph/repository/catalog.repository.ts` (`listAttributeValidValues`).

### Knowledge node reads
- A node read by id answers `id`, `node_type_id`, `node_type` (the name), `canonical_name`, `status`, `merged_into_node_id`, `created_at` and `updated_at`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`findNodeById`, `KnowledgeNodeRow`).
- A node read by id is found whatever its status. An unknown id answers nothing (`null`). `src/modules/knowledge-graph/repository/graph.repository.ts` (`findNodeById`).
- A batch of nodes read by ids answers the known ones, whatever their status, in no particular order. An empty batch answers an empty list. `src/modules/knowledge-graph/repository/graph.repository.ts` (`findNodesByIds`).
- The node listing always filters on exactly one node status. It can also be restricted to one node type. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listNodes`, `ListNodesFilter.status`, `node_type_id`).
- The node listing's name-prefix filter matches a node when any of its aliases, of either kind, has a normalized form that starts with the prefix it is given. The prefix arrives already normalized. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listNodes`, `na.alias_norm LIKE $n || '%'`).
- `%` and `_` inside the name prefix are not escaped, so they act as pattern wildcards. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listNodes`).
- The node listing answers each node once, even when several of its aliases match. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listNodes`, `SELECT DISTINCT`, `count(DISTINCT kn.id)`).
- The node listing answers `items` and `total`. `total` counts every matching node before pagination. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listNodes`, `ListNodesResult`).
- The node listing is ordered by `canonical_name` ascending, then `id` ascending, and paginated by `limit` and `offset`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listNodes`, `ORDER BY kn.canonical_name ASC, kn.id ASC LIMIT … OFFSET …`).

### Node aliases
- A node's alias listing answers `id`, `node_id`, `alias`, `alias_norm`, `kind` and `created_at` for every alias of that node, ordered by alias kind, then `alias` ascending. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAliasesByNodeId`).

### Node attributes
- A node's attribute listing reads the resolved attribute view. For each attribute it answers the stored fields: `id`, `node_id`, `attribute_key_id`, `value_type`, `value`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `confidence`, `valid_from_source`, `created_by_run_id`, `supersedes_attribute_id`, `created_at`, `updated_at`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAttributesByNodeId`, `AttributeResolvedRow`).
  - It also answers the attribute key name `attribute_key`, `key_is_temporal`, `key_allows_multiple_current`, and the derived `is_current`, `is_in_effect` and `effective_status`, all read from the view and never recomputed.
- A node's attribute listing applies the temporal filter (current view, or as of a date). `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAttributesByNodeId`, `applyTemporalFilter("na", …)`).
- A node's attribute listing leaves out attributes whose stored status is `uncertain`, unless uncertain items are asked for. It filters on the stored status, not on a derived field. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAttributesByNodeId`, `na.status <> 'uncertain'`).
- A node's attribute listing does not filter out attributes whose stored status is `deleted`. The temporal filter's `superseded_at IS NULL` is the only guard. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAttributesByNodeId`).
- A node's attribute listing is ordered by attribute key name ascending, then `recorded_at` ascending, then `id` ascending. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAttributesByNodeId`).
- An attribute read by id answers the resolved row whatever its status or validity. An unknown id answers nothing (`null`). `src/modules/knowledge-graph/repository/graph.repository.ts` (`findAttributeById`).

### Knowledge links
- A link read by id answers the resolved link row: `id`, `source_node_id`, `target_node_id`, `link_type_id`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `confidence`, `valid_from_source`, `created_by_run_id`, `supersedes_link_id`, `created_at`, `updated_at`, `link_type` (the name), `link_inverse_name`, `is_current`, `is_in_effect`, `effective_status`. Status and validity are not filtered. An unknown id answers nothing (`null`). `src/modules/knowledge-graph/repository/graph.repository.ts` (`findLinkById`, `LinkResolvedRow`).

### Temporal filter
- With no as-of date (the current view), a row is kept only when it has no validity end (`valid_to IS NULL`) and has not been superseded (`superseded_at IS NULL`). A row whose validity end is still in the future is therefore left out. `src/modules/knowledge-graph/repository/temporal-filter.ts` (`applyTemporalFilter`, the query (a) branch).
- In the current view, when only rows in effect are asked for, a row is also kept only when its validity start is absent or on or before today (`current_date`). `src/modules/knowledge-graph/repository/temporal-filter.ts` (`applyTemporalFilter`, `inEffectOnly`).
- With an as-of date, a row is kept when it has not been superseded, its validity start is absent or on or before the date, and its validity end is absent or strictly after the date. The window is half-open, `[valid_from, valid_to)`. `src/modules/knowledge-graph/repository/temporal-filter.ts` (`applyTemporalFilter`, the query (b) branch).
- With an as-of date, rows superseded on the transaction axis are still left out, so the as-of view shows only rows still recorded now. `src/modules/knowledge-graph/repository/temporal-filter.ts` (`applyTemporalFilter`, `superseded_at IS NULL` in the query (b) branch).
- With an as-of date, the in-effect-only option is ignored. `src/modules/knowledge-graph/repository/temporal-filter.ts` (`applyTemporalFilter`, early return when `asOf !== undefined`).
- The as-of date is expected as an ISO `YYYY-MM-DD` date. `src/modules/knowledge-graph/repository/temporal-filter.ts` (`TemporalFilterOptions.asOf`).

### Provenance
- Provenance is read for a batch of links, or a batch of attributes, at once. An empty batch answers an empty list. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`, `kind: "link" | "attribute"`).
- Each provenance entry answers `target_id`, `fragment_id`, `fragment_text`, `fragment_confidence`, `raw_information_id`, `source_type` (as text), `received_at` and `excerpt`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`ProvenanceRow`).
- A provenance entry is answered once for each chunk its fragment cites, so a fragment citing several chunks yields several entries for the same target. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`, `JOIN fragment_source fs`).
- The excerpt is the substring of the chunk's `text` that starts at code point `offset_start + 1` and runs for `offset_end - offset_start` code points. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`, `substring(rc."text" FROM rc.offset_start + 1 FOR rc.offset_end - rc.offset_start)`).
- Provenance is read with no filter on fragment status or on the status or tombstone of the chunk or source. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`).
- Provenance is ordered by target id, then provenance `created_at` ascending, then fragment id ascending. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`).

### Traversal hop
- One traversal hop reads the resolved links that leave the current nodes (outgoing: the source is among them) or that arrive at them (incoming: the target is among them). `src/modules/knowledge-graph/repository/graph.repository.ts` (`fetchTraversalHop`, `direction: "out" | "in"`).
- A traversal hop can be restricted to a set of link types. An absent or empty set means every link type. `src/modules/knowledge-graph/repository/graph.repository.ts` (`fetchTraversalHop`, `linkTypeIds`).
- A traversal hop leaves out links whose stored status is `deleted` and applies the temporal filter. Links whose status is uncertain or disputed are kept. `src/modules/knowledge-graph/repository/graph.repository.ts` (`fetchTraversalHop`, `kl.status <> 'deleted'`, `applyTemporalFilter("kl", …)`).
- A traversal hop does not filter on the status of the nodes at either end, and answers its links in no particular order. `src/modules/knowledge-graph/repository/graph.repository.ts` (`fetchTraversalHop`).
- A hop from no nodes answers an empty list. `src/modules/knowledge-graph/repository/graph.repository.ts` (`fetchTraversalHop`).

### Lineage history
- A link's history walks up from the anchor link through each predecessor it supersedes (`supersedes_link_id`), and down through each link that supersedes it. It answers every row reached, the anchor included, each once. `src/modules/knowledge-graph/repository/graph.repository.ts` (`walkLinkHistory`, recursive `up`/`down` CTE, `UNION`).
- The history walk does not collect branches off an ancestor: another successor of a predecessor is not reached. `src/modules/knowledge-graph/repository/graph.repository.ts` (`walkLinkHistory`, `walkAttributeHistory`).
- A history is not filtered by status or validity, is ordered by `recorded_at` ascending then `id` ascending, and answers nothing (`null`) when the anchor does not exist. `src/modules/knowledge-graph/repository/graph.repository.ts` (`walkLinkHistory`, `walkAttributeHistory`).
- An attribute's history walks the same way through `supersedes_attribute_id`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`walkAttributeHistory`).
- The history of an attribute key on a node answers every version recorded for that node and key, whatever its status. It is ordered by `recorded_at` ascending then `id` ascending, and answers an empty list, not `null`, when there are none. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAttributeHistoryByNodeKey`).

## Answers
- Temporal filter — a table qualifier that is not a SQL identifier (`^[A-Za-z_][A-Za-z0-9_]*$`) → throws `InvariantError`. No status or code is assigned in the area, and the filter checks this before it reads any option. `src/modules/knowledge-graph/repository/temporal-filter.ts` (`applyTemporalFilter`, `isValidIdentifier`).

## Vocabularies
- Node status: `active`, `needs_review`, `merged`, `deleted`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`KnowledgeNodeRow.status`, `ListNodesFilter.status`).
- Alias kind: `canonical`, `alias`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`NodeAliasRow.kind`).
- Assertion status (links and attributes): `active`, `uncertain`, `disputed`, `superseded`, `deleted`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`AttributeResolvedRow.status`, `LinkResolvedRow.status`).
- Valid-from basis: `stated`, `document`, `received`, or absent. `src/modules/knowledge-graph/repository/graph.repository.ts` (`valid_from_source`).
- Value type: `date`, `number`, `text`, `bool`. `src/modules/knowledge-graph/catalog/catalog.ts` (`AttributeKeyRow.value_type`); `src/modules/knowledge-graph/repository/catalog.repository.ts` (`AttributeKeyJoined.value_type`); `src/modules/knowledge-graph/repository/graph.repository.ts` (`AttributeResolvedRow.value_type`).
- Provenance target kind: `link`, `attribute`. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`, `kind`).

## Upstream artifacts
- The resolved link view `knowledge_link_resolved` supplies the derived `is_current`, `is_in_effect` and `effective_status`, plus `link_type` and `link_inverse_name`. The area reads them as they are. `src/modules/knowledge-graph/repository/graph.repository.ts` (`LinkResolvedRow`, `SELECT kl.*`).
- The resolved attribute view `node_attribute_resolved` supplies the derived `is_current`, `is_in_effect` and `effective_status`, plus `attribute_key`, `key_is_temporal` and `key_allows_multiple_current`. The area reads them as they are. `src/modules/knowledge-graph/repository/graph.repository.ts` (`AttributeResolvedRow`, `SELECT na.*`).
- The catalog tables `node_type`, `link_type`, `link_type_rule`, `attribute_key` and `attribute_valid_value` are owned by migrations and only read here. `src/modules/knowledge-graph/catalog/catalog.ts` (`loadCatalog`); `src/modules/knowledge-graph/repository/catalog.repository.ts`.
- The normalized alias form `alias_norm` is produced outside the area and compared as given. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listNodes`).
- Provenance reads `provenance`, `information_fragment`, `fragment_source`, `raw_chunk` and `raw_information`, all written by other modules. `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`).

## Outside the domain
- Every query is parameterized, and the target and side columns come from fixed branches: security. `src/modules/knowledge-graph/repository/graph.repository.ts`.
- The catalog is loaded with sequential queries on one client, and the `\x1F` separator builds the composite lookup key: implementation. `src/modules/knowledge-graph/catalog/catalog.ts`.
- `buildSnapshot` takes optional allowed values for test fixtures: test support. `src/modules/knowledge-graph/catalog/catalog.ts`.
- `listLinkTypeRuleRows`, an id-only unordered rule read, and the re-export of `AttributeKeyRow`: wiring. `src/modules/knowledge-graph/repository/catalog.repository.ts`.
- The node listing runs its count and data as two queries, relying on a btree index for left-anchored `LIKE`: performance. `src/modules/knowledge-graph/repository/graph.repository.ts`.
- Batched `= ANY($1::uuid[])` reads and one-hop-at-a-time traversal instead of a recursive query: performance. `src/modules/knowledge-graph/repository/graph.repository.ts`.

## Observed and not decided here
- Alias listing order: `src/modules/knowledge-graph/repository/graph.repository.ts` (`listAliasesByNodeId`) orders by `kind ASC`. Because `kind` is a Postgres enum, the order follows the enum's declaration, which puts `canonical` before `alias` (read outside the area), not the alphabetical order in which `alias` comes first. The area alone does not settle which order a caller sees.
- Excerpt against chunk offsets: `src/modules/knowledge-graph/repository/graph.repository.ts` (`listProvenanceByTargets`) takes the excerpt from the chunk's own `text` starting at `offset_start + 1`. Yet `offset_start`/`offset_end` are the chunk's own position fields, and the migration requires only `offset_start >= 0`, not 0. For a chunk whose `offset_start` is above 0, the excerpt is a shifted, possibly empty, slice of the chunk rather than the whole chunk.
- Deleted-status filtering: `src/modules/knowledge-graph/repository/graph.repository.ts` (`fetchTraversalHop`) leaves out links with stored status `deleted` explicitly (`kl.status <> 'deleted'`). The same file (`listAttributesByNodeId`) never filters on `deleted` and relies on `superseded_at IS NULL` from `src/modules/knowledge-graph/repository/temporal-filter.ts` alone.
