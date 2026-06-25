---
name: u-spec-globals-error-codes
description: Centralized project error code catalog. Every error.code must be registered here before being used in any spec.
user-invocable: false
---

# Global Error Code Catalog

## Rules
1. Every `error.code` is a SCREAMING_SNAKE_CASE string
2. Prefix indicates the category: `AUTH_`, `VALIDATION_`, `RESOURCE_`, `BUSINESS_`, `SYSTEM_`
3. Never reuse a removed code — mark as `deprecated`
4. Every new code must be registered here BEFORE being used in any spec
5. The Spec Reviewer validates that no code is used without being in this catalog

## Base Codes (present in every project)

### Authentication (AUTH_)
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `AUTH_TOKEN_EXPIRED` | 401 | Authentication token expired | JWT expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid or malformed token | JWT not decodable |
| `AUTH_UNAUTHORIZED` | 401 | Not authenticated | Request without token |
| `AUTH_FORBIDDEN` | 403 | No permission for this resource | RBAC denied access |

### Validation (VALIDATION_)
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `VALIDATION_REQUIRED_FIELD` | 422 | Required field missing | Incomplete body |
| `VALIDATION_INVALID_FORMAT` | 422 | Invalid format | Email, date, etc. |
| `VALIDATION_OUT_OF_RANGE` | 422 | Value outside allowed range | Min/max violated |

### Resource (RESOURCE_)
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `RESOURCE_NOT_FOUND` | 404 | Resource not found | Nonexistent ID |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists | Unique constraint |
| `RESOURCE_CONFLICT` | 409 | State conflict | Concurrent operation |

### Business (BUSINESS_)
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| (defined per domain — each domain adds its own below) | | | |

### System (SYSTEM_)
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `SYSTEM_INTERNAL_ERROR` | 500 | Unexpected internal error | Unhandled exception |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | External service unavailable | Integration timeout |
| `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | 502 | Anthropic provider unreachable / non-recoverable during an extraction run | The in-process extraction orchestrator (`ingestion.spec.md` UC-12, BR-26) catches a non-recoverable Anthropic SDK error (auth, quota, network) mid-chunk; partial extraction is preserved and the run is closed as `failed` (`ingestion.spec.md` UC-12 alt 4a). |

## Codes by Domain
<!-- Each domain adds its BUSINESS_ codes here when specified -->
<!-- Format: ### {Domain} followed by table with the 4 fields above -->

### Ingestion
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_RUN_NOT_RETRYABLE` | 409 | LLMRun cannot be retried in its current status | `retryLlmRun` called against a run whose `status` is `running` or `completed`; only `failed` is retryable (`ingestion.spec.md` UC-06, BR-11). |
| `BUSINESS_RUN_NOT_RUNNABLE` | 409 | LLMRun cannot be extracted in its current status | `runLlmExtraction` called against a run whose `status` is `completed` or `failed`; only `running` is runnable (the caller must invoke `retryLlmRun` first to reopen a failed run) (`ingestion.spec.md` UC-12, BR-26). |
| `BUSINESS_RUN_NOT_RUNNING` | 409 | LLMRun referenced by a REST propose-* mirror is not currently running | REST mirrors of the MCP `ingest` toolset (`proposeFragment`/`proposeNode`/`proposeLink`/`proposeAttribute`) are called against a run whose `status != 'running'`; the MCP transport collapses this into `STRUCTURAL_INVALID` since the LLM only sees its ambient run (`ingestion.spec.md` UC-08..UC-11 alt 1a REST branch, BR-21). |

