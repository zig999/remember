# Validation Report: knowledge-graph

> Triage: COMPLETED

| Field | Value |
|-------|-------|
| Domain | knowledge-graph |
| Mode | final_complete (Mode 2) |
| Status | **VALID** |
| Validated by | u-spec-validator |
| Date | 2026-07-03 |
| Artifact versions | `knowledge-graph.spec.md` v1.3.0 · `knowledge-graph.back.md` v1.6.0 · `openapi.yaml` v1.6.0 |
| Requirement | P2.1 — Unify BFF error-code taxonomy under canonical NAMESPACED vocabulary |

---

## Scope

Final complete validation (Mode 2) for the knowledge-graph domain. All validation layers executed:

1. **Coverage map** — all 11 UCs mapped to endpoints, BRs, and error codes
2. **Error code consistency** — 14 codes verified across the three spec files and the global catalog
3. **Orphan spec detection** — no orphan BRs, no unmatched operationIds, no missing UC references
4. **Cross-domain dependency validation** — all peer domains verified to exist; bidirectionality confirmed
5. **Versioning verification** — all three files consistently versioned for P2.1 (2026-07-02)

Previous incremental_back validation (2026-07-03T01:59:00Z) confirmed VALID with 0 blocking and 1 warning. This final_complete pass builds on that result and upgrades `handoff_allowed` to `true`.

---

## Step 1: Coverage Map

| UC | Endpoint / operationId | BRs (back.md) | Error Codes Used | No UIs (backend domain) | No FLs | Status |
|----|------------------------|---------------|-----------------|--------------------------|--------|--------|
| UC-01 | GET /api/v1/node-types — `listNodeTypes` | BR-01, BR-10, BR-18, BR-23, BR-25, BR-27, BR-28 | AUTH_*, SYSTEM_* | n/a | n/a | Covered |
| UC-02 | GET /api/v1/link-types — `listLinkTypes` | BR-01, BR-10, BR-18, BR-23, BR-25, BR-27, BR-28 | AUTH_*, SYSTEM_* | n/a | n/a | Covered |
| UC-03 | GET /api/v1/attribute-keys — `listAttributeKeys` | BR-01, BR-03, BR-10, BR-18, BR-23, BR-25, BR-27, BR-28 | AUTH_*, BUSINESS_UNKNOWN_NODE_TYPE, SYSTEM_* | n/a | n/a | Covered |
| UC-04 | GET /api/v1/nodes — `listNodes` | BR-01, BR-03, BR-15, BR-19, BR-23, BR-25, BR-27, BR-28 | AUTH_*, BUSINESS_UNKNOWN_NODE_TYPE, VALIDATION_OUT_OF_RANGE, SYSTEM_* | n/a | n/a | Covered |
| UC-05 | GET /api/v1/nodes/{node_id} — `getNodeById` | BR-01, BR-02, BR-06, BR-07, BR-08, BR-11, BR-21, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, VALIDATION_INVALID_FORMAT, SYSTEM_* | n/a | n/a | Covered |
| UC-06 | GET /api/v1/nodes/{node_id}/traverse — `traverseNode` | BR-01, BR-02, BR-04, BR-05, BR-06, BR-07, BR-08, BR-13, BR-14, BR-22, BR-25, BR-26, BR-27, BR-28 | AUTH_*, BUSINESS_UNKNOWN_LINK_TYPE, BUSINESS_INVALID_TRAVERSE_DEPTH, VALIDATION_INVALID_FORMAT, RESOURCE_NOT_FOUND, SYSTEM_* | n/a | n/a | Covered |
| UC-07 | GET /api/v1/links/{link_id} — `getLinkById` | BR-01, BR-02, BR-07, BR-16, BR-17, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | n/a | n/a | Covered |
| UC-08 | GET /api/v1/attributes/{attribute_id} — `getAttributeById` | BR-01, BR-02, BR-07, BR-16, BR-17, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | n/a | n/a | Covered |
| UC-09 | GET /api/v1/links/{link_id}/history — `getLinkHistory` | BR-01, BR-02, BR-12, BR-16, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | n/a | n/a | Covered |
| UC-10 | GET /api/v1/attributes/{attribute_id}/history — `getAttributeHistory` | BR-01, BR-02, BR-12, BR-16, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, SYSTEM_* | n/a | n/a | Covered |
| UC-11 | GET /api/v1/nodes/{node_id}/attributes/{key}/history — `getAttributeKeyHistory` | BR-01, BR-02, BR-11, BR-20, BR-25, BR-26, BR-27, BR-28 | AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_NODE_DELETED, BUSINESS_UNKNOWN_ATTRIBUTE_KEY, SYSTEM_* | n/a | n/a | Covered |

