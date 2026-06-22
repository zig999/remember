# Validation Report: compliance-audit

> Validator: Spec Validator | Date: 2026-06-22 | Attempt: 1 | Mode: incremental_back
> Status: VALID
> Triage: COMPLETED

## Summary

The compliance-audit domain spec artifacts (openapi.yaml v1.0.0, compliance-audit.spec.md v1.1.0, compliance-audit.back.md v1.2.0) are internally consistent across the v1.2.0 incremental revision. The v1.2.0 change reconciles `compliance_delete` as the eighth tool on the curation MCP transport (`POST /api/v1/mcp/curation`) owned by `curation.back.md` — the change is transport-wiring only (no schema change, no error-code change, no UC/BR semantic change). All 5 use cases map to distinct OpenAPI operationIds. All 17 business rules reference valid UCs. All error codes are in the global catalog at correct HTTP statuses. Three warnings are found: WARN-001 and WARN-002 are carried over from the prior v1.1.0 validation run (unchanged); WARN-003 is new in v1.2.0 (stale "future" label on the curation dependency in spec.md §7). No blocking inconsistencies. Handoff approved for the incremental back-phase.

## Checks Performed

- [x] UC ↔ BR cross-reference: all 17 BRs reference existing UCs (UC-01..UC-05)
- [x] BR ↔ OpenAPI cross-reference: all error codes and HTTP statuses match openapi.yaml
- [x] Error codes in global catalog: all codes verified (AUTH_UNAUTHORIZED, RESOURCE_NOT_FOUND, VALIDATION_REQUIRED_FIELD, VALIDATION_INVALID_FORMAT, VALIDATION_OUT_OF_RANGE, SYSTEM_INTERNAL_ERROR, STRUCTURAL_INVALID, NOT_FOUND, INTERNAL)
- [x] State machine ST-RI-DEL: back.md §4 consistent with spec.md §5.1 — transport-invariant note (v1.2.0) correctly added
- [x] Domain events: back.md §5 declares N/A — consistent with spec.md (no EV identifiers)
- [x] v1.2.0 new content: MCP curation transport wiring, BR-14/BR-15 updates, §7 technical constraints — all internally consistent
- [x] OpenAPI $ref integrity: all references resolve to declared components (16 $ref values — unchanged from prior run)

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

### WARN-003 (warning — new in v1.2.0) — Stale "future" qualifier on curation dependency

- **Source:** `compliance-audit.spec.md` §7 (Dependencies table, "curation (future)" row)
- **Target:** `compliance-audit.back.md` §8 (Out of Scope, v1.2.0 first bullet)
- **Detail:** compliance-audit.spec.md §7 labels the curation domain as `curation (future) | produces` with the note "Every curation tool of §14.4 ... This domain does NOT define those tools; it only reads the audit log they produce." However, compliance-audit.back.md v1.2.0 §8 explicitly resolves this: "The historical 'future curation domain' wording of v1.1.0 is RESOLVED in v1.2.0 — the `curation` domain exists and owns the seven tools end-to-end on both REST and MCP." The spec.md §7 has not been updated to reflect that the curation domain is now operational.
- **Severity:** WARNING — does not block handoff; the dependency is functionally correct (compliance-audit reads the audit log produced by curation tool calls); only the "future" qualifier is stale.
- **Suggested fix:** In compliance-audit.spec.md §7, change "curation (future)" to "curation" and update the description to note that the curation domain now exists (`curation.spec.md` / `curation.back.md` v1.2.0) and owns the seven curation tools end-to-end; this domain reads the `CurationAction` audit log those tools produce.
- **Responsible:** Spec Writer

## Evidence

### UC ↔ OpenAPI Coverage (unchanged from v1.1.0)

| UC | operationId | Path | Method | Status |
|----|-------------|------|--------|--------|
| UC-01 | `complianceDeleteRawInformation` | `/api/v1/compliance/deletions` | POST | Covered |
| UC-02 | `listComplianceDeletions` | `/api/v1/compliance/deletions` | GET | Covered |
| UC-03 | `getComplianceDeletionById` | `/api/v1/compliance/deletions/{complianceDeletionId}` | GET | Covered |
| UC-04 | `listCurationActions` | `/api/v1/audit/curation-actions` | GET | Covered |
| UC-05 | `getCurationActionById` | `/api/v1/audit/curation-actions/{curationActionId}` | GET | Covered |

