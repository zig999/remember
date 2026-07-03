# Validation Report: compliance-audit

> Validator: Spec Validator | Date: 2026-07-03 | Attempt: 1 | Mode: final_complete
> Status: VALID
> Triage: COMPLETED

## Summary

The compliance-audit domain spec artifacts (openapi.yaml v1.1.1, compliance-audit.spec.md v1.2.0, compliance-audit.back.md v1.4.0) pass the final_complete validation. All P2.1 deprecated codes are absent from every transport. No blocking inconsistencies were found across all validation steps (Coverage Map, Error Code Consistency, Orphan Spec Detection, Cross-Domain Dependency, Versioning). `handoff_allowed: true`.

**Key findings:**
- compliance-audit.spec.md v1.2.0: §6.2 rewritten with byte-identical namespaced codes on both transports; BR-14 rewritten to drop the §14 short-code vocabulary for MCP.
- compliance-audit.back.md v1.4.0: BR-15 fully rewritten as canonical namespaced code map; all `STRUCTURAL_INVALID` / `NOT_FOUND` / `INTERNAL` references retired; BR-18 (v1.3.0) adds `original_input` redaction in the same atomic UPDATE.
- openapi.yaml v1.1.1: info.description updated with P2.1 canonical-taxonomy note; error response examples use only namespaced codes.
- Five carried-over warnings remain non-blocking. No new blocking issues.

---

## Checks Performed (Mode: final_complete)

### Step 1 — Coverage Map

- [x] All 5 UCs have a corresponding endpoint in openapi.yaml
- [x] All 18 BRs reference valid UCs
- [x] All error codes in BRs are present in the global catalog
- [x] No front-end feature specs for this domain (N/A — backend-only domain in the Requirement P2.1 scope)
- [x] No navigation flows for this domain (N/A)

### Step 2 — Error Code Consistency

- [x] All active codes in global catalog with consistent HTTP status
- [x] Deprecated codes (STRUCTURAL_INVALID, NOT_FOUND, INTERNAL) correctly retired in global catalog and not emitted by any transport
- [x] MCP-REST transport parity verified byte-identical for all 7 conditions

### Step 3 — Orphan Spec Detection

- [x] No BR in back.md references a nonexistent UC
- [x] No UI-NN without operationId (N/A — no feature specs)
- [x] No FL-NN without feature.spec.md (N/A — no flows)
- [x] No domain events without consumer (§5 declares N/A — no domain events in this version)

### Step 4 — Cross-Domain Dependency Validation

- [x] All referenced domains exist in docs/specs/domains/
- [x] Bidirectionality verified (functionally correct across all 4 cross-domain pairs; naming mismatch is WARN-002)
- [x] No circular dependencies
- [~] Referenced domain status: query-retrieval (approved ✓); ingestion, knowledge-graph, curation (draft — project-wide lifecycle state, non-blocking)

### Step 5 — Versioning Verification

- [x] back.md v1.4.0 changelog correctly documents all changes since v1.0.0
- [x] spec.md v1.2.0 changelog correctly documents P2.1 and Neon Auth migrations
- [x] Status consistent across artifacts: all three files carry `Status: draft` — consistent
- [x] openapi.yaml version (1.1.1) referenced correctly in info.version

---

## Coverage Map (Step 1 Detail)

