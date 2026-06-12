# Curation -- Business Specification

> Version: 1.1.0 | Status: draft | Layer: permanent
> Technical contract: `openapi.yaml`
> Source of truth: `/remember-modelagem-v7.md` (sections 1, 2.3, 2.5, 3.5, 4.3, 4.4, 6.5, 6.6, 10, 14.4 + ADRs A20, A26, A28, A29 + acceptance scenarios C5, C9, C13, C14)
> Schema reference: `/migrations/0001_schema.sql` (tables `curation_action`, `entity_match_review`, `knowledge_node`, `knowledge_link`, `node_attribute`)

---

## 1. Overview

| Aspect | Value |
|--------|-------|
| Objective | Own the human-in-the-loop valve of the system: the two dedicated review queues (`entity_match`, `disputed`) plus the ad-hoc curator operations on individual nodes / links / attributes. Every operation writes to the shared `CurationAction` audit trail (read-side owned by `compliance-audit`). |
| Core entity | The set of curator-write operations: `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item` (section 10.2). The supporting reads of `EntityMatchReview` (queue context) and `KnowledgeNode` / `KnowledgeLink` / `NodeAttribute` states. |
| Bounded context | (a) review-queue listing (the two queues -- ADR A26); (b) node-resolution actions (`resolve_entity_match`, `merge_nodes` -- section 4.3, 4.4); (c) dispute resolution (`resolve_dispute` -- section 6.5-C); (d) ad-hoc item actions (`confirm_item`, `reject_item`, `correct_item` -- sections 6.5-B, 6.6). |
| Out of scope | LLM extraction and entity-resolution PROPOSAL (`ingestion`); full-text retrieval (`query-retrieval`); read-side projections of nodes/links/attributes (`knowledge-graph`); `compliance_delete` operation AND `ComplianceDeletion` reads AND `CurationAction` reads (`compliance-audit`); semantic similarity (PERMANENT non-goal -- ADR A24); dedicated queues for `uncertain`/`low_confidence` (DEFERRED -- ADR A26). See section 8. |

---

## 2. Actors

> Single-owner per ADR A20 / section 2.3. There is no `User` entity in the domain. Authentication is the network-access gate (section 2.5 / A29): the SPA reaches the BFF over the network, and the LLM orchestrator reaches the BFF via MCP. The two transports share one service layer (ADR A28). The "who" of `CurationAction` is implicit (the owner) -- there is no actor column.

| Actor | Description | Permissions |
|-------|-------------|-------------|
| Owner | The single data owner authenticated via Neon Auth (Stack Auth) -- JWT validated in BFF middleware against the Neon Auth JWKS endpoint. Reaches REST from the SPA. | List both review queues; resolve entity-match reviews; merge nodes directly; resolve disputes; confirm / reject / correct individual items. ALL operations write to `CurationAction` (audit row id returned as `action_id`). |
| LLM (orchestrator) | The LLM acting as orchestrator over the MCP `curation` toolset, on the same BFF service layer (ADR A28). | Same operations as Owner (the MCP and REST surfaces are equivalent). The JWT is provisioned to the LLM by the Owner's runtime. NOT permitted to bypass the BFF or open a database connection. |

> Both actors hit the SAME service layer and therefore the SAME validation, the SAME state machines (section 6.6 / `knowledge-graph.spec.md` §5), and the SAME `CurationAction` audit. This domain's REST contract is the SPA-side mirror of MCP toolset §14.4 minus the two operations owned end-to-end by `compliance-audit` (`compliance_delete`, audit reads).

---

## 3. Use Cases

### UC-01 -- List items in the review queues

**Actor:** Owner | **Pre:** Owner is authenticated. | **Post:** Owner has a paginated list of items in `entity_match` and/or `disputed`.

**Main flow:**
1. Owner calls `GET /api/v1/curation/queue?kind=entity_match&limit=20&offset=0` (or omits `kind` to receive items from both queues).
2. BFF middleware validates the JWT.
3. When `kind = entity_match` (or omitted): service layer reads `knowledge_node` filtered by `status = 'needs_review'` and joins `entity_match_review` to assemble each `candidates[]` array (section 3.5, 4.3).
4. When `kind = disputed` (or omitted): service layer reads `knowledge_link` and `node_attribute` filtered by `status = 'disputed'`; groups by conflict scope (section 6.5-C): for links, the tuple `(source_node_id, target_node_id, link_type_id)`; for attributes, the tuple `(node_id, attribute_key_id)`.
5. Items are ordered ASC by `created_at`, then by id; paginated by `limit` (default 20, max 100) and `offset` (default 0, min 0).
6. BFF returns `200` with `ReviewQueueList`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401 `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`.
- `5a` `limit` outside `[1, 100]` or `offset < 0` -> 422 `VALIDATION_OUT_OF_RANGE`.
- `5b` `kind` not in `{entity_match, disputed}` -> 422 `VALIDATION_INVALID_FORMAT`.
- `6a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `listReviewQueue`

---

### UC-02 -- Resolve a node pending entity-match review (merge into an existing node)

**Actor:** Owner | **Pre:** Owner is authenticated; the `node_id` references a node with `status = 'needs_review'`. | **Post:** The node becomes `merged`; `target_node_id` absorbs the links, attributes, and aliases; `EntityMatchReview` rows for `node_id` are removed; one `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/entity-matches/{node_id}/resolve` with `{ decision: "merge_into", target_node_id, reason }`.
2. BFF middleware validates the JWT.
3. Service layer validates request: `decision = merge_into` requires `target_node_id` AND `reason` (BR-02, BR-04, BR-10).
4. Service layer loads `node_id` and `target_node_id`:
   - `node_id` MUST have `status = 'needs_review'`.
   - `target_node_id` MUST have `status = 'active'` (section 4.4 invariant: pointers ALWAYS point to active nodes).
   - `target_node_id != node_id`.
   - Both nodes MUST share `node_type_id` (BR-03 -- inherited from entity-resolution scope).
5. Service layer opens a transaction and runs the merge flow (section 4.4): repoint `knowledge_link` / `node_attribute` from `node_id` to `target_node_id`; copy `node_alias` rows; set `node_id.status = 'merged'` with `merged_into_node_id = target_node_id`; run path compression on any node X currently pointing at `node_id` (X.merged_into_node_id = node_id) so X.merged_into_node_id is updated to `target_node_id`; delete `entity_match_review` rows for `node_id`.
6. Service layer writes one row in `curation_action`: `action = 'resolve_entity_match'`, `target_kind = 'node'`, `target_id = node_id`, `payload = { decision, target_node_id }`, `reason`.
7. BFF returns `200` with `ResolveEntityMatchResponse` including `affected{}` counts and `action_id`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `decision = merge_into` with `target_node_id = null` -> 422 `BUSINESS_TARGET_NODE_REQUIRED`.
- `3b` `decision = merge_into` with `reason = null/empty` -> 422 `BUSINESS_REASON_REQUIRED`.
- `4a` `node_id` not found -> 404 `RESOURCE_NOT_FOUND`.
- `4b` `node_id` has `status != 'needs_review'` -> 409 `BUSINESS_REVIEW_NOT_PENDING`.
- `4c` `node_id` has `status = 'deleted'` -> 410 `BUSINESS_NODE_DELETED`.
- `4d` `target_node_id` not found -> 404 `RESOURCE_NOT_FOUND`.
- `4e` `target_node_id` has `status != 'active'` -> 422 `BUSINESS_INVALID_TARGET_NODE`.
- `4f` `target_node_id = node_id` -> 409 `BUSINESS_SELF_MERGE_FORBIDDEN`.
- `7a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `resolveEntityMatch`