> Note: UIs (feature spec states) and FLs (flows) are not applicable for the knowledge-graph domain — it is a pure backend domain with no corresponding front-end feature spec or flow file. All frontend interactions with knowledge-graph entities are mediated through other feature domains (graph-improvement, curadoria).

**Coverage: 11/11 UCs covered = 100%**

---

## Step 2: Error Code Consistency

### 2a. Global catalog registration

All 14 error codes used in this domain are registered in `docs/specs/_global/error-codes.md` under the P2.1 canonical taxonomy:

| error.code | Catalog section | HTTP | Status |
|------------|----------------|------|--------|
| `AUTH_UNAUTHORIZED` | Base Codes / Authentication (AUTH_) | 401 | ✓ |
| `AUTH_TOKEN_INVALID` | Base Codes / Authentication (AUTH_) | 401 | ✓ |
| `AUTH_TOKEN_EXPIRED` | Base Codes / Authentication (AUTH_) | 401 | ✓ |
| `VALIDATION_REQUIRED_FIELD` | Base Codes / Validation (VALIDATION_) | 422 | ✓ |
| `VALIDATION_INVALID_FORMAT` | Base Codes / Validation (VALIDATION_) | 422 | ✓ |
| `VALIDATION_OUT_OF_RANGE` | Base Codes / Validation (VALIDATION_) | 422 | ✓ |
| `RESOURCE_NOT_FOUND` | Base Codes / Resource (RESOURCE_) | 404 | ✓ |
| `BUSINESS_NODE_DELETED` | Codes by Domain / Knowledge Graph | 410 | ✓ |
| `BUSINESS_UNKNOWN_NODE_TYPE` | Codes by Domain / Knowledge Graph | 422 | ✓ |
| `BUSINESS_UNKNOWN_LINK_TYPE` | Codes by Domain / Knowledge Graph | 422 | ✓ |
| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | Codes by Domain / Knowledge Graph | 404 | ✓ |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | Codes by Domain / Knowledge Graph | 422 | ✓ |
| `SYSTEM_INTERNAL_ERROR` | Base Codes / System (SYSTEM_) | 500 | ✓ |
| `SYSTEM_SERVICE_UNAVAILABLE` | Base Codes / System (SYSTEM_) | 503 | ✓ |

**PASS — 14/14 codes registered**

### 2b. HTTP status consistency across all three files

| error.code | catalog HTTP | spec.md §6 | back.md BRs | openapi.yaml responses | Consistent |
|------------|-------------|-----------|------------|----------------------|-----------|
| `AUTH_UNAUTHORIZED` | 401 | 401 | 401 (BR-01) | 401 (Unauthorized component) | ✓ |
| `AUTH_TOKEN_INVALID` | 401 | 401 | 401 (BR-01) | 401 (Unauthorized component) | ✓ |
| `AUTH_TOKEN_EXPIRED` | 401 | 401 | 401 (BR-01) | 401 (Unauthorized component) | ✓ |
| `VALIDATION_REQUIRED_FIELD` | 422 | 422 | 422 (BR-02) | 422 (per endpoint) | ✓ |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 | 422 (BR-02, BR-06) | 422 (getNodeById, traverseNode) | ✓ |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 | 422 (BR-19) | 422 (listNodes) | ✓ |
| `RESOURCE_NOT_FOUND` | 404 | 404 | 404 (BR-11) | 404 (per endpoint) | ✓ |
| `BUSINESS_NODE_DELETED` | 410 | 410 | 410 (BR-11) | 410 (getNodeById, getAttributeKeyHistory) | ✓ |
| `BUSINESS_UNKNOWN_NODE_TYPE` | 422 | 422 | 422 (BR-03) | 422 (listAttributeKeys, listNodes) | ✓ |
| `BUSINESS_UNKNOWN_LINK_TYPE` | 422 | 422 | 422 (BR-04) | 422 (traverseNode) | ✓ |
| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | 404 | 404 | 404 (BR-20) | 404 (getAttributeKeyHistory) | ✓ |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | 422 | 422 | 422 (BR-05) | 422 (traverseNode) | ✓ |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | 500 (BR-18) | 500 (InternalError component) | ✓ |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | 503 | 503 (BR-18) | 503 (ServiceUnavailable component) | ✓ |

