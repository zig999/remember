# Validation Report — Chat Domain (Back Phase)

> Triage: PENDING
> Date: 2026-06-22 (Attempt 2)
> Mode: incremental_back
> Requirement: Expose ONE async one-shot ingestion capability in the agentic chat backend module, keeping the 13 read-only query tools intact. Async fire-and-forget start (intake only, returns run_id) + expose existing get_ingestion_status tool. Behind env flag CHAT_INGEST_ENABLED (default false). Backend + spec contract change. Revokes chat.back.md BR-05 "13 read-only tools" invariant.

## Result: INVALID

1 blocking inconsistency found. 1 warning (non-blocking). Attempt 2 of 2 allowed before escalation.

**Attempt 2 delta vs. Attempt 1:**
- WARN-001 (sendMessage Tools description stale) from attempt 1: **RESOLVED** — chat openapi.yaml §sendMessage description updated to accurately describe the 15-tool catalog with `start_async_ingestion` write-bearing caveat.
- ISSUE-001 (BUSINESS_CHAT_INGEST_DISABLED missing from global catalog): **STILL UNRESOLVED**
- WARN-002 (ingestion §7 bidirectionality missing chat): **STILL UNRESOLVED** (renumbered WARN-001)

---

## Artifacts Validated

| File | Version | Status |
|------|---------|--------|
| `docs/specs/domains/chat/chat.spec.md` | 2.3.0 | ISSUE |
| `docs/specs/domains/chat/openapi.yaml` | 2.3.0 | ✓ (fixed in attempt 2) |
| `docs/specs/domains/chat/back/chat.back.md` | 2.4.0 | ✓ |
| `docs/specs/_global/error-codes.md` | — | ISSUE |
| `docs/specs/domains/ingestion/ingestion.spec.md` | 1.3.0 | WARN |

---

## Coverage Map

| UC | Endpoint / Surface | BRs in back.md | Error Codes | Status |
|----|-------------------|----------------|-------------|--------|
| UC-10 | `sendMessage` (agentic loop, `start_async_ingestion` tool dispatch, CHAT_INGEST_ENABLED=true) | BR-05, BR-06, BR-07, BR-09, BR-13, BR-17, BR-18, BR-29, BR-32, BR-43, BR-44 | `STRUCTURAL_INVALID`, `SYSTEM_SERVICE_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR` (in-stream tool_result, non-terminal) | Complete |
| UC-11 | `sendMessage` (agentic loop, `get_ingestion_status` tool dispatch, CHAT_INGEST_ENABLED=true) | BR-05, BR-06, BR-07, BR-13, BR-17, BR-29, BR-32, BR-44, BR-45 | `RESOURCE_NOT_FOUND`, `VALIDATION_INVALID_FORMAT`, `SYSTEM_SERVICE_UNAVAILABLE` (in-stream tool_result, non-terminal) | Complete |

Previously validated UCs (UC-01..UC-09) remain valid — no regressions introduced.

---

## Check 1: UC <-> BR Cross-Reference

| BR | UC Referenced | UC Exists | Verdict |
|----|--------------|-----------|---------|
| BR-43 | UC-10 | ✓ | Pass |
| BR-44 | UC-10, UC-11 | ✓ | Pass |
| BR-45 | UC-11 | ✓ | Pass |
| BR-05 (v2.4) | UC-02, UC-10, UC-11 | ✓ | Pass |
| BR-06 (v2.4) | UC-02, UC-10, UC-11 | ✓ | Pass |
| BR-18 (v2.4) | UC-02, UC-10, UC-11 | ✓ | Pass |

---

## Check 2: BR <-> Error Code / HTTP Status

| Error Code | BR | HTTP | In Global Catalog | Verdict |
|-----------|-----|------|------------------|---------|
| `STRUCTURAL_INVALID` | BR-43 step 1/2 | N/A (MCP envelope, in-stream tool_result) | MCP-only codes, covered by ingestion envelope notes | Pass |
| `SYSTEM_SERVICE_UNAVAILABLE` | BR-43 step 2, BR-17 | 503 | ✓ | Pass |
| `BUSINESS_CHAT_INGEST_DISABLED` | BR-44, chat.spec.md §6 | 503 | **ABSENT** | **FAIL — BLOCKING** |
| `RESOURCE_NOT_FOUND` | BR-45 (ingestion handler, unknown run_id) | 404 | ✓ | Pass |

---

## Check 3: Error Codes in Global Catalog

| Error Code | Present in global catalog | HTTP Status Consistent | Verdict |
|-----------|--------------------------|----------------------|---------|
| `BUSINESS_CHAT_INGEST_DISABLED` | **NO** — not found in `docs/specs/_global/error-codes.md` Chat section | 503 (claimed) | **FAIL — BLOCKING** |
| `STRUCTURAL_INVALID` | ✓ (MCP-only, documented in ingestion §6.2) | N/A (MCP transport) | Pass |
| `BUSINESS_CHAT_DISABLED` | ✓ | 503 | Pass |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | ✓ | 503 | Pass |
| `BUSINESS_CONVERSATION_ARCHIVED` | ✓ | 409 | Pass |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | ✓ | 409 | Pass |
| `BUSINESS_TURN_IN_PROGRESS` | ✓ | 409 | Pass |

