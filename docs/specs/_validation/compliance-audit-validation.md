# Validation Report: compliance-audit

> Validator: Spec Validator | Date: 2026-06-12 | Attempt: 2 | Mode: incremental_back
> Status: VALID
> Triage: COMPLETED

## Summary

The compliance-audit domain spec artifacts (openapi.yaml, compliance-audit.spec.md, compliance-audit.back.md) are internally consistent and aligned with the normative source (`segundo-cerebro-modelagem-v7.md`) and the database schema (`migrations/0001_schema.sql`). All 5 use cases map to distinct OpenAPI operationIds. All 17 business rules reference valid UCs. All error codes used are registered in the global catalog at correct HTTP statuses. One known schema gap is explicitly documented in back.md §7 (missing `status`/`superseded_at` columns on `raw_information`) and does not constitute a spec inconsistency — it is a flagged implementation prerequisite. Two warnings from the prior run (WARN-001, WARN-002) are confirmed informational and do not block handoff.

## Checks Performed

- [x] OpenAPI completeness — all 5 endpoints have request/response schemas, error codes, and security scheme
- [x] Spec consistency — all UCs in spec.md map 1:1 to operationIds in openapi.yaml
- [x] Back-end spec coverage — all operations have service/repository layer design in back.md; BRs BR-01..BR-17 all reference existing UCs
- [x] Cross-reference consistency — all error.codes are in the global catalog at the correct HTTP status
- [x] Normative alignment — all §11, §3.5, §2.3, §2.5, §14.4 requirements correctly represented; ADRs A19, A20, A28, A29 applied
- [x] Schema consistency — `compliance_deletion` and `curation_action` tables match schema lines 452-473 exactly; known gap on `raw_information` is explicitly documented in back.md §7

## Issues Found

### WARN-001 (warning) — `SYSTEM_SERVICE_UNAVAILABLE` (503) not reflected in openapi.yaml

- **Source:** `back/compliance-audit.back.md` §6 (External Integrations — JWKS fetch failure fallback)
- **Target:** `openapi.yaml` path responses, `compliance-audit.spec.md` §6.1
- **Detail:** The 503 response for JWKS-cache-miss + network failure is mentioned in back.md §6 but absent from openapi.yaml path-level responses and the spec.md §6.1 error table. Other domains (knowledge-graph, query-retrieval) expose 503 consistently.
- **Severity:** WARNING — does not block handoff; the 503 path exists only during auth infrastructure failure, not during normal operation.
- **Suggested fix:** Add a `503` response entry (`$ref: "#/components/responses/ServiceUnavailable"`) to the five endpoints in openapi.yaml and add the corresponding row to spec.md §6.1.
- **Responsible:** Back Spec Agent

### WARN-002 (warning) — Dependency naming mismatch across peer specs

- **Source:** `compliance-audit.spec.md` §7
- **Target:** `ingestion.spec.md`, `knowledge-graph.spec.md`, `query-retrieval.spec.md`
- **Detail:** compliance-audit §7 identifies itself as "compliance-audit" but peer specs reference this domain as "compliance". Structurally and semantically the dependencies are correct and bidirectional; only the label is inconsistent.
- **Severity:** WARNING — does not block handoff.
- **Suggested fix:** Standardize the domain label to "compliance-audit" in all peer spec §7 Dependency tables.
- **Responsible:** Spec Writer

## Evidence

### UC ↔ OpenAPI Coverage

| UC | operationId | Path | Method | Status |
|----|-------------|------|--------|--------|
| UC-01 | `complianceDeleteRawInformation` | `/api/v1/compliance/deletions` | POST | Covered |
| UC-02 | `listComplianceDeletions` | `/api/v1/compliance/deletions` | GET | Covered |
| UC-03 | `getComplianceDeletionById` | `/api/v1/compliance/deletions/{complianceDeletionId}` | GET | Covered |
| UC-04 | `listCurationActions` | `/api/v1/audit/curation-actions` | GET | Covered |
| UC-05 | `getCurationActionById` | `/api/v1/audit/curation-actions/{curationActionId}` | GET | Covered |

### BR ↔ UC Coverage

| BR | UC Ref Exists | error.code in Catalog | HTTP matches openapi |
|----|---------------|-----------------------|----------------------|
| BR-01 | UC-01 ✓ | `VALIDATION_REQUIRED_FIELD`, `VALIDATION_OUT_OF_RANGE` ✓ | 422 ✓ |
| BR-02 | UC-01 ✓ | `SYSTEM_INTERNAL_ERROR` (via UC-01 alt 9a) ✓ | 500 ✓ |
| BR-03 | UC-01 ✓ | None (200 success path) | 200 ✓ |
| BR-04 | UC-01 ✓ | None (correctness invariant) | N/A |
| BR-05 | UC-01 ✓ | None (correctness invariant) | N/A |
| BR-06 | UC-01 ✓ | None (correctness invariant) | N/A |
| BR-07 | UC-01 ✓ | None (correctness invariant) | N/A |
| BR-08 | UC-01 ✓ | None (correctness invariant) | N/A |
| BR-09 | UC-02, UC-04 ✓ | `VALIDATION_OUT_OF_RANGE` ✓ | 422 ✓ |
| BR-10 | UC-04 ✓ | `VALIDATION_INVALID_FORMAT` ✓ | 422 ✓ |
| BR-11 | UC-01..UC-05 ✓ | N/A (schema invariant) | N/A |
| BR-12 | UC-01 ✓ | N/A (architectural invariant) | N/A |
| BR-13 | UC-01..UC-05 ✓ | N/A (architectural invariant) | N/A |
| BR-14 | UC-01 ✓ | N/A (transport invariant) | N/A |
| BR-15 | UC-01 ✓ | `STRUCTURAL_INVALID`, `NOT_FOUND`, `INTERNAL` (MCP) ✓ | MCP ✓ |
| BR-16 | UC-01 ✓ | N/A (correctness invariant) | N/A |
| BR-17 | UC-01 alt 4c ✓ | `SYSTEM_INTERNAL_ERROR` ✓ | 500 ✓ |

