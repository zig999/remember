# Validation Report — Chat Domain (Back Phase)

> Triage: COMPLETED
> Date: 2026-06-25
> Mode: incremental_back
> Requirement: Substituir a ingestão assíncrona do chat por ingestão direcionada síncrona (`ingest_directed`). Chat expõe `ingest_directed` (gated por CHAT_INGEST_ENABLED). Sem migração de banco.

## Result: VALID

No blocking inconsistencies found. 2 warnings (non-blocking, documented below).

---

## Artifacts Validated

| File | Version | Status |
|------|---------|--------|
| `docs/specs/domains/chat/chat.spec.md` | 2.4.0 | ✓ |
| `docs/specs/domains/chat/openapi.yaml` | 2.6.0 | ✓ |
| `docs/specs/domains/chat/back/chat.back.md` | 2.8.0 | ✓ |
| `docs/specs/_global/error-codes.md` | — | ✓ |

---

## Coverage Map

| UC | Endpoint / Surface | BRs in back.md | Error Codes | Status |
|----|-------------------|----------------|-------------|--------|
| UC-01 | POST /conversations | BR-30, BR-22 | `VALIDATION_INVALID_FORMAT`, `AUTH_*` | ✓ Complete |
| UC-02 | POST /conversations/:id/messages (SSE) | BR-01..BR-24, BR-26..BR-29, BR-31, BR-32 | All mapped in §6 of spec.md | ✓ Complete |
| UC-03 | sendMessage (max iterations) | BR-15 | — | ✓ Complete |
| UC-04 | GET/PATCH/DELETE /conversations[/:id] | BR-22, BR-25, BR-35, BR-36, BR-37 | `RESOURCE_NOT_FOUND`, `VALIDATION_*` | ✓ Complete |
| UC-05 | sendMessage (turn timeout) | BR-16 | — | ✓ Complete |
| UC-06 | POST /conversations/:id/cancel | BR-12, BR-38 | `RESOURCE_NOT_FOUND`, `BUSINESS_CONVERSATION_ARCHIVED` | ✓ Complete |
| UC-07 | sendMessage (idempotent replay) | BR-27 | `BUSINESS_IDEMPOTENCY_MISMATCH`, `BUSINESS_TURN_IN_PROGRESS` | ✓ Complete |
| UC-08 | GET /conversations/:id/messages + /usage | BR-39, BR-40 | `RESOURCE_NOT_FOUND` | ✓ Complete |
| UC-09 | Kill-switch (CHAT_ENABLED=false) | BR-14 | `BUSINESS_CHAT_DISABLED` | ✓ Complete |
| UC-10 | sendMessage (ingest_directed, CHAT_INGEST_ENABLED=true) | BR-05, BR-06, BR-07, BR-09, BR-13, BR-17, BR-18, BR-29, BR-32, BR-43, BR-44 | `STRUCTURAL_INVALID`, `SYSTEM_SERVICE_UNAVAILABLE` | ✓ Complete |
| UC-11 | RETIRED — placeholder present in chat.spec.md §3 | BR-45 (retired marker) | — | ✓ Retired correctly |

---

## Check 1: Retired Tools — No References to `start_async_ingestion` or `get_ingestion_status` in Active Tool Catalog

| Check | Verdict |
|-------|---------|
| `start_async_ingestion` absent from chat catalog (openapi.yaml ToolStartEvent enum) | ✓ PASS — enum lists 13 query tools + `ingest_directed` only |
| `get_ingestion_status` absent from chat catalog (openapi.yaml ToolStartEvent enum) | ✓ PASS — not present in the enum |
| `start_async_ingestion` absent from chat.spec.md BR-05 (active catalog) | ✓ PASS — BR-05 v2.6 documents 13 + (0\|1) `ingest_directed` |
| `get_ingestion_status` absent from chat.spec.md BR-05 (active catalog) | ✓ PASS — RETIRED via BR-45 v2.6 |
| `start_async_ingestion` absent from chat.back.md BR-05 (active catalog) | ✓ PASS — BR-05 v2.8 documents 13 + (0\|1) `ingest_directed` |
| `get_ingestion_status` absent from chat.back.md BR-05 (active catalog) | ✓ PASS — RETIRED via BR-45 v2.8 |
| Retired names preserved in changelog for traceability | ✓ PASS — v2.3.0 changelog entry in spec.md; v2.4 header in back.md; historical block in openapi.yaml description |

---

## Check 2: `ingest_directed` Consistency Across All Three Files

