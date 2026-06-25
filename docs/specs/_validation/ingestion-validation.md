# Validation Report — Ingestion Domain

> Triage: COMPLETED
> Date: 2026-06-25
> Mode: Incremental — back phase repair (Mode 1, repair_cycle=1)
> Validator: u-spec-validator-sdd_ingestion_spec-validator-repair-1
> Task: sdd_ingestion_spec-validator-repair-1 / attempt 1
> Result: **VALID**

---

## Scope

| Artifact | Path | Version | Status |
|----------|------|---------|--------|
| `openapi.yaml` | `docs/specs/domains/ingestion/openapi.yaml` | 1.4.1 | draft |
| `ingestion.back.md` | `docs/specs/domains/ingestion/back/ingestion.back.md` | 1.4.1 | draft |
| `ingestion.spec.md` | `docs/specs/domains/ingestion/ingestion.spec.md` | 1.4.0 | draft |
| `error-codes.md` | `docs/specs/_global/error-codes.md` | — | canonical |

---

## Requirement (UI intent — Requirement injected at activation)

> Replace async chat ingestion with synchronous ingest_directed tool. start_async_ingestion is retired from the ingestion toolset entirely.

---

## Validation Checks (Mode 1 — Incremental back phase)

### Check 1 — INC-01 (was warning): openapi.yaml version corrected

**Result: RESOLVED / PASS**

`openapi.yaml` `info.version` is now `"1.4.1"` (was `"1.3.0"`).

Description text at line 49 now reads `(BR-34, v1.4.0 —` (was `v1.3.0`) and line 59 reads `**retired** in v1.4.0:` (was `v1.3.0`). Version attribution is consistent with `ingestion.back.md` changelog (BR-34 introduced at v1.4.0, corrected at v1.4.1; BR-32 withdrawn at v1.4.0).

### Check 2 — INC-02 (was blocking): ingestion.spec.md updated to v1.4.0

**Result: RESOLVED / PASS**

`ingestion.spec.md` is now at version `1.4.0` (was `1.3.0`).

- **UC-13 retired:** `### UC-13 — RETIRED in v1.4.0 (was: Start an asynchronous ingestion — intake now, extract in background)` is present with full traceability note. The UC number is reserved (not reused). `get_ingestion_status` (BR-31) correctly noted as NOT retired.
- **UC-14 added:** `### UC-14 — Directed ingestion (deterministic composition; no server LLM)` is fully documented with actor, pre/post conditions, main flow (7 steps), alternative flows (6 alt-flows), and related endpoint/tool reference to MCP `ingest_directed`.
- **Changelog entry:** v1.4.0 entry at line 688 documents the retirement of UC-13 and addition of UC-14 with full change rationale.

All BRs in `ingestion.back.md` that reference UC-14 (BR-33, BR-34) now have a corresponding UC in the spec. All BRs referencing UC-13 historical context (BR-32 WITHDRAWN) correctly point to the retired placeholder.

### Check 3 — INC-03 (was warning): BUSINESS_CHAT_INGEST_DISABLED description updated

**Result: RESOLVED / PASS**

`error-codes.md` `BUSINESS_CHAT_INGEST_DISABLED` "When it occurs" column now reads:
> `ingest_directed` called from the chat agentic loop but `CHAT_INGEST_ENABLED` was not set to `true` at startup.

The stale reference to `start_async_ingestion` has been replaced with `ingest_directed`.

### Check 4 — Cross-ref UC ↔ BR (all BRs reference existing UCs)

**Result: PASS**

All 34 BRs in `ingestion.back.md` reference UCs that exist in `ingestion.spec.md` v1.4.0:

| BR range | Referenced UCs | Exists in spec.md |
|----------|---------------|------------------|
| BR-01..BR-09 | UC-01 | Yes |
| BR-10, BR-11 | UC-06 | Yes |
| BR-12 | UC-04 | Yes |
| BR-13..BR-23 | UC-08..UC-11 | Yes |
| BR-24 | UC-09 | Yes |
| BR-25 | UC-09 | Yes |
| BR-26 | UC-12 | Yes |
| BR-27 | UC-10, UC-11 | Yes |
| BR-28 | UC-08..UC-11 | Yes |
| BR-29 | UC-12 | Yes |
| BR-30 | UC-01, UC-12 | Yes |
| BR-31 | UC-04 | Yes |
| BR-32 (WITHDRAWN) | Former UC-13 | Yes (RETIRED placeholder) |
| BR-33 | UC-04, UC-09, UC-10, UC-11, UC-12, UC-14 | Yes (UC-14 added in v1.4.0) |
| BR-34 | UC-01, UC-08..UC-11, UC-14 | Yes (UC-14 added in v1.4.0) |

### Check 5 — Cross-ref BR ↔ OpenAPI (error.code and HTTP status match)

**Result: PASS**

