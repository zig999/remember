---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/dto/entity-match.dto.ts
  - src/modules/curation/dto/enums.dto.ts
  - src/modules/curation/dto/item.dto.ts
  - src/modules/curation/dto/queue.dto.ts
  - src/modules/curation/index.ts
  - src/modules/curation/mcp/curation-toolset.ts
  - src/modules/curation/mcp/curation-transport.ts
  - src/modules/curation/mcp/error-envelope.ts
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/routes/curation.routes.ts
read_outside_area:
  - src/shared/error-mapping.ts, to resolve what `serviceUnavailableError`, `internalError` and `mapped` answer (status, code, message) when the curation mapper calls them
  - src/middleware/error-handler.ts, to resolve what a ZodError thrown outside the curation mapper (GET /queue query, the node_id path parameter) answers through the global handler
  - src/app.ts, to learn the prefix the curation routes are mounted under (/curation inside the /api/v1 scope) and the tool names handed to the curation MCP transport
  - src/modules/curation/service/queue.service.ts, to see how the queue listing consumes the repository's page and count queries and groups disputed links
---

## Facts
### Review queue listing (`GET /queue`, MCP `list_review_queue`)
- The REST review queue listing is `GET /queue` under the curation prefix. It is answered by `listReviewQueueService` with status 200 and a bare body, with no `{ ok, result }` wrapper. `src/modules/curation/routes/curation.routes.ts` (`app.get("/queue")`)
- The MCP tool `list_review_queue` runs the same listing and answers `{ ok: true, result }`. `src/modules/curation/mcp/curation-toolset.ts` (`registerCurationToolset`, `makeHandler`)
- The query string accepts `kind` (optional, a review-queue kind), `limit` and `offset`. `src/modules/curation/dto/queue.dto.ts` (`ListReviewQueueQuerySchema`)
- `limit` is converted from its string form to a number and must be an integer from 1 to 100. It defaults to 20. `src/modules/curation/dto/queue.dto.ts` (`ListReviewQueueQuerySchema.limit`)
- `offset` is converted from its string form to a number and must be an integer of at least 0. It defaults to 0. `src/modules/curation/dto/queue.dto.ts` (`ListReviewQueueQuerySchema.offset`)
- The entity-match queue holds knowledge nodes whose status is `needs_review`. Each is joined with its node type name (`node_type`), `canonical_name` and `created_at`, and each is left-joined with its entity-match-review candidates (`candidate_node_id`, `candidate_canonical_name`, `similarity`). `src/modules/curation/repository/curation.repository.ts` (`listEntityMatchQueue`)
- Entity-match queue rows are ordered by node `created_at` ascending, then node `id` ascending, then candidate `similarity` descending with nulls last. `LIMIT`/`OFFSET` apply to these joined node-candidate rows. `src/modules/curation/repository/curation.repository.ts` (`listEntityMatchQueue`)
- The entity-match queue total counts knowledge nodes with status `needs_review`. `src/modules/curation/repository/curation.repository.ts` (`countEntityMatchQueue`)
- The disputed queue reads links with status `disputed`. Each carries `id`, `source_node_id`, `target_node_id`, `link_type_id`, `link_type_name`, the link type's `allows_multiple_current`, `valid_from`, `valid_to`, `valid_from_source`, `confidence`, `status` and `recorded_at`. They are ordered by `recorded_at` ascending, then `id` ascending, and paged by `LIMIT`/`OFFSET`. `src/modules/curation/repository/curation.repository.ts` (`listDisputedLinks`)
- The disputed queue reads attributes with status `disputed`. Each carries `id`, `node_id`, `attribute_key_id`, `attribute_key` (the key's name), `value`, `valid_from`, `valid_to`, `valid_from_source`, `confidence`, `status` and `recorded_at`. They are ordered by `recorded_at` ascending, then `id` ascending, and paged by `LIMIT`/`OFFSET`. `src/modules/curation/repository/curation.repository.ts` (`listDisputedAttributes`)
- The disputed totals count links with status `disputed` and attributes with status `disputed`, each counted separately. `src/modules/curation/repository/curation.repository.ts` (`countDisputedLinks`, `countDisputedAttributes`)
- `valid_from` and `valid_to` are read as `YYYY-MM-DD` text, and `confidence` and `similarity` are read as text. `src/modules/curation/repository/curation.repository.ts` (`::text` casts in `listDisputedLinks`, `listDisputedAttributes`, `listEntityMatchQueue`, `loadItemsForUpdate`)

### Curation metrics (`GET /metrics`)
- `GET /metrics` answers the metrics snapshot with status 200 and a bare body, with no `{ ok, result }` wrapper. `src/modules/curation/routes/curation.routes.ts` (`app.get("/metrics")`)
- `accept_rate` is the number of curation actions whose `action` is one of the five accept actions, divided by the number of all curation actions. It is 0 when there are no curation actions. `src/modules/curation/repository/curation.repository.ts` (`aggregateCurationMetrics`, `ACCEPT_ACTIONS`)
- `reject_rate_by_code` maps each `payload->>'error_code'` value of `reject_item` curation actions to its count divided by the number of all curation actions. It is `{}` when there is none, and the key is always present. `src/modules/curation/repository/curation.repository.ts` (`aggregateCurationMetrics`)
- `needs_review_count` counts knowledge nodes with status `needs_review`. `entity_match_queue_count` is set to the same number. `src/modules/curation/repository/curation.repository.ts` (`aggregateCurationMetrics`)
- `uncertain_count` is the number of links plus attributes whose derived effective status is `uncertain` in the resolved views. `src/modules/curation/repository/curation.repository.ts` (`aggregateCurationMetrics`)
- `disputed_count` is the number of links plus attributes whose derived effective status is `disputed` in the resolved views. `src/modules/curation/repository/curation.repository.ts` (`aggregateCurationMetrics`)
- `disputed_queue_count` counts the distinct (`source_node_id`, `target_node_id`, `link_type_id`) triples of `disputed` links plus the distinct (`node_id`, `attribute_key_id`) pairs of `disputed` attributes. `src/modules/curation/repository/curation.repository.ts` (`aggregateCurationMetrics`)

### Entity-match resolution (`POST /entity-matches/:node_id/resolve`, MCP `resolve_entity_match`)
- The REST resolution is `POST /entity-matches/:node_id/resolve`. The path parameter `node_id` must be a UUID. Success answers 200 with the service result as a bare body. `src/modules/curation/routes/curation.routes.ts` (`app.post("/entity-matches/:node_id/resolve")`), `src/modules/curation/dto/entity-match.dto.ts` (`NodeIdPathSchema`)
- The body is `decision` (an entity-match decision, required), `target_node_id` (a UUID, optional, nullable) and `reason` (trimmed, at least 1 character, optional, nullable). `src/modules/curation/dto/entity-match.dto.ts` (`ResolveEntityMatchBodySchema`)
- With `decision` `merge_into`, `target_node_id` is required and `reason` must be non-empty after trimming. `src/modules/curation/dto/entity-match.dto.ts` (`ResolveEntityMatchBodySchema.superRefine`)
- With `decision` `keep_separate`, neither `target_node_id` nor `reason` is required. `src/modules/curation/dto/entity-match.dto.ts` (`ResolveEntityMatchBodySchema.superRefine`)
- The MCP tool `resolve_entity_match` takes `node_id` (a UUID) alongside the same body fields in one flat input. `src/modules/curation/mcp/curation-toolset.ts` (`ResolveEntityMatchToolInputSchema`)
- Keeping a node separate sets it to `active`, but only when its status is `needs_review`. `src/modules/curation/repository/curation.repository.ts` (`updateNodeStatusKeepSeparate`)
- Resolving an entity match deletes every entity-match-review row of that node. `src/modules/curation/repository/curation.repository.ts` (`deleteEntityMatchReviewByNode`)

### Node merge (`POST /nodes/merge`, MCP `merge_nodes`; also `merge_into`)
- The REST merge is `POST /nodes/merge` with body `survivor_id` (a UUID), `absorbed_id` (a UUID) and `reason` (required, trimmed, at least 1 character). Success answers 200 with the service result as a bare body. `src/modules/curation/routes/curation.routes.ts` (`app.post("/nodes/merge")`), `src/modules/curation/dto/entity-match.dto.ts` (`MergeNodesBodySchema`)
- A merge whose `survivor_id` equals its `absorbed_id` is refused. `src/modules/curation/dto/entity-match.dto.ts` (`MergeNodesBodySchema.superRefine`)
- The MCP tool `merge_nodes` takes the same input as the REST body. `src/modules/curation/mcp/curation-toolset.ts` (`registerCurationToolset`)
- A merge sets the absorbed node's status to `merged` and its `merged_into_node_id` to the survivor, but only when the absorbed node's status is `active` or `needs_review`. `src/modules/curation/repository/curation.repository.ts` (`updateNodeMerged`)
- A merge repoints to the survivor every node whose `merged_into_node_id` pointed at the absorbed node (path compression). `src/modules/curation/repository/curation.repository.ts` (`pathCompressMergedInto`)
- A merge copies every alias of the absorbed node onto the survivor with kind `alias`, keeping `created_by_run_id` and `created_at`. It skips an alias whose normalized form the survivor already holds, and the absorbed node keeps its own aliases. `src/modules/curation/repository/curation.repository.ts` (`copyAliases`)
- A merge repoints to the survivor every link whose source or target is the absorbed node, whatever the link's status. `src/modules/curation/repository/curation.repository.ts` (`repointLinks`)
- A merge repoints to the survivor every attribute of the absorbed node, whatever the attribute's status. `src/modules/curation/repository/curation.repository.ts` (`repointAttributes`)

### Dispute resolution (`POST /disputes/resolve`, MCP `resolve_dispute`)
- The REST resolution is `POST /disputes/resolve`, and the MCP tool `resolve_dispute` takes the same input. Success answers 200 with the service result as a bare body on REST and as `{ ok: true, result }` on MCP. `src/modules/curation/routes/curation.routes.ts` (`app.post("/disputes/resolve")`), `src/modules/curation/mcp/curation-toolset.ts` (`registerCurationToolset`)
- The body is `item_kind` (an item kind), `item_ids` (an array of UUIDs with at least 2 entries), `decision` (a dispute decision), `winner_id` (a UUID, optional, nullable), `periods` (optional, nullable) and `reason` (trimmed, at least 1 character, optional, nullable). `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema`)
- Each `periods[]` entry is `item_id` (a UUID), `valid_from` (a `YYYY-MM-DD` date or null, key required) and `valid_to` (a `YYYY-MM-DD` date or null, optional). `src/modules/curation/dto/dispute.dto.ts` (`AdjustedPeriodSchema`)
- `item_ids` must hold no duplicate. `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema.superRefine`)
- With `decision` `prefer_one`, `reason` must be non-empty after trimming, and `winner_id` must be given and be one of `item_ids`. `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema.superRefine`)
- With `decision` `adjust_periods`, `periods` must be non-empty. When it is missing or empty, no further period check runs. `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema.superRefine`, `return`)
- With `adjust_periods`, `periods` must have exactly as many entries as `item_ids`. Every entry's `item_id` must be one of `item_ids`, and no `item_id` may repeat across entries. `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema.superRefine`)
- With `adjust_periods`, an entry whose `valid_from` and `valid_to` are both given must have `valid_from` strictly earlier than `valid_to`, compared as `YYYY-MM-DD` strings. `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema.superRefine`)
- With `decision` `keep_disputed`, neither a winner nor periods are required, and `reason` is optional. `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema.superRefine`)
- `winner_id` and `periods` given with a decision that does not use them are not refused by the request shape. `src/modules/curation/dto/dispute.dto.ts` (`ResolveDisputeBodySchema.superRefine`)
- Preferring one sets the winning link or attribute to `active`, but only when its status is `disputed`. `src/modules/curation/repository/curation.repository.ts` (`resolveDisputeWinner`)
- Preferring one sets each losing link or attribute whose status is `disputed` to `deleted` and stamps `superseded_at = now()` in the same statement. `src/modules/curation/repository/curation.repository.ts` (`resolveDisputeLosers`)
- Adjusting periods sets an item's `valid_from` and `valid_to` to the given dates (null allowed) and its status to `active`, but only when its status is `disputed`. `src/modules/curation/repository/curation.repository.ts` (`adjustItemPeriod`)