| Aspect | chat.spec.md (v2.4.0) | chat.back.md (v2.8.0) | openapi.yaml (v2.6.0) | Verdict |
|--------|----------------------|----------------------|----------------------|---------|
| Tool name | `ingest_directed` | `ingest_directed` | `ingest_directed` (in ToolStartEvent enum) | ✓ PASS |
| Gating flag | `CHAT_INGEST_ENABLED` (default `false`) — BR-44 v2.6 | `CHAT_INGEST_ENABLED` (default `false`) — BR-44 v2.8 | Documented in endpoint description + ChatUnavailable examples | ✓ PASS |
| Deterministic / no server-side LLM | Stated in UC-10, BR-43, BR-06 | Stated in BR-43 v2.8 step 2, BR-06 v2.8 | Stated in `/info` description | ✓ PASS |
| Catalog cardinality | 13 + (0\|1) = max 14 tools | 13 + (0\|1) = max 14 tools | Max 14 (via description + ToolStartEvent enum with 14 entries) | ✓ PASS |
| `ingest_directed` registered on `ingest` toolset | ✓ BR-05 v2.6 | ✓ BR-05 v2.8 | ✓ description references `POST /api/v1/mcp/ingest` | ✓ PASS |
| Synchronous return + per-item report | ✓ UC-10 steps 4e, BR-43 v2.6 step 5 | ✓ BR-43 v2.8 step 3 | ✓ SSE example shows `tool_result` + `done` without async polling | ✓ PASS |
| Confidence forced to 1.0 server-side | ✓ BR-43 v2.6 (decision 2) | ✓ BR-43 v2.8 step 1 | ✓ openapi description states "confidence forced to 1.0" | ✓ PASS |
| `node_id` PIN bypass | ✓ BR-43 v2.6 (decision 1) | ✓ BR-43 v2.8 step 1 | ✓ description mentions pin | ✓ PASS |
| Re-assertion uniqueness (timestamp/nonce) | ✓ BR-43 v2.6 (decision 3) | ✓ BR-43 v2.8 step 2 | ✓ description mentions nonce | ✓ PASS |

---

## Check 3: Error Codes in Global Catalog

| Error Code | Used In | Present in global catalog | HTTP Status | Verdict |
|-----------|---------|--------------------------|-------------|---------|
| `VALIDATION_INVALID_FORMAT` | chat.spec.md §6, openapi.yaml | ✓ | 422 | ✓ PASS |
| `VALIDATION_REQUIRED_FIELD` | chat.spec.md §6, openapi.yaml | ✓ | 422 | ✓ PASS |
| `AUTH_UNAUTHORIZED` | chat.spec.md §6, openapi.yaml | ✓ | 401 | ✓ PASS |
| `AUTH_TOKEN_EXPIRED` | chat.spec.md §6, openapi.yaml | ✓ | 401 | ✓ PASS |
| `AUTH_TOKEN_INVALID` | chat.spec.md §6, openapi.yaml | ✓ | 401 | ✓ PASS |
| `RESOURCE_NOT_FOUND` | chat.spec.md §6, openapi.yaml | ✓ | 404 | ✓ PASS |
| `BUSINESS_CONVERSATION_ARCHIVED` | chat.spec.md §6, openapi.yaml | ✓ | 409 | ✓ PASS |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | chat.spec.md §6, openapi.yaml | ✓ | 409 | ✓ PASS |
| `BUSINESS_TURN_IN_PROGRESS` | chat.spec.md §6, openapi.yaml | ✓ | 409 | ✓ PASS |
| `BUSINESS_CHAT_DISABLED` | chat.spec.md §6, openapi.yaml | ✓ | 503 | ✓ PASS |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | chat.spec.md §6, openapi.yaml | ✓ | 503 | ✓ PASS |
| `BUSINESS_CHAT_INGEST_DISABLED` | chat.spec.md §6 (reserved), BR-44 v2.6 | ✓ (added in prior correction cycle) | 503 | ✓ PASS |
| `SYSTEM_INTERNAL_ERROR` | chat.spec.md §6 (in-stream) | ✓ | 500 | ✓ PASS |
| `SYSTEM_SERVICE_UNAVAILABLE` | chat.spec.md §6 (tool timeout, pg down) | ✓ | 503 | ✓ PASS |
| `STRUCTURAL_INVALID` | chat.spec.md §6 (ingest_directed Zod fail) | ✓ (MCP-only envelope codes — documented in error-codes.md note) | N/A (MCP) | ✓ PASS |

---

## Check 4: BR Numbering Completeness

| Range | Status |
|-------|--------|
| BR-01..BR-24 | ✓ All present, continuous, no gaps |
| BR-25..BR-40 | ✓ All present, continuous, no gaps |
| BR-41..BR-42 | ✓ Present (graph_delta, graph-view snapshot) |
| BR-43 | ✓ Present — rewritten as `ingest_directed` contract (v2.8) |
| BR-44 | ✓ Present — `CHAT_INGEST_ENABLED` flag (v2.8) |
| BR-45 | ✓ Present — retired marker (v2.8) |
| BR-03 | ✓ Reserved placeholder (was superseded in v2.0) — traceability preserved |