| UC | operationId | Path | Method | BRs | UIs | FLs | Error Codes | Status |
|----|-------------|------|--------|-----|-----|-----|-------------|--------|
| UC-01 | `complianceDeleteRawInformation` | `/api/v1/compliance/deletions` | POST | BR-01..BR-08, BR-12..BR-18 | N/A | N/A | AUTH_UNAUTHORIZED, RESOURCE_NOT_FOUND, VALIDATION_REQUIRED_FIELD, VALIDATION_INVALID_FORMAT, VALIDATION_OUT_OF_RANGE, SYSTEM_INTERNAL_ERROR | Covered |
| UC-02 | `listComplianceDeletions` | `/api/v1/compliance/deletions` | GET | BR-09, BR-11, BR-13 | N/A | N/A | AUTH_UNAUTHORIZED, VALIDATION_INVALID_FORMAT, VALIDATION_OUT_OF_RANGE, SYSTEM_INTERNAL_ERROR | Covered |
| UC-03 | `getComplianceDeletionById` | `/api/v1/compliance/deletions/{complianceDeletionId}` | GET | BR-11, BR-13 | N/A | N/A | AUTH_UNAUTHORIZED, RESOURCE_NOT_FOUND, SYSTEM_INTERNAL_ERROR | Covered |
| UC-04 | `listCurationActions` | `/api/v1/audit/curation-actions` | GET | BR-09, BR-10, BR-11, BR-13 | N/A | N/A | AUTH_UNAUTHORIZED, VALIDATION_INVALID_FORMAT, VALIDATION_OUT_OF_RANGE, SYSTEM_INTERNAL_ERROR | Covered |
| UC-05 | `getCurationActionById` | `/api/v1/audit/curation-actions/{curationActionId}` | GET | BR-11, BR-13 | N/A | N/A | AUTH_UNAUTHORIZED, RESOURCE_NOT_FOUND, SYSTEM_INTERNAL_ERROR | Covered |

---

## Error Code Consistency (Step 2 Detail)

| error.code | openapi.yaml | spec.md | back.md | Global Catalog | HTTP | Consistent |
|------------|-------------|---------|---------|----------------|------|------------|
| `AUTH_UNAUTHORIZED` | 401 ✓ | §6.1 ✓ | §1 Auth row ✓ | ✓ Base/AUTH | 401 | Yes |
| `RESOURCE_NOT_FOUND` | 404 ✓ | §6.1, §6.2 ✓ | BR-03, BR-15 ✓ | ✓ Base/RESOURCE | 404 | Yes |
| `VALIDATION_REQUIRED_FIELD` | 422 ✓ | §6.1, §6.2 ✓ | BR-01, BR-15 ✓ | ✓ Base/VALIDATION | 422 | Yes |
| `VALIDATION_INVALID_FORMAT` | 422 ✓ | §6.1, §6.2 ✓ | BR-10, BR-15 ✓ | ✓ Base/VALIDATION | 422 | Yes |
| `VALIDATION_OUT_OF_RANGE` | 422 ✓ | §6.1, §6.2 ✓ | BR-01, BR-09, BR-15 ✓ | ✓ Base/VALIDATION | 422 | Yes |
| `SYSTEM_INTERNAL_ERROR` | 500 ✓ | §6.1, §6.2 ✓ | BR-02, BR-15, BR-17 ✓ | ✓ Base/SYSTEM | 500 | Yes |
| `SYSTEM_SERVICE_UNAVAILABLE` | — absent | — absent | §6 fallback ✓ | ✓ Base/SYSTEM | 503 | Partial (WARN-001) |
| `STRUCTURAL_INVALID` (deprecated) | — not emitted | §6.2 migration note only | BR-15 migration note only | ✓ Deprecated 2026-07-02 | Retired | Correctly retired |
| `NOT_FOUND` (deprecated) | — not emitted | §6.2 migration note only | BR-15 migration note only; §6/§7 curation cross-ref (WARN-004) | ✓ Deprecated 2026-07-02 | Retired | Correctly retired from domain emissions; cross-ref quote pending curation.back.md step 4 |
| `INTERNAL` (deprecated) | — not emitted | §6.2 migration note only | BR-15 migration note only | ✓ Deprecated 2026-07-02 | Retired | Correctly retired |

### P2.1 Transport Parity Verification