### Item confirmation (`POST /items/confirm`, MCP `confirm_item`)
- The REST confirmation is `POST /items/confirm`, and the MCP tool `confirm_item` takes the same input. The body is `item_kind`, `item_id` (a UUID) and `reason` (trimmed, at least 1 character, optional, nullable). Success answers 200 with a bare body. `src/modules/curation/routes/curation.routes.ts` (`app.post("/items/confirm")`), `src/modules/curation/dto/item.dto.ts` (`ConfirmItemBodySchema`)
- Confirming sets a link or attribute to `active`, but only when its status is `uncertain`. `src/modules/curation/repository/curation.repository.ts` (`confirmItem`)

### Item rejection (`POST /items/reject`, MCP `reject_item`)
- The REST rejection is `POST /items/reject`, and the MCP tool `reject_item` takes the same input. The body is `item_kind`, `item_id` (a UUID) and `reason` (required, trimmed, at least 1 character). Success answers 200 with a bare body. `src/modules/curation/routes/curation.routes.ts` (`app.post("/items/reject")`), `src/modules/curation/dto/item.dto.ts` (`RejectItemBodySchema`)
- Rejecting sets a link or attribute to `deleted` and stamps `superseded_at = now()` in one statement, but only when its status is `active`, `uncertain` or `disputed`. `src/modules/curation/repository/curation.repository.ts` (`rejectItem`)

