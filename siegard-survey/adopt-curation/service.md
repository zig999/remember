---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/curation/service/dispute.service.ts
  - src/modules/curation/service/entity-match.service.ts
  - src/modules/curation/service/errors.ts
  - src/modules/curation/service/item.service.ts
  - src/modules/curation/service/merge.service.ts
  - src/modules/curation/service/metrics.service.ts
  - src/modules/curation/service/queue.service.ts
  - src/modules/curation/service/transaction.ts
read_outside_area:
  - "src/shared/pg-transaction.ts - opened to learn what withTransaction and withReadOnly do (BEGIN/COMMIT with ROLLBACK on any thrown error; BEGIN READ ONLY with unconditional ROLLBACK)"
  - "src/modules/curation/repository/curation.repository.ts - opened to learn which status each repository mutation writes, the guard status of each UPDATE, and the columns of the curation_action insert"
  - "src/modules/curation/dto/enums.dto.ts - opened to learn the values of ItemKind, AssertionStatus and ReviewQueueKind that the services type against"
  - "src/modules/curation/dto/dispute.dto.ts - opened to learn which dispute-body checks run before the service (winner_id membership, periods per item_id)"
  - "specification/domain/knowledge-base/item-kind.md, affected-counts.md, curation-action-kind.md, curation-target-kind.md - opened only to align names with the context so far"
---

## Facts
### Curation write operations (all)
- Every curation write operation (resolve entity match, merge nodes, resolve dispute, confirm item, reject item, correct item) runs its checks, its mutations and its curation action insert inside one transaction, so a refusal raised at any point records nothing. `src/modules/curation/service/entity-match.service.ts` (`withTransaction`), `src/modules/curation/service/dispute.service.ts` (`withTransaction`), `src/modules/curation/service/item.service.ts` (`withTransaction`).
- Every successful curation write records exactly one curation action with the fields `action`, `target_kind`, `target_id`, `payload`, `reason`, and answers its `action_id`. `src/modules/curation/service/item.service.ts` (`insertCurationAction`), `src/modules/curation/service/dispute.service.ts` (`insertCurationAction`), `src/modules/curation/service/entity-match.service.ts` (`insertCurationAction`).
- Each write locks the rows it examines before it checks their status, and re-checks the affected row count after each mutation. If the count does not match, it refuses with a conflict (see Answers). `src/modules/curation/service/item.service.ts` (`loadItemsForUpdate`, `updated !== 1`), `src/modules/curation/service/merge.service.ts` (`loadNodesForUpdate`, `mergedCount !== 1`).

### Resolve entity match (a node in `needs_review`)
- It takes a node id and a body with `decision` (`merge_into` | `keep_separate`), `target_node_id` and an optional `reason`. `src/modules/curation/service/entity-match.service.ts` (`resolveEntityMatchService`).
- A `merge_into` whose `target_node_id` equals the node being resolved is refused before the transaction opens, so before any existence or status check. `src/modules/curation/service/entity-match.service.ts` (`resolveEntityMatchService`, BR-23 guard).
- `keep_separate` check order: node absent → node `deleted` → node not `needs_review` → status changed under lock. `src/modules/curation/service/entity-match.service.ts` (`keep_separate` branch).
- `keep_separate` returns the node to `active`, deletes the node's entity-match review rows, and records a curation action `resolve_entity_match` with `target_kind` `node`, `target_id` the node, `payload` `{ decision: "keep_separate" }`, and `reason` or null. `src/modules/curation/service/entity-match.service.ts` (`updateNodeStatusKeepSeparate`, `deleteEntityMatchReviewByNode`, `insertCurationAction`).
- `keep_separate` answers `{ node_id, decision: "keep_separate", resulting_status: "active", target_node_id: null, affected: null, action_id }`. `src/modules/curation/service/entity-match.service.ts` (`ResolveEntityMatchResult`).
- `keep_separate` ignores any `target_node_id` supplied. `src/modules/curation/service/entity-match.service.ts` (`keep_separate` branch).
- `merge_into` with no `target_node_id` is refused. `src/modules/curation/service/entity-match.service.ts` (`BUSINESS_TARGET_NODE_REQUIRED`).
- `merge_into` merges the resolved node (the absorbed node, expected in `needs_review`) into `target_node_id` (the survivor). It then deletes the absorbed node's entity-match review rows and records a curation action `resolve_entity_match` with `target_kind` `node`, `target_id` the resolved node, `payload` `{ decision: "merge_into", target_node_id }`, and `reason` or null. `src/modules/curation/service/entity-match.service.ts` (`performMerge` with `absorbedExpectedStatus: "needs_review"`, `insertCurationAction`).
- `merge_into` answers `{ node_id, decision: "merge_into", resulting_status: "merged", target_node_id, affected, action_id }`, where `affected` holds the merge counts. `src/modules/curation/service/entity-match.service.ts` (`ResolveEntityMatchResult`).