---

## Check 4: State Machine Consistency

| State Machine | Declared in spec.md | Declared in back.md | Verdict |
|---------------|--------------------|--------------------|---------|
| ST-01 (conversation lifecycle) | §5.1 | §5 ST-01 | Consistent ✓ |
| ST-02 (turn lifecycle, UC-10/UC-11 path) | §5.2 covers dispatch via UC-02 template | §5 ST-02 annotates new dispatch paths | Consistent ✓ |

---

## Check 5: Events (EV)

§6 of back.md: "No events in this version." No domain events declared. No consumers to verify. ✓

---

## Check 6: Cross-Domain Dependency Bidirectionality

| Dependency | chat.spec.md §7 declares | ingestion.spec.md §7 declares | Status |
|------------|--------------------------|-------------------------------|--------|
| chat → ingestion | ✓ "consumes (pattern AND service, v2.3)" | `chat` domain NOT listed as consumer | **WARN: bidirectional link missing** |

`ingestion.spec.md §7` declares: "Bidirectional — if this domain lists X, X must list this domain back when it is specified." The `ingestion` domain is now consumed at the SERVICE level by `chat` (BR-43: `ingestRawInformation` + `runLlmExtraction`). The ingestion spec §7 should list `chat` as a downstream consumer. The v1.3.0 changelog added UC-13 referencing the chat module but the formal §7 dependency table was not updated.

---

## Version Alignment

| Spec | Version |
|------|---------|
| chat.spec.md | 2.3.0 |
| chat openapi.yaml | 2.3.0 |
| chat.back.md | 2.4.0 (adopts spec.md v2.3.0 + openapi.yaml v2.3.0) |

The version difference between back.md (2.4.0) and spec.md/openapi.yaml (2.3.0) is intentional and documented in the back.md changelog. No inconsistency here.

---

## Inconsistencies

| # | Type | Source File | Issue | Agent | Severity | Selected |
|---|------|-------------|-------|-------|----------|---------|
| 1 | error-code | `docs/specs/domains/chat/chat.spec.md` §6 + `docs/specs/domains/chat/back/chat.back.md` header + BR-44 | `BUSINESS_CHAT_INGEST_DISABLED` is declared as "registered in the global catalog for forward-compatibility" in chat.spec.md v2.3.0 §6 and chat.back.md v2.4 header, but is NOT present in `docs/specs/_global/error-codes.md` Chat section. Every error.code must be registered before being used. **Persists from attempt 1.** | u-spec-writer | blocking | [ ] |
| W1 | cross-ref | `docs/specs/domains/ingestion/ingestion.spec.md` §7 | `chat` domain is NOT listed in ingestion §7 cross-domain dependencies, despite `ingestion.spec.md §7` explicitly requiring bidirectionality and `chat.spec.md §7` listing `ingestion` as a service-level consumer (BR-43: service calls to `ingestRawInformation` + `runLlmExtraction`). The v1.3.0 changelog for `ingestion.spec.md` added UC-13 but did not update §7. **Persists from attempt 1.** | u-spec-writer | warning | [ ] |

---

## Required Actions

| # | Inconsistency | Responsible Agent | What to Fix |
|---|---------------|-------------------|-------------|
| 1 | `BUSINESS_CHAT_INGEST_DISABLED` not in global catalog | u-spec-writer | Add `BUSINESS_CHAT_INGEST_DISABLED` to `docs/specs/_global/error-codes.md` Chat section with: HTTP 503, description "Chat ingestion tools (`start_async_ingestion` / `get_ingestion_status`) are unavailable because `CHAT_INGEST_ENABLED=false`; registered for forward-compatibility, NOT emitted by v2.3 routes (catalog filter at boot only)." This code was claimed as registered in the spec changelog but was never actually added. |
| W1 | `ingestion.spec.md` §7 missing `chat` as consumer | u-spec-writer | Add a row to `docs/specs/domains/ingestion/ingestion.spec.md` §7 cross-domain dependencies table: Domain `chat`, Type `downstream consumer (v2.3)`, Description "The `chat` module's `start_async_ingestion` tool dispatches `ingestion.service.ingestRawInformation` (UC-01) + fires `ingestion.service.runLlmExtraction` (UC-12) as background fire-and-forget (BR-43 of `chat.back.md`). The `get_ingestion_status` tool reuses the `ingest`-toolset handler (BR-31 of `ingestion.back.md`). This is a service-level dependency introduced in ingestion v1.3.0 / chat v2.3.0." |

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-22 (attempt 1) | ISSUE-001 (blocking) | u-spec-writer | PENDING: only openapi.yaml description was fixed (WARN-001 resolved); ISSUE-001 and WARN-002 unresolved → attempt 2 invalid |
