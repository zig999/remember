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

## Codes by Domain
<!-- Each domain adds its BUSINESS_ codes here when specified -->
<!-- Format: ### {Domain} followed by table with the 4 fields above -->

### Knowledge Graph

| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_NODE_DELETED` | 410 | KnowledgeNode tombstoned by compliance_delete | `getNodeById`, `traverseNode`, or `getAttributeKeyHistory` called for a node with `status = 'deleted'` (section 11). Also reused by `curation` on `resolveEntityMatch` / `mergeNodes` against a tombstoned node (curation BR-22). |
| `BUSINESS_UNKNOWN_NODE_TYPE` | 422 | NodeType name not found in catalog | `node_type` query parameter does not match any `node_type.name` row |
| `BUSINESS_UNKNOWN_LINK_TYPE` | 422 | LinkType name not found in catalog | A name in `link_types[]` does not match any `link_type.name` row |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | 422 | Traversal depth outside `[1, 3]` | `depth` parameter out of range (ADR A16) |
| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | 404 | AttributeKey not registered for the node's NodeType | `key` path segment in `getAttributeKeyHistory` not in catalog for that `node_type_id` |

### Ingestion

| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_RUN_NOT_RETRYABLE` | 409 | LLMRun is not in a retryable state | `retryLlmRun` called when run status is `running` or `completed` |

### Query-Retrieval

| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_INVALID_SEARCH_QUERY` | 422 | Search query is empty or invalid | `query` is empty after `btrim`, exceeds 1000 chars, or `websearch_to_tsquery` produces an empty `tsquery` (BR-15) |
| `BUSINESS_INVALID_SEARCH_LAYER` | 422 | Unsupported layer value in `layers[]` | An element of `layers[]` is not in `{fragment, node, chunk}` (BR-15) |
| `BUSINESS_RAW_INFORMATION_DELETED` | 410 | Underlying RawInformation tombstoned by compliance_delete | Provenance walk encounters a `raw_information` row with `status = 'deleted'` (section 11, BR-14) |
| `BUSINESS_FRAGMENT_NOT_ACCEPTED` | 404 | InformationFragment exists but is not in accepted status | `getProvenanceByFragment` called with a `fragment_id` whose `status != 'accepted'` (BR-05, BR-10) |

### Curation

| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_REVIEW_NOT_PENDING` | 409 | Node is not in `needs_review` state | `resolveEntityMatch` called on a `knowledge_node` whose `status != 'needs_review'` (curation UC-02/UC-03 precondition, BR-22). |
| `BUSINESS_TARGET_NODE_REQUIRED` | 422 | `decision = merge_into` requires `target_node_id` | `resolveEntityMatch` request body has `decision = merge_into` but `target_node_id` is null or absent (UC-02). |
| `BUSINESS_INVALID_TARGET_NODE` | 422 | Merge target invalid (wrong status or node_type mismatch) | `resolveEntityMatch(merge_into)` or `mergeNodes` where the target node's `status != 'active'`, or `survivor.node_type_id != absorbed.node_type_id` (BR-03, BR-04). |
| `BUSINESS_SELF_MERGE_FORBIDDEN` | 409 | Self-merge attempted | `mergeNodes` with `survivor_id = absorbed_id` or `resolveEntityMatch(merge_into)` with `target_node_id = node_id` (BR-04). |
| `BUSINESS_ITEM_NOT_DISPUTED` | 409 | Item is not in `disputed` state or scope mismatch | `resolveDispute` finds an `item_id` whose `status != 'disputed'` OR the `item_ids` do not share a single conflict scope (BR-05). |
| `BUSINESS_DISPUTE_WINNER_REQUIRED` | 422 | `decision = prefer_one` requires `winner_id` (member of `item_ids`) | `resolveDispute(prefer_one)` body has `winner_id = null` or `winner_id` not in `item_ids` (UC-05). |
| `BUSINESS_DISPUTE_PERIODS_REQUIRED` | 422 | `decision = adjust_periods` requires one `periods[]` entry per `item_id` | `resolveDispute(adjust_periods)` body omits `periods[]` or the entry count differs from `item_ids.length` (UC-06). |
| `BUSINESS_TEMPORAL_INCOHERENT` | 422 | Temporal invariant violated (`valid_from >= valid_to`, or functional scope with 2+ open rows) | `correctItem` or `resolveDispute(adjust_periods)` would produce a row with `valid_from >= valid_to`, or would leave a functional scope (`allows_multiple_current = false`) with more than one `valid_to = NULL` row (BR-06, BR-09). |
| `BUSINESS_ITEM_NOT_UNCERTAIN` | 409 | Item is not in `uncertain` state | `confirmItem` called against a row whose `status != 'uncertain'` (UC-08). |
| `BUSINESS_ITEM_NOT_DELETABLE` | 409 | Item is already `deleted` or `superseded` (terminal) | `rejectItem` or `correctItem` called against a row whose `status IN ('deleted', 'superseded')` (UC-09, UC-10). |
| `BUSINESS_CORRECTION_NO_CHANGES` | 422 | `correct_item` corrected{} is empty / changes nothing | `correctItem` body has none of `value`, `target_node_id`, `valid_from`, `valid_to` supplied (BR-11). |
| `BUSINESS_DATE_UNJUSTIFIED` | 422 | `valid_from` change has no justification (stated/document/received) | `correctItem` changes `valid_from` without `valid_from_source`, OR with `valid_from_source = 'stated'` but no `valid_from_fragment_id`, OR the fragment is not `status = 'accepted'` (BR-15, ADR A14). |
| `BUSINESS_REASON_REQUIRED` | 422 | Destructive operation called without a non-empty `reason` | `mergeNodes`, `resolveEntityMatch(merge_into)`, `resolveDispute(prefer_one)`, `rejectItem`, or `correctItem` called with `reason` null, empty or whitespace-only (BR-10). |

### Chat

| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_CHAT_DISABLED` | 503 | Chat surface is disabled by kill-switch | Any `POST /api/v1/conversations/:id/messages` (or other chat endpoint) called while `env.CHAT_ENABLED === false`. Returned pre-stream (no SSE opened). `chat.spec.md` BR-14 / UC-09. |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503 (pre-stream) or n/a (in-stream `error` frame) | Anthropic provider could not be reached or aborted mid-turn | Pre-stream: Anthropic factory throws (missing `ANTHROPIC_API_KEY`, etc.). In-stream: Anthropic stream emits a non-`AbortError` provider/network error mid-turn. `chat.spec.md` BR-11, BR-21 / UC-02. |
| `BUSINESS_CONVERSATION_ARCHIVED` | 409 | Conversation is archived; writes are forbidden | `POST /api/v1/conversations/:id/messages` or `POST /api/v1/conversations/:id/cancel` called against a conversation whose `archived_at IS NOT NULL`. Unarchive via `PATCH /conversations/:id { archived_at: null }` first. `chat.spec.md` BR-25 / UC-04, UC-06. |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | 409 | Same `Idempotency-Key` reused with a different body | `POST /api/v1/conversations/:id/messages` with an `Idempotency-Key` that already exists on this conversation but whose stored `(content, model)` tuple differs from the current request. Replay with the IDENTICAL body returns the original assistant message instead (idempotent replay). `chat.spec.md` BR-27 / UC-07. |
| `BUSINESS_TURN_IN_PROGRESS` | 409 | A turn is already running on this conversation | `POST /api/v1/conversations/:id/messages` called while another turn on the same conversation has not yet reached its terminal frame. Single-owner default: one turn at a time per conversation. `chat.spec.md` BR-28 / UC-06, UC-08. |


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