**PASS — 14/14 codes consistent across all files**

### 2c. Deprecated codes — none used

The seven deprecated §14 short codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) are:
- Explicitly declared FORBIDDEN in `knowledge-graph.spec.md` BR-22 ✓
- Explicitly declared FORBIDDEN in `knowledge-graph.back.md` BR-28 ✓
- Explicitly declared FORBIDDEN in `openapi.yaml` v1.6.0 description ✓
- Verified absent from all example values and inline code references in all three files ✓

**PASS — no deprecated codes present**

### 2d. P2.1 namespaced prefix enforcement

All 14 codes use exactly one of the five allowed P2.1 prefixes: `AUTH_`, `VALIDATION_`, `RESOURCE_`, `BUSINESS_`, `SYSTEM_`. No code with a non-allowed prefix exists in any of the three spec files.

**PASS**

### 2e. REST↔MCP byte-identical error.code invariant

The byte-identical requirement is declared and enforced consistently across all three files:
- `openapi.yaml` v1.6.0 description: "REST and MCP publish the SAME `error.code` byte-for-byte for the SAME business condition" ✓
- `knowledge-graph.spec.md` BR-22: "byte-identical ... the per-transport `mcpCode` field ... is not used by this domain" ✓
- `knowledge-graph.back.md` BR-28: "EXACT SAME `error.code` byte-for-byte ... both transports funnel throws through the SAME `mapErrorToHttpResponse`" ✓
- BR-24: shared `backend/src/shared/error-mapping.ts` is the single registry for both transports ✓
- BR-26: parity tests assert byte-identical `error.code`, `error.message`, AND `error.details` shape ✓

**PASS**

---

## Step 3: Orphan Spec Detection

### 3a. BRs in back.md without a referenced UC

All 28 BRs in `knowledge-graph.back.md` reference at least one UC from `knowledge-graph.spec.md`:
- BR-01, BR-23, BR-24, BR-27, BR-28: UC-01 through UC-11 (all 11)
- BR-02, BR-07..BR-09, BR-16, BR-17: UC-05..UC-11
- BR-03, BR-10: UC-01..UC-03 (catalog)
- BR-04, BR-05, BR-13, BR-14, BR-22: UC-06 (traversal)
- BR-06, BR-08: UC-05, UC-06
- BR-11: UC-05, UC-11
- BR-12: UC-09..UC-11 (history)
- BR-15: UC-04
- BR-19: UC-04
- BR-20: UC-11
- BR-21: UC-05
- BR-25, BR-26: UC-01..UC-03, UC-04..UC-06, UC-09..UC-11
- BR-18: all UCs (error mapping)

**PASS — 28/28 BRs have UC references**

### 3b. operationIds in openapi.yaml without a corresponding UC

All 11 operationIds verified:

| operationId | UC | In back.md BR-27 table | Status |
|------------|-----|------------------------|--------|
| `listNodeTypes` | UC-01 | ✓ | ✓ |
| `listLinkTypes` | UC-02 | ✓ | ✓ |
| `listAttributeKeys` | UC-03 | ✓ | ✓ |
| `listNodes` | UC-04 | ✓ | ✓ |
| `getNodeById` | UC-05 | ✓ | ✓ |
| `getLinkById` | UC-07 | ✓ | ✓ |
| `getAttributeById` | UC-08 | ✓ | ✓ |
| `traverseNode` | UC-06 | ✓ | ✓ |
| `getLinkHistory` | UC-09 | ✓ | ✓ |
| `getAttributeHistory` | UC-10 | ✓ | ✓ |
| `getAttributeKeyHistory` | UC-11 | ✓ | ✓ |

