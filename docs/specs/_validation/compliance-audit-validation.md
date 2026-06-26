# Validation Report: compliance-audit

> Validator: Spec Validator | Date: 2026-06-26 | Attempt: 1 | Mode: incremental_back
> Status: VALID
> Triage: COMPLETED

## Summary

The compliance-audit domain spec artifacts (openapi.yaml v1.0.0, compliance-audit.spec.md v1.1.0, compliance-audit.back.md v1.2.0) remain internally consistent. This re-validation run was triggered by the chat temporal-fidelity requirement (VARIANT 1: no schema change, no new endpoint), which incidentally produced a documentation-only fix in compliance-audit/openapi.yaml: the `CurationAction.reason` field description was rephrased from "may be null for non-destructive ones" to "null for non-destructive operations (e.g. `confirm_item`)" — a clarity improvement that aligns it with back.md §2. No structural, semantic, HTTP-status, or error-code change was made. The previous VALID status is confirmed. Three carried-over warnings remain (WARN-001, WARN-002, WARN-003) — all non-blocking.

## Checks Performed

- [x] UC ↔ BR cross-reference: all 17 BRs reference existing UCs (UC-01..UC-05)
- [x] BR ↔ OpenAPI cross-reference: all error codes and HTTP statuses match openapi.yaml — no change
- [x] Error codes in global catalog: all codes verified (AUTH_UNAUTHORIZED, RESOURCE_NOT_FOUND, VALIDATION_REQUIRED_FIELD, VALIDATION_INVALID_FORMAT, VALIDATION_OUT_OF_RANGE, SYSTEM_INTERNAL_ERROR, STRUCTURAL_INVALID, NOT_FOUND, INTERNAL)
- [x] State machine ST-RI-DEL: back.md §4 consistent with spec.md §5.1 — unchanged
- [x] Domain events: back.md §5 declares N/A — unchanged
- [x] openapi.yaml change audit: the only change is a description-text clarification in `CurationAction.reason`; no schema type, enum, required, HTTP status, or error code was modified
- [x] OpenAPI $ref integrity: all references resolve to declared components — unchanged

## Issues Found

### WARN-001 (warning — carried over) — `SYSTEM_SERVICE_UNAVAILABLE` not in openapi.yaml

- **Source:** `back/compliance-audit.back.md` §6 (External Integrations — JWKS fetch failure fallback)
- **Target:** `openapi.yaml` path responses, `compliance-audit.spec.md` §6.1
- **Detail:** The 503 response for JWKS-cache-miss + network failure is mentioned in back.md §6 but absent from openapi.yaml path-level responses and spec.md §6.1 error table.
- **Severity:** WARNING — does not block handoff; the 503 path exists only during auth infrastructure failure, not during normal operation.
- **Suggested fix:** Add a `503` response entry (`$ref: "#/components/responses/ServiceUnavailable"`) to the five endpoints in openapi.yaml and add the corresponding row to spec.md §6.1.
- **Responsible:** Back Spec Agent

### WARN-002 (warning — carried over) — Dependency naming mismatch across peer specs

- **Source:** `compliance-audit.spec.md` §7
- **Target:** `ingestion.spec.md`, `knowledge-graph.spec.md`, `query-retrieval.spec.md`
- **Detail:** compliance-audit §7 identifies this domain as "compliance-audit" but peer specs reference it as "compliance". Structurally and semantically the dependencies are correct and bidirectional; only the label is inconsistent.
- **Severity:** WARNING — does not block handoff.
- **Suggested fix:** Standardize the domain label to "compliance-audit" in all peer spec §7 Dependency tables.
- **Responsible:** Spec Writer

### WARN-003 (warning — carried over) — Stale "future" qualifier on curation dependency

- **Source:** `compliance-audit.spec.md` §7 (Dependencies table, "curation (future)" row)
- **Target:** `compliance-audit.back.md` §8 (Out of Scope, v1.2.0 first bullet)
- **Detail:** compliance-audit.spec.md §7 labels the curation domain as `curation (future) | produces` but compliance-audit.back.md v1.2.0 §8 explicitly resolves this: "The historical 'future curation domain' wording of v1.1.0 is RESOLVED in v1.2.0 — the `curation` domain exists and owns the seven tools end-to-end on both REST and MCP."
- **Severity:** WARNING — does not block handoff; the dependency is functionally correct; only the "future" qualifier is stale.
- **Suggested fix:** In compliance-audit.spec.md §7, change "curation (future)" to "curation" and update the description accordingly.
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

### openapi.yaml Change Impact Analysis (2026-06-26)

| Component | Field Changed | Change Type | Impact |
|-----------|--------------|-------------|--------|
| `CurationAction.reason` | `description` text | Documentation clarification | None — no schema type, enum, required, HTTP status, or error code changed |

Previous description: "Free-text reason. Mandatory for destructive operations (...); may be null for non-destructive ones."
New description: "Free-text reason. Mandatory for destructive operations (...); null for non-destructive operations (e.g. `confirm_item`)."

The new text is more precise and consistent with back.md §2 (`curation_action` table, `reason` field note: "May be null for non-destructive curation calls (e.g. `confirm_item`, per `curation.back.md` BR-11)"). Net effect: improved spec consistency, zero structural impact.