| Condition | REST code | REST HTTP | MCP code | MCP wire | Byte-identical? |
|-----------|-----------|-----------|----------|----------|-----------------|
| Required field missing | `VALIDATION_REQUIRED_FIELD` | 422 | `VALIDATION_REQUIRED_FIELD` | content+isError:true@HTTP200 | YES ✓ |
| Invalid format | `VALIDATION_INVALID_FORMAT` | 422 | `VALIDATION_INVALID_FORMAT` | content+isError:true@HTTP200 | YES ✓ |
| Out of range | `VALIDATION_OUT_OF_RANGE` | 422 | `VALIDATION_OUT_OF_RANGE` | content+isError:true@HTTP200 | YES ✓ |
| Row not found | `RESOURCE_NOT_FOUND` | 404 | `RESOURCE_NOT_FOUND` | content+isError:true@HTTP200 | YES ✓ |
| Internal error | `SYSTEM_INTERNAL_ERROR` | 500 | `SYSTEM_INTERNAL_ERROR` | content+isError:true@HTTP200 | YES ✓ |
| Auth failure | `AUTH_UNAUTHORIZED` | 401 | `AUTH_UNAUTHORIZED` | real HTTP 401 (pre-dispatch middleware) | YES ✓ |
| Idempotent no-op | outcome=noop_already_deleted | 200 | ok:true result={...} | HTTP 200 isError:false | YES ✓ |

---

## Orphan Spec Detection (Step 3 Detail)

| Check | Result |
|-------|--------|
| BR without valid UC reference | PASS — all 18 BRs reference UC-01..UC-05 |
| UI-NN without operationId | N/A — no feature.spec.md for this domain |
| FL-NN without feature.spec.md | N/A — no flow.md for this domain |
| EV without declared consumer | PASS — §5 declares "N/A — no domain events in this version" |

---

## Cross-Domain Dependency Validation (Step 4 Detail)

| Domain | Direction in spec.md | Domain exists? | Status | Bidirectional? | Notes |
|--------|---------------------|----------------|--------|----------------|-------|
| `ingestion` | compliance-audit §7 → ingestion (synchronizes) | ✓ | draft | ✓ (ingestion §7 references "compliance (future)" — WARN-002) | Functionally bidirectional; naming inconsistency is pre-existing WARN-002 |
| `knowledge-graph` | compliance-audit §7 → knowledge-graph (synchronizes) | ✓ | draft | ✓ (knowledge-graph §7 references "compliance" — WARN-002) | Functionally bidirectional |
| `query-retrieval` | compliance-audit §7 → query-retrieval (synchronizes) | ✓ | approved | ✓ (query-retrieval §7 references "compliance" — WARN-002) | Bidirectional; query-retrieval is the only approved peer domain |
| `curation (future)` | compliance-audit §7 → curation (produces) | ✓ | draft | ✓ (curation §7 references "compliance-audit" — correctly named) | WARN-003: "future" qualifier stale; curation domain exists since v1.2.0 |

No circular dependencies detected.

---

## State Machine Consistency (Step 2 Detail)

| SM | spec.md | back.md | Consistent |
|----|---------|---------|------------|
| ST-RI-DEL | §5.1 — [active] → [deleted] (idempotent repeat → [deleted], legacy inconsistency → SYSTEM_INTERNAL_ERROR) | §4 — same states + guards; transport-invariant; SYSTEM_INTERNAL_ERROR byte-identical on REST (HTTP 500) and MCP (envelope at HTTP 200) under P2.1 | Yes ✓ |

---

## Versioning Verification (Step 5 Detail)

| Artifact | Version | Status | Changelog current? | Consistent with peers? |
|----------|---------|--------|--------------------|------------------------|
| compliance-audit.spec.md | 1.2.0 | draft | ✓ (P2.1 entry 2026-07-02) | ✓ |
| compliance-audit.back.md | 1.4.0 | draft | ✓ (P2.1 entry 2026-07-02) | ✓ |
| openapi.yaml | 1.1.1 (info.version) | — | ✓ (info.description P2.1 note) | ✓ |

---

## Issues Found

### WARN-001 (warning — carried over) — `SYSTEM_SERVICE_UNAVAILABLE` absent from openapi.yaml

