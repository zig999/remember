# Validation Report: curation

> Triage: COMPLETED

status: VALID

## Summary

**Final complete validation** for requirement **P2.1 — Canonical error-code taxonomy unification**. This run is the definitive final pass for the curation domain. All three spec artifacts are validated at their P2.1-reconciled versions: `curation.spec.md` v1.2.0, `curation.back.md` v1.7.0, `openapi.yaml` v1.2.0.

**P2.1 reconciliation verdict:** The curation domain has fully adopted the canonical namespaced taxonomy. All three spec artifacts use the five canonical prefixes (`AUTH_*` / `VALIDATION_*` / `RESOURCE_*` / `BUSINESS_*` / `SYSTEM_*`) exclusively. The `compliance_delete` asymmetry carve-out (pre-P2.1 `code/mcpCode` pair producing different codes per transport) is **retired** in `curation.back.md` BR-30 and BR-31. No deprecated §14 short codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) appear anywhere in the curation domain spec files.

No blocking inconsistencies were found in any validation pass. The three pre-existing warnings persist unchanged (all informational, non-blocking). **Handoff is approved: `handoff_allowed: true`.**

---

## Checks Performed

- [x] UC ↔ BR cross-reference (all 11 UCs and all 23 BRs in spec.md, all 33 BRs in back.md)
- [x] BR ↔ OpenAPI cross-reference (error codes + HTTP status for all 7 endpoints)
- [x] Error codes against global catalog (`docs/specs/_global/error-codes.md`) — P2.1 version
- [x] No deprecated §14 short codes present in any curation spec artifact
- [x] P2.1 reconciliation completeness: BR-30 carve-out removal, BR-31 compliance_delete mapper, BR-32 parity test mandate
- [x] State machine ST-01/ST-02 ↔ spec.md §5 — transitions, guards, entry/exit conditions
- [x] `getCurationMetrics` (BR-33) operationId and response schema consistency
- [x] Back.md data model ↔ openapi.yaml schemas
- [x] Cross-domain dependencies declared (knowledge-graph, ingestion, query-retrieval, compliance-audit, auth)
- [x] Orphan spec detection (no orphan BRs, no UCs without endpoints, no endpoints without UCs)
- [x] Version consistency: spec.md v1.2.0 / back.md v1.7.0 / openapi.yaml v1.2.0
- [x] Error code HTTP status consistency across all three files
- [x] Coverage map (UC→endpoint→BRs→error codes) complete for all 11 UCs

---

## P2.1 Reconciliation Detail

