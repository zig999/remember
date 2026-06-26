# Validation Report: knowledge-graph

> Triage: COMPLETED

| Field | Value |
|-------|-------|
| Domain | knowledge-graph |
| Mode | incremental_back (Mode 1) |
| Status | **VALID** |
| Validated by | u-spec-validator |
| Date | 2026-06-26 |
| Scope note | knowledge-graph is OUT OF SCOPE for the current improvement (chat temporal-context + ingestion received_at anchor). Validation confirms no spec changes needed. |

---

## Coverage Map

| UC | Endpoint / operationId | BRs (back.md) | Error Codes | Status |
|----|------------------------|---------------|-------------|--------|
| UC-01 | GET /api/v1/node-types — `listNodeTypes` | BR-01, BR-10, BR-18, BR-27 | AUTH_*, SYSTEM_* | Covered |
| UC-02 | GET /api/v1/link-types — `listLinkTypes` | BR-01, BR-10, BR-18, BR-27 | AUTH_*, SYSTEM_* | Covered |
| UC-03 | GET /api/v1/attribute-keys — `listAttributeKeys` | BR-01, BR-03, BR-10, BR-18, BR-27 | AUTH_*, BUSINESS_UNKNOWN_NODE_TYPE, SYSTEM_* | Covered |
| UC-04 | GET /api/v1/nodes — `listNodes` | BR-01, BR-03, BR-15, BR-19, BR-27 | AUTH_*, BUSINESS_UNKNOWN_NODE_TYPE, VALIDATION_OUT_OF_RANGE, SYSTEM_* | Covered |
| UC-05 | GET /api/v1/nodes/{node_id} — `getNodeById` | BR-01, BR-02, BR-06, BR-07, BR-08, BR-11, BR-21, BR-27 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, VALIDATION_INVALID_FORMAT, SYSTEM_* | Covered |
| UC-06 | GET /api/v1/nodes/{node_id}/traverse — `traverseNode` | BR-01, BR-02, BR-04, BR-05, BR-06, BR-07, BR-08, BR-13, BR-14, BR-22, BR-27 | AUTH_*, BUSINESS_UNKNOWN_LINK_TYPE, BUSINESS_INVALID_TRAVERSE_DEPTH, VALIDATION_INVALID_FORMAT, RESOURCE_NOT_FOUND, SYSTEM_* | Covered |
| UC-07 | GET /api/v1/links/{link_id} — `getLinkById` | BR-01, BR-02, BR-07, BR-16, BR-17, BR-27 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Covered |
| UC-08 | GET /api/v1/attributes/{attribute_id} — `getAttributeById` | BR-01, BR-02, BR-07, BR-16, BR-17, BR-27 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Covered |
| UC-09 | GET /api/v1/links/{link_id}/history — `getLinkHistory` | BR-01, BR-02, BR-12, BR-16, BR-27 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Covered |
| UC-10 | GET /api/v1/attributes/{attribute_id}/history — `getAttributeHistory` | BR-01, BR-02, BR-12, BR-16, BR-27 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Covered |
| UC-11 | GET /api/v1/nodes/{node_id}/attributes/{key}/history — `getAttributeKeyHistory` | BR-01, BR-02, BR-11, BR-20, BR-27 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_UNKNOWN_ATTRIBUTE_KEY, SYSTEM_* | Covered |

---

## Validation Checks (Mode 1 — incremental back phase)

### 1. Cross-ref UC <-> BR

All 27 BRs in `knowledge-graph.back.md` reference at least one UC from `knowledge-graph.spec.md`. All UC-01 through UC-11 have at least one corresponding BR. **PASS**

### 2. Cross-ref BR <-> OpenAPI: error.code and HTTP status

All error codes in the `.back.md` BRs match the HTTP statuses declared in `openapi.yaml`:

