# Validation Report — Ingestion Domain

> Triage: COMPLETED
> Date: 2026-06-26
> Mode: Incremental — back phase (Mode 1, repair_cycle=0)
> Validator: u-spec-validator-sdd_ingestion_spec-validator
> Task: sdd_ingestion_spec-validator / attempt 1
> Result: **VALID**

---

## Scope

| Artifact | Path | Version | Status |
|----------|------|---------|--------|
| `openapi.yaml` | `docs/specs/domains/ingestion/openapi.yaml` | 1.4.2 | draft |
| `ingestion.back.md` | `docs/specs/domains/ingestion/back/ingestion.back.md` | 1.4.2 | draft |
| `ingestion.spec.md` | `docs/specs/domains/ingestion/ingestion.spec.md` | 1.4.1 | draft |
| `error-codes.md` | `docs/specs/_global/error-codes.md` | — | canonical |

---

## Requirement (UI intent — injected at activation)

> Melhorar a fidelidade de contexto temporal e de memória do subsistema /chat (domínio chat; toca chat.back.md BR-18/BR-31/BR-33 e o contrato de env; mais um ajuste pequeno na ingestão). Cinco mudanças coesas: (1) JANELA EM TURNOS K=6; (2) RESUMO INCREMENTAL rolling sem migração, overlap M=40; (3) GATILHO refresh-on-overflow; (4) PROMPT DE RESUMO atualizado; (5) INJEÇÃO DE DATA/HORA LOCAL como segundo bloco system não-cacheado (OWNER_TZ=America/Sao_Paulo). Na ingestão: passar received_at como âncora de data relativa no prompt de extração v3. NO database migration / NO schema change (Variant 1).

---

## Validation Checks (Mode 1 — Incremental back phase)

### Check 1 — UC ↔ BR Cross-Reference

Every BR references at least one existing UC in `ingestion.spec.md`.

| BR | Related UCs in back.md | UC exists in spec.md? |
|----|------------------------|-----------------------|
| BR-01 | UC-01 | Yes |
| BR-02 | UC-01, UC-02 | Yes |
| BR-03 | UC-01 | Yes |
| BR-04 | UC-01 | Yes |
| BR-05 | UC-01, UC-03 | Yes |
| BR-06 | UC-01 | Yes |
| BR-07 | UC-01 | Yes |
| BR-08 | UC-01 | Yes |
| BR-09 | UC-01 alt 4a | Yes |
| BR-10 | UC-06 | Yes |
| BR-11 | UC-06 | Yes |
| BR-12 | UC-04 | Yes |
| BR-13 | UC-08, UC-09, UC-10, UC-11 | Yes |
| BR-14 | UC-08, UC-09, UC-10, UC-11 | Yes |
| BR-15 | UC-10 | Yes |
| BR-16 | UC-10, UC-11 | Yes |
| BR-17 | UC-10, UC-11 | Yes |
| BR-18 | UC-10, UC-11 | Yes |
| BR-19 | UC-08, UC-09, UC-10, UC-11 | Yes |
| BR-20 | UC-09 | Yes |
| BR-21 | UC-08..UC-11 | Yes |
| BR-22 | UC-08 | Yes |
| BR-23 | UC-08..UC-11 | Yes |
| BR-24 | UC-08..UC-11 | Yes |
| BR-25 | UC-09 | Yes |
| BR-26 | UC-12 | Yes |
| BR-27 | UC-10, UC-11 | Yes |
| BR-28 | UC-08..UC-11 | Yes |
| BR-29 | UC-12 | Yes |
| BR-30 | UC-01, UC-12 | Yes |
| BR-31 | UC-04 | Yes |
| BR-32 | UC-13 (RETIRED — traceability only) | Yes — UC-13 is retired but the UC number is reserved; reference is for traceability only |
| BR-33 | UC-04, UC-09, UC-10, UC-11, UC-12, UC-14 | Yes |
| BR-34 | UC-01, UC-08..UC-11, UC-14 | Yes |

**Result: PASS.** All 34 BRs have valid UC references. UC-13 is retired (reserved number) and BR-32 is withdrawn — both are preserved for traceability, not as active contracts.

---

### Check 2 — BR ↔ OpenAPI Error Codes