### Item correction (`POST /items/correct`, MCP `correct_item`)
- The REST correction is `POST /items/correct`, and the MCP tool `correct_item` takes the same input. The body is `item_kind`, `item_id` (a UUID), `corrected` (an object) and `reason` (required, trimmed, at least 1 character). Success answers 200 with a bare body. `src/modules/curation/routes/curation.routes.ts` (`app.post("/items/correct")`), `src/modules/curation/dto/item.dto.ts` (`CorrectItemBodySchema`)
- `corrected` accepts these keys, each optional and nullable: `value` (at least 1 character, not trimmed), `target_node_id` (a UUID), `valid_from` and `valid_to` (`YYYY-MM-DD` dates), `valid_from_source` (a valid-from basis) and `valid_from_fragment_id` (a UUID). `src/modules/curation/dto/item.dto.ts` (`CorrectedValuesSchema`)
- `corrected` must set at least one of `value`, `target_node_id`, `valid_from` or `valid_to`. `valid_from_source` or `valid_from_fragment_id` alone does not count. `src/modules/curation/dto/item.dto.ts` (`CorrectItemBodySchema.superRefine`)
- `corrected.value` is refused on a link, and `corrected.target_node_id` is refused on an attribute. `src/modules/curation/dto/item.dto.ts` (`CorrectItemBodySchema.superRefine`)
- A corrected `valid_from` requires `valid_from_source`. When `valid_from_source` is `stated`, it also requires `valid_from_fragment_id`. `src/modules/curation/dto/item.dto.ts` (`CorrectItemBodySchema.superRefine`)
- A correction may state `valid_from_source` `received`. `src/modules/curation/dto/item.dto.ts` (`CorrectedValuesSchema.valid_from_source`)
- When a corrected `valid_from` and `valid_to` are both given, `valid_from` must be strictly earlier than `valid_to`, compared as `YYYY-MM-DD` strings. `src/modules/curation/dto/item.dto.ts` (`CorrectItemBodySchema.superRefine`)
- The corrected item is set to `superseded` with `superseded_at = now()`, and its `valid_to` is left unchanged. This happens only when its status is `active`, `uncertain` or `disputed`. `src/modules/curation/repository/curation.repository.ts` (`supersedePredecessor`)
- A successor link is inserted with the predecessor's `source_node_id`, `link_type_id` and `confidence`. Its `target_node_id`, `valid_from`, `valid_to` and `valid_from_source` are the corrected values where given and the predecessor's otherwise. Its status is `active`, `created_by_run_id` is null, `supersedes_link_id` is the predecessor and `recorded_at` is `now()`. `src/modules/curation/repository/curation.repository.ts` (`insertCorrectedRow`, link branch)
- A successor attribute is inserted with the predecessor's `node_id`, `attribute_key_id`, `value_type` and `confidence`. Its `value`, `valid_from`, `valid_to` and `valid_from_source` are the corrected values where given and the predecessor's otherwise. Its status is `active`, `created_by_run_id` is null, `supersedes_attribute_id` is the predecessor and `recorded_at` is `now()`. `src/modules/curation/repository/curation.repository.ts` (`insertCorrectedRow`, attribute branch)
- A correction cannot clear a field to null, because a null or absent corrected value keeps the predecessor's value (`COALESCE`). `src/modules/curation/repository/curation.repository.ts` (`insertCorrectedRow`)
- Every provenance entry of the predecessor is copied to the successor. A (successor, fragment) pair that already exists is skipped. `src/modules/curation/repository/curation.repository.ts` (`copyProvenance`)
- A given errata fragment is added as a provenance entry of the successor. An existing pair is skipped. `src/modules/curation/repository/curation.repository.ts` (`appendProvenanceFragment`)
- A fragment cited in a correction is looked up by `id` together with its `status`. `src/modules/curation/repository/curation.repository.ts` (`findInformationFragmentById`)