### Merge nodes
- It takes `survivorId`, `absorbedId` and a required `reason`. It merges with the absorbed node expected `active` and records a curation action `merge_nodes` with `target_kind` `node`, `target_id` the absorbed node, `payload` `{ survivor_id }`, and `reason`. `src/modules/curation/service/entity-match.service.ts` (`mergeNodesService`).
- It answers `{ survivor_id, absorbed_id, affected, action_id }`. `src/modules/curation/service/entity-match.service.ts` (`MergeNodesResult`).

### Merge mechanics (shared by merge nodes and resolve entity match `merge_into`)
- Check order: survivor equals absorbed → survivor absent → absorbed absent → survivor `deleted` → absorbed `deleted` → survivor not `active` → absorbed not in the expected status → node types differ → absorbed status changed under lock. `src/modules/curation/service/merge.service.ts` (`performMerge`).
- A node's `deleted` state is refused as gone (410) before any active/needs_review status mismatch is considered. `src/modules/curation/service/merge.service.ts` (`performMerge`, BR-12 block).
- The survivor must be `active`. A survivor in `needs_review` or `merged` is refused. `src/modules/curation/service/merge.service.ts` (`survivor.status !== "active"`).
- The two nodes must share a node type. `src/modules/curation/service/merge.service.ts` (`survivor.node_type_id !== absorbed.node_type_id`).
- The mutations run in this order: the absorbed node is marked `merged` and pointed at the survivor → nodes previously merged into the absorbed node are repointed at the survivor (path compression) → the absorbed node's aliases are copied to the survivor → links touching the absorbed node are repointed → the absorbed node's attributes are repointed. `src/modules/curation/service/merge.service.ts` (`updateNodeMerged`, `pathCompressMergedInto`, `copyAliases`, `repointLinks`, `repointAttributes`).
- The merge counts answered are `links_repointed`, `attributes_repointed`, `aliases_copied`, `path_compressed_nodes`. `src/modules/curation/service/merge.service.ts` (`MergeAffectedCounts`).