**PASS — 11/11 operationIds have UC references**

### 3c. Domain events without a consumer

No domain events (EV) are declared in `knowledge-graph.back.md §5`. The spec states "N/A — no domain events in this version." This is architecturally expected (no event bus). **PASS (warning W-001 preserved)**

---

## Step 4: Cross-Domain Dependency Validation

### 4a. Referenced domains exist in docs/specs/domains/

| Spec §7 name | Actual directory | Exists | Status |
|-------------|-----------------|--------|--------|
| `ingestion` | `docs/specs/domains/ingestion/` | ✓ | ✓ |
| `curation` | `docs/specs/domains/curation/` | ✓ | ✓ |
| `retrieval` | `docs/specs/domains/query-retrieval/` | ✓ (name mismatch — W-002) | ✓ |
| `compliance` | `docs/specs/domains/compliance-audit/` | ✓ (name mismatch — W-002) | ✓ |
| `auth` | Not a domain directory — Neon Auth / Stack Auth infrastructure | N/A (infrastructure, not a spec domain) | acceptable |

**PASS — all four peer spec domains exist**

### 4b. Referenced domain status

| Domain | Status | Note |
|--------|--------|------|
| ingestion v1.5.1 | draft | Same tier as knowledge-graph (W-003) |
| curation v1.2.0 | draft | Same tier as knowledge-graph (W-003) |
| query-retrieval v1.5.0 | **approved** | ✓ |
| compliance-audit v1.2.0 | draft | Same tier as knowledge-graph (W-003) |

**PASS with W-003 (warning-level only — all active development domains are draft)**

### 4c. Bidirectionality

| Dependency direction | Verified | Evidence |
|---------------------|---------|---------|
| knowledge-graph → ingestion (ingestion produces) | ✓ | ingestion.spec.md creates KnowledgeNode/NodeAlias/NodeAttribute/KnowledgeLink/Provenance; writes drive entity resolution and provenance accumulation that knowledge-graph reads |
| knowledge-graph → curation (curation produces) | ✓ | curation.spec.md §7 explicitly lists knowledge-graph as "produces": "curation writes on knowledge_node, node_alias, knowledge_link, node_attribute... The knowledge-graph domain READS the post-curation result" |
| knowledge-graph → query-retrieval (retrieval consumes) | ✓ | query-retrieval.spec.md §7 explicitly lists knowledge-graph as "consumes": "This domain reads KnowledgeNode, NodeAlias... Expansion calls the same service layer as knowledge-graph traverseNode (UC-06)" |
| knowledge-graph → compliance-audit (compliance produces) | ✓ | compliance-audit.spec.md §7 lists knowledge-graph as "synchronizes": "knowledge-graph reads honor this via the existing tombstone error code BUSINESS_NODE_DELETED" |

**PASS — bidirectionality confirmed for all four peer domains**

### 4d. Circular dependencies

Dependency graph (produces/consumes direction):
- ingestion → knowledge-graph (write side)
- curation → knowledge-graph (write side)
- compliance-audit → knowledge-graph (cascade side)
- knowledge-graph → query-retrieval (consumed by)

No circular dependencies detected (the graph is a DAG: ingestion/curation/compliance write to knowledge-graph; query-retrieval reads from it).

**PASS — no circular dependencies**

---

## Step 5: Versioning Verification

### 5a. Cross-file version references

| File | Version | P2.1 Date | Changelog CR | References peer files |
|------|---------|-----------|-------------|----------------------|
| `knowledge-graph.spec.md` | v1.3.0 | 2026-07-02 | `p2-1-error-taxonomy` | back.md (via "business spec"), openapi.yaml (via "technical contract") |
| `knowledge-graph.back.md` | v1.6.0 | 2026-07-02 | `p2-1-error-taxonomy` | spec.md ("Business spec: `../knowledge-graph.spec.md`"), openapi.yaml ("REST contract: `../openapi.yaml`") |
| `openapi.yaml` | v1.6.0 | 2026-07-02 | (info block changelog) | back.md referenced in description |