### Curation action recording
- A curation action is recorded with `action`, `target_kind` (`node`, `link` or `attribute`), `target_id`, `payload` (JSON) and `reason` (nullable). Its `id` and `created_at` are returned from the stored row. `src/modules/curation/repository/curation.repository.ts` (`insertCurationAction`, `CurationActionInsertArgs`)

### Shared request formats
- An identifier is a UUID string. `src/modules/curation/dto/enums.dto.ts` (`UuidSchema`)
- A date is a string that matches `^\d{4}-\d{2}-\d{2}$`. Only the shape is checked, not the calendar. `src/modules/curation/dto/enums.dto.ts` (`IsoDateSchema`)
- A required reason is trimmed and must then hold at least 1 character, so a reason of only whitespace is refused. `src/modules/curation/dto/enums.dto.ts` (`ReasonRequiredSchema`)

### Transports and parity
- The same seven operations are offered as REST routes and as MCP tools. Both call the same service function per operation. `src/modules/curation/routes/curation.routes.ts` (`registerCurationRoutes`), `src/modules/curation/mcp/curation-toolset.ts` (`registerCurationToolset`)
- The curation MCP tools are registered under the toolset key `curation`. `src/modules/curation/mcp/curation-toolset.ts` (`mcp.registerTool("curation", …)`)
- The curation MCP endpoint is `POST /mcp/curation` inside the calling scope. `src/modules/curation/mcp/curation-transport.ts` (`registerCurationMcpTransport`, `path: "/mcp/curation"`)
- The endpoint exposes the tools named in its `toolNames` that are registered under `curation`. A listed name that is not registered is dropped silently. `src/modules/curation/mcp/curation-transport.ts` (`getTools`, `.filter`)
- An MCP tool call re-parses its input through the operation's schema before running. Every thrown value becomes `{ ok: false, error: { code, message, details } }`, with the same classification the REST routes use. `src/modules/curation/mcp/curation-toolset.ts` (`makeHandler`), `src/modules/curation/mcp/error-envelope.ts` (`mapErrorToEnvelope`)
- An MCP error envelope carries no HTTP status of its own. `src/modules/curation/mcp/error-envelope.ts` (`mapErrorToEnvelope`)
- Each MCP tool publishes a description over `tools/list`. `src/modules/curation/mcp/curation-toolset.ts` (`CurationToolDescriptions`)

### Order of checks
- `POST /entity-matches/:node_id/resolve` (REST) checks the `node_id` path parameter first. That check is outside the curation mapper's `try`. The body is checked next, and the service runs only after both pass. `src/modules/curation/routes/curation.routes.ts` (`NodeIdPathSchema.parse` before the `try { ResolveEntityMatchBodySchema.parse }`)
- `resolve_entity_match` (MCP) checks `node_id` and the body in one parse of the combined schema. `src/modules/curation/mcp/curation-toolset.ts` (`ResolveEntityMatchToolInputSchema`, `makeHandler`)
- `POST /nodes/merge`, `POST /disputes/resolve`, `POST /items/confirm`, `POST /items/reject` and `POST /items/correct` each check the body completely before the service runs. `src/modules/curation/routes/curation.routes.ts` (separate `try` blocks around `parse` and the service call)
- When a request raises several business refusals during validation, the one answered is the first present in this order: `BUSINESS_TARGET_NODE_REQUIRED`, `BUSINESS_REASON_REQUIRED`, `BUSINESS_SELF_MERGE_FORBIDDEN`, `BUSINESS_DISPUTE_WINNER_REQUIRED`, `BUSINESS_DISPUTE_PERIODS_REQUIRED`, `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_CORRECTION_NO_CHANGES`, `BUSINESS_DATE_UNJUSTIFIED`. `src/modules/curation/mcp/error-envelope.ts` (`ZOD_CUSTOM_CODE_PRIORITY`, `mapZodError`)
- For `resolve_entity_match` with `merge_into`, a missing `target_node_id` is answered ahead of a missing `reason`. `src/modules/curation/mcp/error-envelope.ts` (`ZOD_CUSTOM_CODE_PRIORITY`)
- For `resolve_dispute` with `prefer_one`, a missing `reason` is answered ahead of a missing or foreign `winner_id`. `src/modules/curation/mcp/error-envelope.ts` (`ZOD_CUSTOM_CODE_PRIORITY`)
- For `resolve_dispute`, duplicate `item_ids` are answered as `VALIDATION_INVALID_FORMAT` only when no business refusal was also raised in the same parse. `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`), `src/modules/curation/dto/dispute.dto.ts` (`superRefine`)
- For `correct_item`, an inverted `valid_from`/`valid_to` pair is answered ahead of a missing date justification. `src/modules/curation/mcp/error-envelope.ts` (`ZOD_CUSTOM_CODE_PRIORITY`)
- For `correct_item`, `value` on a link or `target_node_id` on an attribute is answered as `VALIDATION_INVALID_FORMAT` only when no business refusal was also raised. `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`), `src/modules/curation/dto/item.dto.ts` (`superRefine`)
- A thrown error is classified in this order: the curation errors not-found, node-deleted, conflict, business and validation; then request-validation failures; then a database unique violation; then database unavailability; then anything else. `src/modules/curation/mcp/error-envelope.ts` (`mapErrorToHttpResponse`)