No duplicate BR numbers. No gaps except intentional retired/reserved placeholders (BR-03, BR-45).

---

## Check 5: UC-11 Retired Placeholder

| Check | Verdict |
|-------|---------|
| UC-11 heading present in chat.spec.md §3 | ✓ PASS — line 346: `### UC-11 -- RETIRED in v2.4.0 (was: Owner polls ingestion status via chat)` |
| Retirement explanation present | ✓ PASS — block quote explains the directed path is synchronous; no background run to poll |
| Reference to BR-45 v2.6 (retired marker) | ✓ PASS — "See v2.4.0 changelog entry and BR-45 v2.6 (retired marker)" |
| No active flow steps under UC-11 | ✓ PASS — only the retirement notice appears; no main/alternative flows |

---

## Check 6: Version Alignment

| Spec | Version | References |
|------|---------|-----------|
| chat.spec.md | 2.4.0 | back.md references `../chat.spec.md (v2.4.0)` ✓ |
| openapi.yaml | 2.6.0 | back.md references `../openapi.yaml (v2.6.0)` ✓ |
| chat.back.md | 2.8.0 | — |

The version numbering difference (chat.spec.md at 2.4.0 vs chat.back.md at 2.8.0) is intentional and documented. The back spec increments its minor version more frequently than the domain spec (multiple implementation refinements per domain spec release). The back.md header explicitly declares the versions it adopts.

---

## Check 7: State Machine Consistency

| State Machine | Declared in spec.md | Declared in back.md | Verdict |
|---------------|--------------------|--------------------|---------|
| ST-01 (conversation lifecycle) | §5.1 | ST-01 | ✓ Consistent |
| ST-02 (turn lifecycle) | §5.2 | ST-02 | ✓ Consistent |
| `ingest_directed` dispatch path | UC-10 / §5.2 tool_pending state | ST-02 via standard tool dispatch (no special state) | ✓ Consistent — back.md confirms `ingest_directed` uses the standard `dispatchToolUse` path |

---

## Inconsistencies

| # | Type | Source File | Issue | Agent | Severity | Selected |
|---|------|-------------|-------|-------|----------|---------|
| W1 | stale-description | `docs/specs/_global/error-codes.md` line 107 | `BUSINESS_CHAT_INGEST_DISABLED` description still references `start_async_ingestion` / `get_ingestion_status` as the triggering tools. These tools were retired in v2.6/v2.8. The description should be updated to: "Chat ingestion capability (`ingest_directed`) unavailable — `CHAT_INGEST_ENABLED=false` at boot. RESERVED for forward-compatibility; v2.6+ implements this as a boot-time catalog filter and does NOT emit this code at runtime." | Spec Writer | warning | [ ] |
| W2 | version-naming drift | `docs/specs/domains/chat/chat.spec.md` | BR references inside spec.md use "v2.6" version labels (e.g., BR-05 v2.6, BR-43 v2.6, BR-44 v2.6, BR-18 v2.6) while chat.back.md uses "v2.8" for the same amendments. The domain spec was versioned as 2.4.0 (changelog) but the BR annotations internally use "v2.6" as a label for the directed-ingestion changes — inconsistent with both the domain spec version (2.4.0) and the back spec version (2.8.0). No content contradictions exist; this is a label inconsistency only. Suggest aligning BR version labels in spec.md to match the domain spec version (v2.4) or the back spec version (v2.8). | Spec Writer | warning | [ ] |

---

## Summary

| Check | Result |
|-------|--------|
| 1. Retired tools absent from active catalog | ✓ PASS |
| 2. `ingest_directed` consistency across 3 files | ✓ PASS |
| 3. Error codes in global catalog | ✓ PASS |
| 4. BR numbering completeness | ✓ PASS |
| 5. UC-11 retired placeholder | ✓ PASS |
| 6. Version alignment | ✓ PASS |
| 7. State machine consistency | ✓ PASS |

**Blocking inconsistencies: 0. Warnings: 2 (non-blocking). Handoff allowed.**

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-22 (attempt 1) | ISSUE-001 (blocking) | u-spec-writer | PENDING: only openapi.yaml description was fixed; ISSUE-001 and WARN-002 unresolved |
| 2026-06-22 (attempt 2) | ISSUE-001 (blocking) | u-spec-writer | RESOLVED: BUSINESS_CHAT_INGEST_DISABLED added to global catalog |
| 2026-06-25 | Full re-validation for directed-ingestion (sdd_chat_spec-validator) | — | VALID: directed ingestion contract consistent across all 3 files; 0 blocking |