| error.code | back.md HTTP | openapi.yaml HTTP | Match |
|------------|-------------|-------------------|-------|
| AUTH_UNAUTHORIZED | 401 | 401 (Unauthorized component) | ✓ |
| AUTH_TOKEN_INVALID | 401 | 401 (Unauthorized component) | ✓ |
| AUTH_TOKEN_EXPIRED | 401 | 401 (Unauthorized component) | ✓ |
| RESOURCE_NOT_FOUND | 404 | 404 (per endpoint) | ✓ |
| BUSINESS_UNKNOWN_ATTRIBUTE_KEY | 404 | 404 (getAttributeKeyHistory) | ✓ |
| BUSINESS_NODE_DELETED | 410 | 410 (getNodeById, getAttributeKeyHistory) | ✓ |
| BUSINESS_UNKNOWN_NODE_TYPE | 422 | 422 (listAttributeKeys, listNodes) | ✓ |
| BUSINESS_UNKNOWN_LINK_TYPE | 422 | 422 (traverseNode) | ✓ |
| BUSINESS_INVALID_TRAVERSE_DEPTH | 422 | 422 (traverseNode) | ✓ |
| VALIDATION_INVALID_FORMAT | 422 | 422 (getNodeById, traverseNode) | ✓ |
| VALIDATION_OUT_OF_RANGE | 422 | 422 (listNodes) | ✓ |
| SYSTEM_INTERNAL_ERROR | 500 | 500 (InternalError component) | ✓ |
| SYSTEM_SERVICE_UNAVAILABLE | 503 | 503 (ServiceUnavailable component) | ✓ |

**PASS**

### 3. Error codes: all present in the global catalog

All error codes used in this domain are registered in `docs/specs/_global/error-codes.md`:
- AUTH_UNAUTHORIZED, AUTH_TOKEN_INVALID, AUTH_TOKEN_EXPIRED — Base Codes / Authentication
- RESOURCE_NOT_FOUND — Base Codes / Resource
- VALIDATION_INVALID_FORMAT, VALIDATION_OUT_OF_RANGE — Base Codes / Validation
- SYSTEM_INTERNAL_ERROR, SYSTEM_SERVICE_UNAVAILABLE — Base Codes / System
- BUSINESS_NODE_DELETED, BUSINESS_UNKNOWN_NODE_TYPE, BUSINESS_UNKNOWN_LINK_TYPE, BUSINESS_INVALID_TRAVERSE_DEPTH, BUSINESS_UNKNOWN_ATTRIBUTE_KEY — Knowledge Graph domain table

**PASS**

### 4. State machine: ST corresponds to states in spec.md

`knowledge-graph.back.md §4` reproduces the ST-01 (KnowledgeNode) and ST-02 (KnowledgeLink/NodeAttribute) state machines verbatim from `knowledge-graph.spec.md §5`. All states (`active`, `needs_review`, `merged`, `deleted`, `uncertain`, `disputed`, `superseded`) are consistent across both files. Derived states (`is_current`, `is_in_effect`, `effective_status`) are correctly never-stored per BR-09. **PASS**

### 5. Events: EV are triggered by actions described in UCs

No domain events (EV) are declared. This domain is READ-ONLY; it observes writes by ingestion/curation/compliance through the database (§5 "N/A -- no domain events in this version"). This is consistent with the architecture (no event bus) and with the UC descriptions. **PASS — no events to cross-ref (informational warning preserved from prior validation)**

### Additional: operationId mapping

All 11 operationIds in `openapi.yaml` (`listNodeTypes`, `listLinkTypes`, `listAttributeKeys`, `listNodes`, `getNodeById`, `traverseNode`, `getLinkById`, `getAttributeById`, `getLinkHistory`, `getAttributeHistory`, `getAttributeKeyHistory`) are referenced in the `.spec.md` UC list and back.md BR-27. **PASS**

### Additional: REST envelope alignment

`back.md` BR-27 and `openapi.yaml` v1.5.0 are mutually consistent: every 2xx response schema references an `*Envelope` schema wrapping `{ ok: true, result: <payload> }`; every 4xx/5xx uses `ErrorResponse` (wrapped `{ ok: false, error: { ... } }`). **PASS**

---

## Inconsistencies

None blocking. One inherited warning preserved from previous validation.

| # | Type | Source | Target | Problem | Severity |
|---|------|--------|--------|---------|----------|
| W-001 | coverage | `back/knowledge-graph.back.md §5` | n/a | No domain events (EV) declared. Domain is READ-ONLY; this is architecturally expected. Per skill rules, EV without a declared consumer is warning-level only. No action required. | warning |

---

## Result

**VALID — no blocking inconsistencies. Handoff allowed.**

## Triage History

- 2026-06-26: VALID on incremental back-phase re-validation (scope constraint: knowledge-graph is OUT OF SCOPE for current improvement; spec unchanged). 1 inherited warning (W-001, no action required).