### Resolve dispute
- It takes `item_kind`, `item_ids`, `decision` (`prefer_one` | `adjust_periods` | `keep_disputed`), `winner_id`, `periods` and `reason`. `src/modules/curation/service/dispute.service.ts` (`resolveDisputeService`, `ResolveDisputeBody`).
- Check order: any `item_ids` entry absent → any locked item not `disputed` → the items do not share one conflict scope → the checks of the chosen decision. `src/modules/curation/service/dispute.service.ts` (`resolveDisputeService`).
- The absent item named in the refusal is the first id in `item_ids` order that was not found. `src/modules/curation/service/dispute.service.ts` (`body.item_ids.find`).
- The same conflict scope means the same source node, target node and link type for links, and the same node and attribute key for attributes. `src/modules/curation/service/dispute.service.ts` (`assertSameScope`).
- `keep_disputed` mutates no item. It records a curation action `resolve_dispute` with `target_kind` the item kind, `target_id` the first of `item_ids`, `payload` `{ decision: "keep_disputed", item_ids }`, and `reason` or null. `src/modules/curation/service/dispute.service.ts` (`keep_disputed` branch).
- `keep_disputed` answers each locked item with its unchanged `resulting_status`, `valid_from` and `valid_to`. `src/modules/curation/service/dispute.service.ts` (`keep_disputed` branch).
- `prefer_one` without `winner_id` is refused. `src/modules/curation/service/dispute.service.ts` (`BUSINESS_DISPUTE_WINNER_REQUIRED`).
- `prefer_one` makes the winner `active` and every other listed item `deleted`, leaving the validity periods unchanged. `src/modules/curation/service/dispute.service.ts` (`resolveDisputeWinner`, `resolveDisputeLosers`, `items` map).
- `prefer_one` records a curation action `resolve_dispute` with `target_id` the winner, `payload` `{ decision: "prefer_one", item_ids, winner_id }`, and `reason` or null. `src/modules/curation/service/dispute.service.ts` (`prefer_one` branch).
- `adjust_periods` without `periods` (absent or empty) is refused. `src/modules/curation/service/dispute.service.ts` (`BUSINESS_DISPUTE_PERIODS_REQUIRED`).
- When the scope's link type or attribute key does not allow multiple current values (`allows_multiple_current` false), `adjust_periods` refuses more than one period left open-ended. A period whose `valid_to` is null or absent counts as open-ended. `src/modules/curation/service/dispute.service.ts` (`scopeAllowsMultipleCurrent`, `openCount > 1`).
- If the scope's link type or attribute key is not found in the catalog, it is treated as allowing multiple current values, and the open-ended check is skipped. `src/modules/curation/service/dispute.service.ts` (`scopeAllowsMultipleCurrent`, `?? true`).
- `adjust_periods` applies each period in `periods` order. Each item gets its new `valid_from` and `valid_to` (`valid_to` defaults to null) and becomes `active`. `src/modules/curation/service/dispute.service.ts` (`adjustItemPeriod` loop).
- `adjust_periods` records a curation action `resolve_dispute` with `target_id` the first of `item_ids`, `payload` `{ decision: "adjust_periods", item_ids, periods }`, and `reason` or null. `src/modules/curation/service/dispute.service.ts` (`adjust_periods` branch).
- Every decision answers `{ item_kind, decision, items: [{ item_id, resulting_status, valid_from, valid_to }], action_id }`. `src/modules/curation/service/dispute.service.ts` (`ResolveDisputeResult`, `ResolveDisputeItemResult`).
- `items` follows the locked-row order for `keep_disputed` and `prefer_one`, and the `periods` order for `adjust_periods`. `src/modules/curation/service/dispute.service.ts` (`locked.map`, `periods` loop).

### Confirm item
- It takes `item_kind`, `item_id` and an optional `reason`. Check order: item absent → item not `uncertain` → status changed under lock. `src/modules/curation/service/item.service.ts` (`confirmItemService`).
- It makes the item `active` and records a curation action `confirm_item` with `target_kind` the item kind, `target_id` the item, `payload` `{}`, and `reason` or null. `src/modules/curation/service/item.service.ts` (`confirmItem`, `insertCurationAction`).
- It answers `{ item_kind, item_id, resulting_status: "active", action_id }`. `src/modules/curation/service/item.service.ts` (`ItemActionResult`).

### Reject item
- It takes `item_kind`, `item_id` and `reason`. Check order: item absent → item already `deleted` or `superseded` → status changed under lock. `src/modules/curation/service/item.service.ts` (`rejectItemService`).
- An item in `active`, `uncertain` or `disputed` can be rejected. It becomes `deleted`, and a curation action `reject_item` is recorded with `payload` `{}` and `reason` as given. `src/modules/curation/service/item.service.ts` (`rejectItem`, `insertCurationAction`).
- It answers `{ item_kind, item_id, resulting_status: "deleted", action_id }`. `src/modules/curation/service/item.service.ts` (`ItemActionResult`).

### Correct item
- It takes `item_kind`, `item_id`, `reason`, and `corrected` with the optional `value`, `target_node_id`, `valid_from`, `valid_to`, `valid_from_source` and `valid_from_fragment_id`. `src/modules/curation/service/item.service.ts` (`correctItemService`).
- Check order: item absent → item already `deleted` or `superseded` → `valid_from_fragment_id` given but the fragment is absent or not `accepted` → (attributes with `corrected.value` only) the predecessor has no attribute key → the key is not in the catalog → the value does not parse as the key's `value_type` → the key has a closed value domain and the value is not in it → predecessor status changed under lock. `src/modules/curation/service/item.service.ts` (`correctItemService`).
- A corrected `value` is checked against the value type and closed value domain only when correcting an attribute. For a link, no such check runs in this service. `src/modules/curation/service/item.service.ts` (`body.item_kind === "attribute"` guard).
- All value checks run before any write. `src/modules/curation/service/item.service.ts` (checks precede `supersedePredecessor`).
- A parse failure that is not a validation failure is rethrown unchanged. `src/modules/curation/service/item.service.ts` (`isValidationFailure` / `throw err`).
- On success, the steps run in this order: the predecessor is marked superseded (its `valid_to` is untouched) → a new item is recorded carrying the `corrected` overrides → the predecessor's provenance is copied to the new item → the errata fragment named by `valid_from_fragment_id`, if given, is added as provenance of the new item → a curation action is recorded. `src/modules/curation/service/item.service.ts` (`supersedePredecessor`, `insertCorrectedRow`, `copyProvenance`, `appendProvenanceFragment`, `insertCurationAction`).
- An absent `corrected` field is passed as null, meaning the predecessor's value is kept. `src/modules/curation/service/item.service.ts` (`?? null` on each `corrected*` argument).
- The curation action is `correct_item` with `target_kind` the item kind, `target_id` the predecessor, `payload` `{ corrected, new_item_id }`, and `reason` as given. `src/modules/curation/service/item.service.ts` (`insertCurationAction`).
- It answers `{ item_kind, predecessor_id, new_item_id, action_id }`. `src/modules/curation/service/item.service.ts` (`CorrectItemResult`).