- **Source:** `back/compliance-audit.back.md` §6 (External Integrations — JWKS fetch failure fallback)
- **Target:** `openapi.yaml` path responses, `compliance-audit.spec.md` §6.1
- **Detail:** The 503 response for JWKS-cache-miss + network failure is mentioned in back.md §6 but absent from openapi.yaml path-level responses and spec.md §6.1 error table. This is a middleware-level response occurring before any handler runs.
- **Severity:** WARNING — does not block handoff. The 503 path exists only during auth infrastructure failure.
- **Suggested fix:** Optionally add a `503` response component to openapi.yaml and a corresponding row to spec.md §6.1.
- **Responsible:** Back Spec Agent
- **Selected:** [ ]

### WARN-002 (warning — carried over) — Dependency naming mismatch

- **Source:** `compliance-audit.spec.md` §7
- **Target:** ingestion.spec.md §7, knowledge-graph.spec.md §7, query-retrieval.spec.md §7 (all use "compliance" or "compliance (future)")
- **Detail:** compliance-audit §7 identifies this domain as "compliance-audit" but peer specs reference it as "compliance" or "compliance (future)". Dependencies are functionally correct and bidirectional; only the label is inconsistent.
- **Severity:** WARNING — does not block handoff.
- **Suggested fix:** Standardize the domain label to "compliance-audit" in all peer spec §7 Dependency tables.
- **Responsible:** Spec Writer
- **Selected:** [ ]

### WARN-003 (warning — carried over) — Stale "future" qualifier on curation dependency

- **Source:** `compliance-audit.spec.md` §7 (Dependencies table, "curation (future)" row)
- **Target:** `compliance-audit.back.md` §8 (v1.2.0+)
- **Detail:** compliance-audit.spec.md §7 labels the curation domain as `curation (future) | produces` but compliance-audit.back.md v1.2.0+ §8 explicitly resolves this: "The historical 'future curation domain' wording of v1.1.0 is RESOLVED in v1.2.0."
- **Severity:** WARNING — does not block handoff; the dependency is functionally correct.
- **Suggested fix:** In compliance-audit.spec.md §7, change "curation (future)" to "curation" and update the description accordingly.
- **Responsible:** Spec Writer
- **Selected:** [ ]

### WARN-004 (warning — new, P2.1) — Cross-reference to deprecated `NOT_FOUND` in curation transport

- **Source:** `compliance-audit.back.md` §6 External Integrations and §7 Known Technical Constraints
- **Target:** `curation.back.md` BR-29 (pending P2.1 step 4 reconciliation)
- **Detail:** compliance-audit.back.md §6 and §7 quote `{ ok: false, error.code: "NOT_FOUND" }` as what the curation MCP transport emits for unknown tool names (sourced from `curation.back.md` BR-29 rule 5). Under P2.1, `NOT_FOUND` is deprecated and replaced by `RESOURCE_NOT_FOUND`. The compliance-audit domain itself does NOT emit `NOT_FOUND` on any transport — these references are informational cross-domain quotes.
- **Severity:** WARNING — does not block compliance-audit handoff. Curation.back.md is the responsible artifact.
- **Suggested fix:** After curation.back.md BR-29 is reconciled (P2.1 step 4), update the two corresponding quotes in compliance-audit.back.md §6 and §7 to reference `RESOURCE_NOT_FOUND`.
- **Responsible:** Back Spec Agent
- **Selected:** [ ]

### WARN-005 (warning — new, v1.3.0 gap) — `original_input` redaction not reflected in spec.md

- **Source:** `compliance-audit.spec.md` §4 BR-04 and UC-01 step 5
- **Target:** `compliance-audit.back.md` BR-18
- **Detail:** spec.md UC-01 step 5 and spec.md §4 BR-04 describe only `content` and `metadata` redaction. compliance-audit.back.md BR-18 (added in v1.3.0) adds the `original_input` column to the same atomic UPDATE (with a CASE expression preserving NULL for non-chat rows). This is compliance-relevant behavior under §11 LGPD coverage but is absent from the business spec.
- **Severity:** WARNING — implementation is correctly specified in back.md; spec.md omission is documentation-only.
- **Suggested fix:** Add an explicit mention of `original_input` redaction to spec.md UC-01 step 5 and spec.md §4 BR-04.
- **Responsible:** Spec Writer
- **Selected:** [ ]

