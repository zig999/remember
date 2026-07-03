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

---

## Canonical Taxonomy (P2.1 — 2026-07-02)

**Decision (owner, 2026-07-02).** The BFF publishes ONE canonical error-code vocabulary — the **namespaced taxonomy** below. Every transport (REST, MCP) surfaces the exact same `error.code` byte-for-byte on the exact same business condition; the transport differences are limited to the wire wrapping (REST returns the envelope directly with an HTTP status; MCP renders it as `content` + `isError: true` per MCP 2025-06-18). The `code/mcpCode` pair that historically produced a different code per transport (`compliance-audit/service/errors.ts` BR-15 pre-P2.1) is retired.

The five prefixes below are the ONLY allowed prefixes; any code without one of them is rejected by the Spec Reviewer.

| Prefix | Meaning | Transport rendering |
|--------|---------|--------------------|
| `AUTH_*` | Missing / invalid / expired credential — request rejected at middleware BEFORE any handler runs. | REST 401/403; MCP: same REST HTTP status is returned by the transport middleware BEFORE any tool dispatch, so it is NEVER wrapped in an MCP envelope. |
| `VALIDATION_*` | Structural failure at the Zod / DTO layer (missing field, wrong type, out-of-range, malformed format). | REST 422 with the namespaced code; MCP: `content` + `isError: true` carrying `{ ok:false, error.code: "VALIDATION_*" }`, HTTP 200 at the SDK kernel. |
| `RESOURCE_*` | Referenced entity does not exist, already exists, or is in the wrong state for structural reasons. | REST 404/409 with the namespaced code; MCP: `isError: true` envelope, HTTP 200. |
| `BUSINESS_*` | Domain-rule violation (rule-catalog mismatch, temporal incoherence, unjustified date, node-type / link-type invariant, etc.). Registered per domain below. | REST: domain-specific HTTP status (4xx) declared alongside each code; MCP: `isError: true` envelope, HTTP 200. |
| `SYSTEM_*` | Unhandled / infrastructure failure. | REST 5xx; MCP: `isError: true` envelope, HTTP 200. |

### HTTP-semantics rule (unified)

- **A business outcome is never an HTTP error** in any domain. Idempotent no-ops, `outcome: "already_ingested"`, `outcome: "noop_already_deleted"`, `outcome: "already_absorbed"`, `outcome: "already_confirmed"`, disputed / uncertain / consolidated proposals — all surface as `ok:true` with HTTP 2xx on REST and `isError:false` on MCP.
- **Real HTTP errors are reserved for transport and authentication.** `AUTH_*` and `SYSTEM_SERVICE_UNAVAILABLE` produce real HTTP 4xx/5xx **on both transports** (auth is enforced by the middleware before dispatch; a transport-level 5xx bubbles up untouched). `VALIDATION_*`, `RESOURCE_*` and `BUSINESS_*` produce a real HTTP status on REST but are wrapped as MCP envelope errors (HTTP 200 with `isError: true`) on MCP — the `error.code` value stays byte-identical between the two.
- The mapping code → HTTP status is centralised in `backend/src/shared/error-mapping.ts` (implementation contract; not enumerated here). The registry column "HTTP" below is the REST rendering.

### §14 short-code → namespaced mapping (deprecation table)

The seven short codes documented by v7 §14 for the MCP envelope (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) are **deprecated** by P2.1. Every domain that historically emitted them (the `ingestion` MCP `ingest` toolset and the `compliance_delete` MCP handler) MUST migrate to the namespaced replacements below. The MCP transport SHALL emit ONLY the namespaced code on the wire once the code consequence lands.

| Deprecated §14 code | Replacement namespaced code(s) | Discriminator (which one to use) |
|--------------------|--------------------------------|----------------------------------|
| `STRUCTURAL_INVALID` | `VALIDATION_REQUIRED_FIELD` \| `VALIDATION_INVALID_FORMAT` \| `VALIDATION_OUT_OF_RANGE` | Which structural Zod violation fired (same discrimination REST already uses). |
| `UNKNOWN_TYPE` | `BUSINESS_UNKNOWN_NODE_TYPE` \| `BUSINESS_UNKNOWN_LINK_TYPE` \| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | Which catalog table the missing name belongs to (`node_type` / `link_type` / `attribute_key`). |
| `RULE_VIOLATION` | `BUSINESS_LINK_RULE_VIOLATION` (ingestion; to be registered by the ingestion spec-writer when reconciling `ingestion.back.md`) | `LinkTypeRule` vigent-catalog mismatch (`propose_link` source/target type pair not allowed). Reserved by this catalog for that domain. |
| `TEMPORAL_INCOHERENT` | `BUSINESS_TEMPORAL_INCOHERENT` | Semi-open `[valid_from, valid_to)` invariant or functional-scope multi-open violation (§5.2, §6). Already registered in the Curation section — reused verbatim by ingestion once its spec is reconciled. |
| `DATE_UNJUSTIFIED` | `BUSINESS_DATE_UNJUSTIFIED` | `valid_from` change without a `stated`/`document`/`received` justification (§6.5, A14). Already registered in the Curation section — reused verbatim by ingestion once its spec is reconciled. |
| `NOT_FOUND` | `RESOURCE_NOT_FOUND` | Any referenced FK-target row does not exist. |
| `INTERNAL` | `SYSTEM_INTERNAL_ERROR` | Any unhandled exception. |