Every `error.code` used in the back.md has correct HTTP status in `openapi.yaml`.

| error.code | HTTP in openapi.yaml | HTTP in back.md | Match? |
|------------|---------------------|-----------------|--------|
| `AUTH_UNAUTHORIZED` | 401 | 401 | Yes |
| `RESOURCE_NOT_FOUND` | 404 | 404 | Yes |
| `VALIDATION_REQUIRED_FIELD` | 422 | 422 | Yes |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 | Yes |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 | Yes |
| `BUSINESS_RUN_NOT_RETRYABLE` | 409 | 409 | Yes |
| `BUSINESS_RUN_NOT_RUNNABLE` | 409 | 409 | Yes |
| `BUSINESS_RUN_NOT_RUNNING` | 409 | 409 | Yes |
| `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | 502 | 502 | Yes |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | Yes |

MCP envelope codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) are internal to the MCP protocol layer and do not have HTTP statuses in `openapi.yaml` — this is correct and documented in `error-codes.md`.

**Result: PASS.** All REST error codes map correctly between back.md and openapi.yaml.

---

### Check 3 — Error Codes in Global Catalog

All `error.code` values used in `ingestion.back.md` are present in `docs/specs/_global/error-codes.md`.

| error.code | In global catalog? |
|------------|--------------------|
| `AUTH_UNAUTHORIZED` | Yes (Base Codes — AUTH_) |
| `RESOURCE_NOT_FOUND` | Yes (Base Codes — RESOURCE_) |
| `VALIDATION_REQUIRED_FIELD` | Yes (Base Codes — VALIDATION_) |
| `VALIDATION_INVALID_FORMAT` | Yes (Base Codes — VALIDATION_) |
| `VALIDATION_OUT_OF_RANGE` | Yes (Base Codes — VALIDATION_) |
| `SYSTEM_INTERNAL_ERROR` | Yes (Base Codes — SYSTEM_) |
| `SYSTEM_SERVICE_UNAVAILABLE` | Yes (Base Codes — SYSTEM_) |
| `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | Yes (Base Codes — SYSTEM_) |
| `BUSINESS_RUN_NOT_RETRYABLE` | Yes (Ingestion section) |
| `BUSINESS_RUN_NOT_RUNNABLE` | Yes (Ingestion section) |
| `BUSINESS_RUN_NOT_RUNNING` | Yes (Ingestion section) |

**Result: PASS.** All error codes are registered.

---

### Check 4 — State Machine Consistency

`ST-01 (LLMRun)` in back.md corresponds to `ST-LR (§5.1)` in spec.md.

Transitions cross-checked:

| Transition | back.md ST-01 | spec.md ST-LR | Consistent? |
|-----------|--------------|--------------|-------------|
| `(nothing) → running` via `ingestRawInformation` | Yes | Yes | Yes |
| `running → completed` via `runLlmExtraction` clean finish | Yes | Yes | Yes |
| `running → failed` via `runLlmExtraction` fatal exception | Yes | Yes | Yes |
| `failed → running` via `retryLlmRun` (attempts+=1, orphan fragments → rejected) | Yes | Yes | Yes |
| `completed → terminal` | Yes | Yes | Yes |

DB invariant `CHECK (status = 'running') = (finished_at IS NULL)` is referenced in both documents.

**Result: PASS.** State machines are consistent.

---

### Check 5 — BR-26 Step 5a — The v1.4.2 Change

The v1.4.2 change adds an explicit clarification in BR-26 step 5a that `rawInformationMetadata.received_at` is the canonical date-anchor for `extraction.v3` when resolving relative date expressions.

Verification:

1. **No new schema change**: BR-26 step 5a states "No new field on any DTO, no new column, no new MCP tool argument". `RawInformation` schema in `openapi.yaml` already carries `received_at` as `format: date-time`. **Confirmed — no schema change.**

2. **No new endpoint**: No new operationId appears in `openapi.yaml` for v1.4.2 vs v1.4.1. The openapi.yaml `info.version` is now `1.4.2`, and the description block on lines 67–85 describes the `extraction.v3` `received_at` anchor as a descriptive change only. **Confirmed — no new endpoint.**

