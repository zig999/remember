# Validation: query-retrieval v1.4.0 (spec.md) / v1.5.0 (back.md) / v1.4.0 (openapi.yaml)

> Validator: Spec Validator | Date: 2026-06-26 | Mode: incremental_back
> Status: VALID
> Triage: COMPLETED

## Summary

Incremental back-phase validation for the query-retrieval domain. The domain is **OUT OF SCOPE** for the active improvement (chat context window / rolling summary / ingestion date anchor — Requirement: Melhorar a fidelidade de contexto temporal e de memória do subsistema /chat). Validation confirms no changes are required and all existing artifacts are consistent.

Files validated:
- `docs/specs/domains/query-retrieval/openapi.yaml` v1.4.0
- `docs/specs/domains/query-retrieval/query-retrieval.spec.md` v1.4.0
- `docs/specs/domains/query-retrieval/back/query-retrieval.back.md` v1.5.0
- `docs/specs/_global/error-codes.md` (global catalog)

---

## Coverage Map

| UC | Endpoint (openapi.yaml) | BRs (.back.md) | Status |
|----|------------------------|----------------|--------|
| UC-01 | GET /api/v1/search (`searchKnowledge`) | back BR-01..BR-09, BR-22..BR-26 | Covered |
| UC-02 | GET /api/v1/search (`as_of` param) | back BR-09, BR-14 | Covered |
| UC-03 | GET /api/v1/search (`layers` param) | back BR-04, BR-07, BR-09, BR-10 | Covered |
| UC-04 | GET /api/v1/search (`in_effect_only`) | back BR-09, BR-14 | Covered |
| UC-05 | GET /api/v1/search (zero results) | back BR-05, BR-22 | Covered |
| UC-06 | GET /api/v1/search (flags) | back BR-08, BR-09 | Covered |
| UC-07 | GET /api/v1/provenance/links/{link_id} (`getProvenanceByLink`) | back BR-16..BR-19 | Covered |
| UC-08 | GET /api/v1/provenance/attributes/{attribute_id} (`getProvenanceByAttribute`) | back BR-16..BR-19 | Covered |
| UC-09 | GET /api/v1/provenance/fragments/{fragment_id} (`getProvenanceByFragment`) | back BR-02, BR-16..BR-19 | Covered |
| UC-10 | GET /api/v1/fragments/accepted (`listAcceptedFragments`) | back BR-27 (spec BR-20) | Covered |

All 10 UCs have corresponding endpoints in `openapi.yaml` and at least one BR reference in `back.md`. UC coverage is complete.

---

## Error Code Consistency

| error.code | openapi.yaml | spec.md §6 | back.md §3 | Global Catalog | HTTP consistent | Status |
|------------|-------------|------------|------------|----------------|-----------------|--------|
| `AUTH_UNAUTHORIZED` | 401 | 401 | 401 | YES (base) | YES | OK |
| `AUTH_TOKEN_INVALID` | 401 | 401 | 401 | YES (base) | YES | OK |
| `AUTH_TOKEN_EXPIRED` | 401 | 401 | 401 | YES (base) | YES | OK |
| `RESOURCE_NOT_FOUND` | 404 | 404 | 404 | YES (base) | YES | OK |
| `BUSINESS_FRAGMENT_NOT_ACCEPTED` | 404 | 404 | 404 | YES (QR section, line 79) | YES | OK |
| `BUSINESS_RAW_INFORMATION_DELETED` | 410 | 410 | 410 | YES (QR section, line 80) | YES | OK |
| `BUSINESS_INVALID_SEARCH_QUERY` | 422 | 422 | 422 | YES (QR section, line 77) | YES | OK |
| `BUSINESS_INVALID_SEARCH_LAYER` | 422 | 422 | 422 | YES (QR section, line 78) | YES | OK |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | 422 | 422 | 422 | YES (KG section, line 72) | YES | OK |
| `BUSINESS_UNKNOWN_LINK_TYPE` | 422 | 422 | 422 | YES (KG section, line 70) | YES | OK |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 | 422 | YES (base) | YES | OK |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 | 422 | YES (base) | YES | OK |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | 500 | YES (base) | YES | OK |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | 503 | 503 | YES (base) | YES | OK |

All 14 error codes are registered in the global catalog with consistent HTTP statuses across all three files. The six domain-specific BUSINESS_ codes that were previously flagged as missing in the prior run are now correctly registered in `docs/specs/_global/error-codes.md` (resolved in a prior triage cycle, per the `resolution_notes` in the v1.4.0 validation YAML).