> **Reciprocal Reviewer guard.** The Spec Reviewer MUST reject any spec that (a) introduces one of the seven deprecated short codes onto any transport, or (b) declares `mcpCode` / `code` pairs that produce a different value per transport for the same business condition. The single canonical registry rule (rule 4 above) applies uniformly to REST and MCP.

### Parity guards (test contracts)

Every domain that publishes a tool on both REST and MCP MUST carry a REST↔MCP parity test that asserts, for each error condition:

1. Same `error.code` byte-identical on both transports (after stripping the envelope wrapper).
2. Same `error.message` byte-identical on both transports.
3. Same `error.details` shape on both transports.

The parity test contracts are declared in `compliance-audit.back.md` §1 Testing (BR-14 parity), `curation.back.md` BR-32 (rich REST taxonomy parity) and `knowledge-graph.back.md` TC-04 (get-node parity). P2.1 unifies these three contracts to assert byte-identical namespaced codes — the transport-specific `mcpCode` column is removed.

---

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
| `BUSINESS_RUN_NOT_RUNNING` | 409 | LLMRun referenced by a REST propose-* mirror is not currently running | REST mirrors of the MCP `ingest` toolset (`proposeFragment`/`proposeNode`/`proposeLink`/`proposeAttribute`) are called against a run whose `status != 'running'`. Under P2.1 (canonical taxonomy), the MCP transport surfaces the SAME `BUSINESS_RUN_NOT_RUNNING` code on its wire (no more `STRUCTURAL_INVALID` collapse); the `ingestion` spec-writer reconciles `ingestion.back.md` accordingly (`ingestion.spec.md` UC-08..UC-11 alt 1a REST branch, BR-21). |
| `BUSINESS_LINK_RULE_VIOLATION` | 422 | `propose_link` violates a vigent `LinkTypeRule` (source_type, target_type, link_type triple not present in the catalog) | Replaces the deprecated `RULE_VIOLATION` short code of v7 §14 under P2.1. Emitted by the ingestion validation pipeline (`§13 graph-rules layer`) when the source/target node types are not an allowed pair for the requested `link_type` per the seed catalog (`ingestion.spec.md` §14.1 / BR-13; reconciled in a future ingestion spec-writer run). Reserved here by P2.1 to unblock the compliance-audit and curation reconciliations. |

> **P2.1 note — deprecated MCP envelope short codes for the `ingest` toolset.** The seven §14 short codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) previously blessed by this catalog (v1.1.0) for the MCP `ingest` toolset are **deprecated by P2.1 (2026-07-02)** and moved to the "Deprecated Codes" section below. The mapping to their namespaced replacements is documented in the "Canonical Taxonomy" section above. The `ingestion` spec-writer reconciles `ingestion.back.md` (BR-13 / BR-14 / BR-15 + Validation library row) to emit the namespaced codes on both transports; until that reconciliation lands the ingestion MCP transport is in a transitional state — the code-consequence PR is the point at which the wire flips.