### Review queue listing
- It takes `kind` (optional), `limit` and `offset`. With no `kind`, it lists both queues. `entity_match` lists only the entity-match queue, and `disputed` lists only the disputed queue. `src/modules/curation/service/queue.service.ts` (`listReviewQueueService`).
- It reads in one read-only transaction. `src/modules/curation/service/queue.service.ts` (`withReadOnly`).
- The same `limit` and `offset` are passed separately to the entity-match listing, the disputed-link listing and the disputed-attribute listing. `src/modules/curation/service/queue.service.ts` (`listEntityMatchQueue`, `listDisputedLinks`, `listDisputedAttributes`).
- `total` is the sum of the entity-match count and, when included, the disputed-link and disputed-attribute counts. `src/modules/curation/service/queue.service.ts` (`countEntityMatchQueue`, `countDisputedLinks`, `countDisputedAttributes`).
- It answers `{ total, limit, offset, items }`, with `limit` and `offset` echoed from the request. `src/modules/curation/service/queue.service.ts` (`ReviewQueueList`).
- `items` lists entity-match entries first, then link disputes, then attribute disputes. Within each, entries follow the order in which their first row came back. `src/modules/curation/service/queue.service.ts` (`items.push` order, `Map` insertion order).
- Rows are grouped only within the page that was fetched. `src/modules/curation/service/queue.service.ts` (`groupEntityMatchRows`, `groupDisputedLinks`, `groupDisputedAttributes` over paged rows).
- An entity-match entry is `{ kind: "entity_match", node_id, node_type, canonical_name, candidates, created_at }`, one per node. `src/modules/curation/service/queue.service.ts` (`EntityMatchQueueItem`, `groupEntityMatchRows`).
- A candidate is `{ candidate_node_id, canonical_name, similarity }`. It is included only when all three are present, and `similarity` is answered as a number. `src/modules/curation/service/queue.service.ts` (`groupEntityMatchRows`).
- A dispute entry is `{ kind: "disputed", item_kind, scope, sides, created_at }`. `scope` is `{ source_node_id, target_node_id, link_type, node_id, attribute_key }`. `src/modules/curation/service/queue.service.ts` (`DisputeQueueItem`, `DisputeQueueScope`).
- A link dispute on a link type that does not allow multiple current values is grouped by source node and link type, and its `scope.target_node_id` is null. A link dispute on a multi-valued link type is grouped by source node, target node and link type. `src/modules/curation/service/queue.service.ts` (`groupDisputedLinks`, `allows_multiple_current`).
- A link dispute's scope carries the link type's name in `link_type`, with `node_id` and `attribute_key` null. `src/modules/curation/service/queue.service.ts` (`groupDisputedLinks`).
- An attribute dispute is grouped by node and attribute key, with the value excluded. Its scope carries `node_id` and `attribute_key`, with the link fields null. `src/modules/curation/service/queue.service.ts` (`groupDisputedAttributes`).
- A side is `{ item_id, value, target_node_id, valid_from, valid_to, valid_from_source, confidence, status }`. A link side has `value` null, an attribute side has `target_node_id` null, and `confidence` is answered as a number. `src/modules/curation/service/queue.service.ts` (`DisputedItemSide`).
- A dispute entry's `created_at` is the recording time of the first row seen in its group. `src/modules/curation/service/queue.service.ts` (`r.recorded_at.toISOString()`).

