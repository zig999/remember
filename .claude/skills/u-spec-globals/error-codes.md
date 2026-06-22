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

### MCP / Ingestion envelope codes
> These are MCP-canonical envelope codes (§14) that some domains surface verbatim through their MCP transport AND that other domains re-use as in-stream / failed-tool_result codes when composing their own tool dispatch over the ingestion service. They are NOT REST HTTP codes (the HTTP column below records the equivalent REST status only when the same code is rendered through the REST envelope — see `ingestion.spec.md` §6.2 and `compliance-audit.back.md` BR-15).

| error.code | HTTP (when rendered via REST) | Description | When it occurs |
|------------|-------------------------------|-------------|----------------|
| `STRUCTURAL_INVALID` | 422 | Layered-validation rejection of a tool input or service call (Zod-shape failure, business-rule failure of the structural layer — `ingestion.back.md` BR-26 / `ingestion.spec.md` §6.2). | Tool dispatch / service call rejected by the layered validator. Surfaced as a failed `tool_result` block to the model when raised from inside a chat tool dispatch (`chat.spec.md` BR-43 step 2 / §6); surfaced as the MCP envelope code on the curation transport for `compliance_delete` (`compliance-audit.back.md` BR-15). |
| `NOT_FOUND` | 404 | MCP envelope code: the target resource was not found (§14 canonical code set). | Surfaced by the `compliance_delete` MCP tool when `raw_information_id` resolves to no existing row (`compliance-audit.spec.md` §6.2 / `compliance-audit.back.md` BR-15). REST surface renders this as `RESOURCE_NOT_FOUND` with HTTP 404. |
| `INTERNAL` | 500 | MCP envelope code: unhandled internal exception in the service layer (§14 canonical code set). | Surfaced by the `compliance_delete` MCP tool on legacy-inconsistency (UC-01 alt `4c`) or cascade rollback (UC-01 alt `9a`) (`compliance-audit.spec.md` §6.2 / `compliance-audit.back.md` BR-15). REST surface renders this as `SYSTEM_INTERNAL_ERROR` with HTTP 500. |

## Codes by Domain
<!-- Each domain adds its BUSINESS_ codes here when specified -->
<!-- Format: ### {Domain} followed by table with the 4 fields above -->

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


