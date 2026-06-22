# Validation: query-retrieval v1.4.0

> Validator: Spec Validator | Date: 2026-06-22 | Mode: incremental_back
> Status: INVALID
> Triage: PENDING

## Summary

Incremental back-phase validation triggered by the completion of `query-retrieval.back.md` v1.4.0 (chat downstream-consumer reverse declaration). All spec files for this domain have been cross-validated against the global error-codes catalog.

**Requirement context:** Async one-shot ingestion in chat backend; the query-retrieval domain itself is UNCHANGED and read-only — the chat-side `start_async_ingestion` / `get_ingestion_status` tools resolve on the `ingest` toolset, not `query`. The spec updates (v1.3.0 spec.md + v1.4.0 back.md) were additive documentation-only changes satisfying a reverse-declaration requirement.

**Blocking issue found (1):** Six domain-specific BUSINESS_ error codes used throughout the query-retrieval spec are not registered in the global error-codes catalog. This is a pre-existing gap that was not caught in the original v1.0.0 validation (the prior result incorrectly reported `status: VALID`).

---

## Coverage Map

| UC | Endpoint (openapi.yaml) | BRs (.back.md) | Status |
|----|------------------------|----------------|--------|
| UC-01 | GET /api/v1/search (searchKnowledge) | BR-01..BR-09, BR-22..BR-26 | Covered |
| UC-02 | GET /api/v1/search (as_of param) | BR-09, BR-14 | Covered |
| UC-03 | GET /api/v1/search (layers param) | BR-04, BR-07, BR-09, BR-10 | Covered |
| UC-04 | GET /api/v1/search (in_effect_only) | BR-09, BR-14 | Covered |
| UC-05 | GET /api/v1/search (zero results) | BR-05, BR-22 | Covered |
| UC-06 | GET /api/v1/search (flags) | BR-08, BR-09 | Covered |
| UC-07 | GET /api/v1/provenance/links/{link_id} (getProvenanceByLink) | BR-16..BR-19 | Covered |
| UC-08 | GET /api/v1/provenance/attributes/{attribute_id} (getProvenanceByAttribute) | BR-16..BR-19 | Covered |
| UC-09 | GET /api/v1/provenance/fragments/{fragment_id} (getProvenanceByFragment) | BR-02, BR-16..BR-19 | Covered |

All 9 UCs have corresponding endpoints in openapi.yaml and at least one BR reference in back.md. UC coverage is complete.

---

## Inconsistencies

| # | Type | Source File | Target File | Description | Agent | Severity | Selected |
|---|------|------------|-------------|-------------|-------|----------|----------|
| 1 | error-code | openapi.yaml, spec.md §6, back.md §3 | .claude/skills/u-spec-globals/error-codes.md | Six BUSINESS_ error codes used in the query-retrieval domain have no entry in the global catalog: `BUSINESS_FRAGMENT_NOT_ACCEPTED` (404), `BUSINESS_RAW_INFORMATION_DELETED` (410), `BUSINESS_INVALID_SEARCH_QUERY` (422), `BUSINESS_INVALID_SEARCH_LAYER` (422), `BUSINESS_INVALID_TRAVERSE_DEPTH` (422, shared with knowledge-graph), `BUSINESS_UNKNOWN_LINK_TYPE` (422, shared with knowledge-graph). The catalog has no `### Query-Retrieval` section and no `### Knowledge-Graph` section. | Spec Writer | blocking | [ ] |
| 2 | cross-ref | knowledge-graph.spec.md §7 | query-retrieval.spec.md §7 | knowledge-graph.spec.md §7 uses the name `retrieval` (not `query-retrieval`) for the bidirectional dependency; canonical name is mismatched. Also, knowledge-graph.spec.md §7 does not yet list `chat` as a downstream consumer — query-retrieval has done so in v1.3.0 but knowledge-graph has not yet complied with the chat v2.3 reverse-declaration requirement. | Spec Writer | warning | [ ] |
| 3 | cross-ref | query-retrieval.spec.md (UC-07..09, BR-14) | back/query-retrieval.back.md §2 | spec.md references `raw_information.status = 'deleted'` as tombstone signal; back.md resolves this via `EXISTS compliance_deletion`. Self-documented gap, no runtime risk, but spec language is misaligned with schema. | Spec Writer | warning | [ ] |
| 4 | cross-ref | query-retrieval.spec.md §7, back.md §8 | chat.back.md BR-05 | The v2.3 requirement ("Revokes chat.back.md BR-05") affects ONLY the chat domain. query-retrieval is correctly read-only and unchanged. Preserved here for traceability: the domain's own declarations (v1.3.0 reverse-declaration + v1.4.0 back note) correctly describe the catalog-isolation invariant. No action required on this domain. | -- (external) | warning | [ ] |

