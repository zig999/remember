# Validation Report: curation

> Triage: PENDING

status: VALID

## Summary

All six checks passed for the curation domain. The three spec artifacts (`openapi.yaml`, `curation.spec.md`, `curation.back.md`) are internally consistent and aligned with both the global error-code catalog and the normative source (`segundo-cerebro-modelagem-v7.md` §§3.5, 4.3, 4.4, 6.5, 6.6, 10, 14.4) and the `migrations/0001_schema.sql` schema. No blocking inconsistencies were found. Three informational observations are noted as warnings.

---

## Checks Performed

- [x] OpenAPI completeness
- [x] Spec consistency
- [x] Back-end spec coverage
- [x] Cross-reference consistency
- [x] Normative alignment
- [x] Schema consistency

---

## Issues Found

### Warnings (non-blocking)

| # | Severity | Source | Description |
|---|----------|--------|-------------|
| WARN-001 | WARNING | `openapi.yaml` §correctItem 409 response | The `correctItem` 409 example uses `BUSINESS_ITEM_NOT_DELETABLE` with message "Cannot correct a row that is already superseded or deleted". This reuses the `rejectItem` error code for a semantically distinct precondition (correctability vs. deletability). The code is registered and consistent with `curation.spec.md` §6 and the global catalog, but the dual use may confuse callers — a distinct `BUSINESS_ITEM_NOT_CORRECTABLE` code would reduce ambiguity. No action required for handoff. |
| WARN-002 | WARNING | `curation.back.md` §1 (Concurrency) | `BR-26` notes that `SELECT ... FOR UPDATE` is NOT issued for `UC-03` (`resolveEntityMatch` decision=`keep_separate`) and `UC-07` (`resolveDispute` decision=`keep_disputed`), but the BR-26 table only lists `UC-02, UC-04, UC-05, UC-06, UC-10`. UC-03 mutates `knowledge_node.status` and should acquire the lock; UC-07 explicitly documents "no row mutation" so is correctly excluded. The omission of UC-03 from the lock list in BR-26 is a minor documentation gap — the state-machine guard BR-22 in back.md §3 does describe the correct lock-then-check sequence. No functional gap. |
| WARN-003 | WARNING | `curation.spec.md` §7 (Cross-Domain Dependencies) | The dependency on `auth` is described as a direct domain entry. Per CLAUDE.md, Supabase Auth is infrastructure, not a peer domain with its own `{domain}.spec.md`. The reference is accurate but the framing as a first-class domain dependency (with a bidirectionality claim) may cause confusion during the cross-domain dependency validation sweep. No functional impact. |

No blocking issues found.

---

## Evidence

### Check 1 — OpenAPI Completeness

All 6 path operations (`listReviewQueue`, `resolveEntityMatch`, `mergeNodes`, `resolveDispute`, `confirmItem`, `rejectItem`, `correctItem`) define:
- Complete `requestBody` schemas with `required` fields (or no body for the GET)
- Complete `responses` blocks covering 200, 401, 4xx, 500, 503
- Reusable `securitySchemes.bearerAuth` declared and applied globally via `security: [bearerAuth: []]`
- All `$ref` targets resolve within the file (`components/schemas`, `components/responses`, `components/parameters`)
- Enums cover all normative values: `node_status [active, needs_review, merged, deleted]`, `assertion_status [active, uncertain, disputed, superseded, deleted]`, `valid_from_source [stated, document, received]`, `ReviewQueueKind [entity_match, disputed]`, `ItemKind [link, attribute]`, `EntityMatchDecision [merge_into, keep_separate]`, `DisputeDecision [prefer_one, adjust_periods, keep_disputed]`

### Check 2 — Spec Consistency (.spec.md UCs ↔ OpenAPI endpoints)