### Curation
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_REVIEW_NOT_PENDING` | 409 | Node is not in `needs_review` state | `resolveEntityMatch` called on a node whose `status != 'needs_review'` (curation.spec.md UC-02 / UC-03). |
| `BUSINESS_SELF_MERGE_FORBIDDEN` | 409 | Merge source and target are the same node | `mergeNodes` with `survivor_id = absorbed_id`, or `resolveEntityMatch` with `target_node_id = node_id` (curation.spec.md BR-04). |
| `BUSINESS_NODE_DELETED` | 410 | KnowledgeNode tombstoned by `compliance_delete` | Path-parameter `node_id` or merge participant has `status = 'deleted'` (curation.spec.md BR-22). |
| `BUSINESS_TARGET_NODE_REQUIRED` | 422 | `decision=merge_into` requires `target_node_id` | `resolveEntityMatch` with `decision=merge_into` and no `target_node_id` supplied (curation.spec.md UC-02). |
| `BUSINESS_INVALID_TARGET_NODE` | 422 | Target node is not in a valid state for this operation | `resolveEntityMatch` or `mergeNodes` target not `active`, OR `node_type_id` mismatch (curation.spec.md BR-03 / BR-04). |
| `BUSINESS_ITEM_NOT_DISPUTED` | 409 | Item is not in `disputed` state or has a scope mismatch | `resolveDispute` called on an item with `status != 'disputed'` or items do not share one conflict scope (curation.spec.md BR-05). |
| `BUSINESS_DISPUTE_WINNER_REQUIRED` | 422 | `decision=prefer_one` requires `winner_id` that is a member of `item_ids` | `resolveDispute` with `decision=prefer_one` and no valid `winner_id` (curation.spec.md UC-05). |
| `BUSINESS_DISPUTE_PERIODS_REQUIRED` | 422 | `decision=adjust_periods` requires `periods[]` with one entry per item | `resolveDispute` with `decision=adjust_periods` and missing or mismatched `periods` array (curation.spec.md UC-06). |
| `BUSINESS_TEMPORAL_INCOHERENT` | 422 | Temporal period violates `valid_from < valid_to` or functional scope constraint | `resolveDispute` adjusted periods or `correctItem` period with `valid_from >= valid_to`, or functional scope with 2+ open rows (curation.spec.md BR-06 / BR-09). |
| `BUSINESS_ITEM_NOT_UNCERTAIN` | 409 | Item is not in `uncertain` state | `confirmItem` called on an item with `status != 'uncertain'` (curation.spec.md UC-08). |
| `BUSINESS_ITEM_NOT_DELETABLE` | 409 | Item is already in a terminal state (`deleted` or `superseded`) | `rejectItem` or `correctItem` called on an item with `status IN ('deleted', 'superseded')` (curation.spec.md UC-09 / UC-10). |
| `BUSINESS_CORRECTION_NO_CHANGES` | 422 | `corrected{}` must change at least one field | `correctItem` with empty or no-op `corrected{}` object (curation.spec.md BR-11). |
| `BUSINESS_DATE_UNJUSTIFIED` | 422 | `valid_from` change requires a justification chain | `correctItem` changing `valid_from` without `valid_from_source`, or `valid_from_source=stated` without a valid `valid_from_fragment_id` (curation.spec.md BR-15). |
| `BUSINESS_REASON_REQUIRED` | 422 | `reason` is mandatory for destructive operations | `mergeNodes`, `resolveEntityMatch(merge_into)`, `resolveDispute(prefer_one)`, `rejectItem`, `correctItem` called without a non-empty `reason` (curation.spec.md BR-10). |

### Chat
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_CHAT_DISABLED` | 503 | Chat surface disabled | `CHAT_ENABLED=false` at boot (chat.spec.md BR-14). |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503 | Anthropic upstream unavailable | Anthropic factory throw (pre-stream) or mid-stream provider error (in-stream `error` frame) — chat.spec.md BR-21 / BR-11. |
| `BUSINESS_CONVERSATION_ARCHIVED` | 409 | Write attempted on archived conversation | `sendMessage` / `cancelTurn` against `archived_at IS NOT NULL` (chat.spec.md BR-25). |
| `BUSINESS_TURN_IN_PROGRESS` | 409 | Another turn is already running on the conversation | Second `sendMessage` while a prior one streams (chat.spec.md BR-28). |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | 409 | `Idempotency-Key` matches with different `(content, model)` | Replay attempted with different body (chat.spec.md BR-27). |
| `BUSINESS_CHAT_INGEST_DISABLED` | 503 | Chat ingestion capability disabled (RESERVED — registered for forward-compatibility; v2.3 implements `CHAT_INGEST_ENABLED` as a catalog filter at boot and does NOT emit this code at runtime) | Reserved for a future revision that introduces a runtime gate inside `sendMessage`. Currently NOT emitted by any route. (chat.spec.md v2.3 BR-44.) |

### Ingestion
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_RUN_NOT_RETRYABLE` | 409 | LLM run cannot be retried | `POST /llm-runs/:id/retry` called against a run whose `status <> 'failed'` (ingestion.spec.md UC-06 alt 2b / BR-11). |
| `BUSINESS_RUN_NOT_RUNNABLE` | 409 | LLM run cannot be extracted | `POST /llm-runs/:id/run` called against a run whose `status <> 'running'` (ingestion.spec.md UC-12 alt 2b). |
| `BUSINESS_RUN_NOT_RUNNING` | 409 | LLM run is not in `running` status | REST `propose-*` mirror called against a run whose `status <> 'running'` (ingestion.spec.md UC-08..UC-11 alt 1a REST branch / BR-21). |
| `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | 502 | Anthropic upstream unavailable during extraction | Non-recoverable Anthropic SDK transport error (auth, quota, network) inside `runLlmExtraction` / `ingest_document` synchronous extraction path (ingestion.spec.md UC-12 alt 4a, ingestion.back.md BR-30). |