---

### UC-03 -- Resolve a node pending entity-match review (keep separate)

**Actor:** Owner | **Pre:** Owner is authenticated; the `node_id` references a node with `status = 'needs_review'`. | **Post:** The node becomes `active`; `EntityMatchReview` rows for `node_id` are removed; one `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/entity-matches/{node_id}/resolve` with `{ decision: "keep_separate", reason? }`.
2. BFF middleware validates the JWT.
3. Service layer loads `node_id`; MUST have `status = 'needs_review'`.
4. Service layer opens a transaction and: sets `node_id.status = 'active'`; deletes `entity_match_review` rows where `node_id = node_id`.
5. Service layer writes one row in `curation_action`: `action = 'resolve_entity_match'`, `target_kind = 'node'`, `target_id = node_id`, `payload = { decision: 'keep_separate' }`, `reason` (nullable).
6. BFF returns `200` with `ResolveEntityMatchResponse` and `resulting_status = 'active'`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `node_id` not found -> 404 `RESOURCE_NOT_FOUND`.
- `3b` `node_id` has `status != 'needs_review'` -> 409 `BUSINESS_REVIEW_NOT_PENDING`.
- `3c` `node_id` has `status = 'deleted'` -> 410 `BUSINESS_NODE_DELETED`.
- `6a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `resolveEntityMatch`

---

### UC-04 -- Merge two nodes directly

**Actor:** Owner | **Pre:** Owner is authenticated; `survivor_id` and `absorbed_id` reference distinct nodes with `status = 'active'`. | **Post:** `absorbed_id` becomes `merged` with `merged_into_node_id = survivor_id`; links/attributes are repointed; aliases are copied; path compression runs; one `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/nodes/merge` with `{ survivor_id, absorbed_id, reason }`.
2. BFF middleware validates the JWT.
3. Service layer validates: `survivor_id != absorbed_id`; `reason` non-empty (BR-10).
4. Service layer loads both rows: each MUST have `status = 'active'` (section 4.4 invariant: a `needs_review` is resolved via `resolveEntityMatch`; a `merged`/`deleted` cannot participate).
5. Both nodes MUST share `node_type_id` (BR-03).
6. Service layer runs the merge flow (section 4.4) as in UC-02 step 5; path compression handles any X with `merged_into_node_id = absorbed_id`.
7. Service layer writes one row in `curation_action`: `action = 'merge_nodes'`, `target_kind = 'node'`, `target_id = absorbed_id`, `payload = { survivor_id }`, `reason`.
8. BFF returns `200` with `MergeNodesResponse`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `survivor_id = absorbed_id` -> 409 `BUSINESS_SELF_MERGE_FORBIDDEN`.
- `3b` `reason` missing or empty -> 422 `BUSINESS_REASON_REQUIRED`.
- `4a` Either id not found -> 404 `RESOURCE_NOT_FOUND` with `details.missing_id`.
- `4b` Either node has `status = 'deleted'` -> 410 `BUSINESS_NODE_DELETED`.
- `4c` Either node has `status != 'active'` (e.g., `merged` or `needs_review`) -> 422 `BUSINESS_INVALID_TARGET_NODE`.
- `5a` `node_type_id` mismatch -> 422 `BUSINESS_INVALID_TARGET_NODE` with `details = { reason: "node_type mismatch" }` (BR-03).
- `8a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `mergeNodes`

---

### UC-05 -- Resolve a dispute by preferring one item (`prefer_one`)

**Actor:** Owner | **Pre:** Owner is authenticated; all `item_ids` reference items with `status = 'disputed'` and share one conflict scope. | **Post:** `winner_id` becomes `active`; every other id in `item_ids` becomes `deleted` with `superseded_at = now()`; one `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/disputes/resolve` with `{ item_kind, item_ids, decision: "prefer_one", winner_id, reason }`.
2. BFF middleware validates the JWT.
3. Service layer validates: `item_ids.length >= 2`; `winner_id` is a member of `item_ids`; `reason` non-empty (BR-10).
4. Service layer loads each row in `item_ids`: each MUST exist, MUST have `status = 'disputed'`, MUST share the same conflict scope (BR-05). For links: same `(source_node_id, target_node_id, link_type_id)`. For attributes: same `(node_id, attribute_key_id)`.
5. Service layer opens a transaction:
   - Set `winner_id.status = 'active'`; `superseded_at` unchanged on the winner.
   - For each loser `i` in `item_ids \ {winner_id}`: set `i.status = 'deleted'` AND `i.superseded_at = now()` IN THE SAME UPDATE (BR-08 -- failure to set both leaves the row trapped in the duplicate-guard partial unique index per CLAUDE.md "Known Gotchas").