| UC | operationId | Endpoint | Match |
|----|-------------|----------|-------|
| UC-01 | `listReviewQueue` | `GET /api/v1/curation/queue` | Yes |
| UC-02, UC-03 | `resolveEntityMatch` | `POST /api/v1/curation/entity-matches/{node_id}/resolve` | Yes (two decisions, same endpoint) |
| UC-04 | `mergeNodes` | `POST /api/v1/curation/nodes/merge` | Yes |
| UC-05, UC-06, UC-07 | `resolveDispute` | `POST /api/v1/curation/disputes/resolve` | Yes (three decisions, same endpoint) |
| UC-08 | `confirmItem` | `POST /api/v1/curation/items/confirm` | Yes |
| UC-09 | `rejectItem` | `POST /api/v1/curation/items/reject` | Yes |
| UC-10 | `correctItem` | `POST /api/v1/curation/items/correct` | Yes |

All 22 BRs in `curation.spec.md` reference at least one UC. BRs 01–22 each include a "Tied to" clause pointing to valid UC identifiers.

### Check 3 — Back-end Spec Coverage

All 7 OpenAPI operations have corresponding service/repository design in `curation.back.md`:
- Each operation maps to one or more BRs (BR-01 through BR-28) in the back spec
- Module layout documented: `backend/src/modules/curation/` with `routes` → `service` → `repository` layers
- SQL patterns documented for every mutation type (merge, repoint, delete, correct, audit INSERT)
- Transaction lifecycle (`BEGIN` / `COMMIT` / `ROLLBACK`) and `FOR UPDATE` locking pattern documented per UC

### Check 4 — Cross-Reference Consistency (error codes)

All error codes used in `openapi.yaml` responses and `curation.spec.md` §6 were verified against `docs/specs/_global/error-codes.md`:

| error.code | HTTP in openapi.yaml | HTTP in global catalog | Match |
|------------|----------------------|------------------------|-------|
| `AUTH_UNAUTHORIZED` | 401 | 401 | Yes |
| `AUTH_TOKEN_INVALID` | 401 | 401 | Yes |
| `AUTH_TOKEN_EXPIRED` | 401 | 401 | Yes |
| `RESOURCE_NOT_FOUND` | 404 | 404 | Yes |
| `BUSINESS_NODE_DELETED` | 410 | 410 | Yes |
| `BUSINESS_REVIEW_NOT_PENDING` | 409 | 409 | Yes |
| `BUSINESS_SELF_MERGE_FORBIDDEN` | 409 | 409 | Yes |
| `BUSINESS_TARGET_NODE_REQUIRED` | 422 | 422 | Yes |
| `BUSINESS_INVALID_TARGET_NODE` | 422 | 422 | Yes |
| `BUSINESS_ITEM_NOT_DISPUTED` | 409 | 409 | Yes |
| `BUSINESS_DISPUTE_WINNER_REQUIRED` | 422 | 422 | Yes |
| `BUSINESS_DISPUTE_PERIODS_REQUIRED` | 422 | 422 | Yes |
| `BUSINESS_ITEM_NOT_UNCERTAIN` | 409 | 409 | Yes |
| `BUSINESS_ITEM_NOT_DELETABLE` | 409 | 409 | Yes |
| `BUSINESS_CORRECTION_NO_CHANGES` | 422 | 422 | Yes |
| `BUSINESS_DATE_UNJUSTIFIED` | 422 | 422 | Yes |
| `BUSINESS_TEMPORAL_INCOHERENT` | 422 | 422 | Yes |
| `BUSINESS_REASON_REQUIRED` | 422 | 422 | Yes |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 | Yes |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 | Yes |
| `VALIDATION_REQUIRED_FIELD` | 422 (spec §6 only) | 422 | Yes |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | Yes |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | 503 | Yes |

No code is used without registration. No deprecated codes are referenced.

### Check 5 — Normative Alignment (segundo-cerebro-modelagem-v7.md)

