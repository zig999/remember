# Validation Report: curation

> Triage: COMPLETED

status: VALID

## Summary

Incremental validation (back phase) re-run for the chat/ingestion temporal-context improvement requirement. The curation domain is **out of scope** for this requirement — no changes were made to `openapi.yaml`, `curation.spec.md`, or `curation.back.md`. All spec artifacts remain at their previously-validated versions (spec.md v1.1.0, back.md v1.4.0, openapi.yaml v1.0.0).

All checks passed. No new blocking inconsistencies introduced. The three pre-existing warnings (WARN-001, WARN-002, WARN-003) persist unchanged — all are informational and non-blocking.

The `getCurationMetrics` endpoint (BR-33, back.md v1.4.0) added for the curadoria feature was also verified: operationId `getCurationMetrics` is consistent between `openapi.yaml` (line 146) and `curation.back.md` BR-33; response schema `CurationMetricsResponse` resolves correctly; error codes 401/500/503 are consistent with the global catalog. No new error codes were added.

---

## Checks Performed

- [x] UC ↔ BR cross-reference (spec.md §3 BRs → UCs)
- [x] BR ↔ OpenAPI cross-reference (error codes + HTTP status)
- [x] Error codes against global catalog (`docs/specs/_global/error-codes.md`)
- [x] State machine ST-01/ST-02 ↔ spec.md §5
- [x] getCurationMetrics (BR-33) operationId and response schema consistency
- [x] Back.md data model ↔ openapi.yaml schemas
- [x] Cross-domain dependencies plausibility

---

## Issues Found

### Blocking Issues

None.

### Warnings (non-blocking)

| # | Severity | Agent | Selected | Source | Description |
|---|----------|-------|----------|--------|-------------|
| WARN-001 | WARNING | — | [ ] | `openapi.yaml` §correctItem 409 response | The `correctItem` 409 example uses `BUSINESS_ITEM_NOT_DELETABLE` with message "Cannot correct a row that is already superseded or deleted". This reuses the `rejectItem` error code for a semantically distinct precondition (correctability vs. deletability). The code is registered and consistent with `curation.spec.md` §6 and the global catalog, but the dual use may confuse callers — a distinct `BUSINESS_ITEM_NOT_CORRECTABLE` code would reduce ambiguity. No action required for handoff. |
| WARN-002 | WARNING | — | [ ] | `curation.back.md` §3 BR-26 | BR-26 lists UC-02, UC-04, UC-05, UC-06, UC-10 for SELECT...FOR UPDATE but omits UC-03 (`resolveEntityMatch` keep_separate), which also mutates `knowledge_node.status`. The state-machine guard BR-22 implicitly requires the lock; BR-26's UC list is an incomplete documentation reference but no functional gap exists. |
| WARN-003 | WARNING | — | [ ] | `curation.spec.md` §7 (Cross-Domain Dependencies) | The dependency on `auth` is described as a direct domain entry with a bidirectionality claim, but Neon Auth is infrastructure (no `auth.spec.md` peer domain exists). The reference is accurate in intent but may trigger a false positive in future bidirectionality sweeps. No functional impact. |

---

## Evidence

### Check 1 — UC ↔ BR Cross-Reference

All 22 BRs in `curation.spec.md` reference at least one UC via the "Tied to" clause. No BR references a nonexistent UC. All 10 UCs (UC-01..UC-10) are covered by at least one BR.

### Check 2 — BR ↔ OpenAPI (error codes + HTTP status)

All error codes used in `openapi.yaml` responses and `curation.spec.md` §6 verified against `docs/specs/_global/error-codes.md`:

| error.code | HTTP openapi.yaml | HTTP catalog | Match |
|------------|-------------------|--------------|-------|
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
| `VALIDATION_REQUIRED_FIELD` | 422 | 422 | Yes |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | Yes |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | 503 | Yes |

No code used without registration. No deprecated codes referenced.

### Check 3 — State Machine (ST-01/ST-02)

ST-01 (KnowledgeNode) and ST-02 (KnowledgeLink/NodeAttribute) in `curation.back.md` §4 match the state machine in `curation.spec.md` §5. All transition guards documented in back.md (lock + status precondition + paired `superseded_at` where required). No orphan states or missing transitions.

### Check 4 — getCurationMetrics (BR-33) Consistency

- `openapi.yaml`: `GET /api/v1/curation/metrics`, operationId `getCurationMetrics` at line 146. Responses: 200 (`CurationMetricsResponse`), 401, 500, 503. No request body, no query parameters.
- `curation.back.md` BR-33: operationId `getCurationMetrics` explicitly cited (line 658). REST-only (no MCP surface, 8-name whitelist unchanged). Responses: 200, 401 (`AUTH_*`), 503 (`SYSTEM_SERVICE_UNAVAILABLE` — graceful degradation override; ANY aggregation failure degrades to 503 not 500).
- `CurationMetricsResponse` schema in openapi.yaml (lines 1518-1603) is consistent with the 7 field sources documented in BR-33 SQL table.
- No new error codes introduced by this endpoint.

### Check 5 — Coverage Map

| UC | operationId | BRs (spec.md) | Error Codes |
|----|-------------|---------------|-------------|
| UC-01 | listReviewQueue | BR-01, BR-14, BR-21 | AUTH_*, VALIDATION_OUT_OF_RANGE, VALIDATION_INVALID_FORMAT, SYSTEM_* |
| UC-02 | resolveEntityMatch (merge_into) | BR-02..BR-04, BR-10, BR-17, BR-19..BR-22 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_REVIEW_NOT_PENDING, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_TARGET_NODE_REQUIRED, BUSINESS_INVALID_TARGET_NODE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-03 | resolveEntityMatch (keep_separate) | BR-02, BR-17, BR-19, BR-21, BR-22 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_REVIEW_NOT_PENDING, SYSTEM_* |
| UC-04 | mergeNodes | BR-02..BR-04, BR-10, BR-17, BR-19..BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_INVALID_TARGET_NODE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-05 | resolveDispute (prefer_one) | BR-05, BR-08, BR-10, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, BUSINESS_DISPUTE_WINNER_REQUIRED, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-06 | resolveDispute (adjust_periods) | BR-05, BR-06, BR-09, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, BUSINESS_DISPUTE_PERIODS_REQUIRED, BUSINESS_TEMPORAL_INCOHERENT, SYSTEM_* |
| UC-07 | resolveDispute (keep_disputed) | BR-05, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, SYSTEM_* |
| UC-08 | confirmItem | BR-13, BR-14, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_UNCERTAIN, SYSTEM_* |
| UC-09 | rejectItem | BR-08, BR-10, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DELETABLE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-10 | correctItem | BR-07, BR-10..BR-12, BR-15..BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DELETABLE, BUSINESS_CORRECTION_NO_CHANGES, BUSINESS_DATE_UNJUSTIFIED, BUSINESS_TEMPORAL_INCOHERENT, BUSINESS_REASON_REQUIRED, VALIDATION_INVALID_FORMAT, SYSTEM_* |

---

## Triage History

- 2026-06-12: First validation run (back phase). Status: VALID. 3 warnings recorded.
- 2026-06-26: Re-validation for chat/ingestion temporal-context requirement. Curation domain out of scope — no spec changes. Status: VALID confirmed. Same 3 warnings persist unchanged.