## Answers
- `resolve_entity_match` (REST and MCP) — `decision` `merge_into` without `target_node_id` → 422 `BUSINESS_TARGET_NODE_REQUIRED` (message "decision=merge_into requires target_node_id"; `details.issues[]` of `{ path, message }`). `src/modules/curation/dto/entity-match.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`, `messageForZodCustomCode`)
- `resolve_entity_match` (REST and MCP) — `decision` `merge_into` with `reason` missing, null or blank → 422 `BUSINESS_REASON_REQUIRED` (message "reason is required for the requested operation"; `details.issues[]`). `src/modules/curation/dto/entity-match.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`)
- `POST /entity-matches/:node_id/resolve` — `node_id` path parameter not a UUID → 422 `VALIDATION_INVALID_FORMAT` (message "Request payload failed validation."; `details` is an array of `{ path, message }`). This is answered by the global error handler, not the curation mapper. `src/modules/curation/routes/curation.routes.ts` (`NodeIdPathSchema.parse` outside `try`)
- `merge_nodes` (REST and MCP) — `survivor_id` equal to `absorbed_id` → 409 `BUSINESS_SELF_MERGE_FORBIDDEN` (message "survivor_id equals absorbed_id"; `details.issues[]`, path `absorbed_id`). `src/modules/curation/dto/entity-match.dto.ts` (`MergeNodesBodySchema.superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`, `status = 409`)
- `merge_nodes` (REST and MCP) — `reason` missing or blank → 422 `VALIDATION_INVALID_FORMAT` (message "Request payload failed validation."; `details.issues[]`). `src/modules/curation/dto/entity-match.dto.ts` (`ReasonRequiredSchema`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`)
- `resolve_dispute` (REST and MCP) — `item_ids` with fewer than 2 entries or a non-UUID entry → 422 `VALIDATION_INVALID_FORMAT` (`details.issues[]`). `src/modules/curation/dto/dispute.dto.ts` (`z.array(UuidSchema).min(2)`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`)
- `resolve_dispute` (REST and MCP) — duplicate `item_ids` → 422 `VALIDATION_INVALID_FORMAT` (`details.issues[]`, path `item_ids`, message "VALIDATION_INVALID_FORMAT"). `src/modules/curation/dto/dispute.dto.ts` (`superRefine`)
- `resolve_dispute` (REST and MCP) — `prefer_one` with `reason` missing or blank → 422 `BUSINESS_REASON_REQUIRED` ("reason is required for the requested operation"). `src/modules/curation/dto/dispute.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`)
- `resolve_dispute` (REST and MCP) — `prefer_one` with `winner_id` missing or not one of `item_ids` → 422 `BUSINESS_DISPUTE_WINNER_REQUIRED` ("decision=prefer_one requires winner_id (member of item_ids)"). `src/modules/curation/dto/dispute.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`messageForZodCustomCode`)
- `resolve_dispute` (REST and MCP) — `adjust_periods` with `periods` missing, empty, of a different count than `item_ids`, naming an `item_id` outside `item_ids`, or naming an `item_id` twice → 422 `BUSINESS_DISPUTE_PERIODS_REQUIRED` ("decision=adjust_periods requires periods[] (one entry per item_id)"). `src/modules/curation/dto/dispute.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`messageForZodCustomCode`)
- `resolve_dispute` (REST and MCP) — `adjust_periods` entry with `valid_from` ≥ `valid_to` → 422 `BUSINESS_TEMPORAL_INCOHERENT` ("Adjusted periods violate `valid_from < valid_to` or overlap on a functional scope"). `src/modules/curation/dto/dispute.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`messageForZodCustomCode`)
- `confirm_item` (REST and MCP) — `item_kind` outside the item kinds, `item_id` not a UUID, or a given `reason` blank → 422 `VALIDATION_INVALID_FORMAT` (`details.issues[]`). `src/modules/curation/dto/item.dto.ts` (`ConfirmItemBodySchema`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`)
- `reject_item` (REST and MCP) — `reason` missing or blank → 422 `VALIDATION_INVALID_FORMAT` (`details.issues[]`). `src/modules/curation/dto/item.dto.ts` (`RejectItemBodySchema`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`)
- `correct_item` (REST and MCP) — `corrected` sets none of `value`, `target_node_id`, `valid_from` or `valid_to` → 422 `BUSINESS_CORRECTION_NO_CHANGES` ("corrected{} must change at least one of value, target_node_id, valid_from, valid_to"). `src/modules/curation/dto/item.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`messageForZodCustomCode`)
- `correct_item` (REST and MCP) — `corrected.value` on a link, or `corrected.target_node_id` on an attribute → 422 `VALIDATION_INVALID_FORMAT` (path `corrected.value` or `corrected.target_node_id`). `src/modules/curation/dto/item.dto.ts` (`superRefine`)
- `correct_item` (REST and MCP) — `corrected.valid_from` without `valid_from_source`, or with `valid_from_source` `stated` and no `valid_from_fragment_id` → 422 `BUSINESS_DATE_UNJUSTIFIED` ("valid_from change requires a justification (stated|document|received)"). `src/modules/curation/dto/item.dto.ts` (`superRefine`), `src/modules/curation/mcp/error-envelope.ts` (`messageForZodCustomCode`)
- `correct_item` (REST and MCP) — `corrected.valid_from` ≥ `corrected.valid_to` → 422 `BUSINESS_TEMPORAL_INCOHERENT`. `src/modules/curation/dto/item.dto.ts` (`superRefine`)
- `correct_item` (REST and MCP) — `reason` missing or blank → 422 `VALIDATION_INVALID_FORMAT`. `src/modules/curation/dto/item.dto.ts` (`ReasonRequiredSchema`)
- Every body-validated operation (REST and MCP) — a validation failure that raises no business refusal (wrong type, unknown enum value, a malformed UUID or date, a missing required field) → 422 `VALIDATION_INVALID_FORMAT` (message "Request payload failed validation."; `details: { issues: [{ path, message }] }`, with `path` joined by "."). `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`, `zodIssuesAsDetails`)
- `GET /queue` — `kind` outside the review-queue kinds, `limit` outside 1–100 or not an integer, or `offset` negative or not an integer → 422 `VALIDATION_INVALID_FORMAT` through the global error handler (`details` is an array of `{ path, message }`). `src/modules/curation/routes/curation.routes.ts` (`ListReviewQueueQuerySchema.parse`, not wrapped by `sendError`)
- `list_review_queue` (MCP) — the same query violations → `VALIDATION_INVALID_FORMAT` (`details: { issues: [...] }`). `src/modules/curation/mcp/curation-toolset.ts` (`makeHandler`), `src/modules/curation/mcp/error-envelope.ts` (`mapZodError`)
- Every curation operation — a curation not-found, node-deleted, conflict, business or validation error raised by the service → the error's own `statusCode`, `code`, `message` and `details`. `src/modules/curation/mcp/error-envelope.ts` (`mapErrorToHttpResponse`, `instanceof` branches)
- Every curation operation — the database rejects a write as a unique violation (SQLSTATE `23505`) → 422 `BUSINESS_TEMPORAL_INCOHERENT` ("A duplicate-guard index rejected the resolution; another row currently occupies this scope."; no `details`). `src/modules/curation/mcp/error-envelope.ts` (`isPgUniqueViolation` branch)
- Every curation operation except `GET /metrics` — the database is unreachable or a statement times out → 503 `SYSTEM_SERVICE_UNAVAILABLE` ("A backing service is temporarily unavailable.", as `serviceUnavailableError` renders it). `src/modules/curation/mcp/error-envelope.ts` (`isPgUnavailable` branch)
- Every curation operation except `GET /metrics` — any other failure → 500 `SYSTEM_INTERNAL_ERROR` ("Internal server error.", as `internalError` renders it). The underlying message is never sent. `src/modules/curation/mcp/error-envelope.ts` (`internalError()` fallback)
- `GET /metrics` — any failure that would answer 500 → 503 `SYSTEM_SERVICE_UNAVAILABLE` ("A backing service is temporarily unavailable."). Any other mapped status is answered unchanged. `src/modules/curation/routes/curation.routes.ts` (`degradedStatus`, `degradedEnvelope`)

