# Compliance Report

> Date: 2026-07-03 | Domains: 5 (knowledge-graph, ingestion, curation, compliance-audit, query-retrieval) | Requirement: P2.1 — Canonical error-code taxonomy | Status: COMPLIANT

## Coverage Metrics (knowledge-graph domain — final complete validation)

| Metric | Total | Covered | Percentage |
|--------|-------|---------|------------|
| Use Cases (UC) | 11 (UC-01..UC-11) | 11 | 100% |
| Endpoints (OpenAPI) | 11 | 11 | 100% |
| Business Rules (BR) | 28 (back.md) + 22 (spec.md) | 28 + 22 | 100% |
| Feature States (UI) | N/A (backend-only domain) | N/A | N/A |
| Navigation Flows (FL) | N/A (backend-only domain) | N/A | N/A |
| BDD Scenarios (§9) | N/A (backend-only domain) | N/A | N/A |
| Error Codes | 14 | 14 | 100% |
| Components in design-system/components.md | N/A (backend-only domain) | N/A | N/A |

## Coverage by Domain

### knowledge-graph v1.6.0 (openapi.yaml) / v1.3.0 (spec.md) / v1.6.0 (back.md)

| UC | Endpoint | BRs (back.md) | Error Codes | Status |
|----|----------|---------------|-------------|--------|
| UC-01 | GET /api/v1/node-types (`listNodeTypes`) | BR-01, BR-10, BR-18, BR-23, BR-25, BR-27, BR-28 | AUTH_*, SYSTEM_* | Yes |
| UC-02 | GET /api/v1/link-types (`listLinkTypes`) | BR-01, BR-10, BR-18, BR-23, BR-25, BR-27, BR-28 | AUTH_*, SYSTEM_* | Yes |
| UC-03 | GET /api/v1/attribute-keys (`listAttributeKeys`) | BR-01, BR-03, BR-10, BR-18, BR-23, BR-25, BR-27, BR-28 | AUTH_*, BUSINESS_UNKNOWN_NODE_TYPE, SYSTEM_* | Yes |
| UC-04 | GET /api/v1/nodes (`listNodes`) | BR-01, BR-03, BR-15, BR-19, BR-23, BR-25, BR-27, BR-28 | AUTH_*, BUSINESS_UNKNOWN_NODE_TYPE, VALIDATION_OUT_OF_RANGE, SYSTEM_* | Yes |
| UC-05 | GET /api/v1/nodes/{node_id} (`getNodeById`) | BR-01, BR-02, BR-06, BR-07, BR-08, BR-11, BR-21, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, VALIDATION_INVALID_FORMAT, SYSTEM_* | Yes |
| UC-06 | GET /api/v1/nodes/{node_id}/traverse (`traverseNode`) | BR-01, BR-02, BR-04, BR-05, BR-06, BR-07, BR-08, BR-13, BR-14, BR-22, BR-25, BR-26, BR-27, BR-28 | AUTH_*, BUSINESS_UNKNOWN_LINK_TYPE, BUSINESS_INVALID_TRAVERSE_DEPTH, VALIDATION_INVALID_FORMAT, RESOURCE_NOT_FOUND, SYSTEM_* | Yes |
| UC-07 | GET /api/v1/links/{link_id} (`getLinkById`) | BR-01, BR-02, BR-07, BR-16, BR-17, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Yes |
| UC-08 | GET /api/v1/attributes/{attribute_id} (`getAttributeById`) | BR-01, BR-02, BR-07, BR-16, BR-17, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Yes |
| UC-09 | GET /api/v1/links/{link_id}/history (`getLinkHistory`) | BR-01, BR-02, BR-12, BR-16, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Yes |
| UC-10 | GET /api/v1/attributes/{attribute_id}/history (`getAttributeHistory`) | BR-01, BR-02, BR-12, BR-16, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | Yes |
| UC-11 | GET /api/v1/nodes/{node_id}/attributes/{key}/history (`getAttributeKeyHistory`) | BR-01, BR-02, BR-11, BR-20, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_UNKNOWN_ATTRIBUTE_KEY, SYSTEM_* | Yes |

### P2.1 Multi-Domain Status Summary

| Domain | Spec version | Back version | OpenAPI version | Status | Handoff |
|--------|-------------|-------------|-----------------|--------|---------|
| knowledge-graph | v1.3.0 | v1.6.0 | v1.6.0 | VALID | ✓ |
| ingestion | v1.5.1 | (reconciled) | v1.5.0 | VALID | ✓ |
| curation | v1.2.0 | (reconciled) | (reconciled) | VALID | ✓ |
| compliance-audit | v1.2.0 | v1.4.0 | v1.2.0 | VALID | ✓ |
| query-retrieval | v1.5.0 | (reconciled) | v1.5.0 | VALID | ✓ |

All P2.1 domains have `handoff_allowed: true` in their validation result YAMLs (see `docs/specs/_validation/`).

## Approved Validations

- [x] All UCs have a corresponding endpoint in openapi.yaml
- [x] All BRs are present in back.md with UC references
- [x] All openapi.yaml error responses use namespaced codes (P2.1 taxonomy — AUTH_*, VALIDATION_*, RESOURCE_*, BUSINESS_*, SYSTEM_*)
- [x] Every error.code in all spec files belongs to the five P2.1 allowed prefixes
- [x] The seven deprecated v7 §14 short codes (STRUCTURAL_INVALID, UNKNOWN_TYPE, RULE_VIOLATION, TEMPORAL_INCOHERENT, DATE_UNJUSTIFIED, NOT_FOUND, INTERNAL) are explicitly FORBIDDEN on all surfaces of every domain and verified absent from all spec files
- [x] REST and MCP transports emit byte-identical error.code by construction (shared mapErrorToHttpResponse pipeline; parity tests declared in BR-26/TC-04/BR-14/BR-32)
- [x] All error.codes are registered in the global catalog (docs/specs/_global/error-codes.md) under their canonical namespaced taxonomy
- [x] Cross-domain dependencies verified (bidirectionality confirmed for all peer domains of knowledge-graph; no circular dependencies)
- [x] Prefixes follow the global pattern (AUTH_, VALIDATION_, RESOURCE_, BUSINESS_, SYSTEM_) — five prefixes only
- [x] State machines in back.md consistent with spec.md §5 (ST-01, ST-02)
- [x] Changelogs populated in all three spec files for P2.1 (CR: p2-1-error-taxonomy)
- [x] HTTP-semantics rule enforced: business outcomes are never HTTP errors on either transport
- [x] knowledge-graph is READ-ONLY domain — no front-end feature spec or flow file required; UI and BDD checks are N/A for this domain