6. Service layer writes one row in `curation_action`: `action = 'resolve_dispute'`, `target_kind = item_kind`, `target_id = winner_id`, `payload = { decision: 'prefer_one', item_ids, winner_id }`, `reason`.
7. BFF returns `200` with `ResolveDisputeResponse`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `winner_id` not in `item_ids` -> 422 `BUSINESS_DISPUTE_WINNER_REQUIRED`.
- `3b` `reason` missing or empty -> 422 `BUSINESS_REASON_REQUIRED`.
- `3c` `item_ids.length < 2` -> 422 `VALIDATION_OUT_OF_RANGE`.
- `4a` Any id not found -> 404 `RESOURCE_NOT_FOUND` with `details.missing_id`.
- `4b` Any id has `status != 'disputed'` -> 409 `BUSINESS_ITEM_NOT_DISPUTED`.
- `7a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `resolveDispute`

---

### UC-06 -- Resolve a dispute by adjusting periods (`adjust_periods`)

**Actor:** Owner | **Pre:** Owner is authenticated; all `item_ids` reference items with `status = 'disputed'` and share one conflict scope; the supplied `periods[]` has exactly one entry per id. | **Post:** Each item receives the supplied `valid_from` / `valid_to`; all items return to `status = 'active'`; on a functional scope, at most one row ends with `valid_to = NULL`; one `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/disputes/resolve` with `{ item_kind, item_ids, decision: "adjust_periods", periods, reason? }`.
2. BFF middleware validates the JWT.
3. Service layer validates: `periods[]` has exactly one entry per id in `item_ids`; for each entry, `valid_from < valid_to` when both are non-null (BR-06 / ADR A7 semi-open).
4. Service layer loads each row (as UC-05 step 4); all MUST have `status = 'disputed'` and share scope.
5. Service layer applies the adjusted periods to each row IN THE SAME TRANSACTION; sets each row's `status = 'active'`; `superseded_at` is left at the value it already had (unchanged).
6. For functional scopes (BR-09 / `allows_multiple_current = false`), the result MUST satisfy: at most one row in the adjusted set has `valid_to = NULL`. If two or more would, return 422 `BUSINESS_TEMPORAL_INCOHERENT` before committing.
7. Service layer writes one row in `curation_action`: `action = 'resolve_dispute'`, `target_kind = item_kind`, `target_id = item_ids[0]`, `payload = { decision: 'adjust_periods', item_ids, periods }`, `reason`.
8. BFF returns `200` with `ResolveDisputeResponse`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `periods` missing or empty -> 422 `BUSINESS_DISPUTE_PERIODS_REQUIRED`.
- `3b` `periods` does not have exactly one entry per `item_ids` element -> 422 `BUSINESS_DISPUTE_PERIODS_REQUIRED` with `details = { expected: N, got: M }`.
- `3c` Any entry has `valid_from >= valid_to` (semi-open violation, both non-null) -> 422 `BUSINESS_TEMPORAL_INCOHERENT`.
- `4a` Any id not found -> 404 `RESOURCE_NOT_FOUND`.
- `4b` Any id has `status != 'disputed'` -> 409 `BUSINESS_ITEM_NOT_DISPUTED`.
- `6a` Functional-scope invariant violated by the adjusted set -> 422 `BUSINESS_TEMPORAL_INCOHERENT`.
- `8a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `resolveDispute`

---

### UC-07 -- Resolve a dispute by keeping it open (`keep_disputed`)