3. **No new error code**: BR-26 step 5a explicitly states "No new BR, no new error code". **Confirmed.**

4. **Variant 1 constraint holds**: The requirement specifies "NO database migration / NO schema change (Variant 1)". BR-26 step 5a is purely a prompt-builder contract clarification — the `received_at` field was already passed to `prompt.user({...})` in every prior version (the orchestrator read `rawInformationMetadata`). **Confirmed — Variant 1 constraint satisfied.**

5. **received_at is already in `RawInformation` schema**: `openapi.yaml` `RawInformation` schema lists `received_at` as a required field (`type: string, format: date-time`). This field was present before v1.4.2. **Confirmed.**

6. **`extraction.v3` is the DEFAULT_PROMPT_VERSION since v1.4.0**: The `openapi.yaml` description block (lines 68–69) states `DEFAULT_PROMPT_VERSION = 'v3'` since v1.4.0. BR-34 (v1.4.0 changelog) confirms `DEFAULT_PROMPT_VERSION = 'v3'` in the BR-32 context. **Confirmed.**

**Result: PASS.** The v1.4.2 change is a correct additive clarification with no schema change, no new error code, and no new endpoint.

---

### Check 6 — DEFAULT_PROMPT_VERSION Consistency (Warning)

The back.md §1 "Anthropic client config" row states `DEFAULT_PROMPT_VERSION = 'v2'` as the recommended version. However:

- `openapi.yaml` description (lines 68–69) states: `extraction.v3.ts`, the registry default since v1.4.0 — `DEFAULT_PROMPT_VERSION = 'v3'`
- The v1.2.9 changelog (BR-32) already mentions `DEFAULT_PROMPT_VERSION = 'v3'`
- BR-34 (v1.4.0) confirms `DEFAULT_PROMPT_VERSION = 'v3'` as the fallback in BR-30
- The v1.4.2 changelog explicitly confirms `extraction.v3` is the active prompt

The §1 table row was written at v1.2.0 when v2 was the latest prompt, and was never updated as the default was promoted to v3. This is a **documentation inconsistency** (the v3 prompt is the actual live default), not a behavioral or schema error — the actual behavior is driven by the code registry, and both the openapi.yaml and the changelog are consistent on v3.

This is a **warning-level inconsistency** (stale documentation in §1 back.md; does not block implementation).

---

### Check 7 — No DDL / Schema Change (Variant 1 constraint)

Scanned all BR descriptions and the changelog entry for v1.4.2 for any DDL, migration, or schema change references.

- Back.md header row: "Schema: `migrations/0001_init.sql` (single bootstrap; no DDL change required by this revision)" — explicitly confirms no migration.
- BR-26 step 5a: "No new field on any DTO, no new column, no new MCP tool argument".
- v1.4.2 changelog: "No new BR, no new error code, no OpenAPI surface change, no `LLMRun` / `ToolCall` / `RawInformation` schema change — purely internal prompt-builder semantics".

**Result: PASS.** Variant 1 constraint holds. No DDL or schema change introduced.

---

### Check 8 — Orphan Spec Detection

- All BRs reference existing UCs: **No orphan BRs.**
- UC-13 (RETIRED): The UC number is reserved with a traceability note. BR-32 references it as WITHDRAWN. **No issue — by design.**
- No UI-NN or FL-NN references to check (back phase only).
- No EV declared in back.md without a consumer (back.md does not use EV notation).

**Result: PASS.** No orphan spec issues.

---

### Check 9 — Version Consistency

| Document | Version | Changelog entry |
|----------|---------|----------------|
| `ingestion.back.md` | 1.4.2 | Yes — v1.4.2 entry on 2026-06-26 |
| `openapi.yaml` | 1.4.2 | Reflected in `info.version: "1.4.2"` |
| `ingestion.spec.md` | 1.4.1 | Last entry is v1.4.0 (spec.md version is consistent since back.md 1.4.2 is a correction/clarification only; no new UC or BR added to spec.md) |

The `ingestion.spec.md` at v1.4.1 is a minor version ahead of the previous v1.4.0 visible in the changelog. The back.md describes the change as "correction" — purely internal clarification in BR-26 step 5a; no UC or BR required changing in spec.md for this correction. This is consistent.