### Curation metrics
- It answers `{ accept_rate, reject_rate_by_code, needs_review_count, uncertain_count, disputed_count, entity_match_queue_count, disputed_queue_count, computed_at }`. `reject_rate_by_code` maps a code to a number. `src/modules/curation/service/metrics.service.ts` (`CurationMetricsResponse`).
- All aggregates come from one read-only transaction. `src/modules/curation/service/metrics.service.ts` (`withReadOnly`, `aggregateCurationMetrics`).
- `computed_at` is the server clock, as an ISO timestamp, taken after the read transaction returns. `src/modules/curation/service/metrics.service.ts` (`new Date().toISOString()` after `withReadOnly`).

### Refusal shape
- Every curation refusal carries a status, a `code`, a message and `details`. `details` defaults to an empty object. `src/modules/curation/service/errors.ts` (`CurationError`).

## Answers
- resolve entity match — `merge_into` with `target_node_id` equal to the node id → 409 `BUSINESS_SELF_MERGE_FORBIDDEN` (`node_id`). `src/modules/curation/service/entity-match.service.ts` (`resolveEntityMatchService`).
- resolve entity match `keep_separate` — node absent → 404 `RESOURCE_NOT_FOUND` (`node_id`). `src/modules/curation/service/entity-match.service.ts` (`keep_separate` branch).
- resolve entity match `keep_separate` — node `deleted` → 410 `BUSINESS_NODE_DELETED` (`node_id`). `src/modules/curation/service/entity-match.service.ts` (`NodeDeletedError`).
- resolve entity match `keep_separate` — node not `needs_review` → 409 `BUSINESS_REVIEW_NOT_PENDING` (`node_id`, `current_status`). `src/modules/curation/service/entity-match.service.ts` (`keep_separate` branch).
- resolve entity match `keep_separate` — status changed under lock → 409 `BUSINESS_REVIEW_NOT_PENDING` (`node_id`). `src/modules/curation/service/entity-match.service.ts` (`updated !== 1`).
- resolve entity match `merge_into` — `target_node_id` absent → 422 `BUSINESS_TARGET_NODE_REQUIRED` (no details). `src/modules/curation/service/entity-match.service.ts` (`BusinessError`).
- merge (both callers) — survivor equals absorbed → 409 `BUSINESS_SELF_MERGE_FORBIDDEN` (no details). `src/modules/curation/service/merge.service.ts` (`performMerge`).
- merge — survivor or absorbed absent → 404 `RESOURCE_NOT_FOUND` (`missing_id`; the survivor is checked first). `src/modules/curation/service/merge.service.ts` (`performMerge`).
- merge — survivor or absorbed `deleted` → 410 `BUSINESS_NODE_DELETED` (`deleted_id`; the survivor is checked first). `src/modules/curation/service/merge.service.ts` (`performMerge`).
- merge — survivor not `active` → 422 `BUSINESS_INVALID_TARGET_NODE` (`id`, `current_status`). `src/modules/curation/service/merge.service.ts` (`performMerge`).
- merge from resolve entity match — absorbed not `needs_review` → 409 `BUSINESS_REVIEW_NOT_PENDING` (`node_id`, `current_status`). `src/modules/curation/service/merge.service.ts` (`absorbedExpectedStatus === "needs_review"`).
- merge from merge nodes — absorbed not `active` → 422 `BUSINESS_INVALID_TARGET_NODE` (`absorbed_id`, `absorbed_status`). `src/modules/curation/service/merge.service.ts` (`performMerge`).
- merge — node types differ → 422 `BUSINESS_INVALID_TARGET_NODE` (`reason`: "node_type mismatch"). `src/modules/curation/service/merge.service.ts` (`performMerge`).
- merge — absorbed status changed under lock → 409 `BUSINESS_INVALID_TARGET_NODE` (`absorbed_id`). `src/modules/curation/service/merge.service.ts` (`mergedCount !== 1`).
- resolve dispute — an item of `item_ids` absent → 404 `RESOURCE_NOT_FOUND` (`missing_id`, `item_kind`). `src/modules/curation/service/dispute.service.ts` (`resolveDisputeService`).
- resolve dispute — an item not `disputed` → 409 `BUSINESS_ITEM_NOT_DISPUTED` (`offending_id`, `current_status`). `src/modules/curation/service/dispute.service.ts` (`row.status !== "disputed"`).
- resolve dispute — items not in the same conflict scope → 409 `BUSINESS_ITEM_NOT_DISPUTED` (`scope_mismatch`: true). `src/modules/curation/service/dispute.service.ts` (`assertSameScope`).
- resolve dispute `prefer_one` — `winner_id` absent → 422 `BUSINESS_DISPUTE_WINNER_REQUIRED` (no details). `src/modules/curation/service/dispute.service.ts` (`prefer_one` branch).
- resolve dispute `prefer_one` — winner not moved out of `disputed` → 409 `BUSINESS_ITEM_NOT_DISPUTED` (`offending_id`). `src/modules/curation/service/dispute.service.ts` (`winnerUpdated !== 1`).
- resolve dispute `prefer_one` — fewer losers moved to `deleted` than listed → 409 `BUSINESS_ITEM_NOT_DISPUTED` (`affected`, `expected`). `src/modules/curation/service/dispute.service.ts` (`losersUpdated !== loserIds.length`).
- resolve dispute `adjust_periods` — `periods` absent or empty → 422 `BUSINESS_DISPUTE_PERIODS_REQUIRED` (no details). `src/modules/curation/service/dispute.service.ts` (`adjust_periods` branch).
- resolve dispute `adjust_periods` — more than one open-ended period in a scope that does not allow multiple current values → 422 `BUSINESS_TEMPORAL_INCOHERENT` (`open_count`). `src/modules/curation/service/dispute.service.ts` (`openCount > 1`).
- resolve dispute `adjust_periods` — an item not moved out of `disputed` → 409 `BUSINESS_ITEM_NOT_DISPUTED` (`offending_id`). `src/modules/curation/service/dispute.service.ts` (`updated !== 1`).
- confirm item — item absent → 404 `RESOURCE_NOT_FOUND` (`item_id`, `item_kind`). `src/modules/curation/service/item.service.ts` (`confirmItemService`).
- confirm item — item not `uncertain`, or status changed under lock → 409 `BUSINESS_ITEM_NOT_UNCERTAIN` (`item_id`, plus `current_status` when read before the lock re-check). `src/modules/curation/service/item.service.ts` (`confirmItemService`).
- reject item — item absent → 404 `RESOURCE_NOT_FOUND` (`item_id`, `item_kind`). `src/modules/curation/service/item.service.ts` (`rejectItemService`).
- reject item — item `deleted` or `superseded`, or status changed under lock → 409 `BUSINESS_ITEM_NOT_DELETABLE` (`item_id`, plus `current_status` when read before the lock re-check). `src/modules/curation/service/item.service.ts` (`rejectItemService`).
- correct item — item absent → 404 `RESOURCE_NOT_FOUND` (`item_id`, `item_kind`). `src/modules/curation/service/item.service.ts` (`correctItemService`).
- correct item — item `deleted` or `superseded` → 409 `BUSINESS_ITEM_NOT_DELETABLE` (`item_id`, `current_status`). `src/modules/curation/service/item.service.ts` (`correctItemService`).
- correct item — `valid_from_fragment_id` names an absent or non-`accepted` fragment → 422 `BUSINESS_DATE_UNJUSTIFIED` (`fragment_id`). `src/modules/curation/service/item.service.ts` (`correctItemService`).
- correct item (attribute, `value` given) — predecessor lacks an attribute key → 422 `BUSINESS_INVALID_ATTRIBUTE_VALUE` (`item_id`). `src/modules/curation/service/item.service.ts` (`!attributeKeyId`).
- correct item (attribute, `value` given) — attribute key not in the catalog → 422 `BUSINESS_INVALID_ATTRIBUTE_VALUE` (`attribute_key_id`, `value`). `src/modules/curation/service/item.service.ts` (`!attrKey`).
- correct item (attribute, `value` given) — value does not parse as the key's type → 422 `BUSINESS_INVALID_ATTRIBUTE_VALUE` (`value_type`, `value`). `src/modules/curation/service/item.service.ts` (`parseAttributeValue` catch).
- correct item (attribute, `value` given) — value outside the key's closed domain → 422 `BUSINESS_INVALID_ATTRIBUTE_VALUE` (`attribute_key`, `value`, `allowed_values`, defaulting to `[]`). `src/modules/curation/service/item.service.ts` (`assertValueInDomain` catch).
- correct item — predecessor status changed under lock → 409 `BUSINESS_ITEM_NOT_DELETABLE` (`item_id`). `src/modules/curation/service/item.service.ts` (`predecessorUpdated !== 1`).
- every operation in the area — an unexpected database or other failure → not answered in this area. The error propagates uncaught out of the service after rollback. `src/modules/curation/service/metrics.service.ts` (`computeCurationMetricsService`), `src/modules/curation/service/transaction.ts` (`withTransaction`, `withReadOnly`).
- (any caller) — the 422 validation error class takes whatever code its caller supplies. No service in the area raises it, nor the dedicated 422 `BUSINESS_TEMPORAL_INCOHERENT` class (message "Adjusted periods violate semi-open invariant or functional-scope overlap."). `src/modules/curation/service/errors.ts` (`ValidationError`, `TemporalIncoherentError`).