---

## Error Code Consistency

| error.code | openapi.yaml | spec.md §6 | back.md §3 | Global Catalog | HTTP status consistent | Status |
|------------|-------------|------------|------------|----------------|----------------------|--------|
| `AUTH_UNAUTHORIZED` | 401 | 401 | 401 | YES (base) | YES | OK |
| `AUTH_TOKEN_INVALID` | 401 | 401 | 401 | YES (base) | YES | OK |
| `AUTH_TOKEN_EXPIRED` | 401 | 401 | 401 | YES (base) | YES | OK |
| `RESOURCE_NOT_FOUND` | 404 | 404 | 404 | YES (base) | YES | OK |
| `BUSINESS_FRAGMENT_NOT_ACCEPTED` | 404 | 404 | 404 | NO | YES | MISSING FROM CATALOG |
| `BUSINESS_RAW_INFORMATION_DELETED` | 410 | 410 | 410 | NO | YES | MISSING FROM CATALOG |
| `BUSINESS_INVALID_SEARCH_QUERY` | 422 | 422 | 422 | NO | YES | MISSING FROM CATALOG |
| `BUSINESS_INVALID_SEARCH_LAYER` | 422 | 422 | 422 | NO | YES | MISSING FROM CATALOG |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | 422 | 422 | 422 | NO | YES | MISSING FROM CATALOG |
| `BUSINESS_UNKNOWN_LINK_TYPE` | 422 | 422 | 422 | NO | YES | MISSING FROM CATALOG |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 | 422 | YES (base) | YES | OK |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 | 422 | YES (base) | YES | OK |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | 500 | YES (base) | YES | OK |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | 503 | 503 | YES (base) | YES | OK |

**Finding:** All HTTP statuses are consistent across openapi.yaml, spec.md, and back.md. The six missing codes are internally consistent within the domain but absent from the global catalog — a blocking violation of Catalog Rule 4 ("Every new code must be registered here BEFORE being used in any spec").

**Note on BUSINESS_INVALID_TRAVERSE_DEPTH and BUSINESS_UNKNOWN_LINK_TYPE:** back.md §3 BR-03 and BR-04 describe these as "reused from knowledge-graph". The knowledge-graph domain originated these codes but also lacks a catalog section. The fix should register them in a `### Knowledge-Graph` section (or one shared section) and cite that entry from the query-retrieval back-spec.

---

## Dependencies

| Domain | Exists | Bidirectional | Notes |
|--------|--------|---------------|-------|
| `ingestion` | YES | Partial — ingestion.spec.md lists this domain as `retrieval (future)`, not `query-retrieval` | WARNING (name mismatch, semantic link intact) |
| `knowledge-graph` | YES | Partial — KG spec uses `retrieval`, not `query-retrieval`; reverse chat declaration missing in KG | WARNING |
| `curation` | YES | Not verified in this incremental run | OK |
| `compliance` | YES | Not verified in this incremental run | OK |
| `auth` | Virtual (middleware) | N/A | OK |
| `chat` | YES | query-retrieval v1.3.0 declares chat; chat.spec.md v2.3 BR-05 declares query-retrieval tools | Satisfied for this domain |

---

## Result

- [x] UC coverage complete (9/9 UCs have endpoint + at least 1 BR)
- [x] BR/UC cross-references consistent within the domain
- [x] HTTP status codes consistent across openapi.yaml / spec.md / back.md
- [ ] Error codes registered in global catalog — **FAIL: 6 codes missing**
- [x] No orphan BRs (all BRs in back.md reference existing UCs from spec.md)
- [x] State machine: domain is stateless by spec (explicitly documented); N/A
- [x] Events: domain emits no events (read-only); N/A
- [x] openapi.yaml envelope citations use BR-19 (no stale BR-15 citations found)
- [ ] Bidirectional dependency names fully aligned — WARNING (name mismatch)

**Overall: INVALID — 1 blocking issue, 3 warnings**

---

## Required Actions

| # | Inconsistency | Responsible Agent | What to Fix |
|---|---------------|-------------------|-------------|
| 1 | 6 error codes missing from global catalog | Spec Writer | Add `### Query-Retrieval` section to `.claude/skills/u-spec-globals/error-codes.md` with `BUSINESS_FRAGMENT_NOT_ACCEPTED` (404), `BUSINESS_RAW_INFORMATION_DELETED` (410), `BUSINESS_INVALID_SEARCH_QUERY` (422), `BUSINESS_INVALID_SEARCH_LAYER` (422). Add `### Knowledge-Graph` section with `BUSINESS_INVALID_TRAVERSE_DEPTH` (422) and `BUSINESS_UNKNOWN_LINK_TYPE` (422). |

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