- **§10.1 / ADR A26 — Two dedicated queues:** `ReviewQueueKind` enum is exactly `[entity_match, disputed]`. `uncertain` and `low_confidence` are correctly excluded as display flags. Confirmed in BR-01 of spec.md and BR-04 of back.md.
- **§4.3 / EntityMatchReview:** Queue listing joins `knowledge_node` (status=`needs_review`) with `entity_match_review` candidates. `EntityMatchQueueItem` schema includes `candidates[]` with `similarity` (pg_trgm score), `canonical_name`, `candidate_node_id`. Aligned with §4.3 EntityMatchReview row structure.
- **§4.4 / Merge invariant:** Path compression runs in same transaction. `merged_into_node_id` always points to active node. Self-merge forbidden. node_type_id must match. All confirmed in BR-04 (spec) and BR-07 (back).
- **§3.5 / CurationAction:** Every curator write produces exactly one `CurationAction` row (BR-17/BR-19 spec, BR-24 back). The row's id is returned as `action_id`. No actor column (single-owner). Audit reads delegated to `compliance-audit`. Confirmed.
- **§6.5-B / Correction:** Predecessor `valid_to` left UNCHANGED (BR-07 spec, BR-18 back). New row gets `supersedes_X = predecessor_id`. Provenance copied (BR-16 spec, BR-19 back). `created_by_run_id = NULL` on new curator-origin row. Confirmed.
- **§6.5-C / Dispute:** Three decisions: `prefer_one`, `adjust_periods`, `keep_disputed`. Losers set `status=deleted AND superseded_at=now()` atomically (BR-08 spec, BR-20 back). Scope homogeneity check enforced (BR-05 spec, BR-14 back).
- **§6.6 / State machine:** `confirm_item` transitions `uncertain → active` without touching confidence (BR-13). `reject_item` and loser-`prefer_one` both set `status=deleted + superseded_at=now()` (BR-08). All confirmed.
- **§10.2 / Operations catalog:** All six curation operations from §10.2 are present (`resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`). `compliance_delete` correctly excluded from this domain and delegated to `compliance-audit` (BR-18).
- **§14.4 / MCP toolset mirroring:** back.md §1 documents the MCP transport mirroring REST 1:1 over the same service layer (ADR A28). `compliance_delete` excluded from REST (belongs to `compliance-audit`). MCP toolset name unchanged.
- **§2.3 / A20 — Single-owner:** No actor column on `curation_action`. JWT authenticates but no `User` entity. Confirmed in BR-02 (spec), BR-01 (back).
- **§2.5 / A29 — Supabase Auth JWT:** All endpoints require `bearerAuth`. Middleware validates before any DB access. 401 codes cover missing/invalid/expired JWT. Confirmed.

### Check 6 — Schema Consistency (migrations/0001_schema.sql)

| Schema element | `0001_schema.sql` definition | Spec alignment |
|----------------|------------------------------|----------------|
| `node_status` enum | `active, needs_review, merged, deleted` | Matches `NodeStatus` schema in openapi.yaml and state machine in spec.md §5 |
| `assertion_status` enum | `active, uncertain, disputed, superseded, deleted` | Matches `AssertionStatus` schema in openapi.yaml. Note: `inactive` is never stored (§5.4/A9) — confirmed by enum absence |
| `valid_from_source` enum | `stated, document, received` | Matches `ValidFromSource` schema in openapi.yaml |
| `knowledge_node` columns | `id, node_type_id, canonical_name, status, merged_into_node_id, created_at, updated_at` | Matches back.md §2 data model table |
| `knowledge_node` constraints | `knowledge_node_merged_ck` (`(status='merged') = (merged_into_node_id IS NOT NULL)`), `knowledge_node_no_self_merge_ck` | Referenced in back.md BR-23 and BR-04 invariant |
| `knowledge_node` indexes | `knowledge_node_needs_review_idx` (partial on `created_at WHERE status='needs_review'`), `knowledge_node_merged_idx` (partial on `merged_into_node_id WHERE NOT NULL`), `knowledge_node_type_idx` | Matches index justifications in back.md §2 |
| `entity_match_review` | `id, node_id, candidate_node_id, similarity (CHECK 0..1), created_at`, UNIQUE `(node_id, candidate_node_id)`, CHECK `node_id <> candidate_node_id` | Matches back.md §2 entity_match_review table |
| `curation_action` | `id, action (text), target_kind (text), target_id (uuid nullable), payload (jsonb DEFAULT '{}'), reason (text nullable), created_at` | Matches back.md §2 curation_action table. No actor column confirmed (single-owner §2.3/A20) |
| `knowledge_link` | `valid_from_source valid_from_source`, `supersedes_link_id uuid REFERENCES knowledge_link(id)`, `knowledge_link_current_dup_guard` partial UNIQUE | Matches back.md §2 |
| `node_attribute` | `node_attribute_current_dup_guard` partial UNIQUE `(node_id, attribute_key_id, value) WHERE valid_to IS NULL AND superseded_at IS NULL` | Matches back.md §2 — the CLAUDE.md "Known Gotchas" pairing of `status=deleted + superseded_at=now()` is enforced by service layer, not DB CHECK |
| `knowledge_link_interval_ck` / `node_attribute_interval_ck` | `CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to)` | Aligns with BR-06 semi-open invariant and BR-16 in back.md |
| `knowledge_link_basis_ck` / `node_attribute_basis_ck` | `CHECK (valid_from IS NULL OR valid_from_source IS NOT NULL)` | Aligns with BR-15 date justification chain (spec.md BR-15, back.md BR-17) |