### BR ↔ UC Coverage (v1.2.0 — BRs BR-01..BR-17)

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
| BR-14 | UC-01 ✓ | N/A (transport invariant — v1.2.0 rewritten for curation MCP transport) | N/A |
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

### State Machine Consistency (v1.2.0)

| SM | spec.md | back.md | Consistent |
|----|---------|---------|-----------|
| ST-RI-DEL | §5.1 — `[active]` → `[deleted]` (idempotent repeat → `[deleted]`, legacy → error 500) | §4 — same states + legacy-inconsistency guard + transport-invariant note (v1.2.0 addition) | Yes |

### v1.2.0 Incremental Changes — Consistency Audit

| Change | Back.md section | Consistent with spec.md / openapi.yaml | Notes |
|--------|----------------|----------------------------------------|-------|
| `compliance_delete` as 8th tool on curation MCP transport | BR-14 (rewritten), BR-15, §1 MCP row, §6 External Integrations, §7 constraints | Yes — spec.md §6.2 MCP envelope codes unchanged; openapi.yaml unchanged (REST only) | Transport-wiring change, no API contract change |
| Three-transport coexistence documented | §1 MCP server row, §7 bullet 1 | Yes — consistent with ingestion.back.md (ingest transport) and knowledge-graph.back.md (query transport) | Informational only |
| §14 canonical code asymmetry | BR-15 (explicit), §7 bullet 3 | Yes — spec.md §6.2 already documented `STRUCTURAL_INVALID`/`NOT_FOUND`/`INTERNAL` | Preserves existing MCP contract |
| `transport` label on alarm log lines | BR-17, §1 Logging row, §1 Observability row | Yes — consistent with curation.back.md logging pattern | Observability improvement |
| BR-10 vocabulary aligned with curation transport closed whitelist | BR-10 (description updated) | Yes — 7 names unchanged; note about the 8-name whitelist is informational | No semantic change |

### Domain Dependencies (v1.2.0)

| Domain | Listed in spec.md §7 | back.md status | Bidirectional check |
|--------|---------------------|----------------|---------------------|
| `ingestion` | Yes (synchronizes) | Back.md §8 OOS confirms ingestion-owned UC-01/UC-12 not in scope here | Requires checking ingestion.spec.md §7 for compliance-audit reference |
| `knowledge-graph` | Yes (synchronizes) | Back.md confirms cascade writes to kg tables via UC-01 BR-07 | Requires checking kg.spec.md §7 |
| `query-retrieval` | Yes (synchronizes) | Back.md §5 EV N/A; qr domain handles tombstone short-circuit separately | Requires checking qr.spec.md §7 |
| `curation` | "curation (future)" in spec.md — WARN-003 | back.md v1.2.0 confirms curation domain now exists and operational | Stale label in spec.md |

## Final Result

- [x] UC ↔ OpenAPI coverage — PASS (5/5)
- [x] BR ↔ UC cross-reference — PASS (17/17 BRs reference valid UCs)
- [x] Error codes in global catalog — PASS (all codes verified)
- [x] Error code HTTP status consistency — PASS (0 conflicts)
- [x] State machine consistency (ST-RI-DEL) — PASS
- [x] Domain events — PASS (N/A declared, consistent)
- [x] v1.2.0 incremental change consistency — PASS (transport-wiring only; no schema/UC/BR/error-code semantic changes)
- [x] No blocking inconsistencies

**status: VALID — 0 blocking issues, 3 warnings (WARN-001 carried over, WARN-002 carried over, WARN-003 new). Handoff to implementation group is approved for the back-phase.**

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-12 | None — no blocking issues | None | VALID on first run (v1.0.0 incremental_back, attempt 1) |
| 2026-06-12 | None — revalidation confirms same result | None | VALID confirmed (v1.1.0 incremental_back, attempt 2) |
| 2026-06-22 | None — no blocking issues | None | VALID confirmed (v1.2.0 incremental_back, attempt 1) — WARN-003 new (stale "future" label on curation dependency) |
