# Validation: query-retrieval v1.5.0 (spec.md) / v1.5.0 (openapi.yaml) / v1.6.0 (back.md)

> Validator: Spec Validator | Date: 2026-07-03 | Mode: final_complete (P2.1 re-validation)
> Status: VALID
> Triage: COMPLETED

## Summary

Final validation for the query-retrieval domain covering the P2.1 canonical error-code taxonomy requirement.
Requirement: all spec files (openapi.yaml, .spec.md, .back.md) must use only the NAMESPACED error-code
vocabulary (`AUTH_*`, `VALIDATION_*`, `RESOURCE_*`, `BUSINESS_*`, `SYSTEM_*`), with the seven §14 short
codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`,
`NOT_FOUND`, `INTERNAL`) deprecated and absent from every transport.

Files validated:
- `docs/specs/domains/query-retrieval/openapi.yaml` v1.5.0
- `docs/specs/domains/query-retrieval/query-retrieval.spec.md` v1.5.0 (Status: approved)
- `docs/specs/domains/query-retrieval/back/query-retrieval.back.md` v1.6.0 (Status: draft)
- `docs/specs/_global/error-codes.md` (global catalog — P2.1 canonical taxonomy, 2026-07-02)

---

## P2.1 Compliance Audit

### Error Code Taxonomy Check

All 14 error codes used across the three files belong exclusively to the five namespaced prefixes.
No deprecated §14 short codes found in any file on any transport.

| error.code | Prefix | openapi.yaml | spec.md §6 | back.md §3 | Catalog | HTTP consistent | P2.1 Status |
|------------|--------|-------------|------------|------------|---------|-----------------|-------------|
| `AUTH_UNAUTHORIZED` | AUTH_* | 401 | 401 | 401 | YES (base) | YES | COMPLIANT |
| `AUTH_TOKEN_INVALID` | AUTH_* | 401 | 401 | 401 | YES (base) | YES | COMPLIANT |
| `AUTH_TOKEN_EXPIRED` | AUTH_* | 401 | 401 | 401 | YES (base) | YES | COMPLIANT |
| `RESOURCE_NOT_FOUND` | RESOURCE_* | 404 | 404 | 404 | YES (base) | YES | COMPLIANT |
| `BUSINESS_FRAGMENT_NOT_ACCEPTED` | BUSINESS_* | 404 | 404 | 404 | YES (QR section) | YES | COMPLIANT |
| `BUSINESS_RAW_INFORMATION_DELETED` | BUSINESS_* | 410 | 410 | 410 | YES (QR section) | YES | COMPLIANT |
| `BUSINESS_INVALID_SEARCH_QUERY` | BUSINESS_* | 422 | 422 | 422 | YES (QR section) | YES | COMPLIANT |
| `BUSINESS_INVALID_SEARCH_LAYER` | BUSINESS_* | 422 | 422 | 422 | YES (QR section) | YES | COMPLIANT |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | BUSINESS_* | 422 | 422 | 422 | YES (KG section, reused) | YES | COMPLIANT |
| `BUSINESS_UNKNOWN_LINK_TYPE` | BUSINESS_* | 422 | 422 | 422 | YES (KG section, reused) | YES | COMPLIANT |
| `VALIDATION_INVALID_FORMAT` | VALIDATION_* | 422 | 422 | 422 | YES (base) | YES | COMPLIANT |
| `VALIDATION_OUT_OF_RANGE` | VALIDATION_* | 422 | 422 | 422 | YES (base) | YES | COMPLIANT |
| `SYSTEM_INTERNAL_ERROR` | SYSTEM_* | 500 | 500 | 500 | YES (base) | YES | COMPLIANT |
| `SYSTEM_SERVICE_UNAVAILABLE` | SYSTEM_* | 503 | 503 | 503 | YES (base) | YES | COMPLIANT |

### Deprecated §14 Short Code Scan

Searched all three files for: `STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`,
`TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`.

| Deprecated code | Found in openapi.yaml | Found in spec.md | Found in back.md |
|-----------------|----------------------|-----------------|-----------------|
| `STRUCTURAL_INVALID` | NO | NO | NO (mentioned only as deprecated in BR-24/BR-25 guard text) |
| `UNKNOWN_TYPE` | NO | NO | NO |
| `RULE_VIOLATION` | NO | NO | NO |
| `TEMPORAL_INCOHERENT` | NO | NO | NO |
| `DATE_UNJUSTIFIED` | NO | NO | NO |
| `NOT_FOUND` | NO | NO | NO |
| `INTERNAL` | NO | NO | NO |

**Result: Zero deprecated §14 codes used on any transport. P2.1 requirement SATISFIED.**

### Per-File P2.1 Anchoring

| File | P2.1 Note Present | Location | Deprecated Code Ban Stated |
|------|------------------|----------|---------------------------|
| openapi.yaml v1.5.0 | YES | `info.description` v1.5.0 block | YES — explicit list of 7 deprecated codes |
| spec.md v1.5.0 | YES | §6 Error Behaviors "Canonical taxonomy (P2.1, v1.5.0)" note | YES — names the 5 allowed prefixes, lists the 7 deprecated codes |
| back.md v1.6.0 | YES | BR-24 P2.1 paragraph + BR-25 parity assertion clause | YES — BR-24 bans per-transport code discriminators; BR-25 defines CI guard |

### Parity Guard (BR-25)

`back.md` BR-25 declares a REST↔MCP parity test contract that explicitly:
1. Asserts `error.code` byte-identical across REST and MCP for the same business condition.
2. Requires the forced-error branch to verify the code belongs to one of the 5 namespaced prefixes.
3. States that observing any of the 7 deprecated §14 short codes in either transport MUST fail the test.

This makes BR-25 the CI enforcement point for P2.1 compliance in this domain. Parallel guards
declared in `compliance-audit.back.md` BR-14, `curation.back.md` BR-32, `knowledge-graph.back.md` TC-04.

---

## Coverage Map

| UC | Endpoint (openapi.yaml) | back.md BRs | Error Codes | Status |
|----|------------------------|-------------|-------------|--------|
| UC-01 | GET /api/v1/search (`searchKnowledge`) | BR-01..BR-09, BR-15, BR-22..BR-26 | BUSINESS_INVALID_SEARCH_QUERY, _LAYER, _TRAVERSE_DEPTH, _UNKNOWN_LINK_TYPE, VALIDATION_INVALID_FORMAT, _OUT_OF_RANGE, AUTH_*, SYSTEM_* | Covered |
| UC-02 | GET /api/v1/search (`as_of` param) | BR-04, BR-14 | VALIDATION_INVALID_FORMAT | Covered |
| UC-03 | GET /api/v1/search (`layers` param) | BR-04, BR-07, BR-10, BR-12 | BUSINESS_INVALID_SEARCH_LAYER | Covered |
| UC-04 | GET /api/v1/search (`in_effect_only`) | BR-13, BR-14 | (none new) | Covered |
| UC-05 | GET /api/v1/search (zero results) | BR-05, BR-22 | BUSINESS_INVALID_SEARCH_QUERY | Covered |
| UC-06 | GET /api/v1/search (flags) | BR-08, BR-09 | (none new) | Covered |
| UC-07 | GET /api/v1/provenance/links/{link_id} | BR-16..BR-19 | RESOURCE_NOT_FOUND, BUSINESS_RAW_INFORMATION_DELETED | Covered |
| UC-08 | GET /api/v1/provenance/attributes/{attribute_id} | BR-16..BR-19 | RESOURCE_NOT_FOUND, BUSINESS_RAW_INFORMATION_DELETED | Covered |
| UC-09 | GET /api/v1/provenance/fragments/{fragment_id} | BR-02, BR-16..BR-19 | RESOURCE_NOT_FOUND, BUSINESS_FRAGMENT_NOT_ACCEPTED, BUSINESS_RAW_INFORMATION_DELETED | Covered |
| UC-10 | GET /api/v1/fragments/accepted (`listAcceptedFragments`) | BR-27 | VALIDATION_INVALID_FORMAT, VALIDATION_OUT_OF_RANGE, AUTH_*, SYSTEM_* | Covered |

All 10 UCs have corresponding endpoints in openapi.yaml and at least one BR in back.md. Coverage complete.

---

## Versioning

| File | Version | Status |
|------|---------|--------|
| spec.md | 1.5.0 | approved |
| openapi.yaml | 1.5.0 | — |
| back.md | 1.6.0 | draft |

Note: back.md is at v1.6.0 while spec.md is at v1.5.0. This is expected — the v1.6.0 back.md
changelog entry (P2.1 alignment: BR-24/BR-25 documentation extension) was coordinated with
spec.md v1.5.0 and openapi.yaml v1.5.0, and the back.md is documentation-only (no new error codes,
no schema change). The "draft" status on back.md is a pre-existing condition (unchanged from
prior validation runs).

---

## Warnings (non-blocking)

| # | Id | Type | Source | Description |
|---|----|------|--------|-------------|
| 1 | WARN-001 | cross-ref | knowledge-graph.spec.md §7 | `knowledge-graph.spec.md` §7 uses the name `retrieval` rather than `query-retrieval` for the bidirectional dependency. Semantic link intact; canonical name differs. Pre-existing gap from prior validation runs. No action required on this domain. |
| 2 | WARN-002 | cross-ref | query-retrieval.back.md §2 | `spec.md` (UC-07..09, BR-14) references `raw_information.status = 'deleted'` as the tombstone signal; `back.md` §2 resolves this via `EXISTS compliance_deletion`. Self-documented schema-vs-spec gap; no runtime risk. Should be reconciled in a future migration or spec revision. |

---

## Blocking Issues

None.

---

## Result

- [x] All 10 UCs have a corresponding endpoint in `openapi.yaml`
- [x] All BRs in `back.md` reference existing UCs from `spec.md`
- [x] All 14 error codes registered in the global catalog with consistent HTTP statuses
- [x] **P2.1: All error codes use ONLY namespaced prefixes (AUTH_*, VALIDATION_*, RESOURCE_*, BUSINESS_*, SYSTEM_*)**
- [x] **P2.1: Zero deprecated §14 short codes found in any file on any transport**
- [x] **P2.1: All three files contain cross-references to the canonical taxonomy (error-codes.md)**
- [x] **P2.1: back.md BR-25 declares CI parity guard asserting namespaced-only codes**
- [x] State machine: domain is stateless (explicit N/A per spec)
- [x] Domain events: domain emits no events (read-only, explicit N/A per spec)
- [x] REST envelope (spec.md BR-19 / back.md BR-26): all 5 endpoints use `{ ok: true, result }` on success
- [x] MCP framing (back.md BR-23/BR-24): MCP tools use `content`/`isError`; REST wrap does not cross into MCP
- [x] `listAcceptedFragments` (UC-10): fully covered by back.md BR-27; no new error codes; REST-only
- [x] No blocking inconsistencies

**Overall: VALID — 0 blocking issues, 2 pre-existing warnings (informational)**

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-22 | Issue 1 (6 BUSINESS_ codes missing from catalog) | Corrected by validator: the codes were in `docs/specs/_global/error-codes.md` (correct file); the prior check used the skill template instead. Result updated to VALID. | VALID (correction) |
| 2026-06-26 | Re-validated for current improvement scope (chat context window) | Spec Validator | VALID — domain is out of scope and all artifacts are consistent |
| 2026-07-03 | P2.1 canonical taxonomy re-validation | Spec Validator | VALID — P2.1 requirement fully satisfied; all three files use namespaced codes exclusively; zero deprecated §14 codes; back.md v1.6.0 BR-24/BR-25 add CI guard declarations |