All schema references in the back spec are verified against the migration DDL. No phantom columns or phantom indexes.

---

## Coverage Map

| UC | operationId | BRs (spec.md) | BRs (back.md) | Error Codes |
|----|-------------|---------------|---------------|-------------|
| UC-01 | listReviewQueue | BR-01, BR-14, BR-21 | BR-01, BR-03, BR-04, BR-05, BR-27 | AUTH_*, VALIDATION_OUT_OF_RANGE, VALIDATION_INVALID_FORMAT, SYSTEM_* |
| UC-02 | resolveEntityMatch (merge_into) | BR-02, BR-03, BR-04, BR-10, BR-17, BR-19, BR-20, BR-21, BR-22 | BR-06, BR-07, BR-08, BR-09, BR-10, BR-11, BR-12, BR-13, BR-22, BR-23, BR-24, BR-25, BR-26 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_REVIEW_NOT_PENDING, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_TARGET_NODE_REQUIRED, BUSINESS_INVALID_TARGET_NODE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-03 | resolveEntityMatch (keep_separate) | BR-02, BR-17, BR-19, BR-21, BR-22 | BR-10, BR-12, BR-22, BR-24, BR-25 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_REVIEW_NOT_PENDING, SYSTEM_* |
| UC-04 | mergeNodes | BR-02, BR-03, BR-04, BR-10, BR-17, BR-19, BR-20, BR-21 | BR-06, BR-07, BR-08, BR-09, BR-11, BR-12, BR-22, BR-23, BR-24, BR-25, BR-26 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_INVALID_TARGET_NODE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-05 | resolveDispute (prefer_one) | BR-05, BR-08, BR-10, BR-17, BR-19, BR-21 | BR-14, BR-15, BR-20, BR-22, BR-24, BR-25, BR-26 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, BUSINESS_DISPUTE_WINNER_REQUIRED, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-06 | resolveDispute (adjust_periods) | BR-05, BR-06, BR-09, BR-17, BR-19, BR-21 | BR-14, BR-16, BR-22, BR-24, BR-25, BR-26 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, BUSINESS_DISPUTE_PERIODS_REQUIRED, BUSINESS_TEMPORAL_INCOHERENT, SYSTEM_* |
| UC-07 | resolveDispute (keep_disputed) | BR-05, BR-17, BR-19, BR-21 | BR-14, BR-24, BR-25 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, SYSTEM_* |
| UC-08 | confirmItem | BR-13, BR-14, BR-17, BR-19, BR-21 | BR-21, BR-22, BR-24, BR-25 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_UNCERTAIN, SYSTEM_* |
| UC-09 | rejectItem | BR-08, BR-10, BR-17, BR-19, BR-21 | BR-11, BR-20, BR-22, BR-24, BR-25 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DELETABLE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-10 | correctItem | BR-07, BR-10, BR-11, BR-12, BR-15, BR-16, BR-17, BR-19, BR-21 | BR-17, BR-18, BR-19, BR-22, BR-24, BR-25, BR-26 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DELETABLE, BUSINESS_CORRECTION_NO_CHANGES, BUSINESS_DATE_UNJUSTIFIED, BUSINESS_TEMPORAL_INCOHERENT, BUSINESS_REASON_REQUIRED, VALIDATION_INVALID_FORMAT, SYSTEM_* |

---

## Triage History