**Result: PASS.** Versions are consistent.

---

## Coverage Map

| UC | Endpoint / Tool | BRs | Status |
|----|-----------------|-----|--------|
| UC-01 | `POST /api/v1/ingest/raw-information` (`ingestRawInformation`) | BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09 | Covered |
| UC-02 | `GET /api/v1/ingest/raw-information/{id}` (`getRawInformationById`) | BR-02 | Covered |
| UC-03 | `GET /api/v1/ingest/raw-information/{id}/chunks` (`listRawChunksByRawInformation`) | BR-05 | Covered |
| UC-04 | `GET /api/v1/ingest/llm-runs/{id}` (`getLlmRunById`) | BR-12 | Covered |
| UC-05 | `GET /api/v1/ingest/llm-runs/{id}/tool-calls` (`listToolCallsByLlmRun`) | — | Covered |
| UC-06 | `POST /api/v1/ingest/llm-runs/{id}/retry` (`retryLlmRun`) | BR-10, BR-11 | Covered |
| UC-07 | Internal — no public endpoint | — | Covered (internal) |
| UC-08 | `POST /api/v1/ingest/llm-runs/{id}/propose-fragment` (`proposeFragment`) | BR-13, BR-14, BR-18, BR-19, BR-21, BR-22, BR-23, BR-24 | Covered |
| UC-09 | `POST /api/v1/ingest/llm-runs/{id}/propose-node` (`proposeNode`) | BR-13, BR-14, BR-19, BR-20, BR-21, BR-23, BR-24, BR-25 | Covered |
| UC-10 | `POST /api/v1/ingest/llm-runs/{id}/propose-link` (`proposeLink`) | BR-13..BR-19, BR-21, BR-23, BR-24, BR-27 | Covered |
| UC-11 | `POST /api/v1/ingest/llm-runs/{id}/propose-attribute` (`proposeAttribute`) | BR-13..BR-19, BR-21, BR-23, BR-24, BR-27 | Covered |
| UC-12 | `POST /api/v1/ingest/llm-runs/{id}/run` (`runLlmExtraction`) | BR-26, BR-29 | Covered |
| UC-13 | RETIRED — no endpoint | BR-32 (WITHDRAWN) | Reserved — not active |
| UC-14 | MCP tool `ingest_directed` (no REST mirror) | BR-34, BR-33 | Covered (MCP-only) |

---

## Summary

| Check | Result | Severity |
|-------|--------|----------|
| 1. UC ↔ BR Cross-Reference | PASS | — |
| 2. BR ↔ OpenAPI Error Codes | PASS | — |
| 3. Error Codes in Global Catalog | PASS | — |
| 4. State Machine Consistency | PASS | — |
| 5. BR-26 Step 5a (v1.4.2 change) | PASS | — |
| 6. DEFAULT_PROMPT_VERSION in §1 back.md | WARNING | warning |
| 7. Variant 1 — No DDL/Schema Change | PASS | — |
| 8. Orphan Spec Detection | PASS | — |
| 9. Version Consistency | PASS | — |

**Blocking inconsistencies: 0**
**Warning inconsistencies: 1**
**Overall result: VALID**

---

## Inconsistencies

| # | Type | Source file | Expected target | Problem | Suggested fix | Agent | Severity | Selected |
|---|------|-------------|-----------------|---------|---------------|-------|----------|----------|
| W-01 | cross-ref | `ingestion.back.md` §1 "Anthropic client config" row | `openapi.yaml` + changelog | §1 Anthropic config row states `DEFAULT_PROMPT_VERSION = 'v2'` but the actual default has been `'v3'` since v1.4.0 (confirmed by openapi.yaml description, v1.2.9 changelog, BR-30, BR-34) | Update §1 Anthropic client config row to reflect `DEFAULT_PROMPT_VERSION = 'v3'` and add `extraction.v3.ts` to the registry list alongside `v1` and `v2` | Back Spec Agent | warning | [ ] |

---

## Triage History

| Date | By | Action | Notes |
|------|----|--------|-------|
| 2026-06-26 | u-spec-validator-sdd_ingestion_spec-validator | Initial validation pass for v1.4.2 | VALID with 1 warning (stale §1 doc, non-blocking) |