---

## Cross-Reference Checks

### Mode 1: UC → BR → OpenAPI

All BRs in `back.md` reference at least one UC from `spec.md`. No orphan BRs found.

All 10 UCs have a matching `operationId` in `openapi.yaml`:
- UC-01..06 → `searchKnowledge` (GET /api/v1/search)
- UC-07 → `getProvenanceByLink` (GET /api/v1/provenance/links/{link_id})
- UC-08 → `getProvenanceByAttribute` (GET /api/v1/provenance/attributes/{attribute_id})
- UC-09 → `getProvenanceByFragment` (GET /api/v1/provenance/fragments/{fragment_id})
- UC-10 → `listAcceptedFragments` (GET /api/v1/fragments/accepted)

### BR cross-ref consistency

`back.md` BR-27 (`listAcceptedFragments`) references UC-10 which exists in `spec.md`. `spec.md` BR-20 (filter precondition) is reflected in `back.md` BR-27 step 1. The envelope rule from `spec.md` BR-19 is reflected in `back.md` BR-26.

The stale `openapi.yaml` citations of "BR-15" for the envelope rule (noted in `spec.md` BR-19 cross-reference note and in `back.md` v1.3.0 changelog) are documented as known stale wording — no contract change; the authoritative reference is `spec.md` BR-19 / `back.md` BR-26.

### State machine

The domain is explicitly **stateless** per `spec.md` §5 and `back.md` §4. No state machine cross-check required.

### Events

The domain emits **no domain events** per `spec.md` §5 note and `back.md` §5. No event cross-check required.

### Cross-Domain Dependencies

| Domain | Declared in spec.md §7 | Bidirectional | Status |
|--------|------------------------|---------------|--------|
| `ingestion` | YES (consumes) | Partial (name `ingestion` matches) | OK |
| `knowledge-graph` | YES (consumes) | KG spec uses `retrieval` name — name mismatch, semantic link intact | WARNING (pre-existing, non-blocking) |
| `curation` | YES (synchronizes + consumes) | Not re-verified in this run | OK |
| `compliance` | YES (synchronizes) | Not re-verified in this run | OK |
| `auth` | YES (synchronizes, middleware) | Virtual | OK |
| `chat` | YES (produces read tools) | `chat.spec.md` v2.3 declares query-retrieval; satisfied | OK |

---

## Warnings (non-blocking)

| # | Type | Description |
|---|------|-------------|
| W-1 | cross-ref | `knowledge-graph.spec.md` §7 uses the name `retrieval` rather than `query-retrieval` for the bidirectional dependency. Semantic link is intact; canonical name differs. Pre-existing gap documented in prior validation runs. No action required on this domain. |
| W-2 | cross-ref | `spec.md` (UC-07..09, BR-14) references `raw_information.status = 'deleted'` as the tombstone signal; `back.md` §2 resolves this via `EXISTS compliance_deletion`. Self-documented schema-vs-spec gap; no runtime risk. Should be reconciled in a future migration or spec revision. |

---

## Result

- [x] All 10 UCs have a corresponding endpoint in `openapi.yaml`
- [x] All BRs in `back.md` reference existing UCs from `spec.md`
- [x] All error codes registered in the global catalog (`docs/specs/_global/error-codes.md`)
- [x] HTTP status codes are consistent across `openapi.yaml`, `spec.md`, and `back.md`
- [x] No orphan BRs or orphan UCs detected
- [x] State machine: domain is stateless (explicit N/A per spec)
- [x] Domain events: domain emits no events (read-only, explicit N/A per spec)
- [x] REST envelope (BR-19/BR-26): all 5 endpoints correctly use `{ ok: true, result }` on success
- [x] MCP framing (BR-23/BR-24): MCP tools use `content`/`isError`; the REST wrap does not cross into MCP
- [x] `listAcceptedFragments` (UC-10): fully covered by `back.md` BR-27; no new error codes; REST-only
- [x] No blocking inconsistencies

**Overall: VALID — 0 blocking issues, 2 pre-existing warnings (informational)**

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-22 | Issue 1 (6 BUSINESS_ codes missing from catalog) | Corrected by validator: the codes were in `docs/specs/_global/error-codes.md` (correct file); the prior check used the skill template instead. Result updated to VALID. | VALID (correction) |
| 2026-06-26 | Re-validated for current improvement scope (chat context window) | Spec Validator | VALID — domain is out of scope and all artifacts are consistent |