### BR ↔ UC Coverage (v1.2.0 — BRs BR-01..BR-17)

| BR | UC Ref Exists | error.code in Catalog | HTTP matches openapi |
|----|---------------|-----------------------|----------------------|
| BR-01 | UC-01 ✓ | `VALIDATION_REQUIRED_FIELD`, `VALIDATION_OUT_OF_RANGE` ✓ | 422 ✓ |
| BR-02 | UC-01 ✓ | `SYSTEM_INTERNAL_ERROR` (via UC-01 alt 9a) ✓ | 500 ✓ |
| BR-03 | UC-01 ✓ | None (200 success path) | 200 ✓ |
| BR-04..BR-08 | UC-01 ✓ | None (correctness invariants) | N/A |
| BR-09 | UC-02, UC-04 ✓ | `VALIDATION_OUT_OF_RANGE` ✓ | 422 ✓ |
| BR-10 | UC-04 ✓ | `VALIDATION_INVALID_FORMAT` ✓ | 422 ✓ |
| BR-11..BR-13 | UC-01..UC-05 ✓ | N/A (architectural invariants) | N/A |
| BR-14 | UC-01 ✓ | N/A (transport invariant) | N/A |
| BR-15 | UC-01 ✓ | `STRUCTURAL_INVALID`, `NOT_FOUND`, `INTERNAL` (MCP) ✓ | MCP ✓ |
| BR-16 | UC-01 ✓ | N/A (correctness invariant) | N/A |
| BR-17 | UC-01 alt 4c ✓ | `SYSTEM_INTERNAL_ERROR` ✓ | 500 ✓ |

### Error Code Consistency

| error.code | openapi.yaml | spec.md | back.md | Global Catalog | HTTP | Consistent |
|------------|-------------|---------|---------|----------------|------|-----------|
| `AUTH_UNAUTHORIZED` | 401 ✓ | §6.1 ✓ | Auth section ✓ | ✓ | 401 | Yes |
| `RESOURCE_NOT_FOUND` | 404 ✓ | §6.1 ✓ | BR-03 ✓ | ✓ | 404 | Yes |
| `VALIDATION_REQUIRED_FIELD` | 422 ✓ | §6.1 ✓ | BR-01 ✓ | ✓ | 422 | Yes |
| `VALIDATION_INVALID_FORMAT` | 422 ✓ | §6.1 ✓ | BR-10 ✓ | ✓ | 422 | Yes |
| `VALIDATION_OUT_OF_RANGE` | 422 ✓ | §6.1 ✓ | BR-01, BR-09 ✓ | ✓ | 422 | Yes |
| `SYSTEM_INTERNAL_ERROR` | 500 ✓ | §6.1 ✓ | BR-02, BR-17 ✓ | ✓ | 500 | Yes |
| `SYSTEM_SERVICE_UNAVAILABLE` | — absent | — absent | §6 fallback ✓ | ✓ | 503 | Partial (WARN-001) |
| `STRUCTURAL_INVALID` (MCP) | — MCP only | §6.2 ✓ | BR-14, BR-15 ✓ | ✓ | MCP | Yes |
| `NOT_FOUND` (MCP) | — MCP only | §6.2 ✓ | BR-15 ✓ | ✓ | MCP | Yes |
| `INTERNAL` (MCP) | — MCP only | §6.2 ✓ | BR-15, BR-17 ✓ | ✓ | MCP | Yes |

### State Machine Consistency

| SM | spec.md | back.md | Consistent |
|----|---------|---------|-----------|
| ST-RI-DEL | §5.1 — `[active]` → `[deleted]` (idempotent repeat → `[deleted]`, legacy → error 500) | §4 — same states + legacy-inconsistency guard + transport-invariant note | Yes |

## Final Result

- [x] UC ↔ OpenAPI coverage — PASS (5/5)
- [x] BR ↔ UC cross-reference — PASS (17/17 BRs reference valid UCs)
- [x] Error codes in global catalog — PASS (all codes verified)
- [x] Error code HTTP status consistency — PASS (0 conflicts)
- [x] State machine consistency (ST-RI-DEL) — PASS
- [x] Domain events — PASS (N/A declared, consistent)
- [x] openapi.yaml change impact — PASS (documentation-only fix, no structural change)
- [x] No blocking inconsistencies

**status: VALID — 0 blocking issues, 3 warnings (WARN-001/002/003 all non-blocking, carried over). Handoff to implementation group remains approved.**

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-12 | None — no blocking issues | None | VALID on first run (v1.0.0 incremental_back, attempt 1) |
| 2026-06-12 | None — revalidation confirms same result | None | VALID confirmed (v1.1.0 incremental_back, attempt 2) |
| 2026-06-22 | None — no blocking issues | None | VALID confirmed (v1.2.0 incremental_back, attempt 1) — WARN-003 new (stale "future" label on curation dependency) |
| 2026-06-26 | None — no blocking issues | None | VALID confirmed (v1.2.0 re-validation, attempt 1) — documentation-only fix in openapi.yaml CurationAction.reason description; no structural change |