| Check | File | Location | Result |
|-------|------|----------|--------|
| Canonical vocabulary declared | `curation.back.md` | BR-30 last paragraph | PASS — "The namespaced taxonomy is the ONE canonical vocabulary; every tool — including `compliance_delete` — emits it byte-identical on both transports (P2.1, 2026-07-02)." |
| `compliance_delete` carve-out retired | `curation.back.md` | BR-30 / BR-31 | PASS — The pre-P2.1 `code/mcpCode` pair asymmetry is explicitly retired; companion reconciliation in `compliance-audit.back.md` BR-15. |
| Parity test mandate (byte-identical codes) | `curation.back.md` | BR-32 item 2 + item 5 | PASS — Parity test asserts `error.code` byte-identical between transports for all 8 tools including forced-error cases on `compliance_delete`. |
| Deprecated §14 codes absent | `openapi.yaml`, `curation.spec.md`, `curation.back.md` | all error examples | PASS — No occurrence of `STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, or `INTERNAL`. |
| `BUSINESS_TEMPORAL_INCOHERENT` reuse | `error-codes.md` | Curation section + §14 mapping table | PASS — The catalog explicitly notes `BUSINESS_TEMPORAL_INCOHERENT` and `BUSINESS_DATE_UNJUSTIFIED` are already registered under Curation and reused by ingestion once its spec is reconciled. |

---

## Issues Found

### Blocking Issues

None.

### Warnings (non-blocking)

| # | Severity | Agent | Selected | Source | Description |
|---|----------|-------|----------|--------|-------------|
| WARN-001 | WARNING | — | [ ] | `openapi.yaml` §correctItem 409 response | The `correctItem` 409 example uses `BUSINESS_ITEM_NOT_DELETABLE` with message "Cannot correct a row that is already superseded or deleted". This reuses the `rejectItem` error code for a semantically distinct precondition (correctability vs. deletability). The code is registered and consistent across all files and the global catalog, but dual-use may confuse callers. A distinct `BUSINESS_ITEM_NOT_CORRECTABLE` code would reduce ambiguity. No action required for handoff. |
| WARN-002 | WARNING | — | [ ] | `curation.back.md` §3 BR-26 | BR-26 lists UC-02, UC-04, UC-05, UC-06, UC-10 for `SELECT ... FOR UPDATE` but omits UC-03 (`resolveEntityMatch` keep_separate), which also mutates `knowledge_node.status`. The state-machine guard BR-22 implicitly requires the lock; BR-26's UC list is an incomplete documentation reference but no functional gap exists. |
| WARN-003 | WARNING | — | [ ] | `curation.spec.md` §7 (Cross-Domain Dependencies) | The dependency on `auth` is described as a direct domain entry with a bidirectionality claim, but Neon Auth is infrastructure (no `auth.spec.md` peer domain exists). The reference is accurate in intent but may trigger a false positive in future bidirectionality sweeps. No functional impact. |

---

## Evidence

### Check 1 — UC ↔ BR Cross-Reference

All 11 UCs (UC-01..UC-11) in `curation.spec.md` map to at least one BR. All 23 BRs in spec.md reference at least one UC via the "Tied to" clause. Back.md BR-01..BR-33 all reference specific UCs from spec.md. No orphan BRs in either file.

### Check 2 — Error Code Registry (P2.1 canonical taxonomy)

All 23 error codes used across the three files are present in `docs/specs/_global/error-codes.md` P2.1 version. HTTP status codes are consistent across openapi.yaml, spec.md §6, and back.md BR-30:

| error.code | HTTP openapi.yaml | HTTP catalog | HTTP spec.md §6 | HTTP back.md BR-30 | Match |
|------------|-------------------|--------------|-----------------|-------------------|-------|
| `AUTH_UNAUTHORIZED` | 401 | 401 | 401 | 401 | Yes |
| `AUTH_TOKEN_INVALID` | 401 | 401 | 401 | 401 | Yes |
| `AUTH_TOKEN_EXPIRED` | 401 | 401 | 401 | 401 | Yes |
| `RESOURCE_NOT_FOUND` | 404 | 404 | 404 | 404 | Yes |
| `BUSINESS_NODE_DELETED` | 410 | 410 | 410 | 410 | Yes |
| `BUSINESS_REVIEW_NOT_PENDING` | 409 | 409 | 409 | 409 | Yes |
| `BUSINESS_SELF_MERGE_FORBIDDEN` | 409 | 409 | 409 | 409 | Yes |
| `BUSINESS_TARGET_NODE_REQUIRED` | 422 | 422 | 422 | 422 | Yes |
| `BUSINESS_INVALID_TARGET_NODE` | 422 | 422 | 422 | 422 | Yes |
| `BUSINESS_ITEM_NOT_DISPUTED` | 409 | 409 | 409 | 409 | Yes |
| `BUSINESS_DISPUTE_WINNER_REQUIRED` | 422 | 422 | 422 | 422 | Yes |
| `BUSINESS_DISPUTE_PERIODS_REQUIRED` | 422 | 422 | 422 | 422 | Yes |
| `BUSINESS_ITEM_NOT_UNCERTAIN` | 409 | 409 | 409 | 409 | Yes |
| `BUSINESS_ITEM_NOT_DELETABLE` | 409 | 409 | 409 | 409 | Yes |
| `BUSINESS_CORRECTION_NO_CHANGES` | 422 | 422 | 422 | 422 | Yes |
| `BUSINESS_DATE_UNJUSTIFIED` | 422 | 422 | 422 | 422 | Yes |
| `BUSINESS_TEMPORAL_INCOHERENT` | 422 | 422 | 422 | 422 | Yes |
| `BUSINESS_REASON_REQUIRED` | 422 | 422 | 422 | 422 | Yes |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 | 422 | 422 | Yes |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 | 422 | 422 | Yes |
| `VALIDATION_REQUIRED_FIELD` | 422 | 422 | 422 | 422 | Yes |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | 500 | 500 | Yes |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | 503 | 503 | 503 | Yes |

### Check 3 — Orphan Spec Detection

- All 7 operationIds in `openapi.yaml` (`listReviewQueue`, `resolveEntityMatch`, `mergeNodes`, `resolveDispute`, `confirmItem`, `rejectItem`, `correctItem`, `getCurationMetrics`) are referenced by a UC in spec.md.
- All 11 UCs have a corresponding `operationId` in openapi.yaml (UC-02 and UC-03 share `resolveEntityMatch`; UC-05/06/07 share `resolveDispute`).
- No BR in back.md references a nonexistent UC in spec.md.
- No EV declared without a consumer (state machine events are embedded in ST-01/ST-02; no standalone EV-NN declarations used in this domain).

### Check 4 — Cross-Domain Dependencies

Five cross-domain dependencies declared in spec.md §7:
- `knowledge-graph`: produces; curation writes to tables co-owned by knowledge-graph. No circular issue — knowledge-graph reads the result.
- `ingestion`: synchronizes; `EntityMatchReview` written by ingestion, read+deleted by curation.
- `query-retrieval`: consumes; curator navigates via query-retrieval display flags then acts via curation endpoints.
- `compliance-audit`: synchronizes; curation writes `CurationAction` rows; compliance-audit owns the read-side and `compliance_delete` cascade.
- `auth`: infrastructure reference (Neon Auth / Stack Auth); no peer `auth.spec.md` — pre-existing WARN-003.

No circular dependencies detected. No draft-status dependency issues (all referenced peer specs are present).

### Check 5 — State Machine Consistency

ST-01 (KnowledgeNode) in back.md matches spec.md §5:
- `needs_review → active` (keep_separate): guard "locked + status='needs_review'" ✓
- `needs_review → merged` (merge_into): guard "locked + target locked + target.status='active' + node_type match + reason" ✓
- `active → merged` (mergeNodes): guard "both locked + both active + node_type match + distinct + reason" ✓
- `(any) → deleted`: compliance-audit cascade, returns 410 BUSINESS_NODE_DELETED ✓

ST-02 (KnowledgeLink/NodeAttribute) in back.md matches spec.md §5:
- `uncertain → active` (confirmItem) ✓
- `disputed → active/deleted` (resolveDispute prefer_one winner/loser) ✓
- `disputed → active` (resolveDispute adjust_periods) ✓
- `disputed → disputed` (resolveDispute keep_disputed) ✓
- `active|uncertain|disputed → deleted` (rejectItem with superseded_at) ✓
- `active|uncertain|disputed → superseded` (correctItem predecessor, valid_to UNCHANGED) ✓
- `(new) → active` (correctItem successor, supersedes_X=predecessor_id) ✓

### Check 6 — Coverage Map (Final)

| UC | Endpoint | BRs (spec.md) | Error Codes |
|----|----------|---------------|-------------|
| UC-01 | GET /api/v1/curation/queue | BR-01, BR-14, BR-21 | AUTH_*, VALIDATION_OUT_OF_RANGE, VALIDATION_INVALID_FORMAT, SYSTEM_* |
| UC-02 | POST /entity-matches/{node_id}/resolve | BR-02..BR-04, BR-10, BR-17, BR-19..BR-22 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_REVIEW_NOT_PENDING, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_TARGET_NODE_REQUIRED, BUSINESS_INVALID_TARGET_NODE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-03 | POST /entity-matches/{node_id}/resolve | BR-02, BR-17, BR-19, BR-21, BR-22 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_REVIEW_NOT_PENDING, SYSTEM_* |
| UC-04 | POST /nodes/merge | BR-02..BR-04, BR-10, BR-17, BR-19..BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_INVALID_TARGET_NODE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-05 | POST /disputes/resolve | BR-05, BR-08, BR-10, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, BUSINESS_DISPUTE_WINNER_REQUIRED, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-06 | POST /disputes/resolve | BR-05, BR-06, BR-09, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, BUSINESS_DISPUTE_PERIODS_REQUIRED, BUSINESS_TEMPORAL_INCOHERENT, SYSTEM_* |
| UC-07 | POST /disputes/resolve | BR-05, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DISPUTED, SYSTEM_* |
| UC-08 | POST /items/confirm | BR-13, BR-14, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_UNCERTAIN, VALIDATION_REQUIRED_FIELD, VALIDATION_INVALID_FORMAT, SYSTEM_* |
| UC-09 | POST /items/reject | BR-08, BR-10, BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DELETABLE, BUSINESS_REASON_REQUIRED, SYSTEM_* |
| UC-10 | POST /items/correct | BR-07, BR-10..BR-12, BR-15..BR-17, BR-19, BR-21 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_ITEM_NOT_DELETABLE, BUSINESS_CORRECTION_NO_CHANGES, BUSINESS_DATE_UNJUSTIFIED, BUSINESS_TEMPORAL_INCOHERENT, BUSINESS_REASON_REQUIRED, VALIDATION_INVALID_FORMAT, SYSTEM_* |
| UC-11 | GET /api/v1/curation/metrics | BR-14, BR-21, BR-23 | AUTH_*, SYSTEM_SERVICE_UNAVAILABLE, SYSTEM_INTERNAL_ERROR |

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-12 | — | — | First validation run (back phase). Status: VALID. 3 warnings recorded. |
| 2026-06-26 | — | — | Re-validation for chat/ingestion temporal-context requirement. Curation domain out of scope — no spec changes. Status: VALID confirmed. |
| 2026-07-03 | — | — | P2.1 incremental_back validation. curation.spec.md v1.2.0 / curation.back.md v1.7.0 / openapi.yaml v1.2.0. P2.1 reconciliation complete: compliance_delete carve-out retired, namespaced taxonomy enforced on both transports, UC-11/BR-33 getCurationMetrics verified. Status: VALID, handoff_allowed: false (incremental mode). |
| 2026-07-03 | — | — | P2.1 **final_complete** validation. Full Mode 2 pass: coverage map, error code consistency across all three files, orphan detection, cross-domain dependencies, versioning, state machine. No new issues found. Status: VALID, handoff_allowed: **true**. |