**Actor:** Owner | **Pre:** Owner is authenticated; all `item_ids` reference items with `status = 'disputed'`. | **Post:** No row mutation occurs beyond writing one `CurationAction` row (the curator's acknowledgement of pending dispute).

**Main flow:**
1. Owner calls `POST /api/v1/curation/disputes/resolve` with `{ item_kind, item_ids, decision: "keep_disputed", reason? }`.
2. BFF middleware validates the JWT.
3. Service layer loads each row; each MUST exist and have `status = 'disputed'`.
4. Service layer writes one row in `curation_action`: `action = 'resolve_dispute'`, `target_kind = item_kind`, `target_id = item_ids[0]`, `payload = { decision: 'keep_disputed', item_ids }`, `reason`.
5. BFF returns `200` with `ResolveDisputeResponse`; every `item.resulting_status = 'disputed'`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Any id not found -> 404 `RESOURCE_NOT_FOUND`.
- `3b` Any id has `status != 'disputed'` -> 409 `BUSINESS_ITEM_NOT_DISPUTED`.
- `5a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `resolveDispute`

---

### UC-08 -- Confirm an `uncertain` item (ad-hoc)

**Actor:** Owner | **Pre:** Owner is authenticated; the `item_id` references an item with `status = 'uncertain'`. | **Post:** The item becomes `active`; one `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/items/confirm` with `{ item_kind, item_id, reason? }`.
2. BFF middleware validates the JWT.
3. Service layer loads the row; MUST have `status = 'uncertain'`.
4. Service layer sets `status = 'active'`; `superseded_at`, `valid_from`, `valid_to` are all unchanged. (Confidence is not promoted; the row keeps its recorded confidence -- BR-13.)
5. Service layer writes one row in `curation_action`: `action = 'confirm_item'`, `target_kind = item_kind`, `target_id = item_id`, `payload = {}`, `reason` (nullable).
6. BFF returns `200` with `ItemActionResponse` and `resulting_status = 'active'`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` Item not found -> 404 `RESOURCE_NOT_FOUND`.
- `3b` Item has `status != 'uncertain'` -> 409 `BUSINESS_ITEM_NOT_UNCERTAIN`.
- `6a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `confirmItem`

---

### UC-09 -- Reject an item (set to `deleted`)

**Actor:** Owner | **Pre:** Owner is authenticated; the `item_id` references an item whose `status` is NOT already `deleted` or `superseded`. | **Post:** The item receives `status = 'deleted'` AND `superseded_at = now()` in the same update; one `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/items/reject` with `{ item_kind, item_id, reason }`.
2. BFF middleware validates the JWT.
3. Service layer validates: `reason` non-empty (BR-10).
4. Service layer loads the row; MUST have `status NOT IN ('deleted', 'superseded')`.
5. Service layer sets `status = 'deleted'` AND `superseded_at = now()` IN THE SAME UPDATE (BR-08 -- both fields together).
6. Service layer writes one row in `curation_action`: `action = 'reject_item'`, `target_kind = item_kind`, `target_id = item_id`, `payload = {}`, `reason`.
7. BFF returns `200` with `ItemActionResponse` and `resulting_status = 'deleted'`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `reason` missing or empty -> 422 `BUSINESS_REASON_REQUIRED`.
- `4a` Item not found -> 404 `RESOURCE_NOT_FOUND`.
- `4b` Item has `status = 'deleted'` OR `status = 'superseded'` -> 409 `BUSINESS_ITEM_NOT_DELETABLE`.
- `7a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `rejectItem`

---

### UC-10 -- Correct an item (errata flow, section 6.5-B)

**Actor:** Owner | **Pre:** Owner is authenticated; the `item_id` references an item with `status IN ('active', 'uncertain', 'disputed')`; `corrected{}` contains at least one of `value`, `target_node_id`, `valid_from`, `valid_to`. | **Post:** The predecessor row gets `status = 'superseded'`, `superseded_at = now()`, `valid_to` UNCHANGED (the world did not change -- BR-07). A new row is created with the corrected fields, `supersedes_X = predecessor_id`, and the predecessor's provenance rows are COPIED to the new row. One `CurationAction` row is written.

**Main flow:**
1. Owner calls `POST /api/v1/curation/items/correct` with `{ item_kind, item_id, corrected, reason }`.
2. BFF middleware validates the JWT.
3. Service layer validates:
   - `reason` non-empty (BR-10).
   - `corrected{}` has at least one of the four mutable fields (BR-11).
   - `value` is admissible only when `item_kind = 'attribute'`; `target_node_id` only when `item_kind = 'link'` (BR-12).
   - When `valid_from` is being changed: `valid_from_source` MUST be supplied; when `valid_from_source = 'stated'`, `valid_from_fragment_id` MUST be supplied AND that fragment MUST exist and have `status = 'accepted'` (BR-15 / section 6.5 + ADR A14).
   - When both `valid_from` and `valid_to` are supplied: `valid_from < valid_to` (semi-open, BR-06).
4. Service layer loads the predecessor row; MUST have `status IN ('active', 'uncertain', 'disputed')`.
5. Service layer opens a transaction and applies the correction flow (section 6.5-B):
   1. Predecessor: `status = 'superseded'`, `superseded_at = now()`, `valid_to UNCHANGED` (BR-07).
   2. New row: copy predecessor's fields, override with `corrected{}`. `valid_from` defaults to predecessor's `valid_from` unless `corrected.valid_from` was supplied. `valid_to` defaults to predecessor's `valid_to` unless `corrected.valid_to` was supplied. `valid_from_source` set per BR-15. `status = 'active'`. `confidence` carried over. `created_by_run_id = NULL` (curator origin -- `knowledge-graph.spec.md` BR-19). `supersedes_X = predecessor_id`. New `id` allocated.
   3. Copy each `provenance` row of the predecessor to the new row (BR-16). The duplicate-guard partial unique index is preserved because the predecessor now has `superseded_at` set.
6. Service layer writes one row in `curation_action`: `action = 'correct_item'`, `target_kind = item_kind`, `target_id = predecessor_id`, `payload = { corrected, new_item_id }`, `reason`.
7. BFF returns `200` with `CorrectItemResponse`.

**Alternative flows:**
- `2a` Missing or invalid JWT -> 401.
- `3a` `corrected{}` empty / no field supplied -> 422 `BUSINESS_CORRECTION_NO_CHANGES`.
- `3b` `value` supplied for a link OR `target_node_id` supplied for an attribute -> 422 `VALIDATION_INVALID_FORMAT`.
- `3c` `valid_from` changed without `valid_from_source` -> 422 `BUSINESS_DATE_UNJUSTIFIED`.
- `3d` `valid_from_source = 'stated'` without `valid_from_fragment_id`, OR fragment id missing in DB, OR fragment id not in `status = 'accepted'` -> 422 `BUSINESS_DATE_UNJUSTIFIED`.
- `3e` `valid_from >= valid_to` (both supplied non-null) -> 422 `BUSINESS_TEMPORAL_INCOHERENT`.
- `3f` `reason` missing or empty -> 422 `BUSINESS_REASON_REQUIRED`.
- `4a` Item not found -> 404 `RESOURCE_NOT_FOUND`.
- `4b` Item has `status IN ('deleted', 'superseded')` -> 409 `BUSINESS_ITEM_NOT_DELETABLE`.
- `7a` Database connectivity error -> 500 `SYSTEM_INTERNAL_ERROR`.

**Related endpoint:** operationId: `correctItem`

---

## 4. Business Rules

> Each BR is programmatically testable. All BRs reference at least one UC.

### BR-01 -- Two dedicated queues, exactly

Per ADR A26 / section 10.1, there are exactly TWO review queues: `entity_match` and `disputed`. The flags `uncertain` and `low_confidence` MUST NOT be returned by `listReviewQueue` -- they are display flags surfaced by the `query-retrieval` domain (section 7.3). Adding queue kinds for them is an additive future change (an extra `kind` in `ReviewQueueKind` enum), explicitly deferred. The `ReviewQueueKind` enum MUST be exactly `[entity_match, disputed]`.

**Tied to:** UC-01.

### BR-02 -- Single-owner: no actor column on the audit

Per section 2.3 / ADR A20. `CurationAction` rows written by this domain record `action`, `target_kind`, `target_id`, `payload`, `reason`, `created_at` -- but NO actor column. The "who" is implicit (the owner). The JWT authenticates the request (BR-22) but never propagates an actor id into the audit row. (Reads of the trail are handled by `compliance-audit`.)

**Tied to:** UC-02 through UC-10.

### BR-03 -- Merge requires same `node_type_id`

Per section 4.2: "Apollo" as Person MUST NOT match "Apollo" as Project. Both `resolveEntityMatch` (decision = merge_into) and `mergeNodes` MUST verify that `survivor.node_type_id = absorbed.node_type_id` before mutating. Violation -> 422 `BUSINESS_INVALID_TARGET_NODE`.

**Tied to:** UC-02, UC-04.

### BR-04 -- `merged_into_node_id` always points to an active node (section 4.4 invariant)

The path-compression rule is enforced IN THE SAME TRANSACTION as the merge: any node X with `merged_into_node_id = absorbed_id` is updated to `merged_into_node_id = survivor_id` (the survivor is the one being preserved, which is `active`). The DB CHECK (`status = 'merged' <=> merged_into_node_id IS NOT NULL`) is preserved. A self-merge (`survivor_id = absorbed_id`) is forbidden -> 409 `BUSINESS_SELF_MERGE_FORBIDDEN`.

**Tied to:** UC-02, UC-04.

### BR-05 -- Disputed items share one conflict scope

The duplicate-guard partial unique indexes are scoped: `UNIQUE (source_node_id, target_node_id, link_type_id) WHERE valid_to IS NULL AND superseded_at IS NULL` for links and `UNIQUE (node_id, attribute_key_id) WHERE valid_to IS NULL AND superseded_at IS NULL` for functional attributes (section 6.5 + migration 0001). `resolveDispute` MUST verify all `item_ids` share the relevant tuple BEFORE applying the decision -- otherwise the operation is rejecting items from different conflicts in one call, which is semantically incoherent. Mismatch -> 409 `BUSINESS_ITEM_NOT_DISPUTED` with `details.scope_mismatch`.

**Tied to:** UC-05, UC-06, UC-07.

### BR-06 -- Semi-open temporal invariant `[valid_from, valid_to)`

Per ADR A7 / section 5.2. Every operation that supplies `valid_from` and `valid_to` (`adjust_periods`, `correct_item`) MUST validate `valid_from < valid_to` when BOTH are non-null. NULL means infinity (`valid_from IS NULL` = `-infinity`; `valid_to IS NULL` = `+infinity`). Violation -> 422 `BUSINESS_TEMPORAL_INCOHERENT`.

**Tied to:** UC-06, UC-10.

### BR-07 -- Correction does not change the world (`valid_to` UNCHANGED)

Per section 6.5-B. `correct_item` sets the predecessor's `status = 'superseded'`, `superseded_at = now()`, and LEAVES `valid_to` UNTOUCHED on the predecessor. The new row receives the corrected period (which CAN be identical to the predecessor's when only a non-period field changes). This distinguishes correction from succession (6.5-A, where the predecessor's `valid_to` is set to `change_date`). Test predicate: after `correct_item` on a row R, R.valid_to == (R.valid_to before the call).

**Tied to:** UC-10.

### BR-08 -- `status = deleted` MUST be accompanied by `superseded_at = now()`

Per CLAUDE.md "Known Gotchas" and section 5.4. `reject_item` and `prefer_one` (losers) MUST set both fields in the SAME UPDATE statement. Failure to set `superseded_at` leaves the row trapped in the duplicate-guard partial unique index `WHERE valid_to IS NULL AND superseded_at IS NULL` (it would still be "current" from the index's perspective). The DB does not enforce this pairing via CHECK -- the service layer is the gate. (The `compliance-audit` domain enforces the same pairing in its cascade.)

**Tied to:** UC-05, UC-09.

### BR-09 -- Functional scope admits at most one row with `valid_to = NULL`

Per ADR A10 / section 6.5 / migration 0001 (partial unique indexes `knowledge_link_current_dup_guard`, `node_attribute_current_dup_guard`). When `link_type.allows_multiple_current = false` or `attribute_key.allows_multiple_current = false`, the result of `adjust_periods` MUST have at most one row with `valid_to = NULL` in the adjusted set. The service layer pre-checks this BEFORE the DB index would reject the second row. Violation -> 422 `BUSINESS_TEMPORAL_INCOHERENT`.

**Tied to:** UC-06.

### BR-10 -- `reason` is mandatory for destructive operations

Destructive operations in this domain are: `mergeNodes`; `resolveEntityMatch` with `decision = merge_into`; `resolveDispute` with `decision = prefer_one`; `rejectItem`; `correctItem`. For these, `reason` is a non-null, non-empty trimmed string. `confirmItem` and `resolveDispute` with `decision = adjust_periods` / `keep_disputed` have `reason` optional. `resolveEntityMatch` with `decision = keep_separate` has `reason` optional. Violation -> 422 `BUSINESS_REASON_REQUIRED`.

**Tied to:** UC-02, UC-04, UC-05, UC-09, UC-10.

### BR-11 -- `correct_item` must change at least one field

`corrected{}` MUST contain at least one of `value`, `target_node_id`, `valid_from`, `valid_to`. A correction that changes nothing is rejected -> 422 `BUSINESS_CORRECTION_NO_CHANGES`.

**Tied to:** UC-10.

### BR-12 -- `value` for attributes only; `target_node_id` for links only

Per section 3.3. `KnowledgeLink` has no `value` column; `NodeAttribute` has no `target_node_id` column. `correct_item` MUST reject mismatches with 422 `VALIDATION_INVALID_FORMAT`.

**Tied to:** UC-10.

### BR-13 -- `confirm_item` does NOT alter `confidence`

Per section 6.5 (corroboration vs. ad-hoc confirmation). Corroboration (automatic) is the ingestion-domain path that sets `confidence = max(sources)`; `confirm_item` is the human ad-hoc escape and ONLY flips `status` from `uncertain` to `active`. `confidence` is preserved as-is.

**Tied to:** UC-08.

### BR-14 -- `uncertain` and `low_confidence` are flags, not queues

Per ADR A26 / section 10.1. The `query-retrieval` domain returns these as `flags[]` on read; this domain does NOT expose them as queue items. The ad-hoc escape for `uncertain` is `confirm_item` (UC-08); for `low_confidence` there is NO direct curator endpoint (the underlying fragment stays `proposed` and the row was never created -- section 6.6).

**Tied to:** UC-01, UC-08.

### BR-15 -- Date justification chain on `correct_item`

Per section 6.5 / ADR A14. When `correct_item` changes `valid_from`, the request MUST supply `valid_from_source`. The chain is `stated` -> `document` -> `received` (decreasing quality of evidence). When `valid_from_source = 'stated'`, the request MUST supply `valid_from_fragment_id` referencing an `information_fragment` row that EXISTS and has `status = 'accepted'`. A bare new date is rejected -> 422 `BUSINESS_DATE_UNJUSTIFIED`. The system NEVER invents dates (CLAUDE.md golden rule 12; section 6.5).

**Tied to:** UC-10.

### BR-16 -- `correct_item` copies provenance to the new row

Per section 13 anti-hallucination. The predecessor's `provenance` rows are COPIED (each row pointing to the new row's id instead of the predecessor's) so that the new `active` row retains the evidence chain back to fragments / chunks / raw information. New justification fragments (from the errata, BR-15) are APPENDED in addition to the copied ones; nothing is silently discarded (CLAUDE.md golden rule 18 / section 1).

**Tied to:** UC-10.

### BR-17 -- Every curator write produces one and only one `CurationAction` row

Per section 3.5 / section 10.2. Each successful execution of UC-02 through UC-10 writes EXACTLY one `curation_action` row, transactional with the data mutation (BR-19). The row id is returned in the response as `action_id`. The READ of the audit row is performed via the `compliance-audit` domain (operationId `getCurationActionById`). A failed transaction writes ZERO `curation_action` rows -- the audit-trail row only exists on commit.

**Tied to:** UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10.

### BR-18 -- `compliance_delete` is NOT in this domain

Per the cross-domain boundary established with `compliance-audit`. The `compliance_delete` operation -- both the REST execution and the audit/cascade -- belongs to `compliance-audit` (operationId `complianceDeleteRawInformation`). This domain does NOT mirror or expose the operation. The v7 MCP catalog (§14.4) lists `compliance_delete` inside the `curation` toolset, but the REST surface owners (this domain vs. `compliance-audit`) split it out for operational clarity. When this domain reads a `KnowledgeNode` whose `status = 'deleted'` (set by the `compliance_delete` cascade), it returns 410 `BUSINESS_NODE_DELETED` (BR-22) -- the same status the `knowledge-graph` domain uses on reads.

**Tied to:** UC-02, UC-03 (returning 410 on a tombstoned node).

### BR-19 -- All write operations are transactional

Each UC that mutates more than one row (UC-02 through UC-10) MUST run inside a single PostgreSQL transaction. Mid-flight failure rolls back ALL mutations including the `CurationAction` audit row -- audit only writes on success. The audit row's `id` is therefore deterministic only after commit, and is returned in the response as `action_id`.

**Tied to:** UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10.

### BR-20 -- Concurrent merges and corrections serialize via `SELECT ... FOR UPDATE`

Per ADR A11 / section 4.5 / section 6.5. The duplicate-guard partial unique indexes detect collisions at commit; the service layer pre-empts collisions by taking row-level locks on the relevant `knowledge_node` / `knowledge_link` / `node_attribute` rows at the start of each write transaction. Two concurrent `resolve_entity_match` / `merge_nodes` against the same node serialize; two concurrent `correct_item` against the same item serialize.

**Tied to:** UC-02, UC-04, UC-05, UC-06, UC-10.

### BR-21 -- All endpoints require a valid Neon Auth JWT (ADR A29 / section 2.5)

Every endpoint in this domain is closed behind `bearerAuth` (Neon Auth -- Stack Auth). The middleware verifies the JWT BEFORE any database access against the Neon Auth JWKS endpoint (`${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA by default). Missing / invalid / expired tokens map to `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` (401). Neon Auth credentials live in environment variables on the BFF only; PostgreSQL RLS is disabled at the database level (the Neon connection uses a non-RLS application role).

**Tied to:** UC-01 through UC-10.

### BR-22 -- Deleted nodes return 410 on `resolveEntityMatch`

When the path-parameter `node_id` references a `KnowledgeNode` whose `status = 'deleted'` (tombstoned by the `compliance-audit` cascade -- section 11), the endpoint returns 410 `BUSINESS_NODE_DELETED`. This matches the behavior of the `knowledge-graph` read endpoints (knowledge-graph BR-14 / `getNodeById`). The same code is reused; no duplicate registration.

**Tied to:** UC-02, UC-03.

---

## 5. State Machine

### KnowledgeNode (transitions triggered by THIS domain)

```
                     resolveEntityMatch(keep_separate)
        +------------------------------------------+
        |                                          v
   [needs_review] -- resolveEntityMatch(merge_into) -->  [merged]
        |
        |   (compliance-audit cascade)
        +------> [deleted]
                                       mergeNodes (as absorbed_id)
   [active] -----------+-----------------------------> [merged]
        |
        +---- (compliance-audit cascade) ----> [deleted]
```

| From | Event (curation) | To | Condition | UC |
|------|------------------|----|-----------|----|
| needs_review | `resolveEntityMatch` decision=keep_separate | active | `node.status = needs_review` | UC-03 |
| needs_review | `resolveEntityMatch` decision=merge_into | merged | `node.status = needs_review`, target active, same node_type | UC-02 |
| active | `mergeNodes` (as absorbed_id) | merged | both nodes active, same node_type, distinct ids | UC-04 |

> The transition `(needs_review | active) -> deleted` is triggered by the `compliance-audit` cascade (`complianceDeleteRawInformation`), NOT by this domain. When `resolveEntityMatch` encounters such a tombstoned row it returns 410 `BUSINESS_NODE_DELETED` (BR-22).

> Path-compression invariant (BR-04): `merged_into_node_id` ALWAYS points to an active node. The compression step runs in the same transaction as the merge.

### KnowledgeLink / NodeAttribute (transitions triggered by THIS domain)

```
                                                                   correctItem
                       confirmItem                                 (predecessor)
   [uncertain] -----------------------> [active] ---------------------> [superseded]
                                          |  ^
                                          |  | resolveDispute(prefer_one, winner)
                                          v  | resolveDispute(adjust_periods)
                                       [disputed]
                                          |
                                          +--- resolveDispute(prefer_one, loser) ----> [deleted]
                                          |
                                          +--- resolveDispute(keep_disputed) --> [disputed]

   [active|uncertain|disputed] -- rejectItem --> [deleted]
```

| From | Event (curation) | To | Condition | UC |
|------|------------------|----|-----------|----|
| uncertain | `confirmItem` | active | item.status = uncertain | UC-08 |
| disputed | `resolveDispute` decision=prefer_one, winner | active | item in item_ids, winner | UC-05 |
| disputed | `resolveDispute` decision=prefer_one, loser | deleted | item in item_ids \ {winner_id}; set superseded_at=now() | UC-05 |
| disputed | `resolveDispute` decision=adjust_periods | active | functional scope: at most one valid_to=NULL | UC-06 |
| disputed | `resolveDispute` decision=keep_disputed | disputed | no row mutation | UC-07 |
| active or uncertain or disputed | `rejectItem` | deleted | reason supplied; set superseded_at=now() | UC-09 |
| active or uncertain or disputed | `correctItem` (predecessor) | superseded | corrected{} non-empty; valid_to UNCHANGED | UC-10 |
| (new) | `correctItem` (successor) | active | supersedes_X=predecessor_id; provenance copied | UC-10 |

> The transition `(any) -> deleted` from the `compliance_delete` cascade is triggered by `compliance-audit`, NOT by this domain.

---

## 6. Error Behaviors

> Every code below is registered in the global error-codes catalog (`docs/specs/_global/error-codes.md`).

| Situation | HTTP | error.code | Description |
|-----------|------|------------|-------------|
| Request without `Authorization` header | 401 | `AUTH_UNAUTHORIZED` | Middleware rejects before any DB access (section 2.5). |
| JWT malformed | 401 | `AUTH_TOKEN_INVALID` | Decoding fails. |
| JWT expired | 401 | `AUTH_TOKEN_EXPIRED` | `exp` claim in the past. |
| Path id (`{node_id}`) or referenced id (`target_node_id`, `survivor_id`, `absorbed_id`, `item_id`) not in DB | 404 | `RESOURCE_NOT_FOUND` | Standard resource lookup miss. |
| Node has `status = 'deleted'` | 410 | `BUSINESS_NODE_DELETED` | Tombstoned by `compliance-audit` cascade (section 11). |
| `resolveEntityMatch` called on a node whose `status != 'needs_review'` | 409 | `BUSINESS_REVIEW_NOT_PENDING` | Per UC-02 / UC-03 precondition. |
| `mergeNodes` (or `resolveEntityMatch` decision=merge_into) with `target_node_id` not active, OR node_type mismatch | 422 | `BUSINESS_INVALID_TARGET_NODE` | BR-03, BR-04. |
| `mergeNodes` with `survivor_id = absorbed_id`, OR `resolveEntityMatch` with `target_node_id = node_id` | 409 | `BUSINESS_SELF_MERGE_FORBIDDEN` | BR-04. |
| `resolveEntityMatch` decision=merge_into without `target_node_id` | 422 | `BUSINESS_TARGET_NODE_REQUIRED` | UC-02 precondition. |
| `resolveDispute`: any item not in `status = 'disputed'` OR scope mismatch | 409 | `BUSINESS_ITEM_NOT_DISPUTED` | BR-05. |
| `resolveDispute` decision=prefer_one without `winner_id` member of `item_ids` | 422 | `BUSINESS_DISPUTE_WINNER_REQUIRED` | UC-05. |
| `resolveDispute` decision=adjust_periods without `periods[]`, or count mismatch | 422 | `BUSINESS_DISPUTE_PERIODS_REQUIRED` | UC-06. |
| `confirmItem` called on item with `status != 'uncertain'` | 409 | `BUSINESS_ITEM_NOT_UNCERTAIN` | UC-08 precondition. |
| `rejectItem` / `correctItem` called on item with `status IN ('deleted', 'superseded')` | 409 | `BUSINESS_ITEM_NOT_DELETABLE` | UC-09 / UC-10 precondition. |
| `correctItem` with empty `corrected{}` | 422 | `BUSINESS_CORRECTION_NO_CHANGES` | BR-11. |
| `correctItem` with `value` on link OR `target_node_id` on attribute | 422 | `VALIDATION_INVALID_FORMAT` | BR-12. |
| `correctItem` changing `valid_from` without justification chain | 422 | `BUSINESS_DATE_UNJUSTIFIED` | BR-15. |
| `correctItem` or `resolveDispute` adjusted period with `valid_from >= valid_to` OR functional scope with 2+ open rows | 422 | `BUSINESS_TEMPORAL_INCOHERENT` | BR-06, BR-09. |
| Destructive operation (`mergeNodes`, `resolveEntityMatch` merge_into, `resolveDispute` prefer_one, `rejectItem`, `correctItem`) without `reason` | 422 | `BUSINESS_REASON_REQUIRED` | BR-10. |
| `limit` outside `[1, 100]`, `offset < 0`, or `item_ids.length < 2` | 422 | `VALIDATION_OUT_OF_RANGE` | Standard range guard. |
| `kind`, `decision`, `item_kind` not parseable or outside enum | 422 | `VALIDATION_INVALID_FORMAT` | Standard format / enum validation. |
| Required field missing in request body | 422 | `VALIDATION_REQUIRED_FIELD` | Standard required check. |
| Database connectivity / unexpected error | 500 | `SYSTEM_INTERNAL_ERROR` | Default fallback for unhandled exceptions. |
| Database timeout against Neon | 503 | `SYSTEM_SERVICE_UNAVAILABLE` | Integration unavailable. |

---

## 7. Cross-Domain Dependencies

> Bidirectional. The peer domains below MUST list `curation` as their consumer/producer when they are specified.

| Domain | Type | Description |
|--------|------|-------------|
| `knowledge-graph` | produces | `curation` writes on `knowledge_node`, `node_alias`, `knowledge_link`, `node_attribute`. It triggers the state-machine transitions documented in `knowledge-graph.spec.md` §5. The `knowledge-graph` domain READS the post-curation result. Specifically: `mergeNodes` and `resolveEntityMatch(merge_into)` mutate `merged_into_node_id` and trigger path compression (knowledge-graph BR-14); `resolveDispute`, `confirmItem`, `rejectItem`, `correctItem` mutate `status` and `superseded_at` on links/attributes (knowledge-graph BR-09, BR-13, BR-16). The 410 `BUSINESS_NODE_DELETED` code is shared with `knowledge-graph` (UC-02, UC-03 vs. knowledge-graph UC-05). |
| `ingestion` | synchronizes | `correctItem` reads `information_fragment` to verify the date-justification fragment (BR-15). `ingestion` owns the lifecycle of fragments (its state machine of `proposed -> accepted -> rejected -> superseded -> deleted`). The `EntityMatchReview` table is WRITTEN by `ingestion` (entity-resolution proposal -- section 4.3) and READ + DELETED by `curation` (UC-01, UC-02, UC-03). |
| `query-retrieval` | consumes | `query-retrieval` exposes the display flags `uncertain`, `low_confidence`, `disputed` on read results (section 7.3 / ADR A26). The curator clicks through into this domain's endpoints (`confirmItem`, `rejectItem`, `correctItem`, `resolveDispute`) to act. The dispute queue listing here (UC-01) is the catalog entry; `query-retrieval` is the find-by-context entry. |
| `compliance-audit` | synchronizes | `compliance-audit` owns the `compliance_delete` operation AND the read-side of `CurationAction` AND `ComplianceDeletion`. Every write in this domain (UC-02..UC-10) produces ONE `CurationAction` row whose id is returned as `action_id`; the SPA / LLM fetches the full audit entry from `compliance-audit` (operationIds `listCurationActions`, `getCurationActionById`). Conversely, when `compliance-audit` cascades `status = 'deleted'` onto a `KnowledgeNode`, future calls into this domain return 410 `BUSINESS_NODE_DELETED` (BR-22). |
| `auth` | synchronizes | Owner authentication via Neon Auth (Stack Auth). The middleware that validates the JWT against the Neon Auth JWKS endpoint is shared with all REST/MCP transports (section 2.5, ADR A29). |

---

## 8. Out of Scope

- LLM extraction proposals -- the `ingestion` domain owns `propose_node`, `propose_link`, `propose_attribute` (section 14.1, MCP-only). This domain does not propose; it disposes.
- Read-side projections of `KnowledgeNode`, `KnowledgeLink`, `NodeAttribute`, traversal, lineage history -- handled by `knowledge-graph` (section 14.3). The curator opens the SPA, navigates via `knowledge-graph` reads, and acts via THIS domain. No graph-read endpoints live here.
- Full-text search and provenance walks for retrieval -- handled by `query-retrieval` (section 7.2 / 14.3 `search`, `get_provenance`).
- `compliance_delete` execution -- handled by `compliance-audit` (operationId `complianceDeleteRawInformation`). The v7 MCP catalog (§14.4) lists the tool inside the `curation` toolset; on the REST split that operation is mirrored under `/api/v1/compliance/deletions` in `compliance-audit` instead. The MCP toolset name does not change.
- Read-side of `CurationAction` and `ComplianceDeletion` -- handled by `compliance-audit` (operationIds `listCurationActions`, `getCurationActionById`, `listComplianceDeletions`, `getComplianceDeletionById`). This domain WRITES the `CurationAction` row but exposes no GET endpoint for it.
- Embedding-based / semantic similarity for entity matching -- PERMANENT non-goal per section 20.1 / ADR A24. The valve for "Iniciativa Lunar" vs "Projeto Apollo" is the `entity_match` queue (acceptance C9 / section 4.5), not automation.
- Dedicated review queues for `uncertain` and `low_confidence` -- DEFERRED per ADR A26 / section 10.1. They remain display flags exposed by `query-retrieval`. Promotion to a dedicated queue kind is an additive change (one extra value in `ReviewQueueKind`) that does not require migration.
- Bulk curator operations (multi-node merges, batch confirmations) -- not in this version. Each endpoint acts on a single primary target. The MCP toolset (section 14.4) follows the same one-call / one-action shape.
- Reversal / undo of past curator actions -- there is no `unmerge`, `unreject`, `uncorrect`. Recovery from a curator mistake is itself a curator action (a new `mergeNodes` going the other way, a new `correctItem` reverting the value), and the audit trail records both. Section 1 / 11 / 18: nothing is silently discarded.
- Multi-user / role-based authorization (ADR A20) -- PERMANENT non-goal in v7. The `actor_context` is implicit (owner).
- Write endpoints for `EntityMatchReview` -- it is written by the `ingestion` resolver (section 4.3) and READ here (queue listing) then DELETED on resolution. This domain does not expose direct CRUD over `EntityMatchReview` rows.

---

## 9. Local Glossary

> Domain-specific terms. Global terms live in `docs/specs/_global/glossary.md`.

| Term | Definition |
|------|-----------|
| `action_id` | The id of the `CurationAction` row written by a curator operation, returned in every action response. Used by the SPA / LLM to pivot to `compliance-audit` (`getCurationActionById`) for the full audit detail. |
| Conflict scope | The tuple identifying a single dispute: `(source_node_id, target_node_id, link_type_id)` for links; `(node_id, attribute_key_id)` for attributes. Matches the duplicate-guard partial unique index in migration 0001. Used by `resolveDispute` (BR-05). |
| Correction (6.5-B) | A supersession whose `valid_to` is UNCHANGED on the predecessor (the world did not change; the system recorded incorrectly). Implemented by `correctItem`. Distinguished from succession by the `valid_to` invariant (BR-07). |
| `disputed` (queue) | One of the two dedicated review queues (ADR A26 / section 10.1). Contains links and attributes with `status = 'disputed'` grouped by conflict scope. |
| `entity_match` (queue) | One of the two dedicated review queues. Contains nodes with `status = 'needs_review'` and their `EntityMatchReview` candidates. |
| `EntityMatchReview` | Row written by the ingestion entity resolver when a proposed node falls in the ambiguous band `[0.55, 0.85)` (section 4.3 / ADR A12). Read by `listReviewQueue`; deleted by `resolveEntityMatch`. |
| Functional scope | A `(source, link_type)` or `(node, key)` whose `link_type.allows_multiple_current = false` or `attribute_key.allows_multiple_current = false` (ADR A10). At most one row is permitted to be simultaneously valid (`valid_to = NULL`, `superseded_at = NULL`). |
| `low_confidence` (flag) | A read-time display flag attached to fragments below 0.40 (BR-14). NOT a queue. NOT touched by this domain. |
| Path compression | The 4.4 invariant: any node X with `merged_into_node_id = absorbed_id` is updated to point at `survivor_id` IN THE SAME TRANSACTION as the merge (BR-04). |
| `prefer_one` | A `resolveDispute` decision: `winner_id` returns to `active`; all other items become `deleted`. |
| Provenance copy on correction | The `correctItem` rule (BR-16) that COPIES the predecessor's `provenance` rows to the new row so the evidence chain is preserved. New evidence rows (from the errata fragment) are APPENDED. |
| `reason` | Free-text justification supplied by the curator. Mandatory for destructive operations (BR-10). |
| `resulting_status` | The post-operation `status` of an item, returned in every action response. Lets the SPA refresh its view without re-fetching. |
| `uncertain` (flag) | A read-time display flag attached to items in `status = uncertain` (confidence band `[0.40, 0.74]`). NOT a queue. Escape path: `confirmItem` (UC-08) or automatic corroboration (handled by `ingestion`). |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Spec Writer | initial | Initial business spec for the curation domain. Forward-generated from remember-modelagem-v7.md (sections 1, 2.3, 2.5, 3.5, 4.3, 4.4, 6.5, 6.6, 10, 14.4) and migrations/0001_schema.sql. Covers review-queue listing, entity-match resolution, direct node merge, dispute resolution (prefer_one / adjust_periods / keep_disputed), ad-hoc item actions (confirm / reject / correct). Cross-domain split with `compliance-audit`: `compliance_delete` execution and `CurationAction`/`ComplianceDeletion` reads are owned by `compliance-audit`; this domain writes `CurationAction` rows transactionally and exposes the id as `action_id`. | -- |
| 1.1.0 | 2026-06-12 | Spec Writer | update | Infrastructure migration: Supabase Auth replaced by Neon Auth (Stack Auth) as the identity provider for both Owner (SPA) and LLM (MCP) actors. JWT is now validated against the Neon Auth JWKS endpoint (`${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA by default) in the BFF middleware. BR-21 rewritten accordingly; §2 actor row, §6 error-behavior table ("Database timeout against Neon"), and §7 cross-domain `auth` row updated to reflect Neon Auth. Underlying Postgres moves from Supabase Cloud to Neon (managed Postgres) -- schema unchanged; no migration required. Single-owner model (ADR A20) is preserved; no `User` entity introduced. No new error codes; no UC contracts changed. | infra-migrate-neon |