## Vocabularies
- Curation action kinds written by this area: `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`. `src/modules/curation/service/entity-match.service.ts` (`action`), `src/modules/curation/service/dispute.service.ts` (`action`), `src/modules/curation/service/item.service.ts` (`action`).
- Curation target kinds written by this area: `node`, `link`, `attribute`. `src/modules/curation/service/entity-match.service.ts` (`target_kind: "node"`), `src/modules/curation/service/queue.service.ts` (`item_kind: "link" | "attribute"`).
- Dispute decision: `prefer_one`, `adjust_periods`, `keep_disputed`. `src/modules/curation/service/dispute.service.ts` (`ResolveDisputeResult.decision`).
- Entity-match decision: `merge_into`, `keep_separate`. `src/modules/curation/service/entity-match.service.ts` (`ResolveEntityMatchResult.decision`).
- Entity-match resulting status: `active`, `merged`. `src/modules/curation/service/entity-match.service.ts` (`ResolveEntityMatchResult.resulting_status`).
- Curated item kind (distinct from the search item kind the specification already names): `link`, `attribute`. `src/modules/curation/service/queue.service.ts` (`DisputeQueueItem.item_kind`).
- Review queue entry kind: `entity_match`, `disputed`. `src/modules/curation/service/queue.service.ts` (`EntityMatchQueueItem.kind`, `DisputeQueueItem.kind`).
- Valid-from basis on a dispute side: `stated`, `document`, `received`. `src/modules/curation/service/queue.service.ts` (`DisputedItemSide.valid_from_source`).
- Expected status of the absorbed node in a merge: `active`, `needs_review`. `src/modules/curation/service/merge.service.ts` (`PerformMergeArgs.absorbedExpectedStatus`).
- Curation refusal codes raised in this area: `RESOURCE_NOT_FOUND`, `BUSINESS_NODE_DELETED`, `BUSINESS_SELF_MERGE_FORBIDDEN`, `BUSINESS_REVIEW_NOT_PENDING`, `BUSINESS_TARGET_NODE_REQUIRED`, `BUSINESS_INVALID_TARGET_NODE`, `BUSINESS_ITEM_NOT_DISPUTED`, `BUSINESS_DISPUTE_WINNER_REQUIRED`, `BUSINESS_DISPUTE_PERIODS_REQUIRED`, `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_ITEM_NOT_UNCERTAIN`, `BUSINESS_ITEM_NOT_DELETABLE`, `BUSINESS_DATE_UNJUSTIFIED`, `BUSINESS_INVALID_ATTRIBUTE_VALUE`. `src/modules/curation/service/errors.ts` (error classes), `src/modules/curation/service/dispute.service.ts`, `src/modules/curation/service/entity-match.service.ts`, `src/modules/curation/service/merge.service.ts`, `src/modules/curation/service/item.service.ts`.
- Curation refusal statuses: 404 (not found), 410 (node deleted), 409 (conflict), 422 (business or validation). `src/modules/curation/service/errors.ts` (`statusCode`).