| error.code | HTTP (catalog) | HTTP (openapi.yaml) | Match |
|-----------|---------------|---------------------|-------|
| `AUTH_UNAUTHORIZED` | 401 | 401 (Unauthorized response) | PASS |
| `RESOURCE_NOT_FOUND` | 404 | 404 (NotFound response) | PASS |
| `VALIDATION_REQUIRED_FIELD` | 422 | 422 (UnprocessableEntity response) | PASS |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 (UnprocessableEntity response) | PASS |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 (UnprocessableEntity response) | PASS |
| `BUSINESS_RUN_NOT_RETRYABLE` | 409 | 409 (retryLlmRun response) | PASS |
| `BUSINESS_RUN_NOT_RUNNABLE` | 409 | 409 (runLlmExtraction response) | PASS |
| `BUSINESS_RUN_NOT_RUNNING` | 409 | 409 (RunNotRunning shared response) | PASS |
| `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | 502 | 502 (LlmProviderUnavailable response) | PASS |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 (InternalError response) | PASS |

### Check 6 — Error codes in global catalog (completeness)

**Result: PASS**

All error codes used across `openapi.yaml`, `ingestion.spec.md` §6, and `ingestion.back.md` are present in `docs/specs/_global/error-codes.md`. MCP envelope codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) are documented as intentional non-`BUSINESS_*` codes in the catalog note and in spec.md §6.2.

### Check 7 — State machine consistency

**Result: PASS**

`ingestion.back.md` ST-01 (LLMRun lifecycle) is consistent with `ingestion.spec.md` §5.1 ST-LR:
- `running → completed`: UC-12 clean finish (BR-26 step 6) ✓
- `running → failed`: UC-12 fatal exception (BR-26 step 7) ✓
- `failed → running`: UC-06 retry (BR-10) ✓

`ingestion.back.md` ST-02 (InformationFragment) unchanged; references spec.md §5.2 ST-IF correctly ✓

### Check 8 — Events (EV) triggered by actions described in UCs

**Result: PASS (N/A)**

`ingestion.back.md` §5 explicitly states: "N/A — no domain events in this version." No EVs to validate.

### Check 9 — Version consistency across files

**Result: PASS**

| File | Version | Relationship |
|------|---------|-------------|
| `ingestion.spec.md` | 1.4.0 | Feature version: UC-13 retired, UC-14 added |
| `ingestion.back.md` | 1.4.1 | Correction pass over v1.4.0: internal-consistency fixes to BR-34, no contract change |
| `openapi.yaml` | 1.4.1 | Bumped to match back-spec correction; description references v1.4.0 for the feature events |

### Check 10 — No active references to retired tool start_async_ingestion

**Result: PASS**

`start_async_ingestion` appears only in:
- `ingestion.back.md` BR-32 (WITHDRAWN header) — historical reference ✓
- `ingestion.back.md` BR-33, BR-34 — historical contrast against the retired tool ✓
- `ingestion.spec.md` UC-13 retirement note — historical reference ✓
- `openapi.yaml` line 58 — inside the retirement description ✓
- `error-codes.md` — no longer present in active `BUSINESS_CHAT_INGEST_DISABLED` description ✓

No code path treats `start_async_ingestion` as an active tool anywhere.

---

## Inconsistency Summary

| # | Type | Severity | Description |
|---|------|----------|-------------|
| — | — | — | No inconsistencies found |

All three inconsistencies from repair cycle 0 have been resolved.

---

## Coverage Map (back phase)

| UC | Endpoint / MCP tool | BRs in back.md | Status |
|----|---------------------|----------------|--------|
| UC-01 | `POST /api/v1/ingest/raw-information` (operationId `ingestRawInformation`) | BR-01..BR-09 | Covered |
| UC-02 | (immutability — no endpoint) | BR-02 | Covered |
| UC-03 | `GET /api/v1/ingest/raw-information/{id}/chunks` (operationId `listRawChunksByRawInformation`) | BR-05 | Covered |
| UC-04 | `GET /api/v1/ingest/llm-runs/{id}` (operationId `getLlmRunById`) | BR-12 | Covered |
| UC-05 | `GET /api/v1/ingest/llm-runs/{id}/tool-calls` (operationId `listToolCallsByLlmRun`) | BR-23 | Covered |
| UC-06 | `POST /api/v1/ingest/llm-runs/{id}/retry` (operationId `retryLlmRun`) | BR-10, BR-11 | Covered |
| UC-07 | (run close — internal BFF action, no public endpoint) | ST-01 | Covered |
| UC-08 | `POST /llm-runs/{id}/propose-fragment` + MCP `propose_fragment` | BR-13..BR-23 | Covered |
| UC-09 | `POST /llm-runs/{id}/propose-node` + MCP `propose_node` | BR-13..BR-25 | Covered |
| UC-10 | `POST /llm-runs/{id}/propose-link` + MCP `propose_link` | BR-13..BR-27 | Covered |
| UC-11 | `POST /llm-runs/{id}/propose-attribute` + MCP `propose_attribute` | BR-13..BR-27 | Covered |
| UC-12 | `POST /api/v1/ingest/llm-runs/{id}/run` (operationId `runLlmExtraction`) | BR-26 | Covered |
| UC-13 | RETIRED — MCP `start_async_ingestion` (withdrawn BR-32) | BR-32 (WITHDRAWN) | Retired — traceability preserved |
| UC-14 | MCP `ingest_directed` (BR-34) — no REST mirror by design | BR-34 | Covered |

---

## Result

- [x] UC coverage complete — all 14 UCs (incl. 1 retired) covered by BRs
- [x] Error codes consistent — HTTP status matches across openapi.yaml, back.md, catalog
- [x] No orphan specs — all BR references point to existing UCs
- [x] Dependencies valid (back phase; no front specs yet)
- [x] State machines consistent with spec.md
- [x] All 3 INC-0x inconsistencies from repair cycle 0 resolved

**Overall: VALID. Handoff allowed for the back phase.**

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-25 | INC-01 (warning), INC-02 (blocking), INC-03 (warning) | Spec Writer (INC-01, INC-02, INC-03) | VALID after repair cycle 1 |