### Knowledge Graph
| error.code | HTTP | Description | When it occurs |
|------------|------|-------------|----------------|
| `BUSINESS_NODE_DELETED` | 410 | `KnowledgeNode` was tombstoned by `compliance_delete` (section 11) | Read endpoints (`getNodeById`, `getAttributeKeyHistory`) hit a node whose `status = 'deleted'`. The row remains in the DB; the API refuses to serve it to avoid recirculating tombstoned content (`knowledge-graph.spec.md` UC-05, UC-11, BR-14, error table §6). Reused by `curation` for `resolveEntityMatch` against a deleted node (`curation.spec.md` UC-02, UC-03, BR-22). |
| `BUSINESS_UNKNOWN_NODE_TYPE` | 422 | `node_type` query/filter is not registered in the seed catalog | `listAttributeKeys`, `listNodes` receive a `node_type` parameter whose name does not exist in `node_type` (catalog is migration-only per BR-17). (`knowledge-graph.spec.md` UC-03, UC-04, BR-17). Under P2.1 also replaces the deprecated `UNKNOWN_TYPE` §14 short code in ingestion (node-type discriminator). |
| `BUSINESS_UNKNOWN_LINK_TYPE` | 422 | `link_types[]` query element is not registered in the seed catalog | `traverseNode` receives a `link_types[]` element whose name does not exist in `link_type` (catalog is migration-only per BR-17). Reused by `query-retrieval` for the `expand_link_types[]` parameter of `searchKnowledge` (`query-retrieval.spec.md` UC-01, BR-15). Under P2.1 also replaces the deprecated `UNKNOWN_TYPE` §14 short code in ingestion (link-type discriminator). |
| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | 404 | `{key}` path segment is not registered for the node's NodeType | `getAttributeKeyHistory` is called with a `(node_type_id, key)` pair that has no row in `attribute_key` (catalog is migration-only per BR-17). (`knowledge-graph.spec.md` UC-11, BR-17). Under P2.1 also replaces the deprecated `UNKNOWN_TYPE` §14 short code in ingestion (attribute-key discriminator). |
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
| `BUSINESS_DATE_UNJUSTIFIED` | 422 | `valid_from` change without justification chain | `correctItem` changes `valid_from` without `valid_from_source`; OR `valid_from_source = 'stated'` without `valid_from_fragment_id`; OR the referenced fragment does not exist or has `status != 'accepted'` (section 6.5 + ADR A14; `curation.spec.md` UC-10, BR-15). Under P2.1 also replaces the deprecated `DATE_UNJUSTIFIED` §14 short code in ingestion. |
| `BUSINESS_TEMPORAL_INCOHERENT` | 422 | Period violates the semi-open invariant `[valid_from, valid_to)` or the functional-scope rule | `correctItem` / `resolveDispute(adjust_periods)` supply `valid_from >= valid_to` (both non-null), OR an `adjust_periods` set would leave 2+ rows with `valid_to = NULL` on a functional scope (ADR A7, ADR A10; `curation.spec.md` UC-06, UC-10, BR-06, BR-09). Under P2.1 also replaces the deprecated `TEMPORAL_INCOHERENT` §14 short code in ingestion. |
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
| `STRUCTURAL_INVALID` | 2026-07-02 | P2.1 canonical taxonomy — dropped the §14 short MCP-envelope vocabulary in favour of the single namespaced set. The `code/mcpCode` pair asymmetry (same business condition → different code per transport) was formally retired. | `VALIDATION_REQUIRED_FIELD` \| `VALIDATION_INVALID_FORMAT` \| `VALIDATION_OUT_OF_RANGE` (Zod-discriminated, same as REST) |
| `UNKNOWN_TYPE` | 2026-07-02 | P2.1 canonical taxonomy — replaced by the three catalog-specific namespaced codes already registered under Knowledge Graph. | `BUSINESS_UNKNOWN_NODE_TYPE` \| `BUSINESS_UNKNOWN_LINK_TYPE` \| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` |
| `RULE_VIOLATION` | 2026-07-02 | P2.1 canonical taxonomy — replaced by the new namespaced code registered under Ingestion. | `BUSINESS_LINK_RULE_VIOLATION` |
| `TEMPORAL_INCOHERENT` | 2026-07-02 | P2.1 canonical taxonomy — replaced by the namespaced code already registered under Curation, reused by Ingestion. | `BUSINESS_TEMPORAL_INCOHERENT` |
| `DATE_UNJUSTIFIED` | 2026-07-02 | P2.1 canonical taxonomy — replaced by the namespaced code already registered under Curation, reused by Ingestion. | `BUSINESS_DATE_UNJUSTIFIED` |
| `NOT_FOUND` | 2026-07-02 | P2.1 canonical taxonomy — replaced by the standard resource code. | `RESOURCE_NOT_FOUND` |
| `INTERNAL` | 2026-07-02 | P2.1 canonical taxonomy — replaced by the standard system code. | `SYSTEM_INTERNAL_ERROR` |

### Deprecation rules
1. When removing an active error.code, move it to this section (do not delete)
2. Fill in all fields: date, reason, replacement code (or "none")
3. The Spec Reviewer validates that no deprecated code is being used in active specs

### P2.1 rollout note (2026-07-02)

Spec-first landing order:
1. **This catalog** (P2.1 landing artefact) declares the canonical taxonomy, publishes the mapping table, and moves the seven §14 short codes to the Deprecated section.
2. **`compliance-audit.spec.md` v1.2.0** and **`compliance-audit.back.md` v1.4.0** are updated in the SAME spec-writer run (P2.1) to emit the namespaced codes on both REST and MCP for `compliance_delete`, dropping the `code/mcpCode` asymmetry of the pre-P2.1 BR-15.
3. **`ingestion.spec.md` / `ingestion.back.md`** are updated by their spec-writer in a companion run — BR-13 / BR-14 / BR-15 + Validation library row switch to the namespaced codes on both transports. The new `BUSINESS_LINK_RULE_VIOLATION` code registered here (Ingestion section) is the placeholder that unblocks that reconciliation.
4. **`curation.back.md`** BR-30 shared envelope mapper drops the "`compliance_delete` asymmetry" carve-out (BR-30 last paragraph + BR-31 second-to-last paragraph) — every tool on the curation MCP transport now surfaces the same namespaced code set.
5. **v7 §14** is amended (Emenda v7.5, out-of-band from this spec-writer's scope) to record the canonical taxonomy and to strike the seven short codes from the normative source.
6. **Code consequence** (post-spec): `backend/src/shared/error-mapping.ts` becomes the single registry + conversion table; the `code/mcpCode` pair in `backend/src/modules/compliance-audit/service/errors.ts` and the equivalent construct in `backend/src/modules/ingestion/validation/errors.ts` are removed; the parity tests (compliance BR-14, curation BR-32, knowledge-graph TC-04) are the CI guard that keeps the two transports byte-identical.

No migration / DB change is required at any of the six steps.