## Upstream artifacts
- The knowledge-graph module's catalog snapshot supplies each link type's and attribute key's `allows_multiple_current`, looked up by id, for the dispute period check. `src/modules/curation/service/dispute.service.ts` (`CatalogSnapshot.linkTypeById`, `attributeKeyById`).
- The ingestion module's catalog snapshot supplies attribute keys (`key`, `value_type`) and their closed value domains for correct item. `src/modules/curation/service/item.service.ts` (`CatalogSnapshot`, `domainOf`).
- The ingestion module's attribute value parsing and closed-domain check decide whether a corrected value is valid. The `allowed_values` of their failure is re-answered under curation's own code. `src/modules/curation/service/item.service.ts` (`parseAttributeValue`, `assertValueInDomain`, `isValidationFailure`).
- Entity-match review candidates (`candidate_node_id`, `canonical_name`, `similarity`) are read by the queue and deleted on resolution, and never created in this area. `src/modules/curation/service/queue.service.ts` (`listEntityMatchQueue`), `src/modules/curation/service/entity-match.service.ts` (`deleteEntityMatchReviewByNode`).
- Information fragments and their `status` are read, never written, to justify a corrected start date. `src/modules/curation/service/item.service.ts` (`findInformationFragmentById`).
- The calibration aggregates are computed by a query this area does not hold. `src/modules/curation/service/metrics.service.ts` (`aggregateCurationMetrics`).