### Error Code Consistency

| error.code | openapi.yaml | spec.md | back.md | Global Catalog | HTTP | Consistent |
|------------|-------------|---------|---------|----------------|------|-----------|
| `AUTH_UNAUTHORIZED` | 401 Unauthorized ✓ | §6.1 ✓ | Auth section ✓ | ✓ | 401 | Yes |
| `RESOURCE_NOT_FOUND` | 404 NotFound ✓ | §6.1 ✓ | BR-03 ✓ | ✓ | 404 | Yes |
| `VALIDATION_REQUIRED_FIELD` | 422 UnprocessableEntity ✓ | §6.1 ✓ | BR-01 ✓ | ✓ | 422 | Yes |
| `VALIDATION_INVALID_FORMAT` | 422 UnprocessableEntity ✓ | §6.1 ✓ | BR-10 ✓ | ✓ | 422 | Yes |
| `VALIDATION_OUT_OF_RANGE` | 422 UnprocessableEntity ✓ | §6.1 ✓ | BR-01, BR-09 ✓ | ✓ | 422 | Yes |
| `SYSTEM_INTERNAL_ERROR` | 500 InternalError ✓ | §6.1 ✓ | BR-02, BR-17 ✓ | ✓ | 500 | Yes |
| `SYSTEM_SERVICE_UNAVAILABLE` | — (absent) | — (absent) | §6 External Integrations ✓ | ✓ | 503 | Partial (WARN-001) |
| `STRUCTURAL_INVALID` (MCP) | — (MCP only) | §6.2 ✓ | BR-14, BR-15 ✓ | Note in catalog ✓ | MCP | Yes (MCP transport only) |
| `NOT_FOUND` (MCP) | — (MCP only) | §6.2 ✓ | BR-15 ✓ | Note in catalog ✓ | MCP | Yes (MCP transport only) |
| `INTERNAL` (MCP) | — (MCP only) | §6.2 ✓ | BR-15, BR-17 ✓ | Note in catalog ✓ | MCP | Yes (MCP transport only) |

### OpenAPI $ref Integrity

All 16 `$ref` values in openapi.yaml resolve to declared components. No broken references.

### State Machine Consistency

| SM | spec.md | back.md | Consistent |
|----|---------|---------|-----------|
| ST-RI-DEL | §5.1 — `[active]` → `[deleted]` (idempotent repeat → `[deleted]`) | §4 — same states + legacy-inconsistency guard (alt 4c → HTTP 500) | Yes |

### Domain Events

back.md §5 explicitly declares: "N/A — no domain events in this version." No EV identifiers in spec.md. Consistent.

### Schema vs. Back.md Data Model

| Table | Schema lines | back.md §2 | Consistent |
|-------|-------------|-----------|-----------|
| `compliance_deletion` | 465-473 | Documented as owned (INSERT-only) | Yes — all columns, FK, and index match |
| `curation_action` | 452-462 | Documented as shared write (INSERT by this domain) | Yes — all columns (no FK on target_id, plain text action), composite index match |
| `raw_information` | 185-194 | Documented as mutated (tombstone UPDATE) | Gap: `status` and `superseded_at` columns absent from current schema; back.md §7 explicitly flags and requires migration 0003 before UC-01 ships |

### Normative Alignment

| Normative ref | Requirement | Covered in |
|---------------|------------|------------|
| §11 — controlled tombstone | `compliance_delete` tombstones content, cascades status | UC-01, BR-02..BR-08, back.md BR-04..BR-08 |
| §3.5 — audit layer | `CurationAction` row per curation call | UC-01 BR-08, §6 of spec.md |
| §2.3 / A20 — single-owner | No `actor_id` column on audit tables | BR-11, back.md BR-11 |
| §2.5 / A29 — JWT in middleware | JWT validated before any DB access | All endpoints, back.md §1 Auth |
| §14.4 / A28 — dual transport | REST and MCP share same service layer | BR-14, back.md BR-14 |
| A19 — single transaction | UC-01 entire cascade in one TX | BR-02, back.md BR-02 |
| §17 C15 — cascade scenario | Links/attributes with surviving provenance untouched | BR-07, back.md BR-07 |
| §18 principle 1 — audit immutability | No UPDATE/DELETE on audit rows | BR-13, back.md BR-13 |
| §8 idempotency anchor | `content_hash` preserved on tombstone | BR-04, back.md BR-04 |
| A7 — semi-open intervals | `[from, to)` for time-range filters | BR-09, back.md BR-09 |

## Final Result

- [x] OpenAPI completeness — PASS
- [x] Spec consistency (UC ↔ operationId) — PASS
- [x] Back-end spec coverage (all ops covered, BRs valid) — PASS
- [x] Cross-reference consistency (error codes) — PASS (2 warnings, 0 errors)
- [x] Normative alignment (v7) — PASS
- [x] Schema consistency — PASS (known gap documented in back.md §7, not a spec inconsistency)
- [x] No blocking inconsistencies

**status: VALID — 0 blocking issues, 2 warnings (WARN-001, WARN-002). Handoff to implementation group is approved.**

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-12 | None — no blocking issues | None | VALID on first run (attempt 1) |
| 2026-06-12 | None — revalidation confirms same result | None | VALID confirmed (attempt 2) |