> **MCP envelope error codes for the `ingest` toolset** are documented in `ingestion.spec.md` §6.2 (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`). They are normative for the MCP transport only (defined in §14 of `remember-modelagem-v7.md`) and are intentionally not mirrored as `BUSINESS_*` codes here — REST does not expose those tools.

### Knowledge Graph
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_NODE_DELETED` | 410 | `KnowledgeNode` was tombstoned by `compliance_delete` (section 11) | Read endpoints (`getNodeById`, `getAttributeKeyHistory`) hit a node whose `status = 'deleted'`. The row remains in the DB; the API refuses to serve it to avoid recirculating tombstoned content (`knowledge-graph.spec.md` UC-05, UC-11, BR-14, error table §6). Reused by `curation` for `resolveEntityMatch` against a deleted node (`curation.spec.md` UC-02, UC-03, BR-22). |
| `BUSINESS_UNKNOWN_NODE_TYPE` | 422 | `node_type` query/filter is not registered in the seed catalog | `listAttributeKeys`, `listNodes` receive a `node_type` parameter whose name does not exist in `node_type` (catalog is migration-only per BR-17). (`knowledge-graph.spec.md` UC-03, UC-04, BR-17). |
| `BUSINESS_UNKNOWN_LINK_TYPE` | 422 | `link_types[]` query element is not registered in the seed catalog | `traverseNode` receives a `link_types[]` element whose name does not exist in `link_type` (catalog is migration-only per BR-17). Reused by `query-retrieval` for the `expand_link_types[]` parameter of `searchKnowledge` (`query-retrieval.spec.md` UC-01, BR-15). |
| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | 404 | `{key}` path segment is not registered for the node's NodeType | `getAttributeKeyHistory` is called with a `(node_type_id, key)` pair that has no row in `attribute_key` (catalog is migration-only per BR-17). (`knowledge-graph.spec.md` UC-11, BR-17). |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | 422 | `depth` parameter outside `[1, 3]` | `traverseNode` receives `depth = 0`, `depth >= 4`, or non-integer (ADR A16 / `knowledge-graph.spec.md` UC-06, BR-18). Reused by `query-retrieval` for the `expand_depth` parameter of `searchKnowledge` (`query-retrieval.spec.md` UC-01, BR-06, BR-15). |

### Query / Retrieval
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_INVALID_SEARCH_QUERY` | 422 | `query` is empty, parses to an empty `tsquery`, or exceeds 1000 chars | `searchKnowledge` receives a `query` whose `btrim` is empty, whose length > 1000 (mirrors the `information_fragment.text` DB CHECK), or whose `websearch_to_tsquery` output is empty (e.g., only stopwords / only operators) (`query-retrieval.spec.md` UC-01, BR-15). |
| `BUSINESS_INVALID_SEARCH_LAYER` | 422 | `layers[]` contains a value outside `{fragment, node, chunk}` | `searchKnowledge` receives a `layers[]` element whose value is not in the closed set of the three pipeline layers of section 7.2 (`query-retrieval.spec.md` UC-03, BR-15). |
| `BUSINESS_FRAGMENT_NOT_ACCEPTED` | 404 | `InformationFragment` exists but its `status != 'accepted'` | `getProvenanceByFragment` is called with a `fragment_id` whose `status IN ('proposed', 'rejected', 'deleted')`. The DB has a partial GIN index restricted to `status = 'accepted'`; surfacing non-accepted fragments via point-read would bypass the policy (`query-retrieval.spec.md` UC-09, BR-05). |
| `BUSINESS_RAW_INFORMATION_DELETED` | 410 | Underlying `RawInformation` tombstoned by `compliance_delete` (section 11) | Provenance walks (`getProvenanceByLink`, `getProvenanceByAttribute`, `getProvenanceByFragment`) hit a chain whose terminal `RawInformation.status = 'deleted'`. We refuse to recirculate tombstoned content even partially (`query-retrieval.spec.md` UC-07, UC-08, UC-09, BR-14). |

### Curation
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_REVIEW_NOT_PENDING` | 409 | Node is not in `needs_review` state | `resolveEntityMatch` is called against a node whose `status != 'needs_review'` (already `active`, `merged`, or otherwise). Only nodes in the `entity_match` queue admit resolution (`curation.spec.md` UC-02, UC-03). |
| `BUSINESS_TARGET_NODE_REQUIRED` | 422 | `decision = merge_into` request missing `target_node_id` | `resolveEntityMatch` receives `decision = merge_into` with `target_node_id = null` (`curation.spec.md` UC-02, BR-10). |
| `BUSINESS_INVALID_TARGET_NODE` | 422 | Referenced target node is not eligible (wrong status or node_type mismatch) | `resolveEntityMatch(merge_into)` or `mergeNodes` references a `target_node_id` / `survivor_id` / `absorbed_id` whose `status != 'active'`, OR the two nodes have different `node_type_id` (section 4.4 invariant + section 4.2 scope) (`curation.spec.md` UC-02, UC-04, BR-03, BR-04). |
| `BUSINESS_SELF_MERGE_FORBIDDEN` | 409 | Merge would map a node onto itself | `resolveEntityMatch(merge_into)` with `target_node_id = node_id`, or `mergeNodes` with `survivor_id = absorbed_id` (section 4.4 invariant) (`curation.spec.md` UC-02, UC-04, BR-04). |
| `BUSINESS_ITEM_NOT_DISPUTED` | 409 | One or more items in `resolveDispute` are not currently `disputed`, or share scopes do not match | `resolveDispute` receives `item_ids` containing at least one row whose `status != 'disputed'`, OR rows from different conflict scopes ((source, target, link_type) for links; (node, key) for attributes) (`curation.spec.md` UC-05, UC-06, UC-07, BR-05). |
| `BUSINESS_DISPUTE_WINNER_REQUIRED` | 422 | `decision = prefer_one` request missing or invalid `winner_id` | `resolveDispute` with `decision = prefer_one` and `winner_id = null`, OR `winner_id` not a member of `item_ids` (`curation.spec.md` UC-05). |
| `BUSINESS_DISPUTE_PERIODS_REQUIRED` | 422 | `decision = adjust_periods` request missing `periods[]` or count mismatch | `resolveDispute` with `decision = adjust_periods` and `periods = null/empty`, OR `periods.length != item_ids.length`, OR `periods[]` does not cover every id in `item_ids` (`curation.spec.md` UC-06). |
| `BUSINESS_ITEM_NOT_UNCERTAIN` | 409 | `confirmItem` requires `status = uncertain` | `confirmItem` is called against an item whose `status != 'uncertain'`. There is no other path that promotes `active`/`disputed`/`superseded`/`deleted` via this endpoint (`curation.spec.md` UC-08, section 6.6). |
| `BUSINESS_ITEM_NOT_DELETABLE` | 409 | `rejectItem` / `correctItem` called on an item already terminal | The item's `status IN ('deleted', 'superseded')`. The transition would either be a no-op (`deleted`) or override a documented prior decision; both are refused (`curation.spec.md` UC-09, UC-10, section 6.6). |
| `BUSINESS_CORRECTION_NO_CHANGES` | 422 | `correctItem` request with empty `corrected{}` | None of `value`, `target_node_id`, `valid_from`, `valid_to` provided in `corrected` (`curation.spec.md` UC-10, BR-11). |
| `BUSINESS_DATE_UNJUSTIFIED` | 422 | `valid_from` change without justification chain | `correctItem` changes `valid_from` without `valid_from_source`; OR `valid_from_source = 'stated'` without `valid_from_fragment_id`; OR the referenced fragment does not exist or has `status != 'accepted'` (section 6.5 + ADR A14; `curation.spec.md` UC-10, BR-15). |
| `BUSINESS_TEMPORAL_INCOHERENT` | 422 | Period violates the semi-open invariant `[valid_from, valid_to)` or the functional-scope rule | `correctItem` / `resolveDispute(adjust_periods)` supply `valid_from >= valid_to` (both non-null), OR an `adjust_periods` set would leave 2+ rows with `valid_to = NULL` on a functional scope (ADR A7, ADR A10; `curation.spec.md` UC-06, UC-10, BR-06, BR-09). |
| `BUSINESS_REASON_REQUIRED` | 422 | Destructive operation called without `reason` | `mergeNodes`, `resolveEntityMatch(merge_into)`, `resolveDispute(prefer_one)`, `rejectItem`, or `correctItem` called with `reason = null/empty` (`curation.spec.md` UC-02, UC-04, UC-05, UC-09, UC-10, BR-10). |

### Chat
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_CHAT_DISABLED` | 503 | Chat surface is disabled by operator kill-switch | Any chat endpoint called while `CHAT_ENABLED === false` (environment kill-switch). Returned pre-stream; no SSE connection is opened. `chat.spec.md` BR-14 / UC-09. |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503 | Anthropic provider unreachable or aborted during a chat turn | Pre-stream: Anthropic factory throws (missing API key, auth failure, etc.). In-stream: Anthropic stream emits a non-`AbortError` provider/network error mid-turn — delivered as an SSE `error` frame, not HTTP 503. `chat.spec.md` BR-11, BR-21 / UC-02. |
| `BUSINESS_CONVERSATION_ARCHIVED` | 409 | Write operation attempted on an archived conversation | `POST /api/v1/conversations/:id/messages` or `POST /api/v1/conversations/:id/cancel` called against a conversation whose `archived_at IS NOT NULL`. Unarchive via `PATCH /conversations/:id { "archived_at": null }` first. `chat.spec.md` BR-25 / UC-04, UC-06. |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | 409 | Same `Idempotency-Key` reused with a different body | `POST /api/v1/conversations/:id/messages` with an `Idempotency-Key` that already exists on the conversation but whose stored `(content, model)` tuple differs from the current request. Use the identical body to trigger idempotent replay, or use a new key. `chat.spec.md` BR-27 / UC-07. |
| `BUSINESS_TURN_IN_PROGRESS` | 409 | A turn is already running on this conversation | `POST /api/v1/conversations/:id/messages` called while another turn on the same conversation has not yet reached its terminal SSE frame. Single-owner default: one turn at a time per conversation. `chat.spec.md` BR-28 / UC-06, UC-08. |
| `BUSINESS_CHAT_INGEST_DISABLED` | 503 | Chat ingestion tools unavailable — `CHAT_INGEST_ENABLED=false` at boot | `ingest_directed` called from the chat agentic loop but `CHAT_INGEST_ENABLED` was not set to `true` at startup. The chat-side ingestion catalog entries are only activated when the flag is `true` (the `ingest_directed` tool itself is still registered on the `ingest` toolset for direct external MCP callers; see `ingestion.back.md` BR-34 "Rollout flag"). RESERVED for forward-compatibility; v2.3 implements this as a boot-time catalog filter and does NOT emit this code at runtime. `chat.spec.md` BR-44 / `chat.back.md` BR-44. |

## Deprecated Codes

Removed codes that CANNOT be reused. Keep here to avoid collision.

| error.code | Deprecated on | Reason | Replaced by |
|------------|---------------|--------|-------------|
<!-- Example: -->
<!-- | `BUSINESS_OLD_CODE` | 2026-03-21 | Domain restructured | `BUSINESS_NEW_CODE` | -->

### Deprecation rules
1. When removing an active error.code, move it to this section (do not delete)
2. Fill in all fields: date, reason, replacement code (or "none")
3. The Spec Reviewer validates that no deprecated code is being used in active specs