## Vocabularies
- Item kind (`item-kind`): `link`, `attribute`. `src/modules/curation/dto/enums.dto.ts` (`ItemKindSchema`)
- Review queue kind: `entity_match`, `disputed`. `src/modules/curation/dto/enums.dto.ts` (`ReviewQueueKindSchema`)
- Entity-match decision: `merge_into`, `keep_separate`. `src/modules/curation/dto/enums.dto.ts` (`EntityMatchDecisionSchema`)
- Dispute decision: `prefer_one`, `adjust_periods`, `keep_disputed`. `src/modules/curation/dto/enums.dto.ts` (`DisputeDecisionSchema`)
- Node status (`node-status`): `active`, `needs_review`, `merged`, `deleted`. `src/modules/curation/dto/enums.dto.ts` (`NodeStatusSchema`)
- Assertion status (`assertion-status`): `active`, `uncertain`, `disputed`, `superseded`, `deleted`. `src/modules/curation/dto/enums.dto.ts` (`AssertionStatusSchema`)
- Valid-from basis (`valid-from-basis`): `stated`, `document`, `received`. `src/modules/curation/dto/enums.dto.ts` (`ValidFromSourceSchema`)
- Curation target kind (`curation-target-kind`): `node`, `link`, `attribute`. `src/modules/curation/repository/curation.repository.ts` (`CurationActionInsertArgs.target_kind`)
- Curation MCP tool names: `list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`. `src/modules/curation/mcp/curation-toolset.ts` (`CURATION_TOOL_NAMES`)
- Accept actions, counted by `accept_rate` (part of `curation-action-kind`): `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `correct_item`. `reject_item` is the action that `reject_rate_by_code` reads. `src/modules/curation/repository/curation.repository.ts` (`ACCEPT_ACTIONS`, `aggregateCurationMetrics`)
- Attribute value type, as read on a locked attribute (`value-type`): `date`, `number`, `text`, `bool`. `src/modules/curation/repository/curation.repository.ts` (`ItemLockedRow.value_type`)
- Curation refusal codes raised during validation, in the order they take precedence: `BUSINESS_TARGET_NODE_REQUIRED`, `BUSINESS_REASON_REQUIRED`, `BUSINESS_SELF_MERGE_FORBIDDEN`, `BUSINESS_DISPUTE_WINNER_REQUIRED`, `BUSINESS_DISPUTE_PERIODS_REQUIRED`, `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_CORRECTION_NO_CHANGES`, `BUSINESS_DATE_UNJUSTIFIED`. `src/modules/curation/mcp/error-envelope.ts` (`ZOD_CUSTOM_CODE_PRIORITY`)

## Upstream artifacts
- `knowledge_node` is read, locked and updated (`id`, `node_type_id`, `canonical_name`, `status`, `merged_into_node_id`, `created_at`). `src/modules/curation/repository/curation.repository.ts` (`loadNodesForUpdate`, `updateNodeStatusKeepSeparate`, `updateNodeMerged`, `pathCompressMergedInto`)
- `node_type.name` is read for the entity-match queue. `src/modules/curation/repository/curation.repository.ts` (`listEntityMatchQueue`)
- `node_alias` is written on merge (`node_id`, `alias`, `kind`, `created_by_run_id`, `created_at`), relying on a uniqueness of (`node_id`, `alias_norm`). `src/modules/curation/repository/curation.repository.ts` (`copyAliases`, `ON CONFLICT (node_id, alias_norm)`)
- `entity_match_review` is read (`node_id`, `candidate_node_id`, `similarity`) and deleted per node. `src/modules/curation/repository/curation.repository.ts` (`listEntityMatchQueue`, `deleteEntityMatchReviewByNode`)
- `knowledge_link` is read, locked, updated and inserted (`source_node_id`, `target_node_id`, `link_type_id`, `valid_from`, `valid_to`, `status`, `confidence`, `valid_from_source`, `superseded_at`, `supersedes_link_id`, `created_by_run_id`, `recorded_at`). `src/modules/curation/repository/curation.repository.ts` (`loadItemsForUpdate`, `insertCorrectedRow`)
- `link_type` is read (`name`, `allows_multiple_current`). `src/modules/curation/repository/curation.repository.ts` (`listDisputedLinks`)
- `node_attribute` is read, locked, updated and inserted (`node_id`, `attribute_key_id`, `value_type`, `value`, `valid_from`, `valid_to`, `status`, `confidence`, `valid_from_source`, `superseded_at`, `supersedes_attribute_id`, `created_by_run_id`, `recorded_at`). `src/modules/curation/repository/curation.repository.ts` (`loadItemsForUpdate`, `insertCorrectedRow`)
- `attribute_key.key` is read for the disputed attribute queue. `src/modules/curation/repository/curation.repository.ts` (`listDisputedAttributes`)
- `provenance` is written (`link_id` or `attribute_id`, `fragment_id`, `created_at`), relying on uniqueness of (`link_id`, `fragment_id`) and (`attribute_id`, `fragment_id`). `src/modules/curation/repository/curation.repository.ts` (`copyProvenance`, `appendProvenanceFragment`)
- `information_fragment` is read (`id`, `status`). `src/modules/curation/repository/curation.repository.ts` (`findInformationFragmentById`)
- `curation_action` is written (`action`, `target_kind`, `target_id`, `payload` jsonb, `reason`), and its `id` and `created_at` come back from the database. It is read for the metrics (`action`, `payload->>'error_code'`). `src/modules/curation/repository/curation.repository.ts` (`insertCurationAction`, `aggregateCurationMetrics`)
- The views `knowledge_link_resolved` and `node_attribute_resolved` are read for their derived `effective_status`. `src/modules/curation/repository/curation.repository.ts` (`aggregateCurationMetrics`)
- The database enum types `assertion_status` and `valid_from_source` are cast to on insert. `src/modules/curation/repository/curation.repository.ts` (`insertCorrectedRow`)
- The PostgreSQL SQLSTATE `23505` (unique violation) is read as a refusal signal. `src/modules/curation/mcp/error-envelope.ts` (`isPgUniqueViolation`)
- The knowledge-graph catalog snapshot and the ingestion catalog snapshot, owned by other modules, are handed to the dispute and item services. `src/modules/curation/routes/curation.routes.ts` (`CurationRouteDeps`), `src/modules/curation/mcp/curation-toolset.ts` (`CurationToolsetDeps`)
- The MCP tool registry, shared by the whole process, holds the `curation` tools. Tools of other modules registered under the same key are exposed when named in `toolNames`. `src/modules/curation/mcp/curation-transport.ts` (`deps.mcp.getTool("curation", name)`)

## Outside the domain
- The MCP SDK kernel mount (`mountMcpEndpoint`) and the server identity `remember-bff-curation` / `0.1.0`: transport wiring. `src/modules/curation/mcp/curation-transport.ts`.
- JSON Schema derivation for `tools/list` (`z.toJSONSchema` with `unrepresentable: "any"`): framework wiring. `src/modules/curation/mcp/curation-toolset.ts`.
- The log events `curation_toolset_registered`, `curation_request_failed` and `curation_metrics_degraded`, and their fields: logging. `src/modules/curation/mcp/curation-toolset.ts`, `src/modules/curation/routes/curation.routes.ts`.
- The `logLevel` classification (`warn`/`error`) carried alongside each mapped answer: logging. `src/modules/curation/mcp/error-envelope.ts`.
- `SELECT … FOR UPDATE` row locks on nodes and items: concurrency mechanism. `src/modules/curation/repository/curation.repository.ts`.
- The `InvariantError` thrown when an insert returns no row: internal guard. `src/modules/curation/repository/curation.repository.ts`.
- The module's public exports (`registerCurationRoutes`, `registerCurationToolset`, `registerCurationMcpTransport`, `CURATION_TOOL_NAMES`, …): module wiring. `src/modules/curation/index.ts`.
- The `sendError` helper, the defensive re-parse in `makeHandler` and the Fastify `request`/`reply` glue: framework wiring. `src/modules/curation/routes/curation.routes.ts`, `src/modules/curation/mcp/curation-toolset.ts`.
- Text casts of dates, numerics and counts (`::text`, `Number(...)`): driver representation. `src/modules/curation/repository/curation.repository.ts`.

## Observed and not decided here
- The answer to a missing reason depends on the operation. `resolve_entity_match` (`merge_into`) and `resolve_dispute` (`prefer_one`) answer 422 `BUSINESS_REASON_REQUIRED` (`src/modules/curation/dto/entity-match.dto.ts` `ResolveEntityMatchBodySchema.superRefine`; `src/modules/curation/dto/dispute.dto.ts` `superRefine`). `merge_nodes`, `reject_item` and `correct_item` require `reason` through `ReasonRequiredSchema` and answer 422 `VALIDATION_INVALID_FORMAT` (`src/modules/curation/dto/entity-match.dto.ts` `MergeNodesBodySchema`; `src/modules/curation/dto/item.dto.ts` `RejectItemBodySchema`, `CorrectItemBodySchema`).
- `VALIDATION_INVALID_FORMAT` has two shapes of `details`. Body refusals answered by the curation mapper carry `details: { issues: [{ path, message }] }` (`src/modules/curation/mcp/error-envelope.ts` `zodIssuesAsDetails`, reached through `sendError` in `src/modules/curation/routes/curation.routes.ts`). The `GET /queue` query refusal and the `node_id` path refusal are thrown outside `sendError`, so they reach the global handler, which answers `details` as a bare array of `{ path, message }` (`src/modules/curation/routes/curation.routes.ts` `ListReviewQueueQuerySchema.parse`, `NodeIdPathSchema.parse`; handler in `src/middleware/error-handler.ts` `classify`).
- REST and MCP answer success in different shapes. Every REST route answers the bare service result with 200 (`src/modules/curation/routes/curation.routes.ts`, `reply.status(200).send(result)`). Every MCP tool answers `{ ok: true, result }` (`src/modules/curation/mcp/curation-toolset.ts` `makeHandler`). REST errors do use the `{ ok: false, error }` envelope (`sendError`).
- A failure the mapper answers 500 is answered 500 `SYSTEM_INTERNAL_ERROR` by every curation route (`src/modules/curation/routes/curation.routes.ts` `sendError`), but 503 `SYSTEM_SERVICE_UNAVAILABLE` by `GET /metrics` (`degradedStatus`).
- A resolution with `merge_into` sends `target_node_id` into the merge. Neither the request shape nor the MCP input refuses a `target_node_id` equal to the path or input `node_id` (`src/modules/curation/dto/entity-match.dto.ts` `ResolveEntityMatchBodySchema`; `src/modules/curation/mcp/curation-toolset.ts` `ResolveEntityMatchToolInputSchema`). The tool description published to the model says self-merge is refused with `BUSINESS_SELF_MERGE_FORBIDDEN` (`CurationToolDescriptions.resolve_entity_match`). Whether the service refuses it was not read here.
- `disputed_queue_count` groups disputed links by (`source_node_id`, `target_node_id`, `link_type_id`) whatever the link type's cardinality (`src/modules/curation/repository/curation.repository.ts` `aggregateCurationMetrics`). The queue listing groups competing targets of a link type whose `allows_multiple_current` is false into one item (`src/modules/curation/service/queue.service.ts` `groupDisputedLinks`, outside the area). The two counts differ for such disputes.
- The entity-match page takes `LIMIT`/`OFFSET` over node-candidate joined rows (`src/modules/curation/repository/curation.repository.ts` `listEntityMatchQueue`), while its total counts nodes (`countEntityMatchQueue`). The disputed page applies the same `limit`/`offset` separately to links and to attributes (`listDisputedLinks`, `listDisputedAttributes`), while its total adds both counts.