---

## BR ↔ UC Coverage (back.md v1.4.0 — BRs BR-01..BR-18)

| BR | UC Ref Exists | error.code in Catalog | HTTP matches openapi |
|----|---------------|-----------------------|----------------------|
| BR-01 | UC-01 ✓ | `VALIDATION_REQUIRED_FIELD`, `VALIDATION_OUT_OF_RANGE` ✓ | 422 ✓ |
| BR-02 | UC-01 ✓ | `SYSTEM_INTERNAL_ERROR` (via UC-01 alt 9a, P2.1) ✓ | 500 ✓ |
| BR-03 | UC-01 alt 4b ✓ | None (200 success path) | 200 ✓ |
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
| BR-14 | UC-01 ✓ | N/A (transport invariant; parity contract) | N/A |
| BR-15 | UC-01 ✓ | `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `RESOURCE_NOT_FOUND`, `SYSTEM_INTERNAL_ERROR` ✓ | REST: 422/422/422/404/500 ✓; MCP: envelope at HTTP 200 ✓ |
| BR-16 | UC-01 ✓ | N/A (correctness invariant) | N/A |
| BR-17 | UC-01 alt 4c ✓ | `SYSTEM_INTERNAL_ERROR` ✓ | 500 ✓ (REST); MCP envelope ✓ |
| BR-18 | UC-01 ✓ | N/A (correctness invariant; WARN-005) | N/A |

---

## Final Result

- [x] Coverage Map — PASS (5/5 UCs covered; 18/18 BRs reference valid UCs; 6/6 error codes in catalog)
- [x] Error Code Consistency — PASS (all 6 active codes consistent; deprecated codes correctly retired on all transports)
- [x] P2.1 Transport Parity — PASS (7/7 conditions byte-identical on REST and MCP; no deprecated short codes emitted)
- [x] Orphan Spec Detection — PASS (no orphaned BRs, UI-NNs, FL-NNs, or EVs)
- [x] Cross-Domain Dependencies — PASS (all 4 referenced domains exist; bidirectional; no circular; draft status is project-wide lifecycle, non-blocking)
- [x] Versioning Verification — PASS (changelogs up to date; status consistent across artifacts)
- [x] State Machine Consistency (ST-RI-DEL) — PASS (transport-invariant, P2.1 code set)

**status: VALID — 0 blocking issues, 5 warnings (WARN-001/002/003 carried over; WARN-004/005 from P2.1 run). handoff_allowed: true.**

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-12 | None — no blocking issues | None | VALID on first run (v1.0.0 incremental_back, attempt 1) |
| 2026-06-12 | None — revalidation confirms same result | None | VALID confirmed (v1.1.0 incremental_back, attempt 2) |
| 2026-06-22 | None — no blocking issues | None | VALID confirmed (v1.2.0 incremental_back, attempt 1) — WARN-003 new (stale "future" label on curation dependency) |
| 2026-06-26 | None — no blocking issues | None | VALID confirmed (v1.2.0 re-validation, attempt 1) — documentation-only fix in openapi.yaml CurationAction.reason description |
| 2026-07-03 | None — no blocking issues | None | VALID confirmed (v1.4.0 P2.1 re-validation, attempt 1) — P2.1 canonical taxonomy correctly applied; deprecated codes retired; WARN-004 (curation NOT_FOUND cross-ref) and WARN-005 (original_input spec gap) added |
| 2026-07-03 | None — no blocking issues | None | VALID confirmed (v1.4.0 final_complete mode, attempt 1) — full final_complete pass: Coverage Map, Error Code Consistency, Orphan Spec Detection, Cross-Domain Dependency, Versioning all PASS. handoff_allowed: true |