All three files were updated on the same date for P2.1 with matching CR identifiers.

**PASS — versions consistent**

### 5b. Status consistency

All three spec files carry `Status: draft` (consistent within this domain). The system is under active development; no formal approval gate has been invoked. The `Status: draft` is consistent across all files.

**PASS — status consistent**

### 5c. Changelog completeness

Each file has a populated changelog with at least the initial version plus the P2.1 entry:
- `knowledge-graph.spec.md`: changelogs at v1.0.0, v1.1.0, v1.2.0, v1.3.0 (P2.1) ✓
- `knowledge-graph.back.md`: changelogs at v1.0.0 through v1.6.0 (P2.1) ✓
- `openapi.yaml`: version v1.6.0 in `info.version` with P2.1 canonical taxonomy note in description ✓

**PASS — changelogs populated**

---

## Inconsistencies

None blocking.

| # | Type | Source | Target | Problem | Agent | Severity | Selected |
|---|------|--------|--------|---------|-------|----------|----------|
| W-001 | coverage | `back/knowledge-graph.back.md §5` | n/a | No domain events (EV) declared. Domain is READ-ONLY; this is architecturally expected (no event bus). Per skill rules, EV without a declared consumer is warning-level only. Inherited from prior validation runs. No action required. | — | warning | [ ] |
| W-002 | dependency | `knowledge-graph.spec.md §7` | n/a | §7 uses shorthand names "retrieval" and "compliance" instead of exact directory names "query-retrieval" and "compliance-audit". The referents are unambiguous from context. Minor clarity issue only; no spec content is incorrect. No blocking impact. | Spec Writer | warning | [ ] |
| W-003 | dependency | `knowledge-graph.spec.md §7` | ingestion, curation, compliance-audit | Three of four peer dependency domains have status: draft. knowledge-graph itself is also draft. Draft-on-draft is expected during active development. No blocking impact. | — | warning | [ ] |

---

## Result

**VALID — no blocking inconsistencies. Handoff allowed.**

All final_complete validation layers passed:
- Coverage map: 11/11 UCs fully covered by endpoints + BRs
- Error code consistency: 14/14 codes registered, HTTP statuses consistent, no deprecated codes
- Orphan spec detection: no orphans found
- Cross-domain dependencies: all four peer domains exist, bidirectionality confirmed, no circular dependencies
- Versioning: consistent P2.1 landing on 2026-07-02 across all three files

P2.1 canonical-taxonomy requirements fully met:
- All `error.code` values belong to the five allowed namespaced prefixes (`AUTH_`, `VALIDATION_`, `RESOURCE_`, `BUSINESS_`, `SYSTEM_`)
- The seven deprecated §14 short codes are explicitly FORBIDDEN on all surfaces of this domain and verified absent
- REST and MCP transports emit byte-identical `error.code` by construction (shared `mapErrorToHttpResponse`)
- Global catalog registration is complete for all 14 codes used by this domain

## Triage History

- 2026-06-26: VALID on incremental back-phase validation (scope constraint: knowledge-graph OUT OF SCOPE for chat temporal-context + ingestion received_at anchor improvement). 1 inherited warning (W-001). Spec versions: v1.2.0/v1.5.0/v1.5.0.
- 2026-07-03 (01:59:00Z): VALID on incremental back-phase re-validation (P2.1 canonical taxonomy). Validated spec versions: knowledge-graph.spec.md v1.3.0, knowledge-graph.back.md v1.6.0, openapi.yaml v1.6.0. All P2.1 requirements met. 1 inherited warning (W-001, no action required). `handoff_allowed: false` (mode: incremental_back).
- 2026-07-03 (03:33:00Z): VALID on final_complete re-validation (Mode 2). All 5 validation layers executed. 3 warnings (W-001 inherited, W-002 and W-003 new — all informational). `handoff_allowed: true` set.