## Outside the domain
- Log events, route strings and log fields (`curation_resolve_dispute_ok`, `curation_resolve_entity_match_ok`, `curation_merge_nodes_ok`, `curation_confirm_item_ok`, `curation_reject_item_ok`, `curation_correct_item_ok`, `curation_metrics_computed`, `rows_mutated`, `computation_ms`, `transport`, `reject_rate_by_code_keys`, `outcome`), which are observability. `src/modules/curation/service/dispute.service.ts`, `src/modules/curation/service/entity-match.service.ts`, `src/modules/curation/service/item.service.ts`, `src/modules/curation/service/metrics.service.ts`.
- A re-export of the shared transaction helpers, which is wiring. `src/modules/curation/service/transaction.ts`.
- Row locking through `FOR UPDATE` helpers (`loadItemsForUpdate`, `loadNodesForUpdate`), which is the concurrency mechanism. Only the refusal it produces is recorded. `src/modules/curation/service/merge.service.ts`, `src/modules/curation/service/item.service.ts`.
- The unit-separator (`\x1F`) grouping keys, which are an internal helper. `src/modules/curation/service/queue.service.ts`.
- Dependency shapes (`pool`, `logger`, `catalog`), the error class names and the `CurationErrorDetails` type, which are framework wiring. `src/modules/curation/service/errors.ts`, `src/modules/curation/service/item.service.ts`.
- The `ReviewQueueKind` type re-export, which is typing. `src/modules/curation/service/queue.service.ts`.

## Observed and not decided here
- The review queue groups a dispute on a link type that does not allow multiple current values by source node and link type only, so its sides can have different target nodes: "`functional ? `${r.source_node_id}\x1F${r.link_type_id}``" (`src/modules/curation/service/queue.service.ts`, `groupDisputedLinks`). Resolving a dispute requires every item to share the same target node, and refuses otherwise with 409 `BUSINESS_ITEM_NOT_DISPUTED` (`scope_mismatch`): "`r.target_node_id !== first.target_node_id`" (`src/modules/curation/service/dispute.service.ts`, `assertSameScope`).
- The same code `BUSINESS_INVALID_TARGET_NODE` is answered 422 for survivor/absorbed status and node-type guards (`BusinessError`), and 409 when the absorbed node's status changed under lock (`ConflictError("BUSINESS_INVALID_TARGET_NODE", "Absorbed node status changed under lock")`). Both are in `src/modules/curation/service/merge.service.ts` (`performMerge`).
- An attribute key or link type missing from the catalog is treated as allowing multiple current values when periods are adjusted: "`return ak?.allows_multiple_current ?? true`" (`src/modules/curation/service/dispute.service.ts`, `scopeAllowsMultipleCurrent`). A missing attribute key is refused with 422 `BUSINESS_INVALID_ATTRIBUTE_VALUE` when a value is corrected: "`predecessor attribute_key_id does not resolve in the catalog snapshot`" (`src/modules/curation/service/item.service.ts`, `correctItemService`).
- The review queue answers `limit` as requested, but applies that same `limit` and `offset` to up to three separate listings, so `items` can hold more entries than `limit`: "`listEntityMatchQueue(client, limit, offset)` … `listDisputedLinks(client, limit, offset)` … `listDisputedAttributes(client, limit, offset)`" and "`return { total, limit, offset, items }`" (`src/modules/curation/service/queue.service.ts`, `listReviewQueueService`).
